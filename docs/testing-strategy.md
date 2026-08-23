# Testing Strategy

| | |
|---|---|
| **Purpose** | How this project proves that what it built actually works |
| **Status** | 🟡 **CANDIDATE** — no test has been executed. **No results exist.** |
| **Related** | [`requirements.md`](requirements.md) · [`architecture.md`](architecture.md) · [`security-model.md`](security-model.md) |

---

## ⚠️ No Test Results Exist

**Nothing in this document has been run.** No scenario has been executed, no dataset loaded, no
assertion evaluated.

**Fabricating a test result is the most damaging thing this project could do.** A documented
architecture that turns out to be wrong is a design error. A documented *test result* that never
happened is a fabrication, and it invalidates every other claim in the repository.

Results are recorded in [`implementation-log.md`](implementation-log.md) with the date, the org
state, and the actual outcome — including failures.

---

## 1. Principles

| Principle | Detail |
|---|---|
| **Deterministic over voluminous** | 190 purposeful records beat 10,000 random ones. A test that cannot be repeated exactly is not a test. |
| **Every record exists for a reason** | Each synthetic record maps to a named scenario. A record serving no scenario is deleted. |
| **Negative assertions are primary evidence** | Proving something *cannot* happen is harder and more valuable than proving it can. |
| **Boundaries are where designs fail** | Anything works in the middle of a range. Every threshold gets a test at the boundary and on both sides. |
| **The exception path is the main path** | At a 48% incomplete-data rate, testing only the happy path tests the minority case. |
| **Test the requirement, not the implementation** | A test asserts the acceptance criteria in `requirements.md`, so it survives a change of mechanism. |

---

## 2. Scenario Coverage

**17 scenarios.** Every one must be exercised by at least one record in the dataset, and every
record in the dataset must serve at least one scenario.

| # | Scenario | Requirement | Expected outcome |
|---|---|---|---|
| 1 | **Segment boundary** | `BR-05` | 99 → SMB · 100 → Mid-Market · 999 → Mid-Market · 1,000 → Enterprise. Inclusive-low, exclusive-high. |
| 2 | **Territory resolution** | `BR-06` | Each of the four territories resolves from country/state. Boundary states map to exactly one. |
| 3 | **SMB round robin** | `BR-09`, `PD-07` | Successive SMB records distribute across eligible sellers by least-recently-assigned. Verifiable by query. |
| 4 | **Strategic Account** | `BR-07`, `PD-02` | Strategic flag wins over territory and over size-derived segment. Not routed away. |
| 5 | **Existing customer** | `BR-03`, `BR-07` | Lead matching a customer Account routes to that Account's owner, not round robin. |
| 6 | **Existing Account, not a customer** | `BR-03` | Match recorded; customer status = Prospect; routing falls through to territory. |
| 7 | **Lead-to-Account match by domain** | `BR-03`, `PD-04` | Exact normalized domain → Matched, with basis recorded. |
| 8 | **Duplicate** | `BR-04` | Probable duplicate surfaced to review. **Nothing merged.** |
| 9 | **Missing routing data** | `BR-02`, `BR-13` | Missing country and/or employee count → incomplete, with the specific reason readable, and a classified exception. |
| 10 | **Invalid / incomplete data** | `BR-01` | Malformed domain, country variant, unnormalizable value → normalized where possible, marked unnormalizable where not, original preserved. |
| 11 | **Inactive / ineligible seller** | `BR-08`, `OD-02` | Ineligible seller skipped, the skip recorded, next eligible seller assigned. |
| 12 | **Routing exception** | `BR-13` | No eligible seller → classified exception in `Routing_Exception_Queue`. Never silently unassigned. |
| 13 | **SLA met** | `BR-10`, `BR-11` | First touch inside the segment target on business hours → Met. |
| 14 | **SLA breached** | `BR-10`, `BR-12` | First touch after the target, or deadline passed with no touch → Breached, visible to an accountable owner. |
| 15 | **SLA unmeasurable** | `BR-11` | Deadline passed, no first-touch signal → **Unmeasurable, not Breached.** Excluded from attainment. |
| 16 | **Lifecycle progression** | `BR-15` | Valid stage transition recorded with timestamp. |
| 17 | **Invalid lifecycle transition** | `BR-15` | Disallowed transition prevented or surfaced. |

### Boundary cases that must be explicit

| Boundary | Cases |
|---|---|
| Segment thresholds | 99 · 100 · 999 · 1,000 · null |
| SLA clock | Overnight · weekend · **holiday** · exactly at target |
| Territory | Each boundary state · unmapped country · null country · US with no state |
| Match confidence | Exact domain · review-band similarity · below threshold |
| Round robin | First assignment · after a skip · after a reassignment |

**The holiday case matters most.** It is the case a custom business-hours implementation would get
wrong, and the reason `PD-05` uses standard Salesforce Business Hours.

---

## 2b. Increment 2 Test Fixtures — executed 2026-08-22

Eight fictional Leads, created in **one bulk batch**, each covering a normalization case *and* a
segmentation boundary. Names are prefixed `NIQ Test -`; domains use RFC 2606 reserved
`.example.*` ranges. **No real PII.** These are increment fixtures, deliberately separate from the
portfolio dataset in §3.

| Fixture | Website / Email | Employees | Country | Expected domain | Expected segment |
|---|---|---:|---|---|---|
| HTTPS WWW / SMB Below | `https://www.northstar-alpha.example.com` | 99 | US | `northstar-alpha.example.com` | SMB |
| HTTP Path / MM At | `http://northstar-beta.example.net/products/` | 100 | US | `northstar-beta.example.net` | Mid-Market |
| Bare Domain / MM Above | `northstar-gamma.example.org` | 101 | US | `northstar-gamma.example.org` | Mid-Market |
| WWW No Scheme / MM Upper | `www.northstar-delta.example.com` | 999 | US | `northstar-delta.example.com` | Mid-Market |
| Email Fallback / ENT At | *(no website)* `ops@northstar-epsilon.example.com` | 1000 | US | `northstar-epsilon.example.com` | Enterprise |
| No Domain Source / ENT Above | *(both blank)* | 1001 | **blank** | *(blank)* | Enterprise |
| Trailing Slash / SMB Zero | `https://northstar-eta.example.com/` | 0 | US | `northstar-eta.example.com` | SMB |
| Null Employees Unsegmentable | `www.northstar-theta.example.com` | **null** | **blank** | `northstar-theta.example.com` | *(none)* |

**Result: 8 of 8 scenarios passed on first execution.** Every boundary — 0, 99, 100, 101, 999,
1000, 1001, null — behaved as the configuration specifies.

### The data-quality gap is now closed

Increment 1 could only reach 2 of 4 formula branches, because all 22 stock Leads carry a country.
Two fixtures were given a blank country deliberately:

| Case | Inputs | Expected | Actual | |
|---|---|---|---|---|
| A | Country ✓ Employees ✓ | `Complete` / `None` | matched | ✅ |
| B | Country ✓ Employees ✗ | `Incomplete` / `Missing: EmployeeCount` | matched | ✅ |
| C | Country ✗ Employees ✓ | `Incomplete` / `Missing: Country` | matched | ✅ **closed** |
| D | Country ✗ Employees ✗ | `Incomplete` / `Missing: Country EmployeeCount` | matched | ✅ **closed** |

### Bulk safety

| Test | Batch | Result |
|---|---:|---|
| Insert | 8 | 8/8 correct — Flow does not depend on single-record execution |
| Update | 8 | 8/8 recalculated when employee count changed in one batch |

Modest batch by design: Developer Edition storage is 5 MB and volume is not evidence. This proves
multi-record execution, **not** production-scale performance, which this project does not claim.

### Entry-condition test

| Action | Expected | Actual | |
|---|---|---|---|
| Edit `Segment__c` alone | Flow does **not** run; the edit stands | edit retained | ✅ |
| Then change `NumberOfEmployees` | Flow runs; segment recalculates | recalculated | ✅ |

> This also exposes a real gap: a manual `Segment__c` edit survives only until an input changes,
> then is silently overwritten. `architecture.md` §5 requires an override to be *recorded* and not
> overwritten. **Override tracking is not implemented** and no override field exists.

---

## 2c. Increment 3 Test Fixtures — executed 2026-08-22

Nine fictional Leads in one bulk batch, plus one stock Account designated Strategic. Stock data
supplied the ambiguous match (`uos.com` on three Accounts) and the unsupported geography (`FR`), so
no fixture was created for either.

| Fixture | Geography | Match | Segment | Territory | Exception | Owner |
|---|---|---|---|---|---|---|
| Match Customer NA-East | US/TX | Matched | Enterprise | NA-East | — | Account owner |
| **Strategic Override** | US/NC | Matched | **Strategic** | NA-East | — | Account owner |
| **Ambiguous Match** | US/NY | **Review** | Enterprise | NA-East | Ambiguous Match | Exception queue |
| No Match NA-West | US/**CA** | No Match | SMB | **NA-West** | — | NA coverage |
| **UK-IE Owner Preserved** | GB | No Match | Mid-Market | UK-IE | **Non-Routing Intake** | **unchanged** |
| DACH Coverage | DE | No Match | Enterprise | DACH | — | EMEA coverage |
| Unsupported Geography | **FR** | No Match | Mid-Market | — | Unsupported Geography | Exception queue |
| Missing Geography | *(none)* | No Match | SMB | — | Missing Geography | Exception queue |
| US No State Default | US | No Match | Mid-Market | NA-East | — | NA coverage |

**Result: 9 of 9 passed.** The three ownership states are all proven: governed intake + routable →
automated ownership · governed intake + unresolvable → exception queue · non-governed intake →
**owner preserved**.

### Defect found by testing

> **Territory resolution depended on Custom Metadata record order.** US/California resolved to
> NA-East instead of NA-West, because the country-default rule was evaluated before the
> state-specific one. Fixed by capturing specific and default matches into separate variables and
> resolving by **specificity** after the loop. Correctness no longer depends on query order.
>
> This is exactly what the boundary fixtures exist to catch — the happy paths all passed.

### Regression

Increment 2: **8 of 8 fixtures unchanged** — `Territory__c` and `Match_Status__c` correctly remain
blank on them, since they were not modified and the Flow only runs on create or a relevant change.
Increment 1: 4 segment bands intact, Lead history still capturing, OWD unchanged.

---

## 2d. Seller security + BR-08 regression — executed 2026-08-22

### Negative-security tests (representative Seller)

| Test | Result | Evidence |
|---|---|---|
| **A** Field visibility | ✅ | All 10 derived fields `read = true` in effective FLS |
| **B** Edit restriction | ✅ | `edit = false` on all 10 from **every** grantor; neither grantor holds Modify All / View All, so FLS is enforced |
| **C** Business fields editable | ✅ | Lead Edit granted; no restrictive FLS on `Company`, `Website`, `NumberOfEmployees`, geography |
| **D** Automation authority | ✅ | Employees 40 → 1500 ⇒ Segment SMB → Enterprise, on a field no user may edit |
| **E** Territory recalculation | ✅ | State CA → NY ⇒ Territory NA-West → NA-East; owner unchanged |
| **F** Record access | ✅ | `UserRecordAccess`: **3 of 42** Leads readable — exactly the `NIQ_North_America` queue records |
| **G** Admin comparison | ✅ | Admin editability comes from **`Modify All Data` bypassing FLS** — by design, not a failure |

**B–E were executed with admin credentials** via effective-permission computation and the platform's
own access engine. The runtime rejected-update *as the Seller* is a UI step, deliberately left to
human validation. No password was set and no credential was handled.

### BR-08 AC5 regression — all 6 pass

| Test | Result |
|---|---|
| **1** Governed creation | ✅ 9/9 routed with correct `At intake:` explanation |
| **2** Governed employee update | ✅ Segment recalculated; **owner, reason and exception all survived unchanged** |
| **3** Governed geography update | ✅ Territory NA-West → NA-East; **not** reclassified Non-Routing Intake; original explanation preserved |
| **4** Non-governed creation | ✅ Owner preserved, `Non-Routing Intake`, territory still derived |
| **5** Non-governed update | ✅ Segment recalculated; ownership and reason still preserved |
| **6** Bulk update, 9 records (8 governed + 1 non-governed) | ✅ **0** ownership changes, **0** reasons altered, **0** exception types altered, **0** reclassified |

### Seller input access — corrected 2026-08-22

The Seller held FLS on the ten derived fields and none of the inputs, so `Website`,
`NumberOfEmployees` and the address were invisible despite being on the layout. Corrected with three
FLS rows on `NIQ_Revenue_Seller`: `Website`, `NumberOfEmployees`, and the compound `Address`.

| Verified after deployment | Result |
|---|---|
| 7 approved logical inputs readable + editable | ✅ |
| 10 NorthstarIQ derived fields still non-editable | ✅ 0 violations |
| PII (`Email`, `Phone`, `MobilePhone`) | ✅ still ungranted |
| Lead CRUD, Account access, queue, OWD, profile, layout | ✅ unchanged |
| Seller record access | ✅ still 3 of 42 |

### Current vs historical — stated so it cannot mislead

After TEST 3 the record reads `Territory__c = NA-East` (current classification) and
`At intake: Territory Coverage: NA-West -> NIQ_North_America | Rule v1.0` (the routing decision as
made). **Both are true.** The `At intake:` prefix marks the reason as historical, which is what
`BR-08` AC5 preserves. Ownership stayed correct throughout, since `NA-West` and `NA-East` both map
to the same coverage queue.

---

## 2e. Increment 4 SLA tests — executed 2026-08-23

**7 fixtures**, covering all seven SLA states.

| # | Claim | Result |
|---|---|---|
| 1 | Eligible Lead starts SLA | ✅ target + basis written at intake |
| 2 | Non-governed Lead excluded | ✅ target blank, `Excluded` |
| 3 | Routing exception excluded | ✅ blank, basis states RevOps triage |
| 4 | Unrelated update (Title) leaves SLA unchanged | ✅ byte-identical |
| 5 | Legitimate input change does not alter SLA | ✅ Segment recalculated SMB→Enterprise; **target and basis unchanged** |
| 6 | Seller cannot edit SLA fields | ✅ `edit=false` on all 4, both permission sets |
| 7 | Owner never changed by SLA automation | ✅ runtime **and** source: no SLA element assigns `OwnerId` |
| 8 | Early response becomes Met | ✅ |
| 9 | Genuine untouched breach | ✅ `Breached` |
| 10 | Late response distinguished | ✅ `Breached (Late Response)` |
| 11 | Missing configuration fails safely | ✅ blank target, `Unmeasurable`, basis names the missing config — **no deadline invented** |
| 12 | Reassignment does not restart SLA | ✅ |
| 13 | Repeated Status changes do not move first touch | ✅ write-once held across 2 further changes |
| 14 | Bulk (9 records, mixed) | ✅ 0 owner / 0 target / 0 basis / 0 first-touch changes |
| 15 | Increments 1–3 regression | ✅ 9/9 routing, 8/8 governed reasons, 9 rules, 3 queues, 0 Apex |

### Test method note — honest about the artifact

Breach states could not be produced with the real 4-hour configuration, because testing occurred on a
**local Saturday** and the weekend shift pushes every target at least two days out. Breach fixtures
were therefore created under a **temporary negative `SLA_Response_Hours__c` value**, deployed and
**reverted immediately** (verified back at 4 for all four bands).

**The target was still computed by automation from configuration** — no SLA field was ever written by
hand. That distinction is what keeps the provenance argument intact.

---

## 3. Dataset Specification

| Object | Count | Purpose |
|---|---:|---|
| Users | **9** | 4 sellers (2 per territory) · 1 ineligible · 1 manager · 1 RevOps · 1 analyst · 1 admin |
| Accounts | **35** | 12 customers · 3 churned · 2 strategic · 4 parent/child · 14 prospects, spread across segments and territories |
| Contacts | **35** | Includes 4 that Leads will duplicate (scenario 8) |
| Leads | **85** | ~40 clean · ~30 with deliberate defects · ~15 boundary cases |
| Opportunities | **24** | Across segments and stages, for funnel measurement |
| **Total** | **~188** | |

### Lead composition

| Group | Count | Serves |
|---|---:|---|
| Clean, routable, complete | ~40 | Scenarios 1–7, 13, 16 — the paths that must work |
| Missing country and/or employee count | ~14 | Scenario 9 — **reflects the 48% baseline defect profile** |
| Unnormalizable or malformed values | ~8 | Scenario 10 |
| Probable duplicates | ~8 | Scenario 8 |
| Boundary values | ~15 | Scenarios 1, 2, 13–15 |

**Defects are constructed to match the baseline defect profile**, not randomly corrupted. A random
corruption tests nothing in particular; a deliberate one tests the specific failure the discovery
found.

### Rules

| Rule | Detail |
|---|---|
| Deterministic | The same generation inputs produce the same dataset, every time |
| Fictional | Invented companies and people. **No real organization, no real person, no real PII.** |
| Purposeful | Every record maps to a scenario in §2 |
| Small | ~190 records. Volume is not evidence. |
| Labelled | Identifiable as synthetic wherever it surfaces |

---

## 4. Validation Approach

| Layer | Method | Evidence |
|---|---|---|
| **Field behaviour** | Load a record, inspect the derived values | Before/after field state |
| **Automation** | Load a scenario fixture, assert the outcome | Expected vs actual, recorded |
| **Bulk safety** | Load records in a single batch, not one at a time | No governor limit errors; identical per-record outcomes |
| **Explainability** | For every routed record, assert a reason exists and names the precedence basis | **An empty `Routing_Reason__c` is a test failure** |
| **Reporting** | Report figure reconciles to a SOQL query on the same population | Both numbers recorded |
| **Analytics** | Power BI figure reconciles to the same SOQL query | Both numbers recorded |
| **Access** | Execute as each persona — positive and negative | §5 matrix |

### Bulk safety

Automation is asserted at batch volume, not one record at a time. **A Flow that works on a single
record and fails at 200 is the most common automation defect in an org of this shape** (`RISK-009`),
and single-record testing cannot detect it. Fixtures load in batch for exactly this reason.

### SOQL validation

Validation queries live in `scripts/soql/`, versioned alongside the metadata they check. Each query
answers one question and is named for it — for example: every assigned Lead has a routing reason;
no Lead sits unassigned and unclassified; segment distribution matches the fixture expectation.

**The SOQL query is the evidence.** A screenshot is an illustration; a query anyone can re-run is a
result.

---

## 5. Access Test Matrix

Executed as each persona. **Negative assertions are the primary evidence** (`BR-20`, `SP-5`).

| Persona | Must be able to | Must **not** be able to |
|---|---|---|
| `PER-03` Account Executive | Read/edit owned records; log activity; convert a Lead | Read another seller's Lead · edit governed configuration · reassign outside their ownership |
| `PER-04` SDR / BDR | Work owned Leads; **read customer status on their own Lead** | Browse the Account base · read another user's Lead · edit configuration |
| `PER-01` Revenue Operations | Work any revenue record; reassign; resolve exceptions | **Merge records** · administer the platform · change access |
| `PER-01` + `NIQ_Rule_Configuration` | Edit governed rule configuration | Administer users or access |
| `PER-02` Sales Manager | See team records via role hierarchy; view SLA reports | Edit routing rules or thresholds |
| `PER-06` Data / BI Analyst | Read revenue objects for analysis | **Write any operational record** · edit configuration |
| Analytics principal | Read for extraction | **Write anything** · administer anything · read beyond its scope |

**A failed negative assertion blocks the access model from being described as verified.** Not
"noted as a follow-up" — blocked.

---

## 6. Regression

Small, single-org, single-builder. The approach is proportionate to that, not to an enterprise
release process.

| Trigger | Re-run |
|---|---|
| Any change to a governed rule (threshold, precedence, territory map, SLA target) | Full scenario set — **these changes affect every record** |
| Any change to an automation element | The scenarios that automation serves, plus bulk safety |
| Any change to a permission set or OWD | The full access matrix, both directions |
| Any change to a field used by a derivation | The scenarios consuming that field |

**Configuration changes get the widest regression**, because that is precisely what makes them
powerful: a threshold edit reshapes behaviour for every record, without a deployment to review.

### Rollback

Metadata is source-controlled, so the prior state of any component is recoverable from git. A
configuration change is reverted by restoring the prior configuration record and re-running the
scenarios that depend on it.

---

## 7. Evidence Standard

A capability may be described as **Validated** only when all of the following exist:

1. The metadata is in source control
2. The scenario was executed against a loaded dataset
3. The actual outcome was recorded — **including failures**
4. A re-runnable SOQL query or report supports the claim
5. The date and org state are recorded in [`implementation-log.md`](implementation-log.md)

| Prohibited | Why |
|---|---|
| Recording a result that was not executed | Fabrication — invalidates everything else in the repository |
| Describing a candidate component as implemented | Misrepresents the state of the work |
| Claiming a measured improvement against a **synthetic** baseline | The baseline is invented; only the design behaviour is demonstrable |
| Claiming performance at scale | Bulk-safe design is demonstrated at fixture volume. Production scale is not claimed. |
| Omitting a failed test | A test suite with no failures recorded is not a test suite anyone should believe |
