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

/** The six implemented checks. This union is also the API allow-list. */
export type CheckId =
  | 'missing-firmographics'
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
  recommendation: string;
  /** Records this check was able to judge. */
  evaluated: number;
  /** Records that failed the check. */
  failing: number;
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

export interface AssessmentResult {
  /** ISO timestamp of this run. */
  ranAt: string;
  /** Distinct Salesforce records read across all checks. */
  recordsAssessed: number;
  overallHealth: number;
  categoryScores: CategoryScore[];
  findings: FindingSummary[];
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
