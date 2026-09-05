import type {
  AssessmentResult,
  Category,
  CategoryScore,
  CheckResult,
  ControlSummary,
  Coverage,
  FindingSummary,
} from './types.ts';

/**
 * Deterministic scoring. No weights, no AI, no hidden adjustment.
 *
 * A reviewer can trace every number:
 *   record outcomes -> check score -> area score -> overall health
 *
 * ONE RULE CARRIES THE WHOLE MODEL: a score is the mean of what was actually
 * scored. A control that judged no record has no score, an area made only of
 * such controls has no score, and neither is averaged in as a number. What
 * is left out is reported as coverage rather than absorbed silently.
 */

/**
 * The scoring model that produced a result.
 *
 * A version names three things TOGETHER: the active control set, the assessment
 * area composition, and the scoring and eligibility rules. Any one of the three
 * moving is a new model, because any one of the three can move the numbers. One
 * constant, read by the result, the UI and the export - no component writes the
 * string itself.
 *
 * v1 was five areas and seven controls, and scored a control with nothing
 * evaluated as 100. v2 is six areas and eleven controls, and leaves such a
 * control unscored. Both the weighting and the eligibility changed, so v1 and
 * v2 overall scores are not comparable - which is precisely why a result
 * carries this.
 *
 * v3 is six areas and twelve controls. It adds `closed-lost-reason` to Pipeline
 * Hygiene, moving that area from one active control to two. The scoring formula
 * and the zero-evaluated eligibility rule are UNCHANGED from v2: this is a
 * composition change, not a new algorithm. But an area scores as the mean of its
 * scored controls, so Pipeline Hygiene - and through it overall health - can
 * land differently on identical Salesforce data. v2 and v3 results are not
 * claimed to always differ; they are simply not guaranteed comparable, because
 * the active assessment definition behind them is not the same one.
 *
 * v4 is six areas and FOURTEEN controls. It activates the two Step 9 controls
 * that were already implemented and locally validated but deliberately held
 * unregistered: `revenue-handoff-integrity` (PD-21) and
 * `forecast-commitment-integrity` (PD-23). Both join Pipeline Hygiene, taking
 * that area from two active controls to four. The scoring formula and the
 * zero-evaluated eligibility rule are again UNCHANGED - v4 is a composition
 * change, not a new algorithm - and no area was added.
 *
 * ⚠️ v3 AND v4 ARE NOT COMPARABLE, and the difference is not cosmetic.
 * `revenue-handoff-integrity` judges a non-empty population, so it contributes
 * a real score to Pipeline Hygiene and through it to overall health.
 * `forecast-commitment-integrity` currently judges NO record, so it is Not
 * Scored and is excluded from the mean rather than counted as 100 - the same
 * eligibility rule v2 introduced, now reached by a control whose population is
 * legitimately empty rather than unmeasurable.
 */
export const MODEL_VERSION = 'v4';

/** Display order for the Overview. */
/**
 * The six Assessment Areas, in reporting order.
 *
 * Exported because the Findings area filter validates against it: one list, so
 * a filter can never accept an area the assessment does not report.
 */
export const CATEGORIES: readonly Category[] = [
  'Data Quality',
  'Routing',
  'Identity & Matching',
  'SLA Performance',
  'Pipeline Hygiene',
  /* Assessment Area #6, scored since Model v2. */
  'Lifecycle Governance',
];

/** Mean of a non-empty list of scores, rounded. */
const meanScore = (scores: number[]) =>
  Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

/**
 * An area scores as the MEAN of the controls in it that produced a score.
 *
 * Mean, not minimum: one poor control should not erase an area that is
 * otherwise healthy. Scored controls only: a control that judged nothing has
 * no opinion to average, and giving it one - high or low - would let the
 * absence of evidence move a number that is supposed to report evidence.
 *
 * `coverage` carries what that exclusion cost, so the area score is never
 * read without knowing how much of the area stands behind it. An area with no
 * scored control is reported with `score: null` rather than dropped, because
 * its controls and their populations are still worth seeing.
 */
export function categoryScores(results: CheckResult[]): CategoryScore[] {
  const out: CategoryScore[] = [];
  for (const category of CATEGORIES) {
    const inCategory = results.filter((r) => r.category === category);
    if (inCategory.length === 0) continue;
    const scored = inCategory
      .map((r) => r.score)
      .filter((s): s is number => s !== null);
    out.push({
      category,
      score: scored.length === 0 ? null : meanScore(scored),
      checkIds: inCategory.map((r) => r.id),
      coverage: { scored: scored.length, total: inCategory.length },
    });
  }
  return out;
}

/**
 * Overall health is the mean of the SCORED areas - equally weighted.
 *
 * The same rule one level up. An unscored area is not averaged in as 100 or
 * as 0; it is left out, and `areaCoverage` says so. Null when nothing at all
 * could be scored, because an assessment that judged nothing has no health to
 * report - a bare 100 there would be the largest overclaim in the product.
 */
export function overallHealth(categories: CategoryScore[]): number | null {
  const scored = categories.map((c) => c.score).filter((s): s is number => s !== null);
  return scored.length === 0 ? null : meanScore(scored);
}

/** How many reported areas produced a score. */
export function areaCoverage(categories: CategoryScore[]): Coverage {
  return {
    scored: categories.filter((c) => c.score !== null).length,
    total: categories.length,
  };
}

/** Healthy checks are not findings. Sorted most severe, then most affected. */
export function toFindings(results: CheckResult[]): FindingSummary[] {
  const rank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  return results
    .filter((r) => !r.healthy)
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      severity: r.severity,
      affected: r.failing,
      evaluated: r.evaluated,
      businessImpact: r.businessImpact,
    }))
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.affected - a.affected);
}

/**
 * Population facts for every control, healthy or not.
 *
 * `findings` holds failures only, so the Overview could previously only infer a
 * healthy control's numbers. These are the real ones, carried for all six, so
 * every count a reader sees came from the check that produced it.
 */
export function toControls(results: CheckResult[]): ControlSummary[] {
  return results.map((r) => ({
    id: r.id,
    category: r.category,
    orgPopulation: r.orgPopulation,
    orgPopulationNoun: r.orgPopulationNoun,
    evaluated: r.evaluated,
    failing: r.failing,
    notEvaluatedCount: r.notEvaluatedCount,
    unmeasurableCount: r.unmeasurableCount,
    score: r.score,
    scoreReason: r.scoreReason,
    exclusionBreakdown: r.exclusionBreakdown,
  }));
}

export function buildAssessment(
  results: CheckResult[],
  recordsAssessed: number,
  objectsAssessed: string[],
  ranAt: string,
): AssessmentResult {
  const categories = categoryScores(results);
  const findings = toFindings(results);
  return {
    ranAt,
    modelVersion: MODEL_VERSION,
    recordsAssessed,
    overallHealth: overallHealth(categories),
    categoryScores: categories,
    areaCoverage: areaCoverage(categories),
    findings,
    controls: toControls(results),
    findingCount: findings.length,
    highSeverityCount: findings.filter((f) => f.severity === 'High').length,
    objectsAssessed,
  };
}
