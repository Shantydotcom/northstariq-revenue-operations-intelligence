# Power BI — Revenue Intelligence Command Center

**Status: empty by design.** Power BI architecture is documented in **Phase 0D** and built in
**Phase 11**. Nothing has been built.

---

## Role in the Architecture

The Power BI experience is the **Revenue Intelligence Command Center** — the analytical and
decision-support layer of the Revenue Operations Intelligence Platform.

> **Power BI is not the transactional system of record.**

Salesforce Sales Cloud owns Leads, Accounts, Contacts, Opportunities, seller ownership, operational
assignment state, and SLA state. Power BI reads and models that data. It does not own operational
state and does not write back.

Where system ownership is unclear, it is recorded as an **Open Decision**, not assumed.

---

## Directory Layout

| Directory | Holds |
|---|---|
| `model/` | Semantic model definition as text (`.tmdl` / `.bim`) — tables, relationships, roles |
| `dax/` | DAX measures as `.dax` files, one concern per file |
| `powerquery/` | Power Query / M transformations as `.pq` files |
| `documentation/` | Model documentation, refresh architecture, measure catalogue |

### Why text, not `.pbix`

`.pbix` and `.pbit` files are **git-ignored**. They are binaries that cache a data model — they
produce unreviewable diffs, can bloat the repository, and if ever connected to a live org can
embed credentials and real rows.

The model is version-controlled as **text** so that measures and transformations are reviewable,
diffable, and defensible. This is a deliberate engineering choice and part of the portfolio
evidence.

---

## Planned Report Pages

| Page | Answers |
|---|---|
| Executive Overview | How is revenue performing, and where is the risk? |
| Funnel Intelligence | Where do records progress and where do they stall? |
| Pipeline Health | Is the pipeline sufficient, current, and credible? |
| Data Quality | Can this data be trusted, and where is it failing? |
| ICP / Qualification | Are we pursuing the right organizations? |
| Lifecycle Performance | How do records move through the lifecycle, and how fast? |
| Routing Performance | Are records reaching the right owner, and how quickly? |
| SLA Performance | Are response commitments being met? Where are breaches concentrated? |
| Territory Performance | How does coverage perform by territory? |
| Seller Performance | How do sellers perform given the records they receive? |
| Operational Exceptions | Where is the system failing, and who owns the remediation? |

These are **candidates**. Final page architecture is designed in Phase 0D against governed KPI
definitions — not chosen first and back-filled with metrics.

---

## Candidate Model Shape

> **The semantic model is not finalized.** These are candidates for Phase 0D design.

**Dimensions:** Date · Account · Seller · Territory · Segment · Lead Source · Lifecycle Stage ·
ICP Grade · Geography

**Facts:** Leads · lifecycle events · routing events · ownership events · SLA events · matching
events · qualification events · Opportunities · Opportunity outcomes

The event-oriented facts depend on `DEC-018` (event/history persistence strategy), which is
unresolved. Whether operational history is queryable at all determines whether several of these
facts can exist.

---

## Governing Rules

- **Dashboard-first design is a defect.** Analytics follows from governed KPI definitions and
  analytics-ready data design. A visual that cannot name the `KPI-###` it renders does not ship.
- Every KPI requires a governed definition: ID · Name · Business Question · Definition ·
  Numerator · Denominator · Grain · Filters · Exclusions · Source · Owner · Refresh Expectation ·
  Target · Baseline · Implementation Status.
- Distinguish **Synthetic Baseline** vs **Proposed Target** vs **Actual Measured Result**.
  There are no Actual Measured Results during Phase 0.
- Power BI figures must **reconcile to Salesforce**. Reconciliation is a test
  (`tests/analytics/`), not an assumption.
- Larger synthetic historical datasets for time-series analysis live in `data/analytics/` and are
  **not** loaded into Salesforce Developer Edition.
- Refresh architecture and data access (`DEC-020`) is an unresolved decision. Do not assume a
  connector, gateway, or refresh cadence.
