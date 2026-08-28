import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ambiguousMatch,
  governedWithoutSegment,
  missingFirmographics,
  missingTerritory,
  routingExceptions,
  opportunityConversionIntegrity,
  runAllChecks,
  segmentConsistency,
  slaRisk,
  staleOpportunities,
} from '../lib/checks/index.ts';
import { lead, opportunity, TODAY, READINESS_SOURCES } from './fixtures.ts';
import { categoryScores, overallHealth, toFindings } from '../lib/score.ts';

const EXCEPTION_QUEUE = { Name: 'NIQ Routing Exception', Type: 'Queue' };

test('routing readiness sources come from Salesforce configuration, not a built-in list', () => {
  /**
   * The rule this guards: Salesforce owns which Lead Sources carry the
   * requirement. Passing a different configuration must change the population,
   * or the application is still deciding it.
   */
  const leads = [lead({ LeadSource: 'Web' }), lead({ LeadSource: 'Trade Show' })];

  assert.equal(missingFirmographics(leads, ['Web']).evaluated, 1);
  assert.equal(missingFirmographics(leads, ['Trade Show']).evaluated, 1);
  assert.equal(missingFirmographics(leads, ['Web', 'Trade Show']).evaluated, 2);
  assert.equal(missingFirmographics(leads, []).evaluated, 0);
});

test('account-matching status no longer decides routing-readiness eligibility', () => {
  /**
   * Match_Status__c records whether account matching reached a decision - a
   * different capability on a different timeline. Two Leads identical but for
   * that field must be treated identically here.
   */
  const withMatch = lead({ LeadSource: 'Web', Match_Status__c: 'Matched' });
  const withoutMatch = lead({ LeadSource: 'Web', Match_Status__c: null });

  const result = missingFirmographics([withMatch, withoutMatch], READINESS_SOURCES);

  assert.equal(result.evaluated, 2, 'both evaluated regardless of match status');
  assert.equal(result.notEvaluatedCount, 0);
});

test('a Web Lead with no match decision is still evaluated', () => {
  const result = missingFirmographics(
    [lead({ LeadSource: 'Web', Match_Status__c: null })],
    READINESS_SOURCES,
  );

  assert.equal(result.evaluated, 1);
  assert.equal(result.failing, 0);
});

test('a Phone Inquiry Lead is evaluated when that source is configured', () => {
  const result = missingFirmographics(
    [lead({ LeadSource: 'Phone Inquiry', Match_Status__c: null })],
    READINESS_SOURCES,
  );

  assert.equal(result.evaluated, 1);
});

test('sources absent from configuration are excluded, with the value as the reason', () => {
  const leads = [
    lead({ LeadSource: 'Purchased List' }),
    lead({ LeadSource: 'Partner Referral' }),
    lead({ LeadSource: null }),
  ];

  const result = missingFirmographics(leads, READINESS_SOURCES);

  assert.equal(result.evaluated, 0);
  assert.equal(result.notEvaluatedCount, 3);

  const reasons = result.notEvaluatedRows.map((r) => String(r.Reason));
  assert.ok(reasons.some((r) => r.includes('Purchased List is not configured')));
  assert.ok(reasons.some((r) => r.includes('Partner Referral is not configured')));
  assert.ok(reasons.some((r) => r.includes('No Lead Source recorded')));
  // The retired vocabulary must not come back with it.
  assert.ok(!reasons.some((r) => /governed|predate|capture-time/i.test(r)));
});

test('failures are classified by the attribute actually missing', () => {
  const result = missingFirmographics(
    [
      lead({ LeadSource: 'Web', CountryCode: null }),
      lead({ LeadSource: 'Web', NumberOfEmployees: null }),
      lead({ LeadSource: 'Web', NumberOfEmployees: null, CountryCode: null }),
      lead({ LeadSource: 'Web' }),
    ],
    READINESS_SOURCES,
  );

  assert.equal(result.evaluated, 4);
  assert.equal(result.failing, 3);

  const by = Object.fromEntries(result.failureBreakdown.map((b) => [b.label, b.count]));
  assert.equal(by['Missing Country'], 1);
  assert.equal(by['Missing Employee Count'], 1);
  assert.equal(by['Missing Country and Employee Count'], 1);
});

test('a pass means both routing inputs are present, and nothing more', () => {
  const result = missingFirmographics(
    [lead({ LeadSource: 'Web', Match_Status__c: null, Territory__c: null, Segment__c: null })],
    READINESS_SOURCES,
  );

  // Territory, segment and match are all absent, and it still passes: this
  // check establishes the presence of two inputs, not any downstream outcome.
  assert.equal(result.failing, 0);
  assert.equal(result.evaluated, 1);
});

test('the exclusion breakdown counts by the Lead Source that excluded them', () => {
  const leads = [
    lead({ LeadSource: 'Purchased List' }),
    lead({ LeadSource: 'Purchased List' }),
    lead({ LeadSource: null }),
    lead({ LeadSource: 'Web' }),
  ];

  const result = missingFirmographics(leads, READINESS_SOURCES);
  const by = Object.fromEntries(result.exclusionBreakdown.map((b) => [b.label, b.count]));

  assert.equal(by['Purchased List'], 2);
  assert.equal(by['No Lead Source recorded'], 1);
  assert.equal(
    result.exclusionBreakdown.reduce((n, b) => n + b.count, 0),
    result.notEvaluatedCount,
  );
});

test('missing routing data reconciles: total = evaluated + excluded, evaluated = passing + failing', () => {
  const leads = [
    lead({ LeadSource: 'Web', CountryCode: null }),
    lead({ LeadSource: 'Phone Inquiry' }),
    lead({ LeadSource: 'Purchased List' }),
    lead({ LeadSource: null }),
  ];

  const result = missingFirmographics(leads, READINESS_SOURCES);

  assert.equal(result.orgPopulation, result.evaluated + result.notEvaluatedCount);
  assert.equal(result.evaluated - result.failing, 1, 'passing');
  assert.equal(result.failing, 1);
});

test('routing exceptions counts only Leads held by the exception queue', () => {
  const result = routingExceptions([
    lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Account Match' }),
    lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Unmapped Geography' }),
    lead(),
    lead({ Owner: { Name: 'NIQ EMEA', Type: 'Queue' } }),
  ]);

  assert.equal(result.evaluated, 4);
  assert.equal(result.failing, 2);
  assert.equal(result.severity, 'High');
  assert.equal(result.evidence[0].Exception_Type__c, 'Ambiguous Account Match');
});

test('SLA risk evaluates only Leads that carry an SLA target', () => {
  /**
   * The guarantee behind M-07: a Lead created before the SLA capability
   * existed has no commitment to miss. Unmeasurable is not Breached.
   */
  const leads = [
    lead({ SLA_Status__c: 'Breached', SLA_Target_DateTime__c: '2026-08-20T12:00:00.000+0000' }),
    lead({ SLA_Status__c: 'Met', SLA_Target_DateTime__c: '2026-08-20T12:00:00.000+0000' }),
    lead({ SLA_Status__c: 'Unmeasurable', SLA_Target_DateTime__c: null }),
    lead({ SLA_Status__c: 'Unmeasurable', SLA_Target_DateTime__c: null }),
    lead({ SLA_Status__c: 'Excluded', SLA_Target_DateTime__c: null }),
  ];

  const result = slaRisk(leads);

  assert.equal(result.evaluated, 2, 'the three targetless Leads are outside the population');
  assert.equal(result.failing, 1);
  assert.equal(result.score, 50);
  assert.match(result.population, /measurable population/);
});

test('SLA risk treats At Risk and both breach states as failing', () => {
  const target = '2026-08-20T12:00:00.000+0000';
  const result = slaRisk([
    lead({ SLA_Status__c: 'At Risk', SLA_Target_DateTime__c: target }),
    lead({ SLA_Status__c: 'Breached', SLA_Target_DateTime__c: target }),
    lead({ SLA_Status__c: 'Breached (Late Response)', SLA_Target_DateTime__c: target }),
    lead({ SLA_Status__c: 'Pending', SLA_Target_DateTime__c: target }),
    lead({ SLA_Status__c: 'Met', SLA_Target_DateTime__c: target }),
  ]);

  assert.equal(result.failing, 3);
  assert.equal(result.severity, 'High', 'an actual breach raises severity above At Risk alone');

  const atRiskOnly = slaRisk([lead({ SLA_Status__c: 'At Risk', SLA_Target_DateTime__c: target })]);
  assert.equal(atRiskOnly.severity, 'Medium');
});

test('ambiguous match reports Leads automation refused to attach', () => {
  const result = ambiguousMatch([
    lead({ Match_Status__c: 'Review', Matched_Account__c: null }),
    lead({ Match_Status__c: 'Matched' }),
    lead({ Match_Status__c: 'No Match', Matched_Account__c: null }),
  ]);

  assert.equal(result.failing, 1);
  assert.equal(
    result.evidence[0].Matched_Account__c,
    '— (not attached)',
    'the blank Account is deliberate and is shown as such',
  );
});

test('missing territory evaluates every Lead the coverage model ran against', () => {
  /**
   * Territory classification is not bounded by routing authority: the intake
   * automation derives a territory even where it leaves ownership alone. A Lead
   * it never ran against has no territory because none was computed, which is
   * not the same as an uncovered geography - so it is unmeasurable, not a fail.
   */
  const result = missingTerritory([
    lead({ Territory__c: null, CountryCode: 'BR', Exception_Type__c: 'Unmapped Geography' }),
    lead(),
    lead({ LeadSource: 'Web', Territory__c: null }),
    lead({ LeadSource: 'Web', Match_Status__c: null, Territory__c: null }),
  ]);

  assert.equal(result.evaluated, 3, 'non-governed Leads still receive a territory');
  assert.equal(result.failing, 2);
  assert.equal(result.score, 33);
  assert.equal(result.notEvaluatedCount, 1);
  assert.equal(result.unmeasurableCount, 1, 'never classified is not uncovered geography');
});

test('stale opportunities are open deals whose close date has passed', () => {
  const opps = [
    opportunity({ CloseDate: '2026-07-01' }),
    opportunity({ CloseDate: '2026-08-22' }),
    // Today is not yet late.
    opportunity({ CloseDate: '2026-08-23' }),
    opportunity({ CloseDate: '2026-09-30' }),
    // Closed deals are history, not hygiene.
    opportunity({ CloseDate: '2026-01-15', IsClosed: true, IsWon: true, StageName: 'Closed Won' }),
  ];

  const result = staleOpportunities(opps, TODAY);

  assert.equal(result.evaluated, 4, 'closed Opportunities are excluded from the population');
  assert.equal(result.failing, 2);
  assert.equal(result.score, 50);
});

test('the negative control finds nothing on a clean governed population', () => {
  /**
   * Every governed Lead should carry a segment. This check exists to prove the
   * engine reports what it finds; if it ever returns non-zero, segmentation -
   * not this application - has regressed.
   */
  const control = governedWithoutSegment([lead(), lead(), lead({ LeadSource: 'Web' })]);

  assert.equal(control.evaluated, 2);
  assert.equal(control.failing, 0);
});

test('a check with nothing to evaluate scores 100 rather than 0', () => {
  // Absence of data is not evidence of failure.
  const result = missingFirmographics([lead({ LeadSource: 'Purchased List' })], READINESS_SOURCES);

  assert.equal(result.evaluated, 0);
  assert.equal(result.score, 100);
  assert.equal(result.healthy, true);
  assert.equal(result.notEvaluatedCount, 1, 'the record is still accounted for');
});

test('routing exceptions evaluates only Leads submitted to ownership routing', () => {
  /**
   * A Lead outside the routing flow's entry criteria never reaches the routing
   * decision, so it could not have landed in the exception queue. Counting it
   * would measure nothing about routing and only dilute the rate.
   */
  const result = routingExceptions([
    lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Account Match' }),
    lead(),
    lead({ LeadSource: 'Web', Owner: { Name: 'Dana Okoro', Type: 'User' } }),
    lead({ LeadSource: 'Purchased List', Owner: { Name: 'Dana Okoro', Type: 'User' } }),
  ]);

  assert.equal(result.evaluated, 2);
  assert.equal(result.failing, 1);
  assert.equal(result.score, 50);
  assert.equal(result.notEvaluatedCount, 2);
  assert.equal(result.unmeasurableCount, 0, 'these are outside the control, not unmeasured');
});

test('a not-evaluated reason names that record’s own Lead Source and Owner', () => {
  // One shared message across every record would not survive being challenged.
  const result = routingExceptions([
    lead(),
    lead({ LeadSource: 'Web', Owner: { Name: 'Dana Okoro', Type: 'User' } }),
  ]);

  const [row] = result.notEvaluatedRows;
  assert.equal(row.LeadSource, 'Web');
  assert.equal(row.Owner, 'Dana Okoro');
  assert.match(String(row.Reason), /Not submitted to NorthstarIQ ownership routing/);
  assert.match(String(row.Reason), /Lead Source "Web"/);
  assert.match(String(row.Reason), /Dana Okoro/);
});

test('a Lead the matching process never assessed is not counted as a pass', () => {
  /**
   * The defect this exists to prevent: a blank match decision satisfying "not
   * Review" and silently crediting the matching process for work it never did.
   */
  const result = ambiguousMatch([
    lead({ Match_Status__c: 'Review', Matched_Account__c: null }),
    lead({ Match_Status__c: 'No Match' }),
    lead({ Match_Status__c: null }),
    lead({ Match_Status__c: null }),
  ]);

  assert.equal(result.evaluated, 2, 'only Leads carrying a recorded decision');
  assert.equal(result.failing, 1);
  assert.equal(result.score, 50, 'not 75, which counting the blanks as passes would give');
  assert.equal(result.unmeasurableCount, 2);
});

test('every check accounts for its whole starting population', () => {
  const leads = [
    lead(),
    lead({ LeadSource: 'Web', Match_Status__c: null }),
    lead({ LeadSource: 'Purchased List' }),
    lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Account Match' }),
    lead({ SLA_Target_DateTime__c: null, SLA_Status__c: 'Unmeasurable', SLA_Basis__c: null }),
  ];
  const opps = [opportunity(), opportunity({ IsClosed: true, StageName: 'Closed Won' })];

  for (const result of runAllChecks(leads, opps, TODAY, READINESS_SOURCES)) {
    assert.equal(
      result.evaluated + result.notEvaluatedCount,
      result.orgPopulation,
      `${result.id} leaves records unaccounted for`,
    );
    assert.ok(
      result.unmeasurableCount <= result.notEvaluatedCount,
      `${result.id} reports more unmeasurable than not-evaluated`,
    );
    for (const row of result.notEvaluatedRows) {
      assert.ok(String(row.Reason ?? '').length > 0, `${result.id} has a row with no reason`);
    }
  }
});

test('runAllChecks runs exactly the seven implemented checks', () => {
  const results = runAllChecks([lead()], [opportunity()], TODAY, READINESS_SOURCES);

  assert.deepEqual(
    results.map((r) => r.id),
    [
      'missing-firmographics',
      'segment-consistency',
      'routing-exceptions',
      'sla-risk',
      'ambiguous-match',
      'missing-territory',
      'stale-opportunities',
    ],
  );
});

test('evidence is capped for display while the count stays complete', () => {
  const leads = Array.from({ length: 14 }, () => lead({ NumberOfEmployees: null }));

  const result = missingFirmographics(leads, READINESS_SOURCES);

  assert.equal(result.failing, 14, 'the count is the full failing total');
  assert.equal(result.evidence.length, 10, 'the table shows a bounded sample');
});

test('missing territory is unchanged by the routing-readiness correction', () => {
  /**
   * Its eligibility marker is the account-matching capability boundary, which
   * was separately investigated and supported. Configuration passed for
   * Missing Routing Data must not reach it.
   */
  const leads = [
    lead({ Territory__c: null, CountryCode: 'BR' }),
    lead(),
    lead({ LeadSource: 'Web', Territory__c: null }),
    lead({ LeadSource: 'Web', Match_Status__c: null, Territory__c: null }),
  ];

  const a = runAllChecks(leads, [], TODAY, READINESS_SOURCES).find((r) => r.id === 'missing-territory');
  const b = runAllChecks(leads, [], TODAY, ['Purchased List']).find((r) => r.id === 'missing-territory');

  assert.equal(a?.evaluated, 3);
  assert.equal(a?.failing, 2);
  assert.equal(a?.evaluated, b?.evaluated, 'configuration must not reach this check');
  assert.equal(a?.score, b?.score);
});

test('ambiguous account match is unchanged by the routing-readiness correction', () => {
  const leads = [
    lead({ Match_Status__c: 'Review', Matched_Account__c: null }),
    lead({ Match_Status__c: 'No Match' }),
    lead({ Match_Status__c: null }),
  ];

  const a = runAllChecks(leads, [], TODAY, READINESS_SOURCES).find((r) => r.id === 'ambiguous-match');
  const b = runAllChecks(leads, [], TODAY, ['Purchased List']).find((r) => r.id === 'ambiguous-match');

  assert.equal(a?.evaluated, 2);
  assert.equal(a?.failing, 1);
  assert.equal(a?.evaluated, b?.evaluated, 'configuration must not reach this check');
  assert.equal(a?.score, b?.score);
});

/* ------------------------------------------- Segment Assignment Consistency */

/** The form Lead_Inbound_Before_Save writes when a band matches. */
const bandBasis = (employees: number, segment: string, version = 'v1.0') =>
  `Employee Count: ${employees} -> ${segment} | Rule ${version}`;

const segmented = (employees: number, recorded: string, current: string | null, over = {}) =>
  lead({
    NumberOfEmployees: employees,
    Segment_Basis__c: bandBasis(employees, recorded),
    Segment__c: current,
    ...over,
  });

test('a Segment matching the recorded segmentation result passes', () => {
  const result = segmentConsistency([segmented(500, 'Mid-Market', 'Mid-Market')]);

  assert.equal(result.evaluated, 1);
  assert.equal(result.failing, 0);
  assert.equal(result.score, 100);
  assert.equal(result.healthy, true);
});

test('a Segment differing from the recorded segmentation result fails', () => {
  const result = segmentConsistency([segmented(500, 'Mid-Market', 'SMB')]);

  assert.equal(result.evaluated, 1);
  assert.equal(result.failing, 1);
  assert.equal(result.score, 0);

  const row = result.evidence[0];
  assert.equal(row.Expected_Segment, 'Mid-Market');
  assert.equal(row.Current_Segment, 'SMB');
  assert.equal(row.NumberOfEmployees, 500);
  assert.equal(row.Result, 'Mismatch');
});

test('the failing evidence names Salesforce Custom Metadata as the source of the expected Segment', () => {
  /**
   * The evaluator-facing requirement: "Segment Band v1.0" alone assumes the
   * reader already knows what that is. The cell has to say where the expected
   * value came from, which Salesforce configuration type it is, which rule
   * version applies, and what input produced what result.
   */
  const result = segmentConsistency([segmented(500, 'Mid-Market', 'SMB')]);
  const cell = String(result.evidence[0].Source_Evidence);

  assert.match(cell, /Salesforce Custom Metadata/);
  assert.match(cell, /Segment Band/);
  assert.match(cell, /v1\.0/);
  assert.match(cell, /Employee Count 500/);
  assert.match(cell, /Mid-Market/);
});

test('nothing an evaluator reads uses the word provenance', () => {
  const result = segmentConsistency([
    segmented(500, 'Mid-Market', 'SMB'),
    lead({ Segment_Basis__c: null, Segment__c: null }),
  ]);

  const surfaces = [
    result.title,
    result.businessQuestion,
    result.businessImpact,
    result.failureDetail,
    result.population,
    ...result.evidenceColumns.map((c) => c.label),
    ...result.notEvaluatedColumns.map((c) => c.label),
    ...result.evidence.flatMap((r) => Object.values(r).map(String)),
    ...result.notEvaluatedRows.flatMap((r) => Object.values(r).map(String)),
    ...result.failureBreakdown.map((b) => `${b.label} ${b.detail ?? ''}`),
    ...result.exclusionBreakdown.map((b) => `${b.label} ${b.detail ?? ''}`),
  ];

  for (const text of surfaces) {
    assert.ok(!/provenance/i.test(text), `evaluator-facing text says provenance: ${text}`);
  }
  assert.ok(
    surfaces.some((t) => /Source Evidence/i.test(t)),
    'the evaluator-facing term is used instead',
  );
});

test('a Lead shaped like the retained mismatch fixture fails, with no record hard-coded', () => {
  /**
   * The org holds one deliberately retained mismatch. This asserts the SHAPE
   * that makes it a mismatch - not its name, its id, or its employee count -
   * so correcting or deleting that record cannot quietly turn the check off.
   */
  const shaped = lead({
    Name: 'Any Name At All',
    NumberOfEmployees: 500,
    Segment_Basis__c: 'Employee Count: 500 -> Mid-Market | Rule v1.0',
    Segment__c: 'SMB',
  });

  const result = segmentConsistency([shaped]);

  assert.equal(result.failing, 1);
  assert.equal(result.failureBreakdown[0].label, 'Mid-Market recorded as SMB');
  assert.equal(result.failureBreakdown[0].count, 1);
});

test('account-matching status has no effect on segment-consistency eligibility', () => {
  /** Matching is a different capability. It says nothing about segmentation. */
  const withMatch = segmented(500, 'Mid-Market', 'SMB', { Match_Status__c: 'Matched' });
  const withoutMatch = segmented(500, 'Mid-Market', 'SMB', { Match_Status__c: null });

  const a = segmentConsistency([withMatch]);
  const b = segmentConsistency([withoutMatch]);

  assert.equal(a.evaluated, b.evaluated);
  assert.equal(a.failing, b.failing);
  assert.equal(a.score, b.score);
});

test('a Lead with no recorded segmentation result is not evaluated, and never passes', () => {
  const result = segmentConsistency([
    lead({ Segment_Basis__c: null, Segment__c: 'Enterprise' }),
    segmented(500, 'Mid-Market', 'Mid-Market'),
  ]);

  assert.equal(result.evaluated, 1);
  assert.equal(result.notEvaluatedCount, 1);
  assert.equal(result.unmeasurableCount, 1, 'segmentation applies; the result is what is absent');
  assert.equal(result.failing, 0);
  assert.equal(result.score, 100, 'the excluded Lead is neither a pass nor a failure');
  assert.match(
    String(result.notEvaluatedRows[0].Reason),
    /no segmentation source evidence is recorded/,
  );
});

test('an uninterpretable recorded result is excluded rather than guessed at', () => {
  /**
   * Honest exclusion over false precision. A guessed expected Segment would
   * either manufacture a failure or hide one.
   */
  const result = segmentConsistency([
    lead({ Segment_Basis__c: 'Employees 200-999', Segment__c: 'SMB' }),
  ]);

  assert.equal(result.evaluated, 0);
  assert.equal(result.failing, 0);
  assert.equal(result.notEvaluatedCount, 1);
  assert.match(String(result.notEvaluatedRows[0].Reason), /not in a form NorthstarIQ can interpret/);
  assert.equal(
    result.exclusionBreakdown.find((b) => /could not be interpreted/.test(b.label))?.count,
    1,
  );
});

test('a Lead segmented under an older rule version is judged on what was recorded', () => {
  /**
   * THE HISTORICAL SAFETY GUARANTEE.
   *
   * Two Leads with the same employee count, recorded under different rule
   * versions that resolved it differently. Both agree with their own recorded
   * result, so both pass. Re-running one configuration over both would report
   * a legitimate rule change as record drift.
   */
  const underV1 = lead({
    NumberOfEmployees: 500,
    Segment_Basis__c: bandBasis(500, 'Enterprise', 'v0.9'),
    Segment__c: 'Enterprise',
  });
  const underV2 = lead({
    NumberOfEmployees: 500,
    Segment_Basis__c: bandBasis(500, 'Mid-Market', 'v1.0'),
    Segment__c: 'Mid-Market',
  });

  const result = segmentConsistency([underV1, underV2]);

  assert.equal(result.evaluated, 2);
  assert.equal(result.failing, 0, 'a rule change is not drift');
  assert.equal(result.score, 100);
});

test('the Strategic Account path is credited to the Account, not to a band', () => {
  const strategic = lead({
    Segment_Basis__c: 'Strategic Account: Fictional Group | Rule v1.0',
    Segment__c: 'Strategic',
  });
  const drifted = lead({
    Segment_Basis__c: 'Strategic Account: Fictional Group | Rule v1.0',
    Segment__c: 'Enterprise',
  });

  const ok = segmentConsistency([strategic]);
  assert.equal(ok.failing, 0);

  const bad = segmentConsistency([drifted]);
  assert.equal(bad.failing, 1);
  assert.match(String(bad.evidence[0].Source_Evidence), /Salesforce Account designation/);
  assert.doesNotMatch(
    String(bad.evidence[0].Source_Evidence),
    /Custom Metadata/,
    'a band did not decide this one',
  );
});

test('a recorded "not segmentable" result expects no Segment, and says so', () => {
  const consistent = lead({
    NumberOfEmployees: null,
    Segment_Basis__c: 'Not segmentable: employee count missing',
    Segment__c: null,
  });
  const inconsistent = lead({
    NumberOfEmployees: null,
    Segment_Basis__c: 'Not segmentable: employee count missing',
    Segment__c: 'SMB',
  });

  assert.equal(segmentConsistency([consistent]).failing, 0);

  const bad = segmentConsistency([inconsistent]);
  assert.equal(bad.failing, 1);
  assert.equal(bad.evidence[0].Expected_Segment, '\u2014 (none)');
  assert.equal(bad.evidence[0].Current_Segment, 'SMB');
});

test('an employee count matching no active band expects no Segment', () => {
  const result = segmentConsistency([
    lead({
      NumberOfEmployees: 7,
      Segment_Basis__c: 'Not segmentable: no active band matches employee count 7',
      Segment__c: 'SMB',
    }),
  ]);

  assert.equal(result.evaluated, 1);
  assert.equal(result.failing, 1);
  assert.match(String(result.evidence[0].Source_Evidence), /matched no active band/);
});

test('an empty Segment picklist reads as no Segment, not as a different one', () => {
  const result = segmentConsistency([
    lead({
      NumberOfEmployees: null,
      Segment_Basis__c: 'Not segmentable: employee count missing',
      Segment__c: '',
    }),
  ]);

  assert.equal(result.failing, 0, 'blank and null are the same outcome');
});

test('segment consistency reconciles: evaluated = passing + failing, total = evaluated + not evaluated', () => {
  const leads = [
    segmented(500, 'Mid-Market', 'Mid-Market'),
    segmented(500, 'Mid-Market', 'SMB'),
    segmented(2500, 'Enterprise', 'Enterprise'),
    lead({ Segment_Basis__c: null, Segment__c: null }),
    lead({ Segment_Basis__c: 'something else entirely', Segment__c: 'SMB' }),
  ];

  const result = segmentConsistency(leads);

  assert.equal(result.orgPopulation, 5);
  assert.equal(result.evaluated, 3);
  assert.equal(result.notEvaluatedCount, 2);
  assert.equal(result.evaluated + result.notEvaluatedCount, result.orgPopulation);
  assert.equal(result.failing, 1);
  assert.equal(result.evaluated - result.failing, 2, 'passing');
  assert.equal(result.score, 67, 'round(100 x (1 - 1/3))');

  const excluded = result.exclusionBreakdown.reduce((sum, b) => sum + b.count, 0);
  assert.equal(excluded, result.notEvaluatedCount, 'every exclusion is accounted for');
});

test('adding segment consistency leaves the other six definitions untouched', () => {
  /**
   * Same records, same six results. The new check reads Segment_Basis__c,
   * which no other check consults, so nothing it does can move them.
   */
  const leads = [
    lead(),
    lead({ LeadSource: 'Web', NumberOfEmployees: null }),
    lead({ Segment_Basis__c: null, Segment__c: null, Match_Status__c: null }),
    lead({ Segment__c: 'SMB' }),
    lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Match' }),
    lead({ Match_Status__c: 'Review' }),
    lead({ Territory__c: null, CountryCode: 'BR' }),
    lead({ SLA_Status__c: 'Breached' }),
  ];
  const opps = [opportunity(), opportunity({ IsClosed: true })];

  const results = runAllChecks(leads, opps, TODAY, READINESS_SOURCES);
  const others = results.filter((r) => r.id !== 'segment-consistency');

  assert.equal(others.length, 6);
  assert.deepEqual(
    others.map((r) => [r.id, r.orgPopulation, r.evaluated, r.failing, r.score]),
    [
      ['missing-firmographics', 8, 8, 1, 88],
      ['routing-exceptions', 8, 7, 1, 86],
      ['sla-risk', 8, 8, 1, 88],
      ['ambiguous-match', 8, 7, 1, 86],
      ['missing-territory', 8, 7, 1, 86],
      ['stale-opportunities', 2, 1, 0, 100],
    ],
  );
});

test('missing routing data still reads its sources from Salesforce configuration', () => {
  /**
   * Guarded here as well as in its own test: the seventh check must not have
   * reintroduced a built-in source list through a shared code path.
   */
  const leads = [lead({ LeadSource: 'Web' }), lead({ LeadSource: 'Trade Show' })];
  const byId = (sources: string[]) =>
    runAllChecks(leads, [], TODAY, sources).find((r) => r.id === 'missing-firmographics');

  assert.equal(byId(['Web'])?.evaluated, 1);
  assert.equal(byId(['Trade Show'])?.evaluated, 1);
  assert.equal(byId(['Web', 'Trade Show'])?.evaluated, 2);
  assert.equal(byId([])?.evaluated, 0);
});

test('segment consistency is unaffected by the routing readiness configuration', () => {
  const leads = [segmented(500, 'Mid-Market', 'SMB', { LeadSource: 'Purchased List' })];

  const a = runAllChecks(leads, [], TODAY, READINESS_SOURCES).find(
    (r) => r.id === 'segment-consistency',
  );
  const b = runAllChecks(leads, [], TODAY, ['Trade Show']).find(
    (r) => r.id === 'segment-consistency',
  );

  assert.equal(a?.evaluated, 1);
  assert.deepEqual(
    [a?.evaluated, a?.failing, a?.score],
    [b?.evaluated, b?.failing, b?.score],
  );
});


/* --------------------------------- Opportunity Conversion Integrity (proof) */

const CONVERTED = 'Closed - Converted';

/** A Lead that claims conversion and has the Salesforce record to prove it. */
const trulyConverted = (over = {}) =>
  lead({
    Status: CONVERTED,
    IsConverted: true,
    ConvertedDate: '2026-08-20',
    ConvertedAccountId: '001000000000001',
    ConvertedContactId: '003000000000001',
    ConvertedOpportunityId: '006000000000001',
    ...over,
  });

/** A Lead that claims conversion with nothing behind it. */
const claimsOnly = (over = {}) => lead({ Status: CONVERTED, IsConverted: false, ...over });

test('a converted status with no Salesforce conversion record fails', () => {
  const result = opportunityConversionIntegrity([claimsOnly()]);

  assert.equal(result.evaluated, 1);
  assert.equal(result.failing, 1);
  assert.equal(result.score, 0);
  assert.equal(result.healthy, false);
  assert.equal(result.evidence[0].Result, 'Not substantiated');
  assert.equal(result.evidence[0].IsConverted, 'No');
});

test('a genuinely converted Lead passes', () => {
  const result = opportunityConversionIntegrity([trulyConverted()]);

  assert.equal(result.evaluated, 1);
  assert.equal(result.failing, 0);
  assert.equal(result.score, 100);
  assert.equal(result.healthy, true);
});

test('a converted Lead with no Opportunity passes - a null Opportunity is not a failure', () => {
  /**
   * THE MISREADING THIS GUARDS.
   *
   * Salesforce allows conversion with "do not create an opportunity", so
   * ConvertedOpportunityId is legitimately null on a perfectly valid
   * conversion. Failing on it would manufacture findings out of a supported
   * Salesforce behaviour. Only IsConverted decides.
   */
  const result = opportunityConversionIntegrity([
    trulyConverted({ ConvertedOpportunityId: null }),
  ]);

  assert.equal(result.failing, 0);
  assert.equal(result.score, 100);
});

test('a Lead making no conversion claim is outside the control, never a pass', () => {
  const result = opportunityConversionIntegrity([
    lead({ Status: 'Working - Contacted' }),
    lead({ Status: 'Open - Not Contacted' }),
    lead({ Status: 'Closed - Not Converted' }),
  ]);

  assert.equal(result.evaluated, 0, 'none of them claim conversion');
  assert.equal(result.notEvaluatedCount, 3);
  assert.equal(result.unmeasurableCount, 0, 'outside, not unmeasurable');
  assert.equal(result.failing, 0);
  assert.match(String(result.notEvaluatedRows[0].Reason), /makes no claim to have been converted/);
});

test('a control with nothing claiming conversion scores 100 rather than 0', () => {
  const result = opportunityConversionIntegrity([lead(), lead()]);

  assert.equal(result.evaluated, 0);
  assert.equal(result.score, 100, 'absence of data is not evidence of failure');
});

test('conversion integrity reconciles and scores from the claim population only', () => {
  /**
   * Mirrors the shape of the live org: claims that are not substantiated,
   * inside a much larger population that claims nothing.
   */
  const leads = [
    claimsOnly({ Name: 'Claim A' }),
    claimsOnly({ Name: 'Claim B' }),
    claimsOnly({ Name: 'Claim C' }),
    trulyConverted({ Name: 'Real conversion' }),
    ...Array.from({ length: 6 }, () => lead({ Status: 'Open - Not Contacted' })),
  ];

  const result = opportunityConversionIntegrity(leads);

  assert.equal(result.orgPopulation, 10);
  assert.equal(result.evaluated, 4, 'only the Leads claiming conversion');
  assert.equal(result.notEvaluatedCount, 6);
  assert.equal(result.evaluated + result.notEvaluatedCount, result.orgPopulation);
  assert.equal(result.failing, 3);
  assert.equal(result.score, 25, 'round(100 x (1 - 3/4))');
});

test('the evidence names the Salesforce fields the conclusion rests on', () => {
  const result = opportunityConversionIntegrity([
    claimsOnly({ ConvertedDate: null, ConvertedAccountId: null, ConvertedOpportunityId: null }),
  ]);

  const labels = result.evidenceColumns.map((c) => c.label);
  assert.ok(labels.includes('Lead Status'));
  assert.ok(labels.includes('Converted (Salesforce)'));
  assert.ok(labels.includes('Converted Date'));
  assert.ok(labels.includes('Converted Account'));
  assert.ok(labels.includes('Converted Contact'));
  // Labelled optional on purpose: Salesforce permits conversion without one,
  // so a reader must not take a blank cell here as the defect.
  assert.ok(labels.includes('Converted Opportunity (optional)'));

  const row = result.evidence[0];
  assert.equal(row.Status, CONVERTED);
  assert.equal(row.ConvertedDate, '\u2014', 'an absent value is named, not blank');
  assert.equal(row.ConvertedAccountId, '\u2014');
});

test('the finding is generated and carries a precise name', () => {
  const result = opportunityConversionIntegrity([claimsOnly()]);
  const findings = toFindings([result]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, 'lifecycle-conversion');
  assert.equal(findings[0].title, 'Converted Lifecycle State Not Substantiated');
  assert.equal(findings[0].category, 'Lifecycle Governance');
  assert.equal(findings[0].severity, 'High');
  assert.equal(findings[0].affected, 1);
  assert.equal(findings[0].evaluated, 1);
});

test('conversion integrity is NOT scored: the assessment still runs seven controls in five areas', () => {
  /**
   * The scoring boundary this increment deliberately holds.
   *
   * The control is implemented and tested above, and it is absent from
   * runAllChecks - so Assessment Model v1 is untouched and overall health
   * cannot have moved. Wiring it in is one line, held for approval.
   */
  const leads = [claimsOnly(), lead(), lead({ LeadSource: 'Web' })];
  const results = runAllChecks(leads, [opportunity()], TODAY, READINESS_SOURCES);

  assert.equal(results.length, 7, 'seven scored controls');
  assert.ok(
    !results.some((r) => r.id === 'lifecycle-conversion'),
    'the lifecycle control must not enter the scored run',
  );

  const areas = categoryScores(results);
  assert.equal(areas.length, 5, 'five scored assessment areas - Model v1');
  assert.ok(
    !areas.some((a) => a.category === 'Lifecycle Governance'),
    'an area with no executed control is not reported',
  );
});

test('declaring Lifecycle Governance does not disturb the existing area scores', () => {
  /**
   * `CATEGORY_ORDER` now lists Lifecycle Governance. This proves that listing
   * it changes nothing while it holds no result - the regression a naive
   * registry edit would introduce.
   */
  const leads = [lead(), lead({ NumberOfEmployees: null })];
  const results = runAllChecks(leads, [opportunity()], TODAY, READINESS_SOURCES);

  const areas = categoryScores(results);
  assert.deepEqual(
    areas.map((a) => a.category),
    ['Data Quality', 'Routing', 'Identity & Matching', 'SLA Performance', 'Pipeline Hygiene'],
  );
  assert.equal(overallHealth(areas), Math.round(areas.reduce((sum, a) => sum + a.score, 0) / 5));
});
