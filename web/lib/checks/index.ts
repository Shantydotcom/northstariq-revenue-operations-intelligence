import type { CheckId, CheckResult, EvidenceRow } from '../types.ts';
import { GOVERNED_INTAKE, type LeadRecord, type OpportunityRecord } from '../soql.ts';

/**
 * The six assessment checks.
 *
 * Each is a pure function over records already fetched, so every one is unit
 * testable against fixtures with no network. Scores come from what each check
 * actually judged, never from the whole org.
 */

/** Evidence is capped for the UI; the counts remain the full failing totals. */
const EVIDENCE_LIMIT = 10;

const isGoverned = (l: LeadRecord) => l.LeadSource === GOVERNED_INTAKE;

function score(evaluated: number, failing: number): number {
  // Nothing evaluated is not failure. A check with no population scores 100.
  if (evaluated === 0) return 100;
  return Math.round(100 * (1 - failing / evaluated));
}

function build(
  base: Omit<CheckResult, 'score' | 'healthy' | 'evidence'>,
  failingRows: EvidenceRow[],
): CheckResult {
  return {
    ...base,
    score: score(base.evaluated, base.failing),
    healthy: base.failing === 0,
    evidence: failingRows.slice(0, EVIDENCE_LIMIT),
  };
}

/* ------------------------------------------------------------------ 1 */
export function missingFirmographics(leads: LeadRecord[]): CheckResult {
  const population = leads.filter(isGoverned);
  const failing = population.filter(
    (l) => l.NumberOfEmployees === null || l.CountryCode === null,
  );
  return build(
    {
      id: 'missing-firmographics',
      title: 'Leads Missing Routing Firmographics',
      category: 'Data Quality',
      severity: 'High',
      businessQuestion:
        'Can segmentation and routing be trusted, or are governed Leads arriving without the attributes those decisions require?',
      businessImpact:
        'Employee count drives segment and country drives territory. A Lead missing either cannot be segmented or routed deterministically, so it falls to an exception path instead of a seller.',
      recommendation:
        'Enrich at capture or require the attribute on the intake form. The record already states which attribute is missing, so no investigation is needed to act.',
      population: `${population.length} governed-intake Leads`,
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Company', label: 'Company' },
        { key: 'NumberOfEmployees', label: 'Employees', mono: true },
        { key: 'CountryCode', label: 'Country', mono: true },
        { key: 'Data_Quality_Detail__c', label: 'Data Quality Detail' },
        { key: 'Id', label: 'Record Id', mono: true },
      ],
    },
    failing.map((l) => ({
      Name: l.Name,
      Company: l.Company,
      NumberOfEmployees: l.NumberOfEmployees === null ? '—' : l.NumberOfEmployees,
      CountryCode: l.CountryCode ?? '—',
      Data_Quality_Detail__c: l.Data_Quality_Detail__c,
      Id: l.Id,
    })),
  );
}

/* ------------------------------------------------------------------ 2 */
export function routingExceptions(leads: LeadRecord[]): CheckResult {
  const failing = leads.filter((l) => l.Owner?.Name === 'NIQ Routing Exception');
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
      recommendation:
        'Work the queue by exception class. Ambiguous matches need an identity decision; geography exceptions usually need a territory rule or a corrected country.',
      population: `${leads.length} Leads`,
      evaluated: leads.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Company', label: 'Company' },
        { key: 'Exception_Type__c', label: 'Exception Type' },
        { key: 'Routing_Reason__c', label: 'Routing Reason' },
        { key: 'Id', label: 'Record Id', mono: true },
      ],
    },
    failing.map((l) => ({
      Name: l.Name,
      Company: l.Company,
      Exception_Type__c: l.Exception_Type__c ?? '—',
      Routing_Reason__c: l.Routing_Reason__c,
      Id: l.Id,
    })),
  );
}

/* ------------------------------------------------------------------ 3 */
const AT_RISK = new Set(['At Risk', 'Breached', 'Breached (Late Response)']);

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
      recommendation:
        'Work breached records first, then At Risk. Where breaches cluster in one territory or segment, the coverage model - not the seller - is usually the cause.',
      population: `${population.length} Leads with an SLA target (measurable population)`,
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Segment__c', label: 'Segment' },
        { key: 'SLA_Status__c', label: 'SLA Status' },
        { key: 'SLA_Target_DateTime__c', label: 'SLA Target', mono: true },
        { key: 'First_Touch_DateTime__c', label: 'First Touch', mono: true },
        { key: 'Id', label: 'Record Id', mono: true },
      ],
    },
    failing.map((l) => ({
      Name: l.Name,
      Segment__c: l.Segment__c ?? '—',
      SLA_Status__c: l.SLA_Status__c,
      SLA_Target_DateTime__c: l.SLA_Target_DateTime__c,
      First_Touch_DateTime__c: l.First_Touch_DateTime__c ?? '—',
      Id: l.Id,
    })),
  );
}

/* ------------------------------------------------------------------ 4 */
export function ambiguousMatch(leads: LeadRecord[]): CheckResult {
  const failing = leads.filter((l) => l.Match_Status__c === 'Review');
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
      recommendation:
        'Resolve the identity by hand and record the decision. If a shared domain is legitimate - subsidiaries or franchisees - the commercial policy needs agreeing before matching can ever be automated.',
      population: `${leads.length} Leads`,
      evaluated: leads.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Company', label: 'Company' },
        { key: 'Normalized_Domain__c', label: 'Normalized Domain', mono: true },
        { key: 'Match_Status__c', label: 'Match Status' },
        { key: 'Matched_Account__c', label: 'Matched Account', mono: true },
        { key: 'Id', label: 'Record Id', mono: true },
      ],
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
  );
}

/* ------------------------------------------------------------------ 5 */
export function missingTerritory(leads: LeadRecord[]): CheckResult {
  const population = leads.filter(isGoverned);
  const failing = population.filter((l) => l.Territory__c === null);
  return build(
    {
      id: 'missing-territory',
      title: 'Governed Leads Without a Territory',
      category: 'Routing',
      severity: 'Medium',
      businessQuestion:
        'Did every governed Lead reach a territory, or did some arrive with geography the coverage model does not handle?',
      businessImpact:
        'Territory determines coverage. Without it a Lead cannot reach a coverage queue, so it waits in the exception path regardless of how good the record otherwise is.',
      recommendation:
        'Check whether the country is genuinely uncovered or simply missing. Adding a market is one Custom Metadata record - no deployment - which is the point of holding the map in configuration.',
      population: `${population.length} governed-intake Leads`,
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Lead' },
        { key: 'Company', label: 'Company' },
        { key: 'CountryCode', label: 'Country', mono: true },
        { key: 'Exception_Type__c', label: 'Exception Type' },
        { key: 'Id', label: 'Record Id', mono: true },
      ],
    },
    failing.map((l) => ({
      Name: l.Name,
      Company: l.Company,
      CountryCode: l.CountryCode ?? '—',
      Exception_Type__c: l.Exception_Type__c ?? '—',
      Id: l.Id,
    })),
  );
}

/* ------------------------------------------------------------------ 6 */
export function staleOpportunities(opps: OpportunityRecord[], today: Date): CheckResult {
  const population = opps.filter((o) => !o.IsClosed);
  const cutoff = today.toISOString().slice(0, 10);
  const failing = population.filter((o) => o.CloseDate !== null && o.CloseDate < cutoff);

  return build(
    {
      id: 'stale-opportunities',
      title: 'Open Opportunities With a Past Close Date',
      category: 'Pipeline Hygiene',
      severity: 'Medium',
      businessQuestion: 'Is the open pipeline telling the truth about when deals will land?',
      businessImpact:
        'An open Opportunity whose close date has passed silently distorts forecast, coverage and capacity planning. The pipeline looks larger and nearer than it is.',
      recommendation:
        'Re-date or close each record. Persistent slippage in one stage usually indicates a stage definition problem rather than individual seller behaviour.',
      population: `${population.length} open Opportunities`,
      evaluated: population.length,
      failing: failing.length,
      evidenceColumns: [
        { key: 'Name', label: 'Opportunity' },
        { key: 'AccountName', label: 'Account' },
        { key: 'StageName', label: 'Stage' },
        { key: 'CloseDate', label: 'Close Date', mono: true },
        { key: 'Amount', label: 'Amount', mono: true },
        { key: 'Id', label: 'Record Id', mono: true },
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
): CheckResult[] {
  return [
    missingFirmographics(leads),
    routingExceptions(leads),
    slaRisk(leads),
    ambiguousMatch(leads),
    missingTerritory(leads),
    staleOpportunities(opps, today),
  ];
}

export const CHECK_IDS: CheckId[] = [
  'missing-firmographics',
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
