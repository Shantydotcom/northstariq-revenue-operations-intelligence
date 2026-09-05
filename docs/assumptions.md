# Assumptions, Risks & Open Decisions

| | |
|---|---|
| **Purpose** | What this project is taking on faith, what could go wrong, and what is still undecided |
| **Status** | Active — reviewed at each implementation increment |
| **Related** | [`business-case.md`](business-case.md) · [`requirements.md`](requirements.md) · [`architecture.md`](architecture.md) |

---

## 1. Assumptions

An **assumption** is something taken as true without confirmation, which would change the design if
false. It is distinct from an **open decision**, which is a choice nobody has made yet.

14 assumptions, reduced from 33. Retained only where being wrong would change what gets built.

### About the fictional environment

| ID | Assumption | If wrong | Impact |
|---|---|---|---|
| `ASM-01` | Firmographic enrichment is unavailable and may not exist | The architecture already assumes this — it degrades gracefully. **Being wrong here is a bonus, not a defect.** | Low |
| `ASM-02` | Salesforce is authoritative for customer status | `BR-03` matching would need an external source of truth | **High** |
| `ASM-03` | Churned Accounts remain in Salesforce and are distinguishable | Existing-customer routing (`PD-03`) would misroute churned accounts to former owners | **High** |
| `ASM-04` | Stage transition history is not currently retained | Funnel baselines would be reconstructable; `PD-09` becomes less urgent | Medium |
| `ASM-05` | Business permissions are currently profile-based | The permission-set migration argument (`PD-10`) weakens | Medium |
| `ASM-06` | Routing logic exists in more than one mechanism today | Consolidation is simpler than assumed | Medium |
| `ASM-07` | Business definitions have no authoritative system of record | Some Portfolio Decisions would have real answers to defer to | Medium |
| `ASM-08` | The 4-hour SLA expectation approximates what the business would agree | The target is configuration (`BR-10`) — **a wrong target costs one configuration edit** | Low |

### About the build

| ID | Assumption | If wrong | Impact |
|---|---|---|---|
| `ASM-09` | Developer Edition supports the intended demonstration | Scope reduces to what the edition permits; the gap is documented, never hidden | **High — validate at org inspection** |
| `ASM-10` | Enterprise Territory Management is unavailable in Developer Edition | The configuration-driven territory model may be replaceable with standard capability — **a reduction, not a problem** | Medium |
| `ASM-11` | Standard Duplicate Rules and Matching Rules can satisfy `BR-04` | Custom duplicate logic would be needed, raising the field and Flow count | Medium |
| `ASM-12` | Standard field history tracking satisfies `BR-16` capture | A custom history object would be required — object, automation, and storage cost | Medium |
| `ASM-13` | Flow and configuration can meet every requirement without Apex | The Apex justification is recorded before any class is written | Medium |
| `ASM-14` | ~190 records provide complete scenario coverage | Dataset grows to cover the gap — **scenario coverage governs size, not the reverse** | Low |

> **`ASM-09` through `ASM-13` are all resolved by org inspection**, which is the next step after the
> repository is pushed. Four of the five, if wrong, make the build *smaller*. That asymmetry is
> deliberate: the design assumes the platform provides less than it probably does.

---

## 2. Risks

8 risks, reduced from 20. Retained only where the risk affects implementation.

| ID | Risk | Consequence | Mitigation |
|---|---|---|---|
| `RISK-01` | **Synthetic results are mistaken for real measurements** | The portfolio's credibility collapses on discovery | Disclaimers in `business-case.md` and `metric-dictionary.md`; baselines labelled at every point of use; no improvement claim without stating the baseline is synthetic |
| `RISK-02` | **Planned capability is described as implemented** | Misrepresents the work; indistinguishable from dishonesty | Every candidate is labelled 🟡 CANDIDATE; `implementation-log.md` is the only place a component becomes Implemented |
| `RISK-03` | **Fabricated test results** | Invalidates every other claim in the repository | Results recorded only after execution, with date, org state, and failures included |
| `RISK-04` | **Over-engineering** | A system one administrator cannot maintain — which is `PROB-018` rebuilt | MVP scope discipline in `architecture.md` §1: standard capability and existing configuration preferred, the minimum sufficient mechanism for a verified requirement, and complexity justified rather than measured against a quota |
| `RISK-05` | **Unnecessary Apex** | Raises the maintenance bar beyond an administrator; contradicts the project thesis | Declarative-first: Apex only where a verified requirement cannot be safely or maintainably satisfied by a declarative capability, with the justification recorded before a class is written |
| `RISK-06` | **Hard-coded business rules** | The business cannot change its own thresholds; `PROB-017` recreated | `BR-21`; governed rules held as Custom Metadata; rule version recorded on affected records |
| `RISK-07` | **Automation lacks fault handling or bulk safety** | Silent partial failures; works at 1 record, fails at 200 | Fault paths required on every fallible element; fixtures load in batch; bulk safety is an explicit test layer |
| `RISK-08` | **Insufficient scenario coverage** | A design that appears to work because the failing case was never loaded | 17 named scenarios; every record maps to one; boundaries tested on both sides |

**`RISK-01` through `RISK-03` are honesty risks, and they are listed first deliberately.** They are
the only risks in this register that would make the project worse than not doing it at all.

---

## 3. Open Decisions

Genuinely unresolved. Each has a defined interim behaviour, so **none blocks implementation**.

| ID | Question | Interim behaviour | What changes when decided |
|---|---|---|---|
| `OD-01` | Is a subsidiary or franchisee a distinct customer? (`PROB-008`) | Duplicates surfaced for review only. **Nothing is ever auto-merged, and no merge capability is granted.** | Merge policy; interpretation of the 6.8% Account duplicate rate |
| `OD-02` | Who covers an absent or ineligible seller? | Eligibility flag exists; ineligible sellers are skipped and the skip is recorded; no eligible seller → routing exception | Coverage policy — configuration, not redesign |
| ~~`OD-03`~~ | How is ICP fit weighted? | **CLOSED 2026-08-27 as a Portfolio Decision — see `PD-14`.** Resolved by rejecting weighting entirely: MQL eligibility becomes a set of deterministic conditions that are all required, so nothing is weighted and no scoring model exists to invent. | Closed. `BR-17` remains P2 and unbuilt. |
| `OD-04` | Who owns each exception class? | All classes visible and owned in two queues | Per-class queue assignment — configuration |
| `OD-05` | Power BI refresh and historical-data architecture | Manual export for this release; refresh architecture designed, not automated | Production refresh design. **No change to the Salesforce data model.** |
| `OD-06` | **Advanced Lifecycle Entry** — when may a Lead enter the governed lifecycle at a stage beyond the initial one, and what evidence must substantiate that entry? | Creation at any stage is permitted and stamps `Lifecycle_Stage_Entered__c`; the transition and qualification gates govern transitions only, and are unchanged. The detective controls report what they observe. | Whether advanced-stage entry is gated, and what provenance an import, integration, partner or sales referral, or migration must supply. `lifecycle-progression`'s treatment of advanced-stage creation follows from it. |
| `OD-07` | **Evidence Ownership Policy** — who owns lifecycle evidence after a governed transition has granted the stage? | The Flow is the only writer of `MQL_Basis__c`, `Sales_Accepted_At__c`/`_By__c`/`_Acceptance_Basis__c` and `SQL_Basis__c`, but nothing prevents a later edit or clearance. The detective controls report the resulting contradiction. | Which evidence fields are system-owned; whether humans or integrations may edit them; whether evidence is immutable after a governed transition; how a legitimate correction or reconstruction works; whether superseded evidence is replaced or retained; which automation is authoritative. **The technical safeguard is deliberately not chosen until the policy is.** |
| `OD-08` | **Forecast Classification Governance** — **narrowed 2026-09-04 by `PD-23`.** The broad question is answered only in its smallest part: an Opportunity promoted into `Best Case` or `Commit` now carries a fixed minimum evidence obligation — a populated `Amount` and a `CloseDate` on or before the end of the fiscal quarter containing the assessment date. **What remains open is everything else**: whether any *other* classification carries an obligation, and whether the evidence set should ever grow beyond those two elements. | Unchanged where it was already settled. **Salesforce owns forecast classification and its native vocabulary**: `ForecastCategory` is derived, `ForecastCategoryName` is overridable **by design**, and **an override alone is not a defect**. **NorthstarIQ does not judge whether a forecast classification is correct** — it evaluates only whether the record carries the `PD-23` evidence. The `PD-23` control is **implemented in source but not registered**, so no forecast classification is currently evaluated at all. Read-only discovery on 2026-09-04 observed 17 open Opportunities on the native default and **zero forecast-category overrides**, so the governed population is currently empty in this org. | Whether a classification other than `Best Case` or `Commit` carries an evidence obligation, and whether `PD-23`'s two elements should ever become three — which would be a new governed policy version, never a silent expansion. Three limits hold regardless: **`stale-opportunities` is never duplicated under a forecast name** — past-dated open Opportunities stay `PD-20`'s defect; sales conviction is never converted into an invented deterministic control; and **Forecast Accuracy is never claimed** — it requires period and submission evidence this org does not hold, and cannot be inferred from current-state Opportunity data. A controlled synthetic fixture is now legitimate for `PD-23` fail-path validation, because the requirement is ratified, and is labelled `SYNTHETIC`. |

**Why none of these blocks the build.** Each is either deferred with its scope (`OD-03`), held as
configuration (`OD-02`, `OD-04`, `OD-05`), resolved by choosing the conservative option
(`OD-01` — never merge), narrowed by a ratified policy that decides only its smallest defensible
part (`OD-08` — `PD-23`), or left to the existing safeguard while the rule is undecided
(`OD-06`, `OD-07`). The pattern is the same in each case: **where a business rule is unagreed,
build the capability and leave the rule configurable, rather than inventing the rule.**

> **`OD-06` and `OD-07` were opened by executed evidence, not by design review.** Both were exposed
> by the controlled lifecycle validation of 2026-09-01, where a controlled fixture entered the
> lifecycle at an advanced stage and another had its qualification evidence removed after the stage
> had been granted. In each case the preventive safeguard behaved exactly as designed and the
> detective control reported the result correctly — what is missing is the business rule, not the
> mechanism. Evidence in [`implementation-log.md`](implementation-log.md) and
> [`testing-strategy.md`](testing-strategy.md) §2r. **Neither is remediated, and no safeguard is
> changed until the rule is decided.**

> The alternative — writing a threshold into a Flow because someone had to pick one — is exactly the
> failure that produced `PROB-005`, `PROB-010`, and `PROB-017` at NorthstarIQ.

### Portfolio Decisions

Twelve decisions **were** resolved, by the practitioner as owner of the fictional scenario. They are
recorded with rationale, implementation consequence, and reversibility in
[`requirements.md`](requirements.md) §4.

**They are not stakeholder approvals, and are never described as such.** NorthstarIQ has no
stakeholders. There is one person, deciding openly.

---

## 4. Dependencies

| Dependency | Status |
|---|---|
| Git 2.55.0 · GitHub CLI 2.98.0 | ✅ Verified 2026-08-22 |
| Salesforce CLI 2.148.3 | ✅ Verified 2026-08-22 |
| D2 0.7.1 · Python 3.14.7 · Node 24.19.0 | ✅ Verified 2026-08-22 |
| **Salesforce Developer Edition org** | ✅ **Provisioned and authenticated.** Configuration parity verified against source control, and controlled lifecycle fixtures executed against it — provenance in [`implementation-log.md`](implementation-log.md). Org access is **session-based and can lapse**; re-authentication remains a gated action and is never assumed to be available. |
| **Power BI Desktop** | ⬜ Not yet required — needed at the analytics stage |
| Human approval: commit · push · GitHub repository creation · org authentication · deployment · data load | 🔵 Required at each gate |

**The org was the critical path, and it is no longer blocking.** Nothing in
[`architecture.md`](architecture.md) or [`data-model.md`](data-model.md) leaves candidate status
until it is inspected in the org — a rule that still governs every component not yet built.

---

## 5. Review

This document is reviewed at each implementation increment. An assumption proven or disproven, a
risk realised, or a decision resolved is updated here and recorded in
[`implementation-log.md`](implementation-log.md).

**An assumption that turns out to be wrong is a finding, not a failure** — and recording it is worth
more to a reader than a register where everything was right.
