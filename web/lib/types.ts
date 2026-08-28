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
  | 'Pipeline Hygiene'
  /*
   * Assessment Area #6, scored since Model v2.
   *
   * Its four checks are in CHECK_IDS and run with the rest. Two of them
   * currently reach no verdict, because the evidence they judge is not
   * retained in the org - which makes the area Not Scored on those two, not
   * absent from the model.
   */
  | 'Lifecycle Governance';

/**
 * Every implemented check. All eleven are in `CHECK_IDS` and all eleven run.
 *
 * Whether a check produces a SCORE is a separate question, answered per run:
 * one that judged no record is Not Scored rather than scored zero. Membership
 * of this union is what makes the presentation and traceability records
 * type-complete; `CHECK_IDS` is the API allow-list.
 */
export type CheckId =
  | 'missing-firmographics'
  | 'segment-consistency'
  | 'routing-exceptions'
  | 'sla-risk'
  | 'ambiguous-match'
  | 'missing-territory'
  | 'stale-opportunities'
  | 'lifecycle-conversion'
  | 'mql-integrity'
  | 'lifecycle-progression'
  | 'sales-acceptance-sql';

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
 * Enough of a record to name it and open it in Salesforce.
 *
 * Deliberately not the whole record: the populations a reader drills into can
 * be the entire evaluated set, and carrying full evidence for all of them
 * would be a copy of the org in the assessment payload. Failing records keep
 * their full evidence, because that is what a finding has to prove.
 */
export interface RecordRef {
  id: string;
  label: string;
}

/**
 * A population, and a sample of the records in it.
 *
 * `total` is the authoritative count, taken from the same numbers that produced
 * the score. `records` is capped, so `records.length <= total` and a reader can
 * always be told "showing 10 of 30" rather than shown a sample dressed up as
 * the whole population.
 */
export interface RecordSample {
  records: RecordRef[];
  total: number;
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
   * The same capped records as `notEvaluatedRows`, with the classification the
   * detector assigned still attached.
   *
   * `notEvaluatedRows` is the `.row` projection of this list and drops `kind`,
   * which is what made record-level "no result" indistinguishable from
   * "not applicable" downstream. Both are kept: the projection because
   * evidence tables and exports already consume it, this because the
   * distinction is a fact the detector established and nothing else can
   * recover.
   */
  notEvaluatedRecords: NotEvaluatedRecord[];
  /** The records this check judged. Same set the score was computed over. */
  checkedSample: RecordSample;
  /** Of those, the ones that did not fail. Derived from the failing set. */
  passingSample: RecordSample;
  /**
   * How the failures actually divide - "1 missing Country, 10 missing Employee
   * Count", not "11 missing one of two fields". Empty where the check has no
   * meaningful division.
   */
  failureBreakdown: BreakdownLine[];
  /** How the not-evaluated records divide, by the evidence that excluded them. */
  exclusionBreakdown: BreakdownLine[];
  /**
   * 0-100, or `null` when the control reached no pass/fail determination.
   *
   * THE MODEL v2 CONTRACT. A score is what the control OBSERVED, over the
   * records it could actually judge. `evaluated === 0` therefore has no
   * score at all - not 100, which would turn "we could not tell" into
   * "everything is fine", and not 0, which would turn it into a failure the
   * control never demonstrated.
   *
   * Model v1 returned 100 here. That branch never fired against the live org
   * - every v1 control evaluated at least four records - but it existed, and
   * the lifecycle controls are the first that can legitimately judge nothing.
   * `scoreReason` says which kind of nothing it was.
   */
  score: number | null;
  /**
   * Why there is no score. Null whenever `score` is a number.
   *
   * Derived, never authored: `evaluated === 0` plus `unmeasurableCount`
   * decides it. Two states, because they are different facts - a control
   * that found nothing to judge is a boundary working as intended, while one
   * whose records exist but carry no usable evidence is a gap in coverage.
   * Neither is a numeric distinction: both are simply unscored.
   */
  scoreReason: ScoreReason | null;
  /** Population description, shown so a reviewer can see what was measured. */
  population: string;
  evidenceColumns: EvidenceColumn[];
  evidence: EvidenceRow[];
  /** True when the check found nothing - kept out of the findings list. */
  healthy: boolean;
}

/**
 * Why a control has no numeric score.
 *
 * Deliberately two literals rather than a status enum: these are the only
 * two ways a control can reach no determination, and a general framework for
 * a set of size two would be architecture for its own sake.
 */
export type ScoreReason = 'insufficient-evidence' | 'no-applicable-records';

/** Scored controls over total controls - the coverage behind an area score. */
export interface Coverage {
  scored: number;
  total: number;
}

export interface CategoryScore {
  category: Category;
  /** Mean of the SCORED controls in this area, or null when none is scored. */
  score: number | null;
  checkIds: CheckId[];
  /**
   * How many of this area's controls produced the score above.
   *
   * Control coverage, not record coverage. The controls in an area evaluate
   * different populations - pooling them into one denominator would be a
   * precise-looking number that answers no real question. This one is
   * checkable by counting the rows on screen.
   */
  coverage: Coverage;
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
  score: number | null;
  scoreReason: ScoreReason | null;
}

export interface AssessmentResult {
  /** ISO timestamp of this run. */
  ranAt: string;
  /**
   * Which scoring model produced this result.
   *
   * Carried on the payload so an exported file and an API response stay
   * self-describing: v1 and v2 overall scores are not comparable, and a
   * number with no model beside it invites exactly that comparison.
   */
  modelVersion: string;
  /** Distinct Salesforce records read across all checks. */
  recordsAssessed: number;
  /** Mean of the scored areas, or null when no area could be scored. */
  overallHealth: number | null;
  categoryScores: CategoryScore[];
  /** How many assessment areas produced a score, of those reported. */
  areaCoverage: Coverage;
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
