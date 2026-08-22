# Lifecycle Model

| Field | Value |
|---|---|
| **Document** | Lifecycle Model |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Open Decision — candidate model only |
| **Implementation State** | Target State |
| **Related** | `BR-019`–`BR-023` · `DEC-017`, `DEC-018`, `DEC-010` · [`../governance/kpi-governance.md`](../governance/kpi-governance.md) · [`open-decisions.md`](open-decisions.md) |

---

> ⚠️ **No lifecycle taxonomy in this document is approved.** Candidate stages are presented to make
> `DEC-017` tractable.
>
> ⚠️ **This model contains the project's only irreversible decision.** `DEC-018` determines whether
> transition history is captured. **History not captured cannot be reconstructed.**

---

## 1. Business Purpose

Lifecycle answers **"where are they in the revenue lifecycle, and why?"** — step 4 of the Revenue
Operations Intelligence Model. It provides the shared vocabulary through which Marketing, SDR/BDR,
and Sales describe the same record, and the time base for every funnel and velocity metric.

---

## 2. Current-State Problem

From `PROB-011`:

| Symptom | Consequence |
|---|---|
| Lifecycle stage and Lead Status used inconsistently and appear to overlap | Neither is authoritative; reports built on either disagree |
| Recycling of unconverted records undefined | Records disappear from view or are reworked ad hoc |
| Stalled records have no state identifying them as stalled | Indistinguishable from records being actively worked |
| **Transition history not retained** | **Stage duration is unanswerable and unrecoverable** |

### The critical architectural consequence

> **If stage transition history is not retained, "how long does a record spend in each stage" is
> unanswerable retrospectively — and unrecoverable.**
>
> History not captured cannot be reconstructed later. This must be decided **before** implementation,
> not after.

**This is the only place in the entire project where deferring a decision destroys the option rather
than postponing it.** Every other open decision costs rework if changed late; this one costs data
that cannot be recovered at any price.

### Why the funnel baselines are currently uninterpretable

| Baseline | Value | Blocker |
|---|---:|---|
| `B-17` Inquiry → MQL | 18.0% | Depends on the MQL definition (`DEC-011`, qualification) |
| `B-18` MQL → SAL | 62.0% | Depends on MQL and SAL definitions |
| `B-19` SAL → SQL | 45.0% | **Depends on the lifecycle taxonomy — `DEC-017`** |
| `B-20` SQL → Opportunity | 38.0% | Segment-level only |
| `B-21` Opportunity → Closed Won | 25.1% | Segment-level only |

**Finding.** Four of five funnel baselines are definitionally blocked. The funnel is not measured
badly — **it is measured against stages nobody has agreed the meaning of.** This is `PROB-014`
(conflicting answers) with a lifecycle-shaped root cause.

---

## 3. Known Requirements

| Requirement | Source |
|---|---|
| One governed taxonomy, single-sourced, with defined permitted transitions | `BR-019` |
| Transitions recorded with from-stage, to-stage, timestamp, cause, and acting principal | `BR-020` |
| Conversion represented as a lifecycle transition preserving continuity | `BR-021` |
| Time in each stage answerable retrospectively | `BR-022` |
| Stalled and recycled records have explicit states | `BR-023` |

---

## 4. Candidate Model

### 4.1 The single-source problem

**A real Salesforce design tension, and arguably how the current inconsistency arose.**

Lead Status is a **standard field with platform behaviour attached** — it participates in conversion
and in standard reporting. A parallel custom lifecycle field can create two competing sources of
truth. Three approaches:

| Approach | Mechanism | Assessment |
|---|---|---|
| **A — Lead Status as taxonomy** | Extend standard Lead Status values to carry the lifecycle | Simplest for `PER-13` to maintain; but Lead Status **does not span the Lead-to-Opportunity boundary**, so end-to-end cycle time stays unmeasurable |
| **B — Separate lifecycle field** | A custom stage field spanning Lead and Opportunity | Spans the boundary and serves `BR-021`; but creates the two-fields problem unless one is explicitly derived |
| **C — Hybrid** | Lead Status remains operational; a derived lifecycle stage spans objects for analytics | Preserves platform behaviour and analytical continuity; highest maintenance surface for a 1:64 administrator |

**What can be stated regardless of the choice** (`BR-019`): **exactly one field is authoritative per
concept, and any other stage-like value is documented as derived.** Parallel un-reconciled
representations are the defect being fixed; adding a third would compound it.

### 4.2 Candidate stage set

> ⚠️ **Illustrative structure showing the shape of a taxonomy. NOT proposed stages.** `DEC-017`
> supplies the real set.

| # | Candidate stage | Owning function | Boundary event |
|---|---|---|---|
| 1 | Inquiry | Marketing | Record created |
| 2 | Marketing Qualified | Marketing | Meets MQL definition (`DEC-010`) |
| 3 | Sales Accepted | SDR/BDR | Ownership accepted |
| 4 | Sales Qualified | SDR/BDR | Meets qualification criteria (`DEC-010`) |
| 5 | Opportunity | Sales | Converted (`BR-021`) |
| 6 | Closed Won / Closed Lost | Sales | Opportunity closed |
| — | **Disqualified** | Any | Explicitly not proceeding |
| — | **Stalled** | Any | No progression for a defined period (`BR-023`) |
| — | **Recycled** | Marketing | Returned for future nurture |

**Structural observations that hold whatever the stage names:**

1. Stages **1–2 are Marketing-owned, 3–4 SDR/BDR-owned, 5–6 Sales-owned.** Each ownership boundary is
   a handoff, and **handoffs are where records are lost.**
2. **Disqualified, Stalled, and Recycled are not sequential stages** — they are terminal or holding
   states reachable from multiple points. Modelling them as sequence positions would be a design
   error.
3. The **MQL boundary is the definitional dispute** in `PROB-010` expressed as a stage transition. Its
   placement is `DEC-010`, not a lifecycle decision.

### 4.3 Candidate transition rules

> **Requires `DEC-017`.** Presented as questions to decide.

| Question | Options | Consequence |
|---|---|---|
| Is backwards movement permitted? | Prohibit / permit with reason / permit freely | Prohibiting forces the Recycled state to carry the work; permitting freely makes funnel rates unstable |
| Can stages be skipped? | Prohibit / permit with reason | Skipping is common in practice; prohibiting it produces false transitions recorded only to satisfy the rule |
| What re-enters a Recycled record? | Automatic on new activity / manual / never | Determines whether recycling is a real path or a euphemism for deletion |
| Does Disqualified permanently exclude? | Yes / time-bounded | Permanent exclusion loses genuine future opportunity |

**Finding.** Every row above has a **measurement consequence, not merely an operational one.**
Permitting free backwards movement makes conversion rates non-monotonic and cohort analysis
unreliable; prohibiting it entirely produces records parked in the wrong stage because no legal
transition describes reality. This is a genuine trade-off requiring a business decision.

---

## 5. Unresolved Decisions

| Decision | Question | Blocks |
|---|---|---|
| `DEC-017` | Stage list, relationship to standard fields, permitted transitions, stall and recycling definitions | `BR-019`, `BR-020`, `BR-023` |
| `DEC-018` | **Are transitions persisted, by what mechanism, for how long?** | `BR-020`, `BR-022` — **irreversible** |
| `DEC-010` | Where do the MQL and qualification boundaries sit? | `BR-017`, `BR-021` |
| `DEC-016` | How is history retained for analysis? | `BR-022` |

### Additional open questions

| Question | Why it matters | Status |
|---|---|---|
| Do stages differ by segment? | Cycle length spans 21–210 days; a Strategic record's path differs materially from an SMB record's | **Open Question** |
| Is the stall threshold segment-specific? | A fixed threshold would flag every Strategic record as stalled and no SMB record ever | **Open Question** — likely material |
| Does lifecycle continue after Closed Won? | 44% of new ARR is expansion; a post-customer lifecycle may be needed to represent it | **Open Question** |
| Do Lead and Opportunity share one lifecycle or two linked ones? | Determines whether end-to-end cycle time is a single measure or a join | **Open Question** — part of `DEC-017` |

> **On the stall threshold.** With cycles spanning 21 to 210 days, a single global stall threshold is
> almost certainly wrong in both directions simultaneously. This is the same class of error as the
> single global SLA expectation across four time zones (`DEC-006`) — a uniform rule applied to
> non-uniform reality.

---

## 6. Precedence Questions

| Conflict | Question |
|---|---|
| Lead Status vs lifecycle stage | Which is authoritative when they disagree? (`BR-019`) |
| Automated vs manual transition | Does automation override a manual stage change? |
| Stalled vs active stage | Is Stalled a stage, or a flag on a stage? |
| Conversion vs stage progression | Does conversion force a stage, or does stage gate conversion? (`DEC-010`) |

**Row 3 is a modelling decision with real consequences.** If Stalled is a stage, the record's
substantive position is lost while stalled. If it is a flag, stage and stall are independent and both
are preserved — but every report must then account for two dimensions. The second is more correct and
more complex; the choice belongs to `DEC-017`.

---

## 7. Boundary Conditions

**Each is a required test scenario** (`BR-019`, `BR-020`).

| Condition | Design question |
|---|---|
| Transition to the same stage | No-op, or a recorded transition? |
| Rapid successive transitions | Are all recorded, or only the net change? |
| Transition during conversion | Recorded on Lead, Opportunity, or both? (`BR-021`) |
| Record created directly at a later stage | Are the skipped stages implied or absent from history? |
| Stall threshold reached during a legitimate pause | Interacts with the SLA pause question in `DEC-006` |
| Recycled record re-enters | Does history accumulate or reset? (`BR-023`) |
| Disqualified record shows new activity | Re-open, or create a new record? |
| Transition by an integration principal | Recorded as automated or as a user action? (`BR-020` criterion 3) |

---

## 8. Exception Conditions

| Exception | Trigger | Handling |
|---|---|---|
| Prohibited transition attempted | Transition outside the permitted set | Defined, consistent behaviour (`BR-019` criterion 3) |
| Stalled record | No progression for the defined period | Explicit state, surfaced (`BR-023`, `BR-044`) |
| Transition recording failure | History write fails | **Automation failure exception** (`BR-045`) — this failure is silent by nature and must be made observable |
| Stage inconsistent with related record | Lead stage contradicts Opportunity stage | Detection required; resolution requires `DEC-017` |

> **Row 3 deserves emphasis.** A failure to record history produces no visible symptom at the time —
> the record still moves, the user sees nothing wrong, and the loss is discovered only later when the
> analysis that needed it is attempted. By then the data is unrecoverable. This is why `BR-045`
> applies here with particular force.

---

## 9. Implementation Implications

> **Candidate components only. No metadata is designed or created.**

| Implication | Detail |
|---|---|
| Taxonomy representation | Depends on `DEC-017` approach A, B, or C |
| Transition capture | Field history tracking, a custom history object, or platform events — `DEC-018` |
| Transition validation | Permitted transitions enforced by governed configuration, not embedded logic (`BR-059`) |
| Stall evaluation | Scheduled evaluation against a governed threshold |
| Conversion continuity | Linkage preserved across the Lead-to-Opportunity boundary (`BR-021`) |
| **Developer Edition storage** | A real constraint on `DEC-018`. Field history and custom history records consume storage; **representative capture, not exhaustive capture**, is the appropriate portfolio implementation |

### Mechanism trade-offs for `DEC-018`

| Mechanism | Strengths | Limitations |
|---|---|---|
| Field History Tracking | Native; no custom objects; low maintenance | Limited field count; retention limits; awkward to report on; **cannot record a cause** |
| Custom history object | Full control; records cause and acting principal; reportable | Storage consumption; requires automation on every transition |
| Platform Events | Decoupled; suits high volume | Not persistent by default — **needs a store anyway**; more complex for `PER-13` |

**Finding.** Field History Tracking alone **cannot satisfy `BR-020`**, because `BR-020` requires the
*cause* of each transition and field history records only the value change. This is a concrete
constraint on `DEC-018` that can be stated now without pre-empting the decision.

---

## 10. Testing Implications

| Test class | Scenarios |
|---|---|
| Permitted transitions | One fixture per permitted transition |
| Prohibited transitions | One fixture per prohibited transition, asserting defined behaviour |
| History capture | Assert a durable record per transition, surviving a subsequent record edit |
| Duration | Known transition sequence; assert computed durations match hand calculations |
| Conversion continuity | Convert a record with prior history; assert traceability and elapsed time |
| Stall | Fixtures either side of the threshold |
| Recycling | Recycled record retains prior history |
| Failure | Force a history write failure; assert an observable exception (`BR-045`) |

**Test obligation.** Scenarios are known; **expected results require `DEC-017`.** The history-capture
and failure tests, however, are specifiable now — they assert that *something durable* is recorded
and that failure is visible, neither of which depends on the taxonomy.

---

## 11. The `DEC-018` Deferral Warning

> ⚠️ **Read before approving any Phase 1 implementation.**
>
> If implementation proceeds before `DEC-018` is resolved, every lifecycle transition occurring in
> the interim is **lost permanently**. It cannot be recovered by later configuration, integration, or
> analysis.
>
> The consequences are concrete and compound over time:
>
> - `BR-022` — stage duration is unanswerable for the affected period
> - `KPI` velocity measures have no data for that period
> - Cohort analysis has a permanent hole
> - **The project's own "before" baseline for lifecycle metrics would not exist**
>
> The last point is the sharpest: this project intends to demonstrate measured improvement. Losing
> the transition history for the implementation period would remove the ability to substantiate any
> lifecycle improvement claim at all — the exact evidence the portfolio exists to produce.

---

## 12. What This Document Does Not Do

- ❌ It does not propose a stage taxonomy.
- ❌ It does not define MQL, SAL, or SQL boundaries.
- ❌ It does not select a persistence mechanism.
- ❌ It does not define stall thresholds or recycling behaviour.
- ❌ It does not claim any lifecycle capability exists.
