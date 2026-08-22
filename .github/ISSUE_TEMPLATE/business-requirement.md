---
name: Business Requirement
about: Propose a new business requirement (BR-###)
title: "BR-###: <business outcome in one line>"
labels: requirement
assignees: ''
---

<!--
Requirements describe BUSINESS OUTCOMES first. Technical implementation follows.

  Prefer:  "Revenue Operations must be able to determine why a Lead was assigned to a
            specific seller without inspecting Flow debug logs."

  Not:     "Create Routing_Reason__c."

If you find yourself naming a field in the Requirement section, you are writing a design,
not a requirement. Move it to Future Implementation Component.
-->

| Field | Value |
|---|---|
| **Requirement ID** | `BR-###` |
| **Domain** | <!-- Data Quality / Identity / Qualification / Lifecycle / Segmentation / Territory / Routing / SLA / Exceptions / Security / Reporting / Analytics / Observability / Testing / Change Management / Operational Support --> |
| **Priority** | <!-- Must Have / Should Have / Could Have / Won't Have (this release) --> |
| **Owner / Persona** | <!-- PER-## — who needs this outcome --> |
| **Status** | `Proposed` |

## Business Problem

<!-- What is going wrong today, in business terms. Reference the discovery finding
     if one exists. Classify the cause: Known / Assumed / To Be Validated. -->

## Requirement

<!-- The required business outcome. One requirement per issue. -->

## Business Rationale

<!-- Why this matters. What it costs the business not to have it.
     If the impact cannot be articulated, the requirement may not be worth building. -->

## Acceptance Criteria

<!-- Specific and testable. Each criterion must be provable by a test.
     Include boundary and negative cases, not just the happy path. -->

- [ ]
- [ ]
- [ ]

## Dependencies

<!-- Other BR-###, DEC-###, or roadmap phases this depends on. -->

## Related Decision

<!-- DEC-### if this requirement is blocked on or shaped by an open decision.
     If a material business rule here is unresolved, it MUST be raised as an
     open decision rather than assumed in the acceptance criteria. -->

## Future Implementation Component

<!-- Anticipated Salesforce / Power BI component. TBD is acceptable during Phase 0. -->

## Test Requirement

<!-- What must be proven, and roughly how. TBD is acceptable during Phase 0. -->

## Enterprise Design vs Portfolio Implementation

| Enterprise Design | Portfolio Implementation |
|---|---|
| <!-- appropriate for a real ~$42M ARR B2B SaaS company --> | <!-- responsibly demonstrable in Developer Edition --> |

## Open Questions

<!-- Classify each: Assumption / Open Decision / Risk / Dependency / Question.
     Surface uncertainty. Do not resolve it silently. -->
