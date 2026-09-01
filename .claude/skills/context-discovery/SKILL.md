---
name: context-discovery
description: Establish business context, technical reality and the verified gap before a consequential NorthstarIQ change. Use when work introduces or materially alters business behaviour, RevOps policy, lifecycle, routing, territory, SLA, matching, assessment or control logic, calculations, Salesforce architecture or configuration, integrations, governed data semantics, or remediation behaviour — and when a diagnosis needs business intent reconciled against implementation reality. Produces a Context Brief; performs no implementation. Skip it for copy, styling, isolated defects, routine tests and documentation corrections.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Context Discovery

Answers one question before consequential NorthstarIQ work begins:

> **What should this behaviour be, what is it actually, what is the real gap, and what evidence would
> prove a change correct?**

This skill produces a **Context Brief**. It does not implement.

Governance comes from `~/.claude/CLAUDE.md` and the repository `CLAUDE.md`; both apply throughout and
are not restated here. What follows is procedure.

## When to run it

Run it when the work introduces or materially alters: business behaviour · RevOps policy · lifecycle
behaviour · routing or territory behaviour · SLA behaviour · matching logic · assessment or control
logic · calculations · Salesforce architecture or configuration · integrations · governed data
semantics · remediation behaviour · or other consequential system behaviour.

Also run it when asked to diagnose something whose answer depends on reconciling business intent with
implementation reality.

**Do not run it** for copy edits · isolated styling · straightforward documentation corrections ·
read-only inspection that already has the context it needs · a localised defect whose intended
behaviour is already clear and authoritative · routine test maintenance · mechanical refactoring that
does not alter behaviour.

The deciding question is the tier test, not the file being touched:

> *Would a reviewer need to know a business rule to judge this change correct?*

If no, skip the skill and do the work. **This procedure exists to reduce uncertainty, not to add
ceremony.** Running it on Tier 1 work is itself a failure of proportionality.

## Procedure

Establish only the context the task actually needs. Each step below is bounded by the previous one.

### 1 · Classify the change

State what is being asked, whether it is consequential, which behaviour or system boundary it
touches, and what kind of authority would govern correctness. **If it is not consequential, say so
and stop here** — that conclusion is the useful output.

No implementation from this point on.

### 2 · Establish business authority

Retrieve the minimum needed to answer *what should this behaviour mean?* — no more. Do not read every
business document by default; follow the source-of-truth ownership in the repository `CLAUDE.md` to
the one or two that govern this question.

Where a governed rule is externalised into configuration, **read the configuration record — the record
is the rule**, not the prose describing it.

**Never invent** qualification criteria, lifecycle policy, routing policy, territory policy, SLA
rules, thresholds, scoring rules or any other governed RevOps policy because implementation would be
easier with one. Routine maintenance needs no artificial requirement identifier; if none exists and
the work is routine, record that the task is its own authority.

If the rule is recorded as an open decision, note it — that blocks *choosing* the rule, not building
authorised neutral or configurable work around it.

### 3 · Establish technical reality

Inspect the minimum relevant implementation from **actual source**, not remembered state, following
imports rather than assuming structure. Read the tests that assert the behaviour — they are the
executable statement of current intent.

Where deployed Salesforce reality matters, use existing authorised least-privilege read-only
inspection, including read-only queries. Record which access path answered the question.

Keep four things distinct and never infer one from another:

| | |
|---|---|
| **Source-controlled intent** | what the repository declares |
| **Deployed reality** | what an observation of the live org shows |
| **Runtime behaviour** | what an executed run or test produced |
| **Historical evidence** | what was previously built and validated, and when |

### 4 · Compare expected against actual

Three short statements:

- **Expected** — what authoritative business evidence says should happen.
- **Actual** — what the implementation or a deployed observation shows.
- **Gap** — the specific difference.

**A documentation discrepancy is not the defect** unless the governing implementation or behaviour is
itself wrong. Stale prose describing correct behaviour is drift to report, not a gap to close.

### 5 · Determine the minimum sufficient change

Name the smallest change that would close the *verified* gap. Consider reuse before creation: an
existing mechanism, an existing configuration record, an existing control.

**Do not implement it.** The output is an implementation-quality brief.

### 6 · Determine the validation evidence

Name what would prove the future change correct — and only what is relevant. Draw from: source
inspection · an application test · a negative test · runtime observation · rendered comparison
against the design authority · a read-only Salesforce query · metadata verification · positive and
negative Salesforce behaviour · bulk-safety evidence at batch volume · fault and exception-path
evidence.

Do not prescribe validation merely because it exists. Evidence, not ceremony.

### 7 · Classify every unresolved finding

Exactly one of three:

**HARD STOP** — implementation cannot safely or correctly proceed without human authorisation, a
missing consequential business decision, resolution of an authoritative conflict, protected external
mutation, a security or permission decision, a destructive action, or another genuine stop condition.
**State precisely what must be resolved and by whom.**

**RESOLVE AND CONTINUE** — authoritative inspection can settle it without a human decision: stale
documentation, whether a field or configuration record exists, current source inventory, deployed
state answerable read-only. **Resolve it rather than asking.**

**REPORT — DO NOT FIX** — real but unrelated to this task. One line each; no scope expansion.

## Output — the Context Brief

Keep it proportional to the task. A small consequential change deserves a short brief.

```
### Task
### Risk / consequence          why discovery was or was not warranted
### Governing business authority the specific source(s), or "the task itself" for routine work
### Expected behaviour           plain English
### Current technical reality    implementation and, where relevant, deployed evidence
### Verified gap
### Proposed minimum change      direction, not implementation
### Validation evidence required
### Open issues                  HARD STOP / RESOLVE AND CONTINUE / REPORT — DO NOT FIX
### Ready for implementation?    YES or NO, with a short reason
```

**Every material finding names its basis** — a repository path, a configuration record, a requirement
or decision identifier *that actually exists*, an executed command and its result, a read-only
Salesforce observation, or a rendered observation. Trivial observations need no citation.

Never manufacture a citation or an identifier. **Never use a file modification time as the sole
provenance for a claim.**

## Boundaries

This skill performs authorised read-only inspection and nothing else. It must not: implement code ·
edit Salesforce · deploy · authenticate or re-authenticate · mutate data · change permissions · add
dependencies · modify design references · update documentation because drift was found · stage ·
commit · push.

It must not contain, or produce as if durable, any current NorthstarIQ inventory or state — counts,
record populations, field, Custom Metadata or Flow inventories, test counts, findings, assessment
results, deployment state, authenticated identity, permission-set names, design filenames, branch or
commit. Those are discovered per task, reported in the brief, and never written back into this
procedure.

The brief is a snapshot of a moment. **The skill must stay true as NorthstarIQ changes.**
