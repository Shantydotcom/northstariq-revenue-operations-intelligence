/**
 * Sales Acceptance / SQL Integrity - the third lifecycle detective control.
 *
 * Fixtures only: no network, no Salesforce, no clock dependence. Every scenario
 * here exists because the live baseline cannot produce it - zero of the 49
 * synthetic Leads have ever been at SAL or SQL, and none carries any acceptance
 * or qualification evidence, so failure detection has to be proven against
 * fixtures rather than by corrupting baseline data.
 *
 * The clock matters more here than in the other two controls. The preventive
 * gate required the next-step date to be today or later AT QUALIFICATION, so
 * these fixtures deliberately use next-step dates that are already historical
 * relative to any plausible run date: a test that only passes while its dates
 * are in the future would be a test that rots.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  salesAcceptanceSqlIntegrity,
  runAllChecks,
  CHECK_IDS,
} from '../lib/checks/index.ts';
import {
  recordedNextStepDate,
  recordedQualifiedNeed,
  recordedSqlVersion,
  recordedAcceptanceVersion,
  resolveSalesAcceptancePolicy,
  resolveSqlQualificationPolicy,
  SalesPolicyUnavailableError,
  type SalesAcceptancePolicy,
  type SqlQualificationPolicy,
} from '../lib/checks/sales-qualification-policy.ts';
import type {
  LeadRecord,
  LeadStatusHistoryRecord,
  SalesAcceptancePolicyRecord,
  SqlPolicyRecord,
} from '../lib/soql.ts';
import { lead, opportunity, READINESS_SOURCES } from './fixtures.ts';

/** The two active policies as Salesforce currently declares them. */
const ACCEPTANCE: SalesAcceptancePolicy = {
  version: 'v1.0',
  acceptedStage: 'SAL',
  requireExplicitAcceptance: true,
  requireMqlEvidence: true,
};

const SQL: SqlQualificationPolicy = {
  version: 'v1.0',
  qualifiedStage: 'SQL',
  requireAcceptanceEvidence: true,
  requireConfirmedNeed: true,
  requireNextStep: true,
};

const MQL_BASIS =
  'Qualified under MQL Policy v1.1: governed source NorthstarIQ Inbound; Mid-Market segment eligible; territory NA-West resolved; account match Matched';
const SAL_BASIS =
  'Accepted under Sales Acceptance Policy v1.0: explicit seller acceptance recorded; Marketing handoff substantiated by MQL evidence';
/**
 * Next step 2026-06-20, agreed at qualification on 2026-06-10 - valid then.
 *
 * Deliberately dated so the whole chain is already historical and stays that
 * way. A fixture whose next step is still in the future would pass this
 * control's temporal test for the wrong reason.
 */
const SQL_BASIS =
  'Qualified under SQL Policy v1.0: need Forecast Accuracy; next step 2026-06-20; substantiated Sales acceptance';

const CREATED_AT = '2026-06-01T09:00:00.000+0000';
const ACCEPTED_AT = '2026-06-05T14:00:00.000+0000';
/** Synthetic User Id, in the same shape as the Account/Contact fixture ids. */
const ACCEPTED_BY = '005000000000001';
const QUALIFIED_AT = '2026-06-10T10:00:00.000+0000';

/** A Lead standing on SAL with a complete, governed acceptance chain. */
const accepted = (over: Partial<LeadRecord> = {}) =>
  lead({
    Status: 'SAL',
    CreatedDate: CREATED_AT,
    MQL_Basis__c: MQL_BASIS,
    Lifecycle_Stage_Entered__c: ACCEPTED_AT,
    Sales_Accepted__c: true,
    Sales_Accepted_At__c: ACCEPTED_AT,
    Sales_Accepted_By__c: ACCEPTED_BY,
    Sales_Acceptance_Basis__c: SAL_BASIS,
    ...over,
  });

/** A Lead standing on SQL with a complete, governed acceptance AND SQL chain. */
const qualified = (over: Partial<LeadRecord> = {}) =>
  accepted({
    Status: 'SQL',
    Lifecycle_Stage_Entered__c: QUALIFIED_AT,
    SQL_Basis__c: SQL_BASIS,
    Qualified_Need__c: 'Forecast Accuracy',
    Next_Step_Date__c: '2026-06-20',
    ...over,
  });

const run = (
  leads: LeadRecord[],
  opts: {
    acceptance?: SalesAcceptancePolicy;
    sql?: SqlQualificationPolicy;
    history?: LeadStatusHistoryRecord[];
  } = {},
) =>
  salesAcceptanceSqlIntegrity(
    leads,
    opts.acceptance ?? ACCEPTANCE,
    opts.sql ?? SQL,
    opts.history ?? [],
  );

/* ------------------------------------------------- 1. valid governed SAL */
test('a Lead with a complete governed acceptance chain passes', () => {
  const r = run([accepted()]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
  assert.equal(r.score, 100);
  assert.ok(r.healthy);
});

/* ------------------------------------------- 2. SAL missing MQL evidence */
test('acceptance recorded without the Marketing evidence it accepted is a failure', () => {
  const r = run([accepted({ MQL_Basis__c: null })]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /Marketing handoff it accepted carries no qualification evidence/);
});

/* --------------------------------------------- 3. SAL missing the actor */
test('acceptance recorded with no accepting identity is a failure', () => {
  const r = run([accepted({ Sales_Accepted_By__c: null })]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /authenticated identity/);
});

/* ---------------------------------------------- 4. SAL missing the basis */
test('acceptance recorded with no basis is a failure', () => {
  const r = run([accepted({ Sales_Acceptance_Basis__c: null })]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /no basis stating why it was permitted/);
});

/* ------------------------------------- 5. the seller checkbox is not evidence */
test('the acceptance checkbox alone does not substantiate acceptance', () => {
  // Status says SAL and the seller ticked the box. No automation-written
  // evidence exists, so nothing establishes when, by whom, or under which
  // policy - and a ticked box is editable afterwards.
  const r = run([
    lead({ Status: 'SAL', Sales_Accepted__c: true, MQL_Basis__c: MQL_BASIS }),
  ]);
  assert.equal(r.failing, 0, 'absence of evidence is not a demonstrated violation');
  assert.equal(r.evaluated, 0, 'and a ticked checkbox is not silently counted as a pass');
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /only the seller checkbox/);
});

/* --------------------------------------- 6. first touch is not acceptance */
test('a first-touch timestamp is never read as Sales acceptance', () => {
  const worked = lead({
    Status: 'SAL',
    CreatedDate: CREATED_AT,
    MQL_Basis__c: MQL_BASIS,
    First_Touch_DateTime__c: '2026-08-24T09:30:00.000+0000',
  });
  const r = run([worked]);
  assert.equal(r.evaluated, 0, 'a seller acting on a Lead is activity, not acceptance');
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /carries none of the acceptance evidence/);
});

/* ------------------------------------------------- 7. valid governed SQL */
test('a Lead with a complete governed acceptance and qualification chain passes', () => {
  const r = run([qualified()]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
  assert.equal(r.score, 100);
});

/* ------------------------------------- 8. SQL missing acceptance evidence */
test('sales qualification recorded with no acceptance evidence is a failure', () => {
  const r = run([
    qualified({ Sales_Accepted_At__c: null, Sales_Accepted_By__c: null, Sales_Acceptance_Basis__c: null }),
  ]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /no evidence that Sales ever accepted it/);
});

/* --------------------------------------------- 9. SQL missing governed need */
test('qualification evidence recording no business need is a failure', () => {
  const r = run([
    qualified({
      SQL_Basis__c: 'Qualified under SQL Policy v1.0: next step 2026-06-20; substantiated Sales acceptance',
    }),
  ]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /no business need confirmed with the prospect/);
});

/* --------------------------------------- 10. SQL missing next-step evidence */
test('qualification evidence recording no agreed next step is a failure', () => {
  const r = run([
    qualified({
      SQL_Basis__c: 'Qualified under SQL Policy v1.0: need Forecast Accuracy; substantiated Sales acceptance',
    }),
  ]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /no agreed next step/);
});

/* ------------------------- 11. a next step becoming historical is not a defect */
test('a next-step date that was valid at qualification does not fail for being in the past', () => {
  /*
   * THE CENTRAL HISTORICAL TEST. Qualified 2026-06-10 with a next step of
   * 2026-06-20 - valid then, and unavoidably in the past by the time anyone
   * reads this. Judging it against TODAY would report the passage of time as a
   * governance defect on a correctly qualified Lead.
   */
  const r = run([qualified()]);
  assert.equal(r.failing, 0);
  assert.equal(r.evaluated, 1);
  // Prove the fixture really is historical, so the test cannot pass by accident.
  assert.ok(new Date('2026-06-20') < new Date(), 'the fixture next-step date must be in the past');
});

/* -------------------------- 12. a next step before the qualification event */
test('a next step already in the past when the Lead was qualified is a failure', () => {
  const r = run([
    qualified({
      SQL_Basis__c:
        'Qualified under SQL Policy v1.0: need Forecast Accuracy; next step 2026-05-01; substantiated Sales acceptance',
    }),
  ]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /2026-05-01, was already in the past when it was qualified on 2026-06-10/);
});

/* ------------------- 13. the qualification event date cannot be established */
test('an unestablishable qualification date makes the next step unmeasurable, not a failure', () => {
  // Progressed past SQL, so the stage stamp no longer describes that
  // transition, and Salesforce retains no Status history for it.
  const r = run([qualified({ Status: 'Closed - Converted', Lifecycle_Stage_Entered__c: '2026-06-30T08:00:00.000+0000' })]);
  assert.equal(r.failing, 0);
  assert.equal(r.evaluated, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /nothing Salesforce retains establishes when it was qualified/);
});

test('a retained transition into the qualified stage re-establishes the date', () => {
  const l = qualified({
    Status: 'Closed - Converted',
    Lifecycle_Stage_Entered__c: '2026-06-30T08:00:00.000+0000',
  });
  const history: LeadStatusHistoryRecord[] = [
    { LeadId: l.Id, OldValue: 'SAL', NewValue: 'SQL', CreatedDate: QUALIFIED_AT },
  ];
  const r = run([l], { history });
  assert.equal(r.evaluated, 1, 'the recorded next step can now be judged against the event');
  assert.equal(r.failing, 0);
});

/* --------------------------------- 14. evidence survives conversion */
test('a converted Lead is still evaluated on the evidence it carries', () => {
  const l = qualified({
    Status: 'Closed - Converted',
    IsConverted: true,
    ConvertedDate: '2026-06-28',
    ConvertedAccountId: '00100000000AAAA',
    Lifecycle_Stage_Entered__c: '2026-06-28T09:00:00.000+0000',
    // Acceptance evidence deliberately broken, so the record's verdict comes
    // from this control and not from its conversion state.
    Sales_Accepted_By__c: null,
  });
  const history: LeadStatusHistoryRecord[] = [
    { LeadId: l.Id, OldValue: 'SAL', NewValue: 'SQL', CreatedDate: QUALIFIED_AT },
  ];
  const r = run([l], { history });
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /authenticated identity/);
  assert.ok(
    !String(r.evidence[0].Result).includes('convert'),
    'the conversion contradiction belongs to Opportunity Conversion Integrity, not here',
  );
});

/* ------------------------------- 15. claims predating the architecture */
test('a SAL claim with no acceptance evidence is unmeasurable, never a violation', () => {
  const r = run([lead({ Status: 'SAL' })]);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /carries none of the acceptance evidence/);
});

test('a SQL claim with no qualification evidence is unmeasurable, never a violation', () => {
  // Exactly the baseline reality: the three Closed - Converted Leads claim the
  // whole chain by status and carry none of it, because none of it existed.
  const r = run([lead({ Status: 'Closed - Converted' })]);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  const reason = String(r.notEvaluatedRows[0].Reason);
  assert.match(reason, /carries none of the acceptance evidence/);
  assert.match(reason, /predates the qualification architecture/);
});

/* ------------------------------------------- 16. policy switches a requirement off */
test('a requirement the acceptance policy does not switch on is not tested', () => {
  const noMql = accepted({ MQL_Basis__c: null });
  assert.equal(run([noMql]).failing, 1, 'fails while the requirement is on');
  assert.equal(
    run([noMql], { acceptance: { ...ACCEPTANCE, requireMqlEvidence: false } }).failing,
    0,
    'and passes once Salesforce switches it off',
  );
});

test('a requirement the SQL policy does not switch on is not tested', () => {
  const noNeed = qualified({
    SQL_Basis__c: 'Qualified under SQL Policy v1.0: next step 2026-06-20; substantiated Sales acceptance',
  });
  assert.equal(run([noNeed]).failing, 1, 'fails while the requirement is on');
  assert.equal(
    run([noNeed], { sql: { ...SQL, requireConfirmedNeed: false } }).failing,
    0,
    'and passes once Salesforce switches it off',
  );
});

test('switching off the next-step requirement removes the temporal exclusion', () => {
  const progressed = qualified({
    Status: 'Closed - Converted',
    Lifecycle_Stage_Entered__c: '2026-06-30T08:00:00.000+0000',
  });
  assert.equal(run([progressed]).unmeasurableCount, 1);
  const r = run([progressed], { sql: { ...SQL, requireNextStep: false } });
  assert.equal(r.evaluated, 1);
  assert.equal(r.unmeasurableCount, 0);
});

/* --------------------------------------- 17. simultaneous contradictions */
test('conflicts across both stages are reported together, on one record', () => {
  const r = run([
    qualified({
      Sales_Accepted_By__c: null,
      MQL_Basis__c: null,
      SQL_Basis__c: 'Qualified under SQL Policy v1.0: next step 2026-06-20; substantiated Sales acceptance',
    }),
  ]);
  assert.equal(r.failing, 1, 'one record, not one finding per criterion');
  const result = String(r.evidence[0].Result);
  assert.match(result, /authenticated identity/);
  assert.match(result, /Marketing handoff/);
  assert.match(result, /no business need/);
});

/* -------------------------- 18. a contradiction outranks an unprovable one */
test('a demonstrated conflict outranks an unprovable condition on the same record', () => {
  /*
   * The SQL claim is unprovable - the qualification date cannot be established
   * - while the acceptance chain is demonstrably broken. The proven conflict
   * has to win, or a real defect could hide behind the unreadable half.
   */
  const r = run([
    qualified({
      Status: 'Closed - Converted',
      Lifecycle_Stage_Entered__c: '2026-06-30T08:00:00.000+0000',
      Sales_Acceptance_Basis__c: null,
    }),
  ]);
  assert.equal(r.failing, 1);
  assert.equal(r.unmeasurableCount, 0);
});

/* ---------------------------------------- 19. policy version drift */
test('a Lead accepted under a superseded acceptance policy is not judged against the current one', () => {
  const r = run([
    accepted({
      Sales_Accepted_By__c: null,
      Sales_Acceptance_Basis__c:
        'Accepted under Sales Acceptance Policy v0.9: explicit seller acceptance recorded',
    }),
  ]);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /v0\.9/);
});

test('a Lead qualified under a superseded SQL policy is not judged against the current one', () => {
  const r = run([
    qualified({
      SQL_Basis__c: 'Qualified under SQL Policy v0.9: substantiated Sales acceptance',
    }),
  ]);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /SQL Policy v0\.9/);
});

/* ------------------------------------- 20. governance unavailable */
const salRecord = (v: string): SalesAcceptancePolicyRecord => ({
  Policy_Version__c: v,
  Accepted_Stage__c: 'SAL',
  Require_Explicit_Acceptance__c: true,
  Require_MQL_Evidence__c: true,
});

const sqlRecord = (v: string): SqlPolicyRecord => ({
  Policy_Version__c: v,
  Qualified_Stage__c: 'SQL',
  Require_Acceptance_Evidence__c: true,
  Require_Confirmed_Need__c: true,
  Require_Next_Step__c: true,
});

test('a missing acceptance policy fails loudly rather than passing everything', () => {
  assert.throws(() => resolveSalesAcceptancePolicy([]), SalesPolicyUnavailableError);
});

test('two active acceptance policies are refused rather than silently resolved', () => {
  assert.throws(
    () => resolveSalesAcceptancePolicy([salRecord('v1.0'), salRecord('v1.1')]),
    SalesPolicyUnavailableError,
  );
});

test('a missing SQL policy fails loudly rather than passing everything', () => {
  assert.throws(() => resolveSqlQualificationPolicy([]), SalesPolicyUnavailableError);
});

test('two active SQL policies are refused rather than silently resolved', () => {
  assert.throws(
    () => resolveSqlQualificationPolicy([sqlRecord('v1.0'), sqlRecord('v1.1')]),
    SalesPolicyUnavailableError,
  );
});

test('a policy that names no governed stage is refused', () => {
  assert.throws(
    () => resolveSalesAcceptancePolicy([{ ...salRecord('v1.0'), Accepted_Stage__c: null }]),
    SalesPolicyUnavailableError,
  );
  assert.throws(
    () => resolveSqlQualificationPolicy([{ ...sqlRecord('v1.0'), Qualified_Stage__c: '  ' }]),
    SalesPolicyUnavailableError,
  );
});

test('valid policy records resolve to exactly what Salesforce declared', () => {
  assert.deepEqual(
    resolveSalesAcceptancePolicy([{ ...salRecord('v1.0'), Require_MQL_Evidence__c: false }]),
    {
      version: 'v1.0',
      acceptedStage: 'SAL',
      requireExplicitAcceptance: true,
      requireMqlEvidence: false,
    },
  );
  assert.deepEqual(
    resolveSqlQualificationPolicy([{ ...sqlRecord('v1.0'), Require_Next_Step__c: false }]),
    {
      version: 'v1.0',
      qualifiedStage: 'SQL',
      requireAcceptanceEvidence: true,
      requireConfirmedNeed: true,
      requireNextStep: false,
    },
  );
});

/* ----------------------------------------------- 21. reading the evidence back */
test('the recorded evidence is read back from the basis, or reported as unknown', () => {
  assert.equal(recordedAcceptanceVersion(SAL_BASIS), 'v1.0');
  assert.equal(recordedSqlVersion(SQL_BASIS), 'v1.0');
  assert.equal(recordedQualifiedNeed(SQL_BASIS), 'Forecast Accuracy');
  assert.equal(recordedNextStepDate(SQL_BASIS), '2026-06-20');
  assert.equal(recordedNextStepDate('Qualified under SQL Policy v1.0: need Pipeline Visibility'), null);
  assert.equal(recordedQualifiedNeed(null), null);
  assert.equal(recordedSqlVersion('nothing here'), null);
});

test('the recorded need is judged, not the seller picklist that may have moved on', () => {
  // The need recorded at qualification stands. The current value differing is
  // not evidence the qualification was wrong.
  const r = run([qualified({ Qualified_Need__c: 'Pipeline Visibility' })]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
});

/* ------------------------------------------------- 22. empty population */
test('an org with no Sales handoff claims evaluates nothing and scores 100', () => {
  const r = run([lead(), lead({ Status: 'Working - Contacted' })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.failing, 0);
  assert.equal(r.score, 100, 'absence of a population is not failure');
  assert.equal(r.unmeasurableCount, 0, 'and they are outside the control, not unmeasurable');
  assert.equal(r.notEvaluatedCount, 2);
});

test('every Lead is accounted for: evaluated plus not evaluated equals the population', () => {
  const leads = [lead(), accepted(), qualified(), lead({ Status: 'Closed - Converted' })];
  const r = run(leads);
  assert.equal(r.orgPopulation, leads.length);
  assert.equal(r.evaluated + r.notEvaluatedCount, leads.length);
});

/* ------------------------------------------------------ assessment isolation */
test('the control is implemented but stays out of the scored assessment', () => {
  assert.ok(
    !CHECK_IDS.includes('sales-acceptance-sql'),
    'CHECK_IDS is the API allow-list and the scored set - this control is not in it',
  );
  assert.equal(CHECK_IDS.length, 7, 'Assessment Model v1 still allows exactly seven controls');
  const results = runAllChecks([qualified()], [opportunity()], new Date('2026-08-27'), READINESS_SOURCES);
  assert.equal(results.length, 7, 'Assessment Model v1 still runs exactly seven controls');
  assert.ok(!results.some((r) => r.id === 'sales-acceptance-sql'));
  assert.ok(!results.some((r) => r.category === 'Lifecycle Governance'));
});

test('the control still computes its own score for inspection', () => {
  const r = run([qualified(), qualified({ Sales_Accepted_By__c: null })]);
  assert.equal(r.evaluated, 2);
  assert.equal(r.failing, 1);
  assert.equal(r.score, 50, 'conventional control score, fed to nothing');
});

test('unmeasurable records change neither the numerator nor the denominator', () => {
  const clean = run([qualified()]);
  const withUnmeasurable = run([qualified(), lead({ Status: 'SAL' }), lead({ Status: 'SQL' })]);
  assert.equal(withUnmeasurable.evaluated, clean.evaluated);
  assert.equal(withUnmeasurable.failing, clean.failing);
  assert.equal(withUnmeasurable.score, clean.score);
  assert.equal(withUnmeasurable.unmeasurableCount, 2);
});
