import type { SalesforceStatus } from '@/lib/types';

/** CONNECT, made visible. The host is shown; nothing secret ever is. */
export default function ConnectionPill({ status }: { status: SalesforceStatus }) {
  return (
    <span className={`pill ${status.connected ? 'connected' : 'disconnected'}`}>
      {status.connected
        ? `Salesforce connected — ${status.environment}`
        : status.configured
          ? 'Salesforce unavailable'
          : 'Salesforce not configured'}
    </span>
  );
}
