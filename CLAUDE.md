# CLAUDE.md — NorthstarIQ Engineering Governance

**Read this before making any change to this repository.**

General engineering behaviour — proportional governance, risk tiers, inspection, scope discipline,
guardrail integrity, validation, completion reporting and Git safety — comes from the universal
`~/.claude/CLAUDE.md` and is **not repeated here**. This file answers one question:

> **What must be known specifically because the work is on NorthstarIQ?**

It carries durable governance and pointers to authority. It carries **no inventory** — no counts, no
current results, no implementation status. Those are discovered from the sources named in §3.

---

## 1. What NorthstarIQ Is

A focused **Revenue Operations Intelligence portfolio MVP**, set in a fictional B2B SaaS company. It
exists to demonstrate senior-level capability in Revenue Operations · Salesforce architecture and
administration · GTM systems · CRM and data governance · operational controls · operational
intelligence · auditability · and the translation of business requirements into technical design.

**Primary audience: a hiring manager or portfolio evaluator.** Every decision is judged by whether a
capable reviewer would find it credible, explainable and well-governed. The operational personas —
Revenue Operations, Seller, Analyst — are real design inputs but a secondary audience.

**The implementation is the primary artifact.** Documentation supports it; it does not substitute for
it. The target is a system one strong Salesforce Administrator / RevOps professional could
realistically build, maintain, explain and demonstrate.

**NorthstarIQ is not Kanio.** They are separate projects. Never import Kanio code, architecture,
repository structure, package names, requirements, implementation history, assumptions, technical
decisions or conventions into NorthstarIQ, and never treat a pattern's success there as evidence for
it here. Compare the two only when explicitly asked to.

## 2. MVP Boundaries

The build discipline is roughly **four focused build days**. Prioritise what strengthens the
portfolio demonstration; decline what only enlarges it.

**Avoid:** production-SaaS overengineering · speculative features · unnecessary dependencies ·
unnecessary pages · documentation portals · premature abstraction · scope creep.

**Out of scope — do not design, configure, reference as active, or create directories for:**
Salesforce Data Cloud · Agentforce · CPQ · Revenue Cloud · Field Service · Experience Cloud · live
marketing-automation or enrichment integrations · multi-org CI/CD promotion. Data Cloud and
Agentforce may be mentioned **only** as explicitly future-state.

**Do not introduce Salesforce Record Types unless explicitly requested.**

**Complexity must be business-justified.** Inspect and reuse existing configuration before creating
new metadata, and introduce the minimum sufficient configuration or code that proves the required
capability. There is no numeric envelope; the constraint is justification, not a quota. Adding
technology beyond the established stack requires a documented business reason.

## 3. Source-of-Truth Ownership

Different kinds of truth have different owners. **Do not copy inventories from these sources into
this file — read the source.**

| Kind of truth | Owner |
|---|---|
| Approvals and protected actions | The user, in this conversation |
| Objective, scope, acceptance criteria, non-goals, stop point | The current task |
| Business intent — why the product exists, who it serves | `PRODUCT.md`, `docs/business-case.md` |
| Business requirements and governed decisions | `docs/requirements.md` (`BR-##`, `PD-##`), `docs/assumptions.md` (`OD-##`), `docs/metric-dictionary.md` (`M-##`) |
| **Governed business rules actually in force** | The Custom Metadata records where policy is deliberately externalised — the record *is* the rule, not the prose describing it |
| Current technical implementation | **The source tree** |
| Current deployed Salesforce reality | **Read-only observation of the org**, when the question genuinely concerns deployed state |
| Design authority | `.claude/design-authority.md` |
| Implementation history and validation provenance | `docs/implementation-log.md`, with `docs/testing-strategy.md` and `docs/security-model.md` |
| Target-state technical design | `docs/architecture.md`, `docs/data-model.md` — read Candidate / Implemented / Validated status honestly; these state intent, not existence |

## 4. Conflict Behaviour

The universal rule applies; this is its NorthstarIQ specialisation.

- **Source inventory** → the source tree governs. A documented count is stale until reconciled.
- **Deployed Salesforce state** → read-only observation of the org governs. Never infer it from
  `force-app/`, and never infer source configuration from the org.
- **Observed behaviour** → executed evidence governs. A recorded result beats a described design.
- **Configured business-rule values** → the governed configuration record governs.
- **What behaviour is required** → requirements govern.
- **How it is currently achieved** → the implementation governs.
- **Visual authority** → the design manifest governs.
- **History and provenance** → the implementation log governs — *not* current inventory.

When an authority resolves the disagreement: **resolve, continue, and report the drift.**

**Do not stop merely because documentation is stale.** Stop only when unresolved ambiguity affects
required behaviour, safety, scope, authoritative intent, or a protected change.

## 5. Business & Technical Context

For a consequential change to NorthstarIQ behaviour, establish enough context to determine:

1. the business objective · 2. the governing requirement or decision · 3. expected behaviour ·
4. the current implementation · 5. the actual gap · 6. the minimum sufficient change ·
7. the validation evidence required.

**Routine maintenance does not require artificial `BR-##` traceability.** A copy correction, styling
fix, accessibility fix, documentation correction, compiler fix, test maintenance, bounded visual
reconciliation or behaviour-preserving defect fix is authorised by the task. If work that looks
routine would in fact alter business behaviour, reclassify it and find the authority.

**Never invent** qualification criteria, lifecycle policy, routing policy, territory policy, SLA
rules, scoring rules or business thresholds because implementing would be easier with them. Where a
rule is genuinely undecided it is recorded as an Open Decision: that blocks *choosing* the rule, not
building already-authorised neutral or configurable work that does not prejudge it. The established
pattern is to **build the capability and leave the rule configurable.**

## 6. Salesforce Engineering

NorthstarIQ must demonstrate responsible Salesforce engineering, not merely working Salesforce
configuration.

**Requirement-driven design** — prefer standard Salesforce capability, then reuse existing org
configuration, then choose the **minimum appropriate declarative mechanism for the verified
requirement**. Formula, validation rule, Custom Metadata, custom field and Flow are alternatives to
be weighed against what the requirement actually needs, not a fixed ladder to descend. Do not create
metadata that duplicates standard capability.

**Declarative first** — declarative implementation is preferred for this MVP. Apex requires a
**verified need** that cannot be safely or maintainably satisfied by an appropriate declarative
capability, and the justification is documented before implementation.

**Automation quality** — bulk-safe, with no DML or SOQL in a loop · precise entry criteria ·
before-save for same-record assignment · fault paths on fallible elements · recursion control ·
named and commented decision elements · exception logging that makes "why did this happen?"
answerable from data.

**Data-handling discipline** — null and blank values must not overwrite populated data · detect
change precisely rather than rewriting on every save · define which source wins for each field and
apply it consistently · treat sensitive operational fields as protected, notably record ownership,
lifecycle and stage fields, and opportunity amounts.

**Configuration over code** — rules the business is expected to change belong in Custom Metadata,
not inside a Flow.

**Decision provenance** — where governed configuration can change and the historical interpretation
of a decision matters, preserve enough provenance to establish **which rule, or which version of it,
governed that decision**. Use the minimum appropriate mechanism for that outcome; do not
automatically add a record-level version field.

**Least privilege** — access is granted by permission set, at the narrowest scope that works, and
proven in both directions. **Assessment behaviour is read-only**: the application reads Salesforce
and never writes to it.

**Evidence** — validate in Developer Edition, with recovery thinking wherever the change is
consequential. Do not create a second source of truth for a rule, constant or calculation that
already exists.

**Do not encode mutable Salesforce facts in this file or in any skill** — authentication mechanism,
Connected App, username, permission-set name, org ID, instance URL, token behaviour, or current
field / CMDT / Flow / record counts. Discover them when needed.

## 7. Salesforce Autonomy & Gates

> **Existing authenticated, least-privilege, read-only Salesforce inspection may proceed without
> additional task authorisation whenever it is needed to establish current reality** — including
> appropriate read-only queries. Reading is not mutating.

Determine what read-only access is actually available from repository configuration, application
configuration and established project state; prefer the least-privilege path that can answer the
question, and record which path was used.

**Read permission never implies mutation permission.** Explicit approval is required before:
authentication or re-authentication when existing access is unavailable · Salesforce deployment ·
metadata mutation · record mutation · data loading · permission, security or sharing changes ·
privilege escalation · destructive Salesforce operations.

**Never mutate Salesforce to improve assessment results, demo appearance, findings, test outcomes or
alignment with a screenshot.** For the same reason: **assessment logic is never changed to improve
presentation or results.** The assessment reports what the org contains; if that looks poor, that is
the finding.

## 8. NorthstarIQ Approval Gates

The universal risk model applies — this states the gates it defers to. Explicit approval is required
before: **a new runtime dependency · a new development dependency · a material dependency change ·
deployment to Vercel or any environment · a destructive Git action · `git commit` · `git push`.**

**Commit and push are separate approvals. Commit approval does not authorise push**, and neither is
implied by finishing the work.

The dependency envelope is deliberately small and is part of the portfolio argument; that is why it
is gated here rather than left to judgement.

## 9. Evidence & Honesty

**These are the rules whose violation would make this project worse than not doing it.**

The evidence vocabulary is **Candidate** (documented, not built) · **Implemented** (exists in the org
and in source control) · **Validated** (implemented *and* proven by an executed test with recorded
results, including failures) · **Synthetic Baseline** (an invented figure, labelled wherever used).
`docs/implementation-log.md` defines the full status ladder; exactly one status applies at a time.

**Never infer across these boundaries:**

| From | To |
|---|---|
| design or documentation | implementation |
| implementation | validation |
| source configuration | deployed behaviour |
| synthetic evidence | production evidence |
| an artifact created later to reproduce a result | the original validation of that result |

**Never fabricate stakeholder approval.** There are no stakeholders. Decisions made by the
practitioner as owner of the fictional scenario are labelled **Portfolio Decision** — never
"approved" or "agreed by the business."

**Never claim performance at scale.** Bulk-safe *design* is demonstrated at fixture volume;
production scale is not claimed. A synthetic baseline can show a design *would* move a metric — never
that a metric *was* moved.

Material findings stay traceable to what actually supports them. Do not manufacture historical
evidence, and do not rewrite history to make the repository look tidier than it was.

## 10. Assessment Evidence

When describing an assessment result, keep four things distinct: **the population evaluated · the
records failing · the calculation methodology · the resulting outcome.** Conflating them is how a
control comes to look more or less conclusive than it is.

Be specific about what proves a finding — the fields, records, metadata, governed definition or
calculation logic that establishes it. **Avoid vague "source evidence" language when the proving
evidence can be named.** Distinguish **detective controls** (what NorthstarIQ observes) from
**preventive safeguards** (what the org enforces).

**Never invent a runtime value for visual completeness.** A figure that cannot be produced is stated
as absent, with the reason.

**Scoring is out of the current MVP UX.** No overall score, no `/100`, no area scores, no gauges, no
score deltas, no thresholds, no score-derived health classification. The engine may compute a score
internally; the user experience does not show one. This governs the current UX only — a historical
document that truthfully records a past score is evidence and stays. Restoring scoring requires
explicit product authority.

## 11. Web Evidence

Match the evidence to the claim.

| Claim | Evidence |
|---|---|
| Implementation | the current source |
| Runtime behaviour | an executed test or observed runtime result |
| Visual fidelity | a rendered comparison against `.claude/design-authority.md` |
| Salesforce state | read-only observation of the deployed org |
| A finding | the actual records, fields, metadata, governed rule or calculation supporting it |

**A green repository validator proves repository invariants — not Salesforce behaviour.**
**Passing application tests do not by themselves prove correct Revenue Operations business
behaviour.** Distinguish visual correctness, technical correctness and business correctness; a change
can satisfy one and fail the others.

## 12. Design Authority

`.claude/design-authority.md` owns the route-to-reference mapping, approval status, governed visual
scope and known deviations. **Do not restate design filenames here**, and read the manifest's known
deviations before comparing anything.

References govern visual direction, information hierarchy, layout, presentation and page structure.
They govern **no** runtime fact — counts, totals, severities, timestamps, org names, connection
state, populations, lifecycle results or implemented-feature status. **Never change application
logic, assessment behaviour or data to make output match a static image.** Historical artifacts are
not targets unless explicitly re-approved by name.

**Do not redesign an approved experience while doing unrelated work.**

### Authoritative lifecycle

```
Lead → MQL → SAL → SQL → Conversion → Opportunity
```

One lifecycle, identical everywhere it appears. Do not substitute an alternative funnel. Operational
processes exist around the lifecycle; they do not replace its milestones.

### Experience boundaries

Each page owns one job, and no page absorbs another's.

| Page | Owns |
|---|---|
| Dashboard | operational orientation and the one action that starts an assessment |
| Assessment | what was evaluated, applicable populations, methodology, evidence state, results |
| Findings | the specific detected issues |
| Finding Detail | the investigation trail for one finding |
| Remediation | governed response to an investigated finding |
| Verification | whether an approved response produced the expected result |
| Analytics | longitudinal trend, funnel, conversion, velocity and leakage analysis |
| Integrations | the Salesforce connection and its governance boundaries |
| Audit Log | activity and available historical evidence |

Planned experiences stay visibly Planned. No Settings experience without explicit approval. A
"recommended next step" is a deterministic pointer built from information the application already
holds — never described as an AI recommendation engine unless one is actually built.

**Finding Detail is a concise investigation trail, not a documentation portal.** Where applicable it
preserves: why the control exists · the expected control · what NorthstarIQ found · the evidence ·
the implemented safeguard · verification · and optionally the implementation evidence.

## 13. Build & Dev Hygiene

**Do not run the production build while the development server is running.**

Before starting a development server, determine whether one is already active. A type check is the
cheap validation and does not conflict with a running server.

Clearing the Next.js build cache is **troubleshooting, not routine** — use it only on evidence of
stale or corrupted build state.

Do not encode machine-specific ports, process IDs or transient local state anywhere in the
repository.

## 14. Documentation Behaviour

**Do not broadly update documentation because drift was discovered.** Resolve from the governing
authority, report the drift, and keep the task bounded.

**Update documentation when the task changes a governed behaviour or authority that requires
parity** — a field or object with `docs/data-model.md`, a Flow or Custom Metadata Type with
`docs/architecture.md`, a permission set, OWD or queue with `docs/security-model.md`, an executed
test with `docs/testing-strategy.md` and `docs/implementation-log.md`, a resolved assumption or open
decision with `docs/assumptions.md`. Metadata and its documentation change together.

Never leave a documented component in a status that no longer matches reality. Avoid duplicating
mutable inventory across documents — the implementation log owns history, provenance and validation
evidence, **not** current source inventory.

## 15. Progress Protection

This repository may hold substantial working implementation and pre-existing uncommitted work.
**Establish the current Git baseline before modifying any file**, and protect what the task did not
authorise changing.

**Validated behaviour, approved design baselines, source-controlled evidence and unrelated
pre-existing work are protected** unless the task explicitly authorises changing them.

Inspect before modifying. **Reconcile rather than rebuild.** Never `git reset`, `git restore .`,
`git checkout -- .` or `git clean`; never discard uncommitted work, overwrite unrelated work, delete
historical evidence, or mass-rewrite documentation.

Do not erase working functionality while implementing adjacent work, and do not replace a proven
mechanism because a different implementation looks cleaner in isolation. **Preserving what works
outranks tidiness.** Prefer the smallest safe change.

## 16. Stop Conditions

Apply the universal resolve / report / stop model. For NorthstarIQ specifically:

**STOP when** — a gated Salesforce action requires approval · a dependency change requires approval ·
deployment requires approval · commit or push requires approval · consequential business behaviour
lacks identifiable authority · an unresolved business decision must actually be chosen to proceed ·
authoritative sources conflict and the governing truth cannot be established · unrelated or
pre-existing work would be overwritten · a legitimate safeguard would have to be weakened · the
project's identity is genuinely ambiguous.

**Do not stop merely because** — documentation contains a stale count · read-only Salesforce
inspection is needed · an unrelated defect was discovered · routine maintenance has no `BR-##` · a
known design deviation exists · an authorised edit caused a localised test, type or compiler problem
that can be corrected within scope.
