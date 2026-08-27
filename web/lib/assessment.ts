import 'server-only';

import { query, SalesforceError } from './salesforce.ts';
import {
  LEAD_SOQL,
  OPPORTUNITY_SOQL,
  ROUTING_READINESS_SOQL,
  type LeadRecord,
  type OpportunityRecord,
  type RoutingReadinessSourceRecord,
} from './soql.ts';
import { runAllChecks } from './checks/index.ts';
import { buildAssessment } from './score.ts';
import type { AssessmentResult, CheckId, CheckResult } from './types.ts';

/**
 * One assessment run.
 *
 * Three SOQL reads, seven pure checks, deterministic scoring. Nothing is
 * persisted - there is no database on the free tier, and an assessment that
 * always reflects the live org is more honest than a stale stored one.
 *
 * The third read is configuration rather than data: Salesforce owns which Lead
 * Sources carry a routing-readiness expectation, so the application asks each
 * run instead of holding its own copy.
 */

const OBJECTS = ['Lead', 'Opportunity'];

async function fetchRecords(): Promise<{
  leads: LeadRecord[];
  opportunities: OpportunityRecord[];
  routingReadinessSources: string[];
}> {
  // Independent reads - run them together rather than in series.
  const [leads, opportunities, sources] = await Promise.all([
    query<LeadRecord>(LEAD_SOQL),
    query<OpportunityRecord>(OPPORTUNITY_SOQL),
    query<RoutingReadinessSourceRecord>(ROUTING_READINESS_SOQL),
  ]);

  const routingReadinessSources = sources
    .map((s) => s.Lead_Source__c)
    .filter((v): v is string => v !== null && v.trim() !== '');

  /*
   * No configuration is a configuration failure, not an empty population.
   *
   * Falling back to a built-in list would quietly restore the drift this
   * change exists to remove, and treating the list as legitimately empty would
   * score every control 100 on the grounds that nothing qualified. Both are
   * wrong answers presented as results, so this fails loudly on the existing
   * safe-error path instead.
   */
  if (routingReadinessSources.length === 0) {
    throw new SalesforceError(
      'API_ERROR',
      'No active Routing Readiness Sources are configured in Salesforce.',
    );
  }

  return { leads, opportunities, routingReadinessSources };
}

export async function runAssessment(now: Date): Promise<AssessmentResult> {
  const { leads, opportunities, routingReadinessSources } = await fetchRecords();
  const results = runAllChecks(leads, opportunities, now, routingReadinessSources);
  return buildAssessment(
    results,
    leads.length + opportunities.length,
    OBJECTS,
    now.toISOString(),
  );
}

/** Detail for one check, including its evidence rows. */
export async function runCheck(id: CheckId, now: Date): Promise<CheckResult | null> {
  const { leads, opportunities, routingReadinessSources } = await fetchRecords();
  return (
    runAllChecks(leads, opportunities, now, routingReadinessSources).find((r) => r.id === id) ?? null
  );
}
