/**
 * The minimal multi-system evidence contract (Step 10).
 *
 * WHAT THESE TESTS PROVE, AND WHAT THEY DO NOT. They prove that evidence
 * carries its own attribution, that a link is resolved through the source that
 * produced the record, and that the Salesforce rule is unchanged by the seam.
 *
 * They prove NOTHING about HubSpot. No HubSpot source exists, no adapter, no
 * connection and no fixture — a contract is not an implementation, and this
 * increment creates no runtime evidence for any source.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evidenceRecordUrl, SOURCE_LABEL } from '../lib/evidence-source.ts';
import { recordUrl } from '../lib/record-url.ts';
import { runAllChecks, CHECK_IDS } from '../lib/checks/index.ts';
import {
  FORECAST_PERIOD,
  GOVERNANCE,
  GOVERNED,
  lead,
  NO_HISTORY,
  opportunity,
  TODAY,
} from './fixtures.ts';

const HOST = 'example.my.salesforce.com';
const SF_ID = '006aj00000bKugvAAC';

/* ------------------------------------------------ 1. attribution travels */
test('every control states which system produced its evidence', () => {
  const results = runAllChecks(
    [lead({ Status: 'MQL' })],
    [opportunity()],
    TODAY,
    [GOVERNED],
    GOVERNANCE,
    NO_HISTORY,
    FORECAST_PERIOD,
  );
  assert.equal(results.length, CHECK_IDS.length, 'the active set is unchanged');
  for (const r of results) {
    assert.equal(r.source, 'salesforce', `${r.id} must attribute its evidence`);
  }
});

test('attribution is a field on the result, not an assumption at the edge', () => {
  /*
   * The point of carrying it on the result: whatever renders or exports a
   * finding reads provenance off the evidence itself rather than reconstructing
   * it, so a second source cannot be silently mis-attributed by a caller that
   * forgets to pass one.
   */
  const [first] = runAllChecks([lead()], [], TODAY, [GOVERNED], GOVERNANCE, NO_HISTORY, FORECAST_PERIOD);
  assert.ok(Object.hasOwn(first, 'source'));
  assert.equal(SOURCE_LABEL[first.source], 'Salesforce');
});

/* -------------------------------------------- 2. the Salesforce rule holds */
test('a Salesforce record resolves to exactly the URL the existing rule builds', () => {
  assert.equal(
    evidenceRecordUrl('salesforce', HOST, SF_ID),
    recordUrl(HOST, SF_ID),
    'the seam must not change the Salesforce link rule',
  );
  assert.equal(evidenceRecordUrl('salesforce', HOST, SF_ID), `https://${HOST}/lightning/r/${SF_ID}/view`);
});

test('an unknown tenant or a malformed id yields null, never a guessed URL', () => {
  assert.equal(evidenceRecordUrl('salesforce', undefined, SF_ID), null);
  assert.equal(evidenceRecordUrl('salesforce', HOST, ''), null);
  assert.equal(evidenceRecordUrl('salesforce', HOST, 'not-an-id'), null);
});

test('objectType is accepted and ignored by Salesforce, whose URLs do not use it', () => {
  assert.equal(
    evidenceRecordUrl('salesforce', HOST, SF_ID, 'Opportunity'),
    evidenceRecordUrl('salesforce', HOST, SF_ID),
    'the parameter exists for sources whose URLs embed the object, not for this one',
  );
});

/* ------------------------------------------------- 3. the contract's limits */
test('the contract normalises attribution and reachability, nothing else', () => {
  /*
   * Deliberately small. It does not normalise records: a Salesforce Lead and a
   * HubSpot contact are not the same object, and a shared record schema would
   * misrepresent both. Only two questions are answered here.
   */
  assert.equal(typeof evidenceRecordUrl, 'function');
  assert.deepEqual(Object.keys(SOURCE_LABEL), ['salesforce'], 'one source exists today');
});

test('no second source is implemented by this increment', () => {
  assert.ok(!('hubspot' in SOURCE_LABEL), 'Step 10 defines the contract; Step 11 implements a source');
});
