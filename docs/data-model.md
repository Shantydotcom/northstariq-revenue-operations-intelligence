# Data Model

| | |
|---|---|
| **Purpose** | Which objects and fields the architecture needs, and which of those are custom |
| **Status** | 🟡 **CANDIDATE** — no field is build-committed |
| **Related** | [`architecture.md`](architecture.md) · [`requirements.md`](requirements.md) · [`security-model.md`](security-model.md) |

---

## ⚠️ Status of Every Field in This Document

**No Salesforce org has been inspected. Nothing here is committed to being built.**

| Status | Meaning |
|---|---|
| **Standard — reuse** | An existing Salesforce field meets the need. **No custom field will be created.** |
| **Candidate** | Proposed custom field, pending org inspection |
| **Implemented** | Created in the org and source-controlled — *none yet* |
| **Validated** | Implemented and proven by test — *none yet* |
| **Deferred** | Valid but out of this release |

**Every field below is Standard–reuse, Candidate, or Deferred.** The column is filled in as the
build proceeds, and [`implementation-log.md`](implementation-log.md) records each transition.

**The candidate count is expected to fall after org inspection.** A candidate that duplicates
standard capability or existing org configuration is removed, not built.

---

## 1. Standard First

The discovery finding that governs this entire document:

> **What was missing at NorthstarIQ was almost never storage.** Employee count, industry, country,
> revenue, record hierarchy, business hours, holidays, and field history are all standard Salesforce
> capabilities that already existed. What was missing was governed behaviour and explainability.

### Standard fields reused — no custom field created

| Object | Standard field | Used for | Serves |
|---|---|---|---|
| Lead | `NumberOfEmployees` | Segment derivation | `BR-05` |
| Lead | `Industry` | ICP assessment (deferred) | `BR-17` |
| Lead | `Country` / `CountryCode` | Territory resolution | `BR-06` |
| Lead | `Website`, `Email` | Domain extraction for matching | `BR-01`, `BR-03` |
| Lead | `LeadSource` | Governed source taxonomy — restricted value set | `BR-01`, `PD-12` |
| Lead | `Status` | **Governed lifecycle taxonomy** — restricted value set | `BR-15`, `PD-08` |
| Lead | `OwnerId` | Assignment target | `BR-07` |
| Lead | `ConvertedAccountId`, `ConvertedContactId`, `ConvertedOpportunityId` | Conversion continuity | `BR-15` |
| Account | `NumberOfEmployees`, `AnnualRevenue`, `Industry` | Segment derivation and ARR override | `BR-05` |
| Account | `BillingCountry` / `BillingState` | Territory resolution | `BR-06` |
| Account | `ParentId` | Account hierarchy — **replaces a proposed custom family field** | deferred `BR-013` |
| Account | `OwnerId` | Existing-owner precedence | `BR-07` |
| Contact | `AccountId`, `Email` | Lead-to-Contact duplicate detection | `BR-04` |
| Opportunity | `AccountId`, `StageName`, `Amount`, `CloseDate` | Funnel measurement | `BR-22` |
| User | `IsActive`, `UserRoleId` | Eligibility and hierarchy | `BR-08`, `BR-18` |
| — | **Business Hours** + **Holiday** | SLA clock and holidays | `BR-10`, `PD-05` |
| — | **Field History Tracking** | Lifecycle transition history | `BR-16`, `PD-09` |
| — | **Duplicate Rules / Matching Rules** | Duplicate detection — **evaluate before building custom logic** | `BR-04` |

> **`Duplicate Rules` and `Matching Rules` are standard Salesforce features.** If they meet `BR-04`,
> no custom duplicate detection is built. This is the single largest candidate reduction available
> at org inspection.

---

## 2. Candidate Custom Fields

**22 candidates.** Preferred envelope is 15–25.

### Lead — 12 candidates

| API name | Type | Purpose | Serves | Status |
|---|---|---|---|---|
| `Normalized_Domain__c` | Text(255) | Registrable domain extracted from website or email — the primary match signal | `BR-01`, `BR-03` | Candidate |
| `Data_Quality_Status__c` | Picklist | Complete · Incomplete · Unnormalizable | `BR-02` | Candidate |
| `Data_Quality_Detail__c` | Text(255) | **Which** attributes are missing or unnormalizable | `BR-02` | Candidate |
| `Match_Status__c` | Picklist | Matched · Review · No Match | `BR-03` | Candidate |
| `Matched_Account__c` | Lookup(Account) | The Account matched | `BR-03` | Candidate |
| `Match_Basis__c` | Text(255) | Which signal produced the outcome | `BR-03` | Candidate |
| `Segment__c` | Picklist | Derived segment | `BR-05` | Candidate |
| `Segment_Basis__c` | Text(255) | Which rule and version derived it; whether overridden | `BR-05` | Candidate |
| `Territory__c` | Picklist | Derived territory | `BR-06` | Candidate |
| `Routing_Reason__c` | Text(255) | **Why this owner** — precedence level, eligibility, rule version | `BR-08` | Candidate |
| `SLA_Target_DateTime__c` | Date/Time | Response deadline, visible to the owner | `BR-10`, `BR-12` | Candidate |
| `First_Touch_DateTime__c` | Date/Time | When first touch occurred | `BR-11` | Candidate |

### Account — 4 candidates

| API name | Type | Purpose | Serves | Status |
|---|---|---|---|---|
| `Strategic_Account__c` | Checkbox | Explicit designation, set by Revenue Operations | `BR-07`, `PD-02` | Candidate |
| `Customer_Status__c` | Picklist | Prospect · Customer · Churned | `BR-03`, `BR-07` | Candidate |
| `Segment__c` | Picklist | Derived segment | `BR-05` | Candidate |
| `Territory__c` | Picklist | Derived territory | `BR-06` | Candidate |

### User — 3 candidates

| API name | Type | Purpose | Serves | Status |
|---|---|---|---|---|
| `Territory__c` | Picklist | Coverage — a routing input | `BR-06`, `BR-07` | Candidate |
| `Routing_Eligible__c` | Checkbox | Eligibility for assignment (`OD-02` interim) | `BR-08` | Candidate |
| `Last_Assigned_DateTime__c` | Date/Time | Rotation state — **readable, not inferred** | `BR-09`, `PD-07` | Candidate |

### Conditional — 3 candidates, likely to be cut

| API name | Type | Purpose | Serves | Why conditional |
|---|---|---|---|---|
| `Lead.SLA_Status__c` | **Formula** | Met · Breached · Pending · Unmeasurable | `BR-11`, `BR-12` | Formula — zero storage. Keep unless a report can derive it directly. |
| `Lead.Exception_Type__c` | Picklist | Exception classification | `BR-13` | **May fold into `Data_Quality_Status__c`.** Decide at org inspection. |
| `Lead.Lifecycle_Stage_Entered__c` | Date/Time | Stage entry timestamp | `BR-16` | `BR-16` is P2. Include **only if** standard field history proves insufficient (`PD-09`). |

---

## 3. What the Candidates Are For

| Category | Count | Note |
|---|---:|---|
| **Explainability** — basis, reason, detail | **5** | `Data_Quality_Detail__c`, `Match_Basis__c`, `Segment_Basis__c`, `Routing_Reason__c`, `Match_Status__c` |
| Derived business values | 5 | Segment ×2, Territory ×2, normalized domain |
| Explicit state | 4 | Data quality, customer status, strategic flag, eligibility |
| Timestamps | 3 | SLA target, first touch, last assigned |
| Relationships | 1 | Matched Account |
| Conditional | 3 | See above |
| **Total** | **22** | |

**Roughly one candidate in four exists purely to record *why*.** That proportion is the project
thesis expressed as a data model: explainability is a data-capture obligation designed in at the
point of decision, not a reporting feature added later.

**Zero custom fields are proposed for firmographic storage.** Employee count, industry, country, and
revenue all use standard fields. This is the single clearest expression of standard-Salesforce-first
in the design.

---

## 4. Reduction From the Original Proposal

The Phase 0C data dictionary proposed **49 fields across 5 objects**. The candidate set is **22**.

| Removed | Count | Why |
|---|---:|---|
| ICP scoring fields | 4 | `BR-17` deferred; `OD-03` unresolved. **No scoring model will be invented to justify fields.** |
| Duplicate-handling fields | 3 | Evaluate standard Duplicate Rules first |
| Lifecycle history fields | 3 | Standard field history tracking (`PD-09`) |
| Separate assignment timestamp | 1 | Standard `LastModifiedDate` plus history may suffice |
| Account family fields | 2 | Standard `ParentId` |
| Reassignment-reason fields | 2 | `BR-09` is P1; revisit if built |
| Contact and Opportunity fields | 4 | Standard relationships cover the need |
| Per-object duplicated basis fields | 5 | Basis recorded where the decision is made, not on every downstream object |
| Enrichment and capture-interface fields | 3 | Scope removed (`BR-004`, `BR-005` removed) |

**27 fields removed.** Every removal is a field not to build, not to document, not to secure, not to
test, and not to explain to the next administrator.

---

## 5. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Custom field | `Pascal_Snake_Case__c` | `Routing_Reason__c` |
| Custom Metadata Type | `Singular_Noun__mdt` | `Segment_Band__mdt` |
| Permission set | `NIQ_` prefix, capability-named | `NIQ_Rule_Configuration` |
| Queue | `Purpose_Queue` | `Routing_Exception_Queue` |
| Flow | `Object_Trigger_Purpose` | `Lead_Inbound_Before_Save` |
| Picklist value | Title Case, human-readable | `Match Review` |

**Rules.** Name for the business meaning, not the mechanism. A field recording why something
happened is named for the decision, not the Flow. Where a name recurs across objects
(`Segment__c` on Lead and Account) it means the same thing on both, or it gets a different name.

---

## 6. Data Governance Rules That Affect Fields

| Rule | Applies to |
|---|---|
| **Blank is never a state.** An underivable value produces an explicit exception state, never an empty field read as a meaning. | `BR-05`, `BR-06`, `BR-13` |
| **Normalization never discards the supplied value** where it differs from the normalized result. | `BR-01` |
| **Derived fields are not user-writable** except through a recorded override. | `BR-05` |
| **Every picklist backing a governed taxonomy is restricted.** | `BR-01`, `BR-15`, `PD-12` |
| **Validation rules enforce governed values, not business judgement.** A validation rule that encodes an unresolved decision hard-codes a rule nobody agreed. | `BR-21` |

### PII classification

| Field | Classification | Access |
|---|---|---|
| `Email`, `Phone`, `MobilePhone` (Lead, Contact) | **PII** | Separately justified per persona — `BR-19` |
| `Name`, `Title`, `Company` | Business contact data | Standard record access |
| `Normalized_Domain__c` | Derived, organizational | Standard record access |

**All data in this project is synthetic and fictional.** The classification exists because the
*design* must be correct, not because any real personal data is present. **No real PII enters this
repository or the org under any circumstance.**

---

## 7. Synthetic Data Rules

| Rule | Detail |
|---|---|
| Fictional only | Invented companies, invented people. No real organization or person. |
| Deterministic | The same generation inputs produce the same dataset — tests must be repeatable |
| Purposeful | **Every record exists to exercise a named scenario.** See [`testing-strategy.md`](testing-strategy.md). |
| Small | ~190 records. Volume is not evidence. |
| Labelled | Data is identifiable as synthetic wherever it surfaces |
| Defects are deliberate | Broken records are constructed to match the baseline defect profile, not randomly corrupted |
