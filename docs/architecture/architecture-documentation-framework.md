# Architecture Documentation Framework

| Field | Value |
|---|---|
| **Document** | Architecture Documentation Framework |
| **Phase** | 0A — Repository Foundation |
| **Status** | Approved (repository convention) |
| **Applies to** | All architecture artifacts in `docs/architecture/` and `docs/ADR/` |

This document defines **how** architecture is documented in this repository. It does not contain
any architecture — the Current State is documented in Phase 0B and the Target State is designed in
Phase 0D.

---

## 1. Principles

1. **Architecture documentation exists to be read by other people**, primarily an administrator
   who must maintain the system and a reviewer who must evaluate the thinking. Optimize for both.
2. **Diagrams show structure and flow; prose carries reasoning.** A diagram alone never explains
   *why*.
3. **Every architecture artifact declares its state** — Current, Target, or Implemented.
4. **Decisions are separated from designs.** A design says what the system looks like; an ADR says
   why an alternative was rejected. Both are needed; conflating them loses the reasoning.
5. **Only create a diagram that materially improves understanding.** Diagram count is not a
   quality signal. Do not create diagrams to increase artifact count.
6. **Architecture and documentation change together**, in the same change. Documentation that
   trails the architecture is worse than no documentation, because it is confidently wrong.

---

## 2. Artifact Types

| Artifact | Location | Purpose | Created in |
|---|---|---|---|
| Architecture principles | `docs/architecture/` | The rules design decisions must satisfy | 0D |
| Current-state architecture | `docs/architecture/` | How the fictional environment works today | 0D |
| Target-state architecture | `docs/architecture/` | The proposed governed architecture | 0D |
| D2 diagrams | `docs/architecture/*.d2` | Visual structure and flow | 0D |
| ADRs | `docs/ADR/ADR-####-*.md` | A significant decision and its rejected alternatives | 0D+ |
| Data dictionary | `docs/data-dictionary/` | Field-level design | 0C |
| Security architecture | `docs/security/` | Access model and boundaries | 0C |
| Analytics architecture | `docs/analytics/` | Semantic model and Power BI design | 0D |

---

## 3. Layer Model

Architecture is documented in layers. Each layer answers a different question, and mixing them in
one artifact is the most common way architecture documentation becomes unreadable.

| Layer | Question | Typical artifact |
|---|---|---|
| **Business** | What business outcome is required? | Requirements, personas, process flows |
| **Process** | What is the sequence of operations? | Lead-to-Revenue Lifecycle diagram |
| **Data** | What is stored, where, and who owns it? | Data dictionary, identity architecture |
| **Application** | Which Salesforce components deliver this? | Salesforce architecture, component maps |
| **Automation** | What executes, when, and in what order? | Flow design, routing architecture |
| **Security** | Who can see and do what? | Security architecture, access model |
| **Analytics** | How is this measured? | Revenue Intelligence Model, KPI governance |
| **Operations** | What happens when it fails? | Exception framework, runbooks, observability |

**Security and Operations are cross-cutting.** They must appear *within* the architecture, not as
appendices. A target-state diagram that omits exception paths and access boundaries is incomplete.

---

## 4. Mandatory Content in Any Architecture Artifact

Every architecture document must make these explicit:

| Element | Why |
|---|---|
| **State declaration** | Current / Target / Implemented — see the status conventions |
| **Salesforce responsibilities** | What Sales Cloud owns as system of record |
| **Power BI responsibilities** | What the analytics layer owns — and that it owns no transactional state |
| **Exception paths** | What happens when the happy path fails |
| **Auditability** | How a RevOps user answers "why did this happen?" |
| **Observability** | What operational signals are emitted |
| **Human review points** | Where a person must intervene |
| **Security boundaries** | Where access is constrained |
| **Open Decisions** | Unresolved items, referenced by `DEC-###` |
| **Developer Edition impact** | Enterprise Design vs Portfolio Implementation |

An architecture that shows only the happy path is not an architecture. **Design failure paths
intentionally** is an explicit project principle.

---

## 5. D2 Diagram Standards

D2 is the diagramming tool (`d2 0.7.1` verified locally). Source `.d2` files are committed —
they are the reviewable artifact. Rendered PNG/PDF output is git-ignored.

### Planned diagrams (Phase 0D)

| File | Shows |
|---|---|
| `revenue-operations-intelligence-architecture.d2` | End-to-end target architecture |
| `lead-to-revenue-lifecycle.d2` | The business process and lifecycle stages |
| `data-and-identity-architecture.d2` | Data quality, matching, identity resolution |
| `revenue-routing-architecture.d2` | Segmentation → territory → eligibility → assignment |
| `salesforce-security-architecture.d2` | OWD, roles, permission sets, sharing, queues |
| `analytics-architecture.d2` | Revenue Intelligence Model and Power BI layer |

Each is created **only if it materially improves understanding.** If two diagrams would say the
same thing, one is deleted.

### Conventions

| Element | Convention |
|---|---|
| Direction | `direction: down` for process flows; `right` for layered architecture |
| Node labels | Canonical subsystem names exactly as in the naming conventions |
| Happy path | Solid arrows |
| Exception path | Dashed arrows, distinct style |
| Human review point | Explicitly marked shape |
| Security boundary | Container/grouping, not a floating annotation |
| System of record | Visually distinct from analytics layer |
| Deferred technology | **Absent.** Data Cloud and Agentforce do not appear in any diagram. |

### Validation

Diagrams must compile before commit:

```powershell
d2 fmt  docs/architecture/<name>.d2      # canonical formatting
d2      docs/architecture/<name>.d2 --dry-run   # parse/validate without writing output
```

A diagram that does not compile is not committed.

---

## 6. ADR Standard

An ADR records a **significant** decision — one that is hard to reverse, constrains later work, or
where a reasonable engineer would have chosen differently.

### When to write one

| Write an ADR | Do not write an ADR |
|---|---|
| Flow vs Apex for a capability | Naming a single field |
| Metadata-driven vs hard-coded rules | Routine configuration choices |
| Permission sets vs profiles | Anything already covered by an accepted ADR |
| Matching strategy and confidence model | Decisions with no rejected alternative |
| Event/history persistence approach | |
| Power BI data-access architecture | |

> **Do not create unnecessary ADRs.** A repository of trivial ADRs signals inability to judge
> significance. Fewer, substantive ADRs are stronger evidence.

### Required sections

```markdown
# ADR-####: <Title>

| Field | Value |
|---|---|
| **Status** | Proposed / Accepted / Superseded by ADR-#### / Withdrawn |
| **Date** | YYYY-MM-DD |
| **Deciders** | <human reviewer> |
| **Related Requirements** | BR-### |
| **Related Decisions** | DEC-### |

## Context
The forces at play: the business problem, constraints (including Developer Edition),
and what makes this decision necessary now.

## Decision
The decision, stated in active voice as a commitment.

## Alternatives Considered
Each alternative, with why it was rejected. An ADR with no rejected alternative
is not documenting a decision.

## Benefits
## Tradeoffs
What is genuinely given up. An ADR listing only benefits is not honest.

## Consequences
What becomes easier, harder, or newly required as a result.

## Related Requirements
## Related Decisions
```

### Status rules

- `Proposed` — drafted, not agreed.
- `Accepted` — **requires explicit human approval.** Never set by the assistant unilaterally.
- `Superseded by ADR-####` — the original ADR is **never deleted or edited away**. Decision
  history is preserved as a project principle.
- `Withdrawn` — abandoned before acceptance; identifier retired.

---

## 7. Traceability

Architecture is not free-standing. Every significant component traces both directions:

```
Business Problem → Requirement (BR-###) → Decision (DEC-###) → ADR (if significant)
→ Salesforce / Data Component → Security Consideration → Automation
→ Report / Analytics → Test (TEST-###) → Evidence → Implementation Status
```

Rules:

1. **Backward traceability is mandatory.** Every component names the `BR-###` it serves. A
   component that cannot name one is unjustified and should not be built.
2. **Forward traceability is mandatory.** Every requirement names its future implementation
   component and its test requirement — even when both are `TBD` during Phase 0.
3. The traceability matrix (`docs/requirements/traceability-matrix.md`, Phase 0C) is the index.
   Broken traceability is a High quality-review finding.

During Phase 0, implementation status in the matrix may only be `Proposed`, `TBD`, or
`Not Started`.

---

## 8. Review Checklist

Applied to every architecture artifact before a phase gate closes:

- [ ] State declared (Current / Target / Implemented) and used consistently
- [ ] Canonical subsystem names used exactly
- [ ] Salesforce vs Power BI responsibilities explicit; no analytics write-back implied
- [ ] Exception paths shown, not just the happy path
- [ ] Auditability represented — "why did this happen?" is answerable
- [ ] Observability represented
- [ ] Security boundaries represented within the architecture, not appended
- [ ] Human review points identified
- [ ] Open Decisions referenced by `DEC-###`, not silently resolved
- [ ] Developer Edition constraints addressed; gaps documented, not hidden
- [ ] Enterprise Design separated from Portfolio Implementation
- [ ] Every component traces to a `BR-###`
- [ ] No Data Cloud or Agentforce content anywhere
- [ ] No unnecessary Apex proposed
- [ ] D2 sources compile
- [ ] No claim of implemented or measured capability that does not exist
