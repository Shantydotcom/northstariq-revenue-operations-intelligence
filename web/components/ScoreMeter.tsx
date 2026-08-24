/** Colour is a reading aid, never the only signal — the number is always shown. */
export function meterClass(score: number): string {
  if (score < 70) return 'bad';
  if (score < 90) return 'warn';
  return '';
}

/**
 * A word for the number, on the same two breakpoints the meter already uses.
 *
 * It is a reading aid for a score the reader can see, not a grade and not a
 * threshold the business agreed. No band claims anything the score does not.
 */
export function healthLabel(score: number): string {
  if (score < 70) return 'Needs attention';
  if (score < 90) return 'Needs review';
  return 'Healthy';
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
