import { getStatus, query } from '@/lib/salesforce';
import { ACCOUNT_COUNT_SOQL, CONTACT_COUNT_SOQL, LEAD_SOQL, OPPORTUNITY_SOQL } from '@/lib/soql';
import ConnectionPill from '@/components/ConnectionPill';
import Notice, { DisconnectedNotice } from '@/components/Notice';

export const dynamic = 'force-dynamic';

/** Objects this application reads, and the access it needs to read them. */
const READS = [
  { object: 'Lead', use: 'Data quality, segmentation, territory, routing, SLA', access: 'Read' },
  { object: 'Opportunity', use: 'Pipeline hygiene', access: 'Read' },
  { object: 'Account', use: 'Volume context only — no field data is read', access: 'Read' },
  { object: 'Contact', use: 'Volume context only — no field data is read', access: 'Read' },
];

export default async function IntegrationsPage() {
  const status = await getStatus();

  let counts: { label: string; value: number | null }[] = [];
  if (status.connected) {
    const safeCount = async (soql: string) => {
      try {
        return (await query<{ Id: string }>(soql)).length;
      } catch {
        return null;
      }
    };
    const [leads, opps, accounts, contacts] = await Promise.all([
      safeCount(LEAD_SOQL),
      safeCount(OPPORTUNITY_SOQL),
      safeCount(ACCOUNT_COUNT_SOQL),
      safeCount(CONTACT_COUNT_SOQL),
    ]);
    counts = [
      { label: 'Leads', value: leads },
      { label: 'Opportunities', value: opps },
      { label: 'Accounts', value: accounts },
      { label: 'Contacts', value: contacts },
    ];
  }

  return (
    <>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <h1>Integrations</h1>
        <ConnectionPill status={status} />
      </div>

      <p className="lede">
        NorthstarIQ connects to one Salesforce org over the OAuth 2.0 Client Credentials Flow. The
        connection is server-side only and read-only.
      </p>

      <div className="stack">
        {status.connected ? (
          <div className="card">
            <p className="eyebrow">Connected org</p>
            <div className="grid-meta">
              <div>
                <div className="stat-label">Instance</div>
                <div className="mono">{status.instanceHost}</div>
              </div>
              <div>
                <div className="stat-label">Edition</div>
                <div>{status.environment}</div>
              </div>
              <div>
                <div className="stat-label">Authentication</div>
                <div>OAuth 2.0 Client Credentials</div>
              </div>
              <div>
                <div className="stat-label">Operations</div>
                <div>SOQL query only</div>
              </div>
            </div>
          </div>
        ) : (
          <DisconnectedNotice status={status} />
        )}

        {counts.length > 0 ? (
          <div className="card">
            <p className="eyebrow">Records visible to this connection</p>
            <div className="grid-meta">
              {counts.map((c) => (
                <div key={c.label}>
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value">{c.value === null ? '—' : c.value}</div>
                </div>
              ))}
            </div>
            <p className="footnote">
              Counts are capped at the 500-row query limit. This is a Developer Edition org holding
              a small, deliberately shaped synthetic dataset — volume is not the point.
            </p>
          </div>
        ) : null}

        <div>
          <h2>What is read</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Object</th>
                  <th>Used for</th>
                  <th>Access required</th>
                </tr>
              </thead>
              <tbody>
                {READS.map((r) => (
                  <tr key={r.object}>
                    <td className="mono">{r.object}</td>
                    <td style={{ whiteSpace: 'normal' }}>{r.use}</td>
                    <td>{r.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            No Contact email, phone or other personal field is queried or rendered anywhere in this
            application.
          </p>
        </div>

        <div className="card">
          <h2>How credentials are handled</h2>
          <dl className="definitions">
            <dt>Server-side only</dt>
            <dd>
              The client id and secret are read from un-prefixed environment variables inside a
              module marked <span className="mono">server-only</span>, so importing it from browser
              code fails the build. Nothing about the connection reaches the client bundle.
            </dd>
            <dt>Never logged, never returned</dt>
            <dd>
              Access tokens live in memory for the life of a server instance and are never written
              to a cookie, to storage or to a response. Salesforce error bodies can restate a query
              or a credential, so they are replaced with a classified message before crossing the
              network boundary.
            </dd>
            <dt>Read-only by construction</dt>
            <dd>
              The Salesforce module exposes exactly one operation — a SOQL query — and every query
              is a static literal. There is no create, update or delete path to disable.
            </dd>
          </dl>
        </div>

        <Notice title="Power BI — planned, not built">
          The same governed fields are intended to feed a Power BI model for trend analysis. That
          work is not implemented, and nothing on this site depends on it.
        </Notice>
      </div>
    </>
  );
}
