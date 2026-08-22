# KPI Governance

| Field | Value |
|---|---|
| **Document** | KPI Governance |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Implementation State** | Target State |
| **Related** | `BR-007`, `BR-041`, `BR-048`–`BR-051` · [`../discovery/baseline-metrics.md`](../discovery/baseline-metrics.md) · [`data-governance.md`](data-governance.md) |

---

> ⚠️ **No DAX is written here. No Power BI artifact exists.** These are governed *definitions*.
> Implementation is Phase 2+.
>
> ⚠️ **Every baseline below is a Synthetic Baseline.** **No `Actual Measured Result` exists anywhere
> in this project.** `Proposed Target` columns are deliberately empty — targets require human
> approval, and a target invented here would become real by being referenced.

---

## 1. Why KPI Governance Exists

From `PROB-014`: reports built per-request over several years answer the same question differently.
Filter logic embedded in individual reports encodes implicit definitions that were never compared.
Meetings begin by reconciling numbers rather than acting on them.

**The dispute is definitional, not computational.** Multiple correct calculations of differently
defined metrics will disagree forever. Governance is the only remedy, and the definitions must live in
**version control** rather than in report configuration, where they are invisible and uncomparable.

### The second, independent defect

`PROB-014` records a measurement defect **separate from definitions**: sales cycles range from 21 to
210 days, so any blended conversion metric measured over a window shorter than roughly seven months
systematically under-represents Enterprise and Strategic.

> **Some disputed numbers are likely correct but misinterpreted, not wrong.**

Governance that addressed only definitions would leave this in place — which is why `BR-050`
(segment-appropriate windows) exists as a requirement in its own right.

---

## 2. Definition Standard

Every governed KPI carries:

| Field | Purpose |
|---|---|
| **KPI ID** | `KPI-###`, immutable |
| **Name** | Business language |
| **Business Question** | What decision it supports — a KPI supporting no decision should not exist |
| **Definition** | Plain-language statement |
| **Numerator** | Precisely stated |
| **Denominator** | Precisely stated |
| **Grain** | The level at which it is meaningful |
| **Filters** | Population inclusions |
| **Exclusions** | What is deliberately removed, and why |
| **Source** | Where the inputs originate |
| **Owner** | One accountable persona |
| **Refresh Expectation** | Derived from decision latency, not technical preference |
| **Synthetic Baseline** | The Phase 0B figure, where one exists |
| **Proposed Target** | **Empty — requires human approval** |
| **Implementation Status** | Phase 0C: `Proposed` throughout |

---

## 3. Measurement Reliability Classification

**This classification is the most important part of this document.** Several Phase 0B baselines do
not measure what they appear to measure, and a governance framework that ignored that would legitimise
misleading comparisons.

| Class | Meaning | Usable for before/after claims? |
|---|---|---|
| ✅ **Clean** | Measures what it appears to measure | Yes |
| ⚠️ **Conflated** | Combines two distinct phenomena | Directionally only, with the conflation stated |
| 🔵 **Definitionally blocked** | Cannot be interpreted until a decision is made | **No** |

---

## 4. KPI Register

### 4.1 Data Quality

#### `KPI-001` — Routing-Critical Data Completeness

| Field | Value |
|---|---|
| **Business Question** | What share of inbound records can be routed deterministically without intervention? |
| **Definition** | Proportion of Leads holding every attribute routing structurally requires |
| **Numerator** | Leads with country **and** employee count present and valid |
| **Denominator** | All Leads created in the period |
| **Grain** | Lead, aggregated by period, source, and segment where derivable |
| **Filters** | Created within the period |
| **Exclusions** | None — excluding incomplete records would defeat the measure |
| **Source** | Salesforce Lead |
| **Owner** | `PER-10` Revenue Operations |
| **Refresh** | Daily |
| **Synthetic Baseline** | **52% complete** (inverse of `B-05` 48% incomplete) |
| **Reliability** | ✅ Clean |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-001`, `BR-007` · `PROB-001` |

#### `KPI-002` — Attribute Completeness Rate

| Field | Value |
|---|---|
| **Business Question** | Which specific attribute is the binding constraint on data quality? |
| **Definition** | Proportion of Leads with a given attribute present and valid, measured per attribute |
| **Numerator** | Leads with the attribute present and valid |
| **Denominator** | All Leads created in the period |
| **Grain** | Attribute × period × source |
| **Exclusions** | None |
| **Source** | Salesforce Lead |
| **Owner** | `PER-10` |
| **Refresh** | Daily |
| **Synthetic Baseline** | Employee count 56% (`B-01`), industry 69% (`B-02`), domain 78% (`B-03`), country 83% (`B-04`) |
| **Reliability** | ✅ Clean |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-001`, `BR-007` |

#### `KPI-003` — Fit Assessability Rate

| Field | Value |
|---|---|
| **Business Question** | What share of records can be assessed for ICP fit at all? |
| **Definition** | Proportion of Leads holding the attributes fit assessment requires |
| **Numerator** | Leads assessable for fit |
| **Denominator** | All Leads created in the period |
| **Grain** | Lead × period × source |
| **Exclusions** | None |
| **Source** | Salesforce Lead |
| **Owner** | `PER-12` Marketing Operations |
| **Refresh** | Daily |
| **Synthetic Baseline** | Not separately measured in Phase 0B — derivable from `B-01`, `B-02` |
| **Reliability** | ✅ Clean |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-018` · `PROB-010` |

> **Why this KPI matters disproportionately.** It exposes the systematic bias in `BR-018`. If
> assessability correlates with source, then some channels are being systematically deprioritized
> **because their data is incomplete**, not because they produce worse prospects.

---

### 4.2 Routing

#### `KPI-004` — Median Time to Assignment

| Field | Value |
|---|---|
| **Business Question** | How quickly does a typical record reach an owner? |
| **Definition** | Median business hours from record creation to first owner assignment |
| **Numerator** | *(distribution measure — not a ratio)* |
| **Denominator** | — |
| **Grain** | Lead × period × segment |
| **Filters** | Assigned records |
| **Exclusions** | Records never assigned — **counted separately in `KPI-006`, never silently dropped** |
| **Source** | Salesforce Lead |
| **Owner** | `PER-10` |
| **Refresh** | Daily |
| **Synthetic Baseline** | **6.4 business hours** (`B-09`) |
| **Reliability** | ✅ Clean |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-033` · `PROB-006` |

> ⚠️ **The median conceals the problem.** Use `KPI-005` for improvement targeting.

#### `KPI-005` — P90 Time to Assignment

| Field | Value |
|---|---|
| **Business Question** | How long does the *worst-served* population wait? |
| **Definition** | 90th percentile business hours from creation to first assignment |
| **Grain** | Lead × period × segment |
| **Exclusions** | Never-assigned records — see `KPI-006` |
| **Source** | Salesforce Lead |
| **Owner** | `PER-10` |
| **Refresh** | Daily |
| **Synthetic Baseline** | **41 business hours** (`B-10`) |
| **Reliability** | ✅ Clean — **and the better improvement target** |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-033` · `PROB-006` |

> **Finding.** The 6.4× gap between median and P90 is the signature of a **bimodal process**.
> Improving the median would not help the population actually suffering. **P90 is the metric that
> should carry the target**, and choosing the median instead would produce apparent improvement
> without helping anyone.

#### `KPI-006` — Unassigned Beyond Threshold

| Field | Value |
|---|---|
| **Business Question** | How many records stall before reaching anyone? |
| **Definition** | Proportion of Leads unassigned beyond 24 business hours from creation |
| **Numerator** | Leads unassigned beyond 24 business hours |
| **Denominator** | All Leads created in the period |
| **Grain** | Lead × period × segment × source |
| **Exclusions** | None |
| **Source** | Salesforce Lead |
| **Owner** | `PER-10` |
| **Refresh** | Intraday — supports intervention while it is still possible |
| **Synthetic Baseline** | **21%** (`B-11`) |
| **Reliability** | ✅ Clean |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-033`, `BR-044` · `PROB-006` |

> **On the 24-hour threshold.** This is **inherited from the Phase 0B baseline definition** (`B-11`),
> not invented here and **not an SLA commitment** — the response commitment is `DEC-006` and remains
> open. It is a measurement boundary for observing the stalled population, and it is stated explicitly
> so it is never mistaken for an agreed target.

#### `KPI-007` — Reassignment Rate by Cause

| Field | Value |
|---|---|
| **Business Question** | How often is routing wrong, as distinct from ownership legitimately moving? |
| **Definition** | Proportion of assigned Leads reassigned within 30 days, **split by recorded cause** |
| **Numerator** | Leads reassigned within 30 days, by cause |
| **Denominator** | All Leads assigned in the period |
| **Grain** | Lead × period × cause × segment |
| **Exclusions** | None |
| **Source** | Salesforce Lead, reassignment reason (`BR-036`) |
| **Owner** | `PER-02` Sales Manager |
| **Refresh** | Weekly |
| **Synthetic Baseline** | **18.6% total** (`B-13`), of which 11.3 points identified corrections (`B-12`) |
| **Reliability** | ⚠️ **Conflated today** — becomes ✅ Clean once `BR-036` captures causes |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-036` · `PROB-003` |

> **This KPI is the clearest demonstration of the project thesis.** Today the routing error rate is
> known only as a **range between 11.3% and 18.6%**, because 7.3 points cannot be classified. The
> analytics fix is not an analytics change — it is `BR-036` capturing a reason at the point of
> decision. **No dashboard can surface a cause that does not exist as data.**

---

### 4.3 SLA

#### `KPI-008` — Median Time to First Touch

| Field | Value |
|---|---|
| **Business Question** | How long before a prospect hears from a human? |
| **Definition** | Median business hours from record creation to first touch |
| **Grain** | Lead × period × segment × owner |
| **Exclusions** | Records with no logged touch — **counted in `KPI-011`, never silently dropped** |
| **Source** | Salesforce Lead, first-touch timestamp (`BR-040`) |
| **Owner** | `PER-09` SDR/BDR Manager |
| **Refresh** | Daily |
| **Synthetic Baseline** | **15.5 business hours** (`B-14`) |
| **Reliability** | 🔵 **Definitionally blocked** — depends on `DEC-012` (what counts as first touch) and `DEC-006` (whose business hours) |
| **Proposed Target** | *(requires approval — and `DEC-006`)* |
| **Related** | `BR-040`, `BR-042` · `PROB-007` |

#### `KPI-009` — SLA Attainment

| Field | Value |
|---|---|
| **Business Question** | Are we meeting our response commitment? |
| **Definition** | Proportion of Leads first touched within the agreed commitment |
| **Numerator** | Leads first touched within the commitment |
| **Denominator** | Leads with a determinate outcome — **excludes the indeterminate population** |
| **Grain** | Lead × period × segment × owner |
| **Exclusions** | Records with no logged touch — reported separately in `KPI-011` |
| **Source** | Salesforce Lead |
| **Owner** | `PER-09` |
| **Refresh** | Intraday |
| **Synthetic Baseline** | **34%** (`B-15`) — measured against an **assumed** 4-hour expectation |
| **Reliability** | 🔵 **Definitionally blocked** — `DEC-006`, `DEC-012` |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-038`, `BR-041` · `PROB-007` |

> ⚠️ **This metric is currently ungrounded, not merely imprecise.** Whether NorthstarIQ ever agreed a
> response SLA is **unknown**; the 4-hour figure is an Assumption. If no commitment exists, "66%
> breach rate" measures performance against a standard nobody committed to. **`BR-038` requires the
> commitment to exist before attainment is reported at all.**

#### `KPI-010` — SLA Breach Rate

| Field | Value |
|---|---|
| **Business Question** | How often do we demonstrably miss the commitment? |
| **Definition** | Proportion of Leads with a determinate outcome that exceeded the commitment |
| **Numerator** | Leads demonstrably touched after the commitment |
| **Denominator** | Leads with a determinate outcome |
| **Grain** | Lead × period × segment × owner |
| **Exclusions** | Indeterminate population — `KPI-011` |
| **Source** | Salesforce Lead |
| **Owner** | `PER-09` |
| **Refresh** | Intraday |
| **Synthetic Baseline** | **66%** on the current conflated definition (`B-15` inverse); **true rate lies between 39% and 66%** |
| **Reliability** | 🔵 **Definitionally blocked** |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-041`, `BR-043` · `PROB-007` |

#### `KPI-011` — Response Measurability Rate

| Field | Value |
|---|---|
| **Business Question** | What share of records can we determine a response outcome for at all? |
| **Definition** | Proportion of Leads with a determinable first-touch outcome |
| **Numerator** | Leads with a logged first touch, or demonstrably untouched |
| **Denominator** | All assigned Leads in the period |
| **Grain** | Lead × period × owner |
| **Exclusions** | None |
| **Source** | Salesforce Lead activity |
| **Owner** | `PER-09` |
| **Refresh** | Daily |
| **Synthetic Baseline** | **73%** measurable (inverse of `B-16` 27% with no logged touch) |
| **Reliability** | ✅ Clean |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-040`, `BR-041` · `PROB-007` |

> **This KPI exists to make a specific deception impossible.** As activity capture improves, `KPI-009`
> attainment will change **for reasons unrelated to responsiveness**. Reporting `KPI-011` alongside it
> makes the two effects separable. Without it, improved logging is indistinguishable from improved
> performance — and would be the easiest possible false improvement claim to make.

---

### 4.4 Lifecycle and Funnel

#### `KPI-012` — Stage Conversion Rate

| Field | Value |
|---|---|
| **Business Question** | Where in the funnel are records lost? |
| **Definition** | Proportion of records entering a stage that progress to the next |
| **Numerator** | Records progressing to the next stage |
| **Denominator** | Records entering the stage in the cohort |
| **Grain** | Stage transition × **cohort** × segment |
| **Filters** | **Cohort-based**, not period-based |
| **Exclusions** | Cohorts too recent to have completed the segment's typical cycle |
| **Source** | Lifecycle transition history (`BR-020`) |
| **Owner** | `PER-14` Data / BI Analyst |
| **Refresh** | Weekly |
| **Synthetic Baseline** | `B-17`–`B-21` — 18.0%, 62.0%, 45.0%, 38.0%, 25.1% |
| **Reliability** | 🔵 **Definitionally blocked** — `DEC-017`, `DEC-010` |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-019`, `BR-050` · `PROB-011`, `PROB-014` |

> ⚠️ **Two independent defects apply.** **Definitional**: four of five funnel baselines depend on
> stage definitions nobody has agreed. **Measurement**: with cycles spanning 21–210 days, a
> period-based blended rate systematically under-represents Enterprise and Strategic. This KPI is
> cohort-based and segment-grained **specifically to avoid the second defect**, which governance of
> definitions alone would not fix.

#### `KPI-013` — Stage Duration

| Field | Value |
|---|---|
| **Business Question** | Where do records wait? |
| **Definition** | Median and P90 elapsed time in each lifecycle stage |
| **Grain** | Stage × cohort × segment |
| **Exclusions** | Records still in the stage — reported separately as open ageing |
| **Source** | Lifecycle transition history (`BR-020`, `BR-022`) |
| **Owner** | `PER-14` |
| **Refresh** | Weekly |
| **Synthetic Baseline** | **None — not currently measurable** (`PROB-011`) |
| **Reliability** | 🔵 Blocked — `DEC-017`, and **entirely dependent on `DEC-018`** |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-020`, `BR-022` |

> ⚠️ **This KPI has no baseline because the data does not exist.** It cannot be backfilled. **If
> `DEC-018` is deferred past implementation, this KPI has no data for the deferral period,
> permanently** — including no "before" baseline against which any lifecycle improvement could be
> demonstrated.

---

### 4.5 Identity and Exceptions

#### `KPI-014` — Existing-Customer Detection Rate

| Field | Value |
|---|---|
| **Business Question** | How reliably do we recognise inbound interest from existing customers? |
| **Definition** | Proportion of inbound records from existing customers correctly identified as such |
| **Numerator** | Records correctly linked to an existing customer Account |
| **Denominator** | Records that genuinely relate to an existing customer |
| **Grain** | Lead × period × segment |
| **Exclusions** | Records not assessable for matching (`BR-008`) — reported separately |
| **Source** | Salesforce Lead, match basis (`BR-009`) |
| **Owner** | `PER-10` |
| **Refresh** | Weekly |
| **Synthetic Baseline** | **None** — the denominator is not currently knowable |
| **Reliability** | 🔵 Blocked — `DEC-004`, `DEC-008` |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-008`, `BR-009` · `PROB-002` |

> **Honest limitation.** The denominator — records that *genuinely* relate to an existing customer —
> is **not directly observable**. It can only be approximated through sampling or after-the-fact
> discovery. Presenting this as a precisely measurable rate would be false precision, and that is
> stated here rather than discovered later.

#### `KPI-015` — Exception Volume by Class

| Field | Value |
|---|---|
| **Business Question** | How much manual remediation is the operation absorbing? |
| **Definition** | Count of operational exceptions raised, by class |
| **Numerator** | *(count measure)* |
| **Denominator** | — *(rate per 100 records also reported)* |
| **Grain** | Exception class × period × owner |
| **Exclusions** | None |
| **Source** | Exception records (`BR-044`) |
| **Owner** | `PER-10` |
| **Refresh** | Daily |
| **Synthetic Baseline** | **None — not currently captured anywhere. Its invisibility is the finding.** |
| **Reliability** | ✅ Clean once implemented |
| **Proposed Target** | *(requires approval)* |
| **Related** | `BR-044`, `BR-047` · `PROB-012` |

> **This KPI breaks the self-perpetuating mechanism.** Because remediation is absorbed into normal
> work its cost is invisible; because invisible, no business case for structural fix is built; because
> unfixed, the work continues. **Measurement is the first link in that chain and the only one that can
> be broken unilaterally.**

---

## 5. Register Summary

| KPI | Name | Owner | Reliability | Baseline |
|---|---|---|---|---|
| `KPI-001` | Routing-Critical Data Completeness | `PER-10` | ✅ | 52% |
| `KPI-002` | Attribute Completeness Rate | `PER-10` | ✅ | Per attribute |
| `KPI-003` | Fit Assessability Rate | `PER-12` | ✅ | Derivable |
| `KPI-004` | Median Time to Assignment | `PER-10` | ✅ | 6.4 bh |
| `KPI-005` | P90 Time to Assignment | `PER-10` | ✅ | 41 bh |
| `KPI-006` | Unassigned Beyond Threshold | `PER-10` | ✅ | 21% |
| `KPI-007` | Reassignment Rate by Cause | `PER-02` | ⚠️→✅ | 18.6% |
| `KPI-008` | Median Time to First Touch | `PER-09` | 🔵 | 15.5 bh |
| `KPI-009` | SLA Attainment | `PER-09` | 🔵 | 34% |
| `KPI-010` | SLA Breach Rate | `PER-09` | 🔵 | 39–66% |
| `KPI-011` | Response Measurability Rate | `PER-09` | ✅ | 73% |
| `KPI-012` | Stage Conversion Rate | `PER-14` | 🔵 | `B-17`–`B-21` |
| `KPI-013` | Stage Duration | `PER-14` | 🔵 | **None** |
| `KPI-014` | Existing-Customer Detection Rate | `PER-10` | 🔵 | **None** |
| `KPI-015` | Exception Volume by Class | `PER-10` | ✅ | **None** |

**Seven clean · one conflated-becoming-clean · seven definitionally blocked · three with no baseline
at all.**

**Finding.** Fewer than half of the governed KPIs can currently support a credible before/after claim.
This is the accurate state, and stating it plainly is what makes the seven clean measures
trustworthy. A register presenting all fifteen as equally sound would be more impressive and less
honest — and one discovered overstatement would discount the rest.

---

## 6. Why Only Fifteen

KPI count is not evidence. Each metric here supports a decision a named persona actually makes.
Deliberately excluded:

| Excluded | Reason |
|---|---|
| Revenue and ARR metrics | Owned by Finance; outside this project's boundary |
| Seller activity volume | Measures effort, not outcome; drives volume gaming |
| Duplicate rate as a target | 🔵 Blocked on `DEC-004` — **explicitly must not be an improvement target** |
| Pipeline coverage ratio | Requires forecast governance not established |
| Report definition conflicts | Requires a report inventory that has not been performed |

**On duplicate rate specifically:** deduplication would *improve* apparent conversion rates with no
change in sales performance, because Lead volume overstates real demand by ~14%. Targeting it would
manufacture an improvement.

---

## 7. Governance Rules

1. **One owner per KPI.** Shared ownership is no ownership.
2. **Definitions live in version control**, not in report configuration.
3. **Any reported figure is attributable to the definition version that produced it** (`BR-048`).
4. **Every figure carries its provenance label.**
5. **No `Proposed Target` without human approval.**
6. **No `Actual Measured Result` until a real run produces one.**
7. **Blocked KPIs are reported as blocked**, not quietly computed on an assumed definition.
8. **Reliability class is published with the metric**, so a ⚠️ or 🔵 figure is never read as a clean
   one.
9. **Any improvement claim states the baseline is synthetic** and addresses conflation where the
   metric is not clean.
