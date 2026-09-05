/**
 * Closed Lost Without a Governed Reason — the Opportunity outcome control.
 *
 * Fixtures only: no network, no Salesforce, no clock dependence.
 *
 * WHAT THESE TESTS PROVE, AND WHAT THEY DO NOT. They prove how the detector
 * reads persisted Opportunity evidence. They prove nothing about the Salesforce
 * validation rule, which exists in source and **has never been deployed** — its
 * formula semantics are checked separately below by reading the metadata, which
 * is a structural check, not a runtime one. Whether Salesforce actually blocks a
 * save is reserved for runtime validation in a later increment.
 *
 * THE ORG HOLDS ZERO CLOSED LOST OPPORTUNITIES. Every case here is therefore a
 * fixture by necessity, not by preference.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import { closedLostReason, CHECK_IDS } from '../lib/checks/index.ts';
import type { OpportunityRecord } from '../lib/soql.ts';
import { opportunity } from './fixtures.ts';

/** A lost Opportunity. Salesforce derives IsClosed/IsWon from the stage. */
function lost(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return opportunity({
    StageName: 'Closed Lost',
    IsClosed: true,
    IsWon: false,
    ...overrides,
  });
}

/** A won Opportunity — no loss reason is ever owed. */
function won(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return opportunity({
    StageName: 'Closed Won',
    IsClosed: true,
    IsWon: true,
    ...overrides,
  });
}

/* ------------------------------------------------- 1. the four verdicts */
test('Closed Lost with a governed reason passes', () => {
  const r = closedLostReason([lost({ Loss_Reason__c: 'Not ICP' })]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
  assert.equal(r.failureDetail, '');
});

test('Closed Lost with no reason is a finding', () => {
  const r = closedLostReason([lost({ Loss_Reason__c: null })]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 1);
  assert.equal(r.evidence[0]['Loss Reason'], '— (none recorded)');
  assert.match(String(r.evidence[0].Result), /the outcome is recorded, the cause is not/);
});

test('Closed Won is outside the control — no loss reason was ever owed', () => {
  const r = closedLostReason([won()]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.failing, 0);
  assert.equal(r.notEvaluatedCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /was won, so no loss reason was ever owed/);
});

test('an open Opportunity is outside the control — no loss has been declared', () => {
  const r = closedLostReason([opportunity({ StageName: 'Negotiation/Review' })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.notEvaluatedCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /still open at stage/);
});

/* ----------------------------------------- 2. population accounting */
test('every Opportunity is accounted for: evaluated plus not evaluated equals the population', () => {
  const opps = [
    lost({ Loss_Reason__c: 'Product Gap' }),
    lost({ Loss_Reason__c: null }),
    won(),
    opportunity(),
  ];
  const r = closedLostReason(opps);
  assert.equal(r.orgPopulation, 4);
  assert.equal(r.evaluated, 2);
  assert.equal(r.failing, 1);
  assert.equal(r.evaluated + r.notEvaluatedCount, r.orgPopulation);
});

test('an empty string is treated as no reason, not as a value', () => {
  const r = closedLostReason([lost({ Loss_Reason__c: '' })]);
  assert.equal(r.failing, 1);
});

/* --------------------------------- 3. what the control refuses to claim */
test('all four governed values pass equally — the control never judges which is correct', () => {
  for (const v of ['Lost to Competitor', 'No Decision', 'Not ICP', 'Product Gap']) {
    const r = closedLostReason([lost({ Loss_Reason__c: v })]);
    assert.equal(r.failing, 0, `${v} should pass`);
  }
});

test('the control does not reproduce the validation rule: it reads state, not transitions', () => {
  /*
   * A record lost long before the safeguard existed carries no reason and was
   * never blocked. It is a legitimate finding — and that is the whole reason
   * the detector exists separately from the rule.
   */
  const historical = lost({ Loss_Reason__c: null, CloseDate: '2024-01-15' });
  const r = closedLostReason([historical]);
  assert.equal(r.failing, 1, 'a pre-governance record surfaces as a finding');
  // Nothing in the evidence claims the validation rule failed.
  assert.ok(!/validation rule/i.test(JSON.stringify(r.evidence)));
});

/* ------------------------------------------- 4. deliberately unregistered */
test('the control is implemented, detective and registered', () => {
  assert.ok(
    CHECK_IDS.includes('closed-lost-reason'),
    'CHECK_IDS is the API allow-list and the scored set - this control is in it',
  );
  assert.equal(CHECK_IDS.length, 14, 'Assessment Model v4: fourteen scored controls');
});

/* ------------------------- 5. the Salesforce artifacts, structurally */
const META = (p: string) => readFileSync(`../force-app/main/default/${p}`, 'utf8');

test('the loss vocabulary is restricted to the four governed values', () => {
  const f = META('objects/Opportunity/fields/Loss_Reason__c.field-meta.xml');
  assert.ok(f.includes('<restricted>true</restricted>'));
  for (const v of ['Lost to Competitor', 'No Decision', 'Not ICP', 'Product Gap']) {
    assert.ok(f.includes(`<fullName>${v}</fullName>`), `${v} is declared`);
  }
  assert.equal((f.match(/<value>/g) ?? []).length, 4, 'exactly four values');
  assert.ok(!/<fullName>Other<\/fullName>/.test(f), 'no Other');
  assert.ok(!/<fullName>Price<\/fullName>/.test(f), 'no Price');
  // The requirement is conditional, so the field itself must not be required.
  assert.ok(!/<required>true<\/required>/.test(f), 'not universally required');
  assert.ok(!/<default>true<\/default>/.test(f), 'no default value');
});

test('the validation rule enforces entry and protects existing evidence, and nothing more', () => {
  const v = META(
    'objects/Opportunity/validationRules/Closed_Lost_Requires_Governed_Reason.validationRule-meta.xml',
  );
  const formula = v.slice(
    v.indexOf('<errorConditionFormula>'),
    v.indexOf('</errorConditionFormula>'),
  );
  assert.ok(/ISPICKVAL\(StageName, &quot;Closed Lost&quot;\)/.test(formula), 'scoped to Closed Lost');
  assert.ok(/ISBLANK\(TEXT\(Loss_Reason__c\)\)/.test(formula), 'fires only when the reason is blank');
  assert.ok(/ISNEW\(\)/.test(formula), 'catches creation directly at Closed Lost');
  assert.ok(/ISCHANGED\(StageName\)/.test(formula), 'catches entry into Closed Lost');
  assert.ok(
    /PRIORVALUE\(Loss_Reason__c\)/.test(formula),
    'catches erasing a reason that already existed',
  );
  /*
   * The clause that keeps history editable. Without the OR, the rule would
   * become "every edit to every Closed Lost Opportunity requires a reason",
   * which PD-17 does not say.
   */
  assert.ok(/OR\(/.test(formula), 'the three trigger conditions are alternatives, not requirements');
  assert.ok(!/IsClosed|IsWon/.test(formula), 'does not re-derive stage-derived platform invariants');
  assert.ok(
    !/Lost to Competitor|No Decision|Not ICP|Product Gap/.test(formula),
    'does not re-test vocabulary membership — the restricted picklist already guarantees it',
  );
});

test('the seller-facing error message says what to do, not that validation failed', () => {
  const v = META(
    'objects/Opportunity/validationRules/Closed_Lost_Requires_Governed_Reason.validationRule-meta.xml',
  );
  const msg = (v.match(/<errorMessage>([\s\S]*?)<\/errorMessage>/) ?? [])[1] ?? '';
  assert.ok(msg.length > 0 && msg.length <= 255, 'within the Salesforce 255-character limit');
  assert.ok(!/validation failed/i.test(msg), 'not a vague failure message');
  assert.match(msg, /Select a Loss Reason/);
  for (const v2 of ['Lost to Competitor', 'No Decision', 'Not ICP', 'Product Gap']) {
    assert.ok(msg.includes(v2), `${v2} is offered to the seller`);
  }
  assert.match(msg, /not cleared while the Opportunity stays Closed Lost/);
});

test('the seller can see the field: it is on the Opportunity layout, editable not required', () => {
  const l = META('layouts/Opportunity-Opportunity Layout.layout-meta.xml');
  assert.ok(l.includes('<field>Loss_Reason__c</field>'), 'exposed on the layout');
  const i = l.indexOf('<field>Loss_Reason__c</field>');
  const item = l.slice(l.lastIndexOf('<layoutItems>', i), i);
  assert.match(item, /<behavior>Edit<\/behavior>/, 'editable, not layout-Required');
  /*
   * The layout carries a stock ChangeRecordType action because that is what the
   * retrieved standard layout contains. The constraint NorthstarIQ actually
   * holds is that it introduces no Record Types of its own, which is a fact
   * about the source tree rather than about this file.
   */
  assert.ok(
    !existsSync('../force-app/main/default/objects/Opportunity/recordTypes'),
    'no Record Type was introduced to satisfy this control',
  );
});

test('no rejected architecture was introduced', () => {
  const l = META('layouts/Opportunity-Opportunity Layout.layout-meta.xml');
  assert.ok(!/Loss_Recorded_At__c|Loss_Recorded_By__c|Loss_Reason_Basis__c/.test(l));
  // Nothing under Opportunity should be a Flow or Custom Metadata type.
  assert.ok(!/Opportunity_Outcome_Policy__mdt/.test(l));
});
