import type { CheckId } from './types.ts';

/**
 * THE LEAD JOURNEY - a business orientation, not the Salesforce status graph.
 *
 * Six milestones an evaluator recognises: a Lead arrives, Marketing qualifies
 * it, Sales accepts it, Sales qualifies it, Salesforce converts it, and a
 * commercial pursuit may follow. That is what the assessment is organised
 * around, and it is what this list describes.
 *
 * IT IS NOT THE GOVERNED TRANSITION GRAPH. The Lead Status value set also
 * carries the early operational statuses and Closed - Not Converted, and
 * `Lifecycle_Transition__mdt` holds the permitted moves between them. None of
 * that is reproduced here, because a diagram that looks like the metadata but
 * omits a terminal stage would be worse than one that never claimed to be the
 * metadata at all. The page says so in words, and the governed graph belongs in
 * Source Evidence.
 *
 * Opportunity is on this list and is NOT a Lead Status. It is the downstream
 * object conversion may produce - may, because Salesforce permits conversion
 * without one, so no check requires it.
 *
 * Content only. Nothing here participates in evaluation or scoring, and no
 * stage decides a result: the result comes from the check, read at render time.
 */

export interface JourneyStage {
  /** Stable key. Not a Salesforce value and never sent to Salesforce. */
  key: string;
  /** What the button says. */
  label: string;
  /** The term written out, for the panel heading. */
  expanded: string;
  /** True where the label is a Lead Status value the org actually holds. */
  isLeadStatus: boolean;
  /** Plain-English business meaning. */
  meaning: string;
  /** What NorthstarIQ looks at here. Empty where no check judges the stage. */
  checks: string;
  /**
   * The check whose result describes this stage.
   *
   * Null for Lead and Opportunity: no check judges either on its own, and
   * borrowing one to fill the panel would attribute a result to the wrong
   * place. Stage Progression is deliberately absent from every entry - it
   * judges movement BETWEEN stages, so it belongs to none of them.
   */
  relatedCheck: CheckId | null;
}

export const JOURNEY: readonly JourneyStage[] = [
  {
    key: 'lead',
    label: 'Lead',
    expanded: 'Lead',
    isLeadStatus: false,
    meaning:
      'A prospect has arrived and is being worked. Nothing has been qualified yet, so no claim has been made that later stages have to support.',
    checks: '',
    relatedCheck: null,
  },
  {
    key: 'mql',
    label: 'MQL',
    expanded: 'Marketing Qualified Lead',
    isLeadStatus: true,
    meaning: 'Marketing has said this Lead is ready for Sales, based on MQL requirements.',
    checks:
      'Whether Salesforce still has the information needed to support that MQL decision.',
    relatedCheck: 'mql-integrity',
  },
  {
    key: 'sal',
    label: 'SAL',
    expanded: 'Sales Accepted Lead',
    isLeadStatus: true,
    meaning: 'Sales has formally accepted the qualified Lead and taken it on for follow-up.',
    checks:
      'Whether the handoff carries the acceptance evidence the policy requires: who accepted it, when, and on what basis.',
    relatedCheck: 'sales-acceptance-sql',
  },
  {
    key: 'sql',
    label: 'SQL',
    expanded: 'Sales Qualified Lead',
    isLeadStatus: true,
    meaning: 'Sales has confirmed a qualified need and an agreed next step.',
    checks:
      'Whether that qualification is recorded on top of the acceptance, rather than restating it.',
    relatedCheck: 'sales-acceptance-sql',
  },
  {
    key: 'conversion',
    label: 'Conversion',
    expanded: 'Salesforce Lead Conversion',
    isLeadStatus: true,
    meaning:
      'The Lead has been converted in Salesforce, handing the outcome from Marketing to Sales.',
    checks:
      'Whether a Lead claiming conversion carries the conversion facts Salesforce itself writes.',
    relatedCheck: 'lifecycle-conversion',
  },
  {
    key: 'opportunity',
    label: 'Opportunity',
    expanded: 'Opportunity',
    isLeadStatus: false,
    meaning:
      'The pursuit has moved into the commercial pipeline. Conversion may create an Opportunity, and Salesforce permits conversion without one.',
    checks: '',
    relatedCheck: null,
  },
] as const;

/** The check that judges movement between stages rather than any single one. */
export const CROSS_STAGE_CHECK: CheckId = 'lifecycle-progression';

/**
 * Where the cross-stage control is READ - not which milestone it judges.
 *
 * IT STILL JUDGES NONE OF THEM. `relatedCheck` stays null on every stage,
 * including this one, so the control never becomes a milestone's verdict and
 * never puts a mark on a milestone chip. This is a reading position and
 * nothing more: the lifecycle assessment shows one control at a time, and the
 * control that describes the whole path is read from the stage where the path
 * begins rather than repeated under every milestone as though each owned it.
 */
export const CROSS_STAGE_VIEWED_AT = 'lead';

/** The four checks shown under Results by stage, in reading order. */
export const LIFECYCLE_CHECK_ORDER: readonly CheckId[] = [
  CROSS_STAGE_CHECK,
  'mql-integrity',
  'sales-acceptance-sql',
  'lifecycle-conversion',
] as const;

export function stageByKey(key: string): JourneyStage | null {
  return JOURNEY.find((s) => s.key === key) ?? null;
}

/**
 * How a milestone should be marked, given the state of its related check.
 *
 * FOUR STATES, BECAUSE FOUR THINGS CAN BE TRUE. `none` used to mean both
 * "the control passed" and "no control judges this milestone", which meant a
 * milestone NorthstarIQ never assessed looked exactly like one it had cleared.
 * Those are different facts and now carry different marks: a pass is stated,
 * and an unassessed milestone is left unmarked rather than given a reassuring
 * one it has not earned.
 *
 * A milestone is still never a pass or a failure in its own right - the mark
 * reports what the related CHECK found, and `relatedCheck` is null wherever no
 * check judges the milestone.
 */
export type StageMark = 'passed' | 'attention' | 'more-information' | 'none';

export function stageMark(
  stage: JourneyStage,
  check: { score: number | null; failing: number } | null | undefined,
): StageMark {
  if (stage.relatedCheck === null || !check) return 'none';
  if (check.score === null) return 'more-information';
  return check.failing > 0 ? 'attention' : 'passed';
}

/** Wording for a mark. Text, so the mark is never carried by colour alone. */
export const MARK_LABEL: Record<StageMark, string> = {
  passed: 'Passed',
  attention: 'Needs attention',
  /*
   * Not "more information needed", which reads as a request to the person
   * looking at it. The evidence is missing from Salesforce, and nothing the
   * reader does here supplies it.
   */
  'more-information': 'Unable to determine',
  none: 'Not assessed at this milestone',
};
