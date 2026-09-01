---
name: precommit-evidence
description: Review evidence and scope after implementation is complete and before work is presented for commit approval. Establishes what changed, whether it stayed in scope, what evidence each claim actually requires, what validation truly ran, which failures are task-introduced versus pre-existing, and whether documentation parity is owed. Use at a task's stopping point, or when asked to review the diff, validate what changed, or judge whether work is ready to commit. Always stops before commit.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Edit
---

# Pre-Commit Evidence Review

The last step of a task. Establishes what changed, what proves it, and whether the work can honestly
be presented for commit approval.

**It never commits.**

Governance comes from `~/.claude/CLAUDE.md` and the repository `CLAUDE.md`; both apply throughout and
are not restated here. What follows is procedure.

## When to run it

At a task's intended stopping point — after implementation, after task-specific validation, before
asking for commit approval. Also on explicit request: *review before commit* · *is this ready?* ·
*validate what changed* · *review the diff* · *make sure nothing broke*.

This is an evidence review, not another implementation phase.

## Core principle

> **Validation is selected by what changed and what claim is being made** — never by directory
> membership, and never from a fixed checklist.

Do not run every available check. Do not skip relevant evidence because one broad check passed.

A green repository validator proves **repository invariants**. It does not prove Salesforce
behaviour, runtime behaviour, visual fidelity, business correctness or deployed state.

## Procedure

### 1 · Establish the review baseline

Determine the branch, staged state, working-tree state, which files the task authorised, which work
is pre-existing or unrelated, and which changes the task introduced.

Establish provenance from the **baseline status captured at task start**, the known task edits, the
diff content, deliberately captured hashes, and explicit prior-session or user evidence. Filesystem
timestamps are **supplementary only** — never classify work as pre-existing or task-introduced from a
modification time alone.

If provenance cannot be established and proceeding risks overwriting, staging or misrepresenting
unrelated work: **HARD STOP.**

### 2 · Read the actual diff

Not just the status list — **the content**. Determine what behaviour changed · which files changed ·
whether anything changed outside the authorised scope · whether unrelated work was touched · whether
a safeguard was weakened · whether debugging or workaround residue remains · whether a dependency or
generated artifact appeared · and whether the implementation actually matches the task's objective.

### 3 · Classify the change

Identify which evidence categories genuinely apply. More than one may.

| Category | Evidence that typically fits |
|---|---|
| **Repository governance / documentation** | focused read-through · the repository validator · link and reference integrity · a mutable-fact or inventory scan where applicable |
| **Application logic** | the tests covering the changed behaviour · relevant regression tests · a type check · runtime exercise where the claim requires it |
| **Visual implementation** | the `visual-fidelity` procedure · rendered comparison · review of affected shared surfaces · technical validation matching the edit |
| **Salesforce source / metadata** | source inspection · repository checks where relevant · deployed observation **only if deployment is being claimed** |
| **Salesforce deployed state** | `salesforce-inspection`. Repository source alone never proves deployment. |
| **Salesforce behaviour** | actual runtime or transaction evidence. **Metadata presence never proves behaviour.** |
| **Business or control logic** | the governing authority · expected behaviour · positive and negative cases · boundary conditions · population and calculation verification. **Passing technical tests never establish business correctness.** |

### 4 · Select proportionate validation

For each material claim ask:

> **What evidence would a competent reviewer need before believing this?**

Choose the smallest sufficient set. Do not choose a check because it is familiar, and never let a
file's location decide.

A styling change does not summon Salesforce inspection. A documentation change does not summon an
application build. A Salesforce source change does not summon deployed inspection unless deployment
or deployed state is being claimed. A visual claim requires a render. A code-correctness claim
requires executable or type evidence. A Salesforce behaviour claim requires behavioural evidence.

**Discover the available validation from the repository and the task** — the test runner, the type
checker, the repository validator, the render workflow, whatever this repository actually provides.
Do not assume a fixed command sequence.

### 5 · Run the missing relevant validation

Run what is relevant, authorised, safe to perform, and necessary to support the completion claim.

If a relevant check already ran during the task and its evidence is still valid, **reuse it** rather
than rerunning mechanically.

**Never claim a check ran if it did not.** Where a relevant check is deliberately not run, state what
was skipped, why it was unnecessary or impossible, and **what claim therefore remains unproven**.

### 6 · Attribute every failure

**TASK-INTRODUCED** — caused by this work. Fix within task scope where appropriate, then revalidate.

**PRE-EXISTING** — present before the task. **Do not fix it to produce a green report.** Record it,
and judge whether it prevents validating the current change.

**UNRELATED DISCOVERY** — newly found, outside this task. REPORT — DO NOT FIX.

**UNRESOLVED ATTRIBUTION** — the evidence cannot say which. Investigate using the baseline and the
diff. If it stays unresolved and materially affects the completion claim: **HARD STOP.**

> **Never make a convenient attribution to declare success.**

### 7 · Check regression risk

Did the change touch shared code or configuration? Could another surface or path be affected? Did it
replace a proven mechanism? Were negative and boundary cases preserved? Was a safeguard weakened?
Does the evidence cover the actual blast radius?

**Validation depth follows blast radius.** An isolated low-risk change does not warrant exhaustive
regression testing.

### 8 · Check documentation and evidence parity

**Do not update documentation because drift exists.** Determine whether this change altered a
governed behaviour or authority that *requires* parity; if so, identify what must be updated.

Unrelated or pre-existing drift is REPORT — DO NOT FIX.

**Never manufacture historical evidence.** If a reproducibility artifact was created after the
original validation, label it as such rather than implying it was the evidence at the time.

### 9 · Check evidence honesty

Verify the claims distinguish, where applicable, **Candidate · Implemented · Validated · Synthetic
Baseline**, and that none of these inferences has been made:

implemented → validated · source-controlled → deployed · deployed metadata → runtime behaviour ·
synthetic → production · current observation → historical evidence.

For assessment-related work, confirm the claims keep the **population evaluated**, the **records
failing**, the **methodology** and the **outcome** distinct.

### 10 · Confirm scope integrity

Compare the final state to the task's scope. Confirm unrelated and pre-existing work remains
protected · only authorised files were intentionally changed · no dependency was added · no
credential or secret entered tracked content · no unintended generated artifact remains · **no gated
external action was silently performed.**

If the task expanded beyond its authority: **HARD STOP.** Do not bury scope expansion inside the
report.

### 11 · Determine readiness

**READY FOR COMMIT REVIEW** — authorised implementation complete, relevant evidence passes, scope
clean, remaining issues do not invalidate the change, claims are honest. This means *ready to ask the
human whether to commit.* **It does not authorise commit.**

**READY WITH REPORTED PRE-EXISTING ISSUES** — the task itself is valid and independently proven;
pre-existing or unrelated issues remain and do not invalidate it. Report them clearly.

**NOT READY** — task-introduced validation fails · required evidence is missing · scope expanded
improperly · material provenance is unresolved · a safeguard was improperly weakened · required
parity is incomplete · or another genuine blocker exists.

## Commit boundary

**This skill always stops before commit** — including when the result is READY FOR COMMIT REVIEW.

Do not stage additional work to prepare a commit. Do not commit. Do not push.

Commit requires explicit approval. **Push requires a further, separate approval, and commit approval
never implies it.**

## Working with the other skills

**`context-discovery`** — where business correctness was consequential, use its Context Brief as the
statement of expected behaviour. Do not repeat discovery unless the implementation materially
diverged from the context established.

**`visual-fidelity`** — use its render evidence for any visual claim. **Never substitute source
inspection for rendering.**

**`salesforce-inspection`** — use it when a completion claim depends on actual deployed state. Do not
contact Salesforce merely because Salesforce files changed. If **behaviour** rather than state is
being claimed, inspection is not proof: require behavioural evidence.

## Output — the Pre-Commit Evidence Report

Include only the sections that apply. Keep it proportional.

```
### Task                                   what was authorised
### Change summary                         what the task actually changed
### Scope review                           authorised · task-introduced · pre-existing/unrelated
### Evidence required                      validation selected, and why, per claim
### Validation performed                   each check actually run, and its real result
### Validation deliberately not performed  what was skipped, why, what stays unproven
### Failure attribution                    TASK-INTRODUCED / PRE-EXISTING / UNRELATED / UNRESOLVED
### Regression review                      blast-radius evidence
### Documentation/evidence parity          required, completed, or reported drift
### Evidence honesty                       Candidate / Implemented / Validated / Synthetic Baseline
### Remaining issues                       material unresolved, pre-existing or unrelated only
### Readiness                              READY FOR COMMIT REVIEW | READY WITH REPORTED
                                           PRE-EXISTING ISSUES | NOT READY
### Commit boundary                        no commit or push performed; approval required, and
                                           push requires separate approval
```

## Boundaries

This skill reviews and validates. It must never: expand implementation scope · perform unrelated
cleanup · mutate Salesforce to obtain evidence · deploy · authenticate or re-authenticate · change
permissions or security · add a dependency · weaken a test, validator or guardrail to reach green ·
manufacture historical evidence · stage unrelated work · commit · push.

Corrections that make the task's **own authorised implementation** valid may be made, and only while
they stay inside the original task authority. Anything beyond that is reported, not fixed.

## What this procedure must never contain

Any current fact: test counts · validator pass counts · field or configuration inventories · page or
route counts · assessment results · record populations · branch or commit identifiers · the current
working-tree state · deployment state · design filenames · Salesforce authentication details ·
dependency inventory.

**No fixed validation command sequence.** What this repository provides is discovered per task and
reported with its real result — never written back into this file.
