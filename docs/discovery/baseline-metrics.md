# Baseline Metrics — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Baseline Metrics |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`current-state.md`](current-state.md) · [`business-problems.md`](business-problems.md) · [`revenue-model.md`](revenue-model.md) |

---

## ⛔ Mandatory Disclaimer

> **Every numerical value in this document is a SYNTHETIC BASELINE.**
>
> These figures were **invented** to establish a coherent before-state for a fictional company.
> **None was measured from any real organization.** They are not benchmarks, not industry averages,
> and not observations. They exist so that later work has a defensible starting point to improve
> against.
>
> | This document contains | This document does NOT contain |
> |---|---|
> | Synthetic Baseline (invented current-state figures) | Actual Measured Result |
> | Synthetic Planning Assumption (derived volumes) | Real company data |
> | Open Questions about measurement reliability | Verified performance |
>
> **There are no Actual Measured Results anywhere in this project at Phase 0.** Any future claim of
> improvement must compare a real post-implementation measurement against these declared synthetic
> baselines, and must state plainly that the baseline is synthetic.

---

## 1. Measurement Reliability — Read Before Using Any Figure

**Finding.** Several baselines below do not measure what they appear to measure. This is not a
caveat to be skimmed; it is one of the most important discovery outputs, because it determines which
metrics can support a claim of improvement and which cannot.

| Metric | Appears to measure | Actually conflates | Usable as a baseline? |
|---|---|---|---|
| SLA attainment (34%) | Response performance | Response performance **+** activity-logging compliance | ⚠️ Directionally only |
| Reassignment rate (18.6%) | Routing error | Routing error **+** legitimate business movement | ⚠️ Upper bound only |
| Duplicate Account rate (6.8%) | Data quality | Data quality **+** undefined franchise/subsidiary policy | ⚠️ Not interpretable yet |
| Blended funnel conversion | Sales performance | Performance **+** measurement-window artefact (21–210 day cycles) | ⚠️ Segment-level only |
| Missing-field rates | Data completeness | Data completeness (clean) | ✅ Usable |
| Created-to-assigned time | Assignment latency (clean) | — | ✅ Usable |

**Consequence for the project.** Establishing trustworthy measurement is a deliverable in its own
right, not a precondition assumed to be satisfied. The four ⚠️ metrics above cannot support a
credible before/after claim until their definitions are governed and their inputs are reliable.

---

## 2. Data Quality Baselines

**Synthetic Baseline.** Population: Leads created in the trailing twelve months, and the active
Account base.

### Completeness

| Metric | Leads | Accounts | Business consequence |
|---|---:|---:|---|
| Missing employee count | **44%** | 19% | Cannot price, qualify, segment, or route |
| Missing industry | **31%** | 12% | Cannot assess ICP fit |
| Missing / unusable domain | **22%** | 8% | Primary matching signal unavailable |
| Missing country | **17%** | 4% | Cannot assign territory |
| Invalid email format | 3.4% | — | Cannot contact |
| **Incomplete required routing data** (missing country and/or employee count) | **48%** | — | **Routing cannot resolve deterministically** |

*Arithmetic check: 44% + 17% − 13% overlap = 48%. The 13-point overlap (records missing both fields)
is within the valid range of 0–17%.*

**Finding.** Nearly half of all inbound Leads lack at least one field that routing structurally
requires. This is not a peripheral hygiene issue — it means the routing engine's most common input
condition is *incomplete data*. Any routing design that treats incomplete data as an edge case will
fail on ~48% of real volume. **The exception path is the main path.**

**Finding.** The two fields with the highest commercial importance — employee count (pricing, ICP,
segmentation, routing) and industry (ICP fit) — are the two least populated. Field importance and
field reliability are inversely correlated.

### Duplication

| Metric | Rate | Business consequence |
|---|---:|---|
| Duplicate Leads (≥1 probable duplicate) | **14.2%** | Multiple sellers work the same person; inflated volume |
| Leads created for an existing Contact | **9.1%** | Existing relationship invisible to the new record |
| Duplicate Accounts | 6.8% | Fragmented account history; ownership ambiguity |

**Finding.** Reported Lead volume overstates real demand by roughly 14%. Every conversion rate
computed on that denominator is correspondingly understated. Deduplication would therefore *improve*
apparent conversion rates without any change in sales performance — a distinction that must be
stated explicitly in any later before/after analysis, or the improvement claim would be misleading.

**Open Question — `DEC-004`, `DEC-008`.** The 6.8% Account duplicate rate cannot be interpreted
until the franchise/subsidiary commercial policy is defined
([`company-profile.md`](company-profile.md) §3). An unknown share of these may be legitimately
distinct entities. **This figure must not be used as an improvement target in its current form.**

---

## 3. Routing Baselines

**Synthetic Baseline.** Population: Leads created in the trailing twelve months.

| Metric | Value | Business consequence |
|---|---:|---|
| Median created-to-assigned | **6.4 business hours** | Nearly a full business day before work can begin |
| P90 created-to-assigned | **41 business hours** | The slowest decile waits over five business days |
| Unassigned beyond 24 business hours | **21%** | One in five records stalls before reaching anyone |
| Incorrect assignment (corrected within 5 days) | **11.3%** | Rework; delayed engagement; seller frustration |
| Reassignment within 30 days (any cause) | **18.6%** | Ownership churn |

**Finding.** The gap between median (6.4h) and P90 (41h) is 6.4×. This is the signature of a
**bimodal** process: records that satisfy the automated path are handled quickly, while records
requiring manual intervention wait substantially longer. The median therefore conceals the problem —
improving the median would not help the population that is actually suffering.

**Finding.** Of the 18.6% reassignment rate, 11.3 points are identified corrections. The remaining
**7.3 points cannot be classified** as error or legitimate movement, because no assignment reason is
recorded. The true routing error rate is therefore somewhere between 11.3% and 18.6%, and
NorthstarIQ cannot narrow that range with its current data.

**Open Question.** What proportion of the 21% unassigned population overlaps with the 48% incomplete
routing data population is unknown. A strong relationship would confirm the dependency chain in
[`current-state.md`](current-state.md); a weak one would indicate an additional independent cause.
**This is a priority validation target.**

---

## 4. SLA Baselines

**Synthetic Baseline.** Population: Leads created in the trailing twelve months.

| Metric | Value | Note |
|---|---:|---|
| Median created-to-assigned | 6.4 business hours | From §3 |
| Median assignment-to-first-touch | **9.1 business hours** | Post-assignment response latency |
| **Median created-to-first-touch** | **15.5 business hours** | 6.4 + 9.1 — roughly two business days |
| Assumed response expectation | 4 business hours | **Assumption** — see below |
| Attainment against that expectation | **34%** | |
| Breach rate | **66%** | |
| Leads with no logged first-touch activity | **27%** | Counted as breaches |

*Arithmetic check: 6.4 + 9.1 = 15.5 business hours. Attainment 34% + breach 66% = 100%.*

### Two critical caveats

**⚠️ The 4-hour expectation is an Assumption, not a documented commitment.** Whether NorthstarIQ has
ever formally agreed a response SLA is **unknown**. If no agreed target exists, then "66% breach
rate" measures performance against a standard nobody committed to. Establishing the target is
`DEC-006`, and it is a prerequisite to the metric being meaningful.

**⚠️ 27% of Leads have no logged first-touch activity at all.** These are counted as breaches
because there is no evidence of contact. But whether they were genuinely untouched, or were touched
by phone or email without being logged, **cannot be determined**.

**Finding.** This means the true breach rate lies between **39%** (if every unlogged record was in
fact touched on time) and **66%** (if none was). NorthstarIQ **cannot currently distinguish an SLA
failure from a measurement failure.** Fixing activity capture is therefore a prerequisite to
managing response performance — and any later improvement claim on this metric must account for the
possibility that improved logging, not improved responsiveness, produced the change.

**Open Question — `DEC-006`, `DEC-012`.** No agreed business-hours or holiday definition exists
across four markets ([`company-profile.md`](company-profile.md) §4). The same elapsed time yields
different SLA outcomes depending on which calendar is applied. "First touch" is also undefined — it
is unknown whether an automated email, a logged call attempt, or only a connected conversation
counts.

---

## 5. Funnel Baselines

**Synthetic Planning Assumption** for volumes; **Synthetic Baseline** for conversion rates.
Population: trailing twelve months, Lead-sourced new business.

| Stage transition | Entering | Rate | Exiting |
|---|---:|---:|---:|
| Inquiry → MQL | 24,000 | 18.0% | 4,320 |
| MQL → SAL (Sales Accepted) | 4,320 | 62.0% | 2,678 |
| SAL → SQL (Sales Qualified) | 2,678 | 45.0% | 1,205 |
| SQL → Opportunity | 1,205 | 38.0% | 458 |
| Opportunity → Closed Won | 458 | 25.1% | **115** |

*Arithmetic verified at each step. End-to-end Inquiry → Closed Won = 115 / 24,000 = **0.48%**.*

### Reconciliation to the revenue model

| Check | Value | Source |
|---|---:|---|
| Lead-sourced new logos | 115 | This table |
| Total new logos | 161 | [`revenue-model.md`](revenue-model.md) §5 |
| Lead-sourced share | **71.4%** | 115 / 161 |
| Non-Lead-sourced logos | 46 | Partner, referral, direct outbound to Account |

**Finding.** Roughly 29% of new logos do not originate as Leads. Any funnel analysis presented as
covering "new business" without this caveat overstates the Lead funnel's contribution. This is a
likely contributor to the Marketing/Sales attribution disagreement recorded in
[`current-state.md`](current-state.md) §5 — two functions may both be correct while describing
different populations.

### Derived operating volumes

| Metric | Value | Calculation |
|---|---:|---|
| Inquiries per month | ~2,000 | 24,000 / 12 |
| MQLs per month | ~360 | 4,320 / 12 |
| MQLs per SDR per month | ~36 | 4,320 / 10 SDRs / 12 |
| Opportunities created per month | ~38 | 458 / 12 |

**Open Question.** ~36 MQLs per SDR per month is low relative to typical inbound SDR capacity. Three
explanations are possible and **cannot be distinguished without validation**:
1. SDR capacity is genuinely under-utilized;
2. SDR time is absorbed by manual data work, duplicate resolution, and account research — consistent
   with the data-quality baselines but **not demonstrated**;
3. SDRs also work outbound or recycled volume not captured in this funnel.

**This must not be asserted as evidence of wasted capacity.** It is a validation target, and if
option 2 were confirmed it would be a strong element of the later business case.

### Structural interpretation warning

**Finding.** These rates are **blended across segments whose sales cycles range from 21 to 210
days** ([`revenue-model.md`](revenue-model.md) §8). Measured over any window shorter than roughly
seven months, blended SQL → Opportunity and Opportunity → Won rates systematically under-represent
Enterprise and Strategic, because those deals have not yet had time to convert.

**Blended funnel rates are therefore not a valid basis for segment comparison or for period-over-
period improvement claims.** Segment-level measurement with segment-appropriate windows is required.
This is a measurement-design defect, not a sales-performance defect — and distinguishing the two is
precisely what the later Revenue Intelligence Model must enable.

---

## 6. Metrics Deliberately Not Quantified

**The project brief permits documenting a baseline problem qualitatively where a number would be
artificial or misleading. The following are recorded that way deliberately.**

| Area | Why no number is given |
|---|---|
| **Security / access posture** | Nothing has been inspected. A percentage would be pure invention presented as assessment. Recorded as an inspection checklist in [`current-state.md`](current-state.md) §12. |
| **Salesforce administration debt** | Counting custom fields or automations without inventory would be fabrication. |
| **Seller time lost to manual data work** | Not measurable in the current environment. Estimating it would manufacture the project's own business case — the exact failure mode the discovery principle forbids. |
| **Documentation coverage** | "X% documented" implies an audit that has not occurred. |
| **Change-failure rate** | Requires deployment history that has not been examined. |
| **Exception volume** | Not currently captured anywhere. Its invisibility *is* the finding. |
| **Report definition conflicts** | Requires a report inventory. Recorded qualitatively. |

**This restraint is deliberate.** Inventing precise-looking numbers for unassessed domains would
make the discovery appear more thorough while making it less honest. A reviewer who checks would
find the numbers unsupported, which would discredit the figures that *are* properly grounded.

---

## 7. Baseline Register — Improvement Suitability

Consolidated view of what can legitimately support a later before/after claim.

| ID | Metric | Baseline | Suitable as improvement target? |
|---|---|---:|---|
| `B-01` | Missing employee count (Leads) | 44% | ✅ Clean measure |
| `B-02` | Missing industry (Leads) | 31% | ✅ Clean measure |
| `B-03` | Missing usable domain (Leads) | 22% | ✅ Clean measure |
| `B-04` | Missing country (Leads) | 17% | ✅ Clean measure |
| `B-05` | Incomplete routing data | 48% | ✅ Clean measure |
| `B-06` | Duplicate Lead rate | 14.2% | ✅ Clean, but note denominator effect on conversion |
| `B-07` | Lead-to-Contact duplicate rate | 9.1% | ✅ Clean measure |
| `B-08` | Duplicate Account rate | 6.8% | ⚠️ Blocked on `DEC-004` policy definition |
| `B-09` | Median created-to-assigned | 6.4 bh | ✅ Clean measure |
| `B-10` | P90 created-to-assigned | 41 bh | ✅ Better target than median (bimodal process) |
| `B-11` | Unassigned >24 bh | 21% | ✅ Clean measure |
| `B-12` | Incorrect assignment rate | 11.3% | ⚠️ Lower bound only |
| `B-13` | Reassignment rate | 18.6% | ⚠️ Upper bound only |
| `B-14` | Median created-to-first-touch | 15.5 bh | ⚠️ Depends on `DEC-006`, `DEC-012` |
| `B-15` | SLA attainment | 34% | ⚠️ Conflated with logging compliance |
| `B-16` | Leads with no logged first touch | 27% | ✅ Clean measure — and a prerequisite fix |
| `B-17` | Inquiry → MQL | 18.0% | ⚠️ Depends on MQL definition (`DEC-011`, qualification) |
| `B-18` | MQL → SAL | 62.0% | ⚠️ Depends on MQL and SAL definitions |
| `B-19` | SAL → SQL | 45.0% | ⚠️ Depends on lifecycle taxonomy (`DEC-017`) |
| `B-20` | SQL → Opportunity | 38.0% | ⚠️ Segment-level only |
| `B-21` | Opportunity → Closed Won | 25.1% | ⚠️ Segment-level only |

**Summary: 10 of 21 baselines are currently clean.** The other 11 are blocked on definitional
decisions or measurement reliability. **This is itself a finding:** roughly half of what NorthstarIQ
would want to improve cannot yet be measured well enough to prove improvement.

**These `B-##` identifiers are provisional discovery references.** Governed `KPI-###` definitions —
with numerator, denominator, grain, filters, exclusions, owner, and refresh expectation — are a
Phase 0C deliverable and are **not** established here.

---

## 8. Validation Record

| Check | Result |
|---|---|
| Completeness overlap arithmetic valid | ✅ 44 + 17 − 13 = 48; overlap ≤ min(17, 44) |
| SLA components sum to total | ✅ 6.4 + 9.1 = 15.5 business hours |
| SLA attainment + breach = 100% | ✅ 34 + 66 = 100 |
| Incorrect assignment ⊂ reassignment | ✅ 11.3 ≤ 18.6 |
| Funnel stage arithmetic | ✅ each stage verified |
| Funnel end-to-end | ✅ 115 / 24,000 = 0.48% |
| Funnel reconciles to revenue model | ✅ 115 / 161 = 71.4% Lead-sourced |
| Monthly volumes derive from annual | ✅ 24,000/12 = 2,000; 4,320/12 = 360 |
| All figures labelled | ✅ Synthetic Baseline / Synthetic Planning Assumption |
| Actual Measured Results present | ✅ **None** — correct for Phase 0 |
