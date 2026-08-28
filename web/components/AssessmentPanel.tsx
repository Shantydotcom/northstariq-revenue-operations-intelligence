'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  AssessmentResult,
  CategoryScore,
  ControlSummary,
  SafeError,
  SalesforceStatus,
} from '@/lib/types';
import {
  AREAS,
  PRESENTATION,
  formatObservedAt,
  leadFinding,
  mostAffectedArea,
  objectPhrase,
} from '@/lib/presentation';
import ScoreMeter, { healthLabel, meterClass, NOT_SCORED, notScoredReason } from './ScoreMeter';
import RunAssessment from './RunAssessment';
import Notice, { DisconnectedNotice } from './Notice';

interface State {
  phase: 'idle' | 'running' | 'error' | 'done';
  /**
   * The last assessment that actually completed, kept across a re-run and
   * across a failure. A result that was true a moment ago is not made false by
   * a later request failing, and discarding it costs the reader the evidence
   * they were in the middle of reading. Nothing persists beyond this instance:
   * there is no store, and the rail never implies otherwise.
   */
  result: AssessmentResult | null;
  error: SafeError | null;
}

/** Grouping is fixed rather than locale-derived so server and client agree. */
const NUM = new Intl.NumberFormat('en-US');

/**
 * Where the last completed assessment is held so it survives navigation.
 *
 * Opening a finding unmounts this component, and without this the reader
 * returned to an Overview that had forgotten the assessment they were reading
 * and had to run it again. `sessionStorage` keeps it for the life of the tab:
 * no database, no account, no server-side store, and nothing shared between
 * visitors.
 *
 * Restoring is honest because the result carries its own observation time and
 * the Overview displays it — a restored assessment states the moment it was
 * read, exactly as a fresh one does. Nothing is recomputed and no number is
 * invented; this is the same payload the org returned.
 */
/*
 * Versioned: v2 carries per-control populations, which v1 did not. An old entry
 * left in a tab from before that change must not be restored into a UI that now
 * reads them, so the key moves with the payload shape.
 */
const RESULT_KEY = 'northstariq.assessment.v3';

function readStoredResult(): AssessmentResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentResult;
    // Shape guard: a stale or hand-edited entry must not render as a result.
    if (
      typeof parsed?.ranAt !== 'string' ||
      typeof parsed?.overallHealth !== 'number' ||
      !Array.isArray(parsed?.categoryScores) ||
      !Array.isArray(parsed?.findings) ||
      // Every field the Overview reads has to be guarded, not just most of
      // them: a payload missing one renders as a client-side crash, not as a
      // missing number.
      !Array.isArray(parsed?.controls)
    ) {
      return null;
    }
    return parsed;
  } catch {
    // Private mode, disabled storage, or malformed JSON: start unassessed.
    return null;
  }
}

function storeResult(result: AssessmentResult): void {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    // Storage being unavailable must never break an assessment that succeeded.
  }
}

/**
 * The Overview.
 *
 * Reading order is the thesis: what the assessment concluded, the strongest
 * traceable evidence for it, then the composite as context, then the six areas
 * in their canonical order. The composite is not the headline - it is the
 * number furthest from any record, and it earns a supporting position rather
 * than the largest type on the page.
 *
 * The run is deliberately user-initiated rather than automatic: an assessment
 * is a claim about the org at a moment in time, so the moment should be one
 * the reader chose. Every run reads live - nothing is cached between runs.
 */
export default function AssessmentPanel({ status }: { status: SalesforceStatus }) {
  const [state, setState] = useState<State>({ phase: 'idle', result: null, error: null });
  const [live, setLive] = useState('');

  const running = state.phase === 'running';
  const { result, error } = state;

  /*
   * Restore after mount, never during render: the server has no session
   * storage, so reading it while rendering would produce markup the client
   * could not match. Starting empty and filling in on the client keeps
   * hydration clean.
   */
  useEffect(() => {
    if (!status.connected) return;
    const stored = readStoredResult();
    if (stored) setState({ phase: 'done', result: stored, error: null });
  }, [status.connected]);

  async function run() {
    if (running) return; // guards a double submit while a request is in flight
    setState((s) => ({ ...s, phase: 'running', error: null }));
    setLive('Running the assessment.');

    const fail = (e: SafeError) => {
      setState((s) => ({ ...s, phase: 'error', error: e }));
      setLive(`The assessment could not be completed. ${e.message}`);
    };

    try {
      const res = await fetch('/api/assessment/run', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        fail(body.error as SafeError);
        return;
      }
      const next = body as AssessmentResult;
      setState({ phase: 'done', result: next, error: null });
      storeResult(next);
      setLive(
        (next.overallHealth === null
          ? 'Assessment complete. No area could be scored. '
          : `Assessment complete. Overall health ${next.overallHealth} out of 100, ` +
            `${healthLabel(next.overallHealth)}. `) +
          `${NUM.format(next.recordsAssessed)} records assessed, ` +
          `${NUM.format(next.findingCount)} findings.`,
      );
    } catch {
      fail({ code: 'NETWORK_ERROR', message: 'The assessment request could not be sent.' });
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

  /*
   * Two experiences, not one page with an empty state.
   *
   * Before a result exists the page IS "Run a New Assessment" - hero, scope
   * and one action. The Overview head belongs to the post-assessment page and
   * is not rendered underneath it, because a reader starting an assessment
   * has no result for it to describe.
   *
   * Phase 3 replaces what follows the `result` branch. This split is what lets
   * it do so without touching the pre-assessment experience.
   */
  if (status.connected && !result) {
    return (
      <>
        {liveRegion}
        {error ? (
          <Notice tone="error" title="The assessment could not be completed">
            {error.message} No partial or estimated result is shown — an assessment either read the
            org or it did not.
          </Notice>
        ) : null}
        <RunAssessment status={status} running={running} onRun={run} />
      </>
    );
  }

  return (
    <>
      {liveRegion}

      <div className="overview-head">
        <div className="overview-intro">
          <h1>Revenue Operations Health</h1>
          <p className="lede">
            Assessment of operational controls across the Salesforce revenue lifecycle.
          </p>
          {result ? (
            <p className="head-figures">
              <span>
                {NUM.format(result.recordsAssessed)} Salesforce records assessed across{' '}
                {objectPhrase(result.objectsAssessed)}
              </span>
              <span className="head-figures-sub">
                {NUM.format(result.findingCount)}{' '}
                {result.findingCount === 1 ? 'finding' : 'findings'} ·{' '}
                {result.categoryScores.length} assessment areas
              </span>
            </p>
          ) : null}
          {/* What the application does, stated once, beside what it assessed. */}
          <p className="head-readonly">
            Read-only assessment. No record is created, updated or deleted.
          </p>
        </div>

        <SalesforceRail
          status={status}
          result={result}
          running={running}
          onRun={run}
        />
      </div>

      {!status.connected ? (
        <DisconnectedNotice status={status} />
      ) : (
        <>
          {error ? (
            <Notice tone="error" title="The assessment could not be completed">
              {error.message}{' '}
              {result
                ? 'The assessment below is the last one that completed — it has not been replaced with a partial or estimated result.'
                : 'No partial or estimated result is shown — an assessment either read the org or it did not.'}
            </Notice>
          ) : null}

          {result ? <Assessment result={result} /> : <FirstRun running={running} />}
        </>
      )}
    </>
  );
}

/**
 * CONNECT, as supporting information.
 *
 * Every line is read from runtime state. Nothing here is stated unless the
 * application currently knows it to be true: no environment without a
 * connection, and no assessment time until an assessment has completed.
 */
function SalesforceRail({
  status,
  result,
  running,
  onRun,
}: {
  status: SalesforceStatus;
  result: AssessmentResult | null;
  running: boolean;
  onRun: () => void;
}) {
  return (
    <aside className="rail">
      <h2>Salesforce</h2>

      <p className={`rail-state ${status.connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot" aria-hidden="true" />
        {status.connected ? 'Connected' : status.configured ? 'Unavailable' : 'Not configured'}
      </p>

      {status.connected && status.environment ? (
        <p className="rail-line">{status.environment}</p>
      ) : null}

      {status.connected ? (
        <>
          {/*
           * Only once an observation exists. Before that the body already says
           * the org has not been read, and repeating it here said it twice.
           */}
          {result ? (
            <div className="rail-item">
              <span className="rail-key">Last assessed</span>
              <span className="rail-value">{formatObservedAt(result.ranAt)}</span>
            </div>
          ) : null}

          {/* Current runtime state, not a historical validation claim. */}
          <p className="rail-line rail-evidence">Connected for read-only assessment</p>

          <button className="primary" onClick={onRun} disabled={running}>
            {running ? 'Assessing…' : result ? 'Re-run assessment' : 'Run assessment'}
          </button>
        </>
      ) : null}
    </aside>
  );
}

/** The first-run state: the page still says what it measures, rather than sitting empty. */
function FirstRun({ running }: { running: boolean }) {
  return (
    <section className="conclusion">
      <h2>Not yet assessed</h2>
      <p className="conclusion-lead">
        Nothing is shown until the org has been read. Running an assessment queries Leads and
        Opportunities and applies eleven checks across six areas.
      </p>
      {running ? <p className="footnote">Querying Salesforce and evaluating checks…</p> : null}
    </section>
  );
}

function Assessment({ result }: { result: AssessmentResult }) {
  const worst = mostAffectedArea(result.categoryScores, result.findings);
  const headline = worst ? leadFinding(worst.checkIds, result.findings) : null;

  return (
    <>
      {/*
       * The conclusion. Its heading is the state of the overall assessment; the
       * sentence beneath names the weakest area. Those can legitimately differ -
       * an org can be Healthy overall and still have one area that needs work -
       * and the most affected area never redefines the overall state.
       */}
      <section className="conclusion">
        <h2 className={result.overallHealth === null ? undefined : meterClass(result.overallHealth)}>
          {result.overallHealth === null ? NOT_SCORED : healthLabel(result.overallHealth)}
        </h2>

        {worst && headline ? (
          <>
            {/*
             * Says what was calculated: the lowest area score. It is not a
             * priority judgement — severity is a property of an individual
             * finding, and the findings queue is where priority is ordered.
             */}
            <p className="conclusion-lead">
              {AREAS[worst.category].label} has the lowest assessment score.
            </p>
            <p className="conclusion-evidence">
              <span className={`conclusion-count ${meterClass(worst.score ?? 0)}`}>
                {NUM.format(headline.affected)} of {NUM.format(headline.evaluated)}
              </span>
              <span className="conclusion-predicate">
                {PRESENTATION[headline.id].headlinePredicate}
              </span>
            </p>
            <Link className="conclusion-link" href={`/findings/${headline.id}`}>
              View finding →
            </Link>
          </>
        ) : (
          <p className="conclusion-lead">
            No check found a failing record. Every evaluated population passed.
          </p>
        )}
      </section>

      <section className="overall">
        <h2>Overall assessment</h2>
        <p className="overall-score">
          {result.overallHealth === null ? (
            <span className="overall-value">{NOT_SCORED}</span>
          ) : (
            <>
              <span className={`overall-value ${meterClass(result.overallHealth)}`}>
                {result.overallHealth}
              </span>
              <span className="overall-scale">/ 100</span>
            </>
          )}
        </p>
        {/*
         * The denominator is the SCORED areas, not the reported ones. Saying
         * "across 6 areas" while five contributed would be the exact
         * overclaim Model v2 exists to remove, so the sentence names the
         * number that was actually averaged and, when they differ, says how
         * many were left out and why they were.
         */}
        <p className="overall-method">
          Equal-weight mean across {result.areaCoverage.scored} scored assessment
          {result.areaCoverage.scored === 1 ? ' area' : ' areas'}. Every scored area counts the
          same, however many records it judged.
          {result.areaCoverage.scored < result.areaCoverage.total ? (
            <>
              {' '}
              {result.areaCoverage.total - result.areaCoverage.scored} of{' '}
              {result.areaCoverage.total} areas could not be scored and are not averaged in.
            </>
          ) : null}{' '}
          <span className="overall-model">Assessment Model {result.modelVersion}</span>
        </p>
        <ScoringDisclosure result={result} />
      </section>

      <section>
        <div className="section-head">
          <h2>Assessment areas</h2>
          <Link className="section-link" href="/findings">
            View all findings →
          </Link>
        </div>
        <p className="section-intro">
          {result.categoryScores.length} operational areas, in a fixed order. Each score is the
          share of evaluated records that passed the controls in that area {'—'} counting only the
          controls that reached a pass or fail.
        </p>

        <div className="areas">
          {result.categoryScores.map((c) => (
            <AreaRow key={c.category} area={c} result={result} />
          ))}
        </div>
      </section>
    </>
  );
}

/** One area: the question it answers, what it judged, the score, and its findings. */
function AreaRow({ area, result }: { area: CategoryScore; result: AssessmentResult }) {
  const a = AREAS[area.category];
  const tipId = `area-help-${area.category.replace(/[^a-z]+/gi, '-').toLowerCase()}`;

  /*
   * Every control in the area gets a row, whether or not it failed.
   * `result.findings` holds failures only, so iterating the area's own check
   * ids is what keeps a passing control visible instead of silently absent.
   */
  const controls = area.checkIds.map((id) => ({
    id,
    presentation: PRESENTATION[id],
    control: result.controls.find((c) => c.id === id) ?? null,
  }));

  const slaControl = controls.find((c) => c.id === 'sla-risk')?.control ?? null;

  return (
    <div className="area">
      <div className="area-head">
        <h3 className="area-name">
          {a.label}
          {/*
           * The plain-English question is supplemental, so it lives behind a
           * help trigger rather than sitting permanently beneath the name where
           * it competed with the control name for the same role.
           *
           * A real <button> is the trigger: it is focusable without a tabindex,
           * reachable by keyboard, and announced. Showing the tip is pure CSS
           * on :hover and :focus-visible, so no JavaScript and no library.
           */}
          <span className="area-help">
            <button type="button" className="help-trigger" aria-describedby={tipId}>
              <span aria-hidden="true">i</span>
              <span className="sr-only">What {a.label} measures</span>
            </button>
            <span role="tooltip" id={tipId} className="help-tip">
              {a.question}
            </span>
          </span>
        </h3>

        {/*
         * An unscored area shows no number, no meter and no band word. The
         * coverage line below carries the qualifier whenever fewer controls
         * were scored than the area holds, so a score is never read without
         * knowing how much of the area stands behind it.
         */}
        <div className="area-score-block">
          {area.score === null ? (
            <>
              <p className="area-score area-unscored">{NOT_SCORED}</p>
              <p className="area-band">No control in this area reached a pass or fail</p>
            </>
          ) : (
            <>
              <p className={`area-score ${meterClass(area.score)}`}>
                {area.score} <span className="area-scale">/ 100</span>
              </p>
              <ScoreMeter score={area.score} />
              <p className={`area-band ${meterClass(area.score)}`}>{healthLabel(area.score)}</p>
            </>
          )}
          {area.coverage.scored < area.coverage.total ? (
            <p className="area-coverage">
              {area.coverage.scored} of {area.coverage.total} controls scored
            </p>
          ) : null}
        </div>
      </div>

      {/*
       * One row per control. Each carries its own population, so two controls
       * in the same area keep two different denominators rather than being
       * added into a combined one that would be precise-looking and false.
       */}
      <ul className="controls">
        {controls.map(({ id, presentation, control }) => (
          <li key={id} className="control">
            <Link className="control-name" href={`/findings/${id}?from=overview`}>
              {presentation.label}
            </Link>
            {control ? (
              /*
               * "20 of 50 Leads evaluated · 30 not evaluated" rather than a bare
               * "20 evaluated". The denominator a control did not use is the
               * number a reader asks about first, so it is not left to the
               * detail page to answer.
               */
              <p className="control-metrics">
                <span>
                  {NUM.format(control.evaluated)} of {NUM.format(control.orgPopulation)}{' '}
                  {control.orgPopulationNoun} evaluated
                </span>
                {/*
                 * Two different facts, shown as two. "Could not be evaluated"
                 * is a gap in evidence; "not applicable" is a boundary working
                 * as intended. Collapsing them into one "not evaluated" count
                 * hides the first inside the second, and telling them apart is
                 * part of what this assessment is for.
                 */}
                {control.unmeasurableCount > 0 ? (
                  <span>{NUM.format(control.unmeasurableCount)} could not be evaluated</span>
                ) : null}
                {control.notEvaluatedCount - control.unmeasurableCount > 0 ? (
                  <span>
                    {NUM.format(control.notEvaluatedCount - control.unmeasurableCount)} not
                    applicable
                  </span>
                ) : null}
                <span className={control.failing > 0 ? 'bad' : undefined}>
                  {control.failing > 0
                    ? `${NUM.format(control.failing)} failing`
                    : 'No failing records'}
                </span>
                {control.score === null ? (
                  <span className="control-score control-unscored">
                    {NOT_SCORED} {'—'} {notScoredReason(control.scoreReason).toLowerCase()}
                  </span>
                ) : (
                  <span className={`control-score ${meterClass(control.score)}`}>
                    {control.score}
                  </span>
                )}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {/*
       * Only where the area holds more than one control, because that is the
       * only case where the area score is not simply the control score in the
       * row above it.
       */}
      {area.score !== null && area.coverage.scored > 1 ? (
        <p className="area-method">
          Area score ={' '}
          <span className="mono">
            (
            {controls
              .map(({ id }) => checkScoreOf(result, id))
              .filter((s): s is number => s !== null)
              .join(' + ')}
            ) ÷ {area.coverage.scored} = {area.score}
          </span>
        </p>
      ) : null}

      {/*
       * M-07, beside the attainment figure it guards.
       *
       * The metric dictionary is explicit that the SLA attainment rate must
       * never be reported without the share of records it could measure. A
       * rising score over a falling measurable share is not an improvement.
       */}
      {slaControl ? (
        <p className="area-method">
          Measurable population —{' '}
          <span className="mono">
            {NUM.format(slaControl.evaluated)} of {NUM.format(slaControl.orgPopulation)} Leads (
            {measurablePercent(slaControl)}%)
          </span>
          . A Lead never given a response commitment is counted as neither met nor breached.
        </p>
      ) : null}
    </div>
  );
}

/** How scoring works, in flow rather than as an overlay. */
function ScoringDisclosure({ result }: { result: AssessmentResult }) {
  const sla = result.controls.find((c) => c.id === 'sla-risk');
  // Whichever area holds more than one control - the only case the worked
  // example below is about. Named for the shape, not for a particular area.
  const multi = result.categoryScores.find((c) => c.checkIds.length > 1);

  return (
    <details className="scoring">
      <summary>How scoring works</summary>
      <div className="scoring-body">
        <dl>
          <dt>What records are counted?</dt>
          <dd>
            Each control is scored against the Salesforce records eligible for that check. Records
            outside that population are excluded rather than counted as passing.
          </dd>

          <dt>How is a check scored?</dt>
          <dd>
            A check score is the percentage of evaluated records that pass, rounded to a whole
            number. A check with nothing to evaluate is Not Scored — absence of evidence is neither
            a pass nor a failure, so it is left out of the average rather than counted as 100 or 0.
          </dd>

          <dt>How is an assessment-area score calculated?</dt>
          <dd>
            An area is the <strong>unweighted mean</strong> of the scores of the controls inside it —
            every control counts equally, regardless of how many records it judged. Overall health is
            the unweighted mean of the area scores.
            {multi && multi.checkIds.length > 1 ? (
              <>
                {' '}
                {AREAS[multi.category].label} combines {multi.checkIds.length} controls scored{' '}
                {multi.checkIds.map((id) => checkScoreOf(result, id)).join(' and ')}, so the area
                scores ({multi.checkIds.map((id) => checkScoreOf(result, id)).join(' + ')}) ÷{' '}
                {multi.checkIds.length} = {multi.score}. Their populations overlap and answer
                different questions, so they are <strong>not</strong> added into one denominator.
              </>
            ) : null}
          </dd>

          {sla ? (
            <>
              <dt>Worked example — {AREAS['SLA Performance'].label}</dt>
              <dd>
                {sla.evaluated} Leads have a measurable SLA commitment. {sla.failing} are at risk or
                breached, so {sla.evaluated - sla.failing} pass:{' '}
                <span className="mono">
                  {sla.evaluated - sla.failing} ÷ {sla.evaluated} = {sla.score}
                </span>
                . The other {sla.notEvaluatedCount} Leads in the org carry no SLA target and are{' '}
                <strong>not counted as passing</strong> — they sit outside this check&rsquo;s
                measurable population. This score does not measure every Lead: it measures{' '}
                <strong>
                  {sla.evaluated} of {sla.orgPopulation} ({measurablePercent(sla)}%)
                </strong>
                .
              </dd>
            </>
          ) : null}

          <dt>What does this screen prove?</dt>
          <dd>
            That these records are in this state right now. A finding reports what the org recorded;
            it is <strong>not</strong> a test of the Salesforce automation that produced it. Control
            behaviour is validated in the implementation log, not here.
          </dd>
        </dl>
      </div>
    </details>
  );
}

/**
 * The score one control contributed, as the engine computed it.
 *
 * Read rather than recomputed: a healthy control used to be assumed to be 100
 * because it has no entry in `findings`, which was true only by coincidence of
 * the formula. `controls` carries every control's real score.
 */
function checkScoreOf(result: AssessmentResult, id: string): number | null {
  // Null both when the control is unscored and when it is absent from the
  // run. Neither is a number, and neither should be invented as one.
  return result.controls.find((c) => c.id === id)?.score ?? null;
}

/** Share of the org population a control could actually measure. M-07. */
function measurablePercent(c: ControlSummary): number {
  if (c.orgPopulation === 0) return 0;
  return Math.round((100 * c.evaluated) / c.orgPopulation);
}
