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

---

## Implementation Status

**Increment 1 (Foundation) is implemented. Nothing is Validated** — no test has been executed.

| Area | Status |
|---|---|
| Salesforce org | ✅ Authenticated `northstariq-dev` · inspected read-only · **unmodified** |
| Custom fields | ✅ **12 Implemented** (Lead 6 · Account 3 · User 3) — 0 Validated |
| Custom Metadata Types | ✅ **2 Implemented** with 13 fields — 0 Validated |
| Custom Metadata records | ✅ **4 Implemented** (`Segment_Band__mdt`) — 0 Validated |
| Global value sets | ✅ **2 Implemented** |
| Standard value sets | ✅ **3 Implemented** (`AccountType` += `Churned`) |
| Permission sets | ✅ **3 Implemented**, 21 FLS entries — **0 assigned, 0 tested** (`NIQ_Analytics_Read` deferred) |
| OWD | ✅ **5 changed** — Lead/Account/Opportunity/Case Private, Contact ControlledByParent |
| Lead field history | ✅ **Implemented** — `Status` and `OwnerId` tracked |
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

**Increment 2 — not started, and not to be started without approval.** Foundation carries structure
only; no automation reads or writes any of it yet.
