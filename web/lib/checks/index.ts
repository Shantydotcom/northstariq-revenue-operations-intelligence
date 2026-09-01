import type {
  BreakdownLine,
  CheckId,
  CheckResult,
  EvidenceColumn,
  EvidenceRow,
  NotEvaluatedRecord,
  RecordRef,
  ScoreReason,
} from '../types.ts';
import {
  CONVERTED_LEAD_STATUS,
  GOVERNED_INTAKE,
  MQL_CLAIMING_STATUSES,
  SAL_CLAIMING_STATUSES,
  SQL_CLAIMING_STATUSES,
  type LeadRecord,
  type LeadStatusHistoryRecord,
  type OpportunityRecord,
} from '../soql.ts';
import {
  canReach,
  type LifecycleGraph,
  mustPassThrough,
  transitionAllowed,
} from './lifecycle-graph.ts';
import {
  activeRequirementLabels,
  type MqlPolicy,
  recordedPolicyVersion,
} from './mql-policy.ts';
import {
  acceptanceRequirementLabels,
  recordedAcceptanceVersion,
  recordedNextStepDate,
  recordedQualifiedNeed,
  recordedSqlVersion,
  type SalesAcceptancePolicy,
  type SqlQualificationPolicy,
  sqlRequirementLabels,
} from './sales-qualification-policy.ts';
import {
  currentSegment,
  interpretSegmentBasis,
  segmentLabel,
  sourceEvidenceCell,
} from './segment-basis.ts';

/**
 * The seven assessment checks.
 *
 * Each is a pure function over records already fetched, so every one is unit
 * testable against fixtures with no network. Scores come from what each check
 * actually judged, never from the whole org.
 *
 * Every check accounts for its whole starting population. A record is either
 * evaluated, or it appears in `notEvaluated` with a reason built from its own
 * Salesforce values. Nothing is dropped silently, and a record that the
 * underlying process never assessed is never counted as a pass.
 */

/** Evidence is capped for the UI; the counts remain the full failing totals. */
const EVIDENCE_LIMIT = 10;

/**
 * Not-evaluated rows exist to be challenged, so the list runs longer than
 * evidence does — a reader cannot dispute an omission they cannot see, and the
 * export carries the same rows the screen does. At fixture volume this covers
 * every control completely. The full total is always reported beside it.
 */
const NOT_EVALUATED_LIMIT = 50;

/**
 * How many records of a judged population are retained.
 *
 * Same order as NOT_EVALUATED_LIMIT and for the same reason: enough to open an
 * investigation, small enough that an assessment payload stays a summary. The
 * count beside it is never capped, so nothing here can overstate a population.
 */
const RECORD_SAMPLE_LIMIT = 50;

/** Identity only. Both Lead and Opportunity carry Id and Name. */
const refOf = (r: {
  Id: string;
  Name: string;
  Company?: string | null;
  Status?: string | null;
  StageName?: string | null;
  Account?: { Name?: string | null } | null;
}): RecordRef => ({
  id: r.Id,
  label: r.Name,
  /* Read off the row already in hand. Neither field narrows or widens a
   * population, and no check consults them. */
  context: r.Company ?? r.Account?.Name ?? null,
  state: r.Status ?? r.StageName ?? null,
});

/*
 * Which Lead Sources carry a routing-readiness expectation is Salesforce's
 * decision, not this file's. It arrives per run from
 * Routing_Readiness_Source__mdt and is passed in, so a configuration change
 * takes effect without a deployment.
 *
 * It is NOT ownership-routing authority. That stays narrower and stays in the
 * Flow: `fxRoutingEligible` authorises reassignment for governed intake only.
 */
const isGoverned = (l: LeadRecord) => l.LeadSource === GOVERNED_INTAKE;

/**
 * Did the before-save intake automation run on this Lead?
 *
 * `Match_Status__c` is written by that automation on every create and by
 * nothing else, so its presence is the only reliable marker in the org of a
 * record the intake process actually handled. Leads created before the Flow
 * existed carry none of its output.
 *
 * This is *implementation evidence* of what ran, not the business definition of
 * who a control applies to. Territory classification applies to any Lead the
 * coverage model evaluates; this predicate only identifies which records it in
 * fact evaluated, so historical records are reported as unmeasurable rather
 * than silently passed or silently dropped.
 */
const wasProcessedAtIntake = (l: LeadRecord) => l.Match_Status__c !== null;

/** "Lead Source "Web"" or, for a blank value, wording that says so plainly. */
const sourcePhrase = (l: LeadRecord) =>
  l.LeadSource === null ? 'no Lead Source is recorded, which' : `Lead Source "${l.LeadSource}"`;

const ownerName = (l: LeadRecord) => l.Owner?.Name ?? null;

/** "a", "a and b", "a, b and c" — no trailing stop, so callers can compose. */
function list(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

const be = (n: number) => (n === 1 ? 'is' : 'are');

/** Counts by key, largest first, so the dominant cause is stated first. */
function tally<T>(items: T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * A control is scored on what it actually judged, or not at all.
 *
 * MODEL v2. Nothing evaluated is neither a pass nor a failure, so it is not
 * a number: returning 100 would present "no determination" as perfect
 * performance, and returning 0 would present it as a demonstrated breach the
 * control never observed. Both are claims the evidence does not support.
 *
 * Model v1 returned 100. The branch never fired against the live org, but the
 * lifecycle controls can legitimately judge nothing, so the contract had to
 * become explicit rather than incidentally unreachable.
 */
function score(evaluated: number, failing: number): number | null {
  if (evaluated === 0) return null;
  return Math.round(100 * (1 - failing / evaluated));
}

/**
 * Which kind of nothing a control judged.
 *
 * Derived from the counts the control already produced - no control decides
 * this for itself, so the two states cannot drift apart per check. Records
 * the control applies to but cannot judge are a coverage gap; a control with
 * no applicable records at all is a boundary working as intended.
 */
function scoreReason(evaluated: number, unmeasurable: number): ScoreReason | null {
  if (evaluated > 0) return null;
  return unmeasurable > 0 ? 'insufficient-evidence' : 'no-applicable-records';
}

/** Shared shape for the Leads a control declined, plus the field it would have judged. */
function leadNotEvaluatedColumns(key: string, label: string): EvidenceColumn[] {
  return [
    { key: 'Name', label: 'Lead' },
    { key: 'Id', label: 'Record ID', mono: true },
    { key: 'LeadSource', label: 'Lead Source' },
    { key: key, label },
    { key: 'Reason', label: "Why wasn't this record evaluated?" },
  ];
}

/** One not-evaluated Lead row. `extra` is the field this control would have read. */
function leadRow(
  l: LeadRecord,
  extra: { key: string; value: string | number | null },
  kind: NotEvaluatedRecord['kind'],
  reason: string,
): NotEvaluatedRecord {
  return {
    kind,
    row: {
      Name: l.Name,
      LeadSource: l.LeadSource ?? '— (none recorded)',
      [extra.key]: extra.value,
      Reason: reason,
      Id: l.Id,
    },
  };
}

function build(
  base: Omit<
    CheckResult,
    | 'score'
    | 'scoreReason'
    | 'healthy'
    | 'evidence'
    | 'notEvaluatedCount'
    | 'unmeasurableCount'
    | 'notEvaluatedRows'
    | 'notEvaluatedRecords'
    | 'checkedSample'
    | 'passingSample'
    | 'failureBreakdown'
    | 'exclusionBreakdown'
  >,
  failingRows: EvidenceRow[],
  notEvaluated: NotEvaluatedRecord[],
  /**
   * The records the caller actually judged, in the order it judged them.
   *
   * Supplied by the detector from the same population it counted, never
   * recomputed here: a second population rule would be a second answer to the
   * question the score already answered.
   */
  evaluatedRecords: RecordRef[],
  breakdowns: { failure?: BreakdownLine[]; exclusion?: BreakdownLine[] } = {},
): CheckResult {
  const unmeasurableCount = notEvaluated.filter((n) => n.kind === 'unmeasurable').length;
  const retained = notEvaluated.slice(0, NOT_EVALUATED_LIMIT);
  /*
   * Passing is what the detector judged and did not fail - subtraction over
   * the two sets it already produced, not a third pass over the records. Every
   * failing row carries its Id for exactly this reason.
   */
  const failingIds = new Set(failingRows.map((r) => String(r.Id ?? '')));
  const passingRecords = evaluatedRecords.filter((r) => !failingIds.has(r.id));
  return {
    ...base,
    score: score(base.evaluated, base.failing),
    scoreReason: scoreReason(base.evaluated, unmeasurableCount),
    /*
     * Healthy means nothing FAILED, which is not the same as scored. An
     * unscored control is healthy in this sense and generates no finding -
     * correctly, because it demonstrated no problem. The evidence gap is
     * reported through the population counts, not through the findings queue.
     */
    healthy: base.failing === 0,
    evidence: failingRows.slice(0, EVIDENCE_LIMIT),
    notEvaluatedCount: notEvaluated.length,
    unmeasurableCount,
    notEvaluatedRecords: retained,
    // The projection of the line above, so the two can never disagree.
    notEvaluatedRows: retained.map((n) => n.row),
    /*
     * Totals come from the counts that produced the score, never from the
     * length of a capped array.
     */
    checkedSample: {
      records: evaluatedRecords.slice(0, RECORD_SAMPLE_LIMIT),
      total: base.evaluated,
    },
    passingSample: {
      records: passingRecords.slice(0, RECORD_SAMPLE_LIMIT),
      total: base.evaluated - base.failing,
    },
    // Only where the division is meaningful. An empty list renders nothing.
    failureBreakdown: (breakdowns.failure ?? []).filter((b) => b.count > 0),
    exclusionBreakdown: (breakdowns.exclusion ?? []).filter((b) => b.count > 0),
  };
}

/* ------------------------------------------------------------------ 1 */
export function missingFirmographics(
  leads: LeadRecord[],
  /** Active Lead Sources from Routing_Readiness_Source__mdt, per run. */
  routingReadinessSources: string[],
): CheckResult {
  /*
   * Eligibility is the configured source list and nothing else.
   *
   * It deliberately no longer consults Match_Status__c. That field records
   * whether account matching reached a decision - a different capability, on a
   * different timeline - and it has no bearing on whether the two routing
   * inputs are present on the record right now.
   */
  const isReadinessSource = (l: LeadRecord) =>
    l.LeadSource !== null && routingReadinessSources.includes(l.LeadSource);

  const population = leads.filter(isReadinessSource);
  const missingCountry = population.filter(
    (l) => l.CountryCode === null && l.NumberOfEmployees !== null,
  );
  const missingEmployees = population.filter(
    (l) => l.NumberOfEmployees === null && l.CountryCode !== null,
  );
  const missingBoth = population.filter(
    (l) => l.NumberOfEmployees === null && l.CountryCode === null,
  );
  const failing = [...missingCountry, ...missingEmployees, ...missingBoth];

  const excluded = leads.filter((l) => !isReadinessSource(l));

  const notEvaluated = excluded.map((l) =>
    leadRow(
      l,
      { key: 'Data_Quality_Status__c', value: l.Data_Quality_Status__c },
      'outside',
      l.LeadSource === null
        ? 'No Lead Source recorded, so this Lead is not identified as a Routing Readiness Source.'
        : `${l.LeadSource} is not configured as a Routing Readiness Source.`,
    ),
  );

  // Counted by the value that actually excluded them, so the breakdown is
  // evidence rather than a category someone chose.
  const exclusion: BreakdownLine[] = tally(
    excluded,
    (l) => l.LeadSource ?? 'No Lead Source recorded',
  ).map(([label, count]) => ({
    label,
    count,
    detail: 'Not configured as a Routing Readiness Source',
  }));

  return build(
    {
      id: 'missing-firmographics',
      title: 'Leads Missing Routing Firmographics',
      category: 'Data Quality',
      severity: 'High',
      businessQuestion:
        'Are Leads from the sources we hold to a routing standard arriving with the data segment and territory need?',
      businessImpact:
        'Employee count drives segment and country drives territory. A Lead missing either cannot be segmented or routed deterministically, so it falls to an exception path instead of a seller.',
      failureDetail: list(
        [
          [missingCountry.length, 'missing Country'] as const,
          [missingEmployees.length, 'missing Employee Count'] as const,
          [missingBoth.length, 'missing both Country and Employee Count'] as const,
        ]
          .filter(([n]) => n > 0)
          .map(([n, what]) => `${n} ${be(n)} ${what}`),
      ),
      population: `${population.length} Leads from Routing Readiness Sources`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'LeadSource', label: 'Lead Source' },
        { key: 'NumberOfEmployees', label: 'Employees', mono: true },
        { key: 'CountryCode', label: 'Country', mono: true },
        { key: 'Data_Quality_Detail__c', label: 'Data Quality Detail' },
      ],
      notEvaluatedColumns: leadNotEvaluatedColumns(
        'Data_Quality_Status__c',
        'Data Quality Status',
      ),
    },
    failing.map((l) => ({
      Name: l.Name,
      Id: l.Id,
      LeadSource: l.LeadSource ?? '\u2014',
      NumberOfEmployees: l.NumberOfEmployees === null ? '\u2014' : l.NumberOfEmployees,
      CountryCode: l.CountryCode ?? '\u2014',
      Data_Quality_Detail__c: l.Data_Quality_Detail__c,
    })),
    notEvaluated,
    population.map(refOf),
    {
      failure: [
        { label: 'Missing Country', count: missingCountry.length },
        { label: 'Missing Employee Count', count: missingEmployees.length },
        { label: 'Missing Country and Employee Count', count: missingBoth.length },
      ],
      exclusion,
    },
  );
}

/* ------------------------------------------------------------------ 2 */
export function routingExceptions(leads: LeadRecord[]): CheckResult {
  /**
   * Leads submitted to NorthstarIQ ownership routing.
   *
   * The routing Flow's entry criterion is exact equality to the governed intake
   * value. A Lead outside it never reaches the routing decision at all, so it
   * could not have landed in the exception queue - including it would measure
   * nothing about routing and only dilute the rate.
   */
  const population = leads.filter(isGoverned);
  const failing = population.filter((l) => l.Owner?.Name === 'NIQ Routing Exception');

  const notEvaluated = leads.filter((l) => !isGoverned(l)).map((l) => {
    const owner = ownerName(l);
    const preserved = owner === null ? 'its existing Owner was preserved' : `existing Owner ${owner} preserved`;
    const reason = wasProcessedAtIntake(l)
      ? `Not submitted to NorthstarIQ ownership routing — ${sourcePhrase(l)} is outside this routing flow’s entry criteria; ${preserved}.`
      : `Not submitted to NorthstarIQ ownership routing — this Lead predates the routing flow, so no routing decision was recorded for it; ${sourcePhrase(l)} is outside the flow’s entry criteria and ${owner === null ? 'its existing Owner is unchanged' : `its existing Owner ${owner} is unchanged`}.`;
    return leadRow(l, { key: 'Owner', value: owner ?? '— (none recorded)' }, 'outside', reason);
  });

  return build(
    {
      id: 'routing-exceptions',
      title: 'Leads in the Routing Exception Queue',
      category: 'Routing',
      severity: 'High',
      businessQuestion:
        'Which Leads could not be routed safely and are waiting on Revenue Operations rather than a seller?',
      businessImpact:
        'These records are not lost - routing deliberately refused to guess an owner and made them visible. They still consume speed-to-lead while they wait, so each one needs a human decision.',
      // Named by the class Salesforce actually recorded on each record.
      failureDetail:
        failing.length === 0
          ? ''
          : `${failing.length} ${be(failing.length)} held in the routing exception queue — ${list(
              tally(failing, (l) => l.Exception_Type__c ?? 'no exception type recorded').map(
                ([type, n]) => `${n} ${type}`,
              ),
            )}`,
      population: `${population.length} Leads submitted to NorthstarIQ ownership routing`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Company', label: 'Company' },
        { key: 'Exception_Type__c', label: 'Exception Type' },
        { key: 'Routing_Reason__c', label: 'Routing Reason' },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'LeadSource', label: 'Lead Source' },
        { key: 'Owner', label: 'Current Owner' },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failing.map((l) => ({
      Name: l.Name,
      Company: l.Company,
      Exception_Type__c: l.Exception_Type__c ?? '—',
      Routing_Reason__c: l.Routing_Reason__c,
      Id: l.Id,
    })),
    notEvaluated,
    population.map(refOf),
  );
}

/* ------------------------------------------------------------------ 3 */
const AT_RISK = new Set(['At Risk', 'Breached', 'Breached (Late Response)']);

/** Plain wording for each failing SLA state, so the summary is readable. */
const SLA_FAILURE_WORDING: Record<string, string> = {
  Breached: 'breached with no response recorded',
  'Breached (Late Response)': 'responded to after the deadline',
  'At Risk': 'at risk, with the deadline approaching',
};

export function slaRisk(leads: LeadRecord[]): CheckResult {
  /**
   * Measurable population only.
   *
   * A Lead with no SLA target was never given a commitment - most were created
   * before the SLA capability existed. Counting those as breaches would
   * overstate failure, which is exactly what M-07 in metric-dictionary.md
   * guards against. Unmeasurable is not Breached.
   */
  const population = leads.filter((l) => l.SLA_Target_DateTime__c !== null);
  const failing = population.filter((l) => AT_RISK.has(l.SLA_Status__c ?? ''));
  const breached = failing.filter((l) => (l.SLA_Status__c ?? '').startsWith('Breached'));

  const notEvaluated = leads
    .filter((l) => l.SLA_Target_DateTime__c === null)
    .map((l) => {
      const status = l.SLA_Status__c;
      // The record states its own reason wherever the Flow recorded one.
      if (l.SLA_Basis__c !== null) {
        return leadRow(
          l,
          { key: 'SLA_Status__c', value: status },
          status === 'Excluded' ? 'outside' : 'unmeasurable',
          `SLA response measurement — ${l.SLA_Basis__c}; this Lead was not included in this control’s score.`,
        );
      }
      if (!isGoverned(l)) {
        return leadRow(
          l,
          { key: 'SLA_Status__c', value: status },
          'outside',
          `SLA response measurement — this Lead did not arrive through the governed intake path, so no seller response commitment was ever issued for it; it was not included in this control’s score.`,
        );
      }
      if (status === 'Excluded') {
        return leadRow(
          l,
          { key: 'SLA_Status__c', value: status },
          'outside',
          'SLA response measurement — this Lead is held for Revenue Operations triage rather than seller response, so no response commitment applies; it was not included in this control’s score.',
        );
      }
      return leadRow(
        l,
        { key: 'SLA_Status__c', value: status },
        'unmeasurable',
        'SLA response measurement — this Lead was created before response commitments were issued at intake, so it never carried an SLA target and its response cannot be measured; it was not included in this control’s score.',
      );
    });

  return build(
    {
      id: 'sla-risk',
      title: 'Leads At Risk of or in SLA Breach',
      category: 'SLA Performance',
      severity: breached.length > 0 ? 'High' : 'Medium',
      businessQuestion:
        'Which Leads with a real response commitment have not been actioned in time?',
      businessImpact:
        'Speed to first response is the strongest predictor of conversion on inbound demand. A breached Lead has already lost the advantage the commitment existed to protect.',
      /*
       * The three states are operationally different — no response at all,
       * a late response, and a deadline still approaching — so the summary
       * names which ones the failing records are actually in.
       */
      failureDetail:
        failing.length === 0
          ? ''
          : `${failing.length} missed the response commitment — ${list(
              tally(failing, (l) => SLA_FAILURE_WORDING[l.SLA_Status__c ?? ''] ?? 'at risk').map(
                ([what, n]) => `${n} ${what}`,
              ),
            )}`,
      population: `${population.length} Leads with an SLA target (measurable population)`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Segment__c', label: 'Segment' },
        { key: 'SLA_Status__c', label: 'SLA Status' },
        { key: 'SLA_Target_DateTime__c', label: 'SLA Target', mono: true },
        { key: 'First_Touch_DateTime__c', label: 'First Touch', mono: true },
      ],
      notEvaluatedColumns: leadNotEvaluatedColumns('SLA_Status__c', 'SLA Status'),
    },
    failing.map((l) => ({
      Name: l.Name,
      Segment__c: l.Segment__c ?? '—',
      SLA_Status__c: l.SLA_Status__c,
      SLA_Target_DateTime__c: l.SLA_Target_DateTime__c,
      First_Touch_DateTime__c: l.First_Touch_DateTime__c ?? '—',
      Id: l.Id,
    })),
    notEvaluated,
    population.map(refOf),
  );
}

/* ------------------------------------------------------------------ 4 */
export function ambiguousMatch(leads: LeadRecord[]): CheckResult {
  /**
   * Leads carrying a recorded match decision.
   *
   * This control reads the account-match outcome the Salesforce intake Flow
   * stored on the Lead. It performs no matching of its own and compares nothing
   * against the Account object at assessment time.
   *
   * A blank decision means the matching process never assessed the record. That
   * is not the same as No Match, and treating it as a pass would credit the
   * process for work it never did - `BR-03` AC1 defines an assessed record as
   * one carrying Matched, No Match or Review.
   */
  const population = leads.filter((l) => l.Match_Status__c !== null);
  const failing = population.filter((l) => l.Match_Status__c === 'Review');

  const notEvaluated = leads
    .filter((l) => l.Match_Status__c === null)
    .map((l) =>
      leadRow(
        l,
        { key: 'Match_Status__c', value: '— (no decision recorded)' },
        'unmeasurable',
        'Account matching — no match decision is recorded on this Lead, so the matching process never assessed it against the Account object; it was not included in this control’s score. No recorded decision is not the same as no matching Account.',
      ),
    );

  return build(
    {
      id: 'ambiguous-match',
      title: 'Leads With an Ambiguous Account Match',
      category: 'Identity & Matching',
      severity: 'Medium',
      businessQuestion:
        'Where could the same company legitimately be more than one Account, so identity cannot be resolved automatically?',
      businessImpact:
        'Several Accounts share a domain, so automation cannot tell which relationship this Lead belongs to. Guessing would attach a prospect to the wrong account team and the wrong history.',
      // Name the domains the ambiguity is actually on.
      failureDetail:
        failing.length === 0
          ? ''
          : (() => {
              const domains = [
                ...new Set(failing.map((l) => l.Normalized_Domain__c).filter(Boolean)),
              ] as string[];
              const on =
                domains.length === 0
                  ? 'with no normalized domain recorded'
                  : `on ${domains.length === 1 ? 'the shared domain' : 'shared domains'} ${list(domains)}`;
              return `${failing.length} could not be resolved to a single Account ${on}`;
            })(),
      population: `${population.length} Leads with a recorded match decision`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Company', label: 'Company' },
        { key: 'Normalized_Domain__c', label: 'Normalized Domain', mono: true },
        { key: 'Match_Status__c', label: 'Match Status' },
        { key: 'Matched_Account__c', label: 'Matched Account', mono: true },
      ],
      notEvaluatedColumns: leadNotEvaluatedColumns('Match_Status__c', 'Match Status'),
    },
    failing.map((l) => ({
      Name: l.Name,
      Company: l.Company,
      Normalized_Domain__c: l.Normalized_Domain__c,
      Match_Status__c: l.Match_Status__c,
      // Deliberately blank: automation refused to attach an Account.
      Matched_Account__c: l.Matched_Account__c ?? '— (not attached)',
      Id: l.Id,
    })),
    notEvaluated,
    population.map(refOf),
  );
}

/* ------------------------------------------------------------------ 5 */
export function missingTerritory(leads: LeadRecord[]): CheckResult {
  /**
   * Leads the coverage model evaluated.
   *
   * Territory classification is decoupled from ownership routing: the intake
   * automation derives a territory for every Lead it handles, including those
   * whose ownership it deliberately leaves alone. So this control is not scoped
   * to the governed intake path - it is scoped to the records the coverage model
   * actually ran against.
   *
   * A Lead created before that capability existed has a blank Territory because
   * nothing ever computed one, not because its geography is uncovered. Scoring
   * it either way would be false, so it is reported as unmeasurable.
   */
  const population = leads.filter(wasProcessedAtIntake);
  const failing = population.filter((l) => l.Territory__c === null);

  const notEvaluated = leads
    .filter((l) => !wasProcessedAtIntake(l))
    .map((l) =>
      leadRow(
        l,
        { key: 'Territory__c', value: '— (never derived)' },
        'unmeasurable',
        'Territory classification — this Lead was created before territory classification was implemented, so the coverage model never evaluated it and no territory was ever derived; it was not included in this control’s score. A blank territory here means not yet classified, not uncovered geography.',
      ),
    );

  return build(
    {
      id: 'missing-territory',
      title: 'Leads Without a Territory',
      category: 'Routing',
      severity: 'Medium',
      businessQuestion:
        'Did every Lead the coverage model evaluated reach a territory, or did some arrive with geography the model does not handle?',
      businessImpact:
        'Territory determines coverage. Without it a Lead cannot reach a coverage queue, so it waits in the exception path regardless of how good the record otherwise is.',
      /*
       * Absent geography and uncovered geography are different problems: one
       * is a record defect, the other a gap in the coverage map. The summary
       * distinguishes them and names the countries actually involved.
       */
      failureDetail:
        failing.length === 0
          ? ''
          : (() => {
              const absent = failing.filter((l) => l.CountryCode === null).length;
              const uncovered = failing.filter((l) => l.CountryCode !== null);
              const codes = [...new Set(uncovered.map((l) => l.CountryCode as string))];
              const parts: string[] = [];
              if (absent > 0) parts.push(`${absent} ${be(absent)} missing a country`);
              if (uncovered.length > 0) {
                parts.push(
                  `${uncovered.length} ${be(uncovered.length)} in ${list(codes)}, which the territory map does not cover`,
                );
              }
              return `${failing.length} reached no territory — ${list(parts)}`;
            })(),
      population: `${population.length} Leads evaluated by the coverage model`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Company', label: 'Company' },
        { key: 'CountryCode', label: 'Country', mono: true },
        { key: 'Exception_Type__c', label: 'Exception Type' },
      ],
      notEvaluatedColumns: leadNotEvaluatedColumns('Territory__c', 'Territory'),
    },
    failing.map((l) => ({
      Name: l.Name,
      Company: l.Company,
      CountryCode: l.CountryCode ?? '—',
      Exception_Type__c: l.Exception_Type__c ?? '—',
      Id: l.Id,
    })),
    notEvaluated,
    population.map(refOf),
  );
}

/* ------------------------------------------------------------------ 6 */
export function staleOpportunities(opps: OpportunityRecord[], today: Date): CheckResult {
  const population = opps.filter((o) => !o.IsClosed);
  const cutoff = today.toISOString().slice(0, 10);
  const failing = population.filter((o) => o.CloseDate !== null && o.CloseDate < cutoff);

  const notEvaluated: NotEvaluatedRecord[] = opps
    .filter((o) => o.IsClosed)
    .map((o) => ({
      kind: 'outside' as const,
      row: {
        Name: o.Name,
        StageName: o.StageName,
        Closed: 'Closed',
        CloseDate: o.CloseDate,
        Reason: `Open pipeline date health — this Opportunity is closed at stage "${o.StageName ?? 'not stated'}", so it is no longer part of open pipeline and its close date is a historical fact rather than a forecast; it was not included in this control’s score.`,
        Id: o.Id,
      },
    }));

  return build(
    {
      id: 'stale-opportunities',
      title: 'Open Opportunities With a Past Close Date',
      category: 'Pipeline Hygiene',
      severity: 'Medium',
      businessQuestion: 'Is the open pipeline telling the truth about when deals will land?',
      businessImpact:
        'An open Opportunity whose close date has passed silently distorts forecast, coverage and capacity planning. The pipeline looks larger and nearer than it is.',
      // How far the dates have actually slipped, not merely that they have.
      failureDetail:
        failing.length === 0
          ? ''
          : (() => {
              const dates = failing.map((o) => o.CloseDate as string).sort();
              return `${failing.length} ${be(failing.length)} still open with a Close Date in the past, the oldest ${dates[0]} and the most recent ${dates[dates.length - 1]}`;
            })(),
      population: `${population.length} open Opportunities`,
      orgPopulation: opps.length,
      orgPopulationNoun: 'Opportunities',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Opportunity' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'AccountName', label: 'Account' },
        { key: 'StageName', label: 'Stage' },
        { key: 'CloseDate', label: 'Close Date', mono: true },
        { key: 'Amount', label: 'Amount', mono: true },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Opportunity' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'StageName', label: 'Stage' },
        { key: 'Closed', label: 'Closed State' },
        { key: 'CloseDate', label: 'Close Date', mono: true },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failing.map((o) => ({
      Name: o.Name,
      AccountName: o.Account?.Name ?? '—',
      StageName: o.StageName,
      CloseDate: o.CloseDate,
      Amount: o.Amount === null ? '—' : o.Amount,
      Id: o.Id,
    })),
    notEvaluated,
    population.map(refOf),
  );
}

/* ------------------------------------------------------------------ 7 */
export function segmentConsistency(leads: LeadRecord[]): CheckResult {
  /**
   * Leads carrying a segmentation result NorthstarIQ can read.
   *
   * The comparison is deliberately the RECORDED result against the CURRENT
   * Segment - never today's Segment Band configuration re-run over a historical
   * Lead. A Lead segmented under an earlier version of the bands is not drift,
   * and judging it against a rule that did not exist when it was created would
   * manufacture failures out of a legitimate configuration change.
   *
   * `Match_Status__c` is deliberately not consulted. Account matching is a
   * different capability and says nothing about whether segmentation ran.
   */
  const read = leads.map((l) => ({ lead: l, evidence: interpretSegmentBasis(l.Segment_Basis__c) }));

  const population = read.flatMap(({ lead, evidence }) =>
    evidence !== null && evidence.kind !== 'unrecognised' ? [{ lead, evidence }] : [],
  );
  const failing = population.filter(
    ({ lead, evidence }) => currentSegment(lead.Segment__c) !== evidence.expectedSegment,
  );

  /** "Mid-Market recorded as SMB" - the direction of the disagreement. */
  const drift = (f: (typeof failing)[number]) =>
    `${segmentLabel(f.evidence.expectedSegment)} recorded as ${segmentLabel(currentSegment(f.lead.Segment__c))}`;

  const noEvidence = read.filter(({ evidence }) => evidence === null).length;
  const unreadable = read.filter(({ evidence }) => evidence?.kind === 'unrecognised').length;

  const notEvaluated: NotEvaluatedRecord[] = read
    .filter(({ evidence }) => evidence === null || evidence.kind === 'unrecognised')
    .map(({ lead, evidence }) => ({
      /*
       * Unmeasurable, not outside: segmentation applies to this Lead in
       * principle. What is absent is a result to compare against, and saying
       * that is a different fact from saying the control does not apply.
       */
      kind: 'unmeasurable' as const,
      row: {
        Name: lead.Name,
        Segment__c: lead.Segment__c ?? '\u2014 (none)',
        Segment_Basis__c: lead.Segment_Basis__c ?? '\u2014 (none recorded)',
        Reason:
          evidence === null
            ? 'Segment consistency \u2014 no segmentation source evidence is recorded on this Lead, so Salesforce holds no segmentation result to compare the current Segment against; it was not included in this control\u2019s score.'
            : `Segment consistency \u2014 the recorded segmentation result "${lead.Segment_Basis__c}" is not in a form NorthstarIQ can interpret, so an expected Segment cannot be established from it without guessing; it was not included in this control\u2019s score.`,
        Id: lead.Id,
      },
    }));

  return build(
    {
      id: 'segment-consistency',
      title: 'Segment Assignment Consistency',
      category: 'Data Quality',
      severity: 'Medium',
      businessQuestion:
        'Does the Segment stored on a Lead still match the segmentation result Salesforce recorded for it?',
      businessImpact:
        'Segment sets the response commitment and every segment cut of the pipeline. A Lead whose Segment no longer matches the recorded result is worked to the wrong commitment and reported in the wrong band, and nothing in Salesforce surfaces the disagreement.',
      /*
       * Names the condition only. How the disagreements divide is carried by
       * the breakdown beneath it, so neither restates the other.
       */
      failureDetail:
        failing.length === 0
          ? ''
          : `${failing.length} ${failing.length === 1 ? 'carries' : 'carry'} a Segment that disagrees with the segmentation result Salesforce recorded`,
      population: `${population.length} Leads with a recorded segmentation result`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'NumberOfEmployees', label: 'Employee Count', mono: true },
        { key: 'Expected_Segment', label: 'Expected Segment' },
        { key: 'Current_Segment', label: 'Current Segment' },
        { key: 'Source_Evidence', label: 'Source Evidence' },
        { key: 'Result', label: 'Result' },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Segment__c', label: 'Current Segment' },
        { key: 'Segment_Basis__c', label: 'Recorded Segmentation Result' },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failing.map(({ lead, evidence }) => ({
      Name: lead.Name,
      Id: lead.Id,
      NumberOfEmployees: lead.NumberOfEmployees === null ? '\u2014' : lead.NumberOfEmployees,
      Expected_Segment: segmentLabel(evidence.expectedSegment),
      Current_Segment: segmentLabel(currentSegment(lead.Segment__c)),
      // Written to stay readable in an export, away from this application.
      Source_Evidence: sourceEvidenceCell(evidence),
      Result: 'Mismatch',
    })),
    notEvaluated,
    population.map(({ lead }) => refOf(lead)),
    {
      failure: tally(failing, drift).map(([label, count]) => ({ label, count })),
      exclusion: [
        {
          label: 'No segmentation source evidence recorded',
          count: noEvidence,
          detail: 'Salesforce recorded no segmentation result on the Lead',
        },
        {
          label: 'Recorded segmentation result could not be interpreted',
          count: unreadable,
          detail: 'The recorded result is not in a form NorthstarIQ can read',
        },
      ],
    },
  );
}

/* ----------------------------------------- Lifecycle Governance (area 6) */

/**
 * OPPORTUNITY CONVERSION INTEGRITY - implemented, tested, scored since Model v2.
 *
 * This is the proof control for Lifecycle Governance: it exists to show that a
 * claimed revenue lifecycle state can be checked against Salesforce's own
 * authoritative record of what happened, and that the two can disagree.
 *
 * IT RUNS, AND IT SCORES. Model v2 added it to `CHECK_IDS` and `runAllChecks`.
 *
 * Doing so created Assessment Area #6, and `overallHealth` is an unweighted
 * mean of areas - so every existing area moved from a fifth of the score to a
 * sixth. That is why a v1 overall and a v2 overall are not comparable, and why
 * activation was taken as an approved, user-visible scoring change rather than
 * quietly.
 *
 * WHAT THE CONTROL DOES NOT CLAIM. It does not assert that a converted Lead
 * must have produced an Opportunity. Salesforce lets a Lead be converted with
 * "Don't create an opportunity", so a null `ConvertedOpportunityId` is a
 * legitimate outcome and is never on its own a failure. The contradiction this
 * control detects is narrower and harder to argue with: the Lead's status says
 * converted, and Salesforce's own `IsConverted` flag says it was not.
 *
 * PREVENTIVE AND DETECTIVE ARE BOTH REAL HERE, AND THEY ARE NOT THE SAME THING.
 * `Lifecycle_Transition__mdt` decides whether entry into the converted stage is
 * PERMITTED, and `Lead_Inbound_Before_Save` enforces that - verified 2026-08-27
 * to run inside a native Salesforce Lead Conversion, refusing an unsupported
 * one and rolling the whole transaction back. This control asks the other
 * question: did conversion actually HAPPEN, on records that already claim it.
 * The safeguard governs new transitions and could not reach the records that
 * held a converted status before it existed - so it never makes this control
 * redundant, and this control never re-asserts what the safeguard enforces.
 */
export function opportunityConversionIntegrity(leads: LeadRecord[]): CheckResult {
  /*
   * Only Leads that actually make the claim.
   *
   * A Lead sitting in Working - Contacted asserts nothing about conversion, so
   * there is nothing for this control to judge on it. Scoring it would measure
   * the shape of the pipeline rather than the integrity of a claim.
   */
  const claimsConverted = (l: LeadRecord) => l.Status === CONVERTED_LEAD_STATUS;

  const population = leads.filter(claimsConverted);

  /*
   * The whole failing condition. `IsConverted` is written by the conversion
   * process and is not editable afterwards, which is what makes it the
   * authority here - a status can be typed or loaded, this cannot.
   */
  const failing = population.filter((l) => !l.IsConverted);

  const notEvaluated: NotEvaluatedRecord[] = leads
    .filter((l) => !claimsConverted(l))
    .map((l) => ({
      // Outside, not unmeasurable: the control genuinely does not apply to a
      // record that makes no conversion claim.
      kind: 'outside' as const,
      row: {
        Name: l.Name,
        Status: l.Status ?? '\u2014 (none recorded)',
        IsConverted: l.IsConverted ? 'Yes' : 'No',
        Reason: `Conversion integrity \u2014 this Lead's status is "${
          l.Status ?? 'not set'
        }", so it makes no claim to have been converted and there is no claim to substantiate; it was not included in this control\u2019s score.`,
        Id: l.Id,
      },
    }));

  /** "\u2014" for an absent id, so a blank cell is never mistaken for a value. */
  const orDash = (v: string | null) => (v === null || v === '' ? '\u2014' : v);

  return build(
    {
      id: 'lifecycle-conversion',
      title: 'Converted Lifecycle State Not Substantiated',
      category: 'Lifecycle Governance',
      severity: 'High',
      businessQuestion:
        'Does a Lead claiming a converted lifecycle state have the Salesforce conversion record to support it?',
      businessImpact:
        'Conversion is the point where Marketing hands the outcome to Sales, and every funnel and conversion-rate figure counts it. A Lead whose status says converted while Salesforce records no conversion inflates that count and points at an Account, Contact and Opportunity that do not exist.',
      failureDetail:
        failing.length === 0
          ? ''
          : `${failing.length} ${be(failing.length)} marked "${CONVERTED_LEAD_STATUS}" while Salesforce records the Lead as not converted`,
      population: `${population.length} Leads claiming a converted lifecycle state`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'IsConverted', label: 'Converted (Salesforce)' },
        { key: 'ConvertedDate', label: 'Converted Date', mono: true },
        { key: 'ConvertedAccountId', label: 'Converted Account', mono: true },
        { key: 'ConvertedContactId', label: 'Converted Contact', mono: true },
        { key: 'ConvertedOpportunityId', label: 'Converted Opportunity (optional)', mono: true },
        { key: 'Result', label: 'Result' },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'IsConverted', label: 'Converted (Salesforce)' },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failing.map((l) => ({
      Name: l.Name,
      Id: l.Id,
      Status: l.Status,
      IsConverted: 'No',
      ConvertedDate: orDash(l.ConvertedDate),
      ConvertedAccountId: orDash(l.ConvertedAccountId),
      ConvertedContactId: orDash(l.ConvertedContactId),
      ConvertedOpportunityId: orDash(l.ConvertedOpportunityId),
      Result: 'Not substantiated',
    })),
    notEvaluated,
    population.map(refOf),
  );
}


/* ---------------------------------------- lifecycle detective control 1 */
/**
 * MQL Qualification Integrity - IMPLEMENTED, DETECTIVE, SCORED SINCE MODEL v2.
 *
 * Like `opportunityConversionIntegrity`, it is in `CHECK_IDS` and runs with the
 * rest. Whether it produces a score is decided per run: against the current
 * baseline it judges no Lead, so it reports Not Scored rather than a number.
 *
 * THE QUESTION. Salesforce prevents an unsupported NEW transition into MQL.
 * This asks the other half: of the Leads that already claim Marketing
 * qualification, which ones can the governed policy actually substantiate?
 *
 * THE DEFINITION IS NOT HERE. Which requirements apply comes from the active
 * `MQL_Qualification_Policy__mdt` record; which sources are governed comes from
 * `Routing_Readiness_Source__mdt`; which segments qualify comes from
 * `Segment_Band__mdt.MQL_Eligible__c`. Those are the same three reads the
 * preventive Flow makes. Turn a requirement off in Salesforce and this control
 * stops testing it, with no code change - which is the property that makes it a
 * second consumer of one definition rather than a second copy of it.
 *
 * WHY MOST RECORDS ARE NOT JUDGED, AND WHY THAT IS THE HONEST ANSWER. Three
 * things put a claiming Lead beyond safe re-judgement:
 *
 *  1. NO GOVERNED EVIDENCE. Every baseline Lead predates `MQL_Basis__c`. A
 *     record that claimed MQL before the evidence architecture existed cannot be
 *     shown to have violated the policy - only to be unprovable. Missing
 *     evidence is not a violation, and reporting it as one would be a
 *     fabrication.
 *  2. IT HAS MOVED ON. Every input the policy reads - source, segment,
 *     territory, match state - is current-state and derived. On a Lead that has
 *     since reached SAL, SQL or conversion, today's values are not the values
 *     that qualified it, and a segment that legitimately changed afterwards is
 *     not evidence of a bad qualification. Only a Lead still sitting on the
 *     governed stage has facts contemporaneous with its own claim.
 *  3. A DIFFERENT POLICY VERSION. A record qualified under v1.0 is not judged
 *     against v1.1.
 *
 * All three land in `unmeasurable`, whose contract is precisely "the control
 * applies, but the process that produces its evidence never ran".
 */
export function mqlQualificationIntegrity(
  leads: LeadRecord[],
  policy: MqlPolicy,
  /** Active Lead Sources from Routing_Readiness_Source__mdt. */
  governedSources: string[],
  /** Segment names where Segment_Band__mdt.MQL_Eligible__c is true. */
  mqlEligibleSegments: string[],
): CheckResult {
  const claims = (l: LeadRecord) =>
    l.MQL_Basis__c !== null || MQL_CLAIMING_STATUSES.includes(l.Status ?? '');

  const population = leads.filter(claims);
  const outside = leads.filter((l) => !claims(l));

  const failingRows: EvidenceRow[] = [];
  const notEvaluated: NotEvaluatedRecord[] = [];
  const failureCauses: string[] = [];
  const exclusionCauses: string[] = [];

  const dash = (v: string | null) => (v === null || v === '' ? '\u2014' : v);

  const decline = (l: LeadRecord, cause: string, reason: string) => {
    exclusionCauses.push(cause);
    notEvaluated.push({
      kind: 'unmeasurable',
      row: {
        Name: l.Name,
        Status: dash(l.Status),
        'MQL Basis': dash(l.MQL_Basis__c),
        Reason: reason,
        Id: l.Id,
      },
    });
  };

  /* The judged set, in judgement order. Its length is the old counter. */
  const evaluatedRecords: RecordRef[] = [];

  for (const l of population) {
    // 1. No governed evidence at all - predates the qualification foundation.
    if (l.MQL_Basis__c === null) {
      decline(
        l,
        'No governed qualification evidence',
        `MQL qualification integrity \u2014 this Lead's status is "${dash(
          l.Status,
        )}", which under the governed lifecycle is only reachable through MQL, but it carries no qualification evidence: it predates the evidence foundation. NorthstarIQ cannot show the claim was wrong, only that it cannot be substantiated \u2014 so it was not counted as a failure.`,
      );
      continue;
    }

    // 2. Qualified under a different definition.
    const version = recordedPolicyVersion(l.MQL_Basis__c);
    if (policy.version !== null && version !== null && version !== policy.version) {
      decline(
        l,
        'Qualified under a superseded policy version',
        `MQL qualification integrity \u2014 this Lead was qualified under MQL Policy ${version} and the definition in force is now ${policy.version}. Judging it against a policy that did not exist when it qualified would invent a violation, so it was not counted.`,
      );
      continue;
    }

    // 3. It has progressed - today's derived values are not the ones that qualified it.
    if (l.Status !== policy.qualifiedStage) {
      decline(
        l,
        'Progressed beyond the governed stage',
        `MQL qualification integrity \u2014 this Lead qualified under the governed policy and has since moved to "${dash(
          l.Status,
        )}". Every input the policy reads is current-state and derived, so today's values are not the ones that qualified it and cannot re-judge the historical claim.`,
      );
      continue;
    }

    /*
     * Contemporaneous: the Lead still sits on the stage it claims, so its
     * current values ARE the qualification values.
     *
     * Precedence matters. A requirement that is demonstrably violated makes the
     * record a failure; a requirement that merely cannot be proven makes it
     * unmeasurable. A proven violation therefore outranks an unprovable one -
     * otherwise a record with a real defect could hide behind a blank field.
     */
    const violations: string[] = [];
    const unprovable: string[] = [];

    if (policy.requireGovernedSource && !governedSources.includes(l.LeadSource ?? '')) {
      violations.push('acquisition source is not one held to a routing-readiness standard');
    }
    if (policy.requireEligibleSegment) {
      if (l.Segment__c === null || l.Segment__c === '') {
        unprovable.push('no segment is recorded, so its eligibility cannot be established');
      } else if (!mqlEligibleSegments.includes(l.Segment__c)) {
        violations.push('segment is not one the business qualifies');
      }
    }
    if (policy.requireRoutableTerritory && (l.Territory__c === null || l.Territory__c === '')) {
      violations.push('no governed territory was resolved');
    }
    if (policy.requireUnambiguousMatch) {
      if (l.Match_Status__c === 'Review') {
        violations.push('account match is ambiguous and needs review');
      } else if (l.Match_Status__c === null || l.Match_Status__c === '') {
        /*
         * BLANK IS NOT UNAMBIGUOUS.
         *
         * The preventive Flow blocks only a known ambiguity, so blank passes
         * there - correct for a gate deciding whether to refuse a save. This
         * control asks a different question: is the claim SUBSTANTIATED? A match
         * that was never evaluated substantiates nothing. Same policy, same
         * field, different question - so blank is insufficient evidence here
         * and is never silently counted as a pass.
         */
        unprovable.push('account match was never evaluated, so it cannot be shown to be unambiguous');
      }
    }

    if (violations.length > 0) {
      failureCauses.push(violations[0]);
      failingRows.push({
        Name: l.Name,
        Id: l.Id,
        Status: dash(l.Status),
        LeadSource: dash(l.LeadSource),
        Segment: dash(l.Segment__c),
        Territory: dash(l.Territory__c),
        'Match Status': dash(l.Match_Status__c),
        'MQL Basis': dash(l.MQL_Basis__c),
        Result: `Not substantiated \u2014 ${list(violations)}`,
      });
      evaluatedRecords.push(refOf(l));
      continue;
    }
    if (unprovable.length > 0) {
      decline(
        l,
        'Insufficient evidence for a required condition',
        `MQL qualification integrity \u2014 this Lead breaches nothing the policy prohibits, but ${list(
          unprovable,
        )}. An unproven condition is not a pass, so it was not counted either way.`,
      );
      continue;
    }
    evaluatedRecords.push(refOf(l));
  }

  for (const l of outside) {
    notEvaluated.push({
      kind: 'outside',
      row: {
        Name: l.Name,
        Status: dash(l.Status),
        'MQL Basis': dash(l.MQL_Basis__c),
        Reason: `MQL qualification integrity \u2014 this Lead's status is "${dash(
          l.Status,
        )}" and it carries no qualification evidence, so it makes no Marketing-qualified claim and there is nothing to substantiate.`,
        Id: l.Id,
      },
    });
  }

  const evaluated = evaluatedRecords.length;
  const failing = failingRows.length;

  return build(
    {
      id: 'mql-integrity',
      title: 'Marketing-Qualified Claims Not Substantiated',
      category: 'Lifecycle Governance',
      severity: 'Medium',
      businessQuestion:
        'Where a Lead claims Marketing qualification, does the governed qualification policy substantiate it?',
      businessImpact:
        'An MQL that cannot be explained is one Sales has to re-qualify from scratch, which is the disagreement between Marketing and Sales expressed as wasted seller time. The point of a governed definition is that the handoff arrives with its reasoning attached.',
      failureDetail:
        failing === 0
          ? ''
          : `${failing} ${be(failing)} on the governed stage while the policy in force does not support the claim`,
      population: `${evaluated} Leads whose Marketing-qualified claim can be checked against MQL Policy ${
        policy.version ?? '(unversioned)'
      }`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated,
      failing,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'LeadSource', label: 'Lead Source' },
        { key: 'Segment', label: 'Segment' },
        { key: 'Territory', label: 'Territory' },
        { key: 'Match Status', label: 'Account Match' },
        { key: 'MQL Basis', label: 'Recorded Qualification Evidence' },
        { key: 'Result', label: 'Result' },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'MQL Basis', label: 'Recorded Qualification Evidence' },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failingRows,
    notEvaluated,
    evaluatedRecords,
    {
      failure: tally(failureCauses, (c) => c).map(([label, count]) => ({ label, count })),
      exclusion: tally(exclusionCauses, (c) => c).map(([label, count]) => ({ label, count })),
    },
  );
}

/** The requirements the active policy switches on, for the investigation trail. */
export { activeRequirementLabels as mqlActiveRequirements };


/* ---------------------------------------- lifecycle detective control 2 */
/**
 * Which stage owns which piece of evidence.
 *
 * A TAXONOMY FACT, not policy. Reading `Sales_Accepted_At__c` requires knowing
 * it is the SAL stage's evidence - the field is meaningless otherwise. What
 * this does NOT decide is which stage may follow which, or which stages a route
 * must pass through: those come from `Lifecycle_Transition__mdt` through the
 * graph. Stages absent from the deployed policy are simply skipped.
 */
const STAGE_EVIDENCE: { stage: string; label: string; present: (l: LeadRecord) => boolean }[] = [
  { stage: 'MQL', label: 'Marketing qualification evidence', present: (l) => l.MQL_Basis__c !== null },
  { stage: 'SAL', label: 'Sales acceptance evidence', present: (l) => l.Sales_Accepted_At__c !== null },
  { stage: 'SQL', label: 'sales qualification evidence', present: (l) => l.SQL_Basis__c !== null },
];

/** The calendar day of an ISO timestamp, for comparisons that must not be finer. */
const day = (iso: string) => iso.slice(0, 10);

/**
 * Lifecycle Progression Integrity - IMPLEMENTED, DETECTIVE, SCORED SINCE MODEL v2.
 *
 * In `CHECK_IDS` and `runAllChecks`, like `mqlQualificationIntegrity` and
 * `opportunityConversionIntegrity`.
 *
 * THE QUESTION. Not "was this Lead well qualified" - that is MQL Qualification
 * Integrity - and not "was this conversion real" - that is Opportunity
 * Conversion Integrity. This asks whether the Lead's observable progression is
 * internally consistent with the governed transition model: did it move in ways
 * the policy permits, does its evidence belong to stages it could have passed
 * through, and do its timestamps order sensibly.
 *
 * THE HARD PART IS RESTRAINT. Salesforce field history is bounded, was not
 * always tracked, and never records a Lead's initial status. A transition that
 * is absent from history is not a transition that never happened, and a Lead
 * carrying no lifecycle evidence is not a Lead that misbehaved - the evidence
 * fields did not exist when the baseline was created. So:
 *
 *   FAIL         retained evidence CONTRADICTS the governed model
 *   UNMEASURABLE the Lead claims progression, but nothing retained can settle it
 *   OUTSIDE      the Lead claims no progression at all
 *
 * A transition that the policy does not permit is only a FAIL on a record the
 * safeguard has actually touched. `Lifecycle_Stage_Entered__c` is how that is
 * known: the Flow stamps it on every transition it governs, so its absence
 * proves the safeguard never ran on this record. NO EFFECTIVE DATE IS INVENTED
 * anywhere - the record's own evidence decides, not a date in code.
 */
export function lifecycleProgressionIntegrity(
  leads: LeadRecord[],
  statusHistory: LeadStatusHistoryRecord[],
  graph: LifecycleGraph,
): CheckResult {
  const historyByLead = new Map<string, LeadStatusHistoryRecord[]>();
  for (const h of statusHistory) {
    if (!historyByLead.has(h.LeadId)) historyByLead.set(h.LeadId, []);
    historyByLead.get(h.LeadId)!.push(h);
  }

  const failingRows: EvidenceRow[] = [];
  const notEvaluated: NotEvaluatedRecord[] = [];
  const failureCauses: string[] = [];
  const exclusionCauses: string[] = [];
  /* The judged set, in judgement order. Its length is the old counter. */
  const evaluatedRecords: RecordRef[] = [];

  const dash = (v: string | null) => (v === null || v === '' ? '\u2014' : v);

  for (const l of leads) {
    const status = l.Status ?? '';
    const observed = historyByLead.get(l.Id) ?? [];
    const evidenceHeld = STAGE_EVIDENCE.filter((e) => e.present(l));
    /*
     * The safeguard stamps this on every transition it governs, so its presence
     * is the record's own proof that governance was in force for it. This is
     * the whole basis for separating "broke the rules" from "moved before the
     * rules existed", and it needs no date.
     */
    const governed = l.Lifecycle_Stage_Entered__c !== null;

    /*
     * A Lead is in scope when it asserts it has progressed - it sits somewhere
     * a lifecycle cannot begin - or when it carries anything progression can be
     * reasoned about.
     */
    const claimsProgression = graph.stages.has(status) && !graph.entryStages.has(status);
    const applicable =
      claimsProgression || observed.length > 0 || evidenceHeld.length > 0 || governed;

    if (!applicable) {
      notEvaluated.push({
        kind: 'outside',
        row: {
          Name: l.Name,
          Status: dash(l.Status),
          'Observed Transitions': '\u2014',
          Reason: `Lifecycle progression \u2014 this Lead is at "${dash(
            l.Status,
          )}", where a lifecycle begins, and carries no transition history or stage evidence. It asserts no progression, so there is nothing to check.`,
          Id: l.Id,
        },
      });
      continue;
    }

    const contradictions: string[] = [];
    const unprovable: string[] = [];

    /* -- A. an observed move the governed policy does not permit ----------- */
    for (const h of observed) {
      const from = h.OldValue ?? '';
      const to = h.NewValue ?? '';
      if (!graph.stages.has(from) || !graph.stages.has(to)) continue;
      if (transitionAllowed(graph, from, to)) continue;
      if (governed) {
        contradictions.push(`it moved ${from} \u2192 ${to}, which the governed policy does not permit`);
      } else {
        unprovable.push(
          `it moved ${from} \u2192 ${to}, which the current policy does not permit \u2014 but the lifecycle safeguard never ran on this record, so the move predates governance`,
        );
      }
    }

    /* -- B. stage entry recorded before the Lead existed -------------------- */
    if (l.Lifecycle_Stage_Entered__c !== null && l.Lifecycle_Stage_Entered__c < l.CreatedDate) {
      contradictions.push('its current stage was entered before the Lead itself was created');
    }

    /* -- C. acceptance recorded before the Lead existed --------------------- */
    if (l.Sales_Accepted_At__c !== null && l.Sales_Accepted_At__c < l.CreatedDate) {
      contradictions.push('Sales accepted it before the Lead itself was created');
    }

    /* -- D. conversion dated before the Lead existed ------------------------
     * ConvertedDate is a DATE and CreatedDate is a DATETIME, so only a whole-day
     * difference is compared. A same-day pair is left alone rather than ordered
     * on precision Salesforce does not retain.
     */
    if (l.ConvertedDate !== null && l.ConvertedDate < day(l.CreatedDate)) {
      contradictions.push('it was converted before the Lead itself was created');
    }

    /* -- E. evidence for a stage this Lead could not have passed through ---- */
    for (const e of evidenceHeld) {
      if (!graph.stages.has(e.stage) || !graph.stages.has(status)) continue;
      if (e.stage === status) continue;
      if (!canReach(graph, e.stage, status)) {
        contradictions.push(
          `it holds ${e.label} for the ${e.stage} stage, which the governed policy gives no route from to "${status}"`,
        );
      }
    }

    /* -- F. a stage every route must cross, with its evidence absent -------- */
    for (const e of STAGE_EVIDENCE) {
      if (e.present(l)) continue;
      if (!mustPassThrough(graph, status, e.stage)) continue;
      if (governed) {
        contradictions.push(
          `every governed route to "${status}" passes through ${e.stage}, and its ${e.label} is absent`,
        );
      } else {
        unprovable.push(
          `every governed route to "${status}" passes through ${e.stage}, and its ${e.label} is absent \u2014 but this record progressed before that evidence existed`,
        );
      }
    }

    if (contradictions.length > 0) {
      failureCauses.push(contradictions[0]);
      failingRows.push({
        Name: l.Name,
        Id: l.Id,
        Status: dash(l.Status),
        'Stage Entered': dash(l.Lifecycle_Stage_Entered__c),
        'Observed Transitions':
          observed.length === 0
            ? '\u2014 (none retained)'
            : observed.map((h) => `${h.OldValue} \u2192 ${h.NewValue}`).join('; '),
        'Stage Evidence Held':
          evidenceHeld.length === 0 ? '\u2014' : evidenceHeld.map((e) => e.stage).join(', '),
        Result: `Progression conflict \u2014 ${list(contradictions)}`,
      });
      evaluatedRecords.push(refOf(l));
      continue;
    }

    if (unprovable.length > 0) {
      exclusionCauses.push(
        unprovable.some((u) => u.includes('predates governance'))
          ? 'Transition observed, but it predates the lifecycle safeguard'
          : 'Progression claimed before the evidence architecture existed',
      );
      notEvaluated.push({
        kind: 'unmeasurable',
        row: {
          Name: l.Name,
          Status: dash(l.Status),
          'Observed Transitions':
            observed.length === 0
              ? '\u2014 (none retained)'
              : observed.map((h) => `${h.OldValue} \u2192 ${h.NewValue}`).join('; '),
          Reason: `Lifecycle progression \u2014 ${list(unprovable)}. NorthstarIQ cannot show the progression was wrong, only that it cannot be substantiated, so it was not counted as a failure.`,
          Id: l.Id,
        },
      });
      continue;
    }

    evaluatedRecords.push(refOf(l));
  }

  const evaluated = evaluatedRecords.length;
  const failing = failingRows.length;

  return build(
    {
      id: 'lifecycle-progression',
      title: 'Lead Lifecycle Progression Conflicts',
      category: 'Lifecycle Governance',
      severity: 'Medium',
      businessQuestion:
        'Does each Lead\u2019s observable lifecycle evidence agree with the governed progression the business defined?',
      businessImpact:
        'A lifecycle stage is supposed to mean the same thing to Marketing, Sales and the forecast. Where a record reached a stage by a route the business does not permit, or carries evidence for a stage it never passed through, every funnel figure counting that stage is counting something else.',
      failureDetail:
        failing === 0
          ? ''
          : `${failing} ${be(failing)} carrying lifecycle evidence that contradicts the governed progression`,
      population: `${evaluated} Leads whose progression could be settled against the governed transition policy${
        graph.versions.length ? ` ${graph.versions.join(', ')}` : ''
      }`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated,
      failing,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'Stage Entered', label: 'Current Stage Entered', mono: true },
        { key: 'Observed Transitions', label: 'Transitions Salesforce Retains' },
        { key: 'Stage Evidence Held', label: 'Stage Evidence Held' },
        { key: 'Result', label: 'Result' },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'Observed Transitions', label: 'Transitions Salesforce Retains' },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failingRows,
    notEvaluated,
    evaluatedRecords,
    {
      failure: tally(failureCauses, (c) => c).map(([label, count]) => ({ label, count })),
      exclusion: tally(exclusionCauses, (c) => c).map(([label, count]) => ({ label, count })),
    },
  );
}


/* ---------------------------------------- lifecycle detective control 3 */
/**
 * SALES ACCEPTANCE / SQL INTEGRITY - IMPLEMENTED, DETECTIVE, SCORED SINCE MODEL v2.
 *
 * In `CHECK_IDS` and `runAllChecks`, like the three lifecycle checks before it.
 * Against the current baseline it judges no Lead, so it reports Not Scored.
 *
 * ONE CONTROL, TWO EVALUATIONS. The Marketing -> Sales handoff has two distinct
 * business events and this control keeps them distinct:
 *
 *   SAL  Sales explicitly accepted responsibility for a substantiated
 *        Marketing-qualified Lead. An acknowledgement, made by a named person.
 *   SQL  Sales subsequently established enough commercial evidence - a need
 *        confirmed with the prospect, and an agreed forward step - to justify
 *        a genuine pursuit.
 *
 * They are evaluated separately against their own governed policies and then
 * combined into one population, one failing set and one finding, because the
 * question a reader asks is one question: does the evidence substantiate what
 * this Lead claims about the handoff?
 *
 * WHAT IT DOES NOT DO.
 *
 *  - It does not re-evaluate MQL. `MQL_Basis__c` is consumed as the
 *    evidence-chain prerequisite the acceptance policy names; source, segment,
 *    territory and match are never re-tested here. Whether the Marketing
 *    qualification was itself valid is MQL Qualification Integrity's question.
 *  - It does not re-derive the lifecycle. Transition adjacency, reachability
 *    and stage chronology belong to Lifecycle Progression Integrity, which
 *    reasons from `Lifecycle_Transition__mdt`. This control reasons from the
 *    two sales policies and never consults the transition graph.
 *  - It does not report the conversion contradiction. `Status` versus
 *    `IsConverted` is Opportunity Conversion Integrity's finding. A converted
 *    Lead is in scope here only because acceptance and qualification evidence
 *    deliberately survive conversion.
 *
 * INPUT IS NOT EVIDENCE. `Sales_Accepted__c` is a checkbox a seller ticks,
 * `Qualified_Need__c` a picklist they choose and `Next_Step_Date__c` a date
 * they enter - all three editable afterwards, so all three describe now rather
 * than then. The immutable, automation-written fields are what the control
 * judges. A ticked checkbox on a Lead with no acceptance evidence proves
 * nothing, and neither does `First_Touch_DateTime__c`: a seller working a Lead
 * is activity, not the business event of Sales accepting the handoff.
 */
export function salesAcceptanceSqlIntegrity(
  leads: LeadRecord[],
  acceptancePolicy: SalesAcceptancePolicy,
  sqlPolicy: SqlQualificationPolicy,
  statusHistory: LeadStatusHistoryRecord[],
): CheckResult {
  const historyByLead = new Map<string, LeadStatusHistoryRecord[]>();
  for (const h of statusHistory) {
    if (!historyByLead.has(h.LeadId)) historyByLead.set(h.LeadId, []);
    historyByLead.get(h.LeadId)!.push(h);
  }

  const dash = (v: string | null) => (v === null || v === '' ? '—' : v);

  /**
   * When this Lead entered the governed qualified stage, or null.
   *
   * THE WHOLE HISTORICAL QUESTION TURNS ON THIS. The preventive gate required
   * the next-step date to be today or later AT THE MOMENT OF QUALIFICATION, so
   * a correctly qualified Lead's date falls into the past as time passes.
   * Comparing it against TODAY would report the passage of time as a defect.
   * It has to be compared against the qualification event, and only two things
   * in Salesforce establish that event:
   *
   *   1. The stage-entry stamp, when the Lead still sits on the qualified
   *      stage - the stamp IS that transition, written by the Flow that
   *      granted it.
   *   2. A retained Status transition into the qualified stage.
   *
   * Field history is bounded and never records a Lead's first status, so for a
   * Lead that has moved on this frequently returns null. That is reported as
   * unmeasurable rather than resolved with a substitute date.
   */
  const qualifiedAt = (l: LeadRecord): string | null => {
    if (l.Status === sqlPolicy.qualifiedStage && l.Lifecycle_Stage_Entered__c !== null) {
      return l.Lifecycle_Stage_Entered__c;
    }
    const entries = (historyByLead.get(l.Id) ?? [])
      .filter((h) => h.NewValue === sqlPolicy.qualifiedStage)
      .map((h) => h.CreatedDate)
      .sort();
    return entries.length > 0 ? entries[entries.length - 1] : null;
  };

  /** One stage's verdict. `claimed` false means the Lead asserts nothing here. */
  interface StageVerdict {
    claimed: boolean;
    contradictions: string[];
    unprovable: string[];
  }

  /** Fresh each time: the caller spreads these lists and must never share them. */
  const nothingClaimed = (): StageVerdict => ({
    claimed: false,
    contradictions: [],
    unprovable: [],
  });

  /**
   * Does the acceptance evidence substantiate the acceptance this Lead claims?
   *
   * Governed is decided by the record's own evidence, not by a date: the Flow
   * writes `Sales_Accepted_At__c` at the instant it grants acceptance and
   * nothing else ever writes it, so its presence is proof the safeguard ran
   * here and its absence is proof it did not. NO EFFECTIVE DATE EXISTS.
   */
  function evaluateSalesAcceptance(l: LeadRecord): StageVerdict {
    const claimed =
      l.Sales_Accepted_At__c !== null ||
      l.Sales_Accepted_By__c !== null ||
      l.Sales_Acceptance_Basis__c !== null ||
      SAL_CLAIMING_STATUSES.includes(l.Status ?? '');
    if (!claimed) return nothingClaimed();

    const contradictions: string[] = [];
    const unprovable: string[] = [];

    if (l.Sales_Accepted_At__c === null) {
      /*
       * The baseline reality. A Lead whose status says Sales accepted it, with
       * no acceptance evidence, predates the acceptance architecture - the
       * fields did not exist when it moved. The seller checkbox is named here
       * precisely because it is the thing a reader would otherwise mistake for
       * evidence.
       */
      unprovable.push(
        `it claims Sales acceptance and carries none of the acceptance evidence the safeguard writes${
          l.Sales_Accepted__c
            ? ', only the seller checkbox - which is editable and records no time, no actor and no policy'
            : ''
        }`,
      );
      return { claimed, contradictions, unprovable };
    }

    // Judged against the definition in force when it was accepted, never a later one.
    const version = recordedAcceptanceVersion(l.Sales_Acceptance_Basis__c);
    if (acceptancePolicy.version !== null && version !== null && version !== acceptancePolicy.version) {
      unprovable.push(
        `it was accepted under Sales Acceptance Policy ${version} and the definition in force is now ${acceptancePolicy.version}`,
      );
      return { claimed, contradictions, unprovable };
    }

    /*
     * EVIDENCE COHERENCE, not a policy requirement. The Flow writes the time,
     * the actor and the basis in a single assignment, so a record holding one
     * without the others is internally inconsistent whatever the policy
     * declares. This is checked unconditionally for that reason - it is an
     * invariant of the writer, not a rule the business switches on.
     */
    if (l.Sales_Acceptance_Basis__c === null) {
      contradictions.push(
        'Sales acceptance was recorded with no basis stating why it was permitted',
      );
    }

    // Policy-gated. Turn the requirement off in Salesforce and this stops being tested.
    if (acceptancePolicy.requireExplicitAcceptance && l.Sales_Accepted_By__c === null) {
      contradictions.push(
        'acceptance was recorded without the authenticated identity that granted it, so no one is accountable for it',
      );
    }
    if (acceptancePolicy.requireMqlEvidence && l.MQL_Basis__c === null) {
      contradictions.push(
        'Sales acceptance was recorded while the Marketing handoff it accepted carries no qualification evidence',
      );
    }

    return { claimed, contradictions, unprovable };
  }

  /**
   * Does the qualification evidence substantiate the SQL claim?
   *
   * Governed is again decided by the record's own evidence: `SQL_Basis__c` is
   * written by the Flow at the instant it grants SQL and by nothing else.
   *
   * The recorded need and next-step date are read out of that basis rather
   * than off the live fields, because the live fields are seller inputs that
   * may legitimately have moved on since. A need that changed after
   * qualification is not evidence the qualification was wrong.
   */
  function evaluateSqlQualification(l: LeadRecord): StageVerdict {
    const claimed = l.SQL_Basis__c !== null || SQL_CLAIMING_STATUSES.includes(l.Status ?? '');
    if (!claimed) return nothingClaimed();

    const contradictions: string[] = [];
    const unprovable: string[] = [];

    if (l.SQL_Basis__c === null) {
      unprovable.push(
        'it claims sales qualification and carries no qualification evidence, so it predates the qualification architecture',
      );
      return { claimed, contradictions, unprovable };
    }

    const version = recordedSqlVersion(l.SQL_Basis__c);
    if (sqlPolicy.version !== null && version !== null && version !== sqlPolicy.version) {
      unprovable.push(
        `it was qualified under SQL Policy ${version} and the definition in force is now ${sqlPolicy.version}`,
      );
      return { claimed, contradictions, unprovable };
    }

    if (sqlPolicy.requireAcceptanceEvidence && l.Sales_Accepted_At__c === null) {
      contradictions.push(
        'it was qualified as a genuine pursuit while carrying no evidence that Sales ever accepted it',
      );
    }
    if (sqlPolicy.requireConfirmedNeed && recordedQualifiedNeed(l.SQL_Basis__c) === null) {
      contradictions.push(
        'its qualification evidence records no business need confirmed with the prospect',
      );
    }
    if (sqlPolicy.requireNextStep) {
      const recorded = recordedNextStepDate(l.SQL_Basis__c);
      const at = qualifiedAt(l);
      if (recorded === null) {
        contradictions.push('its qualification evidence records no agreed next step');
      } else if (at === null) {
        /*
         * The date is there; the event it has to be measured against is not.
         * Falling back to TODAY here is the exact mistake this control exists
         * to avoid - it would fail every correctly qualified Lead as soon as
         * its next step passed.
         */
        unprovable.push(
          `it recorded an agreed next step on ${recorded}, and nothing Salesforce retains establishes when it was qualified, so that date cannot be judged against the decision it belonged to`,
        );
      } else if (recorded < day(at)) {
        contradictions.push(
          `the next step it recorded, ${recorded}, was already in the past when it was qualified on ${day(at)}`,
        );
      }
    }

    return { claimed, contradictions, unprovable };
  }

  const failingRows: EvidenceRow[] = [];
  const notEvaluated: NotEvaluatedRecord[] = [];
  const failureCauses: string[] = [];
  const exclusionCauses: string[] = [];
  /* The judged set, in judgement order. Its length is the old counter. */
  const evaluatedRecords: RecordRef[] = [];

  for (const l of leads) {
    const sal = evaluateSalesAcceptance(l);
    const sq = evaluateSqlQualification(l);

    if (!sal.claimed && !sq.claimed) {
      notEvaluated.push({
        kind: 'outside',
        row: {
          Name: l.Name,
          Status: dash(l.Status),
          'Sales Accepted (seller input)': l.Sales_Accepted__c ? 'Yes' : 'No',
          'Acceptance Basis': dash(l.Sales_Acceptance_Basis__c),
          'SQL Basis': dash(l.SQL_Basis__c),
          Reason: `Sales acceptance / SQL integrity — this Lead's status is "${dash(
            l.Status,
          )}" and it carries no acceptance or qualification evidence, so it claims neither the Sales handoff nor sales qualification and there is nothing to substantiate.`,
          Id: l.Id,
        },
      });
      continue;
    }

    const contradictions = [...sal.contradictions, ...sq.contradictions];
    const unprovable = [...sal.unprovable, ...sq.unprovable];

    /*
     * PRECEDENCE. A demonstrated contradiction outranks an unprovable
     * condition on the same record - otherwise a real evidence conflict could
     * hide behind the half of the chain that happens to be unreadable. The
     * same convention the two lifecycle controls before this one use.
     */
    if (contradictions.length > 0) {
      failureCauses.push(contradictions[0]);
      failingRows.push({
        Name: l.Name,
        Id: l.Id,
        Status: dash(l.Status),
        'MQL Evidence': dash(l.MQL_Basis__c),
        'Sales Accepted At': dash(l.Sales_Accepted_At__c),
        'Sales Accepted By': dash(l.Sales_Accepted_By__c),
        'Acceptance Basis': dash(l.Sales_Acceptance_Basis__c),
        'Qualified Need (now)': dash(l.Qualified_Need__c),
        'Next Step Date (now)': dash(l.Next_Step_Date__c),
        'SQL Basis': dash(l.SQL_Basis__c),
        Result: `Handoff evidence conflict — ${list(contradictions)}`,
      });
      evaluatedRecords.push(refOf(l));
      continue;
    }

    if (unprovable.length > 0) {
      exclusionCauses.push(
        unprovable.some((u) => u.includes('carries none of the acceptance evidence'))
          ? 'Sales handoff claimed before the acceptance evidence existed'
          : unprovable.some((u) => u.includes('predates the qualification architecture'))
            ? 'Sales qualification claimed before the qualification evidence existed'
            : unprovable.some((u) =>
                  u.includes('nothing Salesforce retains establishes when it was qualified'),
                )
              ? 'Qualification date not retained, so the recorded next step cannot be judged'
              : 'Recorded under a superseded policy version',
      );
      notEvaluated.push({
        kind: 'unmeasurable',
        row: {
          Name: l.Name,
          Status: dash(l.Status),
          'Sales Accepted (seller input)': l.Sales_Accepted__c ? 'Yes' : 'No',
          'Acceptance Basis': dash(l.Sales_Acceptance_Basis__c),
          'SQL Basis': dash(l.SQL_Basis__c),
          Reason: `Sales acceptance / SQL integrity — ${list(
            unprovable,
          )}. NorthstarIQ cannot show the claim was wrong, only that it cannot be substantiated, so it was not counted as a failure.`,
          Id: l.Id,
        },
      });
      continue;
    }

    evaluatedRecords.push(refOf(l));
  }

  const evaluated = evaluatedRecords.length;
  const failing = failingRows.length;
  const versions = [
    `Sales Acceptance Policy ${acceptancePolicy.version ?? '(unversioned)'}`,
    `SQL Policy ${sqlPolicy.version ?? '(unversioned)'}`,
  ].join(', ');

  return build(
    {
      id: 'sales-acceptance-sql',
      title: 'Sales Handoff and Qualification Evidence Conflicts',
      category: 'Lifecycle Governance',
      severity: 'Medium',
      businessQuestion:
        'Where a Lead claims Sales acceptance or sales qualification, does the governed evidence substantiate the claim it is making?',
      businessImpact:
        'Sales should not have to repeat Marketing’s qualification to understand why a prospect was handed over, and a sales-qualified Lead should reflect what Sales established after accepting it — not the same claim restated. Where the evidence chain breaks, nobody can tell an accepted handoff from an unread one, or a genuine pursuit from an optimistic stage change.',
      failureDetail:
        failing === 0
          ? ''
          : `${failing} ${be(failing)} carrying governed handoff evidence that conflicts with the policy that permitted it`,
      population: `${evaluated} Leads whose Sales handoff claim can be checked against ${versions}`,
      orgPopulation: leads.length,
      orgPopulationNoun: 'Leads',
      evaluated,
      failing,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'MQL Evidence', label: 'Marketing Qualification Evidence' },
        { key: 'Sales Accepted At', label: 'Accepted At', mono: true },
        { key: 'Sales Accepted By', label: 'Accepted By', mono: true },
        { key: 'Acceptance Basis', label: 'Recorded Acceptance Evidence' },
        { key: 'Qualified Need (now)', label: 'Qualified Need (current value)' },
        { key: 'Next Step Date (now)', label: 'Next Step Date (current value)' },
        { key: 'SQL Basis', label: 'Recorded Qualification Evidence' },
        { key: 'Result', label: 'Result' },
      ],
      notEvaluatedColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Id', label: 'Record ID', mono: true },
        { key: 'Status', label: 'Lead Status' },
        { key: 'Sales Accepted (seller input)', label: 'Sales Accepted (seller input)' },
        { key: 'Acceptance Basis', label: 'Recorded Acceptance Evidence' },
        { key: 'SQL Basis', label: 'Recorded Qualification Evidence' },
        { key: 'Reason', label: "Why wasn't this record evaluated?" },
      ],
    },
    failingRows,
    notEvaluated,
    evaluatedRecords,
    {
      failure: tally(failureCauses, (c) => c).map(([label, count]) => ({ label, count })),
      exclusion: tally(exclusionCauses, (c) => c).map(([label, count]) => ({ label, count })),
    },
  );
}

/** The requirements each active sales policy switches on, for the investigation trail. */
export {
  acceptanceRequirementLabels as salesAcceptanceRequirements,
  sqlRequirementLabels as sqlQualificationRequirements,
};

/* -------------------------------------------------- negative control */
/**
 * Not a visible finding.
 *
 * Every governed Lead should carry a segment. On the demo org this returns
 * zero, which is the point: it is kept in the suite as proof that the engine
 * reports what it finds rather than inventing work. It is never surfaced in
 * the UI, even if it were to fail - that would be a seventh check.
 */
export function governedWithoutSegment(leads: LeadRecord[]): { evaluated: number; failing: number } {
  const population = leads.filter(isGoverned);
  return {
    evaluated: population.length,
    failing: population.filter((l) => l.Segment__c === null).length,
  };
}

/**
 * The governed definitions the four lifecycle controls consume.
 *
 * Passed in rather than fetched here for the same reason
 * `routingReadinessSources` is: these checks are pure functions over records
 * already read, so every one stays unit-testable with no network. Resolving
 * and validating the policies is `assessment.ts`'s job, and it throws when a
 * definition is missing or ambiguous rather than scoring an unreadable
 * policy as compliant.
 */
export interface LifecycleGovernance {
  graph: LifecycleGraph;
  mqlPolicy: MqlPolicy;
  mqlEligibleSegments: string[];
  acceptancePolicy: SalesAcceptancePolicy;
  sqlPolicy: SqlQualificationPolicy;
}

export function runAllChecks(
  leads: LeadRecord[],
  opps: OpportunityRecord[],
  today: Date,
  /** Active Lead Sources from Routing_Readiness_Source__mdt, per run. */
  routingReadinessSources: string[],
  /** The five governed definitions Lifecycle Governance is judged against. */
  lifecycle: LifecycleGovernance,
  /** Status transitions Salesforce still retains. Bounded and incomplete. */
  statusHistory: LeadStatusHistoryRecord[],
): CheckResult[] {
  return [
    missingFirmographics(leads, routingReadinessSources),
    segmentConsistency(leads),
    routingExceptions(leads),
    slaRisk(leads),
    ambiguousMatch(leads),
    missingTerritory(leads),
    staleOpportunities(opps, today),
    /*
     * Lifecycle Governance, in lifecycle order rather than implementation
     * order: progression, then the three stage claims a Lead makes as it
     * moves. Reading the four rows top to bottom follows the Lead.
     *
     * Each takes the governed definition it consumes. None of their
     * algorithms changed when they became scored - they were built to be
     * scored and held back only because activating them moves the model.
     */
    lifecycleProgressionIntegrity(leads, statusHistory, lifecycle.graph),
    mqlQualificationIntegrity(
      leads,
      lifecycle.mqlPolicy,
      routingReadinessSources,
      lifecycle.mqlEligibleSegments,
    ),
    salesAcceptanceSqlIntegrity(
      leads,
      lifecycle.acceptancePolicy,
      lifecycle.sqlPolicy,
      statusHistory,
    ),
    opportunityConversionIntegrity(leads),
  ];
}

/**
 * The scored set, and the API allow-list. Assessment Model v2: eleven.
 *
 * Order matters twice - it is the order `runAllChecks` returns and the order
 * a reader meets the controls - so the four lifecycle controls stay in
 * lifecycle order after the seven that preceded them.
 */
export const CHECK_IDS: CheckId[] = [
  'missing-firmographics',
  'segment-consistency',
  'routing-exceptions',
  'sla-risk',
  'ambiguous-match',
  'missing-territory',
  'stale-opportunities',
  'lifecycle-progression',
  'mql-integrity',
  'sales-acceptance-sql',
  'lifecycle-conversion',
];

export function isCheckId(value: string): value is CheckId {
  return (CHECK_IDS as string[]).includes(value);
}

export { score as checkScore };
