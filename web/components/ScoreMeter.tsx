import { meterClass } from '@/lib/score-bands';

/*
 * The bands live in lib/score-bands.ts and are re-exported here, so every
 * existing `from './ScoreMeter'` import keeps working while a test can reach
 * the rules without loading React.
 */
export { healthLabel, meterClass } from '@/lib/score-bands';

/**
 * What to render where a score would go when there is no score.
 *
 * Model v2 leaves a control unscored when it reached no pass or fail. That
 * is neither a band nor a number, so it never touches `meterClass` or
 * `healthLabel` — a colour would claim a judgement, and 0 or 100 would
 * claim the wrong one. Callers guard on null and render this instead.
 */
export const NOT_SCORED = 'Not scored';

/** Why a control has no score, in the evaluator's language. */
export function notScoredReason(reason: 'insufficient-evidence' | 'no-applicable-records' | null) {
  return reason === 'no-applicable-records' ? 'No applicable records' : 'Insufficient evidence';
}

/**
 * The bar is decoration over a number that is always rendered beside it, so it
 * stays `presentation` and adds nothing for a screen reader to re-read.
 *
 * A score of zero renders no fill: any positive width would imply a nonzero
 * score. The `zero` modifier exists so the empty state can carry a boundary
 * strong enough to be told apart from a meter that failed to render; the
 * contrast requirement for that boundary is stated in globals.css.
 */
export default function ScoreMeter({ score }: { score: number }) {
  return (
    <div className={score === 0 ? 'meter zero' : 'meter'} role="presentation">
      {score > 0 ? <span className={meterClass(score)} style={{ width: `${score}%` }} /> : null}
    </div>
  );
}
