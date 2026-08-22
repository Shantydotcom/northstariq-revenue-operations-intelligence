# Business Problems — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Business Problems |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`current-state.md`](current-state.md) · [`baseline-metrics.md`](baseline-metrics.md) · [`project-scope.md`](project-scope.md) |

---

## Purpose and Discipline

This register consolidates the assessment in [`current-state.md`](current-state.md) into discrete,
prioritized problems that later requirements can trace to.

> ### Discovery discipline applied
>
> **No problem in this register was manufactured because a Salesforce feature exists that would
> address it.** Each was derived from one of three sources:
>
> 1. **Known Context** — stated in the project brief as a symptom leadership believes is occurring
> 2. **Structural derivation** — arithmetically or logically implied by the organizational and
>    commercial model
> 3. **Synthetic Baseline** — quantified in [`baseline-metrics.md`](baseline-metrics.md)
>
> Where a problem's cause is genuinely unknown, it is recorded as unknown. Where a problem is
> actually an undefined business policy rather than a system defect, it is recorded that way — even
> though that makes it harder to solve with configuration.

### Priority definitions

| Priority | Meaning |
|---|---|
| **P1** | Directly causes revenue loss, incorrect ownership, or blocks other fixes |
| **P2** | Materially degrades productivity or decision reliability |
| **P3** | Creates rework and inefficiency; tolerable but compounding |

### Problem statement identifiers

`PROB-###` identifiers are allocated here and are **immutable**. Phase 0C requirements (`BR-###`)
will reference them to establish backward traceability.

---

## Priority Summary

| ID | Problem | Domain | Priority | Evidence |
|---|---|---|---|---|
| `PROB-001` | Critical firmographic fields are missing on nearly half of inbound records | Data Quality | **P1** | Synthetic Baseline |
| `PROB-002` | Existing customers are treated as net-new prospects | Identity | **P1** | Assumed |
| `PROB-003` | No record explains why a routing decision was made | Routing / Auditability | **P1** | Assumed |
| `PROB-004` | Segmentation is unreliable and inherits upstream data defects | Segmentation | **P1** | Assumed |
| `PROB-005` | Ownership precedence between three assignment bases is undefined | Ownership | **P1** | Assumed |
| `PROB-006` | Speed-to-lead is slow and bimodal | Routing / SLA | **P1** | Synthetic Baseline |
| `PROB-007` | Response commitments cannot be measured reliably | SLA | **P1** | Synthetic Baseline |
| `PROB-008` | Duplicate records fragment relationships and inflate volume | Duplicates | **P2** | Synthetic Baseline |
| `PROB-009` | Territory definitions are inconsistent across segments | Territory | **P2** | Structural Finding |
| `PROB-010` | Qualification has no agreed definition | Qualification | **P2** | Assumed |
| `PROB-011` | Lifecycle stages are inconsistent and progression is not measurable | Lifecycle | **P2** | Assumed |
| `PROB-012` | Operational exceptions are invisible and unowned | Exceptions | **P2** | Assumed |
| `PROB-013` | Salesforce access governance has never been assessed | Security | **P2** | **To Be Validated** |
| `PROB-014` | The same business question yields different answers | Reporting | **P2** | Assumed |
| `PROB-015` | Metric movements cannot be explained | Analytics | **P2** | Assumed |
| `PROB-016` | Changes are deployed without governance or regression safety | Change Mgmt | **P2** | To Be Validated |
| `PROB-017` | Business rules exist only as institutional knowledge | Documentation | **P3** | Assumed |
| `PROB-018` | Administration is a single-person reactive dependency | Administration | **P3** | Structural Finding |

**7 × P1 · 9 × P2 · 2 × P3**

---

## P1 Problems

### `PROB-001` — Critical firmographic fields are missing on nearly half of inbound records

| Field | Detail |
|---|---|
| **Domain** | Data Quality |
| **Priority** | P1 |
| **Evidence** | Synthetic Baseline `B-01`–`B-05` |
| **Personas** | `PER-07`, `PER-08`, `PER-10`, `PER-12`, `PER-14` |

**Problem.** 44% of Leads lack employee count, 31% lack industry, 22% lack a usable domain, 17% lack
country. 48% lack at least one field that routing structurally requires.

**Why it matters.** Because NorthstarIQ prices per employee, employee count is simultaneously the
pricing input, the ICP fit signal, the segmentation driver, and a routing input
([`revenue-model.md`](revenue-model.md) §2). A single missing field breaks four processes at once.

**Business consequence.** Qualification is inconsistent, segmentation is unreliable, routing cannot
resolve deterministically, and pricing cannot be quoted without manual research.

**Structural insight.** At 48% incomplete, **the incomplete-data path is the main path, not an edge
case.** Any design treating it as an exception will fail on half of real volume.

**Target business outcome.** Records arriving without routing-critical data are detected, normalized
where possible, and handled through a defined path rather than failing silently.

**Related decisions.** Qualification and ICP weighting (`DEC-009`); enrichment source and scope
(`DEC-015`).

---

### `PROB-002` — Existing customers are treated as net-new prospects

| Field | Detail |
|---|---|
| **Domain** | Account Identity / Matching |
| **Priority** | P1 |
| **Evidence** | Assumed — no matching logic inspected |
| **Personas** | `PER-03`, `PER-04`, `PER-08`, `PER-10` |

**Problem.** Inbound interest from existing customers is not reliably recognized as such, and Leads
are not reliably connected to the correct Account.

**Why it matters.** NorthstarIQ derives 44% of its new ARR from expansion
([`revenue-model.md`](revenue-model.md) §3), with NRR at only 100.9%. Expansion intent misrouted to
a prospecting seller is both a poor customer experience and a direct threat to the growth mechanism
the company most depends on.

**Contributing conditions.** Matching that relies on exact company name or email domain fails
against NorthstarIQ's customer base structure — multi-site organizations, parent/subsidiary groups,
trading names, franchise models — and 22% of Leads have no usable domain at all.

**Structural insight.** Identity risk and revenue concentration coincide. Enterprise and Strategic
are 47% of ARR across only 85 accounts, and are precisely the multi-entity organizations hardest to
match.

**Target business outcome.** A record's relationship to an existing Account and its customer status
are determined explicitly, with the match basis and confidence recorded.

**Related decisions.** Matching hierarchy and fuzzy-match threshold (`DEC-008`); existing-customer
routing precedence (`DEC-003`); Lead-to-Contact duplicate handling (`DEC-004`).

**Open Question.** Whether churned Accounts are distinguishable from active customers is unknown. If
not, customer detection may match interest to ended relationships.

---

### `PROB-003` — No record explains why a routing decision was made

| Field | Detail |
|---|---|
| **Domain** | Routing / Auditability |
| **Priority** | P1 |
| **Evidence** | Assumed |
| **Personas** | `PER-02`, `PER-10`, `PER-11`, `PER-14` |

**Problem.** When a record reaches a seller, nothing records why that seller was chosen, whether
they were eligible, which rule applied, or what data drove it.

**Why it matters.** This is the defining defect of the environment, and it is different in kind from
the others. It does not make outcomes wrong — it makes them **undiagnosable**.

**Business consequence — three compounding effects:**
1. Errors cannot be classified, so they cannot be reduced systematically. Each is corrected
   individually, forever.
2. Users cannot self-serve. Every "why did this happen?" becomes an escalation to Revenue Operations
   or the administrator.
3. Analytics cannot report causes that were never recorded. **No dashboard can surface a routing
   reason that does not exist as data.**

**Measurable manifestation.** The reassignment rate is 18.6%, of which 11.3 points are identified
corrections. The remaining **7.3 points cannot be classified** as error or legitimate movement. The
true error rate is unknown and unnarrowable with current data.

**Target business outcome.** Revenue Operations can determine why any record reached its owner, and
whether that owner was eligible, without inspecting system debug output.

**Related decisions.** Event/history persistence strategy (`DEC-018`).

---

### `PROB-004` — Segmentation is unreliable and inherits upstream data defects

| Field | Detail |
|---|---|
| **Domain** | Segmentation |
| **Priority** | P1 |
| **Evidence** | Assumed |
| **Personas** | `PER-04`, `PER-05`, `PER-06`, `PER-10` |

**Problem.** Thresholds are not clearly defined, firmographic signals conflict, records lacking
inputs cannot be segmented deterministically, and manual overrides carry no recorded reason.

**Why it matters.** Segment determines the owning team, the sales motion, and the expected cycle
length. It also determines **which territory map applies** — Enterprise uses three regions,
Mid-Market two.

**Business consequence.** Mid-Market is most exposed: it produces 50.4% of new ARR from 37% of new
logos, and its boundaries touch both SMB round robin and Enterprise territory. Records that fall to
SMB round robin when they warranted a Mid-Market AE receive the wrong motion for their deal size.

**Structural insight.** Segmentation is the load-bearing element between data quality and routing.
It inherits every upstream defect and transmits it to every downstream ownership decision.

**Target business outcome.** Segment is derived from defined, governed rules; the basis is recorded;
records that cannot be segmented are identified rather than defaulted silently; overrides capture a
reason.

**Related decisions.** Enterprise employee threshold (`DEC-001`); revenue vs employee precedence
(`DEC-002`); Strategic Account designation source (`DEC-005`).

---

### `PROB-005` — Ownership precedence between three assignment bases is undefined

| Field | Detail |
|---|---|
| **Domain** | Seller Ownership |
| **Priority** | P1 |
| **Evidence** | Structural Finding (from Known Context org structure) |
| **Personas** | `PER-02`, `PER-03`, `PER-04`, `PER-10`, `PER-11` |

**Problem.** The sales organization uses three different assignment bases simultaneously — named
Strategic accounts, geographic territory, and SMB round robin — with no documented precedence for
records that could satisfy more than one.

**Why it matters.** This is not an implementation gap; it is a **business policy gap**. When an
inbound record belongs to an existing customer, in a territory, and matching a Strategic named
account, there is no agreed answer to which claim wins.

**Business consequence.** Ownership disputes consume manager time. Reassignment churn erodes trust.
Sellers develop private workarounds, further fragmenting the process.

**Important distinction.** Because this is a policy gap rather than a technical defect, **it cannot
be solved by configuration.** Building routing logic without resolving it would encode an unmade
business decision as a system rule — the specific failure this project's decision governance exists
to prevent.

**Target business outcome.** A documented, human-approved precedence order exists and is applied
consistently, with exceptions handled through a defined path.

**Related decisions.** Existing-customer routing precedence (`DEC-003`); Strategic Account
designation (`DEC-005`); seller absence handling (`DEC-007`).

---

### `PROB-006` — Speed-to-lead is slow and bimodal

| Field | Detail |
|---|---|
| **Domain** | Routing / SLA |
| **Priority** | P1 |
| **Evidence** | Synthetic Baseline `B-09`–`B-11` |
| **Personas** | `PER-06`, `PER-07`, `PER-09`, `PER-10` |

**Problem.** Median created-to-assigned is 6.4 business hours; P90 is 41 business hours; 21% of
records remain unassigned beyond 24 business hours.

**Why it matters.** Speed-to-lead is a primary determinant of inbound conversion. With NRR at
100.9%, NorthstarIQ depends on new logo acquisition and cannot absorb top-of-funnel loss.

**Structural insight.** The 6.4× gap between median and P90 is the signature of a **bimodal
process**: records satisfying the automated path move quickly; records requiring manual intervention
wait far longer. **The median conceals the problem.** Improving the median would not help the
population actually suffering — which is likely the same population identified in `PROB-001` as
lacking routing-critical data.

**Target business outcome.** Assignment latency is reduced at the P90, not merely the median, and
records that cannot be assigned automatically are surfaced immediately rather than stalling.

**Open Question.** The overlap between the 21% unassigned population and the 48% incomplete-data
population is unknown and is a priority validation target.

---

### `PROB-007` — Response commitments cannot be measured reliably

| Field | Detail |
|---|---|
| **Domain** | SLA |
| **Priority** | P1 |
| **Evidence** | Synthetic Baseline `B-14`–`B-16` |
| **Personas** | `PER-07`, `PER-09`, `PER-02`, `PER-10` |

**Problem.** Median created-to-first-touch is 15.5 business hours. Attainment against an assumed
4-business-hour expectation is 34%. But **27% of Leads have no logged first-touch activity at all**,
and it is unknown whether they were untouched or touched without logging.

**Why it matters.** The true breach rate lies between **39% and 66%**, and NorthstarIQ cannot narrow
that range. **It cannot currently distinguish an SLA failure from a measurement failure.**

**Compounding conditions:**
- Whether a formal SLA was ever agreed is unknown — the 4-hour figure is an Assumption.
- No agreed business-hours or holiday definition exists across four markets, so identical elapsed
  time yields different results depending on interpretation.
- "First touch" is undefined — it is unknown whether an automated email, an attempted call, or only
  a connected conversation counts.

**Target business outcome.** A defined, agreed response commitment exists; first touch is defined;
business hours and holidays are governed; attainment is measured on reliable inputs; breaches are
visible to an accountable owner.

**Important caution for later claims.** Any future improvement on this metric must account for the
possibility that **improved activity logging, not improved responsiveness, produced the change.**

**Related decisions.** SLA business hours (`DEC-006`); first-touch definition (`DEC-012`).

---

## P2 Problems

### `PROB-008` — Duplicate records fragment relationships and inflate volume

| Field | Detail |
|---|---|
| **Domain** | Duplicate Management · **Priority** P2 · **Evidence** Synthetic Baseline `B-06`–`B-08` |
| **Personas** | `PER-06`, `PER-07`, `PER-08`, `PER-11` |

**Problem.** 14.2% of Leads have a probable duplicate; 9.1% are created for people who already exist
as Contacts; 6.8% of Accounts are apparent duplicates.

**Business consequence.** Multiple sellers work the same organization. Account history is fragmented
across records. Reported Lead volume overstates real demand by roughly 14%, which correspondingly
understates every conversion rate computed on it.

**Important caveat.** Deduplication would *improve* apparent conversion rates with no change in
sales performance. Any later before/after analysis must state this explicitly or the improvement
claim would be misleading.

**Open Question — blocks quantification.** The 6.8% Account duplicate rate **cannot be interpreted**
until the franchise/subsidiary commercial policy is defined. An unknown share may be legitimately
distinct entities. This is a **policy gap presenting as a data problem**, and it must not be used as
an improvement target in its current form.

**Related decisions.** `DEC-004`, `DEC-008`.

---

### `PROB-009` — Territory definitions are inconsistent across segments

| Field | Detail |
|---|---|
| **Domain** | Territory · **Priority** P2 · **Evidence** Structural Finding |
| **Personas** | `PER-01`, `PER-02`, `PER-04`, `PER-05`, `PER-10` |

**Problem.** Enterprise operates three regions (East, Central, West); Mid-Market operates two (East,
West). The boundaries cannot be identical. International markets were attached to US-shaped regions
as exceptions during successive growth phases.

**Concrete manifestation.** **Germany resolves to a different region depending on segment** —
Enterprise "Central" but Mid-Market "East". Because segment derives from a field missing 44% of the
time, territory assignment inherits the instability of segmentation.

**Business consequence.** Coverage gaps and overlaps. Territory performance cannot be compared
period-over-period if boundaries changed without versioning.

**Target business outcome.** Territory definitions are explicit, versioned, and resolve
deterministically including at boundaries; precedence with other assignment bases is defined.

**Related decisions.** Territory geography model (`DEC-022`).

---

### `PROB-010` — Qualification has no agreed definition

| Field | Detail |
|---|---|
| **Domain** | Qualification · **Priority** P2 · **Evidence** Assumed |
| **Personas** | `PER-07`, `PER-09`, `PER-12`, `PER-15` |

**Problem.** No single agreed definition of a marketing-qualified Lead, and no consistent ICP fit
assessment. Marketing and Sales disagree about whether delivered volume is qualified.

**Structural insight.** This is very likely a **definitional dispute, not a performance dispute.**
Two functions measuring different things will disagree indefinitely regardless of effort. It is a
governance problem before it is a scoring problem.

**Compounding condition.** Fit assessment depends on employee count and industry, missing on 44% and
31% of Leads. Records may be qualified based on who happened to have complete data rather than who
is genuinely a good fit — a systematic bias, not random noise.

**Target business outcome.** A single governed, explainable definition of qualification and ICP fit,
owned by an accountable function, applied consistently, with the basis for each assessment recorded.

**Related decisions.** ICP score weighting (`DEC-009`); Lead source/channel taxonomy (`DEC-011`);
Lead conversion criteria (`DEC-010`).

---

### `PROB-011` — Lifecycle stages are inconsistent and progression is not measurable

| Field | Detail |
|---|---|
| **Domain** | Lifecycle · **Priority** P2 · **Evidence** Assumed |
| **Personas** | `PER-07`, `PER-09`, `PER-10`, `PER-12`, `PER-14` |

**Problem.** Lifecycle stage and Lead Status are used inconsistently and appear to overlap. Recycling
of unconverted records is undefined. Stalled records have no state that identifies them as stalled.

**Critical architectural consequence.** If stage transition history is not retained, **"how long does
a record spend in each stage" is unanswerable retrospectively — and unrecoverable.** History not
captured cannot be reconstructed later. This must be decided *before* implementation, not after.

**Target business outcome.** A single governed lifecycle taxonomy with defined transitions, recorded
history, and an explicit definition of recycling.

**Related decisions.** Lifecycle stage taxonomy (`DEC-017`); event/history persistence (`DEC-018`).

---

### `PROB-012` — Operational exceptions are invisible and unowned

| Field | Detail |
|---|---|
| **Domain** | Exception Management · **Priority** P2 · **Evidence** Assumed |
| **Personas** | `PER-11`, `PER-10`, `PER-13`, `PER-07` |

**Problem.** Unassigned records, duplicates, failed automation, and ownership disputes are handled ad
hoc by whoever notices them. There is no classification, ownership, queue, or measurement.

**Self-perpetuating mechanism.** Because remediation effort is absorbed into normal work, its cost is
invisible. Because the cost is invisible, no business case for structural fix is ever built. Because
no fix is made, the manual work continues indefinitely.

**Target business outcome.** Exceptions are detected, classified, owned, measured, and resolved
through a defined path — making the volume visible so it can be reduced.

**Related decisions.** Exception ownership model (`DEC-019`).

---

### `PROB-013` — Salesforce access governance has never been assessed

| Field | Detail |
|---|---|
| **Domain** | Security / Access · **Priority** P2 (provisional) · **Evidence** **To Be Validated** |
| **Personas** | `PER-13`, `PER-10`, `PER-17`, `PER-16` |

**Problem.** Whether current access is appropriate is **unknown**. No assessment has been performed.

> **Explicit statement of non-assertion.** This project does **not** claim that NorthstarIQ has
> excessive access, misconfigured sharing, or over-privileged integration access. **Nothing has been
> inspected.** Asserting a security defect without evidence would be dishonest and, in a real
> engagement, professionally damaging.

**What can be stated.** Security is currently treated as a configuration task rather than a governed
workstream — evidenced by its absence from the problem framing that prompted this project. That is a
governance observation, not a technical finding.

**Business consequence.** Unquantified, and **not sizeable before assessment.** Priority is
provisional and may change once inspection occurs.

**Target business outcome.** Access is designed around least privilege, documented, assigned by
persona, and **tested** — with the integration user treated as a first-class principal rather than
an afterthought.

**Related decisions.** Security/access model (`DEC-021`).

---

### `PROB-014` — The same business question yields different answers

| Field | Detail |
|---|---|
| **Domain** | Reporting · **Priority** P2 · **Evidence** Assumed |
| **Personas** | `PER-01`, `PER-02`, `PER-14`, `PER-15`, `PER-16` |

**Problem.** Reports built per-request over several years answer the same question differently. No
governed metric definitions exist; filter logic embedded in individual reports encodes implicit
definitions that were never compared.

**Business consequence.** Meetings begin by reconciling numbers rather than acting on them. Low trust
pushes users toward private spreadsheets, further fragmenting the truth.

**Structural insight — an important nuance.** There is a measurement defect **independent of
definitions**: sales cycles range from 21 to 210 days, so any blended conversion metric measured
over a window shorter than ~7 months systematically under-represents Enterprise and Strategic. **Some
disputed numbers are likely correct but misinterpreted, not wrong.** Governance must address both
causes.

**Target business outcome.** Governed KPI definitions with a single owner per metric, and
segment-appropriate measurement windows.

---

### `PROB-015` — Metric movements cannot be explained

| Field | Detail |
|---|---|
| **Domain** | Analytics · **Priority** P2 · **Evidence** Assumed |
| **Personas** | `PER-14`, `PER-16`, `PER-01`, `PER-10` |

**Problem.** Reporting is descriptive. When conversion falls, leadership cannot determine whether the
cause was lead quality, routing delay, SLA failure, segmentation error, or seasonality.

**This is the clearest demonstration of the project thesis.** The analytics gap is **not an analytics
problem**. Because routing decisions, match decisions, and lifecycle transitions leave no
explanatory record (`PROB-003`, `PROB-011`), no analytics layer can reconstruct them.

**Target business outcome.** Root-cause capability is designed into the *operational* layer at the
point of decision, so that the analytics layer has causes available to surface.

**Related decisions.** Analytics historical-data strategy (`DEC-016`); event/history persistence
(`DEC-018`); Power BI refresh/data-access architecture (`DEC-020`).

---

### `PROB-016` — Changes are deployed without governance or regression safety

| Field | Detail |
|---|---|
| **Domain** | Change Management · **Priority** P2 · **Evidence** To Be Validated |
| **Personas** | `PER-13`, `PER-10`, `PER-11` |

**Problem.** No consistent path from requirement through design, review, testing, deployment, and
verification. Whether metadata is source-controlled or a sandbox is used has not been confirmed.

**Root-cause significance.** **Weak change management is what allowed the operational debt to
accumulate in the first place.** Without governance, each growth phase could add behaviour with
nobody accountable for consolidating it.

**Consequence for this project.** Fixing routing without fixing change management would guarantee the
same accumulation recurs. This problem must be addressed structurally, not deferred as
administrative overhead.

**Target business outcome.** A defined change path with source control, testing, deployment approval,
rollback capability, and documentation updated as part of the change rather than after it.

---

## P3 Problems

### `PROB-017` — Business rules exist only as institutional knowledge

| Field | Detail |
|---|---|
| **Domain** | Documentation · **Priority** P3 · **Evidence** Assumed |
| **Personas** | `PER-13`, `PER-10`, `PER-11` |

**Problem.** Business rules, automation behaviour, territory definitions, and metric definitions
exist primarily in people's heads.

**Business consequence.** Slow onboarding. Risky change, because intended behaviour is unknown.
Knowledge leaves with people.

**Structural insight.** Documentation quality is a **consequence of change-management design**
(`PROB-016`), not an independent virtue. Documentation produced separately from work always drifts.
This is why the later project treats documentation updates as part of the change itself.

---

### `PROB-018` — Administration is a single-person reactive dependency

| Field | Detail |
|---|---|
| **Domain** | Salesforce Administration · **Priority** P3 · **Evidence** Structural Finding |
| **Personas** | `PER-13`, `PER-10`, `PER-11` |

**Problem.** One Salesforce Administrator supports 64 revenue users plus Marketing, Customer Success
and Support consumers. Configuration has accumulated across ~9 years and four growth phases without
consolidation.

**Business consequence.** Administration is necessarily reactive. Every change carries unquantified
regression risk. There is no capacity for proactive consolidation.

**Design consequence — important.** This is a **structural constraint on the later architecture, not
a staffing complaint.** Any solution that is clever but hard to maintain will degrade under this
ratio. It is the concrete justification for the *administrator maintainability*, *metadata-driven
configuration*, and *prefer maintainability over cleverness* principles — and for preferring Flow
over Apex wherever Flow suffices.

---

## Cross-Cutting Analysis

### The dependency chain — why sequencing matters

```
PROB-001  Missing firmographic data
   │
   ├──> PROB-010  Qualification cannot be assessed consistently
   ├──> PROB-002  Account matching fails (compounded by 22% missing domain)
   └──> PROB-004  Segmentation unreliable
            │
            └──> PROB-009  Territory map cannot be selected reliably
                     │
                     └──> PROB-005 / PROB-006  Wrong or slow owner assignment
                              │
                              └──> PROB-007  SLA clock starts late or never
```

**Six of the seven P1 problems share a single upstream cause.** This is why the later roadmap
sequences data quality and identity *before* routing and SLA — not for tidiness, but because routing
built on unreliable inputs cannot be made correct.

### The three problems that are not technical

| Problem | Actually a | Consequence |
|---|---|---|
| `PROB-005` Ownership precedence | **Business policy gap** | Cannot be solved by configuration |
| `PROB-008` Account duplicates | **Undefined commercial policy** presenting as a data problem | Rate not interpretable until policy defined |
| `PROB-010` Qualification dispute | **Definitional disagreement** | Governance problem before scoring problem |

**Recognizing these is a discovery output in its own right.** Building system logic for any of them
without a human decision would encode an unmade business decision as a system rule.

### The explainability theme

`PROB-003`, `PROB-011`, and `PROB-015` are one problem viewed at three layers: **the environment
does not record why automated decisions were made.** Explainability is therefore not a reporting
feature to be added later — it is an operational data-capture requirement that must be designed in at
the point of decision, because the data does not exist retrospectively.

### The measurement theme

`PROB-007`, `PROB-008`, and `PROB-014` share a root: **NorthstarIQ cannot currently prove what is
happening.** Half of its candidate baselines are conflated or definitionally blocked
([`baseline-metrics.md`](baseline-metrics.md) §7). Establishing trustworthy measurement is a
deliverable, not an assumed precondition — and it must precede any claim of improvement.

---

## What This Register Does Not Do

- ❌ It does not propose solutions. Requirements are Phase 0C; architecture is Phase 0D.
- ❌ It does not name any Salesforce component, field, Flow, or automation.
- ❌ It does not resolve any of the 22 open decisions it references.
- ❌ It does not assert technical root causes for problems where none has been inspected.
- ❌ It does not claim security defects — `PROB-013` explicitly states nothing has been assessed.
- ❌ It does not quantify anything that would require measurement not performed.
