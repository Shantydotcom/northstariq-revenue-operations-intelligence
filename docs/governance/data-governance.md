# Data Governance

| Field | Value |
|---|---|
| **Document** | Data Governance |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Implementation State** | Target State |
| **Related** | `BR-001`–`BR-013`, `BR-056` · [`../data-dictionary/data-dictionary.md`](../data-dictionary/data-dictionary.md) · [`kpi-governance.md`](kpi-governance.md) · [`../security/access-model.md`](../security/access-model.md) |

---

> **Scope discipline.** This document governs data **within the boundary this project controls**:
> Salesforce Sales Cloud and the Revenue Intelligence Model. Where a capability lies outside that
> boundary and no system has been identified, it is recorded as unestablished. **No external system
> is invented.**

---

## 1. Source-of-Truth Principles

| Principle | Statement |
|---|---|
| **1. Single source per concept** | Every business concept has exactly one authoritative home. Where a value appears elsewhere, it is documented as derived or replicated, never as a second original. |
| **2. Source of truth is named, not assumed** | For each concept, the authoritative system is documented. "Probably Salesforce" is not a source-of-truth statement. |
| **3. Analytics is never a source of truth** | Power BI reads; it does not originate. A value that exists only in the analytics layer has no operational owner and cannot be corrected at source. |
| **4. Derived values state their derivation** | A computed value documents its inputs and rule, so a disputed value can be traced rather than argued about. |
| **5. Unestablished ownership is recorded as unestablished** | Where no system owns a concept, that is the finding — not an invitation to assume Salesforce owns it. |

### Current source-of-truth position

| Concept | Proposed source of truth | Status |
|---|---|---|
| Account, Contact, Lead, Opportunity records | Salesforce | Proposed |
| Segment, territory, lifecycle stage, routing decision | Salesforce | Proposed |
| Governed rules (thresholds, mappings, precedence, calendars) | **Salesforce configuration metadata**, source-controlled | Proposed (`BR-059`) |
| KPI definitions | **This repository**, under version control | Proposed (`BR-048`) |
| Lead source and channel values | Unestablished — depends on `DEC-014` | **Open Decision** |
| Firmographic attributes | Unestablished — depends on `DEC-015` | **Open Decision** |
| Customer status and ARR | Unestablished — `TL-05` billing system not identified | **To Be Validated** |
| Churn status | Unestablished — `TL-06` CS platform not identified | **To Be Validated** |

**Finding carried from Phase 0B.** Several concepts that routing and qualification depend on
**have no established authoritative home**. Rules that live nowhere authoritative cannot be applied
consistently, versioned, or audited — which is a sufficient explanation for a large share of the
observed symptoms, independent of any Salesforce configuration defect.

---

## 2. Object and Field Ownership

Ownership means accountability for definition and quality — **not exclusive write access**.

| Object | Business owner | Accountable for |
|---|---|---|
| Lead | `PER-12` Marketing Operations | Capture quality, source data, MQL handoff |
| Account | `PER-10` Revenue Operations | Identity integrity, hierarchy, segment |
| Contact | `PER-10` Revenue Operations | Relationship accuracy, deduplication |
| Opportunity | `PER-01` VP Sales | Pipeline integrity, stage discipline |
| User | `PER-13` Salesforce Administrator | Access, availability, role assignment |
| Governed rule configuration | `PER-10` Revenue Operations | Correctness and currency of rules |
| KPI definitions | `PER-14` Data / BI Analyst | Definition integrity and reconciliation |

### Field ownership rule

**Every field has exactly one accountable owner, recorded in the data dictionary.** A field with no
owner has nobody accountable for its quality, which is how 44% missing employee count becomes a
tolerated condition rather than an owned problem.

---

## 3. Data Stewardship

| Role | Persona | Responsibility |
|---|---|---|
| **Data Owner** | Per object above | Defines what the data means and what quality is required |
| **Data Steward** | `PER-11` Sales Operations | Day-to-day quality: remediation, duplicate review, corrections |
| **Data Custodian** | `PER-13` Salesforce Administrator | Technical controls: validation, security, retention |
| **Data Consumer** | `PER-14`, all reporting personas | Uses data; reports quality defects rather than working around them |

**Finding.** `PER-11` currently performs stewardship **invisibly and without the role existing**
(`PROB-012`). Naming the role is a prerequisite to measuring the work, and measuring it is a
prerequisite to reducing it. This is the self-perpetuating mechanism broken at its first link.

---

## 4. Required Data

Required data is defined by **what a process cannot function without**, not by what would be nice to
have. Over-requiring at capture pushes users to enter placeholder values, which is worse than absence
because a placeholder is indistinguishable from a real value.

| Purpose | Attributes | Consequence of absence |
|---|---|---|
| Routing | Country, employee count | Cannot resolve territory or segment — 48% affected (`B-05`) |
| Identity | Domain or company name | Primary matching signal unavailable — 22% affected (`B-03`) |
| Qualification | Employee count, industry | Not assessable — must not be scored as poor fit (`BR-018`) |
| Contact | Email or phone | Cannot contact — 3.4% invalid email |
| SLA | Creation timestamp, assignment timestamp | Cannot measure response |

**Governing principle** (`BR-006`): **absence is handled explicitly, not prevented absolutely.** At
48% incomplete, hard-requiring routing data at capture would reject half of inbound demand. The
architecture must accept incomplete records and handle them through a defined path.

---

## 5. Validation

| Layer | Purpose | Applies |
|---|---|---|
| **Format** | Value is structurally valid | Email, domain, country (`BR-002`) |
| **Plausibility** | Value is within a sensible range | Employee count not 0, negative, or 10,000,000 |
| **Completeness** | Required attributes present for the intended process | `BR-001` |
| **Consistency** | Related values do not contradict | Country vs territory; segment vs firmographics |
| **Referential** | Related records exist and are appropriate | Account linkage |

### Validation principles

1. **Validate at capture where possible**, because correction downstream is more expensive and less
   reliable.
2. **Validation must not block legitimate business.** A rule rejecting 48% of inbound records is not
   a quality control — it is an outage.
3. **A validation failure produces a visible state, not a silent rejection.**
4. **Validation rules cite the `BR-###` they enforce**, so a rule whose requirement is withdrawn can
   be found and removed.

---

## 6. Normalization

| Attribute | Normalization | Requirement |
|---|---|---|
| Domain | Registrable domain; protocol, path, and `www.` removed | `BR-002` |
| Country | Governed canonical value from a defined list | `BR-002` |
| Company name | Governed convention for legal suffixes and punctuation | `BR-002` |
| Lead source / channel | Governed taxonomy value | `BR-016` (`DEC-011`) |

**Rules.** Normalization never discards the original supplied value where it differs. A value that
cannot be normalized is **marked as unnormalizable**, never silently altered. Normalization is applied
once at capture, not repeated inside each consuming process.

---

## 7. Duplicate Governance

| Principle | Statement |
|---|---|
| **Detection is separable from resolution** | Detection is safe and valuable today; resolution requires `DEC-004` |
| **No automated merge** | Merge is irreversible; while `DEC-004` is open, the population of legitimately distinct look-alike records is **unknown** (`BR-010`) |
| **Merge is a granted capability** | Scoped and attributable, not implied by an operations role (`BR-012`) |
| **The duplicate rate is not currently interpretable** | 6.8% (`B-08`) is blocked on commercial policy and **must not be used as an improvement target** in its current form |

> **This is a commercial policy question wearing a data problem's clothing.** Whether a hospitality
> franchisee is the same customer as its parent brand determines whether two Accounts are duplicates
> or legitimately distinct, how expansion revenue is attributed, and which seller owns the
> relationship. Solving it as a matching problem would encode an unmade commercial decision.

---

## 8. Matching Governance

| Principle | Statement |
|---|---|
| **Explainable matching** | Every match records its basis and confidence (`BR-009`) |
| **Determinate outcomes** | Matched, requires review, no match, or not assessable — never indeterminate (`BR-008`) |
| **"Not assessable" ≠ "no match"** | 22% of records lack the primary signal; conflating these hides a data problem as an identity result |
| **Asymmetric error cost** | A false positive corrupts data persistently; a false negative wastes an opportunity recoverably. **They are not equally costly**, which argues for a review band rather than a single cut-off (`DEC-008`) |
| **Governed configuration** | Matching hierarchy and thresholds are configuration, not embedded logic (`BR-059`) |

---

## 9. Data Quality Management

| Element | Approach |
|---|---|
| Measurement | Completeness and normalization rates on a governed definition (`BR-007`, `KPI-001`–`KPI-003`) |
| Baselines | Phase 0B Synthetic Baselines `B-01`–`B-05` |
| Ownership | Per-field owner in the data dictionary |
| Remediation | Through the exception framework, so volume is visible (`BR-044`) |
| Prevention | Capture-time validation and normalization |

> ⚠️ **Improvement-claim discipline.** Any future data-quality improvement claim must compare a real
> post-implementation measurement against the declared **synthetic** baseline, and must state plainly
> that the baseline is synthetic. **There are no `Actual Measured Result` values in this project at
> Phase 0.**

---

## 10. PII and Data Protection

### Classification

Every field carries a PII classification in the data dictionary:

| Classification | Definition | Examples |
|---|---|---|
| **None** | No personal data | Employee count, industry, segment |
| **Business contact** | Identifies a person in a business capacity | Name, business email, business phone, job title |
| **Sensitive** | Requires elevated protection | None currently proposed |

### Principles

1. **Field access to PII is justified per persona, not inherited with object access** (`BR-056`).
2. `PER-14` needs broad read but almost certainly **not** personal contact detail — a straightforward
   least-privilege reduction that inheritance would silently forgo.
3. Integration principals receive PII field access only where the integration demonstrably requires it
   (`BR-055`).

### Applicability

**Open Question, unresolved.** UK and German customers fall under UK GDPR / EU GDPR
(**Assumption** — not verified). Whether German-market records carry data-handling obligations
constraining field access or retention **has not been assessed**.

> **Portfolio scope.** All repository data is synthetic. GDPR applicability is therefore a design
> consideration in the **Enterprise Design** column only. **No real personal data exists or will
> exist in this repository**, and no compliance claim is made.

---

## 11. Synthetic Data Governance

| Rule | Statement |
|---|---|
| **All data is synthetic** | NorthstarIQ is fictional. No real customer, personal, or organizational data appears anywhere. |
| **Provenance labelling is mandatory** | Every number carries `Known Context`, `Synthetic Planning Assumption`, `Synthetic Baseline`, `Assumption`, `Finding`, `Open Question`, or `Actual Measured Result` |
| **No `Actual Measured Result` exists at Phase 0** | Any occurrence is a **Critical** quality finding |
| **Arithmetic must be coherent** | Synthetic does not mean incoherent. Inconsistent ARR, customer count, or ACV arithmetic is a Critical finding. |
| **Scenario coverage, not volume** | Ceilings: ~60 Accounts, ~75 Contacts, ~120 Leads, ~35 Opportunities. **Record count is not evidence.** |
| **Deterministic fixtures** | Test data is reproducible, not randomly generated |
| **No generation without approval** | Object, counts, purpose, scenarios, negative and boundary cases, expected outcomes, and storage justification are presented and approved first |

**No dataset has been generated. No Salesforce business data exists.**

---

## 12. Lineage

| Requirement | Statement |
|---|---|
| Enriched values record provenance | `BR-005` — an enriched value never silently overwrites a supplied one irrecoverably |
| Derived values record their basis | `BR-009`, `BR-015`, `BR-027`, `BR-032` |
| Decisions record their inputs | Sufficient to reproduce the decision given the same configuration |
| Configuration versions are attributable | A record's segment or territory is attributable to the rule version in force (`BR-025`, `BR-029`) |
| Analytics reconciles to source | `BR-051` |

**Finding.** Lineage is what makes `DEC-008`, `DEC-009`, and `DEC-001` **tunable after
implementation**. Without recorded basis there is no evidence about which threshold or weighting
produced which error, so post-implementation refinement becomes guesswork.

---

## 13. Retention

**Open — depends on `DEC-016` and `DEC-018`.**

| Consideration | Status |
|---|---|
| Transition history retention period | `DEC-018` — **irreversible if deferred** |
| Analytics history retention | `DEC-016` |
| Developer Edition storage limits | A real constraint — **representative capture, not exhaustive** |
| Record retention and archival | Not established; no business requirement identified |

**Nothing is assumed.** Cycles spanning 21–210 days mean meaningful cohort analysis requires history
well beyond a single quarter (`BR-050`) — which is an input to `DEC-016`, not a resolution of it.

---

## 14. Import and Export Controls

| Control | Statement |
|---|---|
| Imports follow the change path | Data loads are changes and are governed as such (`BR-060`) |
| Import provenance is recorded | Imported records are attributable to their load |
| Bulk operations respect governed rules | An import must not bypass validation, normalization, or routing |
| Export is scoped by access | Export inherits the access model; it is not a route around it |
| **No production data leaves the org** | Not applicable here — all data is synthetic — but stated as an Enterprise Design principle |

---

## 15. Analytics Handoff

| Principle | Statement |
|---|---|
| Analytics reads; it does not originate | Source of truth remains operational (§1 principle 3) |
| Decision basis data must reach analytics | `BR-049` — **capturing reasons analytics cannot read satisfies the letter of the explainability requirements and none of their purpose** |
| The analytics principal is scoped | Broad read, **no operational write** (`BR-052`) |
| Reconciliation is documented | Expected divergence is documented and quantifiable; undocumented divergence is indistinguishable from error (`BR-051`) |
| Refresh derives from decision latency | Not from technical preference (`DEC-020`) |

---

## 16. What This Document Does Not Do

- ❌ It does not invent external systems, vendors, or integrations.
- ❌ It does not resolve `DEC-004`, `DEC-008`, `DEC-014`, `DEC-015`, `DEC-016`, or `DEC-018`.
- ❌ It does not assert any current-state data governance exists at NorthstarIQ.
- ❌ It does not create Salesforce metadata.
- ❌ It does not claim GDPR compliance.
