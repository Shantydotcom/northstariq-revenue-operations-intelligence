# Assumptions Register — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Assumptions Register |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`current-state.md`](current-state.md) · [`risks.md`](risks.md) · [`technology-landscape.md`](technology-landscape.md) |

---

## Purpose

An assumption is something **believed true but not verified**, which later work depends on. Recording
assumptions makes the dependency explicit, so that if one proves false the affected work can be
identified rather than silently failing.

### Assumption vs Open Decision — an important distinction

| | Assumption | Open Decision |
|---|---|---|
| **Nature** | A fact believed true | A choice not yet made |
| **Resolved by** | Verification / inspection | Human judgement |
| **Example** | "Churned Accounts remain in Salesforce" | "Should existing-customer ownership override territory?" |
| **Register** | This document (`ASM-###`) | `docs/requirements/open-decisions.md` (`DEC-###`), Phase 0C |

**Confusing the two is a governance failure.** Treating a decision as an assumption resolves it
silently; treating an assumption as a decision escalates something that only needs checking.

### Classification of assumption types

| Type | Meaning |
|---|---|
| **Synthetic Planning Assumption** | Invented to make the fictional scenario coherent. Cannot be "wrong" — but must not be treated as fact. |
| **Environmental Assumption** | Believed true of the NorthstarIQ environment. Requires validation. |
| **Project Assumption** | Believed true about how this project will run. Requires confirmation. |

### Impact scale

| Impact | Meaning if the assumption proves false |
|---|---|
| **High** | Requires architecture rework |
| **Medium** | Requires design adjustment within the established architecture |
| **Low** | Requires documentation correction only |

---

## Register Summary

| Impact | Count |
|---|---:|
| High | 8 |
| Medium | 11 |
| Low | 5 |
| **Total** | **24** |

| Type | Count |
|---|---:|
| Synthetic Planning Assumption | 9 |
| Environmental Assumption | 11 |
| Project Assumption | 4 |

---

## High Impact

### `ASM-001` — Firmographic enrichment availability is unknown and may not exist

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | The architecture assumes it may have to operate **without** reliable automated firmographic enrichment. |
| **Basis** | 44% missing employee count and 31% missing industry are consistent with either no enrichment, failing enrichment, or enrichment not applied at capture. No enrichment system has been established ([`technology-landscape.md`](technology-landscape.md) `TL-03`). |
| **Impact if false** | **High.** If enrichment *is* available and can be applied at capture, the Revenue Data Quality Framework becomes largely an orchestration problem rather than a design-for-incompleteness problem. These are materially different architectures. |
| **Validation** | Determine whether any enrichment capability exists and where it sits in the record lifecycle. |
| **Related** | `PROB-001`, `DEC-015`, `TL-03` |

> **This is the single highest-leverage unknown in the discovery.** It is deliberately recorded as
> an assumption of *absence* — designing for the harder condition is safe; designing for enrichment
> that does not exist is not.

---

### `ASM-002` — Salesforce is the authoritative source for customer status

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | Whether an Account is an active customer or has churned is determinable from Salesforce. |
| **Basis** | Salesforce is the established system of record for Accounts. No billing or CS system has been established. |
| **Impact if false** | **High.** Existing-customer detection (`PROB-002`) depends on it. If customer status is authoritative elsewhere and not synchronized, routing may treat churned relationships as active, or active customers as prospects. |
| **Validation** | Determine where customer status originates and whether it reaches Salesforce reliably. |
| **Related** | `PROB-002`, `TL-05`, `TL-06`, `DEC-003` |

---

### `ASM-003` — Churned Accounts remain in Salesforce and are distinguishable

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | Accounts for churned customers are retained and can be distinguished from active customers. |
| **Basis** | Standard practice; 139 logos churned in the trailing year ([`revenue-model.md`](revenue-model.md) §4) must exist somewhere. |
| **Impact if false** | **High.** If churned Accounts are indistinguishable, existing-customer detection will match inbound interest to ended relationships and route it to a former owner. |
| **Validation** | Inspect how churn is represented on the Account. |
| **Related** | `PROB-002`, `ASM-002` |

---

### `ASM-004` — Stage transition history is not currently retained

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | Lifecycle and status transition history is not retained in a queryable form. |
| **Basis** | Consistent with the inability to explain metric movements (`PROB-015`) and the absence of progression visibility (`PROB-011`). |
| **Impact if false** | **High** — favourably. If history *is* retained, retrospective analysis becomes possible immediately and `DEC-018` is substantially simplified. |
| **Validation** | Determine what field history tracking is enabled and its retention period. |
| **Related** | `PROB-011`, `PROB-015`, `DEC-018` |

> **Asymmetric consequence.** History not captured cannot be recovered later. The persistence
> decision must be made **before** implementation, because the cost of deciding late is permanent
> data loss.

---

### `ASM-005` — Business permissions are currently profile-based

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | The current org likely manages business permissions substantially through profiles rather than permission sets. |
| **Basis** | Consistent with a long-lived org (~9 years) that predates permission-set-led design becoming standard practice. |
| **Impact if false** | **High** — favourably. If permission sets are already in use, the security workstream becomes refinement rather than restructure. |
| **Validation** | Inventory profile vs permission-set usage. |
| **Related** | `PROB-013`, `DEC-021` |

> **This assumption must not be reported as a finding.** [`current-state.md`](current-state.md) §12
> explicitly does not claim any security defect. This is a design posture, not an assessment.

---

### `ASM-006` — Routing logic exists in more than one mechanism

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | Owner assignment is determined by more than one mechanism, without documented precedence. |
| **Basis** | Three assignment bases coexist in the org structure ([`sales-organization.md`](sales-organization.md) §1); accumulation across four growth phases; 18.6% reassignment. |
| **Impact if false** | **High.** If routing is a single coherent mechanism, the problem is a logic defect rather than an architectural fragmentation problem — a much smaller remediation. |
| **Validation** | Complete inventory of every mechanism capable of setting Owner. |
| **Related** | `PROB-003`, `PROB-005`, `DEC-003` |

---

### `ASM-007` — Developer Edition can support the intended demonstration

| Field | Detail |
|---|---|
| **Type** | Project Assumption |
| **Statement** | Developer Edition provides sufficient licences, storage, and feature availability to demonstrate the designed architecture. |
| **Basis** | The dataset is deliberately small; the design favours declarative features generally available in Developer Edition. |
| **Impact if false** | **High.** Would require design substitution and re-scoping. |
| **Validation** | Confirm licence count, storage, and availability of required features in Phase 1. |
| **Related** | `RISK-001`, `DEP-002` |

> **Known gap:** Developer Edition provides **no sandbox**. This is already documented as a stated
> divergence from the Enterprise Design rather than an assumption.

---

### `ASM-008` — Business definitions have no authoritative system of record

| Field | Detail |
|---|---|
| **Type** | Environmental Assumption |
| **Statement** | Territory, segment, ICP, lifecycle, KPI, Strategic designation, and business-hours definitions exist as institutional knowledge or scattered documents, not as governed configuration. |
| **Basis** | Nine of seventeen data domains have unknown ownership ([`technology-landscape.md`](technology-landscape.md) §2); consistent with inconsistent application of all of them. |
| **Impact if false** | **High** — favourably. If an authoritative source exists, the definitional work becomes migration rather than establishment. |
| **Validation** | Ask where each definition currently lives and who owns it. |
| **Related** | `PROB-004`, `PROB-009`, `PROB-010`, `PROB-011`, `PROB-014` |

> This assumption is the direct justification for the metadata-driven approach. It should be
> validated early, because it shapes the entire configuration strategy.

---

## Medium Impact

| ID | Assumption | Type | Basis | Impact if false | Related |
|---|---|---|---|---|---|
| `ASM-009` | A formal response SLA has never been agreed | Environmental | The 4-hour figure is inferred, not documented | Measurement target changes; baseline reinterpreted | `PROB-007`, `DEC-006` |
| `ASM-010` | Activity logging is manual and inconsistently performed | Environmental | 27% of Leads have no logged first touch | If capture is automated, the 27% is genuine non-contact — a worse finding | `PROB-007`, `TL-04`, `DEC-012` |
| `ASM-011` | Inbound Leads arrive through more than one entry path with differing enforcement | Environmental | Explains inconsistent field population | Data quality controls need fewer enforcement points | `PROB-001` |
| `ASM-012` | Duplicate rules either do not exist or warn rather than block | Environmental | 14.2% duplicate rate persists | Duplicates arise despite blocking — different root cause | `PROB-008`, `DEC-004` |
| `ASM-013` | Territory definitions are not versioned | Environmental | Territories "have changed repeatedly" with no versioning mechanism established | Historical territory analysis becomes possible | `PROB-009`, `DEC-022` |
| `ASM-014` | Segment is stored as a field, populated inconsistently | Environmental | Segment introduced for reporting, later reused for routing | Segmentation redesign scope changes | `PROB-004`, `DEC-001` |
| `ASM-015` | Marketing and Sales use different qualification definitions | Environmental | Persistent disagreement is characteristic of definitional mismatch | The dispute is genuinely about performance — harder to resolve | `PROB-010` |
| `ASM-016` | Power BI reads Salesforce data without an intermediate warehouse | Environmental | No warehouse established; simplest architecture consistent with company size | Analytics history strategy changes materially | `TL-07`, `DEC-016`, `DEC-020` |
| `ASM-017` | No production integration currently writes to Salesforce | Environmental | No integration platform established | Integration user access model must accommodate existing usage | `PROB-013`, `TL-08`, `DEC-021` |
| `ASM-018` | Salesforce metadata is not currently source-controlled | Environmental | Consistent with weak change governance | Change management remediation is smaller | `PROB-016` |
| `ASM-019` | The single administrator has no formal deputy | Environmental | Headcount model shows one administrator | Key-person risk is lower than assessed | `PROB-018`, `RISK-014` |

---

## Low Impact

| ID | Assumption | Type | Note |
|---|---|---|---|
| `ASM-020` | UK and Germany customer data falls under UK/EU GDPR | Environmental | Affects the Enterprise Design column only — all portfolio data is synthetic |
| `ASM-021` | Segment names are used consistently in conversation | Environmental | Terminology inconsistency would be a documentation finding, not an architecture change |
| `ASM-022` | The four markets use four distinct public-holiday calendars | Environmental | Follows from the market list; affects SLA calendar design detail |
| `ASM-023` | Opportunity records are created from converted Leads and directly | Project | Affects funnel measurement scope, already caveated at 71.4% Lead-sourced |
| `ASM-024` | The Salesforce Administrator and the RevOps practitioner are distinct people | Project | Affects persona modelling only |

---

## Synthetic Planning Assumptions

**These cannot be "validated" — they are invented to make the fictional scenario coherent.** They are
listed so that no reader mistakes them for observations.

| ID | Assumption | Document |
|---|---|---|
| `ASM-025` | NorthstarIQ sells a workforce planning and labor-operations SaaS platform | `company-profile.md` §2 |
| `ASM-026` | Pricing is per-employee, per-month with volume tiers | `company-profile.md` §2, `revenue-model.md` §2 |
| `ASM-027` | Segment distribution: 325 / 240 / 74 / 11 customers | `revenue-model.md` §1 |
| `ASM-028` | ACV bands: $26K / $58K / $185K / $540K | `revenue-model.md` §1 |
| `ASM-029` | ARR waterfall: $34.80M + $6.90M + $5.50M − $5.20M = $42.00M | `revenue-model.md` §3 |
| `ASM-030` | Market distribution: US 400, UK 105, Canada 85, Germany 60 | `company-profile.md` §4 |
| `ASM-031` | Sales headcount: 30 AEs, 18 SDR/BDR, 64 revenue users total | `sales-organization.md` §2 |
| `ASM-032` | Growth history across four phases over ~11 years | `company-profile.md` §5 |
| `ASM-033` | All baseline metric values | `baseline-metrics.md` |

> **`ASM-027` and `ASM-028` carry a specific hazard.** The observed employee ranges and ACV bands
> describe the current customer base. They are **descriptive, not prescriptive**, and must never be
> converted into Salesforce segmentation thresholds without resolving `DEC-001` and `DEC-002`.
> [`revenue-model.md`](revenue-model.md) states this prominently; it is repeated here because the
> conversion would be easy to make accidentally and hard to detect afterward.

---

## Validation Priority

Ordered by architectural consequence — this is what a real engagement would ask first.

| # | Assumption | Question |
|---|---|---|
| 1 | `ASM-001` | Does firmographic enrichment exist, and is it applied at capture? |
| 2 | `ASM-008` | Where do territory, segment, ICP and lifecycle definitions live today? |
| 3 | `ASM-004` | Is stage transition history retained anywhere? |
| 4 | `ASM-006` | What is the complete inventory of mechanisms that can set Owner? |
| 5 | `ASM-002` / `ASM-003` | Is customer status authoritative in Salesforce, and are churned Accounts distinguishable? |
| 6 | `ASM-016` | How does Power BI access Salesforce data today? |
| 7 | `ASM-010` | Is activity capture automated or manual? |
| 8 | `ASM-005` / `ASM-017` | What is the current profile/permission-set posture and integration access? |

---

## Governance

- Assumptions are **immutable identifiers**. A disproven assumption is marked `Disproven` with the
  correction recorded; it is never deleted or renumbered.
- An assumption that becomes verified is marked `Confirmed` and cited as a Finding thereafter.
- An assumption that turns out to require a human choice is **promoted to a `DEC-###`**, not
  resolved in place.
- **No assumption in this register may be silently converted into a business rule.**
