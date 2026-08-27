# Testing Strategy

| | |
|---|---|
| **Purpose** | How this project proves that what it built actually works |
| **Status** | 🟢 **Strategy defined · Increments 1-4 executed with recorded results** — 8/8 · 9/9 · 6/6 · 15/15 Salesforce, 50/50 application unit tests. **The ~190-record synthetic dataset is not generated**, so no scenario has run against the designed population. |
| **Related** | [`requirements.md`](requirements.md) · [`architecture.md`](architecture.md) · [`security-model.md`](security-model.md) |

---

## ⚠️ What Has and Has Not Been Executed

**Executed, with results recorded in [`implementation-log.md`](implementation-log.md):** Increment 2
fixtures (8/8) · Increment 3 routing (9/9) · Seller negative-security and `BR-08` regression (6/6) ·
Increment 4 SLA (15/15, including 8 negative and guardrail tests) · web application unit tests
(50/50, fixtures only) · the connected read path (§2g) · Segment Assignment Consistency (§2h).

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
