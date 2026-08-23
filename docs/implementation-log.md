# Implementation Log

| | |
|---|---|
| **Purpose** | The running record of what was actually built, deployed, and validated |
| **Status** | Open — **no implementation has occurred** |

---

## What This Document Is

**This is the only place in the repository where a component becomes real.**

Everything in [`architecture.md`](architecture.md), [`data-model.md`](data-model.md), and
[`security-model.md`](security-model.md) is a candidate. A component moves from candidate to
implemented by appearing here, with evidence.

It is a log, not a governance framework. Entries are short and factual.

---

## Status Vocabulary

Used across the repository. Exactly one applies to any component at any time.

| Status | Meaning |
|---|---|
| **Candidate** | Proposed in documentation. Not built. Not committed to being built. |
| **Approved — Inc N** | Approved for build in a named increment. **Still not built.** |
| **Deployed** | Exists in the org and in source control. Behaviour not exercised. |
| **Deployed — access verified** | Deployed, and confirmed readable at runtime. Intentionally holds no value until later automation. |
| **Implemented** | Exists in the org and in source control |
| **Validated** | Implemented **and** proven by an executed test with recorded results |
| **Deferred** | Valid but out of this release |
| **Removed** | No longer part of the design, with a reason |

### Three states of reality

| State | Question it answers |
|---|---|
| **Current State** | How the fictional environment works today — [`business-case.md`](business-case.md) |
| **Target State** | What the architecture intends — [`architecture.md`](architecture.md) |
| **Implemented State** | What actually exists right now — **this document** |

**Never conflate them.** A capability described in Target State is not a claim about Implemented
State, and this log is the only authority on the third.

---

## Entry Format

```
### YYYY-MM-DD — <capability>

Requirement:   BR-##
Metadata:      what was created or modified
Deployment:    result, including failures
Validation:    what was executed
Test result:   actual outcome, including failures
Commit:        <hash>
Deferred:      anything found and postponed, with a reason
```

**Rules.** Record what happened, not what was intended. A failed deployment is an entry. A test that
did not run is not an entry. **Never record a result that was not executed** — a fabricated result
invalidates every other claim in this repository.

---

## Git Conventions

| Element | Convention |
|---|---|
| Branch | `main` for documentation; `feature/<capability>` for implementation increments |
| Commit format | `<type>: <summary>` — `feat` · `fix` · `docs` · `chore` · `test` |
| Commit scope | One capability per commit; metadata and its documentation update together |
| Approval | **Commit and push each require explicit human approval** |

**Documentation synchronizes with metadata in the same commit.** A field created without its
`data-model.md` row updated is an incomplete change, not a fast one.

---

## Approval Gates

| Action | Requires |
|---|---|
| Create or modify local files | Normal working authority |
| `git add` / stage | Normal working authority |
| `git commit` | **Explicit approval** |
| `git push` | **Explicit approval** |
| Create GitHub repository / change visibility | **Explicit approval** |
| `sf org login` | **Explicit approval** |
| `sf project deploy` | **Explicit approval** |
| Any org data load | **Explicit approval** |
| Any security or sharing change in the org | **Explicit approval** |

---

## Log

### 2026-08-22 — Repository foundation and discovery

```
Requirement:   —
Metadata:      None. Salesforce DX scaffold only.
Deployment:    N/A — no org
Validation:    Test-RepositoryStructure.ps1 — 36 passed, 0 warnings, 0 failed
Test result:   Structure, security scan, and scope boundaries clean
Commit:        684da8c
Deferred:      —
```

### 2026-08-22 — Phase 0C requirements and governance (preservation commit)

```
Requirement:   —
Metadata:      None
Deployment:    N/A — no org
Validation:    Test-RepositoryStructure.ps1 — 36 passed, 0 warnings, 0 failed
               No secrets · no auth artifacts · no dataset · no business metadata
               in force-app · no Data Cloud or Agentforce implementation
Test result:   All checks passed
Commit:        e0be142
Deferred:      —
Note:          Committed to preserve the full 10,898-line Phase 0 documentation
               in history before consolidation. Detailed originals of every
               consolidated document are recoverable from this commit.
```

### 2026-08-22 — Documentation consolidation

```
Requirement:   —
Metadata:      None
Deployment:    N/A — no org
Validation:    Pending — see the consolidation validation report
Test result:   —
Commit:        this commit — `refactor: simplify NorthstarIQ for implementation`
               (a commit cannot record its own hash; `git log` resolves it)
Deferred:      —
Note:          29 documents (10,898 lines) consolidated into 9 (~3,300 lines).
               62 business requirements consolidated into 23.
               22 open decisions resolved into 12 Portfolio Decisions,
               5 remaining open, 2 dropped with removed scope.
               Phase-gate and documentation-governance apparatus removed.
```

### 2026-08-22 — Salesforce Developer Edition authenticated · read-only org inventory

```
Requirement:   —
Metadata:      None created. READ-ONLY inspection.
Deployment:    None
Validation:    Org confirmed Developer Edition, not a sandbox, API 67.0
Test result:   —
Commit:        Not committed — inventory produced no repository change
Deferred:      —
```

**Findings that changed the design:**

| Finding | Consequence |
|---|---|
| Standard Duplicate + Matching Rules present (Lead, Contact, Account) | `ASM-11` confirmed — custom duplicate logic eliminated |
| State/Country picklists **enabled** (235 / 384, restricted) | Most of `BR-01` country normalization is standard |
| Enterprise Territory Management **unavailable** | `ASM-10` confirmed — config-driven territory required |
| Field history available (`OpportunityHistory` already populated) | `ASM-12` confirmed — no custom history object |
| `Account.Type` carries Prospect/Customer values | Replaces `Customer_Status__c` |
| **Flow has no business-hours element; `BusinessHours.add()` is Apex-only** | ❌ **`ASM-13` falsified** — one Apex seam approved |
| **Salesforce licences: 4 total, 2 used, 2 free** | ⚠️ `ASM-09` partially false — licences, not storage, are the binding limit |
| 0 Apex · 0 workflow rules · 0 validation rules · 0 queues · 0 CMDTs | Clean slate; no competing automation |
| OWD fully permissive (`ReadWrite` / `ReadWriteTransfer`) | All four OWD changes are real |
| Business Hours set 00:00–00:00; 0 Holidays | Both must be configured before SLA means anything |
| 19 stock demo custom fields; 86 sample records | Left untouched; gated cleanup step before dataset load |
| `BusinessHours` / `Holiday` are **API data, not Metadata API types** | Configured by script, not source deploy |
| `<sharingModel>` and `<enableHistory>` present in object metadata | OWD and history tracking **are** source-deployable |

### 2026-08-22 — Increment 1: Salesforce Foundation

```
Requirement:   BR-05 BR-06 BR-07 BR-08 BR-09 BR-18 BR-21 (structure only, no behaviour)
Metadata:      46 components deployed. See breakdown below.
Deployment:    SUCCEEDED - deploy id 0Afaj00000haFfiCAE, checkOnly=false,
               46/46 components, 0 errors, completed 2026-08-22T18:11:47Z
Validation:    Dry-run 0Afaj00000hZArmCAG - 46/46, 0 errors, before deploying
               Repository validator - 46 passed, 0 warnings, 0 failed
Test result:   Component verification against the org - all present, below
Commit:        this commit - `feat: establish Salesforce revenue operations foundation`
Deferred:      Routing_Rule__mdt records, SLA fields, identity/routing fields,
               Business Hours, Holidays, validation rules, queues, Apex, Flows
```

**Deployed and verified in the org:**

| Component | Count | Verification |
|---|---:|---|
| Custom fields — Lead | 6 | Tooling `CustomField` query: all 6 present |
| Custom fields — Account | 3 | Tooling `CustomField` query: all 3 present |
| Custom fields — User | 3 | Tooling `CustomField` query: all 3 present |
| CMDT field definitions | 13 | 7 `Segment_Band__mdt` · 6 `Routing_Rule__mdt` |
| Standard fields (history) | 2 | `Lead.Status`, `Lead.OwnerId` — `trackHistory=true` confirmed by retrieve |
| Global value sets | 2 | `NIQ_Segment` = SMB · Mid-Market · Enterprise · Strategic<br>`NIQ_Territory` = NA-West · NA-East · UK-IE · DACH |
| Standard value sets | 3 | `AccountType` = 8 values — **all 7 originals preserved, `Churned` added** |
| Custom Metadata Types | 2 | `Segment_Band__mdt`, `Routing_Rule__mdt` |
| Custom Metadata records | 4 | SOQL confirms exactly SMB/Mid_Market/Enterprise/Strategic, `Rule_Version__c=v1.0` |
| Permission sets | 3 | 21 FLS entries — Seller 9 read-only, RevOps 12 (formulas read-only), Rule_Configuration holds both CMDT types |
| Object OWD | 5 | Lead/Account/Opportunity/Case **Private**; Contact **ControlledByParent** (confirmed by retrieve) |

`Routing_Rule__mdt` record count verified as **0**, as approved.

**Three defects found and fixed before deployment — all caught by dry-run:**

| Defect | Fix |
|---|---|
| `.forceignore` rule `**/*__*.object-meta.xml` (intended for managed packages) also matched `Segment_Band__mdt.object-meta.xml`, silently excluding both CMDTs | Rule removed; it was too broad for its stated purpose |
| `.forceignore` excluded `**/standardValueSets/**`, blocking the approved `AccountType` change | Narrowed with explicit negations for the three governed value sets |
| CMDT record files used the `xsd:` prefix without declaring that namespace → package-level `UNKNOWN_EXCEPTION` | Added `xmlns:xsd`; Salesforce's own CMDT files declare both |
| `Data_Quality_Detail__c` formula used `&amp;` inside `CDATA`, where it stays literal | Replaced with a raw `&` |

**Deviation from the approved manifest — one, forced by the platform:**

> **`Case` OWD changed to Private.** Not in the approved manifest. Salesforce forbids a child of
> Account from carrying a more permissive sharing model than Account, so setting Account to Private
> (`BR-18`, `PD-10`) made the deployment fail with *"ReadWriteTransfer is not a valid sharing model
> for Case when Account sharing model is Private."* Case is outside NorthstarIQ scope and holds only
> 26 stock sample records; Private is the most restrictive valid option and matches the
> least-privilege posture. **The approved Account change was impossible without it.**

**Verification gap — stated, not hidden:**

> Fields deployed through the Metadata API receive **no profile FLS**, so they are invisible even to
> System Administrator, and SOQL reports an invisible field as *"No such column."* Existence and
> configuration were therefore verified through the Tooling API and metadata retrieve, which read
> schema directly.
>
> **The formula fields' runtime output has not been observed.** Their syntax and field references
> were validated by Salesforce at deploy time — the `Data_Quality_Detail__c` compile failure proves
> formulas are checked then — but no record has been read through them.
>
> Closing this needs `NIQ_Revenue_Operations` assigned to a user. That is a permission-set
> **assignment**, which the approved manifest did not include, so it was not performed.

### 2026-08-22 — Increment 1 runtime validation

```
Requirement:   BR-05 BR-06 BR-16 BR-18 BR-21 (foundation verification)
Metadata:      None created or modified. One PermissionSetAssignment created.
Deployment:    None
Validation:    Runtime verification against the org, results below
Test result:   All executed checks passed. Two formula branches untestable - stated.
Commit:        this commit - `test: validate Salesforce foundation runtime`
Deferred:      Formula branches for blank Country (no sample data exercises them)
```

**Permission set assignment.** `NIQ_Revenue_Operations` assigned to the authenticated
administrator only, authorised specifically to make deployed fields readable for verification.
`NIQ_Revenue_Seller` and `NIQ_Rule_Configuration` were **not** assigned — no validation required
them. Exactly one `PermissionSetAssignment` exists.

This closes the gap recorded in the previous entry: fields deployed through the Metadata API carry
no profile FLS, and SOQL reports an invisible field as *"No such column."*

**Field access — all 12 now queryable by normal SOQL.**

| Object | Fields | Result |
|---|---|---|
| Lead | 6 | Queryable. Stored fields **expected blank** — no automation exists. |
| Account | 3 | Queryable. `Strategic_Account__c` = false (checkbox default). |
| User | 3 | Queryable. `Routing_Eligible__c` = false (checkbox default). |

**Formula runtime results — VALIDATED where sample data allows.**

| Case | Inputs | Expected | Actual | Verdict |
|---|---|---|---|---|
| A | Country set · Employees set | `Complete` / `None` | `Complete` / `None` | ✅ |
| B | Country set · Employees blank | `Incomplete` / `Missing: EmployeeCount` | `Incomplete` / `Missing: EmployeeCount` | ✅ |
| C | Country blank · Employees set | `Incomplete` / `Missing: Country` | — | ⬜ **untested** |
| D | Country blank · Employees blank | `Incomplete` / `Missing: Country EmployeeCount` | — | ⬜ **untested** |

> **Cases C and D remain untested.** All 22 stock sample Leads have a populated `CountryCode`, so
> the blank-country branch is not reachable from existing data. No record was created to close this
> — the branch will be exercised by the deterministic dataset, which includes missing-country
> fixtures by design (`testing-strategy.md` scenario 9).

**Lead field history — VALIDATED.** One existing sample Lead (local label `LEAD-A`; org record id
deliberately not recorded here).

| Step | Result |
|---|---|
| Baseline | `LeadHistory` = 0 rows org-wide |
| Status changed | Row captured: `Working - Contacted` → `Open - Not Contacted` |
| Owner changed | Row captured, both display names and user ids |
| Both restored | Status and OwnerId confirmed **identical to original** |
| Audit trail | 6 rows retained — history correctly survives the restore |

`PD-09` is now evidenced rather than assumed: transitions are captured at the moment they occur.

**Custom Metadata — VALIDATED.** All four `Segment_Band__mdt` records compared field-by-field
against the source-controlled files: **all match**. Bands 0–100 / 100–1000 / 1000+ / designation-only,
`Rule_Version__c = v1.0`, `Is_Active__c = true`. `ARR_Override_Min__c` and `SLA_Response_Hours__c`
are null by design — both await decisions owned by later increments.
`Routing_Rule__mdt` = **0 records**, as approved.

**Global value sets — VALIDATED.** Verified on all five consuming fields; every one is
`restricted = true`, so the governed taxonomy is enforced at the field level.

| Value set | Values |
|---|---|
| `NIQ_Segment` | SMB · Mid-Market · Enterprise · Strategic |
| `NIQ_Territory` | NA-West · NA-East · UK-IE · DACH — **no `Central` value exists** |

**OWD — VALIDATED** by metadata retrieve (authoritative; `EntityDefinition` misreports
`ControlledByParent` as `Private`).

| Object | Sharing model |
|---|---|
| Lead · Account · Opportunity | `Private` |
| Contact | `ControlledByParent` |
| **Case** | `Private` — **org-required consequence of Account = Private.** Salesforce forbids a child of Account from being more permissive. **No Case functionality is built or planned.** |

### 2026-08-22 — Increment 2: Lead data quality and segmentation

```
Requirement:   BR-01 (normalization) BR-05 (segmentation + basis) BR-21 (configuration-driven)
Metadata:      1 Flow created: Lead_Inbound_Before_Save. No new fields.
Deployment:    SUCCEEDED - deploy 0Afaj00000haMsTCAU, 1/1, 0 errors. Flow ACTIVE.
Validation:    Dry-run passed 1/1 first attempt. Repository validator 47 passed, 0 failed.
Test result:   8 of 8 runtime scenarios PASSED. Bulk insert 8/8. Bulk update 8/8.
               Entry-condition test PASSED both directions.
Commit:        this commit - `feat: implement lead data quality and segmentation`
Deferred:      Territory, identity/matching, routing, exceptions, SLA - later increments
```

**Implemented.** One before-save record-triggered Flow on Lead, entered only when `Website`,
`Email`, or `NumberOfEmployees` changes (or on create). It assigns fields on the triggering record,
performs **no DML**, and reads only Custom Metadata.

| Behaviour | Detail |
|---|---|
| Domain normalization | `Website` preferred, `Email` domain as fallback. Four chained formulas strip scheme, `www.`, and path/query. Provenance fields untouched; no second domain field created. |
| Segmentation | Loops active `Segment_Band__mdt` rows. **Zero thresholds in the Flow.** Inclusive lower, exclusive upper bound; null upper = unbounded. |
| Explainability | `Segment_Basis__c` = `Employee Count: 742 -> Mid-Market | Rule v1.0` |
| Unsegmentable | Employee count missing → `Segment__c` cleared, basis states why. **Never defaulted to SMB.** |
| Data quality | Left entirely to the Increment 1 formula fields. **Deliberately not duplicated in Flow.** |

**Runtime matrix — 8/8 passed, first execution.** Boundaries 0 · 99 · 100 · 101 · 999 · 1000 ·
1001 · null all behaved exactly as the configuration specifies. Full matrix in
[`testing-strategy.md`](testing-strategy.md) §2b.

**The Increment 1 data-quality gap is closed.** Two fixtures were given a blank country, reaching
formula branches C and D that stock data could not. **All four branches are now VALIDATED.**

**Bulk safety.** Insert batch of 8 → 8/8 correct. Update batch of 8 → 8/8 recalculated. Proves the
Flow does not depend on single-record execution. Modest batch by design; production scale is not
claimed.

**Regression — Increment 1 intact.** Formulas still compute on the 22 untouched stock Leads · 4
CMDT records unchanged, `Routing_Rule__mdt` still 0 · Lead history still capturing (14 rows) ·
global value sets unchanged and still restricted · OWD unchanged on all 5 objects · the single
permission-set assignment unchanged.

**Strategic — a real design boundary, not an omission.**

> A Lead cannot become Strategic in this increment. The designation lives on
> `Account.Strategic_Account__c` and reaches a Lead only through `Matched_Account__c`, which is
> Increment 3 scope. The Strategic band's null `Employee_Min__c` makes it correctly non-matching for
> size-based derivation — the configuration itself says Strategic is not a size band.
> **No Lead-level Strategic field was invented to force it.**

**Known gaps carried forward:**

| Gap | Status |
|---|---|
| Manual `Segment__c` override is silently overwritten on the next input change | `architecture.md` §5 requires overrides to be *recorded* and preserved. **Not implemented; no override field exists.** Needs a decision. |
| Strategic segmentation for Leads | Increment 3, with matching |
| Territory (`BR-06`) | Increment 3 — `Territory__c` deployed but unpopulated |
| NorthstarIQ fields absent from every Lead page layout | ✅ **Resolved** — temporary functional-validation section added to `Lead-Lead Layout`. Scaffolding only; see the layout entry above. |

**Deviations from the approved manifest: none.** No new fields, no Apex, no changes to Increment 1
components. One validator assertion was updated because the increment boundary moved: it now
permits the single approved Flow and still forbids Apex, triggers, and UI components.

**Defects caught before deployment: none in the Flow** — the dry-run passed on the first attempt.
One tooling defect surfaced during fixture load: Bulk API rejected LF line endings and required
CRLF.

### 2026-08-22 — Increment 2: Lead layout functional scaffolding

```
Requirement:   Human functional validation of BR-01 / BR-05 in the Salesforce UI
Metadata:      1 Layout modified: Lead-Lead Layout (primary Lead layout)
Deployment:    SUCCEEDED - deploy 0Afaj00000hbRTVCA2, 1/1, 0 errors
Validation:    Dry-run 1/1. Layout retrieved back from the org and inspected.
Test result:   7 sections (was 6), 32 field entries (was 26). All 6 fields present
               and Readonly. The 6 pre-existing sections are unchanged.
Commit:        this commit - `chore: expose NorthstarIQ lead fields for UI validation`
Deferred:      -
```

> ### ⚠️ Lead layout configuration is temporary functional-validation scaffolding and does not represent the approved NorthstarIQ visual identity.

One section, `NorthstarIQ — Functional Validation`, added immediately after *Lead Information*,
exposing `Normalized_Domain__c`, `Data_Quality_Status__c`, `Data_Quality_Detail__c`, `Segment__c`,
`Segment_Basis__c`, and `Territory__c`.

**All six are `Readonly`.** That is a functional requirement, not a styling choice: the two formula
fields cannot be editable, and the rest are system-derived, which `BR-05` requires not be
user-writable. `Territory__c` is intentionally blank until Increment 3.

The section mirrors the two-column structure every other section on this layout already uses, so no
new visual convention was introduced.

**Deliberately not created:** custom Lightning pages · Dynamic Forms · custom components · LWC ·
icons · branding · decorative sections · any additional UX metadata.

The NorthstarIQ Salesforce experience will be designed separately in a Visual Identity Sprint. No
layout, field arrangement, grouping, spacing, or label in this section should be read as an approved
user-experience decision.

### 2026-08-22 — Increment 2: HUMAN ACCEPTANCE

```
Requirement:   BR-01 BR-05 BR-21
Metadata:      None created or modified.
Deployment:    None
Validation:    Manual UI validation performed by the practitioner in the Salesforce
               Developer Edition org. Reported as PASSED.
Test result:   Post-validation re-verification: 8 of 8 fixtures still match expected
               values. No restoration required - no fixture had drifted.
Commit:        this commit - `docs: record increment 2 human acceptance`
Deferred:      -
```

**✅ Increment 2 is HUMAN ACCEPTED.**

Automated verification alone was never the acceptance gate for this project. The practitioner
inspected the behaviour directly in the Salesforce UI and confirmed it. That confirmation, not the
CLI output, is what moves Increment 2 to accepted.

**Post-acceptance state re-verified:**

| Check | Result |
|---|---|
| Fixture derived values | 8 of 8 match expected — domain, segment, basis, and both data-quality formulas |
| Fixture inputs | All 8 at designed employee counts (0 · 99 · 100 · 101 · 999 · 1000 · 1001 · null) |
| Restoration needed | **None** — nothing drifted during UI testing |
| `Territory__c` | Blank on all 8, correctly — territory belongs to Increment 3 |
| Stock sample Leads | 22, untouched, **0 with a segment set** — the Flow correctly never ran on them |

**Accepted capabilities**

| Capability | Status |
|---|---|
| Domain normalization (`BR-01`) | ✅ **VALIDATED + ACCEPTED** |
| Data-quality formulas, all 4 branches (`BR-02`) | ✅ **VALIDATED + ACCEPTED** |
| Configuration-driven segmentation (`BR-05`, `BR-21`) | ✅ **VALIDATED + ACCEPTED** |
| Segment explainability (`BR-05`) | ✅ **VALIDATED + ACCEPTED** |
| `Lead_Inbound_Before_Save` | ✅ **VALIDATED + ACCEPTED** — bulk-safe at batch 8, entry conditions verified |

**Open items carried into later increments** — accepted as known, not as defects:

| Item | Owner |
|---|---|
| Manual `Segment__c` override is silently overwritten on the next input change | **Needs a decision.** `architecture.md` §5 requires overrides to be recorded and preserved; no override field exists. |
| Strategic segmentation for Leads | Increment 3, via `Matched_Account__c` |
| Territory derivation (`BR-06`) | Increment 3 |
| Lead layout section | Temporary functional scaffolding; superseded by the Visual Identity Sprint |
| 8 `NIQ Test —` fixtures remain in the org | Increment-2 fixtures, separate from the portfolio dataset. Removed at the gated sample-data cleanup step. |

### 2026-08-22 — Increment 3: Identity, Strategic, Territory, Routing

```
Requirement:   BR-03 BR-06 BR-07 BR-08 BR-13 BR-21
Metadata:      8 fields, 9 CMDT records, 3 queues, 1 LeadSource value.
               Flow extended. 3 permission sets and 1 layout modified. 0 Apex.
Deployment:    0Afaj00000hbkO5CAI - 68/68, 0 errors (dry-run 68/68 first)
               0Afaj00000hbmBNCAY - Flow defect fix, 1/1
Validation:    Repository validator 47 passed, 0 failed
Test result:   9 of 9 runtime scenarios PASSED after one defect was found and fixed.
               Regression: Increment 2 8/8 unchanged; Increment 1 intact.
Commit:        this commit - `feat: implement identity, territory and routing`
Deferred:      Round robin, re-routing automation, Account segment/territory derivation
```

**Automation-authority boundary.** Automated ownership routing is authorized only for Leads entering
through the governed **NorthstarIQ Inbound** intake path. Leads outside that path retain their
existing ownership. Routing-eligible Leads that cannot be resolved deterministically fail safe to
the routing exception queue.

**Platform limitation, recorded.** Before-save automation cannot distinguish default ownership from
explicit self-assignment when both resolve to the running user: `Lead.CreatedById` is
`createable = false`, so it is not populated before save, and owner state is unusable as an
authorization signal. NorthstarIQ therefore uses an explicit governed intake signal rather than
owner-state inference. `LeadSource` being unrestricted is an acknowledged Developer Edition
limitation — the Flow nonetheless requires exact equality to the governed value.

**Runtime matrix — 9 of 9 passed.** All three ownership states proven:

| State | Fixture | Result |
|---|---|---|
| Governed intake + routable | Strategic, Customer, NA-West, DACH, US-default | Automated ownership ✅ |
| Governed intake + unresolvable | Ambiguous, Unsupported Geo, Missing Geo | `NIQ_Routing_Exception` ✅ |
| **Not governed intake** | UK-IE with explicit owner | **Owner preserved**, territory still derived ✅ |

**Defect found by testing, and fixed.**

> Territory resolution depended on the order Custom Metadata rows were returned in. US/California
> resolved to **NA-East** instead of NA-West, because the country-default rule was evaluated before
> the state-specific one. Fixed by capturing specific and default matches into separate variables
> and resolving by **specificity** after the loop — correctness no longer depends on query order.
> Every happy path had passed; only the boundary fixture exposed it.

**`BR-07` AC4 refined, deliberately.** The original wording required precedence itself to be
configuration. The four tiers consume structurally different signals, so uniform rule rows would
need an interpreter — abstraction without administrative benefit. Precedence is explicit in Flow;
territory-to-coverage mapping stays configuration-driven. **Recorded as a refinement, not an unmet
requirement.**

**Segment authority enforced by construction.** `Segment__c`, `Segment_Basis__c`, `Territory__c`,
and `Normalized_Domain__c` had edit access removed from `NIQ_Revenue_Operations`. Since
Metadata-API-deployed fields carry no profile FLS, **no principal can now edit them** — no override
field, no validation rule. This also closes the Increment 2 gap where a manual segment edit was
silently overwritten. `Account.Strategic_Account__c` remains editable: it is the RevOps input.

**Territory decoupled from coverage.** Four territories resolve to two queues
(`NA-West`/`NA-East` → `NIQ_North_America`, `UK-IE`/`DACH` → `NIQ_EMEA`), demonstrating that the
territory taxonomy does not dictate queue architecture. A fifth territory is one Custom Metadata
record, not a new queue.

**Not built:** `Match_Basis__c` (redundant with one matching signal) · Lead Strategic flag · segment
override field · third CMDT · rule interpreter · second Flow · seller users · round robin · fuzzy
matching · enrichment · Apex.

### 2026-08-22 — Increment 3 UI validation defect: investigated, NOT a metadata defect

```
Requirement:   Human UI validation of BR-03 / BR-07 / BR-08 / BR-13
Metadata:      NONE CHANGED. Investigation concluded no correction was warranted.
Deployment:    None
Validation:    Six-way root-cause investigation, below
Test result:   Layout, FLS, assignment and UI-API service all verified correct
Commit:        this commit - `docs: record increment 3 UI validation root cause`
Deferred:      -
```

**Reported:** the four Increment 3 fields — Match Status, Matched Account, Exception Type,
Routing Reason — were not visible on the `NIQ R3 - Ambiguous Match` Lead, although the
`NorthstarIQ - Functional Validation` section rendered with its six Increment 2 fields.

**Investigation — every candidate cause tested against evidence, before changing anything:**

| # | Candidate cause | Evidence | Verdict |
|---|---|---|---|
| A | Repository metadata missing the fields | Repo layout holds 36 field entries incl. all four | ❌ ruled out |
| B | Deployment mismatch | Layout retrieved from org: 36 entries, **field sets identical to repo** | ❌ ruled out |
| C | Field-level security | `FieldPermissions`: read = true on all four in both permission sets; admin can SOQL the values | ❌ ruled out |
| D | Layout assignment | Admin profile retrieved **with** the layouts so assignments populate: `Lead-Lead Layout`, default record type | ❌ ruled out |
| F | Other configuration | **No Lead FlexiPage exists** — no Lightning Record Page, no Dynamic Forms overriding the layout | ❌ ruled out |
| **E** | **Lightning rendering / client cache** | **UI API `record-ui` — the service Lightning itself renders from — returns the section with all 10 fields, including all four, for this user on this record** | ✅ **ROOT CAUSE** |

> **The decisive test.** `/ui-api/record-ui/{id}?layoutTypes=Full&modes=View` is what the Lightning
> client calls to build the page. It served all ten fields. The platform is delivering the correct
> layout; the browser session was rendering a cached copy from before the Increment 3 deploy — which
> is exactly consistent with seeing precisely the six Increment 2 fields and none of the four new
> ones.

**No correction was made.** The conditional authorization to add the four fields was contingent on
them having been omitted. They were not. Adding them would have created duplicate layout entries and
corrupted a layout that is already correct. **A green deployment report was not treated as proof —
the org was re-read, and so was the UI service on top of it.**

**Regression re-confirmed:** 9 Increment 3 fixtures · 8 Increment 2 fixtures · 4 segment bands ·
9 routing rules · 3 queues — all intact.

**Resolution for the reviewer:** open the record in a private window to confirm, then hard-refresh
the normal session. Increment 3 remains **NOT human-accepted** pending that re-check.

### 2026-08-22 — Seller enablement + BR-08 AC5 defect fix

```
Requirement:   BR-08 AC5 (explainability survives edits) - BR-18/BR-20 (seller access)
Metadata:      NIQ_Revenue_Seller (+2 object perms, +LightningExperienceUser),
               Security.settings (Login As), Flow authority gate restructured.
               1 user, 1 permission-set assignment, 1 queue membership. 0 Apex.
Deployment:    0Afaj00000hboUwCAI (4/4) and 0Afaj00000hc8DVCAY (4/4), 0 errors
Validation:    Repository validator 47 passed, 0 failed
Test result:   Seller tests A-G pass. BR-08 regression tests 1-6 pass.
               Increment 1-2 regression intact.
Commit:        this commit - `fix: complete seller access and preserve routing explainability`
Deferred:      Account record visibility for the Seller - deliberately not remediated
```

**Defect 1 — Seller opened in Salesforce Classic.** Root cause: `Minimum Access - Salesforce` has
`PermissionsLightningExperienceUser = false`; `NIQ_Revenue_Seller` did not grant it either. Standard
User and System Administrator both do, which is why only the admin saw Lightning. Fixed
**permission-set-first**: added `LightningExperienceUser` to `NIQ_Revenue_Seller`. The profile was not
changed, no custom profile created, and object/FLS access is unchanged.

**Defect 2 — BR-08 AC5 violated.** `fxRoutingEligible = ISNEW() AND LeadSource = "NorthstarIQ Inbound"`
meant every *update* failed the test and fell into the non-routing branch, overwriting a correctly
routed Lead's `Routing_Reason__c` with the ownership-preserved message and stamping
`Exception_Type__c = Non-Routing Intake`. Ownership stayed correct, so this destroyed explainability
rather than routing.

**Fix — a CREATE / UPDATE seam, not another condition.** The authority gate is now three-way:

| Path | Behaviour |
|---|---|
| Create + governed intake | Route, write reason and exception |
| Create + other source | Preserve owner, stamp `Non-Routing Intake` |
| **Update — any Lead** | **The flow ends at the gate.** No ownership, no classification, reason and exception untouched. |

The update path has **no connector at all** — preservation by structure rather than by a guard that a
later change could bypass.

**Coherence.** Routing is creation-time, so every routed reason is now prefixed **`At intake:`**. A
Lead created in California and later moved to New York shows `Territory__c = NA-East` beside
`At intake: ... NA-West ...`. Both are true and the prefix stops them reading as a contradiction.
**No rerouting capability was invented.**

**Damaged fixture restored by replay, not by editing.** All 9 Increment 3 fixtures were deleted and
re-inserted through the corrected creation path, so their state was produced by the automation rather
than typed over it. `NIQ R3 - No Match NA-West` verified fully restored.

**Account visibility deferred.** The Seller has Account object Read but 0 of 13 record access under
Private OWD, so `Matched_Account__c` may render blank. **No sharing rule, role, View All, OWD change,
or Account team was added.** `Routing_Reason__c` remains the seller-facing explainability mechanism.

**Not yet human-accepted.** Runtime Seller validation in the UI is still outstanding.

### 2026-08-22 — Acceptance defect: Seller record page could not render

```
Requirement:   BR-18 / BR-20 (representative Seller must be able to use the record page)
Metadata:      1 Profile layout assignment. Nothing else.
Deployment:    0Afaj00000hcA9lCAE - 2/2, 0 errors (dry-run 2/2 first)
Validation:    Profile RETRIEVED BACK from the org, not read from source
Test result:   Assignment present; Seller access and Increment 1-3 regression unchanged
Commit:        this commit - `fix: assign Lead page layout to the minimal Seller profile`
Deferred:      Account layout assignment on this profile - not needed, see below
```

**Distinct acceptance defect — backend correct, presentation broken.** Object CRUD, field-level
security, queue membership, routing automation and Lightning Experience access were all valid and
verified. The record page still failed with:

> *"One or more profiles have no page layout assigned for the 'Lead' Object."*

**Root cause.** Page-layout assignment is **profile-scoped**; a permission set cannot assign a layout.
`Minimum Access - Salesforce` ships with no Lead assignment because it normally has no Lead access.
Granting that access through `NIQ_Revenue_Seller` left the presentation layer unassigned.

| Profile | Layout assignments | Lead | Account |
|---|---:|---|---|
| `Admin` | 151 | `Lead-Lead Layout` | `Account-Account Layout` |
| `Minimum Access - Salesforce` **(before)** | 81 | **NONE** | **NONE** |
| `Minimum Access - Salesforce` **(after)** | **82** | **`Lead-Lead Layout`** | NONE *(unchanged)* |

**Fix — the smallest possible.** The existing `Lead-Lead Layout` was assigned to the profile. **No new
layout, no custom profile, no switch to Standard User, no CRUD/FLS/sharing broadened.** The profile
file in source declares **one element** — the layout assignment — and no permissions; profile deploys
are partial, so nothing else changed. Verified: the profile still grants **0** Lead/Account object
permissions, leaving `NIQ_Revenue_Seller` the sole grantor, and the Seller can still edit **0** custom
Lead fields.

The temporary `NorthstarIQ - Functional Validation` section is preserved intact — 7 sections, 36
fields, 10 in that section. It remains validation scaffolding, not the NorthstarIQ visual identity.

**Account deliberately not remediated.** The same gap exists for Account on this profile, but the
Seller has 0 record access to Accounts under Private OWD and never opens an Account detail page, so it
cannot arise in the approved Increment 3 experience.

**The lesson worth keeping:** the permission-set-first model grants *capability*, not *presentation*.
A minimal profile plus permission sets is not complete until the profile also carries a layout
assignment for every object the permission set opens up.

**Increment 3 remains NOT human-accepted** pending the Seller UI retest.

### 2026-08-22 — Acceptance defect: Seller could not see standard Lead inputs

```
Requirement:   BR-18 / BR-20 (Seller must maintain legitimate business inputs)
Metadata:      NIQ_Revenue_Seller - 3 fieldPermissions added. Nothing else.
Deployment:    0Afaj00000hcFLRCA2 - 3/3, 0 errors (after two rejected dry-runs)
Validation:    Effective Seller FLS re-computed; derived fields re-verified
Test result:   7 approved logical fields now read+edit; 10 derived fields still edit=false
Commit:        this commit - `fix: grant seller field access to standard lead inputs`
Deferred:      PII (Email, Phone, MobilePhone) deliberately ungranted
```

**Second presentation-layer defect, at a different layer from the last one.** The previous defect was
a missing profile *layout assignment*; this one is missing *field-level security*.

**Root cause.** `Website`, `NumberOfEmployees` and the compound `Address` were already on the layout
and marked editable. `NIQ_Revenue_Seller` granted FLS on the ten **derived** fields and **none of the
inputs**, and `Minimum Access - Salesforce` grants no FLS on standard Lead fields. The Seller had
**10 FLS rows on Lead, all custom, zero standard.** The Admin never hit it — the System Administrator
profile carries 22 FLS rows on Lead by default, including `Website` and `NumberOfEmployees`.

`Company`, `LastName` and `Status` were unaffected: `permissionable = false` means FLS cannot restrict
them, so **Company was already editable**.

**Two platform constraints found by dry-run, before any deployment:**

| Attempt | Rejection |
|---|---|
| 7 individual fields, appended after `objectPermissions` | *"Element fieldPermissions is duplicated at this location"* — the schema requires one contiguous block |
| `Lead.StateCode`, `Lead.CountryCode` | *"Invalid field permission field name"* — with State/Country picklists enabled these are not FLS-permissionable |
| `Lead.Street`, `City`, `State`, `Country`, `PostalCode` | Same — all are components of the **compound `Lead.Address`** |

**Correction — three rows, not seven.** `Website`, `NumberOfEmployees`, and `Address`. The compound
grant delivers Street, City, State, PostalCode, Country **and** the State/Country picklists in one
row. This is the platform-native form and is *narrower* metadata than proposed while delivering
exactly the approved access.

**Boundaries verified after deployment:** all 10 derived fields still `edit = false` · Lead CRUD
unchanged (R+E, no Create/Delete) · Account unchanged (R only) · 1 queue membership · **0 PII grants**
· OWD Private on Lead and Account · profile untouched · layout untouched. `UserRecordAccess` still
**3 of 42** Leads.

**Increment 3 remains NOT human-accepted** pending the Seller UI retest.

---

## Implementation Status

**Increments 1–2 are human-accepted. Increment 3 is deployed and runtime-validated, awaiting UI
acceptance.** SLA does not exist yet and is not claimed.

| Area | Status |
|---|---|
| Salesforce org | ✅ Authenticated `northstariq-dev` · inspected read-only · **unmodified** |
| Custom fields — 2 formulas | ✅ **VALIDATED — all 4 branches** (gap closed in Increment 2) |
| Flow `Lead_Inbound_Before_Save` | ✅ **VALIDATED** — 8/8 scenarios, bulk-safe at batch 8, entry conditions verified |
| `Normalized_Domain__c` · `Segment__c` · `Segment_Basis__c` | ✅ **VALIDATED** — populated and explained by the Flow |
| `Territory__c` · `Match_Status__c` · `Matched_Account__c` · `Routing_Reason__c` · `Exception_Type__c` | ✅ **VALIDATED (Inc 3)** |
| `Account.Normalized_Domain__c` | ✅ **VALIDATED (Inc 3)** — reproduces Lead normalization on all 13 stock Accounts |
| Queues — 3 | ✅ **VALIDATED** — coverage pools and fail-safe exception destination |
| Routing config — 9 `Routing_Rule__mdt` records | ✅ **VALIDATED** — 4 territories → 2 coverage queues |
| Custom fields — SLA (2 remaining) | ✅ **DEPLOYED — ACCESS VERIFIED** — blank until Increment 4 |
| Custom Metadata records | ✅ **VALIDATED** — 4 records match source field-by-field |
| Custom Metadata Types | ✅ **DEPLOYED** — 2 types, 13 fields; `Routing_Rule__mdt` holds 0 records by design |
| Global value sets | ✅ **VALIDATED** — enforced `restricted=true` on all 5 consuming fields |
| Standard value sets | ✅ **VALIDATED** — `AccountType` = 8 values, 7 originals intact + `Churned` |
| Lead field history | ✅ **VALIDATED** — `Status` and `OwnerId` capture verified and reverted |
| OWD | ✅ **VALIDATED** — 5 objects confirmed by metadata retrieve |
| Permission sets | ✅ **`NIQ_Revenue_Seller` VALIDATED** — assigned to a real non-admin principal; effective FLS read-only on all 10 derived fields; `UserRecordAccess` 3/42. `NIQ_Rule_Configuration` still unassigned. |
| Representative Seller | ✅ **DEPLOYED** — 1 user, Minimum Access + `NIQ_Revenue_Seller`, no role, 1 queue. Awaiting human UI acceptance. |
| Business Hours + Holidays | 🟡 **Moved to the SLA increment** — nothing in Foundation consumes them |
| Flows | 🟡 3 candidates — **0 implemented** |
| Apex | 🟢 **1 approved** (business-hours seam + test class) — 0 implemented |
| Queues | 🟡 2 candidates — **0 implemented** |
| Reports · dashboards | 🟡 7 · 1 candidates — **0 implemented** |
| Dataset | ⬜ Not generated, not loaded |
| Tests | ⬜ **No test has been executed. No results exist.** |
| Power BI | ⬜ Not started |

### Developer Edition constraint — recorded

**The fictional enterprise contains more personas than Developer Edition can instantiate.** Four
Salesforce licences exist, two are consumed by administrators, leaving **two** for representative
seller testing. Platform licences (6 free) cannot access Lead or Opportunity.

Existing users are **not** deactivated to manufacture personas. `BR-20` access testing is therefore
demonstrated across two seller users, and the gap between the designed access model and the
physically testable one is stated rather than hidden.

---

## Next Step

**Increment 3 awaits human UI acceptance**, pending a cache-cleared re-check. The metadata is
verified correct in the org and at the UI-API layer. Increment 4 (SLA) is **not started**.
