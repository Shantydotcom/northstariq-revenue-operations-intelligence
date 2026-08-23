import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStatus, toSafeError } from '@/lib/salesforce';
import { runCheck } from '@/lib/assessment';
import { isCheckId } from '@/lib/checks';
import EvidenceTable from '@/components/EvidenceTable';
import Notice, { DisconnectedNotice } from '@/components/Notice';
import type { CheckResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Deliberately no loading.tsx under /findings.
 *
 * A loading boundary flushes the response shell before this component runs, so
 * notFound() can no longer set the status and an unknown check id returns 200.
 * A correct 404 is worth more here than a spinner.
 */
export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ checkId: string }>;
}) {
  const { checkId } = await params;
  if (!isCheckId(checkId)) notFound();

  const status = await getStatus();
  if (!status.connected) {
    return (
      <>
        <Link className="link-back" href="/findings">
          ← All findings
        </Link>
        <DisconnectedNotice status={status} />
      </>
    );
  }

  let check: CheckResult | null;
  try {
    check = await runCheck(checkId, new Date());
  } catch (err) {
    return (
      <>
        <Link className="link-back" href="/findings">
          ← All findings
        </Link>
        <Notice tone="error" title="The evidence could not be loaded">
          {toSafeError(err).message}
        </Notice>
      </>
    );
  }

  if (!check) notFound();

  return (
    <>
      <Link className="link-back" href="/findings">
        ← All findings
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span className={`badge ${check.severity}`}>{check.severity}</span>
        <span className="stat-label">{check.category}</span>
      </div>
      <h1>{check.title}</h1>
      <p className="lede">{check.businessQuestion}</p>

      <div className="stack">
        <div className="card">
          <div className="grid-meta">
            <div>
              <div className="stat-label">Records affected</div>
              <div
                className="stat-value"
                style={check.failing > 0 ? { color: 'var(--high)' } : undefined}
              >
                {check.failing}
              </div>
            </div>
            <div>
              <div className="stat-label">Records evaluated</div>
              <div className="stat-value">{check.evaluated}</div>
            </div>
            <div>
              <div className="stat-label">Check score</div>
              <div className="stat-value">{check.score}</div>
            </div>
          </div>
          <p className="footnote">
            Population: {check.population}. The score is{' '}
            <span className="mono">
              100 × (1 − {check.failing}/{check.evaluated || 1})
            </span>{' '}
            — measured over what this check could judge, not over the whole org.
          </p>
        </div>

        <div className="card">
          <dl className="definitions">
            <dt>Why it matters</dt>
            <dd>{check.businessImpact}</dd>
            <dt>What to do</dt>
            <dd>{check.recommendation}</dd>
          </dl>
        </div>

        <div>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Evidence</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {check.failing === 0
                ? 'No records failed this check'
                : `Showing ${check.evidence.length} of ${check.failing}`}
            </span>
          </div>
          <EvidenceTable
            columns={check.evidenceColumns}
            rows={check.evidence}
            instanceHost={status.instanceHost}
          />
          <p className="footnote">
            Field values are shown exactly as Salesforce returned them. Record Ids link to the
            connected org. Only the fields this check reasons over are displayed.
          </p>
        </div>
      </div>
    </>
  );
}
