import type { Category, CheckId } from './types.ts';

/**
 * Operator-facing content for the seven checks.
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

/**
 * The clauses that turn a control's live counts into an explanation.
 *
 * Each control needs its own wording: "did not meet the routing flow's entry
 * criteria" and "was created before territory classification existed" are
 * different facts, and a shared template would flatten them into the kind of
 * unexplained phrase - "outside the eligible population" - that leaves a reader
 * asking what happened to the other records.
 *
 * Every clause takes the runtime number. Nothing here is written down.
 */
export interface ControlExplanation {
  /**
   * Why the evaluated records were in scope, where that is worth stating.
   *
   * Omitted on controls whose scope is self-evident from the exclusion clause.
   */
  inScope?: string;
  /**
   * Why the rest were left out - the summary reason, not every subtype.
   *
   * A clause, not a sentence, and carrying no count: the count is already in
   * the sentence this is composed into. Per-record reasons live in the
   * records-not-evaluated table, which is where someone challenging an
   * omission actually goes.
   */
  notEvaluated: string;
  /**
   * One short line limiting what a pass proves.
   *
   * Kept out of the summary but not dropped: without it "13 passed" reads as
   * "13 were routed correctly", which this control never established.
   */
  proves: string;
}

/** The live numbers an explanation is built from. */
export interface ControlFacts {
  orgPopulation: number;
  orgPopulationNoun: string;
  evaluated: number;
  failing: number;
  notEvaluatedCount: number;
  unmeasurableCount: number;
  /** What the failing records actually showed, from the check. */
  failureDetail: string;
  score: number;
}

/**
 * ELIGIBLE -> WHAT FAILED -> WHAT PASSED -> WHAT WAS LEFT OUT.
 *
 * Reporting voice, not first person, and no arithmetic: the metrics above the
 * paragraph already show found, evaluated, not evaluated and the score, so
 * restating the division here would be the third time a reader sees it.
 */
export function explainControl(f: ControlFacts, e: ControlExplanation): string {
  const out = [
    e.inScope
      ? `${f.evaluated} of ${f.orgPopulation} ${f.orgPopulationNoun} were assessed, ${e.inScope}.`
      : `${f.evaluated} of ${f.orgPopulation} ${f.orgPopulationNoun} were in scope for this control.`,
  ];
  if (f.evaluated > 0) {
    // sentence() already terminates the clause - do not add a second stop.
    out.push(f.failing === 0 ? 'None failed.' : sentence(f.failureDetail));
    out.push(`${f.evaluated - f.failing} passed.`);
  }
  /*
   * One reason for the rest, in business terms. The per-record breakdown -
   * including which of them are unmeasurable - lives in the records-not-
   * evaluated table, where a reader can challenge it record by record. Pushing
   * every classification into this paragraph is what made it unreadable.
   */
  if (f.notEvaluatedCount > 0) {
    out.push(`The other ${f.notEvaluatedCount} ${e.notEvaluated}.`);
  }
  return out.join(' ');
}

/** Clauses are written to be composable, so they carry no capital and no stop. */
const sentence = (s: string) => {
  const t = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

/**
 * Where a control's expected value comes from, for the controls that have one.
 *
 * SOURCE EVIDENCE is the evaluator-facing term. A control that compares a
 * stored field against something Salesforce recorded earlier has to say what
 * that recorded thing is and which configuration stands behind it, or the
 * expected value reads as NorthstarIQ's opinion.
 *
 * Two entries at most: the configuration, and what the record itself carries.
 * Anything longer belongs on the dependency table, which already exists.
 */
export interface SourceEvidenceNote {
  /** One line above the pairs. Says what the section is for, not what it says. */
  intro: string;
  pairs: { term: string; detail: string }[];
}

export interface CheckPresentation {
  /** Operator-facing name. The canonical title stays available as context. */
  label: string;
  /** One line, used on the Overview rows. */
  blurb: string;
  /**
   * The predicate the Overview headline places after "N of M", so the count can
   * be set apart typographically without splitting a finished sentence. Reads
   * as "13 of 13 | open Opportunities evaluated have a past Close Date."
   */
  headlinePredicate: string;
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
  /** The specific RevOps risk this check protects against. Export only. */
  why: string;
  /**
   * The condition NorthstarIQ expects, in one sentence, naming the Salesforce
   * fields it is actually about. Paired with `safeguard` under Control &
   * Safeguard - the two together answer what is expected and what enforces it.
   */
  control: string;
  /**
   * What would show this finding is gone on a later assessment.
   *
   * A read-only recheck condition stated in the control's own fields. It
   * describes evidence to look for, never an action NorthstarIQ takes.
   */
  recheck: string;
  /** The result sentence, built from the live assessment numbers. */
  finding: (failing: number, evaluated: number) => string;
  /** Per-control clauses for the population explanation. */
  explain: ControlExplanation;
  /**
   * Set only where a control's expected value comes from somewhere other than
   * the record being judged. Absent on the controls that read a single field.
   */
  sourceEvidence?: SourceEvidenceNote;
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
    blurb: 'Leads missing the data routing needs.',
    headlinePredicate: 'Leads are missing data required for routing.',
    queueDescription: 'Leads missing data required to determine segment or territory.',
    populationNoun: 'Leads from Routing Readiness Sources',
    denominator: true,
    unit: 'leads',
    why: 'Employee count decides segment and country decides territory. A Lead missing either cannot be segmented or routed deterministically, so it lands in the exception path instead of with a seller and waits on someone noticing it.',
    control:
      'Leads from a Routing Readiness Source carry Country and Employee Count — the two inputs segment and territory are determined from. Salesforce flags a missing value on the record itself, but does not block the Lead being created. Which sources carry this requirement is configured in Salesforce, not in NorthstarIQ.',
    recheck:
      'Country and Employee Count are both populated on the Lead, and it no longer appears in this finding.',
    finding: (f, e) =>
      `${f} of ${e} Leads from Routing Readiness Sources ${f === 1 ? 'is' : 'are'} missing data required for routing.`,
    explain: {
      inScope: 'because their Lead Source is configured as a Routing Readiness Source',
      notEvaluated: 'have a Lead Source that is not configured for this requirement',
      proves:
        'A pass means both inputs are present on the Lead right now. It does not mean the Lead was routed, that its segment or territory are correct, or that any other field is complete.',
    },
    safeguard: {
      kind: 'detective',
      title: 'Completeness stated on the record itself',
      body: 'Data_Quality_Status__c derives Complete or Incomplete from the two fields, and Data_Quality_Detail__c names the one that is absent. Both are formula fields, so the gap is readable on the Lead without a report — but nothing blocks an incomplete Lead from being saved.',
      tech: ['Lead.Data_Quality_Status__c', 'Lead.Data_Quality_Detail__c'],
    },
    verification: [
      'Country present, employee count missing → Incomplete, "Missing: EmployeeCount"',
      'Country missing, employee count present → Incomplete, "Missing: Country"',
      'Both present → Complete, no gap reported',
    ],
    verificationSource:
      'Developer Edition, 2026-08-22 — all four formula branches exercised, including the two stock data could not reach.',
    evidencePath: 'force-app/main/default/objects/Lead/fields/Data_Quality_Status__c.field-meta.xml',
  },

  'segment-consistency': {
    label: 'Segment Assignment Mismatch',
    blurb: 'Leads whose Segment disagrees with Salesforce segmentation evidence.',
    headlinePredicate: 'Leads carry a Segment that disagrees with the recorded segmentation result.',
    queueDescription:
      'Leads whose current Segment differs from the segmentation result Salesforce recorded.',
    populationNoun: 'Leads with a recorded segmentation result',
    denominator: true,
    unit: 'leads',
    why: 'Segment decides the response commitment a Lead is held to and the band it is reported in. A Segment that no longer matches what segmentation determined sends the Lead to the wrong commitment and the wrong pipeline cut at once, and because both values sit on the same record, nothing surfaces the disagreement.',
    control:
      'The Segment stored on a Lead should be the one Salesforce recorded when segmentation ran. Segmentation writes the result and the evidence behind it at intake; nothing afterwards stops the Segment being edited away from it.',
    recheck:
      'The Lead\u2019s Segment matches the Segment named in its recorded segmentation result \u2014 either the Segment is corrected, or segmentation runs again and records a new result.',
    finding: (f, e) =>
      `${f} of ${e} Leads with a recorded segmentation result ${f === 1 ? 'carries' : 'carry'} a Segment that disagrees with it.`,
    explain: {
      inScope: 'because Salesforce recorded a segmentation result NorthstarIQ can read',
      notEvaluated:
        'carry no readable segmentation result, so there is nothing to compare their current Segment against',
      proves:
        'A pass means the current Segment matches the result Salesforce recorded. It does not mean the employee count behind it is correct, or that the segmentation rule is the commercially right one.',
    },
    sourceEvidence: {
      intro: 'Where the expected Segment comes from, and why a historical Lead is safe from it.',
      pairs: [
        {
          term: 'Salesforce Custom Metadata \u2014 Segment Band',
          detail:
            'The employee-count bands segmentation reads, each carrying the Segment it produces and the version of the rule. Changing a band is a configuration record in Salesforce, not a deployment \u2014 which is exactly why a Lead cannot be judged against whichever version happens to be active today.',
        },
        {
          term: 'Recorded on the Lead',
          detail:
            'When segmentation runs it writes what it decided onto the Lead: the employee count it read, the Segment that count resolved to, and the rule version that decided it. NorthstarIQ compares that recorded result with the Segment the Lead carries now. It does not re-run today\u2019s bands over an older Lead, so a legitimate configuration change is never reported as drift.',
        },
      ],
    },
    safeguard: {
      kind: 'detective',
      title: 'Segmentation records its own evidence; nothing protects the result',
      body: 'Segmentation writes both the Segment and the evidence behind it \u2014 the employee count, the Segment it resolved to, and the configuration version that decided it \u2014 onto the Lead as it runs. That evidence is the only reason a later disagreement is detectable at all. Nothing stops the Segment being changed afterwards: it is an editable picklist with no validation rule and no field-level lock, so NorthstarIQ reports the disagreement rather than preventing it.',
      tech: ['Lead.Segment__c', 'Lead.Segment_Basis__c', 'Custom Metadata \u2014 Segment Band'],
    },
    verification: [
      'Recorded result Mid-Market, Segment Mid-Market \u2192 consistent, no finding',
      'Recorded result Mid-Market, Segment SMB \u2192 mismatch reported, both values shown',
      'Recorded result from an earlier rule version \u2192 judged on the recorded result, not on today\u2019s bands',
      'No recorded segmentation result \u2192 not evaluated, and never counted as passing',
    ],
    verificationSource:
      'Application unit tests against fixture records, plus a live Developer Edition run on 2026-08-26. No org-side control exists to test: the Segment field carries no validation rule.',
    evidencePath: 'force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml',
  },

  'routing-exceptions': {
    label: 'Routing Exceptions',
    blurb: 'Leads that could not be safely assigned.',
    headlinePredicate: 'Leads are waiting in the routing exception queue.',
    queueDescription: 'Leads that could not be safely assigned.',
    populationNoun: 'Leads submitted to ownership routing',
    denominator: true,
    unit: 'leads',
    why: 'Inbound Leads need deterministic ownership. Where the routing decision cannot be made safely, guessing an owner attaches a prospect to the wrong seller and the wrong account history — a correction that costs more than the delay.',
    control:
      'A Lead submitted to ownership routing should reach an eligible owner. Where it cannot, Salesforce assigns the routing exception queue and records the reason rather than inventing an owner.',
    recheck:
      'The Lead is no longer owned by the routing exception queue. Routing is decided at intake, so the original reason stays on the record — the owner is what changes.',
    finding: (f, e) =>
      `${f} of ${e} Leads submitted to ownership routing ${f === 1 ? 'is' : 'are'} currently held in the routing exception queue.`,
    explain: {
      notEvaluated: 'were never submitted to NorthstarIQ ownership routing, so they kept their existing owners',
      proves:
        'A pass means only that a Lead is not in the exception queue — not that it was routed correctly or reached an eligible owner.',
    },
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
      'Developer Edition, 2026-08-22 — nine routing fixtures, all passed, covering all three ownership outcomes.',
    evidencePath: 'force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml',
  },

  'sla-risk': {
    label: 'SLA Response Risk',
    blurb: 'Leads at risk of or in SLA breach.',
    headlinePredicate: 'Leads with a measurable SLA are at risk or already breached.',
    queueDescription: 'Leads at risk of or already outside their response commitment.',
    populationNoun: 'SLA-measurable Leads',
    denominator: true,
    unit: 'leads',
    why: 'Inbound Leads carrying a response commitment need timely follow-up. A missed response loses the advantage the commitment existed to protect, and without a measurable target the miss cannot be distinguished from a Lead nobody promised anything about.',
    control:
      'A Lead eligible for a response commitment receives a deadline at intake, and first touch is stamped once when a seller acts. Salesforce measures the gap and reports it; it cannot make anyone respond.',
    recheck:
      'First touch is recorded on or before the deadline. A breach already recorded cannot be undone — the deadline is set once, and the elapsed time is historical.',
    finding: (f, e) =>
      `${f} of ${e} Leads with a measurable SLA commitment ${f === 1 ? 'is' : 'are'} at risk or breached.`,
    explain: {
      notEvaluated: 'carry no SLA commitment that can be measured',
      proves:
        'A pass means the first response landed inside the committed window — it measures timing only, not what was said or whether the Lead progressed.',
    },
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
      'Developer Edition, 2026-08-23 — fifteen SLA scenarios, all passed, including eight negative and guardrail tests.',
    evidencePath: 'force-app/main/default/objects/Lead/fields/SLA_Status__c.field-meta.xml',
  },

  'ambiguous-match': {
    label: 'Ambiguous Account Match',
    blurb: 'Leads where more than one Account shares the domain.',
    headlinePredicate: 'Leads cannot be matched to a single Account without review.',
    queueDescription: 'Leads where account identity could not be resolved safely.',
    populationNoun: 'Leads',
    denominator: false,
    unit: 'leads',
    why: 'Several Accounts can legitimately share a domain — subsidiaries, franchisees, a group structure never cleaned up. Attaching the Lead to whichever one sorts first puts a prospect against the wrong relationship and the wrong history, and nothing afterwards reveals the error.',
    control:
      'A Lead should resolve to one Account or to none. Where several Accounts share its domain, Salesforce records the ambiguity for review and leaves the Account unattached rather than choosing one.',
    recheck:
      'The Lead carries a definite match decision, and the Account it belongs to where one was found. Resolving it needs a person to decide which Account is correct.',
    finding: (f, e) =>
      `${f} of ${e} Leads with a recorded match decision could not be matched to a single Account.`,
    explain: {
      notEvaluated: 'were never put through account matching, so no match decision exists for them',
      proves:
        'A pass means a definite decision was reached — one Account or none. This reads the outcome stored on the Lead; it does not compare Leads against Accounts when the assessment runs.',
    },
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
      'Developer Edition, 2026-08-22 — the ambiguous case came from stock data, where three Accounts genuinely share a domain.',
    evidencePath: 'force-app/main/default/objects/Lead/fields/Match_Status__c.field-meta.xml',
  },

  'missing-territory': {
    label: 'Missing Territory',
    blurb: 'Leads the coverage model could not place in a territory.',
    headlinePredicate: 'Leads evaluated by the coverage model have no territory assigned.',
    queueDescription: 'Leads that the coverage model could not resolve to a territory.',
    populationNoun: 'Leads evaluated by the coverage model',
    denominator: true,
    unit: 'leads',
    why: 'Territory determines coverage. Without one a Lead cannot reach a coverage queue, so it waits in the exception path regardless of how good the rest of the record is. The cause is usually an uncovered market rather than a broken record.',
    control:
      'Every Lead the coverage model evaluates should resolve to exactly one territory from the coverage map. Where the geography is missing or uncovered, Salesforce records that instead of assigning a nearest guess.',
    recheck:
      'The Lead carries a territory — either its country is corrected on the record, or the coverage map gains a record for that market.',
    finding: (f, e) =>
      `${f} of ${e} Leads evaluated by the coverage model did not reach a territory.`,
    explain: {
      notEvaluated: 'were created before territory assignment existed, so no territory was ever set',
      proves:
        'A pass means exactly one territory was determined — not that it is the commercially correct one.',
    },
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
      'Developer Edition, 2026-08-22 — boundary and uncovered-geography cases both exercised.',
    evidencePath: 'force-app/main/default/customMetadata',
    evidenceIsDirectory: true,
  },

  'stale-opportunities': {
    label: 'Stale Open Pipeline',
    blurb: 'Open Opportunities with a close date in the past.',
    headlinePredicate: 'open Opportunities evaluated have a past Close Date.',
    queueDescription: 'Open Opportunities with Close Dates already in the past.',
    populationNoun: 'open Opportunities',
    denominator: true,
    unit: 'opportunities',
    why: 'Open Opportunities with past close dates overstate near-term pipeline and weaken forecast credibility. Coverage and capacity planning both read from these dates, so the error compounds quietly across every number built on them.',
    control:
      'An open Opportunity should carry a close date of today or later. Nothing in Salesforce enforces this: re-dating a slipped deal is a judgement call, so NorthstarIQ reports the condition rather than blocking the save.',
    recheck:
      'The close date is today or later, or the Opportunity is closed — at which point it leaves this control’s population.',
    finding: (f, e) =>
      `${f} of ${e} open Opportunities have a close date in the past.`,
    explain: {
      notEvaluated: 'are closed, so they are no longer part of open pipeline',
      proves: 'A pass means the date has not lapsed — not that it is realistic.',
    },
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
      'Application unit tests against fixture records. No org-side test exists, because no org-side control was built.',
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
  /** The operator question this area answers. Asked, then scored. */
  question: string;
}

export const AREAS: Record<Category, AreaPresentation> = {
  'Data Quality': {
    label: 'Inbound Lead Data Integrity',
    scope: 'Routing data completeness, and Segment consistency with recorded segmentation evidence.',
    question:
      'Do Leads carry the data routing needs, and does the Segment they hold still agree with the evidence behind it?',
  },
  Routing: {
    label: 'Lead Routing Reliability',
    scope: 'Territory coverage and safe owner assignment.',
    question: 'Are governed inbound Leads reaching a valid territory and owner path?',
  },
  'Identity & Matching': {
    label: 'Account Match Confidence',
    scope: 'Lead-to-Account matching without unresolved review.',
    question: 'Can Leads be matched to an Account without ambiguity?',
  },
  'SLA Performance': {
    label: 'Lead Response SLA',
    scope: 'Response performance for Leads with an SLA commitment.',
    question: 'Are Leads with a measurable SLA within the expected response window?',
  },
  'Pipeline Hygiene': {
    label: 'Open Pipeline Date Health',
    scope: 'Close Date integrity across open Opportunities.',
    question: 'Do open Opportunities have a current or future Close Date?',
  },
};

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

/* ------------------------------------------------------------ overview */

/**
 * The area the Overview leads with: the lowest score, then the larger affected
 * population, then canonical order. Presentation only — nothing here changes a
 * score, and the canonical order in score.ts still governs how areas are listed.
 */
export function mostAffectedArea<T extends { category: Category; score: number; checkIds: CheckId[] }>(
  areas: T[],
  findings: { id: CheckId; affected: number }[],
): T | null {
  if (areas.length === 0) return null;
  const affectedIn = (a: T) =>
    a.checkIds.reduce((sum, id) => sum + (findings.find((f) => f.id === id)?.affected ?? 0), 0);
  return areas.reduce((worst, a) => {
    if (a.score !== worst.score) return a.score < worst.score ? a : worst;
    return affectedIn(a) > affectedIn(worst) ? a : worst;
  }, areas[0]);
}

/**
 * The finding that carries an area's headline: the largest affected population
 * inside it. Returns null for an area where every check passed, because there
 * is then no finding to point at and none should be invented.
 */
export function leadFinding<T extends { id: CheckId; affected: number }>(
  checkIds: CheckId[],
  findings: T[],
): T | null {
  const owned = findings.filter((f) => checkIds.includes(f.id));
  if (owned.length === 0) return null;
  return owned.reduce((most, f) => (f.affected > most.affected ? f : most), owned[0]);
}


/**
 * "Aug 24, 2026, 10:45 PM EDT" — the moment an observation was read from the org.
 *
 * Rendered in `America/New_York` because that is where this system is operated
 * and read. The zone abbreviation comes from `timeZoneName`, so it resolves to
 * EDT or EST according to the offset actually in force on that date — daylight
 * saving is never hard-coded, and a timestamp from January and one from July
 * both label themselves correctly.
 *
 * The zone is pinned rather than taken from the viewer's locale so that a
 * server render and a client render agree, and so two people comparing the
 * same observation are reading the same clock.
 *
 * Shared by every surface that reports an observation time. Navigation
 * currently performs independent reads, so each page states the moment it read
 * rather than implying one durable snapshot.
 */
const OBSERVED_AT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZoneName: 'short',
});

export function formatObservedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'an unrecorded time';
  return OBSERVED_AT.format(d);
}

/** "Leads and Opportunities" — objects named so the record count means something. */
export function objectPhrase(objects: string[]): string {
  const plural = objects.map((o) => (o.endsWith('y') ? `${o.slice(0, -1)}ies` : `${o}s`));
  if (plural.length <= 1) return plural[0] ?? 'records';
  return `${plural.slice(0, -1).join(', ')} and ${plural[plural.length - 1]}`;
}
