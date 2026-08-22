# Sales Organization — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Sales Organization |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`revenue-model.md`](revenue-model.md) · [`current-state.md`](current-state.md) · [`project-scope.md`](project-scope.md) |

---

## 1. Reporting Structure

**Known Context** — the structure below is given in the project brief.

```
VP Sales
│
├── Strategic
│   ├── Strategic AE 1
│   └── Strategic AE 2
│
├── Enterprise
│   ├── East
│   ├── Central
│   └── West
│
├── Mid-Market
│   ├── East
│   └── West
│
└── SMB
    └── Round Robin
```

**Finding.** The structure itself contains an asymmetry that has direct architectural consequences:

| Branch | Coverage basis | Assignment basis |
|---|---|---|
| Strategic | Named accounts | Explicit designation |
| Enterprise | Geography (3 regions) | Territory |
| Mid-Market | Geography (2 regions) | Territory |
| SMB | None | Round robin |

Three different assignment mechanisms coexist — named-account, territory, and round-robin — and
they must be resolved in a defined precedence order for any given inbound record. **NorthstarIQ has
no documented precedence order.** This is the structural origin of the routing ambiguity recorded in
[`business-problems.md`](business-problems.md), and a direct input to `DEC-003` and `DEC-022`.

**Finding.** Enterprise uses three geographic regions while Mid-Market uses two. The region
boundaries therefore cannot be identical. An Account that is "Central" for Enterprise purposes must
resolve to either East or West at Mid-Market. **Open Question:** where that boundary falls, and
whether it is documented anywhere, is unknown.

---

## 2. Headcount

**Synthetic Planning Assumption.** Sized to be consistent with the quota capacity and attainment in
[`revenue-model.md`](revenue-model.md) §6.

### Quota-carrying

| Role | Count | Reports to |
|---|---:|---|
| VP Sales | 1 | CRO |
| Sales Manager — Enterprise | 1 | VP Sales |
| Sales Manager — Mid-Market | 1 | VP Sales |
| Sales Manager — SMB | 1 | VP Sales |
| Strategic AE | 2 | VP Sales (direct) |
| Enterprise AE | 8 | Sales Manager — Enterprise |
| Mid-Market AE | 9 | Sales Manager — Mid-Market |
| SMB AE | 11 | Sales Manager — SMB |
| **Subtotal** | **34** | |

### Pipeline generation

| Role | Count | Reports to |
|---|---:|---|
| SDR/BDR Manager | 2 | VP Sales |
| SDR (inbound qualification) | 10 | SDR/BDR Manager |
| BDR (outbound prospecting) | 8 | SDR/BDR Manager |
| **Subtotal** | **20** | |

### Revenue operations and supporting functions

| Role | Count | Reports to |
|---|---:|---|
| Revenue Operations | 3 | VP Revenue Operations |
| Sales Operations | 2 | VP Revenue Operations |
| Marketing Operations | 2 | VP Marketing |
| Salesforce Administrator | 1 | VP Revenue Operations |
| Data / BI Analyst | 2 | VP Revenue Operations |
| **Subtotal** | **10** | |

**Total sales and revenue operations: 64.** The remainder of the ~160-person go-to-market
organization (Marketing, Customer Success, Support) is not modeled in detail — it falls outside the
scope of this project and inventing detail would add fictional surface area with no analytical value.

**Finding.** One Salesforce Administrator supports 64 revenue users plus Marketing, Customer
Success, and Support consumers of the platform. At that ratio, administration is necessarily
reactive. This is relevant context for the later architecture: **administrator maintainability is
not a stylistic preference at NorthstarIQ, it is a capacity constraint.**

---

## 3. Coverage Model

**Synthetic Planning Assumption**, derived from [`revenue-model.md`](revenue-model.md).

| Segment | Customers | AEs | Accounts / AE | Quota / AE | Motion |
|---|---:|---:|---:|---:|---|
| Strategic | 11 | 2 | 5.5 | $2,000,000 | Named account, executive-led |
| Enterprise | 74 | 8 | 9.3 | $900,000 | Territory, multi-stakeholder |
| Mid-Market | 240 | 9 | 26.7 | $600,000 | Territory, standard cycle |
| SMB | 325 | 11 | 29.5 | $340,000 | Round robin, high velocity |

### Geographic coverage

**Synthetic Planning Assumption.** Regional allocation of AEs.

| Team | Region | AEs | Markets covered |
|---|---|---:|---|
| Enterprise | East | 3 | US East, Canada East, UK |
| Enterprise | Central | 2 | US Central, Germany |
| Enterprise | West | 3 | US West, Canada West |
| Mid-Market | East | 5 | US East, Canada East, UK, Germany |
| Mid-Market | West | 4 | US West, Canada Central & West |
| SMB | Global round robin | 11 | All markets |

**Finding.** The international markets are attached to US-shaped regions rather than being treated
as territories in their own right. UK sits inside "East"; Germany sits inside Enterprise "Central"
but Mid-Market "East". This is a legacy of the growth history in
[`company-profile.md`](company-profile.md) §5 — each market was added as an exception to an
existing structure rather than triggering a redesign.

**Finding.** This produces a concrete inconsistency: **Germany resolves to a different region
depending on which segment the record lands in.** A German record that segments as Enterprise goes
to Central; the same organization segmenting as Mid-Market goes to East. Because segment is itself
derived from a field that is frequently missing (employee count, 44% missing per
[`baseline-metrics.md`](baseline-metrics.md)), territory assignment inherits the instability of
segmentation.

**Open Question.** Whether SMB round robin is genuinely global — including UK and Germany records
with language and time-zone implications — or whether informal carve-outs exist, is unknown and
requires validation.

---

## 4. Business Organization vs Portfolio Salesforce Users

> **This distinction is essential and must be preserved throughout the project.**

| | Business Organization | Portfolio Salesforce Users |
|---|---|---|
| **What it is** | The fictional NorthstarIQ revenue team | Actual users created in Salesforce Developer Edition |
| **Size** | 64 people | Minimum necessary — a small number |
| **Purpose** | Makes the business scenario coherent | Demonstrates the access model and routing behaviour |
| **Documented in** | This document | Phase 1 (Salesforce Foundation & Security) |

**Do NOT create dozens of Salesforce users.** Developer Edition provides a limited number of
licences, and user count is not evidence of anything. The portfolio implementation needs enough
users to demonstrate:

- Role hierarchy behaviour across at least two levels
- Permission-set-based access differing by persona
- Round-robin distribution across a pool of more than two members
- Seller eligibility logic including at least one inactive or unavailable seller
- Sharing rule and OWD behaviour between peers
- Integration-user access distinct from a human user

That is a design requirement for Phase 1, and the specific user list is **not** determined here.
Designing it during discovery would be premature solution design.

**Open Question.** The exact Developer Edition user licence allocation has not been checked. This is
recorded as a dependency in [`dependencies.md`](dependencies.md) rather than assumed.

---

## 5. Personas

Persona identifiers are allocated here and carried forward into Phase 0C requirements. Detailed
persona definitions — goals, access needs, and acceptance criteria — are a Phase 0C deliverable;
this section establishes the roster and each persona's relationship to the revenue process.

| ID | Persona | Primary concern | Relationship to the Lead-to-Revenue Lifecycle |
|---|---|---|---|
| `PER-01` | VP Sales | Predictable attainment and coverage | Consumes pipeline and funnel reporting; owns territory structure |
| `PER-02` | Sales Manager | Team performance, fair distribution | Arbitrates ownership disputes; monitors SLA |
| `PER-03` | Strategic AE | Named-account depth | Expects named accounts never to be routed elsewhere |
| `PER-04` | Enterprise AE | Territory coverage, deal quality | Affected by territory and segment boundary errors |
| `PER-05` | Mid-Market AE | Volume with quality | Highest exposure to segmentation boundary errors |
| `PER-06` | SMB AE | Velocity | Depends on round-robin fairness |
| `PER-07` | SDR | Fast, qualified inbound follow-up | Most affected by speed-to-lead and duplicate records |
| `PER-08` | BDR | Outbound targeting accuracy | Most affected by existing-customer detection failures |
| `PER-09` | SDR/BDR Manager | Capacity and response performance | Owns SLA attainment |
| `PER-10` | Revenue Operations | Process integrity and explainability | Owns routing, segmentation, lifecycle governance |
| `PER-11` | Sales Operations | Day-to-day operational support | Handles exceptions and reassignment requests |
| `PER-12` | Marketing Operations | Lead flow and qualification handoff | Owns inbound source data and MQL definition |
| `PER-13` | Salesforce Administrator | Maintainability, access, change safety | Owns configuration, security, and change management |
| `PER-14` | Data / BI Analyst | Trustworthy metrics | Owns Power BI and KPI reconciliation |
| `PER-15` | Marketing Leadership | Pipeline contribution | Consumes funnel reporting; disputes attribution |
| `PER-16` | Executive Leadership | Revenue visibility and risk | Consumes executive reporting |
| `PER-17` | Integration User | System-to-system access | Non-human principal; requires scoped least-privilege access |

**Finding.** `PER-10` (Revenue Operations) and `PER-13` (Salesforce Administrator) are the personas
whose current work is most distorted by the operational debt, and they are the personas least
represented in typical reporting. Nothing in the current environment tells them *why* the system
behaved as it did — the explainability gap recorded across
[`current-state.md`](current-state.md).

**Finding.** `PER-17` (Integration User) is a persona, not an afterthought. Treating integration
access as a security design problem from discovery onward — rather than granting an administrator
profile when an integration is needed — is a deliberate position taken into `DEC-021`.

---

## 6. How Ownership Currently Works

> **Assumption / Open Question throughout this section.** No Salesforce configuration has been
> inspected. This describes how ownership is *understood* to operate, based on the organizational
> structure. Every statement requires validation.

| Path | Understood behaviour | Evidence status |
|---|---|---|
| Named Strategic accounts | Permanently assigned to a Strategic AE | Assumption |
| Existing customers | Inbound interest should reach the current Account owner | Assumption — precedence undefined |
| Enterprise prospects | Assigned by geographic region | Assumption |
| Mid-Market prospects | Assigned by geographic region | Assumption |
| SMB prospects | Distributed by round robin | Assumption |
| Records with incomplete data | Unknown — possibly unassigned, possibly defaulted | **Open Question** |
| Records matching no rule | Unknown | **Open Question** |
| Seller inactive or on leave | Handled manually, mechanism unknown | **Open Question** |

**Finding.** The most important gaps are the last three rows — the exception paths. The happy paths
are at least describable from the organizational structure. What happens when a record does *not*
fit any rule is genuinely unknown, and that is where routing failures concentrate.

**Open Question.** Whether ownership precedence is enforced by system logic, by manual convention,
or inconsistently by both is the single most important thing to validate before the Revenue Routing
Engine is designed. Designing routing without this answer would encode an assumption as a rule.

---

## 7. What This Document Does Not Establish

- ❌ Territory definitions or boundaries — `DEC-022`
- ❌ Ownership precedence order — `DEC-003`
- ❌ Round-robin behaviour — `DEC-013`
- ❌ Seller eligibility and absence handling — `DEC-007`
- ❌ Strategic Account designation authority — `DEC-005`
- ❌ The Salesforce user list for the portfolio implementation — Phase 1
- ❌ Any Salesforce role hierarchy, queue, or sharing configuration — Phase 0C / Phase 1

The organizational structure is Known Context. **How that structure is currently implemented in
Salesforce is not known and has not been inspected.**
