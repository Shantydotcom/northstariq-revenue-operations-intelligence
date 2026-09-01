'use client';

import Link from 'next/link';
import { CHECK_IDS } from '@/lib/checks';
import {
  areaCoverage,
  areaLines,
  recommendedNextStep,
  severityCounts,
  topPriorities,
} from '@/lib/dashboard';
import { areaDisplayName, formatObservedAt } from '@/lib/presentation';
import {
  AlertCircleIcon,
  AreaAccountIcon,
  AreaLeadsIcon,
  AreaLifecycleIcon,
  AreaPipelineIcon,
  AreaRoutingIcon,
  AreaSlaIcon,
  AssessmentIcon,
  CheckCircleIcon,
  FindingsIcon,
  HelpCircleIcon,
} from './Icons';
import type { AssessmentResult, Category, SalesforceStatus } from '@/lib/types';

/**
 * WHAT THE COMPLETED ASSESSMENT REPORTS.
 *
 * `design-references/Assessment Page.png` is this page's visual authority. The
 * summary, the areas, the priorities, the snapshot and the next step were
 * previously rendered on the Dashboard, which switched into a different page
 * once a run finished. The Dashboard keeps one architecture now, and this - the
 * richer evaluation experience - belongs to the page whose job it is.
 *
 * NOTHING HERE RE-DECIDES ANYTHING. Every figure is counted from the result the
 * assessment already produced, through the same helpers as before: no
 * population is recomputed, no severity reassigned, no priority invented. The
 * findings queue is already ordered by severity and then by affected records,
 * and this reads that order rather than ranking anything of its own.
 *
 * NO SCORE IS SHOWN, and none is derived. Outcomes are the application's own:
 * Passed, Failed and Unable to determine.
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
 * One soft tint per area, as the reference colours the area cards.
 *
 * DECORATIVE. Each card names its area and states its outcome in words beside
 * a mark, so nothing here is carried by colour - the tint only keeps six cards
 * in a row from reading as one undifferentiated block.
 */
const AREA_TONE: Record<Category, string> = {
  'Data Quality': 'tone-blue',
  Routing: 'tone-ok',
  'Identity & Matching': 'tone-violet',
  'SLA Performance': 'tone-amber',
  'Pipeline Hygiene': 'tone-red',
  'Lifecycle Governance': 'tone-indigo',
};

/* ------------------------------------------------------ completion summary */

/**
 * The head of the page: what the run did, when, and how it divided.
 *
 * Four figures, each a count the result already holds. The fourth is the one
 * most builds would leave out: areas where no control reached a verdict are
 * reported as their own outcome rather than folded into "no findings", because
 * nothing determined is not the same claim as nothing found.
 */
export function AssessmentSummary({ result }: { result: AssessmentResult }) {
  const coverage = areaCoverage(areaLines(result));
  const severities = severityCounts(result.findings);

  return (
    <section className="as-summary" aria-labelledby="as-summary-h">
      <div className="as-summary-main">
        <span className="as-summary-art" aria-hidden="true">
          <AssessmentIcon />
          <span className="as-summary-badge">
            <CheckCircleIcon />
          </span>
        </span>

        <div>
          <h2 id="as-summary-h">Assessment completed</h2>
          <p className="as-summary-lede">
            NorthstarIQ evaluated Salesforce against {CHECK_IDS.length} governed Revenue Operations
            controls.
          </p>
          <p className="as-summary-when">Completed {formatObservedAt(result.ranAt)}</p>
          <p className="as-summary-readonly">
            <span className="as-tag-ok">Read-only</span>
            Nothing in Salesforce was created, changed or deleted.
          </p>
        </div>
      </div>

      <dl className="as-stats">
        <Stat
          icon={<AlertCircleIcon />}
          tone="tone-red"
          value={result.findingCount}
          label={`${result.findingCount === 1 ? 'Finding requires' : 'Findings require'} attention`}
        >
          {severities.length > 0 ? (
            <span className="as-stat-split">
              {severities.map((s) => (
                <span className={`as-sev sev-${s.severity}`} key={s.severity}>
                  {s.count} {s.severity}
                </span>
              ))}
            </span>
          ) : null}
        </Stat>

        <Stat
          icon={<FindingsIcon />}
          tone="tone-amber"
          value={coverage.withFindings}
          label="Areas with findings"
        >
          <span className="as-stat-split">of {coverage.total} areas</span>
        </Stat>

        <Stat
          icon={<CheckCircleIcon />}
          tone="tone-ok"
          value={coverage.clear}
          label="Areas with no findings"
        >
          <span className="as-stat-split">of {coverage.total} areas</span>
        </Stat>

        <Stat
          icon={<HelpCircleIcon />}
          tone="tone-violet"
          value={coverage.undetermined}
          label="Unable to determine"
        >
          <span className="as-stat-split">of {coverage.total} areas</span>
        </Stat>
      </dl>
    </section>
  );
}

function Stat({
  icon,
  tone,
  value,
  label,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  value: number;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="as-stat">
      <span className={`as-stat-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <dd>{NUM.format(value)}</dd>
      <dt>{label}</dt>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ orientation */

/**
 * Where this page stops and the next one starts.
 *
 * The reference puts an orientation bar here pointing from Dashboard into
 * Assessment. This is Assessment, so it points onward instead: the specific
 * detected issues are Findings' job, and this page does not reproduce them.
 */
export function AssessmentOrientation() {
  return (
    <p className="as-orient">
      <span>
        This page shows what was evaluated and what each control determined. The specific detected
        issues are in Findings.
      </span>
      <Link className="as-orient-go" href="/findings">
        View all findings<span aria-hidden="true"> →</span>
      </Link>
    </p>
  );
}

/* ----------------------------------------------------------- panels + next */

/**
 * The three supporting panels and the closing step.
 *
 * They sit below the lifecycle because the lifecycle is what this page is for;
 * these summarise the run around it and hand off to the page that owns each
 * detail rather than reproducing it.
 */
export function AssessmentPanels({
  result,
  status,
}: {
  result: AssessmentResult;
  status: SalesforceStatus;
}) {
  const areas = areaLines(result);
  const priorities = topPriorities(result);
  const next = recommendedNextStep(result);

  return (
    <>
      {/* ------------------------------------------------------------- areas */}
      {/*
       * Full width, so the six areas sit in one row as the reference draws
       * them. It was in the two-column grid beside the priorities, which left
       * the wide column half empty once the lifecycle moved out of it.
       */}
      <section className="as-panel as-areas" aria-labelledby="as-areas-h">
          <div className="as-panel-head">
            <h2 id="as-areas-h">Revenue Operations areas</h2>
            <p>How each area came out of this run.</p>
          </div>

          <ul className="as-area-grid">
            {areas.map((area) => {
              const Icon = AREA_ICONS[area.category];
              /*
               * An area nothing could be determined for is never reported as
               * clear. The three states are the assessment's own, read from
               * the result rather than inferred from a finding count alone.
               */
              const state = area.undetermined
                ? 'undetermined'
                : area.findings > 0
                  ? 'attention'
                  : 'clear';
              return (
                <li key={area.category} className={`as-area state-${state}`}>
                  <span
                    className={`as-area-icon ${AREA_TONE[area.category]}`}
                    aria-hidden="true"
                  >
                    <Icon />
                  </span>
                  <span className="as-area-name">{areaDisplayName(area.category)}</span>
                  <span className="as-area-count">
                    {area.findings} {area.findings === 1 ? 'finding' : 'findings'}
                  </span>
                  <span className="as-area-state">
                    <span className="as-area-mark" aria-hidden="true" />
                    {state === 'attention'
                      ? 'Needs attention'
                      : state === 'undetermined'
                        ? 'Unable to determine'
                        : 'No issues found'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

      <div className="as-grid">
        {/* ------------------------------------------------------ priorities */}
        <section className="as-panel" aria-labelledby="as-priorities-h">
          <div className="as-panel-head">
            <h2 id="as-priorities-h">Top priorities right now</h2>
            {/*
             * NOT A RECOMMENDATION ENGINE. The findings queue is already
             * ordered by severity and then by how many records each affects;
             * this shows the first three of that existing order and adds no
             * ranking of its own.
             */}
            <p>The findings the queue already puts first.</p>
          </div>

          {priorities.length === 0 ? (
            <p className="as-empty">No finding needs attention from this run.</p>
          ) : (
            <ul className="as-priority-list">
              {priorities.map((p) => (
                <li key={p.id}>
                  <Link href={`/findings/${p.id}`}>
                    {/*
                     * The mark repeats the severity the chip already states in
                     * words at the other end of the row - decorative, never
                     * the only carrier of it.
                     */}
                    <span className={`as-priority-mark sev-${p.severity}`} aria-hidden="true">
                      <AlertCircleIcon />
                    </span>
                    <span className="as-priority-main">
                      <span className="as-priority-title">{p.title}</span>
                      <span className="as-priority-area">{p.area}</span>
                    </span>
                    <span className={`as-sev-chip sev-${p.severity}`}>{p.severity}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="as-panel-foot">
            <Link href="/findings">
              View all findings<span aria-hidden="true"> →</span>
            </Link>
          </p>
        </section>

        {/* -------------------------------------------------------- snapshot */}
        <section className="as-panel" aria-labelledby="as-snapshot-h">
          <div className="as-panel-head">
            <h2 id="as-snapshot-h">Operational snapshot</h2>
            <p>The connection this run read.</p>
          </div>

          <dl className="as-snapshot-list">
            <div>
              <dt>Edition</dt>
              <dd>{status.environment}</dd>
            </div>
            <div>
              <dt>Connection</dt>
              <dd className={status.connected ? 'as-snapshot-ok' : undefined}>
                <span className="as-dot" aria-hidden="true" />
                {status.connected ? 'Connected (read-only)' : 'Unavailable'}
              </dd>
            </div>
            <div>
              <dt>Objects read</dt>
              <dd>{result.objectsAssessed.join(', ')}</dd>
            </div>
            <div>
              <dt>Records read</dt>
              <dd>{NUM.format(result.recordsAssessed)}</dd>
            </div>
            <div>
              <dt>Data reflects</dt>
              <dd>{formatObservedAt(result.ranAt)}</dd>
            </div>
          </dl>

          <p className="as-panel-foot">
            <Link href="/integrations">
              View integration details<span aria-hidden="true"> →</span>
            </Link>
          </p>
        </section>
      </div>

      {/* --------------------------------------------- recommended next step */}
      {/*
       * DETERMINISTIC, AND NOT AN AI RECOMMENDATION. It is a lookup over counts
       * the result already holds: the highest severity present decides the
       * sentence and supplies its figures. The action is suppressed when it
       * would point at this page - the reader is already here.
       */}
      <section className="as-next" aria-labelledby="as-next-h">
        <div>
          <h2 className="as-eyebrow" id="as-next-h">
            Recommended next step
          </h2>
          <p className="as-next-headline">{next.headline}</p>
          <p className="as-next-detail">{next.detail}</p>
        </div>
        {next.action && next.action.href !== '/assessment' ? (
          <Link className="primary as-next-go" href={next.action.href}>
            {next.action.label}
            <span aria-hidden="true"> →</span>
          </Link>
        ) : null}
      </section>
    </>
  );
}
