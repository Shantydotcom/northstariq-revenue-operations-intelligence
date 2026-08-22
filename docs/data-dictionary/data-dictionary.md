# Data Dictionary

| Field | Value |
|---|---|
| **Document** | Data Dictionary |
| **Phase** | 0C — Requirements & Governance |
| **Status** | **Proposed** — no field exists |
| **Implementation State** | Target State |
| **Related** | [`../requirements/business-requirements.md`](../requirements/business-requirements.md) · [`../governance/data-governance.md`](../governance/data-governance.md) · [`../security/access-model.md`](../security/access-model.md) |

---

> ⚠️ **No Salesforce field has been created. No metadata exists.** Every entry is a **proposal**
> awaiting Phase 0D design and Phase 1 implementation.
>
> **A proposed field is not a design commitment.** Phase 0D may satisfy the same requirement
> differently — the requirement is the obligation; the field is one candidate means.

---

## 1. Governing Rules

| Rule | Statement |
|---|---|
| **1. Standard before custom** | Every proposal states why a standard field does not suffice. §2 records this analysis. |
| **2. Every field needs a requirement** | A field with no `BR-###` is not created (`naming-conventions.md` §5) |
| **3. Every field has an owner** | A field with no accountable owner has nobody accountable for its quality |
| **4. Every field is PII-classified** | Drives field-level access justification (`BR-056`) |
| **5. Naming follows convention** | `Pascal_Snake_Case__c`; `_Reason__c`, `_Status__c`, `_Score__c`, `_Grade__c`, `_Timestamp__c`; no abbreviations |
| **6. Explainability fields are first-class** | `_Reason__c` and `_Basis__c` fields exist because explainability is an operational data-capture requirement, not a nice-to-have |

### Field entry format

Every entry carries: **Object · Business Label · Proposed API Name · Type · Standard/Custom ·
Business Purpose · Source · Required? · Reporting? · Automation Dependency? · Security Consideration ·
PII Classification · Related `BR-###` · Status.**

### PII classification

| Class | Meaning |
|---|---|
| **None** | No personal data |
| **Business contact** | Identifies a person in a business capacity |
| **Sensitive** | Requires elevated protection — **none proposed** |

---

## 2. Standard Field Analysis

**Rule 1 applied before any custom field is proposed.** Salesforce already provides substantial
capability, and duplicating it is a negative signal — it adds maintenance surface, creates a second
source of truth, and suggests the standard model was not understood.

| Need | Standard field | Sufficient? | Assessment |
|---|---|---|---|
| Company size | `Lead.NumberOfEmployees`, `Account.NumberOfEmployees` | ✅ **Yes** | Use standard. No custom field. |
| Industry | `Lead.Industry`, `Account.Industry` | ✅ **Yes** | Use standard; governed picklist values |
| Country | `Lead.Country`, `Account.BillingCountry` | ✅ **Yes** | Use standard; normalization is behaviour, not a new field |
| Website / domain | `Lead.Website`, `Account.Website` | ⚠️ **Partly** | Standard holds the URL; a **normalized** domain for matching is a distinct value (`BR-002`) |
| Annual revenue | `Lead.AnnualRevenue`, `Account.AnnualRevenue` | ✅ **Yes** | Use standard |
| Lead status | `Lead.Status` | ⚠️ **Depends on `DEC-017`** | May serve as the lifecycle taxonomy; **does not span the Lead-to-Opportunity boundary** |
| Lead source | `Lead.LeadSource` | ⚠️ **Partly** | Standard field, governed values (`DEC-011`); channel may be a separate concept |
| Record ownership | `OwnerId` | ✅ **Yes** | Use standard. **The routing *reason* is what is missing, not the owner.** |
| Account relationship | `Account.ParentId` | ⚠️ **Partly** | Provides hierarchy; **does not carry a relationship type** (subsidiary vs franchise vs trading name) — `DEC-004` |
| Lead-to-Account link | `Lead.ConvertedAccountId` | ❌ **No** | Only populated **after** conversion. Pre-conversion identity (`BR-008`) is exactly the gap. |
| Duplicate detection | Duplicate Rules / Matching Rules | ⚠️ **Partly** | Detection is native; **a durable, reportable duplicate state** (`BR-010`) is not |
| Business hours | Business Hours, Holidays | ✅ **Yes** | Use standard objects (`BR-039`) |
| Activity history | Task, Event | ⚠️ **Partly** | Activities exist; **a governed first-touch determination** (`BR-040`) is derived, not standard |
| Field history | Field History Tracking | ❌ **Insufficient alone** | **Cannot record a *cause*** — `BR-020` requires cause and acting principal |

### Findings

**Finding 1 — Most firmographic needs are met by standard fields.** Employee count, industry, country,
and revenue require **no custom fields**. What is missing is not storage but *governed behaviour*:
normalization, completeness assessment, and explainability.

**Finding 2 — The real gap is explanatory, not descriptive.** Salesforce stores *what* a record is and
*who* owns it perfectly well. It does not natively record **why** an automated decision was made.
Nearly every custom field proposed below is an explainability field, which is the data-dictionary
expression of the project thesis.

**Finding 3 — Field History Tracking cannot satisfy `BR-020`.** It records that a value changed, not
*why* or *by what process*. This is a concrete constraint on `DEC-018` and is recorded in
[`../requirements/lifecycle-model.md`](../requirements/lifecycle-model.md) §9.

---

## 3. Lead — Proposed Fields

### Data quality

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Data Quality Status | `Data_Quality_Status__c` | Picklist | Completeness state against routing-critical data | `BR-001` |
| Data Quality Detail | `Data_Quality_Detail__c` | Text Area | **Which attributes** are missing or unnormalizable, in business language | `BR-003` |
| Normalized Domain | `Normalized_Domain__c` | Text | Registrable domain for matching, distinct from the supplied URL | `BR-002` |

<details><summary>Full entries</summary>

**`Data_Quality_Status__c`** — Custom · Source: derived at capture · Required: no · Reporting: **yes**
(`KPI-001`, `KPI-002`) · Automation dependency: **yes** — gates routing (`BR-006`) · Security: no
restriction · PII: **None** · Owner: `PER-10` · Status: `Proposed`

> Values must distinguish *complete*, *incomplete*, and *unnormalizable*. **A blank field is not a
> state** — `BR-026` and `BR-001` both require explicit states rather than absence.

**`Data_Quality_Detail__c`** — Custom · Source: derived · Reporting: no (detail, not aggregate) ·
Automation dependency: no · PII: **None** · Owner: `PER-10` · Status: `Proposed`

> Must name attributes in **business language, not API names** (`BR-003` criterion 3). This field
> converts remediation from investigation into data entry for `PER-07`.

**`Normalized_Domain__c`** — Custom · Source: derived from `Website`/`Email` · Reporting: no ·
Automation dependency: **yes** — primary matching signal (`BR-008`) · PII: **None** (organizational,
not personal) · Owner: `PER-10` · Status: `Proposed`

> Justified against rule 1: `Website` holds what the user supplied; matching needs a canonical form.
> Overwriting `Website` would **discard the original**, which `BR-002` prohibits.

</details>

### Identity and matching

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Matched Account | `Matched_Account__c` | Lookup(Account) | Pre-conversion Account linkage | `BR-008` |
| Match Status | `Match_Status__c` | Picklist | Matched / review / no match / **not assessable** | `BR-008` |
| Match Confidence | `Match_Confidence__c` | Number | Confidence producing the outcome | `BR-008`, `BR-009` |
| Match Basis | `Match_Basis__c` | Text Area | **Which signals matched what** | `BR-009` |
| Customer Status | `Customer_Status__c` | Picklist | Existing customer, churned, prospect, unknown | `BR-008` |
| Duplicate Status | `Duplicate_Status__c` | Picklist | Probable / confirmed / not duplicate | `BR-010` |

<details><summary>Full entries</summary>

**`Matched_Account__c`** — Custom · Justified because `ConvertedAccountId` populates only **after**
conversion, and the identity requirement is pre-conversion · Automation dependency: **yes** — routing
precedence (`BR-030`) · PII: **None** · Owner: `PER-10` · Status: `Proposed`

**`Match_Status__c`** — Custom · Reporting: **yes** (`KPI-014`) · PII: **None** · Owner: `PER-10`

> **Must distinguish "not assessable" from "no match found"** (`BR-008` criterion 2). 22% of Leads
> lack the primary matching signal; conflating these hides a data problem as an identity result.
> Band structure requires `DEC-008`.

**`Match_Confidence__c`** — Custom · Automation dependency: **yes** — band determination · PII:
**None** · Owner: `PER-10`

> **Recorded regardless of band** so `DEC-008` thresholds can be tuned post-implementation against
> real evidence rather than guesswork.

**`Match_Basis__c`** — Custom · Purpose: reproduce the decision given the same inputs (`BR-009`
criterion 3) · PII: **None** · Owner: `PER-10`

**`Customer_Status__c`** — Custom · Source: derived from the matched Account · Automation dependency:
**yes** — routing precedence (`DEC-003`) · Security: **`PER-08` requires visibility** — the central
tension in [`../security/access-model.md`](../security/access-model.md) §4 · PII: **None** · Owner:
`PER-10`

> **Open Question:** whether churned Accounts are distinguishable from active customers is unknown.
> If not, customer detection may match interest to ended relationships.

**`Duplicate_Status__c`** — Custom · Justified because Duplicate Rules detect at save time but leave
**no durable, reportable state** · Reporting: **yes** · PII: **None** · Owner: `PER-11` · Status:
`Proposed`

> **Blocked on `DEC-004`.** Values must not treat franchise and subsidiary records as duplicates by
> default.

</details>

### Qualification

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| ICP Score | `ICP_Score__c` | Number | Fit score | `BR-014` |
| ICP Grade | `ICP_Grade__c` | Picklist | Banded grade | `BR-014` |
| ICP Assessability | `ICP_Assessability__c` | Picklist | **Assessable vs not assessable** | `BR-018` |
| ICP Score Basis | `ICP_Score_Basis__c` | Text Area | Contributing attributes and values | `BR-015` |
| Scoring Configuration Version | `Scoring_Configuration_Version__c` | Text | Version that produced the score | `BR-015` |

<details><summary>Full entries</summary>

**`ICP_Score__c`** / **`ICP_Grade__c`** — Custom · Reporting: **yes** · PII: **None** · Owner:
`PER-12` · **Blocked on `DEC-009`** — weights and grade boundaries

**`ICP_Assessability__c`** — Custom · **This field prevents a systematic bias.** Fit depends on
employee count (44% missing) and industry (31% missing); without it, unassessable records score low
and are deprioritized **because their data is incomplete** (`BR-018`) · Reporting: **yes**
(`KPI-003`) · PII: **None** · Owner: `PER-12`

**`ICP_Score_Basis__c`** — Custom · Reproduces the score given the same configuration · PII: **None**

**`Scoring_Configuration_Version__c`** — Custom · Makes a score attributable to the configuration
version in force when it was produced (`BR-015` criterion 4) · PII: **None**

</details>

### Segmentation and territory

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Segment | `Segment__c` | Picklist | Derived segment | `BR-024` |
| Segment Basis | `Segment_Basis__c` | Text Area | Inputs and rule producing it | `BR-027` |
| Segment Override Reason | `Segment_Override_Reason__c` | Picklist | Reason for manual override | `BR-027` |
| Is Segment Overridden | `Is_Segment_Overridden__c` | Checkbox | Distinguishes overridden from derived | `BR-027` |
| Territory | `Territory__c` | Picklist or Lookup | Resolved territory | `BR-028` |
| Territory Basis | `Territory_Basis__c` | Text Area | Inputs and rule producing it | `BR-028` |

<details><summary>Full entries</summary>

**`Segment__c`** — Custom · Automation dependency: **yes** — selects the territory map · Reporting:
**yes** · PII: **None** · Owner: `PER-10` · **Blocked on `DEC-001`, `DEC-002`**

> Must include an explicit **unsegmentable** value. `BR-026` prohibits defaulting, and a blank field
> is indistinguishable from "not yet processed".

**`Is_Segment_Overridden__c`** — Custom · Boolean naming states the true condition per
`naming-conventions.md` §5 · Reporting: **yes** — **override rate is the feedback signal on rule
quality**, and the evidence needed to refine `DEC-001` after implementation · PII: **None**

**`Territory__c`** — Custom · **Type deliberately undecided.** Whether Salesforce Enterprise Territory
Management is used is a Phase 0D decision with a real maintainability trade-off for `PER-13` ·
**Blocked on `DEC-022`** · PII: **None** · Owner: `PER-01`

</details>

### Routing and SLA

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Routing Status | `Routing_Status__c` | Picklist | Assigned / exception / pending | `BR-033` |
| Routing Reason | `Routing_Reason__c` | Text Area | **Precedence step, rule, and driving inputs** | `BR-032` |
| Assignment Timestamp | `Assignment_Timestamp__c` | DateTime | When first assigned | `BR-033` |
| Seller Eligibility Outcome | `Seller_Eligibility_Outcome__c` | Picklist | Eligibility evaluation result | `BR-035` |
| Reassignment Reason | `Reassignment_Reason__c` | Picklist | Correction vs legitimate movement | `BR-036` |
| SLA Deadline | `SLA_Deadline__c` | DateTime | Response deadline | `BR-042` |
| SLA Status | `SLA_Status__c` | Picklist | Within / breached / **indeterminate** | `BR-041` |
| First Touch Timestamp | `First_Touch_Timestamp__c` | DateTime | First touch meeting the governed definition | `BR-040` |

<details><summary>Full entries</summary>

**`Routing_Reason__c`** — Custom · **The single most important proposed field in this dictionary.**
`PROB-003` is the defining defect of the environment: nothing records why a record reached its owner.
Reporting: **yes** — `BR-049` requires it to reach analytics · Automation dependency: no (an output) ·
PII: **None** · Owner: `PER-10` · Status: `Proposed`

> **Not blocked by any decision.** Whatever precedence `DEC-003` establishes, the obligation to record
> which step applied is unchanged. Must be written **at the moment of routing** and survive
> reassignment (`BR-032` criteria 4–5).

**`Assignment_Timestamp__c`** — Custom · Justified because `CreatedDate` and `LastModifiedDate` cannot
isolate **first** assignment · Reporting: **yes** (`KPI-004`, `KPI-005`, `KPI-006`) · PII: **None**

**`Reassignment_Reason__c`** — Custom · **Converts an unmeasurable metric into a measurable one**:
7.3 points of the 18.6% reassignment rate are currently unclassifiable · Reporting: **yes**
(`KPI-007`) · PII: **None** · Owner: `PER-02`

**`SLA_Deadline__c`** — Custom · Must reflect the applicable business hours and holiday calendar
(`BR-039`) · Security: **visible to the assigned owner** (`BR-042`) · PII: **None** · **Blocked on
`DEC-006`**

**`SLA_Status__c`** — Custom · **Must carry an explicit `Indeterminate` value.** `BR-041` requires
separating demonstrable breach from unknown outcome; 27% of Leads have no logged first touch ·
Reporting: **yes** (`KPI-009`–`KPI-011`) · PII: **None**

**`First_Touch_Timestamp__c`** — Custom · Derived from activity per the governed definition · PII:
**None** · **Blocked on `DEC-012`**

</details>

### Lifecycle

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Lifecycle Stage | `Lifecycle_Stage__c` | Picklist | Governed lifecycle position | `BR-019` |
| Lifecycle Stage Entered | `Lifecycle_Stage_Entered__c` | DateTime | When the current stage was entered | `BR-022` |
| Is Stalled | `Is_Stalled__c` | Checkbox | No progression for the defined period | `BR-023` |

> ⚠️ **All three are blocked on `DEC-017`**, and `Lifecycle_Stage__c` may not be needed at all — if
> `DEC-017` selects Lead Status as the taxonomy, proposing a parallel field would **create the
> two-sources-of-truth problem `BR-019` exists to prevent.**
>
> **`Is_Stalled__c` as a checkbox is itself a modelling position** (stall as a flag rather than a
> stage), preserving the substantive stage while stalled. That choice belongs to `DEC-017` — see
> [`../requirements/lifecycle-model.md`](../requirements/lifecycle-model.md) §6.

---

## 4. Account — Proposed Fields

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Is Strategic Account | `Is_Strategic_Account__c` | Checkbox | Strategic designation | `BR-027`, `BR-031` |
| Strategic Designation Source | `Strategic_Designation_Source__c` | Picklist | How designation was determined | `BR-027` |
| Segment | `Segment__c` | Picklist | Account-level segment | `BR-024` |
| Segment Basis | `Segment_Basis__c` | Text Area | Derivation basis | `BR-027` |
| Territory | `Territory__c` | Picklist or Lookup | Resolved territory | `BR-028` |
| Normalized Domain | `Normalized_Domain__c` | Text | Canonical domain for matching | `BR-002` |
| Customer Status | `Customer_Status__c` | Picklist | Active, churned, prospect | `BR-008` |
| Account Relationship Type | `Account_Relationship_Type__c` | Picklist | Subsidiary / franchise / trading name | `BR-013` |
| Duplicate Status | `Duplicate_Status__c` | Picklist | Duplicate review state | `BR-010` |

<details><summary>Notes on the consequential entries</summary>

**`Is_Strategic_Account__c`** — Custom · **Security consideration is the point of this field.** Any
field that overrides routing precedence is effectively a **permission**, regardless of implementation.
If a Strategic AE can set it, routing precedence becomes self-serve and `DEC-003` can be bypassed by
the party who benefits · PII: **None** · Owner: `PER-01` · **Blocked on `DEC-005`**

**`Account_Relationship_Type__c`** — Custom · Justified because `ParentId` provides hierarchy but
**carries no relationship type**, and the distinction between subsidiary, franchise, and trading name
is exactly what `DEC-004` must resolve · PII: **None** · Owner: `PER-10` · **Blocked on `DEC-004`**

**`Customer_Status__c`** — Custom · Source: **unestablished** — `TL-05` (billing) and `TL-06` (CS
platform) are not identified, so whether Salesforce is authoritative for customer and churn status is
`To Be Validated` · PII: **None** · Owner: `PER-10`

**`Segment__c`, `Territory__c`, `Normalized_Domain__c`, `Segment_Basis__c`, `Duplicate_Status__c`** —
as per the Lead entries, at Account grain.

> **Open Question.** Whether Account and Lead segment independently, and which governs routing when
> they differ, is unresolved — see
> [`../requirements/segmentation-model.md`](../requirements/segmentation-model.md) §5.

</details>

---

## 5. Contact — Proposed Fields

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Duplicate Status | `Duplicate_Status__c` | Picklist | Lead-to-Contact duplicate state | `BR-011` |
| Originating Lead | `Originating_Lead__c` | Text | Provenance of a converted Contact | `BR-021` |

**Deliberately minimal.** Contact needs little custom extension: standard fields cover the person, and
the project's gaps are in identity, routing, and lifecycle — which live on Lead and Account.

> **PII note.** Contact holds the highest concentration of **Business contact**-classified data
> (`Name`, `Email`, `Phone`, `Title` — all standard). This is where `BR-056` field-level justification
> matters most, particularly for `PER-14`, who needs broad read but almost certainly not personal
> contact detail.

---

## 6. Opportunity — Proposed Fields

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Originating Lead | `Originating_Lead__c` | Text | Preserves lifecycle continuity across conversion | `BR-021` |
| Lifecycle Stage Entered | `Lifecycle_Stage_Entered__c` | DateTime | Stage timing continuity | `BR-022` |

**Deliberately minimal, and the reason matters.** `StageName`, `Amount`, `CloseDate`, and
`OwnerId` are standard and sufficient. This project's scope is **Lead-to-Revenue up to and including
Opportunity creation** — Opportunity management itself is largely out of scope
([`../discovery/project-scope.md`](../discovery/project-scope.md)).

`Originating_Lead__c` exists solely so end-to-end cycle time is measurable across the conversion
boundary (`BR-021` criterion 3) — the metric most relevant to a business with 21–210 day cycle spread.

---

## 7. User — Proposed Fields

| Business Label | Proposed API Name | Type | Purpose | `BR-###` |
|---|---|---|---|---|
| Is Available For Assignment | `Is_Available_For_Assignment__c` | Checkbox | Routing eligibility | `BR-035` |
| Assignment Unavailable Reason | `Assignment_Unavailable_Reason__c` | Picklist | Why unavailable | `BR-035` |
| Assigned Territory | `Assigned_Territory__c` | Picklist or Lookup | Territory coverage | `BR-028` |
| Assigned Segment | `Assigned_Segment__c` | Picklist | Segment coverage | `BR-024` |
| Is In Round Robin Pool | `Is_In_Round_Robin_Pool__c` | Checkbox | Pool membership | `BR-034` |

<details><summary>Notes</summary>

**`Is_Available_For_Assignment__c`** — Custom · Justified because `User.IsActive` covers deactivation
but **not** leave, capacity, or coverage change — the conditions `DEC-007` must define ·
Automation dependency: **yes** — routing eligibility · Security: **write access must be scoped**; a
seller who can set their own availability can opt out of assignment · PII: **None** · Owner: `PER-02`
· **Blocked on `DEC-007`**

**`Is_In_Round_Robin_Pool__c`** — Custom · **Blocked on `DEC-013`** — including the unresolved
question of whether informal language or time-zone carve-outs already exist for UK and German records

> **Alternative to weigh in Phase 0D.** Territory, segment, and pool membership could live as
> **governed configuration** rather than User fields, which would be more consistent with `BR-059`
> and avoid user-record sprawl. Recorded as an open design consideration, not decided here.

</details>

---

## 8. Summary

| Object | Proposed custom fields | Blocked on a decision |
|---|---:|---:|
| Lead | 31 | 14 |
| Account | 9 | 6 |
| Contact | 2 | 1 |
| Opportunity | 2 | 1 |
| User | 5 | 3 |
| **Total** | **49** | **25** |

*Some API names recur across objects (`Segment__c`, `Territory__c`, `Duplicate_Status__c`,
`Customer_Status__c`, `Normalized_Domain__c`, `Segment_Basis__c`, `Originating_Lead__c`,
`Lifecycle_Stage_Entered__c`). Counted per object, since each is a distinct field to build,
document, secure, and test. **35 distinct names across 49 object-field proposals.***

### Composition

| Category | Count | Note |
|---|---:|---|
| **Explainability** — `_Reason__c`, `_Basis__c`, `_Detail__c`, confidence, configuration version | **12** | The project thesis expressed as data |
| State and status | 15 | Explicit states — **`BR-006` and `BR-026` prohibit blank-as-state** |
| Derived business values | 9 | Segment, territory, score, grade |
| Timestamps | 4 | Measurement enablement |
| Relationships | 4 | Identity and lifecycle continuity |
| Eligibility and coverage | 5 | Routing inputs on User |

**Finding.** **Twelve of forty-nine proposals exist purely to record *why*** — roughly one in four.
That proportion is the data-dictionary expression of the project's central argument: explainability is
an operational data-capture requirement designed in at the point of decision, not a reporting feature
added later.

**Finding.** **Zero custom fields are proposed for firmographic storage.** Employee count, industry,
country, and revenue use standard fields. What was missing was never storage — it was governed
behaviour and explainability.

**Finding.** **Half of the proposals (25 of 49) are blocked on an open decision.** That is the honest
state of a data model derived from requirements whose business rules have not yet been agreed, and it
is the reason no metadata may be created in Phase 0C.

---

## 9. What This Document Does Not Do

- ❌ It does not create any Salesforce field or metadata.
- ❌ It does not commit Phase 0D to these fields — the requirement is the obligation, not the field.
- ❌ It does not resolve any open decision. **21 of 41 proposals are blocked.**
- ❌ It does not propose picklist values where those values are an open decision.
- ❌ It does not duplicate standard Salesforce capability — §2 records the analysis.
