import type {
  AssessmentResult,
  Category,
  CategoryScore,
  CheckResult,
  ControlSummary,
  FindingSummary,
} from './types.ts';

/**
 * Deterministic scoring. No weights, no AI, no hidden adjustment.
 *
 * A reviewer can trace every number:
 *   record outcomes -> check score -> category score -> overall health
 */

/** Display order for the Overview. */
const CATEGORY_ORDER: Category[] = [
  'Data Quality',
  'Routing',
  'Identity & Matching',
  'SLA Performance',
  'Pipeline Hygiene',
  /*
   * Listed so the order is settled when Lifecycle Governance is scored.
   * `categoryScores` skips a category holding no results, so while no
   * lifecycle control is executed this entry changes nothing: the assessment
   * still reports five areas and the same overall health.
   */
  'Lifecycle Governance',
];

/**
 * A category containing several checks scores as the MEAN of its check scores.
 * Mean, not minimum: one poor check should not erase a category that is
 * otherwise healthy.
 */
export function categoryScores(results: CheckResult[]): CategoryScore[] {
  const out: CategoryScore[] = [];
  for (const category of CATEGORY_ORDER) {
    const inCategory = results.filter((r) => r.category === category);
    if (inCategory.length === 0) continue;
    const mean = inCategory.reduce((sum, r) => sum + r.score, 0) / inCategory.length;
    out.push({
      category,
      score: Math.round(mean),
      checkIds: inCategory.map((r) => r.id),
    });
  }
  return out;
}

/** Overall health is the mean of the category scores - equally weighted. */
export function overallHealth(categories: CategoryScore[]): number {
  if (categories.length === 0) return 100;
  const mean = categories.reduce((sum, c) => sum + c.score, 0) / categories.length;
  return Math.round(mean);
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
    recordsAssessed,
    overallHealth: overallHealth(categories),
    categoryScores: categories,
    findings,
    controls: toControls(results),
    findingCount: findings.length,
    highSeverityCount: findings.filter((f) => f.severity === 'High').length,
    objectsAssessed,
  };
}
