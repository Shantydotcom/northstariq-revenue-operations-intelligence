# NorthstarIQ — Revenue Operations Intelligence Platform

**Enterprise Salesforce, Revenue Operations, GTM Systems & Analytics Architecture**

![Phase](https://img.shields.io/badge/phase-0C%20Requirements%20%26%20Governance-blue)
![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Salesforce](https://img.shields.io/badge/Salesforce-Developer%20Edition-00A1E0)
![Analytics](https://img.shields.io/badge/Analytics-Power%20BI-F2C811)
![Data](https://img.shields.io/badge/data-100%25%20synthetic-lightgrey)

---

> ### ⚠️ Current Project Status — Read First
>
> **This repository is at Phase 0C (Requirements & Governance).**
>
> | State | Status |
> |---|---|
> | Current State (assessment of the fictional environment) | ✅ Documented — [`docs/discovery/`](docs/discovery/) |
> | Target State (proposed architecture) | ⬜ Not yet designed — Phase 0D |
> | **Implemented State** | ✅ **Repository foundation and Salesforce DX scaffold only** |
>
> **Nothing has been built in Salesforce.** No org authentication has occurred. No metadata has
> been deployed. No dataset has been generated. No Power BI artifact exists.
>
> Every section below marked *Planned* describes intended work, not delivered work. This
> distinction is maintained deliberately throughout the repository — see
> [Implementation Status Conventions](docs/governance/implementation-status-conventions.md).

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Portfolio Elevator Pitch](#portfolio-elevator-pitch)
3. [Business Context](#business-context)
4. [Fictional Company Profile](#fictional-company-profile)
5. [Project Thesis](#project-thesis)
6. [Revenue Operations Intelligence Model](#revenue-operations-intelligence-model)
7. [Current-State Problems](#current-state-problems)
8. [Target Business Capabilities](#target-business-capabilities)
9. [Target Architecture](#target-architecture)
10. [Salesforce Architecture](#salesforce-architecture)
11. [Security & Access Strategy](#security--access-strategy)
12. [Power BI Strategy](#power-bi-strategy)
13. [Developer Edition Constraint](#developer-edition-constraint)
14. [Enterprise Design vs Portfolio Implementation](#enterprise-design-vs-portfolio-implementation)
15. [Repository Structure](#repository-structure)
16. [Requirements & Governance Approach](#requirements--governance-approach)
17. [Data Strategy](#data-strategy)
18. [Testing Strategy](#testing-strategy)
19. [Change-Management Strategy](#change-management-strategy)
20. [Implementation Roadmap](#implementation-roadmap)
21. [Four-Day Delivery Strategy](#four-day-delivery-strategy)
22. [Architecture Decisions](#architecture-decisions)
23. [Current Project Status](#current-project-status)
24. [Synthetic Data Disclaimer](#synthetic-data-disclaimer)
25. [Portfolio Evidence](#portfolio-evidence)
26. [Future Expansion](#future-expansion)

---

## Executive Summary

NorthstarIQ is a fictional ~$42M ARR B2B SaaS company whose revenue architecture is being assessed
and redesigned. This repository documents that work end to end: discovery, requirements,
architecture decisions, Salesforce implementation, security design, testing, and analytics.

**Discovery is complete.** Seventeen operational domains were assessed, producing eighteen
classified business problems, synthetic current-state baselines, and four registers
(assumptions, risks, dependencies, and the open decisions they feed). The findings that shape
everything downstream:

| # | Finding | Evidence |
|---|---|---|
| 1 | **Six of the seven Critical/High operational domains share one upstream cause** — incomplete firmographic data. 48% of Leads lack the country and/or employee count that routing requires. | [`baseline-metrics.md`](docs/discovery/baseline-metrics.md) §2, [`current-state.md`](docs/discovery/current-state.md) |
| 2 | **The environment cannot answer "why did this happen?"** for any automated decision — match, score, stage change, segment, territory, owner, or SLA outcome. Explainability is an operational data-capture requirement, not a reporting feature. | [`current-state.md`](docs/discovery/current-state.md) §Cross-Cutting |
| 3 | **Several baselines do not measure what they appear to measure.** SLA attainment conflates responsiveness with activity logging; reassignment conflates error with legitimate movement. Establishing trustworthy measurement is itself a deliverable. | [`baseline-metrics.md`](docs/discovery/baseline-metrics.md) §1 |
| 4 | **Some problems are policy gaps presenting as configuration problems** — ownership precedence, duplicate/subsidiary policy, and the definition of qualification cannot be solved by Salesforce configuration at all. | [`business-problems.md`](docs/discovery/business-problems.md) §Cross-Cutting |

These findings set the implementation sequence: **data quality and identity are addressed before
routing and SLA**, because routing built on unreliable inputs cannot be made correct.

**What has not been done.** No requirement, architecture decision, or Salesforce component exists
yet. Twenty-two business decisions remain open and unresolved by design — they require a human
owner, not an assistant's assumption. Nothing has been built, deployed, or measured.

---

## Portfolio Elevator Pitch

> ⚠️ **This pitch describes the *completed* project. It is not yet true.**
> It is recorded here as the target the work is steering toward, and will be moved out of this
> warning block only when each claim is backed by implemented, validated evidence.

> I designed and built a Revenue Operations Intelligence Platform for a fictional $42M B2B SaaS
> company using Salesforce Sales Cloud, Power BI, GitHub, Salesforce DX, and AI-assisted
> engineering with Claude Code to improve data quality, account matching, qualification, lifecycle
> governance, segmentation, territory routing, seller assignment, SLA monitoring, Salesforce
> security, operational visibility, and revenue analytics.

---

## Business Context

> ✅ **Documented in Phase 0B — Enterprise Discovery.**
> → [`docs/discovery/`](docs/discovery/)

NorthstarIQ is **not greenfield**. The company grew faster than its operational architecture
matured. Years of incremental Salesforce configuration, inconsistent governance, changing sales
processes, disconnected automation, incomplete documentation, manual workarounds, inconsistent
data entry, territory changes, unclear ownership logic, inconsistent lifecycle definitions,
fragmented reporting, and evolving qualification standards have produced **operational debt**.

The discovery record:

| Document | What it establishes |
|---|---|
| [`company-profile.md`](docs/discovery/company-profile.md) | The fictional company in business terms; which phase decisions created which consequence |
| [`revenue-model.md`](docs/discovery/revenue-model.md) | A synthetic revenue model that reconciles to ~$42M ARR / ~650 customers |
| [`sales-organization.md`](docs/discovery/sales-organization.md) | Sales structure, roles, coverage — and the business org vs. the portfolio Salesforce user model |
| [`technology-landscape.md`](docs/discovery/technology-landscape.md) | Systems, ownership, integration boundaries, and where business rules currently live |
| [`current-state.md`](docs/discovery/current-state.md) | How the environment works today across 17 domains |
| [`business-problems.md`](docs/discovery/business-problems.md) | `PROB-001`–`PROB-018`, causes classified Known / Assumed / To Be Validated |
| [`baseline-metrics.md`](docs/discovery/baseline-metrics.md) | Synthetic baselines for data quality, routing, SLA, and funnel — with reliability caveats |
| [`project-scope.md`](docs/discovery/project-scope.md) | In scope, out of scope, explicitly deferred |
| [`assumptions.md`](docs/discovery/assumptions.md) | `ASM-001`–`ASM-033` |
| [`risks.md`](docs/discovery/risks.md) | `RISK-001`–`RISK-020` |
| [`dependencies.md`](docs/discovery/dependencies.md) | `DEP-001`–`DEP-039` |

Every statement in these documents is labelled with its provenance: **Known Context ·
Synthetic Planning Assumption · Synthetic Baseline · Assumption · Finding · Open Question**.

---

## Fictional Company Profile

| Attribute | Value | Provenance |
|---|---|---|
| ARR | ~$42M | Known Context |
| Customers | ~650 | Known Context |
| Employees | ~450 | Known Context |
| CRM | Salesforce Sales Cloud | Known Context |
| Analytics | Microsoft Power BI | Known Context |
| Markets | US, Canada, UK, Germany | Known Context |
| Segments | SMB, Mid-Market, Enterprise, Strategic | Known Context |

These figures describe the **fictional enterprise**. They do **not** describe the volume of data
loaded into Salesforce Developer Edition — see [Data Strategy](#data-strategy).

Detailed revenue modelling → [`docs/discovery/revenue-model.md`](docs/discovery/revenue-model.md).

---

## Project Thesis

> NorthstarIQ Revenue Operations Intelligence Platform demonstrates how data quality, identity,
> qualification, lifecycle governance, segmentation, territory management, routing, SLA execution,
> Salesforce administration, security, operational governance, and revenue analytics can operate
> as one governed revenue architecture.

The central idea:

> **Revenue Operations problems are rarely isolated Salesforce configuration problems.** They
> emerge from disconnected data, inconsistent definitions, weak governance, poor ownership logic,
> fragmented automation, insufficient controls, inadequate observability, and inconsistent analytics.

This project is therefore **not** built as `Custom Fields + Flows + Reports + Dashboard`. It is
built as a traceable chain:

```
Business Problem → Requirement → Business Rule → Architecture Decision → Data Design
→ Security / Access Design → Salesforce Component → Automation → Audit / Operational Evidence
→ Reporting → Analytics → Testing → Operational Support → Measured Outcome
```

Every major implementation traces back to a documented requirement.

---

## Revenue Operations Intelligence Model

Revenue Operations Intelligence is defined here as the ability to transform operational data into
**governed, explainable, actionable and measurable** revenue decisions.

The system is designed to answer, in order:

| # | Question | Domain |
|---|---|---|
| 1 | **TRUST** — Can this data be trusted? | Revenue Data Quality Framework |
| 2 | **IDENTITY** — Who is this? Have we seen them? Which Account? Already a customer? | Account Identity & Matching Engine |
| 3 | **FIT** — Does the organization match our ICP? Why? | ICP Intelligence Framework |
| 4 | **LIFECYCLE** — Where are they in the revenue lifecycle? Why? | Lifecycle Governance Framework |
| 5 | **SEGMENT** — Which segment applies? Why? | Revenue Segmentation Framework |
| 6 | **TERRITORY** — Which territory applies? Why? | Territory Management Framework |
| 7 | **OWNER** — Who should own this? Was the seller eligible? Why were they selected? | Revenue Routing Engine |
| 8 | **ACTION** — What needs to happen next? | Lifecycle / Routing |
| 9 | **SLA** — When must it happen? Did it happen? | Revenue SLA Framework |
| 10 | **OUTCOME** — Did the record progress? Opportunity created? Revenue generated? | Revenue Intelligence Model |
| 11 | **SYSTEM HEALTH** — Where are operational failures occurring? | Revenue Operations Exception Framework |

The recurring **"Why?"** is deliberate: explainability is a first-class requirement.

---

## Current-State Problems

> ✅ **Documented in Phase 0B — Enterprise Discovery.**
> → [`business-problems.md`](docs/discovery/business-problems.md) ·
> [`current-state.md`](docs/discovery/current-state.md) ·
> [`baseline-metrics.md`](docs/discovery/baseline-metrics.md)

Seventeen domains were assessed, producing eighteen problems. Every cause is classified
**Known / Assumed / To Be Validated / Structural Finding** — the project does not assert a
technical root cause for anything that has not been inspected.

### P1 — must be addressed first

| ID | Problem | Domain | Cause evidence |
|---|---|---|---|
| `PROB-001` | Critical firmographic fields are missing on nearly half of inbound records | Data Quality | Synthetic Baseline |
| `PROB-002` | Existing customers are treated as net-new prospects | Identity | Assumed |
| `PROB-003` | No record explains why a routing decision was made | Routing / Auditability | Assumed |
| `PROB-004` | Segmentation is unreliable and inherits upstream data defects | Segmentation | Assumed |
| `PROB-005` | Ownership precedence between three assignment bases is undefined | Ownership | Assumed |
| `PROB-006` | Speed-to-lead is slow and bimodal | Routing / SLA | Synthetic Baseline |
| `PROB-007` | Response commitments cannot be measured reliably | SLA | Synthetic Baseline |

`PROB-008`–`PROB-016` (P2) cover duplicates, territory, qualification, lifecycle, exceptions,
security, reporting, analytics, and change management. `PROB-017`–`PROB-018` (P3) cover
undocumented business rules and single-person administration dependency. Full register:
[`business-problems.md`](docs/discovery/business-problems.md).

### The dependency chain

The domains are not independent. Data defects propagate deterministically:

```
Missing employee count / industry / country / domain
        │
        ├──> Qualification cannot be assessed consistently
        │
        ├──> Segment cannot be derived reliably
        │            └──> Territory map cannot be selected reliably
        │                          └──> Routing selects the wrong owner
        │                                        └──> SLA clock starts late or never
        │
        └──> Account match fails ──> existing customer treated as new prospect
```

This is why the architecture sequences data quality and identity **before** routing and SLA.

### Selected synthetic baselines

| Metric | Baseline | Usable for before/after claims? |
|---|---:|---|
| Leads missing employee count | 44% | ✅ Yes |
| Leads with incomplete required routing data | **48%** | ✅ Yes |
| Median created-to-assigned | 6.4 business hours | ✅ Yes |
| P90 created-to-assigned | 41 business hours | ✅ Yes |
| Leads unassigned beyond 24 business hours | 21% | ✅ Yes |
| Median created-to-first-touch | 15.5 business hours | ⚠️ Directionally |
| SLA attainment (vs. assumed 4-hour target) | 34% | ⚠️ Conflates response with activity logging |
| Reassignment within 30 days | 18.6% | ⚠️ Upper bound on routing error only |
| Duplicate Account rate | 6.8% | ⚠️ Not interpretable until subsidiary policy is defined |

**All figures are Synthetic Baselines** — invented to make the fictional environment coherent and
to give later work something honest to measure against. **No Actual Measured Result exists
anywhere in this project.** See [`baseline-metrics.md`](docs/discovery/baseline-metrics.md) §1 for
why four of these metrics cannot yet support an improvement claim.

---

## Target Business Capabilities

> ✅ **Documented in Phase 0C — Requirements & Governance.**
> → [`business-requirements.md`](docs/requirements/business-requirements.md) ·
> [`traceability-matrix.md`](docs/requirements/traceability-matrix.md) ·
> [`open-decisions.md`](docs/requirements/open-decisions.md)

**62 business requirements** across 12 domains, every one tracing to a Phase 0B problem and an owning
persona. Requirements state business outcomes, not Salesforce components.

| Domain | Requirements | Capability |
|---|---|---|
| Revenue Data Quality Framework | `BR-001`–`BR-007` | Incomplete data is detected, normalized, explained, and handled as the **main path** |
| Account Identity & Matching Engine | `BR-008`–`BR-013` | Relationship to existing Accounts determined explicitly, with basis and confidence recorded |
| ICP Intelligence Framework | `BR-014`–`BR-018` | One governed fit definition; **"not assessable" never treated as "poor fit"** |
| Lifecycle Governance Framework | `BR-019`–`BR-023` | One taxonomy; transitions recorded with cause; stage duration answerable |
| Revenue Segmentation Framework | `BR-024`–`BR-027` | Segment derived from versioned rules; unsegmentable records surfaced, never defaulted |
| Territory Management Framework | `BR-028`–`BR-029` | Deterministic resolution including boundaries; versioned definitions |
| Revenue Routing Engine | `BR-030`–`BR-037` | Explicit ownership precedence; **every routing decision records why**; nothing stalls silently |
| Revenue SLA Framework | `BR-038`–`BR-043` | An agreed commitment; governed calendars; **response failure distinguished from measurement failure** |
| Revenue Operations Exception Framework | `BR-044`–`BR-047` | Exceptions detected, classified, owned, measured |
| Revenue Intelligence Model | `BR-048`–`BR-052` | Governed KPIs; **operational decision data reaches analytics** |
| Security & Access | `BR-053`–`BR-058` | Least privilege per persona, permission-set-first, tested in both directions |
| Administration & Change Management | `BR-059`–`BR-062` | Metadata-driven rules; a governed change path with rollback |

**Priority:** 27 P0 · 23 P1 · 12 P2.
**Status:** 10 fully specifiable today · 40 partially conditional · 12 blocked on an open decision.
**None is `Approved`.**

### The 22 open decisions

Discovery identified 22 business decisions that **only a human can make**, and Phase 0C deliberately
did **not** resolve any of them. Fourteen block Phase 0D architecture.

> ⚠️ **`DEC-018` (event and history persistence) is different in kind.** Every other decision costs
> rework if changed late. This one determines whether lifecycle transitions are captured at the moment
> they occur — and **history not captured cannot be reconstructed**. Deferring it is a decision to lose
> the data permanently.

Requirements depending on an unresolved decision cite it, state what is known, mark which acceptance
criteria are conditional, and are **not** marked `Approved`. No threshold, weight, taxonomy, or
precedence order has been invented.

---

## Target Architecture

> 🔒 **Populated in Phase 0D — Architecture & Implementation Planning.**
> → [`docs/architecture/`](docs/architecture/) (D2 source diagrams)

---

## Salesforce Architecture

> 🔒 **Populated in Phase 0D.**

Named subsystems (canonical terminology):

| Capability | Name |
|---|---|
| Entire project | Revenue Operations Intelligence Platform |
| Business process | Lead-to-Revenue Lifecycle |
| Salesforce / data architecture | Revenue Operations Architecture |
| Data quality | Revenue Data Quality Framework |
| Identity | Account Identity & Matching Engine |
| Qualification | ICP Intelligence Framework |
| Lifecycle | Lifecycle Governance Framework |
| Segmentation | Revenue Segmentation Framework |
| Territories | Territory Management Framework |
| Routing | Revenue Routing Engine |
| SLA | Revenue SLA Framework |
| Exceptions | Revenue Operations Exception Framework |
| Analytics model | Revenue Intelligence Model |
| Power BI experience | Revenue Intelligence Command Center |

---

## Security & Access Strategy

> ✅ **Documented in Phase 0C.**
> → [`security-principles.md`](docs/security/security-principles.md) ·
> [`access-model.md`](docs/security/access-model.md)
>
> ⚠️ **This project asserts no security defect at NorthstarIQ. Nothing has been inspected.**
> `PROB-013` carries evidence status *To Be Validated*. What can honestly be stated is a governance
> observation: security is currently treated as a configuration task rather than a governed
> workstream. **The access model is a candidate with a recommendation — `DEC-021` remains open.**

Security is treated as a **primary workstream**, not a documentation footnote. The design layers:

```
Organization-Wide Defaults → Role Hierarchy → Permission Sets → Permission Set Groups
→ Public Groups → Sharing Rules → Queues → Field/Object Access → Integration User Access → Testing
```

Business permissions are managed through **permission sets**, not profiles.

---

## Power BI Strategy

> 🔒 **Populated in Phase 0D.**
> → [`powerbi/`](powerbi/), [`docs/analytics/`](docs/analytics/)

The Power BI experience is the **Revenue Intelligence Command Center** — the analytical layer of
the platform. Power BI is **not** the transactional system of record.

Model artifacts are version-controlled as text (`.tmdl` / `.bim` / `.pq` / `.dax`). `.pbix`
binaries are git-ignored because they cache data and can embed credentials.

---

## Developer Edition Constraint

The actual Salesforce target is **Salesforce Developer Edition**. This is treated as an explicit
architecture constraint, not an afterthought.

> **Design for enterprise scale. Implement representative scenarios.**

The Developer Edition implementation does **not** prove enterprise-scale performance, and no such
claim is made anywhere in this repository.

---

## Enterprise Design vs Portfolio Implementation

Every design decision is documented against both columns:

| Enterprise Design | Portfolio Implementation |
|---|---|
| What is appropriate for a real ~$42M ARR B2B SaaS company | What can responsibly be demonstrated in Developer Edition |

Where a design requires an edition feature Developer Edition lacks, the **gap is documented**
rather than silently substituted with a lesser design.

---

## Repository Structure

```
northstariq-revenue-operations-intelligence/
├── README.md                    this file
├── CLAUDE.md                    engineering operating contract & guardrails
├── .gitignore / .forceignore    secret, PII and metadata-scope controls
├── sfdx-project.json            Salesforce DX project definition
│
├── config/                      scratch org definitions
├── manifest/                    package.xml manifests
├── force-app/main/default/      Salesforce source  (empty until Phase 1)
│
├── data/                        synthetic datasets  (empty until Phase 2)
│   ├── source/ broken/ clean/ expected/ reference/ analytics/
│
├── powerbi/                     model / dax / powerquery / documentation
├── scripts/                     python / powershell / soql
├── tests/                       fixtures + test matrices by domain
│
├── docs/
│   ├── discovery/               Phase 0B — company, current state, problems, baselines
│   ├── requirements/            Phase 0C — BRs, traceability, personas, open decisions
│   ├── governance/              Phase 0C — data, KPI, decision, change management
│   ├── security/                Phase 0C — principles & access model
│   ├── data-dictionary/         Phase 0C — proposed field documentation
│   ├── architecture/            Phase 0D — D2 diagrams & architecture docs
│   ├── ADR/                     architecture decision records
│   ├── analytics/               Power BI & reporting design
│   ├── testing/                 test strategy & matrices
│   ├── runbooks/                operational procedures
│   └── portfolio/               portfolio story framework
│
├── prompts/                     preserved AI prompts (governed AI-assisted engineering)
└── .github/                     PR template, issue templates, workflows
```

Directory-level `README.md` files describe each area's purpose and current status.

---

## Requirements & Governance Approach

Identifier scheme (immutable once assigned):

| Prefix | Meaning |
|---|---|
| `BR-###` | Business Requirement |
| `DEC-###` | Open Decision |
| `ADR-####` | Architecture Decision Record |
| `TEST-###` | Test case |
| `KPI-###` | Governed KPI definition |
| `RISK-###` / `ASM-###` | Risk / Assumption |

Decision governance flow:

```
Unknown → Open Decision → Analysis → Recommendation → Human Decision
→ Requirement / ADR → Implementation → Test → Validation
```

A decision reaches `Accepted` **only** after explicit human approval. Material uncertainty is
recorded as an Open Decision, never silently resolved.

→ [Decision Governance](docs/governance/) · [Naming Conventions](docs/governance/naming-conventions.md)
· [Implementation Status Conventions](docs/governance/implementation-status-conventions.md)

---

## Data Strategy

**Goal: scenario coverage, not record volume.** Approximate ceilings (ceilings, not targets):

| Object | Ceiling |
|---|---|
| Accounts | ~60 |
| Contacts | ~75 |
| Leads | ~120 |
| Opportunities | ~35 |
| Opportunity Products | ~50–70 (only if justified) |

Data will deliberately include engineered failure scenarios — duplicates, missing firmographics,
malformed domains, ambiguous Account matches, segmentation and territory boundary values, inactive
sellers, SLA breaches, incomplete qualification — so that controls can be proven to work rather
than merely asserted.

Deterministic fixtures are preferred over random generation.

---

## Testing Strategy

> 🔒 **Populated in Phase 0D.** → [`docs/testing/`](docs/testing/)

Test record format: `Test ID | Requirement ID | Scenario | Known Input | Expected Result |
Actual Result | PASS / FAIL | Evidence`.

An untested rule is `Implemented`, never `Validated`. **Test results are never fabricated.**

---

## Change-Management Strategy

> ✅ **Documented in Phase 0C.** → [`change-management.md`](docs/governance/change-management.md)
>
> **Weak change management is what allowed the operational debt to accumulate** (`PROB-016`). Fixing
> routing without fixing change management would guarantee recurrence — which is why `BR-060` is P0
> rather than administrative overhead.

This project treats Salesforce administration as including **governance**, not merely
configuration: requirement → design → review → development → source control → validation →
testing → deployment approval → release notes → rollback → post-deployment verification →
documentation update.

---

## Implementation Roadmap

> 🔒 **Populated in Phase 0D.** → `docs/implementation-roadmap.md`

| Phase | Name | Status |
|---|---|---|
| 0 | Discovery, Requirements & Architecture | 🟡 In Progress (0A) |
| 1 | Salesforce Foundation & Security | ⬜ Not Started |
| 2 | Synthetic Data & Deterministic Test Fixtures | ⬜ Not Started |
| 3 | Revenue Data Quality Framework | ⬜ Not Started |
| 4 | Account Identity & Matching Engine | ⬜ Not Started |
| 5 | ICP Intelligence & Qualification | ⬜ Not Started |
| 6 | Lifecycle Governance | ⬜ Not Started |
| 7 | Segmentation & Territory Management | ⬜ Not Started |
| 8 | Revenue Routing Engine | ⬜ Not Started |
| 9 | Revenue SLA & Exception Framework | ⬜ Not Started |
| 10 | Salesforce Reporting & Operational Analytics | ⬜ Not Started |
| 11 | Revenue Intelligence Model & Power BI | ⬜ Not Started |
| 12 | Integrated Testing, Security Validation & Hardening | ⬜ Not Started |
| 13 | Executive Demo & Portfolio Release | ⬜ Not Started |

---

## Four-Day Delivery Strategy

> 🔒 **Detailed in Phase 0D.**

The roadmap phases are logical, not calendar days. The intended build is approximately four
focused days:

| Day | Focus |
|---|---|
| 1 | Phase 0 + Salesforce Foundation + Security Foundation |
| 2 | Synthetic Data → Data Quality → Account Matching → ICP → Lifecycle |
| 3 | Segmentation → Territories → Routing → SLA → Exceptions → Operational Reporting |
| 4 | Power BI → Integrated Testing → Security Validation → Hardening → Documentation → Evidence → Demo → Release |

Future enhancements must not threaten the Day 4 release.

---

## Architecture Decisions

> → [`docs/ADR/`](docs/ADR/)

| ADR | Title | Status |
|---|---|---|
| ADR-0001 | Metadata-Driven Revenue Architecture | ⬜ Planned — Phase 0D |

---

## Current Project Status

| Item | State |
|---|---|
| Phase | **0C — Requirements & Governance** |
| Repository foundation | ✅ Created |
| Salesforce DX project | ✅ Valid scaffold (`sf` CLI generated) |
| Git repository | ✅ Initialized on `main` |
| Enterprise discovery | ✅ 11 documents — [`docs/discovery/`](docs/discovery/) |
| Requirements (`BR-###`) | ✅ 62 written — **0 `Approved`** |
| Open decisions (`DEC-###`) | 🔵 **22 identified, 0 resolved** — awaiting human decision |
| Personas (`PER-##`) | ✅ 17 defined |
| Governed KPIs (`KPI-###`) | ✅ 15 defined — **0 targets set, 0 implemented** |
| Data dictionary | ✅ 49 field proposals — **0 fields created** |
| Access model | 🔵 Candidate + recommendation — **`DEC-021` open, nothing configured** |
| Architecture / ADRs | ❌ None — Phase 0D |
| Committed | ✅ Phase 0A + 0B checkpoint (`684da8c`); **Phase 0C uncommitted** |
| Pushed to GitHub | ❌ Not yet — **no remote configured** |
| Salesforce authentication | ❌ Not performed |
| Salesforce deployment | ❌ Not performed |
| Business metadata | ❌ None created |
| Synthetic dataset | ❌ None generated |
| Power BI artifacts | ❌ None created |
| Data Cloud / Agentforce | ❌ Out of scope by design |

---

## Synthetic Data Disclaimer

**All data, companies, contacts, metrics, and scenarios in this repository are entirely fictional
and synthetically generated.**

NorthstarIQ is an invented company. No real customer data, no real personal data, and no real
organizational data is present anywhere in this repository. Any resemblance to real companies or
individuals is coincidental.

Baseline metrics are labelled **Synthetic Baseline** and were invented to make the fictional
scenario coherent. They must not be interpreted as measurements from any real organization.

---

## Portfolio Evidence

> 🔒 **Framework defined in Phase 0D.** → [`docs/portfolio/`](docs/portfolio/)

**Documentation alone does not prove implementation.** Claims in this repository are backed by
source-controlled metadata, test matrices with recorded results, validation queries, and
architecture diagrams — or they are explicitly labelled as planned.

---

## Future Expansion

Future expansion opportunities may include **Salesforce Data Cloud** and **Salesforce Agentforce**.
They are intentionally outside the scope of the current portfolio release.

---

<sub>Built with Salesforce Sales Cloud · Salesforce DX · Power BI · D2 · Python · Git · GitHub ·
VS Code · Claude Code. All data synthetic. Fictional company.</sub>
