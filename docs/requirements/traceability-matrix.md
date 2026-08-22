# Traceability Matrix

| Field | Value |
|---|---|
| **Document** | Traceability Matrix |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Implementation State** | Target State |
| **Related** | [`business-requirements.md`](business-requirements.md) · [`open-decisions.md`](open-decisions.md) · [`personas.md`](personas.md) · [`../discovery/business-problems.md`](../discovery/business-problems.md) |

---

## Purpose

Traceability is the property that makes the rest of the repository auditable. It answers, for any
element, both directions of the question:

> **Forward:** this problem was discovered — what is being done about it?
> **Backward:** this requirement exists — what problem justifies it?

A requirement with no upstream problem is either solving something undiscovered, or is unnecessary. A
problem with no downstream requirement has been noticed and abandoned. Both are defects, and both are
invisible without a matrix.

### The chain

```
PROB-###  →  BR-###  →  DEC-###  →  Persona  →  Future Component  →  Test Requirement  →  Status
```

### Honesty rule

> **Linkage is not forced to reach 100%.** Artificial relationships created to make a matrix look
> complete destroy the very property the matrix exists to provide. Genuine orphans are flagged for
> review rather than papered over. §5 records the orphan analysis, including the categories where
> linkage is deliberately absent.

---

## 1. Coverage Summary

| Dimension | Result |
|---|---|
| Business problems (`PROB-001`–`PROB-018`) | **18 of 18** have at least one requirement |
| Requirements (`BR-001`–`BR-062`) | **62 of 62** trace to at least one problem |
| Requirements with an owning persona | **62 of 62** |
| Open decisions (`DEC-001`–`DEC-022`) | **22 of 22** cited by at least one requirement |
| Personas (`PER-01`–`PER-17`) | See §4 — **9 own requirements; 8 deliberately own none** |
| Requirements with a test requirement | **62 of 62** |

**No orphan requirements. No orphan problems. No orphan decisions.**

That result is reported with a caveat, because a perfect score is exactly what should invite
scrutiny: it was achieved by **deriving requirements from the problem register**, not by retrofitting
links. §5 states where linkage is genuinely thin.

---

## 2. Requirement Traceability

Status markers: ✅ Complete · 🟡 Partially conditional · 🔵 Blocked

| `BR-###` | Requirement | Problem | Decision | Persona | Priority | Status |
|---|---|---|---|---|---|---|
| `BR-001` | Routing-critical data completeness is assessed on every inbound record | `PROB-001` | — | `PER-07`, `PER-10`, `PER-12` | **P0** | ✅ Complete |
| `BR-002` | Inbound data is normalized to governed formats at capture | `PROB-001` | `DEC-014` | `PER-10`, `PER-12` | **P0** | 🟡 Partially conditional |
| `BR-003` | Data quality state is explainable at the record level | `PROB-001`, `PROB-003` | — | `PER-07`, `PER-10`, `PER-11` | P1 | ✅ Complete |
| `BR-004` | The inbound capture interface is contractually defined, independent of the source system | `PROB-001`, `PROB-010` | `DEC-011`, `DEC-014` | `PER-10`, `PER-12` | P1 | 🟡 Partially conditional |
| `BR-005` | The enrichment interface is defined without assuming a provider | `PROB-001` | `DEC-015` | `PER-10` | P1 | 🟡 Partially conditional |
| `BR-006` | The architecture operates correctly on incomplete data as a normal condition | `PROB-001` | `DEC-015` | `PER-10` | **P0** | 🟡 Partially conditional |
| `BR-007` | Data quality is measurable over time | `PROB-001`, `PROB-014` | `DEC-016` | `PER-10`, `PER-14` | P2 | 🟡 Partially conditional |
| `BR-008` | A record's relationship to an existing Account is determined explicitly | `PROB-002` | `DEC-004`, `DEC-008` | `PER-03`, `PER-04`, `PER-08`, `PER-10` | **P0** | 🟡 Partially conditional |
| `BR-009` | The basis and confidence of every identity decision are recorded | `PROB-002`, `PROB-003` | `DEC-008`, `DEC-018` | `PER-03`, `PER-08`, `PER-10`, `PER-11`, `PER-14` | **P0** | 🟡 Partially conditional |
| `BR-010` | Potential duplicates are detected and surfaced, never silently merged | `PROB-008` | `DEC-004`, `DEC-008` | `PER-06`, `PER-07`, `PER-08`, `PER-10`, `PER-11` | **P0** | 🟡 Partially conditional |
| `BR-011` | Lead-to-Contact duplication is identified before outreach | `PROB-008` | `DEC-004` | `PER-07`, `PER-08`, `PER-10` | P2 | 🟡 Partially conditional |
| `BR-012` | Record merge is a governed, scoped, and audited capability | `PROB-008`, `PROB-013` | `DEC-004`, `DEC-021` | `PER-11`, `PER-13` | P1 | 🟡 Partially conditional |
| `BR-013` | Account family relationships are explicit | `PROB-002`, `PROB-008` | `DEC-004`, `DEC-005` | `PER-03`, `PER-04`, `PER-08`, `PER-10` | P2 | 🔵 Blocked |
| `BR-014` | ICP fit is assessed against a single governed definition | `PROB-010` | `DEC-009`, `DEC-010` | `PER-01`, `PER-12`, `PER-15` | P1 | 🔵 Blocked |
| `BR-015` | The basis for every fit assessment is recorded | `PROB-003`, `PROB-010` | `DEC-009`, `DEC-018` | `PER-07`, `PER-10`, `PER-12`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-016` | Lead source and channel use a governed taxonomy | `PROB-010`, `PROB-014` | `DEC-011`, `DEC-014` | `PER-12` | P1 | 🔵 Blocked |
| `BR-017` | Lead conversion follows governed criteria | `PROB-010`, `PROB-011` | `DEC-010` | `PER-01`, `PER-07`, `PER-12` | P1 | 🔵 Blocked |
| `BR-018` | "Not assessable" is distinguished from "poor fit" | `PROB-010` | `DEC-009` | `PER-10`, `PER-12`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-019` | A single governed lifecycle taxonomy exists | `PROB-011` | `DEC-010`, `DEC-017` | `PER-01`, `PER-10`, `PER-12` | **P0** | 🔵 Blocked |
| `BR-020` | Lifecycle transitions are recorded with timestamp and cause | `PROB-003`, `PROB-011`, `PROB-015` | `DEC-017`, `DEC-018` | `PER-09`, `PER-10`, `PER-14` | **P0** | 🟡 Partially conditional |
| `BR-021` | Conversion is a governed lifecycle transition | `PROB-010`, `PROB-011` | `DEC-010`, `DEC-017`, `DEC-018` | `PER-10`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-022` | Time spent in each lifecycle stage is answerable retrospectively | `PROB-011` | `DEC-016`, `DEC-018` | `PER-01`, `PER-10`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-023` | Stalled and recycled records have explicit states | `PROB-011`, `PROB-012` | `DEC-017` | `PER-07`, `PER-09`, `PER-10`, `PER-11` | P2 | 🔵 Blocked |
| `BR-024` | Segment is derived from governed, documented rules | `PROB-004` | `DEC-001`, `DEC-002` | `PER-04`, `PER-05`, `PER-06`, `PER-10` | **P0** | 🔵 Blocked |
| `BR-025` | Segmentation thresholds are versioned configuration | `PROB-004`, `PROB-014`, `PROB-018` | `DEC-001`, `DEC-021` | `PER-10`, `PER-13`, `PER-14` | **P0** | 🟡 Partially conditional |
| `BR-026` | Records that cannot be segmented are surfaced, never defaulted | `PROB-001`, `PROB-004` | `DEC-002` | `PER-05`, `PER-06`, `PER-10`, `PER-11` | **P0** | 🟡 Partially conditional |
| `BR-027` | Segment derivation basis and overrides are recorded | `PROB-004` | `DEC-005`, `DEC-018` | `PER-02`, `PER-10`, `PER-14` | P2 | 🟡 Partially conditional |
| `BR-028` | Territory resolves deterministically, including at boundaries | `PROB-009` | `DEC-022` | `PER-01`, `PER-04`, `PER-05`, `PER-10` | **P0** | 🔵 Blocked |
| `BR-029` | Territory definitions are versioned with effective dates | `PROB-009`, `PROB-014` | `DEC-021`, `DEC-022` | `PER-01`, `PER-10`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-030` | An approved ownership precedence exists and is applied consistently | `PROB-005` | `DEC-003`, `DEC-005` | `PER-01`, `PER-02`, `PER-03`, `PER-10` | **P0** | 🔵 Blocked |
| `BR-031` | Named and Strategic accounts are not routed away silently | `PROB-002`, `PROB-005` | `DEC-003`, `DEC-005` | `PER-01`, `PER-03`, `PER-10` | P1 | 🟡 Partially conditional |
| `BR-032` | Every routing decision records why it was made | `PROB-003` | `DEC-018` | `PER-02`, `PER-10`, `PER-11`, `PER-14` | **P0** | ✅ Complete |
| `BR-033` | No record remains unassigned without becoming a visible exception | `PROB-006` | `DEC-007`, `DEC-019` | `PER-07`, `PER-09`, `PER-10`, `PER-11` | **P0** | 🟡 Partially conditional |
| `BR-034` | Round-robin distribution is verifiable from recorded data | `PROB-005`, `PROB-006` | `DEC-007`, `DEC-013` | `PER-02`, `PER-06`, `PER-10` | P1 | 🟡 Partially conditional |
| `BR-035` | Seller eligibility is evaluated and recorded before assignment | `PROB-005`, `PROB-006` | `DEC-007`, `DEC-013` | `PER-02`, `PER-10`, `PER-11` | P1 | 🟡 Partially conditional |
| `BR-036` | Reassignment captures a reason and preserves routing history | `PROB-003` | `DEC-018` | `PER-02`, `PER-10`, `PER-11`, `PER-14` | P2 | 🟡 Partially conditional |
| `BR-037` | Routing rules are configuration, changeable without deployment | `PROB-016`, `PROB-017`, `PROB-018` | `DEC-021` | `PER-10`, `PER-13` | **P0** | 🟡 Partially conditional |
| `BR-038` | An agreed response commitment exists and is governed | `PROB-007` | `DEC-006` | `PER-01`, `PER-09` | **P0** | 🔵 Blocked |
| `BR-039` | Business hours and holiday calendars are governed configuration | `PROB-007` | `DEC-006` | `PER-09`, `PER-10`, `PER-13` | **P0** | 🟡 Partially conditional |
| `BR-040` | First touch is defined and captured reliably | `PROB-007` | `DEC-012` | `PER-07`, `PER-09`, `PER-10` | **P0** | 🔵 Blocked |
| `BR-041` | SLA reporting distinguishes response failure from measurement failure | `PROB-007` | `DEC-006`, `DEC-012` | `PER-09`, `PER-10`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-042` | The response deadline is visible to the assigned owner | `PROB-006`, `PROB-007` | `DEC-006`, `DEC-007` | `PER-06`, `PER-07`, `PER-09` | P1 | 🟡 Partially conditional |
| `BR-043` | Breaches are visible to an accountable owner | `PROB-007`, `PROB-012` | `DEC-006`, `DEC-019` | `PER-02`, `PER-09`, `PER-11` | P2 | 🟡 Partially conditional |
| `BR-044` | Operational exceptions are detected, classified, and measured | `PROB-012` | `DEC-019` | `PER-10`, `PER-11`, `PER-13` | **P0** | ✅ Complete |
| `BR-045` | Automation failure is observable | `PROB-012`, `PROB-016` | `DEC-019` | `PER-10`, `PER-13` | **P0** | ✅ Complete |
| `BR-046` | Every exception class has an accountable owner | `PROB-012` | `DEC-019` | `PER-10`, `PER-11`, `PER-13` | P1 | 🔵 Blocked |
| `BR-047` | Exception resolution is recorded | `PROB-012`, `PROB-015` | `DEC-018`, `DEC-019` | `PER-10`, `PER-11`, `PER-14` | P2 | 🟡 Partially conditional |
| `BR-048` | KPI definitions are governed with a single owner each | `PROB-014` | `DEC-016` | `PER-01`, `PER-10`, `PER-14`, `PER-16` | **P0** | ✅ Complete |
| `BR-049` | Operational decision data is available to the analytics layer | `PROB-015` | `DEC-016`, `DEC-018`, `DEC-020` | `PER-01`, `PER-10`, `PER-14`, `PER-16` | P1 | 🟡 Partially conditional |
| `BR-050` | Measurement windows are segment-appropriate | `PROB-014` | `DEC-016` | `PER-01`, `PER-14`, `PER-15` | P2 | 🟡 Partially conditional |
| `BR-051` | Analytics reconciles to the Salesforce source of truth | `PROB-014` | `DEC-020` | `PER-10`, `PER-13`, `PER-14` | P2 | 🟡 Partially conditional |
| `BR-052` | Analytics access is a scoped, governed principal | `PROB-013` | `DEC-020`, `DEC-021` | `PER-10`, `PER-13`, `PER-14` | P1 | 🟡 Partially conditional |
| `BR-053` | Access is designed on least privilege and documented per persona | `PROB-013` | `DEC-021` | `PER-10`, `PER-13` | **P0** | 🟡 Partially conditional |
| `BR-054` | Every granted capability is individually visible, grantable, and revocable | `PROB-013`, `PROB-018` | `DEC-021` | `PER-10`, `PER-13` | P1 | 🟡 Partially conditional |
| `BR-055` | Integration access is scoped and never administrator-equivalent | `PROB-013` | `DEC-020`, `DEC-021` | `PER-10`, `PER-13` | **P0** | 🟡 Partially conditional |
| `BR-056` | Field access to PII-classified data is separately justified | `PROB-013` | `DEC-021` | `PER-10`, `PER-13`, `PER-14` | P2 | 🟡 Partially conditional |
| `BR-057` | The access model is tested | `PROB-013` | `DEC-021` | `PER-10`, `PER-13` | **P0** | 🟡 Partially conditional |
| `BR-058` | Access changes follow the governed change path | `PROB-013`, `PROB-016` | `DEC-021` | `PER-10`, `PER-13` | P1 | 🟡 Partially conditional |
| `BR-059` | Governed business rules are metadata-driven | `PROB-016`, `PROB-017`, `PROB-018` | — | `PER-10`, `PER-13` | **P0** | ✅ Complete |
| `BR-060` | A defined change path with regression safety exists | `PROB-016` | — | `PER-10`, `PER-11`, `PER-13` | **P0** | ✅ Complete |
| `BR-061` | Intended behaviour is documented as part of the change | `PROB-017` | — | `PER-10`, `PER-13` | P1 | ✅ Complete |
| `BR-062` | Rollback capability exists for governed changes | `PROB-016`, `PROB-018` | — | `PER-10`, `PER-13` | P2 | ✅ Complete |

---

## 3. Problem → Requirement Coverage

| `PROB-###` | Problem | Priority | Requirements | Count |
|---|---|---|---|---:|
| `PROB-001` | Critical firmographic fields missing on nearly half of inbound records | P1 | `BR-001`, `BR-002`, `BR-003`, `BR-004`, `BR-005`, `BR-006`, `BR-007`, `BR-026` | 8 |
| `PROB-002` | Existing customers treated as net-new prospects | P1 | `BR-008`, `BR-009`, `BR-013`, `BR-031` | 4 |
| `PROB-003` | No record explains why a routing decision was made | P1 | `BR-003`, `BR-009`, `BR-015`, `BR-020`, `BR-032`, `BR-036` | 6 |
| `PROB-004` | Segmentation unreliable, inherits upstream data defects | P1 | `BR-024`, `BR-025`, `BR-026`, `BR-027` | 4 |
| `PROB-005` | Ownership precedence between three assignment bases undefined | P1 | `BR-030`, `BR-031`, `BR-034`, `BR-035` | 4 |
| `PROB-006` | Speed-to-lead slow and bimodal | P1 | `BR-033`, `BR-034`, `BR-035`, `BR-042` | 4 |
| `PROB-007` | Response commitments cannot be measured reliably | P1 | `BR-038`, `BR-039`, `BR-040`, `BR-041`, `BR-042`, `BR-043` | 6 |
| `PROB-008` | Duplicate records fragment relationships and inflate volume | P2 | `BR-010`, `BR-011`, `BR-012`, `BR-013` | 4 |
| `PROB-009` | Territory definitions inconsistent across segments | P2 | `BR-028`, `BR-029` | 2 |
| `PROB-010` | Qualification has no agreed definition | P2 | `BR-004`, `BR-014`, `BR-015`, `BR-016`, `BR-017`, `BR-018`, `BR-021` | 7 |
| `PROB-011` | Lifecycle stages inconsistent, progression not measurable | P2 | `BR-017`, `BR-019`, `BR-020`, `BR-021`, `BR-022`, `BR-023` | 6 |
| `PROB-012` | Operational exceptions invisible and unowned | P2 | `BR-023`, `BR-043`, `BR-044`, `BR-045`, `BR-046`, `BR-047` | 6 |
| `PROB-013` | Salesforce access governance never assessed | P2 | `BR-012`, `BR-052`, `BR-053`, `BR-054`, `BR-055`, `BR-056`, `BR-057`, `BR-058` | 8 |
| `PROB-014` | The same business question yields different answers | P2 | `BR-007`, `BR-016`, `BR-025`, `BR-029`, `BR-048`, `BR-050`, `BR-051` | 7 |
| `PROB-015` | Metric movements cannot be explained | P2 | `BR-020`, `BR-047`, `BR-049` | 3 |
| `PROB-016` | Changes deployed without governance or regression safety | P2 | `BR-037`, `BR-045`, `BR-058`, `BR-059`, `BR-060`, `BR-062` | 6 |
| `PROB-017` | Business rules exist only as institutional knowledge | P3 | `BR-037`, `BR-059`, `BR-061` | 3 |
| `PROB-018` | Administration is a single-person reactive dependency | P3 | `BR-025`, `BR-037`, `BR-054`, `BR-059`, `BR-062` | 5 |
---

## 4. Persona → Requirement Ownership

**Ownership means accountability for the requirement's business definition** — the persona listed
before the semicolon in each requirement's *Persona / Owner* field. Personas listed after it are
beneficiaries and are not counted here; several personas benefit from many requirements while owning
none, which is the correct shape for consumer roles.

| `PER-##` | Persona | Requirements owned or co-owned | Count |
|---|---|---|---:|
| `PER-01` | VP Sales | `BR-014`, `BR-017`, `BR-028`, `BR-029`, `BR-030`, `BR-031`, `BR-038` | 7 |
| `PER-02` | Sales Manager | `BR-034`, `BR-035`, `BR-036` | 3 |
| `PER-03` | Strategic AE | **None** | 0 |
| `PER-04` | Enterprise AE | **None** | 0 |
| `PER-05` | Mid-Market AE | **None** | 0 |
| `PER-06` | SMB AE | **None** | 0 |
| `PER-07` | SDR | **None** | 0 |
| `PER-08` | BDR | **None** | 0 |
| `PER-09` | SDR/BDR Manager | `BR-038`, `BR-040`, `BR-042`, `BR-043` | 4 |
| `PER-10` | Revenue Operations | `BR-001`, `BR-002`, `BR-003`, `BR-005`, `BR-006`, `BR-008`, `BR-009`, `BR-010`, `BR-011`, `BR-013`, `BR-015`, `BR-018`, `BR-019`, `BR-020`, `BR-021`, `BR-023`, `BR-024`, `BR-025`, `BR-026`, `BR-027`, `BR-032`, `BR-033`, `BR-037`, `BR-039`, `BR-044`, `BR-046` | 26 |
| `PER-11` | Sales Operations | `BR-047` | 1 |
| `PER-12` | Marketing Operations | `BR-004`, `BR-016`, `BR-017` | 3 |
| `PER-13` | Salesforce Administrator | `BR-012`, `BR-045`, `BR-052`, `BR-053`, `BR-054`, `BR-055`, `BR-056`, `BR-057`, `BR-058`, `BR-059`, `BR-060`, `BR-061`, `BR-062` | 13 |
| `PER-14` | Data / BI Analyst | `BR-007`, `BR-022`, `BR-041`, `BR-048`, `BR-049`, `BR-050`, `BR-051` | 7 |
| `PER-15` | Marketing Leadership | `BR-014` | 1 |
| `PER-16` | Executive Leadership | **None** | 0 |
| `PER-17` | Integration User | **None** | 0 |

**Finding.** `PER-10` (Revenue Operations) owns **26 of 62** requirements — more than twice any other
persona, consistent with its appearance in 14 of 18 business problems. Revenue Operations is the
persona carrying the operational debt, and the requirements serving it are what make the rest of the
system maintainable.

**Finding.** `PER-13` (Salesforce Administrator) owns **13**, concentrated in security (`BR-052`–`BR-058`)
and change management (`BR-059`–`BR-062`). Together `PER-10` and `PER-13` own **39 of 62** — the two
personas least visible in conventional revenue reporting own nearly two-thirds of the requirement set.

**Finding — the sellers own nothing, and that is correct.** `PER-03`–`PER-08` (Strategic, Enterprise,
Mid-Market, SMB AEs, SDR, BDR) own **zero** requirements despite being the most affected personas —
`PER-07` alone appears in 7 business problems. Sellers **consume** governed rules; they do not define
them. The same applies to `PER-16` (Executive Leadership) and `PER-17` (Integration User), which is a
non-human principal and cannot own anything.

> Assigning ownership to these personas to balance the table would be artificial linkage — precisely
> the failure this matrix exists to detect. **A persona owning zero requirements is a finding, not a
> gap**, and the distinction between who is affected and who decides is one this project takes
> seriously.

**Note.** Owner assignments total 65 across 62 requirements, because three requirements have
co-owners where the definition genuinely spans two functions: `BR-014` and `BR-017` (qualification —
Sales and Marketing, the definitional dispute in `PROB-010`) and `BR-038` (the response commitment —
VP Sales and the SDR/BDR Manager who owns attainment).

---

## 5. Decision → Requirement Dependency

| `DEC-###` | Decision | Requirements citing it | Count | Blocked (🔵) |
|---|---|---|---:|---|
| `DEC-001` | Enterprise employee threshold | `BR-024`, `BR-025` | 2 | `BR-024` |
| `DEC-002` | Revenue vs employee precedence | `BR-024`, `BR-026` | 2 | `BR-024` |
| `DEC-003` | Existing-customer routing precedence | `BR-030`, `BR-031` | 2 | `BR-030` |
| `DEC-004` | Lead-to-Contact duplicate handling | `BR-008`, `BR-010`, `BR-011`, `BR-012`, `BR-013` | 5 | `BR-013` |
| `DEC-005` | Strategic Account designation source | `BR-013`, `BR-027`, `BR-030`, `BR-031` | 4 | `BR-013`, `BR-030` |
| `DEC-006` | SLA business hours and calendar | `BR-038`, `BR-039`, `BR-041`, `BR-042`, `BR-043` | 5 | `BR-038` |
| `DEC-007` | Seller absence handling | `BR-033`, `BR-034`, `BR-035`, `BR-042` | 4 | — |
| `DEC-008` | Account match confidence threshold | `BR-008`, `BR-009`, `BR-010` | 3 | — |
| `DEC-009` | ICP score weighting | `BR-014`, `BR-015`, `BR-018` | 3 | `BR-014` |
| `DEC-010` | Lead conversion criteria | `BR-014`, `BR-017`, `BR-019`, `BR-021` | 4 | `BR-014`, `BR-017`, `BR-019` |
| `DEC-011` | Lead source and channel taxonomy | `BR-004`, `BR-016` | 2 | `BR-016` |
| `DEC-012` | First-touch definition | `BR-040`, `BR-041` | 2 | `BR-040` |
| `DEC-013` | Round-robin behaviour | `BR-034`, `BR-035` | 2 | — |
| `DEC-014` | Marketing automation system and scope | `BR-002`, `BR-004`, `BR-016` | 3 | `BR-016` |
| `DEC-015` | Enrichment source and scope | `BR-005`, `BR-006` | 2 | — |
| `DEC-016` | Analytics historical-data strategy | `BR-007`, `BR-022`, `BR-048`, `BR-049`, `BR-050` | 5 | — |
| `DEC-017` | Lifecycle stage taxonomy | `BR-019`, `BR-020`, `BR-021`, `BR-023` | 4 | `BR-019`, `BR-023` |
| `DEC-018` | Event and history persistence | `BR-009`, `BR-015`, `BR-020`, `BR-021`, `BR-022`, `BR-027`, `BR-032`, `BR-036`, `BR-047`, `BR-049` | 10 | — |
| `DEC-019` | Exception ownership model | `BR-033`, `BR-043`, `BR-044`, `BR-045`, `BR-046`, `BR-047` | 6 | `BR-046` |
| `DEC-020` | Power BI refresh and data access | `BR-049`, `BR-051`, `BR-052`, `BR-055` | 4 | — |
| `DEC-021` | Security and access model | `BR-012`, `BR-025`, `BR-029`, `BR-037`, `BR-052`, `BR-053`, `BR-054`, `BR-055`, `BR-056`, `BR-057`, `BR-058` | 11 | — |
| `DEC-022` | Territory geography model | `BR-028`, `BR-029` | 2 | `BR-028` |
---

## 6. Orphan Analysis

> **The honest section.** A matrix reporting perfect coverage without stating where linkage is thin is
> a marketing document. This section records what the coverage numbers conceal.

### 6.1 Genuine orphans

| Category | Result |
|---|---|
| Requirements with no problem | **None** |
| Problems with no requirement | **None** |
| Decisions with no requirement | **None** |
| Requirements with no persona | **None** |
| Requirements with no test requirement | **None** |

**Why the score is perfect, stated plainly:** requirements were **derived from** the Phase 0B problem
register rather than written independently and linked afterwards. Full coverage is therefore the
expected result of the method, not evidence of unusual rigour. The meaningful question is not whether
links exist but whether they are load-bearing — addressed below.

### 6.2 Thin linkage — flagged for review

| Item | Concern | Assessment |
|---|---|---|
| `PROB-009` (territory) | Only **2** requirements, the fewest of any problem | **Defensible.** Territory has few distinct capabilities — resolve deterministically, version the definitions. Adding more would be padding. Its real weight sits in `DEC-022`, which blocks both. |
| `PROB-015` (metric movements) | Only **3** requirements | **Defensible and thematically important.** `PROB-015` is explicitly *not* an analytics problem — it is resolved by the explainability requirements attached to `PROB-003`, `PROB-011`, and `PROB-014`. Its low count reflects the finding that the analytics gap has an operational cause. |
| `PROB-017` (tribal knowledge) | Only **3** requirements | **Defensible.** Phase 0B records that documentation quality is a *consequence* of change-management design (`PROB-016`), not an independent problem. Requirements concentrate where the cause is. |
| `BR-049` (decision data reaches analytics) | Carries no analytical logic of its own | **Deliberate.** It exists to make explicit that six other requirements' value is unrealised if their data never reaches analytics. Its dependency list is its substance. |
| `BR-059` (metadata-driven rules) | Realised entirely through other requirements | **Deliberate.** A cross-cutting design constraint stated once rather than repeated in four places. |

### 6.3 Personas with no requirement ownership

Eight personas own no requirements: `PER-03`–`PER-08` (all sellers and pipeline-generation roles),
`PER-16` (Executive Leadership), and `PER-17` (Integration User).

**This is correct, and the sellers are the striking case.** `PER-07` (SDR) appears in **7 business
problems** — more than any seller persona — and is described in
[`personas.md`](personas.md) as "the persona most damaged by the current state." It owns **zero**
requirements.

That is the right outcome. Sellers **consume** governed rules; they do not define them. Being the most
affected by a problem does not make you accountable for the rule that fixes it, and conflating the two
is how definitional ownership ends up nowhere — which is precisely the `PROB-010` failure mode, where
Marketing and Sales each measure a different thing because neither owns the definition.

`PER-17` is a non-human principal and cannot own anything.

**Assigning ownership to these personas to balance the table would be artificial linkage** — the exact
failure this matrix exists to detect.

### 6.4 Coverage this matrix does NOT claim

| Not claimed | Why |
|---|---|
| That every requirement is sufficient to solve its problem | Sufficiency is a Phase 0D architecture judgement |
| That the requirement set is complete | Phase 0D may reveal gaps; new `BR-###` are appended, never renumbered |
| That any requirement is implementable today | **52 of 62 are `Open Decision`** |
| That test requirements are tests | They are obligations. **No test exists. No `Actual Result` exists.** |
| That components named will be built | "Future Implementation Component" is a feasibility candidate, not a commitment |

---

## 7. Future Component Traceability

> ⚠️ **Candidate components establishing feasibility and rough cost. Not design commitments. No
> metadata exists.**

| Component type | Requirements | Note |
|---|---|---|
| Record-triggered Flow (before-save) | `BR-001`, `BR-002`, `BR-003` | Capture-time normalization and assessment |
| Record-triggered Flow (after-save) | `BR-008`, `BR-024`, `BR-028`, `BR-030` | Identity, segmentation, territory, routing |
| **Custom Metadata Types** | `BR-025`, `BR-029`, `BR-034`, `BR-037`, `BR-039`, `BR-059` | Governed rule configuration — the mechanism behind `BR-059` |
| Duplicate Rules / Matching Rules | `BR-010`, `BR-011` | Native detection; custom state for durability |
| Explainability fields | `BR-003`, `BR-009`, `BR-015`, `BR-027`, `BR-028`, `BR-032`, `BR-036` | **12 of 49 proposed fields** exist to record *why* |
| Transition history | `BR-020`, `BR-021`, `BR-022`, `BR-036` | Mechanism is `DEC-018` — **irreversible if deferred** |
| Queues | `BR-033`, `BR-044`, `BR-046` | Exception ownership pending `DEC-019` |
| Business Hours / Holidays | `BR-039`, `BR-042` | Standard objects |
| Permission Sets | `BR-012`, `BR-052`, `BR-054`, `BR-055`, `BR-056` | Permission-set-first, pending `DEC-021` |
| Revenue Intelligence Model | `BR-007`, `BR-041`, `BR-048`–`BR-051` | **Power BI is not built in Phase 0** |
| Process documentation | `BR-053`, `BR-060`, `BR-061`, `BR-062` | Governance, not metadata |

**Finding.** Six requirements resolve to **Custom Metadata Types** rather than automation logic. That
concentration is the practical expression of `BR-059` and of the `PER-13` capacity constraint: the
rules Revenue Operations most often needs to change become the cheapest to change safely.

---

## 8. Test Requirement Traceability

Every requirement carries a test obligation. **No test has been written. No `TEST-###` identifiers
have been allocated** — that is a Phase 0D deliverable.

| Test class | Requirements | Obligation |
|---|---|---|
| **Boundary** | `BR-024`, `BR-025`, `BR-028`, `BR-035`, `BR-039`, `BR-043` | Either side of every threshold, **and exactly at it** |
| **Negative path** | `BR-006` and every capability it constrains | **The largest single obligation in the register** — one fixture per capability per consumed attribute |
| Explainability | `BR-003`, `BR-009`, `BR-015`, `BR-027`, `BR-032`, `BR-036` | Recorded basis must reproduce the decision |
| Determinism | `BR-024`, `BR-028`, `BR-030` | Identical inputs yield identical results, repeatedly |
| **Security — both directions** | `BR-053`–`BR-058` | Intended access works **and** unintended access is denied |
| History durability | `BR-020`, `BR-021`, `BR-022` | Survives subsequent record edits |
| Configuration | `BR-025`, `BR-029`, `BR-037`, `BR-059` | Behaviour changes **without deployment** |
| Failure observability | `BR-045` | Forced failure produces a visible exception |
| Reconciliation | `BR-048`, `BR-051` | Metric matches a hand-computed fixture result |

### The blocking constraint on test authoring

> **Scenarios are known now. Expected results are not.**
>
> For any requirement citing an unresolved decision, the test **scenario** can be written today but
> the **expected result** cannot. Writing expected results against invented thresholds would produce a
> suite that passes against rules nobody agreed — **fabricated validation**, which the repository
> conventions classify as a Critical finding.
>
> This is the most dangerous available failure mode in the whole project, because a passing test suite
> is the strongest evidence a portfolio can offer. **10 of 62** requirements can have complete tests
> authored today; the remaining 52 can have scenarios drafted and expected results deferred.

---

## 9. Implementation Status

**Every element is `Proposed` or `Open Decision`. Nothing is `Approved`, `Implemented`, or
`Validated`.**

| Layer | Status |
|---|---|
| Business problems | Documented (Phase 0B) |
| Requirements | **62 Proposed / Open Decision — 0 Approved** |
| Open decisions | **22 Open — 0 Accepted** |
| Personas | Defined |
| Data dictionary | **49 field proposals — 0 created** |
| KPI definitions | **15 governed definitions — 0 implemented, 0 with targets** |
| Access model | **Candidate + recommendation — 0 configured** |
| Architecture | **Not started — Phase 0D** |
| Salesforce metadata | **None** |
| Tests | **None. No `Actual Result` exists anywhere.** |

---

## 10. How to Use This Matrix

| Question | Where to look |
|---|---|
| Why does this requirement exist? | §2 — Problem column |
| What is being done about this problem? | §3 |
| What does this decision unblock? | §5 |
| What can be built before any decision is made? | §2 — rows marked ✅ Complete |
| Who owns this requirement? | §2, §4 |
| What must be tested? | §8 |
| What is genuinely thin? | §6 |

### Maintenance rules

1. **Every new requirement enters this matrix** with its problem, decision, persona, and test
   obligation.
2. **Identifiers are never renumbered.** Withdrawn items keep their identifier and are marked
   `Withdrawn`.
3. **Linkage is never forced.** A genuine orphan is flagged in §6, not manufactured away.
4. **Status advances on evidence**, never on documentation.
5. **The matrix is reviewed at every phase gate**, including a check for decisions implicitly resolved
   by a value appearing somewhere without an `Accepted` entry behind it.
