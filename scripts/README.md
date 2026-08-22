# Scripts

Supporting automation for data generation, validation, and repository quality checks.

**Status:** Phase 0A contains repository validation only. Data and org scripts arrive in Phase 2+.

---

## Governing Principle

> **Technology requires business justification.**

Scripts exist where they do genuine work — generating deterministic fixtures, validating structure,
querying the org, checking traceability. A script written to make the repository look more
technical is over-engineering and does not belong here.

Where a Salesforce CLI command or a declarative feature already does the job, use it rather than
wrapping it.

---

## Directory Layout

| Directory | Holds | Naming |
|---|---|---|
| `python/` | Synthetic data generation, traceability checks, data transformation | `snake_case.py` |
| `powershell/` | Repository validation, local workflow automation, Windows-native tasks | `Verb-Noun.ps1` |
| `soql/` | Reusable validation and evidence queries | `kebab-case.soql` |

---

## Current Contents

### `powershell/`

| Script | Purpose |
|---|---|
| `Test-RepositoryStructure.ps1` | Validates the repository skeleton, Salesforce DX foundation, and scans for secrets, auth artifacts, and scope leakage. Run before every commit. |

### `python/` — empty (Phase 2)

Planned: deterministic synthetic fixture generation for the failure scenarios described in
[`data/README.md`](../data/README.md).

Generation must be **deterministic** — fixed seeds, fixed ordering, reproducible output. A
generator whose output varies between runs cannot support trustworthy test evidence.

### `soql/` — empty (Phase 1+)

Planned: validation queries used as implementation evidence — unassigned Leads by territory,
routing outcomes by seller, SLA breach detection, duplicate detection, field completeness,
matching confidence distribution.

SOQL files are committed because the **query is the evidence**. A screenshot of a result without
the query that produced it is not reproducible.

---

## Rules

- Scripts never contain credentials, org IDs, usernames, tokens, or auth URLs. Authentication is
  handled by the Salesforce CLI's own credential store, which is git-ignored.
- Scripts that touch an org are **read-only by default**. Any script that writes to Salesforce
  requires explicit approval before it is run.
- Every script carries a header comment stating its purpose, its inputs, its outputs, and whether
  it modifies anything.
- Prefer idempotent scripts. Running one twice should not produce a different result the second
  time.
- PowerShell scripts target **Windows PowerShell 5.1** (the verified local environment). Avoid
  syntax introduced in PowerShell 7+ — `&&`, `||`, ternary, and null-coalescing operators are
  parser errors in 5.1.

---

## Running Validation

```powershell
pwsh -File scripts/powershell/Test-RepositoryStructure.ps1
# or, on Windows PowerShell 5.1:
powershell -ExecutionPolicy Bypass -File scripts\powershell\Test-RepositoryStructure.ps1
```

Exit code `0` = all checks passed. Non-zero = failures reported to the console.
