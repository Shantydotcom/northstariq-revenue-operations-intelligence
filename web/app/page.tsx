import { getStatus } from '@/lib/salesforce';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

/**
 * The root route is the Dashboard.
 *
 * It replaces the former Overview experience rather than sitting beside it:
 * one orientation surface, not two competing ones. Assessment moved to
 * `/assessment`.
 */
export default async function DashboardPage() {
  const status = await getStatus();
  return <Dashboard status={status} />;
}
