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
  remediationEvidenceUrl,
} from '@/lib/presentation';
import { TRACEABILITY } from '@/lib/traceability';
import { resolveSetupLinks, setupLinkFor, fieldLinkFor } from '@/lib/setup-links';
import EvidenceTable from '@/components/EvidenceTable';
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
  // Present on the one control whose safeguard was itself remediated.
  const rem = p.safeguard.remediation;
  const remediationGithub = rem ? remediationEvidenceUrl(rem) : null;
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
        {/*
         * 1. The question, before the answer.
         *
         * A reader arriving from the findings queue knows a count and a title
         * and nothing about why either matters. The risk and the expectation
         * come first so the numbers below land as evidence about something
         * rather than as the first thing said.
         */}
        <section>
          <h2>Why this control exists</h2>
          <p className="why">{p.why}</p>
          <dl className="control-pair">
            <dt>What the control expects</dt>
            <dd>{p.control}</dd>
          </dl>
        </section>

        {/* 2. Result: the population, accounted for, then what it means. */}
        <section>
          <h2>What NorthstarIQ found</h2>
          {/*
           * Found splits into evaluated and not evaluated, and nothing else.
           * Failing and unmeasurable are deliberately NOT metrics here - one is
           * a share of evaluated, the other a share of not-evaluated, and four
           * peer figures invite a reader to add them together.
           *
           * NO SCORE. The engine still computes one - it is on `CheckResult`
           * and the tests still assert it - but the experience does not show
           * it, here or anywhere else. These four figures account for the
           * whole population, which is the fact a reader can check against the
           * evidence below; a number out of 100 is not.
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
            source={check.source}
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
              source={check.source}
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

        {/*
         * 6. What Salesforce prevents, as distinct from what this reports.
         *
         * THE DISTINCTION IS THE POINT, AND IT IS LABELLED RATHER THAN IMPLIED.
         * Every NorthstarIQ control is detective: it reads what the org already
         * holds and never blocks anything. Some of them sit beside a Salesforce
         * safeguard that does block, and `kind` says which case this is. A
         * reader must not leave thinking the assessment enforced something, or
         * that a preventive safeguard found the records listed above - it could
         * not have, because they predate it.
         */}
        <section>
          <h2>Implemented safeguard</h2>
          <div className="safeguard">
            <p className="kind">
              <span className={`kind-badge ${p.safeguard.kind}`}>
                {p.safeguard.kind === 'preventive'
                  ? 'Preventive \u2014 Salesforce blocks it'
                  : 'Detective \u2014 reported, not prevented'}
              </span>
            </p>
            <h3>{p.safeguard.title}</h3>
            <p>{p.safeguard.body}</p>
            {p.safeguard.tech && p.safeguard.tech.length > 0 ? (
              <ul className="tech" aria-label="Salesforce components behind this safeguard">
                {p.safeguard.tech.map((t) => (
                  <li className="tech-tag" key={t}>
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}

            {/*
             * 6b. WHERE THE SAFEGUARD ITSELF WAS FOUND WRONG.
             *
             * Nested inside the safeguard it corrects, not promoted to a page
             * of its own. Remediation and verification are stages of ONE
             * investigation trail; giving them separate destinations would
             * split the trail and imply NorthstarIQ runs a remediation engine.
             * It does not - it reads Salesforce and never writes to it, and
             * every fact below records a change a human approved and deployed.
             *
             * Rendered only where a remediation exists. Ten of the eleven
             * controls have none, and an empty "no remediation" block on each
             * of them would be noise dressed as completeness.
             */}
            {rem ? (
              <div className="remediation">
                <div className="remediation-head">
                  <h4>This safeguard was found defective, and corrected</h4>
                  <span className="remediation-status">{rem.status}</span>
                </div>

                <dl className="control-pair">
                  <dt>What went wrong</dt>
                  <dd>{rem.defect}</dd>
                  <dt>What it produced</dt>
                  <dd>{rem.consequence}</dd>
                  <dt>Root cause</dt>
                  <dd>{rem.rootCause}</dd>
                  <dt>Approved change</dt>
                  <dd>{rem.change}</dd>
                </dl>

                {/*
                 * The deployment, as identifiers rather than prose. A reader
                 * who wants to check this needs the component, the version now
                 * running and the one a reversal would target - not a report.
                 */}
                <h5>Deployed to Salesforce</h5>
                <dl className="deployment">
                  <div>
                    <dt>Component</dt>
                    <dd className="mono">{rem.deployment.component}</dd>
                  </div>
                  <div>
                    <dt>Now active</dt>
                    <dd>{rem.deployment.active}</dd>
                  </div>
                  <div>
                    <dt>Rollback target</dt>
                    <dd>{rem.deployment.rollbackTarget}</dd>
                  </div>
                  {rem.deployment.checkOnly ? (
                    <div>
                      <dt>Check-only run first</dt>
                      <dd className="mono">{rem.deployment.checkOnly}</dd>
                    </div>
                  ) : null}
                  {rem.deployment.requestId ? (
                    <div>
                      <dt>Deploy request</dt>
                      <dd className="mono">{rem.deployment.requestId}</dd>
                    </div>
                  ) : null}
                </dl>

                <h5>Verified after deployment</h5>
                <ul className="verification">
                  {rem.verification.map((v) => (
                    <li key={v}>
                      <span className="tick" aria-hidden="true">
                        ✓
                      </span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>

                <h5>Existing behaviour re-checked</h5>
                <ul className="verification">
                  {rem.regression.map((r) => (
                    <li key={r}>
                      <span className="tick" aria-hidden="true">
                        ✓
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>

                <p className="explain">{rem.detectiveConfirmation}</p>

                {/*
                 * THE DISTINCTION THIS WHOLE BLOCK STANDS OR FALLS ON.
                 *
                 * One input was observed failing before the fix; the others
                 * were only ever read out of the configuration as reachable.
                 * The basis is a badge because a reader skimming must not be
                 * able to come away thinking all three were seen failing.
                 */}
                <h5>What each piece of evidence proves</h5>
                <ul className="exposures">
                  {rem.exposures.map((e) => (
                    <li key={e.subject}>
                      <span className="exposure-head">
                        <span className="exposure-subject">{e.subject}</span>
                        <span className={`basis-badge ${e.before}`}>
                          {e.before === 'runtime-confirmed'
                            ? 'Runtime-confirmed before the fix'
                            : 'Source-derived exposure only'}
                        </span>
                      </span>
                      <span className="exposure-after">{e.after}</span>
                    </li>
                  ))}
                </ul>
                <p className="footnote">{rem.laterConfirmation}</p>

                <dl className="control-pair">
                  <dt>Controlled recovery</dt>
                  <dd>{rem.recovery}</dd>
                </dl>

                {remediationGithub ? (
                  <p className="evidence-link">
                    <a href={remediationGithub} target="_blank" rel="noreferrer">
                      View the corrected automation
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> (opens GitHub in a new tab)</span>
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {/*
         * 7. What was actually executed - outcomes, not intentions.
         *
         * `verificationSource` carries the limits of those outcomes and is
         * rendered every time, never conditionally: a list of ticks with no
         * statement of what produced them reads as a broader claim than the
         * evidence supports.
         */}
        <section>
          <h2>Verification</h2>
          <ul className="verification">
            {p.verification.map((v) => (
              <li key={v}>
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
          <p className="verification-source">{p.verificationSource}</p>
        </section>

        {/* 8. The recheck. The expectation itself is stated at the top. */}
        <section>
          <h2>How this finding clears</h2>
          <dl className="control-pair">
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
