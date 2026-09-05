import type { CheckId } from './types.ts';

/**
 * Salesforce dependencies.
 *
 * For each check, the Salesforce configuration that actually reads or writes
 * the fields the check reasons over.
 *
 * EVERY ROW BELOW IS SUBSTANTIATED BY A FILE IN force-app/. Nothing is
 * inferred, and nothing is added to make a table look complete. Where a check
 * has no established Salesforce dependency, `usages` is empty and the interface
 * says so plainly rather than manufacturing one.
 *
 * One row per field per component. Country and employee count reach the same
 * Flow but drive different decisions - territory and segment - so they are
 * separate rows. A reader asking "which field caused this" should not have to
 * unpick a cell holding two fields behind one merged explanation.
 *
 * This is a bounded, hand-verified map for a portfolio assessment - not a
 * metadata crawler and not a dependency-analysis engine. It is maintained the
 * same way the rest of the configuration is: by reading the source.
 *
 * Verified against force-app on 2026-08-26 by locating each field API name in
 * the metadata that references it.
 */

export type UsageType =
  | 'Flow'
  | 'Formula field'
  | 'Custom Metadata'
  | 'Queue'
  | 'Report'
  /* A declarative save-time safeguard. Distinct from Flow: it can only REFUSE a
   * save, never write a value - which is why it is the right mechanism where
   * automation must not manufacture a user's decision. */
  | 'Validation rule'
  /* A governed picklist taxonomy. Distinct from Custom Metadata: it
   * constrains a standard field's values rather than holding rule rows. */
  | 'Standard value set';

export interface Usage {
  /** The Salesforce object the field lives on. */
  object: string;
  /** Field API name, unqualified - the object is its own column. */
  field: string;
  /** The automation, rule or component name as it exists in Salesforce. */
  name: string;
  type: UsageType;
  /**
   * Why this dependency matters to this control, in operational language.
   *
   * Answers what the configuration does with the field, not how it is built.
   * The implementation is one click away in Salesforce.
   */
  purpose: string;
  /** Repository path proving it. Relative to the repository root. */
  evidencePath: string;
}

export interface Traceability {
  /** The Salesforce fields this check reads. */
  fields: string[];
  usages: Usage[];
  /**
   * Set when no Salesforce configuration reference could be established.
   * Stated rather than left as an empty table with no explanation.
   */
  noneEstablished?: string;
}

const FLOW_NAME = 'Lead_Inbound_Before_Save';
const FLOW = 'force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml';
const CMDT = 'force-app/main/default/customMetadata';
const REPORTS = 'force-app/main/default/reports/unfiled$public';
const LEAD_FIELDS = 'force-app/main/default/objects/Lead/fields';

/** A Lead field the intake Flow reads or writes. */
const flow = (field: string, purpose: string): Usage => ({
  object: 'Lead',
  field,
  name: FLOW_NAME,
  type: 'Flow',
  purpose,
  evidencePath: FLOW,
});

/** A Lead formula field deriving from another Lead field. */
const formula = (field: string, name: string, purpose: string): Usage => ({
  object: 'Lead',
  field,
  name,
  type: 'Formula field',
  purpose,
  evidencePath: `${LEAD_FIELDS}/${name}.field-meta.xml`,
});

export const TRACEABILITY: Record<CheckId, Traceability> = {
  'missing-firmographics': {
    fields: ['LeadSource', 'NumberOfEmployees', 'CountryCode', 'Data_Quality_Status__c', 'Data_Quality_Detail__c'],
    usages: [
      {
        object: 'Lead',
        field: 'LeadSource',
        name: 'Routing_Readiness_Source__mdt',
        type: 'Custom Metadata',
        purpose: 'Sets which Lead Sources carry this requirement',
        evidencePath: CMDT,
      },
      flow('CountryCode', 'Determines territory'),
      flow('NumberOfEmployees', 'Determines segment'),
      formula(
        'CountryCode',
        'Data_Quality_Status__c',
        'Flags missing Country',
      ),
      formula(
        'NumberOfEmployees',
        'Data_Quality_Status__c',
        'Flags missing Employee Count',
      ),
      formula(
        'CountryCode',
        'Data_Quality_Detail__c',
        'Names Country as the missing attribute',
      ),
      formula(
        'NumberOfEmployees',
        'Data_Quality_Detail__c',
        'Names Employee Count as the missing attribute',
      ),
      {
        object: 'Lead',
        field: 'NumberOfEmployees',
        name: 'Segment_Band__mdt',
        type: 'Custom Metadata',
        purpose: 'Employee-count bands the segment is read from',
        evidencePath: CMDT,
      },
      {
        object: 'Lead',
        field: 'CountryCode',
        name: 'Routing_Rule__mdt',
        type: 'Custom Metadata',
        purpose: 'Coverage map the territory is read from',
        evidencePath: CMDT,
      },
    ],
  },

  'segment-consistency': {
    fields: ['NumberOfEmployees', 'Segment__c', 'Segment_Basis__c'],
    usages: [
      flow('NumberOfEmployees', 'Input \u2014 the employee count segmentation reads'),
      flow(
        'Segment_Basis__c',
        'Source Evidence \u2014 records the employee count, the Segment it resolved to, and the rule version that decided it',
      ),
      flow('Segment__c', 'Result \u2014 the Segment segmentation assigned, and the value this control checks'),
      {
        object: 'Lead',
        field: 'NumberOfEmployees',
        name: 'Segment Band (Segment_Band__mdt)',
        type: 'Custom Metadata',
        purpose:
          'Salesforce Configuration \u2014 the employee-count bands, and the rule version, the expected Segment is read from',
        evidencePath: CMDT,
      },
    ],
  },

  'lifecycle-progression': {
    fields: ['Status', 'Lifecycle_Stage_Entered__c', 'MQL_Basis__c', 'Sales_Accepted_At__c', 'SQL_Basis__c', 'ConvertedDate'],
    usages: [
      {
        object: 'Lead',
        field: 'Status',
        name: 'Lifecycle_Transition__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence \u2014 the governed set of permitted stage-to-stage transitions. The only definition of the lifecycle model, read by this control and by the preventive Flow.',
        evidencePath: 'force-app/main/default/customMetadata',
      },
      {
        object: 'Lead',
        field: 'Status',
        name: 'LeadStatus',
        type: 'Standard value set',
        purpose: 'Source Evidence \u2014 the governed stage taxonomy the transitions are expressed in',
        evidencePath: 'force-app/main/default/standardValueSets/LeadStatus.standardValueSet-meta.xml',
      },
      flow(
        'Lifecycle_Stage_Entered__c',
        'Implementation Evidence \u2014 the preventive safeguard. The intake Flow blocks a status change the policy does not permit, and stamps this timestamp on every transition it allows. It is the only writer, and its presence is how this control tells a governed record from one that progressed before governance existed.',
      ),
    ],
    noneEstablished:
      'Salesforce retains no complete lifecycle history, and nothing ever did. Field history is bounded, was not tracked from the beginning, and never records a Lead\u2019s initial status \u2014 so for most baseline records the earlier progression simply cannot be reconstructed. Those Leads are reported as unmeasurable rather than as failures, because missing history is absence of evidence and not evidence of a breach.',
  },

  'mql-integrity': {
    fields: ['LeadSource', 'Segment__c', 'Territory__c', 'Match_Status__c', 'MQL_Basis__c', 'Status'],
    usages: [
      {
        object: 'Lead',
        field: 'MQL_Basis__c',
        name: 'MQL_Qualification_Policy__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence \u2014 the governed definition of MQL: which requirements apply, which stage they govern, and the version in force. Read by this control and by the preventive Flow, so both consume one definition.',
        evidencePath:
          'force-app/main/default/customMetadata/MQL_Qualification_Policy.NorthstarIQ_MQL_v1_1.md-meta.xml',
      },
      {
        object: 'Lead',
        field: 'LeadSource',
        name: 'Routing_Readiness_Source__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence \u2014 which acquisition sources are held to a routing-readiness standard',
        evidencePath: 'force-app/main/default/customMetadata',
      },
      {
        object: 'Lead',
        field: 'Segment__c',
        name: 'Segment_Band__mdt',
        type: 'Custom Metadata',
        purpose: 'Source Evidence \u2014 which segments the business qualifies for a seller-led motion',
        evidencePath: 'force-app/main/default/objects/Segment_Band__mdt/fields/MQL_Eligible__c.field-meta.xml',
      },
      flow(
        'MQL_Basis__c',
        'Implementation Evidence \u2014 the preventive safeguard. The intake Flow evaluates the same policy before permitting entry to the qualified stage, and writes this field only when every declared requirement passed. It is the only writer; the field is read-only in every permission set.',
      ),
    ],
    noneEstablished:
      'Nothing enforces that a Lead which claimed MQL *before* this architecture existed carries any evidence at all \u2014 the field did not exist when those records were created. Those Leads are reported as unmeasurable rather than as failures, because missing evidence is a gap in coverage and not a demonstrated violation.',
  },

  'seller-decision-timeliness': {
    fields: [
      'Status',
      'MQL_Basis__c',
      'Acceptance_Due_DateTime__c',
      'Acceptance_Status__c',
      'Sales_Accepted_At__c',
      'Sales_Rejected_At__c',
      'Sales_Rejection_Reason__c',
      'OwnerId',
    ],
    usages: [
      {
        object: 'Lead',
        field: 'Acceptance_Due_DateTime__c',
        name: 'Sales_Acceptance_Policy__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence — the governed decision commitment: how long Sales has, from valid MQL entry, to accept or explicitly reject the handoff, and the policy version that issued it. A version declaring no decision hours issues no commitment, so the capability stays dormant until the governing version turns it on.',
        evidencePath:
          'force-app/main/default/objects/Sales_Acceptance_Policy__mdt/fields/Acceptance_SLA_Hours__c.field-meta.xml',
      },
      {
        object: 'Lead',
        field: 'Acceptance_Due_DateTime__c',
        name: 'Lead_Inbound_Before_Save',
        type: 'Flow',
        purpose:
          'Issues and pins the deadline at the moment Marketing qualification is granted, using the documented weekend-aware approximation — not Salesforce Business Hours, and not holiday-aware. Persisted rather than derived because a formula cannot follow the active policy, and because a pinned commitment cannot be moved retroactively by a later policy change.',
        evidencePath:
          'force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml',
      },
      {
        object: 'Lead',
        field: 'Acceptance_Status__c',
        name: 'Acceptance_Status__c',
        type: 'Formula field',
        purpose:
          'Derives the current decision state from the pinned deadline and the two decision stamps, in one precedence Salesforce and NorthstarIQ both read. There is deliberately no malformed state: a malformed decision never persists, because the Flow blocks the save and the transaction rolls back.',
        evidencePath:
          'force-app/main/default/objects/Lead/fields/Acceptance_Status__c.field-meta.xml',
      },
      {
        object: 'Lead',
        field: 'Sales_Rejection_Reason__c',
        name: 'Sales_Rejection_Reason__c',
        type: 'Standard value set',
        purpose:
          'The governed rejection vocabulary, restricted so Salesforce refuses anything outside it. Four values, each routing to a different upstream owner. Populating it is the act of rejecting, which stops the decision clock exactly as an acceptance does.',
        evidencePath:
          'force-app/main/default/objects/Lead/fields/Sales_Rejection_Reason__c.field-meta.xml',
      },
    ],
  },
  'sales-acceptance-sql': {
    fields: [
      'Status',
      'MQL_Basis__c',
      'Sales_Accepted_At__c',
      'Sales_Accepted_By__c',
      'Sales_Acceptance_Basis__c',
      'SQL_Basis__c',
      'Qualified_Need__c',
      'Next_Step_Date__c',
      'Lifecycle_Stage_Entered__c',
    ],
    usages: [
      {
        object: 'Lead',
        field: 'Sales_Acceptance_Basis__c',
        name: 'Sales_Acceptance_Policy__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence — the governed definition of Sales acceptance: which requirements apply, which stage they govern, and the version in force. Read by this control and by the preventive Flow, so both consume one definition.',
        evidencePath:
          'force-app/main/default/customMetadata/Sales_Acceptance_Policy.NorthstarIQ_SAL_v1.md-meta.xml',
      },
      {
        object: 'Lead',
        field: 'SQL_Basis__c',
        name: 'SQL_Qualification_Policy__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence — the governed definition of sales qualification, held separately from acceptance because they are separate business events with separate requirements and separate versions.',
        evidencePath:
          'force-app/main/default/customMetadata/SQL_Qualification_Policy.NorthstarIQ_SQL_v1.md-meta.xml',
      },
      flow(
        'Sales_Accepted_At__c',
        'Implementation Evidence — the preventive acceptance safeguard. The intake Flow evaluates the acceptance policy before permitting the accepted stage, and writes the time, the accepting identity and the basis in one assignment only when every declared requirement passed. It is the only writer; all three are read-only in every permission set.',
      ),
      flow(
        'SQL_Basis__c',
        'Implementation Evidence — the preventive qualification safeguard. The intake Flow evaluates the SQL policy before permitting the qualified stage and records the business need and the next-step date as they stood at that moment. It is the only writer, which is what makes the recorded next-step date safe to judge historically.',
      ),
      flow(
        'Lifecycle_Stage_Entered__c',
        'Implementation Evidence — the stage-entry stamp. Read here for one purpose only: establishing when a Lead entered the qualified stage, so its recorded next-step date is judged against the decision it belonged to rather than against today.',
      ),
    ],
    noneEstablished:
      'The seller inputs behind these decisions — `Sales_Accepted__c`, `Qualified_Need__c` and `Next_Step_Date__c` — have no automation preserving them. They are editable after the fact, so their current values are not evidence of what was true when the handoff was made, and no NorthstarIQ configuration makes them so. That is why the control judges the immutable basis fields instead. Nothing enforces that a Lead which claimed the Sales handoff **before** this architecture existed carries any evidence at all; those Leads are reported as unmeasurable rather than as failures.',
  },

  'lifecycle-conversion': {
    fields: [
      'Status',
      'IsConverted',
      'ConvertedDate',
      'ConvertedAccountId',
      'ConvertedContactId',
      'ConvertedOpportunityId',
    ],
    usages: [
      {
        object: 'Lead',
        field: 'Status',
        name: 'LeadStatus',
        type: 'Standard value set',
        purpose:
          'Source Evidence \u2014 the governed status taxonomy, one value of which carries Salesforce\u2019s converted marker',
        evidencePath: 'force-app/main/default/standardValueSets/LeadStatus.standardValueSet-meta.xml',
      },
      {
        object: 'Lead',
        field: 'Status',
        name: 'Lifecycle_Transition__mdt',
        type: 'Custom Metadata',
        purpose:
          'Source Evidence \u2014 the governed set of permitted stage-to-stage transitions, including the routes into the converted stage. It decides whether entry into that stage is PERMITTED. It does not, and cannot, establish whether Salesforce actually converted the Lead \u2014 that is the platform\u2019s own fact, and it is what this control judges.',
        evidencePath: 'force-app/main/default/customMetadata',
      },
      flow(
        'Status',
        'Implementation Evidence \u2014 the preventive safeguard. A change of status is an entry condition of the intake Flow, which checks the move against the governed transition policy and blocks the save when no permitted transition matches. Native Salesforce Lead Conversion was verified to take the same path: an unsupported conversion is refused and the whole transaction rolls back. The Flow never writes Status, and it writes none of the conversion fields.',
      ),
    ],
    noneEstablished:
      'The conversion fields themselves have no NorthstarIQ configuration behind them: `IsConverted`, `ConvertedDate`, `ConvertedAccountId`, `ConvertedContactId` and `ConvertedOpportunityId` are written by the Salesforce platform during Lead Conversion and by nothing in this repository. That is precisely why the control treats them as authoritative, and why no row above claims to govern them. **A preventive safeguard now exists for the transition into the converted stage** \u2014 the intake Flow enforcing `Lifecycle_Transition__mdt`, verified against native Lead Conversion on 2026-08-27 \u2014 but it governs new transitions only. It could not reach the records that already held a converted status when it was built, which is why an independent detective control still has work to do.',
  },

  'routing-exceptions': {
    fields: ['OwnerId', 'Exception_Type__c', 'Routing_Reason__c'],
    usages: [
      flow('OwnerId', 'Assigns the exception queue when no owner can be resolved'),
      flow('Exception_Type__c', 'Records why routing stopped'),
      flow('Routing_Reason__c', 'Records the routing decision'),
      {
        object: 'Lead',
        field: 'OwnerId',
        name: 'NIQ Routing Exception',
        type: 'Queue',
        purpose: 'Holds Leads awaiting RevOps triage',
        evidencePath: 'force-app/main/default/queues/NIQ_Routing_Exception.queue-meta.xml',
      },
      formula(
        'Routing_Reason__c',
        'SLA_Status__c',
        'Excludes exception Leads from seller SLA',
      ),
    ],
  },

  'sla-risk': {
    fields: ['SLA_Status__c', 'SLA_Target_DateTime__c', 'First_Touch_DateTime__c', 'Segment__c'],
    usages: [
      flow('SLA_Target_DateTime__c', 'Sets the response deadline at intake'),
      flow(
        'First_Touch_DateTime__c',
        'Records when the seller first responded',
      ),
      formula(
        'SLA_Target_DateTime__c',
        'SLA_Status__c',
        'Deadline the response is measured against',
      ),
      formula(
        'First_Touch_DateTime__c',
        'SLA_Status__c',
        'Decides whether the SLA was met or breached',
      ),
      {
        object: 'Lead',
        field: 'Segment__c',
        name: 'Segment_Band__mdt',
        type: 'Custom Metadata',
        purpose: 'Sets response hours per segment',
        evidencePath: CMDT,
      },
      {
        object: 'Lead',
        field: 'SLA_Status__c',
        name: 'NIQ Open SLA Risk',
        type: 'Report',
        purpose: 'Reports Leads at risk or breached',
        evidencePath: `${REPORTS}/NIQ_Open_SLA_Risk.report-meta.xml`,
      },
      {
        object: 'Lead',
        field: 'SLA_Status__c',
        name: 'NIQ SLA Attainment by Segment',
        type: 'Report',
        purpose: 'Reports SLA attainment by segment',
        evidencePath: `${REPORTS}/NIQ_SLA_Attainment_by_Segment.report-meta.xml`,
      },
    ],
  },

  'ambiguous-match': {
    fields: ['Match_Status__c', 'Matched_Account__c', 'Normalized_Domain__c'],
    usages: [
      flow('Normalized_Domain__c', 'Builds the domain match key'),
      flow('Match_Status__c', 'Records the account match outcome'),
      flow('Matched_Account__c', 'Attaches the Account on a single match'),
      {
        object: 'Account',
        field: 'Normalized_Domain__c',
        name: 'Normalized_Domain__c',
        type: 'Formula field',
        purpose: 'Provides the Account side of the match key',
        evidencePath:
          'force-app/main/default/objects/Account/fields/Normalized_Domain__c.field-meta.xml',
      },
    ],
  },

  'missing-territory': {
    fields: ['Territory__c', 'CountryCode', 'Exception_Type__c'],
    usages: [
      flow('CountryCode', 'Selects the territory rule'),
      flow(
        'Territory__c',
        'Assigns the territory',
      ),
      flow('Exception_Type__c', 'Records missing or uncovered geography'),
      {
        object: 'Lead',
        field: 'Territory__c',
        name: 'Routing_Rule__mdt',
        type: 'Custom Metadata',
        purpose:
          'Coverage map — adding a market is a configuration record, not a deployment',
        evidencePath: CMDT,
      },
      {
        object: 'Lead',
        field: 'Territory__c',
        name: 'NIQ Open SLA Risk',
        type: 'Report',
        purpose: 'Reports SLA risk by territory',
        evidencePath: `${REPORTS}/NIQ_Open_SLA_Risk.report-meta.xml`,
      },
    ],
  },

  'closed-lost-reason': {
    fields: ['IsClosed', 'IsWon', 'StageName', 'Loss_Reason__c', 'CloseDate', 'Amount'],
    usages: [
      {
        object: 'Opportunity',
        field: 'Loss_Reason__c',
        name: 'Loss_Reason__c',
        type: 'Standard value set',
        purpose:
          'Source Evidence — the governed loss vocabulary, restricted to four values so Salesforce refuses anything outside it before a rule or the assessment runs. Presence of a value is what this control judges; membership is guaranteed by the picklist and never re-tested.',
        evidencePath:
          'force-app/main/default/objects/Opportunity/fields/Loss_Reason__c.field-meta.xml',
      },
      {
        object: 'Opportunity',
        field: 'Loss_Reason__c',
        name: 'Closed_Lost_Requires_Governed_Reason',
        type: 'Validation rule',
        purpose:
          'The preventive safeguard: blocks entry to Closed Lost without a reason, and blocks erasing a reason that already exists. Prospective only — records lost before it existed are detected here, not blocked retrospectively. Deployed, and runtime validated: both refusals were observed against the org.',
        evidencePath:
          'force-app/main/default/objects/Opportunity/validationRules/Closed_Lost_Requires_Governed_Reason.validationRule-meta.xml',
      },
    ],
  },
  'stale-opportunities': {
    fields: ['IsClosed', 'CloseDate', 'StageName', 'Amount'],
    usages: [],
    noneEstablished:
      'This check reads standard Opportunity fields only, and the repository contains no custom Opportunity field, Flow, validation rule or report. That is consistent with it being a detective check: NorthstarIQ reports the condition, and nothing in Salesforce prevents it.',
  },
  'forecast-commitment-integrity': {
    fields: ['IsClosed', 'ForecastCategoryName', 'ForecastCategory', 'Amount', 'CloseDate'],
    usages: [],
    noneEstablished:
      'REGISTERED AND ACTIVE SINCE MODEL v4 · SOURCE IMPLEMENTED · LOCALLY VALIDATED · NOT SALESFORCE RUNTIME VALIDATED — the detector is in the active control set and is covered by automated tests, but no assessment has yet been run against the org, so it has never executed against Salesforce. No Salesforce configuration backs it and none was created: it reads standard Opportunity fields plus the standard Period object for the org’s fiscal calendar, adding no custom field, Flow, validation rule, Custom Metadata Type or Record Type. Detective by deliberate decision — a preventive rule would refuse a legitimate forecast judgement. No additional access was required: ForecastCategoryName is not separately permissionable, Period is not separately permissionable, and the integration principal already reads Opportunity.',
  },
  'revenue-handoff-integrity': {
    fields: ['IsClosed', 'IsWon', 'AccountId', 'Amount', 'OpportunityContactRole'],
    usages: [],
    noneEstablished:
      'REGISTERED AND ACTIVE SINCE MODEL v4 · SOURCE IMPLEMENTED · LOCALLY VALIDATED · NOT SALESFORCE RUNTIME VALIDATED — the detector is in the active control set and is covered by automated tests, but no assessment has yet been run against the org, so it has never executed against Salesforce. No Salesforce configuration backs it and none was created: it reads standard Opportunity fields and the standard OpportunityContactRole relationship, adding no custom field, Flow, validation rule, Custom Metadata Type or Record Type. Detective by deliberate decision — a preventive rule would block a real commercial win until unrelated administrative work finished. No additional access was required either: the integration principal already holds read on Opportunity and field-level access to AccountId and Amount, and OpportunityContactRole is not separately permissionable in Salesforce.',
  },
};

/**
 * Types deliberately absent, and why — so a reader can tell the difference
 * between "we did not look" and "it does not exist".
 *
 * The org inventory recorded 0 Apex, 0 workflow rules and 0 validation rules
 * before this build, and none were added.
 */
export const ABSENT_TYPES =
  'No validation rules, assignment rules, workflow rules or Apex triggers exist in this org, so none appear above.';
