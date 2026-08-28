# Architecture

| | |
|---|---|
| **Purpose** | How the requirements are met in Salesforce, and how the NorthstarIQ application reads the result |
| **Status** | 🟢 Org inspected 2026-08-22 · Increments 1-4 implemented · §13 Web MVP implemented, **Salesforce connection configured and its read path validated 2026-08-24** · unbuilt items still CANDIDATE |
| **Related** | [`requirements.md`](requirements.md) · [`data-model.md`](data-model.md) · [`security-model.md`](security-model.md) · [`../web/README.md`](../web/README.md) |

---

## ⚠️ Status of This Document

**The org was inspected on 2026-08-22.** Findings are recorded in
[`implementation-log.md`](implementation-log.md).

What changed as a result: standard Duplicate and Matching Rules replace custom duplicate logic ·
State/Country picklists are enabled, removing most country normalization · Enterprise Territory
Management is unavailable, so the configuration-driven model is required rather than merely
preferred · standard field history replaces custom history fields · `Account.Type` replaces
`Customer_Status__c` · the scheduled SLA sweep is removed in favour of a formula.

**Increments 1-4 are implemented and human-accepted**, and the sections below marked *implemented*
say so on that basis. Anything still marked **CANDIDATE** is documented and **not built**.
[`implementation-log.md`](implementation-log.md) remains the sole authority on which is which.

**Section 13 describes the NorthstarIQ application under `web/`** - a separate system that reads
this org. It is implemented, its Salesforce connection is **configured**, and its **read path was
validated against the Developer Edition org on 2026-08-24**. That run validated authentication and
SOQL read; it exercised no Salesforce control.

---

## 1. Design Principles

### The evaluation order

Every candidate component must be justified against this order, top first:

```
Standard Salesforce capability
        ↓
Existing org configuration
        ↓
Formula field / validation rule / configuration
        ↓
Flow
        ↓
Custom Metadata Type (where configuration genuinely benefits)
        ↓
Custom field
        ↓
Apex  ← last resort only
```

**Do not create custom metadata that duplicates standard Salesforce capability.** The discovery
found that what was missing at NorthstarIQ was rarely storage — it was governed behaviour and
explainability. Firmographic data, business hours, holidays, record hierarchy, and field history are
all standard capabilities and will be used as such.

### Complexity budget

Preferred envelope. **Not hard limits** — exceeding one requires a documented reason recorded in
[`implementation-log.md`](implementation-log.md). **Never add metadata to reach a number.**

| Component | Preferred | Candidate count |
|---|---|---:|
| Custom fields | ~15–25 | **12** — deployed, Increment 1 |
| Flows | ~3–5 | **1 deployed** (extended in Increment 3) |
| Queues | ~1–3 | **3 deployed** — coverage pools, zero licences |
| Custom Metadata Types | ~1–3 | **2** — approved, Increment 1 |
| Permission sets | ~3–5 | **3** — approved, Increment 1 (`NIQ_Analytics_Read` deferred) |
| Queues | ~1–3 | 2 — candidate |
| Reports | ~5–8 | 7 — candidate, built incrementally |
| Dashboards | 1 | 1 — candidate |
| Validation rules | — | 2 — candidate |
| Apex classes | **0** | **1** — approved: business-hours seam only |

**On Apex — one exception, justified and recorded.** Zero was the target. Org inspection falsified
`ASM-13`: **Salesforce Flow has no business-hours element and formula syntax has no business-hours
function.** `BusinessHours.add()` is Apex-only, and `BR-10` requires elapsed time measured on
business hours excluding holidays.

**Approved: one narrowly scoped invocable Apex utility wrapping `BusinessHours.add()`, and nothing
else.** Routing, segmentation, matching, data quality, and lifecycle logic must not move into Apex.
It requires a test class with boundary cases including a holiday scenario.

The alternative was a weekend-only formula that silently ignores holidays — which would have forced
us to skip the single highest-value SLA test.

---

## 2. The Architecture in One Picture

```
                    INBOUND RECORD  ·  STATUS CHANGE
                               │
        ┌──────────────────────▼──────────────────────┐
        │  BEFORE SAVE   Lead_Inbound_Before_Save     │
        │  one Flow · no DML · Custom Metadata reads  │
        │                                             │
        │  • lifecycle gate      ◄── configuration    │  BR-15
        │      allowed? stamp the stage entry         │  PD-09
        │  • normalize domain, country, source        │  BR-01
        │  • assess routing-critical completeness     │  BR-02
        │  • derive segment      ◄── configuration    │  BR-05
        │  • derive territory    ◄── configuration    │  BR-06
        │  • match to existing Account ──► basis      │  BR-03
        │  • apply ownership precedence               │  BR-07
        │      strategic ▸ owner ▸ territory ▸ RR     │  PD-03
        │  • evaluate seller eligibility              │  BR-08
        │  • record reason + rule version             │  BR-08  ◄── the thesis
        │  • compute SLA target on business hours     │  BR-10
        │  • capture first touch                      │  BR-11
        └───┬─────────────────┬──────────────────┬────┘
            │ transition      │ resolved         │ unresolved
            │ not allowed     ▼                  ▼
            ▼        ASSIGNED TO SELLER  EXCEPTION QUEUE     BR-13
         SAVE BLOCKED         │          classified by type
         Custom Error         │                  │
         nothing written      └────────┬─────────┘
                                       │
                                 SLA_Status__c       BR-11, BR-12
                                 formula, evaluated at query time
                                       │
                                       ▼
                         REPORTS ──► DASHBOARD ──► POWER BI
                               BR-22, BR-23
```

**The horizontal line through the whole design is explainability.** Every box that makes a decision
also records why it decided that way. That is not instrumentation added afterwards — it is the
reason the decision points exist as data at all.

**That picture is the process inside Salesforce.** The NorthstarIQ application that reads those
decisions back out and assesses them sits outside the org entirely - browser, then server, then a
credential boundary, then Salesforce. It is drawn in §13.

---

## 3. Automation Design

**Cohesion over proliferation.** Four candidate Flows, not seven. A Flow per business capability
produces a maintenance surface no single administrator can hold in their head, and `PROB-018` says
that administrator is already the constraint.

| # | Candidate Flow | Type | Serves | Notes |
|---|---|---|---|---|
| 1 | `Lead_Inbound_Before_Save` | Record-triggered, before save | `BR-01`, `BR-03`, `BR-05`, `BR-06`, `BR-07`, `BR-08`, `BR-10`, `BR-11`, `BR-13`, `BR-15` | ✅ **DEPLOYED + VALIDATED.** The only Flow in the org. Normalization and segmentation (Inc 2), matching, territory and routing (Inc 3), SLA (Inc 4), and lifecycle transition enforcement (2026-08-27) all live here as stages of one before-save Flow. No DML. Reads Custom Metadata only. Data quality stays in formula fields and is **not** duplicated here. |
| ~~2~~ | ~~`Lead_Inbound_After_Save`~~ | ~~Record-triggered, after save~~ | `BR-03`, `BR-07`, `BR-08`, `BR-10`, `BR-13` | **NOT CREATED.** Every responsibility listed for it turned out to be same-record field assignment, which belongs before save. Folding it into #1 removed a second DML per record. |
| ~~3~~ | ~~`Lead_First_Touch_Capture`~~ | ~~Record-triggered~~ | `BR-11` | **NOT CREATED.** Folded into #1, as anticipated. |
| ~~4~~ | ~~`SLA_Breach_Sweep`~~ | ~~Scheduled~~ | `BR-12` | **REMOVED.** `SLA_Status__c` as a formula evaluates at query time — reports and list views show breaches with no scheduled Flow. |

### Design rules binding every Flow

| Rule | Why |
|---|---|
| **Before-save for same-record field assignment** | Avoids a second DML per record. The most common Flow performance defect in an org this shape. |
| **Bulk-safe: no DML or SOQL inside a loop** | `RISK-009`. Must hold at 200 records, not just at 1. |
| **Fault paths on every element that can fail** | A silent failure leaves a record in a partial state, which is worse than not processing it. |
| **No hard-coded thresholds, IDs, or mappings** | `BR-21`. Anything the business may change lives in configuration. |
| **Recursion control on after-save updates** | Assignment writes to the record that triggered the Flow. |
| **Named, commented decision elements** | The next administrator is the audience. |

### Domain normalization — implemented (`BR-01`)

Source precedence: **`Website` when present, otherwise the `Email` domain.** Both remain unmodified
as provenance; no second original-domain field was created.

Four chained Flow formulas, each doing one thing so an administrator can read them:

| Formula | Does |
|---|---|
| `fxRawDomain` | Picks the source and lowercases/trims it |
| `fxNoProtocol` | Strips `https://` then `http://` |
| `fxNoWww` | Strips a leading `www.` only |
| `fxNormalizedDomain` | Drops any path, query string, or trailing slash |

| Input | Output |
|---|---|
| `https://www.example.com` · `http://example.net/products/` · `www.example.com` · `example.org` · `https://example.com/` | the bare registrable domain |
| Website blank, `person@example.com` | `example.com` |
| Website and Email both blank | blank |

**No public-suffix engine, no free-email-domain list, no Apex.** No approved requirement calls for
them, and inventing either would be exactly the over-engineering the project argues against.

### Segmentation — implemented (`BR-05`, `BR-21`)

The Flow holds **no thresholds**. It reads every active `Segment_Band__mdt` row, then applies:

```
Employee_Min is not null            (excludes Strategic from size-based derivation)
AND employees >= Employee_Min       (inclusive lower bound)
AND (Employee_Max is null           (no upper bound - Enterprise)
     OR employees < Employee_Max)   (exclusive upper bound)
```

Adding or retuning a band is a Custom Metadata edit, not a Flow change. That is `BR-21` working.

`Segment_Basis__c` records the signal, the outcome, and the rule version in force —
`Employee Count: 742 -> Mid-Market | Rule v1.0` — so a segment can be explained without opening the
Flow.

> **Strategic is not derivable on a Lead, by design.** The designation lives on
> `Account.Strategic_Account__c`; a Lead reaches it only through `Matched_Account__c`, which belongs
> to Increment 3. The Strategic band's null `Employee_Min__c` makes it correctly non-matching for
> size-based derivation — **the configuration itself expresses that Strategic is not a size band.**
> No Lead-level Strategic field was invented to force it.

### Identity matching — implemented (`BR-03`)

`Account.Normalized_Domain__c` is a **formula** mirroring the Lead normalization exactly, so both
sides are comparable. Matching is **exact equality on that key**:

| Accounts sharing the domain | Outcome |
|---:|---|
| 0, or no domain available | `No Match` |
| exactly 1 | `Matched` + `Matched_Account__c` |
| 2 or more | `Review` + `Ambiguous Match` — **never guessed** |

**No fuzzy matching, no probabilistic scoring, no enrichment, no Apex.** Standard Duplicate Rules
were evaluated and rejected for this purpose: they cover Lead↔Lead and Lead↔Contact, and Salesforce
has **no standard Lead→Account matching rule.**

### Strategic classification — implemented

A uniquely matched Account with `Strategic_Account__c = true` sets `Segment__c = Strategic`,
overriding the size-derived band. **No Lead-level Strategic flag exists** — one designation, one
source of truth on Account. `Segment_Basis__c` explains it:
`Strategic Account: Burlington Textiles Corp of America | Rule v1.0`

### Territory — implemented (`BR-06`, `BR-21`)

Country and state map to territory through `Routing_Rule__mdt`. **Specificity, not record order,
decides:** a state-specific rule always beats a country default, because each kind is captured into
its own variable and resolved after the loop.

> This was found by testing. The first implementation relied on Custom Metadata sort order, and
> US/California resolved to NA-East instead of NA-West. Correctness must not depend on the order a
> query returns rows in.

| Condition | Behaviour |
|---|---|
| State in a state-specific rule | That territory (e.g. US/CA → NA-West) |
| Country matched, no state rule | Country default (US → NA-East) |
| Country present, no rule | **Unsupported Geography** exception |
| Country absent | **Missing Geography** exception |

### Routing — implemented (`BR-07`, `BR-08`)

Four explicit tiers, first match wins:

```
1  Matched Strategic Account   -> Account owner
2  Matched existing Customer   -> Account owner
3  Territory resolved          -> coverage queue
4  otherwise                   -> NIQ_Routing_Exception
```

**Territory classification is decoupled from ownership coverage.** Four territories resolve to two
coverage queues — `NA-West`/`NA-East` → `NIQ_North_America`, `UK-IE`/`DACH` → `NIQ_EMEA` — proving a
territory taxonomy need not dictate queue architecture. Adding a fifth territory is one Custom
Metadata record, not a new queue.

**Queues, not users.** They consume no licences, need no rotation state, and require no `User` DML.

### The automation-authority boundary (`BR-07`)

> **Automated ownership routing is authorized only for Leads entering through the governed
> NorthstarIQ Inbound intake path. Leads outside that path retain their existing ownership.
> Routing-eligible Leads that cannot be resolved deterministically fail safe to the routing
> exception queue.**

| State | Behaviour |
|---|---|
| **CREATE** + governed intake + routable | Deterministic owner or coverage queue |
| **CREATE** + governed intake + unresolvable | `NIQ_Routing_Exception` + categorical `Exception_Type__c` |
| **CREATE** + not governed intake | **`OwnerId` preserved exactly.** `Exception_Type__c = Non-Routing Intake` — an authority boundary, *not* a routing exception. |
| **UPDATE** — any Lead | **The flow ends at the authority gate.** No ownership assignment, no intake classification, and `Routing_Reason__c` / `Exception_Type__c` are left exactly as creation set them (`BR-08` AC5). Identity, data quality, segmentation, and territory still recalculate. |

> **Routing is a creation-time decision, so `Routing_Reason__c` is a historical record.** Every routed
> reason is prefixed **`At intake:`** to say so on the record itself. A Lead created in California and
> later moved to New York shows `Territory__c = NA-East` (current) alongside
> `At intake: Territory Coverage: NA-West -> ...` (historical). Both are true, and the prefix stops
> the pair reading as a contradiction. **There is no automatic rerouting capability.**

> **Platform limitation, stated plainly.** Before-save automation cannot distinguish default
> ownership from explicit self-assignment when both resolve to the running user — `CreatedById` is
> not populated before save (`createable = false`), and owner state is therefore unusable as an
> authorization signal. NorthstarIQ uses an explicit governed intake signal instead of owner-state
> inference. `LeadSource` being unrestricted is an acknowledged Developer Edition limitation; the
> Flow nonetheless requires exact equality to the governed value.

### SLA - implemented (`BR-10`, `BR-11`, `BR-12`)

Two stages inside the existing before-save Flow. **No new Flow, no scheduled automation, no Apex.**

| Stage | Runs | Writes |
|---|---|---|
| **A - SLA initialization** | Create, governed intake, segment resolved, hours configured, not routed to the exception queue | `SLA_Target_DateTime__c`, `SLA_Basis__c` |
| **B - First touch** | `Status` first transitions to `Working - Contacted` or a Closed value | `First_Touch_DateTime__c` |

**All three are write-once.** Stage A sits on the create path only, so no update can reach it - a later
configuration change cannot retarget an existing Lead. Stage B is guarded by a blank check, so
repeated Status changes cannot move first touch.

`SLA_Status__c` is a **formula** - Excluded · Unmeasurable · Pending · At Risk · Met · Breached ·
Breached (Late Response). Nothing writes it, so it carries zero mutation risk and is always current.

> **Unmeasurable is deliberately distinct from Breached.** An SLA that could not be established is not
> a seller failure, and folding the two together would overstate breach - the `M-07` guard.

> ### Time basis - APPROXIMATION, stated plainly
>
> The target is computed by a **weekend-aware declarative calculation**, isolated in five Flow
> formulas so the basis can be replaced without touching any other element.
>
> **This is a portfolio approximation. It is NOT Salesforce Business Hours and it does NOT honour
> Holiday records.** Two known limitations:
>
> 1. **No holiday awareness** - the production gap.
> 2. **Weekend-day aware, not time-of-day clamped.** A Lead arriving Saturday 23:20 local shifts to
>    Monday 23:20 and adds 4h, landing Tuesday 03:20 - a shifted day, but not a business hour.
>
> Business Hours and Holiday records were deliberately **not** configured, since doing so would imply
> a fidelity the calculation does not have.

### Lifecycle transitions — implemented (`BR-15`, `PD-09`, `PD-12`)

The governed lifecycle is **Lead → MQL → SAL → SQL → Salesforce Lead Conversion → Opportunity**.
`Opportunity` is **not** a Lead Status, and `SQL` is **not** conversion: conversion is the platform
boundary where a Lead becomes an Account, a Contact and an optional Opportunity.

A fifth stage inside the same before-save Flow. **No new Flow, no validation rule, no Apex.**

```
Status changed  →  exact lookup in Lifecycle_Transition__mdt  →  active rule found?
                                                              yes → allow save, stamp
                                                                    Lifecycle_Stage_Entered__c
                                                               no → block save (Custom Error)
```

**The Flow holds no transition matrix of its own.** It builds the prior and new stage from the
record, passes them as filter values to one selective lookup (`From_Stage__c`, `To_Stage__c`,
`Is_Active__c`, first record only), and branches solely on *whether a record came back*. No stage
name appears in any lifecycle decision condition — verified against the deployed Flow. The Flow is
the **enforcement mechanism**; `Lifecycle_Transition__mdt` is the **policy source**. They are not
the same thing and must not be documented as though they were.

Operator-facing message when the lookup finds nothing:

> This lifecycle transition is not allowed by the governed NorthstarIQ lifecycle policy:
> {From Stage} to {To Stage}.

Record-level rather than field-level, so the same text is returned through the UI, the API and a
data load, and the whole save is rolled back.

**Native Salesforce Lead Conversion traverses this safeguard** — validated 2026-08-27 against
purpose-built synthetic fixtures. A conversion from `SQL` consumed the `SQL → Closed - Converted`
rule and stamped the timestamp inside the conversion transaction; a conversion attempted from `MQL`,
a stage the policy gives no route to `Closed - Converted`, was refused by the Custom Error and the
**entire** transaction rolled back — no Account, Contact or Opportunity was created. Evidence in
[`testing-strategy.md`](testing-strategy.md) §2i.

**Evidence, and its two layers.** `Lifecycle_Stage_Entered__c` records when the Lead entered the
stage it currently holds — one field, not one per stage, and **not** a lifecycle history model.
Salesforce field history on `Status` remains the historical transition trail. Field definition in
[`data-model.md`](data-model.md) §1.

### MQL qualification — implemented (`BR-17`, `PD-14`)

**A transition being structurally allowed does not mean the Lead earned the stage.** Two governance
questions, kept apart:

| Question | Answered by |
|---|---|
| May this stage follow the previous one? | `Lifecycle_Transition__mdt` |
| Has this Lead earned the stage? | the active `MQL_Qualification_Policy__mdt` record |

Both must hold. A Lead with a perfect qualification profile still cannot go
`Open - Not Contacted → MQL`, because that transition is not in the policy — verified, not assumed.

```
transition allowed  →  is there an active policy governing the stage being entered?
                            no  →  stamp stage entry, continue
                            yes →  evaluate the requirements THAT POLICY DECLARES
                                    all satisfied →  capture MQL_Basis__c, stamp, continue
                                    any failed    →  block, naming what was not satisfied
```

**The definition lives in the policy record, not in the Flow.** The Flow contributes *how* each
requirement is tested; *which* requirements constitute MQL is read from
`MQL_Qualification_Policy__mdt` at run time. Turning a requirement off is unchecking a box — no
deployment, no Flow edit — and the evidence string and the failure message both follow, because
each is assembled from the same policy-gated formulas. Requirement definitions and version in
[`data-model.md`](data-model.md) §2b.

**Four required conditions, none weighted** (`PD-14`), in two conceptual groups:

| Group | Requirement | Meaning |
|---|---|---|
| **Qualification eligibility** | governed acquisition source | the Lead came through a source held to a routing-readiness standard |
| | segment eligible | the business runs a seller-led motion for this segment |
| **Handoff readiness** | resolved governed coverage | Sales is handed something with an actionable coverage path |
| | unambiguous account match | ownership and account context are not in question at handoff |

The grouping explains the business logic; it does **not** create separate scoring. There is no score,
no threshold and no partial credit.

⚠️ **SYNTHETIC BASELINE** — the criteria were authored for reproducible demonstration, not
validated with a client.

**Seller activity is deliberately absent.** `First_Touch_DateTime__c` records when the *seller* first
acted (`BR-11`). Requiring it for MQL inverted the handoff — Sales would have had to act before
Marketing could validly produce the thing Sales is being handed. It was removed in **v1.1** and is
now a candidate evidence source for **Sales acceptance / SAL**, where seller action actually belongs.
Nothing replaced it: no engagement score, no intent model, no behavioural infrastructure. A truthful
four-condition policy beats an invented fifth.

**Account match: unambiguous, not matched.** `No Match` **passes** — a genuinely net-new prospect is
exactly what Marketing is supposed to find. Only `Review`, meaning two or more candidate Accounts,
fails, because ownership would be unresolved at the moment of handoff.

**No stage name and no requirement list is duplicated.** The Flow looks the policy up by the stage
being entered, and reads each requirement from the source that already owns it.

**One platform constraint worth recording.** Routing readiness would most directly be
`Data_Quality_Status__c`, but Salesforce rejects a formula field referenced from a `RecordBeforeSave`
Flow — the deployment fails outright. Rather than restate that formula's test here, which would
create a second definition of routing readiness, the requirement consumes the **derived** value:
`Territory__c` exists only because a present country was mapped by `Routing_Rule__mdt`.

**Designed so the future detective control need not copy any of this.** A NorthstarIQ **MQL
Qualification Integrity** control would read the active policy record, the same governed sources, and
the Lead's own field values, and reach the same deterministic result — no business definition
recreated in TypeScript. The integration principal already reads every one of those sources. That
control is **planned and unbuilt**.

### Sales acceptance — implemented (`BR-15`, `BR-16`, `PD-12`)

**`Status = SAL` is the claim. It is not the evidence.** Marketing qualification and Sales acceptance
are different facts about different parties, and the architecture keeps them apart:

| Fact | Evidence |
|---|---|
| Marketing qualified this Lead | `MQL_Basis__c` |
| Sales accepted responsibility for it | `Sales_Accepted_At__c` · `Sales_Accepted_By__c` · `Sales_Acceptance_Basis__c` |

Neither ever overwrites the other, and both survive every later transition.

```
transition allowed  →  not the MQL stage  →  active acceptance policy for this stage?
                                             no  →  stamp stage entry, continue
                                             yes →  explicit acceptance ticked?
                                                       substantiated MQL handoff?
                                                   both →  capture acceptance evidence, stamp, continue
                                                   else →  block, naming what was not satisfied
```

**Why this is explicit acceptance rather than an inference.** The seller performs a **separate,
deliberate act** — ticking `Sales_Accepted__c`, a field whose only purpose is to say *"I accept
responsibility for this Marketing-qualified Lead."* The lifecycle move is a second act. Moving to SAL
without the first is refused, so acceptance can never be back-derived from a picklist change. And the
seller writes only the **input**: the actor, the time and the basis are written by the Flow from the
authenticated identity, so an acceptance can be asserted but never back-dated or re-attributed.

**Two requirements, none weighted.** Explicit acceptance · substantiated Marketing handoff. The
second is an **evidence-chain** check (`MQL_Basis__c` present), deliberately not a re-run of the MQL
policy — that definition is not duplicated here.

⚠️ **SYNTHETIC BASELINE** — authored for reproducible demonstration, not validated with a client.

**First Touch is not used.** `First_Touch_DateTime__c` records when the *seller first acted*
(`BR-11`), and it is stamped on entry to `Working - Contacted` — **before MQL exists**. It therefore
cannot evidence accepting a handoff that had not yet happened, and on the governed path it is already
set before SAL, so requiring it would add a condition that is nearly always true and means something
else. Proven both ways: a Lead with First Touch and no acceptance is **refused**, and a Lead with
acceptance and no First Touch is **granted**.

**The gates stay separately readable.** MQL qualification applies only when entering the stage its
policy governs; Sales acceptance only when entering the stage *its* policy governs; native conversion
continues to be governed by the transition policy alone. Each gate is its own branch reached from the
same transition check — not one merged qualification branch.

**The detective half is now built.** The NorthstarIQ **Sales Acceptance / SQL Integrity** control
reads the active acceptance policy, the acceptance actor, time and basis, `MQL_Basis__c`, and Lead
Status history, and judges whether a SAL claim is substantiated — without recreating what acceptance
means. ✅ **IMPLEMENTED and VALIDATED (2026-08-27)** · ⚠️ **UNSCORED** — absent from `CHECK_IDS` and
`runAllChecks`, so Assessment Model v1 is unchanged.

**Rejection is out of scope, and the gap is stated.** `Closed - Not Converted` is reachable from every
stage including MQL, but it is a **disqualification**, not a recorded *Sales rejection of a handoff* —
it carries no reason and no actor. Treating the two as identical would be wrong. An explicit
rejection disposition is a **future candidate**, deliberately not built here.

### SQL qualification — implemented (`BR-15`, `BR-17`, `PD-14`)

**Each stage now proves something the previous one could not.**

| Stage | Proves | Evidence |
|---|---|---|
| MQL | Marketing had grounds to hand the Lead over | `MQL_Basis__c` |
| SAL | Sales took responsibility for it | `Sales_Accepted_At__c` · `_By__c` · `Sales_Acceptance_Basis__c` |
| **SQL** | **Sales learned something from the prospect** | **`Qualified_Need__c` · `Next_Step_Date__c` · `SQL_Basis__c`** |
| Conversion | Salesforce actually converted the Lead | `IsConverted` · `ConvertedDate` · `Converted*Id` |

```
transition allowed  →  not MQL, not SAL  →  active SQL policy for this stage?
                                             no  →  stamp stage entry, continue
                                             yes →  substantiated Sales acceptance?
                                                       confirmed business need?
                                                       next-step date today or later?
                                                   all →  capture SQL_Basis__c, stamp, continue
                                                  else →  block, naming what was not satisfied
```

**Three required conditions, none weighted** (`PD-14`). The first is an **evidence-chain** check
against the immutable acceptance timestamp — the acceptance policy and the MQL policy are **not**
re-run, and governed source, segment, territory and match state are **not** re-tested here.

⚠️ **SYNTHETIC BASELINE** — the criteria were authored for reproducible demonstration, not
validated with a client.

**The need is what makes SQL a distinct stage.** It is the only required evidence that could not have
existed before Sales spoke to the prospect: everything else either gated MQL, gated SAL, or measures
activity. It is a **restricted picklist** rather than notes, because a governed vocabulary is
assessable by a later control and prose is not — `Lead.Description` is a long text area and cannot
even be filtered in SOQL, so a "notes are not blank" policy would be unassessable as well as weak.

**Date semantics, stated precisely.** `Next_Step_Date__c` is compared to `$Flow.CurrentDate`, Date to
Date — never `$Flow.CurrentDateTime` — so no coercion is involved. **Today passes, yesterday
fails, a future date passes**, all three verified. This is a **qualification-time** test: a date that
was valid at entry will naturally fall into the past later, which is why the detective control judges
it against the recorded qualification event rather than against TODAY — it reads the date back out of
`SQL_Basis__c` and compares it to when the Lead entered `SQL`, and reports the requirement
**unmeasurable** where that event cannot be established. See
[`testing-strategy.md`](testing-strategy.md) §2m and §2p.

**What SQL does not do.** It does not convert the Lead — SQL and Salesforce Lead Conversion remain
separate events. It requires no budget, no decision-maker and no buying timeline: Salesforce needs
only `Name`, `StageName` and `CloseDate` to create an Opportunity, the default landing stage is
`Prospecting`, and the platform's own stage list places `Id. Decision Makers` several stages later. A
requirement invented ahead of the platform's own model would be methodology cosplay, not governance.

**Evidence survives the boundary.** All four stages' evidence was verified intact on a Lead taken
through native conversion from SQL, so a converted record still answers all four questions.

### What is deliberately *not* automated

| Not automated | Why |
|---|---|
| **Record merge** | Irreversible, and `OD-01` leaves the legitimately-distinct population unknown (`BR-04`) |
| **Duplicate resolution** | Surfaced for human decision only |
| **Strategic Account designation** | A commercial judgement, not a derivable value (`PD-02`) |
| **Exception resolution** | Detection and classification are automated; the fix is human |

---

## 4. Configuration Model

Rules the business is expected to change must not live inside a Flow (`BR-21`).

| Candidate CMDT | Holds | Serves | Why not a Flow constant |
|---|---|---|---|
| `Segment_Band__mdt` | Segment name · employee min/max · ARR override threshold · SLA response target · version | `BR-05`, `BR-10`, `BR-21` | A threshold change is a business decision that must not require a deployment |
| `Routing_Rule__mdt` | Precedence order · segment · territory · eligibility criteria · rule version | `BR-07`, `BR-08`, `BR-21` | The precedence order is exactly the thing `PROB-005` says was never agreed — it must be visible and changeable |
| `Routing_Readiness_Source__mdt` | `Lead_Source__c` · `Is_Active__c` | `BR-02`, `BR-21`, `BR-22` | Which Lead Sources are **held to a routing-readiness standard** is an operating decision. Held in configuration, it changes without a deployment. |
| `Lifecycle_Transition__mdt` | `From_Stage__c` · `To_Stage__c` · `Is_Active__c` · `Rule_Version__c` | `BR-15`, `BR-21`, `PD-12` | Which lifecycle transitions are permitted is a business rule, not a Flow constant. **10 records, all active at v1.0.** Withdrawing a transition is unchecking a box, not a deployment. |
| `SQL_Qualification_Policy__mdt` | `Policy_Version__c` · `Qualified_Stage__c` · 3 × `Require_*__c` · `Is_Active__c` | `BR-15`, `BR-17`, `PD-14` | **The governed definition of SQL.** **1 record, v1.0.** The third explicit stage policy — see the architecture watch in [`data-model.md`](data-model.md) §2b before a fourth is created. |
| `Sales_Acceptance_Policy__mdt` | `Policy_Version__c` · `Accepted_Stage__c` · 2 × `Require_*__c` · `Is_Active__c` | `BR-15`, `BR-16`, `PD-12` | **The governed definition of Sales acceptance.** **1 record, v1.0.** A separate type from the MQL policy rather than a shared lifecycle abstraction — two small explicit types beat one generic one. |
| `MQL_Qualification_Policy__mdt` | `Policy_Version__c` · `Qualified_Stage__c` · 4 × `Require_*__c` · `Is_Active__c` | `BR-17`, `PD-14` | **The governed definition of MQL** — which requirements constitute it, which stage they govern, which version applies. **2 records: v1.1 active, v1.0 superseded.** A fixed checkbox schema, not a rules engine: each flag declares that a requirement applies, and the requirement stays owned by the metadata that already governs it. |

**`Territory_Map__mdt` is not created.** `CountryCode` and `StateCode` are enabled as restricted
standard picklists, so the country/state → territory mapping fits inside `Routing_Rule__mdt`.

### `Routing_Readiness_Source__mdt` — assessment configuration, not automation configuration

**The third type differs from the first two in who reads it**, and that distinction is the reason it
exists separately rather than as another column on an existing type.

`Segment_Band__mdt` and `Routing_Rule__mdt` are read by the Salesforce Flow at intake: they decide
what the org *does* to a record. `Routing_Readiness_Source__mdt` is read by the **NorthstarIQ
assessment application**, and decides which records the org is *measured over*.
`Lead_Inbound_Before_Save` holds **zero references to it** — verified against the Flow metadata.

| | |
|---|---|
| **Purpose** | Governed Salesforce configuration defining which Lead Sources participate in NorthstarIQ's routing-readiness assessment population |
| **Fields** | `Lead_Source__c` (Text 255) — *"The exact `Lead.LeadSource` value this record covers. Matched on exact equality."* · `Is_Active__c` (Checkbox, defaults true) — *"Whether this source is in force."* Both `SubscriberControlled`. |
| **Active records** | 3 — `NorthstarIQ Inbound`, `Web`, `Phone Inquiry` |
| **Consumed by** | The assessment application only, at run time. One static SOQL literal, `WHERE Is_Active__c = true`, issued in the same parallel read as `Lead` and `Opportunity`. |
| **Serves** | The **Missing Routing Data** assessment, and that control alone |

**It is deliberately NOT ownership-routing authority**, and the object's own description says so.
Ownership routing stays narrower and stays in the Flow: `fxRoutingEligible` authorises reassignment
for governed intake (`LeadSource = 'NorthstarIQ Inbound'`) only. A source can be held to a
data-readiness standard without the org taking ownership of its Leads — `Web` and `Phone Inquiry`
are exactly that case.

**Empty configuration fails the run; it does not empty the population.** If the query returns no
active record, the application raises a Salesforce error rather than scoring the control 100 on the
grounds that nothing qualified. An unconfigured control that reports perfect health is a wrong answer
presented as a result, and `BR-22` requires a measure to carry its reliability rather than conceal
it.

**Three types, one more than originally intended.** §4's original target was two, on the reasoning
that automation configuration should stay minimal. The third serves a different reader — the
assessment, not the Flow — and folding it into either existing type would have put assessment scope
inside automation configuration, where a change to one would silently be a change to the other.

**SLA response targets live in `Segment_Band__mdt`, not a separate type.** The target is an attribute
of the segment. A separate `SLA_Target__mdt` would be a second table keyed on the same value.

**Business hours and holidays use standard Salesforce Business Hours and Holiday records** (`PD-05`).
Building these as custom metadata would re-implement platform capability that already handles
overnight, weekend, and holiday arithmetic correctly.

---

## 5. Segmentation Model

| Segment | Employees | Override | Motion |
|---|---|---|---|
| SMB | < 100 | — | Round robin within territory |
| Mid-Market | 100–999 | ARR where customer | Territory-owned AE |
| Enterprise | 1,000+ | ARR where customer | Named AE |
| Strategic | **Designation, not size** | — | Designated owner, executive-sponsored |

**Precedence:** explicit Strategic flag → ARR band (existing customers only) → employee band →
**unsegmentable exception**.

### Boundary and exception conditions

| Condition | Behaviour |
|---|---|
| Exactly at a band boundary (99 / 100, 999 / 1,000) | Bands are inclusive-low, exclusive-high. 100 is Mid-Market. Tested explicitly. |
| Employee count absent | **Unsegmentable exception.** Never defaulted to SMB. |
| Employee count present, ARR absent, not a customer | Employee band applies |
| Strategic flag set, size says SMB | **Strategic wins.** Designation is not derived. |
| Manual override applied | Recorded as override; derivation does not overwrite it |

> **Never default an underivable segment.** Defaulting to SMB would silently misroute the 44% of
> records missing employee count into the lowest-value motion — which is a plausible description of
> what is happening at NorthstarIQ today.

---

## 6. Territory Model

**Unified map (`PD-11`)** — one definition applied across all segments.

| Territory | Coverage |
|---|---|
| `NA-WEST` | US west states · western Canada |
| `NA-EAST` | US east states · eastern Canada |
| `UK-IE` | United Kingdom · Ireland |
| `DACH` | Germany · Austria · Switzerland |

The alternative — formalizing the current per-segment asymmetry — was rejected: the asymmetry *is*
`PROB-009`, and encoding it would preserve the problem in a tidier form.

| Condition | Behaviour |
|---|---|
| Country present, mapped | Resolves to the mapped territory |
| Country present, unmapped | **Unassignable exception** — not a default territory |
| Country absent | **Unassignable exception** |
| US with no state | Resolves to a defined default US territory, recorded as a lower-confidence basis |
| Boundary state | Each state maps to exactly one territory. No state appears twice. |

---

## 7. Routing Model

### Precedence (`PD-03`)

```
1. Strategic / named designation on the matched Account   ─┐
2. Existing Account owner (matched, active customer)       │  first match wins,
3. Territory owner for segment + territory                 │  and which one won
4. Round robin among eligible sellers in segment+territory │  is recorded
5. No eligible seller  ──────────────────────────────────► ROUTING EXCEPTION
```

### What gets recorded on every assignment (`BR-08`)

| Recorded | Why |
|---|---|
| Which precedence level resolved the assignment | Answers "why this seller" |
| The matched Account and match basis, where relevant | Answers "why did we think they were a customer" |
| Whether eligibility was evaluated and any rejection | Distinguishes "skipped" from "never considered" |
| The rule version in force | Makes historical decisions interpretable after a rule change |

**Without the rule version, a decision made under old rules looks like a defect under new ones.**
This is the difference between an audit trail and a snapshot.

### Round robin (`PD-07`)

Least-recently-assigned eligible seller within segment and territory. Rotation state is readable on
the User record, not inferred — which is what makes `BR-09` testable. Ineligible sellers are skipped
and the skip is recorded (`OD-02` interim behaviour).

---

## 8. SLA Model

| Element | Approach |
|---|---|
| Clock start | Record creation |
| Clock basis | **Standard Salesforce Business Hours**, one calendar per territory |
| Holidays | **Standard Holiday records** attached to Business Hours |
| Target | Per segment, from `Segment_Band__mdt` |
| Deadline | Stamped on the record at assignment, visible to the owner (`BR-12`) |
| First touch | Earlier of first completed Task/Event or transition to a working stage (`PD-06`) |
| Breach | Derived, not manually set — scheduled sweep plus record-level derivation |

### The measurability rule (`BR-11`)

```
first touch recorded          ──▶  MET or BREACHED
no first touch, deadline open ──▶  PENDING
no first touch, deadline past ──▶  UNMEASURABLE  ◄── not "breached"
```

**27% of the baseline population falls in the third state.** Reporting it as breach would overstate
the problem by up to 27 points. Attainment is reported over the measurable population with the
measurable share stated alongside it — always both numbers, never one.

---

## 9. Exception Model

**One queue, classified by type** — not five queues.

| Candidate queue | Holds |
|---|---|
| `Routing_Exception_Queue` | Records that could not be assigned: no eligible seller, unassignable territory |
| `Data_Review_Queue` | Records needing human data judgement: match review, probable duplicate, unsegmentable, unnormalizable |

Exception **type** is recorded on the record, so list views filter by class without needing a queue
per class. Five queues would mean five owners, five sets of sharing, and five list views to maintain
— for a distinction the classification field already makes.

| Exception class | Trigger | Destination |
|---|---|---|
| `Unassignable — No Eligible Seller` | Precedence exhausted | Routing exception |
| `Unassignable — Territory` | Geography missing or unmapped | Routing exception |
| `Unsegmentable` | Employee count and ARR both absent | Data review |
| `Match Review` | Confidence in the review band | Data review |
| `Probable Duplicate` | Duplicate signal on Lead or Contact | Data review |
| `Unnormalizable` | Value present but not normalizable | Data review |

**No record exits an automated path into an undefined state.** Either it is assigned, or it is a
classified exception in an owned destination.

---

## 10. Analytics Architecture

```
Salesforce  ──▶  Reports + Dashboard  ──▶  operational, in-context
     │
     └────────▶  scoped read principal  ──▶  Power BI model  ──▶  trend and root cause
```

| Layer | Purpose | Boundary |
|---|---|---|
| Salesforce reports | Operational answers where the work happens | Current state, list-level |
| Salesforce dashboard | One operations health view | Current state, aggregate |
| Power BI | Trend, distribution, root cause | Reads decision data; **reconciles to Salesforce** (`BR-23`) |

**Salesforce is the source of truth.** Power BI must reconcile to a SOQL query on the same
population, demonstrated rather than asserted. A dashboard that cannot reconcile is a second
competing source of truth, which is `PROB-014` rebuilt in a new tool.

Refresh architecture is `OD-05` — manual export for this release, designed but not automated.

---

## 11. Developer Edition Constraints

Binding on every design decision above.

| Constraint | Consequence |
|---|---|
| Limited user licences | 4 Salesforce licences, 2 consumed by administrators. The access model is **validated against a representative non-admin Seller principal** — 1 user, not 64. Platform licences (6 free) cannot access Lead or Opportunity, so they cannot stand in. Multi-user behaviour is not tested and is not claimed. |
| No sandbox | Changes are made in the org and captured to source control; no promotion path |
| Standard object and field limits | Reinforces the tight field budget |
| Storage limits | Dataset stays ~190 records |
| Enterprise Territory Management availability | **Confirmed unavailable** at org inspection 2026-08-22 (`ASM-10` confirmed). The configuration-driven model is required rather than merely preferred. |
| No Shield / field audit trail | Standard field history tracking only (`PD-09`) |

**Scale is designed for and never claimed.** Bulk-safe design is demonstrated at fixture volume.
"Proven under production load" is not a statement this project may make.

---

## 12. Diagram Standard

Architecture diagrams are authored in **D2** (`d2 0.7.1` verified locally), source-controlled as
`.d2` alongside their rendered output.

| Rule | Detail |
|---|---|
| Source-controlled | The `.d2` source is the artifact; rendered SVG is generated |
| One concern per diagram | A diagram showing everything shows nothing |
| Label the mechanism | Arrows carry what flows, not just direction |
| Match the documented names | Diagram labels use the same terms as this document |
| Regenerate on change | A stale diagram is worse than none |

Diagrams are produced **after** org inspection, when the architecture is real. Drawing them now
would illustrate a design that has not survived contact with the org.

---

## 13. The NorthstarIQ Application (`web/`)

**Status: implemented · ✅ the Salesforce connection is configured, and the read path was validated
against the Developer Edition org on 2026-08-24.** Everything in this section exists in source
control. The last hop is now proven, and **what it proves is bounded** - the table below states the
boundary.

Sections 1-12 describe the process **inside** Salesforce. This section describes the application
that **reads** it. The two are deliberately separate systems: the org governs the records, and the
application assesses what the org did. Nothing here writes to Salesforce.

### The system in one picture

```
   BROWSER
   No Salesforce credential ever reaches here. No token, no client secret,
   no session id — not obfuscated, not present.
        │  HTTPS
        ▼
 ┌────────────────────────────────────────────────────────────┐
 │  NEXT.JS WEB MVP  (web/)                                   │
 │  Overview · Findings · Finding detail · Integrations       │
 │  Server Components render on the server; the browser       │
 │  receives rendered output and scored results only          │
 └────────────────────────────┬───────────────────────────────┘
                              │  same origin
                              ▼
 ┌────────────────────────────────────────────────────────────┐
 │  SERVER-SIDE API ROUTES                                    │
 │  GET  /api/salesforce/status      connection probe         │
 │  POST /api/assessment/run         run the seven checks     │
 │  GET  /api/findings/[checkId]     evidence for one check   │
 │  Salesforce failures are classified into safe codes here   │
 │  and never forwarded verbatim                              │
 └────────────────────────────┬───────────────────────────────┘
                              ▼
 ┌────────────────────────────────────────────────────────────┐
 │  ASSESSMENT · SCORING · CHECK LOGIC                        │
 │  7 rendered checks + 1 negative control                    │
 │  Pure functions over records already fetched               │
 │  Mean-based scoring: check → category → overall health     │
 │  No network here at all — which is why it is unit-testable │
 └────────────────────────────┬───────────────────────────────┘
                              ▼
 ╔════════════════════════════════════════════════════════════╗
 ║  SALESFORCE INTEGRATION BOUNDARY   lib/salesforce.ts       ║
 ║  The only module that holds credentials.                   ║
 ║  Guarded by `server-only`: importing it from browser code  ║
 ║  is a build error, not a runtime risk.                     ║
 ║  SF_LOGIN_URL · SF_CLIENT_ID · SF_CLIENT_SECRET            ║
 ║  OAuth 2.0 Client Credentials Flow · SOQL query only       ║
 ╚════════════════════════════┬═══════════════════════════════╝
                              │
                              │  ✅ CONFIGURED · READ PATH VALIDATED 2026-08-24
                              │     Authentication and SOQL read. No write path.
                              ▼
   SALESFORCE DEVELOPER EDITION  (`northstariq-dev`)
   Lead · Opportunity — read. Account · Contact — counted only.
```

### Credentials are server-side, and the browser is not trusted with them

| Mechanism | What it guarantees |
|---|---|
| `server-only` import in `lib/salesforce.ts` | Importing the credential module from a Client Component **fails the build**. The guarantee is compile-time, not a convention someone must remember. |
| Environment variables are **not** `NEXT_PUBLIC_`-prefixed | Next.js inlines `NEXT_PUBLIC_*` into the client bundle. Omitting the prefix is what keeps the secret out of it. |
| Access tokens held in module memory only | Never a cookie, never storage, never a response body, never serialised into a page payload. A cold start simply re-authenticates. |
| Errors are classified, not forwarded | A Salesforce error body can restate the submitted query or credentials. The boundary replaces it with one of five codes: `NOT_CONFIGURED` · `AUTH_FAILED` · `API_ERROR` · `NETWORK_ERROR` · `UNKNOWN`. |
| SOQL is static literals | No user input is interpolated into a query anywhere. The route path segment is validated against a closed union before use. |
| No PII is queried | No Contact email, phone, or personal field appears in any query or on any screen. |

**The browser receives:** rendered pages, scored results, and capped evidence rows.
**The browser never receives:** a client id, a client secret, an access token, an instance session,
or a raw Salesforce error.

### Integration state — stated exactly

| Element | State |
|---|---|
| Salesforce integration boundary | ✅ **Implemented** — typed, guarded, read-only by construction |
| Disconnected / not-configured path | ✅ **Verified locally** — every page renders and **no results are invented** |
| Error and failure paths | ✅ **Verified locally** — classified into safe codes; the status probe cannot 500 |
| Check and scoring logic | ✅ **Verified against fixtures** — 150/150 unit tests, no network |
| Salesforce Connected App / OAuth credentials | ✅ **Configured** — the Client Credentials Flow reaches the org. Credentials live in `web/.env.local`, which is git-ignored; org-side configuration is **not inspected** in this repository. |
| Live authentication, live SOQL, live assessment | ✅ **Validated — read path only (2026-08-24)** — HTTP 200, 81 records assessed, 6 findings returned. |
| **Salesforce control behaviour judged by those findings** | ⬜ **Not validated by this application.** It reports what the org recorded; it exercises no control. |
| Deployment | ⬜ **Not deployed.** No Vercel project exists. |

**The distinction that matters.** The connected path is now *validated* - and only as far as the run
reached. **A finding is a symptom report, not a control test.** The application reads what the org
already recorded, exercises no routing, segmentation, SLA or matching control, and has no write path
at all. Salesforce control behaviour remains validated by the Increment 1-4 evidence in
[`implementation-log.md`](implementation-log.md) and by nothing this application did. The same
boundary is stated in [`testing-strategy.md`](testing-strategy.md) §2g.

### What this application deliberately is not

No database. No queue. No cache layer. No authentication system. No scheduled work. No AI. No write
path of any kind — absent, not disabled. Assessment results are not persisted, because a result that
always reflects the current org is more honest than a stored one that may not.

Four runtime dependencies: `next` · `react` · `react-dom` · `server-only`. Adding Next.js · React ·
TypeScript beyond the stack declared in `CLAUDE.md` §2 is justified against `BR-22` (a measure must
carry a stated reliability class) and `BR-23` (recorded reasons and bases are read back out without
operational write), and the justification is recorded in
[`implementation-log.md`](implementation-log.md) under the Web MVP entry.

Full application detail, including the seven checks and the scoring formula, is in
[`../web/README.md`](../web/README.md).
