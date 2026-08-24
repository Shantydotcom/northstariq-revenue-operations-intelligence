import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStatus, toSafeError } from '@/lib/salesforce';
import { runCheck } from '@/lib/assessment';
import { isCheckId } from '@/lib/checks';
import { PRESENTATION, evidenceUrl } from '@/lib/presentation';
import EvidenceTable from '@/components/EvidenceTable';
import Notice, { DisconnectedNotice } from '@/components/Notice';
import type { CheckResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * INVESTIGATE, read top to bottom.
 *
 * The page answers one question per section, in the order an operator would
 * ask them: why does this control exist, what should the system do, what did
 * it actually find, which records, what was built to hold the line, and how do
 * we know that works. Everything after the evidence table comes from the
 * repository rather than from the org.
 *
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

  const p = PRESENTATION[check.id];
  const github = evidenceUrl(p);
  const priority = check.severity === 'High' ? 'High priority' : `${check.severity} priority`;

  return (
    <>
      <Link className="link-back" href="/findings">
        ← All findings
      </Link>

      <div className="finding-head">
        <h1>{p.label}</h1>
        <p className="finding-context">
          {check.category} · <span className={`sev ${check.severity}`}>{priority}</span>
        </p>
        <p className="finding-result">
          {check.failing === 0
            ? 'No records failed this check.'
            : p.finding(check.failing, check.evaluated)}
        </p>
      </div>

      <div className="detail">
        <section>
          <h2>Why this control exists</h2>
          <p>{p.why}</p>
        </section>

        <section>
          <h2>Expected control</h2>
          <p>{p.expected}</p>
        </section>

        <section>
          <h2>What NorthstarIQ found</h2>
          <dl className="metrics">
            <div>
              <dt>Records affected</dt>
              <dd className={check.failing > 0 ? 'bad' : undefined}>{check.failing}</dd>
            </div>
            <div>
              <dt>Records evaluated</dt>
              <dd>{check.evaluated}</dd>
            </div>
            <div>
              <dt>Check score</dt>
              <dd>{check.score}</dd>
            </div>
          </dl>
          <p className="footnote">
            Measured over {check.population} —{' '}
            <span className="mono">
              100 × (1 − {check.failing}/{check.evaluated || 1})
            </span>
            . Records outside this population are excluded from the score rather than counted as
            healthy.
          </p>
        </section>

        <section>
          <div className="section-head">
            <h2>Evidence</h2>
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
            Field values are shown exactly as Salesforce returned them. Each record name opens that
            record in the connected org. Only the fields this check reasons over are displayed.
          </p>
        </section>

        <section>
          <h2>Implemented safeguard</h2>
          <div className="safeguard">
            <h3>{p.safeguard.title}</h3>
            <p>{p.safeguard.body}</p>
            {p.safeguard.tech ? (
              <div className="tech">
                {p.safeguard.tech.map((t) => (
                  <span className="tech-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <p className="footnote">
            {p.safeguard.kind === 'preventive'
              ? 'Preventive control: Salesforce configuration stops or safely redirects the unsafe outcome before it happens.'
              : 'Detective control: NorthstarIQ reports the condition for review. Nothing in Salesforce prevents it.'}
          </p>
        </section>

        <section>
          <h2>Verification</h2>
          <ul className="verification">
            {p.verification.map((v) => (
              <li key={v}>
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                {v}
              </li>
            ))}
          </ul>
          <p className="footnote">{p.verificationSource}</p>
        </section>

        {github ? (
          <p className="evidence-link">
            <a href={github} target="_blank" rel="noreferrer">
              View implementation evidence
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens GitHub in a new tab)</span>
            </a>
          </p>
        ) : null}
      </div>

      <p className="footnote canonical">
        Canonical check <span className="mono">{check.id}</span> — {check.title}. {check.recommendation}
      </p>
    </>
  );
}
