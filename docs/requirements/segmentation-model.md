# Segmentation Model

| Field | Value |
|---|---|
| **Document** | Segmentation Model |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Open Decision — candidate model only |
| **Implementation State** | Target State |
| **Related** | `BR-024`–`BR-027` · `DEC-001`, `DEC-002`, `DEC-005` · [`territory-model.md`](territory-model.md) · [`open-decisions.md`](open-decisions.md) |

---

> ⚠️ **No segmentation threshold in this document is approved.** Candidate structures are presented
> to make the decision tractable. Every numeric boundary is marked as requiring `DEC-001` or
> `DEC-002`. **Nothing here may be implemented as a business rule.**

---

## 1. Business Purpose

Segment answers **"which segment applies, and why?"** — step 5 of the Revenue Operations
Intelligence Model. It is not a reporting label. Segment determines:

| Determines | Consequence |
|---|---|
| Owning team | Strategic, Enterprise, Mid-Market, or SMB |
| Sales motion | Named-account executive-led through to high-velocity round robin |
| Expected cycle length | 21 to 210 days depending on segment |
| Quota expectation | $340k/AE (SMB) to $2.0M/AE (Strategic) |
| **Which territory map applies** | Enterprise uses three regions; Mid-Market uses two |

**Finding.** The last row is the one most often missed. Segmentation is not parallel to territory —
it is **upstream of it**. An unstable segment produces an unstable territory, which produces an
unstable owner.

---

## 2. Current-State Problem

From [`../discovery/business-problems.md`](../discovery/business-problems.md) `PROB-004`:

| Symptom | Evidence status |
|---|---|
| Thresholds are not clearly defined | Assumed |
| Firmographic signals conflict | Assumed |
| Records lacking inputs cannot be segmented deterministically | **Synthetic Baseline** — 44% missing employee count |
| Manual overrides carry no recorded reason | Assumed |

### Why it originated

Segment was introduced as **a picklist for reporting** during the growth phase that took NorthstarIQ
from $15M to $28M ARR. It solved the reporting need it was created for. It then **became a routing
input without being redesigned for that purpose**.

**Finding.** This is the clearest single example of the project's central thesis. Segmentation is not
broken because someone configured it badly. It is broken because a field designed for one purpose
silently acquired a second, load-bearing purpose, and nobody consolidated the design.

### Where the exposure concentrates

| Segment | New ARR share | New logo share | Exposure |
|---|---:|---:|---|
| Mid-Market | **50.4%** | 37% | **Highest** — boundaries touch both SMB round robin and Enterprise territory |
| Enterprise | — | — | Boundary with Mid-Market and Strategic |
| SMB | — | — | Receives misclassified Mid-Market records into a velocity motion |
| Strategic | — | — | Explicit designation, outside firmographic derivation |

**Finding.** Mid-Market carries the greatest consequence from segmentation error: it produces half of
new ARR from just over a third of new logos, meaning its deals are individually more valuable than
SMB deals. A Mid-Market record misrouted to SMB round robin receives a high-velocity motion sized for
a materially smaller deal — and neither the seller nor the manager can currently tell it happened.

---

## 3. Known Requirements

These hold regardless of which thresholds are approved.

| Requirement | Source |
|---|---|
| Segment derives from documented, governed rules producing identical results for identical inputs | `BR-024` |
| Thresholds are versioned configuration changeable without deployment | `BR-025` |
| Records that cannot be segmented are surfaced, never defaulted | `BR-026` |
| Derivation basis and overrides are recorded | `BR-027` |
| Segment resolution must not fail on incomplete data | `BR-006` |

---

## 4. Candidate Model

> **Candidate structure for review. Values are placeholders requiring `DEC-001`.**

### 4.1 Segment structure

Four segments are **Known Context** and are not in question. What is open is how a record is placed
into one.

| Segment | Assignment basis | Coverage | Open? |
|---|---|---|---|
| Strategic | **Explicit designation** — not firmographic | 11 customers, 2 AEs | Designation source is `DEC-005` |
| Enterprise | Firmographic, above the Enterprise threshold | 74 customers, 8 AEs | Threshold is `DEC-001` |
| Mid-Market | Firmographic, between SMB and Enterprise thresholds | 240 customers, 9 AEs | Both boundaries are `DEC-001` |
| SMB | Firmographic, below the Mid-Market threshold | 325 customers, 11 AEs | Threshold is `DEC-001` |

### 4.2 Candidate signal precedence

> **Requires `DEC-002`. Presented as a structure to decide, not a decision.**

```
1. Strategic designation present?        ──> Strategic          (DEC-005)
2. Employee count available?             ──> derive from bands  (DEC-001)
3. Employee count absent, revenue known? ──> fallback?          (DEC-002 — permitted or not)
4. Neither available?                    ──> UNSEGMENTABLE      (BR-026)
```

**The decision has two separable parts, and conflating them is a design error:**

| Part | Nature | Status |
|---|---|---|
| Which signal is authoritative when both are present and disagree | Commercial judgement | **`DEC-002` — genuinely open** |
| What happens when the authoritative signal is absent | Design question | **A defensible answer exists now** — see below |

On the second part, the Phase 0B finding is decisive: at 48% incomplete, **the incomplete-data path
is the main path, not an edge case**. Step 4 above is therefore not an edge case in the design; it is
a primary path that must be built deliberately.

### 4.3 Candidate band structure

> ⚠️ **The values below are illustrative placeholders showing the *shape* of a band structure.
> They are NOT proposed thresholds and must not be read as recommendations.** `DEC-001` supplies the
> real values.

| Band | Employee count | Segment |
|---|---|---|
| A | Below threshold 1 | SMB |
| B | Threshold 1 to threshold 2 | Mid-Market |
| C | Above threshold 2 | Enterprise |
| — | Any, with Strategic designation | Strategic (overrides A–C) |

**What can be stated now without the values:**

1. Bands must be **contiguous and non-overlapping** — every value maps to exactly one band.
2. Boundary behaviour must be explicit: a record exactly at a threshold resolves deterministically,
   and which side it falls on is stated rather than left to implementation.
3. Bands must be **versioned with effective dates** (`BR-025`), so a threshold change does not
   retroactively rewrite the meaning of historical assignments.

---

## 5. Unresolved Decisions

| Decision | Question | Blocks |
|---|---|---|
| `DEC-001` | Where do the SMB/Mid-Market and Mid-Market/Enterprise boundaries sit? | `BR-024`, `BR-025` |
| `DEC-002` | Which signal is authoritative, and is a fallback permitted? | `BR-024`, `BR-026` |
| `DEC-005` | What makes an Account Strategic, and who may designate it? | `BR-027` |

### Additional open questions surfaced by this model

| Question | Why it matters | Status |
|---|---|---|
| Do thresholds differ by market? | A 500-employee organization is a different commercial proposition in Germany than in the US | **Open Question** — part of `DEC-001` |
| Is segment re-evaluated when firmographics change? | A record segmented on incomplete data may become segmentable later; leaving it stale silently preserves the original error | **Open Question** |
| Does segment change move ownership? | Re-segmentation that reassigns in-flight records creates ownership churn; one that does not creates mis-covered accounts | **Open Question** |
| Do Account and Lead segment independently? | An Account may be Enterprise while an inbound Lead from a subsidiary looks Mid-Market | **Open Question** — interacts with `DEC-004` |

**None of these is resolved here.** Each is surfaced because the model cannot be implemented without
an answer, and inventing one would encode an unmade decision.

---

## 6. Precedence Questions

| Conflict | Question | Decision |
|---|---|---|
| Strategic vs firmographic | Does Strategic designation always win? | `DEC-005` |
| Employee vs revenue | Which is authoritative? | `DEC-002` |
| Derived vs manual override | Does an override persist through re-derivation? | **Open Question** — see below |
| Account vs Lead segment | Which governs routing when they differ? | **Open Question** |

**The override persistence question is not a detail.** If re-derivation overwrites a human override,
the override is worthless and users will stop trusting the field. If an override permanently freezes
the segment, a record corrected once stays wrong forever when circumstances genuinely change. Both
failure modes are real, and the choice between them is a business decision.

---

## 7. Boundary Conditions

Conditions the design must handle explicitly. **Each is a required test scenario** (`BR-024`).

| Condition | Design question |
|---|---|
| Employee count exactly at a threshold | Which side does it fall on? Must be stated, not incidental |
| Employee count present but implausible (0, negative, 10,000,000) | Rejected as invalid, or segmented literally? |
| Employee count and revenue indicate different segments | `DEC-002` |
| Employee count absent, revenue present | Fallback permitted? `DEC-002` |
| Both absent | `UNSEGMENTABLE` — `BR-026` |
| Strategic designation on a firmographically-SMB Account | `DEC-005` |
| Firmographics change, moving the record across a boundary | Re-derive? Move ownership? **Open Question** |
| Subsidiary of an Enterprise parent, itself SMB-sized | Interacts with `DEC-004` |

---

## 8. Exception Conditions

| Exception | Trigger | Handling |
|---|---|---|
| Unsegmentable record | Required inputs absent | Explicit state, surfaced as an exception (`BR-026`, `BR-044`) |
| Implausible firmographic value | Value outside a plausible range | Data quality exception (`BR-001`) |
| Conflicting signals under an undecided precedence | Signals disagree, `DEC-002` unresolved | **Cannot be handled until `DEC-002` is decided** |
| Override without a reason | Manual change with no reason captured | Prevented by `BR-027` |

**Note on row 3.** Until `DEC-002` is resolved, conflicting-signal records have no correct handling.
This is the honest state — not a gap to be filled with a default.

---

## 9. Implementation Implications

> **Candidate components only. No metadata is designed or created.**

| Implication | Detail |
|---|---|
| Thresholds as configuration | Custom Metadata Type with effective dating (`BR-025`, `BR-059`) |
| Derivation | Record-triggered Flow reading configuration rather than embedding values (`BR-037`) |
| Basis capture | Derivation basis recorded at the point of decision (`BR-027`) |
| Unsegmentable state | An explicit value distinct from any segment — **not a blank field** |
| Override capture | Override reason required; overridden values distinguishable from derived |
| Re-derivation | Trigger conditions must be explicit, given the ownership-churn consequence |

**Developer Edition note.** The design is fully demonstrable in Developer Edition. Boundary
scenarios need only a handful of records — one either side of each threshold plus the exception
cases. **Volume proves nothing here; coverage does.**

---

## 10. Testing Implications

| Test class | Scenarios |
|---|---|
| Boundary | One record either side of every threshold, plus one exactly at each |
| Conflict | Employee and revenue indicating different segments |
| Incomplete | Missing employee count; missing both signals; present-but-implausible |
| Strategic | Designated Account across each firmographic band |
| Override | Override applied, then re-derivation triggered |
| Basis | Every derivation path asserts a correct recorded basis |
| Determinism | The same input segmented repeatedly yields an identical result |

**Test obligation.** No segmentation test may be written with an expected result until `DEC-001` and
`DEC-002` are approved. The **scenarios** are known now; the **expected results** are not. Writing
expected results against invented thresholds would produce tests that pass against a rule nobody
agreed — the most persuasive possible form of the failure this project exists to avoid.

---

## 11. What This Document Does Not Do

- ❌ It does not propose threshold values.
- ❌ It does not resolve signal precedence.
- ❌ It does not define Strategic designation criteria.
- ❌ It does not create or design Salesforce metadata.
- ❌ It does not claim any segmentation capability exists.
