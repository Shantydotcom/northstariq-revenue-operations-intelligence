/**
 * Assessment Model v3, end to end over fixtures.
 *
 * The other suites test each control against its own governed definition. This
 * one tests the MODEL: what happens to an area and to overall health when some
 * of its controls reach no pass or fail, which is the whole reason v2 exists.
 *
 * The shape below is deliberately the live baseline in miniature - one Lead the
 * lifecycle safeguard governed, and one that claims conversion the platform
 * never performed - so a regression here shows up as a wrong number rather than
 * as a missing abstraction.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runAllChecks } from '../lib/checks/index.ts';
import { buildAssessment, MODEL_VERSION } from '../lib/score.ts';
import { evidenceExport, findingsExport, notEvaluatedExport } from '../lib/export-model.ts';
import { GOVERNANCE, NO_HISTORY, READINESS_SOURCES, TODAY, lead, opportunity } from './fixtures.ts';

/** A Lead the lifecycle safeguard actually ran on: it carries the stage stamp. */
const governed = () =>
  lead({
    Status: 'Working - Contacted',
    Lifecycle_Stage_Entered__c: '2026-08-21T09:00:00.000+0000',
  });

/** The live baseline's defect: a converted status with no conversion behind it. */
const claimsConverted = () => lead({ Status: 'Closed - Converted', IsConverted: false });

const assess = () =>
  buildAssessment(
    runAllChecks(
      [governed(), claimsConverted()],
      [opportunity()],
      TODAY,
      READINESS_SOURCES,
      GOVERNANCE,
      NO_HISTORY,
    ),
    3,
    ['Lead', 'Opportunity'],
    TODAY.toISOString(),
  );

const lifecycleArea = () =>
  assess().categoryScores.find((c) => c.category === 'Lifecycle Governance')!;

/* ------------------------------------------------------------- activation */

test('Model v3 reports six assessment areas and twelve controls', () => {
  const a = assess();
  assert.equal(a.categoryScores.length, 6);
  assert.equal(a.controls.length, 12);
  assert.ok(a.categoryScores.some((c) => c.category === 'Lifecycle Governance'));
});

test('the result names the model that produced it', () => {
  const a = assess();
  assert.equal(a.modelVersion, 'v3');
  assert.equal(a.modelVersion, MODEL_VERSION, 'one constant, not a string per consumer');
});

/* --------------------------------------------- the four lifecycle controls */

test('the four lifecycle controls split into two scored and two unscored', () => {
  /**
   * The live baseline in miniature, and the exact reason Model v2 was needed:
   * two controls observe something, two cannot. Under Model v1 the two that
   * observed nothing would each have contributed 100 and pulled the area to 75
   * - above the area's true observed performance, on the strength of evidence
   * that does not exist.
   */
  const byId = new Map(assess().controls.map((c) => [c.id, c]));

  const progression = byId.get('lifecycle-progression')!;
  assert.ok(progression.evaluated > 0);
  assert.equal(progression.failing, 0);
  assert.equal(progression.score, 100);

  const conversion = byId.get('lifecycle-conversion')!;
  assert.equal(conversion.evaluated, 1);
  assert.equal(conversion.failing, 1);
  assert.equal(conversion.score, 0);

  for (const id of ['mql-integrity', 'sales-acceptance-sql'] as const) {
    const c = byId.get(id)!;
    assert.equal(c.evaluated, 0, `${id} judged nothing`);
    assert.equal(c.score, null, `${id} is not scored`);
    assert.notEqual(c.score, 100, `${id} must not be reported as perfect`);
    assert.equal(c.scoreReason, 'insufficient-evidence');
    assert.ok(c.unmeasurableCount > 0, 'records exist that it could not judge');
  }
});

test('Lifecycle Governance scores the controls that observed something', () => {
  const area = lifecycleArea();

  assert.equal(area.score, 50, 'mean(100, 0) - the two controls that reached a verdict');
  assert.notEqual(area.score, 75, 'not mean(100, 100, 100, 0), which Model v1 would have given');
  assert.deepEqual(area.coverage, { scored: 2, total: 4 });
  assert.equal(area.checkIds.length, 4, 'all four are still reported, scored or not');
});

/* ------------------------------------------------------------- overall */

test('overall health averages only the areas that produced a score', () => {
  const a = assess();
  const scored = a.categoryScores.map((c) => c.score).filter((s): s is number => s !== null);

  assert.equal(a.overallHealth, Math.round(scored.reduce((sum, s) => sum + s, 0) / scored.length));
  assert.deepEqual(a.areaCoverage, { scored: scored.length, total: 6 });
});

/* ------------------------------------------------------------- findings */

test('an unscored control generates no finding, and a failing one still does', () => {
  /**
   * The boundary that keeps the findings queue a list of demonstrated problems.
   * "I could not judge this" is reported through the population counts; only
   * "this failed" reaches the queue.
   */
  const a = assess();
  const ids = a.findings.map((f) => f.id);

  assert.ok(!ids.includes('mql-integrity'), 'no evidence is not a finding');
  assert.ok(!ids.includes('sales-acceptance-sql'), 'no evidence is not a finding');
  assert.ok(ids.includes('lifecycle-conversion'), 'a demonstrated contradiction is');

  const conversion = a.findings.find((f) => f.id === 'lifecycle-conversion')!;
  assert.equal(conversion.affected, 1);
  assert.equal(conversion.severity, 'High');
  assert.equal(conversion.category, 'Lifecycle Governance');
});

/* ------------------------------------------------------------- exports */

test('a downloaded file says which model produced it', () => {
  const [run] = findingsExport(assess());
  const rows = new Map(run.rows.map((r) => [String(r[0]), r[1]]));

  assert.equal(rows.get('Assessment model'), 'Model v3');
  assert.equal(rows.get('Assessment areas reported'), 6);
  assert.equal(rows.get('Assessment areas scored'), 6);
  assert.ok(
    String(rows.get('Model comparability')).includes('not directly comparable'),
    'the file warns against comparing a v1 score with a v2 one',
  );
});

test('an unscored control exports as Not Scored, never as a number', () => {
  const results = runAllChecks(
    [governed(), claimsConverted()],
    [opportunity()],
    TODAY,
    READINESS_SOURCES,
    GOVERNANCE,
    NO_HISTORY,
  );
  const mql = results.find((r) => r.id === 'mql-integrity')!;

  const at = TODAY.toISOString();
  for (const sheets of [evidenceExport(mql, at, undefined), notEvaluatedExport(mql, at, undefined)]) {
    const rows = new Map(sheets[0].rows.map((r) => [String(r[0]), r[1]]));
    assert.equal(rows.get('Control Score'), 'Not scored');
    assert.notEqual(rows.get('Control Score'), 0);
    assert.notEqual(rows.get('Control Score'), 100);
  }

  // And no fabricated arithmetic in place of the calculation it never did.
  const rows = new Map(evidenceExport(mql, at, undefined)[0].rows.map((r) => [String(r[0]), r[1]]));
  const calc = String(rows.get('Calculation'));
  assert.ok(calc.startsWith('Not scored'), calc);
  assert.ok(!calc.includes('/ 1)'), 'no divide-by-one stand-in for an absent denominator');
});
