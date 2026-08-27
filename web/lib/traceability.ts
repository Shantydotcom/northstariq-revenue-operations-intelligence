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

export type UsageType = 'Flow' | 'Formula field' | 'Custom Metadata' | 'Queue' | 'Report';

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

  'stale-opportunities': {
    fields: ['IsClosed', 'CloseDate', 'StageName', 'Amount'],
    usages: [],
    noneEstablished:
      'This check reads standard Opportunity fields only, and the repository contains no custom Opportunity field, Flow, validation rule or report. That is consistent with it being a detective check: NorthstarIQ reports the condition, and nothing in Salesforce prevents it.',
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
