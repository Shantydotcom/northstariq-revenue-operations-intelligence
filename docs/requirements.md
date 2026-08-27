# Requirements

| | |
|---|---|
| **Purpose** | The business capabilities this project must deliver, and the decisions that shape them |
| **Count** | 23 core requirements, consolidated from 62 |
| **Status** | **Target State.** This document states required outcomes, not delivery. [`implementation-log.md`](implementation-log.md) is the sole authority on what is built. `BR-14`, `BR-16`, `BR-17`, `BR-19` and `BR-23` remain deliberately unbuilt. |
| **Related** | [`business-case.md`](business-case.md) · [`architecture.md`](architecture.md) · [`data-model.md`](data-model.md) · [`testing-strategy.md`](testing-strategy.md) |

---

## 1. How to Read This

Requirements state **business outcomes**, not technical implementations.

> ✅ "Revenue Operations must be able to determine why a Lead was assigned to a specific seller
> without inspecting Flow debug output."
>
> ❌ "Create `Routing_Reason__c`."

The second sentence forecloses the design. The first states what must be true and leaves the
mechanism to [`architecture.md`](architecture.md), where alternatives can still be weighed against
what the org already provides.

**Every implemented component must trace back to a requirement here.** If you cannot name the
`BR-##` a change serves, the change is not ready to be made.

### Build intent

| Level | Meaning |
|---|---|
| **P0** | Must be built and validated in this release |
| **P1** | Built if the complexity envelope allows after org inspection |
| **P2** | Documented and deferred — the requirement stands, the build does not |

**Build intent is not the same as importance.** A P2 requirement is not less valid; it is less
buildable inside a small, maintainable footprint.

---

## 2. Requirements

### Data Quality

#### `BR-01` — Inbound data is normalized to governed formats at capture

| | |
|---|---|
| **Problem** | `PROB-001` — domains, countries, and source values arrive in inconsistent formats. A domain that is present but unusable is functionally missing, and defeats the primary matching signal. |
| **Requirement** | Inbound data must be normalized to governed formats at capture, so that matching, segmentation, and territory assignment operate on consistent values rather than compensating for format variance. |
| **Rationale** | Normalization applied once at capture is cheaper and more reliable than normalization repeated inside every consuming process. It also makes the baseline meaningful — "22% unusable domain" only has a stable meaning once "usable" is defined. |
| **Acceptance** | 1. A domain supplied with protocol, path, or `www.` prefix is stored as the normalized registrable domain.<br>2. A country supplied as name, code, or common variant is stored as the governed canonical value.<br>3. A value that cannot be normalized is marked as unnormalizable rather than silently altered.<br>4. Lead source and channel accept only governed values. |
| **Build intent** | **P0** |

#### `BR-02` — Routing-critical completeness is assessed and explainable per record

| | |
|---|---|
| **Problem** | `PROB-001` — 48% of Leads lack a field routing requires. Nothing identifies an incomplete record as incomplete, so it enters downstream processes and fails there instead. |
| **Requirement** | Every inbound record must have its completeness against routing-critical data assessed and recorded at capture, and the specific reason for an incomplete result must be readable on the record itself. |
| **Rationale** | Failing early and visibly is cheaper than failing late and silently. An incomplete record detected at capture can be enriched, queued, or routed to an exception path; the same record detected at routing has already consumed SLA clock and seller attention. "Incomplete" without "why" moves the investigation rather than ending it. |
| **Acceptance** | 1. A record missing one or more routing-critical attributes carries a completeness state distinguishing it from a complete record.<br>2. A complete record carries no incompleteness state.<br>3. The assessment is repeatable — the same input produces the same state.<br>4. The reason is readable without running a report or inspecting debug logs.<br>5. Assessment occurs without a user requesting it. |
| **Build intent** | **P0** |

### Identity

#### `BR-03` — A Lead's relationship to an existing Account is determined explicitly, with the basis recorded

| | |
|---|---|
| **Problem** | `PROB-002` — existing customers are worked as net-new prospects. The relationship exists in the data but is never established on the record. |
| **Requirement** | Each inbound record's relationship to an existing Account must be resolved explicitly, and both the outcome and the basis for it must be recorded. Where the evidence is insufficient to decide, the record must resolve to a review state rather than a guess. |
| **Rationale** | An unmatched existing customer is routed as a prospect, which is both a commercial error and an experience failure. Recording the basis is what makes the match auditable and the threshold tunable — a match no one can explain cannot be trusted or improved. |
| **Acceptance** | 1. Every assessed record carries one of: matched, review, or no match.<br>2. A matched record references the Account it matched.<br>3. The basis (which signal produced the outcome) is recorded.<br>4. Insufficient evidence produces review, never a silent match or a silent no-match.<br>5. Where a match is found, the Account's customer status is available to routing. |
| **Decision** | `PD-04` — match confidence bands |
| **Build intent** | **P0** |

#### `BR-04` — Potential duplicates are surfaced for review, never silently merged

| | |
|---|---|
| **Problem** | `PROB-008` — 14.2% of Leads have a probable duplicate; 9.1% duplicate an existing Contact. Multiple sellers work the same person. |
| **Requirement** | Probable duplicates must be detected and made visible to a human for resolution. The system must never merge records automatically, and merge capability must be a separately granted, audited action. |
| **Rationale** | Merge is irreversible. While the commercial policy on subsidiaries and franchisees is unresolved (`OD-01`), an unknown share of apparent duplicates are legitimately distinct entities — automatic merge would destroy real records to improve a metric that must not be a target. |
| **Acceptance** | 1. A record with a probable duplicate is flagged and visible in a review destination.<br>2. No automated process merges records.<br>3. Merge capability is granted separately from routine record access.<br>4. Lead-to-Contact duplication is identified before outreach, not after. |
| **Decision** | `OD-01` — open |
| **Build intent** | **P1** |

### Segmentation & Territory

#### `BR-05` — Segment is derived from governed configuration, with the basis and any override recorded

| | |
|---|---|
| **Problem** | `PROB-004` — segmentation is unreliable, inherits upstream data defects, and no one can say why a record carries the segment it does. |
| **Requirement** | Segment must be derived from a single set of governed, versioned rules held as configuration. The basis for each derivation, and any manual override, must be recorded on the record. |
| **Rationale** | Segment drives motion, seller, and SLA. A segment no one can explain is a routing input no one can trust. Holding thresholds as configuration means a business change is a configuration change, not a deployment. |
| **Acceptance** | 1. Two records with identical inputs derive identical segments.<br>2. The basis is recorded and readable on the record.<br>3. A manual override is distinguishable from a derived value.<br>4. Threshold changes take effect without code deployment.<br>5. A record whose segment cannot be derived is surfaced as an exception, never defaulted to a segment. |
| **Decision** | `PD-01`, `PD-02` |
| **Build intent** | **P0** |

#### `BR-06` — Territory resolves deterministically, including at boundaries

| | |
|---|---|
| **Problem** | `PROB-009` — territory definitions are inconsistent across segments; boundary cases resolve differently depending on who touches them. |
| **Requirement** | Territory must resolve deterministically from governed configuration for every record, including records at a boundary between two definitions, and including records whose geography is absent. |
| **Rationale** | Ambiguous coverage produces ownership disputes and unmeasurable capacity. Determinism at the boundary is the whole test — anything resolves correctly in the middle of a territory. |
| **Acceptance** | 1. Identical geography inputs always resolve to the same territory.<br>2. A record on a defined boundary resolves to exactly one territory.<br>3. A record with no usable geography resolves to an explicit unassignable state, not a default territory.<br>4. Territory definitions are configuration, changeable without deployment. |
| **Decision** | `PD-11` |
| **Build intent** | **P0** |

### Routing

#### `BR-07` — An approved ownership precedence exists and is applied consistently

| | |
|---|---|
| **Problem** | `PROB-005` — three assignment bases (named/strategic designation, existing ownership, territory) can each claim the same record, and no precedence has ever been agreed. |
| **Requirement** | A single ownership precedence must be defined and applied to every assignment. Strategic and named accounts must not be routed away from their owner silently. |
| **Rationale** | This is the project's clearest example of a problem that is not technical. Any precedence is implementable; the failure is that none was chosen. Choosing one — and recording it — is the fix. |
| **Acceptance** | 1. When two or more bases claim a record, the outcome follows the recorded precedence.<br>2. A record belonging to a strategic or named Account is not assigned elsewhere without that being visible.<br>3. The precedence applied is recorded on the record.<br>4. **Routing precedence must be explicit, deterministic, documented, testable, and administratively maintainable. Territory-to-destination mappings must be configuration-driven.** |
| **Decision** | `PD-03` |
| **Build intent** | **P0** |

> **AC4 refined 2026-08-22.** The original wording required precedence itself to be configuration.
> Implementation showed the four tiers consume structurally different business signals — an Account
> flag, an Account type, a territory map, and a fallback — so expressing them as uniform rule rows
> would require a rule interpreter: abstraction without administrative benefit. Precedence is
> therefore explicit in Flow, while the territory-to-coverage mapping remains configuration-driven
> in `Routing_Rule__mdt`. This is a deliberate refinement of the requirement, not an unmet one.

#### `BR-08` — Every routing decision records why it was made

| | |
|---|---|
| **Problem** | `PROB-003` — no record explains any routing decision. 7.3 points of an 18.6% reassignment rate cannot be classified as error or legitimate movement. |
| **Requirement** | Every assignment must record the reason it occurred — the precedence basis applied, the seller-eligibility evaluation, and the version of the rules in force at the time — such that the decision can be reconstructed later without debug output. |
| **Rationale** | **This is the thesis of the project expressed as a single requirement.** Explainability is an operational data-capture obligation designed in at the point of decision, not a reporting feature added afterwards. It is also the only way the routing error rate becomes measurable at all. |
| **Acceptance** | 1. Every assigned record carries a human-readable reason.<br>2. The reason names the precedence basis that won.<br>3. The rule version in force is recorded.<br>4. Records where eligibility was evaluated and rejected are distinguishable from records never evaluated.<br>5. The reason survives subsequent edits to the record. |
| **Build intent** | **P0** |

#### `BR-09` — Round-robin distribution is verifiable, and reassignment preserves history

| | |
|---|---|
| **Problem** | `PROB-003`, `PROB-006` — distribution fairness is asserted but not demonstrable; reassignment churn (18.6%) has no recorded cause. |
| **Requirement** | Where records are distributed by rotation, the distribution must be verifiable from recorded data. Reassignment must capture a reason and must not erase the prior assignment basis. |
| **Rationale** | "The round robin is fair" is a claim, and a claim that cannot be checked from data will eventually be disputed. Preserving prior assignment basis is what turns reassignment churn from an anecdote into a measurable quantity. |
| **Acceptance** | 1. Rotation state is readable, not inferred.<br>2. Distribution across eligible sellers can be verified by query.<br>3. A reassignment records why it occurred.<br>4. The original assignment basis remains recoverable after reassignment. |
| **Decision** | `PD-07` |
| **Build intent** | **P1** |

### SLA

#### `BR-10` — A governed response commitment exists, measured on governed business hours

| | |
|---|---|
| **Problem** | `PROB-007` — the 4-hour expectation is an assumption. NorthstarIQ has no documented, agreed response commitment, and no governed calendar to measure one against. |
| **Requirement** | A response commitment must be defined per segment and measured against governed business hours and holidays, not elapsed clock time. |
| **Rationale** | An SLA measured on elapsed time punishes weekends and rewards nothing. An SLA with no agreed target cannot be breached, only missed against an opinion. Both must be fixed before any attainment figure means anything. |
| **Acceptance** | 1. Each segment has a defined response target.<br>2. Elapsed time is computed on business hours, excluding holidays.<br>3. Targets are configuration, changeable without deployment.<br>4. The target in force is recorded on the record. |
| **Decision** | `PD-05` |
| **Build intent** | **P0** |

#### `BR-11` — First touch is defined and captured reliably, and measurement failure is distinguishable from response failure

| | |
|---|---|
| **Problem** | `PROB-007` — 27% of Leads have no logged first-touch activity and are currently counted as breaches. The honest breach range is 39%–66%. |
| **Requirement** | First touch must have a single governed definition and be captured without depending on a seller remembering to log it. SLA reporting must distinguish "responded late" from "cannot tell whether they responded." |
| **Rationale** | Counting an unmeasurable record as a breach overstates the problem by up to 27 points and destroys the credibility of the whole measure. **The measurability rate is itself a KPI**, because until it rises, no attainment figure is trustworthy. |
| **Acceptance** | 1. First touch has one definition applied consistently.<br>2. First touch is stamped automatically where the defining event occurs in Salesforce.<br>3. Records with no measurable first touch are reported as unmeasurable, not as breaches.<br>4. Attainment is reported over the measurable population, with the measurable share stated alongside it. |
| **Decision** | `PD-06` |
| **Build intent** | **P0** |

#### `BR-12` — The response deadline is visible to the owner, and breaches are visible to an accountable person

| | |
|---|---|
| **Problem** | `PROB-006`, `PROB-012` — sellers cannot see their deadline, and no one is notified when it passes. |
| **Requirement** | The response deadline must be visible on the record to the assigned owner, and a passed deadline must become visible to an accountable person rather than silently ageing. |
| **Rationale** | An SLA that only exists in a report is a measurement, not a commitment. Visibility at the point of work is what makes it operational. |
| **Acceptance** | 1. The deadline is readable on the record by its owner.<br>2. A breached record is identifiable without running a report.<br>3. Breaches reach an accountable owner.<br>4. Breach state is derived, not manually maintained. |
| **Build intent** | **P0** |

### Exceptions

#### `BR-13` — Operational exceptions are detected, classified, made visible in an owned destination, and measured

| | |
|---|---|
| **Problem** | `PROB-012` — exceptions are absorbed manually and invisibly. 21% of Leads sit unassigned beyond 24 business hours with nothing marking them as stuck. |
| **Requirement** | Records that cannot complete an automated path — unassignable, unsegmentable, unnormalizable, or awaiting match review — must be detected, classified by exception type, placed in a visible destination with a defined owner, and countable by class. |
| **Rationale** | **At a 48% incomplete-data rate the exception path is the main path.** Designing it as an afterthought means designing the majority case as an afterthought. Classifying by type is what makes the volume actionable rather than merely alarming. |
| **Acceptance** | 1. A record that cannot be assigned becomes a visible exception rather than remaining silently unassigned.<br>2. Each exception carries a class.<br>3. Exceptions are visible in a destination with a defined owner.<br>4. Exception volume is countable by class.<br>5. No record exits an automated path into an undefined state. |
| **Decision** | `OD-04` — per-class ownership open |
| **Build intent** | **P0** |

#### `BR-14` — Automation failure is observable, and resolution is recorded

| | |
|---|---|
| **Problem** | `PROB-012`, `PROB-016` — when automation fails, nothing records that it failed; when someone fixes an exception, nothing records what they did. |
| **Requirement** | Automation faults must be captured and observable rather than failing silently, and the resolution of an exception must be recorded. |
| **Rationale** | Fault handling is part of automation design, not an add-on. Unrecorded resolutions mean recurring problems look like new problems every time. |
| **Acceptance** | 1. A fault in an automated path produces a visible record of the fault.<br>2. A fault does not leave the record in a partially processed state.<br>3. Resolution of an exception is recorded.<br>4. Recurrence of an exception class is countable. |
| **Build intent** | **P2** |

### Lifecycle

#### `BR-15` — A single governed lifecycle taxonomy exists, and transitions are recorded with timestamp and cause

| | |
|---|---|
| **Problem** | `PROB-011` — lifecycle stages are inconsistent across teams; progression is not measurable; conversion criteria are unagreed. |
| **Requirement** | One governed lifecycle taxonomy must exist and be enforced. Transitions between stages must be recorded with the time they occurred, and conversion must be a governed transition within that taxonomy rather than a separate uncontrolled event. |
| **Rationale** | Funnel baselines are currently uninterpretable because two teams counting the same stage count different populations. One taxonomy is the precondition for every funnel metric. |
| **Acceptance** | 1. Stage values are restricted to the governed set.<br>2. A transition records when it occurred.<br>3. Conversion is represented as a governed transition.<br>4. Invalid transitions are prevented or surfaced. |
| **Decision** | `PD-08`, `PD-09`, `PD-12` |
| **Build intent** | **P1** |

#### `BR-16` — Time in stage is answerable retrospectively, and stalled records have an explicit state

| | |
|---|---|
| **Problem** | `PROB-011` — stage duration has no baseline at all, because transition history was never captured. |
| **Requirement** | The time a record spent in each lifecycle stage must be answerable after the fact, and records that have stalled or been recycled must carry an explicit state rather than being inferred from inactivity. |
| **Rationale** | ⚠️ **History not captured cannot be reconstructed.** This requirement is the reason `PD-09` had to be decided before implementation rather than after — deferral is not neutral, it is a decision to lose the data permanently. |
| **Acceptance** | 1. Stage entry time is recoverable for each record.<br>2. Duration in stage is computable without a manual reconstruction.<br>3. Stalled and recycled are explicit states, not absence of activity.<br>4. Capture occurs at the moment of transition. |
| **Decision** | `PD-09` |
| **Build intent** | **P2** |

### Qualification

#### `BR-17` — ICP fit is assessed against one governed definition, with "not assessable" distinguished from "poor fit"

| | |
|---|---|
| **Problem** | `PROB-010` — qualification has no agreed definition; Marketing and Sales disagree on what an MQL is. 31% of Leads lack industry, so fit often cannot be assessed at all. |
| **Requirement** | ICP fit must be assessed against a single governed definition, with the basis recorded, and a record whose fit cannot be assessed must be distinguishable from a record assessed as a poor fit. |
| **Rationale** | Conflating "we don't know" with "not a fit" discards demand. Given 31% missing industry, that conflation would silently suppress roughly a third of inbound. |
| **Acceptance** | 1. Fit is derived from one governed definition.<br>2. The basis is recorded.<br>3. Unassessable and poor-fit are distinct states.<br>4. The definition is configuration. |
| **Decision** | `OD-03` — **open; weighting unresolved, which is why this is P2** |
| **Build intent** | **P2** |

### Security & Access

#### `BR-18` — Access is least privilege, documented per persona, and every capability is individually grantable and revocable

| | |
|---|---|
| **Problem** | `PROB-013` — access governance has never been assessed; permissions are believed to be profile-based, with accumulation invisible. |
| **Requirement** | Access must be designed on least privilege and documented per persona. Every granted capability must be individually visible, grantable, and revocable, so that "which capabilities does this person hold, and from where?" is answerable. |
| **Rationale** | Additive grants make over-provisioning visible; profile grants hide accumulation. At a 1:64 administrator ratio, an access model that cannot be reasoned about quickly will not be maintained correctly. |
| **Acceptance** | 1. Business capability is granted additively, not through broad baseline profiles.<br>2. Each capability can be revoked without removing unrelated access.<br>3. Access per persona is documented.<br>4. Destructive and configuration capabilities are granted separately from routine record access. |
| **Decision** | `PD-10` |
| **Build intent** | **P0** |

#### `BR-19` — Integration and analytics principals are scoped, and PII field access is separately justified

| | |
|---|---|
| **Problem** | `PROB-013` — integration access is unassessed and, in most organizations of this shape, has drifted toward administrator-equivalence. |
| **Requirement** | Non-human principals must hold only the access their function requires, must never be administrator-equivalent, and must be scoped per function rather than sharing one grant. Field access to PII-classified data must be separately justified rather than inherited. |
| **Rationale** | A single shared "integration access" grant widens every time a new need appears. Per-function scoping forces each new need to justify itself. |
| **Acceptance** | 1. Each non-human principal has its own scoped grant.<br>2. No non-human principal holds administrator-equivalent capability.<br>3. The analytics principal holds read access with no operational write.<br>4. PII field access is enumerated and justified. |
| **Decision** | `PD-10` |
| **Build intent** | **P1** |

#### `BR-20` — The access model is verified by testing behaviour, not by inspecting configuration

| | |
|---|---|
| **Problem** | `PROB-013` — an access model that has only been reviewed has not been tested. |
| **Requirement** | The access model must be verified by executing operations as each persona and asserting both what they can and what they cannot do. Negative assertions are the primary evidence. |
| **Rationale** | Inspecting a permission set proves what was configured. Executing as a user proves what was granted. These differ more often than anyone expects, and only the second is evidence. |
| **Acceptance** | 1. Each persona's access is exercised, not just reviewed.<br>2. Negative cases are asserted explicitly.<br>3. Results are recorded with the date and org state.<br>4. A failed negative assertion blocks the access design from being called complete. |
| **Build intent** | **P0** |

### Administration

#### `BR-21` — Governed business rules are configuration, changeable without deployment, with a rollback path

| | |
|---|---|
| **Problem** | `PROB-017`, `PROB-016` — business rules exist only as institutional knowledge, and changes are deployed without regression safety or a way back. |
| **Requirement** | Rules that the business is expected to change — segmentation thresholds, territory definitions, routing precedence, SLA targets — must be held as configuration rather than embedded in automation logic, with the intended behaviour documented and a rollback path available. |
| **Rationale** | A threshold embedded in a Flow requires an administrator and a deployment to change; the same threshold in configuration requires neither. This is the difference between a system the business operates and a system it must request changes to. It is also `PROB-018`'s only real mitigation. |
| **Acceptance** | 1. Governed thresholds and mappings are readable and editable as configuration.<br>2. Changing one does not require modifying automation.<br>3. The rule version in force is recorded on affected records.<br>4. A prior configuration state can be restored. |
| **Build intent** | **P0** |

### Analytics

#### `BR-22` — KPI definitions are governed with one owner and a stated reliability class

| | |
|---|---|
| **Problem** | `PROB-014`, `PROB-015` — the same business question yields different answers; metric movements cannot be explained. |
| **Requirement** | Each KPI must have exactly one definition, one owner, and a stated reliability class indicating whether the underlying data can currently support the measure. Data quality, routing, and SLA performance must be measurable over time. |
| **Rationale** | Divergent numbers destroy trust faster than missing numbers. Stating reliability openly is what makes the trustworthy measures usable — a register presenting every metric as equally sound would be more impressive and less honest, and one discovered overstatement would discount the rest. |
| **Acceptance** | 1. Each KPI has one definition of record.<br>2. Each has one owner.<br>3. Each carries a reliability class.<br>4. Measures are computable over time, not only as a current snapshot. |
| **Build intent** | **P1** |

#### `BR-23` — Operational decision data reaches the analytics layer and reconciles to Salesforce

| | |
|---|---|
| **Problem** | `PROB-015` — analytics can show that a metric moved but not why, because the reasons live only in automation logic that produces no data. |
| **Requirement** | The recorded reasons, bases, and timestamps produced by operational decisions must be available to the analytics layer, and analytics figures must reconcile to Salesforce as the source of truth. |
| **Rationale** | This is what converts explainability from a record-level convenience into an analytical capability: "SLA attainment fell" becomes "SLA attainment fell because the share of records routed via territory fallback rose." Reconciliation is what stops the dashboard becoming a second, competing source of truth. |
| **Acceptance** | 1. Decision reasons and bases are queryable, not embedded in logs.<br>2. Analytics figures reconcile to a Salesforce query on the same population.<br>3. Reconciliation is demonstrated, not asserted.<br>4. The analytics principal reads without operational write. |
| **Decision** | `OD-05` — refresh architecture open |
| **Build intent** | **P1** |

### Summary

| Domain | Requirements | P0 | P1 | P2 |
|---|---|---:|---:|---:|
| Data Quality | `BR-01`–`BR-02` | 2 | 0 | 0 |
| Identity | `BR-03`–`BR-04` | 1 | 1 | 0 |
| Segmentation & Territory | `BR-05`–`BR-06` | 2 | 0 | 0 |
| Routing | `BR-07`–`BR-09` | 2 | 1 | 0 |
| SLA | `BR-10`–`BR-12` | 3 | 0 | 0 |
| Exceptions | `BR-13`–`BR-14` | 1 | 0 | 1 |
| Lifecycle | `BR-15`–`BR-16` | 0 | 1 | 1 |
| Qualification | `BR-17` | 0 | 0 | 1 |
| Security | `BR-18`–`BR-20` | 2 | 1 | 0 |
| Administration | `BR-21` | 1 | 0 | 0 |
| Analytics | `BR-22`–`BR-23` | 0 | 2 | 0 |
| **Total** | **23** | **14** | **6** | **3** |

**Why 23 and not 62.** Requirement count is not evidence. The original register separated
capabilities that share a single mechanism, a single test, and a single failure mode. Where two
requirements could not be satisfied independently, they were one requirement written twice.

---

## 3. Personas

Six personas, reduced from seventeen. A persona earns a place here only if it owns a requirement or
holds distinct access.

| ID | Persona | What they do | What they need from this system |
|---|---|---|---|
| `PER-01` | **Revenue Operations** | Owns routing, segmentation, SLA policy, and exception resolution | Explainable decisions, configurable rules, visible exceptions |
| `PER-02` | **Sales Manager** | Owns a team's pipeline and response performance | Breach visibility, distribution fairness, reassignment cause |
| `PER-03` | **Account Executive** | Works assigned records through the lifecycle | Correct assignment, visible deadline, readable reason for ownership |
| `PER-04` | **SDR / BDR** | Works inbound records and makes first touch | Fast, correct assignment; knowing whether a record is an existing customer |
| `PER-05` | **Salesforce Administrator** | Builds, maintains, and supports the platform | Maintainable automation, source-controlled configuration, rollback |
| `PER-06` | **Data / BI Analyst** | Builds and maintains the analytics layer | Governed definitions, decision data, read access without write |

**Eleven personas were removed**, not because those roles do not exist at NorthstarIQ, but because
in this architecture they either own no requirement or hold access identical to a persona above.
Per-segment AE splits, for example, differ in quota and motion but not in system access — modelling
them separately would add rows without adding design.

The **analytics and capture integration principals** are non-human and are specified in
[`security-model.md`](security-model.md), not here.

---

## 4. Portfolio Decisions

> **These are decisions made by the practitioner as owner of the fictional scenario.**
> **They are not stakeholder approvals. NorthstarIQ has no stakeholders.**
> Each is recorded so that a reviewer can see what was decided, why, what it costs to change, and
> where it is implemented. Fabricating agreement would be worse than deciding openly.

| ID | Decision | Rationale | Implementation consequence | Reversibility |
|---|---|---|---|---|
| `PD-01` | **Segment bands:** SMB < 100 employees · Mid-Market 100–999 · Enterprise 1,000+ · Strategic by designation, not size. Employee count is the primary signal; where the Account is an existing customer, ARR overrides it. | Employee count is the most available firmographic signal and is meaningful pre-sale. ARR is more accurate but only exists post-sale, so it can only override, never lead. | Bands held as configuration; derivation reads employee count then ARR override | **High** — a configuration edit |
| `PD-02` | **Strategic is an explicit flag on Account set by Revenue Operations**, never derived from size or revenue. | Strategic status at NorthstarIQ reflects executive sponsorship and commercial judgement, not a threshold. Deriving it would encode a rule that does not exist. | A boolean on Account, read by routing precedence | **High** |
| `PD-03` | **Ownership precedence:** Strategic/named designation → existing Account owner → territory → round robin. | Resolves `PROB-005`. Protecting deliberately designated relationships outranks geography; geography outranks arbitrary rotation. Any order is implementable — the failure was that none was chosen. | Precedence held as configuration and recorded per assignment | **High** — reorder configuration |
| `PD-04` | **Match confidence:** exact normalized domain → Matched · name + country similarity → Review · otherwise No Match. **No automatic merge at any confidence.** | Domain is the strongest available signal and is exact rather than probabilistic. A review band is what keeps the threshold tunable without risking false merges. | Three-state match outcome with basis recorded | **High** |
| `PD-05` | **SLA measured on standard Salesforce Business Hours with standard Holiday records**, one calendar per territory; targets set per segment. | Standard Salesforce already solves business-hours arithmetic correctly, including holidays. Building a custom calendar would be re-implementing platform capability. | Business Hours and Holiday configuration; targets in configuration | **High** |
| `PD-06` | **First touch** = the earlier of (a) first completed Task or Event against the record, or (b) transition to a working lifecycle stage. | Captures response whether the seller logs an activity or advances the record, which is what raises the 73% measurability rate. Both events already exist in Salesforce. | First-touch timestamp stamped by automation | **High** |
| `PD-07` | **Round robin assigns to the least-recently-assigned eligible seller** within segment and territory. | Verifiable from data (`BR-09`) and self-correcting after absences, unlike a counter that drifts. | Rotation state readable on User | **Medium** — changes distribution history semantics |
| `PD-08` | **Lifecycle taxonomy is a governed restricted picklist on the standard Lead Status field.** | Standard field, standard reporting, standard history tracking. A custom lifecycle field would duplicate a standard capability for no gain. | Restricted value set on a standard field | **Medium** — value changes affect existing records |
| `PD-09` | **History persistence:** standard Salesforce field history tracking on the governed lifecycle field, plus one stage-entry timestamp. **No custom history object.** | ⚠️ The one decision that could not be deferred — uncaptured history is unrecoverable. Standard tracking meets `BR-16` at zero build cost; a custom object would add an object, automation, and storage for marginal gain at this scale. | Field history tracking enabled; one timestamp field | **Low** — history not captured cannot be reconstructed |
| `PD-10` | **Permission-set-first access model with restrictive organization-wide defaults**, widened deliberately and documented. | Additive grants make over-provisioning visible; a permissive model narrowed later cannot answer "why does this person have this access?" | Minimal profile; capability permission sets | **Medium** — OWD changes cascade through sharing |
| `PD-11` | **Unified territory map** — one country-based definition applied across all segments, with the US subdivided by state region. | Resolves `PROB-009`. The current per-segment asymmetry is the defect; formalizing it would preserve the problem in a tidier form. | Territory mapping held as configuration | **High** |
| `PD-12` | **Lead source, channel, and lifecycle stage use governed restricted picklists**; conversion criteria are expressed as the governed transition into a qualified stage. | Free-text and unrestricted picklists are the mechanism by which taxonomy drift happened. Restriction is the fix and costs nothing. | Restricted value sets; validation on transition | **High** |

### Decisions still genuinely open

The implementation must remain configurable where the business rule is unresolved. These are **not**
blockers — each has a defined interim behaviour.

| ID | Open question | Interim behaviour | What changes when decided |
|---|---|---|---|
| `OD-01` | Is a subsidiary or franchisee a distinct customer? (`PROB-008`) | Duplicates are surfaced for review only; **nothing is ever auto-merged** | Merge policy and the interpretation of the 6.8% Account duplicate rate |
| `OD-02` | Who covers an absent or ineligible seller? | An eligibility flag exists and ineligible sellers are skipped; records with no eligible seller become routing exceptions | Coverage policy — a configuration change, not a redesign |
| `OD-03` | How is ICP fit weighted? | **`BR-17` is P2 and not built.** No scoring model is invented. | Whether ICP scoring enters scope at all |
| `OD-04` | Who owns each exception class? | Exceptions are classified and visible in a single owned destination | Queue assignment per class — configuration |
| `OD-05` | Power BI refresh and historical-data architecture | Manual export for the portfolio release; refresh architecture designed but not automated | Production refresh design; no change to the Salesforce data model |

### Decisions dropped with removed scope

| Original | Why it no longer applies |
|---|---|
| `DEC-014` — marketing automation system and scope | No live integration is in scope. The capture path is not built against a provider. |
| `DEC-015` — enrichment source and scope | No enrichment provider is in scope. The architecture assumes enrichment may not exist (`BR-02`). |

---

## 5. Traceability

| Requirement | Problem | Intended mechanism | Test scenario |
|---|---|---|---|
| `BR-01` | `PROB-001` | Before-save normalization; governed value sets | Malformed domain · country variant · unnormalizable value |
| `BR-02` | `PROB-001` | Before-save completeness evaluation | Missing each routing-critical attribute · missing all · complete |
| `BR-03` | `PROB-002` | Match evaluation against Account | Exact domain match · review band · no match · existing customer |
| `BR-04` | `PROB-008` | Duplicate surfacing; review destination | Duplicate Lead pair · Lead duplicating a Contact |
| `BR-05` | `PROB-004` | Segment derivation from configuration | Each band · both boundaries · ARR override · underivable |
| `BR-06` | `PROB-009` | Territory resolution from configuration | Each territory · boundary · missing geography |
| `BR-07` | `PROB-005` | Precedence evaluation | Strategic vs territory · existing owner vs territory · rotation only |
| `BR-08` | `PROB-003` | Reason, basis, and rule version capture | Every routing scenario asserts a reason |
| `BR-09` | `PROB-003`, `PROB-006` | Rotation state; reassignment capture | Rotation across eligible sellers · ineligible skipped · reassignment |
| `BR-10` | `PROB-007` | Business hours; per-segment targets | Target per segment · overnight · weekend · holiday |
| `BR-11` | `PROB-007` | First-touch capture | Activity-based · stage-based · no touch (unmeasurable) |
| `BR-12` | `PROB-006` | Deadline field; breach derivation | Met · breached · unmeasurable |
| `BR-13` | `PROB-012` | Exception classification and destination | Unassignable · unsegmentable · unnormalizable · match review |
| `BR-14` | `PROB-012`, `PROB-016` | Fault handling | **Deferred (P2)** |
| `BR-15` | `PROB-011` | Governed lifecycle value set | Valid progression · invalid transition |
| `BR-16` | `PROB-011` | Field history; stage-entry timestamp | **Deferred (P2)** |
| `BR-17` | `PROB-010` | — | **Deferred (P2)** |
| `BR-18` | `PROB-013` | Capability permission sets | Positive and negative per persona |
| `BR-19` | `PROB-013` | Scoped analytics principal | Read permitted · write denied |
| `BR-20` | `PROB-013` | Access test execution | The negative matrix in `testing-strategy.md` |
| `BR-21` | `PROB-016`, `PROB-017` | Configuration-held rules | Threshold change without deployment |
| `BR-22` | `PROB-014`, `PROB-015` | Metric definitions and reports | Report reconciles to SOQL |
| `BR-23` | `PROB-015` | Analytics model over decision data | Power BI figure reconciles to Salesforce |

**Problem coverage.** All 18 `PROB-###` trace to at least one requirement. `PROB-018`
(single-person administration) has no direct requirement — it is mitigated indirectly by `BR-21`
(configuration over code) and is honestly recorded as **partially addressed**, not solved. A
staffing problem is not fixable by architecture.

---

## Appendix — Consolidation Crosswalk

62 original requirements → 23. **Consolidated** means the capability survives inside the named
requirement. **Deferred** means it remains valid but is out of this release. **Removed** means the
scope it served is gone.

| Original | New | Disposition | Reason |
|---|---|---|---|
| `BR-001` | `BR-02` | Consolidated | Completeness assessment |
| `BR-002` | `BR-01` | Consolidated | Normalization |
| `BR-003` | `BR-02` | Consolidated | Record-level explainability is inseparable from the assessment producing it |
| `BR-004` | — | **Removed** | Capture-interface contract; no live integration in scope (`DEC-014` dropped) |
| `BR-005` | — | **Removed** | Enrichment interface; no provider in scope (`DEC-015` dropped) |
| `BR-006` | `BR-13` | Consolidated | "Operates on incomplete data" is the exception path |
| `BR-007` | `BR-22` | Consolidated | Measurability over time is a KPI obligation |
| `BR-008` | `BR-03` | Consolidated | Match determination |
| `BR-009` | `BR-03` | Consolidated | Basis and confidence are the same mechanism as the match |
| `BR-010` | `BR-04` | Consolidated | Duplicate detection |
| `BR-011` | `BR-04` | Consolidated | Lead-to-Contact is one duplicate case, not a separate capability |
| `BR-012` | `BR-04` | Consolidated | Merge governance |
| `BR-013` | — | **Deferred** | Account family relationships; standard `ParentId` is sufficient for this release |
| `BR-014` | `BR-17` | Consolidated | ICP fit assessment |
| `BR-015` | `BR-17` | Consolidated | Fit basis |
| `BR-016` | `BR-01` | Consolidated | Governed source taxonomy is normalization at capture |
| `BR-017` | `BR-15` | Consolidated | Conversion is a governed lifecycle transition |
| `BR-018` | `BR-17` | Consolidated | Not-assessable vs poor-fit |
| `BR-019` | `BR-15` | Consolidated | Lifecycle taxonomy |
| `BR-020` | `BR-15` | Consolidated | Transition recording |
| `BR-021` | `BR-15` | Consolidated | Conversion as transition |
| `BR-022` | `BR-16` | Consolidated | Time in stage |
| `BR-023` | `BR-16` | Consolidated | Stalled and recycled states |
| `BR-024` | `BR-05` | Consolidated | Segment derivation |
| `BR-025` | `BR-05` | Consolidated | Versioned thresholds are the same configuration mechanism |
| `BR-026` | `BR-13` | Consolidated | Unsegmentable records are an exception class |
| `BR-027` | `BR-05` | Consolidated | Basis and override recording |
| `BR-028` | `BR-06` | Consolidated | Territory determinism |
| `BR-029` | `BR-06` | Consolidated | Versioned definitions |
| `BR-030` | `BR-07` | Consolidated | Ownership precedence |
| `BR-031` | `BR-07` | Consolidated | Strategic protection is an outcome of precedence |
| `BR-032` | `BR-08` | Consolidated | Routing reason |
| `BR-033` | `BR-13` | Consolidated | Unassignable records are an exception class |
| `BR-034` | `BR-09` | Consolidated | Round-robin verifiability |
| `BR-035` | `BR-08` | Consolidated | Eligibility evaluation is part of the recorded decision |
| `BR-036` | `BR-09` | Consolidated | Reassignment history |
| `BR-037` | `BR-21` | Consolidated | Routing rules are one case of governed configuration |
| `BR-038` | `BR-10` | Consolidated | Response commitment |
| `BR-039` | `BR-10` | Consolidated | Business hours are how the commitment is measured |
| `BR-040` | `BR-11` | Consolidated | First-touch definition and capture |
| `BR-041` | `BR-11` | Consolidated | Measurement vs response failure |
| `BR-042` | `BR-12` | Consolidated | Deadline visibility |
| `BR-043` | `BR-12` | Consolidated | Breach visibility |
| `BR-044` | `BR-13` | Consolidated | Exception detection and classification |
| `BR-045` | `BR-14` | Consolidated | Automation fault observability |
| `BR-046` | `BR-13` | Consolidated | Exception ownership |
| `BR-047` | `BR-14` | Consolidated | Resolution recording |
| `BR-048` | `BR-22` | Consolidated | KPI governance |
| `BR-049` | `BR-23` | Consolidated | Decision data to analytics |
| `BR-050` | `BR-22` | Consolidated | Measurement windows are part of the definition |
| `BR-051` | `BR-23` | Consolidated | Reconciliation |
| `BR-052` | `BR-19` | Consolidated | Analytics principal is a scoped principal |
| `BR-053` | `BR-18` | Consolidated | Least privilege per persona |
| `BR-054` | `BR-18` | Consolidated | Individually grantable and revocable |
| `BR-055` | `BR-19` | Consolidated | Integration scoping |
| `BR-056` | `BR-19` | Consolidated | PII field access |
| `BR-057` | `BR-20` | Consolidated | Access testing |
| `BR-058` | — | **Removed** | Access changes via governed change path; the change-governance apparatus was removed |
| `BR-059` | `BR-21` | Consolidated | Metadata-driven rules |
| `BR-060` | — | **Removed** | Regression path is now an approach in `testing-strategy.md`, not a business requirement |
| `BR-061` | `BR-21` | Consolidated | Documented intended behaviour |
| `BR-062` | `BR-21` | Consolidated | Rollback |

**57 consolidated · 1 deferred · 4 removed.**

### Deferred requirements — still discoverable

| Requirement | Where it stands |
|---|---|
| `BR-013` (original) — Account family relationships are explicit | Standard `ParentId` covers hierarchy for this release. Revisit if `OD-01` resolves toward treating subsidiaries as distinct customers. |
| `BR-14` — Automation failure is observable | Valid and unbuilt. Fault paths are still designed into automation per `testing-strategy.md`; systematic fault *observability* is deferred. |
| `BR-16` — Time in stage is answerable | ⚠️ **Partially protected.** `PD-09` enables history capture now precisely so this requirement remains satisfiable later. The capture is P1; the measurement is P2. |
| `BR-17` — ICP fit assessment | Blocked on `OD-03`. No scoring model will be invented to unblock it. |

Full original text for every requirement above is preserved in git history at commit
`e0be142` (`docs: complete Phase 0C requirements and governance`).
