# Documentation Index

**NorthstarIQ — Revenue Operations Intelligence Platform**

This is the map of the project's documentation. Each area below states what it holds, which phase
produces it, and its current status.

**Current phase: 0C — Requirements & Governance (complete, awaiting gate approval).** Phase 0D
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

## Phase 0C — Requirements & Governance ✅

**Directories:** [`requirements/`](requirements/) · [`governance/`](governance/) · [`security/`](security/) · [`data-dictionary/`](data-dictionary/)

### Requirements

| Document | Purpose | Register |
|---|---|---|
| [`requirements/business-requirements.md`](requirements/business-requirements.md) | The backbone — 62 requirements across 12 domains | `BR-001`–`BR-062` |
| [`requirements/open-decisions.md`](requirements/open-decisions.md) | Unresolved business design decisions, analysed but **not decided** | `DEC-001`–`DEC-022` |
| [`requirements/personas.md`](requirements/personas.md) | Roles, needs, pain points, access considerations | `PER-01`–`PER-17` |
| [`requirements/traceability-matrix.md`](requirements/traceability-matrix.md) | Problem → Requirement → Decision → Persona → Component → Test | — |
| [`requirements/segmentation-model.md`](requirements/segmentation-model.md) | Candidate model; thresholds remain open | `DEC-001`, `DEC-002`, `DEC-005` |
| [`requirements/territory-model.md`](requirements/territory-model.md) | Candidate models; the Enterprise/Mid-Market asymmetry | `DEC-022`, `DEC-003` |
| [`requirements/lifecycle-model.md`](requirements/lifecycle-model.md) | Candidate taxonomy; **contains the one irreversible decision** | `DEC-017`, `DEC-018` |

Every requirement carries: ID · Domain · Business Problem · Requirement · Rationale · Priority ·
Owner/Persona · Acceptance Criteria · Dependencies · Related Decision · Future Implementation
Component · Test Requirement · Status.

Requirements state **business outcomes first**. "Revenue Operations must be able to determine why
a Lead was assigned to a specific seller without inspecting Flow debug logs" — not "Create
`Routing_Reason__c`." Technical implementation follows.

### Governance

| Document | Purpose | Register |
|---|---|---|
| [`governance/data-governance.md`](governance/data-governance.md) | Source of truth, ownership, stewardship, validation, duplicates, PII, lineage, retention | — |
| [`governance/kpi-governance.md`](governance/kpi-governance.md) | Governed KPI definitions with a **measurement-reliability classification** | `KPI-001`–`KPI-015` |
| [`governance/decision-governance.md`](governance/decision-governance.md) | How decisions move from Unknown to Validated, and the human decision boundary | — |
| [`governance/change-management.md`](governance/change-management.md) | Requirement → design → review → build → test → deploy → verify → monitor | — |

### Security

| Document | Purpose |
|---|---|
| [`security/security-principles.md`](security/security-principles.md) | `SP-01`–`SP-10` — least privilege, permission-set-first, integration principals, testing |
| [`security/access-model.md`](security/access-model.md) | Candidate OWD, roles, Permission Sets, queues, per-persona access, and the `DEC-021` recommendation |

Security is a **primary workstream**, not a footnote.

### Data Dictionary

| Document | Purpose |
|---|---|
| [`data-dictionary/data-dictionary.md`](data-dictionary/data-dictionary.md) | 49 proposed fields across Lead, Account, Contact, Opportunity, User — preceded by a **standard-before-custom** analysis |

Every proposed field carries: Object · Business Label · Proposed API Name · Type ·
Standard/Custom · Business Purpose · Source · Required? · Reporting? · Automation Dependency? ·
Security Consideration · PII Classification · Requirement · Status.

**These remain proposals during Phase 0. No Salesforce fields are created.** **25 of the 49
proposals are blocked on an open decision**, and no picklist values are proposed where those values
are themselves the decision.

---

## Phase 0D — Architecture & Implementation Planning ⬜ *(next)*

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
