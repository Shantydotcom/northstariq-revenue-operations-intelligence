---
name: salesforce-inspection
description: Establish actual deployed Salesforce state through safe, least-privilege, read-only inspection. Use when NorthstarIQ work depends on org reality that source alone cannot settle — whether metadata is really deployed, what value currently governs a rule, which records meet an assessment condition, whether source-controlled intent and the deployed org have drifted, or what evidence actually supports a finding. Read-only throughout; every mutation, deployment, data load, permission change and authentication remains gated.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Salesforce Read-Only Inspection

Answers questions about **what the org actually contains right now**, with evidence, and without
changing anything.

Governance comes from `~/.claude/CLAUDE.md` and the repository `CLAUDE.md`; both apply throughout and
are not restated here. What follows is procedure.

## When to run it

Run it when the task depends on deployed Salesforce state that source cannot reliably settle:
whether metadata is actually deployed · the current state of a field or configuration · how deployed
automation is configured · the value a governed configuration record currently holds · the record
population relevant to an assessment · whether source-controlled intent and deployed reality have
diverged · the evidence behind a finding · behaviour needed for a diagnosis · whether an
implementation assumption holds in the connected org.

**Read-only inspection is Tier 0.** It changes nothing, needs no business authority and no approval.
Do not turn it into a heavyweight workflow.

**Do not run it** when the question is already answered authoritatively by repository source, by
evidence the current task has already produced, by recorded executed evidence, or by another
governing source.

> Inspect Salesforce when **deployed reality matters** — not because Salesforce exists.

## Access rule

> **Existing authenticated, least-privilege, read-only access may be used without additional task
> authorisation** where repository policy permits. Reading is not mutating, and no approval is
> requested to read.

**Do not assume how access is configured.** Discover the available authorised inspection path at
runtime from repository and application configuration and established project state. Prefer the
narrowest path that can answer the question.

Never write an authentication mechanism, username, alias, connected application, client credential,
permission-set name, org identifier, instance URL, token, secret or credential path into this
procedure or into any report. Record only **which available read-only path answered the question**,
described without exposing anything sensitive.

## Step 0 · Establish safe inspection capability

Before observing deployed state:

1. Determine whether an existing authorised access path is available.
2. Determine whether the observation can be performed **read-only**.
3. Confirm the planned operation cannot mutate records, mutate metadata, deploy, alter permissions or
   sharing, authenticate or re-authenticate, or execute anything destructive.

**If existing authorised read-only access is available — proceed.** Do not ask for another approval
merely to inspect.

**If access is unavailable and authentication or re-authentication would be required — HARD STOP.**
State that existing read-only access could not be used and that authorisation is required before
authenticating. **Do not attempt to repair credentials, switch identities, or escalate privilege.**

## Procedure

### 1 · Define the question

State precisely what deployed-state question is being answered — *is this configuration deployed?* ·
*what value governs this rule now?* · *which records meet this condition?* · *does deployed behaviour
match source-controlled intent?*

Avoid broad exploratory querying with no question behind it.

### 2 · Determine the governing evidence source

Decide what the answer actually requires: source inspection · deployed metadata observation ·
record-level observation · governed configuration · or a combination.

**Do not query records when metadata alone answers the question.** Do not query the org at all when
repository source is authoritative for the question being asked.

### 3 · Inspect source-controlled intent where relevant

Where parity matters, read the relevant repository source first and record what it says *should* be
deployed.

**Source is not proof of deployment.** It is one half of a comparison.

### 4 · Observe deployed reality, read-only

Use the narrowest observation capable of answering the question. Prefer targeted metadata inspection
· targeted queries · the minimum fields · bounded result sets · an aggregate where a count is all
that is needed.

Avoid broad extraction. Request only the fields that establish the evidence, and do not surface
sensitive values that the answer does not require.

### 5 · Preserve evidence semantics

Five categories. **Never infer one from another.**

| Category | What it establishes |
|---|---|
| **Source-controlled intent** | what the repository declares should exist |
| **Deployed configuration** | what the org currently contains |
| **Record evidence** | what relevant records currently show |
| **Runtime behaviour** | what an executed transaction or application path actually demonstrated |
| **Historical evidence** | what an earlier validation recorded, at that earlier time |

The inferences that must never be made:

- source exists **≠** deployed
- metadata deployed **≠** behaviour validated
- a current query result **≠** historical state
- a passing repository test **≠** deployed Salesforce behaviour

### 6 · Compare, when parity is the question

Produce three lines — **Source** (what the repository says) · **Deployed** (what the observation
showed) · **Result** (`MATCH`, `DRIFT` or `UNRESOLVED`).

**Do not fix drift.** Return the evidence to the calling task. Closing drift is a separate,
authorised piece of work.

### 7 · Assessment evidence, precisely

When inspection supports an assessment result or a finding, identify: the population queried or
evaluated · the condition applied · the fields that prove the condition · the governed configuration
that defines it · the failing records where record-level evidence is genuinely needed · and any
exclusions or unmeasurable conditions.

Never substitute a vague claim such as *"Salesforce evidence confirms the finding."* **State what
actually proves it.**

**Never change a record to produce cleaner evidence.**

### 8 · Classify unresolved issues

**HARD STOP** — progress requires authentication or re-authentication · record mutation · metadata
mutation · deployment · data loading · a permission, security or sharing change · privilege
escalation · a destructive operation · or another repository approval gate. **State the
authorisation required. Do not execute the action.**

**RESOLVE AND CONTINUE** — available read-only inspection can settle it: whether metadata is
deployed · a current configuration value · whether a field exists · a bounded record population ·
source-versus-deployed drift. **Inspect rather than asking.**

**REPORT — DO NOT FIX** — an unrelated Salesforce issue found along the way. One line; no scope
expansion.

## Query discipline

Read-only does not mean unlimited.

> **Minimum necessary query · minimum necessary fields · minimum necessary records.**

Prefer an aggregate when only a count is required. Prefer a selective filter when the population is
known. Avoid retrieving unnecessary personal data, large unrelated record sets, or fields irrelevant
to the evidence question. **A broad export is not a substitute for reasoning.**

If an observation returns more than the task needs, summarise only the evidence required and leave
the rest unreported.

## Mutation prohibition

This skill must never execute, or recommend executing as part of inspection: record insert, update,
upsert, delete or undelete · metadata deployment · metadata creation, edit or deletion · data import
or loading · permission changes · sharing changes · user changes · authentication changes · any
destructive operation.

**No mutation command appears anywhere in this procedure, even as an example.**

If mutation becomes necessary, **inspection ends.** The applicable repository approval gate governs
what happens next, as a separate task.

## Output — the Salesforce Inspection Report

```
### Question                       the deployed-state question investigated
### Inspection path                the authorised read-only path used, no credentials or secrets
### Evidence required              why an org observation was necessary
### Source-controlled intent       relevant source evidence, or "Not required"
### Deployed observation           what the org actually showed
### Record/configuration evidence  the specific fields, metadata or governed configuration
### Comparison                     MATCH | DRIFT | UNRESOLVED | NOT APPLICABLE
### Unresolved issues              HARD STOP / RESOLVE AND CONTINUE / REPORT — DO NOT FIX
### Conclusion                     plain-English answer to the original question
```

Keep it proportional. Name what supports each material claim, and never report an observation that
was not made.

## Working with the other skills

**`context-discovery`** decides *whether* deployed reality is needed; this skill establishes it and
returns the evidence. The wider business and technical gap analysis stays with `context-discovery`.

**`visual-fidelity`** does not reach for Salesforce because a reference image contains data — **a
picture never establishes org state.** Where a visual task genuinely needs deployed truth, this skill
supplies it.

**Pre-commit evidence review** may use this skill's output when a change makes a claim about
Salesforce behaviour. A green repository validator proves repository invariants, never org
behaviour.

## What this procedure must never contain

Any current Salesforce fact: authentication mechanism · username · alias · connected application ·
client credential · permission-set name · org identifier · instance URL · token information · API
version · field, metadata, automation or configuration inventory · record counts · assessment or
lifecycle results · deployment state.

Those are **discovered per task and reported in the inspection report** — never written back into
this file. The procedure must stay valid if the authentication path or the org configuration changes.
