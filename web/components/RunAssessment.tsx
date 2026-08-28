import type { Category, SalesforceStatus } from '@/lib/types';
import { AREAS } from '@/lib/presentation';
import {
  AreaAccountIcon,
  AreaLeadsIcon,
  AreaLifecycleIcon,
  AreaPipelineIcon,
  AreaRoutingIcon,
  AreaSlaIcon,
  LockIcon,
  PlayIcon,
} from './Icons';
import Summit from './Summit';

/**
 * RUN A NEW ASSESSMENT — the pre-assessment experience.
 *
 * Rendered only while no result exists. Once an assessment completes the
 * Overview takes the page; this component never competes with it.
 *
 * Two things in the approved mockup are deliberately absent here, and their
 * space is given to true information rather than to a facsimile of them:
 *
 *   TIME WINDOW  A global date filter would change which records each control
 *                evaluates, which is a change to assessment methodology and
 *                not a change to a page. It needs its own requirement.
 *   COMPARISON   Comparing runs needs assessment history, and NorthstarIQ
 *                persists nothing. A greyed control labelled "coming soon"
 *                would still be a claim that the capability is nearly here.
 *
 * A disabled dropdown was considered for both and rejected: a control a reader
 * can see is a promise, whether or not it is clickable.
 */

/** Icon and accent per area. Presentation only - the label carries meaning. */
const AREA_MARKS: Record<Category, { icon: (p: { className?: string }) => React.ReactElement; tone: string }> = {
  'Data Quality': { icon: AreaLeadsIcon, tone: 'blue' },
  Routing: { icon: AreaRoutingIcon, tone: 'green' },
  'Identity & Matching': { icon: AreaAccountIcon, tone: 'violet' },
  'SLA Performance': { icon: AreaSlaIcon, tone: 'amber' },
  'Pipeline Hygiene': { icon: AreaPipelineIcon, tone: 'red' },
  /*
   * Assessment Area #6. Present for type completeness and ready for the day
   * the area is scored, which it has been since Model v2.
   */
  'Lifecycle Governance': { icon: AreaLifecycleIcon, tone: 'violet' },
};

/**
 * The areas the scope band shows: the six that are actually scored.
 *
 * Lifecycle Governance joined them in Assessment Model v2. The band lists
 * only areas the assessment really executes, so it stays a promise the run
 * can keep rather than a description of what was built.
 */
const AREA_ORDER: Category[] = [
  'Data Quality',
  'Routing',
  'Identity & Matching',
  'SLA Performance',
  'Pipeline Hygiene',
  'Lifecycle Governance',
];

export default function RunAssessment({
  status,
  running,
  onRun,
}: {
  status: SalesforceStatus;
  running: boolean;
  onRun: () => void;
}) {
  return (
    <div className="run">
      {/* ------------------------------------------------------------ hero */}
      <section className="run-hero" aria-labelledby="run-title">
        <div className="run-hero-body">
          <h1 id="run-title">Run a New Assessment</h1>
          <p className="run-lede">
            NorthstarIQ evaluates governed Revenue Operations controls in your Salesforce org to
            identify control failures, data gaps and records that need investigation.
          </p>

          {/*
           * The security claim, bounded to what the application does.
           *
           * "This application reads" - not "the Salesforce integration
           * principal is read-only", which the evidence does not support. That
           * boundary is set out in security-model.md, and this notice must not
           * quietly widen it.
           */}
          <p className="run-safe">
            <LockIcon className="run-safe-icon" />
            <span>
              <strong>SAFE &amp; READ-ONLY</strong> Running an assessment does not create, update
              or delete any Salesforce record. NorthstarIQ only reads your data to evaluate control
              performance.
            </span>
          </p>
        </div>

        {/* Decorative, original artwork. See Summit.tsx. */}
        <Summit className="run-hero-art" />
      </section>

      {/* --------------------------------------------- assessment scope band */}
      <section className="scope" aria-labelledby="scope-title">
        <h2 className="scope-eyebrow" id="scope-title">
          Assessment scope
        </h2>
        <p className="scope-lede">
          Eleven governed controls are evaluated across these six assessment areas.
        </p>

        <ul className="scope-areas">
          {AREA_ORDER.map((category) => {
            const area = AREAS[category];
            const { icon: Icon, tone } = AREA_MARKS[category];
            return (
              <li key={category}>
                <span className={`scope-mark tone-${tone}`}>
                  <Icon />
                </span>
                <h3>{area.label}</h3>
                <p>{area.question}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ----------------------------------------------- supporting + action */}
      <div className="run-lower">
        <div className="run-lower-main">
          <div className="run-facts">
            <section className="panel run-fact">
              <h2 className="eyebrow">What is evaluated</h2>
              <p>
                Every control is scored only over the records it can actually judge. Records outside
                that population are reported with the reason they were left out — they are never
                counted as passing.
              </p>
              <dl className="run-fact-list">
                <div>
                  <dt>Objects read</dt>
                  <dd>Lead, Opportunity</dd>
                </div>
                <div>
                  <dt>Also counted</dt>
                  <dd>Account, Contact</dd>
                </div>
                <div>
                  <dt>Salesforce operations</dt>
                  <dd>SOQL query only</dd>
                </div>
              </dl>
            </section>

            <section className="panel run-fact">
              <h2 className="eyebrow">How scoring works</h2>
              <p>
                A control scores the share of the records it evaluated that passed. An area is the
                unweighted mean of its controls, and overall health the unweighted mean of the five
                areas.
              </p>
              <p className="run-formula mono">round(100 × (1 − failing ÷ evaluated))</p>
              <p className="footnote">
                A control with nothing to evaluate scores 100 — absence of data is not evidence of
                failure.
              </p>
            </section>
          </div>

          {/* The one primary action on the page. */}
          <section className="run-cta">
            <button className="primary run-go" onClick={onRun} disabled={running || !status.connected}>
              <PlayIcon className="run-go-icon" />
              {running ? 'Assessing…' : 'Run assessment'}
            </button>
            <p className="run-cta-note">
              {running
                ? 'Querying Salesforce and evaluating controls…'
                : 'Results appear here when the run completes. You can re-run at any time.'}
            </p>
          </section>
        </div>

        <section className="panel run-steps" aria-labelledby="steps-title">
          <h2 className="eyebrow" id="steps-title">
            What happens when you run an assessment?
          </h2>
          <ol>
            <li>
              <span className="run-step-n" aria-hidden="true">
                1
              </span>
              <span>NorthstarIQ reads the Salesforce records the controls need.</span>
            </li>
            <li>
              <span className="run-step-n" aria-hidden="true">
                2
              </span>
              <span>Seven governed controls are evaluated across the five assessment areas.</span>
            </li>
            <li>
              <span className="run-step-n" aria-hidden="true">
                3
              </span>
              <span>
                Records outside a control&rsquo;s evaluable population are listed with the reason.
              </span>
            </li>
            <li>
              <span className="run-step-n" aria-hidden="true">
                4
              </span>
              <span>
                Failures become findings carrying Source Evidence and the records behind them.
              </span>
            </li>
            <li>
              <span className="run-step-n" aria-hidden="true">
                5
              </span>
              <span>Every result opens the real record in Salesforce, without changing it.</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
