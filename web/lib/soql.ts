/**
 * SOQL for the assessment. Field API names were taken from the Salesforce
 * source in force-app/, not guessed.
 *
 * All queries are static string literals - no user input is interpolated - so
 * there is no injection surface. Row caps keep every request well inside the
 * Vercel Hobby function budget.
 */

/** The governed population. Increment 3 routes only these Leads. */
export const GOVERNED_INTAKE = "NorthstarIQ Inbound";

/**
 * Routing Readiness Sources - the Lead Sources expected to carry the data
 * routing reads.
 *
 * Salesforce owns this list, not the application. It is deliberately NOT the
 * same thing as ownership-routing authority, which stays narrower and lives in
 * the Flow (`fxRoutingEligible`, governed intake only).
 */
export const ROUTING_READINESS_SOQL = `
SELECT Lead_Source__c
FROM Routing_Readiness_Source__mdt
WHERE Is_Active__c = true
`.trim().replace(/\s+/g, ' ');

export interface RoutingReadinessSourceRecord {
  Lead_Source__c: string | null;
}

/** Salesforce records read by an assessment run. */
export interface LeadRecord {
  Id: string;
  Name: string;
  Company: string | null;
  LeadSource: string | null;
  Status: string | null;
  NumberOfEmployees: number | null;
  CountryCode: string | null;
  StateCode: string | null;
  Segment__c: string | null;
  Segment_Basis__c: string | null;
  Territory__c: string | null;
  Match_Status__c: string | null;
  Matched_Account__c: string | null;
  Normalized_Domain__c: string | null;
  Routing_Reason__c: string | null;
  Exception_Type__c: string | null;
  Data_Quality_Status__c: string | null;
  Data_Quality_Detail__c: string | null;
  SLA_Status__c: string | null;
  SLA_Target_DateTime__c: string | null;
  First_Touch_DateTime__c: string | null;
  SLA_Basis__c: string | null;
  Owner: { Name: string | null; Type: string | null } | null;
}

export interface OpportunityRecord {
  Id: string;
  Name: string;
  StageName: string | null;
  CloseDate: string | null;
  Amount: number | null;
  IsClosed: boolean;
  IsWon: boolean;
  Account: { Name: string | null } | null;
}

/** Cap: the demo org holds ~50 Leads; 500 is headroom, not ambition. */
export const LEAD_SOQL = `
SELECT Id, Name, Company, LeadSource, Status, NumberOfEmployees, CountryCode, StateCode,
       Segment__c, Segment_Basis__c, Territory__c,
       Match_Status__c, Matched_Account__c, Normalized_Domain__c,
       Routing_Reason__c, Exception_Type__c,
       Data_Quality_Status__c, Data_Quality_Detail__c,
       SLA_Status__c, SLA_Target_DateTime__c, First_Touch_DateTime__c, SLA_Basis__c,
       Owner.Name, Owner.Type
FROM Lead
ORDER BY CreatedDate DESC
LIMIT 500
`.trim().replace(/\s+/g, ' ');

export const OPPORTUNITY_SOQL = `
SELECT Id, Name, StageName, CloseDate, Amount, IsClosed, IsWon, Account.Name
FROM Opportunity
ORDER BY CloseDate ASC
LIMIT 500
`.trim().replace(/\s+/g, ' ');

/** Counted for the Integrations screen only; no field data is read. */
export const ACCOUNT_COUNT_SOQL = 'SELECT Id FROM Account LIMIT 500';
export const CONTACT_COUNT_SOQL = 'SELECT Id FROM Contact LIMIT 500';

/**
 * Setup identifiers, so a dependency can link to the real configuration.
 *
 * The name lists are the ones held in traceability.ts - repository constants,
 * not user input - so these stay static literals like every other query here.
 * Nothing but an identifier is read; no record data is involved.
 */
export const FIELD_SETUP_ID_SOQL = `
SELECT DurableId, QualifiedApiName, EntityDefinition.QualifiedApiName
FROM FieldDefinition
WHERE EntityDefinition.QualifiedApiName IN ('Lead', 'Account', 'Opportunity')
  AND QualifiedApiName IN ('Data_Quality_Status__c', 'Data_Quality_Detail__c',
                           'SLA_Status__c', 'SLA_Target_DateTime__c', 'First_Touch_DateTime__c',
                           'Normalized_Domain__c', 'Match_Status__c', 'Matched_Account__c',
                           'Exception_Type__c', 'Routing_Reason__c', 'Territory__c',
                           'Segment__c', 'Segment_Basis__c',
                           'NumberOfEmployees', 'OwnerId')
`.trim().replace(/\s+/g, ' ');

export const FLOW_SETUP_ID_SOQL =
  "SELECT DurableId, ApiName FROM FlowDefinitionView WHERE ApiName = 'Lead_Inbound_Before_Save'";

export const REPORT_SETUP_ID_SOQL =
  "SELECT Id, Name FROM Report WHERE Name IN ('NIQ Open SLA Risk', 'NIQ SLA Attainment by Segment')";

export interface FieldDefinitionRecord {
  DurableId: string;
  QualifiedApiName: string;
  EntityDefinition: { QualifiedApiName: string } | null;
}

export interface FlowDefinitionRecord {
  DurableId: string;
  ApiName: string;
}

export interface ReportRecord {
  Id: string;
  Name: string;
}
