import { PRESENTATION } from './presentation.ts';
import type { AssessmentResult, Category, CategoryScore, ControlSummary } from './types.ts';

/**
 * Presentation arithmetic for the Assessment page.
 *
 * Everything here reads the assessment result and returns something to render.
 * Nothing re-derives a population, re-decides a pass or a fail, or holds a
 * number of its own: a figure this file cannot get from the result is a figure
 * the page does not show.
 */

/** The area given the process treatment, because its checks describe one. */
export const LIFECYCLE_AREA: Category = 'Lifecycle Governance';

const NUM = new Intl.NumberFormat('en-US');

/** "1 Opportunity", not "1 Opportunities". The nouns arrive plural. */
export function noun(plural: string, count: number): string {
  return count === 1 && plural.endsWith('s') ? plural.slice(0, -1) : plural;
}

/**
 * WHAT A CHECK CONCLUDED, WITHOUT A NUMBER.
 *
 * The assessment page states outcomes, not scores. These are the only three
 * states the engine can produce, and each is read from the result rather than
 * re-derived: `score === null` is the engine's own "this check reached no
 * verdict" flag, set when a check had nothing it could judge. The score itself
 * is never rendered - it is read here only as that flag, so the page cannot
 * drift from the engine's own classification.
 */
export type CheckStatus = 'passed' | 'failed' | 'no-result';

export function checkStatus(c: ControlSummary): CheckStatus {
  if (c.score === null) return 'no-result';
  return c.failing > 0 ? 'failed' : 'passed';
}

/**
 * The words for each state.
 *
 * "Unable to determine" rather than "No result" or "Not scored". All three name
 * the same state, but only this one names it from the reader's side: the
 * control applies to these records and NorthstarIQ could not reach a verdict on
 * them from what Salesforce holds. It is never a request for the reader to
 * supply something - the evidence is missing from the org, not from them.
 */
export const STATUS_LABEL: Record<CheckStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  'no-result': 'Unable to determine',
};

/**
 * WHICH EVIDENCE WAS ABSENT, in the detector's own words.
 *
 * "Salesforce does not hold enough evidence" is true and useless: it names no
 * field and gives a reader nothing to look for. Every detector already records
 * a cause each time it declines to judge a record, so this reads that tally
 * back rather than inventing an explanation. A count is shown only where the
 * causes divide - one cause covering every undetermined record needs no
 * figure repeated after it.
 *
 * Null where the control declined nothing, which is every control that reached
 * a verdict.
 */
export function missingEvidence(c: ControlSummary): string | null {
  const lines = c.exclusionBreakdown;
  if (lines.length === 0) return null;
  const single = lines.length === 1 && lines[0].count === c.unmeasurableCount;
  return lines
    .map((b) => (single ? b.label : `${b.label} (${NUM.format(b.count)})`))
    .join('; ');
}

/**
 * The check's outcome in one sentence, built from its own numbers.
 *
 * Nothing here is written per check. A failure uses the check's own finding
 * sentence - the same string the findings queue and the finding page state -
 * so the assessment cannot describe a failure differently from the page a
 * reader opens next.
 */
export function outcomeSentence(c: ControlSummary): string {
  const p = PRESENTATION[c.id];
  switch (checkStatus(c)) {
    case 'no-result': {
      const n = c.unmeasurableCount;
      const why = missingEvidence(c);
      return (
        `${NUM.format(n)} ${noun(c.orgPopulationNoun, n)} make this claim, and Salesforce holds no evidence that can settle ${
          n === 1 ? 'it' : 'them'
        }` + (why === null ? '.' : `: ${why}.`)
      );
    }
    case 'failed':
      return p.finding(c.failing, c.evaluated);
    default:
      return `All ${NUM.format(c.evaluated)} ${p.populationNoun} passed this check.`;
  }
}

/**
 * What the run found about movement BETWEEN stages.
 *
 * Read from the cross-stage check every time it is rendered. There is no
 * success string that can survive a failing progression check: each branch is
 * reached only from the state it describes.
 */
export interface ProgressionNote {
  status: CheckStatus;
  text: string;
}

export function progressionNote(control: ControlSummary | null): ProgressionNote | null {
  if (!control) return null;
  const status = checkStatus(control);
  if (status === 'passed') {
    return { status, text: 'All recorded lifecycle transitions followed an allowed path.' };
  }
  if (status === 'failed') {
    return {
      status,
      text: `${NUM.format(control.failing)} of ${NUM.format(control.evaluated)} ${noun(
        control.orgPopulationNoun,
        control.evaluated,
      )} recorded a lifecycle transition the governed policy does not allow.`,
    };
  }
  return {
    status,
    text: 'Salesforce does not retain enough history to determine whether these transitions were allowed.',
  };
}

/**
 * The lifecycle area and the rest, kept apart.
 *
 * Both halves come from the same `categoryScores`, so the page cannot show a
 * different set of areas from the one the assessment scored.
 */
export interface AreaSplit {
  lifecycle: CategoryScore | null;
  standard: CategoryScore[];
}

export function splitAreas(categories: CategoryScore[]): AreaSplit {
  return {
    lifecycle: categories.find((c) => c.category === LIFECYCLE_AREA) ?? null,
    standard: categories.filter((c) => c.category !== LIFECYCLE_AREA),
  };
}

/** A control by id, or null. The page never assumes one is present. */
export function controlOf(result: AssessmentResult, id: string): ControlSummary | null {
  return result.controls.find((c) => c.id === id) ?? null;
}

/**
 * The four population figures for one check.
 *
 * Each total is the authoritative count from the result, never the length of a
 * retained sample. `notApplicable` is what is left of the not-evaluated records
 * once the unmeasurable ones are taken out - the boundary, not the gap.
 */
export interface PopulationCounts {
  checked: number;
  passed: number;
  failed: number;
  noResult: number;
  notApplicable: number;
}

export function populationCounts(c: ControlSummary): PopulationCounts {
  return {
    checked: c.evaluated,
    passed: c.evaluated - c.failing,
    failed: c.failing,
    noResult: c.unmeasurableCount,
    notApplicable: c.notEvaluatedCount - c.unmeasurableCount,
  };
}

/**
 * What to say above a record list that may be shorter than its population.
 *
 * Null when the list is complete. A caller that ignores this is presenting a
 * sample as the whole population, which is the one thing these panels must
 * never do.
 */
export function samplingNote(shown: number, total: number): string | null {
  return shown < total ? `Showing ${shown} of ${total}` : null;
}

/**
 * The population every control in the area started from.
 *
 * THE SCOPE OF THE ASSESSMENT, NOT THE POPULATION OF A CONTROL. Each lifecycle
 * control reads the same set of Leads and then narrows it to the ones that make
 * a claim at its milestone; `orgPopulation` is that starting set, before any
 * narrowing. It is the denominator the whole area reconciles against -
 * checked + undetermined + not claimed - and the only figure on the page that
 * describes the org rather than a control.
 *
 * Null unless every control agrees on it. Two controls reading different
 * objects have no shared scope to state, and inventing one by taking the
 * largest would be a number describing no set of records.
 */
export interface LifecycleScope {
  count: number;
  noun: string;
}

export function lifecycleScope(
  controls: ControlSummary[],
  checkIds: readonly string[],
): LifecycleScope | null {
  const present = checkIds
    .map((id) => controls.find((c) => c.id === id))
    .filter((c): c is ControlSummary => c !== undefined);
  if (present.length === 0) return null;

  const [first] = present;
  const agreed = present.every(
    (c) =>
      c.orgPopulation === first.orgPopulation && c.orgPopulationNoun === first.orgPopulationNoun,
  );
  if (!agreed) return null;

  return { count: first.orgPopulation, noun: noun(first.orgPopulationNoun, first.orgPopulation) };
}

/**
 * THE WHOLE POPULATION OF ONE CONTROL, IN ONE SENTENCE.
 *
 * It replaces a paragraph that explained the column names and then asserted
 * that they add up. The columns are on screen and the reader can add them up;
 * what they could not get was what the three groups MEAN for this control -
 * and that differs per control, which is exactly why one general paragraph
 * could not carry it.
 *
 * Every figure is read from the result. The only authored words are the
 * per-control predicate for the records outside the control, which lives in
 * `presentation.ts` beside the rest of that control's copy. A clause is
 * dropped when its count is zero rather than printed as "0".
 *
 * Null when the control judged its whole population - there is no story to
 * tell about records it did not judge.
 */
export function populationStory(c: ControlSummary): string | null {
  const p = populationCounts(c);
  const clauses: string[] = [];

  if (p.checked > 0) {
    clauses.push(`${NUM.format(p.checked)} could be judged`);
  }
  if (p.noResult > 0) {
    /*
     * Claim-neutral on purpose. Three of Stage Progression's six recorded a
     * move rather than a claim, so "make the claim" would be wrong for this
     * control while being right for the other three. Being counted apart from
     * the not-claimed group already says these are inside the control.
     */
    clauses.push(
      `${NUM.format(p.noResult)} could not be settled from what Salesforce retains`,
    );
  }
  if (p.notApplicable > 0) {
    const predicate = PRESENTATION[c.id].explain.notClaimed;
    clauses.push(
      `${NUM.format(p.notApplicable)} ${predicate ?? 'fall outside what this control judges'}`,
    );
  }

  if (clauses.length <= 1) return null;

  const last = clauses.pop() as string;
  return `Of the ${NUM.format(c.orgPopulation)} ${c.orgPopulationNoun} in scope, ${clauses.join(
    ', ',
  )} and ${last}.`;
}

