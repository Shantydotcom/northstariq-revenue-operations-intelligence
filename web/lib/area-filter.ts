import { CATEGORIES } from './score.ts';
import type { Category, FindingSummary } from './types.ts';

/**
 * Findings filtered to one Assessment Area.
 *
 * The area identifier IS the Category value already carried on every finding.
 * A slug table would be a second taxonomy to keep in step with the first, and
 * the only thing it would buy is a prettier URL.
 */

/** True when `value` is one of the six Assessment Areas. */
export function isCategory(value: string | undefined): value is Category {
  return value !== undefined && (CATEGORIES as readonly string[]).includes(value);
}

/**
 * How a request for `?area=` was resolved.
 *
 * `unknown` is deliberately not the same as `none`: an unrecognised area must
 * say so rather than silently showing everything, which would look like the
 * filter worked and found nothing to exclude.
 */
export type AreaFilter =
  | { kind: 'none' }
  | { kind: 'area'; area: Category }
  | { kind: 'unknown'; requested: string };

/** Reads one search-param value. Arrays and blanks resolve to no filter. */
export function readAreaFilter(raw: string | string[] | undefined): AreaFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value.trim() === '') return { kind: 'none' };
  if (isCategory(value)) return { kind: 'area', area: value };
  return { kind: 'unknown', requested: value };
}

/**
 * Applies the filter.
 *
 * An unknown area returns every finding, because hiding the queue behind a
 * typo helps nobody. The page says the filter was not recognised.
 */
export function applyAreaFilter(
  findings: FindingSummary[],
  filter: AreaFilter,
): FindingSummary[] {
  return filter.kind === 'area' ? findings.filter((f) => f.category === filter.area) : findings;
}

/** The href for filtering to one area. Encoding is what makes "&" survive. */
export function areaFilterHref(area: Category): string {
  return `/findings?area=${encodeURIComponent(area)}`;
}
