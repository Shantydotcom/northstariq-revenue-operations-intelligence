/**
 * The forecast period, as NorthstarIQ reads it.
 *
 * THE CALENDAR IS NOT HERE. Which dates bound a fiscal quarter lives in
 * Salesforce's own `Period` records, which is why this module resolves rather
 * than computes. Deriving quarters arithmetically would work only while the
 * org's fiscal year happens to start in January, and would go silently wrong
 * the moment it did not.
 *
 * `Opportunity.FiscalYear` and `FiscalQuarter` are deliberately not consulted:
 * read-only discovery found them stale against their own `CloseDate` on the
 * sample records, so they cannot answer a period question.
 */
import type { PeriodRecord } from '../soql.ts';

/** The fiscal quarter containing the assessment date. ISO `YYYY-MM-DD`. */
export interface ForecastPeriod {
  startDate: string;
  endDate: string;
}

/**
 * Raised when the forecast period cannot be established.
 *
 * A missing or ambiguous period is NOT "no records are late". `PD-23` judges a
 * Close Date against a period end, so without one there is no comparison to
 * make - and reporting commitments as period-consistent against a period
 * NorthstarIQ could not read would be a claim with nothing behind it.
 *
 * The control this serves is not in `runAllChecks`, so this can never
 * destabilise the live assessment.
 */
export class ForecastPeriodUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForecastPeriodUnavailableError';
  }
}

/**
 * Resolve exactly one fiscal quarter containing the assessment date, or refuse.
 *
 * Two refusals, for two different configuration facts. NONE means the org's
 * fiscal calendar does not cover the date being assessed. MORE THAN ONE means
 * the quarters overlap, which no correct fiscal calendar does - and picking the
 * first row would turn a configuration defect into a silently wrong period end
 * that every subsequent verdict would inherit.
 *
 * Dates are compared as ISO strings, the same way `stale-opportunities`
 * compares a Close Date to its cutoff: `YYYY-MM-DD` sorts lexicographically in
 * date order, so no parsing or timezone handling is involved. Both bounds are
 * INCLUSIVE - Salesforce's `EndDate` is the last day of the quarter, not the
 * first day of the next.
 */
export function resolveForecastPeriod(
  records: PeriodRecord[],
  /** The date the assessment is being run for, as ISO `YYYY-MM-DD`. */
  assessmentDate: string,
): ForecastPeriod {
  const containing = records.filter(
    (p) => p.StartDate <= assessmentDate && assessmentDate <= p.EndDate,
  );

  if (containing.length === 0) {
    throw new ForecastPeriodUnavailableError(
      `No Salesforce fiscal quarter contains ${assessmentDate}. NorthstarIQ will not judge forecast commitments as period-consistent against a period it cannot read.`,
    );
  }
  if (containing.length > 1) {
    throw new ForecastPeriodUnavailableError(
      `${containing.length} Salesforce fiscal quarters contain ${assessmentDate}. Exactly one is expected, and NorthstarIQ will not choose between them.`,
    );
  }

  const period = containing[0];
  return { startDate: period.StartDate, endDate: period.EndDate };
}
