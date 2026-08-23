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
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <h1>Revenue Operations Overview</h1>
        </div>
        <ConnectionPill status={status} />
      </div>

      <p className="lede">
        NorthstarIQ assesses a governed Salesforce inbound process — data quality, identity,
        segmentation, territory, routing and SLA — and shows the records behind every number. It
        reads the org and nothing else: there is no write path in this application.
      </p>

      {status.connected ? <AssessmentPanel /> : <DisconnectedNotice status={status} />}
    </>
  );
}
