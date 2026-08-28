import type { SalesforceStatus } from '@/lib/types';
import { AlertCircleIcon, CheckCircleIcon } from './Icons';

/**
 * The shared application header.
 *
 * One line, stated once, above every page: what the connection is and what
 * this application is permitted to do with it. The mockups place a page action
 * on the right; that slot exists here but stays empty until a page has a real
 * action to put in it - an empty toolbar is better than a decorative button.
 *
 * The security wording is deliberate and narrow. "Read-only assessment"
 * describes what THIS APPLICATION does: its only Salesforce operation is a
 * SOQL query. It is not a claim about what the Salesforce integration
 * principal is permitted to do, which is a separate boundary with separate
 * evidence in `security-model.md`.
 */
export default function AppHeader({
  status,
  actions,
}: {
  status: SalesforceStatus;
  actions?: React.ReactNode;
}) {
  const connected = status.connected;
  const label = connected
    ? 'Salesforce connected'
    : status.configured
      ? 'Salesforce unavailable'
      : 'Salesforce not configured';

  return (
    <header className="app-header">
      <p className={`app-conn${connected ? '' : ' is-down'}`}>
        <span className="app-conn-mark">
          {connected ? (
            <CheckCircleIcon className="app-conn-icon" />
          ) : (
            <AlertCircleIcon className="app-conn-icon" />
          )}
        </span>
        <span>
          <span className="app-conn-label">{label}</span>
          <span className="app-conn-sub">
            {connected ? 'Read-only assessment' : (status.reason ?? 'Read-only assessment')}
          </span>
        </span>
      </p>

      {actions ? <div className="app-header-actions">{actions}</div> : null}
    </header>
  );
}
