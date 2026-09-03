/**
 * The two governed policies behind the Marketing → Sales handoff, as
 * NorthstarIQ reads them, plus the readers for the evidence they leave behind.
 *
 * THE BUSINESS DEFINITIONS ARE NOT HERE. What Sales acceptance requires lives
 * in `Sales_Acceptance_Policy__mdt`; what sales qualification requires lives in
 * `SQL_Qualification_Policy__mdt`. Those are the same two records
 * `Lead_Inbound_Before_Save` consults before permitting the transition. This
 * module shapes those reads into something the control can evaluate, and knows
 * how to read back the evidence the Flow wrote.
 *
 * TWO POLICIES, NOT ONE. They are kept separate all the way through - separate
 * types in Salesforce, separate interfaces here, separate versions - because
 * acceptance and qualification are different business events. Sales accepting
 * responsibility for a Marketing-qualified Lead is not the same fact as Sales
 * having established a genuine pursuit, and collapsing them would make the
 * handoff unreadable in exactly the place the business argues about it.
 */
import type { SalesAcceptancePolicyRecord, SqlPolicyRecord } from '../soql.ts';

/** The active Sales acceptance policy, in the shape the control evaluates. */
export interface SalesAcceptancePolicy {
  version: string | null;
  acceptedStage: string;
  requireExplicitAcceptance: boolean;
  requireMqlEvidence: boolean;
  /**
   * Whether acceptance requires an individual User owner rather than a queue.
   *
   * A NorthstarIQ policy decision, not Salesforce behaviour. It is read here
   * from the same record `Lead_Inbound_Before_Save` consults, so switching it
   * off in Salesforce stops the safeguard enforcing it and stops this control
   * reporting it, in one change.
   */
  requireIndividualOwner: boolean;
  /**
   * How long Sales has, from valid MQL entry, to accept or explicitly reject
   * the handoff - or `null` where the policy issues no commitment at all.
   *
   * A NorthstarIQ policy decision, and a DIFFERENT COMMITMENT from the 4-hour
   * first-touch response SLA held per segment on `Segment_Band__mdt`: that one
   * starts at intake and stops at first touch, this one starts at MQL and
   * stops at a seller decision.
   *
   * Read here only so the assessment can state which commitment was in force.
   * It is NEVER used to recompute a deadline: the Flow persists
   * `Acceptance_Due_DateTime__c` as issued, and that stamp is what gets
   * judged, so changing this value cannot retroactively move a commitment a
   * Lead was already given.
   */
  acceptanceSlaHours: number | null;
}

/** The active SQL qualification policy, in the shape the control evaluates. */
export interface SqlQualificationPolicy {
  version: string | null;
  qualifiedStage: string;
  requireAcceptanceEvidence: boolean;
  requireConfirmedNeed: boolean;
  requireNextStep: boolean;
}

/**
 * Raised when either governed definition cannot be read.
 *
 * A missing or ambiguous policy is NOT "everything passes". Absence of
 * governance is a diagnostic failure, and the control refuses to report
 * compliance it cannot substantiate - the contract `MqlPolicyUnavailableError`
 * and `LifecyclePolicyUnavailableError` already carry. The control is unscored
 * and outside `runAllChecks`, so this can never destabilise the live
 * assessment.
 */
export class SalesPolicyUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesPolicyUnavailableError';
  }
}

/**
 * Exactly one active record, or refuse.
 *
 * Salesforce cannot enforce "one active record per governed stage" on Custom
 * Metadata, so the runtime checks rather than taking the first row and hoping.
 */
function only<T>(records: T[], noun: string): T {
  if (records.length === 0) {
    throw new SalesPolicyUnavailableError(
      `No active ${noun} was found in Salesforce. NorthstarIQ will not report Leads as compliant with a governed definition it cannot read.`,
    );
  }
  if (records.length > 1) {
    throw new SalesPolicyUnavailableError(
      `${records.length} active ${noun} records were found in Salesforce. Exactly one is expected per governed stage, and NorthstarIQ will not choose between them.`,
    );
  }
  return records[0];
}

export function resolveSalesAcceptancePolicy(
  records: SalesAcceptancePolicyRecord[],
): SalesAcceptancePolicy {
  const r = only(records, 'Sales acceptance policy');
  const stage = (r.Accepted_Stage__c ?? '').trim();
  if (stage === '') {
    throw new SalesPolicyUnavailableError(
      'The active Sales acceptance policy does not name the lifecycle stage it governs, so NorthstarIQ cannot tell which Leads it applies to.',
    );
  }
  return {
    version: r.Policy_Version__c,
    acceptedStage: stage,
    requireExplicitAcceptance: r.Require_Explicit_Acceptance__c === true,
    requireMqlEvidence: r.Require_MQL_Evidence__c === true,
    requireIndividualOwner: r.Require_Individual_Owner__c === true,
    acceptanceSlaHours:
      typeof r.Acceptance_SLA_Hours__c === 'number' && r.Acceptance_SLA_Hours__c > 0
        ? r.Acceptance_SLA_Hours__c
        : null,
  };
}

export function resolveSqlQualificationPolicy(records: SqlPolicyRecord[]): SqlQualificationPolicy {
  const r = only(records, 'SQL qualification policy');
  const stage = (r.Qualified_Stage__c ?? '').trim();
  if (stage === '') {
    throw new SalesPolicyUnavailableError(
      'The active SQL qualification policy does not name the lifecycle stage it governs, so NorthstarIQ cannot tell which Leads it applies to.',
    );
  }
  return {
    version: r.Policy_Version__c,
    qualifiedStage: stage,
    requireAcceptanceEvidence: r.Require_Acceptance_Evidence__c === true,
    requireConfirmedNeed: r.Require_Confirmed_Need__c === true,
    requireNextStep: r.Require_Next_Step__c === true,
  };
}

/*
 * READING THE EVIDENCE BACK.
 *
 * The Flow writes one sentence per governed decision, assembled from only the
 * requirements the policy declared at the time:
 *
 *   "Accepted under Sales Acceptance Policy v1.0: explicit seller acceptance
 *    recorded; Marketing handoff substantiated by MQL evidence"
 *
 *   "Qualified under SQL Policy v1.0: need Forecast Accuracy; next step
 *    2026-09-15; substantiated Sales acceptance"
 *
 * These readers parse only what the Flow demonstrably writes. They are NOT a
 * general evidence grammar and NOT a second definition of the policy: a clause
 * that is absent means the requirement was not declared when the decision was
 * made, which is exactly the fact the control needs.
 */

/** The acceptance policy version recorded on the Lead, or null if unstated. */
export function recordedAcceptanceVersion(basis: string | null): string | null {
  if (!basis) return null;
  const m = /Sales Acceptance Policy\s+(v[\w.]+)/.exec(basis);
  return m ? m[1] : null;
}

/** The SQL policy version recorded on the Lead, or null if unstated. */
export function recordedSqlVersion(basis: string | null): string | null {
  if (!basis) return null;
  const m = /SQL Policy\s+(v[\w.]+)/.exec(basis);
  return m ? m[1] : null;
}

/**
 * The business need as it stood when SQL was granted.
 *
 * Read from the basis rather than from `Qualified_Need__c`, which is a seller
 * picklist that may legitimately have been changed since - a need that moved
 * on after qualification is not evidence the qualification was wrong.
 */
export function recordedQualifiedNeed(basis: string | null): string | null {
  if (!basis) return null;
  const m = /need\s+([^;]+)/.exec(basis);
  return m ? m[1].trim() : null;
}

/**
 * The next-step date as it stood when SQL was granted, as `YYYY-MM-DD`.
 *
 * THIS IS THE FIELD THAT MAKES HISTORICAL EVALUATION POSSIBLE. The preventive
 * gate required `Next_Step_Date__c >= TODAY` at the moment of qualification,
 * so the live field naturally falls into the past afterwards and testing it
 * against today would manufacture failures out of time passing. The date
 * recorded here is the one the decision was actually made on.
 *
 * Returns null when the clause is absent or is not a date, which the control
 * reads as "the requirement was not declared then" or "cannot be read" - never
 * as a pass.
 */
export function recordedNextStepDate(basis: string | null): string | null {
  if (!basis) return null;
  const m = /next step\s+(\d{4}-\d{2}-\d{2})/.exec(basis);
  return m ? m[1] : null;
}

/** Human-readable list of the requirements each active policy switches on. */
export function acceptanceRequirementLabels(p: SalesAcceptancePolicy): string[] {
  const labels: string[] = [];
  if (p.requireExplicitAcceptance) labels.push('a named seller explicitly accepted the Lead');
  if (p.requireMqlEvidence) labels.push('the Marketing handoff it accepted was itself substantiated');
  if (p.requireIndividualOwner) labels.push('an individual seller, not a queue, is accountable for it');
  return labels;
}

export function sqlRequirementLabels(p: SqlQualificationPolicy): string[] {
  const labels: string[] = [];
  if (p.requireAcceptanceEvidence) labels.push('Sales had already accepted the Lead');
  if (p.requireConfirmedNeed) labels.push('a governed business need was confirmed with the prospect');
  if (p.requireNextStep) labels.push('a next step was agreed and dated no earlier than the qualification');
  return labels;
}
