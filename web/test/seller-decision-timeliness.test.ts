/**
 * Seller Decision Timeliness - the fourth lifecycle detective control.
 *
 * Fixtures only: no network, no Salesforce, no clock dependence beyond the one
 * place it is unavoidable.
 *
 * WHAT THESE TESTS CAN AND CANNOT PROVE. The control reads two Salesforce-side
 * artifacts it does not own: `Acceptance_Due_DateTime__c`, which the Flow
 * stamps at MQL entry, and `Acceptance_Status__c`, which is a formula field.
 * Neither can execute here. So these tests prove how the control INTERPRETS
 * that evidence, and the metadata tests at the end prove the artifacts are
 * declared to produce it. Whether the Flow stamps the right instant, and
 * whether the formula transitions on the right boundary, is Salesforce runtime
 * behaviour and is reserved for runtime validation.
 *
 * THE OVERDUE CASE IS SYNTHETIC TEST EVIDENCE. A fixture carrying a past
 * deadline is the only honest way to exercise it here: manufacturing one in
 * Salesforce would mean either waiting out the real 24-hour window or tampering
 * with governed configuration to shorten it, and the second is forbidden.
 * Nothing below should be read as live evidence that a real Lead went overdue.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sellerDecisionTimeliness, CHECK_IDS } from '../lib/checks/index.ts';
import {
  resolveSalesAcceptancePolicy,
  type SalesAcceptancePolicy,
} from '../lib/checks/sales-qualification-policy.ts';
import type { LeadRecord, SalesAcceptancePolicyRecord } from '../lib/soql.ts';
import { lead } from './fixtures.ts';
import { readFileSync } from 'node:fs';

/** The acceptance policy as v1.2 declares it: the first version to issue a commitment. */
const V12: SalesAcceptancePolicy = {
  version: 'v1.2',
  acceptedStage: 'SAL',
  requireExplicitAcceptance: true,
  requireMqlEvidence: true,
  requireIndividualOwner: true,
  acceptanceSlaHours: 24,
};

/** v1.1 governed acceptance but issued no decision commitment. */
const V11: SalesAcceptancePolicy = { ...V12, version: 'v1.1', acceptanceSlaHours: null };

/**
 * A hypothetical successor, used only to prove provenance survives succession.
 * It exists in no Salesforce source - it is here to answer "what happens to a
 * v1.2 commitment once v1.2 is no longer the active policy?".
 */
const V13: SalesAcceptancePolicy = { ...V12, version: 'v1.3', acceptanceSlaHours: 48 };

/** The commitment evidence the Flow writes beside the deadline under v1.2. */
const V12_BASIS =
  'Seller decision commitment under Sales Acceptance Policy v1.2: decision due within 24 business hours of MQL entry (weekend-aware approximation)';

const MQL_EVIDENCE =
  'Qualified under MQL Policy v1.1: governed source NorthstarIQ Inbound; Mid-Market segment eligible; territory NA-West resolved; account match No Match';

/**
 * A Lead that reached MQL and was given a decision commitment.
 *
 * `Acceptance_Status__c` is supplied explicitly rather than derived here: it is
 * Salesforce's formula, and recomputing it in the fixture would mean this suite
 * asserting against its own second copy of the definition.
 */
function committed(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return lead({
    Status: 'MQL',
    MQL_Basis__c: MQL_EVIDENCE,
    Owner: { Name: 'NIQ Seller', Type: 'User' },
    Acceptance_Due_DateTime__c: '2026-09-03T20:34:30.000+0000',
    Acceptance_Basis__c: V12_BASIS,
    Acceptance_Status__c: 'Pending',
    ...overrides,
  });
}

/* ------------------------------------------------- 1. policy resolution */
test('v1.2 resolves with the governed 24-hour decision commitment', () => {
  const record: SalesAcceptancePolicyRecord = {
    Policy_Version__c: 'v1.2',
    Accepted_Stage__c: 'SAL',
    Require_Explicit_Acceptance__c: true,
    Require_MQL_Evidence__c: true,
    Require_Individual_Owner__c: true,
    Acceptance_SLA_Hours__c: 24,
  };
  assert.deepEqual(resolveSalesAcceptancePolicy([record]), {
    version: 'v1.2',
    acceptedStage: 'SAL',
    requireExplicitAcceptance: true,
    requireMqlEvidence: true,
    requireIndividualOwner: true,
    acceptanceSlaHours: 24,
  });
});

test('a policy declaring no decision hours issues no commitment', () => {
  const none = resolveSalesAcceptancePolicy([
    {
      Policy_Version__c: 'v1.1',
      Accepted_Stage__c: 'SAL',
      Require_Explicit_Acceptance__c: true,
      Require_MQL_Evidence__c: true,
      Require_Individual_Owner__c: true,
      Acceptance_SLA_Hours__c: null,
    },
  ]);
  assert.equal(none.acceptanceSlaHours, null);

  // Zero is not a commitment either - it would mean "due the instant it arrived".
  const zero = resolveSalesAcceptancePolicy([
    {
      Policy_Version__c: 'v1.1',
      Accepted_Stage__c: 'SAL',
      Require_Explicit_Acceptance__c: true,
      Require_MQL_Evidence__c: true,
      Require_Individual_Owner__c: true,
      Acceptance_SLA_Hours__c: 0,
    },
  ]);
  assert.equal(zero.acceptanceSlaHours, null);
});

/* --------------------------------------------------- 2. decision states */
test('Pending inside the window is not a finding', () => {
  const r = sellerDecisionTimeliness([committed()], V12);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
  assert.equal(r.notEvaluatedCount, 0);
});

test('Overdue with no decision recorded is a finding', () => {
  // SYNTHETIC TEST EVIDENCE - a past deadline supplied by the fixture.
  const r = sellerDecisionTimeliness(
    [committed({ Acceptance_Status__c: 'Overdue' })],
    V12,
  );
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /neither an acceptance nor an explicit rejection/);
  assert.equal(r.evidence[0]['Accepted At'], '—');
  assert.equal(r.evidence[0]['Rejected At'], '—');
});

test('an accepted handoff passes: the seller answered', () => {
  const r = sellerDecisionTimeliness(
    [
      committed({
        Status: 'SAL',
        Acceptance_Status__c: 'Accepted',
        Sales_Accepted__c: true,
        Sales_Accepted_At__c: '2026-09-02T20:34:30.000+0000',
        Sales_Accepted_By__c: '005aj00000bo32DAAQ',
        Sales_Acceptance_Basis__c:
          'Accepted under Sales Acceptance Policy v1.2: explicit seller acceptance recorded; Marketing handoff substantiated by MQL evidence; accountable individual owner in place',
      }),
    ],
    V12,
  );
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
});

test('a rejected handoff passes for timeliness - a completed decision, not a won deal', () => {
  const r = sellerDecisionTimeliness(
    [
      committed({
        Acceptance_Status__c: 'Rejected',
        Sales_Rejection_Reason__c: 'Not ICP',
        Sales_Rejected_At__c: '2026-09-02T21:00:00.000+0000',
        Sales_Rejected_By__c: '005aj00000bsVSvAAM',
        Sales_Rejection_Basis__c:
          'Rejected under Sales Acceptance Policy v1.2: Not ICP; declined by the accountable individual owner',
      }),
    ],
    V12,
  );
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0, 'the seller answered inside the window');
  // The Lead stays MQL - rejection is not a lifecycle regression.
  assert.equal(r.failureDetail, '');
});

/* ------------------------------------- 3. history is not retroactive */
test('a Lead that reached MQL before commitments existed is unmeasurable, never overdue', () => {
  const historical = lead({
    Status: 'MQL',
    MQL_Basis__c: MQL_EVIDENCE,
    Acceptance_Due_DateTime__c: null,
    Acceptance_Status__c: null,
  });
  const r = sellerDecisionTimeliness([historical], V12);
  assert.equal(r.evaluated, 0, 'no commitment was ever issued, so nothing can be timed');
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(
    String(r.notEvaluatedRows[0].Reason),
    /before a decision commitment was issued/,
  );
});

test('a Lead that never reached MQL is outside the control, not unmeasurable', () => {
  const r = sellerDecisionTimeliness([lead({ Status: 'Working - Contacted' })], V12);
  assert.equal(r.evaluated, 0);
  assert.equal(r.unmeasurableCount, 0, 'no decision was ever requested on it');
  assert.equal(r.notEvaluatedCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /has not reached Marketing qualification/);
});

test('every Lead is accounted for: evaluated plus not evaluated equals the population', () => {
  const leads = [
    committed(),
    committed({ Acceptance_Status__c: 'Overdue' }),
    lead({ Status: 'MQL', MQL_Basis__c: MQL_EVIDENCE }),
    lead(),
  ];
  const r = sellerDecisionTimeliness(leads, V12);
  assert.equal(r.orgPopulation, 4);
  assert.equal(r.evaluated + r.notEvaluatedCount, r.orgPopulation);
});

/* --------------------------------------------------- 4. evidence shape */
test('the rejection reason is projected as evidence on an overdue finding', () => {
  const r = sellerDecisionTimeliness(
    [committed({ Acceptance_Status__c: 'Overdue' })],
    V12,
  );
  const keys = r.evidenceColumns.map((c) => c.key);
  assert.ok(keys.includes('Rejection Reason'));
  assert.ok(keys.includes('Decision Due'));
  assert.ok(keys.includes('Decision State'));
  // The two stamps prove the finding by their absence, so both are marked proving.
  const proving = r.evidenceColumns.filter((c) => c.proving).map((c) => c.key);
  assert.ok(proving.includes('Accepted At'));
  assert.ok(proving.includes('Rejected At'));
  assert.ok(proving.includes('Decision Due'));
  assert.ok(proving.includes('Owner'));
});

test('the issuing policy is read from the commitment, not assumed from the active one', () => {
  // Today the two coincide, and the population says so from the evidence.
  const same = sellerDecisionTimeliness([committed()], V12).population;
  assert.match(same, /commitment issued under Sales Acceptance Policy v1\.2/);
  assert.match(same, /v1\.2 currently declares a 24-hour decision commitment/);

  /*
   * THE CASE THE FIELD EXISTS FOR. The same Lead, judged after succession to
   * v1.3. Its deadline was issued by v1.2 and the population must still say so
   * - naming v1.3 as the issuer would be a provenance claim the record
   * contradicts, and recomputing the deadline from v1.3's 48 hours would move
   * a commitment that was already given.
   */
  const after = sellerDecisionTimeliness([committed()], V13).population;
  assert.match(after, /commitment issued under Sales Acceptance Policy v1\.2/);
  assert.match(after, /v1\.3 currently declares a 48-hour decision commitment/);
  assert.ok(
    !/issued under Sales Acceptance Policy v1\.3/.test(after),
    'the active policy is never presented as the issuer of an older commitment',
  );

  assert.match(
    sellerDecisionTimeliness([committed()], V11).population,
    /v1\.1 currently declares no decision commitment/,
  );
});

test('a commitment with no recorded basis is reported as unstated, never guessed', () => {
  const p = sellerDecisionTimeliness(
    [committed({ Acceptance_Basis__c: null })],
    V13,
  ).population;
  assert.match(p, /issued under Sales Acceptance Policy \(unstated\)/);
  assert.ok(!/issued under Sales Acceptance Policy v1\.3/.test(p));
});

test('the commitment basis is projected as proving evidence on a finding', () => {
  const r = sellerDecisionTimeliness([committed({ Acceptance_Status__c: 'Overdue' })], V12);
  assert.equal(r.evidence[0]['Commitment Basis'], V12_BASIS);
  const proving = r.evidenceColumns.filter((c) => c.proving).map((c) => c.key);
  assert.ok(
    proving.includes('Commitment Basis'),
    'it is what makes the deadline explainable, so it proves the finding',
  );
});

/* ------------------------------------------- 5. deliberately unscored */
test('the control is implemented, detective and deliberately unscored', () => {
  assert.ok(
    !CHECK_IDS.includes('seller-decision-timeliness' as never),
    'absent from CHECK_IDS and runAllChecks, so the validated assessment model is unchanged',
  );
  assert.equal(CHECK_IDS.length, 14, 'Assessment Model v4: fourteen scored controls');
  // No score is introduced anywhere in this control's own output surface.
  const r = sellerDecisionTimeliness([committed({ Acceptance_Status__c: 'Overdue' })], V12);
  assert.equal(typeof r.failing, 'number');
  assert.ok(!/\/100/.test(JSON.stringify(r.evidence)));
});

/* -------------------------------- 6. the Salesforce artifacts, structurally */
const FIELD = (n: string) =>
  readFileSync(`../force-app/main/default/objects/Lead/fields/${n}.field-meta.xml`, 'utf8');
const FLOW = () =>
  readFileSync('../force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml', 'utf8');

test('the decision-state formula declares the required precedence', () => {
  const raw = FIELD('Acceptance_Status__c');
  // The formula body only. The description legitimately discusses states the
  // formula must NOT produce, and matching prose would prove nothing.
  const f = raw.slice(raw.indexOf('<formula>'), raw.indexOf('</formula>'));
  const order = ['Not Applicable', 'Accepted', 'Rejected', 'Overdue', 'Pending'].map((s) =>
    f.indexOf(`"${s}"`),
  );
  assert.ok(order.every((i) => i > -1), 'all five states are declared');
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    'Not Applicable, then Accepted, then Rejected, then Overdue, then Pending',
  );
  assert.ok(!f.includes('Malformed'), 'malformed decisions are prevented, never persisted');
  assert.ok(
    !f.includes('$CustomMetadata'),
    'a formula cannot follow the active policy, so it must not try',
  );
});

test('the rejection vocabulary is restricted to the four governed values', () => {
  const f = FIELD('Sales_Rejection_Reason__c');
  assert.ok(f.includes('<restricted>true</restricted>'));
  for (const v of [
    'Not ICP',
    'Insufficient Evidence',
    'Wrong Territory or Ownership',
    'Timing — Not Sales Ready',
  ]) {
    assert.ok(f.includes(`<fullName>${v}</fullName>`), `${v} is declared`);
  }
  assert.ok(!f.includes('<fullName>Other</fullName>'), 'no escape hatch');
  assert.ok(!/Duplicate/.test(f), 'match conditions stay governed by Match_Status__c');
  assert.equal(
    (f.match(/<value>/g) ?? []).length,
    4,
    'exactly four values - the vocabulary does not grow quietly',
  );
});

test('the Flow issues the commitment from the active policy, not from a literal', () => {
  const x = FLOW();
  assert.ok(x.includes('<name>getDecisionPolicy</name>'), 'the active policy is read');
  assert.ok(
    x.includes('{!getDecisionPolicy.Acceptance_SLA_Hours__c} / 24'),
    'the duration comes from Custom Metadata',
  );
  assert.ok(!/\{!fxStartAdj\} \+ \(24 \/ 24\)/.test(x), 'no hard-coded 24 hours');
  // The response SLA is untouched and still uses its own per-segment hours.
  assert.ok(x.includes('{!fxStartAdj} + ({!varSLAHours} / 24)'), 'response SLA target intact');
  assert.ok(
    x.includes('<name>fxAcceptanceDue</name>') && x.includes('fxAcceptRawDow'),
    'the acceptance deadline gets its own weekend shift',
  );
});

test('the Flow refuses a second seller decision in both directions', () => {
  const x = FLOW();
  assert.ok(x.includes('<name>fxNoPriorDecision</name>'), 'rejection checks for a prior decision');
  assert.ok(x.includes('<name>fxSALNoRejection</name>'), 'acceptance checks for a rejection');
  assert.ok(
    x.includes('{!fxSALNoRejection}'),
    'and the acceptance test actually consumes it',
  );
  assert.ok(x.includes('<name>errRejectionNotPermitted</name>'), 'a refused rejection is blocked');
  assert.ok(
    x.includes('ISCHANGED({!$Record.Sales_Rejection_Reason__c})'),
    'the Flow runs for a rejection, which is not a Status change',
  );
});

test('a governed rejection changes neither ownership nor lifecycle stage', () => {
  const x = FLOW();
  const i = x.indexOf('<name>asgnRejectionEvidence</name>');
  assert.ok(i > -1);
  const block = x.slice(i, x.indexOf('</assignments>', i));
  assert.ok(block.includes('$Record.Sales_Rejected_At__c'));
  assert.ok(block.includes('$Record.Sales_Rejected_By__c'));
  assert.ok(block.includes('$Record.Sales_Rejection_Basis__c'));
  assert.ok(!block.includes('$Record.OwnerId'), 'the seller keeps the Lead');
  assert.ok(!block.includes('$Record.Status'), 'the Lead remains MQL');
});

test('the deadline and its provenance are written in the same assignment', () => {
  const x = FLOW();
  const i = x.indexOf('<name>asgnAcceptanceCommitment</name>');
  assert.ok(i > -1);
  const block = x.slice(i, x.indexOf('</assignments>', i));
  assert.ok(block.includes('$Record.Acceptance_Due_DateTime__c'), 'the deadline');
  assert.ok(block.includes('$Record.Acceptance_Basis__c'), 'and the policy that issued it');
  // A deadline can never exist without the evidence explaining it.
  assert.equal(
    (block.match(/<assignmentItems>/g) ?? []).length,
    2,
    'exactly the two halves of the commitment, nothing else',
  );
});

test('the commitment basis names the issuing policy, the target and the time basis', () => {
  const x = FLOW();
  const i = x.indexOf('<name>fxAcceptanceBasis</name>');
  assert.ok(i > -1, 'the basis formula exists');
  const f = x.slice(i, x.indexOf('</formulas>', i));
  assert.ok(
    f.includes('{!getDecisionPolicy.Policy_Version__c}'),
    'the issuing version comes from the policy that issued it, not a literal',
  );
  assert.ok(
    f.includes('{!getDecisionPolicy.Acceptance_SLA_Hours__c}') && f.includes('business hours'),
    'the governed target is stated',
  );
  assert.ok(f.includes('weekend-aware approximation'), 'the time basis is stated honestly');
  // Precision that was never achieved is never claimed.
  assert.ok(!/Business Hours/.test(f), 'no Salesforce Business Hours claim');
  assert.ok(!/[Hh]oliday/.test(f), 'no holiday-aware claim');
  // It describes the COMMITMENT, not an outcome that has not happened.
  assert.ok(!/Accepted under/.test(f) && !/Rejected under/.test(f));
});

test('the v1.2 policy record declares the 24-hour commitment the basis will state', () => {
  const p = readFileSync(
    '../force-app/main/default/customMetadata/Sales_Acceptance_Policy.NorthstarIQ_SAL_v1_2.md-meta.xml',
    'utf8',
  );
  assert.match(p, /<field>Policy_Version__c<\/field>\s*<value[^>]*>v1\.2</);
  assert.match(p, /<field>Acceptance_SLA_Hours__c<\/field>\s*<value[^>]*>24</);
  assert.match(p, /<field>Is_Active__c<\/field>\s*<value[^>]*>true</);
});

test('neither decision path overwrites the commitment basis', () => {
  const x = FLOW();
  for (const el of ['asgnSalesAcceptance', 'asgnRejectionEvidence']) {
    const i = x.indexOf('<name>' + el + '</name>');
    assert.ok(i > -1, el + ' exists');
    const block = x.slice(i, x.indexOf('</assignments>', i));
    assert.ok(
      !block.includes('$Record.Acceptance_Basis__c'),
      el + ' must not rewrite the commitment that was issued at MQL',
    );
    assert.ok(
      !block.includes('$Record.Acceptance_Due_DateTime__c'),
      el + ' must not move the deadline either',
    );
  }
});

test('the rejection basis carries the policy version, so it survives succession', () => {
  const x = FLOW();
  assert.ok(
    x.includes('"Rejected under Sales Acceptance Policy " &amp; {!getDecisionPolicy.Policy_Version__c}'),
    'the version guard reads the version back out of this string',
  );
});
