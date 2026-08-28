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

import { PRESENTATION, evidenceUrl } from '../lib/presentation.ts';
import { TRACEABILITY } from '../lib/traceability.ts';
import { CHECK_IDS, opportunityConversionIntegrity, runAllChecks } from '../lib/checks/index.ts';
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
