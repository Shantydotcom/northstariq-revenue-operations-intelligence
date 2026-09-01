import { getStatus } from '@/lib/salesforce';
import AssessmentPanel from '@/components/AssessmentPanel';

export const dynamic = 'force-dynamic';

/**
 * The Assessment experience, on its own route.
 *
 * It rendered at `/` while Dashboard was unbuilt. Dashboard now owns the root,
 * so Assessment moved here unchanged - same component, same behaviour, same
 * result. The two pages read one assessment through `lib/assessment-store`, so
 * a run started on either is the run the other shows.
 */
export default async function AssessmentPage() {
  const status = await getStatus();
  return <AssessmentPanel status={status} />;
}
