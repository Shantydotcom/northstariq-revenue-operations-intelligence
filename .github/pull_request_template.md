# Pull Request

## Summary

<!-- What changed, and why. Business language first. -->

## Traceability

<!-- Every substantive change traces to a documented requirement.
     If you cannot name one, the change is not ready. -->

| Field | Value |
|---|---|
| **Requirement(s)** | `BR-##` |
| **Decision(s)** | `PD-##` / `OD-##` / N/A |
| **Scenario(s)** | Scenario # from `docs/testing-strategy.md` / N/A |

## Type of Change

- [ ] `feat` — new capability (including declarative Salesforce configuration)
- [ ] `fix` — correction to existing behaviour
- [ ] `docs` — documentation only
- [ ] `test` — scenarios, fixtures, validation queries
- [ ] `chore` — repository / tooling housekeeping

## Implementation State

<!-- Select ONE. See docs/implementation-log.md -->

- [ ] `Candidate` — documented, not built
- [ ] `Implemented` — exists in the org and in source control
- [ ] `Validated` — implemented **and** proven by an executed test with recorded results
- [ ] `Deferred` — valid, out of this release

> **`Implemented` requires artifacts. `Validated` requires executed results.**
> Documentation alone justifies neither.

## Evidence

<!-- Required for Implemented / Validated:
     metadata paths, SOQL output, test outcomes including failures, org state, date. -->

## Salesforce Impact

- [ ] No Salesforce metadata changed
- [ ] Metadata changed — listed below and source-controlled
- [ ] Security / sharing affected — **access testing completed, both directions**
- [ ] Automation added or changed — fault paths present, bulk-safe, recursion-controlled

<!-- List changed metadata components: -->

## Analytics Impact

- [ ] No analytics impact
- [ ] Metric definition added or changed — `M-##` updated in `docs/metric-dictionary.md`
- [ ] Power BI model changed — text artifacts updated in `powerbi/`
- [ ] Salesforce ↔ Power BI reconciliation verified

---

## Pre-Merge Checklist

### Traceability
- [ ] Every change traces to a `BR-##`
- [ ] Documentation updated in **this** change, not deferred
- [ ] Open decisions referenced by `OD-##`, not silently resolved

### Honesty
- [ ] No candidate capability described as implemented
- [ ] **No fabricated test results** — outcomes recorded only from actual runs, failures included
- [ ] **No fabricated stakeholder approval** — decisions labelled `Portfolio Decision`
- [ ] Synthetic baselines labelled as synthetic wherever used
- [ ] No claim that Developer Edition proves enterprise-scale performance

### Security & data
- [ ] `git diff` reviewed in full
- [ ] No credentials, tokens, auth URLs, certificates, or `.env` contents
- [ ] No real PII — all data fictional
- [ ] No Salesforce auth artifacts (`.sf/`, `.sfdx/`, `*.key`)
- [ ] No unintended generated files, exports, or binaries

### Design quality
- [ ] Standard Salesforce evaluated before custom metadata
- [ ] Flow preferred over Apex, or Apex justified and recorded
- [ ] Governed business rules held as configuration, not hard-coded
- [ ] Fault paths designed; bulk safety asserted at batch volume
- [ ] Explainability present — "why did this happen?" is answerable from data
- [ ] Complexity envelope respected, or the excess is justified in `docs/implementation-log.md`
- [ ] Developer Edition compatibility preserved

### Scope
- [ ] No Data Cloud content
- [ ] No Agentforce content
- [ ] No unnecessary technology introduced

---

## Open Items

<!-- Anything unresolved. Classify each: Assumption / Open Decision / Risk / Dependency / Question.
     Surface uncertainty here rather than resolving it silently. -->

## Reviewer Notes

<!-- What you specifically want scrutinized. -->
