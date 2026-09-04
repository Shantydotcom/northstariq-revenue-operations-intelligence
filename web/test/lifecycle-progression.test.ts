/**
 * Lifecycle Progression Integrity - the second lifecycle detective control.
 *
 * Fixtures only. The live baseline can produce almost none of these states:
 * no Lead has ever been through the governed lifecycle, so failure detection
 * has to be proven here rather than by corrupting baseline data.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECK_IDS,
  lifecycleProgressionIntegrity,
  runAllChecks,
} from '../lib/checks/index.ts';
import {
  buildLifecycleGraph,
  canReach,
  LifecyclePolicyUnavailableError,
  mustPassThrough,
  transitionAllowed,
} from '../lib/checks/lifecycle-graph.ts';
import type { LeadStatusHistoryRecord, LifecycleTransitionRecord } from '../lib/soql.ts';
import { GOVERNANCE, NO_HISTORY, READINESS_SOURCES, lead, opportunity } from './fixtures.ts';

/** The deployed v1.0 policy: 10 active transitions. */
const POLICY_RECORDS: LifecycleTransitionRecord[] = (
  [
    ['Open - Not Contacted', 'Working - Contacted'],
    ['Working - Contacted', 'MQL'],
    ['MQL', 'SAL'],
    ['SAL', 'SQL'],
    ['SQL', 'Closed - Converted'],
    ['Open - Not Contacted', 'Closed - Not Converted'],
    ['Working - Contacted', 'Closed - Not Converted'],
    ['MQL', 'Closed - Not Converted'],
    ['SAL', 'Closed - Not Converted'],
    ['SQL', 'Closed - Not Converted'],
  ] as [string, string][]
).map(([From_Stage__c, To_Stage__c]) => ({
  From_Stage__c,
  To_Stage__c,
  Is_Active__c: true,
  Rule_Version__c: 'v1.0',
}));

const GRAPH = buildLifecycleGraph(POLICY_RECORDS);
const CREATED = '2026-08-20T09:00:00.000+0000';

const hist = (LeadId: string, OldValue: string, NewValue: string): LeadStatusHistoryRecord => ({
  LeadId,
  OldValue,
  NewValue,
  CreatedDate: '2026-08-21T10:00:00.000+0000',
});

const run = (leads: ReturnType<typeof lead>[], history: LeadStatusHistoryRecord[] = []) =>
  lifecycleProgressionIntegrity(leads, history, GRAPH);

/** A Lead the safeguard has demonstrably run on. */
const governed = (over = {}) =>
  lead({ CreatedDate: CREATED, Lifecycle_Stage_Entered__c: '2026-08-21T10:00:00.000+0000', ...over });

/* ------------------------------------------------------- the policy graph */
test('the graph is built from the policy records, not from code', () => {
  assert.ok(transitionAllowed(GRAPH, 'Working - Contacted', 'MQL'));
  assert.ok(!transitionAllowed(GRAPH, 'Working - Contacted', 'SQL'));
  assert.deepEqual([...GRAPH.entryStages], ['Open - Not Contacted']);
  assert.deepEqual(GRAPH.versions, ['v1.0']);
});

test('an empty policy knows nothing rather than permitting everything', () => {
  const empty = buildLifecycleGraph([
    { From_Stage__c: 'A', To_Stage__c: 'B', Is_Active__c: true, Rule_Version__c: 'v1' },
  ]);
  assert.ok(!transitionAllowed(empty, 'Working - Contacted', 'MQL'));
});

test('reachability and dominance come from the policy', () => {
  assert.ok(canReach(GRAPH, 'MQL', 'Closed - Converted'));
  assert.ok(!canReach(GRAPH, 'SQL', 'SAL'), 'the policy gives no route back from SQL to SAL');
  assert.ok(mustPassThrough(GRAPH, 'Closed - Converted', 'SQL'));
  assert.ok(mustPassThrough(GRAPH, 'Closed - Converted', 'MQL'));
  assert.ok(
    !mustPassThrough(GRAPH, 'Closed - Not Converted', 'MQL'),
    'the policy allows a direct exit from earlier stages, so MQL is not on every route',
  );
});

/* ------------------------------------------------------- 1-3. transitions */
test('a permitted transition on a governed record passes', () => {
  const l = governed({ Status: 'MQL', MQL_Basis__c: 'Qualified under MQL Policy v1.1: ...' });
  const r = run([l], [hist(l.Id, 'Working - Contacted', 'MQL')]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
});

test('a transition absent from the policy fails on a governed record', () => {
  const l = governed({ Status: 'SQL', MQL_Basis__c: 'x', Sales_Accepted_At__c: CREATED, SQL_Basis__c: 'y' });
  const r = run([l], [hist(l.Id, 'Working - Contacted', 'SQL')]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /Working - Contacted → SQL/);
});

test('a full permitted progression passes', () => {
  const l = governed({
    Status: 'Closed - Converted',
    MQL_Basis__c: 'x',
    Sales_Accepted_At__c: CREATED,
    SQL_Basis__c: 'y',
  });
  const r = run([l], [
    hist(l.Id, 'Open - Not Contacted', 'Working - Contacted'),
    hist(l.Id, 'Working - Contacted', 'MQL'),
    hist(l.Id, 'MQL', 'SAL'),
    hist(l.Id, 'SAL', 'SQL'),
    hist(l.Id, 'SQL', 'Closed - Converted'),
  ]);
  assert.equal(r.evaluated, 1);
  assert.equal(r.failing, 0);
});

/* ------------------------------------------------------- 4-5. chronology */
test('a coherent stage-entry timestamp passes', () => {
  const l = governed({ Status: 'Working - Contacted' });
  assert.equal(run([l]).failing, 0);
});

test('a stage entered before the Lead existed is a contradiction', () => {
  const l = governed({ Status: 'Working - Contacted', Lifecycle_Stage_Entered__c: '2026-08-19T09:00:00.000+0000' });
  const r = run([l]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /before the Lead itself was created/);
});

test('a same-day stage stamp a moment before creation is not a contradiction', () => {
  /*
   * The before-save Flow captures $Flow.CurrentDateTime before Salesforce
   * stamps CreatedDate at commit, so on the create path the stamp can land a
   * moment earlier and cross a second boundary. That is transaction timing,
   * not a stage that predates the record.
   */
  const l = governed({
    Status: 'Working - Contacted',
    CreatedDate: '2026-08-20T09:00:52.000+0000',
    Lifecycle_Stage_Entered__c: '2026-08-20T09:00:51.000+0000',
  });
  const r = run([l]);
  assert.equal(r.failing, 0);
});

test('acceptance recorded before the Lead existed is a contradiction', () => {
  const l = governed({
    Status: 'SAL',
    MQL_Basis__c: 'x',
    Sales_Accepted_At__c: '2026-08-19T09:00:00.000+0000',
  });
  const r = run([l]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /Sales accepted it before/);
});

/* ---------------------------------------------- 6. evidence ahead of stage */
test('evidence for a stage the Lead could not have reached is a contradiction', () => {
  // SQL evidence on a SAL Lead: the policy gives no route from SQL back to SAL.
  const l = governed({ Status: 'SAL', MQL_Basis__c: 'x', Sales_Accepted_At__c: CREATED, SQL_Basis__c: 'y' });
  const r = run([l]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /gives no route from/);
});

test('evidence that legitimately survives progression is not a contradiction', () => {
  // The same SQL evidence on a converted Lead is expected: SQL → Closed - Converted.
  const l = governed({
    Status: 'Closed - Converted',
    MQL_Basis__c: 'x',
    Sales_Accepted_At__c: CREATED,
    SQL_Basis__c: 'y',
  });
  assert.equal(run([l]).failing, 0);
});

/* ------------------------------------------- 7-8. prerequisite evidence */
test('a downstream stage with the full evidence chain passes', () => {
  const l = governed({ Status: 'SQL', MQL_Basis__c: 'x', Sales_Accepted_At__c: CREATED, SQL_Basis__c: 'y' });
  assert.equal(run([l]).failing, 0);
});

test('a governed record missing evidence every route requires is a contradiction', () => {
  const l = governed({ Status: 'SQL', MQL_Basis__c: 'x', Sales_Accepted_At__c: null, SQL_Basis__c: 'y' });
  const r = run([l]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /passes through SAL/);
});

test('the SAME missing evidence on a pre-governance record is unmeasurable, not a failure', () => {
  const l = lead({ Status: 'SQL', CreatedDate: CREATED, Lifecycle_Stage_Entered__c: null });
  const r = run([l]);
  assert.equal(r.failing, 0, 'the evidence fields did not exist when this record progressed');
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /before that evidence existed/);
});

/* ------------------------------------------------- 9. pre-policy history */
test('an unpermitted transition predating the safeguard is unmeasurable, not a failure', () => {
  const l = lead({ Status: 'Working - Contacted', CreatedDate: CREATED, Lifecycle_Stage_Entered__c: null });
  const r = run([l], [hist(l.Id, 'Closed - Not Converted', 'Working - Contacted')]);
  assert.equal(r.failing, 0, 'no effective date is invented; the record decides');
  assert.equal(r.unmeasurableCount, 1);
  assert.match(String(r.notEvaluatedRows[0].Reason), /predates governance/);
});

/* --------------------------------------------- 10-11. absent history */
test('no retained history is never on its own a failure', () => {
  const l = governed({ Status: 'Working - Contacted' });
  const r = run([l], []);
  assert.equal(r.failing, 0);
});

test('partial history is judged on what it shows, not on what is missing', () => {
  // Only the last hop is retained, and it is permitted. The earlier hops are
  // simply unknown, and unknown is not a violation.
  const l = governed({ Status: 'MQL', MQL_Basis__c: 'x' });
  const r = run([l], [hist(l.Id, 'Working - Contacted', 'MQL')]);
  assert.equal(r.failing, 0);
  assert.equal(r.evaluated, 1);
});

/* ------------------------------------------ 12. Date vs DateTime precision */
test('a same-day conversion is not ordered against a DateTime', () => {
  const l = governed({
    Status: 'Closed - Converted',
    MQL_Basis__c: 'x',
    Sales_Accepted_At__c: CREATED,
    SQL_Basis__c: 'y',
    IsConverted: true,
    ConvertedDate: '2026-08-20', // the same calendar day the Lead was created
  });
  assert.equal(run([l]).failing, 0, 'ConvertedDate has no time component to compare');
});

test('a conversion dated before the Lead existed is a contradiction', () => {
  const l = governed({
    Status: 'Closed - Converted',
    MQL_Basis__c: 'x',
    Sales_Accepted_At__c: CREATED,
    SQL_Basis__c: 'y',
    IsConverted: true,
    ConvertedDate: '2026-08-01',
  });
  const r = run([l]);
  assert.equal(r.failing, 1);
  assert.match(String(r.evidence[0].Result), /converted before the Lead/);
});

/* -------------------------------------------------- 13-14. precedence */
test('several contradictions on one Lead produce one failing record', () => {
  const l = governed({
    Status: 'SAL',
    Lifecycle_Stage_Entered__c: '2026-08-19T09:00:00.000+0000',
    MQL_Basis__c: 'x',
    Sales_Accepted_At__c: CREATED,
    SQL_Basis__c: 'y',
  });
  const r = run([l]);
  assert.equal(r.failing, 1);
  const result = String(r.evidence[0].Result);
  assert.match(result, /before the Lead itself was created/);
  assert.match(result, /gives no route from/);
});

test('a demonstrated contradiction outranks an unprovable one', () => {
  // Pre-governance (so its unpermitted transition is unprovable) but its
  // stage-entry timestamp is impossible - which is provable either way.
  const l = lead({
    Status: 'Working - Contacted',
    CreatedDate: CREATED,
    Lifecycle_Stage_Entered__c: '2026-08-19T09:00:00.000+0000',
  });
  const r = run([l], [hist(l.Id, 'Closed - Not Converted', 'Working - Contacted')]);
  assert.equal(r.failing, 1);
  assert.equal(r.unmeasurableCount, 0);
});

/* ------------------------------------------------- 15. empty population */
test('Leads that assert no progression are outside, not unmeasurable', () => {
  const r = run([lead({ Status: 'Open - Not Contacted', CreatedDate: CREATED })]);
  assert.equal(r.evaluated, 0);
  assert.equal(r.failing, 0);
  assert.equal(r.unmeasurableCount, 0);
  assert.equal(r.notEvaluatedCount, 1);
  assert.equal(r.score, null, 'absence of a population is neither failure nor health');
  assert.equal(
    r.scoreReason,
    'no-applicable-records',
    'nothing was in scope - a boundary working as intended, not an evidence gap',
  );
});

/* ------------------------------------------ 16-17. policy failure safety */
test('a missing transition policy fails loudly rather than passing everything', () => {
  assert.throws(() => buildLifecycleGraph([]), LifecyclePolicyUnavailableError);
  assert.throws(
    () => buildLifecycleGraph([{ From_Stage__c: 'A', To_Stage__c: 'B', Is_Active__c: false, Rule_Version__c: 'v1' }]),
    LifecyclePolicyUnavailableError,
  );
});

test('a malformed transition record is refused rather than skipped', () => {
  assert.throws(
    () =>
      buildLifecycleGraph([
        { From_Stage__c: 'Open - Not Contacted', To_Stage__c: null, Is_Active__c: true, Rule_Version__c: 'v1.0' },
      ]),
    LifecyclePolicyUnavailableError,
  );
});

test('a policy with no starting stage is refused', () => {
  assert.throws(
    () =>
      buildLifecycleGraph([
        { From_Stage__c: 'A', To_Stage__c: 'B', Is_Active__c: true, Rule_Version__c: 'v1' },
        { From_Stage__c: 'B', To_Stage__c: 'A', Is_Active__c: true, Rule_Version__c: 'v1' },
      ]),
    LifecyclePolicyUnavailableError,
  );
});

/* ------------------------------------ 18. the alternate disqualification exit */
test('the governed early exit is permitted from every open stage', () => {
  for (const from of ['Open - Not Contacted', 'Working - Contacted', 'MQL', 'SAL', 'SQL']) {
    assert.ok(
      transitionAllowed(GRAPH, from, 'Closed - Not Converted'),
      `${from} should have a governed disqualification exit`,
    );
  }
  const l = governed({ Status: 'Closed - Not Converted' });
  const r = run([l], [hist(l.Id, 'Working - Contacted', 'Closed - Not Converted')]);
  assert.equal(r.failing, 0, 'and taking it is not a progression conflict');
});

/* ---------------------------------------------- 19-20. assessment isolation */
test('the control is scored under Model v2 and is part of the assessment', () => {
  assert.ok(
    CHECK_IDS.includes('lifecycle-progression'),
    'CHECK_IDS is the API allow-list and the scored set - this control is in it',
  );
  assert.equal(CHECK_IDS.length, 12, 'Assessment Model v3: twelve scored controls');
  const results = runAllChecks(
    [lead()],
    [opportunity()],
    new Date('2026-08-27'),
    READINESS_SOURCES,
    GOVERNANCE,
    NO_HISTORY,
  );
  assert.equal(results.length, 12, 'Assessment Model v3 runs exactly twelve controls');
  const mine = results.find((r) => r.id === 'lifecycle-progression');
  assert.ok(mine, 'the control executes as part of the ordinary assessment');
  assert.equal(mine.category, 'Lifecycle Governance');
});

test('the independent score counts only records that were settled', () => {
  const pass = governed({ Status: 'Working - Contacted' });
  const fail = governed({ Status: 'Working - Contacted', Lifecycle_Stage_Entered__c: '2026-08-19T09:00:00.000+0000' });
  const unmeasurable = lead({ Status: 'SQL', CreatedDate: CREATED, Lifecycle_Stage_Entered__c: null });
  const outside = lead({ Status: 'Open - Not Contacted', CreatedDate: CREATED });

  const r = run([pass, fail, unmeasurable, outside]);
  assert.equal(r.evaluated, 2, 'unmeasurable and outside records are not evaluated');
  assert.equal(r.failing, 1);
  assert.equal(r.unmeasurableCount, 1);
  assert.equal(r.notEvaluatedCount, 2);
  assert.equal(r.score, 50, 'the score divides failing by settled, not by the org');
  assert.equal(r.orgPopulation, 4);
});
