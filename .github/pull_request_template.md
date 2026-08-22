# Pull Request

## Summary

<!-- What changed, and why. Business language first. -->

## Traceability

<!-- Every substantive change traces to a documented requirement.
     If you cannot name one, the change is not ready. -->

| Field | Value |
|---|---|
| **Requirement(s)** | `BR-###` |
| **Decision(s)** | `DEC-###` / N/A |
| **ADR(s)** | `ADR-####` / N/A |
| **Test(s)** | `TEST-###` / N/A |
| **Roadmap phase** | Phase # |

## Type of Change

- [ ] `feat` — new capability (including declarative Salesforce configuration)
- [ ] `fix` — correction to existing behaviour
- [ ] `docs` — documentation only
- [ ] `test` — test matrices, fixtures, validation
- [ ] `refactor` — restructuring without behaviour change
- [ ] `chore` — repository/tooling housekeeping

## Implementation State

<!-- Select ONE. See docs/governance/implementation-status-conventions.md -->

- [ ] `Proposed` — documented, not agreed
- [ ] `Approved` — human-approved, not yet built
- [ ] `Implemented` — exists in the org / repository (artifacts attached below)
- [ ] `Validated` — implemented AND proven by a passing test with evidence

> **`Implemented` requires artifacts. `Validated` requires evidence.**
> Documentation alone justifies neither.

## Evidence

<!-- Required for Implemented / Validated. Attach or link:
     metadata paths, Flow files, test matrix rows with populated Actual Result,
     SOQL output, screenshots, D2 diagrams, Custom Metadata records. -->

## Salesforce Impact

- [ ] No Salesforce metadata changed
- [ ] Metadata changed — listed below and source-controlled
- [ ] Security / sharing affected — access testing completed
- [ ] Automation added or changed — fault paths present, bulk-safe, recursion-controlled

<!-- List changed metadata components: -->

## Analytics Impact

- [ ] No analytics impact
- [ ] KPI definition added or changed — `KPI-###` governed definition updated
- [ ] Power BI model changed — text artifacts updated in `powerbi/`
- [ ] Salesforce ↔ Power BI reconciliation verified

---

## Pre-Merge Checklist

### Correctness & traceability
- [ ] Every change traces to a `BR-###`
- [ ] Documentation updated in **this** change, not deferred
- [ ] Canonical subsystem names used exactly (see naming conventions)
- [ ] Identifiers not renumbered or reused
- [ ] Open Decisions referenced by `DEC-###`, not silently resolved

### Honesty
- [ ] No planned capability described as implemented
- [ ] No fabricated test results — `Actual Result` populated only by actual runs
- [ ] No fabricated stakeholder approval
- [ ] All numbers carry a provenance label (Known Context / Synthetic Planning Assumption /
      Synthetic Baseline / Assumption / Finding / Actual Measured Result)
- [ ] Arithmetic validated (ARR / customers / ACV consistency)
- [ ] No claim that Developer Edition proves enterprise-scale performance

### Security & data
- [ ] `git diff` reviewed in full
- [ ] No credentials, tokens, auth URLs, certificates, or `.env` contents
- [ ] No real PII — all data fictional
- [ ] No Salesforce auth artifacts (`.sf/`, `.sfdx/`, `*.key`)
- [ ] No unintended generated files, exports, or binaries
- [ ] Least privilege preserved

### Design quality
- [ ] Flow preferred over Apex, or Apex justified in an ADR
- [ ] Business rules metadata-driven rather than hard-coded, or justified
- [ ] Fault paths designed
- [ ] Explainability output present ("why did this happen?" is answerable)
- [ ] Administrator maintainability preserved
- [ ] Developer Edition compatibility preserved

### Scope
- [ ] No Data Cloud content
- [ ] No Agentforce content
- [ ] No implementation beyond the current approved phase
- [ ] No unnecessary technology introduced

---

## Open Items

<!-- Anything unresolved. Classify each: Assumption / Open Decision / Risk / Dependency / Question.
     Surface uncertainty here rather than resolving it silently. -->

## Reviewer Notes

<!-- What you specifically want scrutinized. -->
