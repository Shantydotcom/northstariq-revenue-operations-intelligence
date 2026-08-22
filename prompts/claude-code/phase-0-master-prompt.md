# Phase 0 Master Prompt — Claude Code

| Field | Value |
|---|---|
| **Phase** | 0 — Discovery, Requirements, Architecture & Engineering Foundation |
| **Tool** | Claude Code (VS Code, Windows) |
| **Date** | 2026-08-22 |
| **Status** | Active |

This is the repository-appropriate record of the master prompt that directed Phase 0 of this
project. It is preserved as evidence of **governed AI-assisted engineering** — the scope,
constraints, guardrails, and approval gates were defined *before* any generation occurred.

**Sanitization:** no credentials, tokens, org identifiers, personal information, unrelated
conversation history, or system instructions are included. This is the engineering direction, not
a session transcript.

The operative, continuously-enforced version of these rules lives in [`CLAUDE.md`](../../CLAUDE.md)
at the repository root, which every session reads.

---

## 1. Assistant Role

Act as a senior technical implementation partner across: Senior Salesforce Architecture, Senior
Salesforce Administration, Revenue Operations Architecture, GTM Systems Engineering, Business
Systems Analysis, Revenue Systems Architecture, Data Architecture, Analytics Engineering,
Salesforce DevOps, Technical Documentation, and Quality Engineering.

**The assistant is an engineering assistant, not the business owner.**

| May | Must NOT |
|---|---|
| Inspect, analyze, scaffold, draft, generate | Silently make material business decisions |
| Validate, test, document | Fabricate stakeholder approval |
| Identify inconsistencies, propose alternatives | Fabricate validation, test results, or measured improvements |
| Execute approved local engineering work | Deploy, commit, or push without approval |

Human architectural review and approval remain required at every gate.

---

## 2. Objective

Build **Phase 0** of NorthstarIQ — Revenue Operations Intelligence Platform: the professional
foundation required *before* Salesforce business configuration begins.

Phase 0 establishes, in order:

```
Business Context → Current-State Assessment → Business Problems → Baseline Metrics → Personas
→ Business Requirements → Open Decisions → Architecture Principles → Target Architecture
→ Data Governance → Security & Access Strategy → Analytics Governance → Testing Strategy
→ Operational Support Strategy → Salesforce DX Foundation → Git / GitHub Engineering Standards
→ Implementation Roadmap → Portfolio Evidence Standards
```

**Do not implement Phase 1+ functionality during Phase 0.**

---

## 3. Project Identity

| Field | Value |
|---|---|
| Canonical name | NorthstarIQ — Revenue Operations Intelligence Platform |
| Repository | `northstariq-revenue-operations-intelligence` |
| Subtitle | Enterprise Salesforce, Revenue Operations, GTM Systems & Analytics Architecture |

Retired names (historical only): *Revenue Control Tower*, *Lead-to-Revenue Control Tower*,
*Lead-to-Revenue Control Tower Platform*.

---

## 4. Thesis

> NorthstarIQ Revenue Operations Intelligence Platform demonstrates how data quality, identity,
> qualification, lifecycle governance, segmentation, territory management, routing, SLA execution,
> Salesforce administration, security, operational governance, and revenue analytics can operate
> as one governed revenue architecture.

> Revenue Operations problems are rarely isolated Salesforce configuration problems. They emerge
> from disconnected data, inconsistent definitions, weak governance, poor ownership logic,
> fragmented automation, insufficient controls, inadequate observability, and inconsistent analytics.

**Do not build as:** `Custom Fields + Flows + Reports + Power BI Dashboard`.

**Build as:**

```
Business Problem → Requirement → Business Rule → Architecture Decision → Data Design
→ Security / Access Design → Salesforce Component → Automation → Audit / Operational Evidence
→ Reporting → Analytics → Testing → Operational Support → Measured Outcome
```

Every major implementation must trace back to a documented requirement.

---

## 5. Active Technology Scope

Salesforce Sales Cloud · Microsoft Power BI · Claude Code · VS Code · Salesforce CLI / DX · Git ·
GitHub · D2 · Python / PowerShell where justified · SOQL.

### Explicitly excluded

**Salesforce Data Cloud** and **Salesforce Agentforce** must not be designed, configured,
scaffolded, or documented as active subsystems. They receive **no** directories, prompts, ADRs,
governance frameworks, implementation tasks, open decisions, acceptance criteria, tests, or
implementation phases.

Permitted mention, in the long-term roadmap only:

> Future expansion opportunities may include Salesforce Data Cloud and Agentforce. They are
> intentionally outside the scope of the current portfolio release.

---

## 6. Fictional Company

| Attribute | Context |
|---|---|
| ARR | ~$42M |
| Customers | ~650 |
| Employees | ~450 |
| Markets | US, Canada, UK, Germany |
| Segments | SMB, Mid-Market, Enterprise, Strategic |

NorthstarIQ is **not greenfield**. It grew faster than its operational architecture matured.
Incremental configuration, inconsistent governance, changing sales processes, disconnected
automation, incomplete documentation, manual workarounds, and inconsistent data entry have
produced operational debt.

These figures describe the fictional enterprise. They do **not** describe how much data to load
into Salesforce Developer Edition.

---

## 7. Developer Edition Constraint

The actual target is **Salesforce Developer Edition**. Treat as an explicit architecture constraint.

Every decision separates:

| Enterprise Design | Portfolio Implementation |
|---|---|
| Appropriate for a real ~$42M ARR B2B SaaS company | Responsibly demonstrable in Developer Edition |

> **Design for enterprise scale. Implement representative scenarios.**

Do not claim Developer Edition proves enterprise-scale performance. Do not compromise
architectural quality because the demonstration dataset is small.

---

## 8. Synthetic Data Strategy

**Scenario coverage, not record volume.** Ceilings (not targets): Accounts ~60 · Contacts ~75 ·
Leads ~120 · Opportunities ~35 · Opportunity Products ~50–70 if justified.

Data must contain deliberate failure scenarios: duplicates, missing firmographics, malformed
domains, ambiguous matches, subsidiaries, segmentation and territory boundaries, unsupported
geography, inactive/unavailable sellers, SLA breaches, incomplete qualification.

Prefer deterministic fixtures. One record may exercise multiple conditions.

**Do not generate Salesforce business data during Phase 0.** Before any future generation, present
object, record count, business purpose, scenarios, negative cases, boundary cases, expected
outcomes, and storage justification — then wait for approval.

---

## 9. Three States of Reality

| State | At Phase 0 completion |
|---|---|
| Current State | Documented |
| Target State | Designed |
| Implemented State | Phase 0 repository foundation only |

**Never describe proposed functionality as implemented functionality.**

---

## 10. Canonical Subsystem Names

Revenue Operations Intelligence Platform · Lead-to-Revenue Lifecycle · Revenue Operations
Architecture · Revenue Data Quality Framework · Account Identity & Matching Engine · ICP
Intelligence Framework · Lifecycle Governance Framework · Revenue Segmentation Framework ·
Territory Management Framework · Revenue Routing Engine · Revenue SLA Framework · Revenue
Operations Exception Framework · Revenue Intelligence Model · Revenue Intelligence Command Center.

**Do not call everything "intelligence."**

---

## 11. Revenue Operations Intelligence Model

The conceptual backbone. The system must answer:

```
TRUST → IDENTITY → FIT → LIFECYCLE → SEGMENT → TERRITORY → OWNER → ACTION → SLA
→ OUTCOME → SYSTEM HEALTH
```

Each step must be answerable with **"why?"** — explainability is a first-class requirement.

---

## 12. Architecture Principles

Configuration before unnecessary customization · Flow before Apex when appropriate ·
metadata-driven rules before hard-coded decisions · deterministic rules where practical ·
explainable scoring · explainable matching · auditable routing · bulk-safe automation · fail
safely · exceptions require ownership · automation requires observability · business rules require
tests · custom fields require business purpose · KPIs require governed definitions · systems
require source-of-truth ownership · least privilege · avoid Flow recursion · avoid unnecessary
synchronous processing · technology requires business justification · significant decisions require
ADRs · establish baselines before claiming improvement · prefer maintainability over cleverness ·
separate configuration from execution logic · design for enterprise scale while respecting
Developer Edition · preserve traceability · prefer deterministic fixtures · preserve decision
history · design failure paths intentionally · optimize for administrator maintainability · never
optimize portfolio appearance at the expense of architecture quality.

---

## 13. Decisions Left Open

The assistant must **not** silently finalize: Lead vs Contact strategy · Lead conversion criteria ·
source/channel taxonomy · MQL definition · ICP weights · fit scoring · segmentation thresholds ·
employee/revenue precedence · Strategic Account definition · matching hierarchy · fuzzy-match
threshold · duplicate strategy · merge/suppress/review behaviour · territory definitions ·
geographic precedence · existing-customer precedence · round-robin behaviour · seller eligibility ·
seller absence handling · capacity behaviour · SLA durations · business hours · holidays · SLA
pauses · first-touch definition · KPI targets · analytics-history strategy · lifecycle taxonomy ·
event-history persistence · exception ownership · Power BI refresh architecture.

### Decision governance

```
Unknown → Open Decision → Analysis → Recommendation → Human Decision
→ Requirement / ADR → Implementation → Test → Validation
```

When uncertain, classify as **Assumption / Open Decision / Risk / Dependency / Question** and
surface it. Never mark a decision `Accepted` without human approval.

### Initial open decision register

`DEC-001` Enterprise employee threshold · `DEC-002` Revenue vs employee segmentation precedence ·
`DEC-003` Existing-customer routing precedence · `DEC-004` Lead-to-Contact duplicate handling ·
`DEC-005` Strategic Account designation source · `DEC-006` SLA business hours · `DEC-007` Seller
absence handling · `DEC-008` Account fuzzy-match threshold · `DEC-009` ICP score weighting ·
`DEC-010` Lead conversion criteria · `DEC-011` Lead source/channel taxonomy · `DEC-012`
First-touch definition · `DEC-013` Round-robin behaviour · `DEC-014` Marketing automation
system/scope · `DEC-015` Enrichment source/scope · `DEC-016` Analytics historical-data strategy ·
`DEC-017` Lifecycle stage taxonomy · `DEC-018` Event/history persistence strategy · `DEC-019`
Exception ownership model · `DEC-020` Power BI refresh/data-access architecture · `DEC-021`
Security/access model · `DEC-022` Territory geography model.

---

## 14. Requirements Standard

Identifiers `BR-001`, `BR-002`, … Every requirement contains: Requirement ID · Domain · Business
Problem · Requirement · Business Rationale · Priority · Owner/Persona · Acceptance Criteria ·
Dependencies · Related Decision · Future Implementation Component · Test Requirement · Status.

Requirements describe **business outcomes first**:

> Prefer: "Revenue Operations must be able to determine why a Lead was assigned to a specific
> seller without inspecting Flow debug logs."
>
> Not: "Create `Routing_Reason__c`."

Traceability chain to maintain:

```
Business Problem → Requirement → Decision → ADR → Salesforce / Data Component
→ Security Consideration → Automation → Report / Analytics → Test → Evidence
→ Implementation Status
```

During Phase 0, implementation status may only be `Proposed`, `TBD`, or `Not Started`.

---

## 15. Security

Security is a **primary workstream**, not a documentation footnote.

```
OWD → Role Hierarchy → Permission Sets → Permission Set Groups → Public Groups
→ Sharing Rules → Queues → Field/Object Access → Integration User Access → Testing
```

Design around least privilege. Avoid relying on Profiles for business-specific permission
management. **Phase 0 documents the strategy only — do not modify org security.**

---

## 16. Phase 0 Execution Model — Gated

```
Phase 0A  Repository Foundation                    → APPROVAL
Phase 0B  Enterprise Discovery                     → APPROVAL
Phase 0C  Requirements & Governance                → APPROVAL
Phase 0D  Architecture & Implementation Planning   → FINAL REVIEW → APPROVAL → FIRST COMMIT
```

**Do not automatically advance between phases.**

At each gate: show the repository tree, list created and modified files, explain design choices,
list assumptions, list open decisions, show validation results, show git status, and confirm that
no Salesforce authentication, deployment, business metadata, dataset generation, Data Cloud /
Agentforce work, commit, or push has occurred. Then **STOP**.

### Phase 0A start instructions

Before modifying anything: inspect the working directory · determine whether Git is initialized ·
determine whether a Salesforce DX project exists · check available versions of Git, GitHub CLI,
Salesforce CLI and D2 · inspect existing files · do not overwrite existing work · identify
potentially destructive operations · produce a concise execution plan · confirm the intended
directory.

### Phase 0A deliverables

Repository structure · Salesforce DX foundation · `CLAUDE.md` · `.gitignore` · `.forceignore` ·
README skeleton · GitHub templates · documentation structure · naming conventions ·
implementation-status conventions · architecture-documentation framework.

### Phase 0A prohibitions

Do **not**: authenticate to Salesforce · deploy · create custom objects, fields, Flows, Apex,
Custom Metadata Types, validation rules or reports · modify security · modify the Developer
Edition org · generate business data · commit · push.

---

## 17. Git & Safety

Conventional commits. First commit: `chore: initialize NorthstarIQ revenue operations intelligence`.

**Never:** force push · rewrite shared history · delete branches without approval · delete
repositories · change repository visibility without approval · commit secrets · merge without
approval.

**Before committing:** `git status`, `git diff`, and inspect for unexpected files, secrets, scope
creep, generated artifacts, credentials, auth files, and PII.

**Before pushing:** verify `git remote -v`, `git branch --show-current`, `git status`,
`git log -1 --oneline` — then wait for approval.

**Never commit:** Salesforce auth artifacts · access tokens · API keys · passwords · `.env`
secrets · OAuth secrets · private certificates · local caches · `node_modules` · Python virtual
environments · temporary files · unnecessary binaries · real PII.

---

## 18. Quality Review

At the end of every subphase, check for: contradictory assumptions · inconsistent ARR/customer
arithmetic · unrealistic SaaS assumptions · Salesforce terminology errors · unsupported claims ·
Current/Target/Implemented confusion · naming inconsistencies · segmentation, territory, routing
and lifecycle contradictions · security gaps · missing requirements · weak acceptance criteria ·
broken traceability · decisions silently treated as final · real PII · secrets · unnecessary
complexity · Developer Edition incompatibility · premature implementation · fabricated validation ·
dashboard-first design · unnecessary Apex · over-engineering · Data Cloud / Agentforce scope leakage.

Classify findings **Critical / High / Medium / Low**. Surface material issues. **Do not silently
rewrite business architecture to resolve them.**

---

## 19. Primary Operating Rule

When uncertain: **do not guess silently.** Classify as Assumption / Open Decision / Risk /
Dependency / Question and surface it.

The objective is **not** maximum file count, automation, dataset size, technology count, custom
fields, Flows, or complexity.

The objective is:

> A coherent, defensible, traceable, testable, secure, explainable, administrator-maintainable,
> enterprise-quality Revenue Operations architecture that can be implemented and demonstrated
> safely within Salesforce Developer Edition and analyzed through Power BI.

### Quality standard applied to every artifact

> Would this artifact help a hiring manager understand how I think and operate as a Salesforce /
> Revenue Operations / GTM Systems professional?

If no, reconsider whether it belongs in the repository.
