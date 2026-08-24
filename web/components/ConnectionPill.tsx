import type { SalesforceStatus } from '@/lib/types';

/**
 * CONNECT, made visible — and kept quiet.
 *
 * The connection is a precondition, not the subject of the page, so it reads as
 * a status line rather than a badge competing with the assessment. The host is
 * shown on Integrations; nothing secret is shown anywhere.
 */
export default function ConnectionPill({ status }: { status: SalesforceStatus }) {
  const label = status.connected
    ? 'Salesforce connected'
    : status.configured
      ? 'Salesforce unavailable'
      : 'Salesforce not configured';

  return (
    <span className={`status ${status.connected ? 'connected' : 'disconnected'}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>
        <span className="status-label">{label}</span>
        {status.connected ? <span className="status-sub">{status.environment}</span> : null}
      </span>
    </span>
  );
}
