# Revenue Model — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Revenue Model |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`company-profile.md`](company-profile.md) · [`baseline-metrics.md`](baseline-metrics.md) · [`sales-organization.md`](sales-organization.md) |

> ## ⚠️ Critical Reading Instruction
>
> This document is **descriptive**. It models what NorthstarIQ's customer base currently *looks
> like*, so that later analysis has a coherent commercial foundation.
>
> It is **not prescriptive**. The segment bands, employee ranges, and ACV thresholds below
> **must not** be treated as approved segmentation rules, routing thresholds, or Salesforce field
> values. They describe an observed distribution; they do not define policy.
>
> | Descriptive (this document) | Prescriptive (requires human decision) |
> |---|---|
> | "Customers we call Enterprise average 2,200 employees" | "Accounts with ≥1,000 employees are Enterprise" |
> | "Mid-Market ACV clusters around $58K" | "ACV ≥$50K routes to the Mid-Market team" |
> | "Strategic customers average $540K" | "Strategic designation is set by ARR" |
>
> Converting any figure here into a business rule requires resolution of `DEC-001` (Enterprise
> employee threshold), `DEC-002` (revenue vs employee precedence), and `DEC-005` (Strategic
> Account designation source) in Phase 0C. **This document does not resolve them.**

---

## 1. Segment Distribution

**Synthetic Planning Assumption.** Reconciles exactly to the Known Context totals of ~$42M ARR and
~650 customers.

| Segment | Customers | % customers | Avg ACV | ARR | % ARR |
|---|---:|---:|---:|---:|---:|
| SMB | 325 | 50.0% | $26,000 | $8.45M | 20.1% |
| Mid-Market | 240 | 36.9% | $58,000 | $13.92M | 33.1% |
| Enterprise | 74 | 11.4% | $185,000 | $13.69M | 32.6% |
| Strategic | 11 | 1.7% | $540,000 | $5.94M | 14.1% |
| **Total** | **650** | **100.0%** | **$64,615** | **$42.00M** | **100.0%** |

*Arithmetic verified: 325 + 240 + 74 + 11 = 650. (325×26,000) + (240×58,000) + (74×185,000) +
(11×540,000) = $42,000,000.*

### The concentration asymmetry

**Finding.** Half of NorthstarIQ's customers generate one-fifth of its revenue; 13% generate 47%.

```
Customers                          ARR
SMB          ████████████ 50.0%    ████ 20.1%
Mid-Market   █████████ 36.9%       ████████ 33.1%
Enterprise   ███ 11.4%             ████████ 32.6%
Strategic    ▌ 1.7%                ███ 14.1%
```

This asymmetry is the reason routing and segmentation errors are commercially material rather than
merely untidy:

- A misrouted SMB record costs roughly **$26K** of at-risk opportunity value.
- A misrouted Strategic record costs roughly **$540K** — **21×** more.
- Strategic and Enterprise together are 85 accounts. At that population, a **single** systematic
  ownership error is a measurable share of the segment.

**Finding.** The segments most exposed to routing error are also the segments where the customer
base is structurally hardest to identify — Enterprise and Strategic customers are the multi-site,
parent/subsidiary, multi-trading-name organizations described in
[`company-profile.md`](company-profile.md) §3. Identity risk and revenue concentration coincide.

---

## 2. Pricing Model

**Synthetic Planning Assumption.** Per-employee, per-month subscription with volume-based rate
tiers. Consistent with the product description in [`company-profile.md`](company-profile.md) §2.

| Segment | Typical employee range | Avg employees | Rate / emp / month | Derived ACV |
|---|---|---:|---:|---:|
| SMB | 50 – 249 | 150 | $14.50 | $26,100 |
| Mid-Market | 250 – 999 | 550 | $8.80 | $58,080 |
| Enterprise | 1,000 – 4,999 | 2,200 | $7.00 | $184,800 |
| Strategic | 5,000+ | 7,500 | $6.00 | $540,000 |

*Derived ACV reconciles to the segment table above within rounding.*

> **Employee ranges above are OBSERVED, not defined.** They describe where the current customer
> base happens to sit. They are **not** the segmentation thresholds. `DEC-001` and `DEC-002` remain
> unresolved.

### Why this matters more than typical pricing detail

**Finding.** Because price scales with employee count, employee count is simultaneously:

1. the **pricing input** — no employee count, no quotable price;
2. the **ICP fit signal** — organization size predicts product value;
3. the **segmentation input** — segment is conventionally derived from it; and
4. the **routing input** — segment determines the owning team.

A single missing field therefore breaks qualification, pricing, segmentation, and routing
simultaneously. Against the baseline that **44% of Leads lack employee count**
(see [`baseline-metrics.md`](baseline-metrics.md)), this is the highest-leverage data-quality
problem in the environment.

---

## 3. ARR Waterfall

**Synthetic Planning Assumption.** Trailing twelve months.

| Component | Amount | Note |
|---|---:|---|
| Opening ARR | $34.80M | Prior year close |
| **+** Gross new ARR | $6.90M | 161 new logos |
| **+** Expansion ARR | $5.50M | Seat growth, tier upgrades, module attach |
| **−** Churn & contraction | $5.20M | 139 lost logos plus downgrades |
| **= Closing ARR** | **$42.00M** | **Known Context** |

*Arithmetic verified: 34.80 + 6.90 + 5.50 − 5.20 = 42.00.*

### Derived retention metrics

| Metric | Value | Calculation |
|---|---:|---|
| YoY ARR growth | 20.7% | 7.20 / 34.80 |
| Gross Revenue Retention (GRR) | 85.1% | (34.80 − 5.20) / 34.80 |
| Net Revenue Retention (NRR) | 100.9% | (34.80 − 5.20 + 5.50) / 34.80 |
| Expansion as % of new ARR | 44.4% | 5.50 / (6.90 + 5.50) |

**Finding.** NRR of 100.9% is only marginally above break-even. NorthstarIQ is dependent on new
logo acquisition for growth, which raises the business cost of every defect in the Lead-to-Revenue
process. A company with NRR of 130% can absorb a leaky top-of-funnel; NorthstarIQ cannot.

**Open Question.** Whether expansion ARR is currently attributable to a specific seller, motion, or
Opportunity record is unknown. If expansion is recorded inconsistently, expansion-related pipeline
and attribution reporting is unreliable — but this has not been verified and must not be assumed.

---

## 4. Customer Count Reconciliation

**Synthetic Planning Assumption.**

| Movement | SMB | Mid-Market | Enterprise | Strategic | Total |
|---|---:|---:|---:|---:|---:|
| Opening customers | 326 | 220 | 72 | 10 | **628** |
| **+** New logos | 96 | 60 | 5 | 0 | **161** |
| **−** Churned logos | 97 | 40 | 2 | 0 | **139** |
| **±** Segment migration | 0 | 0 | −1 | +1 | **0** |
| **= Closing customers** | **325** | **240** | **74** | **11** | **650** |

*Arithmetic verified: 628 + 161 − 139 = 650. Column totals reconcile to the segment distribution
in §1.*

### Derived churn metrics

| Segment | Churned | Opening | Logo churn rate |
|---|---:|---:|---:|
| SMB | 97 | 326 | 29.8% |
| Mid-Market | 40 | 220 | 18.2% |
| Enterprise | 2 | 72 | 2.8% |
| Strategic | 0 | 10 | 0.0% |
| **Blended** | **139** | **628** | **22.1%** |

**Finding.** Logo churn is heavily SMB-weighted, which is consistent with low-ACV, low-touch
segments. Because SMB is 50% of customers but 20% of ARR, high SMB logo churn is survivable
commercially — but it means the majority of customer records in Salesforce belong to the segment
with the highest turnover, and therefore the highest rate of records becoming stale.

**Assumption.** Churned customers remain in Salesforce as Accounts. If churned Accounts are not
clearly distinguishable from active customers, existing-customer detection during routing may match
inbound Leads to relationships that no longer exist. **This requires validation** — the current
handling of churned Accounts has not been inspected.

### Segment migration

One Enterprise customer moved to Strategic during the period. **Open Question:** what triggered the
reclassification, who authorized it, and whether it was recorded anywhere other than the segment
field is unknown. This is a direct input to `DEC-005` (Strategic Account designation source).

---

## 5. New Business Composition

**Synthetic Planning Assumption.**

| Segment | New logos | Avg new ACV | New ARR | % of gross new |
|---|---:|---:|---:|---:|
| SMB | 96 | $26,000 | $2.496M | 36.2% |
| Mid-Market | 60 | $58,000 | $3.480M | 50.4% |
| Enterprise | 5 | $185,000 | $0.925M | 13.4% |
| Strategic | 0 | — | — | 0.0% |
| **Total** | **161** | **$42,864** | **$6.901M** | **100%** |

*Arithmetic verified: sums to $6.901M ≈ $6.90M in the waterfall.*

**Finding.** Strategic accounts are not acquired as net-new logos; they are Enterprise customers
that grow into the designation. This has a direct architectural consequence: **Strategic is a
lifecycle outcome, not an acquisition segment.** Any later design that treats Strategic as an
inbound routing destination would misrepresent how the business actually works.

**Finding.** Mid-Market produces the largest share of new ARR (50.4%) from 37% of new logos. It is
the commercial centre of the new-business motion, and therefore the segment where segmentation
boundary errors — records falling to SMB round-robin that should have reached a Mid-Market AE, or
the reverse — carry the greatest aggregate cost.

---

## 6. Sales Capacity and Attainment

**Synthetic Planning Assumption.** Quota carried by Account Executives; headcount per
[`sales-organization.md`](sales-organization.md).

| Segment | AEs | Quota / AE | Total quota capacity |
|---|---:|---:|---:|
| Strategic | 2 | $2,000,000 | $4.00M |
| Enterprise | 8 | $900,000 | $7.20M |
| Mid-Market | 9 | $600,000 | $5.40M |
| SMB | 11 | $340,000 | $3.74M |
| **Total** | **30** | — | **$20.34M** |

| Metric | Value | Calculation |
|---|---:|---|
| Sales-booked ARR (new + expansion) | $12.40M | 6.90 + 5.50 |
| Blended quota attainment | 61.0% | 12.40 / 20.34 |

**Finding.** Blended attainment of 61% is within a normal range for B2B SaaS but leaves little
tolerance for wasted selling capacity. Every hour an AE spends on record cleanup, duplicate
resolution, or chasing a misrouted Lead is drawn from a capacity pool that is already only 61%
converted.

**Open Question.** How much AE and SDR time is currently consumed by manual data work, duplicate
resolution, and ownership disputes is unknown and not measurable from the current environment. This
is a candidate for validation, and — if it can be measured — a strong later business case. It must
**not** be estimated or asserted without measurement.

---

## 7. Account Load per Seller

**Synthetic Planning Assumption.** Derived from §1 and the AE counts in §6.

| Segment | Customers | AEs | Accounts / AE |
|---|---:|---:|---:|
| Strategic | 11 | 2 | 5.5 |
| Enterprise | 74 | 8 | 9.3 |
| Mid-Market | 240 | 9 | 26.7 |
| SMB | 325 | 11 | 29.5 |

**Finding.** The load profile is coherent — high-touch segments carry few accounts, low-touch
segments carry many. This matters for a specific later design question: whether a seller's
**current account load** should influence routing eligibility. At 5.5 accounts per Strategic AE,
capacity-based routing is meaningless; at 29.5 accounts per SMB AE it may be significant.

This is an input to `DEC-007` (seller absence handling) and `DEC-013` (round-robin behaviour). It
is **not** resolved here.

---

## 8. Sales Cycle and Deal Characteristics

**Synthetic Planning Assumption.**

| Segment | Median sales cycle | Typical stakeholders | Contract term |
|---|---:|---:|---|
| SMB | 21 days | 1–2 | 12 months |
| Mid-Market | 58 days | 3–5 | 12 months |
| Enterprise | 134 days | 6–10 | 24 months |
| Strategic | 210 days | 10+ | 24–36 months |

**Finding.** The 10× spread between SMB and Strategic cycle length means a single funnel-conversion
metric computed across all segments is not interpretable. A blended "SQL → Opportunity" rate
measured over any window shorter than ~7 months systematically under-represents Enterprise and
Strategic performance, because those deals have not had time to convert.

This is a concrete, structural cause of the fragmented-funnel-reporting problem recorded in
[`business-problems.md`](business-problems.md) — and it is a **measurement design** defect, not a
sales performance defect. Distinguishing the two is exactly the kind of analysis the later Revenue
Intelligence Model must support.

---

## 9. What This Model Does and Does Not Establish

### Establishes

- A coherent commercial foundation that reconciles to Known Context (~$42M, ~650 customers)
- Why routing and identity errors carry asymmetric commercial cost (§1)
- Why employee count is the highest-leverage data field (§2)
- Why NorthstarIQ cannot tolerate a leaky funnel (§3)
- Why Strategic is a lifecycle outcome rather than an acquisition segment (§5)
- Why blended funnel metrics are structurally misleading (§8)

### Does NOT establish

- ❌ Approved segmentation thresholds — `DEC-001`, `DEC-002`
- ❌ Strategic Account designation criteria — `DEC-005`
- ❌ Territory definitions — `DEC-022`
- ❌ Seller eligibility or capacity rules — `DEC-007`, `DEC-013`
- ❌ Existing-customer routing precedence — `DEC-003`
- ❌ Any Salesforce field value, picklist, or threshold

**Every figure in this document is fictional.** None was measured from a real organization. The
model exists to make later analysis coherent, not to assert commercial fact.

---

## 10. Arithmetic Validation Record

All figures in this document were computed and cross-checked programmatically:

| Check | Result |
|---|---|
| Segment customers sum to 650 | ✅ 325 + 240 + 74 + 11 = 650 |
| Segment ARR sums to $42.00M | ✅ $42,000,000 exactly |
| Blended ACV consistent | ✅ $42,000,000 / 650 = $64,615 |
| ARR waterfall closes | ✅ 34.80 + 6.90 + 5.50 − 5.20 = 42.00 |
| Customer movement reconciles | ✅ 628 + 161 − 139 = 650 |
| Segment movement columns reconcile | ✅ each column ties to §1 |
| New business ARR ties to waterfall | ✅ $6.901M ≈ $6.90M |
| Churn ARR ties to waterfall | ✅ $5.212M ≈ $5.20M |
| Quota capacity vs booked ARR | ✅ 12.40 / 20.34 = 61.0% |
