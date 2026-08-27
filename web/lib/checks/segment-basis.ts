/**
 * Reading the segmentation result Salesforce recorded on a Lead.
 *
 * `Segment_Basis__c` is written by `Lead_Inbound_Before_Save` at the moment
 * segmentation runs, and by nothing else. It is the only record in the org of
 * what segmentation actually decided, and - critically - of which version of
 * the Segment Band configuration decided it.
 *
 * THAT IS WHY THIS FILE EXISTS. Recomputing a historical Lead against today's
 * active bands would report a legitimate configuration change as record drift.
 * Reading the outcome the org recorded at the time cannot make that mistake:
 * the comparison is always the recorded result against the current Segment.
 *
 * The four formats below are the complete set the Flow can produce - taken
 * from its formula and assignment elements, not inferred from the data:
 *
 *   fxBasisResolved   "Employee Count: 500 -> Mid-Market | Rule v1.0"
 *   fxStrategicBasis  "Strategic Account: Acme Group | Rule v1.0"
 *   fxBasisNoBand     "Not segmentable: no active band matches employee count 7"
 *   literal           "Not segmentable: employee count missing"
 *
 * Anything else is reported as uninterpretable and left out of the score.
 * Honest exclusion over false precision: a guessed expected Segment would
 * manufacture a failure or hide one, and both are worse than saying so.
 *
 * Evaluator-facing wording is "Source Evidence" throughout.
 */

/** Which of the Flow's four segmentation outcomes the record carries. */
export type SegmentSourceKind =
  | 'band'
  | 'strategic'
  | 'no-band'
  | 'no-employee-count'
  | 'unrecognised';

export interface SegmentSourceEvidence {
  kind: SegmentSourceKind;
  /**
   * The Segment this evidence supports. `null` means the evidence supports no
   * Segment at all - which is a result, not an absence of one.
   */
  expectedSegment: string | null;
  /**
   * Where the expected Segment comes from, named so it can be read by someone
   * who has never seen this org: "Salesforce Custom Metadata · Segment Band v1.0".
   */
  sourceLabel: string;
  /** The input-to-result relationship: "Employee Count 500 → Mid-Market". */
  sourceDetail: string;
  /** The employee count as the evidence recorded it, where it carries one. */
  employeeCount: number | null;
  /** The configuration version as the evidence recorded it, e.g. "v1.0". */
  ruleVersion: string | null;
}

/**
 * `varRuleVersion` in the Flow is assigned from `Segment_Band__mdt.Rule_Version__c`,
 * so a version appearing in a recorded basis came from that Custom Metadata and
 * from nowhere else. Naming the type in the label is a statement about the
 * configuration the Flow read, not a guess about the string.
 */
const CUSTOM_METADATA = 'Salesforce Custom Metadata · Segment Band';

const BAND = /^Employee Count: (-?\d+) -> (.+) \| Rule (\S+)$/;
const STRATEGIC = /^Strategic Account: (.+) \| Rule (\S+)$/;
const NO_BAND = /^Not segmentable: no active band matches employee count (-?\d+)$/;
const NO_EMPLOYEE_COUNT = 'Not segmentable: employee count missing';

/**
 * Interpret one recorded segmentation result.
 *
 * Returns `null` when the Lead carries no evidence at all - a different fact
 * from evidence that cannot be read, and reported differently.
 */
export function interpretSegmentBasis(basis: string | null): SegmentSourceEvidence | null {
  const text = basis?.trim() ?? '';
  if (text === '') return null;

  const band = BAND.exec(text);
  if (band) {
    const employees = Number(band[1]);
    const segment = band[2].trim();
    const version = band[3].trim();
    return {
      kind: 'band',
      expectedSegment: segment,
      sourceLabel: `${CUSTOM_METADATA} ${version}`,
      sourceDetail: `Employee Count ${employees} → ${segment}`,
      employeeCount: employees,
      ruleVersion: version,
    };
  }

  const strategic = STRATEGIC.exec(text);
  if (strategic) {
    const account = strategic[1].trim();
    const version = strategic[2].trim();
    /*
     * A different authority, named as one. Strategic is designated on the
     * Account rather than derived from a band, so claiming Custom Metadata
     * decided it would be false even though the version string beside it did
     * come from there.
     */
    return {
      kind: 'strategic',
      expectedSegment: 'Strategic',
      sourceLabel: `Salesforce Account designation · Strategic Account · Rule ${version}`,
      sourceDetail: `${account} → Strategic`,
      employeeCount: null,
      ruleVersion: version,
    };
  }

  const noBand = NO_BAND.exec(text);
  if (noBand) {
    const employees = Number(noBand[1]);
    return {
      kind: 'no-band',
      expectedSegment: null,
      sourceLabel: CUSTOM_METADATA,
      sourceDetail: `Employee Count ${employees} matched no active band → no Segment`,
      employeeCount: employees,
      ruleVersion: null,
    };
  }

  if (text === NO_EMPLOYEE_COUNT) {
    return {
      kind: 'no-employee-count',
      expectedSegment: null,
      sourceLabel: 'Salesforce Flow · NorthstarIQ Lead intake',
      sourceDetail: 'Employee Count missing → no Segment',
      employeeCount: null,
      ruleVersion: null,
    };
  }

  return {
    kind: 'unrecognised',
    expectedSegment: null,
    sourceLabel: 'Not recognised',
    sourceDetail: text,
    employeeCount: null,
    ruleVersion: null,
  };
}

/** One cell an evaluator can read without the application around it. */
export function sourceEvidenceCell(e: SegmentSourceEvidence): string {
  return `${e.sourceLabel} · ${e.sourceDetail}`;
}

/** A Segment for display. Blank is a real outcome, so it is named, not empty. */
export function segmentLabel(segment: string | null): string {
  return segment ?? '— (none)';
}

/** `Segment__c` as a comparable value: an empty picklist reads as no Segment. */
export function currentSegment(value: string | null): string | null {
  const s = value?.trim() ?? '';
  return s === '' ? null : s;
}
