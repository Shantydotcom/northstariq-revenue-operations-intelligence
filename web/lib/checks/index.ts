import type {
  BreakdownLine,
  CheckId,
  CheckResult,
  EvidenceColumn,
  EvidenceRow,
  NotEvaluatedRecord,
} from '../types.ts';
import { GOVERNED_INTAKE, type LeadRecord, type OpportunityRecord } from '../soql.ts';
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

function score(evaluated: number, failing: number): number {
  // Nothing evaluated is not failure. A check with no population scores 100.
  if (evaluated === 0) return 100;
  return Math.round(100 * (1 - failing / evaluated));
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
    | 'healthy'
    | 'evidence'
    | 'notEvaluatedCount'
    | 'unmeasurableCount'
    | 'notEvaluatedRows'
    | 'failureBreakdown'
    | 'exclusionBreakdown'
  >,
  failingRows: EvidenceRow[],
  notEvaluated: NotEvaluatedRecord[],
  breakdowns: { failure?: BreakdownLine[]; exclusion?: BreakdownLine[] } = {},
): CheckResult {
  return {
    ...base,
    score: score(base.evaluated, base.failing),
    healthy: base.failing === 0,
    evidence: failingRows.slice(0, EVIDENCE_LIMIT),
    notEvaluatedCount: notEvaluated.length,
    unmeasurableCount: notEvaluated.filter((n) => n.kind === 'unmeasurable').length,
    notEvaluatedRows: notEvaluated.slice(0, NOT_EVALUATED_LIMIT).map((n) => n.row),
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

export function runAllChecks(
  leads: LeadRecord[],
  opps: OpportunityRecord[],
  today: Date,
  /** Active Lead Sources from Routing_Readiness_Source__mdt, per run. */
  routingReadinessSources: string[],
): CheckResult[] {
  return [
    missingFirmographics(leads, routingReadinessSources),
    segmentConsistency(leads),
    routingExceptions(leads),
    slaRisk(leads),
    ambiguousMatch(leads),
    missingTerritory(leads),
    staleOpportunities(opps, today),
  ];
}

export const CHECK_IDS: CheckId[] = [
  'missing-firmographics',
  'segment-consistency',
  'routing-exceptions',
  'sla-risk',
  'ambiguous-match',
  'missing-territory',
  'stale-opportunities',
];

export function isCheckId(value: string): value is CheckId {
  return (CHECK_IDS as string[]).includes(value);
}

export { score as checkScore };
