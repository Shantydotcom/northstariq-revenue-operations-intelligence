import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runAllChecks, CHECK_IDS } from '../lib/checks/index.ts';
import { buildAssessment, CATEGORIES } from '../lib/score.ts';
import { JOURNEY } from '../lib/lifecycle-journey.ts';
import {
  SEVERITY_ORDER,
  areaCoverage,
  areaLines,
  countOf,
  lifecycleStages,
  recommendedNextStep,
  scopeAreas,
  severityCounts,
  topPriorities,
} from '../lib/dashboard.ts';
import {
  FORECAST_PERIOD,
  GOVERNANCE,
  lead,
  NO_HISTORY,
  opportunity,
  READINESS_SOURCES,
  TODAY,
} from './fixtures.ts';
import type { AssessmentResult } from '../lib/types.ts';

/**
 * THE DASHBOARD, PROVED WITHOUT A BROWSER.
 *
 * Dashboard reports on a result it did not produce, so every one of these
 * asserts the same thing from a different angle: that it counts what the
 * assessment already decided and adds nothing of its own. No score, no
 * re-ranking, no invented status.
 */

const EXCEPTION_QUEUE = { Name: 'NIQ Routing Exception', Type: 'Queue' };
const RAN_AT = '2026-08-29T00:00:00.000Z';

const LEADS = [
  lead(),
  lead({ LeadSource: 'Web', Match_Status__c: null }),
  lead({ LeadSource: 'Purchased List' }),
  lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Account Match' }),
  lead({ SLA_Target_DateTime__c: null, SLA_Status__c: 'Unmeasurable', SLA_Basis__c: null }),
  lead({ CountryCode: null }),
  lead({ Segment_Basis__c: null }),
];
const OPPS = [opportunity(), opportunity({ IsClosed: true }), opportunity({ CloseDate: '2026-01-05' })];

const assess = (): AssessmentResult =>
  buildAssessment(
    runAllChecks(LEADS, OPPS, TODAY, READINESS_SOURCES, GOVERNANCE, NO_HISTORY, FORECAST_PERIOD),
    LEADS.length + OPPS.length,
    ['Lead', 'Opportunity'],
    RAN_AT,
  );

/* ---------------------------------------------------------------- counting */

test('severity counts add up to the findings the assessment produced', () => {
  const result = assess();
  const counts = severityCounts(result.findings);
  const total = counts.reduce((n, c) => n + c.count, 0);
  assert.equal(total, result.findings.length);
  for (const c of counts) assert.ok(c.count > 0, 'a zero severity must not be shown');
});

test('every area the assessment reported reaches the dashboard', () => {
  const result = assess();
  const lines = areaLines(result);
  assert.equal(lines.length, result.categoryScores.length);
  for (const line of lines) {
    assert.ok(CATEGORIES.includes(line.category), `${line.category}`);
    assert.equal(
      line.findings,
      result.findings.filter((f) => f.category === line.category).length,
      `${line.category} miscounted its findings`,
    );
  }
});

test('area coverage partitions the areas and never double-counts one', () => {
  const lines = areaLines(assess());
  const cover = areaCoverage(lines);
  assert.equal(cover.total, lines.length);
  assert.equal(cover.withFindings + cover.clear + cover.undetermined, cover.total);
});

test('an area nothing could be determined for is never counted as clear', () => {
  const lines = [
    { category: CATEGORIES[0], name: 'A', findings: 0, undetermined: true },
    { category: CATEGORIES[1], name: 'B', findings: 0, undetermined: false },
    { category: CATEGORIES[2], name: 'C', findings: 2, undetermined: false },
  ];
  const cover = areaCoverage(lines);
  assert.equal(cover.undetermined, 1);
  assert.equal(cover.clear, 1, 'only the area that raised nothing AND reached a verdict is clear');
  assert.equal(cover.withFindings, 1);
});

/* -------------------------------------------------------------- priorities */

test('priorities are the queue order, not a ranking of their own', () => {
  const result = assess();
  const shown = topPriorities(result, 3);
  assert.deepEqual(
    shown.map((p) => p.id),
    result.findings.slice(0, 3).map((f) => f.id),
  );
  for (const p of shown) {
    const source = result.findings.find((f) => f.id === p.id);
    assert.ok(source);
    assert.equal(p.severity, source.severity, `${p.id} changed severity`);
  }
});

test('priorities are capped and never invented', () => {
  const result = assess();
  assert.ok(topPriorities(result, 3).length <= 3);
  assert.ok(topPriorities(result, 3).length <= result.findings.length);
  assert.equal(topPriorities({ ...result, findings: [] }, 3).length, 0);
});

/* --------------------------------------------------------------- lifecycle */

test('the dashboard shows the one authoritative lifecycle, in order', () => {
  const stages = lifecycleStages(assess());
  assert.deepEqual(
    stages.map((s) => s.label),
    ['Lead', 'MQL', 'SAL', 'SQL', 'Conversion', 'Opportunity'],
  );
  assert.equal(stages.length, JOURNEY.length);
});

test('a milestone no control judges is reported as unassessed, never as clean', () => {
  const stages = lifecycleStages(assess());
  for (const stage of stages) {
    const source = JOURNEY.find((j) => j.key === stage.key);
    assert.ok(source);
    if (source.relatedCheck === null) {
      assert.equal(stage.assessed, false, `${stage.key}`);
      assert.equal(stage.mark, 'none', `${stage.key} was given a mark it has not earned`);
    }
  }
});

test('every milestone state is carried in words as well as a mark', () => {
  for (const stage of lifecycleStages(assess())) {
    assert.ok(stage.markLabel.length > 0, stage.key);
  }
});

/* -------------------------------------------------------- next step, scope */

test('the next step names the highest severity present, and links somewhere real', () => {
  const result = assess();
  const step = recommendedNextStep(result);
  const highest = SEVERITY_ORDER.find((s) => countOf(result.findings, s) > 0);

  if (highest) {
    assert.ok(step.headline.includes(String(countOf(result.findings, highest))));
    assert.ok(step.headline.includes(highest));
  }
  assert.ok(step.action, 'there is always somewhere to go');
  assert.ok(
    ['/findings', '/assessment'].includes(step.action.href),
    'the next step must point at a route that exists',
  );
});

test('with nothing found, the next step claims nothing about the org', () => {
  const step = recommendedNextStep({ ...assess(), findings: [] });
  assert.match(step.headline, /No finding needs attention/);
  assert.match(step.detail, /not about the whole org/);
});

test('the next step is deterministic - same result, same words', () => {
  const result = assess();
  assert.deepEqual(recommendedNextStep(result), recommendedNextStep(result));
});

test('the first-run scope is the real model, and states no per-area count', () => {
  const areas = scopeAreas();
  assert.equal(areas.length, CATEGORIES.length);
  for (const a of areas) {
    assert.ok(a.name.length > 0 && a.question.length > 0, a.category);
    assert.ok(!('checks' in a), 'no static check-to-area mapping may be invented here');
  }
  assert.equal(CHECK_IDS.length, 14, 'the control count the first-run state states');
});

/* ------------------------------------------------------------- no scoring */

test('nothing the dashboard derives is a score', () => {
  const result = assess();
  const words = [
    ...severityCounts(result.findings).map((s) => `${s.count} ${s.severity}`),
    ...areaLines(result).map((a) => `${a.name} ${a.findings}`),
    ...lifecycleStages(result).map((s) => s.markLabel),
    recommendedNextStep(result).headline,
    recommendedNextStep(result).detail,
  ]
    .join(' ')
    .toLowerCase();

  for (const banned of ['/ 100', 'out of 100', 'score', 'health']) {
    assert.ok(!words.includes(banned), `the dashboard says "${banned}"`);
  }
});

test('the assessment result is unchanged by anything the dashboard reads', () => {
  const a = assess();
  const b = assess();
  areaLines(a);
  lifecycleStages(a);
  topPriorities(a);
  recommendedNextStep(a);
  assert.deepEqual(a.findings, b.findings);
  assert.deepEqual(a.controls, b.controls);
  assert.deepEqual(a.categoryScores, b.categoryScores);
});
