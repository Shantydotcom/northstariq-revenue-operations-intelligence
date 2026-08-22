---
name: Defect
about: Report incorrect behaviour, a failing test, or a documentation inconsistency
title: "<short description of the incorrect behaviour>"
labels: defect
assignees: ''
---

| Field | Value |
|---|---|
| **Severity** | <!-- Critical / High / Medium / Low --> |
| **Category** | <!-- Behaviour / Data / Security / Documentation / Traceability / Scope --> |
| **Affected** | <!-- BR-### / TEST-### / component / document --> |
| **Roadmap phase** | |

<!--
Severity guidance:

  Critical  Incorrect ownership or access; data loss; exposed secret or PII; a claim that
            planned or unvalidated work is implemented; fabricated results; broken
            ARR/customer arithmetic.
  High      Business rule produces wrong outcome; broken traceability; security gap;
            Developer Edition incompatibility; scope leakage (Data Cloud / Agentforce).
  Medium    Inconsistent terminology or naming; weak acceptance criteria; missing test;
            unnecessary complexity.
  Low       Cosmetic, formatting, minor wording.
-->

## Expected Behaviour

<!-- What should happen, and which BR-### or documented rule says so. -->

## Actual Behaviour

<!-- What actually happens. For test failures, paste the real output.
     Do not paraphrase results. -->

## Reproduction

<!-- Deterministic steps. Name the exact fixture used — a defect that cannot be
     reproduced from a committed fixture cannot be proven fixed. -->

1.
2.
3.

**Fixture / input:**

## Evidence

<!-- SOQL output, Flow test result, screenshot, diff, failing test matrix row. -->

## Impact

<!-- Who is affected and what it costs. For routing/SLA/security defects, state whether
     records could reach the wrong owner or the wrong person could gain access. -->

## Suspected Cause

<!-- Optional. Classify: Known / Assumed / To Be Validated.
     Do not present a hypothesis as a diagnosis. -->

## Scope Check

- [ ] This is a defect in existing work, not a request for new capability
- [ ] No real PII or credentials included in this report
- [ ] If a business rule is genuinely ambiguous, raised as a `DEC-###` rather than
      fixed by assumption
