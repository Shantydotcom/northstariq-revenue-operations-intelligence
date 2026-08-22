# Project Scope — NorthstarIQ Revenue Operations Intelligence Platform

| Field | Value |
|---|---|
| **Document** | Project Scope |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Target State (scope definition) |
| **Related** | [`business-problems.md`](business-problems.md) · [`risks.md`](risks.md) · [`dependencies.md`](dependencies.md) |

---

## 1. Scope Statement

This project designs and implements a governed Revenue Operations architecture for NorthstarIQ,
addressing the problems recorded in [`business-problems.md`](business-problems.md), within Salesforce
Sales Cloud and Microsoft Power BI, demonstrated in **Salesforce Developer Edition**.

**Governing constraint on every scope decision:**

> **Design for enterprise scale. Implement representative scenarios.**

---

## 2. In Scope

### 2.1 Salesforce Platform & Administration

| Item | Addresses |
|---|---|
| Standard object configuration — Lead, Account, Contact, Opportunity, User | All |
| Custom fields with documented business purpose and traced requirement | `PROB-001`–`PROB-011` |
| Relationships and, where justified, record types | `PROB-004`, `PROB-009` |
| Validation rules | `PROB-001` |
| Formula fields | `PROB-004`, `PROB-007` |
| Lightning page configuration where it materially aids the user | `PROB-003`, `PROB-012` |
| Queues and public groups where justified | `PROB-012` |
| Data imports and ongoing data maintenance | `PROB-001` |
| Administrator-facing documentation | `PROB-017`, `PROB-018` |

### 2.2 Data Model & Data Quality

| Item | Addresses |
|---|---|
| Revenue Data Quality Framework — completeness, validity, normalization | `PROB-001` |
| Duplicate management — matching rules, duplicate rules, review handling | `PROB-008` |
| Account Identity & Matching Engine — Lead-to-Account matching with recorded confidence | `PROB-002` |
| Existing-customer detection | `PROB-002` |
| Data quality scoring and status | `PROB-001` |
| Data governance — source of truth, ownership, lineage, PII classification | `PROB-001`, `PROB-013` |
| Data dictionary covering every proposed field | `PROB-017` |

### 2.3 Revenue Process

| Item | Addresses |
|---|---|
| ICP Intelligence Framework — explainable fit scoring and grading | `PROB-010` |
| Lifecycle Governance Framework — taxonomy, transitions, recycling, stage history | `PROB-011` |
| Revenue Segmentation Framework — metadata-driven, deterministic, override-aware | `PROB-004` |
| Territory Management Framework — explicit, versioned, boundary-resolving | `PROB-009` |
| Revenue Routing Engine — precedence, eligibility, round robin, customer precedence, Strategic handling | `PROB-003`, `PROB-005`, `PROB-006` |
| Routing auditability — recorded reason, basis, eligibility, timestamp | `PROB-003` |
| Revenue SLA Framework — deadline calculation, business hours, breach detection | `PROB-007` |
| Revenue Operations Exception Framework — detection, classification, ownership, resolution | `PROB-012` |

### 2.4 Automation

| Item | Note |
|---|---|
| Record-triggered Flows | Before-save vs after-save chosen deliberately |
| Screen Flows | For human review and exception handling |
| Fault paths on every Flow | Not optional — part of Flow design |
| Bulk-safe design | No DML or SOQL inside loops |
| Recursion control | Entry criteria and change detection |
| Custom Metadata Types for configurable rules | Rules are configuration, not code |
| Flow testing | `PROB-016` |

**Apex is in scope only where Flow demonstrably cannot satisfy the requirement, and only with an
accepted ADR recording why.** Adding Apex to appear technical is explicitly out of scope.

### 2.5 Security & Access

| Item | Addresses |
|---|---|
| Organization-Wide Defaults | `PROB-013` |
| Role hierarchy | `PROB-013` |
| Permission sets and permission set groups | `PROB-013` |
| Public groups and sharing rules | `PROB-013` |
| Object and field-level access, including PII-sensitive fields | `PROB-013` |
| Integration user access, scoped to least privilege | `PROB-013` |
| **Access testing** — verifying who can and cannot see what | `PROB-013` |

### 2.6 Reporting & Analytics

| Item | Addresses |
|---|---|
| Salesforce operational reports and dashboards | `PROB-012`, `PROB-014` |
| Governed KPI definitions | `PROB-014` |
| Analytics-ready data design | `PROB-015` |
| Revenue Intelligence Model — semantic model design | `PROB-015` |
| Power BI: Power Query transformations, DAX measures, report pages | `PROB-014`, `PROB-015` |
| Salesforce ↔ Power BI reconciliation testing | `PROB-014` |

### 2.7 Testing

Validation rules · formulas · record-triggered Flows · Screen Flows · duplicate scenarios · Account
matching · ICP scoring · lifecycle transitions · segmentation boundaries · territory boundaries ·
routing · customer precedence · Strategic accounts · seller eligibility · inactive seller handling ·
round robin distribution · SLA calculation and breach · exception handling · **security and
sharing** · reports · analytics reconciliation · bulk behaviour · regression.

### 2.8 Data

| Item | Note |
|---|---|
| Synthetic dataset within declared ceilings | Scenario coverage, not volume |
| Deterministic test fixtures | Reproducible inputs |
| Engineered failure scenarios | Duplicates, missing data, boundaries, inactive sellers, breaches |
| Reference/configuration data | Territories, segments, routing rules, holidays |
| Synthetic analytical history for Power BI | In `data/analytics/`, **not** loaded into Salesforce |

### 2.9 Engineering & Governance

Git · GitHub · Salesforce DX · Salesforce CLI · VS Code · source-controlled metadata · branch
discipline · conventional commits · D2 architecture diagrams · Python/PowerShell scripts where
justified · SOQL validation queries · requirements and traceability · ADRs · change management ·
operational runbooks · portfolio evidence standards.

---

## 3. Out of Scope

### 3.1 Explicitly deferred technology

| Item | Status |
|---|---|
| **Salesforce Data Cloud** | Intentionally outside the scope of the current portfolio release |
| **Salesforce Agentforce** | Intentionally outside the scope of the current portfolio release |

These receive **no** directories, prompts, ADRs, governance frameworks, requirements, open
decisions, acceptance criteria, tests, or implementation phases. They may be mentioned only as a
brief future-expansion note.

### 3.2 Salesforce products not part of this release

| Item | Rationale |
|---|---|
| Salesforce CPQ | Quoting and pricing configuration is a distinct programme. Not required by any recorded problem. |
| Billing / revenue recognition | Downstream of this architecture. Not required by any recorded problem. |
| Service Cloud | NorthstarIQ's problems are revenue-side. Adding Service Cloud would dilute the portfolio focus. |
| Experience Cloud | No recorded problem requires an external-facing portal. |
| Field Service, Marketing Cloud, Commerce Cloud | Not applicable to the recorded problems. |

**Principle applied:** *technology requires business justification.* None of the above traces to a
`PROB-###`.

### 3.3 Integrations

| Item | Status |
|---|---|
| Production integrations of any kind | **Out of scope** unless explicitly approved |
| Marketing automation platform integration | Out of scope — the platform itself is `UNKNOWN / TO BE VALIDATED` |
| Enrichment provider integration | Out of scope — provider is `UNKNOWN / TO BE VALIDATED` |
| ERP, billing, data warehouse, iPaaS | Out of scope; existence not established |

**Important.** Integration *principles* and the **integration user access model** are in scope
(§2.5). Integration *implementations* are not. Where later architecture requires a system that has
not been established to exist, the correct output is an open question or dependency — **not an
invented vendor**. See [`technology-landscape.md`](technology-landscape.md).

### 3.4 Data

| Item | Status |
|---|---|
| **Real customer data** | **Absolutely out of scope.** All data is fictional. |
| **Real personal data (PII)** | **Absolutely out of scope.** |
| Large-volume datasets | Out of scope — ceilings are declared and are ceilings, not targets |
| Synthetic history loaded into Salesforce to populate charts | Out of scope |
| Production data migration | Out of scope |

### 3.5 Claims

| Item | Status |
|---|---|
| **Enterprise-scale performance claims** | **Out of scope.** Developer Edition proves bulk-safe *design*, not enterprise scale. |
| Claims of measured business impact before measurement exists | Out of scope |
| Comparison of synthetic baselines to real industry benchmarks | Out of scope |
| Any claim that planned functionality is implemented | Out of scope |

### 3.6 Engineering practices excluded

| Item | Rationale |
|---|---|
| Apex without an accepted ADR | Violates *Flow before Apex* and *prefer maintainability over cleverness* |
| Hard-coded configurable business rules | Violates *metadata-driven rules before hard-coded decisions* |
| Automation without fault paths | Violates *design failure paths intentionally* |
| Automation without explainability output | Violates *automation requires observability* |
| Custom fields without a traced requirement | Violates *custom fields require business purpose* |
| Managed packages or AppExchange dependencies | Adds technology without business justification |

---

## 4. Scope Boundary Cases

Cases where the boundary is genuinely ambiguous, resolved explicitly here.

| Case | Decision | Reasoning |
|---|---|---|
| Opportunity Products | **Conditionally in scope** — only if a recorded problem requires them | No current `PROB-###` requires line-item detail. Do not build for completeness. |
| Contact management beyond identity | **Limited scope** — only as it serves Lead-to-Contact duplicate detection and Account identity | Broader contact strategy traces to no recorded problem |
| Opportunity process beyond creation | **Limited scope** — outcome tracking for funnel measurement, not full sales-stage redesign | Recorded problems concern Lead-to-Revenue *entry*, not Opportunity management |
| Churned Account handling | **In scope** — required by existing-customer detection (`PROB-002`) | Cannot detect existing customers correctly without distinguishing active from churned |
| Marketing automation behaviour | **Out of scope** — but its *interface* is in scope as an open question | Cannot design against an unestablished system |
| Enrichment | **Out of scope as implementation; in scope as an architectural decision point** (`DEC-015`) | The architecture must decide whether it depends on enrichment, without implementing a provider |
| Expansion / renewal motion | **Out of scope** — but customer-owner routing precedence is in scope | The recorded problem is misrouted expansion *intent*, not the expansion process itself |

---

## 5. Enterprise Design vs Portfolio Implementation

Where the two diverge, both are documented. The gap is stated, never hidden.

| Capability | Enterprise Design | Portfolio Implementation |
|---|---|---|
| Data volume | Hundreds of thousands of records | ≤60 Accounts, ≤75 Contacts, ≤120 Leads, ≤35 Opportunities |
| Users | 64 revenue users across 4 markets | Minimum necessary to demonstrate the access model and round robin |
| Territory management | Salesforce Enterprise Territory Management may be appropriate | Metadata-driven custom model within Developer Edition capability |
| Bulk processing | Proven under production load | Bulk-safe **design** demonstrated; scale **not** claimed |
| SLA business hours | Four market calendars with holiday tables | Representative subset demonstrating the mechanism |
| Analytics refresh | Scheduled enterprise refresh with gateway | Refresh architecture designed; approach depends on `DEC-020` |
| Integration | Multiple authenticated system integrations | Integration **user access model** designed and tested; no live integration |
| Environment strategy | Multi-sandbox with CI/CD promotion | Single Developer Edition org with source control and validation |

**Every one of these gaps is stated in the artifact where it applies.** Substituting a lesser design
and presenting it as the intended architecture is prohibited.

---

## 6. Scope Control

### Guarding the four-day release

The roadmap phases are logical, not calendar days; the intended build is approximately four focused
days. **Future enhancements must not threaten the Day 4 release.**

Any proposed addition must pass all four tests:

1. Does it trace to a recorded `PROB-###`?
2. Does it demonstrate a competency in the target role set?
3. Can it be responsibly implemented in Developer Edition?
4. Can it be **tested and evidenced**, not merely built?

**If any answer is no, it is out of scope** — recorded as future expansion, not silently absorbed.

### Explicit anti-goals

The project is **not** optimizing for: maximum file count · maximum automation · maximum dataset
size · maximum technology count · maximum custom fields · maximum Flows · maximum complexity.

It is optimizing for: **a coherent, defensible, traceable, testable, secure, explainable,
administrator-maintainable, enterprise-quality Revenue Operations architecture.**

---

## 7. Future Portfolio Expansion

Future expansion opportunities may include **Salesforce Data Cloud** and **Salesforce Agentforce**.
They are intentionally outside the scope of the current portfolio release and are not required for
it.

No implementation phases, requirements, decisions, or architecture exist for them, and none will be
created during this release.
