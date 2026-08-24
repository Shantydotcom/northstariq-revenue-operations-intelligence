'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AssessmentResult, FindingSummary, SafeError } from '@/lib/types';
import { AREAS, PRESENTATION, areaPopulation } from '@/lib/presentation';
import ScoreMeter, { healthLabel, meterClass } from './ScoreMeter';
import Notice from './Notice';

interface State {
  phase: 'idle' | 'running' | 'error' | 'done';
  /**
   * The last assessment that actually completed, kept across a re-run and
   * across a failure. A result that was true a moment ago is not made false by
   * a later request failing, and discarding it costs the reader the evidence
   * they were in the middle of reading. The timestamp beneath it always says
   * which moment it describes.
   */
  result: AssessmentResult | null;
  error: SafeError | null;
}

/** Grouping is fixed rather than locale-derived so server and client agree. */
const NUM = new Intl.NumberFormat('en-US');

/**
 * ASSESS, as an explicit act.
 *
 * The run is deliberately user-initiated rather than automatic: an assessment
 * is a claim about the org at a moment in time, so the moment should be one
 * the reader chose. Every run reads live - nothing is cached between runs.
 */
export default function AssessmentPanel() {
  const [state, setState] = useState<State>({ phase: 'idle', result: null, error: null });
  const [live, setLive] = useState('');

  const running = state.phase === 'running';

  async function run() {
    if (running) return; // guards a double submit while a request is in flight
    setState((s) => ({ ...s, phase: 'running', error: null }));
    setLive('Running the assessment.');

    const fail = (error: SafeError) => {
      setState((s) => ({ ...s, phase: 'error', error }));
      setLive(`The assessment could not be completed. ${error.message}`);
    };

    try {
      const res = await fetch('/api/assessment/run', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        fail(body.error as SafeError);
        return;
      }
      const result = body as AssessmentResult;
      setState({ phase: 'done', result, error: null });
      setLive(
        `Assessment complete. Overall health ${result.overallHealth} out of 100, ` +
          `${healthLabel(result.overallHealth)}. ` +
          `${NUM.format(result.recordsAssessed)} records assessed, ` +
          `${NUM.format(result.findingCount)} findings, ` +
          `${NUM.format(result.highSeverityCount)} high priority.`,
      );
    } catch {
      fail({
        code: 'NETWORK_ERROR',
        message: 'The assessment request could not be sent.',
      });
    }
  }

  /*
   * The live region is rendered in every phase and never unmounts. A region
   * that appears at the same moment its text does is not announced, so the
   * element has to outlive the state change it reports.
   */
  const liveRegion = (
    <p className="sr-only" role="status" aria-live="polite">
      {live}
    </p>
  );

  const { result, error } = state;

  // Nothing has completed yet: the run card is the whole panel.
  if (!result) {
    return (
      <>
        {liveRegion}
        {error ? (
          <div className="stack">
            <Notice tone="error" title="The assessment could not be completed">
              {error.message} No partial or estimated result is shown — an assessment either read
              the org or it did not.
            </Notice>
            <div>
              <button className="primary" onClick={run} disabled={running}>
                {running ? 'Assessing…' : 'Try again'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="row-between">
              <div>
                <h2>Run an assessment</h2>
                <p className="muted" style={{ margin: 0, maxWidth: '62ch' }}>
                  Reads Leads and Opportunities from the connected org, applies six checks and
                  scores five areas. Read-only: no record is created, updated or deleted.
                </p>
              </div>
              <button className="primary" onClick={run} disabled={running}>
                {running ? 'Assessing…' : 'Run assessment'}
              </button>
            </div>
            {running ? (
              <p className="footnote">Querying Salesforce and evaluating checks…</p>
            ) : null}
          </div>
        )}
      </>
    );
  }

  const sla = result.findings.find((f) => f.id === 'sla-risk');
  const routing = result.categoryScores.find((c) => c.checkIds.length > 1);

  return (
    <>
      {liveRegion}
      <div className="assessment">
        {error ? (
          <Notice tone="error" title="The re-run could not be completed">
            {error.message} The assessment below is the last one that completed — it has not been
            replaced with a partial or estimated result.
          </Notice>
        ) : null}

        <section className="overall">
          <div className="overall-head">
            <div>
              {/*
               * The section's own heading, not a label above one, so heading
               * navigation can reach the score block. It takes the same
               * treatment as the other section headings: a peer section should
               * not be set as a micro-label.
               */}
              <h2>Overall assessment</h2>
              <div className="overall-score">
                <span className={`overall-value ${meterClass(result.overallHealth)}`}>
                  {result.overallHealth}
                </span>
                <span className="overall-scale">/ 100</span>
                <span className={`overall-state ${meterClass(result.overallHealth)}`}>
                  {healthLabel(result.overallHealth)}
                </span>
              </div>
            </div>
            <button className="primary" onClick={run} disabled={running}>
              {running ? 'Assessing…' : 'Re-run assessment'}
            </button>
          </div>

          <dl className="metrics">
            <div>
              <dt>Records assessed</dt>
              <dd>{NUM.format(result.recordsAssessed)}</dd>
            </div>
            <div>
              <dt>Findings</dt>
              <dd>{NUM.format(result.findingCount)}</dd>
            </div>
            <div>
              <dt>High priority</dt>
              <dd className={result.highSeverityCount > 0 ? 'bad' : undefined}>
                {NUM.format(result.highSeverityCount)}
              </dd>
            </div>
          </dl>

          <p className="footnote">
            {running ? (
              <>Re-reading {result.objectsAssessed.join(' and ')} from the connected org…</>
            ) : (
              <>
                Read from {result.objectsAssessed.join(' and ')} in the connected org at{' '}
                {formatTime(result.ranAt)}.
              </>
            )}
          </p>
        </section>

        <section>
          <div className="section-head">
            <h2>Assessment Areas</h2>
          </div>

          {/*
           * In flow, not floating. As an overlay this panel covered all five
           * rows it was describing, and it anchored to the viewport rather than
           * to its own summary because no ancestor was positioned.
           */}
          <details className="scoring">
            <summary>How scoring works</summary>
            <div className="scoring-body">
              <dl>
                <dt>What records are counted?</dt>
                <dd>
                  Each control is scored against the Salesforce records eligible for that check.
                  Records outside that population are excluded rather than counted as passing.
                </dd>

                <dt>How is a control scored?</dt>
                <dd>
                  A control score is the percentage of evaluated records that pass the check,
                  rounded to a whole number. A control with nothing to evaluate scores 100 —
                  absence of data is not evidence of failure.
                </dd>

                <dt>How is an assessment-area score calculated?</dt>
                <dd>
                  An area is the <strong>unweighted mean</strong> of the scores of the controls
                  inside it — every control counts equally, regardless of how many records it
                  judged. Overall health is the unweighted mean of the five area scores.
                  {routing && routing.checkIds.length > 1 ? (
                    <>
                      {' '}
                      {AREAS[routing.category].label} combines {routing.checkIds.length} routing
                      controls scored {routing.checkIds
                        .map((id) => checkScoreOf(result, id))
                        .join(' and ')}
                      , so the area scores ({routing.checkIds
                        .map((id) => checkScoreOf(result, id))
                        .join(' + ')}
                      ) ÷ {routing.checkIds.length} = {routing.score}. Their populations overlap and
                      answer different questions, so they are not added into one denominator.
                    </>
                  ) : null}
                </dd>

                {sla ? (
                  <>
                    <dt>Worked example — {AREAS['SLA Performance'].label}</dt>
                    <dd>
                      {sla.evaluated} Leads have a measurable SLA commitment. {sla.affected} are at
                      risk or breached, so {sla.evaluated - sla.affected} pass:{' '}
                      <span className="mono">
                        {sla.evaluated - sla.affected} ÷ {sla.evaluated} = {' '}
                        {Math.round(100 * (1 - sla.affected / (sla.evaluated || 1)))}
                      </span>
                      . The other Leads in the org carry no SLA target and are{' '}
                      <strong>not counted as passing</strong> — they sit outside this check&rsquo;s
                      measurable population. This score does not measure every Lead.
                    </dd>
                  </>
                ) : null}
              </dl>
            </div>
          </details>

          <div className="areas">
            {result.categoryScores.map((c) => {
              const area = AREAS[c.category];
              return (
                <div className="area" key={c.category}>
                  <div className="area-main">
                    <div className="area-name">{area.label}</div>
                    <div className="area-scope">{area.scope}</div>
                    <div className="area-population">
                      {areaPopulation(area, c.checkIds, result.findings)}
                    </div>
                  </div>
                  <ScoreMeter score={c.score} />
                  <div className={`area-score ${meterClass(c.score)}`}>
                    {c.score}
                    {/* The band the colour encodes, for a reader who cannot see it. */}
                    <span className="sr-only"> out of 100, {healthLabel(c.score)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Priority Findings</h2>
            <Link className="section-link" href="/findings">
              View all findings →
            </Link>
          </div>

          {result.findings.length === 0 ? (
            <Notice tone="ok" title="No findings">
              Every check passed against the current org. Checks that find nothing are not reported
              as findings — the engine reports what it finds rather than manufacturing work.
            </Notice>
          ) : (
            <div className="priorities">
              {result.findings.slice(0, 3).map((f) => (
                <PriorityRow key={f.id} finding={f} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/** One finding, named for the operator. The row opens the records behind it. */
function PriorityRow({ finding }: { finding: FindingSummary }) {
  const p = PRESENTATION[finding.id];
  const count = p.denominator
    ? `${NUM.format(finding.affected)} of ${NUM.format(finding.evaluated)}`
    : `${NUM.format(finding.affected)} ${p.unit}`;

  return (
    <Link className="priority" href={`/findings/${finding.id}`}>
      <div className="priority-main">
        <div className="priority-title">
          {/* Same severity treatment as the findings queue: a word first. */}
          <span className={`queue-priority ${finding.severity}`}>{finding.severity}</span>
          {p.label}
        </div>
        <p>{p.blurb}</p>
      </div>
      <div className="priority-end">
        <div className="priority-count">{count}</div>
        <span className="priority-go" aria-hidden="true">
          View finding →
        </span>
      </div>
    </Link>
  );
}

/**
 * The score one control contributed, recomputed from the counts the assessment
 * already reported. Same formula as the engine, used only to show the working.
 */
function checkScoreOf(result: AssessmentResult, id: string): number {
  const f = result.findings.find((x) => x.id === id);
  if (!f) return 100;
  return Math.round(100 * (1 - f.affected / (f.evaluated || 1)));
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'an unrecorded time';
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}
