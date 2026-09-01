'use client';

import Link from 'next/link';
import { CHECK_IDS } from '@/lib/checks';
import { CATEGORIES } from '@/lib/score';
import { useAssessmentRun } from '@/lib/assessment-store';
import { areaCoverage, areaLines, scopeAreas } from '@/lib/dashboard';
import { formatObservedAt } from '@/lib/presentation';
import Notice, { DisconnectedNotice } from './Notice';
import ConnectionPill from './ConnectionPill';
import Summit from './Summit';
import {
  AlertCircleIcon,
  AssessmentIcon,
  AreaAccountIcon,
  AreaLeadsIcon,
  AreaLifecycleIcon,
  AreaPipelineIcon,
  AreaRoutingIcon,
  AreaSlaIcon,
  DashboardIcon,
  FindingsIcon,
  LockIcon,
  PlayIcon,
  VerificationIcon,
} from './Icons';
import type { AssessmentResult, Category, SalesforceStatus } from '@/lib/types';

/**
 * THE DASHBOARD - ONE PAGE ARCHITECTURE, ALWAYS.
 *
 * `design-references/Homepage.png` is the Dashboard's visual authority at all
 * times. Completing an assessment updates the values and labels this page can
 * truthfully state; IT DOES NOT REPLACE THE PAGE. The earlier build had two
 * substantially different Dashboards - a first-run one and a completed one -
 * and switching between them meant the homepage became a different product the
 * moment a run finished. That model is retired.
 *
 * The richer post-assessment experience - the completion summary, the
 * lifecycle, the areas, the priorities, the snapshot and the next step - lives
 * on `/assessment`, which has its own reference and its own job. None of that
 * work was deleted: it moved to the page that owns it.
 *
 * What stays here is orientation: what an assessment reads, what it will not
 * do, the six areas it covers, and the one action that starts it. The run is
 * the same `/api/assessment/run` the Assessment page calls, through the same
 * store, so a run started on either page is the run the other one shows.
 *
 * NO SCORE IS SHOWN, and none is derived.
 */

const NUM = new Intl.NumberFormat('en-US');

const AREA_ICONS: Record<Category, (p: { className?: string }) => React.ReactElement> = {
  'Data Quality': AreaLeadsIcon,
  Routing: AreaRoutingIcon,
  'Identity & Matching': AreaAccountIcon,
  'SLA Performance': AreaSlaIcon,
  'Pipeline Hygiene': AreaPipelineIcon,
  'Lifecycle Governance': AreaLifecycleIcon,
};

/*
 * One soft tint per area in the first-run scope grid, as the approved
 * reference colours them.
 *
 * DECORATIVE ONLY. Every area is named in words beside its mark, none of these
 * tints is a status, and nothing on this page carries meaning by colour alone.
 * Applied to the first-run scope cells only - the completed state reports real
 * per-area outcomes, and a decorative tint there would compete with the marks
 * that do mean something.
 */
const AREA_TONE: Record<Category, string> = {
  'Data Quality': 'tone-blue',
  Routing: 'tone-ok',
  'Identity & Matching': 'tone-violet',
  'SLA Performance': 'tone-amber',
  'Pipeline Hygiene': 'tone-red',
  'Lifecycle Governance': 'tone-indigo',
};

export default function Dashboard({ status }: { status: SalesforceStatus }) {
  const { result, restored, running, error, run } = useAssessmentRun(status.connected);

  /*
   * The completed run, once the store has actually looked for one.
   *
   * `result === null` means "not looked yet" before restoration and "there is
   * none" after it, so every value below is gated on `restored` rather than on
   * the result alone. The page itself no longer waits: its architecture is the
   * same either way, so it renders immediately and the few runtime values fill
   * in - there is no longer a layout to swap.
   */
  const assessed = restored ? result : null;

  const action = (
    <button
      type="button"
      className="primary db-run"
      onClick={() => void run()}
      disabled={running || !status.connected || !restored}
    >
      <PlayIcon className="db-run-icon" />
      {running ? 'Assessing…' : assessed ? 'Run new assessment' : 'Run assessment'}
    </button>
  );

  return (
    <>
      <div className="db-head">
        <div className="db-head-title">
          {/*
           * The title alone, in both runtime states. The reference puts no
           * second sentence here, and the hero immediately below already says
           * what this page is for.
           */}
          <h1>Dashboard</h1>
        </div>
        <div className="db-head-aside">
          {/*
           * The reference fills this slot with the assessment's status. It
           * shows "No assessment yet", which is not restored; what is shown
           * instead is the one status the application can state truthfully -
           * when the last completed run read the org. It waits for the store
           * to answer, because before that the page has no basis for either
           * claim.
           */}
          {assessed ? (
            <p className="db-head-meta">
              <span className="db-head-meta-label">Last assessed</span>
              <span className="db-head-meta-value">{formatObservedAt(assessed.ranAt)}</span>
            </p>
          ) : null}
          {action}
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
                ? 'The result below is the last one that completed — it has not been replaced with a partial or estimated result.'
                : 'No partial or estimated result is shown — an assessment either read the org or it did not.'}
            </Notice>
          ) : null}

          {/*
           * ONE ARCHITECTURE. There is no second Dashboard to branch into -
           * the completed run changes what a few of these elements can say,
           * not which page the reader is on.
           */}
          <Home assessed={assessed} running={running} onRun={() => void run()} status={status} />
        </>
      )}
    </>
  );
}

/* ============================================================ the homepage */

/**
 * The Dashboard body, reproduced from `Homepage.png` and unchanged by whether
 * an assessment has completed.
 *
 * It describes the scope rather than reporting on it: what an assessment reads,
 * what it will not do, and the six areas it covers. Every figure is a real
 * constant of the model - the number of areas and the number of controls - not
 * an example.
 *
 * A completed run reaches exactly two places here: the third summary figure,
 * which can then state how many areas raised something, and the closing note,
 * which then says where the result is. Nothing else moves, and no section
 * appears or disappears.
 */
function Home({
  assessed,
  running,
  onRun,
  status,
}: {
  assessed: AssessmentResult | null;
  running: boolean;
  onRun: () => void;
  status: SalesforceStatus;
}) {
  const areas = scopeAreas();
  /* Counted from the result the assessment already produced; nothing re-decided. */
  const coverage = assessed ? areaCoverage(areaLines(assessed)) : null;

  return (
    <>
      <section className="db-hero" aria-labelledby="db-hero-h">
        <div className="db-hero-art" aria-hidden="true">
          <span className="db-hero-disc">
            <Summit className="db-hero-summit" />
          </span>
        </div>

        <div className="db-hero-main">
          <p className="db-eyebrow">Get started</p>
          <h2 id="db-hero-h">Run an assessment to see where you stand</h2>
          <p className="db-hero-lede">
            NorthstarIQ reads your Salesforce data and evaluates {CHECK_IDS.length} controls across{' '}
            {CATEGORIES.length} areas of Revenue Operations.
          </p>
          {/*
           * The reference pairs the primary action with a secondary one.
           *
           * "How it works" goes to `/assessment`, which is where the
           * application already answers it: with no completed run that route
           * states the scope, what is evaluated, how results are reported and
           * what happens when an assessment runs. It is a real route and a
           * truthful destination - no new page, and nothing invented to fill
           * the slot the reference draws.
           */}
          <div className="db-hero-actions">
            <button type="button" className="primary db-hero-run" onClick={onRun} disabled={running}>
              <PlayIcon className="db-run-icon" />
              {running ? 'Assessing…' : 'Run assessment'}
            </button>
            <Link className="db-hero-how" href="/assessment">
              How it works<span aria-hidden="true"> →</span>
            </Link>
          </div>
        </div>

        {/* The three assurances the reference states, in its own words. */}
        <ul className="db-assurances">
          <li>
            <span className="db-assurance-icon tone-ok" aria-hidden="true">
              <LockIcon />
            </span>
            <span>
              <strong>Read-only by design</strong>
              Nothing in Salesforce is created, changed or deleted.
            </span>
          </li>
          <li>
            <span className="db-assurance-icon tone-blue" aria-hidden="true">
              <VerificationIcon />
            </span>
            <span>
              <strong>Safe &amp; secure</strong>
              Uses least-privilege access via a dedicated integration.
            </span>
          </li>
          <li>
            <span className="db-assurance-icon tone-violet" aria-hidden="true">
              <PlayIcon />
            </span>
            <span>
              <strong>Repeat anytime</strong>
              Run assessments as often as you need to track progress.
            </span>
          </li>
        </ul>
      </section>

      {/*
       * The scope band the approved reference shows.
       *
       * Three of the four figures are constants of the model and are stated.
       * The fourth is not: with no completed run there is no count of areas
       * needing attention, and printing a 0 would read as "none found" rather
       * than "not yet looked". It shows an em dash and says why.
       */}
      {/*
       * Three items, not four. The read-only guarantee was stated here, again
       * in the section below and again in the hero; the hero is where it
       * belongs, so the duplicates are gone.
       */}
      <dl className="db-scope-band">
        <div>
          <span className="db-band-icon tone-blue" aria-hidden="true">
            <DashboardIcon />
          </span>
          <dd>{CATEGORIES.length}</dd>
          <dt>Assessment areas</dt>
          <p>Cover key RevOps processes</p>
        </div>
        <div>
          <span className="db-band-icon tone-ok" aria-hidden="true">
            <AssessmentIcon />
          </span>
          <dd>{CHECK_IDS.length}</dd>
          <dt>Controls</dt>
          <p>Designed to detect risk and gaps</p>
        </div>
        <div>
          <span className="db-band-icon tone-amber" aria-hidden="true">
            <FindingsIcon />
          </span>
          {/*
           * THE ONE FIGURE A RUN CHANGES.
           *
           * Before a run there is no result, so "0 areas with issues" would
           * read as "assessed and found none" rather than "not yet looked": an
           * em dash states the absence and the line beneath says why. After a
           * run it is the count the assessment already produced - areas that
           * raised at least one finding - and nothing is recomputed here.
           */}
          {coverage ? (
            <>
              <dd>{NUM.format(coverage.withFindings)}</dd>
              <dt>Areas with issues</dt>
              <p>of {coverage.total} areas raised findings</p>
            </>
          ) : (
            <>
              <dd className="db-none">—</dd>
              <dt>Areas with issues</dt>
              <p>Run an assessment to see results</p>
            </>
          )}
        </div>
      </dl>

      <section className="db-scope" aria-labelledby="db-scope-h">
        <div className="db-section-head">
          <h2 id="db-scope-h">What an assessment covers</h2>
          <p className="db-section-meta">
            {CATEGORIES.length} areas · {CHECK_IDS.length} checks
          </p>
        </div>
        {/*
         * One bordered container with cell rules, as the reference draws it -
         * six separate cards read as six choices rather than as one scope.
         *
         * NO PER-AREA CHECK COUNT. The reference shows one on each cell, and
         * nothing in the application can supply it without a completed run:
         * which checks belong to which area is established by the detectors at
         * run time. A static map here would be a second source of truth for
         * assessment configuration, so the count is omitted and reported.
         */}
        <ul className="db-scope-grid">
          {areas.map((area) => {
            const Icon = AREA_ICONS[area.category];
            return (
              <li key={area.category}>
                <span className={`db-area-icon ${AREA_TONE[area.category]}`} aria-hidden="true">
                  <Icon />
                </span>
                <span className="db-scope-name">{area.name}</span>
                <span className="db-scope-question">{area.question}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/*
       * The Salesforce connection, moved off the sidebar.
       *
       * IT IS THE EXISTING COMPONENT AND THE EXISTING STATE. `ConnectionPill`
       * is what Integrations already renders, given the same `SalesforceStatus`
       * this page was already handed by the server. Nothing about how the
       * connection is determined changed - only where it is shown.
       */}
      <section className="db-connection" aria-labelledby="db-connection-h">
        <div className="db-connection-main">
          <p className="db-eyebrow" id="db-connection-h">
            Salesforce connection
          </p>
          <ConnectionPill status={status} />
        </div>
        <Link className="db-connection-go" href="/integrations">
          View integration details<span aria-hidden="true"> →</span>
        </Link>
      </section>

      {/*
       * The closing note, corrected for where the result actually lives.
       *
       * It used to say results appear here when the run completes. They do not
       * - the Dashboard keeps this architecture and Assessment reports the
       * run - so the sentence now says so rather than describing a page that
       * no longer exists.
       */}
      <p className="db-footnote">
        <AlertCircleIcon className="db-footnote-icon" aria-hidden="true" />
        <span>
          An assessment reads Salesforce and reports on it as it stands right now.{' '}
          {assessed ? (
            <>
              <Link href="/assessment">Assessment</Link> shows what the last run evaluated and what
              each control determined, and you can run it again at any time.
            </>
          ) : (
            <>
              The result appears in <Link href="/assessment">Assessment</Link> when the run
              completes, and you can run it again at any time.
            </>
          )}
        </span>
      </p>
    </>
  );
}
