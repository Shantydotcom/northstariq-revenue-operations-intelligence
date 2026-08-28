import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStatus, toSafeError } from '@/lib/salesforce';
import { runCheck } from '@/lib/assessment';
import { isCheckId } from '@/lib/checks';
import {
  AREAS,
  PRESENTATION,
  evidenceUrl,
  explainControl,
  formatObservedAt,
} from '@/lib/presentation';
import { TRACEABILITY } from '@/lib/traceability';
import { resolveSetupLinks, setupLinkFor, fieldLinkFor } from '@/lib/setup-links';
import EvidenceTable from '@/components/EvidenceTable';
import { meterClass, NOT_SCORED, notScoredReason } from '@/components/ScoreMeter';
import Notice, { DisconnectedNotice } from '@/components/Notice';
import type { CheckResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * INVESTIGATE, read top to bottom.
 *
 * What was found, the records behind it, the records left out, where an
 * expected value comes from where a control has one, what depends on those
 * fields, what the control expects, and what a recheck would need to show. Findings first, repository evidence last - a reader following a
 * finding should reach the records before reaching any explanation of design.
 *
 * Deliberately no loading.tsx under /findings.
 *
 * A loading boundary flushes the response shell before this component runs, so
 * notFound() can no longer set the status and an unknown check id returns 200.
 * A correct 404 is worth more here than a spinner.
 */
export default async function FindingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ checkId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { checkId } = await params;
  if (!isCheckId(checkId)) notFound();

  /*
   * Navigation origin.
   *
   * A finding is reachable from the Overview and from the findings queue, and
   * sending everyone back to the queue stranded readers who arrived from the
   * Overview. The origin travels in the query string rather than in a store:
   * it survives a reload, a shared link and browser Back, and it needs no
   * client state. Anything other than the one known origin falls back to the
   * queue, so a hand-edited value cannot produce a broken control.
   */
  const { from } = await searchParams;
  const back =
    from === 'overview'
      ? { href: '/', label: 'Overview' }
      : { href: '/findings', label: 'All findings' };

  const status = await getStatus();
  if (!status.connected) {
    return (
      <>
        <Link className="link-back" href={back.href}>
          ← {back.label}
        </Link>
        <DisconnectedNotice status={status} />
      </>
    );
  }

  // The moment this page read the org. Navigation performs independent reads,
  // so the evidence below belongs to this observation and states its own time.
  const observedAt = new Date();

  let check: CheckResult | null;
  try {
    check = await runCheck(checkId, observedAt);
  } catch (err) {
    return (
      <>
        <Link className="link-back" href={back.href}>
          ← {back.label}
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
  const trace = TRACEABILITY[check.id];
  const priority = check.severity === 'High' ? 'High priority' : `${check.severity} priority`;
  // Identifiers only, so a dependency can open the real configuration.
  const setupLinks = await resolveSetupLinks(status.instanceHost);

  /*
   * Group consecutive dependencies that share an object, component and type.
   * Country and employee count stay on their own rows - the point is that they
   * do different jobs - but the component name is written once per group
   * instead of six times down the column.
   */
  const depGroups = trace.usages.reduce<{ key: string; rows: typeof trace.usages }[]>(
    (acc, u) => {
      const key = `${u.object}|${u.name}|${u.type}`;
      const last = acc[acc.length - 1];
      if (last && last.key === key) last.rows.push(u);
      else acc.push({ key, rows: [u] });
      return acc;
    },
    [],
  );

  return (
    <>
      <Link className="link-back" href={back.href}>
        ← {back.label}
      </Link>

      <div className="finding-head">
        <h1>{p.label}</h1>
        <p className="finding-context">
          {AREAS[check.category].label} ·{' '}
          <span className={`sev ${check.severity}`}>{priority}</span>
        </p>
        <p className="finding-result">
          {check.failing === 0
            ? 'No records failed this check.'
            : p.finding(check.failing, check.evaluated)}
        </p>
      </div>

      <div className="detail">
        {/* 1. Result: the population, accounted for, then what it means. */}
        <section>
          <h2>What NorthstarIQ found</h2>
          {/*
           * Found splits into evaluated and not evaluated, and nothing else.
           * Failing and unmeasurable are deliberately NOT metrics here - one is
           * a share of evaluated, the other a share of not-evaluated, and four
           * peer figures invite a reader to add them together.
           */}
          <dl className="metrics">
            <div>
              <dt>{check.orgPopulationNoun} found</dt>
              <dd>{check.orgPopulation}</dd>
            </div>
            <div>
              <dt>Evaluated</dt>
              <dd>{check.evaluated}</dd>
            </div>
            <div>
              <dt>Could not be evaluated</dt>
              <dd>{check.unmeasurableCount}</dd>
            </div>
            <div>
              <dt>Not applicable</dt>
              <dd>{check.notEvaluatedCount - check.unmeasurableCount}</dd>
            </div>
            {/*
             * A control reaching no pass or fail has no score. Rendering
             * "null/100" or a 0 meter here would be the exact claim Model v2
             * removed, so the cell says what happened instead.
             */}
            <div>
              <dt>Score</dt>
              {check.score === null ? (
                <dd>
                  {NOT_SCORED} — {notScoredReason(check.scoreReason).toLowerCase()}
                </dd>
              ) : (
                <dd className={meterClass(check.score)}>{check.score}/100</dd>
              )}
            </div>
          </dl>
          <p className="explain">{explainControl(check, p.explain)}</p>
          {/*
           * The composition of the failures, where it divides meaningfully.
           * A reader should not have to parse the paragraph to learn that ten
           * of eleven are one attribute and one is the other.
           */}
          {check.failureBreakdown.length > 0 ? (
            <dl className="breakdown">
              {check.failureBreakdown.map((b) => (
                <div key={b.label}>
                  <dt>{b.label}</dt>
                  <dd>{b.count}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="footnote">{p.explain.proves}</p>
        </section>

        {/* 2. Evidence: the records that failed, and the values that failed them. */}
        <section>
          <div className="section-head">
            <h2>Evidence</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {check.failing === 0
                ? 'No records failed this check'
                : check.evidence.length < check.failing
                  ? `${check.evidence.length} of ${check.failing} failing records`
                  : `${check.failing} failing ${check.failing === 1 ? 'record' : 'records'}`}
            </span>
          </div>
          <EvidenceTable
            columns={check.evidenceColumns}
            rows={check.evidence}
            instanceHost={status.instanceHost}
            label="failing records"
            exportBase={check.evidence.length > 0 ? `/api/export/evidence/${check.id}` : undefined}
          />
          <p className="footnote">
            Observed from Salesforce at {formatObservedAt(observedAt.toISOString())}, shown exactly
            as Salesforce returned them. Each record name opens that record in the connected org.
          </p>
        </section>

        {/*
         * 3. CHALLENGE THIS. The records the control declined, and why.
         *
         * Read-only. There is nothing here to approve, override or edit - the
         * point is that a reviewer can disagree with an omission, which needs
         * the reason stated per record rather than one message repeated.
         */}
        {check.notEvaluatedCount > 0 ? (
          <section>
            <div className="section-head">
              <h2>Records not evaluated</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                {check.notEvaluatedRows.length < check.notEvaluatedCount
                  ? `${check.notEvaluatedRows.length} of ${check.notEvaluatedCount} records`
                  : `${check.notEvaluatedCount} records`}
              </span>
            </div>
            <p className="section-intro">
              Left out of this control&rsquo;s score, each with the reason it was left out.{' '}
              {check.unmeasurableCount > 0
                ? `${check.unmeasurableCount} are unmeasurable — this control applies to them, but no result was ever recorded.`
                : 'This control does not apply to any of them.'}
            </p>
            {check.exclusionBreakdown.length > 0 ? (
              <dl className="breakdown">
                {check.exclusionBreakdown.map((b) => (
                  <div key={b.label}>
                    <dt>{b.label}</dt>
                    <dd>{b.count}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <EvidenceTable
              columns={check.notEvaluatedColumns}
              rows={check.notEvaluatedRows}
              instanceHost={status.instanceHost}
              label="records not evaluated"
              exportBase={`/api/export/not-evaluated/${check.id}`}
            />
          </section>
        ) : null}

        {/*
         * 4. Source evidence: where the expected value comes from.
         *
         * Only for a control that compares a stored field against something
         * Salesforce recorded earlier. The evidence table carries the values
         * record by record; this carries the model behind them, including why
         * an older record is not judged against today's configuration.
         */}
        {p.sourceEvidence ? (
          <section>
            <h2>Source evidence</h2>
            <p className="section-intro">{p.sourceEvidence.intro}</p>
            <dl className="control-pair">
              {p.sourceEvidence.pairs.map((pair) => (
                <Fragment key={pair.term}>
                  <dt>{pair.term}</dt>
                  <dd>{pair.detail}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
        ) : null}

        {/* 5. Dependencies: proven field-to-configuration relationships only. */}
        <section>
          <h2>Salesforce dependencies</h2>
          <p className="section-intro">
            Salesforce configuration that uses the fields evaluated by this control.
          </p>
          {depGroups.length > 0 ? (
            <div className="table-scroll">
              <table className="usage-table">
                <thead>
                  <tr>
                    <th>Object</th>
                    <th>Field</th>
                    <th>Automation / Configuration</th>
                    <th>Type</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {depGroups.map((group) =>
                    group.rows.map((u, i) => {
                      /*
                       * A name links only where the identifier resolved against
                       * this org. An unlinked name is honest; a link that 404s
                       * in front of an evaluator is not.
                       */
                      const configHref = setupLinkFor(setupLinks, u);
                      const fieldHref = fieldLinkFor(setupLinks, u);
                      return (
                        <tr
                          key={`${group.key}-${u.field}`}
                          className={i === 0 ? 'usage-group-start' : undefined}
                        >
                          {i === 0 ? <td rowSpan={group.rows.length}>{u.object}</td> : null}
                          <td className="mono">
                            {fieldHref ? (
                              <a
                                className="record-link"
                                href={fieldHref}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {u.field}
                                <span aria-hidden="true"> ↗</span>
                                <span className="sr-only"> (opens the field in Salesforce Setup)</span>
                              </a>
                            ) : (
                              u.field
                            )}
                          </td>
                          {i === 0 ? (
                            <td className="mono" rowSpan={group.rows.length}>
                              {configHref ? (
                                <a
                                  className="record-link"
                                  href={configHref}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {u.name}
                                  <span aria-hidden="true"> ↗</span>
                                  <span className="sr-only"> (opens in Salesforce Setup)</span>
                                </a>
                              ) : (
                                u.name
                              )}
                            </td>
                          ) : null}
                          {i === 0 ? (
                            <td rowSpan={group.rows.length}>
                              <span className="usage-type">{u.type}</span>
                            </td>
                          ) : null}
                          <td>{u.purpose}</td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <Notice tone="ok" title="No Salesforce dependency established">
              {trace.noneEstablished}
            </Notice>
          )}
        </section>

        {/* 6. Control and verification: expected condition, and the recheck. */}
        <section>
          <h2>Control &amp; verification</h2>
          <dl className="control-pair">
            <dt>Control</dt>
            <dd>{p.control}</dd>
            <dt>Verify</dt>
            <dd>{p.recheck}</dd>
          </dl>
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

    </>
  );
}
