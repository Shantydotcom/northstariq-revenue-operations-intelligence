import type { Category, CheckId } from './types.ts';

/**
 * Operator-facing content for the eleven checks.
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
   * What the records OUTSIDE this control have in common, as a predicate.
   *
   * `notEvaluated` above covers both not-evaluated states in one clause -
   * "either assert no progression at all, or assert one nothing can settle".
   * The Assessment page counts those two separately, so it needs the first
   * half on its own. Reads as "28 Leads <notClaimed>."
   *
   * Present only on the lifecycle controls, which are the ones the Assessment
   * page states a population story for.
   */
  notClaimed?: string;
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
  /** Null when the control reached no pass/fail determination. */
  score: number | null;
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
  } else {
    /*
     * Said plainly, because the alternative is a reader inferring a pass from
     * silence. This control judged nothing, so it has no score - and which
     * kind of nothing it judged is the whole distinction Model v2 protects.
     */
    out.push(
      f.unmeasurableCount > 0
        ? 'It reached no pass or fail on any record, so it is not scored: the records it applies to carry no evidence it can judge.'
        : 'It reached no pass or fail on any record, so it is not scored: no record in the org is in scope for it.',
    );
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
  /**
   * The formal name, and the name of the FINDING this check can raise.
   *
   * "Converted Lifecycle State Not Substantiated" names a problem, which is
   * what the findings queue and the finding page are for.
   */
  label: string;
  /**
   * What the Assessment page calls the check itself.
   *
   * Present only where naming the CHECK differs from naming its FAILURE - the
   * lifecycle four, whose formal label is a finding sentence. Everywhere else
   * the label already reads as a check name and this is omitted, so there is
   * one string to maintain rather than two saying the same thing.
   */
  checkName?: string;
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

  'lifecycle-progression': {
    label: 'Lead Lifecycle Progression Conflicts',
    checkName: 'Stage Progression',
    blurb: 'Leads whose lifecycle evidence contradicts the governed progression.',
    headlinePredicate:
      'Leads carry lifecycle evidence that contradicts the governed progression.',
    queueDescription:
      'Leads whose retained transition history or stage evidence conflicts with the governed model.',
    populationNoun: 'Leads whose progression could be settled',
    denominator: true,
    unit: 'leads',
    why: 'A lifecycle stage is supposed to mean the same thing to Marketing, Sales and the forecast. Where a record reached a stage by a route the business does not permit, or carries evidence for a stage it never passed through, every funnel figure counting that stage is counting something else \u2014 and nobody can tell which records are affected without opening them one at a time.',
    control:
      'A Lead\u2019s retained transition history and stage evidence should agree with the governed transition policy: it moved only in ways the policy permits, its evidence belongs to stages it could have passed through, and its timestamps order sensibly against its own creation.',
    recheck:
      'Either the record is corrected so its evidence and stage agree, or the governed policy is changed to permit what actually happens. Re-running the assessment re-reads the policy, so a deliberate change to the governed model is picked up without a code change.',
    finding: (f, e) =>
      `${f} of ${e} Leads whose progression could be settled ${f === 1 ? 'carries' : 'carry'} lifecycle evidence that contradicts the governed transition policy.`,
    explain: {
      inScope:
        'because retained evidence \u2014 transition history, a stage-entry timestamp, or stage evidence \u2014 is sufficient to settle whether their progression agrees with the governed model',
      notClaimed:
        'have not moved from where their lifecycle begins, so there is no movement to evaluate',
      notEvaluated:
        'either assert no progression at all, or assert one that nothing Salesforce still retains can settle \u2014 field history is bounded and the stage evidence fields did not exist when the baseline was created',
      proves:
        'A pass means nothing in the retained evidence contradicts the governed progression. It does not mean the full history was reconstructed: Salesforce does not retain one, and a Lead can pass here while its earliest transitions are simply unknown.',
    },
    sourceEvidence: {
      intro: 'Where the expected progression comes from, and what the record is measured against.',
      pairs: [
        {
          term: 'Salesforce Custom Metadata \u2014 Lifecycle Transition',
          detail:
            'One record per permitted stage-to-stage move, and the only definition of which stage may follow which. NorthstarIQ builds its picture of the governed lifecycle from these records at assessment time \u2014 the same records the intake Flow consults before permitting a save. Change the policy and this control changes with it. \u26a0\ufe0f Synthetic Baseline: the transition set was authored for reproducible demonstration, not validated with a client.',
        },
        {
          term: 'Salesforce field history \u2014 Lead Status',
          detail:
            'The transitions Salesforce still retains. \u26a0\ufe0f Deliberately treated as partial: history is bounded, was not always tracked, and never records a Lead\u2019s first status. A transition missing from history is not evidence it never happened, so absence never counts against a record.',
        },
        {
          term: 'Stage evidence written by the intake Flow',
          detail:
            'The stage-entry timestamp, and the qualification, acceptance and sales-qualification evidence. Their presence is also how this control knows the lifecycle safeguard actually ran on a record \u2014 which is what separates a rule broken from a record that moved before the rules existed.',
        },
      ],
    },
    safeguard: {
      kind: 'preventive',
      title: 'Salesforce refuses a move the policy does not permit',
      body: 'The intake Flow checks every status change against the governed transition policy and blocks the save when no permitted transition matches, naming the move it refused. It also stamps the stage-entry timestamp whenever it allows one. That safeguard governs new transitions only \u2014 it cannot reach the records that progressed before it existed, which is exactly what this control is for.',
      tech: ['Lead_Inbound_Before_Save', 'Lifecycle_Transition__mdt', 'Lead.Lifecycle_Stage_Entered__c'],
    },
    verification: [
      'A permitted transition saves and stamps the stage-entry timestamp',
      'A transition absent from the policy is refused and nothing is written',
      'Native Salesforce Lead Conversion is governed by the same policy',
    ],
    verificationSource:
      'Application unit tests against fixture records, plus a live read-only Developer Edition run on 2026-08-27. \u26a0\ufe0f This detective control was created after the preventive safeguard was validated; it was not used during that validation.',
    evidencePath: 'force-app/main/default/objects/Lifecycle_Transition__mdt/Lifecycle_Transition__mdt.object-meta.xml',
  },

  'mql-integrity': {
    label: 'Marketing-Qualified Claims Not Substantiated',
    checkName: 'MQL Qualification',
    blurb: 'Leads claiming Marketing qualification the governed policy does not support.',
    headlinePredicate:
      'Leads claim Marketing qualification the governed policy does not support.',
    queueDescription:
      'Leads on the governed qualified stage whose evidence fails the active MQL policy.',
    populationNoun: 'Leads whose Marketing-qualified claim can be checked',
    denominator: true,
    unit: 'leads',
    why: 'A Marketing-qualified Lead that cannot be explained is one Sales has to re-qualify from scratch \u2014 which is the Marketing/Sales disagreement over what "qualified" means, expressed as wasted seller time. The point of a governed definition is that the handoff arrives with its reasoning attached.',
    control:
      'A Lead claiming Marketing qualification should satisfy the MQL policy in force, read from Salesforce at assessment time. NorthstarIQ evaluates the governed source facts itself rather than trusting the recorded basis \u2014 the basis proves a decision was made, not that it still holds.',
    recheck:
      'Either the underlying evidence is corrected so the Lead genuinely satisfies the policy, or its lifecycle claim is corrected to one it can support. Re-running the assessment re-reads the policy, so a deliberate change to the governed definition is picked up without a code change.',
    finding: (f, e) =>
      `${f} of ${e} Leads whose Marketing-qualified claim could be checked ${f === 1 ? 'does' : 'do'} not satisfy the qualification policy in force.`,
    explain: {
      inScope:
        'because they sit on the governed qualified stage with recorded qualification evidence, so their current values are the ones that qualified them',
      notClaimed:
        'make no Marketing-qualified claim, so there is nothing to substantiate',
      notEvaluated:
        'either make no Marketing-qualified claim, or make one that cannot be re-judged honestly \u2014 no recorded evidence, a superseded policy version, progression past the stage, or a condition that was never evaluated',
      proves:
        'A pass means the Lead satisfies every requirement the active policy switches on. It does not mean the qualification was commercially sound, that Sales accepted it, or that the recorded evidence was correct when written.',
    },
    sourceEvidence: {
      intro: 'Where the definition of "Marketing Qualified" comes from, and which record decides it.',
      pairs: [
        {
          term: 'Salesforce Custom Metadata \u2014 MQL Qualification Policy',
          detail:
            'One active record states which requirements constitute MQL and which lifecycle stage they govern. NorthstarIQ reads that record at assessment time and tests only the requirements it switches on \u2014 the same record the Salesforce safeguard consults before permitting the transition. \u26a0\ufe0f Synthetic Baseline: this policy was authored for reproducible demonstration, not validated with a client.',
        },
        {
          term: 'Salesforce Custom Metadata \u2014 Routing Readiness Source',
          detail:
            'Which acquisition sources the business holds to a routing-readiness standard. The policy says the requirement applies; this configuration says which sources satisfy it.',
        },
        {
          term: 'Salesforce Custom Metadata \u2014 Segment Band',
          detail:
            'Which segments the business qualifies, held on the band that already defines the segment rather than restated in a second place.',
        },
        {
          term: 'Recorded qualification evidence on the Lead',
          detail:
            'Written by the intake Flow at the moment a Lead earned MQL, and read-only to every principal. It establishes that a governed decision was made and under which policy version \u2014 it is not treated as proof that the decision still holds.',
        },
      ],
    },
    safeguard: {
      kind: 'preventive',
      title: 'Salesforce refuses an unsupported new qualification',
      body: 'The intake Flow reads the active MQL policy on every status change and blocks entry to the qualified stage unless every requirement it declares is satisfied, naming the ones that were not. When it permits the move it records why, on the Lead, in a field no principal can edit. That safeguard governs NEW transitions; this control is the other half, judging the claims that already exist.',
      tech: ['Lead_Inbound_Before_Save', 'MQL_Qualification_Policy__mdt', 'Lead.MQL_Basis__c'],
    },
    verification: [
      'A Lead satisfying every requirement is permitted and its qualification evidence recorded',
      'Each requirement failed on its own — ungoverned source, ineligible segment, unresolved territory, ambiguous match — blocks the transition and records nothing',
      'A qualification-eligible Lead attempting a structurally invalid transition is refused by the lifecycle policy first',
    ],
    verificationSource:
      'Application unit tests against fixture records, plus a live read-only Developer Edition run on 2026-08-27. \u26a0\ufe0f This control was created after the Salesforce preventive safeguard was validated; it was not used during that validation.',
    evidencePath: 'force-app/main/default/objects/MQL_Qualification_Policy__mdt/MQL_Qualification_Policy__mdt.object-meta.xml',
  },

  'sales-acceptance-sql': {
    label: 'Sales Handoff and Qualification Evidence Conflicts',
    checkName: 'Sales Handoff & Qualification',
    blurb: 'Leads whose Sales acceptance or qualification evidence conflicts with the policy that permitted it.',
    headlinePredicate:
      'Leads carry Sales handoff evidence that conflicts with the governed policy.',
    queueDescription:
      'Leads whose recorded Sales acceptance or qualification evidence does not hold together.',
    populationNoun: 'Leads whose Sales handoff claim can be checked',
    denominator: true,
    unit: 'leads',
    why: 'Sales should not have to repeat Marketing’s qualification to work out why a prospect was handed over, and a sales-qualified Lead should carry what Sales established after accepting it rather than the same claim restated. Where the evidence chain breaks, an accepted handoff is indistinguishable from an unread one, and a genuine pursuit from an optimistic stage change — which is the argument between Marketing and Sales made unresolvable.',
    control:
      'A Lead claiming Sales acceptance should carry the acceptance evidence the active acceptance policy requires — who accepted it, when, and on what basis — and a Lead claiming sales qualification should carry the additional commercial evidence the active SQL policy requires on top of that acceptance. Two governed policies, read from Salesforce at assessment time, and two separate business events.',
    recheck:
      'Either the evidence chain is completed so the claim holds together, or the lifecycle claim is corrected to one the record can support. Re-running the assessment re-reads both policies, so a deliberate change to either governed definition is picked up without a code change.',
    finding: (f, e) =>
      `${f} of ${e} Leads whose Sales handoff claim could be checked ${f === 1 ? 'carries' : 'carry'} evidence that conflicts with the policy that permitted it.`,
    explain: {
      inScope:
        'because they claim Sales acceptance or sales qualification and carry the governed evidence needed to settle that claim',
      notClaimed:
        'claim neither the Sales handoff nor sales qualification',
      notEvaluated:
        'either claim neither, or claim one the evidence cannot settle — the claim predates the acceptance and qualification fields, it was recorded under a superseded policy version, or nothing Salesforce retains establishes when it was qualified',
      proves:
        'A pass means the recorded evidence satisfies every requirement the two active policies switch on. It does not mean the acceptance was commercially sound, that the business need was real, or that the next step ever happened.',
    },
    sourceEvidence: {
      intro:
        'Where the two definitions come from, and why the seller’s own fields are not what is judged.',
      pairs: [
        {
          term: 'Salesforce Custom Metadata — Sales Acceptance Policy',
          detail:
            'One active record states what Sales acceptance requires — an explicitly accepting seller, and a Marketing handoff that was itself substantiated — and which stage it governs. NorthstarIQ tests only the requirements it switches on, from the same record the Salesforce safeguard consults. ⚠️ Synthetic Baseline: authored for reproducible demonstration, not validated with a client.',
        },
        {
          term: 'Salesforce Custom Metadata — SQL Qualification Policy',
          detail:
            'A separate active record, kept separate on purpose: sales qualification requires substantiated acceptance, a governed business need confirmed with the prospect, and an agreed next step. Accepting a handoff and qualifying a pursuit are different business events, and merging them would hide exactly the step Sales is accountable for. ⚠️ Synthetic Baseline.',
        },
        {
          term: 'Recorded acceptance and qualification evidence on the Lead',
          detail:
            'Written by the intake Flow at the moment each decision was granted, read-only to every principal, and never overwritten afterwards — so a converted Lead still carries both. The qualification evidence records the business need and the next-step date AS THEY STOOD, which is what makes the decision re-readable later.',
        },
        {
          term: 'Seller inputs — deliberately not treated as evidence',
          detail:
            'The acceptance checkbox, the business need and the next-step date are fields a seller edits. They describe the Lead now, not the moment the decision was made, so a ticked box on a Lead with no acceptance evidence proves nothing. Nor does the first-touch timestamp: a seller working a Lead is activity, not Sales accepting the handoff.',
        },
      ],
    },
    safeguard: {
      kind: 'preventive',
      title: 'Salesforce refuses an unsupported acceptance and an unsupported qualification',
      body: 'The intake Flow reads both active policies on a status change and blocks entry to the accepted stage or the qualified stage unless every requirement that policy declares is satisfied, naming the ones that were not. When it permits a move it records who accepted, when, and why, and separately what Sales established — in fields no principal can edit. Those safeguards govern NEW transitions only; they cannot reach records that moved before they existed, which is what this control is for.',
      tech: [
        'Lead_Inbound_Before_Save',
        'Sales_Acceptance_Policy__mdt',
        'SQL_Qualification_Policy__mdt',
        'Lead.Sales_Accepted_At__c',
        'Lead.SQL_Basis__c',
      ],
    },
    verification: [
      'Sales acceptance requires an explicit seller acceptance and a substantiated Marketing handoff; each failed on its own blocks the transition and records nothing',
      'SQL requires substantiated acceptance, a governed business need and a next step dated no earlier than the qualification; each failed on its own blocks the transition',
      'Acceptance and qualification evidence both survive a native Salesforce Lead Conversion intact',
    ],
    verificationSource:
      'Application unit tests against fixture records, plus a live read-only Developer Edition run on 2026-08-27. ⚠️ This detective control was created after the two preventive safeguards were validated; it was not used during that validation, and it did not govern any record that predates them.',
    evidencePath:
      'force-app/main/default/objects/SQL_Qualification_Policy__mdt/SQL_Qualification_Policy__mdt.object-meta.xml',
  },

  'lifecycle-conversion': {
    label: 'Converted Lifecycle State Not Substantiated',
    checkName: 'Opportunity Conversion',
    blurb: 'Leads claiming conversion that Salesforce does not record as converted.',
    headlinePredicate:
      'Leads claim a converted lifecycle state Salesforce does not substantiate.',
    queueDescription:
      'Leads whose status claims conversion while Salesforce records none.',
    populationNoun: 'Leads claiming a converted lifecycle state',
    denominator: true,
    unit: 'leads',
    why: 'Conversion is where Marketing hands the outcome to Sales, and every funnel and conversion-rate figure counts it. A status that says converted while Salesforce records no conversion inflates that count and points at an Account and Contact that were never created \u2014 so Sales cannot find what it was told exists. An Opportunity is optional at conversion, so its absence is never what is wrong here.',
    control:
      'A Lead claiming a converted lifecycle state should carry the Salesforce Lead Conversion facts that substantiate it: `IsConverted`, written by the platform during conversion and not editable afterwards, together with the Converted Date, Account and Contact that conversion produced. An Opportunity is optional at conversion, so a Converted Opportunity is never required. The status picklist is a claim; the platform flag is the fact.',
    recheck:
      'Either the Lead is converted through Salesforce so its conversion record exists, or its status is corrected to one that makes no conversion claim. A status alone cannot resolve this finding.',
    finding: (f, e) =>
      `${f} of ${e} Leads claiming a converted lifecycle state ${f === 1 ? 'has' : 'have'} no Salesforce conversion record to support it.`,
    explain: {
      inScope: 'because their status claims the Lead was converted',
      notClaimed:
        'make no claim to have been converted',
      notEvaluated: 'make no claim to have been converted, so there is nothing to substantiate',
      proves:
        'A pass means Salesforce records the Lead as converted. It does not mean the conversion met any qualification criteria, produced an Opportunity, or happened at the right time \u2014 a converted Lead may legitimately have no Opportunity at all.',
    },
    sourceEvidence: {
      intro: 'Where the expectation comes from, and which field decides it.',
      pairs: [
        {
          term: 'Salesforce standard value set \u2014 Lead Status',
          detail:
            'One entry in the governed Lead Status value set carries Salesforce\u2019s own `converted` marker. A Lead sitting on that value is making a claim about its lifecycle, which is what brings it into this control\u2019s population. The value set is in source control.',
        },
        {
          term: 'Salesforce Lead Conversion facts',
          detail:
            '`IsConverted` is set by the platform during Lead Conversion and is not writable afterwards, and the same transaction populates the Converted Date, Account and Contact. That is why it settles the question and the status picklist does not. A null Converted Opportunity is not a failure: the conversion screen carries a \u201cdon\u2019t create an opportunity\u201d option, so a converted Lead may legitimately have none.',
        },
        {
          term: 'Salesforce Custom Metadata \u2014 Lifecycle Transition',
          detail:
            'A different question, kept separate on purpose. The platform fields say whether conversion actually happened; these records say whether entry into the converted stage was permitted from where the Lead stood. That second question is what the preventive safeguard enforces \u2014 including through native Lead Conversion \u2014 and it is not what this control judges.',
        },
      ],
    },
    safeguard: {
      kind: 'preventive',
      title: 'Salesforce refuses an unsupported transition into the converted stage',
      body: 'The intake Flow checks every status change against the governed transition policy and blocks the save when no permitted transition matches. Native Salesforce Lead Conversion takes the same path: converting from a stage the policy gives no route to the converted status is refused, and the whole conversion transaction rolls back \u2014 no Account, Contact or Opportunity is left behind. That safeguard governs NEW transitions only. It could not reach records that already held a converted status before it existed, and those are exactly what this control finds.',
      tech: ['Lead_Inbound_Before_Save', 'Lifecycle_Transition__mdt', 'Lead.Status', 'Lead.IsConverted'],
    },
    verification: [
      'Status claims converted, Salesforce records not converted \u2192 reported',
      'Status claims converted, Salesforce records converted \u2192 passes',
      'Converted Lead with no Opportunity \u2192 passes; a null Opportunity is not a failure',
      'Status makes no conversion claim \u2192 outside the control, never counted as passing',
      'Native Lead Conversion from a permitted stage \u2192 allowed, and Salesforce populates the conversion facts',
      'Native Lead Conversion from a stage the policy gives no route from \u2192 blocked, and the whole transaction rolls back',
    ],
    verificationSource:
      'Application unit tests against fixture records, plus a read-only observation of the Developer Edition org on 2026-08-27. The two native-conversion outcomes are prior validated evidence from the conversion experiment of 2026-08-27 \u2014 two purpose-built fixtures, both deleted afterwards, no baseline record touched. \u26a0\ufe0f This detective control was not used during that validation, and no safeguard governed the baseline records that predate it.',
    evidencePath: 'force-app/main/default/standardValueSets/LeadStatus.standardValueSet-meta.xml',
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
  /**
   * The formal name of the assessment area.
   *
   * Kept where precision is the point: the finding page heading, traceability
   * records and the export files, which are audit artefacts.
   */
  label: string;
  /**
   * What an evaluator reads on the Assessment page.
   *
   * The approved Assessment design names areas in the language a Revenue
   * Operations reader already uses. A display string and nothing else -
   * `Category` remains the identity, and no score, filter or export is keyed
   * on this.
   */
  displayName: string;
  /** One line: what population and process the score covers. */
  scope: string;
  /** The operator question this area answers. Asked, then scored. */
  question: string;
}

export const AREAS: Record<Category, AreaPresentation> = {
  'Data Quality': {
    label: 'Inbound Lead Data Integrity',
    displayName: 'Lead Information',
    scope: 'Routing data completeness, and Segment consistency with recorded segmentation evidence.',
    question:
      'Do Leads carry the data routing needs, and does the Segment they hold still agree with the evidence behind it?',
  },
  Routing: {
    label: 'Lead Routing Reliability',
    displayName: 'Lead Assignment',
    scope: 'Territory coverage and safe owner assignment.',
    question: 'Are governed inbound Leads reaching a valid territory and owner path?',
  },
  'Identity & Matching': {
    label: 'Account Match Confidence',
    displayName: 'Account Matching',
    scope: 'Lead-to-Account matching without unresolved review.',
    question: 'Can Leads be matched to an Account without ambiguity?',
  },
  'SLA Performance': {
    label: 'Lead Response SLA',
    displayName: 'Lead Follow-Up',
    scope: 'Response performance for Leads with an SLA commitment.',
    question: 'Are Leads with a measurable SLA within the expected response window?',
  },
  'Pipeline Hygiene': {
    label: 'Open Pipeline Date Health',
    displayName: 'Opportunity Dates',
    scope: 'Close Date integrity across open Opportunities.',
    question: 'Do open Opportunities have a current or future Close Date?',
  },
  /*
   * Assessment Area #6. SCORED since Assessment Model v2, by four controls:
   * lifecycle progression, MQL qualification, Sales acceptance / SQL, and
   * Opportunity conversion. Two of them can legitimately judge no record on
   * a baseline that predates the evidence architecture, so this is the first
   * area where an unscored control is an ordinary outcome rather than a bug.
   */
  'Lifecycle Governance': {
    label: 'Lifecycle Governance',
    displayName: 'Lead Lifecycle',
    scope: 'Lifecycle claims against the Salesforce record that substantiates them.',
    question:
      'Do Leads reach each lifecycle stage by a route the business permits, with the governed evidence to support the claim?',
  },
};

/** What the Assessment page calls this area. */
export function areaDisplayName(category: Category): string {
  return AREAS[category].displayName;
}

/**
 * What the Assessment page calls this check.
 *
 * Falls back to the formal label, which already reads as a check name for the
 * seven checks outside the lifecycle area.
 */
export function checkDisplayName(id: CheckId): string {
  const p = PRESENTATION[id];
  return p.checkName ?? p.label;
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

/* ------------------------------------------------------------ overview */

/**
 * The area the Overview leads with: the lowest score, then the larger affected
 * population, then canonical order. Presentation only — nothing here changes a
 * score, and the canonical order in score.ts still governs how areas are listed.
 */
export function mostAffectedArea<
  T extends { category: Category; score: number | null; checkIds: CheckId[] },
>(areas: T[], findings: { id: CheckId; affected: number }[]): T | null {
  /*
   * Only areas that produced a score can be compared. An unscored area is
   * not the weakest one - it is the one nothing is known about, and calling
   * it the lowest would be the same overclaim in the opposite direction.
   */
  const scored = areas.filter(
    (a): a is T & { score: number } => a.score !== null,
  );
  if (scored.length === 0) return null;
  const affectedIn = (a: T) =>
    a.checkIds.reduce((sum, id) => sum + (findings.find((f) => f.id === id)?.affected ?? 0), 0);
  return scored.reduce((worst, a) => {
    if (a.score !== worst.score) return a.score < worst.score ? a : worst;
    return affectedIn(a) > affectedIn(worst) ? a : worst;
  }, scored[0]);
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
