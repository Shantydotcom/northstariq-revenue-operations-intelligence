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
 * The Lead Status value that claims a converted lifecycle state.
 *
 * Not a business policy this application decides. It is the one entry in
 * `standardValueSets/LeadStatus.standardValueSet-meta.xml` carrying
 * `<converted>true</converted>` - Salesforce's own marker for "this status
 * means the Lead was converted". The value set is in source control, so the
 * constant is checkable against a repository artifact rather than asserted.
 *
 * Held here rather than in Custom Metadata because it is not a rule Revenue
 * Operations would change: it is the platform's converted marker. If the
 * governed taxonomy later gains its own converted stage, this becomes the
 * place that changes.
 */
export const CONVERTED_LEAD_STATUS = 'Closed - Converted';

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
  /*
   * Why this Lead qualified as MQL, written by Lead_Inbound_Before_Save and by
   * nothing else. Read-only in every permission set, which is what lets the
   * detective control treat its presence as governed evidence rather than as a
   * value someone typed. Null on every record that predates the qualification
   * foundation - which is a gap in evidence, not a violation.
   */
  MQL_Basis__c: string | null;
  /*
   * Lifecycle progression evidence, all written by Lead_Inbound_Before_Save and
   * read-only in every permission set.
   *
   * `Lifecycle_Stage_Entered__c` is when the Lead entered the stage it holds
   * NOW - it is overwritten on the next transition and is not a history. Its
   * presence is what tells a detective control that the lifecycle safeguard has
   * actually run on a record; absent, the record progressed before governance
   * existed.
   */
  CreatedDate: string;
  Lifecycle_Stage_Entered__c: string | null;
  Sales_Accepted_At__c: string | null;
  Sales_Accepted_By__c: string | null;
  Sales_Acceptance_Basis__c: string | null;
  SQL_Basis__c: string | null;
  /*
   * The two SELLER INPUTS in the sales evidence chain, and the one seller
   * input in the acceptance chain. Deliberately typed and read alongside the
   * evidence fields but NEVER treated as equivalent to them: a checkbox, a
   * picklist and a date are editable after the fact, so they record what is
   * true now and not what was true when the lifecycle decision was made. The
   * detective control reads them for context and judges the immutable basis
   * strings instead.
   *
   * `Next_Step__c` is deliberately ABSENT. Its own field description states it
   * is human context and never a qualification requirement, so no control
   * interprets it and nothing is served by querying it.
   */
  Sales_Accepted__c: boolean;
  Qualified_Need__c: string | null;
  Next_Step_Date__c: string | null;
  Data_Quality_Status__c: string | null;
  Data_Quality_Detail__c: string | null;
  SLA_Status__c: string | null;
  SLA_Target_DateTime__c: string | null;
  First_Touch_DateTime__c: string | null;
  SLA_Basis__c: string | null;
  Owner: { Name: string | null; Type: string | null } | null;
  /*
   * Conversion state, straight from Salesforce.
   *
   * `IsConverted` is the authoritative flag: the platform sets it during
   * conversion and it is not writable afterwards. The four companion fields
   * are what conversion produced. `ConvertedOpportunityId` is legitimately
   * null when a Lead is converted with "Don't create an opportunity", so its
   * absence is never on its own evidence of anything.
   */
  IsConverted: boolean;
  ConvertedDate: string | null;
  ConvertedAccountId: string | null;
  ConvertedContactId: string | null;
  ConvertedOpportunityId: string | null;
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
/**
 * Statuses that assert a Lead reached Marketing qualification.
 *
 * Derived from the ORDER of the governed Lead Status taxonomy - MQL is the
 * third of five working stages - not from the transition policy. Under the
 * governed lifecycle, SAL, SQL and the converted status are only reachable
 * through MQL, so a Lead sitting on any of them is making an MQL claim whether
 * or not it still says "MQL".
 *
 * This is a taxonomy ordering, NOT a copy of business policy: which
 * transitions are permitted stays in Lifecycle_Transition__mdt, and which
 * requirements constitute MQL stays in MQL_Qualification_Policy__mdt.
 */
export const MQL_CLAIMING_STATUSES = ['MQL', 'SAL', 'SQL', CONVERTED_LEAD_STATUS];

/**
 * Statuses that assert Sales accepted the Marketing handoff, and statuses that
 * assert Sales subsequently qualified the prospect.
 *
 * The same taxonomy ordering `MQL_CLAIMING_STATUSES` is built from, read one
 * and two stages further along: SAL is the fourth working stage and SQL the
 * fifth, so a Lead sitting on SQL or on the converted status has already
 * asserted acceptance whether or not it still says SAL.
 *
 * ORDERING, NOT POLICY. Which transitions are permitted stays in
 * `Lifecycle_Transition__mdt`; which requirements constitute acceptance and
 * qualification stay in `Sales_Acceptance_Policy__mdt` and
 * `SQL_Qualification_Policy__mdt`. These lists only say which Leads are making
 * the claim in the first place.
 */
export const SAL_CLAIMING_STATUSES = ['SAL', 'SQL', CONVERTED_LEAD_STATUS];
export const SQL_CLAIMING_STATUSES = ['SQL', CONVERTED_LEAD_STATUS];

/**
 * The active MQL qualification policy - the governed definition itself.
 *
 * No stage filter: this type only ever holds MQL policies (Sales acceptance and
 * SQL qualification each have their own narrowly scoped type), so an active
 * record here is the MQL policy by construction. More than one active record is
 * an ambiguous configuration and the control refuses to guess.
 */
/**
 * The governed lifecycle transition policy - the single executable definition
 * of which stage may follow which.
 *
 * Read whole: the detective control builds its adjacency map from these records
 * rather than holding a transition matrix of its own.
 */
export const LIFECYCLE_TRANSITION_SOQL = `
SELECT From_Stage__c, To_Stage__c, Is_Active__c, Rule_Version__c
FROM Lifecycle_Transition__mdt
WHERE Is_Active__c = true
`.trim().replace(/\s+/g, ' ');

/**
 * Every Status change Salesforce still retains.
 *
 * ⚠️ NOT AN EVENT STORE. Field history is bounded and retained for a limited
 * period, tracking may have been switched on after some records existed, and it
 * never contains a Lead's initial status assignment. Absence of a transition
 * here is not evidence that the transition never happened.
 */
export const LEAD_STATUS_HISTORY_SOQL = `
SELECT LeadId, OldValue, NewValue, CreatedDate
FROM LeadHistory
WHERE Field = 'Status'
ORDER BY CreatedDate
LIMIT 2000
`.trim().replace(/\s+/g, ' ');

export interface LifecycleTransitionRecord {
  From_Stage__c: string | null;
  To_Stage__c: string | null;
  Is_Active__c: boolean;
  Rule_Version__c: string | null;
}

export interface LeadStatusHistoryRecord {
  LeadId: string;
  OldValue: string | null;
  NewValue: string | null;
  CreatedDate: string;
}

export const MQL_POLICY_SOQL = `
SELECT Policy_Version__c, Qualified_Stage__c,
       Require_Governed_Source__c, Require_MQL_Eligible_Segment__c,
       Require_Routable_Territory__c, Require_Unambiguous_Match__c
FROM MQL_Qualification_Policy__mdt
WHERE Is_Active__c = true
`.trim().replace(/\s+/g, ' ');

/** Which segments the business qualifies - read from the band that defines them. */
export const MQL_SEGMENT_ELIGIBILITY_SOQL = `
SELECT Segment_Name__c
FROM Segment_Band__mdt
WHERE Is_Active__c = true AND MQL_Eligible__c = true
`.trim().replace(/\s+/g, ' ');

export interface MqlPolicyRecord {
  Policy_Version__c: string | null;
  Qualified_Stage__c: string | null;
  Require_Governed_Source__c: boolean;
  Require_MQL_Eligible_Segment__c: boolean;
  Require_Routable_Territory__c: boolean;
  Require_Unambiguous_Match__c: boolean;
}

export interface SegmentEligibilityRecord {
  Segment_Name__c: string | null;
}

/**
 * The two governed definitions behind the Marketing → Sales handoff.
 *
 * Read as two queries against two Custom Metadata Types rather than one query
 * against a shared one, because Salesforce holds them as two types: acceptance
 * and qualification are separate business events with separate requirements,
 * separate versions and separate stages. Each type only ever holds its own
 * policy, so an active record is that policy by construction and no stage
 * filter is needed. More than one active record is an ambiguous configuration
 * and the control refuses to guess between them.
 */
export const SALES_ACCEPTANCE_POLICY_SOQL = `
SELECT Policy_Version__c, Accepted_Stage__c,
       Require_Explicit_Acceptance__c, Require_MQL_Evidence__c
FROM Sales_Acceptance_Policy__mdt
WHERE Is_Active__c = true
`.trim().replace(/\s+/g, ' ');

export const SQL_POLICY_SOQL = `
SELECT Policy_Version__c, Qualified_Stage__c,
       Require_Acceptance_Evidence__c, Require_Confirmed_Need__c,
       Require_Next_Step__c
FROM SQL_Qualification_Policy__mdt
WHERE Is_Active__c = true
`.trim().replace(/\s+/g, ' ');

export interface SalesAcceptancePolicyRecord {
  Policy_Version__c: string | null;
  Accepted_Stage__c: string | null;
  Require_Explicit_Acceptance__c: boolean;
  Require_MQL_Evidence__c: boolean;
}

export interface SqlPolicyRecord {
  Policy_Version__c: string | null;
  Qualified_Stage__c: string | null;
  Require_Acceptance_Evidence__c: boolean;
  Require_Confirmed_Need__c: boolean;
  Require_Next_Step__c: boolean;
}

export const LEAD_SOQL = `
SELECT Id, Name, Company, LeadSource, Status, NumberOfEmployees, CountryCode, StateCode, CreatedDate,
       Segment__c, Segment_Basis__c, Territory__c,
       Match_Status__c, Matched_Account__c, Normalized_Domain__c,
       Routing_Reason__c, Exception_Type__c, MQL_Basis__c,
       Lifecycle_Stage_Entered__c, Sales_Accepted_At__c, Sales_Accepted_By__c,
       Sales_Acceptance_Basis__c, Sales_Accepted__c, SQL_Basis__c,
       Qualified_Need__c, Next_Step_Date__c,
       Data_Quality_Status__c, Data_Quality_Detail__c,
       SLA_Status__c, SLA_Target_DateTime__c, First_Touch_DateTime__c, SLA_Basis__c,
       IsConverted, ConvertedDate, ConvertedAccountId, ConvertedContactId,
       ConvertedOpportunityId,
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
