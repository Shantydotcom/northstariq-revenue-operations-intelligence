import { AREAS, PRESENTATION, areaDisplayName } from './presentation.ts';
import { CATEGORIES } from './score.ts';
import { JOURNEY, MARK_LABEL, stageMark, type StageMark } from './lifecycle-journey.ts';
import type { AssessmentResult, Category, FindingSummary, Severity } from './types.ts';

/**
 * WHAT THE DASHBOARD SAYS, DERIVED FROM THE ONE RESULT.
 *
 * Dashboard orients: how much needs attention, where it is concentrated, where
 * that sits in the lifecycle, and what to look at first. Every figure below is
 * counted from the assessment result the application already produced.
 *
 * NOTHING HERE RE-DECIDES ANYTHING. No population is recomputed, no severity is
 * reassigned, no priority is invented. The findings queue is already ordered by
 * severity and then by affected records; Dashboard reads that order rather than
 * ranking anything itself. And no score is derived, exposed or implied - the
 * engine still computes one, and this file never reads it except through the
 * lifecycle mark helpers the Assessment page already uses.
 */

/** Severities in the order they are triaged, so a summary reads consistently. */
export const SEVERITY_ORDER: readonly Severity[] = ['High', 'Medium', 'Low'] as const;

export interface SeverityCount {
  severity: Severity;
  count: number;
}

/** How the findings divide by severity. Zero severities are left out. */
export function severityCounts(findings: FindingSummary[]): SeverityCount[] {
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: findings.filter((f) => f.severity === severity).length,
  })).filter((s) => s.count > 0);
}

export function countOf(findings: FindingSummary[], severity: Severity): number {
  return findings.filter((f) => f.severity === severity).length;
}

/**
 * One row per assessment area: its name, how many findings it raised, and
 * whether every control in it reached a verdict.
 *
 * `undetermined` is true only when NO control in the area reached one. A
 * partially-undetermined area is not reported as undetermined overall, because
 * the controls that did reach a verdict genuinely reported something.
 */
export interface AreaLine {
  category: Category;
  name: string;
  findings: number;
  undetermined: boolean;
}

export function areaLines(result: AssessmentResult): AreaLine[] {
  return result.categoryScores.map((area) => {
    const controls = result.controls.filter((c) => c.category === area.category);
    return {
      category: area.category,
      name: areaDisplayName(area.category),
      findings: result.findings.filter((f) => f.category === area.category).length,
      undetermined: controls.length > 0 && controls.every((c) => c.score === null),
    };
  });
}

export interface AreaCoverage {
  total: number;
  withFindings: number;
  clear: number;
  undetermined: number;
}

/**
 * How the areas divide. `clear` counts areas that raised nothing AND reached a
 * verdict - an area nothing could be determined for is not "no issues found".
 */
export function areaCoverage(lines: AreaLine[]): AreaCoverage {
  return {
    total: lines.length,
    withFindings: lines.filter((a) => a.findings > 0).length,
    clear: lines.filter((a) => a.findings === 0 && !a.undetermined).length,
    undetermined: lines.filter((a) => a.undetermined).length,
  };
}

/** The findings to look at first, in the order the queue already put them. */
export interface Priority {
  id: FindingSummary['id'];
  title: string;
  area: string;
  severity: Severity;
}

export function topPriorities(result: AssessmentResult, limit = 3): Priority[] {
  return result.findings.slice(0, limit).map((f) => ({
    id: f.id,
    title: PRESENTATION[f.id].label,
    area: areaDisplayName(f.category),
    severity: f.severity,
  }));
}

/**
 * Where attention sits on the governed lifecycle.
 *
 * ORIENTATION, NOT A VERDICT ON THE MILESTONE. Each entry reports the state of
 * the control that judges that milestone, read with the same `stageMark` the
 * Assessment page uses so the two pages cannot disagree. Lead and Opportunity
 * name no control: they carry `none` and are labelled as unassessed rather than
 * given a reassuring mark they have not earned.
 *
 * Lifecycle behaviour is implemented but not yet validated against controlled
 * synthetic milestone data, which is exactly why nothing here invents a status:
 * a milestone with no control shows no marker at all.
 */
export interface LifecycleStage {
  key: string;
  label: string;
  mark: StageMark;
  /** The words for the mark. Never carried by colour alone. */
  markLabel: string;
  /** True where a control judges this milestone. */
  assessed: boolean;
}

export function lifecycleStages(result: AssessmentResult): LifecycleStage[] {
  return JOURNEY.map((stage) => {
    const control = stage.relatedCheck
      ? (result.controls.find((c) => c.id === stage.relatedCheck) ?? null)
      : null;
    const mark = stageMark(stage, control);
    return {
      key: stage.key,
      label: stage.label,
      mark,
      markLabel: MARK_LABEL[mark],
      assessed: stage.relatedCheck !== null && control !== null,
    };
  });
}

/**
 * What to look at next.
 *
 * DETERMINISTIC, AND NOT A RECOMMENDATION ENGINE. It is a lookup over counts
 * the result already holds: the highest severity present decides the sentence,
 * and the figures inside it are that severity's count. No model, no inference,
 * no ranking of its own - and it always sends the reader to a page that exists.
 */
export interface NextStep {
  headline: string;
  detail: string;
  /** Absent when there is nothing to investigate. */
  action?: { label: string; href: string };
}

export function recommendedNextStep(result: AssessmentResult): NextStep {
  const investigate =
    'Investigate the affected Salesforce records and supporting evidence before deciding whether remediation is appropriate.';

  for (const severity of SEVERITY_ORDER) {
    const n = countOf(result.findings, severity);
    if (n === 0) continue;
    return {
      headline: `Review the ${n} ${severity}-priority ${n === 1 ? 'finding' : 'findings'} first.`,
      detail: investigate,
      /*
       * Findings, unfiltered. The queue is already ordered by severity, and no
       * severity filter exists on that route - linking to one would be an
       * action the application cannot honour, and adding one would mean
       * changing Findings.
       */
      action: { label: 'View findings', href: '/findings' },
    };
  }

  return {
    headline: 'No finding needs attention from this run.',
    detail:
      'That is a statement about the controls NorthstarIQ ran, not about the whole org. Assessment shows what was evaluated and which records each control could not judge.',
    action: { label: 'View assessment details', href: '/assessment' },
  };
}

/**
 * The six areas and their questions, without a result.
 *
 * The first-run state has no assessment to read, so it describes the scope
 * instead - names and questions from the same `AREAS` map every other page
 * uses. It deliberately states no per-area control count: which checks belong
 * to which area is established by the detectors at run time, and inventing a
 * second static mapping here to fill a card would be a second source of truth.
 */
export interface ScopeArea {
  category: Category;
  name: string;
  question: string;
}

export function scopeAreas(): ScopeArea[] {
  return CATEGORIES.map((category) => ({
    category,
    name: areaDisplayName(category),
    question: AREAS[category].question,
  }));
}
