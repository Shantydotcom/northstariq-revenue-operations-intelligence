import 'server-only';

import { query, SalesforceError } from './salesforce.ts';
import {
  FORECAST_PERIOD_SOQL,
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
  type PeriodRecord,
  type RoutingReadinessSourceRecord,
  type SalesAcceptancePolicyRecord,
  type SegmentEligibilityRecord,
  type SqlPolicyRecord,
} from './soql.ts';
import {
  type LifecycleGovernance,
  lifecycleProgressionIntegrity,
  mqlQualificationIntegrity,
  runAllChecks,
  salesAcceptanceSqlIntegrity,
} from './checks/index.ts';
import { resolveMqlPolicy } from './checks/mql-policy.ts';
import { type ForecastPeriod, resolveForecastPeriod } from './checks/forecast-period.ts';
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
 * Ten SOQL reads, fourteen pure checks, deterministic scoring. Nothing is
 * persisted - there is no database on the free tier, and an assessment that
 * always reflects the live org is more honest than a stale stored one.
 *
 * MOST OF THOSE READS ARE CONFIGURATION, NOT DATA. Salesforce owns which Lead
 * Sources carry a routing-readiness expectation, which segments qualify, which
 * transitions are permitted, and what MQL, Sales acceptance and SQL require.
 * The application asks each run rather than holding its own copy, which is
 * what lets a policy change take effect without a deployment. Custom Metadata
 * reads do not consume SOQL query rows, so the cost of asking is small.
 *
 * Lead Status history is the one genuinely partial input: field history is
 * bounded and never records a Lead's first status, which is why the controls
 * that consume it report absence as unmeasurable.
 *
 * The fiscal-period read is configuration of a different kind - Salesforce's
 * own fiscal calendar rather than a governed policy record - and it is the
 * only read whose resolution can refuse. `Period` is queried instead of
 * `Opportunity.FiscalYear`/`FiscalQuarter`, which discovery found stale
 * against their own Close Dates in this org.
 */

const OBJECTS = ['Lead', 'Opportunity'];

async function fetchRecords(now: Date): Promise<{
  leads: LeadRecord[];
  opportunities: OpportunityRecord[];
  routingReadinessSources: string[];
  lifecycle: LifecycleGovernance;
  statusHistory: LeadStatusHistoryRecord[];
  forecastPeriod: ForecastPeriod;
}> {
  // Independent reads - run them together rather than in series.
  const [
    leads,
    opportunities,
    sources,
    transitions,
    mqlPolicies,
    eligibleSegments,
    acceptancePolicies,
    sqlPolicies,
    statusHistory,
    periods,
  ] = await Promise.all([
    query<LeadRecord>(LEAD_SOQL),
    query<OpportunityRecord>(OPPORTUNITY_SOQL),
    query<RoutingReadinessSourceRecord>(ROUTING_READINESS_SOQL),
    query<LifecycleTransitionRecord>(LIFECYCLE_TRANSITION_SOQL),
    query<MqlPolicyRecord>(MQL_POLICY_SOQL),
    query<SegmentEligibilityRecord>(MQL_SEGMENT_ELIGIBILITY_SOQL),
    query<SalesAcceptancePolicyRecord>(SALES_ACCEPTANCE_POLICY_SOQL),
    query<SqlPolicyRecord>(SQL_POLICY_SOQL),
    query<LeadStatusHistoryRecord>(LEAD_STATUS_HISTORY_SOQL),
    query<PeriodRecord>(FORECAST_PERIOD_SOQL),
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

  /*
   * The governed definitions, resolved once per run.
   *
   * Each resolver THROWS when its definition is missing, ambiguous or
   * malformed, and that is deliberate: an unreadable policy is a diagnostic
   * failure, never a population that all passes. Under Model v2 these
   * controls are scored, so a silently-defaulted policy would now move the
   * overall number - which makes failing loudly matter more, not less.
   */
  const lifecycle: LifecycleGovernance = {
    graph: buildLifecycleGraph(transitions),
    mqlPolicy: resolveMqlPolicy(mqlPolicies),
    mqlEligibleSegments: eligibleSegments
      .map((e) => e.Segment_Name__c)
      .filter((v): v is string => v !== null && v.trim() !== ''),
    acceptancePolicy: resolveSalesAcceptancePolicy(acceptancePolicies),
    sqlPolicy: resolveSqlQualificationPolicy(sqlPolicies),
  };

  /*
   * The forecast period, resolved once per run from the org's own fiscal
   * calendar.
   *
   * THROWS rather than continues when no quarter contains the assessment date,
   * or when more than one does - the same refusal the three policy resolvers
   * above make, and for the same reason: PD-23 judges a Close Date against a
   * period end, so an unreadable period is a diagnostic failure, never a
   * population that all passes. Inventing a quarter would put a wrong period
   * end behind every verdict the control reached.
   */
  const forecastPeriod = resolveForecastPeriod(periods, now.toISOString().slice(0, 10));

  return {
    leads,
    opportunities,
    routingReadinessSources,
    lifecycle,
    statusHistory,
    forecastPeriod,
  };
}

export async function runAssessment(now: Date): Promise<AssessmentResult> {
  const {
    leads,
    opportunities,
    routingReadinessSources,
    lifecycle,
    statusHistory,
    forecastPeriod,
  } = await fetchRecords(now);
  const results = runAllChecks(
    leads,
    opportunities,
    now,
    routingReadinessSources,
    lifecycle,
    statusHistory,
    forecastPeriod,
  );
  return buildAssessment(
    results,
    leads.length + opportunities.length,
    OBJECTS,
    now.toISOString(),
  );
}

/** Detail for one check, including its evidence rows. */
export async function runCheck(id: CheckId, now: Date): Promise<CheckResult | null> {
  const {
    leads,
    opportunities,
    routingReadinessSources,
    lifecycle,
    statusHistory,
    forecastPeriod,
  } = await fetchRecords(now);
  return (
    runAllChecks(
      leads,
      opportunities,
      now,
      routingReadinessSources,
      lifecycle,
      statusHistory,
      forecastPeriod,
    ).find((r) => r.id === id) ?? null
  );
}

/*
 * THE THREE STANDALONE LIFECYCLE RUNNERS ARE GONE, AND THAT IS THE POINT.
 *
 * Each existed to execute one lifecycle control outside `runAllChecks` while
 * Lifecycle Governance was implemented but unscored. Under Model v2 all four
 * are scored members of the ordinary assessment, so `runAssessment` and
 * `runCheck` reach them like every other control and a second execution path
 * would be a second answer waiting to disagree with the first.
 */
