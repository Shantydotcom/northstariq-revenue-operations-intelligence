# Architecture

| | |
|---|---|
| **Purpose** | How the requirements are intended to be met in Salesforce |
| **Status** | 🟢 Org inspected 2026-08-22 · **Increment 1 approved** · automation still CANDIDATE |
| **Related** | [`requirements.md`](requirements.md) · [`data-model.md`](data-model.md) · [`security-model.md`](security-model.md) |

---

## ⚠️ Status of This Document

**The org was inspected on 2026-08-22.** Findings are recorded in
[`implementation-log.md`](implementation-log.md).

What changed as a result: standard Duplicate and Matching Rules replace custom duplicate logic ·
State/Country picklists are enabled, removing most country normalization · Enterprise Territory
Management is unavailable, so the configuration-driven model is required rather than merely
preferred · standard field history replaces custom history fields · `Account.Type` replaces
`Customer_Status__c` · the scheduled SLA sweep is removed in favour of a formula.

**Increment 1 (Foundation) is approved.** Automation below remains CANDIDATE until its own
increment. **Nothing here is implemented.**

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
                         INBOUND RECORD
                               │
        ┌──────────────────────▼──────────────────────┐
        │  BEFORE SAVE  (no DML, no queries)          │
        │  • normalize domain, country, source        │  BR-01
        │  • assess routing-critical completeness     │  BR-02
        │  • derive segment      ◄── configuration    │  BR-05
        │  • derive territory    ◄── configuration    │  BR-06
        └──────────────────────┬──────────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │  AFTER SAVE                                 │
        │  • match to existing Account ──► basis      │  BR-03
        │  • apply ownership precedence               │  BR-07
        │       strategic ▸ owner ▸ territory ▸ RR    │  PD-03
        │  • evaluate seller eligibility              │  BR-08
        │  • record reason + rule version             │  BR-08  ◄── the thesis
        │  • compute SLA target on business hours     │  BR-10
        └───────┬─────────────────────────────┬───────┘
                │ resolved                    │ unresolved
                ▼                             ▼
          ASSIGNED TO SELLER            EXCEPTION QUEUE      BR-13
                │                       classified by type
                │                             │
                ▼                             │
        FIRST TOUCH CAPTURE  BR-11            │
        activity or stage change              │
                │                             │
                ▼                             │
        SLA BREACH SWEEP     BR-12            │
        scheduled, business hours             │
                │                             │
                └──────────────┬──────────────┘
                               ▼
                    REPORTS ──▶ DASHBOARD ──▶ POWER BI
                          BR-22, BR-23
```

**The horizontal line through the whole design is explainability.** Every box that makes a decision
also records why it decided that way. That is not instrumentation added afterwards — it is the
reason the decision points exist as data at all.

---

## 3. Automation Design

**Cohesion over proliferation.** Four candidate Flows, not seven. A Flow per business capability
produces a maintenance surface no single administrator can hold in their head, and `PROB-018` says
that administrator is already the constraint.

| # | Candidate Flow | Type | Serves | Notes |
|---|---|---|---|---|
| 1 | `Lead_Inbound_Before_Save` | Record-triggered, before save | `BR-01`, `BR-05` | ✅ **DEPLOYED + VALIDATED (Increment 2).** Normalizes domain and derives segment from `Segment_Band__mdt`. No DML. Reads Custom Metadata only. Data quality stays in formula fields and is **not** duplicated here. Territory (`BR-06`) deferred to Increment 3. |
| 2 | `Lead_Inbound_After_Save` | Record-triggered, after save | `BR-03`, `BR-07`, `BR-08`, `BR-10`, `BR-13` | Match, precedence, eligibility, reason capture, SLA target, exception routing |
| 3 | `Lead_First_Touch_Capture` | Record-triggered | `BR-11` | **May fold into #2 after org inspection** if the defining events can be captured there |
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

**`Territory_Map__mdt` is not created.** `CountryCode` and `StateCode` are enabled as restricted
standard picklists, so the country/state → territory mapping fits inside `Routing_Rule__mdt`. Two
types, as intended.

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
| Limited user licenses | 8–10 users, enough to demonstrate access and rotation — not 64 |
| No sandbox | Changes are made in the org and captured to source control; no promotion path |
| Standard object and field limits | Reinforces the tight field budget |
| Storage limits | Dataset stays ~190 records |
| Enterprise Territory Management availability | **Assumed unavailable** — validate at org inspection. The configuration-driven model is chosen partly for this reason. |
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
