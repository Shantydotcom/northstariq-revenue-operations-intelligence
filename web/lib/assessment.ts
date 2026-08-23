import 'server-only';

import { query } from './salesforce.ts';
import { LEAD_SOQL, OPPORTUNITY_SOQL, type LeadRecord, type OpportunityRecord } from './soql.ts';
import { runAllChecks } from './checks/index.ts';
import { buildAssessment } from './score.ts';
import type { AssessmentResult, CheckId, CheckResult } from './types.ts';

/**
 * One assessment run.
 *
 * Two SOQL queries, six pure checks, deterministic scoring. Nothing is
 * persisted - there is no database on the free tier, and an assessment that
 * always reflects the live org is more honest than a stale stored one.
 */

const OBJECTS = ['Lead', 'Opportunity'];

async function fetchRecords(): Promise<{
  leads: LeadRecord[];
  opportunities: OpportunityRecord[];
}> {
  // Independent queries - run them together rather than in series.
  const [leads, opportunities] = await Promise.all([
    query<LeadRecord>(LEAD_SOQL),
    query<OpportunityRecord>(OPPORTUNITY_SOQL),
  ]);
  return { leads, opportunities };
}

export async function runAssessment(now: Date): Promise<AssessmentResult> {
  const { leads, opportunities } = await fetchRecords();
  const results = runAllChecks(leads, opportunities, now);
  return buildAssessment(
    results,
    leads.length + opportunities.length,
    OBJECTS,
    now.toISOString(),
  );
}

/** Detail for one check, including its evidence rows. */
export async function runCheck(id: CheckId, now: Date): Promise<CheckResult | null> {
  const { leads, opportunities } = await fetchRecords();
  return runAllChecks(leads, opportunities, now).find((r) => r.id === id) ?? null;
}
