# Data Model

| | |
|---|---|
| **Purpose** | Which objects and fields the architecture needs, and which of those are custom |
| **Status** | 🟢 **21 custom fields deployed** — Lead 14 · Account 4 · User 3. 18 validated across Increments 2-4; the 3 `User` fields are **deployed and unconsumed**. |
| **Related** | [`architecture.md`](architecture.md) · [`requirements.md`](requirements.md) · [`security-model.md`](security-model.md) |

---

## ⚠️ Status of Every Field in This Document

**22 custom fields are deployed and in source control**, alongside **4 Custom Metadata Types holding 26 configuration records** (§2b — configuration, not CRM data). — Lead 14 (validated across Increments 2-4),
Account 4 (deployed; `Normalized_Domain__c` validated), User 3 (**deployed, unconsumed**). The status
column below is current; [`implementation-log.md`](implementation-log.md) records each transition.

| Status | Meaning |
|---|---|
| **Standard — reuse** | An existing Salesforce field meets the need. **No custom field will be created.** |
| **Candidate** | Proposed, not yet approved for a specific increment |
| **Approved — Inc N** | Approved for build in the named increment. **Still not built.** |
| **Implemented** | Created in the org and source-controlled |
| **Validated** | Implemented and proven by an executed test with recorded results |
| **Deferred** | Valid but out of this release, or moved to a later increment |

The status column advances as the build proceeds, and
[`implementation-log.md`](implementation-log.md) records each transition with its date.

**Org inspection reduced 22 candidates to 20, then 19 for Increment 1**: `Customer_Status__c` was
replaced by standard `Account.Type`, `Lifecycle_Stage_Entered__c` was deferred to standard field
history, and `SLA_Status__c` was deferred to the SLA increment where its inputs become meaningful.

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

## 2. Custom Fields — 21 deployed

**21 built.** Preferred envelope is 15–25. The original proposal held 22 candidates; org inspection
reduced it, Increment 3 rejected `Match_Basis__c`, and Increment 3 added `Account.Normalized_Domain__c`.

### Lead — 14 built across Increments 2–4

| API name | Type | Purpose | Serves | Status |
|---|---|---|---|---|
| `Normalized_Domain__c` | Text(255) | Registrable domain from website or email — the primary match signal | `BR-01`, `BR-03` | ✅ **VALIDATED (Inc 2)** |
| `Data_Quality_Status__c` | **Formula(Text)** | Complete · Incomplete | `BR-02` | ✅ **VALIDATED (Inc 2)** — all 4 branches |
| `Data_Quality_Detail__c` | **Formula(Text)** | *Which* attributes are missing | `BR-02` | ✅ **VALIDATED (Inc 2)** |
| `Segment__c` | Picklist | Derived segment | `BR-05` | ✅ **VALIDATED (Inc 2)** |
| `Segment_Basis__c` | Text(255) | Which rule and version derived it | `BR-05` | ✅ **VALIDATED (Inc 2)** |
| `Match_Status__c` | Picklist | Matched · Review · No Match | `BR-03` | ✅ **VALIDATED (Inc 3)** |
| `Matched_Account__c` | Lookup(Account) | The Account matched | `BR-03` | ✅ **VALIDATED (Inc 3)** |
| `Territory__c` | Picklist | Derived territory | `BR-06` | ✅ **VALIDATED (Inc 3)** |
| `Routing_Reason__c` | Text(255) | **Why this owner** — precedence tier, territory, rule version | `BR-08` | ✅ **VALIDATED (Inc 3)** |
| `Exception_Type__c` | Picklist | Exception class | `BR-13` | ✅ **VALIDATED (Inc 3)** |
| `SLA_Target_DateTime__c` | Date/Time | Response deadline, set once at intake | `BR-10`, `BR-12` | ✅ **VALIDATED (Inc 4)** — write-once |
| `SLA_Basis__c` | Text(255) | Why this deadline, or why none was set | `BR-10`, `BR-08` | ✅ **VALIDATED (Inc 4)** — write-once |
| `First_Touch_DateTime__c` | Date/Time | First seller action | `BR-11` | ✅ **VALIDATED (Inc 4)** — write-once |
| `SLA_Status__c` | **Formula(Text)** | Excluded · Unmeasurable · Pending · At Risk · Met · Breached · Breached (Late Response) | `BR-11`, `BR-12` | ✅ **VALIDATED (Inc 4)** — zero mutation |

> ~~`Match_Basis__c`~~ — **NOT BUILT.** Rejected in Increment 3: with a single matching signal the
> basis is constant, so `Match_Status__c` + `Matched_Account__c` already answer *what* and *which*.

### Account — 4 built (1 candidate replaced by standard)

| API name | Type | Purpose | Serves | Status |
|---|---|---|---|---|
| `Normalized_Domain__c` | Text(255) | Reproduces Lead normalization so domains can be compared | `BR-03` | ✅ **VALIDATED (Inc 3)** — matches on all 13 stock Accounts |
| `Strategic_Account__c` | Checkbox | Explicit designation, set by Revenue Operations | `BR-07`, `PD-02` | ✅ **DEPLOYED (Inc 1)** — consumed by routing Tier 1 |
| ~~`Customer_Status__c`~~ | — | **REPLACED by standard `Account.Type`** (add `Churned` value) | `BR-03`, `BR-07` | **Removed** |
| `Segment__c` | Picklist | Derived segment | `BR-05` | 🟡 **DEPLOYED (Inc 1)** — Account-level derivation deferred at Inc 3 |
| `Territory__c` | Picklist | Derived territory | `BR-06` | 🟡 **DEPLOYED (Inc 1)** — Account-level derivation deferred at Inc 3 |

### User — 3 deployed, none consumed

| API name | Type | Purpose | Serves | Status |
|---|---|---|---|---|
| `Territory__c` | Picklist | Coverage — a routing input | `BR-06`, `BR-07` | 🟡 **DEPLOYED, UNCONSUMED** |
| `Routing_Eligible__c` | Checkbox | Eligibility for assignment (`OD-02` interim) | `BR-08` | 🟡 **DEPLOYED, UNCONSUMED** |
| `Last_Assigned_DateTime__c` | Date/Time | Rotation state — **readable, not inferred** | `BR-09`, `PD-07` | 🟡 **DEPLOYED, UNCONSUMED** |

> **All three are deployed, FLS-granted to `NIQ_Revenue_Operations`, and read by no automation.**
> `Lead_Inbound_Before_Save` contains **zero references** to them. Round robin (`BR-09`, `PD-07`) was
> deferred at Increment 3, and territory coverage routes to a **queue** rather than to an individual
> seller.
>
> They remain deployed from the approved design but are currently unconsumed. **They are not evidence
> that round robin exists.**

### Resolved at org inspection

| API name | Type | Purpose | Serves | Disposition |
|---|---|---|---|---|
| `Lead.Exception_Type__c` | Picklist | Exception classification | `BR-13` | **Approved — Inc 1.** Kept separate from `Data_Quality_Status__c`: exception class and data-quality state are different concepts, and the one-queue design depends on this field. |
| `Lead.SLA_Status__c` | **Formula(Text)** | Met · Breached · Pending · Unmeasurable | `BR-11`, `BR-12` | ✅ **DELIVERED in Increment 4** — VALIDATED, zero mutation. Originally deferred because its inputs (`SLA_Target_DateTime__c`, `First_Touch_DateTime__c`) carried no values until then, and formulas are non-destructive to add later. |
| `Lead.Lifecycle_Stage_Entered__c` | Date/Time | Stage entry timestamp | `BR-15`, `BR-16`, `PD-09` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Originally deferred in favour of `LeadHistory`, and built once enforcement gave it a writer. It answers the question history does not: **when the current stage began**. One field, not one per stage, and not a history model — field history on `Status` remains the transition trail. Written **only** by `Lead_Inbound_Before_Save`, on create and on an allowed transition; `editable=false` in every permission set, so no principal edits it by hand. |

| `Lead.MQL_Basis__c` | Text(255) | Why this Lead qualified as MQL | `BR-17`, `PD-14` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Evidence, never policy: it explains a qualification and defines none. Written **only** by `Lead_Inbound_Before_Save` on entry to MQL, and left in place afterwards so a later stage still carries the reason it was reached. `editable=false` in every permission set. Assembled from **only the requirements the active policy declares**, so it stays truthful when the policy changes. Carries the policy version, exactly as `Segment_Basis__c` carries the rule version — which is why no separate `MQL_Policy_Version__c` field exists. |


| `Lead.Sales_Accepted__c` | Checkbox | **INPUT** — the seller's explicit acceptance | `BR-15`, `BR-16` | ✅ **DELIVERED and VALIDATED (2026-08-27).** The one field in the acceptance model a human writes. Editable by seller and RevOps, read-only to the integration. Ticking it moves nothing on its own; entering SAL without it is refused. |
| `Lead.Sales_Accepted_At__c` | Date/Time | **EVIDENCE** — when Sales accepted | `BR-15`, `BR-16` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Separate from `Lifecycle_Stage_Entered__c` on purpose: that field is overwritten on the next transition and stops answering when SAL was accepted the moment the Lead reaches SQL. This one never moves. `editable=false` everywhere. |
| `Lead.Sales_Accepted_By__c` | Lookup(User) | **EVIDENCE** — who accepted | `BR-15` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Captured from the authenticated identity at the moment of acceptance. Deliberately **not** `OwnerId` (ownership is reassignable) and **not** `LastModifiedById` (any later edit overwrites it). `editable=false` everywhere. |
| `Lead.Sales_Acceptance_Basis__c` | Text(255) | **EVIDENCE** — why acceptance was permitted | `BR-15` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Assembled from only the requirements the active acceptance policy declares, and carries the policy version. Kept separate from `MQL_Basis__c` so the Marketing claim and the Sales acknowledgement stay independently readable; neither overwrites the other. |

| `Lead.Qualified_Need__c` | **Picklist, restricted** | **INPUT** — the confirmed business need | `BR-15`, `BR-17` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Four governed values. Field-level value set, **not** a Global Value Set — no second object consumes this vocabulary, and reusable metadata is not created for hypothetical reuse. Restriction proven: Salesforce rejected an out-of-vocabulary value. |
| `Lead.Next_Step_Date__c` | Date | **INPUT** — the agreed forward motion | `BR-15`, `BR-17` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Required to be today or later **at qualification time**. Not `Opportunity.CloseDate` (no Opportunity exists yet) and not a buying timeline (a prediction, not a fact). |
| `Lead.Next_Step__c` | Text(255) | **CONTEXT** — what the next action is | `BR-15` | ✅ **DELIVERED (2026-08-27).** **Never a qualification requirement** — blank does not prevent SQL, no Flow condition reads it, no control will interpret it. It exists so a reader sees *what* was agreed, not only that a date exists. |
| `Lead.SQL_Basis__c` | Text(255) | **EVIDENCE** — why SQL was permitted | `BR-15`, `BR-17` | ✅ **DELIVERED and VALIDATED (2026-08-27).** Records the need and next-step date **as they stood at qualification**, plus the policy version. Written once on entry to SQL; verified to survive native Lead Conversion. `editable=false` everywhere. |

### Formula fields

Four fields were candidates for formulas. Org inspection resolved three:

| Field | Verdict |
|---|---|
| `Data_Quality_Status__c` | ✅ **Formula(Text)** — groupable for `M-01`; removes this work from automation entirely |
| `Data_Quality_Detail__c` | ✅ **Formula(Text)** — names the missing attributes |
| `SLA_Status__c` | ✅ Formula, but **deferred** to the SLA increment |
| `Normalized_Domain__c` | ❌ **Text(255), Flow-populated.** Website parsing is unreliable in formula syntax, `BR-01` requires preserving the original and flagging unnormalizable values, and **a formula field cannot later be converted to a text field without deleting it.** |

> **A formula field cannot be a picklist.** `Data_Quality_Status__c` is therefore Formula(Text), not
> a governed value set. Text still groups correctly in reports.

---

## 2b. Configuration Records — Custom Metadata

**Custom Metadata is configuration, not CRM data**, and the distinction is load-bearing in this
document. Everything in §2 is a field on a record a person or a process creates: a Lead, an Account,
a User. Everything here is a **rule the business maintains**, stored as metadata, deployed and
version-controlled like code but editable in the org without one.

| | Custom fields (§2) | Custom Metadata records (here) |
|---|---|---|
| What it holds | A fact about one record | A rule that applies to many |
| Who writes it | A person, or the intake Flow | An administrator, deliberately |
| Changed by | Working a record | A configuration decision |
| Volume | Grows with the business | Stays small by design |

**No Custom Metadata Type in this project has a relationship to `Lead`.** There is no lookup, no
master-detail, and no `__r` traversal from a Lead to any of them. That is not an omission: Custom
Metadata cannot be the child of a standard object, and the association is made **by value at read
time**, not by a foreign key.

### `Routing_Readiness_Source__mdt` — which Lead Sources are assessed for routing readiness

| Field API name | Type | Meaning, from the artifact | Manageability |
|---|---|---|---|
| `Lead_Source__c` | Text(255) | *"The exact `Lead.LeadSource` value this record covers. Matched on exact equality. `BR-02`."* | `SubscriberControlled` |
| `Is_Active__c` | Checkbox, default `true` | *"Whether this source is in force."* | `SubscriberControlled` |

**Record semantics.** One record per Lead Source. A record's `Lead_Source__c` is compared for
**exact string equality** against `Lead.LeadSource`; there is no normalisation, no case folding and
no pattern matching. Records currently deployed: `NorthstarIQ Inbound`, `Web`, `Phone Inquiry` — all
three `Is_Active__c = true`.

**Active/inactive is implemented, and it is a filter rather than a delete.** The assessment reads
`WHERE Is_Active__c = true`. Unchecking the box removes a source from the assessed population while
keeping the record — so a source that was once in scope stays visible as configuration history
rather than vanishing.

**How it relates to `Lead.LeadSource`, precisely.**

```
Lead.LeadSource                      a value on the record
        │
        │  compared for exact equality at assessment time
        │  NOT a lookup, NOT a relationship, NOT enforced by the platform
        ▼
Routing_Readiness_Source__mdt.Lead_Source__c   where Is_Active__c = true
```

**Nothing enforces that the two agree.** A record here naming a Lead Source that no Lead uses is
inert; a Lead Source with no record here is simply not assessed by that control. Neither is an error,
and neither is prevented — which is why the assessment reports the sources it excluded, by name,
rather than reporting a smaller population without saying so.

### `Lifecycle_Transition__mdt` — which Lead lifecycle transitions are allowed

| Field API name | Type | Meaning, from the artifact | Manageability |
|---|---|---|---|
| `From_Stage__c` | Text(40) | The exact `Lead.Status` value the transition starts from. Exact equality against the prior value. | `SubscriberControlled` |
| `To_Stage__c` | Text(40) | The exact `Lead.Status` value the transition moves to. Exact equality against the new value. | `SubscriberControlled` |
| `Is_Active__c` | Checkbox, default `true` | Whether the transition is currently allowed. Unchecking withdraws it while keeping the record. | `SubscriberControlled` |
| `Rule_Version__c` | Text(20) | Version recorded on records evaluated under this policy. | `SubscriberControlled` |

**Record semantics.** One record per allowed transition; **10 deployed**, all active at `v1.0`. The
policy is a **whitelist** — a pair absent from this type is not allowed, so silence is a refusal
rather than an omission. As with the other Custom Metadata here, there is **no relationship to
`Lead`**: `From_Stage__c` and `To_Stage__c` are compared by value against `Lead.Status` at evaluation
time.

✅ **Enforced since 2026-08-27.** `Lead_Inbound_Before_Save` reads these records on every
`Status` change and blocks a save whose pair is absent — including a save attempted through native
Salesforce Lead Conversion. No validation rule exists and the Flow holds no second copy of the
policy. The NorthstarIQ detective control that consumes *these* records rather than holding its
own copy is **Lifecycle Progression Integrity** (implemented, validated, deliberately
**unscored**). **Opportunity Conversion Integrity** asks a different question and reads none of
them: it compares `Lead.Status` against the platform’s own `IsConverted`, because whether a
transition was *permitted* and whether conversion actually *happened* are two separate facts.
Mechanism in [`architecture.md`](architecture.md) §3; evidence in
[`testing-strategy.md`](testing-strategy.md) §2i.

### `MQL_Qualification_Policy__mdt` — the governed definition of MQL

**This record *is* the MQL definition.** Reading it answers *"what is the MQL policy?"* without
reconstructing the answer from Flow branches.

| Field API name | Type | Meaning, from the artifact | Manageability |
|---|---|---|---|
| `Policy_Version__c` | Text(20) | The version stamped into `MQL_Basis__c`. | `SubscriberControlled` |
| `Qualified_Stage__c` | Text(40) | The exact `Lead.Status` value this policy governs. | `SubscriberControlled` |
| `Require_Governed_Source__c` | Checkbox | Qualification eligibility — the source must be governed. | `SubscriberControlled` |
| `Require_MQL_Eligible_Segment__c` | Checkbox | Qualification eligibility — the segment must be qualifiable. | `SubscriberControlled` |
| `Require_Routable_Territory__c` | Checkbox | Handoff readiness — coverage must be resolved. | `SubscriberControlled` |
| `Require_Unambiguous_Match__c` | Checkbox | Handoff readiness — the match state must not be ambiguous. | `SubscriberControlled` |
| `Is_Active__c` | Checkbox | Whether this version is in force. | `SubscriberControlled` |

**Records deployed: 2.** `NorthstarIQ MQL v1.1` **active**, governing `MQL`; `NorthstarIQ MQL v1.0
(superseded)` retained **inactive** as implementation history.

⚠️ **SYNTHETIC BASELINE.** Authored for reproducible demonstration of lifecycle governance. It is
**not** an originally validated client business requirement.

**Each flag declares that a requirement applies. It does not restate the requirement.**

| Requirement | Declared by | Defined by |
|---|---|---|
| Governed acquisition source | `Require_Governed_Source__c` | `Routing_Readiness_Source__mdt` — which sources |
| Segment eligible | `Require_MQL_Eligible_Segment__c` | `Segment_Band__mdt.MQL_Eligible__c` — which segments |
| Resolved governed coverage | `Require_Routable_Territory__c` | `Routing_Rule__mdt` → `Lead.Territory__c` |
| Unambiguous account match | `Require_Unambiguous_Match__c` | `Lead.Match_Status__c` |

**Two groups, one test.** Requirements 1–2 are **qualification eligibility** — is this the kind of
prospect the business qualifies? Requirements 3–4 are **handoff readiness** — can Sales actually
act on it? A resolved territory is not evidence of a good buyer; it is evidence that the handoff has
somewhere to land. All four must pass. There are no groups in the schema and no partial credit; the
distinction exists to explain the business logic, not to score it.

**Why this is still not a rules engine.** The requirement set is a **fixed schema of named
checkboxes** — no expressions, no field names, no operators, no weights, no nested groups, no JSON.
Adding a requirement is a schema change, deliberately: that is the line between a governed policy and
a configurable engine.

**Selection is deterministic.** The Flow looks the policy up by `Qualified_Stage__c` matching the
stage being entered, so a future SAL or SQL policy cannot be picked up by the MQL gate. Salesforce
cannot enforce *one active record per stage* on Custom Metadata, so the convention is enforced by the
**repository validator** instead, and the lookup is ordered by version descending so selection stays
defined even if the convention were broken. That is a governance convention, not a platform
guarantee — stated rather than implied.

### `Sales_Acceptance_Policy__mdt` — the governed definition of Sales acceptance

**A separate type from `MQL_Qualification_Policy__mdt`, deliberately.** That type is named for, and
scoped to, Marketing qualification. Stretching it to cover Sales acceptance would have started the
slide toward a generic lifecycle policy object. **Two small explicit types beat one abstract one.**

| Field API name | Type | Meaning, from the artifact | Manageability |
|---|---|---|---|
| `Policy_Version__c` | Text(20) | The version stamped into `Sales_Acceptance_Basis__c`. | `SubscriberControlled` |
| `Accepted_Stage__c` | Text(40) | The exact `Lead.Status` value this policy governs. | `SubscriberControlled` |
| `Require_Explicit_Acceptance__c` | Checkbox | Whether the seller must have ticked `Sales_Accepted__c`. | `SubscriberControlled` |
| `Require_MQL_Evidence__c` | Checkbox | Whether the Lead must carry substantiating MQL evidence. | `SubscriberControlled` |
| `Is_Active__c` | Checkbox, default `true` | Whether this version is in force. | `SubscriberControlled` |

**Record semantics.** **One record deployed** — `NorthstarIQ Sales Acceptance v1.0`, governing `SAL`,
active, both requirements declared.

⚠️ **SYNTHETIC BASELINE.** Authored for reproducible demonstration of lifecycle governance. It is
**not** an originally validated client business requirement.

**The second requirement is an evidence-chain check, not a re-evaluation.** `Require_MQL_Evidence__c`
asks only whether `MQL_Basis__c` is present — the SAL gate never re-tests source, segment, coverage or
match, so **the MQL definition is not duplicated here**. Whether that Marketing evidence still holds
is the business of the detective controls, not of a preventive gate running on one record — and
**Sales Acceptance / SQL Integrity** preserves the same boundary, consuming `MQL_Basis__c` as an
evidence-chain prerequisite and never re-testing what MQL Qualification Integrity owns.

**Selection is deterministic**, by `Accepted_Stage__c` matching the stage being entered, with the
same one-active-record-per-stage convention the MQL policy uses — enforced by the repository
validator rather than by the platform.

### `SQL_Qualification_Policy__mdt` — the governed definition of SQL

**The third narrowly scoped lifecycle policy type**, alongside `MQL_Qualification_Policy__mdt` and
`Sales_Acceptance_Policy__mdt`. Each models a genuinely different business decision, so each stays
explicit. ⚠️ **Architecture watch: if a fourth becomes necessary, review whether explicitness has
crossed into duplication before creating it.** Not refactored now.

| Field API name | Type | Meaning, from the artifact | Manageability |
|---|---|---|---|
| `Policy_Version__c` | Text(20) | The version stamped into `SQL_Basis__c`. | `SubscriberControlled` |
| `Qualified_Stage__c` | Text(40) | The exact `Lead.Status` value this policy governs. | `SubscriberControlled` |
| `Require_Acceptance_Evidence__c` | Checkbox | Whether SQL requires Sales acceptance evidence. | `SubscriberControlled` |
| `Require_Confirmed_Need__c` | Checkbox | Whether SQL requires a governed `Qualified_Need__c`. | `SubscriberControlled` |
| `Require_Next_Step__c` | Checkbox | Whether SQL requires a next-step date of today or later. | `SubscriberControlled` |
| `Is_Active__c` | Checkbox, default `true` | Whether this version is in force. | `SubscriberControlled` |

**Record semantics.** **One record deployed** — `NorthstarIQ SQL Qualification v1.0`, governing `SQL`,
active, all three requirements declared.

⚠️ **SYNTHETIC BASELINE.** Authored for reproducible demonstration of lifecycle governance. It is
**not** an originally validated client business requirement.

**Prior stages are consumed, never re-tested.** `Require_Acceptance_Evidence__c` checks only that
`Sales_Accepted_At__c` is present. The Sales Acceptance Policy is not re-run and the MQL policy is not
re-run — governed source, segment, territory and match state are **not** re-evaluated at SQL. A prior
stage is consumed through its evidence chain.

**The governed need vocabulary.**

| Value | The buyer problem it names |
|---|---|
| `Forecast Accuracy` | The prospect cannot trust its own forecast |
| `Pipeline Visibility` | The prospect cannot see the true state of its pipeline |
| `Revenue Reporting Consolidation` | The prospect gets different answers to the same revenue question |
| `Sales Process Governance` | The prospect cannot enforce a consistent sales process |

Derived from what the business case already states NorthstarIQ sells — revenue intelligence and
forecasting software — rather than invented as a new product taxonomy. It names the **buyer's
problem**, never a product, a contract scope, an intent score or a seller opinion.

**The remaining two types are automation configuration** — `Segment_Band__mdt` and `Routing_Rule__mdt`
are read by `Lead_Inbound_Before_Save`, not by the assessment, and their rule content is documented
in [`architecture.md`](architecture.md) §4 rather than repeated here.

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
| ICP scoring fields | 4 | `BR-17` deferred. **No scoring model will be invented to justify fields** — and `OD-03` was closed on 2026-08-27 by removing weighting entirely (`PD-14`), so no scoring field will ever be needed. |
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
