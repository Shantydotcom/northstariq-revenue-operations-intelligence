# Prompts

Preserved prompts used to direct AI-assisted engineering on this project.

---

## Why This Directory Exists

This repository is intended to demonstrate **governed AI-assisted engineering**, not blind AI
generation.

The difference is visible in artifacts. Governed AI-assisted engineering means:

- The scope, constraints, and guardrails were defined **before** generation
- Material business decisions were **withheld from the assistant** and escalated to a human
- Work proceeded through **approval gates**, not in one unreviewed pass
- The instructions themselves are **auditable**

Preserving the prompts makes that claim checkable rather than asserted. A reviewer can read what
was actually asked for and judge whether the output reflects governed direction or improvisation.

This is also the honest disclosure: AI assistance was used, here is exactly how it was directed.

---

## Directory Layout

| Directory | Holds |
|---|---|
| `claude-code/` | Phase-level master prompts directing the overall engineering effort |
| `data-generation/` | Prompts for deterministic synthetic fixture generation (Phase 2) |
| `salesforce/` | Prompts for metadata, Flow, and configuration generation (Phase 1+) |
| `powerbi/` | Prompts for semantic model, DAX, and Power Query generation (Phase 11) |

---

## Current Contents

| File | Phase |
|---|---|
| [`claude-code/phase-0-master-prompt.md`](claude-code/phase-0-master-prompt.md) | 0 — Discovery, Requirements, Architecture & Engineering Foundation |

---

## Sanitization Rules

Prompts committed here are **repository-appropriate versions**. Before committing, remove:

- Credentials, tokens, org IDs, usernames, auth URLs
- Private or personal information
- Unrelated conversation history
- Hidden or system instructions
- Any sensitive data

The prompt is preserved for its **engineering direction**, not as a verbatim session transcript.

---

## What Good Direction Looks Like

The preserved prompts should demonstrate that the assistant was constrained rather than trusted:

| Constraint type | Example from this project |
|---|---|
| Explicit scope exclusion | Data Cloud and Agentforce receive no directories, ADRs, or requirements |
| Decision withholding | 22 open decisions the assistant may analyze but must not resolve |
| Approval gates | Phase 0A → 0B → 0C → 0D each stop for human review |
| Deployment controls | No org authentication, deployment, commit, or push without explicit approval |
| Honesty requirements | Never claim planned capabilities are implemented; never fabricate test results |
| Volume constraints | Dataset ceilings; "scenario coverage, not record volume" |

The operative guardrails are maintained in [`CLAUDE.md`](../CLAUDE.md) at the repository root,
which every session reads.
