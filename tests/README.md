# Tests

**Status: empty by design.** Test strategy is defined in **Phase 0D**; test matrices and fixtures
are built alongside each capability from **Phase 2** onward. No tests exist. No results exist.

---

## Governing Principle

> **Business rules require tests.** An untested rule is `Implemented`, never `Validated`.

And, without exception:

> **Never fabricate test results.**

`Actual Result` is populated only by an actual run. A predicted result written into that column is
fabrication, and a single instance of it invalidates every other result in the repository.

---

## Directory Layout

| Directory | Covers |
|---|---|
| `fixtures/` | Deterministic input fixtures shared across suites |
| `data-quality/` | Validation rules, normalization, completeness, formula fields |
| `matching/` | Lead-to-Account matching, existing-customer detection, confidence, ambiguity |
| `scoring/` | ICP fit scoring, grade assignment, explainability output |
| `lifecycle/` | Lifecycle stage transitions, recycling, progression, Lead Status alignment |
| `routing/` | Segmentation, territory assignment, seller eligibility, round robin, customer precedence, strategic Accounts |
| `sla/` | SLA deadline calculation, business hours, pauses, breach detection, first touch |
| `security/` | OWD, role hierarchy, permission sets, sharing rules, field access, integration user |
| `analytics/` | Salesforce report accuracy and Salesforce ↔ Power BI reconciliation |
| `salesforce/` | Flow tests, bulk behaviour, recursion, regression |

---

## Test Record Format

| Field | Meaning |
|---|---|
| `Test ID` | `TEST-###`, immutable |
| `Requirement ID` | The `BR-###` this test proves. A test with no requirement is unjustified. |
| `Scenario` | What condition is being exercised, in business language |
| `Known Input` | The exact deterministic fixture used |
| `Expected Result` | Pre-computed before the run |
| `Actual Result` | **Populated only by an actual run** |
| `PASS / FAIL` | Outcome |
| `Evidence` | Screenshot, SOQL output, Flow test result, or metadata reference |

`Expected Result` must be written **before** execution. Writing it afterward turns a test into a
description of whatever the system happened to do.

---

## Planned Coverage

Validation rules · formula fields · record-triggered Flows · Screen Flows · duplicate scenarios ·
Account matching · ICP scoring · lifecycle transitions · segmentation boundaries · territory
boundaries · routing · customer precedence · strategic Accounts · seller eligibility · inactive
seller handling · round robin distribution · SLA calculation and breach · exception handling ·
security and sharing · reports · analytics reconciliation · bulk behaviour where appropriate ·
regression.

### Emphasis on boundaries and negatives

The valuable tests are the ones at the edges, because that is where real systems fail:

- The employee count exactly **at** the segmentation threshold
- The Account exactly **at** a territory border
- The Lead whose matching confidence sits exactly **at** the fuzzy-match cutoff
- The routing attempt where **every** eligible seller is inactive
- The SLA that expires **outside** business hours
- The record that satisfies **two** conflicting rules simultaneously

A suite of only happy-path tests demonstrates that the system works when nothing is wrong, which
is not a claim worth making.

---

## Bulk & Regression

Bulk behaviour is tested where appropriate, with an explicit caveat recorded in every result:

> Developer Edition bulk testing demonstrates **bulk-safe design** (no DML or SOQL inside loops,
> correct collection handling). It does **not** prove enterprise-scale performance, and no such
> claim is made.

---

## Evidence

Test results are evidence only when accompanied by stored artifacts — SOQL output, Flow test
results, screenshots, or committed fixture and expected-result files. A `PASS` with no evidence is
an assertion, not a result.
