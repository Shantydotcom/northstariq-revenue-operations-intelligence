/**
 * Revenue Handoff Integrity (PD-21) — the Closed Won evidence control.
 *
 * Fixtures only: no network, no Salesforce, no clock dependence.
 *
 * WHAT THESE TESTS PROVE, AND WHAT THEY DO NOT. They prove how the detector
 * reads persisted Opportunity evidence, and that it stays out of the active
 * assessment. They prove NOTHING about Salesforce: this control has never
 * executed against the org, so there is no integration-runtime evidence, no
 * live pass-path evidence and no live fail-path evidence for it. The evidence
 * state after this increment is exactly:
 *
 *   SOURCE IMPLEMENTED · LOCALLY VALIDATED · NOT REGISTERED · NOT ACTIVE
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECK_IDS,
  closedLostReason,
  revenueHandoffIntegrity,
  runAllChecks,
  staleOpportunities,
} from '../lib/checks/index.ts';
import { CATEGORIES, MODEL_VERSION } from '../lib/score.ts';
import { PRESENTATION } from '../lib/presentation.ts';
import { TRACEABILITY } from '../lib/traceability.ts';
import type { OpportunityRecord } from '../lib/soql.ts';
import {
  contactRoles,
  GOVERNANCE,
  GOVERNED,
  lead,
  NO_HISTORY,
  opportunity,
  TODAY,
} from './fixtures.ts';

/**
 * A won Opportunity carrying COMPLETE handoff evidence.
 *
 * Salesforce derives IsClosed/IsWon from the stage; the fixture states both
 * because the detector reads them, never the label.
 */
function won(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return opportunity({
    StageName: 'Closed Won',
    IsClosed: true,
    IsWon: true,
    Amount: 250000,
    OpportunityContactRoles: contactRoles(1),
    ...overrides,
  });
}

/* --------------------------------------------------------- 1. population */
test('an open Opportunity is outside the control — no win has been declared', () => {
  const r = revenueHandoffIntegrity([opportunity({ StageName: 'Negotiation/Review' })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.failing, 0);
  assert.equal(r.notEvaluatedCount, 1);
  assert.equal(r.notEvaluatedRecords[0].kind, 'outside');
  assert.match(String(r.notEvaluatedRows[0].Reason), /still open at stage/);
});

test('a Closed Lost Opportunity is outside the control — it never becomes Revenue', () => {
  const lost = opportunity({ StageName: 'Closed Lost', IsClosed: true, IsWon: false });
  const r = revenueHandoffIntegrity([lost]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.notEvaluatedCount, 1);
  assert.equal(r.notEvaluatedRecords[0].kind, 'outside');
  assert.match(String(r.notEvaluatedRows[0].Reason), /never becomes Revenue/);
});

test('a Closed Won Opportunity is evaluated', () => {
  const r = revenueHandoffIntegrity([won()]);
  assert.equal(r.evaluated, 1);
});

test('the population is Salesforce state, not the stage label', () => {
  /*
   * A record labelled "Closed Won" whose derived flags say otherwise is NOT a
   * win. The detector must follow the flags, which Salesforce owns and nobody
   * can write, rather than the label, which is a configurable display value.
   */
  const mislabelled = opportunity({ StageName: 'Closed Won', IsClosed: false, IsWon: false });
  const r = revenueHandoffIntegrity([mislabelled]);
  assert.equal(r.evaluated, 0, 'the label alone never puts a record in the population');
  assert.equal(r.notEvaluatedCount, 1);
});

test('every Opportunity is accounted for: evaluated plus not evaluated equals the population', () => {
  const opps = [
    won(),
    won({ AccountId: null }),
    opportunity(),
    opportunity({ StageName: 'Closed Lost', IsClosed: true, IsWon: false }),
  ];
  const r = revenueHandoffIntegrity(opps);
  assert.equal(r.orgPopulation, opps.length);
  assert.equal(r.evaluated + r.notEvaluatedCount, r.orgPopulation);
  assert.equal(r.unmeasurableCount, 0, 'every element is observable — nothing is unmeasurable');
});

/* -------------------------------------------------------------- 2. pass */
test('complete handoff evidence passes', () => {
  const r = revenueHandoffIntegrity([won()]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
  assert.equal(r.failureDetail, '');
  assert.equal(r.healthy, true);
  assert.equal(r.score, 100);
});

/* ------------------------------------------------ 3. single predicates */
test('P1 — a missing Account relationship is a finding', () => {
  const r = revenueHandoffIntegrity([won({ AccountId: null })]);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0].AccountRelationship, '— (no Account related)');
  assert.match(String(r.evidence[0].Result), /Account relationship/);
  assert.doesNotMatch(String(r.evidence[0].Result), /Amount/);
});

test('P2 — a missing Amount is a finding', () => {
  const r = revenueHandoffIntegrity([won({ Amount: null })]);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0].Amount, '— (not populated)');
  assert.match(String(r.evidence[0].Result), /Amount/);
});

test('P3 — no Opportunity Contact Role is a finding', () => {
  const r = revenueHandoffIntegrity([won({ OpportunityContactRoles: null })]);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0].ContactRoles, '— (no contact role recorded)');
  assert.match(String(r.evidence[0].Result), /Customer contact relationship/);
});

/* --------------------------------------------------------- 4. overlap */
test('P1 + P2 — one record, both elements named', () => {
  const r = revenueHandoffIntegrity([won({ AccountId: null, Amount: null })]);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence.length, 1);
  const result = String(r.evidence[0].Result);
  assert.match(result, /Account relationship/);
  assert.match(result, /Amount/);
});

test('P1 + P3 — one record, both elements named', () => {
  const r = revenueHandoffIntegrity([won({ AccountId: null, OpportunityContactRoles: null })]);
  assert.equal(r.failing, 1);
  const result = String(r.evidence[0].Result);
  assert.match(result, /Account relationship/);
  assert.match(result, /Customer contact relationship/);
});

test('P2 + P3 — one record, both elements named', () => {
  const r = revenueHandoffIntegrity([won({ Amount: null, OpportunityContactRoles: null })]);
  assert.equal(r.failing, 1);
  const result = String(r.evidence[0].Result);
  assert.match(result, /Amount/);
  assert.match(result, /Customer contact relationship/);
});

test('P1 + P2 + P3 — ONE failing record, not three, with all three elements named', () => {
  const r = revenueHandoffIntegrity([
    won({ AccountId: null, Amount: null, OpportunityContactRoles: null }),
  ]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 1, 'three missing elements are one incomplete handoff');
  assert.equal(r.evidence.length, 1, 'the record appears once in the evidence');
  const result = String(r.evidence[0].Result);
  assert.match(result, /Account relationship/);
  assert.match(result, /Amount/);
  assert.match(result, /Customer contact relationship/);
});

test('the per-predicate breakdown overlaps deliberately and never becomes the failing count', () => {
  const r = revenueHandoffIntegrity([
    won({ AccountId: null, Amount: null, OpportunityContactRoles: null }),
    won({ OpportunityContactRoles: null }),
    won(),
  ]);
  assert.equal(r.evaluated, 3);
  assert.equal(r.failing, 2, 'unique failing records');

  const by = (label: string) => r.failureBreakdown.find((b) => b.label.startsWith(label))?.count;
  assert.equal(by('No Account'), 1);
  assert.equal(by('No Amount'), 1);
  assert.equal(by('No customer contact'), 2);

  const summed = r.failureBreakdown.reduce((t, b) => t + b.count, 0);
  assert.equal(summed, 4);
  assert.notEqual(summed, r.failing, 'the breakdown overlaps — summing it would double-count');
});

/* ------------------------------------------------- 5. Amount semantics */
test('an Amount of zero PASSES — populated is the requirement, not a threshold', () => {
  const r = revenueHandoffIntegrity([won({ Amount: 0 })]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0, 'zero is a populated value; a threshold would be invented policy');
});

test('a negative Amount also passes — the control judges presence, never value', () => {
  const r = revenueHandoffIntegrity([won({ Amount: -1000 })]);
  assert.equal(r.failing, 0);
});

/* ------------------------------- 6. contact-role relationship robustness */
test('an empty records array counts as zero roles', () => {
  const r = revenueHandoffIntegrity([won({ OpportunityContactRoles: { records: [] } })]);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0].ContactRoles, '— (no contact role recorded)');
});

test('null counts as zero roles — the shape Salesforce actually returns', () => {
  const r = revenueHandoffIntegrity([won({ OpportunityContactRoles: null })]);
  assert.equal(r.failing, 1);
});

test('an absent relationship key fails safely rather than throwing', () => {
  /*
   * Not representable through the type, which requires the key — the cast is
   * deliberate and exists to prove the runtime guard, since a payload that
   * omitted the subquery would otherwise reach the detector as undefined.
   * Unreadable evidence is counted as ABSENT evidence, which is the
   * conservative reading for a control that asks whether evidence is present.
   */
  const missingKey = { ...won() } as Partial<OpportunityRecord>;
  delete missingKey.OpportunityContactRoles;
  const r = revenueHandoffIntegrity([missingKey as OpportunityRecord]);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0].ContactRoles, '— (no contact role recorded)');
});

test('more than one role passes and the count is reported', () => {
  const r = revenueHandoffIntegrity([won({ OpportunityContactRoles: contactRoles(3) })]);
  assert.equal(r.failing, 0);
});

/* --------------------------------------------------- 7. claim boundary */
test('the contact-role finding claims missing CRM evidence, never a missing person', () => {
  const p = PRESENTATION['revenue-handoff-integrity'];
  const prose = [
    p.why,
    p.control,
    p.explain.proves,
    ...(p.sourceEvidence?.pairs.map((x) => x.detail) ?? []),
  ].join(' ');
  assert.doesNotMatch(prose, /has no contact\b/i);
  assert.doesNotMatch(prose, /no customer contact exists/i);
  assert.match(prose, /never that no such person exists/i);
});

test('nothing in the presentation claims recognized, booked or contracted revenue', () => {
  const p = PRESENTATION['revenue-handoff-integrity'];
  const prose = JSON.stringify({ ...p, finding: undefined });
  assert.doesNotMatch(prose, /booked revenue|contracted revenue|signed contract/i);
  assert.doesNotMatch(prose, /\bARR\b|\bMRR\b|\bACV\b|\bTCV\b/);
  /*
   * PD-19 governs the language: Amount is never called revenue. The
   * disclaimer must be stated where a reader of the finding will meet it, not
   * merely absent from the copy.
   */
  assert.match(
    p.explain.proves ?? '',
    /never a statement about recognized revenue/i,
    'the limit on what a pass proves must name recognized revenue explicitly',
  );
});

test('the detector states no safeguard exists — it must not imply prevention', () => {
  const p = PRESENTATION['revenue-handoff-integrity'];
  assert.equal(p.safeguard.kind, 'detective');
  assert.match(p.safeguard.title, /No automated safeguard/i);
  assert.equal(p.safeguard.remediation, undefined);
});

/* ------------------------------------ 8. NOT REGISTERED / NOT ACTIVE */
test('the control is implemented, detective and deliberately unregistered', () => {
  assert.ok(
    !CHECK_IDS.includes('revenue-handoff-integrity' as never),
    'absent from CHECK_IDS, so no assessment executes it and no score moves',
  );
  assert.equal(CHECK_IDS.length, 12, 'Assessment Model v3 stays at twelve scored controls');
  assert.equal(MODEL_VERSION, 'v3', 'source implementation does not advance the model');
  assert.equal(CATEGORIES.length, 6, 'six assessment areas, unchanged');
});

test('runAllChecks does not execute it', () => {
  const results = runAllChecks(
    [lead({ Status: 'MQL' })],
    [won(), won({ AccountId: null, Amount: null, OpportunityContactRoles: null })],
    TODAY,
    [GOVERNED],
    GOVERNANCE,
    NO_HISTORY,
  );
  assert.equal(results.length, 12, 'twelve controls run, not thirteen');
  assert.ok(
    !results.some((r) => r.id === 'revenue-handoff-integrity'),
    'the detector produces no result inside an assessment run',
  );
});

test('its identifier is type-complete even though it is inactive', () => {
  assert.ok(PRESENTATION['revenue-handoff-integrity'], 'presentation record exists');
  assert.ok(TRACEABILITY['revenue-handoff-integrity'], 'traceability record exists');
});

test('traceability states the evidence position honestly and claims no runtime evidence', () => {
  const t = TRACEABILITY['revenue-handoff-integrity'];
  assert.deepEqual(t.usages, [], 'no Salesforce configuration backs this control');
  const none = t.noneEstablished ?? '';
  assert.match(none, /NOT REGISTERED/);
  assert.match(none, /NOT ACTIVE IN ASSESSMENT/);
  assert.match(none, /never executed against Salesforce/i);

  const source = PRESENTATION['revenue-handoff-integrity'].verificationSource;
  assert.match(source, /SOURCE IMPLEMENTED/);
  assert.match(source, /NO Salesforce integration runtime evidence/i);
  assert.doesNotMatch(source, /deployed/i);
});

/* ------------------------------ 9. existing Opportunity controls intact */
test('the two registered Opportunity controls are unchanged by the new evidence fields', () => {
  const opps = [
    opportunity({ CloseDate: '2020-01-01' }),
    opportunity({
      StageName: 'Closed Lost',
      IsClosed: true,
      IsWon: false,
      Loss_Reason__c: null,
    }),
    won({ AccountId: null, Amount: null, OpportunityContactRoles: null }),
  ];

  const stale = staleOpportunities(opps, TODAY);
  assert.equal(stale.evaluated, 1, 'still open Opportunities only');
  assert.equal(stale.failing, 1);

  const lost = closedLostReason(opps);
  assert.equal(lost.evaluated, 1, 'still Closed Lost only');
  assert.equal(lost.failing, 1);

  /*
   * The record missing every handoff element is invisible to both: one judges
   * open pipeline, the other judges losses. Disjoint populations, no overlap.
   */
  assert.ok(!stale.evidence.some((e) => e.Id === opps[2].Id));
  assert.ok(!lost.evidence.some((e) => e.Id === opps[2].Id));
});
