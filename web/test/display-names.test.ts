import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CHECK_IDS } from '../lib/checks/index.ts';
import { CATEGORIES } from '../lib/score.ts';
import { AREAS, PRESENTATION, areaDisplayName, checkDisplayName } from '../lib/presentation.ts';
import { areaFilterHref } from '../lib/area-filter.ts';
import { LIFECYCLE_CHECK_ORDER } from '../lib/lifecycle-journey.ts';
import type { CheckId } from '../lib/types.ts';

/**
 * DISPLAY NAMES ARE PRESENTATION AND NOTHING ELSE.
 *
 * The approved Assessment design names areas and checks in evaluator language.
 * These prove the new names reach the page, the formal names stay intact for
 * the audit surfaces, and nothing keyed on identity moved.
 */

/** The names the approved Assessment reference shows. */
const AREA_DISPLAY: Record<string, string> = {
  'Data Quality': 'Lead Information',
  Routing: 'Lead Assignment',
  'Identity & Matching': 'Account Matching',
  'SLA Performance': 'Lead Follow-Up',
  'Pipeline Hygiene': 'Opportunity Dates',
  'Lifecycle Governance': 'Lead Lifecycle',
};

const CHECK_DISPLAY: Partial<Record<CheckId, string>> = {
  'lifecycle-progression': 'Stage Progression',
  'mql-integrity': 'MQL Qualification',
  'sales-acceptance-sql': 'Sales Handoff & Qualification',
  'lifecycle-conversion': 'Opportunity Conversion',
};

test('every assessment area has the approved evaluator-facing name', () => {
  for (const category of CATEGORIES) {
    assert.equal(areaDisplayName(category), AREA_DISPLAY[category], `${category}`);
  }
});

test('the approved lifecycle check names map to the right check ids', () => {
  for (const [id, name] of Object.entries(CHECK_DISPLAY)) {
    assert.equal(checkDisplayName(id as CheckId), name, id);
  }
  assert.deepEqual(
    LIFECYCLE_CHECK_ORDER.map((id) => checkDisplayName(id)),
    ['Stage Progression', 'MQL Qualification', 'Sales Handoff & Qualification', 'Opportunity Conversion'],
    'the four lifecycle rows read as the reference shows them',
  );
});

test('a check with no separate check name falls back to its formal label', () => {
  for (const id of CHECK_IDS) {
    if (CHECK_DISPLAY[id]) continue;
    assert.equal(checkDisplayName(id), PRESENTATION[id].label, `${id} should need no second name`);
  }
});

test('every area and every check can be named, with nothing blank', () => {
  for (const category of CATEGORIES) assert.ok(areaDisplayName(category).length > 0, category);
  for (const id of CHECK_IDS) assert.ok(checkDisplayName(id).length > 0, id);
});

/* ------------------------------------------------- identity is untouched */

test('the formal names survive for the audit surfaces', () => {
  assert.equal(AREAS['Data Quality'].label, 'Inbound Lead Data Integrity');
  assert.equal(AREAS['Lifecycle Governance'].label, 'Lifecycle Governance');
  assert.equal(PRESENTATION['lifecycle-conversion'].label, 'Converted Lifecycle State Not Substantiated');
  assert.equal(PRESENTATION['mql-integrity'].label, 'Marketing-Qualified Claims Not Substantiated');
});

test('a display name is never the thing anything is keyed on', () => {
  // Categories are the identity. Filtering still uses them, not the new names.
  for (const category of CATEGORIES) {
    const href = areaFilterHref(category);
    assert.equal(decodeURIComponent(href.split('=')[1]), category, `${category} filter`);
    assert.notEqual(
      decodeURIComponent(href.split('=')[1]),
      areaDisplayName(category),
      `${category} must not be filtered by its display name`,
    );
  }
});

test('detector ids are unchanged', () => {
  assert.deepEqual([...CHECK_IDS].sort(), [
    'ambiguous-match',
    'lifecycle-conversion',
    'lifecycle-progression',
    'missing-firmographics',
    'missing-territory',
    'mql-integrity',
    'routing-exceptions',
    'sales-acceptance-sql',
    'segment-consistency',
    'sla-risk',
    'stale-opportunities',
  ]);
});

test('the six areas are unchanged', () => {
  assert.equal(CATEGORIES.length, 6);
  assert.deepEqual([...CATEGORIES], [
    'Data Quality',
    'Routing',
    'Identity & Matching',
    'SLA Performance',
    'Pipeline Hygiene',
    'Lifecycle Governance',
  ]);
});

test('no Dashboard destination is fabricated', () => {
  /*
   * The reference set shows a Dashboard. The repository has no such route, so
   * nothing here may produce one - a link to a page that does not exist is the
   * one thing the navigation must never do.
   */
  const href = areaFilterHref('Data Quality');
  assert.ok(href.startsWith('/findings?'), 'areas route to Findings, the page that exists');
});
