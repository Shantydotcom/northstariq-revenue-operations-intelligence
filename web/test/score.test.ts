import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAssessment, categoryScores, overallHealth, toFindings } from '../lib/score.ts';
import { runAllChecks } from '../lib/checks/index.ts';
import { lead, opportunity, TODAY, READINESS_SOURCES } from './fixtures.ts';
import type { CheckResult } from '../lib/types.ts';

function stub(over: Partial<CheckResult>): CheckResult {
  return {
    id: 'missing-firmographics',
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
    score: 100,
    population: '',
    evidenceColumns: [],
    evidence: [],
    healthy: true,
    ...over,
  };
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

test('overall health is the mean of the category scores', () => {
  const health = overallHealth([
    { category: 'Data Quality', score: 100, checkIds: [] },
    { category: 'Routing', score: 70, checkIds: [] },
    { category: 'SLA Performance', score: 40, checkIds: [] },
  ]);

  assert.equal(health, 70);
});

test('an empty category list scores 100 rather than 0', () => {
  assert.equal(overallHealth([]), 100);
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
  const results = runAllChecks([lead(), lead()], [opportunity()], TODAY, READINESS_SOURCES);
  const assessment = buildAssessment(results, 3, ['Lead', 'Opportunity'], TODAY.toISOString());

  assert.equal(assessment.overallHealth, 100);
  assert.equal(assessment.findingCount, 0);
  assert.equal(assessment.highSeverityCount, 0);
  assert.equal(assessment.categoryScores.length, 5, 'all five categories are always reported');
});

test('the assessment total is traceable from records to overall health', () => {
  /**
   * One breached Lead out of two measurable ones: SLA Performance scores 50,
   * the other four categories score 100, so overall health is 90.
   */
  const target = '2026-08-20T12:00:00.000+0000';
  const leads = [
    lead({ SLA_Status__c: 'Breached', SLA_Target_DateTime__c: target }),
    lead({ SLA_Status__c: 'Met', SLA_Target_DateTime__c: target }),
  ];

  const assessment = buildAssessment(
    runAllChecks(leads, [], TODAY, READINESS_SOURCES),
    2,
    ['Lead', 'Opportunity'],
    TODAY.toISOString(),
  );

  const sla = assessment.categoryScores.find((c) => c.category === 'SLA Performance');
  assert.equal(sla?.score, 50);
  assert.equal(assessment.overallHealth, 90);
  assert.equal(assessment.findingCount, 1);
  assert.equal(assessment.highSeverityCount, 1);
});
