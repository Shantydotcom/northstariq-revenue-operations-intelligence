# Personas

| Field | Value |
|---|---|
| **Document** | Personas |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Implementation State** | Target State |
| **Related** | [`business-requirements.md`](business-requirements.md) · [`open-decisions.md`](open-decisions.md) · [`../security/access-model.md`](../security/access-model.md) · [`../discovery/sales-organization.md`](../discovery/sales-organization.md) |

---

## Purpose and Discipline

Personas exist to answer one question for every requirement: **who needs this capability, and what
does it let them do that they cannot do today?** A requirement with no owning persona has no
identified beneficiary and should be challenged.

> **The roster is not created here.** `PER-01`–`PER-17` were allocated in Phase 0B
> ([`../discovery/sales-organization.md`](../discovery/sales-organization.md) §5). Identifiers are
> immutable. This document supplies the detail Phase 0B deliberately deferred: responsibilities,
> Salesforce interaction, information needs, pain points, expected capabilities, and access
> considerations.

### What this document does NOT do

- ❌ It does not invent named fictional employees. Personas are **roles**, not people. A portfolio
  populated with invented biographies adds fictional surface area and no analytical value.
- ❌ It does not define Permission Sets, Profiles, roles, or sharing rules. Access **considerations**
  are recorded here; the access **design** is [`../security/access-model.md`](../security/access-model.md),
  and both remain `Proposed` pending `DEC-021`.
- ❌ It does not assert that any persona currently has, or lacks, any Salesforce permission. **No org
  has been inspected** — see `PROB-013`.

---

## 1. Business Organization vs Portfolio Salesforce Users

> **This distinction is load-bearing and is preserved from Phase 0B.**

| | Business Organization | Portfolio Salesforce Users |
|---|---|---|
| **What it is** | The fictional NorthstarIQ revenue team | Actual Users created in Salesforce Developer Edition |
| **Size** | 64 people across 17 personas | Minimum necessary — a small number |
| **Purpose** | Makes the business scenario coherent | Demonstrates the access model and routing behaviour |
| **Defined in** | This document | Phase 1 — not determined here |

**Seventeen personas does not mean seventeen Salesforce Users.** Several personas share an access
shape; several are reporting consumers needing read access only; one (`PER-17`) is not a human at
all. The Developer Edition user list is a Phase 1 design task with its own licence constraint
([`../discovery/dependencies.md`](../discovery/dependencies.md)), and pre-deciding it here would be
premature solution design.

---

## 2. Persona Roster

| ID | Persona | Count | Category | Primary concern |
|---|---|---:|---|---|
| `PER-01` | VP Sales | 1 | Leadership | Predictable attainment and coverage |
| `PER-02` | Sales Manager | 3 | Leadership | Team performance, fair distribution |
| `PER-03` | Strategic AE | 2 | Seller | Named-account depth |
| `PER-04` | Enterprise AE | 8 | Seller | Territory coverage, deal quality |
| `PER-05` | Mid-Market AE | 9 | Seller | Volume with quality |
| `PER-06` | SMB AE | 11 | Seller | Velocity |
| `PER-07` | SDR | 10 | Pipeline generation | Fast, qualified inbound follow-up |
| `PER-08` | BDR | 8 | Pipeline generation | Outbound targeting accuracy |
| `PER-09` | SDR/BDR Manager | 2 | Leadership | Capacity and response performance |
| `PER-10` | Revenue Operations | 3 | Operations | Process integrity and explainability |
| `PER-11` | Sales Operations | 2 | Operations | Day-to-day operational support |
| `PER-12` | Marketing Operations | 2 | Operations | Lead flow and qualification handoff |
| `PER-13` | Salesforce Administrator | 1 | Platform | Maintainability, access, change safety |
| `PER-14` | Data / BI Analyst | 2 | Analytics | Trustworthy metrics |
| `PER-15` | Marketing Leadership | — | Leadership | Pipeline contribution |
| `PER-16` | Executive Leadership | — | Leadership | Revenue visibility and risk |
| `PER-17` | Integration User | n/a | **Non-human principal** | System-to-system access |

*Counts are the Synthetic Planning Assumption headcount from
[`../discovery/sales-organization.md`](../discovery/sales-organization.md) §2, totalling the 64
modelled revenue users. `PER-15` and `PER-16` are consumers outside the modelled 64.*

### Persona categories and what they imply

| Category | Personas | Access shape implied |
|---|---|---|
| **Seller** | `PER-03`–`PER-06` | Read/write on owned records; visibility governed by hierarchy and sharing |
| **Pipeline generation** | `PER-07`, `PER-08` | High-volume Lead work; needs speed and duplicate visibility |
| **Leadership** | `PER-01`, `PER-02`, `PER-09`, `PER-15`, `PER-16` | Roll-up visibility; largely read and report consumption |
| **Operations** | `PER-10`–`PER-12` | Cross-cutting write access, exception handling, governed-rule configuration |
| **Platform** | `PER-13` | Configuration and access administration |
| **Analytics** | `PER-14` | Broad read; no operational write |
| **Non-human** | `PER-17` | Narrowly scoped, explicitly designed |

---

## 3. Persona Definitions

### `PER-01` — VP Sales

| Dimension | Detail |
|---|---|
| **Responsibilities** | Overall revenue attainment; segment and territory structure; capacity and coverage decisions |
| **Salesforce interaction** | Low-frequency, read-oriented. Consumes reports and dashboards rather than working records. |
| **Information needs** | Pipeline by segment and territory; coverage gaps; forecast; attainment against quota capacity; where funnel loss occurs |
| **Operational pain points** | Cannot determine whether a coverage gap is a headcount problem or a routing problem (`PROB-005`, `PROB-009`). Metric movements are unexplainable (`PROB-015`). |
| **Expected capabilities** | Explainable funnel movement; territory performance comparable period-over-period; confidence that reported numbers reconcile |
| **Access considerations** | Broad read across the revenue org via role hierarchy. Write access to territory *definitions* is a governance question, not a default — recorded against `DEC-022`. |

---

### `PER-02` — Sales Manager

| Dimension | Detail |
|---|---|
| **Responsibilities** | Team performance; arbitrating ownership disputes; monitoring response performance; coaching |
| **Salesforce interaction** | Daily. Works team pipeline, reviews assignment, intervenes on stalled records. |
| **Information needs** | Which records reached which seller and why; SLA attainment by rep; distribution fairness; reassignment volume and cause |
| **Operational pain points** | **Arbitrates ownership disputes with no evidence** — nothing records why a seller was selected (`PROB-003`). Reassignment rate 18.6%, of which 7.3 points are unclassifiable. |
| **Expected capabilities** | Determine the routing basis for any record without escalating; see SLA status across the team; distinguish routing error from legitimate movement |
| **Access considerations** | Read/write across the managed team via role hierarchy. Reassignment capability is expected; whether it requires a recorded reason is a design position taken in `BR-035`. |

---

### `PER-03` — Strategic AE

| Dimension | Detail |
|---|---|
| **Responsibilities** | Depth on a small set of named accounts (5.5 per AE); executive-led motion; expansion |
| **Salesforce interaction** | Deep on few records. Account-centric rather than Lead-centric. |
| **Information needs** | Complete relationship history for the account family, including subsidiaries and trading names; all inbound interest connected to their accounts |
| **Operational pain points** | Inbound interest from a named account can be routed elsewhere because matching failed (`PROB-002`). Account history is fragmented by duplicates (`PROB-008`). |
| **Expected capabilities** | Named accounts are never routed away silently; the match basis connecting a record to their account is visible; subsidiary and trading-name relationships are explicit |
| **Access considerations** | Read/write on owned Accounts and related records. **Whether Strategic designation is visible to, or editable by, the AE is `DEC-005`** — a seller-editable Strategic flag would make routing precedence self-serve. |

---

### `PER-04` — Enterprise AE

| Dimension | Detail |
|---|---|
| **Responsibilities** | Territory coverage across one of three regions (East, Central, West); multi-stakeholder deals; 9.3 accounts per AE |
| **Salesforce interaction** | Daily. Works Opportunities and territory-assigned inbound. |
| **Information needs** | Which records fall in their territory and why; whether an organization is already a customer; firmographics sufficient to qualify and price |
| **Operational pain points** | Territory boundary errors (`PROB-009`) — **Germany resolves to Enterprise "Central" but Mid-Market "East."** Segment instability propagates into territory (`PROB-004`). |
| **Expected capabilities** | Deterministic territory resolution including at boundaries; visible territory basis; existing-customer status known before outreach |
| **Access considerations** | Read/write on owned records; peer visibility governed by the OWD and sharing design (`DEC-021`). |

---

### `PER-05` — Mid-Market AE

| Dimension | Detail |
|---|---|
| **Responsibilities** | Volume with quality across two regions (East, West); 26.7 accounts per AE; standard cycle |
| **Salesforce interaction** | Daily, high volume |
| **Information needs** | As `PER-04`, at higher record throughput |
| **Operational pain points** | **Highest exposure to segmentation boundary errors** (`PROB-004`). Mid-Market produces 50.4% of new ARR from 37% of new logos, and its boundaries touch both SMB round robin and Enterprise territory. A record misrouted to SMB receives the wrong motion for its deal size. |
| **Expected capabilities** | Segment boundaries resolve deterministically; records that cannot be segmented are surfaced rather than defaulted into the SMB velocity motion |
| **Access considerations** | As `PER-04`. |

---

### `PER-06` — SMB AE

| Dimension | Detail |
|---|---|
| **Responsibilities** | High-velocity closing from a global round-robin pool of 11; 29.5 accounts per AE |
| **Salesforce interaction** | Daily, highest volume, shortest handling time per record |
| **Information needs** | A steady, fair flow of assigned records; enough data to act immediately without research |
| **Operational pain points** | Depends entirely on round-robin fairness, which is undefined (`DEC-013`). Duplicate records mean **multiple sellers work the same organization** (`PROB-008`). Incomplete records demand manual research the velocity motion cannot absorb. |
| **Expected capabilities** | Verifiably fair distribution; assignment skipped when unavailable rather than accumulating silently; duplicates visible at the point of work |
| **Access considerations** | Read/write on owned records. Round-robin membership is governed configuration, not an ad-hoc list — `BR-034`. |

---

### `PER-07` — SDR

| Dimension | Detail |
|---|---|
| **Responsibilities** | Qualifying and following up inbound Leads; first human contact; handoff to AE |
| **Salesforce interaction** | Continuous, Lead-centric, highest transaction volume of any persona |
| **Information needs** | Which records are theirs, in priority order; response deadline; whether the record is a duplicate or an existing customer; enough firmographics to qualify |
| **Operational pain points** | **The persona most damaged by the current state.** Median created-to-first-touch 15.5 business hours; 21% of records unassigned beyond 24 business hours (`PROB-006`). 14.2% duplicate Leads (`PROB-008`). 48% of records lack routing-critical data (`PROB-001`), forcing manual research before any call. |
| **Expected capabilities** | Records arrive promptly with a visible response deadline; duplicates and existing-customer status flagged before outreach; first touch captured without manual logging discipline determining whether it counts |
| **Access considerations** | Read/write on assigned Leads. **Whether an SDR can see the unassigned Lead pool is a genuine design question** — it affects both self-service pickup and the integrity of routing measurement. Recorded against `DEC-021`. |

---

### `PER-08` — BDR

| Dimension | Detail |
|---|---|
| **Responsibilities** | Outbound prospecting; targeting accuracy; account-based outreach |
| **Salesforce interaction** | Continuous, mixed Lead and Account work |
| **Information needs** | Whether a target organization is already a customer, in an open Opportunity, or owned by another seller; ICP fit before investing effort |
| **Operational pain points** | **The persona most affected by existing-customer detection failure** (`PROB-002`). Prospecting into an existing customer is a customer-experience failure and wasted capacity. 22% of records have no usable domain — the primary matching signal. |
| **Expected capabilities** | Existing-customer and open-Opportunity status determinable before outreach; ICP fit visible with its basis; account family relationships explicit |
| **Access considerations** | Requires **read visibility wider than ownership** to check customer status before prospecting — a real least-privilege tension recorded against `DEC-021`, since the alternative is prospecting blind. |

---

### `PER-09` — SDR/BDR Manager

| Dimension | Detail |
|---|---|
| **Responsibilities** | Owns SLA attainment; capacity planning across 18 reps; response performance coaching |
| **Salesforce interaction** | Daily, management-oriented |
| **Information needs** | Attainment against the response commitment; breach volume and cause; per-rep capacity and load; whether a breach is a response failure or a logging failure |
| **Operational pain points** | **Owns a metric that cannot currently be measured.** True breach rate lies between 39% and 66% (`PROB-007`) and cannot be narrowed. 27% of Leads have no logged first touch. No agreed business-hours definition exists across four markets. |
| **Expected capabilities** | An agreed response commitment (`DEC-006`); a governed first-touch definition (`DEC-012`); attainment computed on reliable inputs; breaches attributable to an accountable owner |
| **Access considerations** | Read/write across the managed teams; read access to SLA measurement data. |

---

### `PER-10` — Revenue Operations

| Dimension | Detail |
|---|---|
| **Responsibilities** | **Owns routing, segmentation, and lifecycle governance.** Process integrity, rule definition, exception oversight, measurement definitions |
| **Salesforce interaction** | Deep and cross-cutting: governed-rule configuration, exception queues, data remediation, reporting |
| **Information needs** | Why any decision was made for any record; where automation is failing; exception volume by class; whether rules behave as designed |
| **Operational pain points** | **With `PER-13`, the persona whose work is most distorted by the operational debt, and the least represented in current reporting.** Nothing tells them *why* the system behaved as it did (`PROB-003`, `PROB-015`). Every user question becomes an escalation because users cannot self-serve. |
| **Expected capabilities** | Decision explainability at the point of decision; governed rules changeable **without a deployment**; exception visibility and ownership; measurement definitions under version control |
| **Access considerations** | Broad operational write access including reassignment and exception resolution. **Rule configuration access is distinct from record access** and should be separately grantable — a permission-set-first position taken in [`../security/access-model.md`](../security/access-model.md), pending `DEC-021`. |

---

### `PER-11` — Sales Operations

| Dimension | Detail |
|---|---|
| **Responsibilities** | Day-to-day operational support; exception handling; reassignment requests; duplicate review; data corrections |
| **Salesforce interaction** | Continuous, remediation-oriented |
| **Information needs** | The current exception backlog by class and age; what a record needs to proceed; who to route it to |
| **Operational pain points** | **The persona absorbing the invisible cost.** Exceptions are handled ad hoc by whoever notices them, with no classification, queue, ownership, or measurement (`PROB-012`). Because remediation is absorbed into normal work its cost is invisible — so no business case for a structural fix is ever built. |
| **Expected capabilities** | Exceptions detected, classified, queued, and owned; remediation volume measurable so it can be reduced; duplicate review with a governed merge path |
| **Access considerations** | Cross-team write access for remediation. **Merge is a destructive capability** and should be deliberately scoped rather than implied by an operations role — `BR-012`. |

---

### `PER-12` — Marketing Operations

| Dimension | Detail |
|---|---|
| **Responsibilities** | **Owns inbound source data and the MQL definition.** Lead flow, capture, qualification handoff to Sales |
| **Salesforce interaction** | Lead-focused; source and campaign data; handoff monitoring |
| **Information needs** | Volume and quality by source and channel; conversion by source; where the handoff to Sales breaks |
| **Operational pain points** | In a **definitional dispute with Sales about what "qualified" means** (`PROB-010`) — a governance problem, not a performance problem. Source taxonomy is inconsistent (`DEC-011`). 44% missing employee count means fit assessment is systematically biased toward records that happen to have complete data. |
| **Expected capabilities** | A single governed qualification definition with an accountable owner; a governed source/channel taxonomy enforced at capture where possible; source quality measurable |
| **Access considerations** | Write access to Lead source and campaign data; read on downstream conversion outcomes. **Whether Marketing Operations may edit ICP scoring configuration is a governance decision**, not a technical one — recorded against `DEC-009`. |

---

### `PER-13` — Salesforce Administrator

| Dimension | Detail |
|---|---|
| **Responsibilities** | **Owns configuration, security, and change management.** A single administrator supporting 64 revenue users plus Marketing, Customer Success, and Support consumers |
| **Salesforce interaction** | Configuration, access administration, troubleshooting, deployment |
| **Information needs** | What automation exists and what it does; what a change will affect; who has access to what and why; whether a change broke something |
| **Operational pain points** | **A structural constraint, not a staffing complaint.** At a 1:64+ ratio administration is necessarily reactive (`PROB-018`). ~9 years of accumulated configuration across four growth phases without consolidation. Every change carries unquantified regression risk (`PROB-016`). Business rules exist as institutional knowledge (`PROB-017`). |
| **Expected capabilities** | Governed rules changeable as **configuration data rather than automation logic**; documented intended behaviour; a defined change path with regression safety and rollback; access assignable by persona rather than assembled per user |
| **Access considerations** | Highest-privilege human persona. **This makes `PER-13` the strongest argument for permission-set-first design** — an administrator profile granted "because it was easier" is exactly the pattern the access model must avoid normalizing. |

> **Design consequence.** `PER-13`'s capacity constraint is the concrete justification for the
> *administrator maintainability*, *metadata-driven configuration*, *prefer maintainability over
> cleverness*, and *Flow before Apex* principles. A solution that is clever but hard to maintain
> will degrade under this ratio. This is a **requirement input**, not background colour.

---

### `PER-14` — Data / BI Analyst

| Dimension | Detail |
|---|---|
| **Responsibilities** | **Owns Power BI and KPI reconciliation.** Metric definitions, analytics model, report trust |
| **Salesforce interaction** | Read-oriented; data extraction; reconciliation against source |
| **Information needs** | Governed metric definitions with numerator, denominator, grain, and exclusions; reliable source data; the *causes* behind metric movements |
| **Operational pain points** | Reconciles conflicting numbers instead of analysing (`PROB-014`). **Cannot explain metric movements because the causes were never recorded as data** (`PROB-015`) — no dashboard can surface a routing reason that does not exist. Some disputed numbers are correct but misinterpreted: sales cycles span 21–210 days, so short measurement windows systematically under-represent Enterprise and Strategic. |
| **Expected capabilities** | One governed definition per metric with a named owner; segment-appropriate measurement windows; operational decision data available to the analytics layer; reconciliation between Salesforce and Power BI |
| **Access considerations** | **Broad read, no operational write.** A genuine least-privilege win: analytics does not require record modification. Field-level access to any PII-classified field must be justified rather than inherited. |

---

### `PER-15` — Marketing Leadership

| Dimension | Detail |
|---|---|
| **Responsibilities** | Pipeline contribution and marketing-sourced revenue; campaign investment decisions |
| **Salesforce interaction** | Report consumption only |
| **Information needs** | Marketing-sourced pipeline and revenue; conversion by source and channel; attribution |
| **Operational pain points** | **Disputes attribution** with Sales, arising from the same definitional gap as `PROB-010` and compounded by inconsistent source taxonomy (`DEC-011`) and undefined first touch (`DEC-012`). Funnel rates computed on a Lead population inflated roughly 14% by duplicates understate true conversion. |
| **Expected capabilities** | Governed, agreed source and qualification definitions; attribution rules documented rather than implied by report filters |
| **Access considerations** | Read via reports and dashboards. No operational write. |

---

### `PER-16` — Executive Leadership

| Dimension | Detail |
|---|---|
| **Responsibilities** | Revenue visibility, growth and risk oversight, resource allocation |
| **Salesforce interaction** | Dashboard consumption; typically outside Salesforce, through Power BI |
| **Information needs** | ARR, NRR, funnel health, forecast confidence, segment and market performance, operational risk |
| **Operational pain points** | **Meetings begin by reconciling numbers rather than acting on them** (`PROB-014`). Metric movements arrive without cause (`PROB-015`). Low trust drives private spreadsheets, fragmenting the truth further. |
| **Expected capabilities** | A single trusted set of governed definitions; explainable movement; visibility of operational risk that threatens revenue |
| **Access considerations** | Read via curated analytics. **The persona most likely to be over-granted access "because they are senior"** — a pattern the access model explicitly rejects. Executive visibility is a reporting requirement, not an access-level requirement. |

---

### `PER-17` — Integration User

| Dimension | Detail |
|---|---|
| **Responsibilities** | System-to-system data movement: inbound Lead capture, enrichment writes, analytics extraction |
| **Salesforce interaction** | API only. **No user interface session.** |
| **Information needs** | Not applicable — a principal, not a consumer |
| **Operational pain points** | Not applicable in the usual sense. The risk runs the other way: **integration access is commonly granted by assigning an administrator profile when an integration is needed**, and that grant is rarely reviewed or removed. |
| **Expected capabilities** | Access scoped to exactly the objects and fields the integration requires, for exactly the operations it performs; scope changes governed like any other change; actions attributable |
| **Access considerations** | **A first-class principal, designed deliberately from discovery onward.** Least privilege applies with no seniority argument to erode it. Whether one integration user or several role-specific ones are used is a design position taken in [`../security/access-model.md`](../security/access-model.md), pending `DEC-021`. |

> **Finding carried from Phase 0B.** Treating integration access as a security design problem from
> discovery onward — rather than as a deployment-time convenience — is a deliberate position taken
> into `DEC-021`. It is recorded here so no later requirement can quietly assume an
> administrator-equivalent integration principal.

---

## 4. Persona → Problem Exposure

Which personas each Phase 0B problem materially affects. This drives requirement ownership.

| Problem | Affected personas |
|---|---|
| `PROB-001` Missing firmographics | `PER-07`, `PER-08`, `PER-10`, `PER-12`, `PER-14` |
| `PROB-002` Existing customers as prospects | `PER-03`, `PER-04`, `PER-08`, `PER-10` |
| `PROB-003` No routing explanation | `PER-02`, `PER-10`, `PER-11`, `PER-14` |
| `PROB-004` Segmentation unreliable | `PER-04`, `PER-05`, `PER-06`, `PER-10` |
| `PROB-005` Ownership precedence undefined | `PER-02`, `PER-03`, `PER-04`, `PER-10`, `PER-11` |
| `PROB-006` Speed-to-lead slow and bimodal | `PER-06`, `PER-07`, `PER-09`, `PER-10` |
| `PROB-007` SLA unmeasurable | `PER-02`, `PER-07`, `PER-09`, `PER-10` |
| `PROB-008` Duplicates | `PER-06`, `PER-07`, `PER-08`, `PER-11` |
| `PROB-009` Territory inconsistency | `PER-01`, `PER-02`, `PER-04`, `PER-05`, `PER-10` |
| `PROB-010` Qualification undefined | `PER-07`, `PER-09`, `PER-12`, `PER-15` |
| `PROB-011` Lifecycle inconsistent | `PER-07`, `PER-09`, `PER-10`, `PER-12`, `PER-14` |
| `PROB-012` Exceptions invisible | `PER-07`, `PER-10`, `PER-11`, `PER-13` |
| `PROB-013` Access never assessed | `PER-10`, `PER-13`, `PER-16`, `PER-17` |
| `PROB-014` Conflicting answers | `PER-01`, `PER-02`, `PER-14`, `PER-15`, `PER-16` |
| `PROB-015` Movements unexplainable | `PER-01`, `PER-10`, `PER-14`, `PER-16` |
| `PROB-016` Change without governance | `PER-10`, `PER-11`, `PER-13` |
| `PROB-017` Rules as tribal knowledge | `PER-10`, `PER-11`, `PER-13` |
| `PROB-018` Single-person administration | `PER-10`, `PER-11`, `PER-13` |

**Finding.** `PER-10` (Revenue Operations) appears in **14 of 18** problems and `PER-13`
(Salesforce Administrator) in 6 — including all four governance problems. These are the personas
carrying the operational debt, and they are the least visible in conventional revenue reporting.
Requirements that serve them are not internal overhead; they are the requirements that make
everything else maintainable.

**Finding.** `PER-07` (SDR) appears in 7 problems, more than any seller persona. The SDR sits
directly downstream of every upstream defect — data quality, duplicates, identity, routing, and SLA
converge on the same record at the same moment.

---

## 5. Access Considerations Summary

> **`Proposed` — no access has been designed, configured, or assessed.** This table records
> *considerations* the access model must resolve. It is **not** an access design and must not be read
> as one. See [`../security/access-model.md`](../security/access-model.md) and `DEC-021`.

| Persona | Operational write | Cross-team read | Configuration rights | Notable tension |
|---|---|---|---|---|
| `PER-01` VP Sales | Limited | Broad (hierarchy) | Territory definitions? | Structural ownership vs least privilege |
| `PER-02` Sales Manager | Team | Team (hierarchy) | None | Reassignment without a recorded reason |
| `PER-03` Strategic AE | Owned | Account family | None | Strategic flag visibility (`DEC-005`) |
| `PER-04`–`PER-06` AEs | Owned | Per OWD design | None | Peer visibility (`DEC-021`) |
| `PER-07` SDR | Assigned | Unassigned pool? | None | Self-service pickup vs routing integrity |
| `PER-08` BDR | Assigned | **Required — wider** | None | Must check customer status before outreach |
| `PER-09` SDR/BDR Manager | Team | Team + SLA data | None | — |
| `PER-10` Revenue Operations | **Broad** | Broad | **Governed rules** | Rule config separable from record access |
| `PER-11` Sales Operations | **Cross-team** | Broad | None | **Merge is destructive** — scope deliberately |
| `PER-12` Marketing Ops | Lead source/campaign | Conversion outcomes | ICP config? (`DEC-009`) | Definition ownership |
| `PER-13` Administrator | Full | Full | **Full** | The permission-set-first test case |
| `PER-14` Data / BI Analyst | **None** | **Broad read** | None | FLS on PII must be justified |
| `PER-15` Marketing Leadership | None | Reports only | None | — |
| `PER-16` Executive Leadership | None | Curated analytics | None | **Seniority ≠ access level** |
| `PER-17` Integration User | **Scoped** | **Scoped** | None | Never administrator-equivalent |

---

## 6. What Remains Open

| Question | Decision | Affects |
|---|---|---|
| Is Strategic designation seller-visible or seller-editable? | `DEC-005` | `PER-03` |
| Can SDRs see the unassigned Lead pool? | `DEC-021` | `PER-07` |
| How wide must BDR read access be to check customer status? | `DEC-021` | `PER-08` |
| Who may change ICP scoring configuration? | `DEC-009`, `DEC-021` | `PER-10`, `PER-12` |
| Who owns each exception class? | `DEC-019` | `PER-10`, `PER-11` |
| Is one integration user sufficient, or several scoped ones? | `DEC-021` | `PER-17` |
| Which personas require a Developer Edition User in Phase 1? | Phase 1 design | All |

**No entry above may be resolved without human approval.** Persona detail is documentation; access
is a decision.
