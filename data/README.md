# Data

**Status: empty by design.** Synthetic data is generated in **Phase 2**, and only after an
approved generation plan. No data has been generated.

---

## Governing Principle

> **Scenario coverage, not record volume.**

A dataset that exercises every failure mode in 60 Accounts is stronger evidence than one that
exercises three failure modes in 6,000. The ceilings below are **ceilings, not targets** — a
smaller dataset that still provides complete test coverage is preferred.

| Object | Ceiling |
|---|---|
| Accounts | ~60 |
| Contacts | ~75 |
| Leads | ~120 |
| Opportunities | ~35 |
| Opportunity Products | ~50–70 (only if justified) |
| Users | minimum necessary |
| Reference / configuration records | minimum necessary |

**Salesforce Developer Edition is the target org.** Do not load large synthetic history into it to
make Power BI charts look populated — analytical history, if needed, lives in `analytics/`.

---

## Directory Layout

| Directory | Holds |
|---|---|
| `source/` | Canonical synthetic source records before any processing |
| `broken/` | Deliberately defective records — the failure-engineering set |
| `clean/` | Expected post-normalization / post-remediation state |
| `expected/` | Pre-computed expected outcomes used to assert test results |
| `reference/` | Configuration and lookup data (territories, segments, routing rules, holidays) |
| `analytics/` | Larger synthetic historical datasets for Power BI time-series — **not loaded into Salesforce** |

The `source/` → `broken/` → `clean/` → `expected/` split is what makes controls *provable*: a
control is demonstrated by showing a defective input, the applied rule, and the asserted output.

---

## Synthetic Failure Engineering

Data must **deliberately** contain controlled failure scenarios. A dataset of clean records proves
nothing, because every rule passes trivially.

Planned scenario coverage:

| Domain | Scenarios |
|---|---|
| Baseline | Valid prospect |
| Duplicates | Duplicate Lead · Lead-to-Contact duplicate · Duplicate Account |
| Identity | Existing customer · Existing prospect · Ambiguous Account match · Subsidiary · Parent Account · Strategic Account |
| Completeness | Missing employee count · missing industry · missing country · missing domain |
| Validity | Malformed domain · invalid email |
| Boundaries | Segmentation boundary · Territory boundary |
| Geography | Unsupported geography |
| Routing | Routing exception · Inactive seller · Unavailable seller · Reassignment · Missing required routing data |
| SLA | SLA breach |
| Lifecycle | Stale record · Incomplete qualification |

**One record may deliberately exercise multiple conditions.** Prefer deterministic fixtures over
random generation — a test whose input changes between runs cannot produce trustworthy evidence.

---

## Generation Gate

Before any dataset is generated, an approval package must be presented containing:

1. Object
2. Record count
3. Business purpose
4. Scenarios represented
5. Negative cases
6. Boundary cases
7. Expected outcomes
8. Salesforce storage justification

**Then wait for approval.** No generation without it.

---

## Data Rules

- **All data is fictional.** Never use real customer data or real PII.
- Company names, domains, contact names, and addresses are invented. Domains use reserved
  example ranges where possible so they cannot resolve to a real organization.
- Ad-hoc CSV exports (`*export*.csv`, `*extract*.csv`, Data Loader success/error files) are
  git-ignored by default. Deliberate synthetic fixtures are added explicitly after review.
- Every dataset is accompanied by documentation of what it represents and which `TEST-###` cases
  consume it.
