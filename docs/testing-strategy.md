# Testing Strategy

| | |
|---|---|
| **Purpose** | How this project proves that what it built actually works |
| **Status** | 🟢 **Strategy defined · Increments 1-4 executed with recorded results** — 8/8 · 9/9 · 6/6 · 15/15 · 9/9 · 2/2 · 10/10 · 11/11 · 9/9 · 11/11 Salesforce, 150/150 application unit tests. **The ~190-record synthetic dataset is not generated**, so no scenario has run against the designed population. |
| **Related** | [`requirements.md`](requirements.md) · [`architecture.md`](architecture.md) · [`security-model.md`](security-model.md) |

---

## ⚠️ What Has and Has Not Been Executed

**Executed, with results recorded in [`implementation-log.md`](implementation-log.md):** Increment 2
fixtures (8/8) · Increment 3 routing (9/9) · Seller negative-security and `BR-08` regression (6/6) ·
Increment 4 SLA (15/15, including 8 negative and guardrail tests) · web application unit tests
(50/50 at §2h, 150/150 as the suite now stands — fixtures only) · the connected read path (§2g) · Segment Assignment Consistency (§2h) · lifecycle transition enforcement and native Lead conversion (§2i, 11/11) · MQL qualification enforcement (§2j, 10/10) · MQL policy reconciliation (§2k, 11/11) · Sales acceptance enforcement (§2l, 9/9) · SQL qualification enforcement (§2m, 11/11) · MQL Qualification Integrity (§2n, 22 fixture scenarios + a live read-only run) · Lifecycle Progression Integrity (§2o, 28 fixture scenarios + a live read-only run) · Sales Acceptance / SQL Integrity (§2p, 37 fixture scenarios + a live read-only run).

**Not executed:** every scenario in §2 against the **designed ~190-record dataset**, which has not
been generated. The results above came from purpose-built fixtures and from records the org already
held. **Scenarios 3 and 11 (round robin, ineligible seller) cannot be executed against the current
build at all** — round robin is deferred and territory coverage routes to a queue rather than to an
individual seller.

**A re-runnable query does not yet exist for most of this.** See §4 and §7: outcomes were recorded,
the queries were not committed. That is an open evidence gap, stated rather than closed by wording.

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

## 2f. Web MVP unit tests — executed 2026-08-23

**20 tests, 20 pass, 0 fail.** `node --test` over `web/test/`. **No network and no Salesforce org is
involved** — the checks and the scoring are pure functions over fixture records, which is why they
can be asserted at all before a Connected App exists.

**`web/test/checks.test.ts` — 12 tests, all pass**

| Test as executed | What it protects |
|---|---|
| missing firmographics is scoped to the governed intake population | The process makes no promise about Leads it never handled |
| missing firmographics flags either missing attribute | Employees *or* country, not only both |
| routing exceptions counts only Leads held by the exception queue | Ownership, not a guessed status |
| **SLA risk evaluates only Leads that carry an SLA target** | **`M-07`. A Lead with no target is excluded from the denominator — unmeasurable is not Breached** |
| SLA risk treats At Risk and both breach states as failing | `Breached` and `Breached (Late Response)` both count |
| ambiguous match reports Leads automation refused to attach | The refusal is the finding |
| missing territory is scoped to the governed intake population | Same governed scope as the firmographics check |
| stale opportunities are open deals whose close date has passed | Closed records are not stale |
| the negative control finds nothing on a clean governed population | The engine reports what it finds; it does not manufacture work |
| a check with nothing to evaluate scores 100 rather than 0 | Absence of data is not evidence of failure |
| runAllChecks runs exactly the six implemented checks | A seventh check cannot reach the UI by accident |
| evidence is capped for display while the count stays complete | The number is never the truncated list length |

**`web/test/score.test.ts` — 8 tests, all pass**

| Test as executed | What it protects |
|---|---|
| a multi-check category scores as the mean, not the minimum | One weak check does not erase a category that is otherwise healthy |
| category scores round to a whole number | Presentation is deterministic |
| overall health is the mean of the category scores | Equal weighting, stated rather than tuned |
| an empty category list scores 100 rather than 0 | Same rule as an unevaluated check |
| healthy checks never become findings | A findings list is failures only |
| findings sort by severity, then by how many records are affected | The worst thing is first |
| an assessment over a clean org reports full health and no findings | No invented work on a clean population |
| the assessment total is traceable from records to overall health | Every number can be walked back to records |

**Also verified locally, not by unit test:** TypeScript clean · production Next.js build clean · the
**disconnected Salesforce path** — with no credentials configured every page renders, states that
the connection is not configured, and **shows no results**.

### What these results do not prove

**No test in §2f touched Salesforce.** These are fixture results. A passing suite proves the logic is
correct given records; it proves nothing about what the org returns.

*As of 2026-08-24 the connected read path has since been exercised — see §2g. That run validated
authentication and SOQL read, and nothing beyond it.*

---

## 2g. Web MVP connected read path — executed 2026-08-24

First live assessment against the Developer Edition org. **HTTP 200 at `2026-08-24T06:32:09Z`** —
81 records assessed, overall health 68, 6 findings, 3 high. Areas: Data Quality 94 · Routing 90 ·
Identity & Matching 96 · SLA Performance 60 · Pipeline Hygiene 0. `overallHealth` was reproduced by
hand from the returned payload.

| Now exercised | Evidence |
|---|---|
| OAuth 2.0 Client Credentials against the org | `getStatus()` returned connected |
| SOQL read of `Lead` and `Opportunity` | `objectsAssessed: ["Lead","Opportunity"]`, 81 records |
| Six checks over live records | Live populations 4/50 · 2/5 · 1/17 · 13/13 · 2/50 · 2/17 |

### What this does not test

The application reads what the org already recorded. **A finding is a symptom report, not a control
test.** No control was exercised, nothing was remediated, and there is no write path in the
application at all. The judged population was whatever records increment testing left in the org —
**not** the designed dataset. The five safe error codes remain unexercised against a real Salesforce
error; the failure path was tested by intercepting the browser `fetch`. 81 records: no scale claim.

---

## 2h. Segment Assignment Consistency — executed 2026-08-26

**17 new tests, 50 total, 50 pass, 0 fail.** Fixtures only — no network, no org. Executed alongside
one live read against `northstariq-dev`, recorded separately below.

**`web/test/checks.test.ts` — the tests added for this control**

| Test as executed | What it protects |
|---|---|
| a Segment matching the recorded segmentation result passes | The comparison is the whole control — nothing more is claimed |
| a Segment differing from the recorded result fails | The mismatch is the finding |
| the failing evidence names Salesforce Custom Metadata as the source | An evaluator seeing "Segment Band v1.0" alone would have to already know what that is |
| nothing an evaluator reads uses the word provenance | **Source Evidence** is the evaluator-facing term; the retired one cannot return through a code path |
| a Lead *shaped* like the retained mismatch fails, with no record hard-coded | Correcting or deleting `UI Test Web` cannot quietly turn the control off |
| `Match_Status__c` has no effect on eligibility | Account matching is a different capability and says nothing about segmentation |
| a Lead with no recorded result is not evaluated, and never passes | An unassessed record is never credited as a pass |
| an uninterpretable recorded result is excluded rather than guessed at | **Honest exclusion over false precision** |
| **a Lead segmented under an older rule version is judged on what was recorded** | **Historical safety. Re-running today's bands over an older Lead would report a legitimate configuration change as drift** |
| the Strategic Account path is credited to the Account, not to a band | Strategic is an Account designation; claiming Custom Metadata decided it would be false |
| a recorded "not segmentable" result expects no Segment, and says so | "No Segment" is a result, not an absence of one |
| an employee count matching no active band expects no Segment | The fourth recorded form, exercised |
| an empty Segment picklist reads as no Segment, not a different one | Blank and null are the same outcome |
| evaluated = passing + failing, and total = evaluated + not evaluated | Both reconciliations, asserted rather than assumed |
| adding segment consistency leaves the other six definitions untouched | All six pinned as a tuple of id, population, evaluated, failing, score |
| missing routing data still reads its sources from Salesforce configuration | A built-in source list cannot return through a shared code path |
| segment consistency is unaffected by the routing readiness configuration | The two controls cannot reach each other |

**Live read — `2026-08-26T21:37:14Z`, HTTP 200.** 49 Leads · 27 evaluated · 22 not evaluated ·
26 passing · 1 failing · score **96**. Reconciles exactly. The one failure is the deliberately
retained fixture `UI Test Web` (`00Qaj00000u50QXEAY`) — employee count 500, recorded segmentation
result Mid-Market under Rule v1.0, current Segment SMB.

**Also verified, not by unit test:** `tsc --noEmit` clean · repository validator 49 passed /
0 warnings / 2 pre-existing failures · in-browser regression over Overview, Findings, Finding Detail,
column filtering, View all / Show less, CSV and XLSX export, Salesforce record links, configuration
links, assessment state persisting across navigation with no re-run, and a clean browser console.

### What these results do not prove

Same limit as §2f, and one more specific to this control. **The application cannot confirm the rule
version it displays.** The least-privilege integration identity cannot query `Segment_Band__mdt` —
the runtime query returns `INVALID_TYPE` — so NorthstarIQ reports the rule version **Salesforce
recorded on the Lead** and does **not** reconcile it against the live Custom Metadata during an
assessment run. No permission was added to obtain that reconciliation.

The 49 Leads judged are whatever records increment testing left in the org, **not** the designed
~190-record dataset. **No re-runnable SOQL artifact exists for this control** — see §7. A candidate
for the later evidence-hardening phase is a query returning `Id, Name, NumberOfEmployees,
Segment__c, Segment_Basis__c` for Leads where `Segment_Basis__c != null`, which is the exact input
this control reasons over. It is noted, **not created here.**

---

## 2i. Lifecycle transition enforcement + native Lead conversion — executed 2026-08-27

**Validated Synthetic Test Evidence.** Every record below was a purpose-built fixture created on the
day of the test and deleted afterwards. **None of it is historical baseline evidence**, and no
baseline record was modified. The org returned to exactly **49 Leads, 13 Accounts, 20 Contacts, 32
Opportunities**, with the three `Closed - Converted` / `IsConverted = false` contradictions
untouched.

### Preventive safeguard — 9 passed, 0 failed

| # | Scenario | Expected | Result |
|---|---|---|---|
| A | Create | stamped; segmentation, territory and SLA unaffected | **PASS** |
| B | Unrelated update (Title) | saved; timestamp unchanged | **PASS** |
| C | Open - Not Contacted → Working - Contacted | saved; timestamp updated | **PASS** |
| D | Working - Contacted → MQL | saved; timestamp updated | **PASS** |
| E | MQL → Closed - Not Converted | saved; timestamp updated | **PASS** |
| F | Open - Not Contacted → SQL | **blocked**; Status and timestamp unchanged | **PASS** |
| G | Full path to SQL, then SQL → SAL | forward all 4 succeed; **backward blocked** | **PASS** |
| H | Re-save, Status unchanged | saved; timestamp unchanged | **PASS** |
| I | Batch: 4 creates + 3 transitions + 1 unrelated update | all succeed; all stamped; no governor failure | **PASS** |

Bulk safety is asserted at batch volume (I), not inferred. The new lookup is the Flow's fifth Get
Records and its third against Custom Metadata, which does not consume SOQL query limits.

### Native Salesforce Lead Conversion — 2 scenarios, both passed

Performed with the **native Lightning Convert action**. Not simulated by setting
`Status = Closed - Converted`, not Apex, not a custom Flow.

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| Fixture walked Open → Working → MQL → SAL → SQL, then converted | conversion succeeds and traverses the safeguard | `IsConverted=true`; `ConvertedDate`, `ConvertedAccountId`, `ConvertedContactId`, `ConvertedOpportunityId` all populated; `Lifecycle_Stage_Entered__c` stamped **inside the conversion transaction**, matching `LastModifiedDate` | **PASS** |
| Control fixture parked at `MQL`, then converted | **blocked** — the policy has no `MQL → Closed - Converted` rule | Custom Error returned in the Convert modal; Status still `MQL`; `IsConverted` still false; timestamp unchanged; **0** Accounts, **0** Contacts, **0** Opportunities created | **PASS** |

**Why the timestamp is the load-bearing observation.** It is written by exactly one Flow element,
which is reachable only after the Custom Metadata lookup returns a record. One changed value
therefore evidences the whole chain: the Flow ran inside the conversion transaction, held `SQL` as
the prior stage and `Closed - Converted` as the new one, executed the lookup, and found the active
rule.

**Blocking was proven without touching the policy.** Deleting the `SQL → Closed - Converted`
record to watch a conversion fail would have edited the authoritative business rule. Parking a
fixture at a stage the policy gives no converted route achieves the same proof and leaves the policy
intact.

### Detective control — Opportunity Conversion Integrity

**Implemented and tested, deliberately unscored.** It is absent from `runAllChecks` and `CHECK_IDS`,
so it does not appear in the assessment payload and does not move the score. Unit-tested against
fixtures: a claimed converted state contradicted by `IsConverted = false` is detected; a legitimate
converted state passes; a zero-evaluable population scores 100 rather than 0.

**The suite is now 63 tests, 63 pass, 0 fail** — 13 added since the 50 recorded at §2h: the tests for
this control, and tests for the score bands, which were extracted from the meter component into
`lib/score-bands.ts` so the runner could reach them without importing `.tsx`.

**Preventive and detective are not redundant.** Prevention governs saves that reach the Flow.
The three baseline contradictions already hold an unsupported state and no preventive safeguard can
reach backwards to them. Prevention stops new ones; detection finds the ones already there.

### What these results do not prove

**Only one of the four planned Lifecycle Governance controls exists.** Lifecycle Progression
Integrity, MQL Qualification Integrity and Sales Acceptance / SQL Integrity are **planned and
untested**. Nothing here evidences them.

> **Superseded 2026-08-27** — all three were subsequently implemented and validated; see
> §2n, §2o and §2p. The paragraph is left as written because it records what this
> increment's evidence actually covered. It is history, not current status.

**Conversion was tested through one route.** The Lightning Convert action. REST
`/sobjects/LeadConvert` and the standard `convertLead` invocable action both returned HTTP 404 in
this org, and Apex was outside the increment boundary — so behaviour under SOAP `convertLead()` or
`Database.convertLead()` is **unverified**.

**The statuses were set, not qualified.** The fixture was walked to `SQL` by direct Status updates.
**No MQL or Sales-acceptance qualification policy was evaluated**, because none exists yet
(`PD-14` resolves the direction; the policy itself is unbuilt).

Fixture volume, one org, one user. **No claim is made about production scale.** Re-runnable queries:
[`lifecycle-transition-policy.soql`](../scripts/soql/lifecycle-transition-policy.soql) and
[`lead-conversion-evidence.soql`](../scripts/soql/lead-conversion-evidence.soql) — both **new
reproducibility artifacts created after the work they verify**, not queries used during the original
validation.

---

## 2j. MQL qualification enforcement — executed 2026-08-27

**Validated Synthetic Test Evidence.** 12 purpose-built Leads and 2 purpose-built Accounts, created
on the day of the test and all deleted afterwards. **Not historical baseline evidence.** No baseline
record was modified and **no existing Lead was retroactively qualified** — `MQL_Basis__c` is
populated on **0** records in the org, which is the correct prospective result.

⚠️ The qualification criteria themselves are a **Synthetic Baseline**, authored for reproducible
demonstration rather than validated with a client.

### 10 scenarios, 10 passed, 0 failed

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| **A.** Fully qualified: `Working - Contacted → MQL` | succeeds; timestamp updates; basis captured | saved; timestamp updated; basis captured | **PASS** |
| **E.** Existing MQL, unrelated update (Title) | saves; evidence and timestamp both unchanged | both unchanged | **PASS** |
| **F.** `MQL → SAL` | existing behaviour unchanged; evidence preserved | saved; timestamp updated; basis preserved | **PASS** |
| **C1.** Ungoverned source (`Purchased List`) | blocked, naming the source | blocked; Status, timestamp and basis all unchanged | **PASS** |
| **C2.** No governed territory (country `FR`, unmapped) | blocked, naming the territory | blocked; `Territory__c` null | **PASS** |
| **B / C3.** Segment not eligible (`SMB`) | blocked, naming segment eligibility; no false evidence | blocked; `Segment__c` SMB; basis null | **PASS** |
| **C4.** Ambiguous match (two Accounts share a domain) | `Match_Status__c = Review`; blocked | Review; blocked | **PASS** |
| **C5.** Created directly at `Working - Contacted`, never worked | blocked, naming first touch | blocked; `First_Touch_DateTime__c` null | **PASS** |
| **D.** Qualification-eligible but `Open - Not Contacted → MQL` | blocked by **transition** governance, not qualification | blocked; message named the **transition** policy | **PASS** |
| **G.** Batch: 4 creates, 4 to Working, 3 MQL + 1 unrelated | all succeed; 3 qualify with evidence | 4/4 and 4/4 ok; 3 at MQL, all with basis | **PASS** |

**Every criterion was failed independently** (C1 — C5), so each one is load-bearing rather than
carried by its neighbours. Verbatim block, C3:

> This Lead does not meet the governed NorthstarIQ MQL qualification requirements (MQL Policy v1.0).
> Not satisfied: segment eligible for qualification;

Verbatim evidence captured on the qualified Lead (A):

> Qualified: source Web; territory NA-West; Mid-Market segment eligible; match No Match; first touch
> recorded | MQL Policy v1.0

**Scenario D is the one that proves the architecture.** The Lead satisfied every qualification
condition and was still refused, by the *transition* policy, with the transition wording rather than
the qualification wording. Transition eligibility and qualification eligibility are separately
governed and separately enforced — demonstrated, not asserted.

**Cleanup:** 13 records deleted; org back to **49 Leads, 13 Accounts, 20 Contacts, 32
Opportunities**, the three conversion contradictions untouched.

### What these results do not prove

**Only the MQL stage is governed.** SAL and SQL entry are still transition-governed only — no
acceptance or qualification evidence exists for either, and none is claimed.

**No detective control existed when this was written.** MQL Qualification Integrity was implemented
later the same day (§2n) and remains **unscored**; nothing in this section evidences it.

**One criterion is weaker than it reads.** `Match_Status__c` is blank when a Lead carries no domain
to match on, and blank passes criterion 4 — ambiguity is the disqualifier, not absence of
evaluation. A Lead that was never matched is not thereby treated as suspect.

**Criterion 2 reads a derived value, not the raw test.** Salesforce refuses a formula field
referenced from a before-save Flow, so routing readiness is evidenced by `Territory__c` being
resolved rather than by `Data_Quality_Status__c` directly. The two agree in every case tested, but
they are not the same expression.

Fixture volume, one org, one user. **No claim is made about production scale.**

---

## 2k. MQL policy reconciliation (v1.1) — executed 2026-08-27

**Validated Synthetic Test Evidence.** 12 purpose-built Leads and 2 purpose-built Accounts, created
and deleted the same day. No baseline record was modified; `MQL_Basis__c` is populated on **0**
records afterwards.

Two review findings drove this: seller first touch did not belong in a *Marketing* qualification, and
the requirement set lived in Flow formulas rather than in the policy record. §2j records the v1.0
behaviour; this section records what changed.

### 11 scenarios, 11 passed, 0 failed

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| **A.** Fully qualified `Working - Contacted → MQL` | succeeds; basis shows v1.1 and no first touch | saved; `v1.1`; no first-touch mention | **PASS** |
| **A2.** *Critical* — created at `Working - Contacted`, `First_Touch_DateTime__c` **null**, then → MQL | **succeeds** (this exact fixture was BLOCKED under v1.0) | saved; First Touch still null; basis captured | **PASS** |
| **F.** `Match_Status__c = No Match` | **passes** — unambiguous, not matched | MQL granted | **PASS** |
| **I.** Existing MQL, unrelated Title update | evidence and timestamp unchanged | both unchanged | **PASS** |
| **H.** `MQL → SAL` | unchanged; no SAL requirement added | saved; evidence preserved | **PASS** |
| **B.** Ungoverned source (`Purchased List`) | blocked, naming the source | blocked; nothing stamped | **PASS** |
| **C.** Segment not eligible (`SMB`) | blocked, naming segment eligibility | blocked; basis null | **PASS** |
| **D.** Country `FR`, unmapped | blocked, naming coverage | blocked; `Territory__c` null | **PASS** |
| **E.** Two Accounts share a domain | `Review`; blocked | Review; blocked | **PASS** |
| **G.** Qualified profile, `Open - Not Contacted → MQL` | blocked by **transition** governance | message named the **transition** policy | **PASS** |
| **J.** Batch: 4 creates + 3 MQL + 1 unrelated | all succeed; 3 qualify | 4/4; 3 at MQL, all with basis | **PASS** |

**A2 is the proof that the definition changed**, and it needed no manual field manipulation: a Lead
**created** at `Working - Contacted` never has first touch stamped, because that stamp requires a
Status *change*. The identical fixture was refused under v1.0 for *"seller first touch"* and is
granted under v1.1.

Evidence captured (A and A2, identical):

> Qualified under MQL Policy v1.1: governed source Web; Mid-Market segment eligible; territory
> NA-West resolved; account match No Match

Failure message (D), showing the handoff-readiness wording:

> This Lead does not meet the governed NorthstarIQ MQL qualification requirements (MQL Policy v1.1).
> Not satisfied: resolved governed coverage;

**Cleanup:** 13 records deleted; org back to **49 / 13 / 20 / 32**, the three conversion
contradictions untouched.

### What these results do not prove

**Only the MQL stage is governed.** SAL and SQL entry remain transition-governed only. `MQL → SAL`
was verified to be **unchanged** — no acceptance requirement was added.

**No detective control exists.** MQL Qualification Integrity is **planned and unbuilt**. The
architecture was checked for feasibility, not implemented: the integration principal can now read the
active policy, the governed source list, the segment bands and the Lead's own values, so the same
deterministic result is reachable without recreating the definition — but nothing has been built to
do so.

**One-active-policy-per-stage is a convention, not a platform guarantee.** Salesforce cannot enforce
it on Custom Metadata. The repository validator now asserts it, and the Flow orders by version
descending so selection stays defined if it were ever broken. That is weaker than a database
constraint and is stated as such.

**`Match_Status__c` blank still passes.** A Lead with no domain to match on was never evaluated, and
absence of evaluation is not ambiguity.

Fixture volume, one org, one user. **No claim is made about production scale.**

---

## 2l. Sales acceptance enforcement — executed 2026-08-27

**Validated Synthetic Test Evidence.** 13 purpose-built Leads, created and deleted the same day. No
baseline record was modified; afterwards `Sales_Accepted_At__c` and `MQL_Basis__c` are populated on
**0** records. The acceptance policy itself is a **Synthetic Baseline**.

### 9 scenarios, 9 passed, 0 failed

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| **A.** Valid MQL → explicit acceptance → SAL | succeeds; actor/time/basis recorded; MQL evidence preserved | saved; all three captured; MQL basis unchanged | **PASS** |
| **B.** MQL → SAL with no acceptance | blocked; no acceptance evidence written | blocked; Status still MQL; all three evidence fields null | **PASS** |
| **C.** Acceptance ticked but **no MQL evidence** | blocked — Sales cannot accept an unsubstantiated handoff | blocked; `MQL_Basis__c` null; nothing stamped | **PASS** |
| **D.** First Touch recorded, acceptance absent | blocked — activity is not acceptance | blocked; First Touch set; Status still MQL | **PASS** |
| **E.** Acceptance with `First_Touch_DateTime__c` **null** | succeeds — First Touch is not consulted | saved; First Touch still null; evidence captured | **PASS** |
| **F.** Existing SAL, unrelated Title update | acceptance evidence unchanged | actor, time and basis all unchanged | **PASS** |
| **G.** `SAL → SQL` | transition works; acceptance evidence preserved | saved; acceptance and MQL evidence both preserved | **PASS** |
| **H.** `Working - Contacted → SAL` with acceptance ticked | blocked by **transition** governance | message named the **transition** policy; nothing stamped | **PASS** |
| **J.** Batch: 4 to MQL, 3 accepted → SAL, 1 unrelated | all succeed; 3 accepted with evidence | 4/4 updates ok; 3 at SAL, all with evidence | **PASS** |

**D and E together are the First Touch argument.** A Lead that a seller had demonstrably touched was
**refused**; a Lead nobody had touched but that was explicitly accepted was **granted**. Seller
activity and Sales acceptance are separate facts, and the policy consults only the second.

**How scenario C was built, stated plainly.** A Lead can only reach MQL without `MQL_Basis__c` if no
MQL policy was in force at the time, so the MQL policy was **deactivated for the few seconds it took
to create the fixture and then restored**, with both states verified by query and the restore placed
in a `finally` block. That is a temporary change to deployed governed configuration during a test,
recorded here rather than glossed over. The MQL policy was confirmed active, governing `MQL`,
immediately afterwards.

Evidence captured (A), alongside the untouched Marketing evidence:

> Accepted under Sales Acceptance Policy v1.0: explicit seller acceptance recorded; Marketing handoff
> substantiated by MQL evidence

> Qualified under MQL Policy v1.1: governed source Web; Mid-Market segment eligible; territory
> NA-West resolved; account match No Match

Blocking messages, showing the two requirements separately:

> This Lead cannot enter the governed NorthstarIQ Sales Acceptance stage (Sales Acceptance Policy
> v1.0). Not satisfied: explicit Sales acceptance;

> ... Not satisfied: substantiated Marketing handoff evidence;

**Rollback verified in B, C, D and H:** Status, `Lifecycle_Stage_Entered__c` and all three acceptance
evidence fields were unchanged after every refused attempt. No partial write was observed.

**Cleanup:** all fixtures deleted; org back to **49 / 13 / 20 / 32**, the three conversion
contradictions untouched.

### What these results do not prove

**SQL is still transition-governed only.** `SAL → SQL` was verified **unchanged** — no
qualification requirement was added, and none is claimed.

**No detective control exists.** Sales Acceptance / SQL Integrity is **planned and unbuilt**. The
architecture was checked for feasibility, not implemented.

**Sales rejection is not modelled.** `Closed - Not Converted` is reachable from MQL but carries no
reason and no actor, so it is a disqualification rather than a recorded rejection of a handoff. The
two are **not** treated as equivalent, and the gap is left open as a future candidate.

**One identity performed every acceptance.** The tests ran as the RevOps-permissioned administrator,
so `Sales_Accepted_By__c` was verified to capture *an* authenticated identity — not that two
different sellers are distinguished in practice. Multi-user behaviour remains untested (§2d).

Fixture volume, one org. **No claim is made about production scale.**

---

## 2m. SQL qualification enforcement — executed 2026-08-27

**Validated Synthetic Test Evidence.** 14 purpose-built Leads, created and deleted the same day, plus
the Account, Contact and Opportunity produced by one native conversion — all removed. No baseline
record was modified. Afterwards `MQL_Basis__c`, `Sales_Accepted_At__c` and `SQL_Basis__c` are
populated on **0** records and `IsConverted = true` on **0**.

**No active governed policy was deactivated at any point.** Every invalid state was produced by
simply omitting an input, which is the improvement this increment was asked to make over the SAL
test approach.

### 11 scenarios, 11 passed, 0 failed

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| **A / F.** Valid SAL → SQL, future next-step date | succeeds; SQL evidence captured; prior evidence preserved | saved; MQL and acceptance evidence both unchanged | **PASS** |
| **B.** Missing confirmed need | blocked naming the need | blocked; `Qualified_Need__c` null; nothing stamped | **PASS** |
| **C.** Missing next-step date | blocked naming the next step | blocked; nothing stamped | **PASS** |
| **D.** Next-step date **yesterday** | blocked — a lapsed step is not agreed motion | blocked; date `2026-08-26` | **PASS** |
| **E.** Next-step date **today** | **succeeds** — the boundary is inclusive | saved; date `2026-08-27` | **PASS** |
| **G.** Invalid need value | platform rejects it; restrictions **not** disabled | `bad value for restricted picklist field: Budget Approved`; field stayed null | **PASS** |
| **H.** SQL without acceptance evidence | not constructible — proven architecturally | 0 Leads at SAL or SQL lack acceptance evidence | **PASS** |
| **I.** `MQL → SQL` with all SQL inputs satisfied | blocked by **transition** governance | message named the **transition** policy | **PASS** |
| **J.** Existing SQL, unrelated update | all three stages' evidence unchanged | unchanged | **PASS** |
| **K.** Native conversion from SQL | all evidence survives the platform boundary | all six fields preserved; `IsConverted=true` | **PASS** |
| **L.** Batch: 4 to SAL, 3 qualified → SQL, 1 unrelated | all succeed; 3 with evidence | 4/4 ok; 3 at SQL | **PASS** |

**Scenario H, stated honestly.** The state *"at SAL with no acceptance evidence"* cannot be built:
the SAL gate stamps `Sales_Accepted_At__c` as the condition of entry, and SAL is the only governed
route into SQL. Manufacturing it would have required deactivating an active governed policy, which
this increment forbids. It was therefore **proven architecturally rather than behaviourally**, by
confirming that **0** Leads at SAL or SQL lack acceptance evidence. The requirement is still live and
still evaluated — the successful basis strings name it.

**Date boundary, all three sides.** `$Flow.CurrentDate` compared to a Date field, so no Date/DateTime
coercion: **yesterday blocked, today permitted, future permitted.**

> This Lead does not meet the governed NorthstarIQ SQL qualification requirements (SQL Policy v1.0).
> Not satisfied: agreed next step dated today or later;

### The observed evidence chain

One synthetic fixture, after native conversion — four stages, four answers:

```
MQL        Qualified under MQL Policy v1.1: governed source Web; Mid-Market segment eligible;
           territory NA-West resolved; account match No Match
SAL        Accepted under Sales Acceptance Policy v1.0: explicit seller acceptance recorded;
           Marketing handoff substantiated by MQL evidence
SQL        Qualified under SQL Policy v1.0: need Pipeline Visibility; next step 2026-09-15;
           substantiated Sales acceptance
Conversion IsConverted = true on 2026-08-28, with Account, Contact and Opportunity all created
```

Plus the human context that is never policy: *Next Step: "Forecast workflow review with RevOps VP"*.

### What these results do not prove

**No detective control exists.** SQL Qualification Integrity, Sales Acceptance / SQL Integrity, MQL
Qualification Integrity and Lifecycle Progression Integrity are all **planned and unbuilt**. The
assessment is unchanged at 62.

⚠️ **A next-step date valid at qualification will later be in the past.** A future detective
control must **not** flag `Next_Step_Date__c < TODAY` on historical SQL records. It must judge the
date against the recorded qualification event — `SQL_Basis__c` carries the date as it stood, and
Lead Status field history carries when SQL was entered. Preventive validation and historical
evaluation ask different questions of the same field.

**The need vocabulary is four values chosen by the practitioner.** It is grounded in what the
business case says NorthstarIQ sells, but it is a **Synthetic Baseline** decision, not a researched
taxonomy.

**`Next_Step__c` is untested as evidence because it is not evidence** — no condition reads it.

Fixture volume, one org, one user. **No claim is made about production scale.**

---

## 2n. MQL Qualification Integrity — executed 2026-08-27

The first lifecycle **detective** control. **Read-only**: no Salesforce record was created, updated
or deleted, and the 49 baseline Leads were **not** touched.

⚠️ Created **after** the preventive safeguard was validated. It was **not** used during that
validation, and nothing here is retroactive evidence for it.

### Unit tests — 22 added, 22 passed, 0 failed

Full suite **85 passed / 0 failed** (63 before this increment).

| # | Scenario | Result |
|---|---|---|
| 1 | Every active requirement satisfied | passes |
| 2 | Ungoverned acquisition source | **demonstrated failure** |
| 3 | Segment the business does not qualify | **demonstrated failure** |
| 4 | Territory unresolved | **demonstrated failure** |
| 5 | Account match `Review` | **demonstrated failure** |
| 6 | Account match **blank** | **unmeasurable** — not a pass and not a failure |
| 7 | Blank match **and** ineligible segment | **failure** — a proven violation outranks an unprovable one |
| 8 | Requirement switched off in the policy | not tested; the same Lead passes |
| 9 | Match requirement switched off | the blank-match exclusion disappears |
| 10 | Several violations on one record | one failing record, all causes named |
| 11 | No Marketing-qualified claims at all | 0 evaluated, score 100, records are *outside* not unmeasurable |
| 12 | No active policy | **throws** — governance absent is never "everything passes" |
| 13 | Two active policies | **throws** — refuses to choose |
| 14 | Policy naming no governed stage | **throws** |
| 15 | Valid policy record | resolves to exactly what Salesforce declared |
| 16 | Evidence present, segment ineligible | **failure** — the basis alone never earns a pass |
| 17 | Progressed past the stage, segment now ineligible | **unmeasurable** — drift is not a violation |
| 18 | Claim with no recorded evidence | **unmeasurable** — the baseline reality |
| 19 | Qualified under superseded v1.0 | **unmeasurable** — not judged against v1.1 |
| 20 | Version parsed from the basis | `v1.1`, or null where absent |
| 21 | Assessment isolation | `runAllChecks` still returns exactly 7; no Lifecycle Governance result |
| 22 | Independent control score | computed, and fed to nothing |

### Live read-only execution — 2026-08-27

Governed definition, read from Salesforce at run time:

```
active MQL policy records : 1
version                   : v1.1
governs stage             : MQL
requirements switched on  : governed acquisition source; eligible segment;
                            resolved territory; unambiguous account match
governed sources          : NorthstarIQ Inbound, Phone Inquiry, Web
MQL-eligible segments     : Enterprise, Mid-Market, Strategic
```

Result:

| | |
|---|---:|
| Org population | 49 Leads |
| **Evaluated** | **0** |
| **Failing** | **0** |
| Not evaluated | 49 (**3 unmeasurable**, 46 outside) |
| Control score | 100 — computed for inspection, fed to nothing |
| Finding generated | **no** |

**Zero failures is the correct answer, and no data was altered to change it.** No baseline Lead has
ever been through the governed lifecycle, so none carries qualification evidence and none sits on the
qualified stage. Failure detection is proven by the 22 fixture scenarios instead.

**The three unmeasurable records are the interesting result.** They are the same three
`Closed - Converted` / `IsConverted = false` contradictions the conversion control already surfaces,
reached here by a different route: a status only reachable through MQL, carrying no qualification
evidence. The control reports them as **unprovable, not as violations** — they predate the
evidence field, so NorthstarIQ can say it cannot substantiate the claim, and cannot honestly say the
claim was wrong.

### What these results do not prove

**The control has never judged a real qualified Lead**, because none exists. Everything it asserts
about failure detection rests on fixtures.

**It cannot re-judge a Lead that has moved on.** Every input the policy reads is current-state and
derived, so a Lead at SAL, SQL or converted is reported unmeasurable rather than re-tested. Only a
Lead still sitting on the governed stage has facts contemporaneous with its own claim.

**It is unscored.** Assessment Model v1 remains 62 — 5 areas, 7 scored controls — verified
after implementation.

---

## 2o. Lifecycle Progression Integrity — executed 2026-08-27

The second lifecycle **detective** control. **Read-only**: no Salesforce record or metadata was
created, updated or deleted.

⚠️ Created **after** the preventive safeguard was validated. It was **not** used during that
validation.

### Evidence capability, established before any code was written

| | |
|---|---:|
| Leads | 49 |
| Status history rows Salesforce still retains | **8**, across **3** Leads |
| Leads with a stage-entry timestamp | **0** |
| Leads with MQL / acceptance / SQL evidence | **0 / 0 / 0** |
| Active transition policy records | 10, all `v1.0` |

**Every retained transition predates the safeguard** (2026-08-22 and 2026-08-23; the safeguard
deployed 2026-08-27), and the newest baseline Lead was created 2026-08-26. So the control was
designed knowing that **full historical reconstruction is impossible** — history is bounded, was
not tracked from the start, and never records a Lead's first status.

### Unit tests — 28 added, 28 passed, 0 failed

Full suite **113 passed / 0 failed** (85 before this increment).

Graph built from policy records · empty policy permits nothing · reachability and dominance ·
permitted transition passes · **unpermitted transition fails on a governed record** · full
progression passes · coherent timestamp · **stage entered before the Lead existed fails** ·
**acceptance before creation fails** · **evidence for an unreachable stage fails** · evidence that
legitimately survives progression passes · full evidence chain passes · **missing dominating-stage
evidence fails on a governed record** · **the same absence pre-governance is unmeasurable** ·
**unpermitted transition predating the safeguard is unmeasurable** · absent history never fails ·
partial history judged on what it shows · **same-day conversion not ordered against a DateTime** ·
conversion dated before creation fails · multiple contradictions · **contradiction outranks
unprovable** · no-progression records are outside · missing policy throws · malformed record
throws · policy with no entry stage throws · governed early exit permitted · assessment
isolation · score counts only settled records.

### Live read-only execution — 2026-08-27

| | |
|---|---:|
| Org population | 49 Leads |
| **Evaluated** | **15** |
| **Failing** | **0** |
| Unmeasurable | **6** |
| Outside | 28 |
| Control score | 100 — inspection only, fed to nothing |
| Finding generated | **no** |

**Zero failures, and nothing was altered to change that.** The 28 outside are Leads sitting where a
lifecycle begins with no history and no evidence — they assert no progression. The 15 evaluated
are Leads that assert progression and whose retained evidence contradicts nothing.

**The 6 unmeasurable are the substantive result**, and they divide into two distinct kinds:

| Count | Why |
|---:|---|
| 3 | **A retained transition the governed policy does not permit** — but the lifecycle safeguard never ran on the record |
| 3 | **A claim that every governed route requires evidence for** — the three `Closed - Converted` records, which every route reaches through SQL, SAL and MQL, none of whose evidence existed then |

The three observed moves are real and specific: two Leads went
`Closed - Not Converted → Working - Contacted` (a closed record reopened), and one went
`Working - Contacted → Open - Not Contacted` (a stage stepped backwards). **The policy permits
neither.** They are reported as **unprovable rather than as violations**, because the safeguard did
not exist when they happened — the record's own absent stage-entry timestamp is what establishes
that, and **no effective date was invented anywhere.**

Had those same moves happened on a governed record, the control would have failed them. That is
unit-tested.

### What these results do not prove

**NorthstarIQ does not reconstruct lifecycle history.** It reasons over the fragment Salesforce
still retains. A Lead can pass here while its earliest transitions are simply unknown.

**A pass is narrow.** It means nothing in the retained evidence contradicts the governed
progression — not that the progression was complete, well-judged or correctly evidenced. Eleven of
the fifteen passes are Leads at `Working - Contacted` with no history at all.

**It is unscored.** Assessment Model v1 remains 62 — 5 areas, 7 scored controls — verified after
implementation.

---

## 2p. Sales Acceptance / SQL Integrity — executed 2026-08-27

The third lifecycle **detective** control, and the one that covers **two** governed business events.
**Read-only**: no Salesforce record or metadata was created, updated or deleted.

⚠️ Created **after** both preventive safeguards were validated (§2l, §2m). It was **not** used
during either validation, and it did **not** govern any record that predates them.

### SAL and SQL are one control and two evaluations

| | The claim being made | Governed by | The evidence that proves the safeguard ran |
|---|---|---|---|
| **SAL** | Sales explicitly accepted responsibility for a substantiated Marketing-qualified Lead | `Sales_Acceptance_Policy__mdt` v1.0 | `Sales_Accepted_At__c` |
| **SQL** | Sales subsequently established enough commercial evidence to justify a genuine pursuit | `SQL_Qualification_Policy__mdt` v1.0 | `SQL_Basis__c` |

They are evaluated separately, against their own policies, and combined into **one population, one
failing set and one finding**. Accepting a handoff and qualifying a pursuit are different business
events; merging them would hide the step Sales is accountable for.

### Evidence capability, established before any code was written

| | |
|---|---:|
| Leads | 49 |
| Leads at `MQL` / `SAL` / `SQL` | **0 / 0 / 0** |
| Leads at `Closed - Converted` | 3 |
| Leads with `MQL_Basis__c` | **0** |
| Leads with `Sales_Accepted_At__c` / `_By__c` / `_Basis__c` | **0 / 0 / 0** |
| Leads with `Sales_Accepted__c` ticked | **0** |
| Leads with `SQL_Basis__c` | **0** |
| Leads with `Qualified_Need__c` / `Next_Step_Date__c` | **0 / 0** |
| Leads with `Lifecycle_Stage_Entered__c` | **0** |
| Status history rows retained | 8, across 3 Leads — **none** into `SAL` or `SQL` |
| Active policies | exactly **1** acceptance (v1.0), exactly **1** SQL (v1.0) |
| Policy versions appearing in recorded evidence | **none** — no evidence exists to carry one |

**No baseline Lead has ever passed through the governed MQL / SAL / SQL architecture.** The control
was therefore designed knowing its live population would be empty or unmeasurable, rather than
discovering that afterwards. **No fixture Lead was created in the org to manufacture a result.**

### Evidence temporal classification — decided before the algorithm

| Evidence | Temporal type | Safe for historical validation? | Treatment |
|---|---|---|---|
| `MQL_Basis__c` | Immutable — written once at MQL entry, read-only to every principal | ✅ | Consumed as the acceptance policy's evidence-chain prerequisite. **Never re-tested.** |
| `Sales_Accepted_At__c` | Immutable — written once at acceptance | ✅ | Presence is what proves the acceptance safeguard ran on this record |
| `Sales_Accepted_By__c` | Immutable — authenticated identity captured at acceptance | ✅ | Judged when the policy requires explicit acceptance |
| `Sales_Acceptance_Basis__c` | Immutable — records the requirements and the version in force | ✅ | Judged for coherence, and read for the policy version |
| `Sales_Accepted__c` | **Current-state, mutable** — a seller checkbox | ❌ | Shown as context. **Never accepted as evidence** — it records no time, no actor and no policy |
| `Qualified_Need__c` | **Current-state, mutable** — a seller picklist | ❌ | Shown as context. The need *at qualification* is read from `SQL_Basis__c` instead |
| `Next_Step_Date__c` | **Current-state, mutable** — a seller date | ❌ | Shown as context. The date *at qualification* is read from `SQL_Basis__c` instead |
| `SQL_Basis__c` | Immutable — records the need and the next-step date **as they stood** | ✅ | The qualification evidence the control actually judges |
| `Lifecycle_Stage_Entered__c` | **Derived, overwritten** on every transition | ⚠️ partial | Trusted only for the stage the Lead holds **now** — used to date the SQL event when it still sits on `SQL` |
| Lead Status field history | **Partial and bounded** — never records a first status | ⚠️ partial | Used to date the SQL event for a Lead that has moved on. Absence proves nothing |
| `First_Touch_DateTime__c` | Immutable, but a **different business event** | n/a | **Never read.** A seller working a Lead is activity, not Sales accepting the handoff |

### How the historical next-step date is handled

The preventive gate required `Next_Step_Date__c >= TODAY` **at the moment of qualification** (§2m).
A correctly qualified Lead's date therefore falls into the past as time passes. The detective
control **never compares against TODAY**. It:

1. reads the next-step date **out of `SQL_Basis__c`**, where the Flow recorded it as it stood;
2. establishes when the Lead entered `SQL` — from `Lifecycle_Stage_Entered__c` when it still sits
   there, otherwise from a retained Status transition into `SQL`;
3. **fails** the record only when the recorded date was already in the past on the recorded
   qualification date;
4. reports the requirement **unmeasurable** when the qualification event cannot be established —
   rather than substituting today's date and inventing a failure.

The unit fixtures use a next-step date of `2026-06-20` agreed at a qualification on `2026-06-10`,
both already historical, and one test asserts the fixture date really is in the past — so a
regression to TODAY-comparison cannot pass silently.

### Unit tests — 37 added, 37 passed, 0 failed

Full suite **150 passed / 0 failed** (113 before this increment).

Complete governed SAL chain passes · **SAL without the MQL evidence it accepted fails** · **SAL with
no accepting identity fails** · **SAL with no basis fails** · **a ticked seller checkbox alone is
unmeasurable, not a pass** · **a first-touch timestamp is never read as acceptance** · complete
governed SQL chain passes · **SQL with no acceptance evidence fails** · **SQL recording no business
need fails** · **SQL recording no agreed next step fails** · **a next-step date valid at
qualification does not fail for being in the past** · **a next step already past at qualification
fails** · **an unestablishable qualification date is unmeasurable, not a failure** · a retained
transition into `SQL` re-establishes the date · a converted Lead is still judged on the evidence it
carries, without asserting the conversion contradiction · a SAL claim predating the architecture is
unmeasurable · a SQL claim predating the architecture is unmeasurable · **a requirement switched off
by either policy stops being tested** (three cases) · simultaneous conflicts across both stages
reported once · **contradiction outranks unmeasurable** · superseded acceptance policy version is
unmeasurable · superseded SQL policy version is unmeasurable · missing acceptance policy throws ·
two active acceptance policies throw · missing SQL policy throws · two active SQL policies throw ·
a policy naming no stage throws · valid records resolve to exactly what Salesforce declared ·
evidence read back from the basis, or reported unknown · the recorded need is judged rather than
the seller picklist · empty population scores 100 · every Lead accounted for · **assessment
isolation** · control score computed for inspection only · **unmeasurable records change neither
numerator nor denominator**.

### Live read-only execution — 2026-08-27

| | |
|---|---:|
| Org population | 49 Leads |
| **Evaluated** | **0** |
| **Failing** | **0** |
| Unmeasurable | **3** |
| Outside | 46 |
| Control score | 100 — inspection only, fed to nothing |
| Finding generated | **no** |

**An empty evaluated population is the correct result, and it is stated rather than disguised.** The
46 outside are Leads at `Open - Not Contacted`, `Working - Contacted` or `Closed - Not Converted`
carrying no acceptance or qualification evidence: they claim neither the Sales handoff nor sales
qualification, so there is nothing to substantiate. The 3 unmeasurable are the `Closed - Converted`
records, which under the governed lifecycle claim both SAL and SQL by status and carry **none** of
the evidence either claim requires — because none of it existed when they were created.

**Nothing was created in Salesforce to produce a more interesting number.** Failure detection is
proven by the 37 fixture scenarios above, which is what fixtures are for.

### What these results do not prove

**The control has never failed a live record**, because no live record has ever been through the
governed handoff. Its failure paths are proven against fixtures only.

**A pass would be narrow.** It would mean the recorded evidence satisfies every requirement the two
active policies switch on — not that the acceptance was commercially sound, that the business need
was real, or that the next step ever happened.

**It is unscored.** Assessment Model v1 remains **62 — 5 areas, 7 scored controls, 7 findings** —
verified by a live run after implementation.

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
| **Analytics** | Power BI figure reconciles to the same SOQL query | **Deferred — Power BI not started** |
| **Access** | Execute as each persona — positive and negative | §5 matrix |

### Bulk safety

Automation is asserted at batch volume, not one record at a time. **A Flow that works on a single
record and fails at 200 is the most common automation defect in an org of this shape** (`RISK-009`),
and single-record testing cannot detect it. Fixtures load in batch for exactly this reason.

### SOQL validation

**The SOQL query is the evidence.** A screenshot is an illustration; a query anyone can re-run is a
result. That standard stands.

**`scripts/soql/` is currently empty.** Validation queries for Increments 1-4 were executed ad hoc
against the org and their **outcomes** are recorded in
[`implementation-log.md`](implementation-log.md). The **queries themselves were not committed**, so
they are **not re-runnable by a reader of this repository today.** This is a stated gap in the
evidence standard below — not a claim of coverage, and not a reason to weaken the standard.

Committed queries would live in `scripts/soql/`, versioned alongside the metadata they check, each
answering one question and named for it — every assigned Lead has a routing reason; no Lead sits
unassigned and unclassified; segment distribution matches the fixture expectation.

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

> **Criterion 4 is currently unmet for most Salesforce increments, and the standard is not being
> relaxed to hide that.** Verification for Increments 1-4 **was executed** and its outcomes recorded
> — including failures — but the queries were not committed, so criterion 4 has no artifact. Two
> reports do satisfy it: `NIQ Open SLA Risk` and `NIQ SLA Attainment by Segment`.
>
> Executed verification and a re-runnable artifact are **different things**, and this repository
> distinguishes them rather than merging them. Results are not downgraded — they happened — and the
> gap is not closed by editing this page. It closes when the queries are committed.

| Prohibited | Why |
|---|---|
| Recording a result that was not executed | Fabrication — invalidates everything else in the repository |
| Describing a candidate component as implemented | Misrepresents the state of the work |
| Claiming a measured improvement against a **synthetic** baseline | The baseline is invented; only the design behaviour is demonstrable |
| Claiming performance at scale | Bulk-safe design is demonstrated at fixture volume. Production scale is not claimed. |
| Omitting a failed test | A test suite with no failures recorded is not a test suite anyone should believe |
