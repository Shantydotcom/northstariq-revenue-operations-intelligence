# Business Case

| | |
|---|---|
| **Project** | NorthstarIQ — Revenue Operations Intelligence Platform |
| **Purpose** | Why this work exists, what is wrong today, and what is in scope to fix |
| **Data provenance** | Fictional company · synthetic baselines · no real data |
| **Status** | Current State documented · Target State designed · **Salesforce Increments 1-4 implemented and human-accepted** · analytics, dashboards and the synthetic dataset **not delivered** — see [`implementation-log.md`](implementation-log.md) |

---

## ⛔ Synthetic Data Disclaimer

**NorthstarIQ is a fictional company. Every figure in this document is invented.**

No metric here was measured from any real organization. Baselines were constructed to make the
scenario internally coherent and arithmetically consistent. They exist to give the architecture a
realistic problem to solve — **not** to represent an observed result.

Any later claim of improvement must compare against these synthetic baselines and say so plainly.
A synthetic baseline can demonstrate that a design *would* move a metric. It can never demonstrate
that a metric *was* moved.

---

## 1. The Company

| Attribute | Value |
|---|---|
| Business | B2B SaaS — revenue intelligence and forecasting software |
| ARR | ~$42M |
| Customers | ~650 |
| Employees | ~450 (64 in revenue-facing roles) |
| CRM | Salesforce Sales Cloud |
| Analytics | Microsoft Power BI |
| Markets | United States, Canada, United Kingdom, Germany |
| Segments | SMB · Mid-Market · Enterprise · Strategic |

### Segment distribution

| Segment | Customers | Share of ARR | Motion |
|---|---:|---:|---|
| SMB | ~390 | ~14% | High-velocity, round-robin |
| Mid-Market | ~185 | ~31% | Territory-owned, single AE |
| Enterprise | ~62 | ~38% | Named-account, AE + SE |
| Strategic | ~13 | ~17% | Explicitly designated, executive-sponsored |

**Why the shape matters.** ARR concentration is inverse to record volume. 2% of customers carry 17%
of revenue, while 60% carry 14%. A routing error on an SMB record costs a few hours of seller
attention; the same error on a Strategic record is a commercial incident. **Segment must therefore
be a first-class routing input, not a reporting attribute.**

### How the operational debt arose

NorthstarIQ is not greenfield. It grew from ~$4M to ~$42M ARR in six years. Salesforce was
configured incrementally by whoever needed something, the sales process changed three times without
the prior configuration being retired, and documentation was written once at implementation and
never again.

Nothing here resulted from a bad decision. It is the accumulated result of many locally reasonable
decisions taken without a governing architecture.

---

## 2. Current State — Domain Assessment

| # | Domain | Severity | Evidence | Primary consequence |
|---|---|---|---|---|
| 1 | Salesforce Administration | High | To Be Validated | Change risk; single-person dependency |
| 2 | Data Quality | **Critical** | Synthetic Baseline | Breaks qualification, segmentation, routing |
| 3 | Duplicate Management | High | Synthetic Baseline | Wasted capacity; conflicting records |
| 4 | Account Identity / Matching | **Critical** | Assumed | Existing customers treated as new prospects |
| 5 | Qualification | High | Assumed | Marketing/Sales disagreement on MQL |
| 6 | Lifecycle Governance | High | Assumed | Progression not measurable |
| 7 | Segmentation | **Critical** | Assumed | Wrong team, wrong motion, wrong seller |
| 8 | Territory Management | High | Assumed | Ambiguous coverage; unresolved precedence |
| 9 | Routing | **Critical** | Assumed | Misassignment; unexplainable outcomes |
| 10 | Seller Ownership | High | To Be Validated | Ownership disputes |
| 11 | SLA Management | **Critical** | Synthetic Baseline | Slow speed-to-lead; unenforceable commitments |
| 12 | Security / Access | High | **To Be Validated** | Unassessed exposure |
| 13 | Reporting | High | Assumed | Divergent numbers, low trust |
| 14 | Analytics | High | Assumed | No root-cause capability |
| 15 | Documentation | Medium | Assumed | Knowledge held by individuals |
| 16 | Change Management | High | To Be Validated | Undetected regressions |
| 17 | Operational Support | Medium | Assumed | Exceptions absorbed manually, invisibly |

**Evidence honesty.** Only three domains rest on quantified baselines. The rest are assumed or await
validation. Stating that plainly is what makes the quantified three usable.

---

## 3. Synthetic Baselines

### Data quality — Leads created in the trailing twelve months

| Metric | Leads | Accounts | Consequence |
|---|---:|---:|---|
| Missing employee count | **44%** | 19% | Cannot price, qualify, segment, or route |
| Missing industry | **31%** | 12% | Cannot assess ICP fit |
| Missing / unusable domain | **22%** | 8% | Primary matching signal unavailable |
| Missing country | **17%** | 4% | Cannot assign territory |
| Invalid email format | 3.4% | — | Cannot contact |
| **Missing country and/or employee count** | **48%** | — | **Routing cannot resolve deterministically** |

*Arithmetic: 44% + 17% − 13% overlap = 48%. The overlap is within the valid 0–17% range.*

> **The single most important finding in this project.**
> Nearly half of inbound Leads lack a field that routing structurally requires. At that rate the
> incomplete-data path **is the main path, not an edge case.** Any design treating incomplete data as
> an exception will fail on roughly half of real volume.

### Duplication

| Metric | Rate | Consequence |
|---|---:|---|
| Leads with ≥1 probable duplicate | **14.2%** | Multiple sellers work the same person |
| Leads created for an existing Contact | **9.1%** | Existing relationship invisible on the new record |
| Duplicate Accounts | 6.8% | Fragmented history; ownership ambiguity |

**Reported Lead volume overstates real demand by ~14%.** Deduplication would therefore *improve*
apparent conversion rates with no change in sales performance. **Duplicate rate must never be used
as an improvement target in this project** — targeting it would manufacture a result.

### Routing

| Metric | Value | Consequence |
|---|---:|---|
| Median created-to-assigned | **6.4 business hours** | Nearly a full day before work begins |
| P90 created-to-assigned | **41 business hours** | Slowest decile waits over five days |
| Unassigned beyond 24 business hours | **21%** | One in five records stalls |
| Incorrect assignment (corrected ≤5 days) | **11.3%** | Rework; delayed engagement |
| Reassignment within 30 days (any cause) | **18.6%** | Ownership churn |

**The 6.4× median-to-P90 gap is the signature of a bimodal process.** Records that satisfy the
automated path move quickly; records needing manual intervention wait far longer. Improving the
median would not help the population that is actually suffering.

**Of the 18.6% reassignment rate, only 11.3 points are identified corrections.** The remaining 7.3
points cannot be classified, because no assignment reason is recorded. The true routing error rate
lies somewhere between 11.3% and 18.6%, and NorthstarIQ cannot narrow that range with its current
data. **This is the clearest possible argument for recording why every routing decision was made.**

### SLA

| Metric | Value |
|---|---:|
| Median assignment-to-first-touch | **9.1 business hours** |
| **Median created-to-first-touch** | **15.5 business hours** |
| Assumed response expectation | 4 business hours — **an assumption, not a documented commitment** |
| Attainment against that expectation | **34%** |
| Leads with no logged first-touch activity | **27%** — currently counted as breaches |

⚠️ **Two caveats govern every SLA claim in this project.** First, the 4-hour expectation is assumed;
NorthstarIQ has no documented, agreed response commitment. Second, 27% of records have no logged
activity — **an unmeasurable record is not the same as a breached one.** The honest breach range is
39%–66%, and reporting must distinguish response failure from measurement failure.

---

## 4. Business Problems

18 problems carried forward from discovery. Each traces to at least one requirement in
[`requirements.md`](requirements.md).

| ID | Problem | Domain | Priority | Evidence |
|---|---|---|---|---|
| `PROB-001` | Critical firmographic fields missing on nearly half of inbound records | Data Quality | **P1** | Synthetic Baseline |
| `PROB-002` | Existing customers are treated as net-new prospects | Identity | **P1** | Assumed |
| `PROB-003` | No record explains why a routing decision was made | Routing | **P1** | Assumed |
| `PROB-004` | Segmentation is unreliable and inherits upstream data defects | Segmentation | **P1** | Assumed |
| `PROB-005` | Ownership precedence between three assignment bases is undefined | Ownership | **P1** | Assumed |
| `PROB-006` | Speed-to-lead is slow and bimodal | Routing / SLA | **P1** | Synthetic Baseline |
| `PROB-007` | Response commitments cannot be measured reliably | SLA | **P1** | Synthetic Baseline |
| `PROB-008` | Duplicate records fragment relationships and inflate volume | Duplicates | **P2** | Synthetic Baseline |
| `PROB-009` | Territory definitions are inconsistent across segments | Territory | **P2** | Structural Finding |
| `PROB-010` | Qualification has no agreed definition | Qualification | **P2** | Assumed |
| `PROB-011` | Lifecycle stages are inconsistent; progression not measurable | Lifecycle | **P2** | Assumed |
| `PROB-012` | Operational exceptions are invisible and unowned | Exceptions | **P2** | Assumed |
| `PROB-013` | Salesforce access governance has never been assessed | Security | **P2** | To Be Validated |
| `PROB-014` | The same business question yields different answers | Reporting | **P2** | Assumed |
| `PROB-015` | Metric movements cannot be explained | Analytics | **P2** | Assumed |
| `PROB-016` | Changes are deployed without governance or regression safety | Change Mgmt | **P2** | To Be Validated |
| `PROB-017` | Business rules exist only as institutional knowledge | Documentation | **P3** | Assumed |
| `PROB-018` | Administration is a single-person reactive dependency | Administration | **P3** | Structural Finding |

**7 × P1 · 9 × P2 · 2 × P3**

### The dependency chain — why sequencing matters

```
Data Quality ──▶ Identity ──▶ Segmentation ──▶ Territory ──▶ Routing ──▶ SLA ──▶ Exceptions
     │                                                          │
     └──────────────────── Explainability ─────────────────────┘
                                   │
                                   ▼
                          Reporting ──▶ Analytics
```

Routing cannot be fixed before segmentation. Segmentation cannot be fixed before data quality.
**Building a correct routing engine on unreliable inputs produces a correct engine that assigns
records wrongly** — and the current environment is evidence of exactly that.

### The three problems that are not technical

`PROB-005` (ownership precedence), `PROB-008` (is a subsidiary a distinct customer?), and
`PROB-010` (what does "qualified" mean?) cannot be resolved by any amount of Salesforce design —
the underlying business rule has never been agreed. They are resolved here as **Portfolio
Decisions** and labelled as such. See [`requirements.md`](requirements.md) §4.

---

## 5. Scope

### In scope

| Area | What is included |
|---|---|
| Data quality | Normalization and completeness assessment at capture, explainable per record |
| Identity | Lead-to-Account matching with recorded basis; duplicate surfacing |
| Segmentation | Configuration-driven derivation with recorded basis |
| Territory | Deterministic resolution from governed configuration |
| Routing | Precedence-based assignment with a recorded reason for every decision |
| SLA | Response targets on governed business hours; first-touch capture; breach visibility |
| Exceptions | Detection, classification, queue visibility, measurement |
| Security | Permission-set-first access model, verified by negative testing |
| Reporting | Operational Salesforce reports and one dashboard |
| Analytics | Power BI model over the operational decision data |
| Testing | Deterministic scenario fixtures; validation outcomes recorded in the implementation log |
| Data | A small, deliberate synthetic dataset |

**In scope is not delivered.** This table states the release boundary. Reporting is partially
delivered (2 reports, 0 dashboards); **Power BI analytics and the synthetic dataset are not
started.** [`implementation-log.md`](implementation-log.md) is the authority on what exists.

### Out of scope

| Excluded | Reason |
|---|---|
| **Salesforce Data Cloud** | Explicitly outside this release. No design, configuration, or requirement. |
| **Salesforce Agentforce** | Explicitly outside this release. No design, configuration, or requirement. |
| Live marketing-automation integration | No system established; the capture interface is not built against a provider |
| Live enrichment provider | No provider established; the architecture assumes enrichment may not exist |
| CPQ, Revenue Cloud, Field Service, Experience Cloud | Not required by any recorded problem |
| Multi-org / CI-CD promotion | Single Developer Edition org with source control |
| Real customer, personal, or organizational data | Prohibited without exception |

### Enterprise design vs portfolio implementation

Where the two diverge, both are stated. **Substituting a lesser design and presenting it as the
intended architecture is prohibited.**

| Capability | Enterprise design | Portfolio implementation |
|---|---|---|
| Data volume | Hundreds of thousands of records | ~190 records, deterministic scenarios |
| Users | 64 revenue users across 4 markets | **1 representative non-admin Seller** — Developer Edition provides 4 Salesforce licences, 2 consumed by administrators. Round robin is deferred and untested. |
| Territory management | Enterprise Territory Management may be appropriate | Configuration-driven model within Developer Edition |
| Bulk processing | Proven under production load | Bulk-safe **design**; scale **not** claimed |
| SLA calendars | Four market calendars with holiday tables | Representative subset demonstrating the mechanism |
| Integration | Multiple authenticated integrations | Scoped access **model** designed and tested; no live integration |
| Environments | Multi-sandbox with CI/CD | Single Developer Edition org with source control |

### Scope control

Any proposed addition must pass all four tests:

1. Does it trace to a recorded `PROB-###`?
2. Does it demonstrate a competency in the target role set?
3. Can it be responsibly implemented in Developer Edition?
4. Can it be **tested and evidenced**, not merely built?

**If any answer is no, it is out of scope.**

**Anti-goals.** This project is not optimizing for file count, automation count, dataset size,
technology count, custom field count, Flow count, or apparent complexity. It optimizes for a
coherent, traceable, testable, explainable, administrator-maintainable architecture that one person
can build, operate, and defend.
