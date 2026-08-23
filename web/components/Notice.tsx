import type { SalesforceStatus } from '@/lib/types';

export default function Notice({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: 'neutral' | 'error' | 'ok';
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`notice ${tone === 'neutral' ? '' : tone}`}>
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

/**
 * The Disconnected state, shared by every page that needs the org.
 *
 * It states what is wrong and what would fix it, and it never contains a raw
 * Salesforce error - `reason` is always one of the safe, classified messages.
 */
export function DisconnectedNotice({ status }: { status: SalesforceStatus }) {
  return (
    <Notice
      tone="error"
      title={
        status.configured
          ? 'Salesforce is configured but unreachable'
          : 'Salesforce is not connected'
      }
    >
      {status.reason ?? 'The assessment needs a live Salesforce connection to read from.'}{' '}
      Assessment results are never cached or invented, so nothing is shown until the org can be
      read. See <a href="/integrations">Integrations</a> for what this application requires.
    </Notice>
  );
}
