import type {
  LeadRecord,
  LeadStatusHistoryRecord,
  LifecycleTransitionRecord,
  OpportunityRecord,
} from '../lib/soql.ts';
import type { LifecycleGovernance } from '../lib/checks/index.ts';
import { buildLifecycleGraph } from '../lib/checks/lifecycle-graph.ts';

/**
 * Fixtures for the check tests.
 *
 * Deliberately shaped, not randomly generated: every record here exists to
 * exercise one named boundary. Nothing in this file touches Salesforce.
 */

export const GOVERNED = 'NorthstarIQ Inbound';

/**
 * Stands in for the active Routing_Readiness_Source__mdt configuration.
 *
 * A fixture, not a definition: the real list comes from Salesforce each run.
 * Tests pass it explicitly so a check can be exercised against a different
 * configuration and prove it is reading one.
 */
export const READINESS_SOURCES = [GOVERNED, 'Web', 'Phone Inquiry'];

let seq = 0;

/** A clean, governed, fully-routed Lead. Overrides create each defect. */
export function lead(overrides: Partial<LeadRecord> = {}): LeadRecord {
  seq += 1;
  const id = `00Q00000000${String(seq).padStart(4, '0')}`;
  return {
    Id: id,
    Name: `Test Lead ${seq}`,
    Company: `Fictional Co ${seq}`,
    LeadSource: GOVERNED,
    Status: 'Open - Not Contacted',
    NumberOfEmployees: 250,
    CountryCode: 'US',
    StateCode: 'CA',
    Segment__c: 'Mid-Market',
    Segment_Basis__c: 'Employee Count: 250 -> Mid-Market | Rule v1.0',
    // Null by default: the governed evidence field is absent on every
    // record that predates the qualification foundation, which is the
    // baseline reality the detective control has to handle honestly.
    MQL_Basis__c: null,
    // A fixed creation instant so chronology assertions are deterministic.
    CreatedDate: '2026-08-20T09:00:00.000+0000',
    // Null by default: the baseline reality is a Lead the lifecycle safeguard
    // never touched, carrying none of the stage evidence it writes.
    Lifecycle_Stage_Entered__c: null,
    Sales_Accepted_At__c: null,
    Sales_Accepted_By__c: null,
    Sales_Acceptance_Basis__c: null,
    SQL_Basis__c: null,
    // The three SELLER INPUTS in the sales evidence chain. Empty by default,
    // like the evidence fields: no baseline Lead has been through the governed
    // Sales handoff, and a fixture that quietly ticked the box would make the
    // "input is not evidence" boundary untestable.
    Sales_Accepted__c: false,
    Qualified_Need__c: null,
    Next_Step_Date__c: null,
    Territory__c: 'NA-West',
    Match_Status__c: 'Matched',
    Matched_Account__c: '00100000000AAAA',
    Normalized_Domain__c: `fictional${seq}.example`,
    Routing_Reason__c: 'At intake: routed to NIQ North America',
    Exception_Type__c: null,
    Data_Quality_Status__c: 'Complete',
    Data_Quality_Detail__c: '',
    SLA_Status__c: 'Pending',
    SLA_Target_DateTime__c: '2026-08-24T12:00:00.000+0000',
    First_Touch_DateTime__c: null,
    SLA_Basis__c: 'Mid-Market: 4 business hours',
    Owner: { Name: 'NIQ North America', Type: 'Queue' },
    // Conversion state. The clean fixture has not been converted and makes no
    // claim to have been, which is the ordinary case.
    IsConverted: false,
    ConvertedDate: null,
    ConvertedAccountId: null,
    ConvertedContactId: null,
    ConvertedOpportunityId: null,
    ...overrides,
  };
}

export function opportunity(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  seq += 1;
  return {
    Id: `00600000000${String(seq).padStart(4, '0')}`,
    Name: `Fictional Deal ${seq}`,
    StageName: 'Proposal',
    CloseDate: '2026-12-31',
    Amount: 50000,
    IsClosed: false,
    IsWon: false,
    Account: { Name: `Fictional Co ${seq}` },
    ...overrides,
  };
}

/** Fixed "today" so no test depends on the wall clock. */
export const TODAY = new Date('2026-08-23T09:00:00.000Z');

/* ------------------------------------------------ Lifecycle Governance (v2) */

/**
 * The governed definitions the four Lifecycle Governance controls consume.
 *
 * A FIXTURE, NOT A DEFINITION. The real ones are read from Custom Metadata
 * every run - `Lifecycle_Transition__mdt`, `MQL_Qualification_Policy__mdt`,
 * `Sales_Acceptance_Policy__mdt`, `SQL_Qualification_Policy__mdt` and
 * `Segment_Band__mdt.MQL_Eligible__c`. These mirror what is deployed so a test
 * exercises realistic shapes, and tests that need a different policy build
 * their own rather than mutating this one.
 */
const TRANSITIONS: LifecycleTransitionRecord[] = [
  ['Open - Not Contacted', 'Working - Contacted'],
  ['Open - Not Contacted', 'Closed - Not Converted'],
  ['Working - Contacted', 'MQL'],
  ['Working - Contacted', 'Closed - Not Converted'],
  ['MQL', 'SAL'],
  ['MQL', 'Closed - Not Converted'],
  ['SAL', 'SQL'],
  ['SAL', 'Closed - Not Converted'],
  ['SQL', 'Closed - Converted'],
  ['SQL', 'Closed - Not Converted'],
].map(([From_Stage__c, To_Stage__c]) => ({
  From_Stage__c,
  To_Stage__c,
  Is_Active__c: true,
  Rule_Version__c: 'v1.0',
}));

export const GOVERNANCE: LifecycleGovernance = {
  graph: buildLifecycleGraph(TRANSITIONS),
  mqlPolicy: {
    version: 'v1.1',
    qualifiedStage: 'MQL',
    requireGovernedSource: true,
    requireEligibleSegment: true,
    requireRoutableTerritory: true,
    requireUnambiguousMatch: true,
  },
  mqlEligibleSegments: ['Strategic', 'Enterprise', 'Mid-Market'],
  acceptancePolicy: {
    version: 'v1.0',
    acceptedStage: 'SAL',
    requireExplicitAcceptance: true,
    requireMqlEvidence: true,
  },
  sqlPolicy: {
    version: 'v1.0',
    qualifiedStage: 'SQL',
    requireAcceptanceEvidence: true,
    requireConfirmedNeed: true,
    requireNextStep: true,
  },
};

/**
 * No retained Status history - the ordinary case.
 *
 * Salesforce field history is bounded and never records a Lead's first status,
 * so an empty history is the baseline reality rather than a degenerate input.
 */
export const NO_HISTORY: LeadStatusHistoryRecord[] = [];
