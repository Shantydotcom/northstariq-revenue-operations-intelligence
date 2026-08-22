# Implementation Status Conventions

| Field | Value |
|---|---|
| **Document** | Implementation Status Conventions |
| **Phase** | 0A — Repository Foundation |
| **Status** | Approved (repository convention) |
| **Applies to** | Every capability, requirement, decision and claim in this repository |

---

## 1. Why This Document Exists

The fastest way to destroy the credibility of a portfolio repository is to describe **planned**
functionality in language that reads as **delivered** functionality.

A reviewer who discovers one overstated claim will reasonably discount every other claim in the
repository. Precision about implementation state is therefore not bureaucratic overhead — it is
the mechanism that makes the rest of the repository trustworthy.

This document defines the vocabulary. It is enforced in the quality review at every phase gate.

---

## 2. The Three States of Reality

Every artifact must clearly distinguish three separate things:

| State | Definition | Question it answers |
|---|---|---|
| **Current State** | The fictional NorthstarIQ environment as assessed | "What is wrong today?" |
| **Target State** | The architecture being proposed | "What should it look like?" |
| **Implemented State** | What actually exists and has been validated | "What did you actually build?" |

### Status as of Phase 0A

```
Current State     = Not yet documented   (Phase 0B)
Target State      = Not yet designed     (Phase 0D)
Implemented State = Repository foundation and Salesforce DX scaffold only
```

### The rule

> **Never describe proposed functionality as implemented functionality.**

Practically: if a sentence about a capability could be read as "this exists," and it does not
exist, the sentence is defective and must be rewritten or marked.

---

## 3. Status Values

Every documented capability carries **exactly one** status from this list.

| Status | Meaning | Requires |
|---|---|---|
| `Proposed` | Described in documentation; not agreed | Nothing beyond the document |
| `Open Decision` | Blocked pending a human decision | A `DEC-###` entry |
| `Approved` | Human-approved; ready to implement | Explicit human approval, recorded |
| `Not Started` | Approved, no implementation work begun | — |
| `In Progress` | Implementation underway | — |
| `Implemented` | Exists in the org and/or repository | **Artifacts** (see §5) |
| `Validated` | Implemented **and** proven by a passing test | **Evidence** (see §5) |
| `Withdrawn` | Deliberately abandoned | Retained reasoning; identifier retired |

### Progression

```
Proposed ──> Open Decision ──> Approved ──> Not Started ──> In Progress
                                                                 │
                                                                 v
                                                          Implemented
                                                                 │
                                                                 v
                                                           Validated

  (any state) ──> Withdrawn
```

`Proposed` may go directly to `Approved` when no material uncertainty exists. Nothing may skip
`Implemented` to reach `Validated`.

### Critical distinction

| | Means | Sufficient evidence |
|---|---|---|
| **`Implemented`** | The thing exists | Source-controlled metadata, a Flow file, a Custom Metadata record, a committed fixture |
| **`Validated`** | The thing demonstrably works | A test with a recorded `Actual Result` and `PASS`, plus stored evidence |

**An untested rule is `Implemented`, never `Validated`.**
**Documentation is never sufficient evidence for either.**

---

## 4. Visual Status Markers

For scannable status in README tables and document headers:

| Marker | Status values |
|---|---|
| ⬜ | `Proposed`, `Not Started` |
| 🟡 | `In Progress` |
| 🔵 | `Open Decision` (awaiting human decision) |
| ✅ | `Implemented`, `Validated` |
| ⚪ | `Withdrawn` |
| 🔒 | Section deliberately not yet written (names the phase that will write it) |

Markers are a convenience. The **word** is authoritative; where a marker and a word disagree, the
word governs and the marker is a defect.

---

## 5. Evidence Standard

> **Documentation alone does NOT prove implementation.**

### Acceptable evidence

| Evidence type | Proves |
|---|---|
| Source-controlled Salesforce metadata | The component exists as designed |
| Flow metadata (`.flow-meta.xml`) | The automation exists and its logic is reviewable |
| Custom Metadata records | Business rules are metadata-driven, not hard-coded |
| Deterministic test fixtures | Test inputs are reproducible |
| Test matrix with `Actual Result` populated | The rule was actually exercised |
| SOQL validation queries + results | Org state matches the design |
| Salesforce Flow tests | Automation behaves correctly |
| Screenshots | UI/configuration state at a point in time |
| D2 architecture diagrams | The design is coherent and communicated |
| Power BI model documentation / DAX | The semantic model exists and is governed |
| Demo scripts | The capability can be shown working end to end |
| Before/after synthetic metrics | Improvement — **only** where methodologically valid |

### Not acceptable as evidence

- A requirement document describing the capability
- An architecture diagram alone
- A statement that a rule "was configured"
- A test matrix with an empty or predicted `Actual Result`
- Any claim of performance at enterprise scale based on Developer Edition

---

## 6. Data Provenance Labels

Separate from implementation status, **every number** carries a provenance label.

| Label | Meaning | Example |
|---|---|---|
| `Known Context` | Given in the project brief | ~$42M ARR, ~650 customers |
| `Synthetic Planning Assumption` | Invented to make the fictional model coherent | ACV bands, sales-cycle ranges |
| `Synthetic Baseline` | Invented "current state" metric for the fictional company | 18% duplicate Lead rate |
| `Assumption` | Believed true; unverified | "Marketing owns Lead Source values" |
| `Finding` | Established through analysis in this project | "Segment and territory rules conflict at 500 employees" |
| `Open Question` | Unresolved | "Which system owns Strategic designation?" |
| `Actual Measured Result` | Produced by a real run in this repository | `TEST-014` routed 12/12 correctly |

### Rules

1. **There are no `Actual Measured Result` values during Phase 0.** Any that appear are a
   Critical quality-review finding.
2. Never imply a `Synthetic Baseline` came from a real organization. The fictional framing must be
   unmissable.
3. **Always validate arithmetic.** Inconsistent ARR / customer count / ACV math is a Critical
   finding. Synthetic does not mean incoherent.
4. Do not invent impressive numbers. Where a numeric baseline would be pure fabrication with no
   analytical basis, state the **baseline problem qualitatively** instead of inventing a figure.

### Baseline vs Target vs Result

These three are never conflated:

| | Meaning |
|---|---|
| **Synthetic Baseline** | Where the fictional company starts |
| **Proposed Target** | Where the design intends to get to |
| **Actual Measured Result** | What a real test in this repository produced |

---

## 7. Required Document Header

Every substantive document opens with a status block:

```markdown
| Field | Value |
|---|---|
| **Document** | <title> |
| **Phase** | <phase that produced it> |
| **Status** | <status value from §3> |
| **Implementation State** | <Current State / Target State / Implemented State> |
| **Related** | BR-###, DEC-###, ADR-#### |
```

`Implementation State` may be omitted for pure convention/governance documents (like this one)
that describe process rather than system capability.

---

## 8. Language Patterns

### Use

| Pattern | For |
|---|---|
| "The design proposes…" | Target State |
| "This is expected to…" | Target State |
| "Assessment indicates…" | Current State finding |
| "This has been implemented as…" | Implemented State only |
| "`TEST-###` confirms…" | Validated only |
| "This remains an Open Decision (`DEC-###`)" | Unresolved |

### Avoid

| Pattern | Why |
|---|---|
| "The system routes Leads by territory" | Present tense implies it exists |
| "We improved speed-to-lead by 40%" | Claims measurement that has not occurred |
| "Robust, enterprise-grade, best-in-class" | Unfalsifiable marketing language |
| "This proves scalability" | Developer Edition proves no such thing |
| "Stakeholders approved…" | There are no stakeholders; fabricated approval |

---

## 9. Enterprise Design vs Portfolio Implementation

A third axis, orthogonal to status. Design decisions are documented against both columns:

| Enterprise Design | Portfolio Implementation |
|---|---|
| Appropriate for a real ~$42M ARR B2B SaaS company | Responsibly demonstrable in Developer Edition |

Operating phrase:

> **Design for enterprise scale. Implement representative scenarios.**

Where a design requires an edition feature Developer Edition lacks, **document the gap**. Do not
silently substitute a lesser design and present it as the intended architecture.

Never claim the Developer Edition implementation proves enterprise-scale performance.
