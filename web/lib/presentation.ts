import type { Category, CheckId } from './types.ts';

/**
 * Operator-facing content for the six checks.
 *
 * Presentation only. Nothing here participates in evaluation or scoring — the
 * canonical rules live in `checks/index.ts` and are untouched by this file.
 *
 * Every claim below is traceable to something that exists in this repository or
 * in the connected org. Where no safeguard was implemented, the entry says so
 * rather than inventing one to keep the six pages symmetrical.
 */

/** Whether Salesforce prevents the condition, or NorthstarIQ only reports it. */
export type ControlKind = 'preventive' | 'detective';

export interface Safeguard {
  kind: ControlKind;
  /** Business-readable name for what was built. */
  title: string;
  /** What it does, in the language an operator would use. */
  body: string;
  /** Short technical context. Never metadata internals. */
  tech?: string[];
}

export interface CheckPresentation {
  /** Operator-facing name. The canonical title stays available as context. */
  label: string;
  /** One line, used on the Overview rows. */
  blurb: string;
  /**
   * One line for the Findings queue, where the reader is triaging rather than
   * scanning a summary — so it names the condition rather than the mechanism.
   */
  queueDescription: string;
  /**
   * What the check's population actually is, in words: "governed inbound
   * Leads", "measurable Leads". Read as "1 of 17 governed inbound Leads", so a
   * count is never shown without saying what it was counted against.
   */
  populationNoun: string;
  /** Overview count format: "2 of 5" for a scoped check, "4 leads" otherwise. */
  denominator: boolean;
  unit: string;
  /** The specific RevOps risk this check protects against. */
  why: string;
  /** What the process does when it is working correctly. */
  expected: string;
  /** The result sentence, built from the live assessment numbers. */
  finding: (failing: number, evaluated: number) => string;
  safeguard: Safeguard;
  /** Outcomes from tests that were actually executed and recorded. */
  verification: string[];
  /** Where those outcomes came from, so a reader can weigh them. */
  verificationSource: string;
  /** Repository path holding the implementation, when one meaningfully exists. */
  evidencePath?: string;
  /** True when evidencePath is a directory rather than a file. */
  evidenceIsDirectory?: boolean;
}

const REPO = 'https://github.com/Shantydotcom/northstariq-revenue-operations-intelligence';

/** Build a link into the authoritative repository. */
export function evidenceUrl(p: CheckPresentation): string | null {
  if (!p.evidencePath) return null;
  return `${REPO}/${p.evidenceIsDirectory ? 'tree' : 'blob'}/main/${p.evidencePath}`;
}

export const PRESENTATION: Record<CheckId, CheckPresentation> = {
  'missing-firmographics': {
    label: 'Missing Routing Data',
    blurb: 'Governed Leads missing data required for routing.',
    queueDescription: 'Governed inbound Leads missing data required for routing.',
    populationNoun: 'governed inbound Leads',
    denominator: true,
    unit: 'leads',
    why: 'Employee count decides segment and country decides territory. A Lead missing either cannot be segmented or routed deterministically, so it lands in the exception path instead of with a seller and waits on someone noticing it.',
    expected:
      'Every Lead arriving through the governed intake carries the employee count and country the routing model reads, and the record itself names any attribute that is missing.',
    finding: (f, e) =>
      `${f} of ${e} governed inbound Leads ${f === 1 ? 'is' : 'are'} missing data required for routing.`,
    safeguard: {
      kind: 'preventive',
      title: 'Completeness assessed on the record, at the point of save',
      body: 'Two formula fields evaluate routing-critical completeness on every Lead and name the specific attribute that is absent. The gap is stated on the record rather than discovered later during triage, so no one has to open the Lead to work out what is wrong with it.',
      tech: ['Salesforce formula fields', 'Lead'],
    },
    verification: [
      'Country present, employee count missing → Incomplete, "Missing: EmployeeCount"',
      'Country missing, employee count present → Incomplete, "Missing: Country"',
      'Both present → Complete, no gap reported',
    ],
    verificationSource:
      'Executed against the Developer Edition org on 2026-08-22. All four formula branches were exercised, including the two the stock data could not reach.',
    evidencePath: 'force-app/main/default/objects/Lead/fields/Data_Quality_Status__c.field-meta.xml',
  },

  'routing-exceptions': {
    label: 'Routing Exceptions',
    blurb: 'Leads that could not be safely assigned.',
    queueDescription: 'Leads that could not be safely assigned.',
    populationNoun: 'Leads',
    denominator: false,
    unit: 'leads',
    why: 'Inbound Leads need deterministic ownership. Where the routing decision cannot be made safely, guessing an owner attaches a prospect to the wrong seller and the wrong account history — a correction that costs more than the delay.',
    expected:
      'Governed Leads that satisfy the routing rules receive an eligible owner. Where routing cannot resolve, the Lead is placed in the RevOps exception path with the reason recorded, and no owner is invented.',
    finding: (f, e) =>
      `${f} of ${e} Leads ${f === 1 ? 'is' : 'are'} currently held in the routing exception queue.`,
    safeguard: {
      kind: 'preventive',
      title: 'Assignment is withheld rather than guessed',
      body: 'The Lead intake automation refuses to assign an owner when the routing decision is unsafe, and routes the record to the exception queue instead. Every exception carries a classified type and a written reason, so the queue can be worked by cause rather than record by record. Leads that did not arrive through the governed intake keep the owner they already had.',
      tech: ['Salesforce record-triggered Flow', 'Exception queue', 'Lead'],
    },
    verification: [
      'Ambiguous account match → held in the exception queue, no owner assigned',
      'Unsupported geography → held in the exception queue with the reason recorded',
      'Lead from a non-governed source → existing owner preserved, untouched',
    ],
    verificationSource:
      'Executed against the Developer Edition org on 2026-08-22 — nine routing fixtures, all nine passed, covering all three ownership outcomes.',
    evidencePath: 'force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml',
  },

  'sla-risk': {
    label: 'SLA Response Risk',
    blurb: 'Leads at risk of or in SLA breach.',
    queueDescription: 'Leads at risk of or already outside their response commitment.',
    populationNoun: 'measurable Leads',
    denominator: true,
    unit: 'leads',
    why: 'Inbound Leads carrying a response commitment need timely follow-up. A missed response loses the advantage the commitment existed to protect, and without a measurable target the miss cannot be distinguished from a Lead nobody promised anything about.',
    expected:
      'Leads eligible for a response commitment receive an SLA target at intake, that target is never rewritten afterwards, and first touch is captured once. Leads with no target are reported as unmeasurable rather than counted as met or breached.',
    finding: (f, e) =>
      `${f} of ${e} Leads with a measurable SLA commitment ${f === 1 ? 'is' : 'are'} at risk or breached.`,
    safeguard: {
      kind: 'preventive',
      title: 'Write-once target, and an honest unmeasurable state',
      body: 'The SLA target is written once at intake from configuration and is never recalculated by a later edit, so a change to segment or geography cannot quietly move a deadline that has already been committed. Where the configuration cannot produce a target, the record is marked unmeasurable and names the gap instead of receiving an invented deadline.',
      tech: ['Salesforce record-triggered Flow', 'Formula field', 'Lead'],
    },
    verification: [
      'Eligible Lead at intake → SLA target and basis written',
      'Segment changed after intake → target and basis unchanged',
      'No applicable configuration → Unmeasurable, no deadline invented',
    ],
    verificationSource:
      'Executed against the Developer Edition org on 2026-08-23 — fifteen SLA scenarios, all fifteen passed, including eight negative and guardrail tests.',
    evidencePath: 'force-app/main/default/objects/Lead/fields/SLA_Status__c.field-meta.xml',
  },

  'ambiguous-match': {
    label: 'Ambiguous Account Match',
    blurb: 'Leads where more than one Account shares the domain.',
    queueDescription: 'Leads where account identity could not be resolved safely.',
    populationNoun: 'Leads',
    denominator: false,
    unit: 'leads',
    why: 'Several Accounts can legitimately share a domain — subsidiaries, franchisees, a group structure never cleaned up. Attaching the Lead to whichever one sorts first puts a prospect against the wrong relationship and the wrong history, and nothing afterwards reveals the error.',
    expected:
      'A Lead whose normalized domain matches exactly one Account is attached to it. Where more than one Account matches, the record is marked for review and left unattached for a person to decide.',
    finding: (f, e) =>
      `${f} of ${e} Leads could not be matched to a single Account.`,
    safeguard: {
      kind: 'preventive',
      title: 'Automation declines to attach an ambiguous match',
      body: 'Matching normalizes the domain and counts the Accounts that share it. One match attaches. More than one sets the record to review and deliberately leaves the Account lookup empty, so the ambiguity stays visible instead of being resolved by an arbitrary choice.',
      tech: ['Salesforce record-triggered Flow', 'Lead'],
    },
    verification: [
      'Three Accounts sharing one domain → Review, Account deliberately left unattached',
      'Exactly one matching Account → attached, and ownership derived from it',
    ],
    verificationSource:
      'Executed against the Developer Edition org on 2026-08-22. The ambiguous case came from stock data — three Accounts genuinely share a domain — so no fixture was manufactured for it.',
    evidencePath: 'force-app/main/default/objects/Lead/fields/Match_Status__c.field-meta.xml',
  },

  'missing-territory': {
    label: 'Missing Territory',
    blurb: 'Governed Leads that did not reach a territory.',
    queueDescription: 'Governed inbound Leads that did not resolve to a territory.',
    populationNoun: 'governed inbound Leads',
    denominator: true,
    unit: 'leads',
    why: 'Territory determines coverage. Without one a Lead cannot reach a coverage queue, so it waits in the exception path regardless of how good the rest of the record is. The cause is usually an uncovered market rather than a broken record.',
    expected:
      'Governed Leads resolve to a territory from the configured coverage map, with a state-specific rule taking precedence over a country default. A country the map does not cover produces no territory and an explicit exception, not a nearest guess.',
    finding: (f, e) =>
      `${f} of ${e} governed inbound Leads did not reach a territory.`,
    safeguard: {
      kind: 'preventive',
      title: 'Coverage held in configuration, resolved by specificity',
      body: 'The territory map lives in Custom Metadata rather than inside the automation, so adding a market is a configuration record and not a deployment. Resolution picks the most specific matching rule rather than the first one returned, and an uncovered country produces an exception instead of a fallback territory.',
      tech: ['Custom Metadata configuration', 'Salesforce record-triggered Flow', 'Lead'],
    },
    verification: [
      'US / California → NA-West by specificity, not by record order',
      'US with no state → country default territory applied',
      'Uncovered country → no territory, routed to the exception path',
    ],
    verificationSource:
      'Executed against the Developer Edition org on 2026-08-22. The specificity case is recorded as a defect that testing found and the design was corrected for — territory had depended on Custom Metadata record order.',
    evidencePath: 'force-app/main/default/customMetadata',
    evidenceIsDirectory: true,
  },

  'stale-opportunities': {
    label: 'Stale Open Pipeline',
    blurb: 'Open Opportunities with a close date in the past.',
    queueDescription: 'Open Opportunities with Close Dates already in the past.',
    populationNoun: 'open Opportunities',
    denominator: true,
    unit: 'opportunities',
    why: 'Open Opportunities with past close dates overstate near-term pipeline and weaken forecast credibility. Coverage and capacity planning both read from these dates, so the error compounds quietly across every number built on them.',
    expected:
      'An open Opportunity carries a close date in the future. A date that has passed is either re-dated or the Opportunity is closed.',
    finding: (f, e) =>
      `${f} of ${e} open Opportunities have a close date in the past.`,
    safeguard: {
      kind: 'detective',
      title: 'No automated safeguard is implemented for this condition',
      body: 'NorthstarIQ detects it for operational review. No Flow, validation rule or custom field was built on Opportunity — pipeline hygiene was scoped as a detective check, and stating that is more useful than implementing a control the project did not build. Persistent slippage concentrated in one stage usually indicates a stage definition problem rather than individual seller behaviour.',
      tech: ['Detection only', 'Opportunity'],
    },
    verification: [
      'Open Opportunity with a past close date → reported',
      'Closed Opportunity → excluded from the population, whatever its date',
    ],
    verificationSource:
      'Application unit tests, run without a Salesforce connection against fixture records. No org-side test exists for this check, because no org-side control was built.',
  },
};

/**
 * Assessment areas, as an operator reads them.
 *
 * The canonical categories in `types.ts` are broad domain names. Displayed as
 * they are, they claim more than the assessment measured: "Data Quality" reads
 * as an audit of data quality, when what ran was one check over governed
 * inbound Leads. These names are deliberately narrower and say what was
 * actually measured.
 *
 * `category` remains the key everywhere in scoring and check logic. Nothing
 * here participates in a calculation.
 */
export interface AreaPresentation {
  label: string;
  /** One line: what population and process the score covers. */
  scope: string;
  /** How a failing record reads for this area, e.g. "2 of 5 at risk or breached". */
  failedWord: string;
  /** Used only where an area holds more than one check. */
  controlWord: string;
}

export const AREAS: Record<Category, AreaPresentation> = {
  'Data Quality': {
    label: 'Inbound Lead Readiness',
    scope: 'Required routing data on governed inbound Leads.',
    failedWord: 'failed',
    controlWord: 'data quality',
  },
  Routing: {
    label: 'Lead Routing Reliability',
    scope: 'Territory coverage and safe owner assignment.',
    failedWord: 'failed',
    controlWord: 'routing',
  },
  'Identity & Matching': {
    label: 'Account Match Confidence',
    scope: 'Lead-to-Account matching without unresolved review.',
    failedWord: 'require review',
    controlWord: 'matching',
  },
  'SLA Performance': {
    label: 'Lead Response SLA',
    scope: 'Response performance for Leads with an SLA commitment.',
    failedWord: 'at risk or breached',
    controlWord: 'SLA',
  },
  'Pipeline Hygiene': {
    label: 'Open Pipeline Date Health',
    scope: 'Close Date integrity across open Opportunities.',
    failedWord: 'stale',
    controlWord: 'pipeline hygiene',
  },
};

/**
 * Population context for one area row, from the live result only.
 *
 * An area holding several checks gets a control count rather than a combined
 * denominator: the populations behind those checks overlap and answer different
 * questions, so adding them would produce a number that looks precise and is
 * not. Where a single check found nothing, there is no finding to read a
 * denominator from, and the row says so rather than guessing one.
 */
export function areaPopulation(
  area: AreaPresentation,
  checkIds: CheckId[],
  findings: { id: CheckId; affected: number; evaluated: number }[],
): string {
  if (checkIds.length > 1) {
    return `${checkIds.length} ${area.controlWord} controls evaluated`;
  }
  const f = findings.find((x) => x.id === checkIds[0]);
  if (!f) return 'no records failed';
  return `${f.affected} of ${f.evaluated} ${area.failedWord}`;
}

/**
 * Population wording for one finding in the queue, from the live result.
 *
 * Always "failing of evaluated", never a bare count: the denominator is what
 * stops "2 at risk" from being read against every Lead in the org.
 */
export function findingPopulation(
  p: CheckPresentation,
  affected: number,
  evaluated: number,
): string {
  return `${affected} of ${evaluated} ${p.populationNoun}`;
}
