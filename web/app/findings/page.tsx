import { getStatus, toSafeError } from '@/lib/salesforce';
import { runAssessment } from '@/lib/assessment';
import FindingRow from '@/components/FindingRow';
import Notice, { DisconnectedNotice } from '@/components/Notice';
import { formatObservedAt } from '@/lib/presentation';
import ExportLinks from '@/components/ExportLinks';
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
export default async function FindingsPage() {
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

  const high = result.findings.filter((f) => f.severity === 'High').length;
  const medium = result.findings.filter((f) => f.severity === 'Medium').length;
  const low = result.findings.filter((f) => f.severity === 'Low').length;

  return (
    <>
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
        {result.findings.length > 0 ? (
          <ExportLinks base="/api/export/findings" label="all findings" />
        ) : null}
      </p>

      {result.findings.length === 0 ? (
        <Notice tone="ok" title="No findings detected">
          No assessed records failed the current controls. That is a statement about the six checks
          NorthstarIQ runs, not about the whole org.
        </Notice>
      ) : (
        <>
          <dl className="queue-summary">
            <div>
              <dt>Findings</dt>
              <dd>{result.findings.length}</dd>
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
            {result.findings.map((f) => (
              <FindingRow key={f.id} finding={f} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
