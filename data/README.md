# Data

**Status: empty by design. No dataset has been generated or loaded.**

The full dataset specification — composition, defect profile, and the 17 scenarios every record
must serve — lives in [`docs/testing-strategy.md`](../docs/testing-strategy.md) §3.

---

## Layout

| Directory | Holds |
|---|---|
| `sample/` | The synthetic dataset loaded into Salesforce |
| `expected/` | Pre-computed expected outcomes used to assert results |

---

## Rules

> **Scenario coverage, not record volume.** A dataset that exercises every failure mode in 190
> records is stronger evidence than one exercising three failure modes in 6,000.

| Rule | Detail |
|---|---|
| **Fictional only** | Invented companies and people. **No real organizational data, no real PII.** |
| **Deterministic** | The same generation inputs produce the same dataset — a test whose input changes between runs cannot produce trustworthy evidence |
| **Purposeful** | Every record maps to a named scenario. A record serving no scenario is deleted. |
| **Small** | ~190 records total (9 Users · 35 Accounts · 35 Contacts · 85 Leads · 24 Opportunities) |
| **Deliberate defects** | Broken records match the documented baseline defect profile — not randomly corrupted |
| **Labelled** | Identifiable as synthetic wherever it surfaces |

Domains use reserved example ranges so they cannot resolve to a real organization. Ad-hoc exports
and Data Loader success/error files are git-ignored; deliberate fixtures are added explicitly.

**A dataset of clean records proves nothing**, because every rule passes trivially. Roughly half the
Leads carry deliberate defects or boundary values.

---

## Load Gate

**Any org data load requires explicit human approval.** Before loading, present: object, record
count, scenarios represented, negative and boundary cases, expected outcomes, and storage
justification against Developer Edition limits.
