# NorthstarIQ — Revenue Operations Intelligence Platform

**Enterprise Salesforce · Revenue Operations · GTM Systems & Analytics**

A governed Revenue Operations architecture built on Salesforce Sales Cloud and Microsoft Power BI
for **NorthstarIQ**, a fictional $42M-ARR B2B SaaS company.

> ⚠️ **Current status.** Salesforce Increments 1-4 are deployed and human-accepted. The
> NorthstarIQ assessment application under [`web/`](web/) is implemented and **verified locally
> against fixtures and its disconnected state only** - no Salesforce Connected App exists, so it has
> **never connected to the org**, and it is **not deployed**.
> [`docs/implementation-log.md`](docs/implementation-log.md) is the sole authority on what exists.

---

## The Argument

Revenue Operations problems are rarely isolated Salesforce configuration problems. They emerge from
disconnected data, inconsistent definitions, weak governance, unclear ownership logic, fragmented
automation, and no way to explain why the system did what it did.

So this is not built as *custom fields + Flows + reports + a dashboard*. It is built as:

```
Business problem → requirement → business rule → architecture decision → data design
  → security design → Salesforce component → automation → operational evidence
    → reporting → analytics → testing → measured outcome
```

**The single design idea running through all of it:** every decision the system makes — how a record
was segmented, which territory it landed in, why it went to *that* seller, whether the SLA clock was
even measurable — is recorded as data at the moment it is made. Explainability is a data-capture
obligation designed in at the decision point, not a reporting feature bolted on afterwards.

That idea comes from a real finding. At NorthstarIQ, 18.6% of Leads are reassigned within 30 days.
Only 11.3 points are identifiable corrections. **The remaining 7.3 points cannot be classified at
all, because nothing records why any assignment happened.** The routing error rate is somewhere
between 11.3% and 18.6%, and no query can narrow it.

---

## The Company

Fictional. Every figure below is invented to make the scenario coherent.

| | |
|---|---|
| ARR | ~$42M · ~650 customers · ~450 employees (64 revenue-facing) |
| Markets | US · Canada · UK · Germany |
| Segments | SMB · Mid-Market · Enterprise · Strategic |
| Stack | Salesforce Sales Cloud · Microsoft Power BI · a read-only Next.js assessment application |

NorthstarIQ grew from ~$4M to ~$42M ARR in six years. Salesforce was configured incrementally by
whoever needed something, the sales process changed three times without the prior configuration
being retired, and documentation was written once and never again. **Nothing here is the result of a
bad decision** — it is the accumulated result of many locally reasonable ones taken without a
governing architecture.

### What is wrong (synthetic baselines)

| Finding | Figure |
|---|---:|
| Leads missing a field routing structurally requires | **48%** |
| Median time to assignment | **6.4 business hours** |
| P90 time to assignment | **41 business hours** |
| Leads unassigned beyond 24 business hours | **21%** |
| SLA attainment against an *assumed* 4-hour target | **34%** |
| Leads where first touch cannot be determined at all | **27%** |

**Two of these matter more than the rest.** At a 48% incomplete-data rate, the exception path *is*
the main path — any design treating incomplete data as an edge case fails on half of real volume.
And the 6.4× gap between median and P90 is the signature of a bimodal process: improving the median
would not help the population that is actually suffering.

---

## Documentation

Nine documents. Read in this order.

| Document | What it holds |
|---|---|
| [`business-case.md`](docs/business-case.md) | The company, the current state, 18 business problems, synthetic baselines, scope |
| [`requirements.md`](docs/requirements.md) | **23 business requirements**, 6 personas, 12 Portfolio Decisions, traceability, consolidation crosswalk |
| [`architecture.md`](docs/architecture.md) | 🟡 Candidate design — automation, configuration model, segmentation, territory, routing, SLA, exceptions |
| [`data-model.md`](docs/data-model.md) | 🟡 Candidate fields — standard-first analysis, 22 candidates, naming, PII classification |
| [`metric-dictionary.md`](docs/metric-dictionary.md) | 8 metrics with definitions, baselines, and **honest reliability classes** |
| [`security-model.md`](docs/security-model.md) | 🟡 Candidate access model — OWD, roles, 4 permission sets, queues, verification approach |
| [`testing-strategy.md`](docs/testing-strategy.md) | 17 scenarios, dataset spec, access test matrix, evidence standard |
| [`assumptions.md`](docs/assumptions.md) | 14 assumptions, 8 risks, 5 open decisions, dependencies |
| [`implementation-log.md`](docs/implementation-log.md) | **The running record of what was actually built** |

[`CLAUDE.md`](CLAUDE.md) is the engineering contract governing how work is done here.
[`web/README.md`](web/README.md) documents the assessment application: its four routes, six checks,
scoring, and credential boundary.

> 🟡 **Candidate** means documented, not built, and not committed to being built. No Salesforce org
> has been inspected. Candidates are expected to be **removed** after org inspection — that is the
> purpose of the step.

---

## Planned Implementation

Preferred envelope. **Guidelines, not quotas** — never add metadata to reach a number.

| Component | Preferred | Candidate |
|---|---|---:|
| Custom fields | ~15–25 | 22 |
| Flows | ~3–5 | 4 |
| Custom Metadata Types | ~1–3 | 2 (+1 conditional) |
| Permission sets | ~3–5 | 4 |
| Queues | ~1–3 | 2 |
| Reports · dashboards | ~5–8 · 1 | 7 · 1 |
| **Apex classes** | **0** | **0** |
| Dataset | — | ~190 records |

**Standard Salesforce first.** Business Hours, Holidays, field history tracking, Duplicate Rules,
`ParentId`, and standard firmographic fields already exist and will be used as such. **Zero custom
fields are proposed for firmographic storage** — what was missing at NorthstarIQ was never storage,
it was governed behaviour and explainability.

---

## Repository

```
docs/                 9 consolidated documents
web/                  Next.js assessment application — read-only over the org
force-app/main/default/    Salesforce DX source — empty until metadata exists
data/       sample/ expected/     Small synthetic dataset
tests/      scenarios/ results/   Scenario definitions and recorded outcomes
scripts/    python/ soql/ powershell/
powerbi/    Power BI artifacts — structure created when artifacts exist
prompts/    claude-code/          Evidence of governed AI-assisted engineering
manifest/  config/  .github/
```

Metadata directories under `force-app/` appear as real components are created — none are
pre-created.

---

## Approach

**The implementation is the primary artifact. Documentation supports the implementation.**

| Principle | In practice |
|---|---|
| **Standard Salesforce first** | Evaluate standard → existing config → formula/validation → Flow → Custom Metadata → custom field → Apex last |
| **Flow before Apex** | Apex target is zero. No requirement has been found that Flow cannot meet. |
| **Configuration over code** | Thresholds, territory maps, routing precedence, and SLA targets live in Custom Metadata — a business change should not need a deployment |
| **Requirement traceability** | If you cannot name the `BR-##` a change serves, the change is not ready |
| **Decide openly, never fabricate** | Unagreed business rules are resolved as **Portfolio Decisions** by the practitioner, with rationale and reversibility recorded. **Never as stakeholder approval — NorthstarIQ has no stakeholders.** |
| **Test the requirement** | Assert acceptance criteria, not implementation, so tests survive a change of mechanism |
| **Negative assertions first** | For access, proving something *cannot* happen is the primary evidence |

### Where the design refuses to guess

Five decisions remain genuinely open. Each has a defined interim behaviour, and **none blocks the
build** — because where a business rule is unagreed, the pattern is to build the capability and
leave the rule configurable rather than inventing the rule.

> Writing a threshold into a Flow because someone had to pick one is precisely the failure that
> produced NorthstarIQ's ownership, qualification, and undocumented-rule problems in the first place.

---

## Synthetic Data

**NorthstarIQ is fictional. All data is invented.**

No real customer, personal, or organizational data appears anywhere in this repository or in the
org. Any resemblance to real companies or individuals is coincidental.

Baselines are labelled **Synthetic Baseline** and were constructed to make the scenario coherent.
A synthetic baseline can demonstrate that a design *would* move a metric. **It can never demonstrate
that a metric was moved**, and no claim here will say otherwise.

---

## Evidence Standard

Documentation alone does not prove implementation. A capability is described as **Validated** only
when the metadata is in source control, the scenario was executed against a loaded dataset, the
actual outcome was recorded **including failures**, and a re-runnable SOQL query or report supports
it.

Anything else is labelled **Candidate**, **Implemented**, or **Deferred** — never as more than it is.

---

## Future Expansion

**Salesforce Data Cloud** and **Salesforce Agentforce** are intentionally outside this release. No
implementation, requirements, or architecture exist for them, and none will be created here.

---

<sub>Salesforce Sales Cloud · Salesforce DX · Power BI · Next.js · React · TypeScript · D2 · Python ·
PowerShell · Git · GitHub · VS Code · Claude Code. All data synthetic. Fictional company.</sub>
