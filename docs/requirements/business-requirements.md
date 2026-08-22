# Business Requirements Register

| Field | Value |
|---|---|
| **Document** | Business Requirements Register |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed — **no requirement is `Approved`** |
| **Implementation State** | Target State |
| **Related** | [`open-decisions.md`](open-decisions.md) · [`personas.md`](personas.md) · [`traceability-matrix.md`](traceability-matrix.md) · [`../discovery/business-problems.md`](../discovery/business-problems.md) |

---

## Purpose and Discipline

This register is the backbone of the project. Every architecture decision, Salesforce component,
test, and analytics artifact in later phases must trace back to a requirement here.

Requirements state **business outcomes**, not technical implementations:

> ✅ "Revenue Operations must be able to determine why a Lead was assigned to a specific seller
> without inspecting Flow debug output."
>
> ❌ "Create `Routing_Reason__c`."

The second sentence forecloses the design. The first states what must be true and leaves the
architecture to Phase 0D — where it belongs, and where alternatives can still be weighed.

### The traceability chain

```
Discovery Finding → Business Problem → Business Requirement → Persona / Owner
    → Acceptance Criteria → Open Decision (where applicable)
        → Future Implementation Component → Test Requirement
```

### What this register does NOT do

- ❌ **It does not resolve business decisions.** Where a rule is unagreed, the requirement states the
  required *capability* and cites the `DEC-###`. It does not invent the threshold, weight, taxonomy,
  or precedence order.
- ❌ **It does not design Salesforce metadata.** "Future Implementation Component" names a *candidate
  component type* to establish feasibility and cost, not a design commitment. No field, Flow,
  Permission Set, or Queue is specified.
- ❌ **It does not claim anything is built.** Every requirement is `Proposed` or `Open Decision`.
  None is `Approved`, and nothing is `Implemented`.

---

## 1. How to Read a Requirement

### Status values

Status values come from the repository convention
([`../governance/implementation-status-conventions.md`](../governance/implementation-status-conventions.md) §3).
No new vocabulary is invented here.

| Status | Meaning in this register | Count |
|---|---|---:|
| `Proposed` | Fully specifiable now; awaiting human approval | **10** |
| `Open Decision` | Acceptance criteria depend on an unresolved `DEC-###` | **52** |
| `Approved` | — | **0** |

### Specification completeness

Because "depends on a decision" covers two materially different situations, each `Open Decision`
requirement also carries a completeness marker. This preserves the distinction between a requirement
that is *mostly* specified and one that cannot be specified at all.

| Marker | Meaning | Count |
|---|---|---:|
| **Complete** | Every acceptance criterion is testable today. Status `Proposed`. | **10** |
| **Partially conditional** | The capability and most criteria are specified; named criteria resolve only when the decision is made. | **40** |
| **Blocked** | The core rule is the unmade decision. Only the requirement for *a governed rule to exist* can be stated. | **12** |

**Citing a decision is not the same as depending on it.** A requirement is `Open Decision` only when
an acceptance criterion is genuinely conditional. Several `Proposed` requirements name a `DEC-###`
in their *Related* field for context — `BR-032` references `DEC-018`, `BR-044` and `BR-045`
reference `DEC-019` — without any criterion depending on it. Those requirements are fully
specifiable and testable today, and marking them blocked would overstate how much of this register
is waiting on someone.

> **A `Blocked` requirement is not a placeholder.** "A documented, approved ownership precedence must
> exist and be applied consistently" is a real, testable requirement. What is unknown is the order,
> not whether one is needed.

### Priority

| Priority | Meaning | Count |
|---|---|---:|
| **P0** | Required for a viable governed Lead-to-Revenue operation | **27** |
| **P1** | Important operational capability | **23** |
| **P2** | Valuable enhancement | **12** |

> ⚠️ **Priority scales differ deliberately between registers.** Business problems use **P1/P2/P3**
> ([`../discovery/business-problems.md`](../discovery/business-problems.md)); requirements use
> **P0/P1/P2**. They are not the same scale and must not be read as equivalent. A `P1` problem does
> not automatically produce a `P0` requirement — `PROB-013` (security, P2 provisional) produces
> several `P0` requirements, because assessing exposure is optional while designing least privilege
> is not.

### Requirement fields

Every requirement carries the same fourteen fields: **Requirement ID · Domain · Related
Problem/Finding · Business Problem · Requirement · Business Rationale · Priority · Persona/Owner ·
Acceptance Criteria · Dependencies · Related `DEC-###` · Future Implementation Component · Test
Requirement · Status.**

---

## 2. Register Summary

| Domain | Range | Count | P0 | P1 | P2 |
|---|---|---:|---:|---:|---:|
| Revenue Data Quality Framework | `BR-001`–`BR-007` | 7 | 3 | 3 | 1 |
| Account Identity & Matching Engine | `BR-008`–`BR-013` | 6 | 3 | 1 | 2 |
| ICP Intelligence Framework | `BR-014`–`BR-018` | 5 | 0 | 5 | 0 |
| Lifecycle Governance Framework | `BR-019`–`BR-023` | 5 | 2 | 2 | 1 |
| Revenue Segmentation Framework | `BR-024`–`BR-027` | 4 | 3 | 0 | 1 |
| Territory Management Framework | `BR-028`–`BR-029` | 2 | 1 | 1 | 0 |
| Revenue Routing Engine | `BR-030`–`BR-037` | 8 | 4 | 3 | 1 |
| Revenue SLA Framework | `BR-038`–`BR-043` | 6 | 3 | 2 | 1 |
| Revenue Operations Exception Framework | `BR-044`–`BR-047` | 4 | 2 | 1 | 1 |
| Revenue Intelligence Model | `BR-048`–`BR-052` | 5 | 1 | 2 | 2 |
| Security & Access | `BR-053`–`BR-058` | 6 | 3 | 2 | 1 |
| Administration & Change Management | `BR-059`–`BR-062` | 4 | 2 | 1 | 1 |
| **Total** | | **62** | **27** | **23** | **12** |

**Why 62 and not 200.** Requirement count is not evidence of anything. Each requirement here exists
because a Phase 0B problem or finding demanded a capability that no other requirement covers. Where
two candidate requirements collapsed into one capability, they were merged. Where a requirement
described a solution rather than an outcome, it was rewritten or removed.

**Sequencing note.** The dependency chain from Phase 0B means these requirements are **not
independent**. Data quality and identity requirements (`BR-001`–`BR-013`) gate segmentation
(`BR-024`–`BR-027`), which gates territory (`BR-028`–`BR-029`), which gates routing
(`BR-030`–`BR-037`), which gates SLA (`BR-038`–`BR-043`). Implementing routing before data quality
would produce a correct engine operating on unreliable inputs.

---

## 3. Revenue Data Quality Framework

> **Domain problem.** 48% of Leads lack at least one field routing structurally requires. At that
> rate the incomplete-data path is the **main path, not an edge case** — any design treating it as an
> exception will fail on half of real volume.

### `BR-001` — Routing-critical data completeness is assessed on every inbound record

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001`; baselines `B-01`–`B-05` |
| **Business Problem** | 44% of Leads lack employee count, 31% industry, 22% usable domain, 17% country. Nothing identifies an incomplete record as incomplete, so it enters downstream processes and fails there instead. |
| **Requirement** | Every inbound record must have its completeness against routing-critical data assessed and recorded at the point of capture, so that downstream processes can act on known-incomplete records deliberately rather than failing on them. |
| **Business Rationale** | Failing early and visibly is cheaper than failing late and silently. An incomplete record detected at capture can be enriched, queued, or routed to an exception path; the same record detected at routing has already consumed SLA clock and seller attention. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-07`, `PER-12` (beneficiaries) |
| **Acceptance Criteria** | 1. Given a record missing one or more routing-critical attributes, the record carries a completeness state distinguishing it from a complete record.<br>2. Given a complete record, no incompleteness state is applied.<br>3. The completeness assessment is repeatable — the same input produces the same state.<br>4. Assessment occurs without a user having to request it. |
| **Dependencies** | Definition of "routing-critical" depends on `BR-024`, `BR-028`, `BR-030` (which attributes routing actually consumes) |
| **Related `DEC-###`** | None — the *existence* of assessment does not depend on an unmade decision |
| **Future Implementation Component** | Record-triggered Flow (before-save) evaluating governed field-completeness configuration |
| **Test Requirement** | Boundary fixtures for each required attribute present/absent, and a record missing every attribute |
| **Status** | `Proposed` — **Complete** |

---

### `BR-002` — Inbound data is normalized to governed formats at capture

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001`; `B-03` (22% missing/unusable domain), 3.4% invalid email format |
| **Business Problem** | Domains, country values, and company names arrive in inconsistent formats. A domain that is present but unusable is functionally missing, and defeats the primary matching signal. |
| **Requirement** | Inbound data must be normalized to governed formats at capture, so that matching, segmentation, and territory assignment operate on consistent values rather than compensating for format variance. |
| **Business Rationale** | Normalization applied once at capture is cheaper and more reliable than normalization repeated inside every consuming process. It also makes the data-quality baseline meaningful: "22% unusable domain" only has a stable meaning if "usable" is defined. **`BR-008` and `BR-010` are both P0 and both require normalized values to function** — a domain present but unusable is functionally missing, and defeats the primary matching signal. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-12` (source data) |
| **Acceptance Criteria** | 1. Given a domain supplied with protocol, path, or `www.` prefix, the stored value is the normalized registrable domain.<br>2. Given a country supplied as a name, code, or common variant, the stored value is the governed canonical value.<br>3. Given a value that cannot be normalized, the record is marked as having an unnormalizable value rather than storing a silently altered one.<br>4. Normalization never discards the original supplied value where it differs from the normalized result. |
| **Dependencies** | Governed country and domain format standards ([`../governance/data-governance.md`](../governance/data-governance.md)) |
| **Related `DEC-###`** | `DEC-014` — whether normalization can occur upstream at capture, or only inside Salesforce |
| **Future Implementation Component** | Record-triggered Flow (before-save); governed format reference data |
| **Test Requirement** | Fixture set per attribute covering canonical, variant, malformed, and unnormalizable inputs |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4 and the enforcement point depend on `DEC-014`) |

---

### `BR-003` — Data quality state is explainable at the record level

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001`, `PROB-003` (explainability theme) |
| **Business Problem** | A user looking at a record that failed to route cannot tell which attribute caused the failure, so remediation begins with investigation rather than correction. |
| **Requirement** | Where a record is assessed as incomplete or unnormalizable, the specific attributes responsible must be determinable by the user working the record, without inspecting system logs. |
| **Business Rationale** | This converts remediation from investigation into data entry. `PER-07` handles the highest record volume of any persona; requiring investigation per record does not scale, and `PER-11` absorbs the overflow invisibly (`PROB-012`). |
| **Priority** | P1 |
| **Persona / Owner** | `PER-10` (owner); `PER-07`, `PER-11` (beneficiaries) |
| **Acceptance Criteria** | 1. Given an incomplete record, a user with record access can determine which attributes are missing without administrator assistance.<br>2. Given a record whose state changes after correction, the explanation updates to reflect the new state.<br>3. The explanation names attributes in business language, not API names. |
| **Dependencies** | `BR-001`, `BR-002` |
| **Related `DEC-###`** | None |
| **Future Implementation Component** | Explainability field populated by the same Flow performing assessment; page layout placement |
| **Test Requirement** | Verify explanation content for each incompleteness combination, and that correction updates it |
| **Status** | `Proposed` — **Complete** |

---

### `BR-004` — The inbound capture interface is contractually defined, independent of the source system

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001`, `PROB-010`; `TL-01`, `TL-02` unestablished |
| **Business Problem** | 24,000 inquiries per year arrive through a capture mechanism that has not been identified. Requirements cannot be written against an unknown system, but the absence of a named vendor cannot be allowed to block data-quality design. |
| **Requirement** | The data contract for inbound records — required attributes, formats, source and channel values, and the guarantees the receiving system may rely on — must be defined independently of which system provides the data. |
| **Business Rationale** | Defining the interface rather than the integration allows design to proceed without inventing a vendor. It also makes the eventual `DEC-014` decision cheaper: any platform satisfying the contract can be adopted without redesign. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-12` Marketing Operations (owner); `PER-10` (co-owner) |
| **Acceptance Criteria** | 1. A documented contract exists stating required and optional attributes, formats, and permitted source/channel values.<br>2. The contract states what happens when an inbound record violates it — rejection, acceptance with an exception, or acceptance with normalization.<br>3. The contract names no vendor.<br>4. *(Conditional on `DEC-014`)* Where a capture platform exists, the contract states which obligations it enforces and which Salesforce enforces. |
| **Dependencies** | `BR-002`, `BR-016` |
| **Related `DEC-###`** | `DEC-014` (does a platform exist and what does it own), `DEC-011` (source/channel taxonomy) |
| **Future Implementation Component** | Documented interface contract; validation rules and/or governed reference data enforcing it |
| **Test Requirement** | Contract-conformance fixtures: conforming, non-conforming, and partially conforming inbound payloads |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4 depends on `DEC-014`) |

---

### `BR-005` — The enrichment interface is defined without assuming a provider

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001`; `TL-03`, `DEP-035` |
| **Business Problem** | 44% missing employee count implies either no enrichment, failing enrichment, or enrichment not applied at capture. No provider has been identified, and inventing one would fabricate a dependency. |
| **Requirement** | Where firmographic enrichment is applied, the attributes it may populate, the precedence between enriched and user-supplied values, and the recording of enrichment provenance must be defined — independently of which provider performs it. |
| **Business Rationale** | Provenance is the part that matters and is routinely omitted. An enriched employee count that silently overwrites a user-supplied one destroys information and makes data-quality measurement meaningless, because the measured attribute no longer has a single known origin. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-10` Revenue Operations |
| **Acceptance Criteria** | 1. For any attribute that may be enriched, the precedence between enriched and user-supplied values is documented.<br>2. Given an enriched value, its provenance is determinable at the record level.<br>3. Enrichment never silently overwrites a user-supplied value without that fact being recoverable.<br>4. *(Conditional on `DEC-015`)* Coverage expectations and the residual unenriched population are stated. |
| **Dependencies** | `BR-001`, `BR-006` |
| **Related `DEC-###`** | `DEC-015` (enrichment source and scope) |
| **Future Implementation Component** | Provenance fields; governed attribute-precedence configuration |
| **Test Requirement** | Fixtures where enriched and supplied values agree, disagree, and where only one exists |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4 depends on `DEC-015`) |

---

### `BR-006` — The architecture operates correctly on incomplete data as a normal condition

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001` structural insight; `B-05` (48%) |
| **Business Problem** | At 48% incomplete routing data, a design that treats incompleteness as an exception fails on approximately half of real volume. This is the single most consequential structural finding in Phase 0B. |
| **Requirement** | Every downstream capability — matching, qualification, segmentation, territory, routing, SLA — must have defined, non-failing behaviour for records lacking the attributes it consumes, and that behaviour must make the record's state visible rather than silently defaulting it. |
| **Business Rationale** | The alternative failure modes are both worse than an explicit exception: silent defaulting produces confidently wrong outcomes at scale, and hard failure produces the 21% stalled population already observed (`B-11`). Visibility is what makes either recoverable. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations |
| **Acceptance Criteria** | 1. For each capability consuming record attributes, documented behaviour exists for the absence of each consumed attribute.<br>2. Given a record with insufficient data for a capability, the record is neither silently defaulted nor left in an indeterminate state.<br>3. Given such a record, its condition is visible to an accountable owner (`BR-044`).<br>4. No capability requires complete data to avoid throwing an unhandled error. |
| **Dependencies** | **Requires:** `BR-001`. **Constrains (downstream):** `BR-008`, `BR-014`, `BR-024`, `BR-028`, `BR-030` |
| **Related `DEC-###`** | `DEC-015` — if enrichment is unavailable, this becomes a permanent operating reality rather than a transient condition |
| **Future Implementation Component** | Design constraint applied across all Flows; exception path per capability |
| **Test Requirement** | **A negative-path fixture per capability per consumed attribute.** This is the largest single test obligation in the register and is deliberate. |
| **Status** | `Open Decision` — **Partially conditional** (permanence depends on `DEC-015`; the requirement itself holds either way) |

---

### `BR-007` — Data quality is measurable over time

| Field | Detail |
|---|---|
| **Domain** | Revenue Data Quality Framework |
| **Related Problem/Finding** | `PROB-001`, `PROB-014`; baselines `B-01`–`B-05` |
| **Business Problem** | The synthetic baselines describe a point in time. Without ongoing measurement there is no way to tell whether data quality is improving, degrading, or stable — and therefore no way to substantiate any later improvement claim. |
| **Requirement** | Completeness and normalization rates must be measurable on a recurring basis using a governed definition, so that change over time can be observed and attributed. |
| **Business Rationale** | Establishing baselines before claiming improvement is a stated project principle. A measure that exists only as a one-off analysis cannot support a before/after claim, and an improvement claim without a stable measurement definition is not credible. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-14` Data / BI Analyst (owner); `PER-10` |
| **Acceptance Criteria** | 1. Completeness rate per attribute is derivable from record data using a governed definition.<br>2. The definition states its population, inclusions, and exclusions.<br>3. The measure is reproducible — the same population and definition yield the same result. |
| **Dependencies** | `BR-001`; `KPI-001`–`KPI-003` ([`../governance/kpi-governance.md`](../governance/kpi-governance.md)) |
| **Related `DEC-###`** | `DEC-016` (historical retention) |
| **Future Implementation Component** | Reports; Revenue Intelligence Model measures |
| **Test Requirement** | Reconcile the measure against a known fixture population with a hand-computed expected rate |
| **Status** | `Open Decision` — **Partially conditional** (trend retention depends on `DEC-016`) |

---

## 4. Account Identity & Matching Engine

> **Domain problem.** 44% of new ARR comes from expansion, and NRR is 100.9%. Misrouted expansion
> intent threatens the growth mechanism the company most depends on. Identity risk and revenue
> concentration coincide: Enterprise and Strategic are 47% of ARR across only 85 accounts, and are
> precisely the multi-entity organizations hardest to match.

### `BR-008` — A record's relationship to an existing Account is determined explicitly

| Field | Detail |
|---|---|
| **Domain** | Account Identity & Matching Engine |
| **Related Problem/Finding** | `PROB-002` |
| **Business Problem** | Inbound interest from existing customers is not reliably recognized. Exact name and domain matching fails against multi-site organizations, parent/subsidiary groups, trading names, and franchise models, and 22% of Leads have no usable domain at all. |
| **Requirement** | For every inbound record, the system must explicitly determine whether it relates to an existing Account and whether that Account is an existing customer, producing one of a defined set of outcomes rather than an implicit absence of a link. |
| **Business Rationale** | "No link" currently means both "no relationship exists" and "matching was not attempted or failed" — indistinguishable states with opposite implications. `PER-08` cannot prospect safely and `PER-03` cannot trust that named-account interest reaches them. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-03`, `PER-04`, `PER-08` |
| **Acceptance Criteria** | 1. Every inbound record reaches a determinate identity outcome — matched, requires review, or no match found — and never an indeterminate state.<br>2. Given a record lacking the attributes matching requires, the outcome is "not assessable", distinct from "no match found".<br>3. Customer status is determinable separately from Account linkage.<br>4. *(Conditional on `DEC-008`)* Confidence bands and their thresholds govern which outcome applies.<br>5. *(Conditional on `DEC-004`)* Subsidiary and franchise relationships resolve per the approved commercial policy. |
| **Dependencies** | `BR-002` (normalized domain), `BR-006` |
| **Related `DEC-###`** | `DEC-008` (threshold), `DEC-004` (entity policy) |
| **Future Implementation Component** | Record-triggered Flow; governed matching-rule configuration; match outcome fields |
| **Test Requirement** | Fixtures for exact match, near match, ambiguous multi-candidate, subsidiary, trading name, franchise, no-domain, and churned-Account cases |
| **Status** | `Open Decision` — **Partially conditional** (criteria 4–5) |

---

### `BR-009` — The basis and confidence of every identity decision are recorded

| Field | Detail |
|---|---|
| **Domain** | Account Identity & Matching Engine |
| **Related Problem/Finding** | `PROB-002`, `PROB-003` (explainability theme) |
| **Business Problem** | Where matching occurs, nothing records which signals produced the match or how confident it was. A wrong match is therefore indistinguishable from a right one on inspection, and matching quality cannot be measured or improved. |
| **Requirement** | Every identity decision must record which signals were used, what they matched against, and the resulting confidence — determinable by a user with record access without inspecting system logs. |
| **Business Rationale** | Explainability at the point of decision is the project's central thesis applied to identity. Without it, `DEC-008` cannot be tuned after implementation because there is no evidence about which threshold produced which error. A false positive corrupts customer history; without a recorded basis, it is undetectable. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-03`, `PER-08`, `PER-11`, `PER-14` |
| **Acceptance Criteria** | 1. Given a matched record, a user with record access can determine the matching basis without administrator assistance.<br>2. Given a review-band or no-match outcome, the reason is equally determinable.<br>3. The recorded basis is sufficient to reproduce the decision given the same inputs and configuration.<br>4. The basis is retained when the record is subsequently edited. |
| **Dependencies** | `BR-008` |
| **Related `DEC-###`** | `DEC-008`, `DEC-018` (whether decisions persist as history) |
| **Future Implementation Component** | Match basis and confidence fields; optional decision-history record |
| **Test Requirement** | For each match scenario in `BR-008`, assert the recorded basis matches the decision actually taken |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4 retention depends on `DEC-018`) |

---

### `BR-010` — Potential duplicates are detected and surfaced, never silently merged

| Field | Detail |
|---|---|
| **Domain** | Account Identity & Matching Engine |
| **Related Problem/Finding** | `PROB-008`; `B-06` (14.2%), `B-07` (9.1%), `B-08` (6.8%) |
| **Business Problem** | 14.2% of Leads have a probable duplicate and 6.8% of Accounts appear duplicated. Multiple sellers work the same organization, and Account history fragments across records. |
| **Requirement** | Potential duplicate records must be detected and made visible to the user working them and to an accountable owner. **No automated merge may occur** while the commercial entity policy remains unresolved. |
| **Business Rationale** | The 6.8% Account duplicate rate is explicitly **not interpretable** until the franchise/subsidiary policy is defined — an unknown share may be legitimately distinct entities. Automated merge would destroy legitimately distinct records permanently, and merge is not reversible. Detection is safe and useful today; merge is neither. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-06`, `PER-07`, `PER-08`, `PER-11` |
| **Acceptance Criteria** | 1. Given a record with a probable duplicate, the relationship is visible at the point of work.<br>2. Given a duplicate relationship, it is visible to an accountable owner for review (`BR-044`).<br>3. **No merge occurs without explicit human action** (`BR-012`).<br>4. Duplicate detection distinguishes "probable duplicate" from "confirmed duplicate".<br>5. *(Conditional on `DEC-004`)* Franchise and subsidiary records are classified per the approved policy rather than as duplicates by default. |
| **Dependencies** | `BR-002`, `BR-008` |
| **Related `DEC-###`** | `DEC-004` (entity policy), `DEC-008` (threshold) |
| **Future Implementation Component** | Duplicate Rules and Matching Rules; duplicate status field; review queue |
| **Test Requirement** | Fixtures for exact duplicate, near duplicate, same-parent-different-subsidiary, franchise, and coincidental name similarity |
| **Status** | `Open Decision` — **Partially conditional** (criterion 5) |

> **Measurement caution carried from Phase 0B.** Deduplication would *improve* apparent conversion
> rates with no change in sales performance, because reported Lead volume overstates real demand by
> roughly 14%. Any later before/after analysis must state this explicitly or the improvement claim
> would be misleading.

---

### `BR-011` — Lead-to-Contact duplication is identified before outreach

| Field | Detail |
|---|---|
| **Domain** | Account Identity & Matching Engine |
| **Related Problem/Finding** | `PROB-008`; `B-07` (9.1%) |
| **Business Problem** | 9.1% of Leads are created for people who already exist as Contacts. The seller contacting them has no indication a relationship already exists, producing a poor customer experience and duplicated effort. |
| **Requirement** | Where an inbound Lead corresponds to an existing Contact, that relationship must be visible to the person working the Lead before first outreach occurs. |
| **Business Rationale** | The cost of this defect is concentrated at the moment of contact. Detection after outreach has no value — the customer experience failure has already occurred. Timing is the requirement, not merely detection. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-10` (owner); `PER-07`, `PER-08` |
| **Acceptance Criteria** | 1. Given a Lead matching an existing Contact, the relationship is visible on the Lead before any outreach activity is recorded.<br>2. The existing Contact's Account and its customer status are determinable from the Lead.<br>3. *(Conditional on `DEC-004`)* The handling behaviour — block, flag, or link — follows the approved policy. |
| **Dependencies** | `BR-008`, `BR-010` |
| **Related `DEC-###`** | `DEC-004` |
| **Future Implementation Component** | Duplicate Rules across Lead and Contact; Lead page layout surfacing |
| **Test Requirement** | Fixtures for exact email match, name match at same Account, and same person at a different Account |
| **Status** | `Open Decision` — **Partially conditional** (criterion 3) |

---

### `BR-012` — Record merge is a governed, scoped, and audited capability

| Field | Detail |
|---|---|
| **Domain** | Account Identity & Matching Engine |
| **Related Problem/Finding** | `PROB-008`, `PROB-013` |
| **Business Problem** | Merge permanently destroys data and is not reversible. Where it is available as an incidental consequence of a role, it will eventually be used on records that were legitimately distinct. |
| **Requirement** | The ability to merge records must be a deliberately granted capability held by a defined set of persons, and every merge must be attributable to the person who performed it and the records involved. |
| **Business Rationale** | This is the intersection of a data requirement and a security requirement, and it is routinely missed in both. Given `DEC-004` is unresolved, the population of records that *look* like duplicates but are legitimately distinct is currently unknown — which makes unrestricted merge actively dangerous today, not merely untidy. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-13` Salesforce Administrator (owner); `PER-11` (primary user) |
| **Acceptance Criteria** | 1. Merge capability is grantable and revocable independently of general record write access.<br>2. Given a merge, the acting user and the affected records are attributable afterwards.<br>3. Merge is not available to any persona by default.<br>4. *(Conditional on `DEC-004`, `DEC-021`)* The set of personas holding the capability follows the approved access model. |
| **Dependencies** | `BR-010`, `BR-053`, `BR-054` |
| **Related `DEC-###`** | `DEC-004`, `DEC-021` |
| **Future Implementation Component** | Permission Set granting merge; audit approach per `DEC-018` |
| **Test Requirement** | Verify a persona without the capability cannot merge; verify attribution after a permitted merge |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-013` — Account family relationships are explicit

| Field | Detail |
|---|---|
| **Domain** | Account Identity & Matching Engine |
| **Related Problem/Finding** | `PROB-002`, `PROB-008`; customer-base structure finding |
| **Business Problem** | Customers routinely operate under multiple trading names, regional brands, site-level entities, and franchise arrangements. Where these relationships are not represented, each is treated as an unrelated organization. |
| **Requirement** | Where organizations are related as parent, subsidiary, franchise, or trading name, that relationship must be explicitly represented so that a complete relationship view is obtainable. |
| **Business Rationale** | `PER-03` manages 5.5 accounts each and requires complete relationship history; a fragmented view of a multi-entity customer is functionally a wrong view. This also determines whether Strategic designation propagates to subsidiaries — a `DEC-005` input. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-10` (owner); `PER-03`, `PER-04`, `PER-08` |
| **Acceptance Criteria** | 1. Given related Accounts, the relationship type is determinable.<br>2. Given any Account in a family, the complete family is obtainable.<br>3. *(Conditional on `DEC-004`)* The relationship types available reflect the approved commercial policy. |
| **Dependencies** | `BR-008` |
| **Related `DEC-###`** | `DEC-004`, `DEC-005` |
| **Future Implementation Component** | Account hierarchy and/or relationship representation |
| **Test Requirement** | Fixtures for a two-level parent/subsidiary group, a franchise group, and an Account with multiple trading names |
| **Status** | `Open Decision` — **Blocked** (relationship taxonomy is the unmade `DEC-004` decision) |

---

## 5. ICP Intelligence Framework

> **Domain problem.** Qualification is a **definitional dispute, not a performance dispute**
> (`PROB-010`). Two functions measuring different things will disagree indefinitely regardless of
> effort. It is a governance problem before it is a scoring problem.

### `BR-014` — ICP fit is assessed against a single governed definition

| Field | Detail |
|---|---|
| **Domain** | ICP Intelligence Framework |
| **Related Problem/Finding** | `PROB-010` |
| **Business Problem** | No single agreed definition of a qualified Lead or of ICP fit exists. Marketing and Sales disagree about whether delivered volume is qualified, and the disagreement is unresolvable because each measures a different thing. |
| **Requirement** | ICP fit must be assessed against one governed definition with a single accountable owner, applied consistently to every record, so that fit is a shared fact rather than a per-function opinion. |
| **Business Rationale** | Definition ownership matters more than the definition's content. Without an accountable owner, any criteria agreed will drift back into dispute as circumstances change — which is how the current state arose. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-01` VP Sales with `PER-15` Marketing Leadership (definition owners); `PER-12` (operator) |
| **Acceptance Criteria** | 1. One governed fit definition exists with a named accountable owner.<br>2. The definition is applied to every record for which it is assessable, without per-user variation.<br>3. Changes to the definition follow the change path (`BR-060`) and are versioned.<br>4. *(Conditional on `DEC-009`)* Attributes, weights, and grade boundaries follow the approved weighting. |
| **Dependencies** | `BR-001`, `BR-018` |
| **Related `DEC-###`** | `DEC-009` (weighting), `DEC-010` (conversion criteria) |
| **Future Implementation Component** | Governed scoring configuration; record-triggered Flow; score and grade fields |
| **Test Requirement** | Fixtures at each grade boundary, plus above/below every threshold |
| **Status** | `Open Decision` — **Blocked** (the weighting *is* the unmade decision) |

---

### `BR-015` — The basis for every fit assessment is recorded

| Field | Detail |
|---|---|
| **Domain** | ICP Intelligence Framework |
| **Related Problem/Finding** | `PROB-010`, `PROB-003` |
| **Business Problem** | A score without a basis cannot be trusted, challenged, or improved. A seller who disagrees with a score has no way to determine whether the score is wrong or their expectation is. |
| **Requirement** | Every fit assessment must record which attributes contributed, what values they held, and how they produced the resulting score and grade. |
| **Business Rationale** | Explainable scoring is a stated architecture principle, and it is what makes `DEC-009` tunable after implementation — without a recorded basis there is no evidence about which weighting produced which outcome. It also exposes the systematic bias in criterion 3 below. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-10` (owner); `PER-07`, `PER-12`, `PER-14` |
| **Acceptance Criteria** | 1. Given a scored record, the contributing attributes and their values are determinable by a user with record access.<br>2. The recorded basis is sufficient to reproduce the score given the same configuration.<br>3. Given a record scored using incomplete data, the basis states which attributes were unavailable.<br>4. The basis remains interpretable after the scoring configuration changes — a score is attributable to the configuration version that produced it. |
| **Dependencies** | `BR-014` |
| **Related `DEC-###`** | `DEC-009`, `DEC-018` |
| **Future Implementation Component** | Score basis field; scoring configuration versioning |
| **Test Requirement** | Assert the recorded basis reproduces the score for every boundary fixture in `BR-014` |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4 depends on `DEC-018`) |

---

### `BR-016` — Lead source and channel use a governed taxonomy

| Field | Detail |
|---|---|
| **Domain** | ICP Intelligence Framework |
| **Related Problem/Finding** | `PROB-010`, `PROB-014` |
| **Business Problem** | Source values are inconsistent. `PER-15` disputes attribution with Sales, and inconsistent taxonomy is a contributing cause. Conversion by source cannot be compared when the same source appears under several values. |
| **Requirement** | Lead source and channel must use a single governed taxonomy with defined values and a defined distinction between the two concepts, enforced at the earliest point the architecture controls. |
| **Business Rationale** | Enforcement point determines durability. A taxonomy enforced at capture stays clean; one enforced by correction afterwards degrades continuously and imposes permanent remediation cost on `PER-11`. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-12` Marketing Operations |
| **Acceptance Criteria** | 1. A governed taxonomy exists with defined values and a documented source/channel distinction.<br>2. Values outside the taxonomy cannot be silently introduced.<br>3. Given a record whose supplied source is not in the taxonomy, the record is marked rather than defaulted to a catch-all value.<br>4. *(Conditional on `DEC-014`)* Where a capture platform exists, the enforcement point and division of responsibility are documented. |
| **Dependencies** | `BR-002`, `BR-004` |
| **Related `DEC-###`** | `DEC-011` (taxonomy), `DEC-014` (enforcement point) |
| **Future Implementation Component** | Governed picklist or reference data; validation at capture |
| **Test Requirement** | Fixtures for each taxonomy value, an out-of-taxonomy value, and a null value |
| **Status** | `Open Decision` — **Blocked** (the taxonomy *is* the unmade `DEC-011` decision) |

---

### `BR-017` — Lead conversion follows governed criteria

| Field | Detail |
|---|---|
| **Domain** | ICP Intelligence Framework |
| **Related Problem/Finding** | `PROB-010`, `PROB-011` |
| **Business Problem** | No agreed criteria govern when a Lead is converted. Conversion timing therefore varies by individual judgement, making funnel conversion rates (`B-17`–`B-21`) incomparable across teams and periods. |
| **Requirement** | Lead conversion must occur against governed criteria with a defined owner, and the conditions satisfied at conversion must be determinable afterwards. |
| **Business Rationale** | Conversion is the handoff point between Marketing-owned and Sales-owned process. Ungoverned, it is where the definitional dispute in `PROB-010` becomes a measurement dispute, because each function reads the same funnel rate as evidence for its own position. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-01` with `PER-12` (criteria owners); `PER-07` (operator) |
| **Acceptance Criteria** | 1. Documented conversion criteria exist with a named owner.<br>2. Given a converted record, the conditions satisfied at conversion are determinable afterwards.<br>3. Conversion interacts correctly with an existing matched Account rather than creating a duplicate (`BR-008`).<br>4. *(Conditional on `DEC-010`)* The criteria themselves, and whether an Opportunity is always created, follow the approved definition. |
| **Dependencies** | `BR-008`, `BR-014`, `BR-021` |
| **Related `DEC-###`** | `DEC-010` |
| **Future Implementation Component** | Validation rules and/or Flow enforcing criteria; conversion audit approach |
| **Test Requirement** | Fixtures satisfying and failing each criterion; conversion against an existing matched Account |
| **Status** | `Open Decision` — **Blocked** (criteria are the unmade `DEC-010` decision) |

---

### `BR-018` — "Not assessable" is distinguished from "poor fit"

| Field | Detail |
|---|---|
| **Domain** | ICP Intelligence Framework |
| **Related Problem/Finding** | `PROB-010` compounding condition; `B-01`, `B-02` |
| **Business Problem** | Fit assessment depends on employee count (44% missing) and industry (31% missing). If unassessable records score low, records are deprioritized **because their data is incomplete**, not because they are poor prospects. |
| **Requirement** | A record that cannot be assessed for fit must carry a state distinct from a record assessed as a poor fit, and the two must not be conflated in any downstream process or report. |
| **Business Rationale** | **This is a systematic bias, not random noise.** It biases against records whose data happens to be incomplete — a population that `DEC-015` enrichment may later fix, retroactively revealing missed opportunity that was never visible as loss. Conflating the two states also corrupts every conversion metric computed by grade. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-10` (owner); `PER-12`, `PER-14` |
| **Acceptance Criteria** | 1. Given a record lacking attributes fit assessment requires, its state is "not assessable", distinct from any fit grade.<br>2. No downstream process treats "not assessable" as equivalent to a low grade.<br>3. Reports and analytics report the two populations separately.<br>4. Given a record that becomes assessable after data is added, it is assessed. |
| **Dependencies** | `BR-001`, `BR-006`, `BR-014` |
| **Related `DEC-###`** | `DEC-009` |
| **Future Implementation Component** | Distinct assessability state; report and analytics filter conventions |
| **Test Requirement** | Fixtures: assessable-low-fit, not-assessable, and not-assessable-then-completed |
| **Status** | `Open Decision` — **Partially conditional** (grade boundaries depend on `DEC-009`; the distinction itself does not) |

---

## 6. Lifecycle Governance Framework

> **Domain problem.** If stage transition history is not retained, "how long does a record spend in
> each stage" is **unanswerable retrospectively — and unrecoverable**. This is the one place in the
> project where a deferred decision destroys the option rather than postponing it.

### `BR-019` — A single governed lifecycle taxonomy exists

| Field | Detail |
|---|---|
| **Domain** | Lifecycle Governance Framework |
| **Related Problem/Finding** | `PROB-011` |
| **Business Problem** | Lifecycle stage and Lead Status are used inconsistently and appear to overlap. Two competing representations of the same concept mean neither is authoritative, and reports built on either disagree with reports built on the other. |
| **Requirement** | One governed lifecycle taxonomy must exist, with a single authoritative representation per concept and defined permitted transitions between stages. |
| **Business Rationale** | Single-sourcing is the requirement, not the specific taxonomy. Parallel representations are how the current inconsistency arose, and adding a third would compound rather than resolve it. Funnel baselines `B-17`–`B-21` are uninterpretable until this exists. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-01`, `PER-12` |
| **Acceptance Criteria** | 1. Exactly one attribute is authoritative for lifecycle stage; any other stage-like value is documented as derived.<br>2. Permitted transitions are documented, including whether backwards movement is allowed.<br>3. Given an attempted transition outside the permitted set, the behaviour is defined and consistent.<br>4. *(Conditional on `DEC-017`)* The stage list and its relationship to standard Lead Status follow the approved taxonomy. |
| **Dependencies** | **Requires:** none. **Constrains (downstream):** `BR-020`–`BR-023`, `BR-048` |
| **Related `DEC-###`** | `DEC-017` (taxonomy), `DEC-010` (conversion criteria) |
| **Future Implementation Component** | Governed stage representation; transition validation |
| **Test Requirement** | Fixture per permitted transition and per prohibited transition |
| **Status** | `Open Decision` — **Blocked** (the taxonomy *is* the unmade `DEC-017` decision) |

---

### `BR-020` — Lifecycle transitions are recorded with timestamp and cause

| Field | Detail |
|---|---|
| **Domain** | Lifecycle Governance Framework |
| **Related Problem/Finding** | `PROB-011`, `PROB-015`, `PROB-003` |
| **Business Problem** | Stage transitions leave no durable record. Progression cannot be measured, stalling cannot be detected, and analytics cannot report causes that were never captured. |
| **Requirement** | Every lifecycle stage transition must be recorded with the stages involved, when it occurred, what caused it, and which principal performed it — captured at the moment of transition. |
| **Business Rationale** | **This data cannot be reconstructed later.** Unlike most requirements, deferring this one does not postpone the capability — it permanently forecloses it. Every lifecycle, funnel, and velocity metric in the project depends on this record existing. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-14`, `PER-09` |
| **Acceptance Criteria** | 1. Given a stage transition, a durable record exists identifying from-stage, to-stage, timestamp, cause, and acting principal.<br>2. The record persists independently of subsequent edits to the record.<br>3. Transitions caused by automation are distinguishable from those caused by a user.<br>4. *(Conditional on `DEC-018`)* The capture mechanism and retention period follow the approved persistence strategy. |
| **Dependencies** | `BR-019` |
| **Related `DEC-###`** | `DEC-018` (**irreversible — decide before implementation**), `DEC-017` |
| **Future Implementation Component** | Field history tracking, a history object, or platform events per `DEC-018` |
| **Test Requirement** | Assert a durable record exists for each permitted transition; assert it survives a subsequent record edit |
| **Status** | `Open Decision` — **Partially conditional** (mechanism depends on `DEC-018`; the obligation does not) |

> ⚠️ **Deferral warning.** If implementation proceeds before `DEC-018` is resolved, transitions
> occurring in the interim are lost permanently. This is the only requirement in the register where
> delay causes irreversible data loss rather than rework.

---

### `BR-021` — Conversion is a governed lifecycle transition

| Field | Detail |
|---|---|
| **Domain** | Lifecycle Governance Framework |
| **Related Problem/Finding** | `PROB-011`, `PROB-010` |
| **Business Problem** | Lead conversion changes the object model — Lead becomes Account, Contact, and optionally Opportunity — and is currently treated as an event separate from lifecycle progression. Continuity of the lifecycle across that boundary is therefore broken. |
| **Requirement** | Conversion must be represented as a lifecycle transition with continuity preserved, so that the lifecycle of a customer relationship is traceable across the Lead-to-Opportunity boundary. |
| **Business Rationale** | Without continuity, end-to-end cycle time (inquiry to Closed Won) cannot be measured — the metric most relevant to a business with 21–210 day cycle spread, and the one `PER-01` and `PER-16` most need. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-10` (owner); `PER-14` |
| **Acceptance Criteria** | 1. Given a converted record, the pre-conversion lifecycle history remains traceable from the resulting records.<br>2. Conversion is recorded as a transition per `BR-020`.<br>3. Elapsed time from record creation to conversion is derivable.<br>4. *(Conditional on `DEC-010`, `DEC-017`)* The stages either side of conversion follow the approved taxonomy. |
| **Dependencies** | `BR-017`, `BR-019`, `BR-020` |
| **Related `DEC-###`** | `DEC-010`, `DEC-017`, `DEC-018` |
| **Future Implementation Component** | Conversion-time Flow preserving lifecycle linkage |
| **Test Requirement** | Convert a record with prior stage history; assert history remains traceable and elapsed time is derivable |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-022` — Time spent in each lifecycle stage is answerable retrospectively

| Field | Detail |
|---|---|
| **Domain** | Lifecycle Governance Framework |
| **Related Problem/Finding** | `PROB-011` critical architectural consequence |
| **Business Problem** | "How long does a record spend in each stage?" cannot currently be answered, so the bottleneck in the funnel cannot be located and no stage-level improvement can be targeted or verified. |
| **Requirement** | For any record and any past period, the time spent in each lifecycle stage must be derivable from recorded data without reconstruction or inference. |
| **Business Rationale** | This is the specific analytical capability `BR-020` exists to enable, stated as an outcome so it can be tested. It is also the capability that makes the funnel baselines actionable: knowing conversion is 45% is not useful without knowing where records wait. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-14` Data / BI Analyst (owner); `PER-10`, `PER-01` |
| **Acceptance Criteria** | 1. Given any record with transition history, time in each stage is computable.<br>2. Given a population and a period, stage duration distributions are computable.<br>3. Computation requires no inference from record modification dates.<br>4. *(Conditional on `DEC-016`, `DEC-018`)* The retention period bounds how far back this is answerable, and that bound is documented. |
| **Dependencies** | `BR-020` |
| **Related `DEC-###`** | `DEC-018`, `DEC-016` |
| **Future Implementation Component** | Revenue Intelligence Model measures over transition history |
| **Test Requirement** | Fixture with a known transition sequence; assert computed durations match hand-calculated expectations |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-023` — Stalled and recycled records have explicit states

| Field | Detail |
|---|---|
| **Domain** | Lifecycle Governance Framework |
| **Related Problem/Finding** | `PROB-011`, `PROB-012` |
| **Business Problem** | Stalled records have no state identifying them as stalled, so they are indistinguishable from records being actively worked. Recycling of unconverted records is undefined, so records either disappear from view or are reworked ad hoc. |
| **Requirement** | Records that have stopped progressing must reach an explicit state identifying them as such, and the treatment of unconverted records must be defined rather than left to individual practice. |
| **Business Rationale** | An invisible stalled record is a silent loss. This is the lifecycle instance of the general principle in `BR-006` and `BR-033`: the failure mode to design against is silence, because silence is what prevents the loss from ever being measured. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-10` (owner); `PER-07`, `PER-09`, `PER-11` |
| **Acceptance Criteria** | 1. Given a record with no progression for a defined period, it reaches an explicit stalled state.<br>2. Stalled records are visible to an accountable owner (`BR-044`).<br>3. Given a recycled record, its prior history remains traceable.<br>4. *(Conditional on `DEC-017`)* Stall thresholds and recycling behaviour follow the approved taxonomy. |
| **Dependencies** | `BR-019`, `BR-020`, `BR-044` |
| **Related `DEC-###`** | `DEC-017` |
| **Future Implementation Component** | Scheduled evaluation; stalled state; exception surfacing |
| **Test Requirement** | Fixtures either side of the stall threshold; a recycled record retaining prior history |
| **Status** | `Open Decision` — **Blocked** (stall and recycling definitions are part of the unmade `DEC-017` decision) |

---

## 7. Revenue Segmentation Framework

> **Domain problem.** Segmentation is the load-bearing element between data quality and routing. It
> inherits every upstream defect and transmits it to every downstream ownership decision — including
> **which territory map applies**, since Enterprise uses three regions and Mid-Market two.

### `BR-024` — Segment is derived from governed, documented rules

| Field | Detail |
|---|---|
| **Domain** | Revenue Segmentation Framework |
| **Related Problem/Finding** | `PROB-004` |
| **Business Problem** | Thresholds are not clearly defined, firmographic signals conflict, and records lacking inputs cannot be segmented deterministically. Segment determines the owning team, the sales motion, the expected cycle length, and the territory map. |
| **Requirement** | Segment must be derived from documented, governed rules applied consistently to every record for which the required inputs are available, producing the same result for the same inputs. |
| **Business Rationale** | Mid-Market is most exposed — 50.4% of new ARR from 37% of new logos, with boundaries touching both SMB round robin and Enterprise territory. A record falling to SMB round robin that warranted a Mid-Market AE receives the wrong motion for its deal size, and neither the seller nor the manager can tell it happened. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-04`, `PER-05`, `PER-06` |
| **Acceptance Criteria** | 1. Given identical firmographic inputs, segmentation produces an identical result.<br>2. Given a record whose signals indicate different segments, the documented precedence resolves it deterministically.<br>3. The derivation basis is recorded (`BR-027`).<br>4. *(Conditional on `DEC-001`, `DEC-002`)* Thresholds and signal precedence follow the approved values. |
| **Dependencies** | `BR-001`, `BR-006`; gates `BR-028`, `BR-030` |
| **Related `DEC-###`** | `DEC-001` (thresholds), `DEC-002` (precedence) |
| **Future Implementation Component** | Governed segmentation configuration; record-triggered Flow; segment and basis fields |
| **Test Requirement** | Boundary fixtures either side of every threshold; conflicting-signal fixtures; missing-signal fixtures |
| **Status** | `Open Decision` — **Blocked** (thresholds and precedence are the unmade decisions) |

---

### `BR-025` — Segmentation thresholds are versioned configuration

| Field | Detail |
|---|---|
| **Domain** | Revenue Segmentation Framework |
| **Related Problem/Finding** | `PROB-004`, `PROB-014`, `PROB-018` |
| **Business Problem** | Segment was introduced as a picklist for reporting and became a routing input without being redesigned for that purpose. Thresholds embedded in automation require a deployment to change, so they are not changed — and drift from the commercial reality they represent. |
| **Requirement** | Segmentation thresholds must be governed configuration that Revenue Operations can inspect and change without a deployment, and changes must be versioned with an effective date so historical assignments remain interpretable. |
| **Business Rationale** | Two distinct problems are solved here. **Maintainability**: a single administrator at a 1:64 ratio (`PROB-018`) cannot absorb a deployment cycle for a threshold change. **Measurement integrity**: without effective dating, a threshold change silently rewrites the meaning of historical segment assignments, making period-over-period comparison invalid — the same defect already observed in territory (`PROB-009`). |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-13`, `PER-14` |
| **Acceptance Criteria** | 1. Thresholds are inspectable without examining automation logic.<br>2. A threshold change requires no code or Flow deployment.<br>3. Changes carry an effective date, and a record's segment is attributable to the version in force when it was assigned.<br>4. Threshold change capability is grantable independently of general record access (`BR-054`). |
| **Dependencies** | `BR-024`, `BR-059` |
| **Related `DEC-###`** | `DEC-001` (values), `DEC-021` (who may change them) |
| **Future Implementation Component** | Custom Metadata Type holding thresholds with effective dating |
| **Test Requirement** | Change a threshold without deployment and assert new records segment differently while historical assignments remain attributable to the prior version |
| **Status** | `Open Decision` — **Partially conditional** (values from `DEC-001`; the mechanism is specifiable now) |

---

### `BR-026` — Records that cannot be segmented are surfaced, never defaulted

| Field | Detail |
|---|---|
| **Domain** | Revenue Segmentation Framework |
| **Related Problem/Finding** | `PROB-004`, `PROB-001`; `B-01` (44%) |
| **Business Problem** | Employee count is missing on 44% of Leads. A rule that silently assigns a default segment when inputs are absent will misclassify at scale, and because the default is invisible, the misclassification is undetectable. |
| **Requirement** | A record lacking the inputs segmentation requires must reach an explicit unsegmentable state and be surfaced, and must never be assigned a segment by default. |
| **Business Rationale** | The failure mode this prevents is the worst available: silent, confident, high-volume misclassification. A defaulted record is routed, worked, and reported as though correctly segmented — the error is invisible at every stage. An unsegmentable record is visibly incomplete and can be fixed. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-05`, `PER-06`, `PER-11` |
| **Acceptance Criteria** | 1. Given a record lacking required inputs, its state is explicitly unsegmentable.<br>2. No default segment is applied in that condition.<br>3. The record is visible to an accountable owner (`BR-044`).<br>4. Given inputs subsequently supplied, the record is segmented and leaves the unsegmentable state. |
| **Dependencies** | `BR-001`, `BR-006`, `BR-024`, `BR-044` |
| **Related `DEC-###`** | `DEC-002` (fallback signal permitted or not) |
| **Future Implementation Component** | Explicit unsegmentable state; exception surfacing |
| **Test Requirement** | Fixtures missing each required input; assert no default; assert re-evaluation on completion |
| **Status** | `Open Decision` — **Partially conditional** (whether a fallback signal is permitted depends on `DEC-002`) |

---

### `BR-027` — Segment derivation basis and overrides are recorded

| Field | Detail |
|---|---|
| **Domain** | Revenue Segmentation Framework |
| **Related Problem/Finding** | `PROB-004`; manual overrides carry no recorded reason |
| **Business Problem** | Manual segment overrides carry no recorded reason. An overridden segment is indistinguishable from a derived one, so the override population cannot be measured — and a high override rate is the clearest available evidence that the rules are wrong. |
| **Requirement** | The basis on which a segment was derived must be recorded, and where a segment is manually overridden, the override and its reason must be recorded and distinguishable from a derived value. |
| **Business Rationale** | Override rate is a feedback signal on rule quality. Without it, `DEC-001` thresholds cannot be evaluated after implementation — there is no evidence about where the rules disagree with human judgement, which is exactly the evidence needed to refine them. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-10` (owner); `PER-02`, `PER-14` |
| **Acceptance Criteria** | 1. Given a derived segment, the contributing inputs and applied rule are determinable.<br>2. Given an overridden segment, the override, the acting user, and the reason are determinable.<br>3. Overridden and derived segments are distinguishable in reporting.<br>4. Override rate is measurable by segment and period. |
| **Dependencies** | `BR-024` |
| **Related `DEC-###`** | `DEC-005` (Strategic designation is a form of override), `DEC-018` |
| **Future Implementation Component** | Segment basis and override fields; override reason capture |
| **Test Requirement** | Assert basis for each derivation path; assert override recording and reporting distinction |
| **Status** | `Open Decision` — **Partially conditional** (Strategic override interaction depends on `DEC-005`) |

---

## 8. Territory Management Framework

> **Domain problem.** Enterprise operates three regions, Mid-Market two, so the boundaries **cannot
> be identical**. Germany resolves to Enterprise "Central" but Mid-Market "East" — the same
> organization resolves differently depending on a segment derived from a field missing 44% of the
> time.

### `BR-028` — Territory resolves deterministically, including at boundaries

| Field | Detail |
|---|---|
| **Domain** | Territory Management Framework |
| **Related Problem/Finding** | `PROB-009` (Structural Finding) |
| **Business Problem** | International markets were attached to US-shaped regions as exceptions across successive growth phases. Coverage gaps and overlaps exist, and Germany resolves differently by segment. |
| **Requirement** | Territory must resolve to exactly one territory for any record with the required inputs, including at boundary and international cases, with the resolution basis recorded. |
| **Business Rationale** | "Exactly one" is the requirement. The current defect is not that boundaries are unusual — different segments may legitimately warrant different coverage shapes — but that resolution is **ambiguous and produces inconsistent results without anyone intending it**. Ambiguity is what makes coverage gaps invisible. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-01` VP Sales (structure owner); `PER-10` (operator); `PER-04`, `PER-05` |
| **Acceptance Criteria** | 1. Given a record with required inputs, exactly one territory resolves.<br>2. Given a boundary case, resolution is deterministic and repeatable.<br>3. Given a record whose segment is unresolved, territory resolution does not silently guess.<br>4. The resolution basis is determinable at the record level.<br>5. *(Conditional on `DEC-022`)* The territory definitions and the Enterprise/Mid-Market asymmetry resolution follow the approved model. |
| **Dependencies** | `BR-024`, `BR-026`, `BR-006` |
| **Related `DEC-###`** | `DEC-022` |
| **Future Implementation Component** | Governed territory configuration; record-triggered Flow; territory and basis fields |
| **Test Requirement** | A fixture per market, per segment; explicit Germany Enterprise vs Mid-Market cases; unsupported-geography and missing-country cases |
| **Status** | `Open Decision` — **Blocked** (definitions are the unmade `DEC-022` decision) |

---

### `BR-029` — Territory definitions are versioned with effective dates

| Field | Detail |
|---|---|
| **Domain** | Territory Management Framework |
| **Related Problem/Finding** | `PROB-009`, `PROB-014` |
| **Business Problem** | Territory definitions have changed repeatedly across four growth phases with no versioning. Territory performance therefore cannot be compared period-over-period, because the boundaries themselves moved. |
| **Requirement** | Territory definitions must be governed, versioned configuration with effective dates, so that a historical assignment remains attributable to the definition in force at the time. |
| **Business Rationale** | This is a measurement-integrity requirement, not a convenience. Comparing territory performance across a boundary change without versioning produces a conclusion about performance that is actually an artefact of the boundary move — and nothing in the data reveals the substitution. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-01` (owner); `PER-10`, `PER-14` |
| **Acceptance Criteria** | 1. Definitions are inspectable without examining automation logic.<br>2. A definition change requires no code or Flow deployment.<br>3. Changes carry an effective date; historical assignments are attributable to the version then in force.<br>4. Definition change capability is grantable independently of record access. |
| **Dependencies** | `BR-028`, `BR-059` |
| **Related `DEC-###`** | `DEC-022`, `DEC-021` |
| **Future Implementation Component** | Custom Metadata Type holding territory definitions with effective dating |
| **Test Requirement** | Change a definition and assert new records resolve differently while historical assignments remain attributable to the prior version |
| **Status** | `Open Decision` — **Partially conditional** (boundaries from `DEC-022`; the mechanism is specifiable now) |

---

## 9. Revenue Routing Engine

> **Domain problem.** Three assignment bases — named account, territory, and round robin — operate
> simultaneously with **no documented precedence order**. This is a business policy gap, not an
> implementation gap, and it cannot be solved by configuration.

### `BR-030` — An approved ownership precedence exists and is applied consistently

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-005` (business policy gap) |
| **Business Problem** | When an inbound record belongs to an existing customer, falls in a territory, and matches a Strategic named account, there is no agreed answer to which claim wins. Ownership disputes consume manager time; sellers develop private workarounds. |
| **Requirement** | A documented, human-approved ownership precedence order must exist and be applied consistently to every routed record, with the applied precedence recorded on the record. |
| **Business Rationale** | **The requirement is that a precedence exists and is applied consistently — which is stateable and testable now, even though the order is not yet decided.** Consistency delivers most of the value: a consistently applied order that some disagree with is still arbitrable, whereas an inconsistent one is not. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-01` VP Sales (decision owner); `PER-10` (operator); `PER-02`, `PER-03` |
| **Acceptance Criteria** | 1. A documented precedence order exists and is recorded as approved.<br>2. Given a record satisfying multiple assignment bases, the precedence resolves it to exactly one owner.<br>3. Given identical inputs, the same owner is selected every time.<br>4. The applied precedence step is recorded (`BR-032`).<br>5. *(Conditional on `DEC-003`, `DEC-005`)* The order itself follows the approved decision. |
| **Dependencies** | `BR-008`, `BR-024`, `BR-028` |
| **Related `DEC-###`** | `DEC-003` (precedence), `DEC-005` (Strategic designation) |
| **Future Implementation Component** | Ordered, governed routing-precedence configuration |
| **Test Requirement** | A fixture per precedence collision: customer+territory, customer+named, named+territory, and all three |
| **Status** | `Open Decision` — **Blocked** (the order *is* the unmade `DEC-003` decision) |

---

### `BR-031` — Named and Strategic accounts are not routed away silently

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-005`, `PROB-002` |
| **Business Problem** | `PER-03` expects named accounts never to be routed elsewhere, but matching failures mean inbound interest from a named account can reach another seller with nobody noticing. Strategic is 2 AEs covering 11 customers at $2.0M quota each. |
| **Requirement** | Where a record relates to a named or Strategic account, it must either route to the designated owner or, where precedence directs otherwise, do so visibly with the reason recorded. |
| **Business Rationale** | The requirement is **visibility, not absolute protection**. There may be legitimate reasons to route a named-account record elsewhere; what is unacceptable is that it happens without anyone knowing. Given Strategic concentration, a single silent misroute is materially costly. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-01` (owner); `PER-03`, `PER-10` |
| **Acceptance Criteria** | 1. Given a record matched to a named or Strategic account, the designated owner is identified during routing.<br>2. Where precedence routes elsewhere, the reason is recorded and the record is visible as such.<br>3. Given a match in the review band rather than confident (`BR-008`), the record does not silently bypass named-account handling.<br>4. *(Conditional on `DEC-005`, `DEC-003`)* Designation source and precedence follow the approved decisions. |
| **Dependencies** | `BR-008`, `BR-030`, `BR-032` |
| **Related `DEC-###`** | `DEC-005`, `DEC-003` |
| **Future Implementation Component** | Routing precedence configuration; exception surfacing |
| **Test Requirement** | Named-account record routed correctly; named-account record routed away with reason; review-band match on a named account |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-032` — Every routing decision records why it was made

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-003` — **the defining defect of the environment** |
| **Business Problem** | When a record reaches a seller, nothing records why that seller was chosen, whether they were eligible, which rule applied, or what data drove it. This does not make outcomes wrong; it makes them **undiagnosable**. |
| **Requirement** | Revenue Operations must be able to determine why any record reached its owner — which precedence step applied, which rule matched, which inputs drove it, and whether the selected owner was eligible — **without inspecting system debug output**. |
| **Business Rationale** | Three compounding effects follow from the absence of this record: errors cannot be classified so they cannot be reduced systematically; users cannot self-serve so every question becomes an escalation to `PER-10` or `PER-13`; and **no dashboard can surface a routing reason that does not exist as data**. It is also directly measurable today — 7.3 points of the 18.6% reassignment rate are unclassifiable purely because this record does not exist. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-02`, `PER-11`, `PER-14` |
| **Acceptance Criteria** | 1. Given any routed record, a user with record access can determine the precedence step, the matched rule, and the driving inputs without administrator assistance.<br>2. The recorded reason is sufficient to reproduce the decision given the same inputs and configuration.<br>3. Given a record routed to an exception rather than an owner, the reason is equally determinable.<br>4. The reason is recorded at the moment of routing, not derived afterwards.<br>5. The reason is retained when the record is subsequently reassigned (`BR-036`). |
| **Dependencies** | `BR-030` |
| **Related `DEC-###`** | `DEC-018` (whether decisions persist beyond the current value) |
| **Future Implementation Component** | Routing reason and basis fields; optional routing decision history |
| **Test Requirement** | For every routing fixture in the domain, assert the recorded reason matches the decision actually taken; assert survival through reassignment |
| **Status** | `Proposed` — **Complete** |

> **This requirement is fully specifiable without any decision being made.** Whatever precedence
> `DEC-003` establishes, the obligation to record which step applied is unchanged. It is the single
> highest-value requirement that is not blocked, and the clearest expression of the project thesis:
> explainability is an operational data-capture requirement designed in at the point of decision,
> not a reporting feature added later.

---

### `BR-033` — No record remains unassigned without becoming a visible exception

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-006`; `B-11` (21% unassigned beyond 24 business hours) |
| **Business Problem** | 21% of records remain unassigned beyond 24 business hours. The process is bimodal: records satisfying the automated path move quickly while records requiring manual intervention wait far longer. Stalled records are invisible until someone notices. |
| **Requirement** | A record that cannot be assigned automatically must become a visible, owned exception within a defined period, rather than remaining silently unassigned. |
| **Business Rationale** | **Silence is the failure mode to design against.** A misrouted record is at least being worked and can be corrected; a stalled record consumes SLA clock while nobody is aware it exists. This also targets the correct population: improving the median would not help the records actually suffering, since the median conceals the bimodality. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-07`, `PER-09`, `PER-11` |
| **Acceptance Criteria** | 1. Given a record that cannot be assigned, it becomes a visible exception within a defined period.<br>2. The exception states why assignment failed (`BR-032`).<br>3. Unassigned records are never silently retried indefinitely without becoming visible.<br>4. Time unassigned is measurable, so P90 can be targeted rather than the median. |
| **Dependencies** | `BR-030`, `BR-032`, `BR-044` |
| **Related `DEC-###`** | `DEC-007` (fallback behaviour), `DEC-019` (who owns the exception) |
| **Future Implementation Component** | Scheduled evaluation; exception queue; unassigned-duration measurement |
| **Test Requirement** | Records failing assignment for each cause; assert exception creation within the defined period; assert duration measurability |
| **Status** | `Open Decision` — **Partially conditional** (the exception owner depends on `DEC-019`; visibility does not) |

---

### `BR-034` — Round-robin distribution is verifiable from recorded data

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-005`, `PROB-006` |
| **Business Problem** | SMB operates a global round robin across 11 AEs. `PER-06` depends entirely on its fairness, which is undefined. A seller who believes distribution is unfair cannot be answered with evidence. |
| **Requirement** | Round-robin distribution must be verifiable from recorded data, such that distribution across the pool over any period can be demonstrated rather than asserted, and pool membership must be governed configuration. |
| **Business Rationale** | Verifiability matters as much as the algorithm. Whichever mechanism `DEC-013` selects, a disputing seller must be answerable with evidence — otherwise the dispute is unresolvable and the workarounds that fragment the process continue. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-02` Sales Manager — SMB (owner); `PER-10`, `PER-06` |
| **Acceptance Criteria** | 1. Given a period, distribution across the pool is computable from recorded data.<br>2. Pool membership is governed configuration, changeable without deployment.<br>3. Given a skipped assignment, the skip and its reason are recorded.<br>4. *(Conditional on `DEC-013`)* The fairness definition and skip-redistribution behaviour follow the approved decision.<br>5. *(Conditional on `DEC-013`)* Any language or time-zone constraint on the pool for UK and German records is explicit rather than informal. |
| **Dependencies** | `BR-032`, `BR-035` |
| **Related `DEC-###`** | `DEC-013`, `DEC-007` |
| **Future Implementation Component** | Governed pool configuration; assignment sequence tracking |
| **Test Requirement** | Distribute a known volume across a pool including one unavailable member; assert distribution matches the approved definition and skips are recorded |
| **Status** | `Open Decision` — **Partially conditional** (criteria 4–5) |

---

### `BR-035` — Seller eligibility is evaluated and recorded before assignment

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-005`, `PROB-006` |
| **Business Problem** | Records route to sellers who may be inactive, on leave, at capacity, or no longer covering the territory. There is no defined behaviour for this case, so records stall. |
| **Requirement** | Before assigning a record, the selected owner's eligibility must be evaluated, and the evaluation outcome recorded, so that an assignment to an eligible seller is distinguishable from one that was never checked. |
| **Business Rationale** | This closes the gap between "a rule selected this seller" and "this seller can actually work this record" — the gap where the 21% unassigned population and the ownership churn both live. Recording the evaluation is what makes `DEC-007` tunable after implementation. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-02` (owner); `PER-10`, `PER-11` |
| **Acceptance Criteria** | 1. Given a selected owner, eligibility is evaluated before assignment completes.<br>2. The evaluation outcome is recorded and determinable at the record level.<br>3. Given an ineligible owner, the record does not assign to them silently.<br>4. *(Conditional on `DEC-007`)* The definition of eligibility and the fallback behaviour follow the approved decision.<br>5. *(Conditional on `DEC-007`)* Whether a held record retains or restarts its SLA clock is explicit. |
| **Dependencies** | `BR-030`, `BR-032`, `BR-033` |
| **Related `DEC-###`** | `DEC-007`, `DEC-013` |
| **Future Implementation Component** | Seller availability representation; eligibility evaluation in routing Flow |
| **Test Requirement** | Fixtures: inactive owner, unavailable owner, at-capacity owner, owner no longer covering territory |
| **Status** | `Open Decision` — **Partially conditional** (criteria 4–5) |

> ⚠️ **Measurement caution on criterion 5.** A restarted SLA clock makes attainment look better with
> no improvement in customer experience, and would corrupt `B-14`/`B-15` as a comparison basis. This
> must be decided deliberately, not chosen incidentally during implementation.

---

### `BR-036` — Reassignment captures a reason and preserves routing history

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-003`; `B-12` (11.3%), `B-13` (18.6%) |
| **Business Problem** | The reassignment rate is 18.6%, of which 11.3 points are identified corrections. The remaining **7.3 points cannot be classified** as error or legitimate movement, because no reason is recorded. The true routing error rate is unknown and unnarrowable. |
| **Requirement** | Every reassignment must capture a reason distinguishing correction from legitimate business movement, and must preserve the original routing decision. |
| **Business Rationale** | This directly converts an unmeasurable metric into a measurable one. Today the routing error rate is known only as a range between 11.3% and 18.6%; with reasons captured it becomes a single measurable figure — which is a prerequisite to targeting it. Preserving the original decision is what keeps `BR-032` meaningful after the first reassignment. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-02` Sales Manager (owner); `PER-10`, `PER-11`, `PER-14` |
| **Acceptance Criteria** | 1. Given a reassignment, a reason from a governed set is captured.<br>2. Reasons distinguish routing error from legitimate business movement.<br>3. The original routing decision remains determinable after reassignment.<br>4. Reassignment rate is measurable by reason, seller, and period. |
| **Dependencies** | `BR-032` |
| **Related `DEC-###`** | `DEC-018` (history persistence) |
| **Future Implementation Component** | Reassignment reason capture; routing history per `DEC-018` |
| **Test Requirement** | Reassign a routed record; assert reason capture, original decision preservation, and rate measurability |
| **Status** | `Open Decision` — **Partially conditional** (history mechanism depends on `DEC-018`) |

---

### `BR-037` — Routing rules are configuration, changeable without deployment

| Field | Detail |
|---|---|
| **Domain** | Revenue Routing Engine |
| **Related Problem/Finding** | `PROB-018`, `PROB-016`, `PROB-017` |
| **Business Problem** | Assignment logic was never designed for 30 AEs across four markets — it grew from a model that fitted three sellers. Rules embedded in automation require a deployment to change, and a single administrator at a 1:64 ratio cannot absorb that cycle for routine changes. |
| **Requirement** | Routing rules — precedence order, territory mappings, pool membership, and eligibility criteria — must be governed configuration that Revenue Operations can inspect and change without deploying code or Flow logic. |
| **Business Rationale** | This is the concrete expression of *metadata-driven rules before hard-coded decisions* and *optimize for administrator maintainability*. It is not a stylistic preference: at NorthstarIQ's administrator ratio, rules that require deployment will not be maintained, and the accumulation pattern that produced the current operational debt will recur. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` (owner); `PER-13` |
| **Acceptance Criteria** | 1. Precedence order, territory mappings, pool membership, and eligibility criteria are inspectable without examining automation logic.<br>2. Changing any of them requires no code or Flow deployment.<br>3. Configuration changes are source-controlled and reviewable (`BR-060`).<br>4. Configuration change capability is grantable independently of record access (`BR-054`). |
| **Dependencies** | **Requires:** `BR-059`. **Governs the rules of (downstream):** `BR-030`, `BR-034`, `BR-035` |
| **Related `DEC-###`** | `DEC-021` (who may change configuration) |
| **Future Implementation Component** | Custom Metadata Types for routing rules; Flow consuming configuration rather than embedding logic |
| **Test Requirement** | Change each configuration type without deployment; assert new records route per the changed rule |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4 depends on `DEC-021`) |

---

## 10. Revenue SLA Framework

> **Domain problem.** NorthstarIQ **cannot currently distinguish an SLA failure from a measurement
> failure.** The true breach rate lies between 39% and 66% and cannot be narrowed. Establishing
> trustworthy measurement is a deliverable in its own right, not an assumed precondition.

### `BR-038` — An agreed response commitment exists and is governed

| Field | Detail |
|---|---|
| **Domain** | Revenue SLA Framework |
| **Related Problem/Finding** | `PROB-007`; `B-15` (34% attainment against an **assumed** 4-hour expectation) |
| **Business Problem** | Whether NorthstarIQ ever formally agreed a response SLA is **unknown**. The 4-business-hour figure underlying the baseline is an Assumption. If no commitment exists, "66% breach rate" measures performance against a standard nobody committed to. |
| **Requirement** | A documented, human-approved response commitment must exist, with a named accountable owner, before response performance is reported as attainment or breach. |
| **Business Rationale** | **The measurement is not merely imprecise, it is currently ungrounded.** Reporting breach against an invented target is worse than not reporting it: it manufactures a performance problem that may not exist, and it would manufacture this project's own business case — the specific failure mode the discovery principles forbid. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-01` VP Sales with `PER-09` SDR/BDR Manager |
| **Acceptance Criteria** | 1. A documented commitment exists and is recorded as approved, or its absence is explicitly recorded.<br>2. The commitment names an accountable owner.<br>3. Any reported attainment figure states the commitment it was measured against.<br>4. *(Conditional on `DEC-006`)* The duration, and whether it varies by segment or channel, follow the approved decision. |
| **Dependencies** | `BR-039`, `BR-040` |
| **Related `DEC-###`** | `DEC-006` |
| **Future Implementation Component** | Governed SLA configuration; documented commitment |
| **Test Requirement** | Assert no attainment figure is computable or reportable without a recorded commitment |
| **Status** | `Open Decision` — **Blocked** (whether a commitment exists is the unmade `DEC-006` decision) |

---

### `BR-039` — Business hours and holiday calendars are governed configuration

| Field | Detail |
|---|---|
| **Domain** | Revenue SLA Framework |
| **Related Problem/Finding** | `PROB-007`; four markets, UTC−8 to UTC+1, four holiday calendars |
| **Business Problem** | US West Coast and Germany share roughly **one hour** of standard business day, and four distinct national holiday calendars apply. The same elapsed time yields different SLA outcomes depending on which calendar is applied, and no agreed definition exists. |
| **Requirement** | Business hours and holiday calendars must be governed configuration, and every SLA computation must state which calendar it applied. |
| **Business Rationale** | With one hour of overlap between the extremes, a single global expectation **cannot be measured consistently** — this is arithmetic, not opinion. Holiday calendars also change annually; a deployment-gated calendar will silently go stale and quietly corrupt every subsequent SLA figure. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-09`, `PER-13` |
| **Acceptance Criteria** | 1. Business hours and holidays are inspectable configuration, changeable without deployment.<br>2. Every SLA computation records which calendar was applied.<br>3. Given identical elapsed time under different calendars, the differing outcomes are explainable from recorded data.<br>4. *(Conditional on `DEC-006`)* Which calendar applies — record market, seller market, or a global standard — follows the approved decision. |
| **Dependencies** | `BR-038` |
| **Related `DEC-###`** | `DEC-006` |
| **Future Implementation Component** | Salesforce Business Hours and Holidays; governed SLA configuration referencing them |
| **Test Requirement** | Identical elapsed time across all four market calendars, including a holiday spanning a deadline |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4; the mechanism is specifiable now) |

---

### `BR-040` — First touch is defined and captured reliably

| Field | Detail |
|---|---|
| **Domain** | Revenue SLA Framework |
| **Related Problem/Finding** | `PROB-007`; `B-16` (27% with no logged first touch) |
| **Business Problem** | 27% of Leads have no logged first-touch activity at all, and whether they were untouched or touched without logging **cannot be determined**. "First touch" itself is undefined — automated email, attempted call, and connected conversation are not distinguished. |
| **Requirement** | First touch must have a single governed definition, and touches meeting that definition must be captured reliably enough that an absence of record means an absence of touch. |
| **Business Rationale** | **Fixing capture is a prerequisite to managing response performance**, not a refinement of it. Until an absent record reliably means an absent touch, every attainment figure conflates responsiveness with logging discipline, and no improvement claim on the metric can be defended. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-09` SDR/BDR Manager (owner); `PER-07`, `PER-10` |
| **Acceptance Criteria** | 1. A single governed first-touch definition exists with a named owner.<br>2. Touches meeting the definition are captured without depending on individual logging discipline, to the extent the platform allows.<br>3. Where capture cannot be guaranteed, the residual manual-dependency population is measurable and reported alongside attainment.<br>4. *(Conditional on `DEC-012`)* Whether automated outreach counts follows the approved definition. |
| **Dependencies** | `BR-038`; constrained by `TL-04` (activity capture capability unestablished) |
| **Related `DEC-###`** | `DEC-012` |
| **Future Implementation Component** | First-touch timestamp; activity-based capture; governed definition |
| **Test Requirement** | Fixtures per activity type either side of the definition; a record with no activity; a record touched outside the platform |
| **Status** | `Open Decision` — **Blocked** (the definition *is* the unmade `DEC-012` decision) |

> ⚠️ **Improvement-claim caution.** A definition counting automated email would show dramatic
> apparent improvement with **no change in human responsiveness**. Any future claim on this metric
> must state the definition in force and account for the possibility that improved logging, not
> improved responsiveness, produced the change.

---

### `BR-041` — SLA reporting distinguishes response failure from measurement failure

| Field | Detail |
|---|---|
| **Domain** | Revenue SLA Framework |
| **Related Problem/Finding** | `PROB-007`; true breach rate between 39% and 66% |
| **Business Problem** | Records with no logged touch are counted as breaches, but may have been touched without logging. Attainment therefore conflates two different failures with different remedies — one is a coaching problem, the other a tooling problem. |
| **Requirement** | SLA reporting must separate records that demonstrably breached from records whose outcome cannot be determined, and must never present the combined figure as a single attainment number without qualification. |
| **Business Rationale** | The two populations require opposite interventions. Reporting them as one number produces the wrong intervention for whichever share dominates, and — because the split is invisible — nobody can tell which. Separating them narrows the 39–66% range that is currently unnarrowable. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-14` Data / BI Analyst (owner); `PER-09`, `PER-10` |
| **Acceptance Criteria** | 1. Attained, breached, and indeterminate populations are separately reportable.<br>2. Any single attainment figure states its treatment of the indeterminate population.<br>3. The indeterminate population size is reported alongside attainment.<br>4. As capture improves (`BR-040`), the shrinking indeterminate population is visible as a distinct trend from attainment change. |
| **Dependencies** | `BR-040`; `KPI-010`–`KPI-012` |
| **Related `DEC-###`** | `DEC-012`, `DEC-006` |
| **Future Implementation Component** | Governed KPI definitions; Revenue Intelligence Model measures |
| **Test Requirement** | Fixture population with known attained, breached, and untouched records; assert three-way separation and hand-computed rates |
| **Status** | `Open Decision` — **Partially conditional** (population definitions depend on `DEC-012`) |

---

### `BR-042` — The response deadline is visible to the assigned owner

| Field | Detail |
|---|---|
| **Domain** | Revenue SLA Framework |
| **Related Problem/Finding** | `PROB-007`, `PROB-006` |
| **Business Problem** | A seller cannot meet a commitment they cannot see. Response expectations exist as management reporting rather than as information available at the point of work. |
| **Requirement** | Where a record carries a response commitment, the deadline and remaining time must be visible to the assigned owner at the point of work. |
| **Business Rationale** | Measuring a commitment that was never communicated to the person expected to meet it produces a metric about the system, not about performance. This is the cheapest available intervention on `B-14` and the one most likely to move it. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-09` (owner); `PER-07`, `PER-06` |
| **Acceptance Criteria** | 1. Given an assigned record with a commitment, the deadline is visible to the owner.<br>2. The deadline reflects the applicable business hours and holiday calendar (`BR-039`).<br>3. Given a reassignment, deadline behaviour is defined and visible.<br>4. *(Conditional on `DEC-006`)* The commitment duration follows the approved decision. |
| **Dependencies** | `BR-038`, `BR-039` |
| **Related `DEC-###`** | `DEC-006`, `DEC-007` (whether a held record's clock restarts) |
| **Future Implementation Component** | SLA deadline field; page layout and list view surfacing |
| **Test Requirement** | Assert deadline correctness across market calendars and across a reassignment |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-043` — Breaches are visible to an accountable owner

| Field | Detail |
|---|---|
| **Domain** | Revenue SLA Framework |
| **Related Problem/Finding** | `PROB-007`, `PROB-012` |
| **Business Problem** | A breach that nobody is accountable for is a statistic rather than an event. Breaches currently surface only in aggregate reporting, after the response window has already closed. |
| **Requirement** | An imminent or actual breach must become visible to an accountable owner in time for the outcome to be affected or the cause to be recorded. |
| **Business Rationale** | Aggregate reporting after the fact supports analysis but not intervention. This is the SLA instance of the general exception principle: detection has value only if it reaches someone who can act while acting is still possible. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-09` (owner); `PER-02`, `PER-11` |
| **Acceptance Criteria** | 1. Given an imminent or actual breach, it is visible to an accountable owner.<br>2. Breach visibility does not depend on someone running a report.<br>3. Breach volume is measurable by owner, segment, and period.<br>4. *(Conditional on `DEC-019`, `DEC-006`)* The accountable owner and the notification threshold follow the approved decisions. |
| **Dependencies** | `BR-038`, `BR-042`, `BR-044` |
| **Related `DEC-###`** | `DEC-019`, `DEC-006` |
| **Future Implementation Component** | Scheduled evaluation; exception surfacing; breach state |
| **Test Requirement** | Fixtures either side of the breach threshold; assert visibility without report execution |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

## 11. Revenue Operations Exception Framework

> **Domain problem — a self-perpetuating mechanism.** Because remediation effort is absorbed into
> normal work, its cost is invisible. Because the cost is invisible, no business case for a
> structural fix is ever built. Because no fix is made, the manual work continues indefinitely.
> **Making the volume visible is therefore the primary requirement.**

### `BR-044` — Operational exceptions are detected, classified, and measured

| Field | Detail |
|---|---|
| **Domain** | Revenue Operations Exception Framework |
| **Related Problem/Finding** | `PROB-012` |
| **Business Problem** | Unassigned records, duplicates, failed automation, and ownership disputes are handled ad hoc by whoever notices them. There is no classification, ownership, queue, or measurement. Exception volume is not currently captured anywhere — **its invisibility is the finding.** |
| **Requirement** | Operational exceptions must be detected, classified against a governed set of exception types, and measurable by type, age, and volume. |
| **Business Rationale** | **Measurement can and should precede ownership.** Measuring first produces the evidence needed to allocate ownership sensibly and to build the business case that the current invisibility prevents. This is why detection is `P0` while ownership (`BR-046`) is `P1` — the sequence is deliberate. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-10` Revenue Operations (owner); `PER-11`, `PER-13` |
| **Acceptance Criteria** | 1. A governed exception type set exists covering at minimum: unassigned record, unsegmentable record, unresolved territory, duplicate requiring review, match requiring review, ineligible owner, SLA breach, and automation failure.<br>2. Given a qualifying condition, an exception is raised and classified.<br>3. Exception volume is measurable by type, age, and period.<br>4. Exceptions are visible without someone running a report. |
| **Dependencies** | **Requires:** none. **Consumed by (downstream):** `BR-010`, `BR-026`, `BR-033`, `BR-043`, `BR-045` |
| **Related `DEC-###`** | `DEC-019` (ownership, which this does not require) |
| **Future Implementation Component** | Exception representation; governed type configuration; queues; list views |
| **Test Requirement** | Trigger one fixture per exception type; assert classification and measurability |
| **Status** | `Proposed` — **Complete** |

---

### `BR-045` — Automation failure is observable

| Field | Detail |
|---|---|
| **Domain** | Revenue Operations Exception Framework |
| **Related Problem/Finding** | `PROB-012`, `PROB-016`; principle *automation requires observability* |
| **Business Problem** | When automation fails, the record simply does not progress. Failure is indistinguishable from a record legitimately awaiting action, so failures accumulate undetected. |
| **Requirement** | Failure of any governed automation must produce an observable, classified exception rather than a silent absence of effect. |
| **Business Rationale** | Silent automation failure is the mechanism by which the 21% unassigned population plausibly persists. It is also the failure mode most likely to cause a later regression to go undetected (`PROB-016`), because a broken rule and an unused rule look identical from outside. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-13` Salesforce Administrator (owner); `PER-10` |
| **Acceptance Criteria** | 1. Given an automation failure, an exception is raised identifying the automation and the record.<br>2. Failure is distinguishable from a record legitimately awaiting action.<br>3. Failure volume is measurable by automation and period.<br>4. A failure never leaves a record in a partially processed state without that state being visible. |
| **Dependencies** | `BR-044` |
| **Related `DEC-###`** | `DEC-019` |
| **Future Implementation Component** | Fault paths in every governed Flow; exception surfacing |
| **Test Requirement** | Force a failure in each governed automation; assert exception creation and record-state visibility |
| **Status** | `Proposed` — **Complete** |

---

### `BR-046` — Every exception class has an accountable owner

| Field | Detail |
|---|---|
| **Domain** | Revenue Operations Exception Framework |
| **Related Problem/Finding** | `PROB-012`; principle *exceptions require ownership* |
| **Business Problem** | Exceptions are resolved by whoever notices them. Unowned work is done inconsistently, invisibly, and by whoever has least capacity to refuse it — currently `PER-11`. |
| **Requirement** | Each governed exception class must have a documented accountable owner and a defined expected response, so that an unresolved exception is attributable. |
| **Business Rationale** | Detection without ownership produces a visible backlog nobody is responsible for — which decays into the same invisibility, with the added cost of a queue nobody works. Ownership is what converts detection into resolution. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-10` (owner); `PER-11`, `PER-13` |
| **Acceptance Criteria** | 1. Each exception class has a documented accountable owner.<br>2. Given an exception, the responsible party is determinable from the record.<br>3. Unresolved exceptions are attributable by owner and age.<br>4. *(Conditional on `DEC-019`)* The ownership assignment follows the approved model. |
| **Dependencies** | `BR-044` |
| **Related `DEC-###`** | `DEC-019` |
| **Future Implementation Component** | Queue assignment per exception class; ownership configuration |
| **Test Requirement** | Assert each exception type routes to its documented owner |
| **Status** | `Open Decision` — **Blocked** (ownership assignment is the unmade `DEC-019` decision) |

---

### `BR-047` — Exception resolution is recorded

| Field | Detail |
|---|---|
| **Domain** | Revenue Operations Exception Framework |
| **Related Problem/Finding** | `PROB-012`, `PROB-015` |
| **Business Problem** | Even where exceptions are handled, nothing records what was done or why, so recurring causes cannot be identified and the same exception recurs indefinitely. |
| **Requirement** | Exception resolution must record what action was taken and the underlying cause, so that recurring causes are identifiable and reducible. |
| **Business Rationale** | This is what converts exception handling from perpetual remediation into a reduction programme. Without cause data, the volume can be measured but never explained — the exception-framework instance of `PROB-015`. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-11` Sales Operations (owner); `PER-10`, `PER-14` |
| **Acceptance Criteria** | 1. Given a resolved exception, the action taken and the resolving party are determinable.<br>2. A cause from a governed set is recorded.<br>3. Recurring causes are identifiable by frequency across a period.<br>4. Time to resolution is measurable by class and owner. |
| **Dependencies** | `BR-044`, `BR-046` |
| **Related `DEC-###`** | `DEC-019`, `DEC-018` |
| **Future Implementation Component** | Resolution and cause capture; governed cause configuration |
| **Test Requirement** | Resolve one fixture per exception class; assert cause capture and frequency measurability |
| **Status** | `Open Decision` — **Partially conditional** (cause taxonomy depends on `DEC-019`) |

---

## 12. Revenue Intelligence Model

> **Domain problem.** The analytics gap is **not an analytics problem**. Because routing, match, and
> lifecycle decisions leave no explanatory record, no analytics layer can reconstruct them. Root-cause
> capability must be designed into the operational layer at the point of decision.

### `BR-048` — KPI definitions are governed with a single owner each

| Field | Detail |
|---|---|
| **Domain** | Revenue Intelligence Model |
| **Related Problem/Finding** | `PROB-014` |
| **Business Problem** | Reports built per-request over several years answer the same question differently. Filter logic embedded in individual reports encodes implicit definitions that were never compared. Meetings begin by reconciling numbers rather than acting on them. |
| **Requirement** | Every KPI used in management or executive reporting must have one governed definition — numerator, denominator, grain, filters, and exclusions — with a single named owner, held under version control. |
| **Business Rationale** | The dispute is definitional, not computational. Multiple correct calculations of differently defined metrics will disagree forever. Governance is the only remedy, and it must live in version control rather than in report configuration, where it is invisible and uncomparable. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-14` Data / BI Analyst (owner); `PER-10`, `PER-01`, `PER-16` |
| **Acceptance Criteria** | 1. Each governed KPI has a documented definition stating numerator, denominator, grain, filters, and exclusions.<br>2. Each has one named owner.<br>3. Definitions are version-controlled and changes are reviewable.<br>4. Any reported figure is attributable to the definition version that produced it. |
| **Dependencies** | [`../governance/kpi-governance.md`](../governance/kpi-governance.md) |
| **Related `DEC-###`** | `DEC-016` |
| **Future Implementation Component** | KPI governance document; Revenue Intelligence Model measures implementing definitions |
| **Test Requirement** | Reconcile each KPI against a known fixture population with hand-computed expected values |
| **Status** | `Proposed` — **Complete** |

---

### `BR-049` — Operational decision data is available to the analytics layer

| Field | Detail |
|---|---|
| **Domain** | Revenue Intelligence Model |
| **Related Problem/Finding** | `PROB-015` — **the clearest demonstration of the project thesis** |
| **Business Problem** | When conversion falls, leadership cannot determine whether the cause was lead quality, routing delay, SLA failure, segmentation error, or seasonality. Reporting is descriptive because the causes were never recorded as data. |
| **Requirement** | The reasons recorded at the point of operational decisions — match basis, fit basis, segment basis, territory basis, routing reason, reassignment reason, exception cause — must be available to the analytics layer as analysable data. |
| **Business Rationale** | **No dashboard can surface a routing reason that does not exist as data.** This requirement carries no analytical logic of its own; it exists to make explicit that the value of `BR-009`, `BR-015`, `BR-027`, `BR-032`, `BR-036`, and `BR-047` is only realised if that data reaches analytics. Capturing reasons that analytics cannot read would satisfy the letter of those requirements and none of their purpose. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-14` (owner); `PER-10`, `PER-01`, `PER-16` |
| **Acceptance Criteria** | 1. Each recorded decision basis is available to the analytics layer.<br>2. Metric movement is attributable to operational causes rather than described only as a trend.<br>3. Bases remain analysable at the grain they were recorded.<br>4. *(Conditional on `DEC-018`, `DEC-020`)* Retention and access follow the approved persistence and data-access architecture. |
| **Dependencies** | **Requires (all of):** `BR-009`, `BR-015`, `BR-027`, `BR-032`, `BR-036`, `BR-047` |
| **Related `DEC-###`** | `DEC-018`, `DEC-020`, `DEC-016` |
| **Future Implementation Component** | Revenue Intelligence Model dimensions over decision-basis data |
| **Test Requirement** | Assert every decision-basis attribute is reachable by the analytics layer at recorded grain |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-050` — Measurement windows are segment-appropriate

| Field | Detail |
|---|---|
| **Domain** | Revenue Intelligence Model |
| **Related Problem/Finding** | `PROB-014` structural insight |
| **Business Problem** | Sales cycles range from 21 to 210 days. Any blended conversion metric measured over a window shorter than roughly seven months systematically under-represents Enterprise and Strategic. **Some disputed numbers are correct but misinterpreted, not wrong.** |
| **Requirement** | Conversion and funnel metrics must use measurement windows appropriate to the segment being measured, and any blended figure must state the window and its limitation. |
| **Business Rationale** | This is a measurement defect **independent of definitions**, and governance that addressed only definitions would leave it in place. Without it, Enterprise performance appears worse than it is purely as an artefact of the window — a conclusion that survives even perfectly governed definitions. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-14` (owner); `PER-01`, `PER-15` |
| **Acceptance Criteria** | 1. Each segment-level conversion metric declares a measurement window at least as long as that segment's documented typical cycle length, and the declared window is stored with the metric definition.<br>2. Any blended figure states the window applied and names the segments it under-represents at that window.<br>3. Cohort-based measurement is available for every conversion metric, so a cohort not yet through its cycle is excluded rather than counted as a non-conversion.<br>4. *(Conditional on `DEC-016`)* Available history bounds the longest supportable window, and that bound is documented. |
| **Dependencies** | `BR-022`, `BR-048` |
| **Related `DEC-###`** | `DEC-016` |
| **Future Implementation Component** | KPI definitions specifying windows; cohort measures |
| **Test Requirement** | Compute a blended and a segment-appropriate rate over the same fixture population; assert the documented difference |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-051` — Analytics reconciles to the Salesforce source of truth

| Field | Detail |
|---|---|
| **Domain** | Revenue Intelligence Model |
| **Related Problem/Finding** | `PROB-014` |
| **Business Problem** | Where analytics and Salesforce disagree, users trust neither and revert to private spreadsheets — fragmenting the truth further and creating a third set of numbers. |
| **Requirement** | Analytics figures must be reconcilable to their Salesforce source, and any expected divergence — timing, exclusions, or transformation — must be documented and quantifiable. |
| **Business Rationale** | Reconciliation is what makes analytics trustworthy. Some divergence is legitimate and expected; **undocumented divergence is indistinguishable from error**, and one unexplained discrepancy discredits the whole layer. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-14` (owner); `PER-10`, `PER-13` |
| **Acceptance Criteria** | 1. For each governed KPI, a reconciliation to Salesforce source data is documented.<br>2. Expected divergences are documented with their causes.<br>3. Unexplained divergence is detectable rather than absorbed.<br>4. *(Conditional on `DEC-020`)* Refresh timing effects on reconciliation are documented. |
| **Dependencies** | `BR-048` |
| **Related `DEC-###`** | `DEC-020` |
| **Future Implementation Component** | Reconciliation procedure; SOQL validation queries |
| **Test Requirement** | Reconcile each KPI against a SOQL result over the same population; assert either equality or a documented divergence |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-052` — Analytics access is a scoped, governed principal

| Field | Detail |
|---|---|
| **Domain** | Revenue Intelligence Model |
| **Related Problem/Finding** | `PROB-013`; `PER-17` |
| **Business Problem** | Whatever identity Power BI connects under has read access to revenue data. This is exactly the access most often over-granted for convenience and least often reviewed afterwards. |
| **Requirement** | The identity used for analytics data access must be scoped to the objects and fields analytics requires, must not be administrator-equivalent, and its scope must be documented and reviewable. |
| **Business Rationale** | `PER-14` requires **broad read and no operational write** — a genuine least-privilege opportunity that a convenience grant would waste. Treating the analytics connection as a first-class principal from design onward avoids the pattern `PER-17` exists to prevent. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-13` (owner); `PER-14`, `PER-10` |
| **Acceptance Criteria** | 1. The analytics identity has no write access to operational objects.<br>2. Its object and field scope is documented.<br>3. It is not administrator-equivalent.<br>4. Field access to PII-classified fields is separately justified (`BR-056`).<br>5. *(Conditional on `DEC-020`, `DEC-021`)* The identity and connection method follow the approved architecture. |
| **Dependencies** | `BR-053`, `BR-055`, `BR-056` |
| **Related `DEC-###`** | `DEC-020`, `DEC-021` |
| **Future Implementation Component** | Dedicated integration principal; Permission Set scoping read access |
| **Test Requirement** | Assert the analytics identity cannot write to operational objects and cannot read unjustified PII fields |
| **Status** | `Open Decision` — **Partially conditional** (criterion 5) |

---

## 13. Security & Access

> **Domain problem.** Whether current access is appropriate is **unknown — nothing has been
> inspected.** This project asserts no security defect. What can be stated is a governance
> observation: security is currently treated as a configuration task rather than a governed
> workstream.

### `BR-053` — Access is designed on least privilege and documented per persona

| Field | Detail |
|---|---|
| **Domain** | Security & Access |
| **Related Problem/Finding** | `PROB-013` |
| **Business Problem** | No documented access model exists, so access questions are answered by inspection and access grants accumulate without review. Security has not been treated as a governed workstream. |
| **Requirement** | A documented access model must exist stating, for each persona, what access is granted and the business justification for it, designed on the principle of least privilege. |
| **Business Rationale** | The documentation is the control. Undocumented access cannot be reviewed, and grants that nobody can justify are never revoked — which is how over-provisioning accumulates without any individual decision causing it. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-13` Salesforce Administrator (owner); `PER-10` |
| **Acceptance Criteria** | 1. For each persona, granted access is documented with a business justification.<br>2. Access not justified by a documented need is not granted.<br>3. The model is version-controlled and reviewable.<br>4. *(Conditional on `DEC-021`)* OWD, role hierarchy, and sharing design follow the approved model. |
| **Dependencies** | [`personas.md`](personas.md); [`../security/access-model.md`](../security/access-model.md) |
| **Related `DEC-###`** | `DEC-021` |
| **Future Implementation Component** | Access model document; OWD, role hierarchy, Permission Sets, sharing rules |
| **Test Requirement** | Per-persona access verification (`BR-057`) |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

---

### `BR-054` — Every granted capability is individually visible, grantable, and revocable

| Field | Detail |
|---|---|
| **Domain** | Security & Access |
| **Related Problem/Finding** | `PROB-013`, `PROB-018` |
| **Business Problem** | Profile-based permission management makes over-provisioning invisible and per-user assembly unmaintainable at a 1:64 administrator ratio. |
| **Requirement** | Every business capability granted to a persona must be individually visible, individually grantable, and individually revocable, so that over-provisioning is detectable and any grant can be withdrawn without disturbing unrelated access. |
| **Business Rationale** | Four reinforcing reasons: `PER-13` capacity makes per-user assembly infeasible; additive grants make over-provisioning **visible** where Profile grants hide it; Permission Sets are source-controllable and reviewable, supporting `PROB-016`; and inspectable grants serve the explainability theme. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. For any user, the capabilities held and the source of each are determinable.<br>2. Any single capability can be withdrawn without altering unrelated access.<br>3. Capability grants are source-controlled and reviewable as a diff.<br>4. Adding a capability for one persona does not implicitly grant it to another.<br>5. *(Conditional on `DEC-021`)* The granting mechanism follows the approved access model. |
| **Dependencies** | `BR-053` |
| **Related `DEC-###`** | `DEC-021` |
| **Future Implementation Component** | Permission Sets per capability, composed into Permission Set Groups per persona where justified, with Profiles carrying only the minimum — **the recommended means, pending `DEC-021`** |
| **Test Requirement** | Assert a persona lacking a capability grant cannot perform it and gains it on assignment; assert withdrawal does not disturb unrelated access |
| **Status** | `Open Decision` — **Partially conditional** (criterion 5) |

> ⚠️ **The repository `.forceignore` already reflects a permission-set-first posture. That is a
> repository convention, not approval of `DEC-021`.** Conflating a convention with an approved access
> model would be exactly the silent decision the decision register exists to prevent.

---

### `BR-055` — Integration access is scoped and never administrator-equivalent

| Field | Detail |
|---|---|
| **Domain** | Security & Access |
| **Related Problem/Finding** | `PROB-013`; `PER-17` finding |
| **Business Problem** | Integration access is commonly granted by assigning an administrator profile when an integration is needed, and that grant is rarely reviewed or removed. |
| **Requirement** | Each integration principal must have access scoped to exactly the objects, fields, and operations its integration requires, must never be administrator-equivalent, and its actions must be attributable. |
| **Business Rationale** | `PER-17` is a first-class principal, not a deployment convenience. Least privilege applies with no seniority argument available to erode it, which makes integration access the cleanest place to demonstrate the principle — and the most damaging place to abandon it. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. Each integration principal has documented object, field, and operation scope.<br>2. No integration principal holds administrator-equivalent access.<br>3. Actions performed by an integration principal are attributable to it.<br>4. Scope changes follow the change path (`BR-060`).<br>5. *(Conditional on `DEC-021`)* Whether one principal or several role-specific ones are used follows the approved model. |
| **Dependencies** | **Requires:** `BR-053`. **Informs:** `BR-054` — scoping is achievable under any granting mechanism |
| **Related `DEC-###`** | `DEC-021`, `DEC-020` |
| **Future Implementation Component** | Dedicated integration Users; scoped Permission Sets |
| **Test Requirement** | Assert each integration principal can perform its required operations and cannot perform any other |
| **Status** | `Open Decision` — **Partially conditional** (criterion 5) |

---

### `BR-056` — Field access to PII-classified data is separately justified

| Field | Detail |
|---|---|
| **Domain** | Security & Access |
| **Related Problem/Finding** | `PROB-013`; UK and EU GDPR applicability (Assumption) |
| **Business Problem** | Field-level access is typically inherited with object access rather than justified individually. Whether German-market records carry data-handling obligations constraining field access or retention **has not been assessed**. |
| **Requirement** | Fields classified as PII must have access justified per persona rather than inherited with object access, and the classification must be documented in the data dictionary. |
| **Business Rationale** | Field-level access is where least privilege is most often abandoned and most cheaply preserved. `PER-14` needs broad read but almost certainly not personal contact detail — a straightforward reduction that inheritance would silently forgo. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-13` (owner); `PER-10`, `PER-14` |
| **Acceptance Criteria** | 1. Every field is PII-classified in the data dictionary.<br>2. Access to PII-classified fields is justified per persona.<br>3. Personas without justification do not have access.<br>4. *(Conditional on `DEC-021`)* FLS design follows the approved access model. |
| **Dependencies** | [`../data-dictionary/data-dictionary.md`](../data-dictionary/data-dictionary.md); `BR-053` |
| **Related `DEC-###`** | `DEC-021` |
| **Future Implementation Component** | Field-Level Security via Permission Sets; PII classification in the data dictionary |
| **Test Requirement** | Assert each persona's PII field visibility matches documented justification |
| **Status** | `Open Decision` — **Partially conditional** (criterion 4) |

> **Scope note.** All portfolio data is synthetic, so GDPR applicability is a design consideration in
> the **Enterprise Design** column only. No real personal data exists or will exist in this
> repository.

---

### `BR-057` — The access model is tested

| Field | Detail |
|---|---|
| **Domain** | Security & Access |
| **Related Problem/Finding** | `PROB-013`; principle *business rules require tests* |
| **Business Problem** | Access is typically verified by inspecting configuration rather than by testing behaviour. Configuration that looks correct can behave incorrectly, particularly where sharing rules, role hierarchy, and OWD interact. |
| **Requirement** | The access model must be verified by testing actual behaviour per persona — both that intended access works and that unintended access is denied. |
| **Business Rationale** | **The negative test is the one that matters and the one usually omitted.** Confirming a persona can see what they should proves little; confirming they cannot see what they should not is the actual security assertion. Sharing interactions are also the least predictable part of Salesforce configuration from inspection alone. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. For each persona, intended access is verified by executed test.<br>2. For each persona, at least one unintended access is verified as denied.<br>3. Integration principal scope is verified in both directions.<br>4. Results are recorded with `Actual Result` populated by an actual run. |
| **Dependencies** | **Requires:** `BR-053`. **Informs:** `BR-054`–`BR-056` — each adds scope to the matrix but none gates testing |
| **Related `DEC-###`** | `DEC-021` |
| **Future Implementation Component** | Security test matrix; SOQL verification as each persona |
| **Test Requirement** | This requirement **is** a test obligation; evidence is the populated matrix |
| **Status** | `Open Decision` — **Partially conditional** (the model under test depends on `DEC-021`) |

---

### `BR-058` — Access changes follow the governed change path

| Field | Detail |
|---|---|
| **Domain** | Security & Access |
| **Related Problem/Finding** | `PROB-013`, `PROB-016` |
| **Business Problem** | Access changes are typically made directly in response to a request, without review, record, or subsequent verification — which is how undocumented grants accumulate. |
| **Requirement** | Changes to the access model must follow the same governed change path as any other change, including review, source control, and post-change verification. |
| **Business Rationale** | Access is the change type most often exempted from governance, on urgency grounds, and the one where an unreviewed change carries the highest consequence. Exempting it recreates `PROB-016` in the security domain specifically. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. Access changes are source-controlled and reviewable.<br>2. Access changes are verified after deployment (`BR-057`).<br>3. The business justification is recorded with the change.<br>4. Emergency access changes are permitted but retrospectively reviewed within a defined period. |
| **Dependencies** | `BR-053`, `BR-057`, `BR-060` |
| **Related `DEC-###`** | `DEC-021` |
| **Future Implementation Component** | Permission Set metadata in source control; change process |
| **Test Requirement** | Verify a source-controlled access change deploys and verifies as expected |
| **Status** | `Open Decision` — **Partially conditional** (the model under change depends on `DEC-021`) |

---

## 14. Administration & Change Management

> **Domain problem.** **Weak change management is what allowed the operational debt to accumulate in
> the first place.** Fixing routing without fixing change management would guarantee the same
> accumulation recurs.

### `BR-059` — Governed business rules are metadata-driven

| Field | Detail |
|---|---|
| **Domain** | Administration & Change Management |
| **Related Problem/Finding** | `PROB-017`, `PROB-018`, `PROB-016` |
| **Business Problem** | Business rules exist only as institutional knowledge and as behaviour embedded in automation. A single administrator supports 64 revenue users across ~9 years of accumulated configuration. Rules that require a deployment to change are not changed. |
| **Requirement** | Configurable business rules — thresholds, mappings, precedence, taxonomies, calendars, and pool membership — must be represented as inspectable configuration data rather than embedded in automation logic. |
| **Business Rationale** | This is the structural remedy for the accumulation mechanism. Each growth phase added behaviour that nobody consolidated, because consolidating embedded logic is expensive and risky. Configuration data is inspectable, diffable, reviewable, and changeable without regression risk to unrelated logic. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. Configurable rules are inspectable without examining automation logic.<br>2. Rule changes require no code or Flow deployment.<br>3. Rule configuration is source-controlled and diffable.<br>4. Automation consumes configuration rather than embedding rule values. |
| **Dependencies** | **Requires:** none. **Realised by (downstream):** `BR-025`, `BR-029`, `BR-037`, `BR-039` |
| **Related `DEC-###`** | None — the principle does not depend on any specific rule value |
| **Future Implementation Component** | Custom Metadata Types; Flows reading configuration |
| **Test Requirement** | For each governed rule type, change configuration without deployment and assert behaviour changes |
| **Status** | `Proposed` — **Complete** |

---

### `BR-060` — A defined change path with regression safety exists

| Field | Detail |
|---|---|
| **Domain** | Administration & Change Management |
| **Related Problem/Finding** | `PROB-016` — **root-cause significance** |
| **Business Problem** | No consistent path exists from requirement through design, review, testing, deployment, and verification. Whether metadata is source-controlled or a sandbox is used has not been confirmed. Every change carries unquantified regression risk. |
| **Requirement** | A documented change path must exist covering requirement, design, review, source control, testing, approval, deployment, and post-deployment verification, and changes to governed behaviour must follow it. |
| **Business Rationale** | **This is the requirement that prevents the project's own work from becoming the next generation of operational debt.** Fixing routing without fixing change management would guarantee recurrence. It must be addressed structurally, not deferred as administrative overhead. |
| **Priority** | **P0** |
| **Persona / Owner** | `PER-13` (owner); `PER-10`, `PER-11` |
| **Acceptance Criteria** | 1. A documented change path exists covering all named stages.<br>2. Governed behaviour changes are source-controlled.<br>3. Changes are tested before deployment and verified after.<br>4. The path defines what constitutes approval and who may give it. |
| **Dependencies** | [`../governance/change-management.md`](../governance/change-management.md) |
| **Related `DEC-###`** | None |
| **Future Implementation Component** | Change management process; Git workflow; deployment procedure |
| **Test Requirement** | Execute the path for one representative change and record evidence at each stage |
| **Status** | `Proposed` — **Complete** |

---

### `BR-061` — Intended behaviour is documented as part of the change

| Field | Detail |
|---|---|
| **Domain** | Administration & Change Management |
| **Related Problem/Finding** | `PROB-017` |
| **Business Problem** | Business rules, automation behaviour, territory definitions, and metric definitions exist primarily in people's heads. Onboarding is slow; change is risky because intended behaviour is unknown; knowledge leaves with people. |
| **Requirement** | Documentation of intended behaviour must be produced as part of the change that creates or alters it, not as a separate subsequent activity. |
| **Business Rationale** | **Documentation quality is a consequence of change-management design, not an independent virtue.** Documentation produced separately from work always drifts, because the incentive to update it disappears once the work is done. Making it part of the change is the only durable mechanism. |
| **Priority** | P1 |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. A change to governed behaviour is not complete until its documentation is updated.<br>2. Every governed automation states the `BR-###` it implements.<br>3. Documentation is version-controlled alongside the change.<br>4. Intended behaviour is determinable from documentation without reading automation logic. |
| **Dependencies** | `BR-060` |
| **Related `DEC-###`** | None |
| **Future Implementation Component** | Flow descriptions citing requirements; documentation in the change path |
| **Test Requirement** | Assert every governed automation cites a requirement and has current documentation |
| **Status** | `Proposed` — **Complete** |

---

### `BR-062` — Rollback capability exists for governed changes

| Field | Detail |
|---|---|
| **Domain** | Administration & Change Management |
| **Related Problem/Finding** | `PROB-016`, `PROB-018` |
| **Business Problem** | With unquantified regression risk on every change and a single administrator, a failed change has no defined recovery path beyond manual reconstruction under pressure. |
| **Requirement** | For governed changes, a defined rollback path must exist and be known before deployment, so recovery does not depend on reconstruction after failure. |
| **Business Rationale** | Rollback capability is what makes change safe enough to be frequent. Without it, the rational response to risk is to change less — which is precisely how configuration ossifies and debt accumulates. This is the operational counterpart to `BR-060`. |
| **Priority** | P2 |
| **Persona / Owner** | `PER-13` (owner); `PER-10` |
| **Acceptance Criteria** | 1. For each governed change type, a rollback path is documented.<br>2. The rollback path is known before deployment, not devised after failure.<br>3. Configuration changes are revertible from source control.<br>4. Where rollback is not possible, that fact is stated before deployment and the change is treated accordingly. |
| **Dependencies** | `BR-059`, `BR-060` |
| **Related `DEC-###`** | None |
| **Future Implementation Component** | Rollback procedures; source-controlled configuration |
| **Test Requirement** | Execute rollback for one representative configuration change; assert prior behaviour is restored |
| **Status** | `Proposed` — **Complete** |

---

## 15. Register Integrity Rules

1. **No requirement may be marked `Approved` while it cites an unresolved `DEC-###`.** Approving a
   requirement whose acceptance criteria are conditional would approve criteria that do not yet exist.
2. **Requirements state outcomes.** A requirement naming a field, Flow, or Permission Set as the
   requirement itself is defective and must be rewritten.
3. **"Future Implementation Component" is a candidate, not a commitment.** It establishes feasibility
   and rough cost. Phase 0D may select differently without changing the requirement.
4. **Identifiers are immutable.** A withdrawn requirement keeps its identifier and is marked
   `Withdrawn`; the identifier is permanently retired.
5. **Every requirement traces to a Phase 0B problem or finding.** A requirement with no upstream
   problem is either solving something undiscovered — which must be recorded in discovery first — or
   is unnecessary.
6. **Acceptance criteria must be testable.** A criterion that cannot fail is not a criterion.
7. **Conditional criteria are marked *(Conditional on `DEC-###`)*** so that the specified and
   unspecified portions of a requirement remain visibly separate.
