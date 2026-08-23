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
