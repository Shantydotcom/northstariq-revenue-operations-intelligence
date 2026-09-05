# Implementation Log

| | |
|---|---|
| **Purpose** | The running record of what was actually built, deployed, and validated |
| **Status** | Open — Salesforce Increments 1-4 human-accepted · **lifecycle governance implemented and validated; the `F-7` preventive remediation deployed as `Lead_Inbound_Before_Save` v13 and runtime-validated (2026-09-01)** · Web MVP implemented · **connected read path exercised against the org 2026-08-24; no control behaviour validated by it, and the application is not deployed** |

---

## What This Document Is

**This is the only place in the repository where a component becomes real.**

Everything in [`architecture.md`](architecture.md), [`data-model.md`](data-model.md), and
[`security-model.md`](security-model.md) **begins** as a candidate. A component moves from candidate
to implemented by appearing here, with evidence. Those documents now hold a mix of implemented,
superseded and still-candidate material — **this log, not their section headings, is the authority
on which is which.**

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

### 2026-08-23 - Increment 3: HUMAN ACCEPTANCE (validated as the Seller persona)

```
Requirement:   BR-03 BR-06 BR-07 BR-08 BR-13 BR-18 BR-20 BR-21
Metadata:      None changed. Closeout verification only.
Deployment:    None
Validation:    Manual UI acceptance performed by the practitioner while logged in as
               NIQ Seller - a non-administrative persona - not as System Administrator.
Test result:   All acceptance criteria met. Full Increment 1-3 regression passed.
Commit:        this commit - `test: record Increment 3 human acceptance`
Deferred:      Seller Account visibility; final NorthstarIQ visual design
```

**Increment 3 is HUMAN ACCEPTED.**

**Validated as the Seller persona, not as an administrator.** That distinction is the point: the
System Administrator holds `Modify All Data`, which bypasses field-level security, so admin testing
could never have proven the field-authority model. Acceptance was performed as `NIQ Seller`, a user
on `Minimum Access - Salesforce` with no role, whose only capability comes from `NIQ_Revenue_Seller`.

**Human-validated evidence:**

| # | Evidence | Result |
|---|---|---|
| 1 | Seller lands in Lightning Experience | PASS |
| 2 | Lead Details page renders successfully | PASS |
| 3 | Seller sees exactly the three accessible Leads | PASS |
| 4 | `Website` and `Number of Employees` visible and editable | PASS |
| 5 | Standard Address renders coherently; approved components editable | PASS |
| 6 | `Company` remains editable | PASS |
| 7 | NorthstarIQ derived fields **visible but non-editable** | PASS |
| 8 | Employees 40 to 1500 recalculated Segment **SMB to Enterprise** | PASS |
| 9 | Seller could **not** directly edit Segment | PASS |
| 10 | State California to New York recalculated Territory **NA-West to NA-East** | PASS |
| 11 | Seller could **not** directly edit Territory | PASS |
| 12 | Owner remained `NIQ North America Coverage` through both updates | PASS |
| 13 | Routing Reason preserved the original NA-West intake decision after the geography change - **BR-08 AC5 satisfied** | PASS |
| 14 | Fixture restored to 40 / California, returned to SMB / NA-West | PASS |

> **Items 8 to 11 together are the whole security argument:** a user who cannot write a field
> nonetheless causes it to change, because authorized automation retains the authority the user
> lacks.

**Fixture provenance - proven, not asserted.** `NIQ R3 - No Match NA-West` shows
`LastModifiedBy = NIQ Seller`, yet the Seller holds `edit = false` on `Segment__c`, `Territory__c`,
`Segment_Basis__c`, `Routing_Reason__c` and `Exception_Type__c`. Those values therefore **could not
have been typed in** - they were written by `Lead_Inbound_Before_Save` in system context. The
security model itself is the evidence. The values are also consistent with configuration: 40
employees falls inside the SMB band, and `CA` appears in the `US_West` state list mapping to NA-West.

---

### Increment 3 findings discovered through testing

Recorded as **implementation and testing findings**, not production incidents. Each was found before
acceptance, by deliberate testing rather than by chance.

| # | Finding | Resolution |
|---|---|---|
| 1 | **Territory resolution depended on Custom Metadata record-return order.** US/California resolved to NA-East instead of NA-West, because the country-default rule was evaluated before the state-specific one. | Capture specific and default matches into separate variables and resolve by **specificity** after the loop. Correctness no longer depends on query order. |
| 2 | **Governed-intake Routing Reason was overwritten on any later update.** `ISNEW()` is false on update, so correctly routed Leads fell into the non-routing branch and lost their explanation, violating BR-08 AC5. | A **CREATE/UPDATE seam**: the update path ends at the authority gate with **no connector at all**, so preservation is structural. Reasons are prefixed `At intake:` to mark them historical. |
| 3 | **System Administrator testing was insufficient to prove Seller field authority.** `Modify All Data` bypasses FLS, so the admin could edit derived fields regardless of configuration. | Created one representative Seller on a minimal profile. Field authority is now proven by a principal that FLS actually constrains. |
| 4 | **Seller opened in Salesforce Classic.** `Minimum Access - Salesforce` has `PermissionsLightningExperienceUser = false` and the permission set did not grant it. | Added `LightningExperienceUser` to `NIQ_Revenue_Seller` - permission-set-first, profile untouched. |
| 5 | **`Minimum Access - Salesforce` had no Lead page-layout assignment** after Lead capability was granted through the permission set, so Lightning could not render the record page. | Assigned the existing `Lead-Lead Layout` to the profile. **Page-layout assignment is profile-scoped - a permission set cannot do it.** |
| 6 | **Seller business inputs were on the layout but invisible**, because standard-field FLS had never been granted; the permission set covered only the derived fields. | Granted read and edit on the inputs. The Admin never saw this: the System Administrator profile carries standard-field FLS by default. |
| 7 | **Salesforce requires compound `Lead.Address` FLS**, rejecting separate `StateCode`, `CountryCode`, `Street`, `City` and `PostalCode` rows. | One `Lead.Address` grant delivers all components including the State and Country picklists - narrower metadata than proposed, delivering identical access. |

**The pattern worth keeping:** findings 3 to 7 are the same lesson in different clothing - *a
capability model is not proven until it is exercised by the principal it constrains*. Backend access,
automation and FLS were each correct while the representative user still could not use the record.

### 2026-08-23 — Increment 4: Lead SLA & Operational Control

```
Requirement:   BR-10 BR-11 BR-12 BR-13 BR-21 BR-22
Metadata:      4 Lead fields, 4 CMDT values, 1 Flow modified, 2 permission sets,
               1 layout, 2 reports. 0 new Flows. 0 Apex.
Deployment:    0Afaj00000hcWpLCAU (74/74) and 0Afaj00000hcsJZCAY (2/2), 0 errors
Validation:    Repository validator 47 passed, 0 failed
Test result:   15 of 15 tests pass, including 8 negative/guardrail tests
Commit:        pending human authorisation
Deferred:      Task/Event first touch; scheduled breach notification
```

**Implemented.** SLA target at intake · Status-based first touch · derived SLA state · exclusion
handling · 2 reports · Seller visibility · audit/provenance.

**Mutation surface: three write-once fields and one formula.** The sequence is
source → validation → comparison → policy → minimum mutation → audit, applied literally: Stage A
sits on the create path only, so no update can reach it; Stage B is guarded by a blank check.

**SLA hours = 4 for all four segments.** `ASM-08` is the authoritative value. **Per-segment
differentiation is documented nowhere and was not invented.**

**Guardrails proven, not asserted:**

| Guardrail | Evidence |
|---|---|
| Write-once target | Employees changed SMB→Enterprise; target and basis byte-identical |
| Write-once first touch | Two further Status changes; timestamp unmoved |
| Null protection | No path writes a null over a value |
| Change detection | Only `ISCHANGED(Status)` was added to entry criteria |
| **Owner protection** | Runtime **and source**: the three `OwnerId` assignments are all Increment 3 routing; **no SLA element writes `OwnerId` or `Status`** |
| Config-change safety | Configuration edited mid-test; existing Leads never retargeted |
| Missing config | Blank target, `Unmeasurable`, basis names the gap — **never an invented deadline** |
| Bulk | 9 mixed records, zero unintended mutations |

**Approximation — stated, not hidden.** The target uses a **weekend-aware declarative calculation**,
isolated in five formulas. It is **not** Salesforce Business Hours and does **not** honour Holidays.
Two limits: no holiday awareness (the production gap), and it shifts **days but not time-of-day**, so
a Saturday 23:20 arrival lands Tuesday 03:20. Business Hours and Holiday records were deliberately
**not** configured, because doing so would imply a fidelity the calculation does not have.

**Deferred, and not pretended otherwise:** `PD-06` allows activity-based first touch; **only the
Status path is implemented**. Scheduled breach notification was not built — the formula and reports
carry the operational signal.

**Increment 4 was subsequently HUMAN ACCEPTED** - see the acceptance entry above.

### 2026-08-23 - Increment 4: HUMAN ACCEPTANCE (NIQ Seller persona)

```
Requirement:   BR-10 BR-11 BR-12 BR-13 BR-21 BR-22
Metadata:      None changed. Closure verification only.
Deployment:    None
Validation:    Manual UI acceptance performed as NIQ Seller, a non-administrative
               persona - not as System Administrator.
Test result:   PASS on all six required acceptance steps.
Commit:        this commit - `test: record Increment 4 human acceptance`
Deferred:      Task/Event first touch; scheduled breach notification
```

**Increment 4 is HUMAN ACCEPTED.** The Salesforce foundation is now **portfolio-MVP complete**.

| Acceptance step | Result |
|---|---|
| SLA fields visible to the Seller | PASS |
| SLA fields **not** Seller-editable | PASS |
| Status to `Working - Contacted` stamped First Touch | PASS |
| SLA Status changed `Pending` to `Met` | PASS |
| Subsequent Status change did **not** move First Touch | PASS |
| Owner remained `NIQ North America Coverage` | PASS |

> **The security argument, demonstrated end to end:** a user who cannot write `First_Touch_DateTime__c`
> caused it to be written, because authorized automation retains the authority the user lacks. The
> same principle closed Increment 3; here it is proven on a field the Seller can see changing in
> front of them.

**Closure verification:** `SLA_Response_Hours__c` = **4/4/4/4** · no temporary permissions
(`NIQ_Revenue_Seller` carries `LightningExperienceUser` only; *Set Audit Fields* was never granted) ·
no temporary configuration · 9 Increment 3 and 8 Increment 2 fixtures intact · **0 Apex** · validator
47 passed, 0 failed.

**One acceptance fixture was added:** `NIQ S4 - Seller Acceptance`. The only Seller-visible untouched
SLA Lead carried the temporary `-100h` test value in its basis, which would have read as a defect. A
single data fixture - no metadata - gave the acceptance test honest `SMB 4h` configuration and a real
`Pending` to `Met` transition.

---

### Salesforce foundation - MVP COMPLETE

Increments 1-4 are deployed, runtime-validated and human-accepted. **Salesforce expansion stops
here.** The following remain **roadmap items**, deliberately not built under the 4-day portfolio MVP
constraint:

| Roadmap item | Why deferred |
|---|---|
| Task/Event first-touch capture (`PD-06` second path) | Needs DML on a second object; Status path proves the capability |
| Scheduled breach notification | The `SLA_Status__c` formula and two reports carry the operational signal |
| Holiday-aware SLA calculation | Requires Apex `BusinessHours`; the weekend-aware approximation is documented as such |
| Seller Account record visibility | Account OWD Private; `Routing_Reason__c` is the seller-facing explainability mechanism |
| Final NorthstarIQ visual identity | The functional-validation layout section remains temporary scaffolding |
| Additional fields, Flows, reports, queues, routing, Apex | Not required by any accepted requirement |

**Next phase: the external NorthstarIQ application integration** - read, assess, findings, evidence.
No further Salesforce configuration increment is planned.

---

### 2026-08-23 — Web MVP: NorthstarIQ assessment application (`web/`)

```
Requirement:   BR-02 BR-08 BR-11 BR-13 BR-22 BR-23 - reads back the decisions,
               reasons and bases the org already records, without writing
Component:     Next.js 15 App Router application under web/ — 4 pages, 3 API routes,
               6 checks, deterministic scoring. 0 Salesforce metadata changed.
Deployment:    None. No Vercel project exists. Not deployed.
Validation:    TypeScript clean · production build clean ·
               repository validator 51 passed / 0 failed / 0 warnings
Test result:   20 of 20 unit tests pass — fixtures only, no network, no org
Commit:        this commit - `feat(web): add NorthstarIQ assessment MVP`
Deferred:      Live Salesforce connection — the Connected App does not exist yet
```

> **Not validated against a live org.** Everything below was verified locally against fixtures and
> against the disconnected Salesforce path. **No Salesforce Connected App or OAuth credential has
> been configured, so this application has never made a request to the Developer Edition org.** Its
> behaviour with real org data is **unproven** and is not claimed.

**What exists.**

| Surface | Path | What it does |
|---|---|---|
| Overview / Assessment | `/` | Connection state, then run an assessment: overall health, category scores, finding counts |
| Findings list | `/findings` | Failing checks only, sorted by severity then records affected |
| Finding detail | `/findings/[checkId]` | One check: question, impact, recommendation, population, and the evidence records behind the number |
| Integrations | `/integrations` | Connection detail, the objects read, and the access each read needs |
| Status API | `GET /api/salesforce/status` | Connection probe. Cannot throw, so it cannot 500 |
| Assessment API | `POST /api/assessment/run` | Runs the six checks and returns the scored result |
| Finding detail API | `GET /api/findings/[checkId]` | Evidence for one check; an unknown id is 404, not an empty result |

**Six rendered checks**, all pure functions over already-fetched records:

| # | Check | Category | Population it judges |
|---|---|---|---|
| 1 | Leads missing routing firmographics | Data Quality | Governed-intake Leads |
| 2 | Leads in the routing exception queue | Routing | All Leads |
| 3 | Leads at risk of or in SLA breach | SLA Performance | Leads carrying an SLA target |
| 4 | Leads with an ambiguous account match | Identity & Matching | All Leads |
| 5 | Governed Leads without a territory | Routing | Governed-intake Leads |
| 6 | Open Opportunities with a past close date | Pipeline Hygiene | Open Opportunities |

**A seventh check runs and is never displayed** — governed Leads without a segment. It is a
**negative control**: it is expected to return zero, and it is retained as evidence that the engine
reports what it finds rather than manufacturing work. It is not surfaced in the UI even if it were
to fail; that would make it a seventh finding.

**Scoring is mean-based and traceable end to end.** No weights, no adjustment, no inference.

```
checkScore    = evaluated === 0 ? 100 : round(100 x (1 - failing / evaluated))
categoryScore = round(mean(check scores in that category))
overallHealth = round(mean(category scores))
```

Mean and not minimum: one weak check should not erase a category that is otherwise healthy. A check
that evaluated nothing scores 100 — **absence of data is not evidence of failure**.

**SLA population rule — `BR-11` and `M-07`, applied in the application.**

- SLA is evaluated **only** for Leads carrying `SLA_Target_DateTime__c`.
- A Lead with no target was never given a commitment, so it is **excluded from the denominator**
  rather than counted as a failure.
- **Unmeasurable is not Breached.** `M-07` exists to prevent exactly that overstatement, and the
  application honours it rather than restating org data against a more flattering denominator.

**The disconnected state is a first-class path, not an error screen.** With no credentials
configured, every page renders, states plainly that the connection is not configured, names the
variables that are missing, and **shows no results at all**. This is the path that was actually
exercised locally, and it is why nothing invented appears when the org is absent.

**Credentials are server-side only.** `lib/salesforce.ts` imports `server-only`, so importing it
from browser code fails the build instead of shipping a secret. The environment variables are
deliberately **not** `NEXT_PUBLIC_`-prefixed, which would inline them into the client bundle. Access
tokens live in module memory for the life of a server instance and never reach a cookie, storage or
a response body. A Salesforce error body can restate the query or the submitted credentials, so the
boundary replaces it with one of five safe codes rather than forwarding it.

**Read-only by construction.** The only Salesforce operation the application can perform is a SOQL
query, and every query is a static string literal — no user input is interpolated anywhere. There is
no create, update or delete path: absent, not disabled.

**Dependencies and security posture — stated, not implied.**

| Change | Detail |
|---|---|
| Next.js **15.5.4 → 15.5.23** | Security patch upgrade, taken before commit rather than after |
| `server-only` added | The build-time guard that makes the credential boundary enforceable rather than a convention |
| Runtime dependencies | `next`, `react`, `react-dom`, `server-only` — four, deliberately |
| **Residual advisories** | `npm audit` reports **3 high** advisories in transitive image-optimization packages (`sharp`, `postcss`) reachable only through `next`. The only offered fix is `next@16`, a breaking major. **Not taken, and not hidden.** The application renders no images. |

**Repository validator updated, not weakened.** Three changes: the `web/` directories and
`web/package.json`, `web/.env.example`, `web/README.md` were added to the required set · a new check
asserts that **no `.env` file exists anywhere in the repository**, not only at the root · and
generated paths (`.git`, `node_modules`, `.next`, `.vercel`, `__pycache__`) are excluded from the
recursive scans. Those paths are git-ignored and are not the repository being validated; scanning
them reported on dependency code and made the run take minutes rather than seconds. The exclusion
**narrows what is scanned, never what is asserted** — and the new `.env` check is strictly stronger
than what preceded it.

**Technology addition, justified as `CLAUDE.md` §2 requires.** Next.js · React · TypeScript sit
outside the declared stack. The justification is `BR-22` and `BR-23`: `BR-22` requires each measure
to carry a **stated reliability class**, and `BR-23` requires the recorded reasons and bases to be
**read back out without operational write**. This application does both literally — every score
displays the population it judged, and the only Salesforce operation available to it is a SOQL
query. Salesforce reports can show a seller their own records, but they cannot present a Revenue
Operations reader an assessment of the process as a whole with its measurability stated alongside
it. More Salesforce reports was the alternative, and it was rejected because the Salesforce
foundation is MVP COMPLETE and further org configuration was explicitly closed. The addition is
bounded: four runtime dependencies, no database, no queue, no authentication system, no scheduled
work, targeting the Vercel Hobby free plan.

**What has not happened, stated explicitly:**

| Not done | Consequence |
|---|---|
| Salesforce Connected App / OAuth credentials | **This application has never connected to the org.** The connected path is implemented and typed, and it is **unexercised**. |
| Live assessment run | No check has ever judged a real Salesforce record. All 20 test results are fixture results. |
| Vercel deployment | No project, no environment variables, no URL |

---

### 2026-08-24 — Web: first live org run · assessment UI rework · design-system passes

```
Requirement:   BR-22 BR-23 - reliability class stated per measure, recorded
               reasons read back without write. The accessibility and design
               work traces to the WCAG 2.2 AA commitment in PRODUCT.md, NOT to
               a numbered BR. That gap is recorded, not papered over.
Component:     web/ - assessment UI rework (lib/presentation.ts; FindingRow
               replaces FindingCard; assessment areas and a scoring disclosure
               on the Overview) and design-system passes over app/globals.css.
               0 Salesforce metadata changed. 0 scoring logic changed.
Deployment:    None. No Vercel project exists. Not deployed.
Validation:    First live read against the Developer Edition org · 20/20 unit
               tests · tsc --noEmit clean · repository validator 51 passed /
               0 warnings / 0 failed · design detector 0 findings on markup,
               CSS and type scope · in-browser measurement at 1366x599 on
               /, /findings and /integrations
Test result:   Live assessment returned HTTP 200 at 2026-08-24T06:32:09Z -
               81 records assessed, overall health 68, 6 findings, 3 high.
               Areas: Data Quality 94 · Routing 90 · Identity & Matching 96 ·
               SLA Performance 60 · Pipeline Hygiene 0.
Commit:        this commit - `feat(web): rework assessment experience and design system`
Deferred:      Vercel deployment · viewports below 720px · real-keyboard
               traversal · screen-reader pass · synthetic dataset
```

> **The connected read path is now exercised. Nothing about Salesforce control behaviour is.**
> The application authenticated to the org and read live `Lead` and `Opportunity` records. That
> validates the **read path and nothing beyond it**. A finding of "4 Leads in the routing exception
> queue" is a **report of org state**, not evidence that routing, segmentation, SLA or matching
> behaved correctly. No control was exercised by this run, no remediation occurred, and the
> application still has no write path at all.

**What the live run proves, precisely.**

| Now exercised | Evidence |
|---|---|
| OAuth 2.0 Client Credentials authentication against the Developer Edition org | `getStatus()` returned connected; the Overview rendered `Salesforce connected · Developer Edition` |
| SOQL read of `Lead` and `Opportunity` | `objectsAssessed: ["Lead","Opportunity"]`, 81 records assessed |
| Six checks executing over live records | Six findings returned with live populations — 4/50, 2/5, 1/17, 13/13, 2/50, 2/17 |
| Scoring computed from live records | `overallHealth` 68 = mean(94, 90, 96, 60, 0), reproduced by hand from the returned payload |

**What the live run does NOT prove.** Stated because a successful read is the easiest result in this
repository to overstate.

| Still unproven | Why |
|---|---|
| Routing · segmentation · SLA · matching **behaviour** | The application reads what the org already recorded. It exercises no control and asserts no control outcome. **A finding is a symptom report, not a control test.** |
| Remediation of any finding | No write path exists. Nothing in the org was changed, and nothing was fixed. |
| That the judged population is the designed dataset | The documented ~190-record synthetic dataset **has still not been generated**. This run judged whatever records the org already held from Increments 1-4. |
| Salesforce error handling at the boundary | The failure path was exercised by intercepting the browser `fetch`, **not** by forcing a real Salesforce error. The five safe error codes remain unproven against the org. |
| Bulk or scale behaviour | 81 records. No scale claim is made. |
| Vercel deployment | No project, no environment variables, no URL. |

**Assessment UI rework — `Implemented`.**

| Change | Detail |
|---|---|
| `lib/presentation.ts` (new) | Operator-facing labels, blurbs, populations and verification strings held separately from check ids |
| `components/FindingRow.tsx` (new) · `FindingCard.tsx` (removed) | The findings queue is rows separated by a rule, not cards |
| Overview | Assessment areas with per-area population sub-lines, and a scoring disclosure carrying a worked example computed from the run in view |
| `EvidenceTable` · `ConnectionPill` · `lib/salesforce.ts` · `lib/score.ts` · `lib/types.ts` | Modified in support of the above |

**Design-system passes over `app/globals.css` — `Implemented`, measured where measurable.**

| Change | Measured outcome |
|---|---|
| Type roles | 19 ad-hoc font sizes → 10 role tokens; 6 weights → 3; expressed in `rem` so reader font-size settings scale the interface. 9 sizes and 3 weights render on the Overview. |
| `--ink-faint` `#8b93a1` → `#67707f` | 2.89:1 → **4.66:1** on `--bg`. Cleared 12 failing text nodes. |
| Focus indicators | 0 of 10 focusables had an author-defined indicator; now **10 of 10**. |
| `aria-live` status region | One `role="status"` region, rendered in every phase so it outlives its content. Announces the completed result. WCAG 2.2 4.1.3. |
| Result preserved across a failed re-run | The last completed assessment is no longer discarded when a re-run fails. |
| Zero-score meter | A score of 0 draws no fill; the boundary measures **4.66:1** against a **3:1** requirement (WCAG 2.2 1.4.11). The prior treatment measured 1.49:1 and did not meet it. |
| Severity | One treatment across Overview and Findings; the second chassis was removed. |
| Dead CSS | 7 orphaned selectors and a duplicated media rule removed; 0 unused class selectors remain. |
| CSS comments | 7 comments corrected where they asserted an unverified outcome or a false count — including one claiming the zero meter was legible when it measured 1.49:1. |

**Accessibility conformance — scope of the claim.** WCAG 2.2 AA is asserted **only** for what was
measured: text contrast on `/`, `/findings` and `/integrations` (0 failures across 101 text nodes),
focus visibility on all 10 focusables, heading order, and the zero-meter graphical boundary. **Not**
claimed: a full WCAG audit, a screen-reader pass, or keyboard traversal by real key input —
synthetic `Tab` could not be delivered through the automation channel, so focus was confirmed from
the CSSOM and from `focus({focusVisible:true})` instead, and both channels agreed.

**Viewport coverage — stated.** All measurement was taken at **1366x599**, the physical maximum of
the machine used. Viewports below 720px were **reasoned from the media queries, not rendered and
measured.** No claim is made about narrow-screen behaviour.

**Repository hygiene.** `.gitignore` now excludes `.impeccable/` at any depth. It held regenerable
critique snapshots and `web/.impeccable/live/server.json`, which carries a local live-server PID and
session token; the existing `*token*` rule matches file **names**, not contents, so it never caught
that file. Verified with `git check-ignore -v`; neither directory was ever tracked.

---

### Reconciled 2026-08-26 — Salesforce: SLA exception semantics · routing-readiness governance

```
Requirement:   BR-02, BR-11, BR-12, BR-13, BR-21
Metadata:      MODIFIED  Lead.SLA_Status__c (formula + description)
               NEW       Routing_Readiness_Source__mdt (2 fields)
               NEW       Routing_Readiness_Source.{NorthstarIQ_Inbound, Web,
                         Phone_Inquiry} - 3 records, all Is_Active__c = true
               NEW       NIQ_Integration_Read permission set
Deployment:    Confirmed present in northstariq-dev by read-only query on
               2026-08-26 (below). The deployment EVENT was not logged when it
               happened; only its present effect is evidenced.
Validation:    Read-only SOQL against northstariq-dev, 2026-08-26
Test result:   See "What the org returns today", below - 7 of 7 Leads behave
               as the corrected formula predicts and as the superseded one
               would not.
Commit:        NOT COMMITTED - present in the working tree only
Dating:        RECONCILED FROM REPOSITORY AND CURRENT-ORG EVIDENCE ON
               2026-08-26. The original implementation date, sequence and
               deployment command are NOT independently established and are
               deliberately not asserted.
```

> **This is a reconciliation entry, not a contemporaneous one.** It was written on 2026-08-26 from
> the working-tree diff and from read-only queries executed that day. It records **what the
> repository and the org can be shown to contain now.** It does not claim to record what happened on
> the day the work was done, because that evidence was not captured.

**The SLA correction, shown by the diff.** `Lead.SLA_Status__c` decided its `Excluded` state from
the wrong field:

```
- IF( NOT(ISBLANK(TEXT(Exception_Type__c))), "Excluded", "Unmeasurable" )
+ IF( CONTAINS(Routing_Reason__c, "NIQ_Routing_Exception"), "Excluded", "Unmeasurable" )
```

`Exception_Type__c` is a **condition classification**, and its own field description — unchanged,
predating this correction — already said so: *"Non-Routing Intake means ownership was intentionally
preserved - it does NOT mean the Lead was placed in the routing exception queue."* Treating every
non-blank value as an SLA exclusion therefore excluded Leads whose ownership was merely preserved,
alongside the Leads that genuinely reached the exception queue. The corrected formula reads the
routing **outcome** instead.

**What the org returns today.** Read-only query, 2026-08-26 — all 7 Leads carrying an
`Exception_Type__c` with no SLA target:

| `Routing_Reason__c` contains `NIQ_Routing_Exception` | `Exception_Type__c` | `SLA_Status__c` | Count |
|---|---|---|---:|
| yes | Ambiguous Match · Missing Geography · Unsupported Geography | `Excluded` | 4 |
| **no** | **Non-Routing Intake** | **`Unmeasurable`** | **3** |

**The three `Unmeasurable` rows are the evidence.** Under the superseded formula every one of the
seven would have read `Excluded`. That they do not is what shows the corrected formula is the one
deployed. This is a negative assertion, which `security-model.md` `SP-5` and
[`testing-strategy.md`](testing-strategy.md) §7 both treat as the primary form of access and
behaviour evidence.

**Routing-readiness governance — what the artifact says it is.** `Routing_Readiness_Source__mdt`
carries two fields, `Lead_Source__c` and `Is_Active__c`, and its object description states the scope
directly: *"A membership list, not a rules engine, and deliberately NOT ownership-routing authority:
that stays in `Lead_Inbound_Before_Save` (`fxRoutingEligible`). Editable without deployment."*

Three active records exist — `NorthstarIQ Inbound`, `Web`, `Phone Inquiry` — confirmed by read-only
query on 2026-08-26. **What it replaced is evidenced in the application, not here** — see the web
reconciliation entry below, where the superseded hard-coded list is visible in the diff.

**Least-privilege consequence.** Consuming this type at runtime required exactly one grant:
`NIQ_Integration_Read` carries a single `customMetadataTypeAccesses` entry, for
`Routing_Readiness_Source__mdt` and nothing else. The scoping is provable in both directions — see
[`security-model.md`](security-model.md) §4b.

**Not established by this entry:** when the metadata was authored or deployed · which `sf` command
performed it · whether a deployment failed first · any test executed at the time. **No org-side test
result is claimed** beyond the read-only observation recorded above and dated to the day it ran.

---

### Reconciled 2026-08-26 — Web: assessment population and explainability correction

```
Requirement:   BR-22, BR-23
Metadata:      NONE. Application only.
Component:     web/lib/checks/index.ts - web/lib/types.ts -
               web/lib/presentation.ts - web/lib/assessment.ts -
               web/lib/soql.ts - web/test/checks.test.ts
Deployment:    None.
Validation:    The test suite in the working tree, executed 2026-08-26
Test result:   50/50 pass. ~25 of those tests exist specifically to pin the
               populations and the reconciliation identities described below.
Commit:        NOT COMMITTED - present in the working tree only
Dating:        RECONCILED FROM THE WORKING-TREE DIFF ON 2026-08-26. Original
               implementation date not independently established.
```

**Four control populations changed. The diff against the last commit shows each one.**

| Control | Committed at `088ba9c` | Working tree |
|---|---|---|
| Missing Routing Data | `leads.filter(isGoverned)` — one hard-coded Lead Source | `leads.filter(isReadinessSource)` — the active list read from `Routing_Readiness_Source__mdt` each run |
| Routing Exceptions | **`evaluated = leads.length`** — every Lead in the org was the denominator | `leads.filter(isGoverned)` — only Leads submitted to ownership routing |
| Ambiguous Account Match | **`evaluated = leads.length`** | `leads.filter((l) => l.Match_Status__c !== null)` — only Leads carrying a recorded match decision |
| Missing Territory | `leads.filter(isGoverned)` | `leads.filter(wasProcessedAtIntake)` — the Leads the coverage model actually ran against |

**Why the two `leads.length` rows mattered most.** A control whose denominator is the whole org
scores itself against records it never judged. Both were reporting a rate over a population that
included Leads the relevant automation had never touched.

**The records-not-evaluated model is new, not a rename.** `git show HEAD:web/lib/types.ts` contains
**zero** occurrences of `notEvaluated`, `unmeasurable`, `orgPopulation`, `NotEvaluatedRecord` or
`BreakdownLine`. The committed contract had no way to express a record a control declined; it also
carried a `recommendation` field per check that no longer exists. The working tree replaces advice
with accounting: `orgPopulation = evaluated + notEvaluatedCount` holds for every control, each
excluded record carries a reason built from its **own** Salesforce values, and `unmeasurable`
separates *"this control applies but nothing recorded a result"* from *"this control does not apply"*.

**Tests that pin it,** by name, in `web/test/checks.test.ts`: *routing readiness sources come from
Salesforce configuration, not a built-in list* · *account-matching status no longer decides
routing-readiness eligibility* · *routing exceptions evaluates only Leads submitted to ownership
routing* · *a Lead the matching process never assessed is not counted as a pass* · *missing routing
data reconciles: total = evaluated + excluded, evaluated = passing + failing* · *every check accounts
for its whole starting population* · *a not-evaluated reason names that record's own Lead Source and
Owner*.

**Not established by this entry:** the order in which the four populations were corrected · whether
they were one increment or several · what the scores were before and after at the time · any
in-browser verification performed on the day. The tests prove the definitions; they do not date them.

---

### Reconciled 2026-08-26 — Web: evidence exports · record tables · Salesforce Setup deep links

```
Requirement:   BR-23 - recorded reasons and bases are read back out without
               operational write.
Metadata:      NONE. Application only.
Component:     NEW  web/lib/export.ts - web/lib/export-model.ts -
                    web/lib/setup-links.ts - web/lib/traceability.ts -
                    web/components/RecordTable.tsx -
                    web/components/ExportLinks.tsx -
                    web/app/api/export/{findings, evidence/[checkId],
                    not-evaluated/[checkId]}/route.ts
               MOD  web/components/EvidenceTable.tsx - web/lib/soql.ts
Deployment:    None.
Validation:    Source inspection and the working-tree test suite, 2026-08-26
Commit:        NOT COMMITTED - present in the working tree only
Dating:        RECONCILED FROM REPOSITORY EVIDENCE ON 2026-08-26. Original
               implementation date not independently established.
```

**Exports — CSV and XLSX, with no dependency added.** `web/package.json` is **byte-identical to the
last commit**: the same four runtime dependencies (`next`, `react`, `react-dom`, `server-only`).
`lib/export.ts` writes both formats on the Node standard library — an `.xlsx` is assembled as a ZIP
of five XML parts using `node:zlib`, and the CSV carries a UTF-8 BOM so Excel reads the non-ASCII
characters the application uses in field values. Three `GET` routes serve them; each validates its
check id against the `CheckId` union before use, so an unknown id is a 404 rather than an empty file.

**Displayed rows and exported rows are deliberately different populations,** and the source says so
at the boundary where it matters. `RecordTable.tsx` holds the visible slice; its own comment records
that exports *"go to the server against the full dataset, so a collapsed or filtered view never"*
limits the file. A reader sees 5 rows; the export carries the full set.

**Record table behaviour, from source.** `DEFAULT_ROWS = 5` · per-column filtering, where multiple
active filters **narrow together rather than compete** · filter chips outside the header popovers,
with per-filter and `Clear all` clearing · View all / Show less · Salesforce record links · the
Actions menu carrying both export formats. One component, reused by every table.

**Setup deep links — three types link, and the restraint is the point.** `lib/setup-links.ts`
resolves identifiers live rather than storing them, because a record id is org-specific and belongs
nowhere in source control. Its own header records that the URL shapes **were verified by loading
them against the connected org** rather than taken from documentation. Resolution uses
`Promise.allSettled`, not `Promise.all`, so one type being unreadable by the least-privilege
identity cannot remove the links for a type that is readable — an all-or-nothing failure caused by
permissions rather than by evidence.

**A Queue and a Custom Metadata type deliberately do not link.** The module states the reason: no
Setup URL shape could be confirmed to resolve for them, and *"an unlinked name is honest; a link
that might 404 in front of an evaluator is not."* That decision was re-tested on 2026-08-26 for
Custom Metadata during the Segment Assignment Consistency increment and upheld. **It is preserved,
not revisited.**

**Not established by this entry:** when exports, tables or deep links were built, in what order, or
against which application state · which URL shapes were tried and rejected during the original
verification · any browser session performed on the day.

---

### 2026-08-26 — Web: Segment Assignment Consistency (seventh assessment control)

```
Requirement:   BR-05, BR-21 - segmentation derives from governed configuration
               and records its basis. BR-22 - a measure carries a stated
               reliability class. BR-23 - recorded reasons and bases are read
               back out without operational write.
Metadata:      NONE. 0 Salesforce metadata created, modified or deployed.
               0 Salesforce records mutated. 0 permission changes.
Component:     web/ only. New: lib/checks/segment-basis.ts. Modified:
               lib/checks/index.ts, lib/types.ts, lib/presentation.ts,
               lib/traceability.ts, lib/export-model.ts, lib/soql.ts,
               lib/assessment.ts, app/findings/[checkId]/page.tsx,
               components/AssessmentPanel.tsx, test/checks.test.ts,
               test/fixtures.ts
Deployment:    None. No Vercel project exists. Not deployed.
Validation:    50/50 application unit tests (17 new) - tsc --noEmit clean -
               repository validator 49 passed / 0 warnings / 2 failed
               (pre-existing: local .sf and .sfdx CLI state, git-ignored) -
               git diff --check clean - one live read against
               northstariq-dev - in-browser regression across Overview,
               Findings, Finding Detail, column filtering, View all / Show
               less, CSV and XLSX export, record and configuration links,
               state persistence across navigation, browser console
Test result:   Live assessment 2026-08-26T21:37:14Z - 49 Leads read,
               27 evaluated, 22 not evaluated, 26 passing, 1 failing,
               score 96. Reconciles exactly: 49 = 27 + 22 and 27 = 26 + 1.
               The one failure is the deliberately retained fixture
               UI Test Web (00Qaj00000u50QXEAY) - employee count 500,
               recorded segmentation result Mid-Market under Rule v1.0,
               current Segment SMB.
Commit:        NOT COMMITTED - held for human review
Deferred:      Runtime reconciliation of a recorded rule version against live
               Segment_Band__mdt - a Setup deep link for a Custom Metadata
               type - a re-runnable SOQL artifact under scripts/soql/
```

> **This entry followed an unlogged gap.** The three **reconciliation entries immediately above**
> were added on 2026-08-26 to close what could be closed from repository and current-org evidence:
> the SLA exception-semantics correction and routing-readiness governance, the assessment population
> and explainability correction, and exports, record tables and Setup deep links. Each states plainly
> that its **original implementation date is not independently established**, because that evidence
> was never captured. Nothing was reconstructed from memory. **What those entries recover is the
> record of what exists, not a claim about the day it was made.**

**What the control asks.** *Does the Segment stored on a Lead still match the segmentation result
Salesforce recorded for it?* Assessment name **Segment Assignment Consistency**; the finding an
operator sees is **Segment Assignment Mismatch**, in the **Inbound Lead Data Integrity** area.

**Population and eligibility.** The starting population is every `Lead` the run reads. A Lead is
evaluated when `Segment_Basis__c` holds a segmentation result the application can interpret. It is
**not** evaluated when no basis is recorded, or when the recorded basis is not one of the forms the
Flow writes. `Match_Status__c` is deliberately **not** consulted — account matching is a separate
capability on a separate timeline and says nothing about whether segmentation ran. Every Lead is
accounted for as evaluated or not evaluated, with a per-record reason built from its own values.

**Failure and pass.**

| | |
|---|---|
| **Fails** | The Segment named by the recorded segmentation result ≠ `Segment__c` |
| **Passes** | The current Segment agrees with the recorded segmentation result — **and nothing further** |

A pass does not establish that the employee count is right, that the band is commercially
appropriate, or that territory, ownership or matching are correct.

**Scoring.** The existing methodology, unchanged: `round(100 × (1 − failing / evaluated))`. No
special model, no weighting, no separate path.

**Source Evidence — the model.** *Source Evidence* is the evaluator-facing term throughout the
application; **provenance** does not appear in any rendered surface, and a unit test asserts it
cannot. The expected Segment is read from what Salesforce recorded in `Segment_Basis__c` at the
moment segmentation ran. Four forms are supported, taken from the Flow's own formula and assignment
elements rather than inferred from data:

| Flow element | Recorded form | Expected Segment |
|---|---|---|
| `fxBasisResolved` | `Employee Count: 500 -> Mid-Market \| Rule v1.0` | the Segment named |
| `fxStrategicBasis` | `Strategic Account: <name> \| Rule v1.0` | `Strategic` |
| `fxBasisNoBand` | `Not segmentable: no active band matches employee count <n>` | none |
| `asgnNoEmployeeCount` | `Not segmentable: employee count missing` | none |

Anything else is classified uninterpretable and excluded. **Honest exclusion over false precision** —
a guessed expected Segment would either manufacture a failure or conceal one.

**Historical safety — the reason this control is safe to run at all.** NorthstarIQ compares the
**recorded segmentation result** with the **current Segment**. It does **not** re-run today's
`Segment_Band__mdt` bands over a historical Lead to decide what that Lead's Segment "should" have
been. A Lead segmented under an earlier rule version is therefore judged on the rule that actually
decided it, and a legitimate configuration change cannot be reported as record drift. A unit test
pins this: two Leads with the same employee count recorded under different rule versions that
resolved differently both pass.

**Salesforce configuration relationship.** The expected Segment on the employee-count path is
supported by Custom Metadata — `Segment_Band__mdt`, evaluator-facing **Segment Band**. The Flow's
`asgnCaptureBand` assigns `varRuleVersion` from `loopBands.Rule_Version__c`, so a version string
appearing in a recorded basis came from that Custom Metadata and from nowhere else. Configured
bands: SMB 0–100 · Mid-Market 100–1000 · Enterprise 1000+ · Strategic. `Rule_Version__c = v1.0` on
all four. Input `Lead.NumberOfEmployees`; result `Segment_Name__c → Lead.Segment__c`, with the basis
written alongside.

**The Strategic path is not Custom Metadata-driven, and is not described as though it were.**
Strategic is an **Account designation** (`Account.Strategic_Account__c`) that overrides the
size-derived Segment. The application credits it to the Account, and a unit test asserts its Source
Evidence does **not** claim Custom Metadata.

**Integration limitation — validated, not worked around.** The least-privilege integration identity
**cannot query `Segment_Band__mdt`**; the runtime query returns `INVALID_TYPE`. NorthstarIQ therefore
**cannot** reconcile a recorded rule version against the live Custom Metadata records during an
assessment run, and **no permission change was made to obtain that ability.** The application
reports the rule version **Salesforce recorded on the Lead**. It does not independently confirm that
version against the live configuration, and nothing in the UI implies that it does.

**A Custom Metadata Setup link was tested and not shipped.** The candidate URL shape was loaded
against the org in a logged-in Setup session and resolved to the Custom Metadata Types index rather
than to the Segment Band type. The name renders as plain text instead. An unlinked name is honest; a
link that 404s in front of an evaluator is not.

**Terminology reconciliation — Inbound Lead Data Integrity.** The Data Quality area previously
presented as *Inbound Lead Readiness*, scoped to "required routing data on governed inbound Leads".
With a second control inside it that judgement, that label described only half the area, so the
area's presentation name, scope and question were corrected. **No new area was created, and no
grouping or scoring architecture changed** — `Category` remains the key everywhere in scoring. One
consequential side effect: the Overview's scoring disclosure picks the first area holding more than
one control, which is now this one, and its sentence hard-coded the word "routing controls". That
word was removed.

**Existing controls protected by test, not by assertion.** A unit test pins all six pre-existing
controls as a tuple of `(id, orgPopulation, evaluated, failing, score)` over shared fixtures, and a
second test re-proves that Missing Routing Data still reads its sources from
`Routing_Readiness_Source__mdt` rather than a built-in list. `Segment_Basis__c` is read by no other
check, so the new control has no path to reach them.

**Tests — 17 added, 50 total, 50 pass.** Coverage: pass and fail; a UI-Test-Web-*shaped* record fails
without that record being hard-coded anywhere; `Match_Status__c` has no effect on eligibility;
missing evidence is excluded honestly; uninterpretable evidence is never guessed at; an older rule
version is judged on what was recorded; the Strategic path is credited to the Account; both
reconciliations hold; the six existing controls are unchanged; and no evaluator-facing string
requires the word "provenance".

**Observed run — not an acceptance target.**

| | |
|---|---:|
| Leads read | 49 |
| Evaluated | 27 |
| Not evaluated | 22 (all unmeasurable) |
| Passing | 26 |
| Failing | 1 |
| Score | **96** |

These are the numbers **this run produced against the records the org currently holds**. They are
evidence, not a threshold, and no test asserts them. The designed ~190-record dataset still does not
exist.

**Salesforce safety.** 0 metadata deployed · 0 permissions changed · 0 records mutated. Lead count 49
before and after; `UI Test Web` re-queried after implementation and unchanged
(`LastModifiedDate 2026-08-23T01:57:09Z`). The deliberately failing record was preserved, not
corrected.

---

### 2026-08-27 — Integration write boundary established without a write · configuration docs reconciled

```
Requirement:   BR-20, SP-1, SP-3, SP-5 - access verified by testing behaviour,
               and a non-human principal scoped rather than assumed.
Metadata:      NONE. 0 Salesforce metadata created, modified or deployed.
               0 permissions changed. 0 records inserted, updated or deleted.
Component:     Documentation only - docs/architecture.md, docs/data-model.md,
               docs/security-model.md, docs/implementation-log.md
Deployment:    None.
Validation:    sObject Describe (HTTP GET) against northstariq-dev as the
               integration principal, 2026-08-27T02:58:28Z and 02:59:23Z
Test result:   Lead, Opportunity, Account and Contact all report
               createable=false, updateable=false, deletable=false,
               mergeable=false, undeletable=false. Lead: 56 fields visible,
               0 createable, 0 updateable. Global describe over 413 visible
               sObjects: 102 createable, 94 updateable, 105 deletable -
               133 distinct objects writable in at least one respect.
Commit:        NOT COMMITTED - held for human review
Deferred:      A real DML rejection against an assessed object - it needs
               explicit approval and a target that cannot be mutated if the
               permission assumption is wrong. Narrowing the integration
               principal's writable surface - a profile change, its own
               approval.
```

**Why a describe was executable without approval, and a write was not.** The standing rule is that no
Salesforce mutation happens without explicit human approval, and that a rollback plan is not a
substitute for one. The requirement for any negative-access test was therefore that it be
**guaranteed non-mutating even if the assumption under test is wrong** — if the principal
unexpectedly held write access, the test still must not change anything.

`GET /services/data/v67.0/sobjects/{Object}/describe` meets that bar by construction. It is an HTTP
`GET`, carries no request body, and has no DML semantics; there is no permission configuration under
which it writes a record. It also answers the exact question: Salesforce computes `createable`,
`updateable` and `deletable` **for the calling principal**, over the composed profile-plus-permission-set
stack. **No `POST`, `PATCH` or `DELETE` was issued to any sObject endpoint.**

An intentionally malformed DML call was considered and **rejected**: Salesforce may process part of a
request before returning an error, so "it will fail anyway" is an assumption about the outcome, not a
guarantee about the mechanism. Using a real record and restoring it afterwards was rejected for the
same reason.

**What this closes.** Salesforce access is additive, and the API-only profile is not in this
repository, so the permission-set artifact alone could never establish the **effective** boundary.
The describe result does, for the objects the assessment reads: the principal cannot create, update
or delete `Lead`, `Opportunity`, `Account` or `Contact`, and not one of the 56 visible `Lead` fields
is writable.

**What it does not close, stated because a positive result is the easiest thing here to overstate.**

| Not established | Why |
|---|---|
| That an attempted write was rejected | Describe reports **computed permission**, not enforcement observed in flight. No DML was attempted. |
| That the principal cannot write anything | **Contradicted.** See below. |
| Apex, Flow invocation, Metadata or Tooling boundaries | Only sObject CRUD was probed. |
| Which grant produces the outcome | The composed answer is visible; its composition is not. The principal cannot read `PermissionSetAssignment`, and the profile is not in `force-app`. |

**A finding that runs against the design intent, recorded rather than smoothed over.** The global
describe shows the integration principal **is** writable on 133 objects — including `LeadShare`,
`OpportunityShare` and `AccountShare` (create, update **and** delete), `Note`, `Attachment`,
`ContentVersion` and `User`. Sharing rows are the material item: the principal cannot edit a Lead,
but the platform reports it could write a sharing row for one, and sharing rows are how record access
widens.

**None of this is granted by `NIQ_Integration_Read`,** which carries object permissions on four
objects, 23 read-only field permissions, one Custom Metadata type and **zero `<userPermissions>`**. It
is licence and profile baseline. **No permission was changed to narrow it** — that is a profile change
on the integration identity and needs its own approval. It is open in
[`security-model.md`](security-model.md) §10.

**Configuration documentation reconciled in the same pass.** `Routing_Readiness_Source__mdt` now
appears in [`architecture.md`](architecture.md) §4 — including the fact, verified against the Flow
metadata, that `Lead_Inbound_Before_Save` holds **zero references to it**: it is read by the
assessment application, not by Salesforce automation, which is what separates it from
`Segment_Band__mdt` and `Routing_Rule__mdt`. [`data-model.md`](data-model.md) gains §2b, which states
that Custom Metadata is configuration rather than CRM data and that **no Custom Metadata Type here
has a relationship to `Lead`** — the association is made by value at read time, not by a foreign key.

**No application, test or Salesforce artifact was modified by this increment.**

---

### 2026-08-27 — Lifecycle Governance decisions closed · Opportunity Conversion Integrity proven

```
Requirement:   BR-15 (governed lifecycle taxonomy, P1) and the qualification
               half of BR-17. This entry CLOSES OD-03 and records PD-14.
Metadata:      NONE. 0 Salesforce metadata created, modified or deployed.
               0 records mutated. 0 permission changes.
Component:     web/ - lib/checks/index.ts (opportunityConversionIntegrity),
               lib/soql.ts, lib/types.ts, lib/score.ts, lib/presentation.ts,
               lib/traceability.ts, lib/export-model.ts,
               components/RunAssessment.tsx, components/Icons.tsx,
               test/checks.test.ts, test/fixtures.ts
Deployment:    None.
Validation:    63/63 unit tests (10 new) - tsc --noEmit clean - production
               `next build` clean from a cleared .next - live assessment run -
               live read-only execution of the control against 49 org Leads
Test result:   Live, 2026-08-27T17:53:30Z. 49 Leads read - 3 evaluated -
               3 failing - 46 not evaluated - score 0. Reconciles exactly.
               The three: Andy Young, Jack Rogers, Pat Stumuller, each
               Status = "Closed - Converted", IsConverted = false, and all
               four conversion fields null. Org-wide IsConverted = true: 0.
               Existing assessment unchanged - 7 controls, 5 areas,
               overall health 62.
Commit:        NOT COMMITTED - held for human review
Deferred:      Wiring the control into runAllChecks - see below. The whole
               Salesforce lifecycle foundation. MQL/SAL/SQL automation.
```

**The contradiction this proves NorthstarIQ can find.** Three Leads carry a status
Salesforce itself marks as *converted*, while `IsConverted` — the flag the platform sets during
conversion and which cannot be edited afterwards — says the conversion never happened. No Account,
Contact or Opportunity was produced. **A lifecycle label was set; nothing substantiates it.** That is
the qualification-trust problem in one record, and it was already sitting in the org before this
increment.

**What the control deliberately does not claim.** It does not require a converted Lead to have
produced an Opportunity. Salesforce supports conversion with *"don't create an opportunity"*, so a
null `ConvertedOpportunityId` is a legitimate outcome and is never on its own a failure. A test pins
that boundary. The failing condition is narrower and harder to argue with: **status claims converted
AND `IsConverted` is false.**

**Population.** Only Leads that make the claim — 3 of 49. The other 46 are `outside`, not
unmeasurable: a Lead in *Open - Not Contacted* asserts nothing about conversion, so there is nothing
to substantiate. Each carries its own reason naming its own status.

> **Superseded 2026-08-28** — Assessment Model v2 activated Lifecycle Governance and this
> control with it; see *Assessment Model v2* below. The paragraph is left as written because it
> records the boundary that was deliberately held at the time, and the reasoning it gives is
> exactly what the later scoring decision had to answer. It is history, not current status.

**IT IS IMPLEMENTED AND NOT SCORED, AND THAT IS THE POINT.** `opportunityConversionIntegrity` is
absent from `runAllChecks` and from `CHECK_IDS`. Adding it would create Assessment Area #6, and
because `overallHealth` is an unweighted mean of areas, **every existing area would fall from a fifth
of the score to a sixth and overall health would move without a single existing control changing.**
That is a user-visible scoring change and the break between Assessment Model v1 and v2. It is one
line, and it is held for approval rather than taken quietly. Two tests assert the boundary: the
scored run still returns **7 controls across 5 areas**, and declaring the sixth category changes
nothing while it holds no result.

### Assessment Model versioning

| | Areas | Controls | State |
|---|---:|---:|---|
| **Model v1** | 5 | 7 | **Current.** Every score in this repository was produced under it. |
| **Model v2** | 6 | 11 | **Not reached.** Applies only once Lifecycle Governance and its four approved controls are all implemented. |

**A Model v1 score is not comparable with a Model v2 score.** Adding a sixth area re-weights the
five that exist from 20% to ~16.67% each, so overall health would move for structural reasons alone.
No historical result will be recalculated to make the two comparable — the earlier figure was
correct for the model that produced it.

### Decisions closed

| Decision | Resolution |
|---|---|
| **Assessment Area number** | Lifecycle Governance is **#6**, not #7. The repository has **5** areas and **7 controls**; earlier planning language conflated the two. |
| **`OD-03`** | **Closed** by `PD-14`. Weighting is not answered, it is **removed**: qualification becomes a set of deterministic conditions that must all hold. No points, no threshold, no scoring model. Marked **Synthetic Baseline**. |
| **Control set** | All four Lifecycle Governance controls remain approved. Only Opportunity Conversion Integrity is built. |
| **Scoring** | Unchanged. The area, not the control, is the weighting unit; four lifecycle controls would each carry a quarter of one sixth. Accepted. |
| **Record Types** | Investigated, **not justified**. No structural business distinction found; `PD-08` already places the taxonomy on standard `Lead.Status`. |

### Transition enforcement — architecture resolved, not built

`Lifecycle_Transition__mdt` must remain the single allowed-transition policy. Three mechanisms were
compared against that requirement:

| Option | Verdict |
|---|---|
| **Validation Rule** | **Rejected.** A validation rule can reference Custom Metadata only through `$CustomMetadata.Type__mdt.RecordName.Field__c` — **a specific record named at authoring time**. It cannot look a record up dynamically from the values on the row being saved. Enforcing a matrix would mean enumerating every from→to pair inside the rule, which is a **second copy of the policy** — exactly the competing definition that must not be created. |
| **Existing before-save Flow** | **Recommended.** `Lead_Inbound_Before_Save` is already `RecordBeforeSave` / `CreateAndUpdate` on Lead at API 67.0, and **already carries `ISCHANGED($Record.Status)` in its entry criteria** for first-touch stamping. It can `Get Records` on the CMDT filtered by prior and new stage — a genuine dynamic lookup — and block an unlisted transition with a Custom Error element. CMDT stays the only definition; the Flow reads it. |
| **Apex** | **Rejected.** No capability here is unavailable declaratively, and `CLAUDE.md` holds the Apex target at zero. |

**Two things to validate before building it:** the Custom Error element behaves as expected in a
before-save Flow at this API version, and adding a bulk `Get Records` to a Flow that currently
performs none does not compromise its bulk safety. Both are implementation-time tests, not
assumptions to carry forward.

**Salesforce safety.** 0 metadata deployed · 0 permissions changed · 0 records mutated. The
extended `LEAD_SOQL` adds five standard conversion fields and was confirmed readable by the
least-privilege integration identity — the live assessment ran and returned unchanged results.
NorthstarIQ remains read-only: its only Salesforce operation is still a SOQL query.

---

### 2026-08-27 — Salesforce Lifecycle Foundation deployed: taxonomy and evidence

```
Requirement:   BR-15 (governed lifecycle taxonomy, transitions recorded -
               P1), PD-08, PD-09, PD-12. BR-16 is served only to the extent
               PD-09 requires: capture now, measurement later.
Metadata:      DEPLOYED to northstariq-dev, 37/37 components, 0 errors.
               MODIFIED  LeadStatus standard value set (+MQL, +SAL, +SQL)
               NEW       Lead.Lifecycle_Stage_Entered__c (DateTime)
               NEW       Lifecycle_Transition__mdt + 4 fields + 10 records
               MODIFIED  NIQ_Integration_Read, NIQ_Revenue_Seller,
                         NIQ_Rule_Configuration
               0 Flows changed. 0 validation rules. 0 Record Types. 0 Apex.
               0 Lead records mutated.
Deployment:    Validate-only run first (0Afaj00000iD2gzCAC) - succeeded.
               Deploy 0Afaj00000iBRBeCAO - Succeeded, 37/37, 0 errors.
Validation:    Read-only SOQL and describe against the org after deploy -
               63/63 web unit tests - tsc clean - live assessment unchanged
Test result:   Lead.Status now carries 7 values in lifecycle order. Exactly
               one still carries the converted flag. 10 transition records
               readable BY THE LEAST-PRIVILEGE INTEGRATION IDENTITY.
               Lifecycle_Stage_Entered__c present, null on all 49 Leads,
               createable=false and updateable=false for that identity.
               49 Leads, status spread 28/14/3/4 - unchanged. The three
               Closed - Converted / IsConverted=false contradictions intact.
               Assessment: overall 62, 5 areas, 7 controls - unchanged.
Commit:        NOT COMMITTED - held for human review
Deferred:      ALL enforcement. The Flow was not touched.
```

**What was built: a definition, not a mechanism.** The taxonomy and the transition policy now exist
in source control and in the org. **Nothing enforces them and nothing stamps anything.** That
separation is deliberate — the policy can be reviewed before it is allowed anywhere near a Lead save
path.

**The object boundary is respected.** The lifecycle is
**Lead → MQL → SAL → SQL → *Salesforce Lead Conversion* → Opportunity**, and the italicised step is a
**platform transition, not a stage**. No `Opportunity` value was added to Lead Status, because an
Opportunity is a different object and a status value pretending otherwise would be a diagram tidied
at the expense of the model. The Lead-side lifecycle terminates at **SQL**; `Closed - Converted`
remains the single value carrying Salesforce's `converted` flag, and `SQL → Closed - Converted` is
the one governed route into it.

| Lead Status, as deployed | Converted flag |
|---|---|
| Open - Not Contacted *(default)* | — |
| Working - Contacted | — |
| **MQL** | — |
| **SAL** | — |
| **SQL** | — |
| Closed - Converted | ✅ **the only one** |
| Closed - Not Converted | — |

**The transition policy — 10 records, `Rule_Version__c` v1.0, all active.**

| Forward path | Exit path |
|---|---|
| Open → Working | Open → Closed - Not Converted |
| Working → MQL | Working → Closed - Not Converted |
| MQL → SAL | MQL → Closed - Not Converted |
| SAL → SQL | SAL → Closed - Not Converted |
| SQL → Closed - Converted | SQL → Closed - Not Converted |

The forward path is the governed progression. The exit path exists because a Lead can be
disqualified at any point, and a policy that forbade closure would be wrong rather than strict.

**Deliberately excluded, recorded as Candidate rather than invented:**

| Candidate transition | Why it was not created |
|---|---|
| Open - Not Contacted → MQL | Plausible for a high-intent inbound arriving already qualified, but whether the process permits skipping contact is a **business decision nobody has made**. |
| MQL → Working - Contacted · SAL → MQL · SQL → SAL | Lead recycling is common in real orgs. Which backward moves are legitimate, and under what conditions, is policy — and inventing it would put a rule into the org that no one agreed. |

**Single source of truth, verified.** `Lifecycle_Transition__mdt` is the **only** executable
definition of an allowed transition introduced anywhere. No transition matrix was added to a
validation rule, a Flow formula, a TypeScript constant or a documentation table. The tables above
**describe** the policy; the Custom Metadata **is** the policy.

**`Lifecycle_Stage_Entered__c` is empty on every record, and that is correct.** One timestamp, as
`PD-09` requires — not one per stage and not a custom history object, because Salesforce field
history on `Status` already carries the transition trail and this answers the different question of
when the *current* stage began. The automation that will maintain it is a later increment, so its
emptiness means **"not yet captured"**, never "entered at an unknown time". It was left off the Lead
page layout for exactly that reason: an always-blank field teaches an evaluator nothing.

**Access, deliberately narrow.** Read-only in both permission sets that received it — the
integration identity reads it as future evidence, and a seller reads a value automation will set.
Confirmed by describe: `createable=false`, `updateable=false` for the integration identity, and the
`Lead` object write boundary is unchanged at create/update/delete all false. `NIQ_Rule_Configuration`
received the Custom Metadata type because that permission set exists precisely to hold write access
to governed rule configuration; it remains **unassigned to any principal**.

**Status: Implemented and validated as a definition. NOT enforced.** Nothing prevents an invalid
transition today, and nothing stamps the timestamp. Both are the next increment.

---

### 2026-08-27 — Lifecycle transition enforcement: the policy becomes preventive

```
Requirement:   BR-15 (transitions governed and recorded), PD-09 (one
               stage-entry timestamp), PD-12 (validation on transition).
Metadata:      MODIFIED  Lead_Inbound_Before_Save - EXTENDED, not rewritten.
                         +2 assignments, +1 customErrors, +2 decisions,
                         +4 formulas, +1 recordLookups. Exactly ONE existing
                         element changed: the start connector.
               0 new Flows. 0 validation rules. 0 Record Types. 0 Apex.
               0 fields, 0 CMDT, 0 permission, 0 layout changes.
               0 baseline records mutated.
Deployment:    Validate-only first - Succeeded. Deploy - Succeeded, 1/1, 0 errors.
Validation:    9-scenario controlled behavioural matrix against purpose-built
               test records, then full cleanup. 63/63 web unit tests. tsc
               clean. Live assessment unchanged.
Test result:   9 passed / 0 failed. Org returned to exactly 49 Leads,
               13 Accounts, 32 Opportunities; the 3 Closed - Converted
               contradictions intact. Assessment: 62, 5 areas, 7 controls.
Commit:        NOT COMMITTED - held for human review
Deferred:      Salesforce Lead conversion behaviour - UNVERIFIED, see below.
```

**The governance chain is now closed on the Lead side.**

```
BR-15  →  Lifecycle_Transition__mdt  →  Lead_Inbound_Before_Save  →  Lifecycle_Stage_Entered__c
business rule    governed metadata          preventive safeguard      observable evidence
```

**The Flow asks one question and states no policy.** On a Status change it runs a single selective
lookup ` — ` `From_Stage__c` = prior, `To_Stage__c` = new, `Is_Active__c` = true, first record
only ` — ` and branches on whether a record came back. **No stage name appears in any lifecycle
decision condition**, verified by scanning the deployed Flow: `Lifecycle_Transition__mdt` remains the
only executable definition of an allowed transition, and the Flow holds no second copy of it.

Deliberately not a retrieve-all-and-loop. The segment and territory elements loop because they
compare ranges and resolve precedence; a transition is exact equality on two fields, so the filter
does the whole job and no collection is created.

**Bulk safety, from the actual execution model rather than an assertion.** The Flow already
performed **four** Get Records before this change — two of them Custom Metadata — and its own
element descriptions already record that *Custom Metadata reads do not consume SOQL query limits*.
The new lookup is the fifth and the third against Custom Metadata. A record-triggered Flow processes
the whole trigger batch in one interview set and Get Records elements are executed once per batch
rather than once per record. Tested at batch volume: 4 creates and 4 updates with no Flow or
governor failure.

**No fault connector on the new lookup, by design.** An unhandled fault blocks the save. For a
preventive safeguard that is the correct direction to fail — a fault path that continued would let
an unvalidated transition through at exactly the moment the policy could not be read.

**Creation stamps the timestamp.** Creation *is* entry into the initial stage, so leaving it null
until the first transition would make the first computable duration start at the wrong moment. It
records when the record entered the stage **in this system**: a loaded record carries the load time,
which is true and is not a claim about when the business event happened. Verified that stamping on
create does not disturb segmentation, matching, territory or SLA — a created test Lead came out with
`Segment__c` Mid-Market, `Territory__c` NA-West and `SLA_Status__c` Unmeasurable exactly as before.

**Controlled test matrix — 9 passed, 0 failed.**

| # | Scenario | Result |
|---|---|---|
| A | Create | stamped; existing automation unaffected |
| B | Unrelated update (Title) | saved; timestamp unchanged |
| C | Open → Working | saved; timestamp updated |
| D | Working → MQL | saved; timestamp updated |
| E | MQL → Closed - Not Converted | saved; timestamp updated |
| F | **Open → SQL** | **blocked**; Status and timestamp unchanged |
| G | Full path to SQL, then **SQL → SAL** | forward all 4 succeeded; **backward blocked** |
| H | Re-save, Status unchanged | saved; timestamp unchanged |
| I | Batch: 4 creates + 3 transitions + 1 unrelated update | all succeeded; all stamped |

Operator-facing error, verbatim from the org:

> This lifecycle transition is not allowed by the governed NorthstarIQ lifecycle policy:
> Open - Not Contacted to SQL.

Record-level rather than field-level, so the same message is returned through the UI, the API and a
data load. The whole save is rolled back: in both blocked cases `Status` and
`Lifecycle_Stage_Entered__c` were both verified unchanged afterwards.

**A least-privilege detail worth recording.** The System Administrator running the CLI **cannot read
`Lifecycle_Stage_Entered__c`** — a query returns `INVALID_FIELD` — because FLS was granted only to
`NIQ_Integration_Read` and `NIQ_Revenue_Seller`. Every assertion above was therefore verified
through the NorthstarIQ integration identity, which is the same identity the assessment uses. The
narrow grant is doing real work.

### ⚠️ Salesforce Lead conversion: UNVERIFIED

> **RESOLVED the same day, 2026-08-27** — see *Native Lead conversion verified
> against the lifecycle safeguard* below. Conversion **does** traverse the
> safeguard, and a Custom Error **does** block it. All six questions below were
> answered. This section is left as written because it records what was
> genuinely established at the time the enforcement increment closed; it is
> history, not current status.

`SQL → Closed - Converted` is in the policy and **an ordinary Status edit to that value is
enforced**. What is *not* established is whether Salesforce's own **Lead conversion process** takes
the same path.

The REST resource `/sobjects/LeadConvert` returned **HTTP 404** at API 67.0 in this org, and the
remaining routes are the SOAP `convertLead()` call, the Lightning UI, or Apex — none available
inside this increment's boundary. **No conversion was performed and nothing was inferred.**

Open questions, all still open:

1. Does Lead conversion invoke this before-save Flow at all?
2. Is `$Record__Prior.Status` the pre-conversion stage during conversion?
3. When exactly does the platform set the converted status?
4. Can a Custom Error block a conversion?
5. Is stamping the timestamp during conversion valid?
6. Does any platform restriction affect editing the Lead mid-conversion?

**Why this matters, and why it is not a blocker.** If conversion bypasses the before-save Flow, an
unenforced route into `Closed - Converted` exists. That is precisely the gap **Opportunity Conversion
Integrity** detects — and it is the argument for having both a preventive safeguard and an
independent detective control rather than trusting either alone. The three existing contradictions
in the org are what that gap looks like in practice.

**Layout: still not added.** All 49 baseline Leads have the timestamp null, because none of them has
transitioned since the field existed. A field that is blank on every record an evaluator opens
teaches nothing. Revisit when lifecycle fixtures exist.

**Rollback.** The previous Flow version is retained by Salesforce as an inactive version;
reverting is activating it. No data migration is involved because the Flow writes only the new
timestamp field.

**Status: transition enforcement is Implemented and Validated for ordinary Status edits.** Conversion
is **not** covered by that claim.

---

### 2026-08-27 — Native Lead conversion verified against the lifecycle safeguard

```
Requirement:   BR-15. Closes the conversion question left open by the
               enforcement increment earlier the same day.
Metadata:      NONE. 0 Flows, 0 fields, 0 CMDT, 0 permissions, 0 layouts
               changed. This was a verification experiment, not a build.
Mechanism:     Native Lightning Convert action. Not simulated, not Apex,
               not a custom Flow.
Fixtures:      2 purpose-built synthetic Leads, both deleted afterwards.
               0 baseline records mutated.
Test result:   Conversion traverses the preventive safeguard. OUTCOME A.
Repository:    NEW  scripts/soql/lead-conversion-evidence.soql
Commit:        NOT COMMITTED - held for human review
```

**The question.** The enforcement increment proved that an ordinary `Status`
edit is governed. It did not establish whether Salesforce's own conversion
transaction takes the same path. Conversion is an object boundary, and the
governed lifecycle is `Lead → MQL → SAL → SQL → conversion → Opportunity`,
not an Opportunity-shaped Lead Status.

**Which mechanisms are actually reachable in this org** — established before
touching a record, and worth recording because it constrains any future
automated conversion test:

| Route | Result |
|---|---|
| REST `/sobjects/LeadConvert` | HTTP 404 |
| Standard invocable action `actions/standard/convertLead` | HTTP 404, `Invalid Action Type` — the Actions API is present, this action is not |
| Integration principal | `createable=false` on Lead, Account, Contact and Opportunity — it cannot convert anything |
| Apex | excluded by the increment boundary |
| **Lightning Convert action** | **available and used** |

**The decisive evidence.** The fixture reached `SQL` through the governed path
(`Open → Working → MQL → SAL → SQL`, each transition matched to an active
policy record, each stamping the timestamp). Immediately before conversion it
held `Lifecycle_Stage_Entered__c = 19:05:06Z`, `IsConverted = false` and every
`Converted*` field null. After one native conversion:

```
Lifecycle_Stage_Entered__c   19:05:06Z  →  19:08:43Z
Lead.LastModifiedDate                       19:08:43Z
LeadHistory                  Status: SQL → Closed - Converted at 19:08:43Z
```

That timestamp is written by exactly one element, `asgnStageEnteredOnTransition`,
and that element is reachable only after `getLifecycleTransition` returns a
record. **A changed timestamp therefore proves the whole chain in one
observation**: the before-save Flow ran inside the conversion transaction, saw
`Status` as changed, held `SQL` as the prior stage and `Closed - Converted` as
the new one, executed the Custom Metadata lookup, and found the active
`SQL → Closed - Converted` rule. None of that is inferred from documentation.

**The control that proves blocking, without touching the policy.** Deleting the
`SQL → Closed - Converted` record to watch a conversion fail would have meant
editing the authoritative policy. Instead a second fixture was parked at `MQL`,
a stage the policy gives no route to `Closed - Converted`, and converted
natively. The Convert modal returned:

> Validation error on Lead: This lifecycle transition is not allowed by the
> governed NorthstarIQ lifecycle policy: MQL to Closed - Converted.

The entire conversion transaction rolled back: `Status` still `MQL`,
`IsConverted` still false, timestamp unchanged, and **zero** Accounts, Contacts
or Opportunities created. A Custom Error in a before-save Flow can block a
native Lead conversion, and it blocks the whole transaction rather than leaving
half-built child records behind.

**Two platform behaviours observed in the native modal**, both of which
constrain how a future control must be written:

1. The **Converted Status** picklist offered exactly one value,
   `Closed - Converted`. The platform derives that list from the
   `converted` flag in the standard value set, so `MQL`, `SAL` and `SQL` are
   structurally incapable of being conversion statuses. The taxonomy is
   enforced by Salesforce itself, not only by NorthstarIQ.
2. The modal carries a **"Don't create an opportunity upon conversion"**
   checkbox. Opportunity creation is optional at the platform level.

**The conversion invariant, stated precisely.** These are two different tests
and must not be folded together:

| Claim | Authoritative evidence |
|---|---|
| Salesforce converted this Lead | `IsConverted = true`, and in the same transaction `ConvertedDate`, `ConvertedAccountId` and `ConvertedContactId` are all populated |
| An Opportunity resulted | `ConvertedOpportunityId != null` — **a NorthstarIQ business-policy question, not a platform-integrity one** |

`Status` is a claim; `IsConverted` is the fact. The three baseline records where
`Status = Closed - Converted` and `IsConverted = false` are exactly that
disagreement, which is what **Opportunity Conversion Integrity** detects. A
converted Lead with no Opportunity is **not** a defect unless NorthstarIQ policy
separately requires one, and that policy does not yet exist.

**What conversion created, and cleanup.** Account, Contact and Opportunity
(`Prospecting`, close date +30 days, `Amount` null, `LeadSource` carried from
the Lead) — all named from the fixture, matching no existing Account
(`0 Account Matches`), so no business record was touched. Deleted children
first, then the Account, then both Leads. **The converted Lead deleted without
incident**, which is worth recording: converted Leads are deletable in this org.
Everything went to the Recycle Bin and **the Recycle Bin was deliberately not
emptied** — Salesforce's own recovery path is left open rather than replaced
with anything custom.

Org returned to exactly **49 Leads, 13 Accounts, 20 Contacts, 32
Opportunities**, `IsConverted = true` back to 0, stage timestamps back to 0, the
three contradictions unmodified (`LastModifiedDate` still 2026-08-17), and the
policy still 10 active v1.0 records.

**What this changes architecturally, and what it does not.** The preventive
safeguard covers the conversion boundary as well as ordinary edits, so the
governed lifecycle is enforced end to end for edits made through the platform.
It does **not** make the detective control redundant: prevention only governs
saves that reach the Flow, and the three baseline contradictions are records
that already hold an unsupported state. Prevention stops new ones; detection
finds the ones already there.

**Status: Validated.** Native Lightning conversion, one experiment, both
directions (allowed and blocked), all fixtures removed.

---

### 2026-08-27 — MQL qualification: a stage label becomes an earned claim

```
Requirement:   BR-17 (one governed fit definition, basis recorded, definition is
               configuration), PD-14 (required conditions, never a weighted score).
Metadata:      NEW  MQL_Qualification_Policy__mdt + 3 fields + 1 record
               NEW  Segment_Band__mdt.MQL_Eligible__c  (on the EXISTING type)
               NEW  Lead.MQL_Basis__c
               MOD  Lead_Inbound_Before_Save - EXTENDED. +1 assignment,
                    +1 customErrors, +2 decisions, +10 formulas, +3 recordLookups.
                    Exactly ONE existing element changed: where "Allowed" goes next.
               MOD  4 Segment_Band records; 3 permission sets; 1 field description.
               0 new Flows. 0 validation rules. 0 Record Types. 0 Apex.
               0 baseline records mutated. 0 Leads retroactively qualified.
Deployment:    Validate-only first - FAILED, then succeeded. Deploy - Succeeded,
                    16 components, 0 errors. Deployed by explicit component list
                    rather than --source-dir, so nothing unrelated was pushed.
Test result:   10 scenarios, 10 passed / 0 failed. Org returned to exactly 49 / 13 /
               20 / 32; the 3 contradictions intact; MQL_Basis__c populated on 0
               records. Assessment: 62, 5 areas, 7 controls - unchanged.
Commit:        NOT COMMITTED - held for human review
```

⚠️ **SYNTHETIC BASELINE.** The MQL qualification policy was authored now, for the fictional
NorthstarIQ business, to demonstrate lifecycle governance reproducibly. It is **not** an originally
validated client business requirement and no historical evidence for it was manufactured.

**The gap this closes.** `Working - Contacted → MQL` was already a governed transition, which
established only that the *move* was structurally permitted. It said nothing about whether the Lead
had **earned** MQL. Marketing could relabel a record and Sales had no governed answer to *"why is
this an MQL?"* beyond *"because someone changed the status."*

**Two questions, kept apart.**

| Question | Answered by | Enforced by |
|---|---|---|
| May this stage follow the previous one? | `Lifecycle_Transition__mdt` | `errInvalidLifecycleTransition` |
| Has this Lead earned the stage? | the five required conditions | `errMQLNotQualified` |

Scenario D proves they are genuinely separate: a Lead satisfying **every** qualification condition
was still refused `Open - Not Contacted → MQL`, and the message named the transition policy, not
the qualification policy.

**Five required conditions, none weighted.** `PD-14` removed weighting rather than resolving it, so
there is no score, no threshold and no partial credit — one unsatisfied condition means not
qualified. Four of the five consume a source that **already governs them**:

| # | Condition | Source | New? |
|---|---|---|---|
| 1 | Governed acquisition source | `Routing_Readiness_Source__mdt` | existing |
| 2 | Routing readiness | `Lead.Territory__c` from `Routing_Rule__mdt` | existing |
| 3 | Segment eligible for qualification | `Segment_Band__mdt.MQL_Eligible__c` | **new field on an existing type** |
| 4 | Unambiguous account match | `Lead.Match_Status__c` | existing |
| 5 | Seller engagement occurred | `Lead.First_Touch_DateTime__c` | existing |

**Only one genuinely new business decision was needed** — which segments the company qualifies. It
lives on the band that already defines the segment, so no second type restates the segment list.
Deployed: Strategic, Enterprise and Mid-Market eligible; **SMB not**.

**Why a new Custom Metadata type at all, given that.** `MQL_Qualification_Policy__mdt` holds no
criteria — no expressions, no field names, no weights. It holds the version stamped onto
qualified records and the stage the policy governs. Two jobs nothing else owned: proving *which*
definition produced a historical qualification, and letting the Flow ask *"is this the governed
stage?"* without a stage name appearing in a Flow condition — the same property that keeps
`Lifecycle_Transition__mdt` the single definition of an allowed transition. Deactivating the record
withdraws the requirement and returns MQL entry to transition governance alone; it does not block
every Lead.

**Deliberately not built:** an expression parser, a configurable boolean DSL, nested rule groups, a
generic qualification engine. Five named formulas an administrator can read one line at a time beat
an abstraction that can express rules nobody asked for.

**Evidence, and what was deliberately not created.** `MQL_Basis__c` carries the explanation and the
policy version:

> Qualified: source Web; territory NA-West; Mid-Market segment eligible; match No Match; first touch
> recorded | MQL Policy v1.0

Same shape as `Segment_Basis__c` and `Routing_Reason__c`. **No `MQL_Qualified_At__c`** —
`Lifecycle_Stage_Entered__c` already records when MQL was entered and the only way to hold MQL is to
have transitioned into it, so a second timestamp would duplicate it. **No `MQL_Policy_Version__c`**
— the version travels inside the basis, exactly as the segment rule version does, and the segment
model has no separate version field either.

**The failure message is built from the same five formulas as the pass test**, so it cannot disagree
with the decision:

> This Lead does not meet the governed NorthstarIQ MQL qualification requirements (MQL Policy v1.0).
> Not satisfied: segment eligible for qualification;

**A platform constraint that changed the design mid-increment.** Routing readiness was written first
as `Data_Quality_Status__c = "Complete"` — the existing governed definition of routing-critical
completeness. The validate-only deploy **failed**:

> field integrity exception: unknown (When the TriggerType field is set to "RecordBeforeSave", the
> $Record.Data_Quality_Status__c field isn't supported.)

Salesforce does not allow a formula field to be referenced from a before-save Flow. Restating that
formula's test inside the Flow would have created a **second definition of routing readiness**, so
the criterion was rewritten to consume the **derived** value instead: `Territory__c` exists only
because a present country was mapped by `Routing_Rule__mdt`. The two agree in every case tested but
they are not the same expression, and that is recorded rather than smoothed over.

**The stale field description was corrected.** `Lifecycle_Stage_Entered__c` still claimed *"NOT YET
STAMPED: the automation that will maintain it is a later, separately approved increment"*. It now
describes what the field actually does, and was redeployed with the rest of this increment — the
last stale lifecycle claim in the repository.

**Controlled test matrix — 10 passed, 0 failed.** Each of the five criteria was failed
independently, so none is carried by its neighbours. 12 synthetic Leads and 2 synthetic Accounts
created and all deleted; org back to 49 / 13 / 20 / 32 with the three contradictions untouched.
Details in [`testing-strategy.md`](testing-strategy.md) §2j.

**Nothing was retroactively qualified.** `MQL_Basis__c` is populated on **0** records. The foundation
operates prospectively by design: existing records are the business of the future **MQL
Qualification Integrity** detective control, which is **planned and unbuilt**.

**Preventive and detective, again.** Salesforce now blocks a new unsupported MQL claim. NorthstarIQ
does not yet identify existing MQL records whose evidence fails to substantiate the stage — and
the org holds no MQL records at all, so there is currently nothing for such a control to find. Both
halves remain necessary for the same reason they do at the conversion boundary.

**Status: Implemented and Validated for MQL entry.** SAL acceptance and SQL qualification are
**unbuilt**, Lifecycle Governance is **not** complete, and Assessment Model v1 is unchanged at 62 —
5 areas, 7 scored controls.

---

### 2026-08-27 — MQL policy reconciliation: the definition moves out of the Flow, and Sales stops gating Marketing

```
Requirement:   BR-17, PD-14. Resolves two findings from human review of the
               MQL foundation entry immediately below. That entry is left
               exactly as written - it records what was true when it closed.
Metadata:      NEW  4 x Require_*__c on MQL_Qualification_Policy__mdt
               NEW  MQL_Qualification_Policy.NorthstarIQ_MQL_v1_1 (active)
               MOD  v1.0 record - deactivated, relabelled "(superseded)"
               MOD  Lead_Inbound_Before_Save - 4 criterion formulas now
                    policy-gated; fxMQLFirstTouch REMOVED; basis rebuilt;
                    policy selected by the stage being entered.
               MOD  NIQ_Integration_Read + Segment_Band__mdt read
               MOD  repository validator: one active policy per stage
               0 new Flows. 0 validation rules. 0 Apex. 0 Record Types.
               0 baseline records mutated.
Deployment:    Validate-only FAILED (object description over 1000 chars),
               then succeeded. Deploy - Succeeded, 13 components, 0 errors.
Test result:   11 scenarios, 11 passed / 0 failed. Org back to 49 / 13 / 20 / 32;
               3 contradictions intact; MQL_Basis__c on 0 records.
               Assessment: 62, 5 areas, 7 controls - unchanged.
Commit:        NOT COMMITTED - held for human review
```

⚠️ **SYNTHETIC BASELINE**, unchanged in status: the policy was authored for reproducible
demonstration and v1.0 was never a client requirement either. Reclassifying it does not make it
historical evidence.

**Finding 1 — seller activity was gating Marketing.** v1.0 required
`First_Touch_DateTime__c`. That field's own definition says it captures *"when the **seller** first
acted"* (`BR-11`), stamped on the first Status change into a working or closed value. Requiring it
for MQL inverted the handoff: **Sales had to act before Marketing could validly produce the thing
Sales is being handed.** Confirmed against the field artifact, not assumed.

**Removed from the policy, not from the org.** The field keeps its `BR-11` SLA purpose and its
stamping behaviour is untouched. It is now a **candidate evidence source for Sales acceptance /
SAL**, where seller action actually belongs.

**Nothing replaced it.** No engagement score, no intent model, no campaign activity, no behavioural
event infrastructure. The org contains no credible Marketing-engagement signal, so the policy is
**four conditions and honest** rather than five and invented.

**Finding 2 — the definition was in the wrong layer.** v1.0's policy record said only *"MQL v1.0 is
active"*; the requirement set lived in Flow formulas. Changing what MQL means meant editing Flow
logic — which makes the Flow materially part of the policy, and guarantees the future detective
control would have had to recreate the business definition in TypeScript.

**The record now declares the requirements.** Four checkboxes:
`Require_Governed_Source__c`, `Require_MQL_Eligible_Segment__c`, `Require_Routable_Territory__c`,
`Require_Unambiguous_Match__c`. Each criterion formula reads its flag first, so a requirement the
policy does not declare evaluates true and drops out — and the evidence string and the failure
message are assembled from the same policy-gated formulas, so neither can describe a requirement that
was not tested.

**Still not a rules engine.** A fixed schema of named checkboxes: no expressions, no field names, no
operators, no weights, no nested groups, no JSON. Each flag declares that a requirement **applies**;
the requirement itself stays owned by the metadata that already governs it — `Routing_Readiness_Source__mdt`, `Segment_Band__mdt.MQL_Eligible__c`, `Routing_Rule__mdt` through
`Territory__c`, and `Match_Status__c`. Adding a requirement is a schema change, deliberately.

**Two groups, one test.** Requirements 1–2 are **qualification eligibility**; 3–4 are **handoff
readiness**. A resolved territory is not evidence of a good buyer — it is evidence the handoff has
somewhere to land, and the portfolio story is weaker if those are conflated. All four are required;
the grouping explains, it does not score.

**Account match, stated precisely.** MQL requires an **unambiguous** match state, **not** a matched
Account. `No Match` passes — a genuinely net-new prospect is what Marketing is meant to find. Only
`Review` fails, because two or more candidate Accounts leave ownership unresolved at handoff.
Verified both ways (F and E).

**Policy selection became deterministic, not merely ordered.** The lookup now filters on
`Qualified_Stage__c` matching the stage being entered, so a future SAL or SQL policy cannot be picked
up by the MQL gate — and the same gate will serve those stages with no structural change. Salesforce
cannot enforce *one active record per stage* on Custom Metadata, so the **repository validator** now
asserts it (50 checks, up from 49) and the lookup is ordered by version descending as a backstop.
**A convention enforced by a test is weaker than a database constraint**, and is recorded as such.

**Versioning, honestly.** v1.0 is **deactivated and relabelled "(superseded)"**, not overwritten —
its four `Require_*` flags are set true, which is accurate for the four conditions it shared with
v1.1. The fifth, seller first touch, is deliberately **not** expressible in the new schema, so that
difference lives in this entry rather than in a flag for a criterion that no longer exists. **No
record anywhere was qualified under v1.0**: the v1.0 fixtures were deleted at the end of that
increment and `MQL_Basis__c` is populated on 0 Leads, so no historical evidence needed migrating.

**One permission was widened, for a reason.** `NIQ_Integration_Read` gained **read** on
`Segment_Band__mdt`. Without it the future detective control could read the policy but not
`MQL_Eligible__c`, and would have had to hard-code the eligible segment list — exactly the
duplication this increment exists to prevent. Read-only, on configuration the assessment is meant to
reason about; `NIQ_Rule_Configuration` remains the only identity that can change it.

**The critical test needed no manual field manipulation.** A Lead **created** at
`Working - Contacted` never has first touch stamped, because that stamp requires a Status *change*.
The identical fixture that v1.0 refused for *"seller first touch"* is granted under v1.1. Full matrix
in [`testing-strategy.md`](testing-strategy.md) §2k.

**Future detective control: feasible, and still unbuilt.** It would read the active policy record
(which requirements, which version), the governed sources, and the Lead's own values, and reach the
same deterministic result. Every one of those is now readable by the integration principal. Nothing
was implemented, `runAllChecks` and `CHECK_IDS` are untouched, and the assessment remains **62 —
5 areas, 7 scored controls**.

**Status: Implemented and Validated for MQL entry, v1.1.** SAL acceptance and SQL qualification
remain **unbuilt**; Lifecycle Governance is **not** complete.

---

### 2026-08-27 — Sales acceptance: the handoff acquires a second signature

```
Requirement:   BR-15 (transitions recorded with timestamp AND CAUSE; invalid
               transitions prevented), BR-16 (stage duration answerable
               retrospectively), PD-12.
Metadata:      NEW  Lead.Sales_Accepted__c            - the seller INPUT
               NEW  Lead.Sales_Accepted_At__c         - EVIDENCE
               NEW  Lead.Sales_Accepted_By__c         - EVIDENCE (Lookup User)
               NEW  Lead.Sales_Acceptance_Basis__c    - EVIDENCE
               NEW  Sales_Acceptance_Policy__mdt + 5 fields + 1 record
               MOD  Lead_Inbound_Before_Save - EXTENDED. +1 assignment,
                    +1 customErrors, +2 decisions, +6 formulas, +1 recordLookups.
                    Exactly ONE existing connector changed.
               MOD  3 permission sets; repository validator generalized.
               0 new Flows. 0 validation rules. 0 Apex. 0 Record Types.
               0 approval processes. 0 baseline records mutated.
Deployment:    Validate-only succeeded. Deploy - Succeeded, 0 errors.
               Redeployed after a requirement-tag correction (below).
Test result:   9 scenarios, 9 passed / 0 failed. Org back to 49 / 13 / 20 / 32;
               3 contradictions intact; acceptance evidence on 0 records.
               Assessment: 62, 5 areas, 7 controls - unchanged.
Commit:        NOT COMMITTED - held for human review
```

⚠️ **SYNTHETIC BASELINE.** This acceptance policy was authored for reproducible demonstration of
lifecycle governance. It is **not** an originally validated client business requirement.

**The question this closes.** `MQL → SAL` was a governed transition, which established only that the
move was permitted. Nothing established that **Sales had accepted anything**. `Status = SAL` was both
the claim and its only evidence — which is circular.

**Two facts, two sets of evidence, neither overwriting the other.**

| Fact | Evidence |
|---|---|
| Marketing qualified this Lead | `MQL_Basis__c` |
| Sales accepted responsibility | `Sales_Accepted_At__c` · `Sales_Accepted_By__c` · `Sales_Acceptance_Basis__c` |

**Input and evidence are deliberately different fields.** The seller writes exactly one thing:
`Sales_Accepted__c`, a checkbox whose only meaning is *"I accept responsibility for this
Marketing-qualified Lead."* The actor, the time and the basis are written by the Flow from the
authenticated identity and the Flow clock. **An acceptance can therefore be asserted by a human and
never back-dated, re-attributed or rewritten by one** — `editable=false` on all three evidence
fields in every permission set that grants them.

**Why this counts as explicit acceptance rather than an inference.** Ticking the box is a separate,
deliberate act from moving the stage; the stage move without it is refused. Acceptance is never
derived from the picklist change.

**Why a separate policy type.** `MQL_Qualification_Policy__mdt` is named for, and scoped to, Marketing
qualification. The previous increment's report suggested the pattern would generalise; on inspection,
stretching that type over Sales acceptance would have been the first step toward a generic lifecycle
policy object. **Two small explicit types beat one abstract one**, so
`Sales_Acceptance_Policy__mdt` was created narrowly instead: version, governed stage, two requirement
flags, active.

**Two requirements, none weighted.** Explicit acceptance · substantiated Marketing handoff. The
second checks only that `MQL_Basis__c` is present — an **evidence-chain** check, deliberately not a
re-run of the MQL policy, so that definition is not duplicated in a second gate. Whether the
Marketing evidence still holds is the business of the future detective control.

**Three new fields, each answering a question nothing else could.**

| Field | Why not something existing |
|---|---|
| `Sales_Accepted_At__c` | `Lifecycle_Stage_Entered__c` is overwritten on the next transition, so it stops answering when SAL was accepted the moment the Lead reaches SQL |
| `Sales_Accepted_By__c` | `OwnerId` is ownership and is reassignable; `LastModifiedById` is overwritten by any later edit |
| `Sales_Acceptance_Basis__c` | Nothing else records which acceptance policy version applied |

**First Touch was inspected and rejected as acceptance evidence.** The previous increment listed it
as a candidate; inspection settled it. `First_Touch_DateTime__c` records when the *seller first
acted* (`BR-11`) and is stamped on entry to `Working - Contacted` — **before MQL exists**. It cannot
evidence accepting a handoff that has not yet happened. Proven both ways: a Lead with First Touch and
no acceptance was **refused**; a Lead with acceptance and no First Touch was **granted**. Its SLA
purpose and stamping behaviour are untouched.

**A requirement tag was wrong and was corrected mid-increment.** The new metadata initially cited
`BR-19`, which is already taken — it governs integration and analytics principals. Sales acceptance
traces to **`BR-15`** (*transitions recorded with timestamp **and cause**; invalid transitions
prevented*) and **`BR-16`** (*stage duration answerable retrospectively* — precisely why the
acceptance timestamp is separate from the overwritten one). All 13 references were retagged and
redeployed, and the behaviour re-proved afterwards.

**A permission was widened, narrowly.** `NIQ_Revenue_Operations` gained **edit** on
`Sales_Accepted__c` and **read-only** on the three evidence fields. RevOps may record an acceptance on
behalf of the business and, like the seller, cannot alter the resulting evidence. No runtime security
assignment was made and no broad Lead edit access was granted.

**Rejection is not modelled, and that is stated rather than fudged.** `Closed - Not Converted` is
reachable from MQL, but it carries no reason and no actor — it is a disqualification, not a recorded
*Sales rejection of a handoff*. Equating them would be wrong. An explicit rejection disposition is a
**future candidate**, deliberately not built here.

**Controlled test matrix — 9 passed, 0 failed**, including a scenario that required deactivating the
MQL policy for a few seconds to manufacture an unsubstantiated handoff, with the restore verified.
Details in [`testing-strategy.md`](testing-strategy.md) §2l.

**Nothing retroactive.** Acceptance evidence is populated on **0** records. The foundation operates
prospectively; existing records are the business of the future **Sales Acceptance / SQL Integrity**
detective control, which is **planned and unbuilt**.

**Status: Implemented and Validated for SAL entry.** SQL qualification remains **unbuilt**, Lifecycle
Governance is **not** complete, and Assessment Model v1 is unchanged at **62 — 5 areas, 7 scored
controls**.

---

### 2026-08-27 — SQL qualification: the lifecycle tells four different stories

```
Requirement:   BR-15 (transitions recorded with timestamp and cause), BR-17
               (one governed definition, basis recorded, definition is
               configuration), PD-14 (required conditions, never a score).
               Option A, approved by human decision after investigation.
Metadata:      NEW  Lead.Qualified_Need__c      - INPUT, restricted picklist
               NEW  Lead.Next_Step_Date__c      - INPUT, Date
               NEW  Lead.Next_Step__c           - CONTEXT, never a requirement
               NEW  Lead.SQL_Basis__c           - EVIDENCE
               NEW  SQL_Qualification_Policy__mdt + 6 fields + 1 record
               MOD  Lead_Inbound_Before_Save - EXTENDED. +1 assignment,
                    +1 customErrors, +2 decisions, +7 formulas, +1 recordLookups.
                    Exactly ONE existing connector changed.
               MOD  4 permission sets; validator extended by one glob.
               NEW  scripts/soql/lifecycle-evidence-chain.soql
               0 new Flows. 0 validation rules. 0 Apex. 0 Record Types.
               0 Global Value Sets. 0 baseline records mutated.
Deployment:    Validate-only succeeded. Deploy succeeded, 0 errors. Flow v12 Active.
Test result:   11 scenarios, 11 passed / 0 failed, including native conversion.
               Org back to 49 / 13 / 20 / 32; 3 contradictions intact; all
               lifecycle evidence on 0 records. Assessment: 62, 5 areas,
               7 controls - unchanged.
Commit:        NOT COMMITTED - held for human review
```

⚠️ **SYNTHETIC BASELINE.** The SQL qualification policy and its need vocabulary were authored for
reproducible demonstration of lifecycle governance. They are **not** originally validated client
business requirements.

**What was missing.** SAL proved Sales took the handoff. Nothing proved Sales had **learned**
anything. Without SQL, `SAL → SQL` was provably just "SAL plus elapsed time".

**The investigation found no reusable evidence, and that finding shaped the design.** The org held
**zero** commercial-qualification fields; `Opportunity` and `Contact` had no custom fields at all.
Three tempting candidates were rejected on inspection rather than on taste:

| Rejected | Why |
|---|---|
| `ProductInterest__c` | Values are `GC1000 / GC3000 / GC5000 series` — **Salesforce demo-org generator products**, not NorthstarIQ's software |
| `Lead.Description` | A long text area. **Not filterable in SOQL** — a future control could not query it at all |
| `Lead.Rating` | Hot/Warm/Cold is a seller opinion, populated on 2 of 49. This is exactly the weighting `PD-14` removed |

**Three required conditions, none weighted.**

| # | Requirement | Source | Why it belongs |
|---|---|---|---|
| 1 | Substantiated Sales acceptance | `Sales_Accepted_At__c` | Evidence chain. The acceptance and MQL policies are **not** re-run |
| 2 | Confirmed business need | `Qualified_Need__c` | **The only evidence that could not have existed before Sales spoke to the prospect** |
| 3 | Agreed next step | `Next_Step_Date__c` today or later | A need with no next step is an observation, not a pursuit |

**A restricted picklist, not notes.** Governed vocabulary is assessable; prose is not. Proven rather
than asserted: Salesforce rejected `Budget Approved` with *bad value for restricted picklist field*,
and **no restriction was disabled to run that test**. Field-level value set rather than a Global
Value Set, because no second object consumes the vocabulary — reusable metadata is not created for
hypothetical reuse.

**What was deliberately NOT built, and why.** No budget and no decision-maker requirement: Salesforce
needs only `Name`, `StageName` and `CloseDate` to create an Opportunity, conversion lands at
`Prospecting`, and the platform's own stage list puts `Id. Decision Makers` several stages later.
Demanding those before the Opportunity exists would be methodology cosplay. No buying timeline
either — a target decision date at this stage is a prediction, and it duplicates
`Opportunity.CloseDate` days later. **No BANT, no MEDDIC, no scoring.**

**One field exists purely for readability.** `Next_Step__c` is short text, is **never** a
requirement, and no Flow or control reads it. It is there because the project thesis is
explainability: a reader should see *what* was agreed, not only that a date exists.

**Date semantics, made unambiguous.** `Next_Step_Date__c` is compared to `$Flow.CurrentDate` —
Date to Date, never `$Flow.CurrentDateTime`. Yesterday blocked, **today permitted**, future
permitted; all three tested.

⚠️ **And a warning recorded now for the control that does not exist yet.** That comparison is a
**qualification-time** test. A next-step date that was valid at entry will naturally fall into the
past. A future detective control must **not** flag `Next_Step_Date__c < TODAY` on historical
records — it must judge against the recorded qualification event. `SQL_Basis__c` carries the date as
it stood, and Status field history carries when SQL was entered. Designing that wrong would turn
every correctly-qualified Lead into a false finding within days.

**The test-governance improvement asked for was delivered.** The SAL increment had briefly
deactivated the MQL policy to manufacture one invalid state. **No policy was deactivated here** —
every invalid state came from omitting an input. One scenario (SQL without acceptance evidence) is
**not constructible at all**, because the SAL gate stamps the acceptance timestamp as the condition
of entry; it was proven architecturally and labelled as such rather than forced.

**The chain now survives the whole lifecycle**, verified on a fixture taken through native
conversion:

```
MQL         why Marketing qualified it
SAL         who accepted responsibility, when, under which policy
SQL         what Sales established with the prospect
Conversion  what Salesforce actually did
```

All four still readable on the converted record. Query:
[`lifecycle-evidence-chain.soql`](../scripts/soql/lifecycle-evidence-chain.soql) — a **new
reproducibility artifact created after this implementation**, not evidence of original validation.

⚠️ **Architecture watch.** This is the **third** explicit lifecycle policy type. Each models a
genuinely different business decision, so the repetition is still explicitness. **If a fourth becomes
necessary, review whether it has crossed into duplication before creating it.** Not refactored now,
and deliberately so — the abstraction would be premature at three.

**Nothing retroactive.** All lifecycle evidence is populated on **0** records. Existing records are
the business of the future detective controls, all of which remain **planned and unbuilt**.

**Status: Implemented and Validated for SQL entry.** SQL and Salesforce Lead Conversion remain
separate events — SQL does not convert anything. Lifecycle Governance is **not** complete: no
detective control exists, and Assessment Model v1 is unchanged at **62 — 5 areas, 7 scored
controls**.

---

### 2026-08-27 — MQL Qualification Integrity: the governance loop closes

```
Requirement:   BR-17 AC1/AC2 (one governed definition, basis recorded), PD-14.
               The first lifecycle DETECTIVE control, and the first increment
               to bring the governed Salesforce evidence back into the
               NorthstarIQ product.
Repository:    NEW  web/lib/checks/mql-policy.ts      - policy shape + resolver
               NEW  web/test/mql-integrity.test.ts    - 22 scenarios
               MOD  checks/index.ts, soql.ts, types.ts, assessment.ts,
                    presentation.ts, traceability.ts, export-model.ts,
                    test/fixtures.ts
Salesforce:    0 metadata changes. 0 deployments. 0 record mutations.
               READ-ONLY throughout.
Validation:    22/22 targeted, 85/85 full suite, tsc clean, live read-only run.
               Assessment: 62, 5 areas, 7 controls, 7 findings - UNCHANGED.
Commit:        NOT COMMITTED - held for human review
```

**IMPLEMENTED · DETECTIVE · DELIBERATELY UNSCORED.** Absent from `CHECK_IDS` and from
`runAllChecks`, exactly like `opportunityConversionIntegrity`. Lifecycle Governance is **not** an
active Assessment Area and Assessment Model v2 is **not** activated. Wiring it in would move every
existing area from a fifth of the score to a sixth and change overall health without a single
existing control changing — a user-visible scoring change, held for approval rather than taken
quietly.

**What this closes.** Four increments built preventive governance the product could not see. This is
the first control that reads the governed Salesforce definition back out and judges records against
it:

```
Business Context  →  governed policy in Salesforce  →  preventive Flow
                                   ↓
                    NorthstarIQ reads the SAME policy  →  judges existing records
                                   ↓
                            Finding + Source Evidence
```

**The definition is not duplicated in TypeScript.** Three reads at assessment time:
`MQL_Qualification_Policy__mdt` for which requirements apply, `Routing_Readiness_Source__mdt` for
which sources are governed, `Segment_Band__mdt.MQL_Eligible__c` for which segments qualify —
the same three the Flow consults. **Switch a requirement off in Salesforce and the control stops
testing it, with no code change**, proven by unit test. What the TypeScript holds is execution logic
for four known requirement types; what it does not hold is the decision that MQL means those four.

**The blank-match question, resolved as evidence sufficiency rather than policy.** The preventive
Flow blocks only a known ambiguity, so a blank `Match_Status__c` passes there — correct for a gate
deciding whether to refuse a save. The detective control asks a different question: *is the claim
substantiated?* A match that was never evaluated substantiates nothing, so blank is **insufficient
evidence** here: not a pass, not a failure. **No Salesforce behaviour and no business policy was
changed** — the same policy, the same field, a different question. It maps onto the assessment
engine's existing `unmeasurable` state, whose contract is already *"the control applies, but the
process that produces its evidence never ran"*. No engine change was needed.

**Precedence, because it matters.** A demonstrated violation outranks an unprovable condition on the
same record — otherwise a real defect could hide behind a blank field. Unit-tested.

**Missing evidence is not a violation.** Every baseline Lead predates `MQL_Basis__c`. Reporting those
as *"Marketing broke the policy"* would be a fabrication, so they are reported as unprovable. The
distinction between **contradictory evidence** and **absent evidence** is the whole reason this
control has a third outcome.

**Three temporal traps, all declined rather than papered over.** Every input the policy reads is
current-state and derived, so a Lead that has reached SAL, SQL or conversion cannot be re-judged from
today's values — a segment that legitimately changed afterwards is not evidence of a bad
qualification. A record under a superseded policy version is not judged against the current one. And
`MQL_Basis__c` alone never earns a pass: it proves a decision was made, not that it still holds.

**Live result: 0 evaluated, 0 failing, 3 unmeasurable, no finding.** That is the honest answer for an
org where no Lead has ever been through the governed lifecycle, and **no data was altered to make it
more interesting**. The three unmeasurable records are the existing `Closed - Converted` /
`IsConverted = false` contradictions, reached by a second independent route. Failure detection is
proven by 22 fixture scenarios.

**Failing safely.** A missing policy, two active policies, or a policy naming no stage all **throw**.
Absence of governance is a diagnostic failure, never a population that all passes. The control is
unscored and outside `runAllChecks`, so a throw cannot destabilise the live assessment.

**Not duplicating Account Match Confidence.** That control asks whether the org's account matching is
reliable. This one asks whether the match evidence was sufficient *for the MQL policy*. The same
Salesforce fact answers two different business questions; neither makes the other redundant.

**Status: Implemented and Validated, unscored.** Lifecycle Governance holds **one** of its four
approved controls, plus Opportunity Conversion Integrity implemented-but-unscored. Lifecycle
Progression Integrity and Sales Acceptance / SQL Integrity remain **planned and unbuilt**, and
Assessment Model v1 is unchanged at **62 — 5 areas, 7 scored controls**.

---

### 2026-08-27 — Lifecycle Progression Integrity: reasoning honestly over evidence that no longer exists

```
Requirement:   BR-15 (transitions governed and recorded), BR-16, PD-12.
               Lifecycle Governance detective control 2 of 4.
Repository:    NEW  web/lib/checks/lifecycle-graph.ts        - policy as a graph
               NEW  web/test/lifecycle-progression.test.ts   - 28 scenarios
               MOD  checks/index.ts, soql.ts, types.ts, assessment.ts,
                    presentation.ts, traceability.ts, export-model.ts,
                    test/fixtures.ts
Salesforce:    0 metadata changes. 0 deployments. 0 record mutations.
               READ-ONLY throughout.
Validation:    28/28 targeted, 113/113 full suite, tsc clean, live read-only run.
               Assessment: 62, 5 areas, 7 controls, 7 findings - UNCHANGED.
Commit:        NOT COMMITTED - held for human review
```

**IMPLEMENTED · DETECTIVE · DELIBERATELY UNSCORED.** Absent from `CHECK_IDS` and
`runAllChecks`, like the two controls before it. Lifecycle Governance is still not an active
Assessment Area and Model v2 is still not activated.

**The evidence investigation came first, and it changed the design.** Salesforce retains **8 Status
history rows across 3 of 49 Leads**, and **zero** Leads carry a stage-entry timestamp or any stage
evidence. Field history is bounded, was not tracked from the beginning, and never records a Lead's
first status. So the control was built on the premise that **full historical reconstruction is
impossible**, rather than discovering that later.

**The question, and how it differs from its neighbours.** Not *was this Lead well qualified* —
that is MQL Qualification Integrity, which re-tests source, segment, territory and match. Not *was
this conversion real* — that is Opportunity Conversion Integrity, which compares `Status` against
`IsConverted`. This asks whether the **progression itself** is internally consistent: did the record
move in ways the policy permits, does its evidence belong to stages it could have passed through, do
its timestamps order sensibly.

**The policy is consumed, not copied.** `lifecycle-graph.ts` turns the active
`Lifecycle_Transition__mdt` records into an adjacency map and answers three questions against it:
is this exact move permitted, can stage A still reach stage B, and does *every* governed route to a
stage pass through some other stage. **It holds no transition of its own** — hand it an empty
policy and it knows nothing, which is unit-tested. Seven stages and ten edges, computed inline; no
state-machine library and no workflow engine.

**Five invariants, each earned by available evidence.** A retained move the policy forbids · a
stage entered before the Lead existed · acceptance recorded before the Lead existed · a
conversion dated before the Lead existed · evidence for a stage the policy gives no route from to
the current one · and evidence absent for a stage every governed route must cross. A sixth
candidate — re-testing qualification quality — was **not** implemented, because that is the MQL
control's job.

**The line between a breach and a blind spot, drawn without inventing a date.** A transition the
policy forbids is a **failure** only on a record the safeguard actually ran on. How that is known:
the Flow stamps `Lifecycle_Stage_Entered__c` on every transition it governs, so its absence is the
record's own proof that governance never applied to it. **No effective date exists in code, in
metadata, or in the control.** The record decides.

**What that produced live: 15 evaluated, 0 failing, 6 unmeasurable, 28 outside.**

And the six unmeasurable are the point of the whole increment. Three of them carry **real, retained
transitions the governed policy does not permit**: two Leads reopened from
`Closed - Not Converted → Working - Contacted`, and one stepped backwards
`Working - Contacted → Open - Not Contacted`. NorthstarIQ surfaces the exact moves — and
declines to call them violations, because the rules did not exist when they happened. The other
three are the `Closed - Converted` records, which every governed route reaches through SQL, SAL and
MQL, none of whose evidence existed then.

**That restraint is the deliverable.** The control could trivially have reported three violations and
produced a satisfying finding. It reports what it can prove and names what it cannot, which is the
difference between a diagnostic tool and a plausible-looking one.

**Failing safely.** A missing policy, a policy with no active records, a transition record missing a
stage, and a policy where every stage has an inbound transition (so no lifecycle can begin) all
**throw**. An unreadable governed model is a diagnostic failure, never a population that all passes.

**Not duplicating Opportunity Conversion Integrity.** The three `Closed - Converted` /
`IsConverted = false` contradictions appear in both controls' populations, but reach different
verdicts for different reasons: the conversion control **fails** them on the platform fact, while
this one reports them **unmeasurable** on the absence of progression evidence. Two questions, two
answers, no duplicate finding — and this control never asserts the conversion contradiction, which
is the other control's to report.

**Status: Implemented and Validated, unscored.** Lifecycle Governance now holds **two** of its four
approved controls plus Opportunity Conversion Integrity, all three implemented-but-unscored. Sales
Acceptance / SQL Integrity remains **planned and unbuilt**. Assessment Model v1 unchanged at
**62 — 5 areas, 7 scored controls**.

---

### 2026-08-27 — Sales Acceptance / SQL Integrity: one control, two business events

```
Requirement:   BR-15 (handoff governed and recorded), BR-16, BR-17, PD-12, PD-14.
               Lifecycle Governance detective control 3 of 4.
Repository:    NEW  web/lib/checks/sales-qualification-policy.ts - two policies,
                    and the readers for the evidence they leave behind
               NEW  web/test/sales-acceptance-sql.test.ts          - 37 scenarios
               MOD  checks/index.ts, soql.ts, types.ts, assessment.ts,
                    presentation.ts, traceability.ts, export-model.ts,
                    test/fixtures.ts
               MOD  docs/architecture.md, docs/data-model.md,
                    docs/testing-strategy.md, docs/implementation-log.md
Salesforce:    0 metadata changes. 0 deployments. 0 record mutations.
               READ-ONLY throughout.
Validation:    37/37 targeted, 150/150 full suite, tsc clean, live read-only run.
               Assessment: 62, 5 areas, 7 controls, 7 findings - UNCHANGED.
Commit:        NOT COMMITTED - held for human review
```

**IMPLEMENTED · DETECTIVE · DELIBERATELY UNSCORED.** Absent from `CHECK_IDS` and `runAllChecks`,
like the three controls before it. Lifecycle Governance is still not an active Assessment Area and
Model v2 is still not activated.

**One control, because the reader asks one question — and two evaluations, because the business has
two events.** SAL is Sales acknowledging a handoff: a named person took responsibility, at a
recorded time, for a Marketing claim that was itself substantiated. SQL is what Sales learned
*afterwards*: a business problem confirmed with the prospect, and an agreed forward step. Splitting
these into two scored controls would have inflated the control count; merging them into one generic
"qualification" idea would have hidden the step Sales is actually accountable for. They are
evaluated separately, against their own policies, and roll into **one population, one failing set,
one finding.**

**The evidence investigation came first, and it decided what the control could honestly claim.**
Across the 49 baseline Leads: **0 at MQL, 0 at SAL, 0 at SQL**; `MQL_Basis__c`,
`Sales_Accepted_At__c`, `Sales_Accepted_By__c`, `Sales_Acceptance_Basis__c`, `SQL_Basis__c`,
`Qualified_Need__c`, `Next_Step_Date__c` and `Lifecycle_Stage_Entered__c` all **empty on every
record**; `Sales_Accepted__c` ticked on **none**; and **no retained Status transition into SAL or
SQL**. No baseline Lead has ever been through the governed handoff. The control was built knowing
its live population would be empty, rather than discovering it afterwards.

**Two policies are consumed, neither is copied.** `Sales_Acceptance_Policy__mdt` v1.0 declares
explicit acceptance and substantiated MQL evidence; `SQL_Qualification_Policy__mdt` v1.0 declares
substantiated acceptance, a confirmed need and an agreed next step. Both are read at assessment
time — the same two records `Lead_Inbound_Before_Save` consults. **Switch a requirement off in
Salesforce and the control stops testing it, with no code change**, which is unit-tested three
different ways.

**MQL is consumed, never re-evaluated.** `MQL_Basis__c` is tested for presence and nothing else.
Source, segment, territory and match are never re-read here — whether the Marketing qualification
was itself valid belongs to MQL Qualification Integrity, and duplicating it would have produced two
findings for one defect.

**Input is not evidence, and the distinction is load-bearing.** `Sales_Accepted__c` is a checkbox a
seller ticks; `Qualified_Need__c` and `Next_Step_Date__c` are fields they edit. All three describe
the Lead **now**, not the moment the decision was made. The control judges the immutable,
automation-written basis fields instead, and reads the need and the next-step date **back out of
`SQL_Basis__c`** where the Flow recorded them as they stood. A ticked checkbox on a Lead with no
acceptance evidence is reported **unmeasurable, never a pass** — and `First_Touch_DateTime__c` is
never read at all, because a seller working a Lead is activity, not Sales accepting a handoff.

**The historical next-step problem, solved rather than avoided.** The preventive gate required
`Next_Step_Date__c >= TODAY` **at qualification**, so a correctly qualified Lead's date inevitably
falls into the past. **The detective control never compares against TODAY.** It reads the recorded
date out of `SQL_Basis__c`, establishes when the Lead entered SQL — from `Lifecycle_Stage_Entered__c`
while it still sits there, otherwise from a retained transition into SQL — and fails the record only
when the recorded date was already past **on the recorded qualification date**. Where that event
cannot be established, the requirement is reported **unmeasurable**. The unit fixtures use dates
that are already historical, and one test asserts that they are, so a regression to
TODAY-comparison cannot pass silently.

**The line between a breach and a blind spot, drawn without inventing a date.** A record is governed
for acceptance when it carries `Sales_Accepted_At__c`, and governed for qualification when it
carries `SQL_Basis__c` — the Flow is the only writer of either, so their presence is the record's
own proof the safeguard ran and their absence is proof it did not. **No effective date exists in
code, in metadata, or in the control.** `2026-08-27` appears nowhere as a policy boundary.

**What that produced live: 0 evaluated, 0 failing, 3 unmeasurable, 46 outside.**

The 46 outside claim neither the handoff nor sales qualification. The 3 unmeasurable are the
`Closed - Converted` records, which under the governed lifecycle claim both SAL and SQL by status
and carry none of the evidence either claim requires. **An empty evaluated population is the correct
result and it is stated plainly.** No Lead was created in the org to manufacture a finding, and no
evidence standard was weakened to produce one — failure detection is proven by 37 fixture
scenarios instead, which is what fixtures are for.

**Failing safely.** A missing acceptance policy, a missing SQL policy, two active records of either,
and a policy naming no governed stage all **throw**. An unreadable governed definition is a
diagnostic failure, never a population that all passes — the same contract the MQL and lifecycle
policies already carry, reusing their pattern rather than adding a second error architecture.

**Not duplicating its neighbours.** Lifecycle Progression Integrity reasons from the transition
graph about whether a record could have reached where it stands; this reasons from the two sales
policies about whether the evidence for the claim holds together. Opportunity Conversion Integrity
owns `Status` versus `IsConverted`; this control never asserts that contradiction, and a converted
Lead is in scope here only because acceptance and qualification evidence deliberately survive
conversion. The three `Closed - Converted` records appear in all three populations and reach three
different verdicts for three different reasons.

**Status: Implemented and Validated, unscored.** Lifecycle Governance now holds **three** of its
four approved controls plus Opportunity Conversion Integrity — all four implemented-but-unscored.
Assessment Model v1 unchanged at **62 — 5 areas, 7 scored controls, 7 findings**, verified by a live
run after implementation.

⚠️ **Known stale statement carried forward, not corrected here.** Opportunity Conversion Integrity's
traceability record still describes the preventive half of that control as proposed and not built,
which the lifecycle transition safeguard has since overtaken. That truth-sync is the **next**
increment and is deliberately out of scope for this one.

> **Resolved in the next increment, same day** — see *Opportunity Conversion Integrity:
> truth-sync, and the lifecycle set closes* below.

---

### 2026-08-27 — Opportunity Conversion Integrity: truth-sync, and the lifecycle set closes

```
Requirement:   BR-15. Reconciliation only. Lifecycle Governance control 4 of 4,
               already implemented and validated - NOT reimplemented here.
Repository:    MOD  web/lib/presentation.ts     - stale safeguard copy
               MOD  web/lib/traceability.ts     - safeguard + evidence roles
               MOD  web/lib/checks/index.ts     - doc comment, one evidence column
               MOD  web/test/checks.test.ts     - assert the added column
               MOD  docs/data-model.md, docs/testing-strategy.md,
                    docs/implementation-log.md
Detector:      EVALUATION LOGIC UNCHANGED. Not one predicate was rewritten.
Salesforce:    0 metadata changes. 0 deployments. 0 record mutations.
               READ-ONLY throughout. No conversion fixture re-run.
Validation:    150/150 full suite, tsc clean, all four lifecycle controls
               executed read-only against the org.
               Assessment: 62, 5 areas, 7 controls, 7 findings - UNCHANGED.
Commit:        NOT COMMITTED - held for human review
```

**This increment changed no behaviour. It changed what the repository claims.**

**The stale claims, and why they were false.** Two statements in the application described
Opportunity Conversion Integrity's preventive half as unbuilt:

| Where | Said | Truth since 2026-08-27 |
|---|---|---|
| `traceability.ts` | *"the preventive half of this control is proposed and not built"* | The safeguard exists and was validated |
| `presentation.ts` | *"A preventive safeguard is part of the proposed lifecycle foundation and is **not built**"*, under the heading *"Nothing in Salesforce prevents the claim"*, `kind: 'detective'` | `Lifecycle_Transition__mdt` + `Lead_Inbound_Before_Save` prevent an unsupported transition into the converted stage, **including through native Lead Conversion** |

Both were written before the native-conversion experiment ran. The experiment answered the question
the same day and nothing went back to correct the copy. **That is the whole defect this increment
fixes** — the repository was understating what it had built, which is a less common failure than
overstating it and no more acceptable.

**A third stale claim was found in `data-model.md`, and it was worse than out of date — it named
the wrong control.** It said Opportunity Conversion Integrity *"is designed to read these
[`Lifecycle_Transition__mdt`] records rather than its own copy."* It does not, and should not. That
sentence describes **Lifecycle Progression Integrity**, which did not exist when it was written.
Corrected, because it blurs the exact boundary this increment exists to make legible.

**Four roles, now stated separately everywhere they appear.**

| Role | Owner |
|---|---|
| Did conversion actually happen? | Salesforce platform fields — `IsConverted`, and in the same transaction `ConvertedDate`, `ConvertedAccountId`, `ConvertedContactId` |
| Was entry into the converted stage permitted? | `Lifecycle_Transition__mdt` |
| What enforces that permission? | `Lead_Inbound_Before_Save` — the preventive safeguard |
| What finds claims that already contradict the platform? | Opportunity Conversion Integrity — the detective control |

**The detector was inspected and deliberately left alone.** Its population is Leads whose `Status`
claims conversion; its failing predicate is `IsConverted = false`. `ConvertedOpportunityId` is
**not** required, was never required, and is unit-tested as never being a failure — Salesforce's own
conversion screen offers *"don't create an opportunity"*. No predicate changed.

**One presentation change inside the detector, and the reason for it.** The evidence table showed
Converted Date, Account and Opportunity, with Contact absent — an ordering that quietly reads as
though the Opportunity were the expected companion to the Account. Conversion always produces an
Account **and** a Contact; only the Opportunity is optional. A `Converted Contact` column was added
and the Opportunity column relabelled *"Converted Opportunity (optional)"*. **Display only** — the
failing predicate is untouched, and the existing column test was extended rather than a new one
invented.

**Prior validated evidence, not evidence created here.** The allowed and blocked native conversions
were established on **2026-08-27 by the conversion experiment**, using two purpose-built fixtures
that were deleted afterwards, with zero baseline records mutated. This increment **re-ran nothing**
and created no fixture. Where that evidence now appears in operator-facing copy it is labelled as
prior validation, and the detective control is still stated as having played no part in it.

**History was annotated, not rewritten.** The dated *"Salesforce Lead conversion: UNVERIFIED"*
section already carried a RESOLVED banner and was left exactly as written. A limitation paragraph in
`testing-strategy.md` §2i — *"only one of the four Lifecycle Governance controls exists"* — was true
when written and has been given a **Superseded** pointer to §2n, §2o and §2p rather than being
edited. The `63 tests` snapshot in that section is likewise left alone: it records what passed during
that increment, and overwriting it with today's 150 would destroy evidence rather than update it.

**Severity left at High, on purpose.** The three newer lifecycle controls are Medium because they
report an evidence chain that cannot be substantiated. This one reports a **direct contradiction of
a platform fact** — the status says converted and Salesforce says it was not — which is a stronger
claim and stays High. It was reviewed and deliberately not levelled down for consistency.

**The cross-control result is the architecture proof, and it came from execution rather than
assumption.** The same three baseline Leads, read by all four controls in one run:

| Control | Verdict on the three `Closed - Converted` records | Why |
|---|---|---|
| Lifecycle Progression Integrity | **unmeasurable** | Every governed route to the converted stage crosses MQL, SAL and SQL; none of that evidence existed when these records were created |
| MQL Qualification Integrity | **unmeasurable** | No `MQL_Basis__c` — the claim predates the qualification architecture |
| Sales Acceptance / SQL Integrity | **unmeasurable** | No acceptance or qualification evidence — the claim predates that architecture too |
| **Opportunity Conversion Integrity** | **FAIL** | Conversion truth needs none of that history. `IsConverted = false` contradicts the claim on its own |

**Three controls decline to judge and one convicts, on the same three records — and that is
correct.** Conversion integrity does not depend on reconstructing the lifecycle that preceded it,
which is exactly why it is a separate control. Forcing the four to agree would have destroyed the
distinction.

**Live result: 3 evaluated, 3 failing, score 0, one finding.** Unchanged by this increment, and
still unscored. The three records are preserved untouched — `LastModifiedDate` still 2026-08-17 —
and the copy now says plainly that **the safeguard could not have prevented them**: it governs new
transitions, and these already held the state when it was built. Prevention stops new ones;
detection finds the ones already there.

**Status: the lifecycle control set is complete and truth-current.** Four controls, all implemented,
all validated, **all unscored**. Assessment Model v1 unchanged at **62 — 5 areas, 7 scored controls,
7 findings**, verified by a live run after the sync. Activating Lifecycle Governance remains a
user-visible scoring change held for human approval.

---

### 2026-08-28 — Pre-commit corrections from the accumulated working-tree review

```
Requirement:   None new. Corrections raised by the checkpoint diff review.
Repository:    MOD  web/test/sales-acceptance-sql.test.ts - synthetic User Id
               MOD  .gitignore                            - design-references/
               MOD  README.md, docs/architecture.md       - current test counts
               MOD  permissionsets/NIQ_Revenue_Operations - 2 read-only grants
               MOD  docs/security-model.md                - FLS table + note
Salesforce:    0 metadata deployments. 0 record mutations. 0 queries.
               The permission-set correction is REPOSITORY ONLY - NOT DEPLOYED.
Validation:    150/150 full suite, tsc clean, validator unchanged.
Commit:        NOT COMMITTED - held for human review
```

**A real org identifier had reached a fixture.** `sales-acceptance-sql.test.ts` carried the live
Developer Edition administrator's own User Id as the accepting user, copied from an org display
while the control was being written. The value is deliberately not reproduced here — recording
that it was removed does not require printing it again. Replaced with `005000000000001`,
matching the synthetic shape the Account, Contact and Opportunity fixtures already use. No assertion
changed; the value is only ever compared for presence. **This is the data rule working as intended:
the repository is fictional-only, and an Id that identifies a real principal is not fixture data
however harmless it looks.**

**Two other real identifiers were found and deliberately kept.** `0Afaj00000iD2gzCAC` and
`0Afaj00000iBRBeCAO` are Salesforce **deploy request Ids** recorded in a dated entry above. They are
not fixture data and not credentials — they are the audit trail of a deployment that actually
happened, and a reviewer can chase them. Rewriting them would remove evidence, not protect anything.

**The design mockups stay local.** `design-references/` holds roughly 5 MB of PNG the assessment UI
was built against. Nothing in the repository reads them — no document, no component, no validator —
and the repository tracks no other binary. A directory-scoped ignore keeps them on disk and out of
Git. **Deliberately not a blanket `*.png` rule**, which would also silence a future architecture
diagram — a different decision, and not this one's to make.

**Three current-state test counts were stale, and the historical ones were left alone.** The README
claimed 63 and 50 unit tests and `architecture.md` claimed 50/50; the suite is **150**. Corrected,
with the wording widened to say what those tests now cover. The dated snapshots — `50/50` in the
Increments 1-4 row, `63 tests` in `testing-strategy.md` §2i — are **untouched**: they record what
passed during those increments, and overwriting them with today's number would destroy evidence
rather than update it.

**The `NIQ_Revenue_Operations` FLS gap was an omission, and the artifacts prove it.** The permission
set already grants read on every other piece of system-generated Lead evidence —
`Segment_Basis__c`, `Routing_Reason__c`, `SLA_Basis__c`, `Exception_Type__c`,
`Data_Quality_Detail__c`, `Sales_Accepted_At__c`, `_By__c`, `Sales_Acceptance_Basis__c` and
`SQL_Basis__c` — twenty-two Lead fields in total. It was missing exactly two: `MQL_Basis__c` and
`Lifecycle_Stage_Entered__c`, the fields created by the two *earliest* lifecycle increments, which
did not update this permission set. The later acceptance and SQL increments did.

**The business need was tested per field rather than assumed from symmetry.** RevOps (`PER-01`)
resolves routing exceptions and duplicate review and works queues. `Sales_Acceptance_Basis__c`,
which it already reads, literally says *"Marketing handoff substantiated by MQL evidence"* — an
evidence chain pointing at a field the same persona could not open. And a stage-entry timestamp is
ordinary triage information for someone deciding how long a record has been sitting in a queue,
alongside the SLA and first-touch timestamps it already reads. Both granted **`readable=true`,
`editable=false`**, like every other evidence field: read to investigate, never to assert.

**Repository only.** The permission set in the org is unchanged. Correcting source does not authorise
a deployment, and none was made — the org was not contacted at all during this increment.

**Nothing else was touched.** No lifecycle definition, no policy record, no Flow, no detector, no
`CHECK_IDS`, no `runAllChecks`, no scoring, no UI, no dependency. Assessment Model v1 remains
**62 — 5 areas, 7 scored controls, 7 findings**, and Model v2 remains not started.

---

### 2026-08-28 — Assessment Model v2: a score reports what was judged, and says what it could not

```
Requirement:   Human-approved scoring decision (Candidate D). Lifecycle
               Governance activation as Assessment Area #6.
Repository:    NEW  web/test/model-v2.test.ts              - 8 model scenarios
               MOD  types.ts, score.ts, checks/index.ts, assessment.ts,
                    presentation.ts, export-model.ts,
                    AssessmentPanel.tsx, ScoreMeter.tsx, RunAssessment.tsx,
                    findings/[checkId]/page.tsx, globals.css, package.json,
                    test/fixtures.ts + 4 existing test files
               MOD  README.md, docs/architecture.md, docs/testing-strategy.md,
                    docs/implementation-log.md
Salesforce:    0 metadata changes. 0 deployments. 0 record mutations.
               One read-only assessment run for validation.
Validation:    166/166 unit tests, tsc clean, production build clean,
               live read-only run: 60, 6 areas, 11 controls, 8 findings.
Commit:        NOT COMMITTED - held for human review
```

**Model v2 is two changes, and calling it one would be the first dishonest thing
about it.** It adds Lifecycle Governance as a sixth equally-weighted area, and it
changes what a control with nothing to evaluate is worth: **Model v1 scored it 100;
v2 leaves it unscored.**

**The second change is the one that mattered.** Two of the four lifecycle controls
evaluate zero records against the live baseline, because the evidence architecture
postdates every Lead in it. Under the old contract they would each have contributed
**100** — a perfect score for a population neither of them judged — the area would
have read **75**, and overall health would have **risen from 62 to 64** on the
strength of activating a control that fails every record it judges. A scoring system
in which discovering a failure improves the score is not defensible at any level of
explanation, so the contract changed before the controls were activated.

**The rule, in one sentence.** A score is the mean of what was actually scored: a
control that judged no record has no score, an area made only of such controls has
no score, and neither is averaged in as a number. What is left out is reported as
coverage rather than absorbed.

**What a score now means, fixed in place.** `100` = no demonstrated failures **among
the records NorthstarIQ could evaluate** — not proof the control is healthy across
the population. `0` = every record it could evaluate failed. `Not scored` = it
reached no pass or fail, which is neither, and which sits outside the score bands
entirely rather than being coloured into one of them.

**Two reasons, no numeric difference.** *Insufficient evidence* — records the
control applies to exist and carry nothing it can judge. *No applicable records* —
nothing is in scope at all. A coverage gap and a boundary working as intended are
different facts about the org, and the reason is what tells them apart. Both are
simply unscored.

**Live result: Overall 60, six areas, eleven controls, eight findings.** Lifecycle
Governance scores **50** — the mean of progression at 100 and conversion at 0 — with
**2 of 4 controls scored** shown beside it, so the number is never read without
knowing how much of the area stands behind it. **The seven original controls
returned identical scores to their v1 run**: 63, 96, 75, 50, 89, 89, 7. Activation
moved nothing it was not supposed to move.

**62 and 60 are not comparable, and the drop is not a decline.** Different weighting,
different eligibility, same org. Every result now carries `modelVersion`, one
constant in `score.ts` beside the area list that defines what a version *is*, and
the export repeats the warning so a file opened months later cannot be misread.

**The UI says three things it did not say before.** Which records *could not be
evaluated* as distinct from *not applicable* — the application has always known the
difference and was collapsing it into one "not evaluated" count. That the overall
mean is across **scored** areas, not reported ones. And, quietly, which model
produced the number.

**TypeScript did the safety work.** Making `score` nullable turned every consumer
into a compiler error - twenty of them - so no screen, export or API path could
silently keep rendering a fabricated 100. Nothing was silenced with `any`, a
non-null assertion or a suppression comment; each site decided what to show.

**Three dead functions went with it.** `runMqlQualificationIntegrity`,
`runLifecycleProgressionIntegrity` and `runSalesAcceptanceSqlIntegrity` existed to
execute one lifecycle control outside `runAllChecks` while the area was unscored.
All four are now ordinary members of the assessment, so a second execution path
would only be a second answer waiting to disagree with the first.

**No detector algorithm changed.** Not one predicate in the eleven controls was
rewritten. They were built to be scored and were held back only because activating
them moved the model.

**Not built:** configurable weights, a model registry, assessment history, a v1/v2
comparison view, confidence scores, pooled record denominators, a new findings
severity, or any new dependency. The scoring change is three rules and one constant.

⚠️ **The `NIQ_Revenue_Operations` FLS correction remains undeployed** and was not
touched here. It is a separate source→org synchronisation task and stays
independently auditable.

---

### 2026-08-28 — Lifecycle evidence FLS: the source→org gap closes

```
Requirement:   BR-18, SP-4. Synchronisation only - no new access was designed.
Repository:    MOD  docs/security-model.md - two truth-status statements
               NO Salesforce source metadata changed. The permission set was
               already correct and committed at f285417.
Salesforce:    1 metadata deployment. 0 record mutations. 0 field changes,
               0 Flow changes, 0 policy changes, 0 assignment changes.
Deployment:    Validate-only 0Afaj00000iG9znCAC - Succeeded, 1/1, 0 errors.
               Deploy       0Afaj00000iGpusCAC - Succeeded, 1/1, 0 errors.
               Component: PermissionSet:NIQ_Revenue_Operations (one file).
Validation:    Org read back independently: 2 field permissions added, 0 removed,
               0 changed. Org now byte-identical to source on all 31 grants.
               Assessment regression: 60, 6 areas, 11 controls, 8 findings.
Commit:        NOT COMMITTED - held for human review
```

**Nothing was designed in this increment.** `NIQ_Revenue_Operations` gained read on
`Lead.MQL_Basis__c` and `Lead.Lifecycle_Stage_Entered__c` in the pre-commit corrections of
2026-08-28, was reviewed there, and was committed at `f285417` **as source only**. That entry above
says so, and it stays as written: the permission genuinely did not exist in the org at that
checkpoint. This entry records the deployment that closed the gap.

**The mismatch was measured before deploying, not assumed.** Every one of the 31 field permissions
in the source file was compared against `FieldPermissions` in the org. **29 matched exactly. Two
were absent.** Nothing existed in the org that was missing from source, and nothing differed. The
delta was precisely the two approved grants, which is what made a targeted deployment safe.

**Deployed one named component, not a directory.** `--metadata PermissionSet:NIQ_Revenue_Operations`
rather than `force-app/main/default`, so the deployment could not carry anything that happened to be
uncommitted elsewhere. A validate-only run went first and reported the same 1/1.

**Verified by reading the org back, not by trusting the deployment result.** After the deploy the
same comparison shows **2 added, 0 removed, 0 changed**, both `readable=true, editable=false`, and
the org identical to source across all 31 grants.

**Least privilege, checked rather than asserted.** The permission set holds **zero object
permissions** and **zero user permissions** — `ModifyAllData`, `ViewAllData`, `ManageUsers` and
`AuthorApex` are all false. It grants nothing on `Lead.Status`, `Lead.OwnerId`,
`Opportunity.Amount` or `Opportunity.StageName`. All six system-generated lifecycle evidence fields
are read-only in it, and the only ten editable grants are the pre-existing seller and routing inputs,
unchanged by this deployment. No assignment was created or altered.

**Read access proven end to end.** Before the deployment, `SELECT COUNT(MQL_Basis__c) FROM Lead` as
the assigned administrator returned `INVALID_FIELD`. After it, the same query returns 49 Leads with
0 populated. The grant is doing real work, and the before/after is the evidence.

⚠️ **The write restriction is proven in metadata, not in flight.** No principal in the org grants
`edit` on either field: all three grantors are `read=true, edit=false`, and no profile grants them at
all. But the only assignee of `NIQ_Revenue_Operations` holds a System Administrator profile with
`Modify All Data`, so a platform describe reports the fields updateable for that composed identity —
a property of the profile, not of this permission set. **No DML was attempted and no record was
mutated to test it.** Demonstrating the restriction in flight needs a representative non-admin
principal, which this increment was not authorised to create.

**NorthstarIQ is unaffected, as an FLS-only change should be.** The read-only assessment returns
exactly the Model v2 baseline: **overall 60, 6 assessment areas, 11 controls, 8 findings**,
Lifecycle Governance **50** at **2 of 4 controls scored**, with MQL Qualification Integrity and Sales
Acceptance / SQL Integrity both **Not Scored — insufficient evidence**. Every control's populations
are unchanged. No assessment logic was touched.

⚠️ **A separate documentation defect was found, raised, and then corrected on review.**
[`security-model.md`](security-model.md) described `NIQ_Revenue_Operations` as *deployed but
unassigned* in three places. It is in fact assigned to the practitioner's System Administrator user,
and has been since **2026-08-22T18:20:56Z** — four days before this increment. **No assignment
change occurred during this validation**; the claim was simply already inaccurate when written. The
three statements now say the sharper thing: the permission set is assigned, but only to an
administrator whose profile carries `Modify All Data`, so that assignment cannot demonstrate least
privilege and **runtime validation through a representative non-admin RevOps principal remains
outstanding**. `NIQ_Rule_Configuration` is genuinely still unassigned and is described that way.

---

### 2026-08-31 — Dashboard and Assessment: one page each, and a route that stops changing identity

Requirement: no new `BR-##`. This is presentation and route architecture over capabilities already
built and already recorded above; no control, population, calculation or Salesforce component was
added or altered by it.

**What changed, in the application only.** The Dashboard became the application homepage and now
holds **one architecture at all times**. It previously branched: before an assessment it showed a
first-run page, and after one it replaced itself with a different completed-assessment page. That
two-state model is retired. Completing a run now changes only what the same page can truthfully
state — the last-assessed time, the action label, and the one summary figure that counts areas
raising findings.

The richer post-assessment experience moved to `/assessment`, which is a route in its own right for
the first time: completion summary, the governed lifecycle in full, the Revenue Operations areas,
the top priorities, the connection snapshot and the recommended next step. Findings gained an area
index and a list of controls that ran without raising anything, so the page accounts for the whole
suite rather than only its failures. The shell dropped its status header, self-hosts Inter through
`next/font`, and the rail was restructured to match the routes that now exist.

Supporting source: `assessment-store` holds the one completed run so both routes read the same
result; `dashboard`, `assessment-view` and `lifecycle-journey` derive what each surface shows;
`record-url` was extracted so the browser and the `server-only` Salesforce module share one rule.
`RecordRef` gained `context` and `state`, and `ControlSummary` now carries the `exclusionBreakdown`
each detector had already been computing — so a control that reached no verdict can say *which*
evidence was missing rather than only that it was.

**Nothing was re-decided.** Every figure on both pages is counted from the assessment result the
engine already produced. No population is recomputed, no severity reassigned, no priority ranked
here, and **no score is displayed** — the engine still computes one internally and the interface
shows none, as `CLAUDE.md` §10 requires.

**Status: Implemented.** It exists in source control. It is **not deployed** — there is still no
hosting project, no environment configuration and no URL — and this entry claims nothing about
deployed behaviour.

Validation executed on 2026-08-31, in this working tree, with the results as recorded:

- `npx tsc --noEmit` — clean, exit 0.
- `npm test` — **264 of 264 passing**, over fixtures, with no network and no org. Sixty-three of
  those are new with this work, covering the Dashboard derivations, the Assessment lifecycle view
  and the display-name contract.
- `scripts/powershell/Test-RepositoryStructure.ps1` — 50 passed, 0 warnings, 0 failed, exit 0.
- Route health against the local development server — `/`, `/assessment`, `/findings` and
  `/integrations` each returned HTTP 200.
- The homepage was reconciled against its approved design reference by rendering and comparing, not
  by reading source. One material defect was found and corrected: within a row of the coverage grid,
  the six cells stretch to the tallest, and the default `align-content` distributed that spare
  height *between* each cell's two rows, so three questions on one row began at three different
  heights — measured at 190 / 200 / 210 and 354 / 364 / 344 before, and identical within each row
  after.

**What this validation does not establish.** The suite runs against fixtures, so it proves the
derivations and the presentation contract, not behaviour against the designed ~190-record dataset,
which still does not exist. HTTP 200 from a development server establishes that each route renders,
not that any Salesforce control behaves correctly. **No Salesforce control was exercised by any of
this**, and no Salesforce metadata, record or configuration was touched. No dependency was added.

⚠️ **Provenance of the design evidence.** The tracked design-authority manifest at
`.claude/design-authority.md` did not exist for most of this work. It was created later, as part of
a separate governance increment, and it governed **only the final homepage reconciliation described
above**. Earlier visual passes in this increment were performed against the reference images
directly, before that manifest existed. This entry does not claim the manifest governed them.

**Not committed at the time of writing.** This entry records work that is complete and validated in
the working tree; the commit hash is therefore absent rather than invented, and will be recorded
when the change is committed.

---

### 2026-08-31 — Repository validator: a gate that could not be green was a gate nobody read

Requirement: no `BR-##`. Repository tooling.

**Why it needed repair.** `Test-RepositoryStructure.ps1` is the repository's only executable
governance control, and `scripts/README.md` instructs that it be run before every commit. It had
been failing two of its checks continuously, and **neither failure could be cleared by any change to
the repository**.

**The false positives were machine-local Salesforce CLI state.** The security check tested whether
`.sf/` or `.sfdx/` were *present on disk*. `sf org login` writes `.sf/` into the working directory,
so the check could only pass while the org was unauthenticated — it forbade the project's own
critical path. Separately, the deferred-technology scope scan read the CLI's metadata cache, which
names Data Cloud fields because Salesforce has them; that is a fact about the platform, not a scope
decision by this project. A control that is permanently red teaches everyone to skip it, which is
worse than no control.

**The repair drew the line the file had blurred: durable invariants are asserted, mutable state is
reported.** The security check now asks whether an auth artifact is **visible to git** rather than
present on disk — the same standard the adjacent `.env` check already applied and had reasoned out
in a comment. The scope scan excludes local CLI tooling state, kept deliberately separate from the
credential-content scan so that a cached auth URL would still be found. Four assertions that encoded
a moment rather than a rule were converted to reported facts: the approved-Flow list, the assertion
that no dataset had been generated, and two required-artifact dependencies. A section was added that
states whether continuous integration actually exists, because the previous check certified the
*shape* of CI while an empty directory satisfied it. The Apex and custom-UI boundary was **kept as a
failing assertion** — that is a durable architectural commitment, not a phase.

**Validation executed.** Before the repair: **50 passed · 0 warnings · 2 failed**, exit 1. After:
**50 passed · 0 warnings · 0 failed**, exit 0. Two assertions were removed and two failing ones
became passing by correcting their test.

**The security control was verified to still fail in the direction that matters**, rather than
merely made green: `git check-ignore` was run against each path, confirming that an ignored auth
artifact passes while a git-visible one would be reported. Three further controls cover the same
risk unchanged — the credential-content scan still reads those paths, `.gitignore` coverage is still
asserted, and no auth file is tracked.

**No application or Salesforce behaviour was changed.** This touched one PowerShell script. No
application test or type check was run, because neither could produce evidence about it.

---

### 2026-08-31 — An AI engineering operating model, and the first short prompt that tested it

Requirement: no `BR-##`. Engineering governance, and deliberate portfolio evidence of how
AI-assisted work on this repository is directed.

**The problem it addresses.** Governance was being re-stated in each task prompt — approval gates,
honesty rules, scope discipline, git safety, the visual-comparison procedure — while the repository's
own documents carried mutable facts that had gone stale. A prior read-only audit established that
the repository had strong principles and almost no mechanism, and that its declared source of truth
had fallen behind the source tree.

**Four layers, each owning one thing.** The **universal** standard at `~/.claude/CLAUDE.md` holds
project-independent engineering behaviour and lives outside this repository. The **repository**
`CLAUDE.md` was rewritten to hold only what must be known *because the work is NorthstarIQ*,
inheriting the universal layer rather than repeating it. **Four reusable procedures** under
`.claude/skills/` capture the workflows that were being re-typed: context discovery before a
consequential change, visual fidelity against approved design, read-only Salesforce inspection, and
pre-commit evidence review. The **task prompt** then supplies only objective, scope, acceptance
criteria and stop point.

**A tracked design-authority manifest.** `.claude/design-authority.md` records which local reference
image governs which route, its checksum, what it governs, and — the part that earns its keep — the
elements inside each approved image that are historical and govern nothing. The images themselves
stay git-ignored; the mapping is version-controlled, so it survives a clone that has no artwork.
This exists because a reference had previously been renamed and its page identity changed, and
filename alone had twice been treated as authority.

**Governance is proportional to consequence.** Four risk tiers scale context, evidence, recovery and
approval requirements from read-only inspection up to external and destructive work. Risk
classification and approval policy are kept distinct: an action can be technically low-risk and
still gated. Read-only inspection — including Salesforce inspection through existing least-privilege
access — proceeds without further authorisation.

**Protected boundaries were narrowed in scope, not weakened.** Explicit approval remains required
before Salesforce authentication, deployment, metadata or record mutation, data loading, permission
or sharing changes, destructive operations, dependency changes, environment deployment, **commit**,
and **push** — with commit and push as separate approvals, neither implied by the other. The old
numeric complexity envelope was replaced by business-justified complexity, and the fixed
implementation ladder by requirement-driven design; **no Apex was created**.

**Status: Implemented.** The instruction layers, the manifest and the four procedures exist in
source control.

**Validated by one executed acceptance test.** A deliberately short prompt asked for the Homepage to
be compared against its approved design authority and corrected, naming only the outcome, the
non-goals and the stop point. The model supplied the rest: the manifest was read before the image,
its checksum verified against the recorded value, its known deviations read before comparison, a
baseline captured, blast radius checked, one bounded change made, the result verified by rendering
and measurement, validation selected by risk rather than by directory, and the work stopped before
commit. **Five differences from the approved screenshot were resolved without stopping** — the
situation that had previously produced two blocked reports. One material defect was found and
corrected. The repository validator returned 50 passed, 0 warnings, 0 failed.

**What that test does not establish.** It exercised one procedure on one bounded task. The Salesforce
inspection and context discovery procedures have not yet been exercised end to end, and no
conclusion is drawn here about how the model behaves on consequential business-behaviour work.

⚠️ **Provenance.** This operating model was created **after** most of the application work recorded
in the preceding entries, and it governed none of it. The one exception is stated in the
Dashboard/Assessment entry above: the design-authority manifest governed the final homepage
reconciliation only. Earlier increments were directed by the task prompts preserved under
`prompts/`, and nothing here should be read as retroactive governance of them.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

---

### 2026-09-01 — Controlled lifecycle validation: the governed lifecycle is exercised end to end

Requirement: `BR-15`, `BR-16`, `BR-17`, `PD-09`, `PD-12`, `PD-14`.
Metadata: **none created or modified.** No Flow change, no Custom Metadata change, no field change,
no permission change.
Validation: four controlled synthetic Lead fixtures, four deliberate preventive rejections, one
native Salesforce Lead Conversion, five read-only NorthstarIQ assessment checkpoints.

**Implemented before this validation, and unchanged by it.** The governed lifecycle taxonomy, the
seven Custom Metadata Types and their governed records, the before-save Flow with its transition and
three qualification gates, the lifecycle evidence fields, and all four NorthstarIQ detective
controls already existed and were already in source control. Source-versus-deployed parity had been
verified read-only on 2026-08-31 — the Custom Metadata Types, their field definitions, their
governed records and the active Flow all matched source. **This entry adds no capability. It records
behaviour.**

**Validated during this execution — and only this.** That the deployed safeguard refuses the
unsupported cases and rolls them back; that a Lead satisfying the active policies progresses through
every governed stage and converts natively; that the four detective controls independently reach the
correct verdict on the resulting records. Nothing else.

#### The validation chain

```
governed business rule    Lifecycle_Transition__mdt · MQL / Sales Acceptance / SQL policy records
  → deployed safeguard    Lead_Inbound_Before_Save (active, parity-verified 2026-08-31)
  → controlled record     four synthetic fixtures, reserved .invalid domains, created 2026-09-01
  → detective assessment  NorthstarIQ, read-only, at five checkpoints
  → record-level evidence Status, stage-entry stamp, basis strings, Lead Status field history
```

#### Four preventive rejections — every one refused, every one rolled back

Attempted deliberately against the governed-lifecycle fixture. Each Custom Error named the policy in
force and only the conditions actually unsatisfied:

| Attempted operation | Refused because |
|---|---|
| Unsupported lifecycle transition | no active transition rule existed for that stage pair |
| Unsupported MQL qualification | the segment was not eligible under the active MQL policy |
| Unsupported Sales acceptance | no explicit seller acceptance under the active acceptance policy |
| Unsupported SQL qualification | no confirmed need and no agreed next step under the active SQL policy |

**Each rejected transaction rolled back in full.** After every attempt the record was re-queried:
Status, `Lifecycle_Stage_Entered__c` and the evidence fields were unchanged, and no Status history
row had been written.

> ⚠️ **No rejected invalid state persisted, and NorthstarIQ therefore did not subsequently detect
> any of those states.** There was nothing to detect. A before-save rejection leaves no record, no
> history row and no evidence. Any statement that the assessment "caught" one of these four attempts
> would be false, and none is made anywhere in this repository.

#### The governed progression, and the platform boundary

```
Open - Not Contacted → Working - Contacted → MQL → SAL → SQL
                     → native Salesforce Lead Conversion → Account · Contact · Opportunity
```

Every transition consumed an active `Lifecycle_Transition__mdt` rule. The conversion traversed the
safeguard as designed and populated `IsConverted`, `ConvertedDate` and all three converted record
references; both child records were verified pointing at the converted Account.

**The qualification, acceptance and SQL basis strings were written by the deployed Flow, not by
hand.** No basis field was pre-populated, no timestamp was back-dated, and no evidence was fabricated
to produce a pass. All three survived the conversion boundary intact.

#### First live detective observations

Each of these had never occurred against live org data before this run:

| First observation | Control | Captured |
|---|---|---|
| **Passed** | `mql-integrity` | while the fixture still sat at `MQL` |
| **Failed** | `mql-integrity` | after qualification drift on a second fixture |
| **Passed** | `sales-acceptance-sql` | after the fixture reached `SQL` |
| **Failed** | `sales-acceptance-sql` | after evidence removal on a third fixture |
| **Failure path reached** | `lifecycle-progression` | the same evidence-removal fixture |
| **Controlled Passed** | `lifecycle-conversion` | after native conversion |

> ⚠️ **`mql-integrity = Passed` is stage-window dependent.** That control judges a Lead only while
> its Status still equals the governed qualified stage; once the Lead progresses it correctly reports
> Unable to Determine. The Passed result was captured inside that window and is a **dated historical
> observation**. **The org is not expected to keep containing a passing MQL fixture**, and no claim
> in this repository depends on it doing so.

#### Evidence-gap status

**`G-6` — CLOSED.** The two integrity controls that had never judged a live record did so, in both
directions: each produced a Passed and a Failed result against controlled Salesforce records. What
this does *not* establish: `mql-integrity`'s Passed state is transient, as above.

**`G-7` — CLOSED.** `lifecycle-progression` reached a live failure path, through controlled evidence
removal, naming the governed route and the absent evidence. What this does *not* establish: **not
every contradiction path was executed** — one was. A **forbidden transition retained in history**
remains **not safely creatable**, precisely because the preventive safeguard correctly refuses and
rolls back every unsupported transition. Producing one would require mutating governed configuration.
That was not done and is not planned.

**`G-8` — PARTIALLY CLOSED.** Positive alignment was demonstrated: on the same record, at the same
stage, the preventive safeguard first refused invalid inputs, then accepted governed inputs, after
which NorthstarIQ independently reported the persisted state Passed — **reading the same governed
configuration the gate had read.** The negative direction is not claimed and cannot be:

> **When the preventive safeguard rejects a transaction, the invalid state does not persist.
> NorthstarIQ therefore has no persisted rejected state to assess afterward.**

**That is a structural limitation of the validation direction, not a failed test.** No fixture can
close it.

#### Findings F-1 to F-8 — reviewed disposition

Recorded as reviewed. **None is remediated in this entry**, and no code, Flow, Custom Metadata or
detector was changed.

| ID | Reviewed disposition |
|---|---|
| **F-1** | `BUSINESS CONTEXT REQUIRED — ADVANCED LIFECYCLE ENTRY`. A Lead can be created directly at an advanced stage without the transition or qualification gate running, while `Lifecycle_Stage_Entered__c` is still stamped. **The remediation is not "force every Lead to start at the initial stage"** — imports, integrations, partner and sales referrals and migrations may all legitimately introduce prequalified Leads. The missing artifact is the business rule: when may a Lead enter beyond the initial stage, and what evidence or provenance must substantiate it. Open as `OD-06`. **Neither Flow nor detector changes until it is decided.** |
| **F-2** | `EXPECTED OPERATIONAL RISK — QUALIFICATION DRIFT DETECTED`. A Lead legitimately qualified at MQL, then a company-size correction re-segmented it so the recorded basis no longer matched the current state. **This is not a Salesforce safeguard defect**: correcting an employee count is legitimate maintenance and must remain permitted. The intended operating concept is *qualification-relevant data changes → re-evaluate qualification → identify drift → flag for RevOps or seller review*; NorthstarIQ supplies the detective half. **No rule preventing legitimate updates, no automatic demotion, no lifecycle mutation.** Any response or remediation workflow is a separate business decision, out of scope here. This finding is the clearest evidence in the repository that preventive and detective controls are complementary rather than redundant. |
| **F-3** | `GOVERNANCE POLICY REQUIRED — EVIDENCE OWNERSHIP`. Qualification evidence was cleared after the stage had been granted, without a Status change; Salesforce allowed the save and two controls independently detected the contradiction. **The technical safeguard is deliberately not chosen yet.** Immutability, validation, permissions or another mechanism can only be selected once the policy defines which lifecycle evidence fields are system-owned, whether humans or integrations may edit them, whether evidence is immutable after a governed transition, how legitimate correction or reconstruction works, whether superseded evidence is replaced or historically retained, and which automation is authoritative for writing it. Open as `OD-07`. |
| **F-4** | `CONFIRMED PRODUCT DEFECT — EXPLANATION / PROVENANCE`. The Unable to Determine **classification was correct**, but the explanation asserted that records created during this validation "predate the evidence foundation" — provenance NorthstarIQ did not possess. Required behaviour: where NorthstarIQ holds no evidence that a record predates the evidence architecture, state that the required qualification evidence is *unavailable* and the claim cannot be determined; reserve the "predates the qualification-evidence architecture" explanation for records where actual provenance supports it. **Remediation approved in principle. Not fixed here.** |
| **F-5** | `CONFIRMED PRODUCT DEFECT — CONTEXTUAL EXPLANATION`. The same explanation does not distinguish a Lead **currently at** MQL from one that has **progressed beyond** it. A Lead at MQL should be told the evidence required for its *current* MQL claim is unavailable; a Lead beyond MQL should be told it progressed beyond MQL but the evidence supporting that earlier stage is unavailable. Final UI wording may be refined during remediation; **the semantic distinction must survive it. Not fixed here.** |
| **F-6** | `CONFIRMED PRODUCT DEFECT — COSMETIC`. Qualification failure text carries an unnecessary trailing separator. Remediation should remove it **without changing the underlying qualification logic or error semantics. Not fixed here.** |
| **F-7** | `IMPLEMENTED — DEPLOYED — RUNTIME VALIDATED`. **Superseded 2026-09-01 by the deployed remediation** — previously `CONFIRMED RUNTIME DEFECT — STALE SEGMENT EVALUATION`, itself superseding an unvalidated source-derived observation. The defect was that a same-save company-size change plus Status change let the MQL gate read the **previously stored** `Segment__c`, refusing a Lead the transaction made eligible (**false negative**) and granting MQL to one it made ineligible, persisting `MQL` + `SMB` (**false positive**). Remediated by relocating the lifecycle gate behind the enrichment chain — connector-only, deployed as Flow **version 13**, with version 12 retained as the rollback target. **All nine controlled runtime cases passed.** ⚠️ Segment stale evaluation was runtime-confirmed pre-remediation; **Territory and Match Status were only ever source-derived exposures** and their cases are post-remediation validations, not evidence of a previously observed runtime failure. See the 2026-09-01 remediation entry below and [`testing-strategy.md`](testing-strategy.md) §2t. |
| **F-8** | `CONTROL-BOUNDARY OBSERVATION — DEPENDENT ON F-1`. A Lead created directly at MQL without qualification evidence was reported Passed by `lifecycle-progression` and Unable to Determine by `mql-integrity`. **`lifecycle-progression` is not defective for declining to duplicate the MQL qualification control** — the two controls evaluate different invariants. What the correct progression behaviour *should* be for advanced-stage creation depends on the unresolved Advanced Lifecycle Entry rule. **No change until `OD-06` is decided.** |

**What these findings have in common.** F-1, F-2 and F-3 are all cases where the preventive
safeguard behaved exactly as designed and the gap lies **after** the moment it governs. Two of them
are missing business rules rather than missing mechanisms — which is why the response is an open
decision, not a code change. The architectural reading is recorded in
[`architecture.md`](architecture.md) §3 under the four lifecycle governance questions.

#### Fixture provenance and current disposition

**These are controlled validation fixtures created on 2026-09-01.** They are **not** part of the
Synthetic Baseline, **not** historical records, and **not** customer-like failures or historical
defects. Three were deliberately damaged *after* being legitimately progressed, in order to exercise
detective paths that the preventive safeguard correctly prevents from arising unaided.

| Fixture | What it demonstrates | Disposition |
|---|---|---|
| **FX-01** Governed Full Lifecycle | The complete governed progression and native Salesforce conversion | **Retained** as controlled validation evidence. Its Account, Contact and Opportunity are equally controlled validation artifacts, created by the conversion. Conversion is irreversible. |
| **FX-02** MQL Input Drift | Qualification drift (`F-2`) | Retained pending evidence preservation and separate cleanup approval |
| **FX-03** Acceptance Evidence Removed | Evidence removal and the need for an Evidence Ownership Policy (`F-3`) | Retained pending evidence preservation and separate cleanup approval |
| **FX-04** MQL Claimed at Creation | The Advanced Lifecycle Entry gap (`F-1`) and explanation defects `F-4` / `F-5` | Retained pending evidence preservation, business-rule resolution and separate cleanup approval |

A fifth fixture designed to create a Lead directly at the sales-qualified stage was **deliberately
not created** — it would have duplicated an outcome already obtained, and the argument for it was
scope, not evidence.

**No fixture was deleted, no pre-existing record was mutated, and no fixture is described anywhere as
historical.** While the three negative fixtures are retained they contribute synthetic failures to
the org's finding totals; that is a known and deliberate cost of preserving the evidence, and it is
why their cleanup is a separate approval rather than an assumption.

**Test result: every expected outcome was observed.** All four preventive rejections produced the
predicted error and a verified rollback; all four detective controls produced the predicted
classification for every fixture. Three product defects (`F-4`, `F-5`, `F-6`) and three
safeguard-scope observations (`F-1`, `F-2`, `F-3`) were discovered and **left unfixed** — which is
what a validation exercise is for. Nothing was repaired, compensated for, or worked around to produce
a passing result.

⚠️ **Provenance of the reproducibility queries.** The four lifecycle queries added under
`scripts/soql/` on 2026-09-01 were written **after** this validation had already run. They make the
results re-checkable; **they were not the evidence used at the time**, and each says so in its own
header.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

---

### 2026-09-01 — F-7 runtime-confirmed: the MQL gate evaluates a stale segment

Requirement: `BR-17`, `PD-14`.
Metadata: **none created or modified.** No Flow change, no Custom Metadata change, no application or
assessment change.
Validation: two controlled synthetic Leads, one same-save transaction each, in opposite directions.

**F-7 moves from source-derived and unvalidated to runtime-confirmed.** It was recorded earlier the
same day as an observation that must not be called a defect until executed evidence supported it.
That evidence now exists.

**The question.** When a qualification-relevant company-size input and a lifecycle Status change
arrive in the **same Salesforce save**, does the MQL gate evaluate the previously stored
`Segment__c`, or the segment the new input implies? Both fixtures satisfied every other requirement
of the active MQL policy, so segment eligibility was the only condition that could fail.

| Direction | Same-save change | Salesforce result | Persisted outcome |
|---|---|---|---|
| **Case A** — `SMB → Mid-Market` | employees `40 → 250`, Status `Working - Contacted → MQL` | **Rejected**, naming `segment eligible for qualification` | **Rolled back completely.** Re-query confirmed Status, employees, Segment and evidence all unchanged, and no MQL history row |
| **Case B** — `Mid-Market → SMB` | employees `250 → 40`, Status `Working - Contacted → MQL` | **Accepted** | **Unsafe state persisted:** `MQL` with Segment `SMB` |

**Both directions are stale-value behaviour.** Case A is the **false negative** — a Lead the same
transaction makes legitimately eligible is refused. Case B is the **false positive**, and it is the
material governance defect: a Lead persists as Marketing-qualified while its final governed business
state is ineligible under the active policy.

**The contradictory evidence is the strongest proof, and the Flow wrote both halves of it** in one
transaction:

```
MQL basis      Qualified under MQL Policy v1.1: ... Mid-Market segment eligible; ...
Segment basis  Employee Count: 40 -> SMB | Rule v1.0
```

The stale evidence string is a **consequence of the sequencing defect**, not a separate cosmetic
problem.

**The preventive → detective chain, demonstrated end to end.** The gate admitted the state;
segmentation then recalculated the record to SMB; NorthstarIQ evaluated the persisted current state
and **`mql-integrity` independently returned Failed** — *"Not substantiated — segment is not one the
business qualifies."* `lifecycle-progression` returned **Passed**, which is **correct under its
contract**: it evaluates progression consistency rather than qualification integrity, and is not
expected to duplicate the MQL control — the same boundary already recorded for `F-8`.

**Evidence hierarchy, kept explicit.** The Salesforce transaction results and the persisted field
values are the **primary** evidence. Source connector ordering and the `mql-integrity` result are
**corroborating**. ⚠️ **The NorthstarIQ assessment does not prove Flow execution order** — it
evaluates persisted state.

**F7-A created no persisted invalid state.** Its transaction rolled back in full, so no control had
anything to assess, and **no claim is made that anything detected the rejected attempt.**

**Status: confirmed but NOT remediated.** No remediation design was chosen. Whether segmentation
should move ahead of lifecycle qualification, whether the gate should derive eligibility from the
incoming company-size input, or whether another bounded Flow design is right, is a separate
remediation-design task with its own context discovery and approval. **Any fix must be revalidated
by rerunning both directions** — correcting one direction alone does not close this.

**Fixture disposition.** Both are controlled validation fixtures created 2026-09-01, not baseline
data and not historical records. **F7-A** rests in its controlled pre-test state
(`Working - Contacted`, SMB) after its transaction rolled back. **F7-B is retained deliberately** as
the evidence of the confirmed defect: the deployed lifecycle graph offers **no governed
`MQL → Working - Contacted` recovery path** (only `MQL → SAL` and `MQL → Closed - Not Converted`), and
clearing its Flow-generated basis would destroy the evidence while leaving the defect. Neither was
deleted. Cleanup requires separate approval after remediation and revalidation.

**What this does not establish.** Not all Flow sequencing, and not every MQL transition combination
— two same-save cases against one qualification requirement. Evidence in
[`testing-strategy.md`](testing-strategy.md) §2s.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

---

### 2026-09-01 — F-7 remediated in the org, and a detector correction it surfaced

Requirement: `BR-17`, `PD-14`.
Metadata: `Flow:Lead_Inbound_Before_Save` **deployed** — eight connector retargets, version 13 created
and activated. No Custom Metadata, field, object, Record Type, subflow or Apex change.
Application: `lifecycle-progression` contradiction path B corrected. No other assessment change.
Validation: nine controlled runtime cases against the deployed Flow, plus the application test suite,
type check and production build for the detector change.

**Two changes at two layers, and the distinction is the point.** The Flow change is **preventive**
and was deployed to Salesforce. The detector change is **detective** and lives only in `web/`. They
were made in that order, for different reasons, and neither validates the other.

#### The preventive remediation

The sequencing correction relocates the lifecycle gate so the enrichment chain that derives its
inputs — segmentation, account matching, Strategic designation, territory — completes first. It is
**connector-only**: 149 non-connector elements were unchanged, and the deployed metadata was
re-retrieved and compared to the approved source at **zero differences including connectors**.
Version 12 became Obsolete and stays the identifiable rollback target.

> **Deployment success was never treated as proof of correctness.** Activation was verified
> separately, and every case below was settled by re-querying Salesforce rather than by reading a
> deployment result.

**All nine controlled cases passed.** The two primary proofs invert the pre-remediation outcomes:
the same-save `SMB → Mid-Market` transition that was previously refused is now **accepted** with
Segment basis and MQL basis in agreement, and the same-save `Mid-Market → SMB` transition that
previously persisted an `MQL` + `SMB` contradiction is now **refused with a re-query-verified
rollback**. Four regressions confirmed the eligible path, the ineligible path, company-size-only
updates and the transition/SAL/SQL gates are unchanged. A bounded bulk transaction produced correct
per-record outcomes for 8 of 8 records with no governor-limit error.

**Evidence classification, preserved exactly.** **Segment** stale evaluation was runtime-confirmed
*before* remediation. **Territory** and **Match Status** were only ever **source-derived exposures** —
no pre-remediation runtime failure was observed for either, and none is claimed. Their cases here are
**post-remediation validations of correct behaviour**. Version 12 is Obsolete, so the retrospective
experiment cannot be run and will not be invented.

**F-7 is now `IMPLEMENTED — DEPLOYED — RUNTIME VALIDATED`.**

#### The detector correction, which the revalidation surfaced

Revalidation produced a **false positive** from `lifecycle-progression` on a controlled fixture that
had undergone one insert and no successful transition: its stage stamp sat **1 second** before its
`CreatedDate`, and path B reported the stage as predating the record.

Read-only triage established the cause. `Lifecycle_Stage_Entered__c` is written by the before-save
Flow from `$Flow.CurrentDateTime`, captured **before** Salesforce stamps `CreatedDate` at commit — so
on the create path the stamp sits at, or a moment before, `CreatedDate` **by construction**. Path B
compared at full precision, so a second boundary crossed inside one transaction read as a violation.
The intended rule is a **calendar-day** claim: that is what the control's existing tests assert, and
path D already reduces precision the same way for the same reason.

**The fix is detective-only and reuses what already existed** — path B now compares through the
`day()` helper already present in the same function. **No Flow, Custom Metadata, lifecycle definition
or preventive behaviour was touched**, and no tolerance constant was invented. The Flow is behaving
as documented; it was not changed to make a detector pass, and the detector was not weakened to make
a fixture pass.

**Validated:** targeted control tests 29/29, full application suite 265/265, `tsc --noEmit` clean,
production build clean across 12 routes. The **same-day** boundary is newly asserted; the
**day-earlier** contradiction test was preserved unchanged and still fires, and a negative control
run against the real detector with the affected fixture's own values moved back one day still
produces the contradiction. Reassessing the **same unchanged Salesforce record** removed the false
contradiction; `lifecycle-progression` moved from 2 failing to 1 with population, unmeasurable and
not-evaluated counts unchanged, and every other control identical.

⚠️ **The corrected detector was not used during the F-7 validation above.** That ran against the
previous implementation; the correction came afterwards.

⚠️ **Attribution of the false positive is indeterminate.** Whether the previous Flow ordering could
have produced the same artifact was never tested, and cannot be now — version 12 is Obsolete. It is
recorded as unresolved rather than settled by assumption, and **no finding ID has been assigned**;
that remains a separate decision.

#### Fixtures and state

Sixteen controlled synthetic Leads were created for this validation, all named `NIQ Fixture R-*` on
reserved `.invalid` domains. **No pre-existing record was mutated, and nothing was deleted** — the
earlier `NIQ Fixture 01`–`04`, `F7-A` and `F7-B` evidence records are untouched, verified by their
unchanged modification timestamps. Cleanup of the R-series fixtures remains a separate approval.

**Test result: every expected outcome was observed.** Nine runtime cases passed, the detector
correction passed all four validation layers, and exactly one runtime determination changed — the
false positive that prompted it. Evidence in [`testing-strategy.md`](testing-strategy.md) §2t.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

---

### 2026-09-01 — The lifecycle proven end to end under Flow v13, and findings acquire proving evidence

Requirement: `BR-17`, `PD-14`, `M-07`.
Metadata: **none** — no Flow, Custom Metadata, field, object, permission or configuration change.
Salesforce: one controlled synthetic Lead created and progressed; **no existing record mutated**.
Application: evidence presentation only. **No detector predicate, population rule, scoring rule or
lifecycle definition was changed.**

#### The lifecycle, once, under the Flow that is actually active

Every completed chain recorded before this ran under version **12**. Version 13 carries the F-7
remediation, so the org held no `Lead → MQL → SAL → SQL → Conversion → Opportunity` traversal under
the current safeguard. One Lead closed that: five governed gates accepted it, the Flow wrote the
qualification, acceptance and sales-qualification evidence at each milestone, and native conversion
produced an Account, Contact and Opportunity.

`mql-integrity` returned **Passed while the Lead stood at `MQL`** — the only moment that observation
exists, since the control cannot read the policy's inputs once the record moves on. After conversion
`lifecycle-progression`, `sales-acceptance-sql` and `lifecycle-conversion` all returned **Passed**,
and `mql-integrity` returned **Unable to determine**, which is the documented stage window and not a
regression.

**No failing count moved on any control, and the finding total held at 11.** All **22** retained
fixtures were verified unchanged by comparing `LastModifiedDate` before and after. Evidence, the two
disclosures it carries, and what it does not establish are in
[`testing-strategy.md`](testing-strategy.md) §2u.

⚠️ **This is post-remediation evidence.** It is not the original lifecycle validation, not F-7
discovery, not F-7 remediation validation, and not the timestamp-anomaly work. §2r–§2t stand
unchanged, and FX-01 remains the pre-v13 chain.

#### The finding pages now show what actually decided each finding

Reviewing the evidence tables against the detectors exposed a real gap: **two controls were decided
by a field the reader could not see.** `routing-exceptions` fails a Lead on one fact — routing left
it owned by the exception queue — yet the table carried only Company, Exception Type and Routing
Reason, none of which decides anything. `missing-territory` fails on a blank `Territory__c` that was
never displayed. Both fields were already queried; neither was shown.

Each evidence column now declares whether it is **proving** — a value that control's failing
predicate actually read, where a different value on that record could change that record's
determination — or **context**, which an operator investigating still needs but which proved
nothing. The distinction is carried in each column's accessible name as well as its styling, so it
survives without colour. Population gates are deliberately **not** marked: which records a control
was permitted to judge is a control-level fact the page already states, and per record in the
records-not-evaluated table.

Three per-record results stopped restating the finding's own title and now name the record's own
values: the segment drift's direction, the two dates a stale Opportunity was compared across, and
which of the two territory failures a Lead is. `stale-opportunities` in particular was a comparison
with only its left-hand side on screen — a reader had to supply today's date themselves.

**The engine was not touched to make any of this easier to display.** Counts, populations, scores and
determinations are identical; every change is presentation of values the detectors already held.

**The Finding Detail score cell was removed.** `CLAUDE.md` §10 puts scoring outside the current MVP
experience, and this was the last `/100` anywhere in the application — it predates that rule rather
than deviating from it deliberately. The engine still computes a score, the type still carries it and
the tests still assert it; the four population figures beside it already account for every record,
which is the part a reader can check against the evidence below.

**Validated:** evidence rendering checked against the **live read-only org** for six controls, each
failing set re-derived independently from raw SOQL and compared to the detector — counts matched,
every displayed row was genuinely failing, every record link resolved to the right record, and no
not-evaluated record appeared as a failure. Application tests **269/269** (265 before; four added for
the proving contract), `tsc --noEmit` clean, production build clean across 12 routes, repository
validator 50 passed / 0 warnings / 0 failed.

Two existing assertions were updated, not relaxed: both pinned the old constant strings
`'Mismatch'` and `'Not substantiated'`, and now assert the specific values the row actually names.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

### 2026-09-01 — The F-7 remediation becomes visible in the product, and two navigation labels stop implying workflows

Requirement: `BR-17`, `PD-14`.
Metadata: **none** — no Flow, Custom Metadata, field, object, permission or configuration change.
Salesforce: **read-only only** — three Tooling API queries. No record created, updated or deleted, no
conversion, no deployment.
Application: Finding Detail presentation and the navigation model. **No detector predicate,
population rule, scoring rule or lifecycle definition was changed.**
Validation: application suite, type check, production build, repository validator, and the rendered
page against the live read-only org.

#### The evidence existed; the product did not carry it

The `F-7` remediation was deployed and runtime-validated on 2026-09-01 and recorded in this log and
in [`testing-strategy.md`](testing-strategy.md) §2t. **The application said none of it.** The
`mql-integrity` safeguard was presented as though it had always behaved correctly, and its stated
provenance stopped at the 2026-08-27 validation — which predates the defect being found. An
evaluator using NorthstarIQ could not learn that the preventive safeguard was itself found wrong,
corrected, deployed and revalidated.

`Safeguard` now carries an optional `remediation`, populated for **`mql-integrity` and nothing else**,
and rendered as a nested block inside the Implemented safeguard section it concerns. It records the
defect, the consequence, the root cause, the bounded correction, the deployment, what was verified
afterwards, what regression was re-checked, what the detective control independently observed, what
a controlled reversal would require, and the per-input evidence basis.

**No second remediation was created and Salesforce was not mutated.** This surfaces evidence that
already existed.

#### Remediation and Verification are stages of a finding, not destinations

Both were sidebar rows marked Planned. That was honest about them not being built, but wrong about
what they are: they are stages of one investigation trail, and a finding already owns its safeguard
and that safeguard's verification. Two standalone rows advertised a remediation workflow and a
verification workflow this MVP does not have and should not claim — NorthstarIQ reads Salesforce and
never writes to it, so it executes no remediation at all.

**Both rows were removed.** No route, placeholder or redirect existed for either, so nothing was
deleted and nothing broke; `Analytics` and `Audit Log` remain Planned, unchanged. The navigation
model moved to `web/lib/navigation.ts` so the test suite can assert what the application offers —
components are not reachable from this project's test runner, and the claim was worth pinning.

#### The deploy request id, recovered rather than assumed

This log recorded the `F-7` deployment without a deploy request id, unlike every other deployment
entry. Two read-only Tooling API queries recovered it: exactly two `DeployRequest` records exist in
the window — `0Afaj00000imjJHCAY` (**check-only**, Succeeded, 1/1, 0 errors) and
`0Afaj00000imni0CAA` (Succeeded, 1/1, 0 errors, 18:03:40Z → 18:03:55Z). `Lead_Inbound_Before_Save`
version 13 was created at **18:03:41Z**, inside the second request's window, which ties the
deployment to the version it produced. Both ids are now shown on the finding. The check-only run
this log already described is the first of the two.

The same session re-confirmed, read-only, that **version 13 is Active and version 12 is Obsolete and
still present** — the rollback target is real, not a documented intention.

#### Evidence classification is now enforced by tests, not by careful wording

The distinction most easily lost in a summary is that **Segment** stale evaluation was
runtime-confirmed before the correction, while **Territory** and **Match Status** were only ever
source-derived exposures whose post-correction cases prove corrected behaviour and nothing about
history. That basis is a typed field rendered as a badge, and tests now assert both bases are present
and that neither source-derived entry claims a failure that was never observed. The later end-to-end
traversal is asserted to describe itself as later confirmation rather than as this validation.

**Validated:** application tests **277/277** (269 before; eight added — six for the remediation
contract, two for navigation), `tsc --noEmit` clean, production build clean across 12 routes,
repository validator 50 passed / 0 warnings / 0 failed, `git diff --check` clean. The rendered page
was checked against the live read-only org: the remediation block appears only on `mql-integrity`,
three other findings render no empty remediation content, record links and Setup dependency links
still resolve, and the sidebar offers neither removed row.

One assertion written during this work was **corrected rather than kept green**: it required the
recovery text not to mention automation, which the copy fails because it explicitly denies being
automatic. The assertion now requires that denial.

**Deferred, not pursued:** `RemediationIcon` is now unused in `components/Icons.tsx` and was left in
place — deleting an exported component is unrelated cleanup, not part of this change.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

---

---

### 2026-09-02 — Increment 7.1: routing and the lifecycle finally meet, and acceptance turns out not to require anybody

Two things had each been proven, separately, and the seam between them had never been tested.

Routing was validated with Leads that landed in a **coverage queue** and stopped there — none of them
ever qualified. Lifecycle governance was validated with Leads that were owned by an individual from
the moment they were created — none of them was ever routed. Reading the two bodies of evidence
together suggested a complete Marketing-to-Sales handoff. **No record had actually walked it.**

This increment walked it, with **no metadata change of any kind**. `Lead_Inbound_Before_Save` v13 was
confirmed Active with v12 Obsolete and no newer version before a single record was created, and it
was still v13 afterwards. Nothing was deployed, activated, reconfigured or relaxed. The question was
about **current behaviour**, and current behaviour was left alone so it could answer.

#### What was asked

> Can a queue-owned MQL currently be accepted into SAL while remaining queue-owned?

Two Leads, identical business inputs, one deliberate difference. `S7-HAPPY` (`00Qaj00000vGBJdEAO`)
had its ownership taken from the queue by a seller. `S7-EXC` (`00Qaj00000vGBUvEAO`) did not. Both
domains were verified against `Account.Normalized_Domain__c` and against existing Leads first, so
neither could reach routing Tier 1 or Tier 2 by accident. No derived field was pre-populated on
either record — segment, territory, ownership, SLA, MQL evidence and acceptance evidence were all
written by the Flow, which is the only way any of it counts as evidence.

#### `S7-HAPPY` — the first complete traversal in this org's history

Intake routed it to `NIQ North America Coverage` as Tier 3, resolved Mid-Market and NA-West, and set
a 4-hour response target. A seller then took ownership from the queue — **standard Salesforce
queue-member behaviour, performed by a person, not by automation**, and the step that had never
previously happened here. The Flow correctly wrote nothing during that transfer: `decRoutingEligible`
is create-only, so the original routing decision and its recorded reason survived intact.

First contact stamped `First_Touch_DateTime__c` well inside the target, so the response SLA reads
**Met** on real timestamps rather than on an assertion. MQL qualification then passed all four
conditions of policy v1.1 and wrote its basis. Acceptance passed both conditions of Sales Acceptance
Policy v1.0 and wrote all three evidence fields.

Intake → coverage queue → individual seller → first touch → MQL → acceptance, end to end, with every
governed artifact written by the automation that owns it.

#### `S7-EXC` — the same path, minus the person

Everything identical, except nobody took the record out of the queue.

It reached `Working - Contacted` while queue-owned. It reached `MQL` while queue-owned, and the MQL
gate wrote **the same basis text, character for character** — because the MQL policy does not read
ownership and has no reason to.

Then, still owned by `NIQ North America Coverage`, with `OwnerId` untouched:

```
Sales_Accepted__c = true
Status            = SAL
```

**The save succeeded.** No error, no rollback. `Status` is `SAL`. `Sales_Accepted_At__c`,
`Sales_Accepted_By__c` and `Sales_Acceptance_Basis__c` are all populated, and the basis correctly
names Sales Acceptance Policy v1.0 and both requirements it satisfied. `Owner.Type` is still `Queue`.

> **A Lead can carry complete, correctly substantiated Sales acceptance evidence while no individual
> person is accountable for it. Salesforce permits this today and says nothing about it.**

#### This is not a defect, and that is the point

Every gate did exactly what it was written to do. `Sales_Acceptance_Policy__mdt` declares two
requirements — explicit acceptance, and a substantiated Marketing handoff — and both were genuinely
satisfied. **Accountability is not among the things the policy governs**, so no rule was broken.

That makes this a different class of finding from `F-7`. `F-7` was an implementation defect *inside*
one safeguard: a correct rule reading state that the same transaction had already changed. This is a
governance gap *between* two safeguards that are each individually correct. Routing decides who holds
the record. Acceptance decides whether the handoff was legitimate. Neither was ever asked to care
whether the holder is a person, and the field descriptions say as much — `Sales_Accepted_By__c`
already argues that ownership and acceptance are different business facts. They are. Nothing
currently requires the first to exist when the second is granted.

#### NorthstarIQ did not see it either

An assessment ran against the live org straight afterwards. **`S7-EXC` passes every control that
evaluated it**, including `sales-acceptance-sql` and `routing-exceptions`.

That is the correct behaviour of each control, not a bug in any of them. `routing-exceptions` fails a
Lead only when routing dumped it in the exception queue; a coverage queue is a *successful* routing
outcome. `sales-acceptance-sql` judges the evidence the governed policy requires, and every piece of
it is present and correct. `Owner.Type` is queried and used only for display — **no control reads
it**.

So there are two distinct facts here, and they must not be collapsed: **what the org permits**, and
**what NorthstarIQ can currently observe**. Both gaps are real. Neither was closed in this increment,
because closing either one was not authorised and would have destroyed the baseline this increment
existed to establish.

#### Preservation

All 72 Leads present beforehand were captured field-by-field, and re-read afterwards. The two
projections hash identically — `sha256 e24e1d2fb0fdaa8ad83af7217b900ba3771dd555984b481a2a8f2bd8b255a699`.
**Zero pre-existing records modified, zero deleted.** The only mutations were the two new fixtures:
**2 records created and 7 update operations** — four on `S7-HAPPY` (ownership, first contact,
qualification, acceptance) and three on `S7-EXC` (the same, minus the ownership handoff). No metadata
change, no deployment, no Flow activation, no CMDT change, no permission change, no conversion.

Both fixtures are **retained** — `S7-HAPPY` as the happy-path evidence, `S7-EXC` as pre-remediation
evidence of the confirmed gap. Neither is baseline data, and neither may be quoted as one.

#### Status, stated exactly

**`IMPLEMENTED — RUNTIME CONFIRMED (2026-09-02)`** for the operational traversal and for the
accountability gap. Not remediated, not prevented, not detected.

⚠️ **The proposed remediation does not exist and was not tested.**
`Sales_Acceptance_Policy__mdt.Require_Individual_Owner__c` is not a field in this org. Flow **v14 is
not a version that exists**. Neither was created, deployed nor simulated, and nothing in this entry
is evidence about how a remediated gate would behave. `F-7` was not reopened and v13 is unchanged.

⚠️ **One fidelity limitation, recorded rather than smoothed over.** Both acceptance saves ran under
the CLI's existing authenticated identity — the Revenue Operations administrator — because
authenticating as `NIQ Seller` is a gated action outside this increment's authorisation. The
acceptance gate reads no identity at all, so the result stands; but `S7-HAPPY` demonstrates the
**ownership handoff**, not a seller-authenticated acceptance, and its `Sales_Accepted_By__c` differs
from its `OwnerId` for that reason alone.

`scripts/soql/acceptance-accountability.soql` was written **after** this run. Its field projection is
the one that was executed; its accountability predicate is new. It is labelled a later-created
reproducibility artifact in its own header and is not evidence of what was used at the time.

**Not committed at the time of writing**; the commit hash will be recorded when the change is
committed.

---

### 2026-09-03 — Increments 7.2–7.8: the governed seller decision, built dormant and then switched on

**The handoff finally has two answers.** Acceptance proved Sales *took* a Lead; it could not record a
decline, and it could not tell a seller still deciding from one who never looked. This sequence added
a bounded decision commitment at MQL and two governed ways to answer it.

**Ratified first, built second.** Two Portfolio Decisions were put to the practitioner as owner of the
fictional scenario and ratified before any implementation: **`PD-15`** (24-business-hour decision SLA,
starting at valid MQL, stopping at acceptance or rejection, distinct from the 4-hour response SLA) and
**`PD-16`** (rejection is a decline, not a disqualification; four governed reasons, no `Other`; the
Lead stays MQL and keeps its owner). Both are recorded in
[`requirements.md`](requirements.md).

**A provenance gap was found by inspection and closed before deployment.** The approved design gave
the commitment a deadline but no issuer. For a *decided* Lead the acceptance or rejection basis names
the governing version; for an **undecided** one, a bare `Acceptance_Due_DateTime__c` would have
outlived the identity of the policy that set it, and the control's own wording would have become false
the moment a later version existed. `Acceptance_Basis__c` was added — the provenance half of the
commitment, exactly as `SLA_Basis__c` is for `SLA_Target_DateTime__c` — and the control now reads the
issuer from each record instead of assuming the active one.

**Two field descriptions exceeded a platform limit, and the check-only caught it.** The first Stage C
check-only failed: `Acceptance_Basis__c` (1181 chars) and `Sales_Rejection_Reason__c` (1157) both
exceeded Salesforce's 1000-character `Description` maximum, and four further failures cascaded from
the field that did not deploy. Nothing local could have caught it — `tsc`, the test suite and the
repository validator do not check Salesforce metadata limits. Both were trimmed to ~850 and the retry
passed 12/12. **This is exactly what check-only is for.**

**Deployment was split so activation was its own decision.**

| Stage | What deployed | DeployRequest | Result |
|---|---|---|---|
| C — check-only (failed) | 12 components | `0Afaj00000ixVUfCAM` | Failed — 6 errors, description length |
| C — check-only (retry) | 12 components | `0Afaj00000ixj9SCAQ` | Succeeded 12/12 |
| C — real | 7 Lead fields · 1 CMDT field · 3 permission sets · Flow v15 | `0Afaj00000ixmk1CAA` | Succeeded 12/12 |
| D — check-only | 2 CustomMetadata records | `0Afaj00000ixbDXCAY` | Succeeded 2/2 |
| D — real | v1.1 → inactive, v1.2 → active | `0Afaj00000ixpV0CAI` | Succeeded 2/2 |

Stage C shipped the whole capability **dormant**: Flow **v15** went active and every field existed,
but policy v1.1 declared no decision hours, so nothing was issued. That was verified in configuration
and then at runtime. Stage D changed one governed value and the capability came alive. **v14 is
retained as the Flow rollback target; v1.1 is retained as the policy rollback target** — recovery
restores active-policy *selection*, and never rewrites history.

**Salesforce executing the Flow is not proof of compliance.** Increment 7.5 made the case concretely:
a Lead accepted by a named seller and afterwards handed back to a coverage queue passes every
preventive gate and still ends up with nobody accountable. The Flow governs what may be *written*;
NorthstarIQ judges the state that results. Both halves were runtime-confirmed.

**Evidence and its limits.** Commitment issuance, Pending, governed rejection, governed acceptance,
the queue-owned rejection block and both mutual-exclusivity directions are **runtime-confirmed** —
[`testing-strategy.md`](testing-strategy.md) §2w owns the matrices. ⚠️ **`Overdue` is synthetic test
evidence only** and was deliberately not manufactured. ⚠️ **The decision actor is the CLI-authenticated
administrator, not the Lead owner** — accountable-owner *state* is proven; seller-authenticated action
is not. ⚠️ The time basis is the **weekend-aware approximation**, not Business Hours.

**Seven fixtures are retained as evidence, none deleted:** `S7-HAPPY`, `S7-EXC`, `S7-DORMANT`,
`S7-V11-RUNTIME`, `S7-C-DORMANT-RUNTIME`, `S7-V12-REJECTION`, `S7-V12-ACCEPTANCE`.

**One implemented control was deliberately left unregistered.** `seller-decision-timeliness` exists
with presentation, traceability and 24 passing tests, but is **absent from `CHECK_IDS` and
`runAllChecks`**, so it is not reachable through the normal assessment — the same way
`mql-integrity`, `lifecycle-progression` and `sales-acceptance-sql` were each introduced before being
registered by explicit decision. Registering it is a **separate product decision**: it would move the
assessment model from eleven controls to twelve, and its headline state (`Overdue`) has never been
observed at runtime.

**Governance gained one durable rule during this sequence** — *Change completeness* in `CLAUDE.md` §6:
any Salesforce configuration NorthstarIQ introduces is evaluated across ten applicable dependencies,
with **applicable ≠ mandatory** stated explicitly so the rule cannot become a checklist.

### 2026-09-03 — Increment 7.9: documentation parity for Increments 7.2–7.8

Documentation-only. No executable file, Salesforce metadata or application behaviour changed. The
implementation frontier had run ahead of the written record: this increment recorded `PD-15` and
`PD-16`, the seven Lead fields and two Custom Metadata fields, the seller-decision architecture, the
Step 7 field-level security split, and the four runtime matrices — and corrected statements that had
become false, including a Flow version pinned at v13 and a claim that no further Salesforce increment
was planned.

### 2026-09-03 — Increment 8.5Z: Assessment Model v3, because the active control set changed

```
Requirement:   PD-22 (portfolio decision). Model-version semantics, decided in
               Increment 8.5Y discovery. PD-17 and PD-18 remain the business
               authority for the control itself.
Repository:    MOD  web/lib/score.ts, web/lib/export-model.ts
               MOD  test/model-v2.test.ts, score.test.ts, checks.test.ts,
                    closed-lost-reason.test.ts, lifecycle-progression.test.ts,
                    mql-integrity.test.ts, sales-acceptance-sql.test.ts,
                    seller-decision-timeliness.test.ts
               MOD  docs/architecture.md, docs/testing-strategy.md,
                    docs/requirements.md (PD-22), docs/implementation-log.md
Salesforce:    0 metadata changes. 0 deployments. 0 record mutations. 0 queries.
Validation:    324/324 unit tests, tsc clean, repository validator 50/0/0,
               git diff --check clean. LOCAL ONLY - no v3 assessment has been
               run against the org.
Commit:        NOT COMMITTED - held for human review
```

**Registering `closed-lost-reason` moved the active model from eleven controls to twelve,
and Pipeline Hygiene from one active control to two.** That is the whole of the change,
and it is enough to need a new model version.

**Nothing about the scoring changed.** The formula is the same, the six areas are the same,
and a control that evaluated no record is still Not Scored rather than 100. What changed is
composition: Pipeline Hygiene used to *be* `stale-opportunities`, and is now the mean of
two controls. Because an area scores as the mean of its scored controls and overall health
as the mean of the scored areas, that area — and through it the overall number — can land
differently **on identical Salesforce data**. Not *will*: `closed-lost-reason` scoring the
same as `stale-opportunities`, or evaluating nothing at all, leaves the number where it was.
The claim is only that v2 and v3 results are **not guaranteed comparable**, which is the
one thing `MODEL_VERSION` exists to say.

**So historical v2 evidence is frozen, not rewritten.** This repository already records a
live Model v2 run — *overall 60, 6 areas, 11 controls, 8 findings* — in dated entries above.
Reusing `v2` would have left that result and a future twelve-control `v2` claiming the same
assessment definition, with nothing in either artifact to tell them apart. The findings
export writes the label into a downloadable file, so the ambiguity would have outlived the
session that produced it. **No dated v1 or v2 entry was edited by this increment.**

**`MODEL_VERSION` moved `v2` → `v3`, and its definition comment stopped being ambiguous.**
It had said the version names "the area list and the three rules", while also asserting
"v2 is six areas and eleven controls" — two different definitions in one comment. It now
states that a version names the active control set, the area composition, and the scoring
and eligibility rules **together**.

**The payload-shape version did not move.** `northstariq.assessment.v4` in
`assessment-store.ts` versions the *shape* of the stored result, which did not change.
Bumping it would have discarded live tab state to signal something it does not signal.

**Still one constant.** No model registry, no assessment history, no version negotiation,
no v2/v3 comparison view, no new dependency — the same boundary the 2026-08-28 entry drew.

⚠️ **Model v3 is locally validated, not runtime validated.** No assessment was run against
the org in this increment, so no v3 overall score exists. The Step 8 runtime evidence for
`closed-lost-reason` — Salesforce integration and detector pass path — stands on its own
dated entries and is unaffected; its **fail path remains deterministic-test validated only**.

### 2026-09-04 — Step 8 consolidated: an Opportunity may be lost, but not silently

```
Requirement:   PD-17, PD-18 (ratified). PD-22 for the model-version decision.
               BR-22 for the Opportunity funnel measurement it serves.
Salesforce:    1 custom field, 1 Validation Rule, 1 Quick Action, 1 layout,
               2 permission sets, 1 profile layout assignment.
               4 real deployments, 4 passing check-onlys, 3 failed check-onlys.
               0 Record Types. 0 BusinessProcess. 0 Flows. 0 Apex.
Repository:    1 detective control, 14 deterministic tests, registered into
               the assessment model. MODEL_VERSION v2 -> v3.
Validation:    324/324 unit tests, tsc clean, repository validator 50/0/0.
               Runtime evidence recorded in testing-strategy.md §2x.
Commit:        NOT COMMITTED - held for human review
```

**The requirement, and its deliberate limit.** `PD-17` ratified that an Opportunity entering Closed
Lost must carry a governed reason, **prospectively** — pre-governance losses are detected, never
retroactively blocked or backfilled. `PD-18` fixed the vocabulary at exactly four values:
`Lost to Competitor` · `No Decision` · `Not ICP` · `Product Gap`. **No `Other`, no `Price`, no free
text.** Salesforce remains authoritative for *whether* a deal is lost; NorthstarIQ governs only *why*.

**One field, and Salesforce owns the vocabulary.** `Opportunity.Loss_Reason__c` is a **restricted**
picklist, so any value outside the four is refused before a rule or the assessment sees it — which is
why the NorthstarIQ detector checks only that a reason is *present* and never re-validates
membership. **One vocabulary, one authority, no second source of truth.**

**A Validation Rule, not a Flow, and not a required field.** The requirement is a refusal, never a
value the system could choose for the seller, so the minimum declarative mechanism that expresses it
is a Validation Rule. Field-level requiredness would have been wrong in a different way: the
obligation is *conditional* on entering the lost stage, and open Opportunities owe nothing.
`Closed_Lost_Requires_Governed_Reason` refuses entry to Closed Lost with no reason and refuses
**clearing** an existing one, while leaving reason A → B, reopening, and unrelated edits to historical
blank records alone. ⚠️ The first deployment failed on a 807-character description: **the
`ValidationRule.description` limit is 255, not the 1000 `CustomField` allows.**

**Deployment, then the layout defect nobody would predict.** The field, rule, layout and permission
sets deployed cleanly (`0Afaj00000j2RDYCA2`). The seller's Opportunity **Details tab then failed to
render** — because **page-layout assignment is profile-scoped in Salesforce, and a permission set
cannot assign a layout.** The seller's profile received the Opportunity layout assignment
(`0Afaj00000j3XFGCA2`). No access was widened to fix a rendering problem.

**Then the standard close modal turned out to be the real obstacle.** *Close This Opportunity*
exposes **Stage only**, and a Loss Reason typed into the underlying Details form and left unsaved is
**not carried into that close transaction** — so the Validation Rule correctly refused a save that
genuinely had no reason. **A presentation-layer transaction boundary, not a rule defect.** The
safeguard was not touched.

**The Quick Action took three attempts, and the second one taught the most.** A `Close Lost` Update
action was authored and deployed, but did not appear: it had been registered in `quickActionList`,
which is **Salesforce Classic's publisher**. Lightning reads **`platformActionList`**, and where a
layout declares one, Lightning renders that list exclusively (`0Afaj00000j4mBZCAY`). The action then
appeared but exposed Stage as a free choice. The final form constrains it
(`0Afaj00000j5C54CAE`): **`StageName = Closed Lost` as a hidden `fieldOverrides` literal, with
`Loss_Reason__c` the single visible input.** Invoke → choose why → Save, both fields in one
transaction. **The Quick Action is transaction UX; the Validation Rule remains the independent
enforcement — the two are never conflated.**

**Seller runtime validation, under an identity stated honestly.** Four attempts to authenticate the
seller directly all resolved to the administrator through browser session reuse, so validation
proceeded as **SELLER-PERSONA RUNTIME VALIDATION VIA SALESFORCE ADMINISTRATOR LOGIN AS** — never
described as direct seller credential authentication. Observed: the four governed values and nothing
else in the picker · the governed close committing Stage `Closed Lost` and Loss Reason `No Decision`
together, with `OpportunityHistory` recording the seller-authored stage transition · and a blank
close **refused**, leaving the Opportunity at `Qualification` with no committed change and no history
row.

**QA-4 asked the harder question: does a refusal preserve evidence?** With the Opportunity already
Closed Lost / `No Decision`, the seller set the reason to `--None--` and saved. **Refused.** Server
verification found Stage `Closed Lost`, `IsClosed = true`, `IsWon = false`, **`LastModifiedDate` and
`SystemModstamp` unchanged, and `OpportunityHistory` still 4 rows.** ⚠️ **`OpportunityHistory` does
not record the custom field's value**, so it is never cited as proof of preservation; the claim rests
on the seller UI, the refusal, and the absence of a committed transaction. ⚠️ **The administrator was
deliberately granted no field-level access to `Loss_Reason__c`**, so no verification here rests on an
administrator read of it — a governance choice with an accepted evidentiary cost, not a defect.

**An independent detective control, because a safeguard's success is not proof of compliance.**
`closed-lost-reason` reports Closed Lost Opportunities carrying no governed reason — evaluator-facing
**Closed Lost Reason Governance**, formal finding label **Closed Lost Without a Governed Reason**,
Pipeline Hygiene, Medium. Population `IsClosed && !IsWon`; failing when the reason is null or empty;
everything else *outside*. 14 deterministic tests.

**Its pass path was validated through the real assessment identity**, not a harness: 37 Opportunities
— 17 open, 19 Closed Won, 1 Closed Lost — `evaluated = 1`, `failing = 0`, `notEvaluated = 36`, and
**1 + 36 = 37**. Evidence rows: **0, correctly** — the evidence table holds failing records only.
⚠️ **The fail path remains deterministic-test validated only.** No legitimate Closed Lost record with
a blank reason exists, because the safeguard works, and manufacturing one would have meant
deactivating the Validation Rule to produce the failure the control prevents. **It was not done. The
impossibility is itself evidence.**

**Registration moved the model, so the model version moved.** `closed-lost-reason` joined `CHECK_IDS`
and `runAllChecks` as the **second Pipeline Hygiene control**, taking the active set from eleven to
twelve. Because an area scores as the mean of its scored controls, Pipeline Hygiene — and through it
overall health — can now land differently on identical Salesforce data. `MODEL_VERSION` moved
**v2 → v3** under `PD-22`; the scoring formula and zero-evaluated eligibility are unchanged, and the
historical v2 baseline (*6 areas, 11 controls, overall 60*) stays frozen as the evidence it is.

**Opportunity Path was evaluated as the progression UX and deliberately deferred.** A candidate Path
covering all ten active stages, with Loss Reason as the only Closed Lost key field, failed check-only
three times (`0Afaj00000j561GCAQ`, `0Afaj00000j5CppCAE`, `0Afaj00000j4vahCAA`) because
`PathAssistant.recordTypeName` is required and resolves against real Record Type records — and this
org holds **0 Opportunity Record Types and 0 BusinessProcess records**. Introducing a Record Type
solely to enable a presentation layer was judged unjustified for a focused MVP. ⚠️ **The evidence
supports only the narrow claim that this metadata approach could not deploy without resolving the
record-type context — not that Salesforce Path always requires Record Types.**
**OPPORTUNITY PATH FOUNDATION — BLOCKED / DEFERRED**, candidate source retained and undeployed.

**Evidence limitations, stated rather than closed by wording.** The detector fail path is
deterministic-test validated only · QA-3 (reason A → B) was reasoned, not executed · QA-5 (reopen) is
**incidental evidence** and was not upgraded · QA-6 (reclose blank) was stopped at diminishing
returns · a historical pre-governance blank record cannot be created safely once the safeguard is
active, and none was manufactured · **no Model v3 assessment has been run, so no v3 overall score
exists** · an unrelated Opportunity **Related**-area `INVALID_FIELD` error remains a
**NON-BLOCKING ENVIRONMENTAL LIMITATION** · and the `northstariq-seller` CLI alias **resolves to the
administrator** and was never used as seller evidence.

**Step 8 status.** The Closed Lost governance requirement is ratified, the restricted vocabulary is
deployed, the preventive safeguard is deployed and refuses at runtime, the seller transaction UX is
deployed and commits at runtime, the independent detective control is implemented, registered and
runtime-validated on its pass path, and the assessment model is **v3 — implemented and locally
validated, not runtime validated.** **STEP 8 — COMPLETE**, with every limitation above recorded
rather than resolved by phrasing.

### 2026-09-05 — Step 9 consolidated: the forecast is only as good as the records behind it

```
Requirement:   PD-21 (ratified), PD-23 (ratified). PD-22 for the model-version
               decision. PD-19 binds the revenue terminology. PD-20 keeps the
               past-dated open pipeline defect where it already belonged.
               OD-08 narrowed rather than replaced.
Salesforce:    NOTHING CREATED, DEPLOYED OR MODIFIED. 0 fields, 0 Flows,
               0 Validation Rules, 0 Record Types, 0 CMDT, 0 permission
               changes, 0 records touched, 0 fixtures. Read-only throughout.
Repository:    2 detective controls, 65 deterministic tests, 1 fiscal-period
               resolver. Both registered. MODEL_VERSION v3 -> v4, 12 -> 14
               active controls, 6 areas unchanged.
Validation:    394/394 unit tests, tsc clean, repository validator 50/0/0.
               ONE Model v4 assessment executed against the org 2026-09-05.
               Runtime evidence recorded in testing-strategy.md §2y.
Commit:        NOT COMMITTED - held for human review
```

**Two requirements, and what each refused to decide.** `PD-21` fixed the Revenue Handoff evidence set
at three elements — an Account relationship, a populated `Amount`, and at least one
`OpportunityContactRole` — and named the boundary: NorthstarIQ governs the *handoff*, never
recognized revenue. `PD-23` fixed the Forecast Commitment evidence set at two — a populated `Amount`
and a `Close Date` inside the fiscal quarter being assessed — and governs only Opportunities promoted
into `Best Case` or `Commit`. **Neither invented methodology.** No Stage threshold, no Probability
threshold, no minimum Amount; a zero `Amount` is populated, and an override is never itself a defect.

**The org's own configuration made the forecast population deterministic.** Every open stage in this
org derives `ForecastCategoryName = Pipeline`, so `Best Case` and `Commit` cannot arise from the
configured defaults — a record carrying one has been promoted away from that default. That is what
supplies a population gate without inferring anyone's intent. The detector reads that a record *is*
promoted; it never claims who promoted it, when, or why.

**The fiscal calendar is read, not computed.** `resolveForecastPeriod` resolves the quarter containing
the assessment date from Salesforce's own `Period` records, and **refuses** — on zero matches and on
more than one — rather than inventing a period end that every subsequent verdict would inherit.
`Opportunity.FiscalYear` and `FiscalQuarter` are deliberately not consulted: discovery found them
stale against their own Close Dates on the sample records.

**One assessment run, and three different kinds of evidence.** Executed 2026-09-05T02:30:15.895Z
through `POST /api/assessment/run` as the **integration principal** — not the administrator CLI, not
Login As. HTTP 200, first attempt, no retry. 116 records assessed, 14 controls, 6 areas.

| Control | Population | Evaluated | Failing | Score |
|---|---|---|---|---|
| `revenue-handoff-integrity` | 19 Closed Won | 19 | **19** | **0** |
| `forecast-commitment-integrity` | 0 promoted to Best Case / Commit | 0 | 0 | **Not Scored** |

**Revenue Handoff failed every record it judged, and the reasons overlap.** 1 with no Account
relationship, 1 with no `Amount`, **19 with no governed Salesforce contact-role evidence** — a
breakdown summing to 21 over **19 unique records**, never to be read as 21. ⚠️ The single
Account/`Amount` failure is `NIQ-S8-B-Closed-Won-Unaffected`, **`SYNTHETIC`** — a Step 8 fixture
built for another purpose. The other 18 are contact-role-only on organic sample data. The finding
claims that 19 Opportunities carry no `OpportunityContactRole`; it does **not** claim no customer
contact exists anywhere in Salesforce.

**Forecast Commitment judged nothing, and said so.** The live distribution is `Closed` 19 ·
`Pipeline` 17 · `Omitted` 1 · **`Best Case` 0 · `Commit` 0**. The control reported **Not Scored — no
applicable records**: not a pass, not a failure, not 100. The Model v2 eligibility rule excluded it
from the Pipeline Hygiene mean rather than crediting an absence of evidence as health. **No record
was created or promoted to populate it** — an empty governed population is evidence about the
boundary, and manufacturing one would have been the failure this project exists to avoid.

**Assessment Model v4.** Six areas, fourteen active controls, overall health 80, 11 findings (5
High). Pipeline Hygiene moved from two active controls to four and scored **41** on **3 of 4** —
`stale-opportunities` 24, `closed-lost-reason` 100, `revenue-handoff-integrity` 0, Forecast
Commitment unscored. **v3 and v4 are not comparable** and no v3 assessment was ever run, so nothing
here is an improvement or a deterioration — the active control set changed, which is precisely what
`PD-22` exists to record.

**Evidence limitations, stated rather than closed by wording.** Revenue Handoff has a **live
fail path** and **no live pass path** — 0 of 19 passed · Forecast Commitment has **neither** live
path, because its population is empty · the forecast period's **exact bounds were not observable** in
the assessment payload, only that exactly one quarter resolved · the `OpportunityContactRoles`
subquery executed but **no evaluated Closed Won Opportunity carried a role**, so a non-null subquery
result was not observed · evidence rows remain **capped at 10 for display** while counts stay
complete · the pre-existing `export-model` mappings for `closed-lost-reason` and
`seller-decision-timeliness` are **still absent and deliberately untouched** · and **Forecast
Accuracy remains unestablished**, requiring period and submission history this org does not hold.

**Step 9 status.** Both requirements are ratified, both detectors are implemented and covered by 65
deterministic tests, both are **registered and active** in Assessment Model v4, the model is
**implemented, locally validated and Salesforce integration runtime validated**, Revenue Handoff is
**live fail-path validated**, and Forecast Commitment correctly reports **Not Scored — no applicable
records** against a genuinely empty governed population. **No Salesforce object, field, record,
permission or setting was created or changed at any point in Step 9.** **STEP 9 — FORECAST
INTEGRITY: COMPLETE**, with every limitation above recorded rather than resolved by phrasing.

**What "complete" means here, and what it does not.** NorthstarIQ can execute Forecast Commitment
Integrity through its intended Salesforce integration path, resolve the fiscal-period dependency at
runtime, evaluate the governed forecast-commitment population when records exist, return Not Scored
when none do, hold deterministic predicate coverage in local tests, and distinguish forecast evidence
*completeness* from forecast *correctness*. It does **not** mean NorthstarIQ predicts or generates
forecasts, validates seller judgement, measures forecast accuracy or historical movement, performs
scenario planning, validates quotas or forecast submissions, calculates recognized revenue, or treats
Forecast as a lifecycle stage. **Forecast is a lens over open Opportunity state, never a stage.**

**READY FOR GATE 3 CLOSEOUT REVIEW — GATE 3 IS NOT CLOSED.** Every segment of the governed lifecycle
now has an active control executing against the org, including `Closed Won → Revenue Handoff`, which
was the last segment without one. Gate 3 requires its own bounded review.

### 2026-09-05 — Gate 3 closed: the Salesforce revenue lifecycle is governed, assessed and evidenced

```
Requirement:   No new requirement. Closes a ROADMAP MILESTONE on evidence
               already established across Steps 3-9.
Salesforce:    NOTHING. No query, no mutation, no metadata, no permission,
               no deployment, no fixture. Read-only review only.
Repository:    Documentation only. 0 code files, 0 test files, 0 controls,
               0 model changes. MODEL_VERSION stays v4.
Validation:    Read-only Gate 3 closeout review. Twelve-point decision test
               satisfied; bounded semantic impact check PASS on all eight
               dimensions. No new evidence created.
Commit:        NOT COMMITTED - held for human review
```

**What this is, and what it is not.** Gate 3 is a **NorthstarIQ roadmap and portfolio milestone** —
a statement that the Salesforce phase has proven what it set out to prove. It is **not** a
repository-wide phase-gate framework, and it deliberately does not reintroduce the phase-gate
apparatus this project removed on 2026-08-21. There is no gate document, no gate machinery, and no
`Gate 1`/`Gate 2` retrofit. One dated entry records it, and the dated entries remain the authority
for current state.

**Why it closes.** Twelve things are demonstrated by evidence that already exists: **(1)** Lead
qualification and **(3)** lifecycle progression are governed by Custom Metadata policy and enforced
by a before-save Flow · **(2)** sales acceptance and SQL progression are governed, with the
commitment pinned so a later policy change cannot move it · **(4)** conversion integrity is
independently evaluated against the platform's own unwritable `IsConverted` · **(5)** Opportunity
progression is represented by one bounded control, and **no Salesforce Stage became a NorthstarIQ
capability** · **(6)** Closed Lost carries governed loss evidence behind a runtime-validated
preventive safeguard · **(7)** Closed Won carries a defined Revenue Handoff integrity boundary ·
**(8)** forecast inputs have a bounded evidence-integrity policy derived from the org's own stage
configuration rather than invented methodology · **(9)** NorthstarIQ assesses Salesforce through its
intended least-privilege **read-only** integration · **(10)** findings connect business controls to
specific Salesforce records · **(11)** preventive safeguards and detective controls are explicitly
distinguished, including where **no safeguard exists and the control says so** · **(12)** remediation
and verification have a real implemented precedent, and the known limitations stay visible.

**The lifecycle, stated technically rather than as shorthand.**

```text
Lead → MQL → SAL → SQL → Conversion → Opportunity → Opportunity Progression
                                                          │
                                        ┌─────────────────┴─────────────────┐
                                  Closed Won                          Closed Lost
                                        │                                   │
                                Revenue Handoff                    Loss Intelligence
                                                                       (terminal)
```

**Forecast Integrity is a governance lens over Opportunity state — it is not a stage**, and no record
transitions into it. **Closed Won is not recognized revenue.** **Closed Lost is terminal and does not
flow to Revenue.** Roadmap shorthand that places Forecast inside the sequence is a business story,
never the technical model.

**The chain the Salesforce phase actually demonstrates.** Business requirement → governed policy →
Salesforce configuration → security → preventive automation where appropriate → independent detective
control → specific evidence → runtime validation → investigation → **human** remediation →
NorthstarIQ verification. `PD-18` is the clearest end-to-end instance: a restricted picklist refuses
any value outside the four before a rule runs, so the detector tests **presence only** and never
re-validates membership — one authority, no second source of truth.

**The remediation precedent is a real defect, not a hypothetical.** `F-7`: the qualification gate ran
ahead of the enrichment chain that derives its own inputs, failing in both directions. NorthstarIQ
found it and surfaced the evidence · a human investigated the root cause · a **human** changed
Salesforce, connector-only — eight connectors retargeted, 149 non-connector elements unchanged · the
deployed metadata was re-retrieved and compared to approved source at zero differences · nine
controlled runtime cases were rerun · NorthstarIQ verified the result · version 12 was retained as
the rollback target. **NorthstarIQ did not perform the Salesforce mutation, and has no write path
that could.**

**Assessment Model v4, as executed 2026-09-05.** 116 records assessed — 79 Leads, 37 Opportunities ·
14 active controls · 6 areas · overall health **80** · 11 findings, 5 High. Pipeline Hygiene: 4
active controls, **3 of 4 scored**, area **41**. ⚠️ These values describe **this Developer Edition
dataset at that run** — they are not universal CRM health, and **v3 and v4 are not comparable**: the
active control composition differs, and no v3 assessment was ever run.

**The outcome branch, and what each side means.** **Closed Lost** → governed `Loss_Reason__c` from a
four-value restricted vocabulary, a preventive safeguard runtime validated in both refusal
directions, and an active independent detector. It means **loss intelligence and outcome evidence —
never Revenue.** **Closed Won** → Revenue Handoff Integrity, which at runtime evaluated **19 and
failed 19**: **19 missing governed Salesforce `OpportunityContactRole` evidence**, 1 missing Account
relationship, 1 missing `Amount` — overlapping counts across **19 unique records, never 21**. ⚠️ The
Account/`Amount` record is `NIQ-S8-B-Closed-Won-Unaffected` and is **`SYNTHETIC`**; the other 18 are
contact-role-only on organic sample data. **Live fail-path validated; no live pass-path evidence.**
Missing contact-role evidence is a statement about the **record**, never that no customer contact
exists. **Closed Won Value is the Opportunity `Amount` at close — not recognized revenue.**

**The forecast boundary.** Forecast Commitment Integrity is ratified, registered, active and
**Salesforce integration runtime validated**. Its runtime population was **0** — `Closed` 19 ·
`Pipeline` 17 · `Omitted` 1 · **`Best Case` 0 · `Commit` 0** — so it reported **NOT SCORED — NO
APPLICABLE RECORDS**: not a pass, not a failure, not 100. **No live pass path and no live fail
path**, and **no synthetic forecast record was created to manufacture one.** An empty governed
population is evidence about the boundary. Gate 3 does **not** prove Forecast Accuracy, forecast
prediction, historical forecast movement, scenario planning, seller-judgement correctness, quota
management or forecast-submission governance; all remain outside this foundation.

**Limitations that remain true after closure, carried rather than solved.** Revenue Handoff has **no
live pass path** · Forecast Commitment has **neither live path**, its population being empty · the
forecast period's exact bounds were **not exposed** in the runtime payload, only that exactly one
quarter resolved · **no evaluated Closed Won Opportunity carried an `OpportunityContactRole`** · the
`NIQ-S8-B` Account/`Amount` evidence is **`SYNTHETIC`** · the Closed Lost detector fail path is
**deterministic-test validated only** · seller-decision limits persist — **actor ≠ `OwnerId`**,
weekend-aware approximation, **not** Business Hours aware, **not** holiday aware, overdue path not
runtime observed · seller-persona evidence used **Administrator Login As, never direct seller
credentials** · `BR-14`, `BR-16` and `BR-17` remain **Deferred (P2)** and `PROB-018` remains
**partially addressed** · historical verification-query reproducibility stays incomplete for several
earlier increments, with Step 9 satisfying the current standard · the pre-existing `export-model`
mapping gaps for `closed-lost-reason` and `seller-decision-timeliness` remain · display evidence
stays capped at 10 rows while aggregate counts retain full totals · and all of this is **Developer
Edition portfolio-MVP evidence, not production-scale validation.** **None of these is a blocker after
closure, and none becomes a remediation task here.**

**Claims that remain prohibited.** Closed Won equals recognized, booked or contracted revenue ·
NorthstarIQ calculates or validates revenue recognition · no customer contact exists merely because
contact-role evidence is absent · Revenue Handoff live pass-path validation · Forecast Commitment
passed, clean, healthy or 100, or having any live path · Forecast Accuracy, movement or prediction ·
seller forecast judgement validated · runtime-observed forecast-period bounds · v4 better or worse
than v3 · overall 80 as universal CRM health · enterprise production readiness · stakeholder
approval. **There are no stakeholders — every decision here is a Portfolio Decision.**

**GATE 3 — SALESFORCE REVENUE LIFECYCLE PROVEN: COMPLETE.** The Salesforce revenue-lifecycle
foundation is closed on the evidence above, with every limitation recorded rather than resolved by
phrasing.

**NEXT ROADMAP PHASE — Multi-System Evidence / Automation. NEXT STEP — Step 10, Minimal Multi-System
Evidence Contract. STATUS — NOT STARTED**, and deliberately not designed here.

### 2026-09-05 — Step 10: the smallest thing a second evidence source actually needs

```
Requirement:   No new business requirement. An architecture contract so a
               second CRM can supply evidence without changing what any
               existing control means.
Salesforce:    NOTHING. No query, no mutation, no metadata, no permission,
               no deployment. The Salesforce foundation is scope-frozen.
Repository:    1 new module, 1 new test file, 6 small edits. No new
               dependency, no page, no registry, no framework.
Validation:    401/401 tests (7 new), tsc clean, production build clean,
               repository validator 50/0/0. MODEL_VERSION unchanged at v4.
Commit:        NOT COMMITTED - held for human review
```

**What was actually missing.** Inspection found the architecture already largely
source-neutral: detectors are pure functions over records someone else fetched, and
`RecordTable` renders links it is handed rather than links it builds. Two things were
not. A `CheckResult` carried **no statement of which system produced it** — harmless
with one source, and silent erasure of provenance with two. And building an
investigation link assumed one URL shape, one host and one id format.

**The contract is those two things and nothing else.** `EvidenceSourceId` — a union,
so a source with no link rule is a compile error rather than an unlinkable finding —
and `evidenceRecordUrl(source, tenant, recordId, objectType?)`, whose Salesforce
branch delegates to the existing `record-url.ts` rule **unchanged**. `CheckResult`
gains `source`, stamped once in `build()`, so attribution travels with the evidence
through the API, the exports and Finding Detail instead of being reconstructed at
each destination.

**Normalisation stops at attribution and reachability.** NorthstarIQ does not
normalise the records themselves. A Salesforce Lead and a HubSpot contact are not the
same object, and a shared record schema would misrepresent both. `objectType` is
accepted because HubSpot record URLs embed it and Salesforce Lightning URLs do not —
unused on the Salesforce branch by design, not by oversight.

**Salesforce behaviour is unchanged, and the diff shows it.** `score.ts`, `soql.ts`,
`assessment.ts` and `force-app/` are untouched. No control population, predicate,
failure condition, calculation or assessment outcome changed; all 394 pre-existing
tests pass unmodified. `instanceHost` threading was deliberately **kept** — removing
it would have been a thirteen-file refactor of completed work to serve an abstraction.

**⚠️ A contract is not evidence.** Step 10 creates **no runtime evidence for any
source**. No HubSpot source, adapter, connection, credential, fixture, control or UI
exists — `EvidenceSourceId` has exactly one member, and a test asserts that. Nothing
here upgrades any existing evidence classification: Revenue Handoff still has no live
pass path, Forecast Commitment still reports Not Scored on an empty population, and
every Gate 3 limitation stands unchanged.

**STEP 10 — SOURCE IMPLEMENTED · LOCALLY VALIDATED.** Step 11 remains NOT STARTED.

## Implementation Status

> ### ⚠️ SCOPE — the table below is the Increment 1–4 foundation, not the current build
>
> **The table and prose in this section describe the Salesforce foundation as it stood at Increment
> 4.** Everything built since — the lifecycle increments and the governed seller decision
> (Increments 7.2–7.8) — is recorded in the **dated entries above**, which are the authority for
> current state. Read any "complete" or "no further increment planned" wording here as scoped to
> Increment 4.
>
> Live at the time of writing: `Lead_Inbound_Before_Save` **version 15** — not version 13 as the
> table below states, with v14 retained as the rollback target · Sales Acceptance Policy **v1.2**
> active, carrying a 24-business-hour seller-decision commitment, with v1.0 and v1.1 retained
> inactive · seven additional `Lead` fields and two `Sales_Acceptance_Policy__mdt` fields deployed.
>
> The row-by-row foundation table is deliberately **not** rewritten for each later increment: doing so
> would duplicate the dated history that already owns it, and the two would drift apart.

**Increments 1-4 are deployed, runtime-validated, and human-accepted.** Increments 3 and 4 were
accepted as the **Seller persona**, not as an administrator. The web application's connected **read
path** was exercised against the org on 2026-08-24; **no Salesforce control behaviour was validated
by that run.**

**Salesforce lifecycle governance is implemented and validated**, and the `F-7` preventive
remediation is **deployed and runtime-validated** — `Lead_Inbound_Before_Save` version 13, nine
controlled runtime cases, with version 12 retained as the rollback target. The
`lifecycle-progression` **path B detective correction is implemented and validated**; it post-dates
that F-7 validation and was not used in it. The dated entries below and
[`testing-strategy.md`](testing-strategy.md) §2r–§2t own the evidence, including which findings were
runtime-confirmed and which remain source-derived.

| Area | Status |
|---|---|
| Salesforce org | ✅ Authenticated `northstariq-dev` · inspected read-only · **unmodified** |
| Custom fields — 2 formulas | ✅ **VALIDATED — all 4 branches** (gap closed in Increment 2) |
| Flow `Lead_Inbound_Before_Save` | ✅ **VALIDATED** — 8/8 Increment 2 scenarios, bulk-safe at batch 8, entry conditions verified. **Version 13 (2026-09-01)** carries the `F-7` sequencing remediation, so lifecycle qualification evaluates the state resolved by the same transaction; deployed and runtime-validated across nine controlled cases, version 12 retained as the rollback target. |
| `Normalized_Domain__c` · `Segment__c` · `Segment_Basis__c` | ✅ **VALIDATED** — populated and explained by the Flow |
| `Territory__c` · `Match_Status__c` · `Matched_Account__c` · `Routing_Reason__c` · `Exception_Type__c` | ✅ **VALIDATED (Inc 3)** |
| `Account.Normalized_Domain__c` | ✅ **VALIDATED (Inc 3)** — reproduces Lead normalization on all 13 stock Accounts |
| Queues — 3 | ✅ **VALIDATED** — coverage pools and fail-safe exception destination |
| Custom fields — SLA (4) | ✅ **VALIDATED (Inc 4)** — write-once target, basis and first touch; `SLA_Status__c` formula, zero mutation |
| Custom Metadata records | ✅ **VALIDATED as recorded below** — 4 `Segment_Band__mdt` (Inc 1, match source field-by-field) · 9 `Routing_Rule__mdt` (Inc 3, 4 territories → 2 coverage queues) · 3 `Routing_Readiness_Source__mdt` (reconciled 2026-08-26) · **10 `Lifecycle_Transition__mdt`** (deployed 2026-08-27, read back from the org). The stage-qualification policy records — `MQL_Qualification_Policy__mdt`, `Sales_Acceptance_Policy__mdt`, `SQL_Qualification_Policy__mdt` — were added by the enforcement increments and carry their validation in those entries. Count the `*.md-meta.xml` files in `force-app` for the current total; a figure here would go stale with the next configuration record. |
| Custom Metadata Types | ✅ **DEPLOYED** — segmentation, routing, routing readiness, lifecycle transitions, and the three stage-qualification policies. `force-app/main/default/objects/*__mdt` is the authority on which types and fields exist; the per-type field counts recorded when each was deployed are in that increment's entry. |
| Global value sets | ✅ **VALIDATED** — enforced `restricted=true` on all 5 consuming fields |
| Standard value sets | ✅ **VALIDATED** — `AccountType` = 8 values, 7 originals intact + `Churned` |
| Lead field history | ✅ **VALIDATED** — `Status` and `OwnerId` capture verified and reverted |
| OWD | ✅ **VALIDATED** — 5 objects confirmed by metadata retrieve |
| Permission sets — 4 | ✅ **`NIQ_Revenue_Seller` VALIDATED** — assigned to a real non-admin principal; effective FLS read-only on all 10 derived fields; `UserRecordAccess` 3/42. `NIQ_Rule_Configuration` still unassigned. ✅ **`NIQ_Integration_Read`** — read access probed 2026-08-26; **no write boundary executed against it** (`security-model.md` §4b). |
| Representative Seller | ✅ **VALIDATED + HUMAN ACCEPTED** — 1 user, Minimum Access + `NIQ_Revenue_Seller`, no role, 1 queue. Field authority proven by a principal FLS actually constrains. |
| Business Hours + Holidays | 🟡 **Moved to the SLA increment** — nothing in Foundation consumes them |
| Reports · dashboards | ✅ **DEPLOYED** — `NIQ Open SLA Risk`, `NIQ SLA Attainment by Segment`. **0 dashboards built.** |
| `User` routing fields — 3 | 🟡 **DEPLOYED, UNCONSUMED** — `Territory__c`, `Routing_Eligible__c`, `Last_Assigned_DateTime__c`. Round robin (`BR-09`, `PD-07`) deferred at Increment 3; `Lead_Inbound_Before_Save` holds **0 references** to them. Territory coverage routes to a queue, not to a seller. |
| Role hierarchy | 🟡 **CANDIDATE — not built.** The representative Seller holds no role; queue membership carries visibility. |
| Apex | 🟢 **1 seam approved, 0 implemented** — holiday-aware SLA (`ASM-13` falsified at org inspection). Increment 4 shipped a documented weekend-aware declarative approximation instead. |
| Dataset | ⬜ Not generated, not loaded |
| Tests | ✅ **EXECUTED** — 8/8 Inc 2 · 9/9 Inc 3 · 6/6 Seller security + `BR-08` regression · 15/15 Inc 4 · 50/50 web unit. **No scenario has run against the designed dataset**, which does not exist. |
| Power BI | ⬜ Not started |

### Web MVP status — separate from the Salesforce table above

The table above records the **Salesforce** implementation. The application under `web/` is a
different artifact with a different evidence standard, so it is stated separately rather than
folded into rows about org metadata.

| Area | Status |
|---|---|
| Next.js application under `web/` | ✅ **IMPLEMENTED** — in source control. Dashboard, Assessment, Findings, Finding Detail and Integrations, over server-side API routes. Enumerate `web/app` for the current route set rather than quoting a count from here. |
| Assessment checks + scoring | ✅ **VALIDATED against fixtures** — 166/166 unit tests, no network, no org. **Assessment Model v2 (2026-08-28): 6 areas, 11 scored controls, overall 60.** A control that evaluates no record is **Not Scored**, never 100. ⚠️ v1's overall 62 is not comparable: area weighting and scoring eligibility both changed. |
| Opportunity Conversion Integrity — NorthstarIQ detective control | ✅ **IMPLEMENTED and VALIDATED (2026-08-27)** — live read-only run: **3 evaluated, 3 failing**, one finding. Compares `Lead.Status` against the platform’s `IsConverted`; `ConvertedOpportunityId` is never required, because Salesforce permits conversion without an Opportunity. Truth-synced 2026-08-27: its preventive half **is** built — `Lifecycle_Transition__mdt` + `Lead_Inbound_Before_Save`, verified against native Lead Conversion — but governs new transitions only. ✅ **SCORED since Model v2 (2026-08-28)**. |
| Lifecycle taxonomy — `Lead.Status` + `Lifecycle_Transition__mdt` | ✅ **DEPLOYED and VALIDATED (2026-08-27)** — 7 status values, 10 transition records. |
| SQL qualification enforcement — `SQL_Qualification_Policy__mdt` + `Lead_Inbound_Before_Save` | ✅ **IMPLEMENTED and VALIDATED (2026-08-27), policy v1.0** — 11/11 behavioural scenarios including native conversion. Requires substantiated Sales acceptance, a governed business need and an agreed next step dated today or later. ⚠️ **SYNTHETIC BASELINE** policy. The detective half is now **implemented** as Sales Acceptance / SQL Integrity. |
| Sales acceptance enforcement — `Sales_Acceptance_Policy__mdt` + `Lead_Inbound_Before_Save` | ✅ **IMPLEMENTED and VALIDATED (2026-08-27), policy v1.0** — 9/9 behavioural scenarios. Requires an explicit seller acceptance and a substantiated Marketing handoff before `SAL`; records who accepted, when, and under which policy. ⚠️ **SYNTHETIC BASELINE** policy. Sales Acceptance / SQL Integrity (detective) is now **implemented**. |
| MQL qualification enforcement — `MQL_Qualification_Policy__mdt` + `Lead_Inbound_Before_Save` | ✅ **IMPLEMENTED and VALIDATED (2026-08-27), policy v1.1** — 10/10 then 11/11 behavioural scenarios. **Four** required conditions declared on the policy record, none weighted; blocks an unearned MQL claim and records `MQL_Basis__c` when it is earned. Seller first touch was removed in v1.1 and is now a candidate for SAL. ⚠️ **SYNTHETIC BASELINE** policy. |
| Lifecycle Progression Integrity — NorthstarIQ detective control | ✅ **IMPLEMENTED and VALIDATED (2026-08-27)** — 28 fixture scenarios plus a live read-only run: 15 evaluated, 0 failing, 6 unmeasurable. Builds its model from `Lifecycle_Transition__mdt` and holds no transition matrix of its own. ✅ **SCORED since Model v2 (2026-08-28)**. **Corrected 2026-09-01** — contradiction path B now compares stage entry to record creation at day precision, after a false positive on a controlled fixture. Detective-only; no Flow or governed configuration changed. The correction post-dates the `F-7` runtime validation and was not used in it. |
| MQL Qualification Integrity — NorthstarIQ detective control | ✅ **IMPLEMENTED and VALIDATED (2026-08-27)** — 22 fixture scenarios plus a live read-only run. Reads the same governed policy the Flow consults and judges existing claims against it. ✅ **SCORED since Model v2 (2026-08-28)**. |
| Sales Acceptance / SQL Integrity — NorthstarIQ detective control | ✅ **IMPLEMENTED and VALIDATED (2026-08-27)** — 37 fixture scenarios plus a live read-only run: **0 evaluated, 0 failing, 3 unmeasurable, 46 outside**. No baseline Lead has ever been through the governed handoff, and none was created to change that. Consumes `Sales_Acceptance_Policy__mdt` v1.0 and `SQL_Qualification_Policy__mdt` v1.0 as two separate definitions; judges the recorded next-step date against the recorded qualification event, never against TODAY. ✅ **SCORED since Model v2 (2026-08-28)**. |
| Lifecycle transition enforcement — `Lead_Inbound_Before_Save` | ✅ **IMPLEMENTED and VALIDATED (2026-08-27)** — 9/9 behavioural scenarios for ordinary Status edits, plus native Lead conversion verified separately the same day. Blocks a transition absent from the policy — including one attempted through Salesforce Lead Conversion — and stamps `Lifecycle_Stage_Entered__c` on create and on an allowed transition. |
| Negative control (governed without segment) | ✅ **VALIDATED against fixtures** — returns zero, never rendered |
| SLA measurable-population rule (`M-07`) | ✅ **VALIDATED against fixtures** — unmeasurable Leads excluded from the denominator |
| Disconnected / not-configured path | ✅ **VERIFIED locally** — every page renders, no results are invented |
| Salesforce integration boundary (`lib/salesforce.ts`) | ✅ **VALIDATED — read path only (2026-08-24)**. Authenticated and read `Lead` and `Opportunity`. Write path absent, not disabled. |
| Connected path (auth, SOQL, live assessment) | ✅ **VALIDATED — read only (2026-08-24)** — 81 records, overall health 68, 6 findings returned |
| Salesforce Connected App / OAuth credentials | ✅ **CONFIGURED** — Client Credentials Flow reaches the org. Credentials are held in `web/.env.local`, which is git-ignored; org-side configuration is **not inspected** in this repository. |
| **Salesforce control behaviour judged by those findings** | ⬜ **NOT VALIDATED BY THE WEB APP.** The application reports org state; it exercises no control. Control validation remains the Increment 1-4 evidence above and nothing else. |
| Salesforce error classification at the boundary | 🟡 **UNEXERCISED against the org** — the failure path was exercised by intercepting the browser fetch, not by a real Salesforce error |
| Assessment UI rework + design-system passes | ✅ **IMPLEMENTED (2026-08-24)** — detector clean; contrast, focus and heading order measured at 1366x599 |
| Accessibility (WCAG 2.2 AA) | 🟡 **PARTIAL** — text contrast, focus visibility, heading order and the zero-meter boundary measured and passing. No screen-reader pass, no real-keyboard traversal, no viewport below 720px measured. |
| Synthetic dataset (~190 records) | ⬜ **NOT GENERATED** — the live run judged records the org already held, not the designed dataset |
| Vercel deployment | ⬜ **NOT DEPLOYED** — no project exists |

### Evidence-standard gap — recorded, not resolved

[`testing-strategy.md`](testing-strategy.md) §7 requires five conditions for **Validated**, including
**(4) a re-runnable SOQL query or report supports the claim**. **`scripts/soql/` now holds
version-controlled read-only queries covering the lifecycle work only** — see the directory itself
for the current set rather than a count quoted here.

⚠️ **Every committed query was written *after* the validation it relates to, and each says so in its
own header.** They make a result **re-checkable**; none is the evidence that was used at the time,
and none may be presented as such.

Validation queries for Increments 1-4 **were executed** against the org and their **outcomes** are
recorded in the dated entries above. The **queries themselves were not committed**, so a reader
cannot re-run those increments from this repository today. **Criterion 4 is narrowed for the
lifecycle work and remains open for Increments 1-4** — narrowed by committing queries, not by
relaxing the standard.

**The standard is not being broadened to accommodate this, and no result is being downgraded to
conceal it.** The executed verification evidence is real: field-by-field CMDT comparison, Tooling API
and metadata-retrieve confirmation, `UserRecordAccess` counts, effective-FLS checks, and the recorded
scenario outcomes above including failures. What is missing is the **re-runnable artifact**, not the
execution.

Two rows already satisfy criterion 4 by report rather than by query: `NIQ Open SLA Risk` and
`NIQ SLA Attainment by Segment`.

**Closing this gap means committing the queries. It is not closed by editing this document.**

### Developer Edition constraint — recorded

**The fictional enterprise contains more personas than Developer Edition can instantiate.** Four
Salesforce licences exist, two are consumed by administrators, leaving **two** for representative
seller testing. Platform licences (6 free) cannot access Lead or Opportunity.

Existing users are **not** deactivated to manufacture personas. `BR-20` access testing is therefore
demonstrated across two seller users, and the gap between the designed access model and the
physically testable one is stated rather than hidden.

---

## Next Step

**Salesforce foundation was MVP COMPLETE at Increment 4**, and Increments 1-4 are human-accepted.
That statement has since been overtaken: **further Salesforce configuration increments were planned
and shipped** — the governed seller decision (Increments 7.2 onward) added `Lead` fields, a Custom
Metadata field, Flow versions 14 and 15, and the v1.1 → v1.2 acceptance-policy succession. The rest
of this section reflects the position as of Increment 4 and is kept as the record of that moment,
not as a current roadmap.

**The external NorthstarIQ application now exists** - read, assess, findings, evidence - and is
committed in this repository under `web/`. Writes remain deliberately held back; there is no write
path in the application at all.

**That step has now been taken.** The Connected App exists, the Client Credentials Flow reaches the
Developer Edition org, and one assessment ran against real org data on 2026-08-24 — 81 records,
overall health 68, six findings. The connected path is no longer unexercised, and the entry for that
date states exactly how far the result reaches.

**It reaches less far than it looks.** The run proves the application can authenticate and read. It
proves nothing about routing, segmentation, SLA or matching behaviour, because reading a record that
sits in an exception queue is not a test of the automation that put it there. Control evidence
remains what Increments 1-4 recorded, and nothing in the web application adds to it.

**The next step is the generation and load of the ~190-record synthetic dataset** described in
[`testing-strategy.md`](testing-strategy.md). Until it exists, every live figure the application
displays is a reading of whatever records the org happened to hold from increment testing — real,
but not the purposeful population the scenarios were written against, and therefore not a basis for
any claim about the designed defect profile.

Vercel deployment still comes after that, not before.

**Deferred, and deliberately not resolved during closeout:**

| Deferred item | Status |
|---|---|
| Seller Account record visibility / `Matched_Account__c` display under Account Private OWD | **Deferred.** The Seller holds Account object Read but no record access, so the lookup may render blank. `Routing_Reason__c` remains the seller-facing explainability mechanism. |
| Final NorthstarIQ UX / visual design | **Deferred.** The `NorthstarIQ - Functional Validation` layout section remains **temporary validation scaffolding** and is **not** the approved NorthstarIQ visual identity. |
