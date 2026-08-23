import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ambiguousMatch,
  governedWithoutSegment,
  missingFirmographics,
  missingTerritory,
  routingExceptions,
  runAllChecks,
  slaRisk,
  staleOpportunities,
} from '../lib/checks/index.ts';
import { lead, opportunity, TODAY } from './fixtures.ts';

const EXCEPTION_QUEUE = { Name: 'NIQ Routing Exception', Type: 'Queue' };

test('missing firmographics is scoped to the governed intake population', () => {
  const leads = [
    lead(),
    lead({ NumberOfEmployees: null }),
    // Ungoverned: this process makes no promise about it, so it is not judged.
    lead({ LeadSource: 'Web', NumberOfEmployees: null }),
  ];

  const result = missingFirmographics(leads);

  assert.equal(result.evaluated, 2, 'only governed Leads are evaluated');
  assert.equal(result.failing, 1);
  assert.equal(result.score, 50);
  assert.equal(result.healthy, false);
});

test('missing firmographics flags either missing attribute', () => {
  const result = missingFirmographics([
    lead({ NumberOfEmployees: null }),
    lead({ CountryCode: null }),
    lead(),
  ]);

  assert.equal(result.failing, 2, 'employee count and country each fail on their own');
  assert.equal(result.evidence.length, 2);
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

test('missing territory is scoped to the governed intake population', () => {
  const result = missingTerritory([
    lead({ Territory__c: null, CountryCode: 'BR', Exception_Type__c: 'Unmapped Geography' }),
    lead(),
    lead({ LeadSource: 'Web', Territory__c: null }),
  ]);

  assert.equal(result.evaluated, 2);
  assert.equal(result.failing, 1);
  assert.equal(result.score, 50);
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
  const result = missingFirmographics([lead({ LeadSource: 'Web' })]);

  assert.equal(result.evaluated, 0);
  assert.equal(result.score, 100);
  assert.equal(result.healthy, true);
});

test('runAllChecks runs exactly the six implemented checks', () => {
  const results = runAllChecks([lead()], [opportunity()], TODAY);

  assert.deepEqual(
    results.map((r) => r.id),
    [
      'missing-firmographics',
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

  const result = missingFirmographics(leads);

  assert.equal(result.failing, 14, 'the count is the full failing total');
  assert.equal(result.evidence.length, 10, 'the table shows a bounded sample');
});
