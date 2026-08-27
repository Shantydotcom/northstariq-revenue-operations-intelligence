import { getStatus } from '@/lib/salesforce';
import AssessmentPanel from '@/components/AssessmentPanel';

/** Always reflects the live org; never served from a build-time snapshot. */
export const dynamic = 'force-dynamic';

/**
 * The Overview owns one composition, so the head, the Salesforce rail and the
 * assessment are rendered together rather than split across a server page and a
 * client island. The connection is read here, on the server, and handed down;
 * the record counts and the last-assessed time belong to a result and are
 * rendered only once one exists.
 */
export default async function OverviewPage() {
  const status = await getStatus();
  return <AssessmentPanel status={status} />;
}
