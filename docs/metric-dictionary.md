# Metric Dictionary

| | |
|---|---|
| **Purpose** | The measures this project reports, defined once, with honest reliability |
| **Status** | 🟡 **CANDIDATE** — definitions agreed, no report or measure built |
| **Related** | [`business-case.md`](business-case.md) · [`architecture.md`](architecture.md) · [`requirements.md`](requirements.md) |

---

## ⛔ Every Baseline Here Is Synthetic

Baselines describe a fictional company and were invented to make the scenario coherent. **No figure
was measured from any real organization.**

Any later before/after claim must state that the baseline is synthetic. A synthetic baseline can
show that a design *would* move a metric. It can never show that a metric *was* moved.

---

## 1. Reliability Classification

**This is the most important column in the document.**

| Class | Meaning |
|---|---|
| ✅ **Reliable** | The underlying data supports the measure today |
| ⚠️ **Conflated** | Measurable, but the figure currently mixes distinguishable causes |
| 🔵 **Blocked** | Definitionally or structurally unmeasurable until something changes |

**Fewer than half of these measures can currently support a credible before/after claim.** Stating
that plainly is what makes the reliable ones trustworthy. A register presenting every metric as
equally sound would be more impressive and less honest — and one discovered overstatement would
discount the rest.

---

## 2. Metric Register

Eight metrics, reduced from fifteen. Each supports a decision a named persona actually makes.

### `M-01` — Routing-Critical Data Completeness

| | |
|---|---|
| **Definition** | Share of Leads where every routing-critical attribute is present and normalizable |
| **Formula** | `Complete Leads ÷ Total Leads` |
| **Grain** | Lead · by week, source, segment |
| **Source** | `Data_Quality_Status__c` |
| **Owner** | `PER-01` Revenue Operations |
| **Baseline** | **52%** |
| **Reliability** | ✅ |
| **Serves** | `BR-02`, `BR-22` |

> The denominator of everything downstream. At 52%, the exception path is the main path.

### `M-02` — Median Time to Assignment

| | |
|---|---|
| **Definition** | Median business hours from record creation to owner assignment |
| **Formula** | `median(assigned − created)` in business hours |
| **Grain** | Lead · by segment, territory, routing basis |
| **Source** | Created date; assignment timestamp / history |
| **Owner** | `PER-01` |
| **Baseline** | **6.4 business hours** |
| **Reliability** | ✅ |
| **Serves** | `BR-07`, `BR-22` |

### `M-03` — P90 Time to Assignment

| | |
|---|---|
| **Definition** | 90th-percentile business hours from creation to assignment |
| **Formula** | `p90(assigned − created)` in business hours |
| **Grain** | As `M-02` |
| **Owner** | `PER-01` |
| **Baseline** | **41 business hours** |
| **Reliability** | ✅ |
| **Serves** | `BR-07`, `BR-22` |

> ⚠️ **Never report `M-02` without `M-03`.** The 6.4× gap between them is the whole finding: the
> process is bimodal, and the median conceals the population that is actually suffering. Improving
> the median alone would be an improvement that helps nobody.

### `M-04` — Unassigned Beyond Threshold

| | |
|---|---|
| **Definition** | Share of Leads still unassigned after 24 business hours |
| **Formula** | `Unassigned > 24bh ÷ Total Leads` |
| **Grain** | Lead · by segment, territory, exception class |
| **Source** | Owner state; exception classification |
| **Owner** | `PER-01` |
| **Baseline** | **21%** |
| **Reliability** | ✅ |
| **Serves** | `BR-13`, `BR-22` |

### `M-05` — Existing-Customer Detection Rate

| | |
|---|---|
| **Definition** | Share of Leads matched to an existing Account where a match existed to be found |
| **Formula** | `Matched ÷ (Matched + missed matches identified in review)` |
| **Grain** | Lead · by match basis, source |
| **Source** | `Match_Status__c`, `Match_Basis__c` |
| **Owner** | `PER-01` |
| **Baseline** | 🔵 **None** |
| **Reliability** | 🔵 **Blocked** |
| **Serves** | `BR-03`, `BR-22` |

> **No baseline exists because nothing currently records a match attempt.** The denominator is
> unknowable retrospectively. This metric can only start from the moment matching is implemented —
> a genuine measurement gap, stated rather than estimated.

### `M-06` — SLA Attainment

| | |
|---|---|
| **Definition** | Share of **measurable** Leads whose first touch occurred within the segment target |
| **Formula** | `Met ÷ (Met + Breached)` — **`Unmeasurable` excluded from both** |
| **Grain** | Lead · by segment, territory, owner |
| **Source** | `SLA_Target_DateTime__c`, `First_Touch_DateTime__c` |
| **Owner** | `PER-02` Sales Manager |
| **Baseline** | **34%** against a 4-hour assumption |
| **Reliability** | ⚠️ **Conflated → reliable once `BR-11` is built** |
| **Serves** | `BR-10`, `BR-11`, `BR-22` |

> ⚠️ **Two things make the 34% baseline untrustworthy.** The 4-hour target is an assumption, not an
> agreed commitment. And 27% of records have no logged first touch and were counted as breaches —
> an unmeasurable record is not a breached one. The honest breach range is **39%–66%**.
>
> **`M-06` must never be reported without `M-07` beside it.**

### `M-07` — Response Measurability Rate

| | |
|---|---|
| **Definition** | Share of Leads where first touch could be determined at all |
| **Formula** | `(Met + Breached) ÷ Total Leads` |
| **Grain** | Lead · by segment, owner, source |
| **Owner** | `PER-02` |
| **Baseline** | **73%** |
| **Reliability** | ✅ |
| **Serves** | `BR-11`, `BR-22` |

> **The guard on every SLA claim.** Until this rises, no attainment figure is trustworthy — and a
> rising attainment rate accompanied by a falling measurability rate is not an improvement, it is a
> measurement artifact.

### `M-08` — Exception Volume by Class

| | |
|---|---|
| **Definition** | Count of records in each exception class over a period |
| **Formula** | `count(records) by exception class` |
| **Grain** | Lead · by class, week, segment |
| **Source** | Exception classification |
| **Owner** | `PER-01` |
| **Baseline** | 🔵 **None** — exceptions are currently invisible |
| **Reliability** | ✅ **once implemented** |
| **Serves** | `BR-13`, `BR-22` |

---

## 3. Register Summary

| ID | Metric | Owner | Reliability | Baseline |
|---|---|---|---|---|
| `M-01` | Routing-Critical Data Completeness | `PER-01` | ✅ | 52% |
| `M-02` | Median Time to Assignment | `PER-01` | ✅ | 6.4 bh |
| `M-03` | P90 Time to Assignment | `PER-01` | ✅ | 41 bh |
| `M-04` | Unassigned Beyond Threshold | `PER-01` | ✅ | 21% |
| `M-05` | Existing-Customer Detection Rate | `PER-01` | 🔵 | **None** |
| `M-06` | SLA Attainment | `PER-02` | ⚠️→✅ | 34% |
| `M-07` | Response Measurability Rate | `PER-02` | ✅ | 73% |
| `M-08` | Exception Volume by Class | `PER-01` | ✅ | **None** |

**Five reliable · one conflated-becoming-reliable · one blocked · two with no baseline.**

### Metrics that must never become targets

| Metric | Why |
|---|---|
| **Duplicate rate** | Lead volume overstates real demand by ~14%. Deduplication would *improve* apparent conversion with no change in sales performance. Targeting it manufactures a result. |
| **Seller activity volume** | Measures effort, not outcome; drives volume gaming. |
| **Median time to assignment alone** | See `M-03`. Optimizing the median is optimizing the population that already succeeds. |

---

## 4. Deferred Metrics

Valid, defined in the original register, out of this release.

| Metric | Why deferred |
|---|---|
| Attribute Completeness Rate (per field) | `M-01` covers the operational decision; per-field detail is a report breakdown, not a separate metric |
| Fit Assessability Rate | `BR-17` deferred; `OD-03` unresolved |
| Reassignment Rate by Cause | `BR-09` is P1; the cause data does not exist until it is built |
| Median Time to First Touch | Subsumed by `M-06` and `M-07` for this release |
| SLA Breach Rate | The complement of `M-06`; reporting both invites quoting whichever is more favourable |
| Stage Conversion Rate | Requires `BR-15` built and one taxonomy in force |
| Stage Duration | Requires `BR-16`; **no baseline exists at all, because history was never captured** |

---

## 5. Reporting

### Candidate Salesforce reports — 7

| # | Report | Metric |
|---|---|---|
| 1 | Data Quality — Completeness by Source and Week | `M-01` |
| 2 | Time to Assignment — Median and P90 by Segment | `M-02`, `M-03` |
| 3 | Unassigned Beyond Threshold | `M-04` |
| 4 | Routing Decision Audit — Assignments by Precedence Basis | `BR-08` |
| 5 | SLA Attainment and Measurability by Segment | `M-06`, `M-07` |
| 6 | Open SLA Breaches by Owner | `M-06`, `BR-12` |
| 7 | Exception Volume by Class | `M-08` |

**Report 4 has no metric of its own** and earns its place anyway: it is the operational proof that
`BR-08` works. If every assignment records why, this report is readable. If not, it is empty — which
is itself the test result.

### Candidate dashboard — 1

**`NIQ Revenue Operations Health`** — completeness, assignment speed with both percentiles, SLA
attainment paired with measurability, and open exceptions by class.

**One dashboard, not several.** A dashboard per persona duplicates components and drifts. The
personas here need the same operational picture filtered differently, which is what filters are for.

### Power BI boundary

| Layer | Answers |
|---|---|
| Salesforce reports and dashboard | "What is happening now, on my records" |
| Power BI | "How has this moved, and why" — trend, distribution, root cause |

Power BI reads decision data (reasons, bases, timestamps) and **must reconcile to a SOQL query on
the same population** (`BR-23`). Reconciliation is demonstrated, not asserted. A dashboard that
cannot reconcile is a second competing source of truth — `PROB-014` rebuilt in a new tool.
