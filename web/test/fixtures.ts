import type { LeadRecord, OpportunityRecord } from '../lib/soql.ts';

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
