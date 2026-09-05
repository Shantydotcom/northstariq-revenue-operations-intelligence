import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runAllChecks, CHECK_IDS } from '../lib/checks/index.ts';
import { buildAssessment, CATEGORIES } from '../lib/score.ts';
import { AREAS, PRESENTATION } from '../lib/presentation.ts';
import { areaFilterHref } from '../lib/area-filter.ts';
import {
  LIFECYCLE_AREA,
  STATUS_LABEL,
  checkStatus,
  controlOf,
  lifecycleScope,
  noun,
  outcomeSentence,
  populationStory,
  populationCounts,
  progressionNote,
  samplingNote,
  splitAreas,
} from '../lib/assessment-view.ts';
import {
  CROSS_STAGE_CHECK,
  CROSS_STAGE_VIEWED_AT,
  JOURNEY,
  LIFECYCLE_CHECK_ORDER,
  MARK_LABEL,
  stageByKey,
  stageMark,
} from '../lib/lifecycle-journey.ts';
import { recordUrl } from '../lib/record-url.ts';
import {
  FORECAST_PERIOD,
  GOVERNANCE,
  lead,
  NO_HISTORY,
  opportunity,
  READINESS_SOURCES,
  TODAY,
} from './fixtures.ts';
import type { CheckId } from '../lib/types.ts';

/**
 * THE ASSESSMENT PAGE, PROVED WITHOUT A BROWSER.
 *
 * Everything the page decides lives in two pure modules, so these assert the
 * decisions themselves rather than the markup around them: which areas exist,
 * which checks are scored, which stage belongs to which check, and which total
 * a population figure is allowed to use. No test-rendering dependency was
 * added to get here.
 */

const EXCEPTION_QUEUE = { Name: 'NIQ Routing Exception', Type: 'Queue' };
const RAN_AT = '2026-08-28T00:00:00.000Z';

const LEADS = [
  lead(),
  lead({ LeadSource: 'Web', Match_Status__c: null }),
  lead({ LeadSource: 'Purchased List' }),
  lead({ Owner: EXCEPTION_QUEUE, Exception_Type__c: 'Ambiguous Account Match' }),
  lead({ SLA_Target_DateTime__c: null, SLA_Status__c: 'Unmeasurable', SLA_Basis__c: null }),
  lead({ CountryCode: null }),
  lead({ Segment_Basis__c: null }),
];
const OPPS = [opportunity(), opportunity({ IsClosed: true }), opportunity({ CloseDate: '2026-01-05' })];

const assess = () =>
  buildAssessment(
    runAllChecks(LEADS, OPPS, TODAY, READINESS_SOURCES, GOVERNANCE, NO_HISTORY, FORECAST_PERIOD),
    LEADS.length + OPPS.length,
    ['Lead', 'Opportunity'],
    RAN_AT,
  );

/* ------------------------------------------------------ areas and checks */

test('every assessment area the model defines reaches the page', () => {
  const result = assess();
  const { lifecycle, standard } = splitAreas(result.categoryScores);
  const rendered = [...(lifecycle ? [lifecycle.category] : []), ...standard.map((c) => c.category)];
  assert.equal(rendered.length, CATEGORIES.length, 'an area would be missing from the page');
  for (const c of CATEGORIES) assert.ok(rendered.includes(c), `${c} is not rendered`);
});

test('the lifecycle area is separated out, and nothing else is', () => {
  const { lifecycle, standard } = splitAreas(assess().categoryScores);
  assert.equal(lifecycle?.category, LIFECYCLE_AREA);
  assert.ok(!standard.some((c) => c.category === LIFECYCLE_AREA));
  assert.equal(standard.length, CATEGORIES.length - 1);
});

test('all eleven checks are still represented across the two halves', () => {
  const result = assess();
  const { lifecycle, standard } = splitAreas(result.categoryScores);
  const shown = [...(lifecycle?.checkIds ?? []), ...standard.flatMap((c) => c.checkIds)];
  assert.equal(shown.length, CHECK_IDS.length);
  for (const id of CHECK_IDS) assert.ok(shown.includes(id), `${id} is not on the page`);
});

/* ------------------------------------------------------------ check status */

test('a check reports exactly one of three states, and no number', () => {
  for (const c of assess().controls) {
    const status = checkStatus(c);
    assert.ok(['passed', 'failed', 'no-result'].includes(status), `${c.id}`);
    assert.ok(!/\d/.test(STATUS_LABEL[status]), 'a status must never carry a figure');
  }
});

test('the state matches what the check actually found', () => {
  for (const c of assess().controls) {
    if (c.evaluated === 0) assert.equal(checkStatus(c), 'no-result', `${c.id}`);
    else if (c.failing > 0) assert.equal(checkStatus(c), 'failed', `${c.id}`);
    else assert.equal(checkStatus(c), 'passed', `${c.id}`);
  }
});

test('a check that judged nothing is never called a pass or a failure', () => {
  for (const c of assess().controls) {
    if (c.score !== null) continue;
    assert.equal(checkStatus(c), 'no-result', `${c.id}`);
    assert.notEqual(STATUS_LABEL[checkStatus(c)], STATUS_LABEL.passed);
    assert.notEqual(STATUS_LABEL[checkStatus(c)], STATUS_LABEL.failed);
  }
});

test('every check states its outcome in a sentence built from its own numbers', () => {
  for (const c of assess().controls) {
    const said = outcomeSentence(c);
    assert.ok(said.length > 0, `${c.id} says nothing`);
    assert.ok(said.trim().endsWith('.'), `${c.id} is not a sentence`);
    if (checkStatus(c) === 'failed') {
      assert.ok(said.includes(String(c.failing)), `${c.id} omits how many failed`);
    }
    if (checkStatus(c) === 'no-result') {
      assert.ok(said.includes(String(c.unmeasurableCount)), `${c.id} omits the population`);
    }
    if (checkStatus(c) === 'passed') {
      assert.ok(said.includes(String(c.evaluated)), `${c.id} omits how many it judged`);
    }
  }
});

test('a failing check says what the finding says, not something of its own', () => {
  for (const c of assess().controls) {
    if (checkStatus(c) !== 'failed') continue;
    assert.equal(outcomeSentence(c), PRESENTATION[c.id].finding(c.failing, c.evaluated), c.id);
  }
});

test('nothing the page states about a check reintroduces the score', () => {
  for (const c of assess().controls) {
    const words = `${outcomeSentence(c)} ${STATUS_LABEL[checkStatus(c)]}`.toLowerCase();
    // The score is a percentage of the judged population. The counts it was
    // derived from are what this page shows; the percentage itself, the scale
    // it sits on, and the vocabulary built around it are all gone.
    for (const banned of ['/ 100', 'out of 100', 'score', 'not scored']) {
      assert.ok(!words.includes(banned), `${c.id} says "${banned}"`);
    }
  }
});

test('a singular count takes a singular noun', () => {
  assert.equal(noun('Leads', 1), 'Lead');
  assert.equal(noun('Leads', 0), 'Leads');
  assert.equal(noun('Leads', 2), 'Leads');
  assert.equal(noun('Opportunities', 1), 'Opportunitie', 'only a trailing s is removed');
});

/* ------------------------------------------------------- stage progression */

test('the progression note is read from the cross-stage check every time', () => {
  const result = assess();
  const control = controlOf(result, CROSS_STAGE_CHECK);
  assert.ok(control);
  const note = progressionNote(control);
  assert.ok(note);
  assert.equal(note.status, checkStatus(control));
});

test('the allowed-progression message cannot appear while progression is failing', () => {
  const passing = progressionNote({
    ...(controlOf(assess(), CROSS_STAGE_CHECK) as NonNullable<
      ReturnType<typeof controlOf>
    >),
    score: 100,
    failing: 0,
    evaluated: 15,
  });
  const failing = progressionNote({
    ...(controlOf(assess(), CROSS_STAGE_CHECK) as NonNullable<
      ReturnType<typeof controlOf>
    >),
    score: 0,
    failing: 4,
    evaluated: 15,
  });
  const none = progressionNote({
    ...(controlOf(assess(), CROSS_STAGE_CHECK) as NonNullable<
      ReturnType<typeof controlOf>
    >),
    score: null,
    failing: 0,
    evaluated: 0,
  });

  assert.equal(passing?.status, 'passed');
  assert.match(passing?.text ?? '', /followed an allowed path/);

  assert.equal(failing?.status, 'failed');
  assert.ok(failing?.text.includes('4 of 15'), 'a failure states the count');

  assert.equal(none?.status, 'no-result');

  // The guarantee, not the wording: only the passing branch may read as one.
  for (const other of [failing, none]) {
    assert.notEqual(other?.text, passing?.text, 'a non-passing state reused the success sentence');
    assert.doesNotMatch(other?.text ?? '', /allowed path|was allowed/);
  }
});

test('no progression note is produced when the check is absent', () => {
  assert.equal(progressionNote(null), null);
});

/* ------------------------------------------------------------ populations */

test('every population figure uses the authoritative count, not a sample length', () => {
  const result = assess();
  for (const c of result.controls) {
    const p = populationCounts(c);
    assert.equal(p.checked, c.evaluated, `${c.id} checked`);
    assert.equal(p.passed, c.evaluated - c.failing, `${c.id} passed`);
    assert.equal(p.failed, c.failing, `${c.id} failed`);
    assert.equal(p.noResult, c.unmeasurableCount, `${c.id} no result`);
    assert.equal(
      p.notApplicable,
      c.notEvaluatedCount - c.unmeasurableCount,
      `${c.id} not applicable`,
    );
  }
});

test('no result and not applicable stay separate, and together account for the rest', () => {
  for (const c of assess().controls) {
    const p = populationCounts(c);
    assert.equal(p.noResult + p.notApplicable, c.notEvaluatedCount, `${c.id}`);
    assert.ok(p.notApplicable >= 0, `${c.id} cannot have negative not-applicable`);
    assert.equal(p.checked + p.noResult + p.notApplicable, c.orgPopulation, `${c.id} whole org`);
  }
});

test('a capped list says so, and a complete one says nothing', () => {
  assert.equal(samplingNote(10, 13), 'Showing 10 of 13');
  assert.equal(samplingNote(3, 3), null);
  assert.equal(samplingNote(0, 0), null);
});

/* --------------------------------------------------- population boundaries */

test('the lifecycle scope is the population every control started from', () => {
  const result = assess();
  const { lifecycle } = splitAreas(result.categoryScores);
  assert.ok(lifecycle);
  const scope = lifecycleScope(result.controls, lifecycle.checkIds);
  assert.ok(scope, 'the lifecycle controls read one population and it must be stateable');

  for (const id of lifecycle.checkIds) {
    const c = controlOf(result, id);
    assert.ok(c);
    assert.equal(c.orgPopulation, scope.count, `${id} started from a different population`);
  }
});

test('no scope is claimed where the controls do not share one', () => {
  const result = assess();
  // A Lead control and an Opportunity control read different objects, so there
  // is no shared scope to state and none may be invented.
  const mixed = lifecycleScope(result.controls, ['mql-integrity', 'stale-opportunities']);
  assert.equal(mixed, null);
  assert.equal(lifecycleScope(result.controls, []), null);
  assert.equal(lifecycleScope(result.controls, ['not-a-check']), null);
});

test('the scope is never confused with a control population', () => {
  const result = assess();
  const { lifecycle } = splitAreas(result.categoryScores);
  assert.ok(lifecycle);
  const scope = lifecycleScope(result.controls, lifecycle.checkIds);
  assert.ok(scope);
  for (const id of lifecycle.checkIds) {
    const c = controlOf(result, id);
    assert.ok(c);
    // Every control narrows the scope to the records that make its claim; the
    // scope itself is never presented as what a control judged.
    assert.ok(c.evaluated <= scope.count, `${id} judged more than the scope holds`);
  }
});

test('outside, no result and checked stay three separate populations', () => {
  for (const c of assess().controls) {
    const p = populationCounts(c);
    // The whole population a check saw, reconcilable from the page.
    assert.equal(p.checked + p.noResult + p.notApplicable, c.orgPopulation, `${c.id}`);
    // Outside is a boundary, not a verdict: it is in neither pass nor fail.
    assert.equal(p.passed + p.failed, p.checked, `${c.id} judged something it did not check`);
    assert.ok(p.notApplicable >= 0 && p.noResult >= 0, `${c.id}`);
  }
});

test('an outside count is never folded into a no-result count', () => {
  for (const c of assess().controls) {
    const p = populationCounts(c);
    assert.equal(p.noResult, c.unmeasurableCount, `${c.id} no result must be the unmeasurable set`);
    assert.equal(
      p.notApplicable,
      c.notEvaluatedCount - c.unmeasurableCount,
      `${c.id} outside must be the rest of the not-evaluated set`,
    );
  }
});

test('the population story accounts for every record, in the control own terms', () => {
  const result = assess();
  for (const c of result.controls) {
    const p = populationCounts(c);
    const story = populationStory(c);
    if (story === null) {
      // One group only: the control judged everything it read.
      const groups = [p.checked, p.noResult, p.notApplicable].filter((n) => n > 0);
      assert.ok(groups.length <= 1, `${c.id} has more than one group and told no story`);
      continue;
    }
    assert.ok(story.includes(String(c.orgPopulation)), `${c.id} omits the scope`);
    for (const [n, label] of [
      [p.checked, 'checked'],
      [p.noResult, 'undetermined'],
      [p.notApplicable, 'not claimed'],
    ] as const) {
      if (n > 0) assert.ok(story.includes(String(n)), `${c.id} omits its ${label} count`);
    }
    // A zero group is left out rather than printed as a nothing-happened clause.
    if (p.checked === 0) assert.ok(!/0 could be judged/.test(story), `${c.id}`);
    assert.ok(story.trim().endsWith('.'), `${c.id} is not a sentence`);
  }
});

test('the outside predicate is the one written for that control', () => {
  const result = assess();
  for (const c of result.controls) {
    if (populationCounts(c).notApplicable === 0) continue;
    const predicate = PRESENTATION[c.id].explain.notClaimed;
    const story = populationStory(c);
    // A control with only one non-empty group tells no story; the test above
    // covers that case.
    if (!predicate || story === null) continue;
    assert.ok(story.includes(predicate), `${c.id} did not use its own outside predicate`);
  }
});

/* -------------------------------------------------- retained record rows - */

test('a retained record carries the fields a named column needs', () => {
  const result = runAllChecks(LEADS, OPPS, TODAY, READINESS_SOURCES, GOVERNANCE, NO_HISTORY, FORECAST_PERIOD);
  for (const r of result) {
    for (const ref of [...r.checkedSample.records, ...r.passingSample.records]) {
      assert.ok(ref.id.length > 0, `${r.id}: a record with no id cannot be opened in Salesforce`);
      assert.ok(ref.label.length > 0, `${r.id}: a record with no name cannot be named in a column`);
      // Both may legitimately be null; neither may be undefined, which would
      // render as an empty cell rather than as the em-dash for "no value".
      assert.notEqual(ref.context, undefined, `${r.id}: context must be stated or null`);
      assert.notEqual(ref.state, undefined, `${r.id}: state must be stated or null`);
    }
  }
});

test('naming a record changed no count', () => {
  const result = runAllChecks(LEADS, OPPS, TODAY, READINESS_SOURCES, GOVERNANCE, NO_HISTORY, FORECAST_PERIOD);
  for (const r of result) {
    assert.equal(r.checkedSample.total, r.evaluated, `${r.id}`);
    assert.equal(r.passingSample.total, r.evaluated - r.failing, `${r.id}`);
    assert.equal(r.evaluated + r.notEvaluatedCount, r.orgPopulation, `${r.id}`);
  }
});

/* ------------------------------------------------------------ lead journey */

test('the journey is six stages, and only the real ones claim to be a Lead status', () => {
  assert.deepEqual(
    JOURNEY.map((s) => s.label),
    ['Lead', 'MQL', 'SAL', 'SQL', 'Conversion', 'Opportunity'],
  );
  assert.equal(stageByKey('opportunity')?.isLeadStatus, false, 'Opportunity is not a Lead status');
  assert.equal(stageByKey('lead')?.isLeadStatus, false, 'the Lead box spans more than one status');
  for (const key of ['mql', 'sal', 'sql', 'conversion']) {
    assert.equal(stageByKey(key)?.isLeadStatus, true, `${key} is a governed status`);
  }
});

test('every stage maps to a check the model actually runs, or to none at all', () => {
  for (const s of JOURNEY) {
    if (s.relatedCheck === null) continue;
    assert.ok(CHECK_IDS.includes(s.relatedCheck), `${s.key} points at an unknown check`);
    assert.ok(PRESENTATION[s.relatedCheck], `${s.key} points at a check with no presentation`);
  }
});

test('the stage to check mapping is the approved one', () => {
  assert.equal(stageByKey('mql')?.relatedCheck, 'mql-integrity');
  assert.equal(stageByKey('sal')?.relatedCheck, 'sales-acceptance-sql');
  assert.equal(stageByKey('sql')?.relatedCheck, 'sales-acceptance-sql');
  assert.equal(stageByKey('conversion')?.relatedCheck, 'lifecycle-conversion');
  assert.equal(stageByKey('lead')?.relatedCheck, null);
  assert.equal(stageByKey('opportunity')?.relatedCheck, null);
});

test('stage progression belongs to no single stage', () => {
  assert.equal(CROSS_STAGE_CHECK, 'lifecycle-progression');
  for (const s of JOURNEY) {
    assert.notEqual(s.relatedCheck, CROSS_STAGE_CHECK, `${s.key} claims the cross-stage check`);
  }
  assert.ok(LIFECYCLE_CHECK_ORDER.includes(CROSS_STAGE_CHECK), 'it still gets a result row');
});

test('reading the cross-stage control at Lead does not make it a Lead verdict', () => {
  const lead0 = stageByKey(CROSS_STAGE_VIEWED_AT);
  assert.ok(lead0, 'the stage the cross-stage control is read at must exist');

  // The reading position is presentation. The model is untouched: Lead judges
  // nothing, so it takes no mark - not even from a passing cross-stage control.
  assert.equal(lead0.relatedCheck, null, 'Lead must still own no control');
  assert.equal(stageMark(lead0, { score: 100, failing: 0 }), 'none');
  assert.equal(stageMark(lead0, { score: 0, failing: 5 }), 'none');
});

test('every milestone resolves to at most one assessment, and never a borrowed one', () => {
  const result = assess();
  for (const s of JOURNEY) {
    const shown = s.relatedCheck
      ? controlOf(result, s.relatedCheck)
      : s.key === CROSS_STAGE_VIEWED_AT
        ? controlOf(result, CROSS_STAGE_CHECK)
        : null;

    if (s.relatedCheck) {
      assert.equal(shown?.id, s.relatedCheck, s.key + ' shows a control it does not own');
    } else if (s.key === CROSS_STAGE_VIEWED_AT) {
      assert.equal(shown?.id, CROSS_STAGE_CHECK, s.key);
    } else {
      // Opportunity: nothing judges it, and nothing is substituted.
      assert.equal(shown, null, s.key + ' was given an assessment that does not judge it');
    }
  }
});

test('the four lifecycle rows are exactly the lifecycle area checks', () => {
  const { lifecycle } = splitAreas(assess().categoryScores);
  assert.ok(lifecycle);
  assert.equal(LIFECYCLE_CHECK_ORDER.length, lifecycle.checkIds.length);
  for (const id of LIFECYCLE_CHECK_ORDER) {
    assert.ok(lifecycle.checkIds.includes(id as CheckId), `${id} is not in the lifecycle area`);
  }
});

test('a stage mark reports the related check, and never a verdict on the stage', () => {
  const conversion = stageByKey('conversion');
  const lead0 = stageByKey('lead');
  assert.ok(conversion && lead0);
  assert.equal(stageMark(conversion, { score: 0, failing: 3 }), 'attention');
  assert.equal(stageMark(conversion, { score: null, failing: 0 }), 'more-information');
  assert.equal(stageMark(conversion, { score: 100, failing: 0 }), 'passed');
  assert.equal(stageMark(lead0, { score: 0, failing: 9 }), 'none', 'no check, so no mark');
  assert.equal(stageMark(conversion, null), 'none', 'an absent control marks nothing');
});

test('a milestone nothing assessed is never marked as one that passed', () => {
  const conversion = stageByKey('conversion');
  const lead0 = stageByKey('lead');
  const opportunity = stageByKey('opportunity');
  assert.ok(conversion && lead0 && opportunity);

  // The distinction the four-state model exists for: an unassessed milestone
  // and a cleared one must never produce the same mark.
  const cleared = stageMark(conversion, { score: 100, failing: 0 });
  for (const unassessed of [lead0, opportunity]) {
    const mark = stageMark(unassessed, { score: 100, failing: 0 });
    assert.equal(mark, 'none', unassessed.key);
    assert.notEqual(mark, cleared, unassessed.key + ' was marked as if it had passed');
  }

  // And only the unassessed state may draw nothing.
  assert.equal(MARK_LABEL.none, 'Not assessed at this milestone');
});

test('every mark has words, so a mark is never carried by colour alone', () => {
  for (const mark of ['passed', 'attention', 'more-information', 'none'] as const) {
    assert.ok(MARK_LABEL[mark].length > 0, mark);
  }
  // Four states, four distinct words.
  const words = Object.values(MARK_LABEL);
  assert.equal(new Set(words).size, words.length, 'two states share a label');
});

/* ------------------------------------------------------------- navigation */

test('an area sends the reader to findings filtered to that area', () => {
  const result = assess();
  for (const area of result.categoryScores) {
    const href = areaFilterHref(area.category);
    assert.ok(href.startsWith('/findings?area='), `${area.category} builds a foreign href`);
    assert.equal(decodeURIComponent(href.split('=')[1]), area.category);
    assert.ok(AREAS[area.category], 'the area has a presentation entry to name it');
  }
});

test('a record link is only offered where the id and host can produce one', () => {
  assert.equal(
    recordUrl('example.my.salesforce.com', '00Qaj00000tZqcHEAS'),
    'https://example.my.salesforce.com/lightning/r/00Qaj00000tZqcHEAS/view',
  );
  assert.equal(recordUrl(undefined, '00Qaj00000tZqcHEAS'), null, 'no host, no link');
  assert.equal(recordUrl('example.my.salesforce.com', 'not-an-id'), null, 'no id, no link');
});

/* ------------------------------------------------------------- regression */

test('the page reads controls it can find, and tolerates one it cannot', () => {
  const result = assess();
  for (const id of CHECK_IDS) assert.ok(controlOf(result, id), `${id} missing from controls`);
  assert.equal(controlOf(result, 'not-a-check'), null);
});

test('scores and findings are unchanged by anything the page does', () => {
  const a = assess();
  const b = assess();
  assert.deepEqual(a.categoryScores, b.categoryScores);
  assert.equal(a.overallHealth, b.overallHealth);
  assert.deepEqual(a.findings, b.findings);
  assert.deepEqual(a.controls, b.controls);
});
