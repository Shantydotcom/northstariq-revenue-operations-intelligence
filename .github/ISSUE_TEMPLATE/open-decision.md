---
name: Open Decision
about: Record a business design decision requiring human resolution (DEC-###)
title: "DEC-###: <the decision to be made>"
labels: open-decision
assignees: ''
---

<!--
Open Decisions exist so that material business uncertainty is SURFACED rather than
silently resolved. Recording a recommendation is not the same as making a decision.

A decision reaches `Accepted` ONLY after explicit human approval.
Never mark a decision Accepted on the basis of analysis alone.
-->

| Field | Value |
|---|---|
| **Decision ID** | `DEC-###` |
| **Domain** | <!-- Segmentation / Territory / Routing / SLA / Identity / Qualification / Lifecycle / Security / Analytics / Data --> |
| **Status** | `Open` <!-- Open / Analyzed / Recommended / Accepted / Deferred / Withdrawn --> |
| **Human Decision Required?** | **Yes** |
| **Blocks** | <!-- BR-### that cannot proceed without this --> |
| **Target phase** | <!-- when this must be resolved --> |

## Current Understanding

<!-- What is known today. Label each statement:
     Known Context / Assumption / Finding / Open Question. -->

## Why This Is a Decision, Not an Assumption

<!-- What makes this material: it changes system behaviour, is hard to reverse,
     affects reported numbers, or reasonable practitioners would disagree. -->

## Options

### Option A — <name>

**Description:**

**Pros:**

**Cons:**

**Implications:** <!-- data model, automation, security, analytics, Developer Edition -->

### Option B — <name>

**Description:**

**Pros:**

**Cons:**

**Implications:**

### Option C — <name> <!-- delete if not applicable -->

## Tradeoffs

<!-- The honest comparison. What is genuinely given up under each option.
     An analysis where one option has no downside is usually incomplete. -->

| Consideration | Option A | Option B | Option C |
|---|---|---|---|
| Business accuracy | | | |
| Administrator maintainability | | | |
| Explainability | | | |
| Testability | | | |
| Developer Edition feasibility | | | |
| Analytics impact | | | |

## Recommendation

<!-- A clear recommendation with reasoning. This is advisory only.
     It does NOT constitute a decision. -->

## Impact If Deferred

<!-- What is blocked, and what risk accrues, if this is not decided. -->

---

## Human Decision

<!-- COMPLETED BY THE HUMAN REVIEWER ONLY. Leave blank until decided. -->

| Field | Value |
|---|---|
| **Decision** | |
| **Decided by** | |
| **Date** | |
| **Rationale** | |
| **Resulting BR / ADR** | |

<!-- On acceptance: update docs/requirements/open-decisions.md, create or update the
     related BR-###, and create an ADR if the decision is architecturally significant. -->
