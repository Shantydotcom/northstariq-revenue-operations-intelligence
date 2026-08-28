/**
 * MQL Qualification Integrity - the first lifecycle detective control.
 *
 * Fixtures only: no network, no Salesforce, no clock dependence. Every scenario
 * here exists because the live baseline cannot produce it - the 49 synthetic
 * Leads predate the qualification foundation entirely, so failure detection has
 * to be proven against fixtures rather than by corrupting baseline data.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mqlQualificationIntegrity, runAllChecks, CHECK_IDS } from '../lib/checks/index.ts';
import {
  MqlPolicyUnavailableError,
  recordedPolicyVersion,
  resolveMqlPolicy,
  type MqlPolicy,
} from '../lib/checks/mql-policy.ts';
import type { MqlPolicyRecord } from '../lib/soql.ts';
import { GOVERNANCE, GOVERNED, NO_HISTORY, READINESS_SOURCES, lead, opportunity } from './fixtures.ts';

const ELIGIBLE = ['Strategic', 'Enterprise', 'Mid-Market'];
const BASIS_V11 =
  'Qualified under MQL Policy v1.1: governed source NorthstarIQ Inbound; Mid-Market segment eligible; territory NA-West resolved; account match Matched';

/** The active policy as Salesforce currently declares it: all four required. */
const POLICY: MqlPolicy = {
  version: 'v1.1',
  qualifiedStage: 'MQL',
  requireGovernedSource: true,
  requireEligibleSegment: true,
  requireRoutableTerritory: true,
  requireUnambiguousMatch: true,
};

/** A Lead sitting on the governed stage with governed evidence behind it. */
const qualified = (over = {}) =>
  lead({
    Status: 'MQL',
    LeadSource: GOVERNED,
    Segment__c: 'Mid-Market',
    Territory__c: 'NA-West',
    Match_Status__c: 'Matched',
    MQL_Basis__c: BASIS_V11,
    ...over,
  });

const run = (leads: ReturnType<typeof lead>[], policy: MqlPolicy = POLICY) =>
  mqlQualificationIntegrity(leads, policy, READINESS_SOURCES, ELIGIBLE);

/* ------------------------------------------------------------ 1. compliant */
test('a Lead satisfying every active requirement passes', () => {
  const r = run([qualified()]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
  assert.equal(r.score, 100);
  assert.ok(r.healthy);
});

/* ------------------------------------------------- 2. governed source fails */
test('an ungoverned acquisition source is a demonstrated failure', () => {
  const r = run([qualified({ LeadSource: 'Purchased List' })]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /acquisition source/);
});

/* ----------------------------------------------------- 3. ineligible segment */
test('a segment the business does not qualify is a demonstrated failure', () => {
  const r = run([qualified({ Segment__c: 'SMB' })]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /segment is not one the business qualifies/);
});

/* ------------------------------------------------------ 4. missing territory */
test('an unresolved territory is a demonstrated failure', () => {
  const r = run([qualified({ Territory__c: null })]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /territory/);
});

/* -------------------------------------------------------- 5. ambiguous match */
test('an ambiguous account match is a demonstrated failure', () => {
  const r = run([qualified({ Match_Status__c: 'Review' })]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /ambiguous/);
});

/* ------------------------------------------------------------ 6. blank match */
test('a match that was never evaluated is insufficient evidence, not a pass and not a failure', () => {
  const r = run([qualified({ Match_Status__c: null })]);
  assert.equal(r.failing, 0, 'blank is not a demonstrated violation');
  assert.equal(r.evaluated, 0, 'and it is not silently counted as a pass');
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /never evaluated/);
});

test('a demonstrated violation outranks an unprovable one on the same record', () => {
  // Blank match (unprovable) AND an ineligible segment (proven). Proven wins:
  // otherwise a real defect could hide behind a blank field.
  const r = run([qualified({ Match_Status__c: null, Segment__c: 'SMB' })]);
  assert.equal(r.failing, 1);
  assert.equal(r.unmeasurableCount, 0);
});

/* ------------------------------------------------ 7. disabled requirement */
test('a requirement the policy does not switch on is not tested', () => {
  const relaxed: MqlPolicy = { ...POLICY, requireEligibleSegment: false };
  const smb = qualified({ Segment__c: 'SMB' });
  assert.equal(run([smb]).failing, 1, 'fails while the requirement is on');
  assert.equal(run([smb], relaxed).failing, 0, 'and passes once Salesforce switches it off');
});

test('turning off the match requirement removes the blank-match exclusion', () => {
  const relaxed: MqlPolicy = { ...POLICY, requireUnambiguousMatch: false };
  const r = run([qualified({ Match_Status__c: null })], relaxed);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
});

/* ------------------------------------------------ 8. simultaneous failures */
test('several violations on one record are reported together, once', () => {
  const r = run([qualified({ LeadSource: 'Purchased List', Segment__c: 'SMB', Territory__c: null })]);
  assert.equal(r.failing, 1, 'one record, not one finding per criterion');
  const result = String(r.evidence[0].Result);
  assert.match(result, /acquisition source/);
  assert.match(result, /segment/);
  assert.match(result, /territory/);
});

/* -------------------------------------------------- 9. no evaluable records */
test('an org with no Marketing-qualified claims evaluates nothing and is not scored', () => {
  const r = run([lead(), lead({ Status: 'Working - Contacted' })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.failing, 0);
  assert.equal(r.score, null, 'absence of a population is neither failure nor health');
  assert.equal(r.unmeasurableCount, 0, 'and they are outside the control, not unmeasurable');
  assert.equal(r.scoreReason, 'no-applicable-records');
  assert.equal(r.notEvaluatedCount, 2);
});

test('claims that exist but cannot be judged are unscored for a DIFFERENT reason', () => {
  /**
   * The live baseline exactly: Leads whose status claims MQL, carrying no
   * qualification evidence because the field postdates them. The control
   * applies and cannot judge - a coverage gap, not an empty boundary, and the
   * two must not be told apart only by reading the record list.
   */
  const r = run([lead({ Status: 'SAL', MQL_Basis__c: null })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.equal(r.score, null);
  assert.equal(r.scoreReason, 'insufficient-evidence');
});

/* ------------------------------------------- 10. governance unavailable */
test('a missing active policy fails loudly rather than passing everything', () => {
  assert.throws(() => resolveMqlPolicy([]), MqlPolicyUnavailableError);
});

test('two active policies are refused rather than silently resolved', () => {
  const rec = (v: string): MqlPolicyRecord => ({
    Policy_Version__c: v,
    Qualified_Stage__c: 'MQL',
    Require_Governed_Source__c: true,
    Require_MQL_Eligible_Segment__c: true,
    Require_Routable_Territory__c: true,
    Require_Unambiguous_Match__c: true,
  });
  assert.throws(() => resolveMqlPolicy([rec('v1.0'), rec('v1.1')]), MqlPolicyUnavailableError);
});

test('a policy that names no governed stage is refused', () => {
  assert.throws(
    () =>
      resolveMqlPolicy([
        {
          Policy_Version__c: 'v1.1',
          Qualified_Stage__c: null,
          Require_Governed_Source__c: true,
          Require_MQL_Eligible_Segment__c: true,
          Require_Routable_Territory__c: true,
          Require_Unambiguous_Match__c: true,
        },
      ]),
    MqlPolicyUnavailableError,
  );
});

test('a valid policy record resolves to exactly what Salesforce declared', () => {
  const p = resolveMqlPolicy([
    {
      Policy_Version__c: 'v1.1',
      Qualified_Stage__c: 'MQL',
      Require_Governed_Source__c: true,
      Require_MQL_Eligible_Segment__c: false,
      Require_Routable_Territory__c: true,
      Require_Unambiguous_Match__c: false,
    },
  ]);
  assert.deepEqual(p, {
    version: 'v1.1',
    qualifiedStage: 'MQL',
    requireGovernedSource: true,
    requireEligibleSegment: false,
    requireRoutableTerritory: true,
    requireUnambiguousMatch: false,
  });
});

/* ------------------------------- 11. evidence present, underlying facts fail */
test('recorded qualification evidence does not by itself earn a pass', () => {
  // The basis says it qualified. The governed facts say the segment is not
  // eligible. The control judges the facts, not the record of the decision.
  const r = run([qualified({ Segment__c: 'SMB' })]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0]['MQL Basis']), /MQL Policy v1\.1/);
});

/* ---------------------------------------- 12. records beyond the stage */
test('a Lead that progressed past the stage is in the population but not re-judged', () => {
  const r = run([qualified({ Status: 'SAL', Segment__c: 'SMB' })]);
  assert.equal(r.failing, 0, 'a segment may legitimately have changed after qualification');
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /has since moved to/);
});

test('a claim with no recorded evidence is unmeasurable, never a violation', () => {
  // Exactly the baseline reality: a lifecycle claim that predates the
  // evidence field. Reporting it as a policy breach would be a fabrication.
  const r = run([lead({ Status: 'SAL', MQL_Basis__c: null })]);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /predates the evidence foundation/);
});

/* ------------------------------------------------ 13. policy version drift */
test('a Lead qualified under a superseded policy is not judged against the current one', () => {
  const old = qualified({
    Segment__c: 'SMB',
    MQL_Basis__c: 'Qualified under MQL Policy v1.0: governed source Web; SMB segment eligible',
  });
  const r = run([old]);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /v1\.0/);
});

test('the recorded policy version is read from the basis, or reported as unknown', () => {
  assert.equal(recordedPolicyVersion(BASIS_V11), 'v1.1');
  assert.equal(recordedPolicyVersion('no version here'), null);
  assert.equal(recordedPolicyVersion(null), null);
});

/* ------------------------------------------------------ assessment isolation */
test('the control is scored under Model v2 and is part of the assessment', () => {
  assert.ok(
    CHECK_IDS.includes('mql-integrity'),
    'CHECK_IDS is the API allow-list and the scored set - this control is in it',
  );
  assert.equal(CHECK_IDS.length, 11, 'Assessment Model v2: eleven scored controls');
  const results = runAllChecks(
    [lead()],
    [opportunity()],
    new Date('2026-08-27'),
    READINESS_SOURCES,
    GOVERNANCE,
    NO_HISTORY,
  );
  assert.equal(results.length, 11, 'Assessment Model v2 runs exactly eleven controls');
  const mine = results.find((r) => r.id === 'mql-integrity');
  assert.ok(mine, 'the control executes as part of the ordinary assessment');
  assert.equal(mine.category, 'Lifecycle Governance');
});

test('the control still computes its own score for inspection', () => {
  const r = run([qualified(), qualified({ Segment__c: 'SMB' })]);
  assert.equal(r.evaluated, 2);
  assert.equal(r.failing, 1);
  assert.equal(r.score, 50, 'conventional control score, fed to nothing');
});
