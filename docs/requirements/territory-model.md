# Territory Model

| Field | Value |
|---|---|
| **Document** | Territory Model |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Open Decision — candidate model only |
| **Implementation State** | Target State |
| **Related** | `BR-028`, `BR-029`, `BR-030` · `DEC-022`, `DEC-003` · [`segmentation-model.md`](segmentation-model.md) · [`open-decisions.md`](open-decisions.md) |

---

> ⚠️ **No territory boundary in this document is approved.** The current-state structure is
> documented as Known Context; every proposed resolution of its inconsistencies requires `DEC-022`.

---

## 1. Business Purpose

Territory answers **"which territory applies, and why?"** — step 6 of the Revenue Operations
Intelligence Model. It determines which seller has coverage claim over a record on a geographic
basis, and it is one of three competing assignment bases that must be resolved in a defined
precedence (`DEC-003`).

---

## 2. Current-State Structure

**Known Context** — the structure below is given, not assumed.

```
VP Sales
├── Strategic      Named accounts — NO geographic territory
├── Enterprise     East · Central · West        (3 regions, 8 AEs)
├── Mid-Market     East · West                  (2 regions, 9 AEs)
└── SMB            Global round robin           (no territory, 11 AEs)
```

### Geographic coverage as understood

**Synthetic Planning Assumption** — regional allocation of AEs.

| Team | Region | AEs | Markets covered |
|---|---|---:|---|
| Enterprise | East | 3 | US East, Canada East, UK |
| Enterprise | Central | 2 | US Central, **Germany** |
| Enterprise | West | 3 | US West, Canada West |
| Mid-Market | East | 5 | US East, Canada East, UK, **Germany** |
| Mid-Market | West | 4 | US West, Canada Central & West |
| SMB | Global round robin | 11 | All markets |

---

## 3. Current-State Problem

From `PROB-009` — a **Structural Finding**, derived from the org structure itself rather than
assumed.

### 3.1 The asymmetry

Enterprise operates **three** regions; Mid-Market operates **two**. The boundaries therefore
**cannot be identical**. This is arithmetic, not a configuration defect.

### 3.2 The concrete manifestation

> **Germany resolves to Enterprise "Central" but Mid-Market "East."**

The same organization resolves to a different region depending on which segment it lands in — and
segment derives from a field missing 44% of the time. **Territory therefore inherits the instability
of segmentation.**

### 3.3 How it originated

Each market was added as an **exception to an existing structure** rather than triggering a redesign:

| Growth phase | Action | Consequence |
|---|---|---|
| Years 1–7, US only | Regions shaped around US geography | Reasonable at the time |
| Years 8–9, UK and Germany entered | International markets attached to US-shaped regions | Four accumulated exception patterns, none documented |
| Years 10–11, segments formalized | Enterprise gained a third region; Mid-Market did not | Asymmetry created without being reconciled |

**Finding.** The asymmetry is **not necessarily a defect** — different segments may legitimately
warrant different coverage shapes, since Enterprise deals justify narrower territories than
Mid-Market volume does. The defect is that the asymmetry is **undocumented and produces inconsistent
results without anyone intending it**.

### 3.4 The measurement consequence

**Territory performance cannot be compared period-over-period if boundaries changed without
versioning** — and NorthstarIQ has changed them repeatedly across four growth phases. A comparison
across a boundary change produces a conclusion about seller performance that is actually an artefact
of the boundary move, with nothing in the data revealing the substitution.

---

## 4. Known Requirements

| Requirement | Source |
|---|---|
| Territory resolves to exactly one territory, including at boundaries | `BR-028` |
| Definitions are versioned configuration with effective dates | `BR-029` |
| The resolution basis is recorded | `BR-028` |
| Territory does not silently guess when segment is unresolved | `BR-028` |
| Territory participates in a defined ownership precedence | `BR-030` |

---

## 5. Candidate Models

> **Three candidate approaches for review. None is recommended as a business decision — each has a
> genuine cost, and the choice is `DEC-022`.**

### Option A — Formalize the asymmetry

Keep segment-specific territory maps. Document that Enterprise and Mid-Market have different regional
boundaries by design, and make the mapping explicit and versioned.

| Aspect | Assessment |
|---|---|
| **Preserves** | Current coverage allocations; no seller disruption |
| **Requires** | Segment resolved before territory — reinforcing the dependency on `DEC-001`/`DEC-002` |
| **Cost** | Germany continues to resolve differently by segment; two maps to maintain |
| **Honest framing** | Makes an existing reality explicit rather than pretending to a uniformity that does not exist |

### Option B — Unify the map

One geographic map for all segments; coverage differences expressed through seller allocation rather
than through different boundaries.

| Aspect | Assessment |
|---|---|
| **Preserves** | Nothing structurally — this is a redesign |
| **Requires** | Reallocating Enterprise or Mid-Market coverage; likely seller disruption |
| **Cost** | Real organizational change, not a configuration change |
| **Benefit** | Territory becomes independent of segment, breaking the instability inheritance |

### Option C — Elevate international markets to territories

Treat UK, Germany, and Canada as territories in their own right rather than as exceptions attached
to US-shaped regions.

| Aspect | Assessment |
|---|---|
| **Addresses** | The root cause identified in `PROB-009` — the exception pattern itself |
| **Requires** | Coverage decisions for markets currently absorbed into US regions |
| **Cost** | Germany is 9.2% of customers and 10% of ARR — possibly insufficient to justify dedicated coverage |
| **Consideration** | UK at 16.2% of customers is a stronger candidate than Germany |

### What is common to all three

Whichever option is chosen, these hold and can be stated now:

1. Resolution must be **deterministic** — exactly one territory per record.
2. Definitions must be **versioned with effective dates** (`BR-029`).
3. The **resolution basis must be recorded** (`BR-028`).
4. Boundary and unsupported-geography cases must be **explicit**, not incidental.

---

## 6. Unresolved Decisions

| Decision | Question | Blocks |
|---|---|---|
| `DEC-022` | Which model, and what are the boundaries? | `BR-028`, `BR-029` |
| `DEC-003` | How does territory rank against named-account and customer-relationship claims? | `BR-030` |
| `DEC-001`, `DEC-002` | Segment must resolve before territory can, under Option A | `BR-028` |

### Additional open questions

| Question | Why it matters | Status |
|---|---|---|
| Is SMB round robin genuinely global? | UK and German records carry language and time-zone implications; **informal carve-outs may already exist** | **Open Question** from Phase 0B |
| Does territory follow the record's country or the Account's? | A subsidiary in one country under a parent in another resolves differently by each rule | **Open Question** |
| What happens to unsupported geography? | Markets outside US/Canada/UK/Germany have no defined coverage | **Open Question** |
| Are territories re-evaluated when country data changes? | Country is missing on 17% of Leads and may be added later | **Open Question** |

> **On SMB round robin.** If informal carve-outs already exist, encoding a pure global rotation
> would formalize a rule the business does **not actually follow** — replacing an undocumented
> practice with a documented wrong one. This must be validated before `DEC-013` is decided.

---

## 7. Precedence Questions

Territory is one of three assignment bases. The precedence between them is `DEC-003` and is
**explicitly a business policy gap, not an implementation gap** (`PROB-005`).

| Competing claims | Question |
|---|---|
| Territory vs Strategic named account | Does a named-account owner always win? |
| Territory vs existing-customer relationship owner | Does an existing relationship outrank geography? |
| Territory vs SMB round robin | SMB has no territory — does a territory claim pull a record out of round robin? |
| Territory owner ineligible | Fall to a peer in the same territory, or to the next precedence basis? (`DEC-007`) |

**What can be stated without the decision:** the precedence must be **explicit, ordered, and recorded
on each routed record** (`BR-030`, `BR-032`). A precedence order that exists only as automation
behaviour reproduces `PROB-003` in a new form — the outcome would be correct but still undiagnosable.

---

## 8. Boundary Conditions

**Each is a required test scenario** (`BR-028`).

| Condition | Design question |
|---|---|
| **Germany, Enterprise segment** | Central under the current structure |
| **Germany, Mid-Market segment** | East under the current structure — **the documented inconsistency** |
| Germany, segment unresolved | Cannot resolve — must not guess (`BR-028` criterion 3) |
| UK, any segment | East under the current structure |
| Canada East vs Canada West | Where does the internal Canadian boundary fall? Undocumented |
| US Central, Mid-Market | Mid-Market has no Central region — East or West? |
| Country missing | Cannot resolve — exception (`BR-006`, `BR-044`) |
| Country outside the four markets | Unsupported geography — behaviour undefined |
| Account and Lead countries differ | Which governs? |
| Country corrected after assignment | Re-evaluate, or leave assigned? |

**Finding.** Row 6 is a genuine gap in the current structure that this modelling exercise surfaced:
Enterprise has a Central region and Mid-Market does not, so a US Central record segmenting as
Mid-Market has **no documented region at all**. It is recorded as an Open Question rather than
resolved.

---

## 9. Exception Conditions

| Exception | Trigger | Handling |
|---|---|---|
| Territory unresolvable | Country missing or segment unresolved | Exception, surfaced (`BR-044`) |
| Unsupported geography | Country outside the four markets | Exception — behaviour requires `DEC-022` |
| Ambiguous boundary | Multiple territories could claim the record | **Must not occur** — `BR-028` requires exactly one |
| No eligible seller in territory | All territory sellers ineligible | `DEC-007` |

---

## 10. Implementation Implications

> **Candidate components only. No metadata is designed or created.**

| Implication | Detail |
|---|---|
| Definitions as configuration | Custom Metadata Type with effective dating (`BR-029`, `BR-059`) |
| Resolution | Record-triggered Flow reading configuration (`BR-037`) |
| Basis capture | Territory basis recorded at the point of decision (`BR-028`) |
| Segment dependency | Under Option A, segment must resolve first — a hard sequencing constraint |
| Salesforce Enterprise Territory Management | **Not assumed.** Whether the platform feature or a configuration-driven approach is used is a Phase 0D decision, and Developer Edition availability must be verified as a dependency, not assumed |

> **Deliberate non-decision.** Naming Enterprise Territory Management here would prescribe an
> implementation before the business model is decided — and its complexity is significant for a
> single administrator to maintain (`PROB-018`). The trade-off belongs in Phase 0D with an ADR.

---

## 11. Testing Implications

| Test class | Scenarios |
|---|---|
| Market coverage | One record per market per segment |
| **The known inconsistency** | Germany as Enterprise and as Mid-Market — asserting documented behaviour |
| Boundary | Canada East/West; US Central as Mid-Market |
| Incomplete | Missing country; unresolved segment |
| Unsupported | Country outside the four markets |
| Determinism | Repeated resolution yields an identical result |
| Basis | Every resolution path asserts a correct recorded basis |
| Versioning | Change a definition; assert historical assignments remain attributable to the prior version |

**Test obligation.** Scenarios are known now; **expected results are not**, and cannot be written
until `DEC-022` is approved. Writing them against an invented boundary would produce a test suite
that passes against a rule nobody agreed.

---

## 12. What This Document Does Not Do

- ❌ It does not propose territory boundaries.
- ❌ It does not resolve the Enterprise/Mid-Market asymmetry.
- ❌ It does not decide ownership precedence.
- ❌ It does not select a Salesforce implementation approach.
- ❌ It does not claim any territory capability exists.
