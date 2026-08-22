# Tests

**Status: empty by design. No test has been executed. No results exist.**

The testing approach — 17 scenarios, boundary cases, the access test matrix, and the evidence
standard — lives in [`docs/testing-strategy.md`](../docs/testing-strategy.md).

---

## Layout

| Directory | Holds |
|---|---|
| `scenarios/` | Scenario definitions and their deterministic fixtures |
| `results/` | Recorded outcomes from actual runs |

SOQL validation queries live in [`../scripts/soql/`](../scripts/soql/), versioned alongside the
metadata they check.

---

## The Two Rules

> **An untested rule is `Implemented`, never `Validated`.**

> **Never fabricate a test result.** `Actual Result` is populated only by an actual run. A predicted
> result written into that column is fabrication, and one instance of it invalidates every other
> result in this repository.

`Expected Result` is written **before** execution. Written afterward, a test becomes a description
of whatever the system happened to do.

---

## Result Format

| Field | Meaning |
|---|---|
| `Scenario` | The numbered scenario from `docs/testing-strategy.md` |
| `Requirement` | The `BR-##` this proves. A test with no requirement is unjustified. |
| `Input` | The exact deterministic fixture used |
| `Expected` | Pre-computed before the run |
| `Actual` | **Populated only by an actual run** |
| `PASS / FAIL` | Outcome — **failures are recorded, never omitted** |
| `Evidence` | SOQL output, org state, date |

---

## Where the Value Is

The tests worth writing are at the edges, because that is where real systems fail: employee count
exactly at a segmentation threshold · an Account exactly at a territory border · a match confidence
exactly at the cutoff · every eligible seller inactive · an SLA expiring outside business hours or
on a holiday · a record satisfying two conflicting rules at once.

**A suite of only happy-path tests demonstrates that the system works when nothing is wrong**, which
is not a claim worth making — particularly here, where 48% of inbound records are incomplete.

---

## Bulk Testing Caveat

Recorded with every bulk result, without exception:

> Developer Edition bulk testing demonstrates **bulk-safe design** — no DML or SOQL inside loops,
> correct collection handling. It does **not** prove enterprise-scale performance, and no such claim
> is made.
