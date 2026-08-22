# Documentation Index

**NorthstarIQ — Revenue Operations Intelligence Platform**

This is the map of the project's documentation. Each area below states what it holds, which phase
produces it, and its current status.

**Current phase: 0B — Enterprise Discovery (complete, awaiting gate approval).** Phase 0C and 0D
areas below are intentionally empty. Empty is the honest state; pre-writing them would mean
asserting conclusions before the analysis that produces them.

---

## Status Legend

| Marker | Meaning |
|---|---|
| ✅ | Exists |
| 🟡 | In progress |
| ⬜ | Not started — phase named |
| 🔵 | Blocked on a human decision |

Full definitions: [Implementation Status Conventions](governance/implementation-status-conventions.md)

---

## Phase 0A — Repository Foundation ✅

| Document | Purpose |
|---|---|
| [`governance/naming-conventions.md`](governance/naming-conventions.md) | Canonical subsystem names, identifier scheme, Salesforce metadata naming, Git conventions, terminology discipline |
| [`governance/implementation-status-conventions.md`](governance/implementation-status-conventions.md) | Three States of Reality, status values, evidence standard, data provenance labels |
| [`architecture/architecture-documentation-framework.md`](architecture/architecture-documentation-framework.md) | How architecture is documented: layer model, D2 standards, ADR standard, traceability, review checklist |

Also at repository root: [`CLAUDE.md`](../CLAUDE.md) — the engineering operating contract and guardrails.

---

## Phase 0B — Enterprise Discovery ✅

**Directory:** [`discovery/`](discovery/)

Assessment of the fictional NorthstarIQ environment. Establishes **Current State**.

| Document | Purpose | Register |
|---|---|---|
| [`company-profile.md`](discovery/company-profile.md) | The fictional company in business terms | — |
| [`revenue-model.md`](discovery/revenue-model.md) | Synthetic revenue model consistent with ~$42M ARR / ~650 customers | — |
| [`sales-organization.md`](discovery/sales-organization.md) | Sales structure, roles, coverage; business org vs portfolio Salesforce users | — |
| [`technology-landscape.md`](discovery/technology-landscape.md) | Systems, ownership, integration boundaries | — |
| [`current-state.md`](discovery/current-state.md) | How the environment works today, across 17 domains | — |
| [`business-problems.md`](discovery/business-problems.md) | Problems with causes classified Known / Assumed / To Be Validated | `PROB-001`–`PROB-018` |
| [`baseline-metrics.md`](discovery/baseline-metrics.md) | Synthetic baselines for data quality, routing, SLA, funnel | — |
| [`project-scope.md`](discovery/project-scope.md) | In scope, out of scope, explicitly deferred | — |
| [`assumptions.md`](discovery/assumptions.md) | Assumption register | `ASM-001`–`ASM-033` |
| [`risks.md`](discovery/risks.md) | Risk register | `RISK-001`–`RISK-020` |
| [`dependencies.md`](discovery/dependencies.md) | Dependency register | `DEP-001`–`DEP-039` |

Every statement labelled: Known Context · Synthetic Planning Assumption · Synthetic Baseline ·
Assumption · Finding · Open Question.

**Carried into Phase 0C.** Discovery identified but deliberately did **not** resolve 22 business
decisions (`DEC-001`–`DEC-022`). They are referenced throughout the discovery documents and
become the `open-decisions.md` register in Phase 0C. **None may be marked `Accepted` without a
human decision.**

---

## Phase 0C — Requirements & Governance ⬜ *(next)*

**Directories:** [`requirements/`](requirements/) · [`governance/`](governance/) · [`security/`](security/) · [`data-dictionary/`](data-dictionary/)

### Requirements

| Planned document | Purpose |
|---|---|
| `business-requirements.md` | `BR-###` register — the backbone of the project |
| `traceability-matrix.md` | Problem → Requirement → Decision → Component → Test → Evidence |
| `personas.md` | `PER-##` — the twelve personas and their outcomes |
| `open-decisions.md` | `DEC-###` register — unresolved business design decisions |
| `territory-model.md` | Territory definitions and precedence |
| `segmentation-model.md` | Segment thresholds and override handling |
| `lifecycle-model.md` | Lifecycle stage taxonomy and transitions |

Every requirement carries: ID · Domain · Business Problem · Requirement · Rationale · Priority ·
Owner/Persona · Acceptance Criteria · Dependencies · Related Decision · Future Implementation
Component · Test Requirement · Status.

Requirements state **business outcomes first**. "Revenue Operations must be able to determine why
a Lead was assigned to a specific seller without inspecting Flow debug logs" — not "Create
`Routing_Reason__c`." Technical implementation follows.

### Governance

| Planned document | Purpose |
|---|---|
| `data-governance.md` | Source of truth, ownership, lineage, validation, PII, retention |
| `kpi-governance.md` | `KPI-###` definitions with numerator, denominator, grain, exclusions |
| `decision-governance.md` | How decisions move from Unknown to Validated |
| `change-management.md` | Requirement → design → review → build → test → deploy → verify |

### Security

| Planned document | Purpose |
|---|---|
| `security-principles.md` | Least privilege, permission-set-first design, integration user principles |
| `access-model.md` | OWD, roles, permission sets, groups, sharing rules, queues, per-persona access |

Security is a **primary workstream**, not a footnote.

### Data Dictionary

| Planned document | Purpose |
|---|---|
| `data-dictionary.md` | Proposed field documentation for Lead, Account, Contact, Opportunity, User |

Every proposed field carries: Object · Business Label · Proposed API Name · Type ·
Standard/Custom · Business Purpose · Source · Required? · Reporting? · Automation Dependency? ·
Security Consideration · PII Classification · Requirement · Status.

**These remain proposals during Phase 0. No Salesforce fields are created.**

---

## Phase 0D — Architecture & Implementation Planning ⬜

**Directories:** [`architecture/`](architecture/) · [`ADR/`](ADR/) · [`analytics/`](analytics/) · [`testing/`](testing/) · [`runbooks/`](runbooks/) · [`portfolio/`](portfolio/)

### Architecture

Current-state and target-state architecture, plus D2 diagram sources. Standards are already
defined in the [Architecture Documentation Framework](architecture/architecture-documentation-framework.md).

### ADR

| Planned | Title |
|---|---|
| `ADR-0001-metadata-driven-revenue-architecture.md` | Configurable business rules are metadata-driven rather than hard-coded into Flow or Apex |

Only significant decisions get ADRs. Trivial ADRs are a negative signal.

### Analytics

Revenue Intelligence Model design, Revenue Intelligence Command Center page architecture,
dimensions and facts, refresh architecture. **Power BI is not built during Phase 0.**

### Testing

Test strategy and matrices across validation rules, formulas, Flows, duplicates, matching,
scoring, lifecycle, segmentation/territory boundaries, routing, seller eligibility, SLA,
exceptions, security, sharing, reports, analytics reconciliation, bulk behaviour, regression.

Format: `Test ID | Requirement ID | Scenario | Known Input | Expected Result | Actual Result |
PASS / FAIL | Evidence`. **`Actual Result` is populated only by an actual run.**

### Runbooks

Operational procedures for routing failure, unassigned Lead, matching exception, duplicate review,
SLA breach, automation failure, data-quality issue, access request, permission troubleshooting,
deployment rollback.

**Do not fabricate procedures for functionality that has not been implemented.**

### Portfolio

The story framework: Business Problem → Why It Matters → Discovery → Requirement → Architecture
Decision → Salesforce Solution → Security/Governance → Testing → Operational Evidence → Analytics
→ Business Outcome.

Supports GitHub portfolio, interviews, resume, LinkedIn content, and executive demo.
**No claim of measured business impact before measurement exists.**

---

## Root-Level Planned Documents

| Document | Phase | Purpose |
|---|---|---|
| `docs/implementation-roadmap.md` | 0D | Phases 0–13 with objective, value, dependencies, deliverables, requirements, validation, evidence, exit criteria |

---

## Deferred Technology

**Salesforce Data Cloud** and **Salesforce Agentforce** are intentionally outside the scope of the
current portfolio release. They receive no directories, ADRs, requirements, decisions, or
implementation phases. The only permitted mention is a brief note in the roadmap and README.
