import { getStatus, toSafeError } from '@/lib/salesforce';
import { runAssessment } from '@/lib/assessment';
import FindingCard from '@/components/FindingCard';
import Notice, { DisconnectedNotice } from '@/components/Notice';
import type { AssessmentResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function FindingsPage() {
  const status = await getStatus();
  if (!status.connected) {
    return (
      <>
        <h1>Findings</h1>
        <p className="lede">Checks that failed, most severe first.</p>
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

  return (
    <>
      <h1>Findings</h1>
      <p className="lede">
        {result.findingCount === 0
          ? 'Every check passed against the current org.'
          : `${result.findingCount} of 6 checks found records that need attention, ordered by severity then volume. Each finding opens the records behind it.`}
      </p>

      {result.findings.length === 0 ? (
        <Notice tone="ok" title="No findings">
          A check that finds nothing is not reported as a finding. The suite also carries a check
          that is expected to return zero, so a clean result is evidence the engine is reporting
          rather than manufacturing work.
        </Notice>
      ) : (
        <div className="stack">
          {result.findings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}
    </>
  );
}
