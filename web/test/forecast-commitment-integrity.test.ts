/**
 * Forecast Commitment Integrity (PD-23) — the promoted-Opportunity control.
 *
 * Fixtures only: no network, no Salesforce, no clock dependence. The forecast
 * period is passed in explicitly, so nothing here reads a real calendar.
 *
 * WHAT THESE TESTS PROVE, AND WHAT THEY DO NOT. They prove how the detector
 * reads persisted Opportunity state, how the period resolver refuses an
 * unusable fiscal calendar, and that the control is registered and reached by
 * the assessment. They prove NOTHING about Salesforce: no assessment has yet
 * been run against the org, so there is no integration-runtime, live pass-path
 * or live fail-path evidence for it. Read-only discovery on 2026-09-04 observed
 * ZERO open Opportunities at Best Case or Commit, so the governed population is
 * currently empty in the live org and reports Not Scored.
 *
 * Evidence state after this increment:
 *   REGISTERED · ACTIVE (Model v4) · LOCALLY VALIDATED ·
 *   NOT SALESFORCE RUNTIME VALIDATED
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECK_IDS,
  forecastCommitmentIntegrity,
  runAllChecks,
  staleOpportunities,
} from '../lib/checks/index.ts';
import {
  ForecastPeriodUnavailableError,
  resolveForecastPeriod,
} from '../lib/checks/forecast-period.ts';
import { CATEGORIES, MODEL_VERSION } from '../lib/score.ts';
import { PRESENTATION } from '../lib/presentation.ts';
import { TRACEABILITY } from '../lib/traceability.ts';
import type { OpportunityRecord, PeriodRecord } from '../lib/soql.ts';
import {
  FISCAL_Q3_2026,
  FORECAST_PERIOD,
  GOVERNANCE,
  GOVERNED,
  lead,
  NO_HISTORY,
  opportunity,
  TODAY,
} from './fixtures.ts';

/** The resolved period every detector test is judged against. */
const PERIOD = { startDate: FISCAL_Q3_2026.StartDate, endDate: FISCAL_Q3_2026.EndDate };

/** An open Opportunity promoted into the forecast, with complete evidence. */
function committed(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return opportunity({
    StageName: 'Negotiation/Review',
    IsClosed: false,
    IsWon: false,
    Amount: 250000,
    CloseDate: '2026-09-15',
    // Promoted away from the Pipeline value the stage derives.
    ForecastCategoryName: 'Commit',
    ForecastCategory: 'Pipeline',
    ...overrides,
  });
}

/* --------------------------------------------------------- 1. population */
test('open + Best Case is evaluated', () => {
  const r = forecastCommitmentIntegrity([committed({ ForecastCategoryName: 'Best Case' })], PERIOD);
  assert.equal(r.evaluated, 1);
});

test('open + Commit is evaluated', () => {
  const r = forecastCommitmentIntegrity([committed({ ForecastCategoryName: 'Commit' })], PERIOD);
  assert.equal(r.evaluated, 1);
});

test('open + Pipeline is outside the control — it claims nothing about the period', () => {
  const r = forecastCommitmentIntegrity([opportunity({ ForecastCategoryName: 'Pipeline' })], PERIOD);
  assert.equal(r.evaluated, 0);
  assert.equal(r.notEvaluatedCount, 1);
  assert.equal(r.notEvaluatedRecords[0].kind, 'outside');
  assert.match(String(r.notEvaluatedRows[0].Reason), /represents no commitment to the period/);
});

test('a closed Opportunity is outside the control even at Best Case or Commit', () => {
  const closedCommit = committed({ IsClosed: true, IsWon: true, ForecastCategoryName: 'Commit' });
  const closedBest = committed({ IsClosed: true, IsWon: false, ForecastCategoryName: 'Best Case' });
  const r = forecastCommitmentIntegrity([closedCommit, closedBest], PERIOD);
  assert.equal(r.evaluated, 0);
  assert.equal(r.notEvaluatedCount, 2);
  assert.match(String(r.notEvaluatedRows[0].Reason), /closed, so it is an outcome/);
});

test('a null forecast category is outside the control', () => {
  const r = forecastCommitmentIntegrity([opportunity({ ForecastCategoryName: null })], PERIOD);
  assert.equal(r.evaluated, 0);
  assert.equal(r.notEvaluatedCount, 1);
});

test('every Opportunity is accounted for: evaluated plus not evaluated equals the population', () => {
  const opps = [
    committed(),
    committed({ Amount: null }),
    opportunity(),
    opportunity({ IsClosed: true, IsWon: true }),
  ];
  const r = forecastCommitmentIntegrity(opps, PERIOD);
  assert.equal(r.orgPopulation, opps.length);
  assert.equal(r.evaluated + r.notEvaluatedCount, r.orgPopulation);
  assert.equal(r.unmeasurableCount, 0, 'both elements are observable — nothing is unmeasurable');
});

/* ------------------------------------------------------------ 2. Amount */
test('a null Amount is a finding', () => {
  const r = forecastCommitmentIntegrity([committed({ Amount: null })], PERIOD);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0].Amount, '— (not populated)');
  assert.match(String(r.evidence[0].Result), /Amount/);
});

test('an Amount of zero PASSES — populated is the requirement, not a threshold', () => {
  const r = forecastCommitmentIntegrity([committed({ Amount: 0 })], PERIOD);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0, 'zero is populated; a threshold would be invented policy');
});

test('a positive Amount passes', () => {
  const r = forecastCommitmentIntegrity([committed({ Amount: 1 })], PERIOD);
  assert.equal(r.failing, 0);
});

test('a negative Amount passes — completeness is judged, never correctness', () => {
  const r = forecastCommitmentIntegrity([committed({ Amount: -5000 })], PERIOD);
  assert.equal(r.failing, 0);
});

/* -------------------------------------------------------- 3. Close Date */
test('a Close Date exactly on the period end passes — the bound is inclusive', () => {
  const r = forecastCommitmentIntegrity([committed({ CloseDate: '2026-09-30' })], PERIOD);
  assert.equal(r.failing, 0);
});

test('a Close Date inside the period passes', () => {
  const r = forecastCommitmentIntegrity([committed({ CloseDate: '2026-09-29' })], PERIOD);
  assert.equal(r.failing, 0);
});

test('a Close Date after the period end is a finding', () => {
  const r = forecastCommitmentIntegrity([committed({ CloseDate: '2026-10-01' })], PERIOD);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /Close Date within the forecast period/);
  assert.equal(r.evidence[0].PeriodEnd, '2026-09-30');
});

test('a null Close Date does not fail — Salesforce requires the field', () => {
  const r = forecastCommitmentIntegrity([committed({ CloseDate: null })], PERIOD);
  assert.equal(r.failing, 0, 'a null cannot be after the period end; inventing a failure would add a predicate PD-23 does not have');
});

/* --------------------------------------- 4. PD-20 non-duplication */
test('a PAST Close Date does not fail this control — that defect belongs to PD-20', () => {
  /*
   * Before the assessment date AND before the period end: stale-opportunities
   * governs it, and re-scoring it here would penalise one slipped date twice.
   */
  const past = committed({ CloseDate: '2026-07-05', Amount: 400000 });
  const r = forecastCommitmentIntegrity([past], PERIOD);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0, 'past-dated is PD-20’s finding, not this one');
});

test('the same past-dated record IS a stale-opportunities finding — the two are disjoint', () => {
  const past = committed({ CloseDate: '2026-07-05', Amount: 400000 });
  const forecast = forecastCommitmentIntegrity([past], PERIOD);
  const stale = staleOpportunities([past], TODAY);
  assert.equal(forecast.failing, 0, 'not scored here');
  assert.equal(stale.failing, 1, 'scored there');
});

test('a date before the period start does not fail this control either', () => {
  const r = forecastCommitmentIntegrity([committed({ CloseDate: '2026-06-30' })], PERIOD);
  assert.equal(r.failing, 0, 'the predicate is strictly AFTER the period end');
});

/* ------------------------------------------------- 5. multiple failures */
test('missing Amount and a late Close Date produce ONE failing record naming both', () => {
  const r = forecastCommitmentIntegrity(
    [committed({ Amount: null, CloseDate: '2026-12-31' })],
    PERIOD,
  );
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 1, 'two missing elements are one unsupported commitment');
  assert.equal(r.evidence.length, 1, 'the record appears once');
  const result = String(r.evidence[0].Result);
  assert.match(result, /Amount/);
  assert.match(result, /Close Date within the forecast period/);
});

test('the per-predicate breakdown overlaps deliberately and never becomes the failing count', () => {
  const r = forecastCommitmentIntegrity(
    [
      committed({ Amount: null, CloseDate: '2026-12-31' }),
      committed({ CloseDate: '2026-11-01' }),
      committed(),
    ],
    PERIOD,
  );
  assert.equal(r.evaluated, 3);
  assert.equal(r.failing, 2, 'unique failing records');

  const by = (label: string) => r.failureBreakdown.find((b) => b.label.startsWith(label))?.count;
  assert.equal(by('No Amount'), 1);
  assert.equal(by('Close Date after'), 2);

  const summed = r.failureBreakdown.reduce((t, b) => t + b.count, 0);
  assert.equal(summed, 3);
  assert.notEqual(summed, r.failing, 'the breakdown overlaps — summing it would double-count');
});

/* ------------------------------------------- 6. forecast category semantics */
test('a category mismatch is NOT a failure on its own', () => {
  // Promoted to Commit while the stage still derives Pipeline: the normal case.
  const r = forecastCommitmentIntegrity(
    [committed({ ForecastCategoryName: 'Commit', ForecastCategory: 'Pipeline' })],
    PERIOD,
  );
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0, 'an override is never itself a defect');
});

test('the seller-visible field gates the population, whatever the derived value says', () => {
  // Derived says Commit-equivalent, seller-visible says Pipeline → outside.
  const derivedOnly = opportunity({
    ForecastCategoryName: 'Pipeline',
    ForecastCategory: 'Forecast',
  });
  // Seller-visible says Commit, derived says Pipeline → inside.
  const promoted = committed({ ForecastCategoryName: 'Commit', ForecastCategory: 'Pipeline' });

  const r = forecastCommitmentIntegrity([derivedOnly, promoted], PERIOD);
  assert.equal(r.evaluated, 1, 'only the seller-visible classification gates the population');
  assert.equal(r.checkedSample.records[0].id, promoted.Id);
});

test('the derived category is carried as context on a finding, never judged', () => {
  const r = forecastCommitmentIntegrity(
    [committed({ Amount: null, ForecastCategory: 'Pipeline' })],
    PERIOD,
  );
  assert.equal(r.evidence[0].DerivedCategory, 'Pipeline');
  assert.equal(r.evidence[0].ForecastCategoryName, 'Commit');
  assert.doesNotMatch(String(r.evidence[0].Result), /categor/i, 'the category is not a failure reason');
});

/* ------------------------------------------------ 7. period resolution */
const q = (StartDate: string, EndDate: string): PeriodRecord => ({ StartDate, EndDate });

test('exactly one matching quarter resolves', () => {
  const period = resolveForecastPeriod(
    [q('2026-04-01', '2026-06-30'), q('2026-07-01', '2026-09-30'), q('2026-10-01', '2026-12-31')],
    '2026-09-04',
  );
  assert.deepEqual(period, { startDate: '2026-07-01', endDate: '2026-09-30' });
});

test('the period bounds are inclusive at both ends', () => {
  const quarters = [q('2026-07-01', '2026-09-30')];
  assert.equal(resolveForecastPeriod(quarters, '2026-07-01').endDate, '2026-09-30');
  assert.equal(resolveForecastPeriod(quarters, '2026-09-30').endDate, '2026-09-30');
});

test('zero matching quarters fails explicitly — no period is invented', () => {
  assert.throws(
    () => resolveForecastPeriod([q('2026-07-01', '2026-09-30')], '2027-01-15'),
    (e: unknown) => {
      assert.ok(e instanceof ForecastPeriodUnavailableError);
      assert.match(e.message, /No Salesforce fiscal quarter contains 2027-01-15/);
      return true;
    },
  );
});

test('an empty fiscal calendar fails explicitly', () => {
  assert.throws(
    () => resolveForecastPeriod([], '2026-09-04'),
    ForecastPeriodUnavailableError,
  );
});

test('more than one matching quarter fails explicitly — nothing is chosen', () => {
  assert.throws(
    () => resolveForecastPeriod(
      [q('2026-07-01', '2026-09-30'), q('2026-09-01', '2026-11-30')],
      '2026-09-04',
    ),
    (e: unknown) => {
      assert.ok(e instanceof ForecastPeriodUnavailableError);
      assert.match(e.message, /2 Salesforce fiscal quarters contain/);
      assert.match(e.message, /will not choose between them/);
      return true;
    },
  );
});

/* ------------------------------------------------- 8. claim boundary */
test('the presentation never claims the forecast, the judgement or the Amount is wrong', () => {
  const p = PRESENTATION['forecast-commitment-integrity'];
  const prose = JSON.stringify({ ...p, finding: undefined });
  assert.doesNotMatch(prose, /forecast is wrong|seller was wrong|will not close/i);
  assert.doesNotMatch(prose, /booked revenue|contracted revenue|revenue is overstated/i);
  assert.doesNotMatch(prose, /\bARR\b|\bMRR\b|\bACV\b|\bTCV\b/);
  assert.match(
    p.explain.proves ?? '',
    /never a statement about recognized revenue/i,
    'the limit on what a pass proves must name recognized revenue explicitly',
  );
});

test('the presentation states that an override is not a defect and claims no actor', () => {
  const p = PRESENTATION['forecast-commitment-integrity'];
  const prose = [p.why, p.control, ...(p.sourceEvidence?.pairs.map((x) => x.detail) ?? [])].join(' ');
  assert.match(prose, /overridable by design/i);
  assert.match(prose, /judges the difference nowhere/i);
  assert.match(prose, /does not read, infer or report who promoted it/i);
});

test('no preventive safeguard is implied', () => {
  const p = PRESENTATION['forecast-commitment-integrity'];
  assert.equal(p.safeguard.kind, 'detective');
  assert.match(p.safeguard.title, /No automated safeguard/i);
  assert.equal(p.safeguard.remediation, undefined);
});

/* ------------------------------ 9. REGISTERED AND ACTIVE (Model v4) */
test('the control is registered and active under Model v4', () => {
  assert.ok(
    CHECK_IDS.includes('forecast-commitment-integrity'),
    'present in CHECK_IDS, so the assessment executes it',
  );
  assert.equal(CHECK_IDS.length, 14, 'Assessment Model v4: fourteen scored controls');
  assert.equal(MODEL_VERSION, 'v4', 'activation advances the model exactly once');
  assert.equal(CATEGORIES.length, 6, 'six assessment areas, unchanged — no area was added');
});

test('runAllChecks emits Forecast Commitment Integrity, scored like any other control', () => {
  const results = runAllChecks(
    [lead({ Status: 'MQL' })],
    [committed(), committed({ Amount: null, CloseDate: '2026-12-31' })],
    TODAY,
    [GOVERNED],
    GOVERNANCE,
    NO_HISTORY,
    FORECAST_PERIOD,
  );
  assert.equal(results.length, 14, 'fourteen controls run');
  const r = results.find((x) => x.id === 'forecast-commitment-integrity');
  assert.ok(r, 'the detector produces a result inside an assessment run');
  assert.equal(r.category, 'Pipeline Hygiene');
  assert.equal(r.evaluated, 2, 'both promoted Opportunities were judged');
  assert.equal(r.failing, 1, 'the one missing an Amount and dated late');
});

test('the forecast period reaches the control through the assessment path', () => {
  /*
   * Proves the period is not re-derived inside the detector: a different
   * resolved period changes the verdict on the same records.
   */
  const late = [committed({ CloseDate: '2026-10-15' })];
  const q3 = runAllChecks([], late, TODAY, [GOVERNED], GOVERNANCE, NO_HISTORY, FORECAST_PERIOD);
  const q4 = runAllChecks([], late, TODAY, [GOVERNED], GOVERNANCE, NO_HISTORY, {
    startDate: '2026-10-01',
    endDate: '2026-12-31',
  });
  const of = (rs: typeof q3) => rs.find((x) => x.id === 'forecast-commitment-integrity')!;
  assert.equal(of(q3).failing, 1, 'dated after the Q3 period end');
  assert.equal(of(q4).failing, 0, 'inside the Q4 period');
});

test('both Step 9 Opportunity controls are active', () => {
  assert.ok(CHECK_IDS.includes('forecast-commitment-integrity'));
  assert.ok(CHECK_IDS.includes('revenue-handoff-integrity'));
});

test('its identifier is type-complete', () => {
  assert.ok(PRESENTATION['forecast-commitment-integrity'], 'presentation record exists');
  assert.ok(TRACEABILITY['forecast-commitment-integrity'], 'traceability record exists');
});

test('traceability states the evidence position honestly and claims no runtime evidence', () => {
  const t = TRACEABILITY['forecast-commitment-integrity'];
  assert.deepEqual(t.usages, [], 'no Salesforce configuration backs this control');
  const none = t.noneEstablished ?? '';
  assert.match(none, /REGISTERED AND ACTIVE SINCE MODEL v4/);
  assert.match(none, /NOT SALESFORCE RUNTIME VALIDATED/);
  assert.match(none, /never executed against Salesforce/i);

  const source = PRESENTATION['forecast-commitment-integrity'].verificationSource;
  assert.match(source, /REGISTERED AND ACTIVE SINCE MODEL v4/);
  assert.match(source, /NOT SALESFORCE RUNTIME VALIDATED/);
  assert.match(source, /NO Salesforce integration runtime evidence/i);
  assert.doesNotMatch(source, /deployed/i);
});

/* ---------------------------- 10. existing Opportunity controls intact */
test('the registered Opportunity controls are unchanged by the new forecast fields', () => {
  const opps = [
    opportunity({ CloseDate: '2020-01-01' }),
    opportunity({ IsClosed: true, IsWon: false, StageName: 'Closed Lost', Loss_Reason__c: null }),
    committed({ Amount: null, CloseDate: '2026-12-31' }),
  ];
  const stale = staleOpportunities(opps, TODAY);
  assert.equal(stale.evaluated, 2, 'both open Opportunities, forecast category irrelevant');
  assert.equal(stale.failing, 1, 'only the lapsed date fails; the future-dated commitment does not');
});
