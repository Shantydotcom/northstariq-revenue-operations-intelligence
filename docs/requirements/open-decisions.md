# Open Decisions Register

| Field | Value |
|---|---|
| **Document** | Open Decisions Register |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Open Decision — **all 22 entries await human decision** |
| **Implementation State** | Target State |
| **Related** | [`business-requirements.md`](business-requirements.md) · [`../governance/decision-governance.md`](../governance/decision-governance.md) · [`traceability-matrix.md`](traceability-matrix.md) |

---

## Purpose and Discipline

This register holds every business decision that the architecture depends on and that **only a human
can make**. Its purpose is to prevent the single most damaging failure mode in AI-assisted
engineering:

> **Encoding an unmade business decision as a system rule.**

When a requirement needs a rule that nobody has agreed, the correct output is a decision entry — not
an invented threshold that looks authoritative because it appears in a document.

### Reading rules

- **Every entry is `Open`.** None has been approved. None may be marked `Accepted` without recorded
  human approval — see [`../governance/decision-governance.md`](../governance/decision-governance.md).
- **Options are analysis, not selection.** Where a recommendation is offered it is labelled
  **Recommendation** and remains a proposal. A recommendation is not a decision.
- **The identifiers are immutable.** `DEC-001`–`DEC-022` were allocated in Phase 0B and are carried
  forward unchanged. Nothing is renumbered.
- **"What is known" is separated from "what is conditional"** in every entry, so a requirement can
  cite the known part while leaving the conditional part genuinely open.

### Decision states

| State | Meaning | Count |
|---|---|---:|
| `Open` | Analysed; awaiting human decision | **22** |
| `Accepted` | Human-approved and recorded | 0 |
| `Superseded` | Replaced by a later decision, retained for history | 0 |
| `Withdrawn` | No longer required; identifier permanently retired | 0 |

---

## 1. Decision Summary

| ID | Decision | Domain | Primary requirements blocked | Total BRs citing it | Urgency |
|---|---|---|---|---:|---|
| `DEC-001` | Enterprise employee threshold | Segmentation | `BR-024`, `BR-025` | 2 | **Phase 0D** |
| `DEC-002` | Revenue vs employee segmentation precedence | Segmentation | `BR-024`, `BR-026` | 2 | **Phase 0D** |
| `DEC-003` | Existing-customer routing precedence | Routing | `BR-030`, `BR-031` | 2 | **Phase 0D** |
| `DEC-004` | Lead-to-Contact duplicate handling | Duplicates | `BR-010`, `BR-011` | 5 | Phase 1 |
| `DEC-005` | Strategic Account designation source | Segmentation / Routing | `BR-027`, `BR-031` | 4 | **Phase 0D** |
| `DEC-006` | SLA business hours and holiday calendar | SLA | `BR-038`, `BR-039` | 5 | **Phase 0D** |
| `DEC-007` | Seller absence and unavailability handling | Routing | `BR-033`, `BR-035` | 4 | Phase 1 |
| `DEC-008` | Account match confidence threshold | Identity | `BR-008`, `BR-009` | 3 | **Phase 0D** |
| `DEC-009` | ICP score weighting | Qualification | `BR-014`, `BR-015` | 3 | Phase 1 |
| `DEC-010` | Lead conversion criteria | Qualification / Lifecycle | `BR-017`, `BR-021` | 4 | Phase 1 |
| `DEC-011` | Lead source and channel taxonomy | Data Quality / Qualification | `BR-004`, `BR-016` | 2 | Phase 1 |
| `DEC-012` | First-touch definition | SLA | `BR-040`, `BR-041` | 2 | **Phase 0D** |
| `DEC-013` | Round-robin behaviour | Routing | `BR-034` | 2 | Phase 1 |
| `DEC-014` | Marketing automation system and scope | Technology boundary | `BR-004`, `BR-016` | 3 | **Phase 0D** |
| `DEC-015` | Enrichment source and scope | Data Quality | `BR-005`, `BR-006` | 2 | **Phase 0D** |
| `DEC-016` | Analytics historical-data strategy | Analytics | `BR-048`, `BR-050` | 5 | **Phase 0D** |
| `DEC-017` | Lifecycle stage taxonomy | Lifecycle | `BR-019`, `BR-020` | 4 | **Phase 0D** |
| `DEC-018` | Event and history persistence strategy | Lifecycle / Analytics | `BR-020`, `BR-022`, `BR-049` | 10 | **Phase 0D — irreversible** |
| `DEC-019` | Exception ownership model | Exceptions | `BR-044`, `BR-046` | 6 | Phase 1 |
| `DEC-020` | Power BI refresh and data-access architecture | Analytics | `BR-051`, `BR-052` | 4 | **Phase 0D** |
| `DEC-021` | Security and access model | Security | `BR-053`–`BR-058` | 11 | **Phase 0D** |
| `DEC-022` | Territory geography model | Territory | `BR-028`, `BR-029` | 2 | **Phase 0D** |

The *Primary requirements blocked* column names the requirements whose core rule **is** the decision;
the count column shows every requirement citing it, including those whose dependency is a single
conditional acceptance criterion.

**Fourteen of twenty-two decisions block Phase 0D architecture.** That is not a scheduling problem
to be worked around; it is the accurate state of a project whose discovery found that several core
business rules were never agreed.

### The one irreversible decision

> ⚠️ **`DEC-018` is different in kind from every other entry.**
>
> All other decisions can be changed later at the cost of rework. `DEC-018` determines whether
> historical state transitions are captured **at the moment they occur**. History not captured
> **cannot be reconstructed retrospectively.** Deferring it is not a neutral act — deferral is
> itself a decision to lose the data permanently.
>
> This decision must be made before implementation begins, not after.

### Decisions that are policy, not configuration

Three decisions cannot be resolved by any amount of Salesforce design, because the underlying
business rule has never been agreed:

| Decision | Underlying gap |
|---|---|
| `DEC-003` / `DEC-005` | **Ownership policy** — which claim wins when named account, territory, and customer status conflict (`PROB-005`) |
| `DEC-004` | **Commercial policy** — whether a franchisee or subsidiary is a distinct customer (`PROB-008`) |
| `DEC-009` / `DEC-010` | **Definitional agreement** — what "qualified" means, and who owns the definition (`PROB-010`) |

Building logic for any of these without a human decision is the specific failure this register
exists to prevent.

---

## 2. Segmentation Decisions

### `DEC-001` — Enterprise employee threshold

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Segmentation Framework |
| **Related problems** | `PROB-004`, `PROB-001` |
| **Related requirements** | `BR-024`, `BR-025` |
| **Decision owner** | VP Sales (`PER-01`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D segmentation design |

**Question.** At what employee count does an organization become Enterprise rather than Mid-Market,
and where do the SMB/Mid-Market and Enterprise/Strategic boundaries sit?

**What is known.**

- NorthstarIQ prices per employee, so employee count is simultaneously the pricing input, the ICP
  signal, the segment driver, and a routing input ([`../discovery/revenue-model.md`](../discovery/revenue-model.md) §2).
- The customer base concentrates between 150 and 3,000 employees.
- Four segments exist and are Known Context: SMB, Mid-Market, Enterprise, Strategic.
- Coverage and quota differ materially by segment (SMB $340k/AE to Strategic $2.0M/AE).

**What remains conditional.**

- The numeric boundaries themselves. **No threshold has been agreed and none is invented here.**
- Whether boundaries differ by market. A 500-employee organization is a different commercial
  proposition in Germany than in the US, and NorthstarIQ has not established whether one global
  boundary applies.
- Whether boundaries are versioned, so that historical segment assignments remain interpretable when
  thresholds change.

**Why it cannot be deferred.** Segment determines the owning team, the sales motion, the expected
cycle length, **and which territory map applies** — Enterprise uses three regions, Mid-Market two.
Every downstream ownership decision inherits this boundary.

**Analysis.** Whatever value is chosen, the design consequence is the same and can be stated now: the
boundary must be **governed configuration rather than logic embedded in automation**, because a
threshold that requires a deployment to change will not be changed, and will silently drift from the
commercial reality it represents.

**Recommendation.** Treat thresholds as versioned configuration data with an effective date, so that
a threshold change does not retroactively rewrite historical segment assignments. **This is a
recommendation about the mechanism, not the value.** The value requires a human decision.

---

### `DEC-002` — Revenue vs employee segmentation precedence

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Segmentation Framework |
| **Related problems** | `PROB-004`, `PROB-001` |
| **Related requirements** | `BR-024`, `BR-026` |
| **Decision owner** | VP Sales (`PER-01`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D segmentation design |

**Question.** When employee count and annual revenue indicate different segments, which wins — and
what happens when one or both are missing?

**What is known.**

- Employee count is missing on **44%** of Leads (`B-01`). Any rule depending on it alone fails on
  nearly half of volume.
- NorthstarIQ prices per employee, giving employee count a direct commercial meaning that revenue
  does not have for this product.
- Revenue data availability on inbound Leads has not been assessed and may be lower than employee
  count availability.

**What remains conditional.**

- The precedence order itself.
- The behaviour when the primary signal is missing: fall back to the secondary signal, or classify
  the record as unsegmentable and route it to an exception path?
- Whether a record segmented on a fallback signal is marked as lower-confidence.

**Analysis.** These are two separable questions and conflating them is a design error:

1. **Which signal is authoritative when both are present and disagree** — a commercial judgement.
2. **What happens when the authoritative signal is absent** — a design question with a defensible
   answer available now.

On (2), the Phase 0B finding is decisive: at 48% incomplete, **the incomplete-data path is the main
path, not an edge case** (`PROB-001`). A design that silently defaults unsegmentable records into any
segment will misroute at scale, and — because the default is invisible — will do so undetectably.

**Recommendation.** Records that cannot be segmented on the authoritative signal are marked
explicitly as unsegmentable and surfaced, **not defaulted**. Whether a fallback signal is permitted,
and which signal is authoritative, require a human decision.

---

### `DEC-005` — Strategic Account designation source

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Segmentation Framework / Revenue Routing Engine |
| **Related problems** | `PROB-004`, `PROB-005` |
| **Related requirements** | `BR-027`, `BR-031` |
| **Decision owner** | VP Sales (`PER-01`) |
| **Blocks** | Phase 0D segmentation and routing design |

**Question.** What makes an Account Strategic, who may set that designation, and does it override
firmographic segmentation?

**What is known.**

- Strategic is an **explicit designation**, not a firmographic outcome — 11 customers, 2 AEs, $2.0M
  quota per AE, executive-led motion.
- Strategic AEs (`PER-03`) expect named accounts never to be routed elsewhere.
- Strategic sits outside the geographic territory model entirely, which is why it participates in the
  ownership precedence conflict in `PROB-005`.

**What remains conditional.**

- Whether designation is manual, criteria-driven, or approval-gated.
- **Who may set it.** This is a governance question with a direct integrity consequence: if a
  Strategic AE can set the flag on an Account, then routing precedence becomes self-serve and the
  precedence order established in `DEC-003` can be bypassed by the party who benefits.
- Whether Strategic designation propagates to subsidiaries and franchisees — which cannot be answered
  before `DEC-004`.
- Whether an Account can lose the designation, and what happens to in-flight records if it does.

**Analysis.** The access consequence is genuine and is the reason this is not a trivial decision. Any
field that overrides routing precedence is effectively a **permission**, regardless of how it is
implemented. It should be designed and access-controlled as one.

**Recommendation.** Whatever designation mechanism is chosen, the ability to set it should be a
deliberately granted capability rather than an incidental consequence of Account write access. **The
designation criteria require a human decision.**

---

## 3. Identity and Duplicate Decisions

### `DEC-004` — Lead-to-Contact duplicate handling

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Account Identity & Matching Engine |
| **Related problems** | `PROB-008`, `PROB-002` |
| **Related requirements** | `BR-010`, `BR-011` |
| **Decision owner** | Revenue Operations (`PER-10`) with VP Sales (`PER-01`) |
| **Blocks** | Phase 1 duplicate design |

**Question.** When a Lead is created for a person who already exists as a Contact, what happens? And
separately: **is a franchisee or subsidiary a distinct customer or part of the parent relationship?**

**What is known.**

- **9.1%** of Leads are created for people who already exist as Contacts (`B-07`).
- **6.8%** of Accounts are apparent duplicates (`B-08`) — but this figure is explicitly flagged as
  **not interpretable** until the commercial policy is defined.
- NorthstarIQ's customer base is structurally prone to this: multi-site organizations, parent/subsidiary
  groups after acquisition and rebranding, and franchise/licensee models in hospitality and retail.

**What remains conditional.**

- Block, merge, flag for review, or allow with a link?
- **The franchise/subsidiary commercial policy.** This is the load-bearing part.
- Who may perform a merge, and whether merges are reversible or audited.

**Analysis — this is a commercial policy question wearing a data problem's clothing.** Whether a
hospitality franchisee is the same customer as its parent brand determines: whether two Accounts are
duplicates or legitimately distinct; whether expansion revenue is attributed to one relationship or
two; which seller owns the relationship; and whether the 6.8% duplicate rate is a data-quality defect
or a correct representation of a complex customer base.

**Solving it as a matching problem would encode an unmade commercial decision.** The Phase 0B
register is explicit that the 6.8% figure **must not be used as an improvement target in its current
form** — deduplication would improve apparent conversion rates with no change in sales performance.

**Recommendation.** Resolve the commercial policy **before** designing any matching or merge
behaviour. Until then, `BR-010` requires detection and surfacing only, never automated merge.

---

### `DEC-008` — Account match confidence threshold

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Account Identity & Matching Engine |
| **Related problems** | `PROB-002`, `PROB-008` |
| **Related requirements** | `BR-008`, `BR-009` |
| **Decision owner** | Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D identity design |

**Question.** What match confidence is required to link a record to an Account automatically, and
what happens between "confident" and "no match"?

**What is known.**

- **22%** of Leads have no usable domain (`B-03`) — the primary matching signal is unavailable on
  roughly one record in five.
- Exact-name and exact-domain matching fails against NorthstarIQ's customer base structure.
- **Identity risk and revenue concentration coincide**: Enterprise and Strategic are 47% of ARR across
  only 85 accounts, and are precisely the multi-entity organizations hardest to match.
- 44% of new ARR comes from expansion, with NRR at 100.9% — misrouted expansion intent directly
  threatens the growth mechanism the company most depends on.

**What remains conditional.**

- The threshold values, and whether one threshold or a confident/review/no-match band structure
  applies.
- The **matching hierarchy** — which signals are tried in which order, and their relative weight.
- Whether thresholds differ by segment. The argument for a stricter threshold on Strategic and
  Enterprise is that the cost of a wrong match is higher; the argument against is added complexity for
  `PER-13` to maintain.
- Whether churned Accounts are distinguishable from active customers. **Open Question from Phase 0B**
  — if not, customer detection may match interest to ended relationships.

**Analysis.** Two error types have asymmetric cost, and the threshold is the dial between them:

| Error | Consequence |
|---|---|
| **False positive** — wrong Account linked | Record routed to the wrong seller; customer history corrupted; corrupted data persists |
| **False negative** — real customer missed | Expansion intent treated as net-new (`PROB-002`); poor experience; recoverable |

A false positive corrupts data; a false negative wastes an opportunity. **They are not equally
costly**, which argues for a review band rather than a single cut-off. Whether a review band is
operationally affordable depends on volume and on `PER-11` capacity.

**Recommendation.** A three-band structure (auto-link / review / no match) rather than a binary
threshold, with the match basis and confidence recorded on the record regardless of band. **The
threshold values require a human decision.**

---

## 4. Routing and Ownership Decisions

### `DEC-003` — Existing-customer routing precedence

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Routing Engine |
| **Related problems** | `PROB-005`, `PROB-002` |
| **Related requirements** | `BR-030`, `BR-031` |
| **Decision owner** | VP Sales (`PER-01`) |
| **Blocks** | Phase 0D routing design |

**Question.** When a record could be claimed by a Strategic named-account owner, a territory owner,
**and** an existing-customer relationship owner, which claim wins?

**What is known.**

- The sales organization uses **three assignment bases simultaneously** — named account, geographic
  territory, and SMB round robin — with **no documented precedence order**. This is Known Context
  from the org structure, not an assumption.
- 44% of new ARR comes from expansion, so existing-customer records carry disproportionate value.
- Ownership disputes currently consume manager (`PER-02`) time and are arbitrated **without evidence**,
  because nothing records why a seller was selected (`PROB-003`).

**What remains conditional.**

- The precedence order.
- Whether precedence differs by segment, or by whether the existing relationship is active or churned.
- What happens when the precedence-winning seller is ineligible — deferred to `DEC-007`.
- Whether precedence is applied at record creation only, or re-evaluated when data changes.

**Analysis.** This is explicitly identified in Phase 0B as a **business policy gap, not an
implementation gap** (`PROB-005`). It cannot be solved by configuration. Building routing logic
without resolving it would encode an unmade business decision as a system rule.

What *can* be stated without pre-empting the decision: **the precedence order must be explicit,
ordered, and recorded on each routed record**, whatever it turns out to be. A precedence order that
exists only as automation behaviour reproduces `PROB-003` in a new form — the outcome would be
correct but still undiagnosable.

**Recommendation.** Express precedence as ordered, governed configuration that Revenue Operations
(`PER-10`) can inspect and version without a deployment. **The order itself requires a human
decision.**

---

### `DEC-007` — Seller absence and unavailability handling

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Routing Engine |
| **Related problems** | `PROB-005`, `PROB-006` |
| **Related requirements** | `BR-033`, `BR-035` |
| **Decision owner** | Sales Manager (`PER-02`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 1 routing design |

**Question.** What happens when the seller a record should route to is unavailable — inactive, on
leave, at capacity, or no longer covering that territory?

**What is known.**

- 21% of records remain unassigned beyond 24 business hours (`B-11`), and the process is bimodal:
  records requiring manual intervention wait far longer than the median suggests (`PROB-006`).
- The overlap between the unassigned population and the incomplete-data population is **unknown** and
  is a priority validation target.
- The current environment has no defined behaviour for this case — records simply stall.

**What remains conditional.**

- Definition of "unavailable" — inactive User, an availability flag, a capacity threshold, or all
  three.
- Reassign to a peer, hold, escalate to a queue, or assign to the manager?
- Whether a held record retains its SLA clock or restarts it. **This has a direct measurement
  consequence**: a restarted clock makes SLA attainment look better without any improvement in
  customer experience, and would corrupt the `B-14`/`B-15` baselines as a comparison basis.
- Whether capacity is a routing input at all, which depends on capacity being measurable.

**Analysis.** The stalling behaviour is arguably worse than a wrong assignment: a misrouted record is
at least being worked and can be reassigned, whereas a stalled record is invisible until someone
notices. **Silence is the failure mode to design against**, and that principle can be stated now.

**Recommendation.** No record may remain unassigned without being visible as an exception —
established independently as `BR-033`, which does not require this decision. The eligibility rules and
fallback behaviour require a human decision.

---

### `DEC-013` — Round-robin behaviour

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Routing Engine |
| **Related problems** | `PROB-005`, `PROB-006` |
| **Related requirements** | `BR-034` |
| **Decision owner** | Sales Manager — SMB (`PER-02`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 1 routing design |

**Question.** What does "fair" mean for the SMB round robin across 11 AEs, and how is fairness
verified?

**What is known.**

- SMB is a **global** round robin covering all four markets — 11 AEs, 325 customers, 29.5 accounts
  per AE, high-velocity motion.
- `PER-06` depends entirely on round-robin fairness, and it is currently undefined.
- **Open Question from Phase 0B**: whether the round robin is genuinely global — including UK and
  Germany records with language and time-zone implications — or whether informal carve-outs exist.

**What remains conditional.**

- Strict rotation, load-balanced by open record count, or weighted by capacity?
- Whether skipped assignments (unavailable seller, per `DEC-007`) are redistributed or returned to the
  skipped seller later.
- Whether language or time-zone capability constrains the pool for UK and German records. If informal
  carve-outs already exist, encoding a pure global rotation would formalize a rule the business does
  not actually follow.
- What "fair" is measured against — record count, potential value, or working hours.

**Analysis.** Strict rotation is the simplest to implement and the easiest for `PER-13` to maintain,
but it is only fair if every record represents comparable work. Load balancing is fairer in outcome
but requires a definition of load and is materially harder to explain when a seller disputes their
allocation.

Given `PROB-003`, explainability matters as much as the algorithm: **a seller who disputes their
allocation must be answerable with evidence**, whichever mechanism is chosen.

**Recommendation.** Whatever the mechanism, distribution must be independently verifiable from
recorded data rather than asserted. **The fairness definition requires a human decision.**

---

## 5. Qualification and Lifecycle Decisions

### `DEC-009` — ICP score weighting

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | ICP Intelligence Framework |
| **Related problems** | `PROB-010`, `PROB-001` |
| **Related requirements** | `BR-014`, `BR-015` |
| **Decision owner** | VP Sales (`PER-01`) with Marketing Leadership (`PER-15`) |
| **Blocks** | Phase 1 scoring design |

**Question.** Which attributes constitute ICP fit, what weight does each carry, and what grade
boundaries apply?

**What is known.** The descriptive profile from the current customer base
([`../discovery/company-profile.md`](../discovery/company-profile.md) §3) — 50–15,000 employees
concentrated 150–3,000; Retail, Healthcare & Senior Care, Logistics & Warehousing, Manufacturing,
Hospitality; ≥40% hourly or shift-based workforce; US, Canada, UK, Germany; typically 5+ physical
locations. **This is descriptive, not an approved ICP definition.**

**What remains conditional.** The attributes, weights, grade boundaries, and whether weighting differs
by segment or market.

**Analysis — a systematic bias, not random noise.** Fit assessment depends on employee count (44%
missing) and industry (31% missing). Records may be scored well **because they had complete data**,
not because they are a better fit. Any scoring design must distinguish:

| State | Meaning | Must not be conflated |
|---|---|---|
| Low fit | Assessed, genuinely poor match | ← these are different |
| Not assessable | Insufficient data to assess | ← business outcomes |

Treating "not assessable" as "low fit" systematically deprioritizes records whose data happens to be
incomplete — which the enrichment decision (`DEC-015`) may later fix, retroactively revealing missed
opportunity.

**Recommendation.** Score and grade must be separable from assessability, and the **basis** for each
score recorded (`BR-015`). This is independent of the weights. **The weights require a human
decision.**

---

### `DEC-010` — Lead conversion criteria

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | ICP Intelligence Framework / Lifecycle Governance Framework |
| **Related problems** | `PROB-010`, `PROB-011` |
| **Related requirements** | `BR-017`, `BR-021` |
| **Decision owner** | VP Sales (`PER-01`) with Marketing Operations (`PER-12`) |
| **Blocks** | Phase 1 lifecycle design |

**Question.** What conditions must be true before a Lead is converted, and what is created on
conversion?

**What is known.** Lead conversion is a standard Salesforce capability creating Account, Contact, and
optionally Opportunity. Baselines exist for the funnel (`B-17`–`B-21`) but each carries a definitional
caveat.

**What remains conditional.** The criteria; whether an Opportunity is always created; how conversion
interacts with an existing matched Account (`DEC-008`); and whether criteria differ by segment.

**Analysis.** This is one face of the definitional dispute in `PROB-010` — a **governance problem
before it is a scoring problem**. Two functions measuring different things will disagree indefinitely
regardless of effort. The decision that matters most is not the criteria themselves but **who owns the
definition**; without a single accountable owner, any criteria agreed will drift back into dispute.

**Recommendation.** Establish definition ownership first, criteria second. **Both require a human
decision.**

---

### `DEC-011` — Lead source and channel taxonomy

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Data Quality Framework |
| **Related problems** | `PROB-010`, `PROB-014` |
| **Related requirements** | `BR-004`, `BR-016` |
| **Decision owner** | Marketing Operations (`PER-12`) |
| **Blocks** | Phase 1 data quality design |

**Question.** What is the governed list of Lead sources and channels, and how is the distinction
between them defined?

**What is known.** Source values are currently inconsistent. `PER-12` owns inbound source data.
`PER-15` disputes attribution with Sales, and inconsistent source taxonomy is a contributing cause.

**What remains conditional.** The taxonomy; whether source and channel are separate concepts; whether
values can be enforced at capture — **which depends on `DEC-014`**, since a taxonomy can only be
enforced upstream if a marketing automation platform exists and owns capture.

**Analysis.** Enforcement point matters more than the list. A taxonomy enforced at capture stays
clean; one enforced by correction afterwards degrades continuously and imposes ongoing remediation
cost on `PER-11`. The dependency on `DEC-014` is therefore real and not merely sequential.

**Recommendation.** Resolve `DEC-014` before finalizing this taxonomy, so that the enforcement point
is known before the list is designed.

---

### `DEC-017` — Lifecycle stage taxonomy

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Lifecycle Governance Framework |
| **Related problems** | `PROB-011`, `PROB-014` |
| **Related requirements** | `BR-019`, `BR-020` |
| **Decision owner** | Revenue Operations (`PER-10`) with VP Sales (`PER-01`) and Marketing Operations (`PER-12`) |
| **Blocks** | Phase 0D lifecycle design |

**Question.** What are the lifecycle stages, how do they relate to standard Lead Status and
Opportunity Stage, and what are the permitted transitions?

**What is known.**

- Lifecycle stage and Lead Status are used inconsistently and appear to overlap (`PROB-011`).
- Funnel baselines reference Inquiry → MQL → SAL → SQL → Opportunity → Closed Won (`B-17`–`B-21`), but
  **each rate carries a definitional caveat** and `B-19` explicitly depends on this decision.
- Recycling of unconverted records is undefined. Stalled records have no state identifying them as
  stalled.

**What remains conditional.** The stage list; the relationship to standard Salesforce fields; permitted
transitions and whether backwards movement is allowed; the definition of recycling; and whether
stages differ by segment given 21–210 day cycle spread.

**Analysis — a real Salesforce design tension.** Lead Status is a standard field with platform
behaviour attached (conversion, reporting). A parallel custom lifecycle field can create two competing
sources of truth, which is arguably how the current inconsistency arose. Options include using Lead
Status as the taxonomy, maintaining a separate stage spanning Lead and Opportunity, or a hybrid.
**Each has a maintainability cost for `PER-13`**, which the 1:64 ratio makes a first-order concern
rather than a detail.

**Recommendation.** Whatever taxonomy is chosen, it must be **single-sourced** — one authoritative
field per concept, with any derived value clearly derived. **The taxonomy requires a human decision.**

---

### `DEC-012` — First-touch definition

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue SLA Framework |
| **Related problems** | `PROB-007` |
| **Related requirements** | `BR-040`, `BR-041` |
| **Decision owner** | SDR/BDR Manager (`PER-09`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D SLA design |

**Question.** What counts as a first touch — an automated email, an attempted call, a connected
conversation, or any logged activity?

**What is known.**

- **27%** of Leads have no logged first-touch activity at all (`B-16`).
- The true breach rate therefore lies between **39% and 66%** and cannot currently be narrowed.
- NorthstarIQ **cannot distinguish an SLA failure from a measurement failure**.
- Whether the 27% were genuinely untouched or touched without logging is unknown.

**What remains conditional.** The definition; whether automated outreach counts; whether the
definition differs by segment or channel; and whether activity capture can be automated — which
depends on `TL-04`, an unestablished capability.

**Analysis — the caution that must travel with this decision.** A definition that counts automated
email would show dramatic apparent improvement with **no change in human responsiveness**. Phase 0B
records this explicitly: any future improvement claim on SLA must account for the possibility that
**improved logging, not improved responsiveness, produced the change**.

This makes `DEC-012` unusual — it is a decision about *what to measure*, and different choices produce
different apparent performance from identical behaviour. It should be decided on what genuinely
represents customer experience, not on which definition produces a better number.

**Recommendation.** Whichever definition is chosen must be fixed **before** any baseline comparison is
published, and the definition recorded alongside every reported figure.

---

## 6. SLA Decisions

### `DEC-006` — SLA business hours and holiday calendar

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue SLA Framework |
| **Related problems** | `PROB-007`, `PROB-006` |
| **Related requirements** | `BR-038`, `BR-039` |
| **Decision owner** | VP Sales (`PER-01`) with SDR/BDR Manager (`PER-09`) |
| **Blocks** | Phase 0D SLA design |

**Question.** What response commitment applies, over what business hours, against which holiday
calendars?

**What is known.**

- Four markets spanning **UTC−8 to UTC+1**. US West Coast and Germany share roughly **one hour** of
  standard business day.
- **Four distinct national holiday calendars.**
- The 4-business-hour figure used in the Phase 0B baseline is an **Assumption**, not a documented
  commitment. Whether NorthstarIQ ever formally agreed a response SLA is **unknown**.
- Median created-to-first-touch is 15.5 business hours (`B-14`); attainment against the assumed
  4-hour expectation is 34% (`B-15`).

**What remains conditional.** Whether a commitment exists at all; its duration; whether it varies by
segment or channel; whose business hours apply — the record's market, the assigned seller's, or a
single global standard; and which holiday calendars are honoured.

**Analysis.** With only one hour of overlap between the extremes, **a single global response
expectation cannot be measured consistently.** The same elapsed time yields different SLA outcomes
depending on which calendar is applied. This is arithmetic, not opinion.

There is also a prior question hiding inside this one: **if no commitment was ever agreed, then "66%
breach rate" measures performance against a standard nobody committed to.** Establishing the target is
a prerequisite to the metric being meaningful at all — the measurement is not merely imprecise, it is
currently ungrounded.

**Recommendation.** Establish whether a commitment exists before designing measurement. Business hours
and holiday calendars should be governed configuration, not embedded logic, because holiday calendars
change annually and a deployment-gated calendar will not be maintained. **The commitment requires a
human decision.**

---

## 7. Technology Boundary Decisions

### `DEC-014` — Marketing automation system and scope

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Technology boundary |
| **Related problems** | `PROB-010`, `PROB-001` |
| **Related requirements** | `BR-004`, `BR-016` |
| **Decision owner** | Marketing Operations (`PER-12`) with Marketing Leadership (`PER-15`) |
| **Blocks** | Phase 0D interface design |

**Question.** Does a marketing automation platform exist, what falls inside its boundary, and where
does Lead capture actually occur?

**What is known.** 24,000 inquiries per year must arrive through **some** mechanism, and an MQL
concept exists — so a capture capability necessarily exists (`TL-01`). **No system has been
identified.** The platform itself is recorded as `UNKNOWN / TO BE VALIDATED`.

**What remains conditional.** Whether a platform exists; what it owns; whether Salesforce or the
platform is the source of truth for source, channel, and MQL status; and whether qualification is
enforced upstream of Salesforce or inside it.

**Analysis.** This determines **where the boundary of this project sits**, which is why it is treated
as a decision rather than a discovery gap. It directly constrains `DEC-011` (can taxonomy be enforced
at capture?) and `DEC-010` (is MQL determined upstream?).

**The project must not invent a vendor.** Phase 0B deliberately records this capability as
unestablished rather than assuming a platform, and that discipline is preserved here.

**Recommendation.** Design the **interface contract** — what data must arrive, in what shape, with
what guarantees — independently of which system provides it. This makes progress possible without
inventing a vendor, and is the position taken in `BR-004`.

---

### `DEC-015` — Enrichment source and scope

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Data Quality Framework |
| **Related problems** | `PROB-001` |
| **Related requirements** | `BR-005`, `BR-006` |
| **Decision owner** | Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D data quality design — **two materially different architectures** |

**Question.** Is firmographic enrichment available, and if so, at what point does it apply?

**What is known.** 44% missing employee count implies either no enrichment, failing enrichment, or
enrichment not applied at capture (`TL-03`). **No provider has been identified.** Phase 0B records
this as `DEP-035`, a dependency that determines whether 48% incomplete routing data is a **transient
condition or a permanent operating reality**.

**What remains conditional.** Whether enrichment exists; whether it is a Salesforce-native capability,
an external service, or manual; whether it applies at capture or on a schedule; and coverage — no
provider covers every organization, so a residual incomplete population remains regardless.

**Analysis — this decision selects between two architectures, not two settings.**

| If enrichment is available | If it is not |
|---|---|
| Missing firmographics are a **transient** condition | 48% incomplete is a **permanent operating reality** |
| Design can wait for enrichment before routing | Design must route usefully on incomplete data |
| Exception volume is temporary | Exception handling is a core, permanently-staffed path |

Choosing wrongly here produces an architecture that fails on half of real volume. This is the single
most consequential technology-boundary decision in the register.

**Recommendation.** Until resolved, design for the **more demanding case** — that incomplete data is
permanent — because a design that handles permanence also handles transience, while the reverse is not
true. This is the position taken in `BR-006` and it is a design hedge, not a resolution of the
decision.

---

## 8. Analytics Decisions

### `DEC-016` — Analytics historical-data strategy

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Intelligence Model |
| **Related problems** | `PROB-015`, `PROB-014` |
| **Related requirements** | `BR-048`, `BR-050` |
| **Decision owner** | Data / BI Analyst (`PER-14`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D analytics design |

**Question.** How is historical state retained for trend and cohort analysis — in Salesforce, in an
intermediate store, or in Power BI?

**What is known.** Sales cycles span **21–210 days**, so any blended metric measured over a window
shorter than roughly seven months systematically under-represents Enterprise and Strategic
(`PROB-014`). Meaningful cohort analysis therefore requires history well beyond a single quarter.

**What remains conditional.** Where history lives; retention period; grain (daily snapshot, event-level,
or period-end); and how it interacts with `DEC-018`.

**Analysis.** This is closely coupled to `DEC-018` but distinct: `DEC-018` decides **whether operational
events are captured at all**; `DEC-016` decides **how captured data is retained for analysis**.
`DEC-018` is the irreversible one — no analytics strategy can recover events that were never recorded.

**Recommendation.** Resolve `DEC-018` first. Analytics retention is a recoverable decision; event
capture is not.

---

### `DEC-018` — Event and history persistence strategy

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Lifecycle Governance Framework / Revenue Intelligence Model |
| **Related problems** | `PROB-011`, `PROB-015`, `PROB-003` |
| **Related requirements** | `BR-020`, `BR-022`, `BR-049` |
| **Decision owner** | Revenue Operations (`PER-10`) with Data / BI Analyst (`PER-14`) |
| **Blocks** | **Phase 0D — and irreversible once implementation begins** |

**Question.** Are lifecycle transitions, routing decisions, and match decisions persisted as history —
and if so, in what form?

**What is known.**

- **If stage transition history is not retained, "how long does a record spend in each stage" is
  unanswerable retrospectively — and unrecoverable** (`PROB-011`).
- No analytics layer can reconstruct causes that were never recorded (`PROB-015`).
- The current environment does not record why any automated decision was made (`PROB-003`).

**What remains conditional.** Which events are captured; the mechanism (field history tracking, a
custom history object, platform events, or a combination); retention period; and Developer Edition
storage limits — a real constraint requiring representative rather than exhaustive capture.

**Analysis — why this decision is categorically different.**

> Every other decision in this register can be revisited at the cost of rework. **This one cannot.**
> If a record moves from one stage to another and nothing records it, that transition is gone. It
> cannot be recovered by any later configuration, integration, or analysis.
>
> **Deferring this decision is itself a decision — to lose the data permanently.**

There is also a scope trap. Capturing everything is expensive in Developer Edition and produces noise;
capturing nothing forecloses the explainability that is the project's central thesis. The decision is
about **which events carry analytical value**, not whether to capture events at all.

**Recommendation.** Capture, at minimum, the events the explainability requirements depend on:
lifecycle transitions (`BR-020`), routing decisions (`BR-032`), and match decisions (`BR-009`). Decide
this **before** Phase 1 implementation begins, not after. **The scope and mechanism require a human
decision.**

---

### `DEC-020` — Power BI refresh and data-access architecture

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Intelligence Model / Revenue Intelligence Command Center |
| **Related problems** | `PROB-015`, `PROB-014` |
| **Related requirements** | `BR-051`, `BR-052` |
| **Decision owner** | Data / BI Analyst (`PER-14`) with Salesforce Administrator (`PER-13`) |
| **Blocks** | Phase 0D analytics design |

**Question.** How does Power BI obtain Salesforce data, under what identity, at what frequency?

**What is known.** Power BI must read from **somewhere**; whether that is a direct connection or an
intermediate store is undetermined (`TL-07`). Neither a data warehouse nor a middleware layer has been
identified (`TL-07`, `TL-08`).

**What remains conditional.** Connection method; refresh frequency and whether it differs by dataset;
the identity used; and whether an intermediate store exists.

**Analysis — this is a security decision as much as an architecture decision.** Whatever identity
Power BI connects under is a principal with read access to revenue data, and it is exactly the kind of
access that gets over-granted for convenience. It falls squarely under `PER-17` and the least-privilege
position taken in `DEC-021`.

Refresh frequency is a business question, not a technical preference: an SLA breach view that refreshes
daily cannot support intraday response management, while near-real-time refresh imposes cost and load
that most of the reporting does not need.

**Recommendation.** Derive refresh frequency from the decision latency each KPI supports
([`../governance/kpi-governance.md`](../governance/kpi-governance.md)), and treat the analytics
connection identity as a first-class principal under `DEC-021`. **The architecture requires a human
decision.**

---

## 9. Territory and Security Decisions

### `DEC-022` — Territory geography model

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Territory Management Framework |
| **Related problems** | `PROB-009`, `PROB-005` |
| **Related requirements** | `BR-028`, `BR-029` |
| **Decision owner** | VP Sales (`PER-01`) |
| **Blocks** | Phase 0D territory design |

**Question.** How are territories defined, and how is the Enterprise/Mid-Market region asymmetry
resolved?

**What is known — this is a Structural Finding, not an assumption.**

- Enterprise operates **three** regions (East, Central, West); Mid-Market operates **two** (East,
  West). The boundaries therefore **cannot be identical**.
- **Germany resolves to Enterprise "Central" but Mid-Market "East."** The same organization resolves
  to a different region depending on which segment it lands in.
- UK sits inside "East" for both.
- International markets were attached to US-shaped regions as exceptions during successive growth
  phases, rather than being treated as territories in their own right.
- Because segment derives from a field missing 44% of the time, **territory inherits the instability
  of segmentation**.

**What remains conditional.** Whether the asymmetry is corrected or formalized; whether international
markets become territories in their own right; whether territory definitions are versioned; and how
boundary cases resolve.

**Analysis.** The asymmetry is not necessarily a defect — different segments genuinely may warrant
different coverage shapes. The defect is that it is **undocumented and produces inconsistent results
without anyone intending it**.

Versioning is the part with a measurement consequence: **territory performance cannot be compared
period-over-period if boundaries changed without versioning**, and NorthstarIQ has already changed
them repeatedly across four growth phases.

**Recommendation.** Territory definitions should be explicit, versioned, governed configuration with
effective dates, whatever the boundaries turn out to be. **The boundaries require a human decision.**

---

### `DEC-019` — Exception ownership model

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Revenue Operations Exception Framework |
| **Related problems** | `PROB-012` |
| **Related requirements** | `BR-044`, `BR-046` |
| **Decision owner** | Revenue Operations (`PER-10`) with Sales Operations (`PER-11`) |
| **Blocks** | Phase 1 exception design |

**Question.** Who owns each class of operational exception, and what response is expected?

**What is known.** Exceptions are currently handled ad hoc by whoever notices them, with no
classification, ownership, queue, or measurement (`PROB-012`). `PER-11` absorbs most of this work
invisibly.

**What remains conditional.** The exception classes; the owner per class; expected response times;
escalation paths; and whether ownership is a queue or a named role.

**Analysis — the self-perpetuating mechanism.** Because remediation effort is absorbed into normal
work, its cost is invisible. Because the cost is invisible, no business case for a structural fix is
ever built. Because no fix is made, the manual work continues indefinitely.

**Making the volume visible is therefore the primary requirement**, and it is separable from deciding
who owns what. Measurement can begin before ownership is settled — indeed, measuring first produces
the evidence needed to allocate ownership sensibly.

**Recommendation.** Implement detection, classification, and measurement first (`BR-044`); assign
ownership once the volume is visible. **Ownership requires a human decision.**

---

### `DEC-021` — Security and access model

| Field | Detail |
|---|---|
| **Status** | `Open` |
| **Domain** | Security & Access |
| **Related problems** | `PROB-013` |
| **Related requirements** | `BR-053`–`BR-058` |
| **Decision owner** | Salesforce Administrator (`PER-13`) with Revenue Operations (`PER-10`) |
| **Blocks** | Phase 0D security design |

**Question.** What are the Organization-Wide Defaults, role hierarchy, permission set structure,
sharing rules, and integration access model?

**What is known.**

- **Nothing has been inspected.** This project does **not** claim NorthstarIQ has excessive access,
  misconfigured sharing, or over-privileged integration access (`PROB-013`).
- What *can* be stated: security is currently treated as a configuration task rather than a governed
  workstream — a governance observation, not a technical finding.
- Real access tensions exist and are documented per persona: `PER-08` needs read visibility wider than
  ownership to avoid prospecting into customers; `PER-07` unassigned-pool visibility affects routing
  measurement integrity; `PER-14` needs broad read with no write; `PER-17` must never be
  administrator-equivalent.

**What remains conditional.** OWD per object; role hierarchy depth and shape; permission set
composition and whether permission set groups are warranted; sharing rule design; queue design; and
whether one integration user or several scoped ones are used.

**Analysis and recommendation.** A **permission-set-first** model is recommended: Profiles carry the
minimum, and business capability is granted through Permission Sets composed into Permission Set
Groups per persona. Rationale:

| Reason | Detail |
|---|---|
| **`PER-13` capacity** | A single administrator at a 1:64 ratio cannot maintain per-user permission assembly (`PROB-018`) |
| **Auditability** | Permission Sets make "who can do what, and why" inspectable — directly serving the explainability theme |
| **Least privilege** | Additive grants make over-provisioning visible; Profile-based grants hide it |
| **Change safety** | Permission Sets are source-controllable and reviewable, supporting `PROB-016` |
| **Existing posture** | The repository `.forceignore` already reflects a permission-set-first stance |

> ⚠️ **This is an architectural recommendation, not an approved business decision.** The existing
> `.forceignore` posture may remain as it is, but it does **not** constitute approval of `DEC-021`.
> The distinction between a repository convention and an approved access model is deliberate, and
> conflating them would be exactly the kind of silent decision this register prevents.

**A prerequisite this recommendation does not cover.** The OWD decision in particular cannot be made
well without knowing whether `PER-08` (BDR) requires org-wide Account read. That is a genuine
least-privilege tension with no obviously correct answer: restricting it means prospecting blind;
opening it weakens the model. **It requires a human decision.**

---

## 10. Decision Dependency Graph

Several decisions cannot sensibly be made before others. Resolution order matters.

```
DEC-014 (marketing automation boundary)
    └──> DEC-011 (source taxonomy — enforceable at capture only if a platform owns capture)
              └──> DEC-010 (conversion criteria — depends on where MQL is determined)

DEC-015 (enrichment)
    └──> selects between two data-quality architectures
              └──> DEC-009 (ICP weighting — assessability depends on data availability)

DEC-004 (franchise/subsidiary commercial policy)
    └──> DEC-008 (match threshold — cannot define a duplicate without defining an entity)
              └──> DEC-003 (existing-customer precedence — requires reliable customer identification)
                        └──> DEC-007 (seller absence — a fallback needs a primary)

DEC-001 + DEC-002 (segment thresholds and precedence)
    └──> DEC-022 (territory — Enterprise/Mid-Market maps differ, so segment selects the map)
              └──> DEC-005 (Strategic designation — sits outside the geographic model)

DEC-018 (event persistence) ── IRREVERSIBLE, decide first
    └──> DEC-016 (analytics history)
              └──> DEC-020 (Power BI refresh)

DEC-006 + DEC-012 (business hours + first touch)
    └──> together determine whether SLA is measurable at all

DEC-021 (security) ── touches every persona; no upstream dependency
DEC-013 (round robin) ── depends on DEC-007
DEC-017 (lifecycle taxonomy) ── depends on DEC-010
DEC-019 (exception ownership) ── measurement can precede ownership
```

### Recommended resolution order

| Order | Decisions | Rationale |
|---|---|---|
| **1** | `DEC-018` | **Irreversible.** Deferral permanently loses data. |
| **2** | `DEC-014`, `DEC-015` | Technology boundaries; each selects between architectures |
| **3** | `DEC-004` | Commercial policy blocking all identity work |
| **4** | `DEC-001`, `DEC-002`, `DEC-005` | Segmentation, which territory depends on |
| **5** | `DEC-022`, `DEC-003` | Territory and ownership precedence |
| **6** | `DEC-006`, `DEC-012` | SLA measurability |
| **7** | `DEC-021` | Security — informed by the access needs the above reveal |
| **8** | Remainder | `DEC-007`–`DEC-011`, `DEC-013`, `DEC-016`, `DEC-017`, `DEC-019`, `DEC-020` |

**This ordering is a recommendation for review, not a schedule.** Decisions may be made in any order
the business prefers, with one exception: **`DEC-018` genuinely cannot wait**, because unlike every
other entry, delay destroys the option rather than merely postponing it.

---

## 11. Register Integrity Rules

1. **No entry may be marked `Accepted` without recorded human approval.** See
   [`../governance/decision-governance.md`](../governance/decision-governance.md).
2. **Recommendations are not decisions.** A `Recommendation` line records analysis; it does not
   change status.
3. **Identifiers are never reused or renumbered.** A withdrawn decision keeps its identifier and is
   marked `Withdrawn`.
4. **Every requirement depending on an open decision must cite it** and must not be marked `Approved`
   while that dependency is unresolved.
5. **New decisions are appended**, never inserted into the existing sequence.
6. **A decision resolved outside this register does not exist.** Approval recorded in conversation,
   commit message, or code comment is not approval.
