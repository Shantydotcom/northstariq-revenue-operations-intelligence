/**
 * The score bands, in one place.
 *
 * Two breakpoints - 70 and 90 - shared by the meter fill, the health word and
 * the numeric score wherever it is rendered. They live here rather than inside
 * the meter component for two reasons: a band is a presentation rule, not a
 * drawing detail, and a rule the whole interface keys off should be reachable
 * by a test without loading React.
 *
 * They were previously reachable only through `ScoreMeter.tsx`, which the
 * node test runner cannot import. Finding Detail consequently grew its own
 * rule - colour the score if any record failed - and a control scoring 96
 * rendered as critical. One home for the bands is what prevents that.
 *
 * These are reading aids for a number that is always displayed beside them.
 * They are not grades, and no band claims anything the score does not.
 */

/** Colour is a reading aid, never the only signal - the number is always shown. */
export function meterClass(score: number): string {
  if (score < 70) return 'bad';
  if (score < 90) return 'warn';
  return '';
}

/** A word for the number, on the same two breakpoints the meter uses. */
export function healthLabel(score: number): string {
  if (score < 70) return 'Needs attention';
  if (score < 90) return 'Needs review';
  return 'Healthy';
}
