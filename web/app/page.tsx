import { getStatus } from '@/lib/salesforce';
import ConnectionPill from '@/components/ConnectionPill';
import AssessmentPanel from '@/components/AssessmentPanel';
import { DisconnectedNotice } from '@/components/Notice';

/** Always reflects the live org; never served from a build-time snapshot. */
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const status = await getStatus();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Revenue Operations Health</h1>
          <p className="lede">
            Live Salesforce intelligence across the processes that determine data quality, account
            matching, routing, response performance and pipeline reliability. Every score is read
            from the connected org at the moment you run it.
          </p>
        </div>
        <ConnectionPill status={status} />
      </div>

      {status.connected ? <AssessmentPanel /> : <DisconnectedNotice status={status} />}
    </>
  );
}
