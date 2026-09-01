'use client';

import { useState } from 'react';
import type { SalesforceStatus } from '@/lib/types';
import { useAssessmentRun } from '@/lib/assessment-store';
import RunAssessment from './RunAssessment';
import AssessmentView from './AssessmentView';
import {
  AssessmentOrientation,
  AssessmentPanels,
  AssessmentSummary,
} from './AssessmentSummary';
import Notice, { DisconnectedNotice } from './Notice';
import { PlayIcon } from './Icons';
import { formatObservedAt } from '@/lib/presentation';

/** Grouping is fixed rather than locale-derived so server and client agree. */
const NUM = new Intl.NumberFormat('en-US');

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
  /*
   * The result and the run live in `lib/assessment-store` so Dashboard reads
   * the same one. Nothing about the behaviour here changed: same endpoint,
   * same storage key, same shape guard, same restore-after-mount.
   */
  const { result, restored, running, error, run: runAssessment } = useAssessmentRun(status.connected);
  const [live, setLive] = useState('');

  async function run() {
    setLive('Running the assessment.');
    const next = await runAssessment();
    if (next === null) {
      setLive('The assessment could not be completed.');
      return;
    }
    /*
     * The announcement says what the run did, in the same terms the page
     * shows: records read and issues found. No score - the page displays
     * none, and repeating a number the reader cannot see would leave them
     * nothing to check it against.
     */
    setLive(
      `Assessment complete. ${NUM.format(next.recordsAssessed)} records assessed, ` +
        `${NUM.format(next.findingCount)} ` +
        `${next.findingCount === 1 ? 'issue' : 'issues'} found.`,
    );
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
  /*
   * Nothing is asserted until the store has looked.
   *
   * The same defect as Dashboard: a tab holding a result painted "Run a New
   * Assessment" first and replaced it after restoration. The guard is the only
   * change to this component - the two experiences below are untouched.
   */
  if (status.connected && !restored) {
    return (
      <>
        {liveRegion}
        <p className="empty">Checking for a completed assessment…</p>
      </>
    );
  }

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

      {/*
       * One header line: what the page is on the left, the one action on the
       * right.
       *
       * NO METADATA HERE. The run time and the population belong to the
       * lifecycle assessment that produced them, where a reader can see what
       * they describe; beside the title they were two figures competing with
       * the heading and the action for the same glance. Neither was deleted -
       * both are stated under Lead Lifecycle.
       *
       * The Salesforce connection is not restated here either. It belongs to
       * Integrations, and neither approved reference shows it.
       */}
      {/*
       * THE PAGE HEADER, AND THE PAGE'S OWN IDENTITY.
       *
       * The reference image for this page carries a Dashboard title, because
       * the design it records was drawn while this content still lived on the
       * Dashboard. Route identity governs: this is Assessment, and it says so.
       * The reference's header structure - title and lede on the left, the run
       * time and the one action on the right - is what is reproduced.
       */}
      <div className="as-head">
        <div className="as-head-title">
          <h1>Assessment</h1>
          <p className="lede">What NorthstarIQ evaluated, and what each control determined.</p>
        </div>
        <div className="as-head-aside">
          {result ? (
            <p className="as-head-meta">
              <span className="as-head-meta-label">Last assessed</span>
              <span className="as-head-meta-value">{formatObservedAt(result.ranAt)}</span>
            </p>
          ) : null}
          <button
            className="primary as-head-run"
            onClick={run}
            disabled={running || !status.connected}
          >
            <PlayIcon className="as-run-icon" />
            {running ? 'Assessing…' : 'Run new assessment'}
          </button>
        </div>
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

          {result ? (
            <>
              {/*
               * The reference's reading order, top to bottom: what the run
               * concluded, where this page stops, the governed lifecycle, then
               * the areas, priorities and connection around it, then the one
               * next step.
               *
               * The lifecycle is the full implemented experience rather than
               * the compact strip the reference draws, because on Assessment
               * the detail is on this page - showing both an overview and the
               * detail would be the same six milestones twice.
               */}
              <AssessmentSummary result={result} />
              <AssessmentOrientation />
              <AssessmentView result={result} instanceHost={status.instanceHost} />
              <AssessmentPanels result={result} status={status} />
            </>
          ) : (
            <FirstRun running={running} />
          )}
        </>
      )}
    </>
  );
}

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
