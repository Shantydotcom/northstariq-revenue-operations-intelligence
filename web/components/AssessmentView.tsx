'use client';

import { useState } from 'react';
import CheckRow from './CheckRow';
import { checkDisplayName, formatObservedAt } from '@/lib/presentation';
import { AreaLifecycleIcon } from './Icons';
import {
  checkStatus,
  controlOf,
  lifecycleScope,
  noun,
  populationStory,
  progressionNote,
  splitAreas,
} from '@/lib/assessment-view';
import {
  CROSS_STAGE_CHECK,
  CROSS_STAGE_VIEWED_AT,
  JOURNEY,
  MARK_LABEL,
  stageMark,
  type JourneyStage,
} from '@/lib/lifecycle-journey';
import type { AssessmentResult, CategoryScore, CheckId } from '@/lib/types';

/**
 * THE ASSESSMENT - THE LEAD LIFECYCLE, AND NOTHING ELSE.
 *
 * One question: did Leads move through the expected stages, with the evidence
 * to support each claim? The other seven checks detect operational conditions
 * rather than lifecycle ones, and every one of them raises a finding, so they
 * belong to Findings - the page whose whole job is what needs attention. They
 * were removed from here rather than copied: their results, populations and
 * evidence are unchanged and reachable, just not restated on two pages.
 *
 * Nothing here is typed in - every count, name, outcome and reason is read
 * from the result, so a different org produces a different page rather than
 * the same page with different data behind it.
 *
 * NO SCORE IS SHOWN. The page answers what was checked, what was observed,
 * what needs attention and where to investigate it. The engine still scores -
 * findings, severity and the finding page are unchanged - but a number between
 * 0 and 100 is not an answer to any of those four questions, and putting one
 * here invited the reader to grade the org instead of reading the result.
 */

const NUM = new Intl.NumberFormat('en-US');

export default function AssessmentView({
  result,
  instanceHost,
}: {
  result: AssessmentResult;
  instanceHost?: string;
}) {
  const { lifecycle } = splitAreas(result.categoryScores);

  if (!lifecycle) {
    return (
      <p className="empty">
        This run reported no lifecycle area. Every finding it did produce is on Findings.
      </p>
    );
  }

  return <LeadLifecycle area={lifecycle} result={result} instanceHost={instanceHost} />;
}

/* ------------------------------------------------------------- lifecycle */

function LeadLifecycle({
  area,
  result,
  instanceHost,
}: {
  area: CategoryScore;
  result: AssessmentResult;
  instanceHost?: string;
}) {
  const [selected, setSelected] = useState<string>('mql');

  const stage = JOURNEY.find((s) => s.key === selected) ?? JOURNEY[1];
  const progression = progressionNote(controlOf(result, CROSS_STAGE_CHECK));
  const scope = lifecycleScope(result.controls, area.checkIds);

  /*
   * ONE ASSESSMENT, CHOSEN BY THE SELECTED MILESTONE.
   *
   * The journey records which control describes each milestone, so the
   * selection is the filter and nothing is derived. Two cases are not a
   * milestone's own control:
   *
   *   Lead - the cross-stage control is READ here, because it describes the
   *   whole path and the path starts here. It still judges no milestone: the
   *   Lead chip carries no mark, and `relatedCheck` is null exactly as before.
   *   Showing it under every milestone implied each one owned it.
   *
   *   Opportunity - no control judges it, and none is substituted. An empty
   *   statement is the truthful treatment; borrowing a neighbouring result to
   *   fill the table would attribute a finding to the wrong milestone.
   */
  const shown =
    (stage.relatedCheck
      ? controlOf(result, stage.relatedCheck)
      : stage.key === CROSS_STAGE_VIEWED_AT
        ? controlOf(result, CROSS_STAGE_CHECK)
        : null) ?? null;

  /* The population of that one control, in words, from its own figures. */
  const story = shown === null ? null : populationStory(shown);

  /* Moves focus to a control the reader asked to see. */
  const focusControl = (id: CheckId) => document.getElementById(`oc-check-${id}`)?.focus();

  return (
    <section className="oc-area oc-lifecycle" aria-labelledby="oc-lifecycle-h">
      <div className="oc-area-head">
        <span className="oc-area-icon" aria-hidden="true">
          <AreaLifecycleIcon />
        </span>
        <div className="oc-area-identity">
          {/*
           * A section heading, not the page heading. The page states its own
           * identity above; this names the subject of the section. It was an
           * h1 while Assessment had no header of its own - the document still
           * has exactly one h1, and it is now the route.
           */}
          <h2 id="oc-lifecycle-h">Lead Lifecycle</h2>
          {/*
           * One sentence. The path, the milestone panel and the assessment
           * below carry the rest - a paragraph explaining what the reader is
           * about to look at is a paragraph they read instead of looking.
           */}
          <p className="oc-area-question">
            See how Leads move through the revenue lifecycle and whether Salesforce supports each
            milestone.
          </p>
        </div>
        <p className="oc-area-scope">
          {scope ? (
            <span className="oc-scope-figure">
              Assessment scope: {NUM.format(scope.count)} Salesforce {scope.noun}
            </span>
          ) : null}
          <span className="oc-scope-when">Assessed {formatObservedAt(result.ranAt)}</span>
        </p>
      </div>

      {/* ------------------------------------------------- the governed path */}
      <div className="oc-journey">
        <div className="oc-journey-head">
          <p className="oc-journey-hint">
            Select a milestone to see what it means and how it was assessed.
          </p>
          {/*
           * Four states, because four things can be true of a milestone. The
           * fourth carries no marker on purpose: a milestone NorthstarIQ never
           * assessed must not be given a mark it has not earned.
           */}
          <p className="oc-journey-legend">
            <span className="oc-legend-item mark-passed">
              <span className="oc-legend-mark" aria-hidden="true" />
              {MARK_LABEL.passed}
            </span>
            <span className="oc-legend-item mark-attention">
              <span className="oc-legend-mark" aria-hidden="true" />
              {MARK_LABEL.attention}
            </span>
            <span className="oc-legend-item mark-more-information">
              <span className="oc-legend-mark" aria-hidden="true" />
              {MARK_LABEL['more-information']}
            </span>
            <span className="oc-legend-item mark-none">
              <span className="oc-legend-mark" aria-hidden="true" />
              {MARK_LABEL.none}
            </span>
          </p>
        </div>

        {/*
         * The path, drawn as one. The connectors are decorative and drawn in
         * CSS between adjacent steps: they show the order the governed model
         * permits, not a route every Lead is expected to complete.
         */}
        <div className="oc-stages is-path" role="tablist" aria-label="Lead lifecycle milestones">
          {JOURNEY.map((s) => {
            const related = s.relatedCheck ? controlOf(result, s.relatedCheck) : null;
            const mark = stageMark(s, related);
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                id={`oc-stage-${s.key}`}
                aria-selected={selected === s.key}
                aria-controls="oc-stage-panel"
                tabIndex={selected === s.key ? 0 : -1}
                className={`oc-stage${selected === s.key ? ' is-selected' : ''} mark-${mark}`}
                onClick={() => setSelected(s.key)}
                onKeyDown={(e) => {
                  const i = JOURNEY.findIndex((x) => x.key === selected);
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const next =
                      e.key === 'ArrowRight'
                        ? JOURNEY[(i + 1) % JOURNEY.length]
                        : JOURNEY[(i - 1 + JOURNEY.length) % JOURNEY.length];
                    setSelected(next.key);
                    document.getElementById(`oc-stage-${next.key}`)?.focus();
                  }
                }}
              >
                <span className="oc-stage-label">{s.label}</span>
                {/* No marker where nothing assessed this milestone. */}
                {mark === 'none' ? null : <span className="oc-stage-mark" aria-hidden="true" />}
                <span className="sr-only"> — {MARK_LABEL[mark]}</span>
              </button>
            );
          })}
        </div>

        <StagePanel stage={stage} result={result} onOpenCheck={focusControl} />
      </div>

      {/* ----------------------------------------------- Lifecycle assessment */}
      <div className="oc-results">
        <div className="oc-results-head">
          <h3 className="oc-results-title" id="oc-results-h">
            Lifecycle assessment
          </h3>
        </div>

        {shown === null ? (
          <p className="oc-results-empty">
            No assessment corresponds to the {stage.label} milestone.
          </p>
        ) : (
          <div className="oc-table-scroll">
            <CheckTable
              firstColumn="Assessment"
              controls={[shown]}
              instanceHost={instanceHost}
              outcomeFor={(id) => (id === CROSS_STAGE_CHECK ? progression?.text : undefined)}
            />
          </div>
        )}

        {/*
         * The whole population of the shown control, in its own terms.
         *
         * This replaced a paragraph that defined the column names and then
         * asserted they add up. The columns are on screen and the sum is
         * checkable; what a reader could not get was what the three groups
         * MEAN here - and that differs per control, which is why one general
         * paragraph could not carry it.
         */}
        {story === null ? null : <p className="oc-population-note">{story}</p>}
      </div>

    </section>
  );
}

function StagePanel({
  stage,
  result,
  onOpenCheck,
}: {
  stage: JourneyStage;
  result: AssessmentResult;
  onOpenCheck: (id: CheckId) => void;
}) {
  const related = stage.relatedCheck ? controlOf(result, stage.relatedCheck) : null;
  const mark = stageMark(stage, related);

  return (
    <div className="oc-stage-panel" id="oc-stage-panel" role="tabpanel" aria-labelledby={`oc-stage-${stage.key}`}>
      <p className="oc-stage-panel-head">
        <span className="oc-stage-panel-name">{stage.label}</span>
        {stage.expanded === stage.label ? null : (
          <span className="oc-stage-panel-expanded">{stage.expanded}</span>
        )}
      </p>

      <div className="oc-stage-grid">
        <div>
          <p className="oc-field-label">What this milestone means</p>
          <p className="oc-field-body">{stage.meaning}</p>
        </div>
        <div>
          <p className="oc-field-label">What NorthstarIQ checks</p>
          <p className="oc-field-body">
            {stage.checks || 'No control judges this milestone on its own.'}
          </p>
        </div>
        <div>
          <p className="oc-field-label">Result this run</p>
          <p className="oc-field-body">
            {related === null ? (
              'No result belongs to this milestone by itself.'
            ) : (
              <StageResult control={related} />
            )}
          </p>
        </div>
      </div>

      {/*
       * The bridge from the milestone to the control that judged it.
       *
       * The name is the control, so the name is what is pressable; the state
       * beside it is a result, and a result is not a destination. It moves
       * focus to the row below rather than navigating anywhere - the
       * assessment is already filtered to this control, so the only thing left
       * to do is take the reader to it.
       */}
      {stage.relatedCheck && related ? (
        <p className="oc-stage-related">
          <span className="oc-field-label">Assessed by</span>
          <button
            type="button"
            className="oc-related-link"
            onClick={() => onOpenCheck(stage.relatedCheck as CheckId)}
          >
            {checkDisplayName(stage.relatedCheck)}
            <span aria-hidden="true"> ↓</span>
            <span className="sr-only"> — go to this control in the lifecycle assessment</span>
          </button>
          <span className="oc-stage-mark-text">{MARK_LABEL[mark]}</span>
        </p>
      ) : null}
    </div>
  );
}

/** The stage's result, in the check's own numbers. Never a stage verdict. */
function StageResult({ control }: { control: NonNullable<ReturnType<typeof controlOf>> }) {
  /* "3 Leads", not "3 leads": the noun is a Salesforce object. */
  const plural = control.orgPopulationNoun;
  const count = (n: number) => noun(plural, n);
  const status = checkStatus(control);

  if (status === 'no-result') {
    return (
      <>
        <strong>Unable to determine.</strong> {NUM.format(control.unmeasurableCount)}{' '}
        {count(control.unmeasurableCount)} make this claim, and Salesforce does not hold enough
        evidence to settle any of them.
      </>
    );
  }
  if (status === 'failed') {
    return (
      <>
        <strong>
          {NUM.format(control.failing)} of {NUM.format(control.evaluated)}
        </strong>{' '}
        judged {count(control.evaluated)} failed this check.
      </>
    );
  }
  return (
    <>
      <strong>All {NUM.format(control.evaluated)}</strong> judged {count(control.evaluated)} passed
      this check.
    </>
  );
}

/* ------------------------------------------------------------ shared bits */

/**
 * The check table.
 *
 * Five columns of fact and one of onward navigation. The first column is
 * labelled by the caller because it names what the rows are, and a table with
 * two headings above it said the same thing twice.
 */
/**
 * The assessment table.
 *
 * Five columns of population and one of onward navigation. Sections and group
 * labels were removed with the milestone subheadings they carried: the table
 * shows the assessment for the selected milestone, and the milestone is
 * already named directly above it.
 */
function CheckTable({
  controls,
  instanceHost,
  outcomeFor,
  firstColumn = 'Check',
}: {
  controls: NonNullable<ReturnType<typeof controlOf>>[];
  instanceHost?: string;
  outcomeFor?: (id: string) => string | undefined;
  firstColumn?: string;
}) {
  return (
    <table className="oc-checks">
      <thead>
        <tr>
          <th scope="col">{firstColumn}</th>
          <th scope="col">Checked</th>
          <th scope="col">Passed</th>
          <th scope="col">Failed</th>
          <th scope="col">Undetermined</th>
          <th scope="col">Not claimed</th>
          {/* Named for a screen reader; the buttons below carry their own labels. */}
          <th scope="col">
            <span className="sr-only">Where to investigate</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {controls.map((c) => (
          <CheckRow
            key={c.id}
            control={c}
            instanceHost={instanceHost}
            outcome={outcomeFor?.(c.id)}
          />
        ))}
      </tbody>
    </table>
  );
}

