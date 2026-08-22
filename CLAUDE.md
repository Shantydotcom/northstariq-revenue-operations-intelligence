# CLAUDE.md — Engineering Operating Contract

**Project:** NorthstarIQ — Revenue Operations Intelligence Platform
**Repository:** `northstariq-revenue-operations-intelligence`
**Subtitle:** Enterprise Salesforce, Revenue Operations, GTM Systems & Analytics Architecture

This file governs how AI-assisted engineering is performed in this repository. It is
binding on every session. Read it before making any change.

The repository is intended to demonstrate **governed AI-assisted engineering**, not
blind AI generation. That distinction is itself part of the portfolio evidence.

---

## 1. Project Context

NorthstarIQ is a **fictional** B2B SaaS company used as the setting for a portfolio-quality
Revenue Operations architecture.

| Attribute | Context |
|---|---|
| ARR | ~$42M |
| Customers | ~650 |
| Employees | ~450 |
| CRM | Salesforce Sales Cloud |
| Analytics | Microsoft Power BI |
| Markets | US, Canada, UK, Germany |
| Segments | SMB, Mid-Market, Enterprise, Strategic |

These figures describe the **fictional enterprise**. They do **not** describe how much data
should be loaded into Salesforce Developer Edition. See §10.

The scenario: NorthstarIQ is not greenfield. It grew faster than its operational architecture
matured. Years of incremental configuration, inconsistent governance, changing sales processes,
disconnected automation, incomplete documentation, and manual workarounds have created
operational debt. The work is to assess that debt and design a governed replacement.

---

## 2. Project Thesis

> NorthstarIQ Revenue Operations Intelligence Platform demonstrates how data quality, identity,
> qualification, lifecycle governance, segmentation, territory management, routing, SLA execution,
> Salesforce administration, security, operational governance, and revenue analytics can operate
> as one governed revenue architecture.

The central idea:

> Revenue Operations problems are rarely isolated Salesforce configuration problems. They emerge
> from disconnected data, inconsistent definitions, weak governance, poor ownership logic,
> fragmented automation, insufficient controls, inadequate observability, and inconsistent analytics.

**Therefore this project is NOT built as:**

```
Custom Fields + Flows + Reports + Power BI Dashboard
```

**It is built as:**

```
Business Problem → Requirement → Business Rule → Architecture Decision → Data Design
→ Security / Access Design → Salesforce Component → Automation → Audit / Operational Evidence
→ Reporting → Analytics → Testing → Operational Support → Measured Outcome
```

**Every major implementation must trace back to a documented requirement.** If you cannot name
the `BR-###` a change serves, the change is not ready to be made.

---

## 3. Portfolio Purpose

This repository must produce evidence of competence for roles including: Salesforce Administrator
(through Lead), Salesforce Business Systems Analyst, Revenue Operations Analyst / Manager, Sales
Operations, GTM Systems Administrator / Engineer, Revenue Systems Analyst / Architect, Business
Systems Analyst, Revenue Technology, and Revenue Analytics / BI.

Optimize every decision for **evidence of real-world competence** in those areas — not for
technology novelty, file count, or apparent complexity.

The quality bar for any artifact:

> Would this help a hiring manager understand how I think and operate as a Salesforce /
> Revenue Operations / GTM Systems professional?

If no, reconsider whether it belongs in the repository.

---

## 4. Active Technology Scope

| Capability | Technology |
|---|---|
| Transactional CRM | Salesforce Sales Cloud |
| Analytics / BI | Microsoft Power BI |
| Engineering assistant | Claude Code |
| Development environment | VS Code |
| Salesforce development | Salesforce CLI / Salesforce DX |
| Source control | Git |
| Remote repository | GitHub |
| Architecture diagrams | D2 |
| Supporting scripts | Python / PowerShell **where justified** |
| Query validation | SOQL |

**Verified local toolchain (2026-08-22):** git 2.55.0 · gh 2.98.0 · @salesforce/cli 2.148.3 ·
d2 0.7.1 · Python 3.14.7 · Node 24.19.0

Adding any technology beyond this list requires documented business justification.

---

## 5. Explicitly Deferred Technology

**Salesforce Data Cloud** and **Salesforce Agentforce** are OUT OF SCOPE for the current release.

They must **not** appear as active components, and must **not** receive: directories, prompts,
ADRs, governance frameworks, implementation tasks, open decisions, acceptance criteria, tests,
requirements, or implementation phases.

The only permitted mention is a brief line in the long-term roadmap and README:

> Future expansion opportunities may include Salesforce Data Cloud and Agentforce. They are
> intentionally outside the scope of the current portfolio release.

Nothing more. Treat any drift toward these technologies as a scope-leakage defect.

---

## 6. Naming Taxonomy (Canonical)

Use these names exactly. Consistent naming is a graded portfolio signal.

| Capability | Canonical Name |
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

**Do not call everything "intelligence."** The word is reserved for the platform, the analytics
model, the Command Center, and the ICP Intelligence Framework.

**Retired names.** Do not use `Revenue Control Tower`, `Lead-to-Revenue Control Tower`, or
`Lead-to-Revenue Control Tower Platform` except when explicitly documenting historical naming.

---

## 7. Revenue Operations Intelligence Model

Revenue Operations Intelligence is the ability to transform operational data into **governed,
explainable, actionable and measurable** revenue decisions.

The system must eventually answer, in order:

```
TRUST        Can this data be trusted?
IDENTITY     Who is this? Have we seen them? Which Account? Already a customer?
FIT          Does the organization match our ICP? Why?
LIFECYCLE    Where are they in the revenue lifecycle? Why?
SEGMENT      Which segment applies? Why?
TERRITORY    Which territory applies? Why?
OWNER        Who should own this? Was that seller eligible? Why were they selected?
ACTION       What needs to happen next?
SLA          When must it happen? Did it happen?
OUTCOME      Did the record progress? Opportunity created? Revenue generated?
SYSTEM HEALTH Where are operational failures occurring?
```

Note the recurring **"Why?"** — explainability is a first-class requirement, not a nice-to-have.

---

## 8. Architecture Principles

1. Configuration before unnecessary customization.
2. Flow before Apex when appropriate.
3. Metadata-driven rules before hard-coded decisions.
4. Deterministic rules where practical.
5. Explainable scoring.
6. Explainable matching.
7. Auditable routing.
8. Bulk-safe automation.
9. Fail safely.
10. Exceptions require ownership.
11. Automation requires observability.
12. Business rules require tests.
13. Custom fields require business purpose.
14. KPIs require governed definitions.
15. Systems require source-of-truth ownership.
16. Least privilege.
17. Avoid Flow recursion.
18. Avoid unnecessary synchronous processing.
19. Technology requires business justification.
20. Significant architecture decisions require ADRs.
21. Establish baselines before claiming improvement.
22. Prefer maintainability over cleverness.
23. Separate configuration from execution logic.
24. Design for enterprise scale while respecting Developer Edition.
25. Preserve traceability.
26. Prefer deterministic test fixtures.
27. Preserve decision history.
28. Design failure paths intentionally.
29. Optimize for administrator maintainability.
30. Never optimize portfolio appearance at the expense of architecture quality.

---

## 9. System-of-Record Principle

**Salesforce Sales Cloud** is the transactional system of record for Leads, Accounts, Contacts,
Opportunities, seller ownership, core sales execution, operational assignment state, and relevant
SLA state.

**Power BI** is the analytics and decision-support layer. **Power BI is not the transactional
system of record.** It does not own operational state and must not be positioned as writing back.

Any system whose ownership is unclear becomes an **Open Decision**, not an assumption.

---

## 10. Developer Edition Constraint

The actual Salesforce target is **Salesforce Developer Edition**. Treat this as an explicit
architecture constraint present in every design conversation.

Every implementation decision must separate:

| Enterprise Design | Portfolio Implementation |
|---|---|
| What is appropriate for a real ~$42M ARR B2B SaaS company | What can responsibly be demonstrated in Developer Edition |

Operating phrase:

> **Design for enterprise scale. Implement representative scenarios.**

Rules:
- Do **not** claim the Developer Edition implementation proves enterprise-scale performance.
- Do **not** compromise architectural quality because the demonstration dataset is small.
- Respect Developer Edition limits (storage, licences, feature availability) in every design.
- Where a design would require an edition feature Developer Edition lacks, document the gap
  rather than silently substituting a lesser design.

---

## 11. Three States of Reality

Every artifact must clearly distinguish:

| State | Meaning |
|---|---|
| **Current State** | The fictional environment being assessed |
| **Target State** | The architecture being proposed |
| **Implemented State** | What actually exists and has been validated |

**Never describe proposed functionality as implemented functionality.** This is the single
easiest way to destroy the credibility of a portfolio repository.

At Phase 0 completion:

```
Current State     = Documented
Target State      = Designed
Implemented State = Phase 0 repository foundation only
```

---

## 12. Repository Conventions

### Structure

```
docs/          discovery, requirements, architecture, governance, security,
               analytics, testing, runbooks, portfolio, ADR, data-dictionary
force-app/     Salesforce DX source (empty until Phase 1)
config/        scratch org definitions
manifest/      package.xml manifests
data/          synthetic datasets: source, broken, clean, expected, reference, analytics
tests/         test matrices & fixtures by domain
powerbi/       model, dax, powerquery, documentation (text artifacts only)
scripts/       python, powershell, soql
prompts/       preserved AI prompts (governed AI-assisted engineering evidence)
.github/       PR template, issue templates, workflows
```

### Documentation rules

- Markdown for all documentation. Use tables for structured data.
- Every document opens with a **status header** (see §13).
- Never state a number without labelling its provenance (§14).
- Cross-reference by identifier (`BR-001`, `DEC-001`, `ADR-0001`, `TEST-001`), never by
  "the requirement above."
- Update documentation in the same change as the architecture it describes. Never separately.

### Identifier conventions

| Prefix | Meaning | Example |
|---|---|---|
| `BR-###` | Business Requirement | `BR-001` |
| `DEC-###` | Open Decision | `DEC-001` |
| `ADR-####` | Architecture Decision Record | `ADR-0001` |
| `TEST-###` | Test case | `TEST-001` |
| `KPI-###` | Governed KPI definition | `KPI-001` |
| `RISK-###` | Risk register entry | `RISK-001` |
| `ASM-###` | Assumption | `ASM-001` |

Identifiers are **immutable once assigned**. Never renumber. If an item is withdrawn, mark it
`Withdrawn` and keep the identifier retired.

---

## 13. Implementation Status Convention

Every documented capability carries exactly one status:

| Status | Meaning |
|---|---|
| `Proposed` | Described in documentation; not agreed |
| `Open Decision` | Requires a human decision before it can proceed |
| `Approved` | Human-approved; ready to implement |
| `Not Started` | Approved but no implementation work has begun |
| `In Progress` | Implementation underway |
| `Implemented` | Exists in the org / repository |
| `Validated` | Implemented **and** evidenced by a passing test with recorded evidence |
| `Withdrawn` | Deliberately abandoned; retained for decision history |

**`Implemented` requires artifacts. `Validated` requires evidence.** Documentation alone never
justifies either. See §21.

---

## 14. Data Provenance Labels

Every number in this repository carries a provenance label. No exceptions.

| Label | Meaning |
|---|---|
| `Known Context` | Given in the project brief (e.g. ~$42M ARR, ~650 customers) |
| `Synthetic Planning Assumption` | Invented to make the fictional model coherent |
| `Synthetic Baseline` | Invented "current state" metric for the fictional company |
| `Assumption` | Believed true; unverified |
| `Finding` | Established through analysis within this project |
| `Open Question` | Unresolved |
| `Actual Measured Result` | Produced by a real test run in this repository |

**There are no `Actual Measured Result` values during Phase 0.**

Never imply a synthetic baseline came from a real organization. Always validate arithmetic —
inconsistent ARR/customer/ACV math is a Critical quality-review finding.

---

## 15. Git Rules

- Branch: `main`. Feature branches use `feat/`, `docs/`, `fix/`, `test/`, `chore/`.
- **Conventional commits**, imperative mood, lowercase after the type.
  - `chore: initialize NorthstarIQ revenue operations intelligence`
  - `docs: add revenue operations discovery`
  - `feat: implement revenue routing engine`
  - `test: add routing boundary scenarios`
- **Before every commit:** run `git status` and `git diff` and *actually read the diff*.
  Inspect for: unexpected files, secrets, auth artifacts, PII, generated artifacts, scope creep.
- **Before every push:** verify `git remote -v`, `git branch --show-current`, `git status`,
  `git log -1 --oneline`.

**Never**, under any circumstance:
- force push
- rewrite shared history
- delete branches without approval
- delete repositories
- change repository visibility without approval
- commit secrets
- merge without approval

Commits and pushes both require **explicit human approval**. Staging changes is not approval
to commit; committing is not approval to push.

---

## 16. Salesforce Rules

- **No org modification without explicit approval.** This includes authentication, deployment,
  security changes, and data loads.
- Prefer declarative configuration. Custom objects and fields require a documented business
  purpose and a `BR-###`.
- Every custom field must appear in `docs/data-dictionary/data-dictionary.md` before it is built.
- Retrieve and commit metadata as source. Never treat the org as the source of truth.
- Respect `.forceignore`. Do not add blanket ignores that would silently exclude project
  deliverables (see the explicit list at the bottom of `.forceignore`).

### Flow rules

- **Prefer Flow over Apex** when Flow reasonably satisfies the requirement.
- **Do NOT add Apex simply to make the repository appear more technical.** Apex requires
  justification recorded in an ADR.
- Choose before-save vs after-save deliberately and record the reasoning.
- Every Flow must have **fault paths**. Fault handling is part of Flow design, not an add-on.
- Design for **bulk safety**. Avoid DML/queries inside loops.
- **Avoid recursion.** Use entry criteria and change-detection rather than uncontrolled re-entry.
- Drive rules from **Custom Metadata Types** rather than hard-coding thresholds in Flow.
- Every Flow must write **explainability output** (reason, timestamp, confidence) so a RevOps
  user can answer "why did this happen?" without reading debug logs.
- Flows require tests. See §19.

---

## 17. Data Rules

- **All data in this repository is fictional.** Never use real customer data or real PII.
- Goal is **scenario coverage, not record volume.**
- Approximate ceilings (these are ceilings, **not targets** — smaller is better if coverage holds):

  | Object | Ceiling |
  |---|---|
  | Accounts | ~60 |
  | Contacts | ~75 |
  | Leads | ~120 |
  | Opportunities | ~35 |
  | Opportunity Products | ~50–70 (only if justified) |
  | Users | minimum necessary |
  | Reference / configuration records | minimum necessary |

- Prefer **deterministic fixtures** over random generation. One record may deliberately exercise
  multiple conditions.
- Data must include engineered failure scenarios (duplicates, missing firmographics, malformed
  domains, ambiguous matches, boundary segmentation/territory values, inactive sellers, SLA
  breaches, incomplete qualification).
- **Before generating any dataset**, present: object, record count, business purpose, scenarios
  represented, negative cases, boundary cases, expected outcomes, and Salesforce storage
  justification — then **wait for approval**.
- Do **not** load large synthetic history into Developer Edition to make Power BI charts look
  populated. Analytical history, if needed, lives in `data/analytics/`.

---

## 18. Security Rules

Security is a **primary workstream**, not a documentation footnote.

- Design around **least privilege**.
- Layer: OWD → Role Hierarchy → Permission Sets → Permission Set Groups → Public Groups →
  Sharing Rules → Queues → Field/Object Access → Integration User Access → Testing.
- Manage business permissions through **permission sets**, not profiles.
- The integration user gets its own explicitly scoped access — never an admin profile.
- Field-level security and PII classification are documented in the data dictionary.
- **Never** expose credentials, tokens, auth URLs, certificates, or `.env` contents.
- Security requires **testing**, not just design. Access assumptions must be verified.

---

## 19. Testing Rules

- Every business rule requires a test.
- Test record format: `Test ID | Requirement ID | Scenario | Known Input | Expected Result |
  Actual Result | PASS / FAIL | Evidence`.
- Prefer deterministic fixtures with pre-computed expected results.
- **Never fabricate test results.** `Actual Result` is populated only by an actual run.
- An untested rule is `Implemented`, never `Validated`.

---

## 20. Analytics Rules

- Salesforce operational reporting serves operators; Power BI serves analysis and executives.
- Every KPI requires a governed definition: `KPI ID, Name, Business Question, Definition,
  Numerator, Denominator, Grain, Filters, Exclusions, Source, Owner, Refresh Expectation,
  Target, Baseline, Implementation Status`.
- Distinguish **Synthetic Baseline** vs **Proposed Target** vs **Actual Measured Result**.
- Power BI model artifacts are version-controlled as **text** (`.tmdl`/`.bim`/`.pq`/`.dax`).
  `.pbix` binaries are git-ignored — they cache data and can embed credentials.
- **Dashboard-first design is a defect.** Analytics follows from governed definitions and
  analytics-ready data design, not the reverse.

---

## 21. Evidence Standard

**Documentation alone does NOT prove implementation.**

Acceptable evidence: Salesforce metadata in source control, Flow metadata, Custom Metadata
records, test fixtures, validation queries, Flow tests, SOQL results, screenshots, D2 diagrams,
test matrices, Power BI model documentation, DAX, implementation notes, demo scripts, and
before/after synthetic metrics where methodologically valid.

---

## 22. Decision Governance

```
Unknown → Open Decision → Analysis → Recommendation → Human Decision
→ Requirement / ADR → Implementation → Test → Validation
```

When uncertain, classify the item as one of: **Assumption**, **Open Decision**, **Risk**,
**Dependency**, **Question** — and surface it.

**Do NOT silently resolve material uncertainty.**

A decision is `Accepted` **only** after explicit human approval. Recording a recommendation is
not the same as recording a decision. Never fabricate stakeholder approval — there are no
stakeholders; there is one human reviewer.

---

## 23. Deployment Controls

| Action | Requires |
|---|---|
| Create/modify local files | Normal working authority |
| `git add` / stage | Normal working authority |
| `git commit` | **Explicit approval** |
| `git push` | **Explicit approval** |
| Create GitHub repository | **Explicit approval** |
| Change repository visibility | **Explicit approval** |
| `sf org login` (authenticate) | **Explicit approval** |
| `sf project deploy` | **Explicit approval** |
| Any org data load | **Explicit approval** |
| Any security/sharing change in org | **Explicit approval** |

Phase gates (`0A → 0B → 0C → 0D`) are **stop points**. Do not automatically advance.

---

## 24. Guardrails — Non-Negotiable

1. Never silently invent material business rules.
2. Record unresolved decisions.
3. Never use real PII.
4. Never expose credentials.
5. Never deploy without approval.
6. Never generate large Salesforce datasets.
7. Never claim planned capabilities are implemented.
8. Never hard-code configurable rules without justification.
9. Never add technology without business justification.
10. Never modify architecture without updating documentation.
11. Never commit without reviewing changes.
12. Never push without approval.
13. Preserve requirements traceability.
14. Preserve Developer Edition compatibility.
15. Prefer deterministic representative datasets.
16. Preserve canonical terminology.
17. Never fabricate test results.
18. Never fabricate stakeholder approval.
19. Separate synthetic baselines from measured results.
20. Surface uncertainty instead of silently resolving it.
21. Prefer Flow over Apex when requirements allow.
22. Design security around least privilege.
23. Treat fault handling as part of Flow design.
24. Preserve administrator maintainability.
25. Do not introduce Data Cloud or Agentforce into the active implementation.

---

## 25. Assistant Role Boundaries

**May:** inspect, analyze, scaffold, draft, generate, validate, test, document, identify
inconsistencies, propose alternatives, execute approved local engineering work, run local
validation, review diffs, check traceability, maintain documentation, and perform Git and
Salesforce CLI operations **when approved**.

**Must NOT:** silently invent business decisions, fabricate stakeholder approval, fabricate
validation, fabricate test results, fabricate measured improvements, expose secrets, deploy
without approval, push without approval, generate oversized datasets, misrepresent implementation
state, perform destructive Git operations, introduce unnecessary Apex, introduce unnecessary
technology, implement Data Cloud, or implement Agentforce.

The assistant is an **engineering partner, not the business owner.** Human architectural review
and approval remain required at every gate.

---

## 26. Quality Review Checklist

Run at the end of every subphase. Classify findings **Critical / High / Medium / Low**.
Surface material issues; **do not silently rewrite business architecture to resolve them.**

Check for: contradictory assumptions · inconsistent ARR/customer arithmetic · unrealistic SaaS
assumptions · Salesforce terminology errors · unsupported claims · Current/Target/Implemented
confusion · naming inconsistencies · segmentation, territory, routing, lifecycle contradictions ·
security gaps · missing requirements · weak acceptance criteria · broken traceability · decisions
silently treated as final · real PII · secrets · unnecessary complexity · Developer Edition
incompatibility · premature implementation · fabricated validation · dashboard-first design ·
unnecessary Apex · over-engineering · Data Cloud / Agentforce scope leakage.

---

## 27. Primary Operating Rule

When uncertain: **do not guess silently.**

The objective is **not** maximum file count, maximum automation, maximum dataset size, maximum
technology count, maximum custom fields, maximum Flows, or maximum complexity.

The objective is:

> A coherent, defensible, traceable, testable, secure, explainable, administrator-maintainable,
> enterprise-quality Revenue Operations architecture that can be implemented and demonstrated
> safely within Salesforce Developer Edition and analyzed through Power BI.

---

**Current phase:** Phase 0A — Repository Foundation
**Current implemented state:** Repository foundation and Salesforce DX scaffold only.
No business metadata. No org authentication. No deployment. No dataset.
