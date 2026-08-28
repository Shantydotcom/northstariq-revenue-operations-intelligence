/**
 * The governed MQL qualification policy, as NorthstarIQ reads it.
 *
 * THE BUSINESS DEFINITION IS NOT HERE. Which requirements constitute MQL lives
 * in `MQL_Qualification_Policy__mdt`, which segments qualify lives on
 * `Segment_Band__mdt.MQL_Eligible__c`, and which sources are governed lives in
 * `Routing_Readiness_Source__mdt` - the same three records the Salesforce
 * preventive Flow consults. This module only shapes those reads into something
 * the control can evaluate, and knows how to test each of the four requirement
 * types the policy can switch on.
 *
 * That split is deliberate. Explicit execution code for four known requirement
 * types is fine; independently deciding that MQL means source + segment +
 * territory + match would not be, because the policy record would stop being
 * the definition.
 */
import type { MqlPolicyRecord } from '../soql.ts';

/** The active policy, in the shape the control evaluates against. */
export interface MqlPolicy {
  version: string | null;
  qualifiedStage: string;
  requireGovernedSource: boolean;
  requireEligibleSegment: boolean;
  requireRoutableTerritory: boolean;
  requireUnambiguousMatch: boolean;
}

/**
 * Raised when governance cannot be read.
 *
 * A missing or ambiguous policy is NOT "everything passes". Absence of
 * governance is a diagnostic failure, and this control refuses to report
 * compliance it cannot substantiate. The control is unscored and is not run by
 * `runAllChecks`, so this can never destabilise the live assessment.
 */
export class MqlPolicyUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MqlPolicyUnavailableError';
  }
}

/**
 * Resolve exactly one active policy, or refuse.
 *
 * Salesforce cannot enforce "one active record per governed stage" on Custom
 * Metadata - the repository validator asserts it instead - so the runtime has to
 * check as well rather than take the first row and hope.
 */
export function resolveMqlPolicy(records: MqlPolicyRecord[]): MqlPolicy {
  if (records.length === 0) {
    throw new MqlPolicyUnavailableError(
      'No active MQL qualification policy was found in Salesforce. NorthstarIQ will not report Leads as compliant with a governed definition it cannot read.',
    );
  }
  if (records.length > 1) {
    throw new MqlPolicyUnavailableError(
      `${records.length} active MQL qualification policies were found in Salesforce. Exactly one is expected per governed stage, and NorthstarIQ will not choose between them.`,
    );
  }
  const [r] = records;
  const stage = (r.Qualified_Stage__c ?? '').trim();
  if (stage === '') {
    throw new MqlPolicyUnavailableError(
      'The active MQL qualification policy does not name the lifecycle stage it governs, so NorthstarIQ cannot tell which Leads it applies to.',
    );
  }
  return {
    version: r.Policy_Version__c,
    qualifiedStage: stage,
    requireGovernedSource: r.Require_Governed_Source__c === true,
    requireEligibleSegment: r.Require_MQL_Eligible_Segment__c === true,
    requireRoutableTerritory: r.Require_Routable_Territory__c === true,
    requireUnambiguousMatch: r.Require_Unambiguous_Match__c === true,
  };
}

/**
 * The policy version recorded on the Lead when it qualified.
 *
 * `MQL_Basis__c` ends with "| MQL Policy v1.1" - the version in force at the
 * moment of qualification. Reading it back is what stops the control judging a
 * record against a definition that did not exist when it was qualified.
 *
 * Returns null when the basis carries no version, which is treated as
 * unknown rather than as a match.
 */
export function recordedPolicyVersion(basis: string | null): string | null {
  if (!basis) return null;
  const m = /MQL Policy\s+(v[\w.]+)/.exec(basis);
  return m ? m[1] : null;
}

/** Human-readable list of the requirements the active policy switches on. */
export function activeRequirementLabels(policy: MqlPolicy): string[] {
  const labels: string[] = [];
  if (policy.requireGovernedSource) labels.push('the Lead came through a governed acquisition source');
  if (policy.requireEligibleSegment) labels.push('its segment is one the business qualifies');
  if (policy.requireRoutableTerritory) labels.push('a governed territory was resolved');
  if (policy.requireUnambiguousMatch) labels.push('its account match is unambiguous');
  return labels;
}
