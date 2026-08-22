# Dependencies Register — NorthstarIQ Revenue Operations Intelligence Platform

| Field | Value |
|---|---|
| **Document** | Dependencies Register |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Target State (project dependency) |
| **Related** | [`assumptions.md`](assumptions.md) · [`risks.md`](risks.md) · [`technology-landscape.md`](technology-landscape.md) |

---

## Purpose and Classification

A dependency is something the project **needs from outside itself** in order to proceed. Recording
dependencies makes blockers visible before they block.

### The critical distinction

| | **Business Dependency** | **Tooling Dependency** |
|---|---|---|
| **Nature** | A decision, definition, or approval that only a human can supply | A capability, access, or software the work runs on |
| **Resolved by** | Human judgement | Installation, provisioning, or authentication |
| **If unresolved** | Work proceeds but encodes an unmade decision — **silently wrong** | Work **cannot proceed** — visibly blocked |
| **Danger** | **High** — failure is invisible | Low — failure is obvious |

> **Business dependencies are the dangerous ones.** A missing tool stops work immediately and
> loudly. A missing decision does not stop work at all — it gets resolved by implementation
> convenience, and nobody notices until the rule is already in production. This is `RISK-003`.

### Status values

| Status | Meaning |
|---|---|
| ✅ **Satisfied** | Available and verified |
| 🟡 **Pending** | Not yet required; expected to be satisfiable |
| 🔴 **Blocking** | Required before the named work can correctly proceed |
| ⬜ **Not yet required** | Becomes relevant in a later phase |

---

## Register Summary

| Type | Count | Satisfied | Pending | Blocking |
|---|---:|---:|---:|---:|
| Business | 12 | 0 | 0 | 12 |
| Tooling | 11 | 8 | 3 | 0 |
| **Total** | **23** | **8** | **3** | **12** |

**All 12 business dependencies are human decisions.** None can be resolved by the assistant, and
none blocks Phase 0B or 0C documentation — but every one blocks the *implementation* that would
otherwise encode it silently.

---

## Business Dependencies

These are the 22 open decisions consolidated into the twelve that **gate implementation work**. The
full decision register (`DEC-001`–`DEC-022`) is a Phase 0C deliverable.

| ID | Dependency | Blocks | Decisions | Status |
|---|---|---|---|---|
| `DEP-001` | **Segmentation rules** — thresholds, and whether employee count or revenue takes precedence when both exist and conflict | Revenue Segmentation Framework; Territory selection; Routing | `DEC-001`, `DEC-002` | 🔴 Blocking Phase 7 |
| `DEP-002` | **Ownership precedence** — the order in which existing-customer ownership, Strategic named accounts, and territory claims resolve | Revenue Routing Engine | `DEC-003` | 🔴 Blocking Phase 8 |
| `DEP-003` | **Strategic Account designation** — what confers the designation, who authorizes it, and where it is recorded | Segmentation; Routing; Reporting | `DEC-005` | 🔴 Blocking Phase 7 |
| `DEP-004` | **Franchise / subsidiary commercial policy** — whether a franchisee or subsidiary is a distinct customer or part of the parent relationship | Account Identity & Matching Engine; duplicate strategy; **interpretation of the 6.8% duplicate baseline** | `DEC-004`, `DEC-008` | 🔴 Blocking Phase 4 |
| `DEP-005` | **Duplicate handling behaviour** — merge, suppress, or route to review; and matching hierarchy with fuzzy-match threshold | Duplicate management; Matching Engine | `DEC-004`, `DEC-008` | 🔴 Blocking Phase 3–4 |
| `DEP-006` | **Qualification definition** — what constitutes an MQL, ICP weights, and fit scoring | ICP Intelligence Framework | `DEC-009`, `DEC-010` | 🔴 Blocking Phase 5 |
| `DEP-007` | **Lifecycle taxonomy** — stage definitions, transitions, recycling, and relationship to Lead Status | Lifecycle Governance Framework; funnel reporting | `DEC-017` | 🔴 Blocking Phase 6 |
| `DEP-008` | **Territory model** — definitions, geographic precedence, and boundary resolution across differing segment region maps | Territory Management Framework | `DEC-022` | 🔴 Blocking Phase 7 |
| `DEP-009` | **SLA definition** — target durations, business hours, holiday calendars, pauses, and the definition of first touch | Revenue SLA Framework | `DEC-006`, `DEC-012` | 🔴 Blocking Phase 9 |
| `DEP-010` | **Seller eligibility** — round-robin behaviour, absence handling, capacity treatment | Revenue Routing Engine | `DEC-007`, `DEC-013` | 🔴 Blocking Phase 8 |
| `DEP-011` | **Security and access model** — OWD, role hierarchy, permission-set structure, sharing, integration user scope | Salesforce Foundation & Security | `DEC-021` | 🔴 Blocking Phase 1 |
| `DEP-012` | **Analytics architecture** — event/history persistence, historical-data strategy, Power BI refresh and data access | Revenue Intelligence Model; Power BI | `DEC-016`, `DEC-018`, `DEC-020` | 🔴 Blocking Phase 11 |

### Two dependencies that must be resolved earliest

**`DEP-011` (security model) blocks Phase 1** — the very first implementation phase. Nothing else
can be built correctly on an undecided access model, because objects, fields, and automation all
inherit from it.

**`DEP-012` (event/history persistence) is the most time-critical**, for a reason unrelated to
sequence:

> **History that is not captured cannot be recovered later.** If the decision to persist lifecycle
> transitions, routing events, and match decisions is deferred until Phase 11 when the analytics
> need becomes obvious, the data for the intervening period is permanently lost.

This decision must therefore be made in **Phase 0D**, before implementation begins — not when its
consumer arrives. It is the clearest example of a decision whose cost of deferral is asymmetric.

### Two dependencies that are not technical

| Dependency | Actually a | Consequence |
|---|---|---|
| `DEP-004` Franchise/subsidiary policy | **Commercial policy**, not a data problem | The Account duplicate baseline **is not interpretable** until it is resolved. It cannot be used as an improvement target. |
| `DEP-006` Qualification definition | **Definitional agreement** between Marketing and Sales | No scoring model resolves a dispute about what is being measured. |

---

## Tooling Dependencies

### ✅ Satisfied — verified 2026-08-22

| ID | Dependency | Version | Required for |
|---|---|---|---|
| `DEP-013` | Git | 2.55.0 | Source control; all phases |
| `DEP-014` | Salesforce CLI (`sf`) | 2.148.3 | DX operations; deployment; validation |
| `DEP-015` | Node.js | 24.19.0 | Salesforce CLI runtime |
| `DEP-016` | D2 | 0.7.1 | Architecture diagrams (Phase 0D) |
| `DEP-017` | Python | 3.14.7 | Synthetic data generation (Phase 2) |
| `DEP-018` | PowerShell | 5.1 | Repository validation; local scripting |
| `DEP-019` | GitHub CLI (`gh`) | 2.98.0 | Repository creation and push |
| `DEP-020` | VS Code | — | Development environment |

### 🟡 Pending

| ID | Dependency | Required for | Status & risk |
|---|---|---|---|
| `DEP-021` | **Salesforce Developer Edition org** | Phase 1 onward — all implementation | **Not confirmed provisioned.** Licence count, storage allocation, and feature availability have not been checked. Related: `ASM-007`, `RISK-017`. |
| `DEP-022` | **Salesforce org authentication** | Phase 1 onward | Not performed. Requires **explicit human approval** per `CLAUDE.md` §23. |
| `DEP-023` | **Power BI Desktop** | Phase 11 | Not verified as installed. Not required until Phase 11, so verification is deferred rather than blocking. |

### ⬜ Not yet required

| ID | Dependency | Required for |
|---|---|---|
| `DEP-024` | GitHub account and remote repository | Phase 0 push gate. Deliberately deferred per the Phase 0A decision. |

---

## Approval Dependencies

Human approvals the project is gated on. **These are not optional process; they are what makes the
governance real.**

| ID | Approval | Gates | Status |
|---|---|---|---|
| `DEP-025` | Phase 0B review and approval | Phase 0C | 🔴 **Current gate** |
| `DEP-026` | Phase 0C review and approval | Phase 0D | ⬜ |
| `DEP-027` | Phase 0D review and final Phase 0 approval | First commit | ⬜ |
| `DEP-028` | Git identity decision | First commit | ⬜ Deferred by decision |
| `DEP-029` | First commit approval | GitHub repository creation | ⬜ |
| `DEP-030` | GitHub account/owner decision | Repository creation | ⬜ Deferred by decision |
| `DEP-031` | Push approval | Remote repository | ⬜ |
| `DEP-032` | Salesforce authentication approval | Phase 1 | ⬜ |
| `DEP-033` | Synthetic data generation plan approval | Phase 2 | ⬜ |
| `DEP-034` | Deployment approval | Any org modification | ⬜ |

---

## Environmental Dependencies — Unresolved

Capabilities the architecture may depend on, whose existence has **not been established**. Recorded
as dependencies rather than assumed into being.

| ID | Dependency | Why it may matter | Status |
|---|---|---|---|
| `DEP-035` | **Firmographic enrichment capability** | Determines whether 48% incomplete routing data is a transient condition or a permanent operating reality — **two materially different architectures** | **UNKNOWN / TO BE VALIDATED** (`TL-03`, `ASM-001`, `DEC-015`) |
| `DEP-036` | **Activity capture mechanism** | Determines whether first-touch can be measured automatically or depends on manual logging — determines whether the SLA framework can be trusted at all | **UNKNOWN / TO BE VALIDATED** (`TL-04`, `ASM-010`, `DEC-012`) |
| `DEP-037` | **Inbound capture mechanism** | Determines whether Lead source taxonomy can be enforced at capture or only corrected afterward | **UNKNOWN / TO BE VALIDATED** (`TL-01`, `TL-02`, `DEC-011`) |
| `DEP-038` | **Customer status source** | Determines whether existing-customer detection can rely on Salesforce | **UNKNOWN / TO BE VALIDATED** (`TL-05`, `TL-06`, `ASM-002`) |
| `DEP-039` | **Power BI data path** | Determines refresh architecture and whether analytical history can live outside Salesforce | **UNKNOWN / TO BE VALIDATED** (`TL-07`, `TL-08`, `DEC-020`) |

> **`DEP-035` is the highest-leverage unresolved dependency in the project.** It must be addressed
> before the Revenue Data Quality Framework is designed in Phase 3.

**No vendor has been named for any of these.** Naming one would fabricate a system inventory and
create a fictional dependency that later architecture would silently design against.

---

## Dependency Chains

### Implementation blocking chain

```
DEP-011  Security model            ──> Phase 1   Salesforce Foundation & Security
DEP-005  Duplicate handling        ──> Phase 3   Revenue Data Quality Framework
DEP-035  Enrichment availability   ──> Phase 3   (determines which architecture is correct)
DEP-004  Franchise policy          ──> Phase 4   Account Identity & Matching Engine
DEP-006  Qualification definition  ──> Phase 5   ICP Intelligence Framework
DEP-007  Lifecycle taxonomy        ──> Phase 6   Lifecycle Governance Framework
DEP-001  Segmentation rules        ──┐
DEP-003  Strategic designation     ──┼─> Phase 7  Segmentation & Territory Management
DEP-008  Territory model           ──┘
DEP-002  Ownership precedence      ──┐
DEP-010  Seller eligibility        ──┴─> Phase 8  Revenue Routing Engine
DEP-009  SLA definition            ──> Phase 9   Revenue SLA & Exception Framework
DEP-012  Analytics architecture    ──> Phase 11  Revenue Intelligence Model & Power BI
                                        ▲
                                        └── but the persistence half must be decided in Phase 0D
```

### Decision timing — critical asymmetry

| Decision | Consumed in | Must be decided by | Why earlier |
|---|---|---|---|
| Event/history persistence (`DEC-018`) | Phase 11 | **Phase 0D** | Uncaptured history is permanently unrecoverable |
| Security model (`DEC-021`) | Phase 1 | **Phase 0C** | Everything else inherits from it |
| Enrichment availability (`DEC-015`) | Phase 3 | **Phase 0D** | Determines which data-quality architecture is correct |
| Franchise policy (`DEC-004`) | Phase 4 | **Phase 0C** | Blocks interpretation of a baseline metric |

**Three of the four must be decided substantially earlier than the phase that consumes them.** A
dependency register organized only by consuming phase would miss this entirely.

---

## Governance

- `DEP-###` identifiers are **immutable**. A satisfied dependency is marked ✅ with the date and
  evidence; it is never deleted or renumbered.
- Dependencies are reviewed at every phase gate.
- **A blocking business dependency must never be resolved by implementation convenience.** If work
  reaches a blocked dependency, the correct action is to stop and escalate — not to choose the
  option that is easiest to build. This is the primary control against `RISK-003`.
- Tooling dependencies are verified by execution, not assumed. The version table above was produced
  by running each tool.
