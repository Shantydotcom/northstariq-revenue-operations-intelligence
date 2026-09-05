import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ambiguousMatch, missingFirmographics, runAllChecks, staleOpportunities } from '../lib/checks/index.ts';
import { buildAssessment } from '../lib/score.ts';
import { applyAreaFilter, areaFilterHref, isCategory, readAreaFilter } from '../lib/area-filter.ts';
import {
  FORECAST_PERIOD,
  GOVERNANCE,
  lead,
  NO_HISTORY,
  opportunity,
  READINESS_SOURCES,
  TODAY,
} from './fixtures.ts';
import type { CheckResult, FindingSummary } from '../lib/types.ts';

/** The queue routing parks a Lead in when it refuses to guess an owner. */
const EXCEPTION_QUEUE = { Name: 'NIQ Routing Exception', Type: 'Queue' };
const RAN_AT = '2026-08-28T00:00:00.000Z';

/**
 * THE INTERACTION FOUNDATION.
 *
 * The Assessment design wants to open the records behind Checked, Passed,
 * Failed and No Result. These prove the application now retains enough to do
 * that truthfully - and, just as importantly, that retaining it changed no
 * population, no score and no finding.
 */

/** A population that exercises every branch of every check. */
const LEADS = [
  lead(),
  lead({ LeadSource: 'Web', Match_Status__c: null }),
  lead({ LeadSource: 'Purchased List' }),
  lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Account Match' }),
  lead({ SLA_Target_DateTime__c: null, SLA_Status__c: 'Unmeasurable', SLA_Basis__c: null }),
  lead({ CountryCode: null }),
  lead({ Segment_Basis__c: null }),
];
const OPPS = [
  opportunity(),
  opportunity({ IsClosed: true, StageName: 'Closed Won' }),
  opportunity({ CloseDate: '2026-01-05' }),
];

const runAll = (): CheckResult[] =>
  runAllChecks(LEADS, OPPS, TODAY, READINESS_SOURCES, GOVERNANCE, NO_HISTORY, FORECAST_PERIOD);

/* ------------------------------------------------ retained record identity */

test('the checked sample names records without changing how many were checked', () => {
  for (const r of runAll()) {
    assert.equal(r.checkedSample.total, r.evaluated, `${r.id}: checked total must be the evaluated count`);
    assert.ok(
      r.checkedSample.records.length <= r.checkedSample.total,
      `${r.id}: retained more records than it says it checked`,
    );
    for (const ref of r.checkedSample.records) {
      assert.ok(ref.id.length > 0, `${r.id}: a checked record has no id to open in Salesforce`);
      assert.ok(ref.label.length > 0, `${r.id}: a checked record has no label`);
    }
  }
});

test('every checked record is one of the records the run actually read', () => {
  const leadIds = new Set(LEADS.map((l) => l.Id));
  const oppIds = new Set(OPPS.map((o) => o.Id));
  for (const r of runAll()) {
    const known = r.orgPopulationNoun === 'Opportunities' ? oppIds : leadIds;
    for (const ref of r.checkedSample.records) {
      assert.ok(known.has(ref.id), `${r.id}: checked a record the assessment never read`);
    }
  }
});

test('passing is the judged set minus the failing set, and nothing else', () => {
  for (const r of runAll()) {
    assert.equal(
      r.passingSample.total,
      r.evaluated - r.failing,
      `${r.id}: passing total disagrees with evaluated minus failing`,
    );
    const checked = new Set(r.checkedSample.records.map((x) => x.id));
    const failingIds = new Set(r.evidence.map((e) => String(e.Id)));
    for (const ref of r.passingSample.records) {
      assert.ok(checked.has(ref.id), `${r.id}: a passing record was never checked`);
      assert.ok(!failingIds.has(ref.id), `${r.id}: a failing record is listed as passing`);
    }
  }
});

test('retaining records leaves evaluated, failing and score untouched', () => {
  /*
   * The same detector, called the same way, must still produce the numbers
   * the existing suite asserts. Retention is beside the arithmetic, not in it.
   */
  const r = ambiguousMatch([
    lead({ Match_Status__c: 'Review', Matched_Account__c: null }),
    lead({ Match_Status__c: 'No Match' }),
    lead({ Match_Status__c: null }),
    lead({ Match_Status__c: null }),
  ]);
  assert.equal(r.evaluated, 2);
  assert.equal(r.failing, 1);
  assert.equal(r.score, 50);
  assert.equal(r.unmeasurableCount, 2);
  assert.equal(r.checkedSample.total, 2);
  assert.equal(r.passingSample.total, 1);
});

test('failing evidence is unchanged by the new populations', () => {
  const r = missingFirmographics([lead({ CountryCode: null }), lead()], READINESS_SOURCES);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence.length, 1, 'failing evidence still carries one row per failure');
  assert.ok(r.evidence[0].Id, 'failing evidence still carries the record id');
});

/* --------------------------------------------- no result vs not applicable */

test('a record that could not be judged keeps the reason it could not be', () => {
  const r = ambiguousMatch([lead({ Match_Status__c: 'Review' }), lead({ Match_Status__c: null })]);
  const unmeasurable = r.notEvaluatedRecords.filter((n) => n.kind === 'unmeasurable');
  assert.equal(unmeasurable.length, 1, 'the Lead with no recorded decision is unmeasurable');
  assert.ok(String(unmeasurable[0].row.Reason).length > 0, 'and says why');
});

test('a record outside a check keeps that classification, separate from no result', () => {
  const r = staleOpportunities(
    [opportunity(), opportunity({ IsClosed: true, StageName: 'Closed Won' })],
    TODAY,
  );
  const kinds = r.notEvaluatedRecords.map((n) => n.kind);
  assert.deepEqual(kinds, ['outside'], 'a closed Opportunity is outside the check, not unjudgeable');
  assert.equal(r.unmeasurableCount, 0, 'and is never counted as insufficient evidence');
});

test('no result and not applicable cannot be merged, in any check', () => {
  for (const r of runAll()) {
    const unmeasurable = r.notEvaluatedRecords.filter((n) => n.kind === 'unmeasurable');
    const outside = r.notEvaluatedRecords.filter((n) => n.kind === 'outside');
    assert.equal(
      unmeasurable.length + outside.length,
      r.notEvaluatedRecords.length,
      `${r.id}: a not-evaluated record carries neither classification`,
    );
    // The retained list is capped, so it can only ever under-report the total.
    assert.ok(
      unmeasurable.length <= r.unmeasurableCount,
      `${r.id}: retained more unmeasurable records than it counted`,
    );
  }
});

test('the projection consumed by evidence tables still matches the classified list', () => {
  for (const r of runAll()) {
    assert.equal(r.notEvaluatedRows.length, r.notEvaluatedRecords.length, `${r.id}: lists diverged`);
    r.notEvaluatedRecords.forEach((n, i) => {
      assert.deepEqual(r.notEvaluatedRows[i], n.row, `${r.id}: row ${i} diverged from its record`);
    });
  }
});

/* --------------------------------------------------- Model v2 still intact */

test('a check that judged nothing is still Not Scored, however much it retained', () => {
  const r = ambiguousMatch([lead({ Match_Status__c: null }), lead({ Match_Status__c: null })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.score, null, 'not 0 and not 100');
  assert.equal(r.scoreReason, 'insufficient-evidence');
  assert.equal(r.checkedSample.total, 0);
  assert.equal(r.checkedSample.records.length, 0);
  assert.equal(r.passingSample.total, 0);
});

test('records with no result still create no finding', () => {
  const r = ambiguousMatch([lead({ Match_Status__c: null }), lead({ Match_Status__c: null })]);
  assert.equal(r.failing, 0);
  assert.ok(r.healthy, 'nothing failed, so nothing goes to the queue');
  const assessment = buildAssessment(runAll(), LEADS.length + OPPS.length, ['Lead', 'Opportunity'], RAN_AT);
  const unscored = assessment.controls.filter((c) => c.score === null).map((c) => c.id);
  for (const id of unscored) {
    assert.ok(
      !assessment.findings.some((f) => f.id === id),
      `${id} is unscored and must not appear in the findings queue`,
    );
  }
});

test('area scores, overall score and findings are unchanged for identical fixtures', () => {
  const a = buildAssessment(runAll(), LEADS.length + OPPS.length, ['Lead', 'Opportunity'], RAN_AT);
  const b = buildAssessment(runAll(), LEADS.length + OPPS.length, ['Lead', 'Opportunity'], RAN_AT);
  assert.deepEqual(a.categoryScores, b.categoryScores, 'area scores must be deterministic');
  assert.equal(a.overallHealth, b.overallHealth);
  assert.deepEqual(
    a.findings.map((f) => [f.id, f.severity, f.affected, f.evaluated]),
    b.findings.map((f) => [f.id, f.severity, f.affected, f.evaluated]),
  );
  assert.deepEqual(
    a.controls.map((c) => [c.id, c.evaluated, c.failing, c.score, c.scoreReason]),
    b.controls.map((c) => [c.id, c.evaluated, c.failing, c.score, c.scoreReason]),
  );
});

test('no detector widened its population in order to retain records', () => {
  for (const r of runAll()) {
    assert.equal(
      r.evaluated + r.notEvaluatedCount,
      r.orgPopulation,
      `${r.id} leaves records unaccounted for`,
    );
  }
});

/* -------------------------------------------------------- the area filter */

const FINDINGS: FindingSummary[] = [
  { id: 'missing-firmographics', title: 'a', category: 'Data Quality', severity: 'High', affected: 1, evaluated: 2, businessImpact: '' },
  { id: 'segment-consistency', title: 'b', category: 'Data Quality', severity: 'Medium', affected: 1, evaluated: 3, businessImpact: '' },
  { id: 'routing-exceptions', title: 'c', category: 'Routing', severity: 'High', affected: 1, evaluated: 4, businessImpact: '' },
];

test('no area parameter leaves the queue exactly as it was', () => {
  const filter = readAreaFilter(undefined);
  assert.equal(filter.kind, 'none');
  assert.deepEqual(applyAreaFilter(FINDINGS, filter), FINDINGS);
  assert.deepEqual(applyAreaFilter(FINDINGS, readAreaFilter('')), FINDINGS, 'a blank value is no filter');
});

test('a known area filters to that area, and the count matches what is shown', () => {
  const filter = readAreaFilter('Data Quality');
  assert.deepEqual(filter, { kind: 'area', area: 'Data Quality' });
  const shown = applyAreaFilter(FINDINGS, filter);
  assert.equal(shown.length, 2);
  assert.ok(shown.every((f) => f.category === 'Data Quality'));
});

test('every area the assessment reports is a filter the queue accepts', () => {
  const assessment = buildAssessment(runAll(), LEADS.length + OPPS.length, ['Lead', 'Opportunity'], RAN_AT);
  for (const c of assessment.categoryScores) {
    assert.ok(isCategory(c.category), `${c.category} is reported but cannot be filtered to`);
  }
});

test('an unknown area shows everything rather than an unexplained empty queue', () => {
  const filter = readAreaFilter('Lead Lifecycle Governance');
  assert.deepEqual(filter, { kind: 'unknown', requested: 'Lead Lifecycle Governance' });
  assert.deepEqual(
    applyAreaFilter(FINDINGS, filter),
    FINDINGS,
    'a typo must not hide the queue - the page says the area was not recognised',
  );
});

test('clearing the filter restores the whole queue', () => {
  const filtered = applyAreaFilter(FINDINGS, readAreaFilter('Routing'));
  assert.equal(filtered.length, 1);
  assert.deepEqual(applyAreaFilter(FINDINGS, readAreaFilter(undefined)), FINDINGS);
});

test('an area link survives the characters a category name actually contains', () => {
  const href = areaFilterHref('Identity & Matching');
  assert.equal(href, '/findings?area=Identity%20%26%20Matching');
  const roundTrip = readAreaFilter(decodeURIComponent(href.split('=')[1]));
  assert.deepEqual(roundTrip, { kind: 'area', area: 'Identity & Matching' });
});

test('a repeated area parameter resolves to one area rather than throwing', () => {
  assert.deepEqual(readAreaFilter(['Routing', 'Data Quality']), { kind: 'area', area: 'Routing' });
});
