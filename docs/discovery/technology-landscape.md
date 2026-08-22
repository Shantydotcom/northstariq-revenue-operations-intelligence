# Technology Landscape — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Technology Landscape |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`current-state.md`](current-state.md) · [`dependencies.md`](dependencies.md) · [`project-scope.md`](project-scope.md) |

---

## ⚠️ Governing Rule for This Document

> **No vendor has been invented.**
>
> A real discovery engagement produces a system inventory by *asking* and *inspecting*. Neither has
> occurred here. Where a capability must logically exist for the business to function but no system
> has been established, this document records:
>
> ```
> UNKNOWN / TO BE VALIDATED
> ```
>
> It does **not** name HubSpot, Marketo, Pardot, Outreach, Salesloft, Apollo, Clay, ZoomInfo,
> Slack, Teams, an iPaaS, an ERP, a billing system, or a data warehouse. Naming one would
> fabricate a system inventory — creating a fictional dependency that later architecture would
> silently design against.
>
> Where later architecture requires such a system, the correct output is an **open question** or a
> **dependency**, never an invented vendor.

---

## 1. Established Technology

**Known Context** — given in the project brief.

| System | Role | Status |
|---|---|---|
| **Salesforce Sales Cloud** | Transactional system of record for Leads, Accounts, Contacts, Opportunities, ownership, assignment state, SLA state | Established |
| **Microsoft Power BI** | Analytics and decision-support layer | Established |

### Engineering toolchain

**Known Context**, versions verified locally on 2026-08-22.

| Tool | Version | Role |
|---|---|---|
| Git | 2.55.0 | Source control |
| GitHub | — | Remote repository, PR and issue governance |
| Salesforce CLI (`sf`) | 2.148.3 | Salesforce DX operations |
| VS Code | — | Development environment |
| Claude Code | — | AI-assisted engineering, governed per `CLAUDE.md` |
| D2 | 0.7.1 | Architecture diagrams |
| Python | 3.14.7 | Synthetic data generation, validation scripting |
| Node.js | 24.19.0 | Salesforce CLI runtime |
| PowerShell | 5.1 | Windows-native scripting, repository validation |

**Note.** The Salesforce CLI installed is `@salesforce/cli` v2 (the `sf` command). The legacy
`sfdx-cli` v7 is deprecated and is deliberately not used.

---

## 2. System-of-Record Ownership

**Assumption**, following from the established technology and the project's system-of-record
principle.

| Data domain | System of record | Confidence |
|---|---|---|
| Leads | Salesforce Sales Cloud | Assumed |
| Accounts | Salesforce Sales Cloud | Assumed |
| Contacts | Salesforce Sales Cloud | Assumed |
| Opportunities | Salesforce Sales Cloud | Assumed |
| Seller ownership | Salesforce Sales Cloud | Assumed |
| Operational assignment state | Salesforce Sales Cloud | Assumed |
| SLA state | Salesforce Sales Cloud | Assumed |
| Territory definitions | **UNKNOWN** | **To Be Validated** |
| Segment definitions | **UNKNOWN** | **To Be Validated** |
| ICP / qualification criteria | **UNKNOWN** | **To Be Validated** |
| Lifecycle stage definitions | **UNKNOWN** | **To Be Validated** |
| KPI definitions | **UNKNOWN** | **To Be Validated** |
| Customer status (active vs churned) | **UNKNOWN** | **To Be Validated** |
| Strategic Account designation | **UNKNOWN** | **To Be Validated** |
| Holiday and business-hours calendars | **UNKNOWN** | **To Be Validated** |
| Analytics semantic definitions | Power BI (presumed) | Assumed |

**Finding.** Nine of the seventeen domains have **no established system of record.** These are
precisely the *definitional* assets — territory, segment, ICP, lifecycle, KPI, Strategic
designation, customer status, business hours.

This is a substantial discovery result. The definitions that drive routing, qualification,
segmentation, and reporting **may exist only as institutional knowledge, or in spreadsheets, or
inconsistently across several places.** That is entirely consistent with the symptoms in
[`current-state.md`](current-state.md): rules that live nowhere authoritative cannot be applied
consistently, cannot be versioned, and cannot be audited.

**Establishing a system of record for business definitions is therefore a core architectural
objective**, not an administrative afterthought. It is the direct justification for the
metadata-driven approach: Custom Metadata Types make definitions into governed, deployable,
version-controlled configuration rather than tribal knowledge.

**Power BI must not be positioned as system of record for anything.** Where an unknown ownership is
resolved, it must resolve to Salesforce or to an explicitly identified external system — never to
the analytics layer.

---

## 3. Capabilities Required but Not Established

Capabilities the business model logically implies. **None has an identified system.**

| # | Capability | Why it is implied | Status |
|---|---|---|---|
| `TL-01` | Marketing automation / inbound capture | 24,000 inquiries/yr must arrive through some mechanism; an MQL concept exists | **UNKNOWN / TO BE VALIDATED** — `DEC-014` |
| `TL-02` | Web form / landing page capture | Inbound Leads must originate somewhere | **UNKNOWN / TO BE VALIDATED** |
| `TL-03` | Firmographic enrichment | 44% missing employee count implies either no enrichment, failing enrichment, or enrichment not applied at capture | **UNKNOWN / TO BE VALIDATED** — `DEC-015` |
| `TL-04` | Sales engagement / activity capture | 27% of Leads have no logged first touch — this may be a tooling gap, a process gap, or both | **UNKNOWN / TO BE VALIDATED** |
| `TL-05` | Billing / subscription management | Recurring revenue must be invoiced; ARR must be sourced from somewhere | **UNKNOWN / TO BE VALIDATED** |
| `TL-06` | Customer success platform | 650 customers with 22% logo churn implies some CS motion | **UNKNOWN / TO BE VALIDATED** |
| `TL-07` | Data warehouse / analytics store | Power BI must read from somewhere; direct connection vs intermediate store is undetermined | **UNKNOWN / TO BE VALIDATED** — `DEC-020` |
| `TL-08` | Integration / middleware layer | Any of the above would require a data path | **UNKNOWN / TO BE VALIDATED** |
| `TL-09` | Identity provider / SSO | 450 employees implies centralized identity | **UNKNOWN / TO BE VALIDATED** |

### Why each matters to later architecture

| Capability | Architectural consequence if unresolved |
|---|---|
| `TL-01`, `TL-02` | Determines where Lead source and channel values originate, and whether the taxonomy (`DEC-011`) can be enforced at capture or only corrected afterward. Whether a marketing automation platform exists at all, and what falls inside its boundary, is `DEC-014` — it also determines whether the MQL definition (`DEC-009`, `DEC-010`) is enforced upstream of Salesforce or inside it. |
| `TL-03` | **Materially changes the data-quality design.** If enrichment is available, missing firmographics can be filled. If not, the architecture must handle 48% incomplete data as a permanent condition rather than a transient one. |
| `TL-04` | Determines whether first-touch (`DEC-012`) can be measured automatically or depends on manual logging discipline — which determines whether the SLA framework can be trusted |
| `TL-05` | Determines whether customer status and ARR are authoritative in Salesforce or sourced externally — affects existing-customer detection (`PROB-002`) |
| `TL-06` | Determines whether churn status reaches Salesforce, and therefore whether churned Accounts can be excluded from customer detection |
| `TL-07`, `TL-08` | Directly determines the Power BI data-access and refresh architecture (`DEC-020`) |
| `TL-09` | Affects the user provisioning and access model (`DEC-021`) |

**Finding.** `TL-03` (enrichment) is the highest-leverage unknown in this document. The correct data
quality architecture differs fundamentally depending on the answer:

- **If enrichment exists but is not applied at capture** → the problem is a process and sequencing
  problem, and the fix is largely orchestration.
- **If no enrichment exists** → 48% incomplete data is a permanent operating condition, and the
  architecture must be designed to route, qualify, and escalate reliably *without* complete data.

**These are materially different architectures. This question must be resolved before the Revenue
Data Quality Framework is designed.** It is registered as `DEC-015`.

---

## 4. Explicitly Excluded Technology

| Technology | Status | Rule |
|---|---|---|
| **Salesforce Data Cloud** | Outside the scope of the current portfolio release | No directories, ADRs, requirements, decisions, tests, or phases |
| **Salesforce Agentforce** | Outside the scope of the current portfolio release | No directories, ADRs, requirements, decisions, tests, or phases |

These are not part of the current architecture and must not appear as active components anywhere.
They may be referenced only as a brief future-expansion note.

**Additionally excluded from the current release** (see [`project-scope.md`](project-scope.md) §3.2):
Salesforce CPQ, Billing, Service Cloud, Experience Cloud, Field Service, Marketing Cloud, Commerce
Cloud — none traces to a recorded problem.

---

## 5. Salesforce Environment

| Item | Detail | Status |
|---|---|---|
| Target org | Salesforce **Developer Edition** | Known Context |
| Org exists / provisioned | Not confirmed | **Dependency** — see [`dependencies.md`](dependencies.md) |
| Authentication performed | **No** | Phase 1, requires explicit approval |
| Edition | Developer | Known Context |
| API version | `sourceApiVersion 67.0` in `sfdx-project.json` | To be verified against the org in Phase 1 |
| Sandbox availability | Developer Edition does not include sandboxes | Known constraint |
| Deployment target | The Developer Edition org itself | Constrains change management design |

**Finding.** Developer Edition provides no sandbox. Change management must therefore rely on source
control, structural validation, `sf project deploy --dry-run`, and disciplined test execution rather
than environment promotion. **This is a genuine gap against the Enterprise Design**, and it is
documented rather than hidden: the enterprise design would use a multi-sandbox promotion path.

**Finding.** Developer Edition user licences are limited. This constrains how many personas can be
demonstrated simultaneously and is a direct input to the Phase 1 user design. The exact allocation
has not been checked — recorded as a dependency, not assumed.

---

## 6. Data Flow — Current State

**Assumed and incomplete.** Presented at the level actually supportable by discovery.

```
   [ UNKNOWN inbound capture: TL-01 / TL-02 ]
                    │
                    ▼
        ┌───────────────────────┐
        │  Salesforce Sales     │   ← [ UNKNOWN enrichment: TL-03 ] (if any)
        │  Cloud                │
        │                       │   ← manual entry / import
        │  Lead → Account →     │
        │  Contact → Opportunity│   ← [ UNKNOWN activity capture: TL-04 ] (if any)
        └───────────┬───────────┘
                    │
                    ▼
        [ UNKNOWN data path: TL-07 / TL-08 ]
                    │
                    ▼
            ┌───────────────┐
            │  Power BI     │
            └───────────────┘
```

**Finding.** Both ends of the flow are unknown, and the path to Power BI is unknown. **Only the
middle is established.** This is an accurate representation of what discovery has determined — and
producing a confident-looking end-to-end diagram would be fabrication.

**Open Question — `DEC-020`.** How Power BI accesses Salesforce data, at what frequency, and whether
an intermediate store exists is unresolved. This affects the analytics historical-data strategy
(`DEC-016`), because whether history can be retained outside Salesforce depends on it.

---

## 7. Validation Targets

Priority order for a real engagement, ranked by architectural consequence.

| Priority | Question | Blocks |
|---|---|---|
| 1 | Does firmographic enrichment exist, and is it applied at capture? (`TL-03`) | Revenue Data Quality Framework design |
| 2 | Where do territory, segment, ICP, and lifecycle definitions currently live? | Metadata-driven configuration design |
| 3 | How does Power BI currently access Salesforce data? (`TL-07`, `TL-08`) | `DEC-020`, `DEC-016` |
| 4 | Is activity capture automated or manual? (`TL-04`) | SLA measurement reliability (`DEC-012`) |
| 5 | Is customer status (active vs churned) authoritative in Salesforce? (`TL-05`, `TL-06`) | Existing-customer detection (`PROB-002`) |
| 6 | What inbound capture mechanism exists? (`TL-01`, `TL-02`) | Lead source taxonomy (`DEC-011`) |
| 7 | Does any integration user or middleware currently connect to Salesforce? (`TL-08`) | Security model (`DEC-021`) |
| 8 | Is user provisioning centralized? (`TL-09`) | Access model (`DEC-021`) |

---

## 8. Summary

| Category | Count |
|---|---:|
| Established systems | 2 (Salesforce Sales Cloud, Power BI) |
| Established engineering tools | 9 |
| Data domains with a known system of record | 8 |
| Data domains with **UNKNOWN** ownership | 9 |
| Capabilities implied but not established | 9 |
| Vendors invented | **0** |

**The most significant finding in this document is the absence of a system of record for business
definitions.** Territory, segment, ICP, lifecycle, KPI, Strategic designation, customer status, and
business hours have no established authoritative home. Rules that live nowhere authoritative cannot
be applied consistently, versioned, or audited — which is a sufficient explanation for a large share
of the symptoms recorded in [`current-state.md`](current-state.md), independent of any Salesforce
configuration defect.
