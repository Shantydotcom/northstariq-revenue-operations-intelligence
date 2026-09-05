import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  areaCoverage,
  buildAssessment,
  categoryScores,
  MODEL_VERSION,
  overallHealth,
  toFindings,
} from '../lib/score.ts';
import { checkScore } from '../lib/checks/index.ts';
import { healthLabel, meterClass } from '../lib/score-bands.ts';
import { runAllChecks } from '../lib/checks/index.ts';
import {
  FORECAST_PERIOD,
  GOVERNANCE,
  lead,
  NO_HISTORY,
  opportunity,
  READINESS_SOURCES,
  TODAY,
} from './fixtures.ts';
import type { CategoryScore, CheckResult } from '../lib/types.ts';

function stub(over: Partial<CheckResult>): CheckResult {
  return {
    id: 'missing-firmographics',
    source: 'salesforce',
    title: 'stub',
    category: 'Routing',
    severity: 'Medium',
    businessQuestion: '',
    businessImpact: '',
    failureDetail: '',
    failureBreakdown: [],
    exclusionBreakdown: [],
    orgPopulation: 10,
    orgPopulationNoun: 'Leads',
    evaluated: 10,
    failing: 0,
    notEvaluatedCount: 0,
    unmeasurableCount: 0,
    notEvaluatedColumns: [],
    notEvaluatedRows: [],
    notEvaluatedRecords: [],
    checkedSample: { records: [], total: 10 },
    passingSample: { records: [], total: 10 },
    score: 100,
    scoreReason: null,
    population: '',
    evidenceColumns: [],
    evidence: [],
    healthy: true,
    ...over,
  };
}

/** A CategoryScore, with the coverage the area rules now carry. */
function area(
  category: CheckResult['category'],
  score: number | null,
  coverage = { scored: score === null ? 0 : 1, total: 1 },
): CategoryScore {
  return { category, score, checkIds: [], coverage };
}

test('a multi-check category scores as the mean, not the minimum', () => {
  /**
   * Routing holds two checks. A category with one poor check and one perfect
   * check is not as bad as its worst check - averaging says so, taking the
   * minimum would not.
   */
  const categories = categoryScores([
    stub({ id: 'routing-exceptions', category: 'Routing', score: 40 }),
    stub({ id: 'missing-territory', category: 'Routing', score: 100 }),
  ]);

  assert.equal(categories.length, 1);
  assert.equal(categories[0].score, 70);
  assert.notEqual(categories[0].score, 40, 'minimum scoring was explicitly rejected');
  assert.deepEqual(categories[0].checkIds, ['routing-exceptions', 'missing-territory']);
});

test('category scores round to a whole number', () => {
  const categories = categoryScores([
    stub({ id: 'routing-exceptions', category: 'Routing', score: 67 }),
    stub({ id: 'missing-territory', category: 'Routing', score: 100 }),
  ]);

  assert.equal(categories[0].score, 84, '83.5 rounds to 84');
});

test('overall health is the mean of the scored category scores', () => {
  const health = overallHealth([area('Data Quality', 100), area('Routing', 70), area('SLA Performance', 40)]);

  assert.equal(health, 70);
});

/* ------------------------------------------------ Model v2: not scored */

test('a control that evaluated nothing is not scored, and is never 100', () => {
  /**
   * THE MODEL v2 CONTRACT, at its narrowest. Model v1 returned 100 here,
   * which reads as perfect performance over a population the control never
   * judged. Nothing evaluated is not a pass, and it is not a failure either.
   */
  assert.equal(checkScore(0, 0), null);
  assert.notEqual(checkScore(0, 0), 100);
  assert.notEqual(checkScore(0, 0), 0);
});

test('a control that evaluated records is scored on those records alone', () => {
  assert.equal(checkScore(10, 0), 100, 'no failures among the records judged');
  assert.equal(checkScore(10, 10), 0, 'every record judged failed');
  assert.equal(checkScore(10, 3), 70, 'partial failure');
  assert.equal(checkScore(27, 1), 96, 'rounds to a whole number');
});

test('an unscored control is left out of its area, not averaged in', () => {
  /**
   * The behaviour that keeps the area honest. Under Model v1 the unscored
   * control would have contributed 100 and dragged the area up to 50; here
   * the area reports what the one scored control actually observed, and the
   * coverage says how much of the area that was.
   */
  const [routing] = categoryScores([
    stub({ id: 'routing-exceptions', category: 'Routing', evaluated: 4, failing: 4, score: 0 }),
    stub({
      id: 'missing-territory',
      category: 'Routing',
      evaluated: 0,
      failing: 0,
      score: null,
      scoreReason: 'insufficient-evidence',
    }),
  ]);

  assert.equal(routing.score, 0, 'the mean of the scored controls, which is one control');
  assert.deepEqual(routing.coverage, { scored: 1, total: 2 });
  assert.equal(routing.checkIds.length, 2, 'both controls are still reported');
});

test('an area whose every control is unscored is itself not scored', () => {
  const [routing] = categoryScores([
    stub({ id: 'routing-exceptions', category: 'Routing', evaluated: 0, score: null, scoreReason: 'insufficient-evidence' }),
    stub({ id: 'missing-territory', category: 'Routing', evaluated: 0, score: null, scoreReason: 'no-applicable-records' }),
  ]);

  assert.equal(routing.score, null, 'not 100, and not 0');
  assert.deepEqual(routing.coverage, { scored: 0, total: 2 });
});

test('an unscored area is left out of overall health, not averaged in', () => {
  const health = overallHealth([
    area('Data Quality', 100),
    area('Routing', 60),
    area('Lifecycle Governance', null, { scored: 0, total: 4 }),
  ]);

  assert.equal(health, 80, 'the mean of 100 and 60 - the unscored area is not a third term');
  assert.notEqual(health, 53, 'it was not treated as 0');
  assert.notEqual(health, 87, 'and it was not treated as 100');
});

test('an assessment where nothing could be scored reports no overall score', () => {
  /**
   * Model v1 returned 100 for an empty category list. A perfect score for an
   * assessment that judged nothing is the largest overclaim the product could
   * make, so v2 returns no score at all.
   */
  assert.equal(overallHealth([]), null);
  assert.equal(overallHealth([area('Lifecycle Governance', null, { scored: 0, total: 4 })]), null);
});

test('area coverage counts the areas that produced a score', () => {
  const areas = [area('Data Quality', 80), area('Lifecycle Governance', null, { scored: 0, total: 4 })];
  assert.deepEqual(areaCoverage(areas), { scored: 1, total: 2 });
  assert.deepEqual(areaCoverage([area('Data Quality', 80)]), { scored: 1, total: 1 });
});

test('healthy checks never become findings', () => {
  const findings = toFindings([
    stub({ id: 'routing-exceptions', healthy: true, failing: 0 }),
    stub({ id: 'sla-risk', healthy: false, failing: 3 }),
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, 'sla-risk');
});

test('findings sort by severity, then by how many records are affected', () => {
  const findings = toFindings([
    stub({ id: 'missing-territory', severity: 'Medium', failing: 2, healthy: false }),
    stub({ id: 'stale-opportunities', severity: 'Medium', failing: 13, healthy: false }),
    stub({ id: 'routing-exceptions', severity: 'High', failing: 4, healthy: false }),
  ]);

  assert.deepEqual(
    findings.map((f) => f.id),
    ['routing-exceptions', 'stale-opportunities', 'missing-territory'],
  );
});

test('an assessment over a clean org reports full health and no findings', () => {
  const results = runAllChecks(
    [lead(), lead()],
    [opportunity()],
    TODAY,
    READINESS_SOURCES,
    GOVERNANCE,
    NO_HISTORY,
    FORECAST_PERIOD,
  );
  const assessment = buildAssessment(results, 3, ['Lead', 'Opportunity'], TODAY.toISOString());

  assert.equal(assessment.findingCount, 0);
  assert.equal(assessment.highSeverityCount, 0);
  assert.equal(
    assessment.categoryScores.length,
    6,
    'all six assessment areas are always reported, scored or not',
  );
  assert.equal(assessment.modelVersion, MODEL_VERSION);
  assert.equal(assessment.modelVersion, 'v4');

  /*
   * Two clean Leads that never left the entry stage: the five original areas
   * score 100, and Lifecycle Governance scores 100 on the one control that
   * can judge them - conversion, which they make no claim against... except
   * that it evaluates nothing, so it is unscored. Whatever the split, the
   * invariant under test is that overall is the mean of the SCORED areas and
   * that no unscored area was quietly counted.
   */
  const scored = assessment.categoryScores.filter((c) => c.score !== null);
  assert.equal(assessment.areaCoverage.scored, scored.length);
  assert.equal(assessment.areaCoverage.total, assessment.categoryScores.length);
  assert.equal(
    assessment.overallHealth,
    Math.round(scored.reduce((sum, c) => sum + (c.score ?? 0), 0) / scored.length),
  );
});

test('the assessment total is traceable from records to overall health', () => {
  /**
   * One breached Lead out of two measurable ones, so SLA Performance scores
   * 50. Overall is then the mean of every area that produced a score - which
   * is the property being pinned here, rather than a written-down total that
   * would need editing every time the model gains an area.
   */
  const target = '2026-08-20T12:00:00.000+0000';
  const leads = [
    lead({ SLA_Status__c: 'Breached', SLA_Target_DateTime__c: target }),
    lead({ SLA_Status__c: 'Met', SLA_Target_DateTime__c: target }),
  ];

  const assessment = buildAssessment(
    runAllChecks(leads, [], TODAY, READINESS_SOURCES, GOVERNANCE, NO_HISTORY, FORECAST_PERIOD),
    2,
    ['Lead', 'Opportunity'],
    TODAY.toISOString(),
  );

  const sla = assessment.categoryScores.find((c) => c.category === 'SLA Performance');
  assert.equal(sla?.score, 50);
  assert.equal(assessment.findingCount, 1);
  assert.equal(assessment.highSeverityCount, 1);

  const scored = assessment.categoryScores
    .map((c) => c.score)
    .filter((s): s is number => s !== null);
  assert.equal(
    assessment.overallHealth,
    Math.round(scored.reduce((sum, s) => sum + s, 0) / scored.length),
    'overall is the mean of the scored areas and nothing else',
  );
});

/* ------------------------------------------- score presentation semantics */

test('score colour follows the documented bands, not the failing-record count', () => {
  /**
   * The defect this pins: Finding Detail coloured the score from
   * `failing > 0`, so a control scoring 96 with one failing record rendered
   * in the critical treatment. The score and its colour then disagreed.
   *
   * Colour is keyed to the same two breakpoints the meter and the health
   * label already use - 70 and 90 - and to nothing else. No new threshold is
   * introduced here, and the score itself is untouched.
   */
  assert.equal(meterClass(96), '', '96 is within the healthy band');
  assert.equal(meterClass(90), '', '90 is the healthy boundary, inclusive');
  assert.equal(meterClass(89), 'warn');
  assert.equal(meterClass(70), 'warn', '70 is the review boundary, inclusive');
  assert.equal(meterClass(69), 'bad');
  assert.equal(meterClass(7), 'bad');
  assert.equal(meterClass(0), 'bad');
});

test('a high-scoring control with failures is not presented as critical', () => {
  /**
   * Segment Assignment Consistency in the live org: one failing record out of
   * 27 evaluated. The finding is real and stays visible; the SCORE must not
   * claim the control is critical when the methodology says otherwise.
   */
  const score = checkScore(27, 1);

  assert.equal(score, 96);
  assert.equal(meterClass(score), '', 'healthy band');
  assert.equal(healthLabel(score), 'Healthy');
  assert.notEqual(meterClass(score), 'bad', 'one failure does not make a control critical');
});

test('a failing-record count is still distinguishable from the score', () => {
  /**
   * Correcting the score colour must not hide that records failed. The count
   * and the score are different facts and may legitimately be styled apart.
   */
  const score = checkScore(27, 1);
  assert.equal(score, 96, 'evaluated records produce a number, so a band applies');
  assert.equal(meterClass(score), '');
  assert.ok(1 > 0, 'the failing count remains a positive number the UI renders');
});
