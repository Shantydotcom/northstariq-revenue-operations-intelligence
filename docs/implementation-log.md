# Implementation Log

| | |
|---|---|
| **Purpose** | The running record of what was actually built, deployed, and validated |
| **Status** | Open — **no implementation has occurred** |

---

## What This Document Is

**This is the only place in the repository where a component becomes real.**

Everything in [`architecture.md`](architecture.md), [`data-model.md`](data-model.md), and
[`security-model.md`](security-model.md) is a candidate. A component moves from candidate to
implemented by appearing here, with evidence.

It is a log, not a governance framework. Entries are short and factual.

---

## Status Vocabulary

Used across the repository. Exactly one applies to any component at any time.

| Status | Meaning |
|---|---|
| **Candidate** | Proposed in documentation. Not built. Not committed to being built. |
| **Implemented** | Exists in the org and in source control |
| **Validated** | Implemented **and** proven by an executed test with recorded results |
| **Deferred** | Valid but out of this release |
| **Removed** | No longer part of the design, with a reason |

### Three states of reality

| State | Question it answers |
|---|---|
| **Current State** | How the fictional environment works today — [`business-case.md`](business-case.md) |
| **Target State** | What the architecture intends — [`architecture.md`](architecture.md) |
| **Implemented State** | What actually exists right now — **this document** |

**Never conflate them.** A capability described in Target State is not a claim about Implemented
State, and this log is the only authority on the third.

---

## Entry Format

```
### YYYY-MM-DD — <capability>

Requirement:   BR-##
Metadata:      what was created or modified
Deployment:    result, including failures
Validation:    what was executed
Test result:   actual outcome, including failures
Commit:        <hash>
Deferred:      anything found and postponed, with a reason
```

**Rules.** Record what happened, not what was intended. A failed deployment is an entry. A test that
did not run is not an entry. **Never record a result that was not executed** — a fabricated result
invalidates every other claim in this repository.

---

## Git Conventions

| Element | Convention |
|---|---|
| Branch | `main` for documentation; `feature/<capability>` for implementation increments |
| Commit format | `<type>: <summary>` — `feat` · `fix` · `docs` · `chore` · `test` |
| Commit scope | One capability per commit; metadata and its documentation update together |
| Approval | **Commit and push each require explicit human approval** |

**Documentation synchronizes with metadata in the same commit.** A field created without its
`data-model.md` row updated is an incomplete change, not a fast one.

---

## Approval Gates

| Action | Requires |
|---|---|
| Create or modify local files | Normal working authority |
| `git add` / stage | Normal working authority |
| `git commit` | **Explicit approval** |
| `git push` | **Explicit approval** |
| Create GitHub repository / change visibility | **Explicit approval** |
| `sf org login` | **Explicit approval** |
| `sf project deploy` | **Explicit approval** |
| Any org data load | **Explicit approval** |
| Any security or sharing change in the org | **Explicit approval** |

---

## Log

### 2026-08-22 — Repository foundation and discovery

```
Requirement:   —
Metadata:      None. Salesforce DX scaffold only.
Deployment:    N/A — no org
Validation:    Test-RepositoryStructure.ps1 — 36 passed, 0 warnings, 0 failed
Test result:   Structure, security scan, and scope boundaries clean
Commit:        684da8c
Deferred:      —
```

### 2026-08-22 — Phase 0C requirements and governance (preservation commit)

```
Requirement:   —
Metadata:      None
Deployment:    N/A — no org
Validation:    Test-RepositoryStructure.ps1 — 36 passed, 0 warnings, 0 failed
               No secrets · no auth artifacts · no dataset · no business metadata
               in force-app · no Data Cloud or Agentforce implementation
Test result:   All checks passed
Commit:        e0be142
Deferred:      —
Note:          Committed to preserve the full 10,898-line Phase 0 documentation
               in history before consolidation. Detailed originals of every
               consolidated document are recoverable from this commit.
```

### 2026-08-22 — Documentation consolidation

```
Requirement:   —
Metadata:      None
Deployment:    N/A — no org
Validation:    Pending — see the consolidation validation report
Test result:   —
Commit:        this commit — `refactor: simplify NorthstarIQ for implementation`
               (a commit cannot record its own hash; `git log` resolves it)
Deferred:      —
Note:          29 documents (10,898 lines) consolidated into 9 (~3,300 lines).
               62 business requirements consolidated into 23.
               22 open decisions resolved into 12 Portfolio Decisions,
               5 remaining open, 2 dropped with removed scope.
               Phase-gate and documentation-governance apparatus removed.
```

---

## Implementation Status

**Nothing is implemented.**

| Area | Status |
|---|---|
| Salesforce org | 🔵 Not provisioned, not authenticated, not inspected |
| Custom fields | 🟡 22 candidates — **0 implemented** |
| Flows | 🟡 4 candidates — **0 implemented** |
| Custom Metadata Types | 🟡 2 candidates (+1 conditional) — **0 implemented** |
| Permission sets | 🟡 4 candidates — **0 implemented** |
| Queues | 🟡 2 candidates — **0 implemented** |
| Reports | 🟡 7 candidates — **0 implemented** |
| Dashboards | 🟡 1 candidate — **0 implemented** |
| Apex | **0 — and 0 is the target** |
| Dataset | ⬜ Not generated, not loaded |
| Tests | ⬜ **No test has been executed. No results exist.** |
| Power BI | ⬜ Not started |

---

## Next Step

**Org inspection.** After the consolidated repository is reviewed, committed, and pushed, the
Developer Edition org is authenticated and inventoried. Every candidate above is then re-evaluated
against what standard Salesforce and the existing configuration already provide.

**Candidates are expected to be removed as a result. That is the purpose of the step, not a
setback.**
