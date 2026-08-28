import 'server-only';

import { query, SalesforceError } from './salesforce.ts';
import {
  LEAD_SOQL,
  LEAD_STATUS_HISTORY_SOQL,
  LIFECYCLE_TRANSITION_SOQL,
  MQL_POLICY_SOQL,
  MQL_SEGMENT_ELIGIBILITY_SOQL,
  OPPORTUNITY_SOQL,
  ROUTING_READINESS_SOQL,
  SALES_ACCEPTANCE_POLICY_SOQL,
  SQL_POLICY_SOQL,
  type LeadRecord,
  type LeadStatusHistoryRecord,
  type LifecycleTransitionRecord,
  type MqlPolicyRecord,
  type OpportunityRecord,
  type RoutingReadinessSourceRecord,
  type SalesAcceptancePolicyRecord,
  type SegmentEligibilityRecord,
  type SqlPolicyRecord,
} from './soql.ts';
import {
  lifecycleProgressionIntegrity,
  mqlQualificationIntegrity,
  runAllChecks,
  salesAcceptanceSqlIntegrity,
} from './checks/index.ts';
import { resolveMqlPolicy } from './checks/mql-policy.ts';
import { buildLifecycleGraph } from './checks/lifecycle-graph.ts';
import {
  resolveSalesAcceptancePolicy,
  resolveSqlQualificationPolicy,
} from './checks/sales-qualification-policy.ts';
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

/**
 * Run the MQL Qualification Integrity detective control on its own.
 *
 * DELIBERATELY NOT PART OF `runAssessment`. The control is implemented and
 * tested but unscored: it is absent from `CHECK_IDS` and from `runAllChecks`,
 * so overall health stays at five areas and seven scored controls. Activating
 * Lifecycle Governance is a user-visible scoring change and is held for human
 * approval rather than taken quietly.
 *
 * It is also kept out of `fetchRecords` so the ordinary assessment does not pay
 * for two extra configuration reads it never uses.
 *
 * Read-only, like every other control. Two Custom Metadata reads bring the
 * governed definition in - which requirements apply, and which segments the
 * business qualifies - and the Lead population comes from the same query the
 * scored controls use.
 */
export async function runMqlQualificationIntegrity(): Promise<CheckResult> {
  const [leads, sources, policies, eligible] = await Promise.all([
    query<LeadRecord>(LEAD_SOQL),
    query<RoutingReadinessSourceRecord>(ROUTING_READINESS_SOQL),
    query<MqlPolicyRecord>(MQL_POLICY_SOQL),
    query<SegmentEligibilityRecord>(MQL_SEGMENT_ELIGIBILITY_SOQL),
  ]);

  // Throws when governance is missing or ambiguous. Absence of a governed
  // definition is a diagnostic failure, never a population that all passes.
  const policy = resolveMqlPolicy(policies);

  return mqlQualificationIntegrity(
    leads,
    policy,
    sources.map((s) => s.Lead_Source__c).filter((v): v is string => v !== null && v.trim() !== ''),
    eligible
      .map((e) => e.Segment_Name__c)
      .filter((v): v is string => v !== null && v.trim() !== ''),
  );
}

/**
 * Run the Lifecycle Progression Integrity detective control on its own.
 *
 * DELIBERATELY NOT PART OF `runAssessment`, for the same reason as the MQL
 * detector: it is implemented and tested but unscored, so Assessment Model v1
 * stays at five areas and seven scored controls until activating Lifecycle
 * Governance is approved as a user-visible scoring change.
 *
 * Three read-only queries. The transition policy is Custom Metadata, which does
 * not consume SOQL limits; the history read is bounded and filtered to Status
 * changes rather than pulling every field-history row in the org.
 */
export async function runLifecycleProgressionIntegrity(): Promise<CheckResult> {
  const [leads, transitions, history] = await Promise.all([
    query<LeadRecord>(LEAD_SOQL),
    query<LifecycleTransitionRecord>(LIFECYCLE_TRANSITION_SOQL),
    query<LeadStatusHistoryRecord>(LEAD_STATUS_HISTORY_SOQL),
  ]);

  // Throws when the governed model is missing or malformed. An unreadable
  // policy is a diagnostic failure, never a population that all passes.
  const graph = buildLifecycleGraph(transitions);

  return lifecycleProgressionIntegrity(leads, history, graph);
}

/**
 * Run the Sales Acceptance / SQL Integrity detective control on its own.
 *
 * DELIBERATELY NOT PART OF `runAssessment`, for the same reason as the two
 * detectors above: implemented and tested but unscored, so Assessment Model v1
 * stays at five areas and seven scored controls until activating Lifecycle
 * Governance is approved as a user-visible scoring change.
 *
 * Four read-only queries. Two of them are the governed definitions - the
 * acceptance policy and the qualification policy, read as two records because
 * Salesforce holds them as two Custom Metadata Types. The history read is the
 * same bounded, Status-filtered query the progression control uses, and it is
 * needed for one thing only: establishing when a Lead entered the qualified
 * stage, so a recorded next-step date can be judged against the decision it
 * belonged to rather than against today.
 */
export async function runSalesAcceptanceSqlIntegrity(): Promise<CheckResult> {
  const [leads, acceptance, sql, history] = await Promise.all([
    query<LeadRecord>(LEAD_SOQL),
    query<SalesAcceptancePolicyRecord>(SALES_ACCEPTANCE_POLICY_SOQL),
    query<SqlPolicyRecord>(SQL_POLICY_SOQL),
    query<LeadStatusHistoryRecord>(LEAD_STATUS_HISTORY_SOQL),
  ]);

  // Both throw when the governed definition is missing or ambiguous. Absence
  // of governance is a diagnostic failure, never a population that all passes.
  return salesAcceptanceSqlIntegrity(
    leads,
    resolveSalesAcceptancePolicy(acceptance),
    resolveSqlQualificationPolicy(sql),
    history,
  );
}
