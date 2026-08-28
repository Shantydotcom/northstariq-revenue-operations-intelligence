import { getStatus, toSafeError } from '@/lib/salesforce';
import { runAssessment } from '@/lib/assessment';
import FindingRow from '@/components/FindingRow';
import Notice, { DisconnectedNotice } from '@/components/Notice';
import { formatObservedAt } from '@/lib/presentation';
import ExportLinks from '@/components/ExportLinks';
import { applyAreaFilter, readAreaFilter } from '@/lib/area-filter';
import type { AssessmentResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * The investigation queue.
 *
 * Triage only. It answers what needs attention, how serious it is, where in
 * the revenue process it sits and how large the affected population is — then
 * hands off. The control architecture, the evidence and the Salesforce records
 * belong on the finding itself, so nothing here duplicates the Overview or the
 * detail page.
 */
export default async function FindingsPage({
  searchParams,
}: {
  /**
   * `?area=` narrows the queue to one Assessment Area, so a reader arriving
   * from Assessment lands on that area's findings rather than all of them.
   * The value is the Category itself - see lib/area-filter.ts.
   */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const filter = readAreaFilter(params.area);
  const status = await getStatus();
  if (!status.connected) {
    return (
      <>
        <h1>Findings</h1>
        <p className="lede">
          Revenue operations conditions detected in the latest Salesforce assessment, ordered by
          priority.
        </p>
        <DisconnectedNotice status={status} />
      </>
    );
  }

  let result: AssessmentResult;
  try {
    result = await runAssessment(new Date());
  } catch (err) {
    return (
      <>
        <h1>Findings</h1>
        <Notice tone="error" title="The assessment could not be completed">
          {toSafeError(err).message}
        </Notice>
      </>
    );
  }

  /*
   * Everything below counts the SHOWN findings, so the summary can never
   * disagree with the rows beneath it. `result.findings.length` stays
   * available as the unfiltered total, which is what the clear action offers.
   */
  const shown = applyAreaFilter(result.findings, filter);
  const high = shown.filter((f) => f.severity === 'High').length;
  const medium = shown.filter((f) => f.severity === 'Medium').length;
  const low = shown.filter((f) => f.severity === 'Low').length;

  return (
    <>
      <div className="page-head summit">
        <h1>Findings</h1>
        <p className="lede">
          Revenue operations conditions detected in the latest Salesforce assessment, ordered by
          priority. Each one opens the records behind it.
        </p>
      {/*
       * This page reads the org itself, so it states its own moment rather
       * than implying it shares one snapshot with the Overview.
       */}
      <p className="findings-meta">
        <span className="footnote">
          Observed from Salesforce at {formatObservedAt(result.ranAt)}.
        </span>
        {result.findings.length > 0 && filter.kind !== 'area' ? (
          <ExportLinks base="/api/export/findings" label="all findings" />
        ) : null}
      </p>
      </div>

      {/* The filter states itself, and offers the way back to the full queue. */}
      {filter.kind === 'area' ? (
        <p className="area-filter" data-testid="area-filter">
          <span className="area-filter-label">Assessment area</span>
          <span className="area-filter-value">{filter.area}</span>
          <span className="area-filter-count">
            {shown.length} of {result.findings.length} findings
          </span>
          <a className="area-filter-clear" href="/findings">
            Show all findings
          </a>
        </p>
      ) : null}

      {filter.kind === 'unknown' ? (
        <Notice title="That assessment area was not recognised">
          Nothing matches “{filter.requested}”, so every finding is shown. The area must be one
          NorthstarIQ reports.
        </Notice>
      ) : null}

      {shown.length === 0 ? (
        <Notice tone="ok" title="No findings detected">
          {filter.kind === 'area'
            ? `No finding in ${filter.area} needs attention. Other assessment areas may still have findings.`
            : 'No assessed records failed the current checks. That is a statement about the checks NorthstarIQ runs, not about the whole org.'}
        </Notice>
      ) : (
        <div className="panel">
          <dl className="queue-summary">
            <div>
              <dt>Findings</dt>
              <dd>{shown.length}</dd>
            </div>
            {high > 0 ? (
              <div>
                <dt>High priority</dt>
                <dd className="bad">{high}</dd>
              </div>
            ) : null}
            {medium > 0 ? (
              <div>
                <dt>Medium priority</dt>
                <dd>{medium}</dd>
              </div>
            ) : null}
            {low > 0 ? (
              <div>
                <dt>Low priority</dt>
                <dd>{low}</dd>
              </div>
            ) : null}
          </dl>

          <div className="queue">
            {shown.map((f) => (
              <FindingRow key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
