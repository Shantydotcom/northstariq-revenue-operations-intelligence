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
| `RISK-04` | **Over-engineering** | A system one administrator cannot maintain — which is `PROB-018` rebuilt | Complexity budgets in `architecture.md`; standard-first evaluation order; candidate counts expected to fall after org inspection |
| `RISK-05` | **Unnecessary Apex** | Raises the maintenance bar beyond an administrator; contradicts the project thesis | Apex target is zero; any class requires a recorded justification first |
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
| `OD-03` | How is ICP fit weighted? | **`BR-17` is P2 and not built. No scoring model is invented.** | Whether ICP scoring enters scope at all |
| `OD-04` | Who owns each exception class? | All classes visible and owned in two queues | Per-class queue assignment — configuration |
| `OD-05` | Power BI refresh and historical-data architecture | Manual export for this release; refresh architecture designed, not automated | Production refresh design. **No change to the Salesforce data model.** |

**Why none of these blocks the build.** Each is either deferred with its scope (`OD-03`), held as
configuration (`OD-02`, `OD-04`, `OD-05`), or resolved by choosing the conservative option
(`OD-01` — never merge). The pattern is the same in each case: **where a business rule is unagreed,
build the capability and leave the rule configurable, rather than inventing the rule.**

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
| **Salesforce Developer Edition org** | 🔵 **Not yet provisioned or authenticated** — blocks all implementation |
| **Power BI Desktop** | ⬜ Not yet required — needed at the analytics stage |
| Human approval: commit · push · GitHub repository creation · org authentication · deployment · data load | 🔵 Required at each gate |

**The org is the critical path.** Nothing in [`architecture.md`](architecture.md) or
[`data-model.md`](data-model.md) leaves candidate status until it is inspected.

---

## 5. Review

This document is reviewed at each implementation increment. An assumption proven or disproven, a
risk realised, or a decision resolved is updated here and recorded in
[`implementation-log.md`](implementation-log.md).

**An assumption that turns out to be wrong is a finding, not a failure** — and recording it is worth
more to a reader than a register where everything was right.
