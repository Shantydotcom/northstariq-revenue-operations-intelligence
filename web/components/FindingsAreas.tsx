import Link from 'next/link';
import { areaDisplayName, checkDisplayName } from '@/lib/presentation';
import { areaFilterHref } from '@/lib/area-filter';
import { STATUS_LABEL, checkStatus, outcomeSentence } from '@/lib/assessment-view';
import type { AssessmentResult, Category } from '@/lib/types';

/**
 * THE REVENUE OPERATIONS CONTROLS, ON THE PAGE THAT INVESTIGATES THEM.
 *
 * The Assessment page used to list every area and every check beside its
 * populations. That answered "what needs attention?", which is this page's
 * question, so it was moved here rather than kept in two places.
 *
 * It is deliberately NOT the same treatment. A finding is already a row in the
 * queue below, so nothing here restates one: the band is navigation and
 * coverage, and the list beneath the queue names only the controls that raised
 * nothing. Between them every control the run executed is accounted for -
 * which the queue alone cannot do, because a control that found nothing has no
 * row in it.
 */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Every assessment area, with how much of it needs attention.
 *
 * Counts come from the findings already on the page and the check ids already
 * on the area, so this cannot disagree with the queue beneath it.
 */
export function AreaIndex({ result }: { result: AssessmentResult }) {
  return (
    <nav className="fx-areas" aria-label="Findings by assessment area">
      <p className="fx-areas-label">Revenue operations areas</p>
      <ul>
        {result.categoryScores.map((area) => {
          const needing = result.findings.filter((f) => f.category === area.category).length;
          return (
            <li key={area.category}>
              <Link
                className={`fx-area${needing > 0 ? ' needs-attention' : ''}`}
                href={areaFilterHref(area.category)}
              >
                <span className="fx-area-name">{areaDisplayName(area.category)}</span>
                <span className="fx-area-meta">
                  {area.checkIds.length} {plural(area.checkIds.length, 'check', 'checks')}
                  {' · '}
                  {needing > 0 ? (
                    <span className="fx-area-needs">
                      {needing} {plural(needing, 'needs', 'need')} attention
                    </span>
                  ) : (
                    'nothing to report'
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The controls that ran and raised nothing.
 *
 * Without this a reader cannot tell a control that passed from one that was
 * never executed. Scoped to the same area filter as the queue, so the page
 * describes one set of checks and not two.
 */
export function QuietChecks({
  result,
  area,
}: {
  result: AssessmentResult;
  /** Null when the queue is unfiltered. */
  area: Category | null;
}) {
  const raised = new Set(result.findings.map((f) => f.id));
  const quiet = result.controls
    .filter((c) => !raised.has(c.id))
    .filter((c) => area === null || c.category === area);

  if (quiet.length === 0) return null;

  return (
    <section className="fx-quiet" aria-labelledby="fx-quiet-h">
      <h2 className="eyebrow" id="fx-quiet-h">
        Also checked — nothing to investigate
      </h2>
      <p className="footnote">
        {quiet.length} {plural(quiet.length, 'control', 'controls')}{' '}
        {plural(quiet.length, 'ran and raised', 'ran and raised')} no finding. A control that
        reached no result is not a pass.
      </p>
      <ul className="fx-quiet-list">
        {quiet.map((c) => {
          const status = checkStatus(c);
          return (
            <li key={c.id}>
              <span className="fx-quiet-head">
                <span className="fx-quiet-name">{checkDisplayName(c.id)}</span>
                <span className={`check-status is-${status}`}>
                  <span className="check-status-mark" aria-hidden="true" />
                  {STATUS_LABEL[status]}
                </span>
                <span className="fx-quiet-area">{areaDisplayName(c.category)}</span>
              </span>
              <span className="fx-quiet-outcome">{outcomeSentence(c)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
