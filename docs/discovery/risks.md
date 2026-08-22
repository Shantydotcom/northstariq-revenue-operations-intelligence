# Risk Register — NorthstarIQ Revenue Operations Intelligence Platform

| Field | Value |
|---|---|
| **Document** | Risk Register |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Target State (project risk) |
| **Related** | [`assumptions.md`](assumptions.md) · [`dependencies.md`](dependencies.md) · [`project-scope.md`](project-scope.md) |

---

## Scope of This Register

These are **implementation risks to this project** — things that could cause the work to be wrong,
misleading, unmaintainable, or undeliverable.

> **This register does not contain fabricated enterprise incidents.** There are no invented outages,
> breaches, audit findings, or escalations. NorthstarIQ is fictional and nothing has happened to it.
> Inventing incidents would manufacture urgency the discovery did not establish.

### Scoring

| Likelihood | Impact |
|---|---|
| **High** — expected without deliberate mitigation | **High** — compromises architecture quality or credibility |
| **Medium** — plausible | **Medium** — causes rework or degrades a deliverable |
| **Low** — unlikely | **Low** — inconvenience |

**Severity = Likelihood × Impact**, rendered as 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low.

### Category key

| Category | Meaning |
|---|---|
| **Integrity** | Risks to the honesty and defensibility of the work |
| **Architecture** | Risks to design quality |
| **Delivery** | Risks to completing the four-day release |
| **Platform** | Risks arising from Developer Edition constraints |
| **Sustainability** | Risks to the work remaining correct over time |

---

## Register Summary

| Severity | Count |
|---|---:|
| 🔴 Critical | 4 |
| 🟠 High | 8 |
| 🟡 Medium | 6 |
| 🟢 Low | 2 |
| **Total** | **20** |

| Category | Count |
|---|---:|
| Integrity | 6 |
| Architecture | 6 |
| Delivery | 4 |
| Platform | 2 |
| Sustainability | 2 |

---

## 🔴 Critical Risks

### `RISK-001` — Synthetic results are mistaken for real measurements

| Field | Detail |
|---|---|
| **Category** | Integrity |
| **Likelihood** | High · **Impact** High · **Severity** 🔴 Critical |
| **Description** | A reader — hiring manager, interviewer, or the author's future self — interprets synthetic baselines or a fictional company's figures as real measured outcomes. |
| **Why critical** | This is the risk that would most damage the project's purpose. A portfolio's value rests entirely on the reviewer trusting its claims. A single figure that appears to assert real measurement, discovered to be invented, retroactively discredits everything else. |
| **Mitigation** | Every number carries a provenance label. `baseline-metrics.md` opens with a mandatory disclaimer. The README carries a synthetic-data disclaimer. `CLAUDE.md` guardrail 19 separates synthetic baselines from measured results. The repository validation script scans for unlabelled claims. |
| **Residual** | Medium — mitigation is procedural and requires sustained discipline at every phase gate. |
| **Owner** | Author |

---

### `RISK-002` — Planned capability is described as implemented

| Field | Detail |
|---|---|
| **Category** | Integrity |
| **Likelihood** | High · **Impact** High · **Severity** 🔴 Critical |
| **Description** | Documentation written in present tense during design ("the system routes Leads by territory") reads as a statement of existing capability. |
| **Why critical** | This is the most common failure mode of portfolio repositories, and it is easy to commit accidentally — design documents are naturally written in the present tense. |
| **Mitigation** | Three States of Reality enforced throughout. Status vocabulary with `Implemented` requiring artifacts and `Validated` requiring evidence. Language patterns documented in `implementation-status-conventions.md` §8. README status block. PR checklist item. Quality review at every gate. |
| **Residual** | Medium |
| **Owner** | Author |

---

### `RISK-003` — Unresolved business decisions are silently encoded as system rules

| Field | Detail |
|---|---|
| **Category** | Integrity / Architecture |
| **Likelihood** | High · **Impact** High · **Severity** 🔴 Critical |
| **Description** | An unmade business decision — segmentation thresholds, ownership precedence, Strategic designation, franchise policy — is settled by implementation convenience rather than judgement, and thereafter appears to be an agreed rule. |
| **Why critical** | Three recorded problems (`PROB-005`, `PROB-008`, `PROB-010`) are **business policy gaps, not technical defects**. Building logic for them without a decision would encode an unmade choice as fact — and it would be invisible afterward, because the code would look like any other rule. |
| **Specific hazard** | The observed ACV bands and employee ranges in `revenue-model.md` are *descriptive*. Converting them into Salesforce segmentation thresholds would be exactly this failure, would be easy to do accidentally, and would be hard to detect later. |
| **Mitigation** | 22-decision open register. `revenue-model.md` carries a prominent descriptive-vs-prescriptive warning. Decision governance requires explicit human approval before `Accepted`. `CLAUDE.md` guardrails 1, 2, 20. Assumptions register distinguishes `ASM-###` from `DEC-###`. |
| **Residual** | Medium |
| **Owner** | Author + human reviewer (decisions are the reviewer's) |

---

### `RISK-004` — Architecture is built on unvalidated assumptions

| Field | Detail |
|---|---|
| **Category** | Architecture |
| **Likelihood** | Medium · **Impact** High · **Severity** 🔴 Critical |
| **Description** | Design proceeds on assumptions that cannot be validated because the fictional environment cannot actually be inspected. |
| **Why critical** | Eight High-impact assumptions are recorded ([`assumptions.md`](assumptions.md)). `ASM-001` (enrichment availability) alone determines which of two materially different data-quality architectures is correct. |
| **Structural difficulty** | Unlike a real engagement, validation is **not available** — there is no one to ask. |
| **Mitigation** | Design for the harder condition where an assumption is uncertain (e.g. assume enrichment is absent). Document both branches where they diverge. Record every assumption with its impact-if-false and the affected work. |
| **Residual** | **Medium–High. This risk cannot be fully mitigated** and is accepted as an inherent property of a portfolio project. It is stated rather than concealed. |
| **Owner** | Author |

---

## 🟠 High Risks

### `RISK-005` — Over-engineering

| Field | Detail |
|---|---|
| **Category** | Architecture · Likelihood High · Impact Medium · 🟠 High |
| **Description** | Complexity is added to demonstrate capability rather than to satisfy a requirement — unnecessary objects, excessive fields, elaborate automation, gratuitous Apex. |
| **Why it matters** | It works against the goal. A reviewer who recognizes unnecessary complexity reads it as poor judgement, not strong skill. It also directly worsens `RISK-011` (maintainability) given the single-administrator constraint. |
| **Mitigation** | Every component must trace to a `BR-###`. Apex requires an accepted ADR. Explicit anti-goals in `project-scope.md` §6. Four-test scope gate. Quality review checks for over-engineering. |
| **Residual** | Medium |

### `RISK-006` — Unnecessary Apex

| Field | Detail |
|---|---|
| **Category** | Architecture · Likelihood Medium · Impact High · 🟠 High |
| **Description** | Apex is introduced to make the repository appear more technical, where Flow would satisfy the requirement. |
| **Why it matters** | It inverts the intended signal. For Salesforce Administrator and RevOps roles, *declarative judgement* is the competency being assessed. Unnecessary Apex also creates a maintenance burden the single administrator cannot carry, and requires test-class overhead that adds no business value. |
| **Mitigation** | *Flow before Apex* principle. Apex requires an accepted ADR stating why Flow is insufficient. Explicitly out of scope in `project-scope.md` §3.6. `CLAUDE.md` guardrail 21. |
| **Residual** | Low |

### `RISK-007` — Hard-coded business rules

| Field | Detail |
|---|---|
| **Category** | Architecture · Likelihood High · Impact Medium · 🟠 High |
| **Description** | Thresholds, territory boundaries, SLA durations, scoring weights, and routing rules are embedded directly in Flow logic instead of being externalized as configuration. |
| **Why it matters** | It reproduces the exact condition that created NorthstarIQ's operational debt. It also makes the rules invisible to the administrator, non-versionable, and untestable in isolation. |
| **Mitigation** | *Metadata-driven rules before hard-coded decisions*. `ADR-0001` addresses this directly. *Separate configuration from execution logic*. |
| **Residual** | Low |

### `RISK-008` — Automation lacks fault handling

| Field | Detail |
|---|---|
| **Category** | Architecture · Likelihood Medium · Impact High · 🟠 High |
| **Description** | Flows are built for the happy path; failures are silent, leaving records in an indeterminate state. |
| **Why it matters** | Against a baseline where **48% of records have incomplete routing data**, the failure path is not an edge case — it is the majority condition. Automation that only handles complete records fails on roughly half of real volume. |
| **Mitigation** | *Design failure paths intentionally*. Fault paths mandatory on every Flow. *Fail safely*. Exception Framework provides a defined destination for failures. PR checklist item. |
| **Residual** | Low |

### `RISK-009` — Flow recursion and bulk-safety defects

| Field | Detail |
|---|---|
| **Category** | Architecture · Likelihood Medium · Impact High · 🟠 High |
| **Description** | Automation re-triggers itself, or performs DML/SOQL inside loops, producing incorrect results or governor-limit failures. |
| **Why it matters** | Particularly hazardous here because routing updates Owner, which can re-trigger owner-based automation. **A small Developer Edition dataset will not surface this** — the defect would appear only at volume, which is never reached. |
| **Mitigation** | *Avoid Flow recursion*, *bulk-safe automation*. Entry criteria and change detection. Before-save vs after-save chosen deliberately. Bulk testing where appropriate, with an explicit caveat that Developer Edition demonstrates bulk-safe *design*, not scale. |
| **Residual** | Medium — **cannot be fully retired without volume testing that Developer Edition cannot provide.** Stated as a known limitation. |

### `RISK-010` — Insufficient synthetic scenario coverage

| Field | Detail |
|---|---|
| **Category** | Delivery · Likelihood Medium · Impact High · 🟠 High |
| **Description** | The synthetic dataset does not exercise the boundary and negative cases the architecture claims to handle, so tests pass without proving anything. |
| **Why it matters** | Coverage — not volume — is the entire justification for a small dataset. If coverage is incomplete, the small dataset becomes a weakness rather than a deliberate design choice. |
| **Mitigation** | Explicit failure-scenario catalogue in `data/README.md`. Approval gate requiring scenarios, negative cases, boundary cases, and expected outcomes before generation. Deterministic fixtures. `source/` → `broken/` → `clean/` → `expected/` structure. |
| **Residual** | Medium |

### `RISK-011` — Solution exceeds administrator maintainability

| Field | Detail |
|---|---|
| **Category** | Sustainability · Likelihood Medium · Impact High · 🟠 High |
| **Description** | The architecture is correct but too complex for one administrator to maintain, so it degrades. |
| **Why it matters** | NorthstarIQ has one administrator for 64 revenue users (`PROB-018`). **This is a structural constraint, not a preference.** A design that ignores it will fail in exactly the way the original architecture failed. |
| **Mitigation** | *Optimize for administrator maintainability*, *prefer maintainability over cleverness*. Metadata-driven configuration keeps rules visible and changeable without development. Documentation as part of change. |
| **Residual** | Medium |

### `RISK-012` — Security is treated as a documentation exercise

| Field | Detail |
|---|---|
| **Category** | Architecture / Integrity · Likelihood Medium · Impact High · 🟠 High |
| **Description** | The access model is documented but never implemented or tested, so "least privilege" is asserted rather than demonstrated. |
| **Why it matters** | Security is a **primary workstream** in this project. An untested access model is exactly the weak-security-design risk the project claims to address — and the failure would be visible to any reviewer who checks for access tests. |
| **Mitigation** | Security testing is explicitly in scope (`project-scope.md` §2.5, §2.7). Access verification is a test category with its own directory. `Validated` status requires evidence. Integration user treated as a first-class persona (`PER-17`). |
| **Residual** | Low |

---

## 🟡 Medium Risks

| ID | Risk | Cat. | L | I | Description & Mitigation |
|---|---|---|---|---|---|
| `RISK-013` | **Scope expansion threatens the four-day release** | Delivery | High | Medium | Additional capabilities are absorbed without removing anything. *Mitigation:* four-test scope gate; explicit anti-goals; "future enhancements must not threaten the Day 4 release"; roadmap phases separated from the day plan. |
| `RISK-014` | **Documentation drifts from implemented metadata** | Sustainability | Medium | Medium | Documentation is updated separately from the change, or not at all — reproducing `PROB-017`. *Mitigation:* documentation updated in the same change; PR checklist; traceability matrix; quality review checks. |
| `RISK-015` | **Analytics metric drift** | Architecture | Medium | Medium | Power BI measures diverge from Salesforce report definitions, producing the conflicting-numbers problem the project set out to solve. *Mitigation:* governed `KPI-###` definitions as single source; Salesforce ↔ Power BI reconciliation as a test category; dashboard-first design prohibited. |
| `RISK-016` | **Unreliable baselines undermine improvement claims** | Integrity | High | Medium | 11 of 21 baselines are conflated or definitionally blocked. Claiming improvement on them would be unsound. *Mitigation:* `baseline-metrics.md` §1 and §7 explicitly mark suitability; conflated metrics flagged; improvement claims must state which baseline they use and its limitations. |
| `RISK-017` | **Developer Edition feature gaps force silent design substitution** | Platform | Medium | Medium | A design requiring an unavailable feature is quietly replaced with a lesser one presented as the intended architecture. *Mitigation:* Enterprise Design vs Portfolio Implementation columns; gaps documented not hidden; already applied to sandbox absence and Territory Management. |
| `RISK-018` | **Traceability breaks as volume grows** | Sustainability | Medium | Medium | Components lose their link to requirements as artifact count increases. *Mitigation:* immutable identifiers; traceability matrix; PR checklist requires a `BR-###`; quality review checks. |

---

## 🟢 Low Risks

| ID | Risk | Cat. | Description & Mitigation |
|---|---|---|---|
| `RISK-019` | **Deferred technology scope leakage** | Delivery | Data Cloud or Agentforce content enters the active architecture. *Mitigation:* explicit exclusion in `CLAUDE.md`, scope, roadmap and landscape; **automated check already implemented** in `Test-RepositoryStructure.ps1` §5, currently passing. |
| `RISK-020` | **Terminology inconsistency** | Sustainability | Canonical subsystem names or Salesforce terminology drift across documents. *Mitigation:* `naming-conventions.md`; terminology discipline table; quality review; retired names explicitly listed. |

---

## Risks Deliberately Excluded

| Not included | Why |
|---|---|
| Data breach / security incident at NorthstarIQ | No incident has occurred. NorthstarIQ is fictional. Inventing one would fabricate urgency. |
| Regulatory audit finding | No audit has occurred. |
| Customer escalation over misrouting | Plausible, but inventing a specific escalation would be a fabricated enterprise incident. |
| Key-person departure | Speculative organizational fiction, not a project risk. |
| Salesforce outage / platform failure | Not specific to this project. |
| Budget or resourcing risk | No budget exists; the project is a portfolio exercise. |

**The register contains project risks, not invented company drama.**

---

## Accepted Risks

Two risks are **accepted rather than mitigated**, and are stated plainly:

| ID | Risk | Why accepted |
|---|---|---|
| `RISK-004` | Architecture built on unvalidated assumptions | Validation is structurally unavailable — the fictional environment cannot be inspected and there is no one to ask. Mitigated by designing for the harder condition and documenting divergent branches, but **not eliminable**. |
| `RISK-009` | Bulk-safety defects invisible at Developer Edition scale | Volume testing that would surface them is not possible in Developer Edition. Mitigated by design discipline and code review, but **residual risk remains and no scale claim is made**. |

**Stating an accepted risk honestly is stronger evidence of judgement than claiming it was
mitigated.**

---

## Governance

- `RISK-###` identifiers are **immutable**. A closed risk is marked `Closed` with the reason; it is
  never deleted or renumbered.
- Risks are reviewed at every phase gate.
- A materialized risk is recorded as an issue with its `RISK-###` cited.
- New risks discovered in later phases are appended, never renumbered into sequence.
