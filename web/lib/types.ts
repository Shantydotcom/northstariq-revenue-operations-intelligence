/**
 * NorthstarIQ assessment contract.
 *
 * Deliberately small: enough to render Overview, Findings, Finding Detail and
 * Integrations, and nothing more. No generalised rules-engine schema.
 */

export type Severity = 'High' | 'Medium' | 'Low';

export type Category =
  | 'Data Quality'
  | 'Routing'
  | 'Identity & Matching'
  | 'SLA Performance'
  | 'Pipeline Hygiene';

/** The seven implemented checks. This union is also the API allow-list. */
export type CheckId =
  | 'missing-firmographics'
  | 'segment-consistency'
  | 'routing-exceptions'
  | 'sla-risk'
  | 'ambiguous-match'
  | 'missing-territory'
  | 'stale-opportunities';

/** One column of finding evidence. `mono` renders values in a monospace face. */
export interface EvidenceColumn {
  key: string;
  label: string;
  mono?: boolean;
}

/** One evidence row: raw field values keyed by EvidenceColumn.key. */
export type EvidenceRow = Record<string, string | number | null>;

/**
 * Why a record sits outside a control's score.
 *
 * `outside` — the control does not apply to this record at all.
 * `unmeasurable` — the control applies in principle, but the process that
 * produces its evidence never ran, so there is no result to judge.
 *
 * The distinction matters: an unmeasurable record is a gap in coverage, an
 * outside record is a boundary working as intended. Collapsing them would hide
 * the first inside the second.
 */
export type NotEvaluatedKind = 'outside' | 'unmeasurable';

/**
 * One record a control did not judge.
 *
 * `Reason` is built from that record's own Salesforce values, per control - not
 * a shared message. A record can be outside one control and evaluated by the
 * next, so the reason has to name which control declined it and why.
 */
export interface NotEvaluatedRecord {
  kind: NotEvaluatedKind;
  row: EvidenceRow;
}

/**
 * One counted line of a runtime breakdown.
 *
 * Deliberately a flat list rather than a shape per check: the UI renders it
 * without knowing which control produced it, and no prose has to restate a
 * count that can change with the next assessment.
 */
export interface BreakdownLine {
  /** Operator-facing label, e.g. "Missing Employee Count", "Purchased List". */
  label: string;
  count: number;
  /** Why these records landed here. Omitted where the label says it. */
  detail?: string;
}

/**
 * The outcome of running one check.
 *
 * `evaluated` is the population the check actually judged - not the whole org.
 * That distinction is what keeps SLA scoring honest: Leads with no SLA target
 * are never counted as failures (M-07).
 */
export interface CheckResult {
  id: CheckId;
  title: string;
  category: Category;
  severity: Severity;
  businessQuestion: string;
  businessImpact: string;
  /**
   * What the failing records actually demonstrate, built from their own values.
   *
   * Not the failure predicate restated. "1 is missing Country" is a finding;
   * "1 is missing the country or the employee count" is a description of the
   * rule, and leaves the reader to open the evidence to learn which.
   *
   * Empty string when nothing failed.
   */
  failureDetail: string;
  /**
   * Every record of the relevant object this run read - the control's starting
   * point, before any eligibility rule narrows it.
   *
   * `orgPopulation = evaluated + notEvaluatedCount` always holds. A reader who
   * cannot account for the difference has found a defect, not a rounding.
   */
  orgPopulation: number;
  /** Plain-English name for that population: "Leads", "Opportunities". */
  orgPopulationNoun: string;
  /** Records this check was able to judge. */
  evaluated: number;
  /** Records that failed the check. */
  failing: number;
  /** Records this control did not judge. Always orgPopulation - evaluated. */
  notEvaluatedCount: number;
  /**
   * Of `notEvaluatedCount`, those the control applies to but has no evidence
   * for. The rest are outside the control entirely.
   */
  unmeasurableCount: number;
  notEvaluatedColumns: EvidenceColumn[];
  /** Capped for display; `notEvaluatedCount` stays the full total. */
  notEvaluatedRows: EvidenceRow[];
  /**
   * How the failures actually divide - "1 missing Country, 10 missing Employee
   * Count", not "11 missing one of two fields". Empty where the check has no
   * meaningful division.
   */
  failureBreakdown: BreakdownLine[];
  /** How the not-evaluated records divide, by the evidence that excluded them. */
  exclusionBreakdown: BreakdownLine[];
  /** 0-100. 100 when nothing was evaluated - absence of data is not failure. */
  score: number;
  /** Population description, shown so a reviewer can see what was measured. */
  population: string;
  evidenceColumns: EvidenceColumn[];
  evidence: EvidenceRow[];
  /** True when the check found nothing - kept out of the findings list. */
  healthy: boolean;
}

export interface CategoryScore {
  category: Category;
  score: number;
  checkIds: CheckId[];
}

/** Summary shown in the findings list; detail is fetched per check. */
export interface FindingSummary {
  id: CheckId;
  title: string;
  category: Category;
  severity: Severity;
  affected: number;
  /**
   * The population this check judged. Carried alongside `affected` so a summary
   * can be read as "2 of 5" rather than a bare count - the denominator is the
   * part that keeps a finding honest.
   */
  evaluated: number;
  businessImpact: string;
}

/**
 * Population facts for one control, carried for every control - not only the
 * ones that failed.
 *
 * `findings` holds failures, so a healthy control has no entry there and the
 * Overview previously had to assume its score. These carry the real numbers for
 * every control, so no count on the Overview is inferred.
 */
export interface ControlSummary {
  id: CheckId;
  category: Category;
  orgPopulation: number;
  orgPopulationNoun: string;
  evaluated: number;
  failing: number;
  notEvaluatedCount: number;
  unmeasurableCount: number;
  score: number;
}

export interface AssessmentResult {
  /** ISO timestamp of this run. */
  ranAt: string;
  /** Distinct Salesforce records read across all checks. */
  recordsAssessed: number;
  overallHealth: number;
  categoryScores: CategoryScore[];
  findings: FindingSummary[];
  /** Every control, healthy or not, with the populations behind its score. */
  controls: ControlSummary[];
  findingCount: number;
  highSeverityCount: number;
  /** Object names actually queried, for the Integrations screen. */
  objectsAssessed: string[];
}

/** Connection state. `configured` false means env vars are absent. */
export interface SalesforceStatus {
  connected: boolean;
  configured: boolean;
  environment: string;
  /** Safe, human-readable reason. Never a raw Salesforce or auth error. */
  reason?: string;
  instanceHost?: string;
}

/** Error classes surfaced to the browser. Raw errors never cross this boundary. */
export type SafeErrorCode =
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface SafeError {
  code: SafeErrorCode;
  message: string;
}
