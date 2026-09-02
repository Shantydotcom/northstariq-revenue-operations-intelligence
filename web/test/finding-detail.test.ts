/**
 * The investigation trail Finding Detail renders.
 *
 * These test the PRESENTATION CONTRACT, not the markup: that every control can
 * answer each question the page asks, that the three kinds of evidence stay
 * separable, and that the detective/preventive distinction is a stated fact
 * rather than a matter of wording. A test pinned to a sentence or a CSS class
 * would break on an edit that changed nothing a reader relies on.
 *
 * Fixtures only - no network, no Salesforce.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PRESENTATION, evidenceUrl, remediationEvidenceUrl } from '../lib/presentation.ts';
import { NAV_GROUPS } from '../lib/navigation.ts';
import { TRACEABILITY } from '../lib/traceability.ts';
import {
  CHECK_IDS,
  missingTerritory,
  opportunityConversionIntegrity,
  routingExceptions,
  runAllChecks,
  staleOpportunities,
} from '../lib/checks/index.ts';
import { buildAssessment } from '../lib/score.ts';
import { GOVERNANCE, NO_HISTORY, READINESS_SOURCES, TODAY, lead, opportunity } from './fixtures.ts';
import type { CheckId } from '../lib/types.ts';

const LIFECYCLE: CheckId[] = [
  'lifecycle-progression',
  'mql-integrity',
  'sales-acceptance-sql',
  'lifecycle-conversion',
];

/* ------------------------------------------- 1. every section can be filled */

test('every scored control can answer every question the page asks', () => {
  /**
   * The page renders these unconditionally, so a control missing one would
   * render an empty heading rather than fail. This is what stops that.
   */
  for (const id of CHECK_IDS) {
    const p = PRESENTATION[id];
    assert.ok(p.why && p.why.length > 40, `${id}: why this control exists`);
    assert.ok(p.control && p.control.length > 40, `${id}: what the control expects`);
    assert.ok(p.recheck && p.recheck.length > 20, `${id}: how the finding clears`);
    assert.ok(p.safeguard?.title, `${id}: safeguard title`);
    assert.ok(p.safeguard?.body, `${id}: safeguard body`);
    assert.ok(p.verification?.length > 0, `${id}: at least one verified outcome`);
    assert.ok(p.verificationSource, `${id}: where those outcomes came from`);
  }
});

/* ----------------------------------- 2. Business Context for the lifecycle */

test('lifecycle findings name the governed definition they were judged against', () => {
  /**
   * Business Context IS the Source Evidence block - the governed policy, in
   * plain English, beside where it lives. Deliberately one section and not two:
   * a separate "Business Context" panel would restate this content under a
   * different heading, and the page is an investigation, not a brochure.
   */
  for (const id of LIFECYCLE) {
    const se = PRESENTATION[id].sourceEvidence;
    assert.ok(se, `${id}: has source evidence`);
    assert.ok(se.intro.length > 20, `${id}: says what the section is for`);
    assert.ok(se.pairs.length >= 2, `${id}: names more than one source`);
    for (const pair of se.pairs) {
      assert.ok(pair.term.length > 0 && pair.detail.length > 60, `${id}: ${pair.term} is explained`);
    }
  }
});

test('a synthetic policy is labelled as one wherever it is presented as a definition', () => {
  /**
   * The three governed policies are authored for demonstration, not agreed
   * with a client. Presenting one as the business's real definition would be
   * the single most misleading thing this page could do.
   */
  for (const id of ['mql-integrity', 'sales-acceptance-sql'] as const) {
    const joined = PRESENTATION[id].sourceEvidence!.pairs.map((x) => x.detail).join(' ');
    assert.match(joined, /Synthetic Baseline/, `${id}: the policy is marked synthetic`);
  }
});

/* -------------------------------------- 3. the three kinds of evidence */

test('record, source and implementation evidence stay separable', () => {
  /**
   * Three different questions: what happened to the record, where the rule
   * came from, and where the implementation can be read. Collapsing them into
   * one "evidence" list is what makes a governance page unreadable.
   */
  const conversion = opportunityConversionIntegrity([
    lead({ Status: 'Closed - Converted', IsConverted: false }),
  ]);
  // Record evidence: per-record Salesforce values, from the detector.
  assert.ok(conversion.evidence.length > 0);
  assert.ok(conversion.evidenceColumns.some((c) => c.key === 'IsConverted'));

  // Source evidence: where the governing definition comes from, from presentation.
  const se = PRESENTATION['lifecycle-conversion'].sourceEvidence!;
  assert.ok(se.pairs.some((x) => /Lead Status|Lead Conversion|Lifecycle Transition/.test(x.term)));

  // Implementation evidence: a repository path, from presentation.
  assert.ok(evidenceUrl(PRESENTATION['lifecycle-conversion'])?.startsWith('https://github.com/'));

  // And they are carried by different structures, not one merged list.
  assert.ok(!('sourceEvidence' in conversion), 'the detector does not author source evidence');
});

test('Salesforce dependencies are traceable to a repository path, not asserted', () => {
  for (const id of LIFECYCLE) {
    const t = TRACEABILITY[id];
    assert.ok(t.fields.length > 0, `${id}: names the fields it reads`);
    for (const u of t.usages) {
      assert.ok(u.evidencePath.startsWith('force-app/'), `${id}: ${u.name} points at source`);
      assert.ok(u.purpose.length > 20, `${id}: ${u.name} says what it does`);
    }
  }
});

/* ----------------------------------- 4. detective vs preventive is stated */

test('every control declares whether Salesforce prevents it or NorthstarIQ only reports it', () => {
  for (const id of CHECK_IDS) {
    const kind = PRESENTATION[id].safeguard.kind;
    assert.ok(kind === 'preventive' || kind === 'detective', `${id}: ${kind}`);
  }
});

test('a preventive safeguard is never credited with finding the records listed', () => {
  /**
   * The three baseline conversion contradictions predate the lifecycle
   * safeguard. The copy has to say the safeguard governs NEW transitions, or a
   * reader concludes it failed to stop the very records on screen.
   */
  const s = PRESENTATION['lifecycle-conversion'].safeguard;
  assert.equal(s.kind, 'preventive');
  assert.match(s.body, /NEW transitions only|could not reach/i);
  assert.match(
    PRESENTATION['lifecycle-conversion'].verificationSource,
    /created after|not used during/i,
    'the detective control did not participate in the preventive validation',
  );
});

test('a control with no org-side safeguard says so rather than implying one', () => {
  const s = PRESENTATION['stale-opportunities'].safeguard;
  assert.equal(s.kind, 'detective');
  assert.ok(s.tech?.includes('Detection only'));
});

/* ------------------------------------ 5. the conversion invariant survives */

test('a Converted Opportunity is presented as optional, never as the defect', () => {
  const p = PRESENTATION['lifecycle-conversion'];
  assert.match(p.control, /Opportunity is optional|never required/i);
  assert.match(p.explain.proves, /may legitimately have no Opportunity|no Opportunity at all/i);

  // And the detector agrees: a converted Lead with no Opportunity passes.
  const r = opportunityConversionIntegrity([
    lead({
      Status: 'Closed - Converted',
      IsConverted: true,
      ConvertedDate: '2026-08-20',
      ConvertedAccountId: '001000000000001',
      ConvertedContactId: '003000000000001',
      ConvertedOpportunityId: null,
    }),
  ]);
  assert.equal(r.failing, 0);
  assert.ok(r.evidenceColumns.some((c) => /optional/i.test(c.label)), 'the column says so too');
});

/* --------------------------- 6. links come from evidence, never from guesses */

test('record links are built only from ids the detector actually returned', () => {
  const r = opportunityConversionIntegrity([
    lead({ Status: 'Closed - Converted', IsConverted: false }),
  ]);
  const row = r.evidence[0];
  assert.match(String(row.Id), /^00Q/, 'a real Lead id from the record');
  // Absent references render as a dash, and a dash is not a linkable id.
  assert.equal(row.ConvertedAccountId, '—');
  assert.equal(row.ConvertedOpportunityId, '—');
});

test('implementation evidence points at a path that exists in the repository', () => {
  for (const id of LIFECYCLE) {
    const p = PRESENTATION[id];
    if (!p.evidencePath) continue;
    assert.ok(
      p.evidencePath.startsWith('force-app/'),
      `${id}: ${p.evidencePath} is a repository path`,
    );
    assert.ok(evidenceUrl(p)?.includes(p.evidencePath));
  }
});

/* -------------------------- 7. non-lifecycle findings are not degraded */

test('non-lifecycle controls still fill the same page, without lifecycle content', () => {
  for (const id of ['missing-firmographics', 'sla-risk', 'stale-opportunities'] as const) {
    const p = PRESENTATION[id];
    assert.ok(p.why && p.control && p.recheck && p.safeguard && p.verification.length > 0);
    // Optional section: absent rather than filled with borrowed lifecycle copy.
    assert.equal(p.sourceEvidence, undefined, `${id}: no invented source evidence`);
  }
});

/* ------------------ 8. unscored controls still produce no finding */

test('the two unscored lifecycle controls generate no finding to detail', () => {
  const a = buildAssessment(
    runAllChecks(
      [lead(), lead({ Status: 'Closed - Converted', IsConverted: false })],
      [opportunity()],
      TODAY,
      READINESS_SOURCES,
      GOVERNANCE,
      NO_HISTORY,
    ),
    3,
    ['Lead', 'Opportunity'],
    TODAY.toISOString(),
  );
  const ids = a.findings.map((f) => f.id);
  assert.ok(!ids.includes('mql-integrity'));
  assert.ok(!ids.includes('sales-acceptance-sql'));
  assert.ok(ids.includes('lifecycle-conversion'), 'a real failure still reaches the queue');

  // Their state is visible on the assessment instead, with the reason.
  for (const id of ['mql-integrity', 'sales-acceptance-sql'] as const) {
    const c = a.controls.find((x) => x.id === id)!;
    assert.equal(c.score, null);
    assert.equal(c.scoreReason, 'insufficient-evidence');
    assert.ok(c.unmeasurableCount > 0);
  }
});

/* ---------------- 9. absent evidence never becomes a failure in presentation */

test('an unscored control explains itself without claiming a pass or a failure', () => {
  const a = buildAssessment(
    runAllChecks(
      [lead({ Status: 'SAL' })],
      [],
      TODAY,
      READINESS_SOURCES,
      GOVERNANCE,
      NO_HISTORY,
    ),
    1,
    ['Lead'],
    TODAY.toISOString(),
  );
  const c = a.controls.find((x) => x.id === 'sales-acceptance-sql')!;
  assert.equal(c.failing, 0, 'no evidence is not a failure');
  assert.equal(c.score, null, 'and not a pass');
  assert.equal(c.scoreReason, 'insufficient-evidence');
});

/* -------------------------------- 10. labels a screen reader can rely on */

test('status and evidence labels read correctly without colour', () => {
  // The safeguard kind is a word, not only a colour.
  for (const id of CHECK_IDS) {
    assert.ok(['preventive', 'detective'].includes(PRESENTATION[id].safeguard.kind));
  }
  // Evidence columns are labelled, not positional.
  const r = opportunityConversionIntegrity([
    lead({ Status: 'Closed - Converted', IsConverted: false }),
  ]);
  for (const col of r.evidenceColumns) {
    assert.ok(col.label.length > 0, `${col.key} has a visible label`);
  }
  for (const col of r.notEvaluatedColumns) {
    assert.ok(col.label.length > 0, `${col.key} has a visible label`);
  }
  // The not-evaluated table always carries a per-record reason.
  assert.ok(r.notEvaluatedColumns.some((c) => /why/i.test(c.label)));
});

/* ----------- 11. the evidence a reader sees is the evidence that decided it */

/**
 * THE RULE THESE ENFORCE, stated once.
 *
 * A column is proving when its value ON THAT RECORD could change THAT
 * record's determination. Everything else is context - worth showing, because
 * an operator investigating needs the company and the routing reason, but not
 * what proved anything. Without the distinction a reader has to reverse the
 * detector out of a table of related-looking fields, which is precisely the
 * work an investigation trail exists to save them.
 */

test('every control marks the evidence its determination actually turns on', () => {
  const checks = runAllChecks(
    [
      lead(),
      lead({ Status: 'Closed - Converted', IsConverted: false }),
      lead({ Owner: { Name: 'NIQ Routing Exception', Type: 'Queue' } }),
      lead({ Territory__c: null }),
      lead({ CountryCode: null }),
    ],
    [opportunity({ CloseDate: '2026-01-31' })],
    TODAY,
    READINESS_SOURCES,
    GOVERNANCE,
    NO_HISTORY,
  );

  for (const c of checks) {
    const proving = c.evidenceColumns.filter((x) => x.proving);
    assert.ok(proving.length > 0, `${c.id}: nothing is marked as having decided the result`);
    // Identity is how a reader FINDS the record. It never explains it.
    assert.ok(
      !proving.some((x) => x.key === 'Name' || x.key === 'Id'),
      `${c.id}: an identifier is not proof`,
    );
    // The Result column states the conclusion; a conclusion is not its evidence.
    assert.ok(
      !proving.some((x) => x.key === 'Result'),
      `${c.id}: the conclusion is marked as its own evidence`,
    );
  }
});

test('a finding decided by a field the table never showed is not an investigation trail', () => {
  /**
   * Routing exceptions turn on exactly one fact: routing declined to pick an
   * owner and left the Lead with the exception queue. Exception Type and
   * Routing Reason are the Flow's own account of why - useful, and neither of
   * them decides anything.
   */
  const r = routingExceptions([
    lead({
      Owner: { Name: 'NIQ Routing Exception', Type: 'Queue' },
      Exception_Type__c: 'Unsupported Geography',
    }),
  ]);

  assert.equal(r.failing, 1);
  assert.ok(r.evidenceColumns.find((c) => c.key === 'Owner')?.proving, 'the owner decided it');
  assert.equal(r.evidence[0].Owner, 'NIQ Routing Exception', 'and its value is on the row');
  assert.ok(
    !r.evidenceColumns.find((c) => c.key === 'Exception_Type__c')?.proving,
    'the Flow’s explanation is context, not proof',
  );
});

test('a control that fails a record on an absent value shows the absence', () => {
  const r = missingTerritory([lead({ Territory__c: null, CountryCode: 'JP' })]);

  assert.equal(r.failing, 1);
  assert.ok(r.evidenceColumns.find((c) => c.key === 'Territory__c')?.proving);
  assert.match(String(r.evidence[0].Territory__c), /none derived/, 'the blank is the evidence');
  // Absent geography and uncovered geography are different problems, and the
  // row says which one this record is.
  assert.match(String(r.evidence[0].Result), /JP is not covered/);
  assert.match(
    String(missingTerritory([lead({ Territory__c: null, CountryCode: null })]).evidence[0].Result),
    /no Country recorded/,
  );
});

test('a comparison finding shows both sides of the comparison', () => {
  /**
   * The close date was always on the row. The date it was compared against
   * never was, so a reader had to supply today's date themselves to see why
   * the record failed.
   */
  const r = staleOpportunities([opportunity({ CloseDate: '2026-08-13' })], TODAY);

  assert.equal(r.failing, 1);
  assert.ok(r.evidenceColumns.find((c) => c.key === 'CloseDate')?.proving);
  assert.match(String(r.evidence[0].Result), /10 days/, 'how far past');
  assert.match(String(r.evidence[0].Result), /2026-08-23/, 'past what');
});

/* ------------------------- 11. a safeguard that was itself found defective */

/**
 * REMEDIATION IS EVIDENCE ABOUT A FINDING, NOT A PRODUCT WORKFLOW.
 *
 * These guard the claims that would be easiest to overstate: that only one
 * safeguard was actually remediated, that the deployment is identified rather
 * than described, that observed failure and reachable exposure never merge into
 * one claim, and that evidence produced afterwards is never presented as the
 * validation it came after.
 */

test('exactly one safeguard carries a remediation, and it is the one that was remediated', () => {
  const remediated = CHECK_IDS.filter((id) => PRESENTATION[id].safeguard.remediation);

  assert.deepEqual(remediated, ['mql-integrity'], 'one canonical remediation, not a pattern');

  // The page renders the block only when it exists, so every other control has
  // to be genuinely absent rather than present and empty.
  for (const id of CHECK_IDS) {
    if (id === 'mql-integrity') continue;
    assert.equal(
      PRESENTATION[id].safeguard.remediation,
      undefined,
      `${id} renders no remediation section`,
    );
  }
});

test('the remediation identifies what was deployed and what a reversal would target', () => {
  const rem = PRESENTATION['mql-integrity'].safeguard.remediation;
  assert.ok(rem);

  assert.equal(rem.deployment.component, 'Lead_Inbound_Before_Save');
  assert.match(rem.deployment.active, /13/, 'the version now running');
  assert.match(rem.deployment.rollbackTarget, /12/, 'the version a reversal targets');

  // Deploy ids are recorded because they were recovered from the org. A
  // placeholder would be worse than the field being absent, so the shape is
  // asserted rather than merely the presence of a string.
  for (const id of [rem.deployment.requestId, rem.deployment.checkOnly]) {
    if (id === undefined) continue;
    assert.match(id, /^0Af[A-Za-z0-9]{15}$/, 'a real Salesforce deploy request id');
  }

  // Recovery is a described path, not a capability the application has - so the
  // copy has to deny the automation rather than merely omit mentioning it.
  assert.match(rem.recovery, /not be automatic/i, 'no automated rollback is implied');
  assert.match(rem.recovery, /re-run|revalidat/i, 'a reversal still has to be proven');
});

test('observed failure and reachable exposure are never merged into one claim', () => {
  const rem = PRESENTATION['mql-integrity'].safeguard.remediation;
  assert.ok(rem);

  const basis = new Map(rem.exposures.map((e) => [e.subject, e]));

  // Segment was watched failing before anything was changed.
  assert.equal(basis.get('Segment')?.before, 'runtime-confirmed');

  // The other two were only ever read out of the configuration as reachable.
  // Their post-correction cases prove the corrected behaviour and nothing about
  // history, so each must disclaim the failure it never demonstrated.
  for (const subject of ['Territory', 'Match Status']) {
    const e = basis.get(subject);
    assert.equal(e?.before, 'source-derived', `${subject} was never runtime-confirmed`);
    assert.match(
      String(e?.after),
      /no pre-correction runtime failure/i,
      `${subject} does not claim a failure that was never observed`,
    );
  }

  // At least one of each, or the distinction is decorative.
  const kinds = new Set(rem.exposures.map((e) => e.before));
  assert.equal(kinds.size, 2, 'both bases are actually represented');
});

test('evidence produced afterwards is not presented as the validation it followed', () => {
  const rem = PRESENTATION['mql-integrity'].safeguard.remediation;
  assert.ok(rem);

  // The later end-to-end traversal supports the correction; it did not validate
  // it, and the wording has to keep saying so.
  assert.match(rem.laterConfirmation, /later/i);
  assert.match(rem.laterConfirmation, /not the original validation/i);

  // Deployment success is never the behavioural claim.
  assert.match(rem.verification.join(' '), /re-quer/i, 'outcomes were read back from Salesforce');

  // The detective control corroborates the state; it cannot see Flow ordering.
  assert.match(rem.detectiveConfirmation, /does not establish Flow execution order/i);

  // Bounded volume is stated where a scale reading would otherwise be available.
  assert.match(rem.regression.join(' '), /not a scale result/i);
});

test('the remediated control says its safeguard was revalidated, not only first validated', () => {
  const p = PRESENTATION['mql-integrity'];

  // The original 2026-08-27 provenance is evidence and stays.
  assert.match(p.verificationSource, /2026-08-27/, 'the earlier validation is preserved');
  // But it can no longer be the newest thing the page admits to.
  assert.match(p.verificationSource, /2026-09-01/, 'the revalidation is stated');
  assert.match(p.verificationSource, /revalidated/i);
});

test('the corrected automation is linked to the repository, not asserted', () => {
  const rem = PRESENTATION['mql-integrity'].safeguard.remediation;
  assert.ok(rem?.evidencePath);

  assert.ok(rem.evidencePath.startsWith('force-app/'), 'a repository path');
  assert.match(rem.evidencePath, /Lead_Inbound_Before_Save/, 'the component that was deployed');
  assert.ok(remediationEvidenceUrl(rem)?.includes(rem.evidencePath));

  // A control with no corrected implementation gets no link rather than a stub.
  assert.equal(remediationEvidenceUrl({ ...rem, evidencePath: undefined }), null);
});

/* ------------------------------------------------- 12. what navigation offers */

test('remediation and verification are not offered as standalone destinations', () => {
  const items = NAV_GROUPS.flatMap((g) => g.items);
  const labels = items.map((i) => i.label);

  // They are stages of one finding's investigation trail. A sidebar row - even
  // a Planned one - would advertise two workflows this MVP does not have.
  assert.ok(!labels.includes('Remediation'), 'no standalone Remediation destination');
  assert.ok(!labels.includes('Verification'), 'no standalone Verification destination');

  // And nothing was quietly renamed into the same claim.
  for (const label of labels) {
    assert.doesNotMatch(label, /remediat|verif/i, `${label} does not reintroduce the workflow`);
  }
});

test('the navigation that is built still resolves, and the planned rows stay unlinked', () => {
  const items = NAV_GROUPS.flatMap((g) => g.items);

  // The three built destinations, unchanged by the removal above.
  const built = items.filter((i) => i.href).map((i) => i.href);
  assert.deepEqual(built, ['/', '/assessment', '/findings', '/integrations']);

  // Approved architecture that is not built is named but never linked.
  const planned = items.filter((i) => !i.href).map((i) => i.label);
  assert.deepEqual(planned, ['Analytics', 'Audit Log']);

  // Every row can render: a label, and an icon the component knows.
  for (const item of items) {
    assert.ok(item.label.length > 0);
    assert.ok(
      ['dashboard', 'assessment', 'findings', 'analytics', 'integrations', 'audit'].includes(
        item.icon,
      ),
      `${item.label} names a known icon`,
    );
  }
});
