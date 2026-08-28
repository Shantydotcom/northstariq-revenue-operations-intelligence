# Security Model

| | |
|---|---|
| **Purpose** | Who can do what, why, and how that is proven |
| **Status** | 🟢 **OWD and 4 permission sets in source** · `NIQ_Revenue_Seller` **validated against a representative non-admin Seller principal** · `NIQ_Integration_Read` — effective read-only on the four assessed objects **proven by platform describe** (§4b), with a recorded finding that the principal is writable elsewhere · role hierarchy **not built** · `NIQ_Revenue_Operations` and `NIQ_Rule_Configuration` deployed but **unassigned** |
| **Related** | [`requirements.md`](requirements.md) · [`data-model.md`](data-model.md) · [`testing-strategy.md`](testing-strategy.md) |

---

## ⚠️ What Is Proven, and What Is Not

**Proven by execution (`BR-20`, `SP-5`).** `NIQ_Revenue_Seller` was assigned to a **representative
non-admin Seller principal**. Effective FLS is read-only on all 10 derived fields from **every**
grantor, and neither grantor holds `Modify All Data` or `View All Data`, so FLS is genuinely
enforced. Platform-computed `UserRecordAccess`: **3 of 42 Leads readable** — exactly the
`NIQ_North_America` queue records. Increments 3 and 4 were human-accepted as this persona.

**Also proven (2026-08-27, §4b).** The **effective** integration principal — profile plus every
assigned permission set, as the platform computes it — reports `createable`, `updateable` and
`deletable` all **false** on `Lead`, `Opportunity`, `Account` and `Contact`, with 0 of 56 visible
`Lead` fields writable. Established by sObject Describe, which cannot mutate a record; **no write was
attempted.**

**Not proven.** `NIQ_Revenue_Operations` and `NIQ_Rule_Configuration` are deployed but **unassigned
to any principal**, so nothing about them has been executed. The broad analytics principal described
in §4 still does not exist. The role hierarchy is **not built**. **No DML rejection has been
observed** — describe reports computed permission, not enforcement in flight.

**And one finding that runs the other way.** The same probe shows the integration principal **is**
writable on 133 other objects, including `LeadShare`, `OpportunityShare` and `AccountShare`. That is
licence and profile baseline, not `NIQ_Integration_Read`, and it is recorded in §4b and §10 rather
than smoothed over. Developer Edition provides four Salesforce licences, two
consumed by administrators — so only a **single** representative Seller was instantiated, and **no
multi-user behaviour has been tested.**

**An access model that has been designed has not been tested. An access model that has been reviewed
has not been tested.** Inspecting a permission set proves what was configured; executing an
operation as a user proves what was granted. These differ more often than anyone expects, and only
the second is evidence (`BR-20`).

---

## 1. Principles

Five principles, reduced from ten. Each one changes a design decision below.

### `SP-1` — Least privilege is the default; exceptions are justified

Access starts at nothing and is added deliberately. Every grant answers "what operational need
requires this?" A grant with no answer is removed, not documented.

### `SP-2` — Every capability is individually visible, grantable, and revocable

"Which capabilities does this person hold, and from where?" must be answerable. Additive grants make
over-provisioning visible; broad baseline profiles hide accumulation. This is why the model is
permission-set-first (`PD-10`).

### `SP-3` — Non-human principals are designed, not improvised

An integration or analytics principal gets its own scoped grant, never a shared one, and never
administrator-equivalent. **A single shared "integration access" grant widens every time a new need
appears**; per-function scoping forces each new need to justify itself.

### `SP-4` — Destructive and configuration capability is granted separately

Merge is irreversible. Writing to governed rule configuration changes behaviour for **every** record,
not one. Neither may be bundled into a role-shaped grant where a high-consequence capability becomes
invisible inside a routine one.

### `SP-5` — Access is verified by testing behaviour, in both directions

Negative assertions are the primary evidence. "Can the analytics principal read Leads?" matters
less than "can it write one?" A failed negative assertion blocks the access design from being called
complete.

---

## 2. Organization-Wide Defaults — Implemented and validated (Inc 1)

**Restrictive first, widened deliberately** (`PD-10`). A model built permissive and narrowed later
cannot answer why anyone has the access they have.

| Object | Deployed OWD (Inc 1) | Org value before Inc 1 | Rationale |
|---|---|---|---|
| Lead | **Private** | `ReadWriteTransfer` | Ownership is the entire point of the routing architecture. Public read would make misassignment invisible as a problem. |
| Account | **Private** | `ReadWrite` | Protects named and strategic relationships (`BR-07`) |
| Contact | **Controlled by Parent** | `ReadWrite` | Follows Account; a separate posture would create a path around Account visibility |
| Opportunity | **Private** | `ReadWrite` | Standard for a segmented sales organization |

**The org ships fully permissive.** All four are real changes, deployed as `<sharingModel>` in the
object metadata — source-controlled, not a Setup-UI-only click.

**Deployed and confirmed by metadata retrieve (Inc 1).** `Case` was additionally set to Private — a
platform-forced deviation, because Salesforce forbids a child of Account from holding a more
permissive sharing model than Account. Recorded in [`implementation-log.md`](implementation-log.md).

### The one genuine tension

**SDR/BDR prospecting versus Account visibility.** `PER-04` needs to know whether a company is
already a customer before prospecting into it (`PROB-002`) — but Private Account OWD hides exactly
that.

**Resolution:** expose customer status without exposing the Account record. `BR-03` already places
`Match_Status__c` and matched-Account context on the Lead the SDR owns. **The SDR reads the answer
on their own record, not by gaining access to someone else's.**

> This is the design decision this document exists to demonstrate. The instinct is to widen Account
> access. The better answer is to move the *answer* to where the user already has access, and leave
> the record alone.

---

## 3. Role Hierarchy — Candidate · **not built**

```
                 Executive
                     │
        ┌────────────┴────────────┐
   Sales Manager            Revenue Operations
        │
   Account Executive
   SDR / BDR
```

Minimal depth. Roll-up visibility only where a manager is accountable for the records below them.
**Depth is a cost**: every level is a sharing calculation and a troubleshooting hop.

**Seniority is not an access level.** An executive does not receive record edit rights because they
are senior; they receive report visibility because they are accountable for outcomes.

---

## 4. Permission Sets — Implemented (Inc 1) · 1 of 3 validated

**Three approved for Increment 1**, reduced from thirteen. Capability-based rather than
persona-based, so capabilities compose without duplication.

| Permission set | Grants | Personas |
|---|---|---|
| `NIQ_Revenue_Seller` | **Lead** Read + Edit · **Account** Read · `LightningExperienceUser` · read-only FLS on all derived fields | `PER-03`, `PER-04` |
| `NIQ_Revenue_Operations` | Cross-team record write; reassignment; exception and duplicate review resolution; queue work | `PER-01` |
| `NIQ_Rule_Configuration` | **Write to governed rule configuration** (Custom Metadata) | `PER-01` — **separately assigned** |
| ~~`NIQ_Analytics_Read`~~ | Broad read; no operational write | **DEFERRED to the analytics stage.** Not created now — future integration security must not be built before the integration exists. A `Salesforce Integration` licence (1 free, 0 used) is reserved for it. |
| `NIQ_Integration_Read` | **Read only**, on four objects, for the assessment application's non-human principal | The reserved integration licence, used narrower than the deferred analytics grant — **§4b** |

### Why `NIQ_Rule_Configuration` stands alone

**Changing a segmentation threshold is categorically different from editing a record.** Editing a
record changes one record. Changing a threshold changes behaviour for every record, retroactively
reshaping how the system routes. Bundling it into `NIQ_Revenue_Operations` would make a
high-consequence capability invisible inside a routine grant.

This separation costs one permission set and is the clearest security judgement in the design.

### What was consolidated away, and why

| Original | Disposition |
|---|---|
| `Lead_Working_Access` | Folded into `NIQ_Revenue_Seller` — no persona holds one without the other |
| `Customer_Status_Visibility` | **Unnecessary.** Resolved by data placement (§2), not by a grant. |
| `Duplicate_Review_Access`, `Exception_Resolution_Access` | Folded into `NIQ_Revenue_Operations` — same persona, same queue, same work |
| `Record_Merge_Capability` | **Deferred.** `BR-04` prohibits automated merge and `OD-01` leaves the legitimately-distinct population unknown. **No merge capability is granted in this release** — which is stricter than a separate permission set, not looser. |
| `Revenue_Reporting_Access` | Report access follows from record access plus standard report permissions |
| `Platform_Administration` | The System Administrator profile. `PER-05` is the practitioner. |
| `Integration_Lead_Capture` | **Deferred with scope.** No live capture integration exists (`DEC-014` dropped). |
| `Integration_Analytics_Read` | Merged into `NIQ_Analytics_Read`, which serves both the human analyst and the analytics principal with identical access |

**Permission Set Groups are not used in this release.** With three permission sets and a handful of
principals, the assignment saving does not justify a second layer to reason about during
troubleshooting. Revisit at scale, not here.

---

## 4b. `NIQ_Integration_Read` — implemented

**Reconciled from the permission-set artifact and read-only org queries on 2026-08-26.** The
original creation and assignment date is **not independently established** and is not asserted here.
Everything below is read from
[`NIQ_Integration_Read.permissionset-meta.xml`](../force-app/main/default/permissionsets/NIQ_Integration_Read.permissionset-meta.xml)
or observed live on that date.

**Purpose.** The scoped grant for the **non-human principal** that the NorthstarIQ assessment
application authenticates as. `SP-3` requires an integration principal to get its own grant rather
than a shared or administrator-equivalent one; this is that grant.

**It is the deferred `NIQ_Analytics_Read` reservation, materialised narrower.** §4 deferred that
permission set and reserved the free `Salesforce Integration` licence for it. This set carries
`license: SalesforceAPIIntegrationPsl` — the reserved licence — and grants read for **assessment**
only, not the broad analytics read that was described.

### What the artifact grants

| Object | Read | Create | Edit | Delete | View All Records | Modify All Records | View All Fields |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `Lead` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `Opportunity` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `Account` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `Contact` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

**`viewAllRecords` is granted, and that is a real widening — stated, not buried.** The assessment
measures a process across the whole org, so a sharing-limited view would silently shrink every
denominator and make the scores wrong rather than merely partial. It is bounded by what sits beside
it: `modifyAllRecords` is `false` on all four objects, `viewAllFields` is `false` on all four, and no
object outside these four is granted at all. **This is View All Records on four objects, not View
All Data.**

**Field access is enumerated, never inherited.** 23 `fieldPermissions` entries — 17 on `Lead`, 6 on
`Opportunity` — and **every one of them is `editable=false, readable=true`.** Because
`viewAllFields` is `false`, the principal reads the listed fields and no others. **No Contact or
Account field is granted at all**, which is why the Integrations screen counts those objects rather
than reading from them: `PII` is out of reach by construction, consistent with §7.

**Custom Metadata is scoped to exactly one type.** A single `customMetadataTypeAccesses` entry, for
`Routing_Readiness_Source__mdt`. Verified in both directions by read-only query on 2026-08-26:

| Query | Result |
|---|---|
| `SELECT Lead_Source__c FROM Routing_Readiness_Source__mdt WHERE Is_Active__c = true` | **3 records** — the granted type is readable |
| `SELECT Id FROM Segment_Band__mdt LIMIT 1` | **`INVALID_TYPE`** — a type that is not granted is not merely empty, it is invisible |
| `SELECT ... FROM PermissionSetAssignment LIMIT 20` | **`INVALID_TYPE`** — the principal cannot read the setup objects that describe its own access |

The negative results are the evidence, per `SP-5`.

**No system permission is granted.** The artifact contains **zero `<userPermissions>` elements**.
`View All Data`, `Modify All Data`, `View Setup and Configuration`, `Customize Application`,
`Manage Users`, `Author Apex` and Metadata/Tooling administration are absent — not disabled, absent.
The `PermissionSetAssignment` result above is consistent with that: a principal holding
`View Setup and Configuration` would be able to read it.

### The distinction that must not be blurred

**These are two separate guarantees with two separate proofs, and neither substitutes for the other.**

| | What it is | What proves it | What it does **not** prove |
|---|---|---|---|
| **Salesforce permission boundary** | This permission set confers no create, edit or delete on any object, and no field is editable through it | The artifact itself | **Not** the effective boundary of the identity. Permission sets are **additive**: the effective grant is the profile plus every assigned permission set. **The API-only integration profile is not in this repository** — only `Minimum Access - Salesforce` is — so the profile's contribution is **not established by repository evidence**, and no claim is made about it here. |
| **Application read-only behaviour** | The application has no write path at all | `web/lib/salesforce.ts` exports exactly one data operation, `query<T>(soql)`. Its only `POST` is the OAuth token request. The module contains **zero** references to `sobjects` or `composite` — the REST write endpoints. `server-only` makes importing it from browser code a build error. | **Not** a statement about what the Salesforce identity is permitted to do. An application with no write path proves nothing about the principal's permissions. |

**Do not read either row as the other.** The application performing only reads is a property of the
code; it would remain true if the principal were an administrator. The artifact granting no write is
a property of this permission set; it would remain true if the application were rewritten tomorrow.

### Known limitation — `Segment_Band__mdt` is not runtime-readable

Validated 2026-08-26. `SELECT Id FROM Segment_Band__mdt` returns **`INVALID_TYPE`** for this
principal, because the type is not among its `customMetadataTypeAccesses`.

**Consequence, carried through to the assessment.** Segment Assignment Consistency reports the
segmentation rule version **Salesforce recorded on the Lead** and does **not** runtime-reconcile that
version against the live Segment Band Custom Metadata. The application does not imply otherwise, and
[`implementation-log.md`](implementation-log.md) records the same limitation against that control.

**No permission was added to bypass this.** Granting a second Custom Metadata type to obtain a
display convenience would trade a real least-privilege boundary for a cosmetic one, and `SP-1` puts
the burden on the exception rather than on the default.

### Effective write boundary — established 2026-08-27, without a single write

**The gap this closes.** Salesforce access is **additive**: the effective grant is the profile plus
every assigned permission set. The `NIQ_Integration_Read` artifact shows what *it* grants; it cannot
show what the *principal* ends up with, and the API-only profile is not in this repository. Until
now this section said so and claimed nothing further.

**How it was closed without mutating anything.** The sObject Describe resource
(`GET /services/data/v67.0/sobjects/{Object}/describe`) returns `createable`, `updateable`,
`deletable`, `mergeable` and `undeletable` **as the platform computes them for the calling
principal** — the composed answer over profile and every assigned permission set. It is an HTTP
`GET`, carries no request body, and has no DML semantics: **it cannot mutate a record under any
permission configuration, including one where the principal unexpectedly holds write access.** That
property is what made it executable without approval. No `POST`, `PATCH` or `DELETE` was issued to
any sObject endpoint, and no record was created, altered, deleted or restored.

**What Salesforce reported — the four assessed objects.** Observed `2026-08-27T02:58:28Z`:

| Object | queryable | createable | updateable | deletable | mergeable | undeletable |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `Lead` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `Opportunity` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `Account` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `Contact` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

Field level, `Lead`: **56 fields visible, 0 reported `createable`, 0 reported `updateable`.**

**This is stronger than the artifact.** It is the platform's own computed answer over the whole
additive stack, not a reading of one permission set — so the profile's contribution is included in
it even though the profile itself is not in this repository.

### ⚠️ The principal is NOT write-incapable in general — and the difference matters

**A global describe of all 413 visible sObjects contradicts any org-wide read-only claim.** Observed
`2026-08-27T02:59:23Z`: **102 objects `createable`, 94 `updateable`, 105 `deletable`** — 133 distinct
objects writable in at least one respect.

None of it comes from `NIQ_Integration_Read`, which grants object permissions on four objects and
nothing else. It comes from the licence and profile baseline, which this repository does not
contain. The security-relevant rows:

| Object | Create | Update | Delete | Why it matters |
|---|:--:|:--:|:--:|---|
| `LeadShare` · `OpportunityShare` · `AccountShare` | ✅ | ✅ | ✅ | **Sharing rows are how record access is widened.** The principal cannot edit a Lead, but the platform reports it could write a sharing row for one. |
| `Note` · `Attachment` | ✅ | ✅ | ✅ | Content attached to records the principal can read |
| `ContentVersion` | ✅ | ✅ | ❌ | File content |
| `User` | ✅ | ✅ | ❌ | User records |
| `LeadFeed` · `AccountFeed` | ❌ | ❌ | ✅ | Feed items are deletable |
| `ContactShare` | ❌ | ❌ | ❌ | Not writable — the share objects are **not** uniformly open |
| `Task` · `Event` | — | — | — | **Not visible at all** |

**Recorded as a finding, not remediated.** Narrowing this is a profile change on the integration
identity, which is out of scope for a documentation increment and needs its own approval. It is
listed in §10.

### What may now be claimed, and what may not

| Claim | Status |
|---|---|
| `NIQ_Integration_Read` grants no create, edit or delete on any object | ✅ **Proven** by the artifact |
| The application performs read-only Salesforce data operations | ✅ **Proven** by `web/lib/salesforce.ts` — one exported data operation, `query<T>(soql)`; zero references to `sobjects` or `composite` |
| **The effective principal cannot create, update or delete `Lead`, `Opportunity`, `Account` or `Contact`** | ✅ **Proven** by platform describe, 2026-08-27 |
| The effective principal cannot write **anything** in Salesforce | ❌ **False.** 133 objects are writable in at least one respect |
| A write against an assessed object was attempted and rejected | ⬜ **Not established.** Describe reports the platform's computed permission; it is not an executed DML rejection. No write was attempted, by design. |
| The principal cannot invoke Apex, Flow, Metadata or Tooling operations | ⬜ **Not established.** Only sObject CRUD was probed. |

**"Designed for read-only" and "proven read-only" remain different claims,** and the second is now
true only with its object qualifier attached. Dropping the qualifier would make it false.

### Still not established

**Which principal holds this permission set, and what its profile grants, is not evidenced by this
repository.** The principal cannot read `PermissionSetAssignment`, and the API-only profile is not in
`force-app`. The describe evidence above establishes the **composed outcome** without establishing
its **composition** — it says what the principal effectively can and cannot do to the assessed
objects, not which grant is responsible.

---

### Lifecycle stage evidence — no principal writes it by hand

Verified in the permission-set artifacts, not assumed:

| Principal | `Lifecycle_Stage_Entered__c` | `MQL_Basis__c` | `Lifecycle_Transition__mdt` | `MQL_Qualification_Policy__mdt` |
|---|---|---|---|---|
| `NIQ_Integration_Read` | `readable=true`, **`editable=false`** | `readable=true`, **`editable=false`** | read | read |
| `NIQ_Revenue_Seller` | `readable=true`, **`editable=false`** | `readable=true`, **`editable=false`** | none | none |
| `NIQ_Revenue_Operations` | `readable=true`, **`editable=false`** | `readable=true`, **`editable=false`** | none | none |
| `NIQ_Rule_Configuration` | no FLS grant | no FLS grant | **write** | **write** |
| System Administrator | **no FLS grant at all** | **no FLS grant at all** | — | — |

⚠️ **`NIQ_Revenue_Operations` read was added to the repository on 2026-08-28 and is NOT DEPLOYED.** The two fields were the only system-generated Lead evidence this permission set could not read: it already reads `Segment_Basis__c`, `Routing_Reason__c`, `SLA_Basis__c`, `Sales_Acceptance_Basis__c` and `SQL_Basis__c`, all read-only. The gap was an omission from the increments that created these two fields, not a narrower grant by design — RevOps resolves routing exceptions and duplicate review, and the acceptance evidence it already reads *points at* MQL evidence it could not. `editable=false`, like every other evidence field: read to investigate, never to assert.

**The integration principal reads the policy, and now the segment bands too.** Granting
`Segment_Band__mdt` read to `NIQ_Integration_Read` (2026-08-27) is what makes the future **MQL
Qualification Integrity** control possible without recreating the business definition in TypeScript:
it can already read the active policy record, the governed source list and the transition policy, and
segment eligibility was the one governed input it could not see. Read-only, on configuration the
assessment is meant to reason about — no write was granted, and `NIQ_Rule_Configuration` remains the
only identity that can change any of it.

### Sales qualification — the same split, one stage later

| Principal | `Qualified_Need__c` · `Next_Step_Date__c` · `Next_Step__c` (inputs) | `SQL_Basis__c` (evidence) |
|---|---|---|
| `NIQ_Revenue_Seller` | `readable=true`, **`editable=true`** | `readable=true`, **`editable=false`** |
| `NIQ_Revenue_Operations` | `readable=true`, **`editable=true`** | `readable=true`, **`editable=false`** |
| `NIQ_Integration_Read` | `readable=true`, `editable=false` | `readable=true`, `editable=false` |

Sellers supply what they learned; they cannot write the record of why it was accepted as sufficient.
`NIQ_Integration_Read` also gained read on `SQL_Qualification_Policy__mdt`, so the future detective
control can read the governed definition rather than reimplementing it. No other Lead permission was
widened.

### Sales acceptance — the input is human, the evidence is not

| Principal | `Sales_Accepted__c` (input) | `Sales_Accepted_At__c` · `_By__c` · `Sales_Acceptance_Basis__c` (evidence) |
|---|---|---|
| `NIQ_Revenue_Seller` | `readable=true`, **`editable=true`** | `readable=true`, **`editable=false`** |
| `NIQ_Revenue_Operations` | `readable=true`, **`editable=true`** | `readable=true`, **`editable=false`** |
| `NIQ_Integration_Read` | `readable=true`, `editable=false` | `readable=true`, `editable=false` |

**This split is the whole security argument for the acceptance model.** A seller can *assert* an
acceptance — that is their decision to make — but cannot write who accepted, when, or under which
policy. Those come from the authenticated identity and the Flow clock, in system context. So
acceptance evidence can be **created** by a human decision and never **rewritten** by one, which is
what stop-condition 8 of this increment required.

RevOps holds the same shape rather than more: they may record an acceptance on behalf of the
business, and are equally unable to alter the resulting evidence.

**A seller cannot assert their own qualification evidence.** `MQL_Basis__c` is readable and not
editable wherever it is granted, so the reason a Lead is an MQL is written by the Flow or not at
all — Marketing cannot type a justification into it, and Sales cannot amend one. That is the whole
point of holding qualification evidence in a governed field rather than a note.

**Editable is false everywhere it is readable.** Both fields are written only by
`Lead_Inbound_Before_Save`, which runs in system context — so the stage timestamp is automation
evidence rather than a value a seller or an integration can assert. This is the same separation
`SP-4` applies to configuration capability, expressed as field-level access.

**The administrator running the CLI cannot read it.** A SOQL query for the field returns
`INVALID_FIELD`, because FLS was granted only to the three permission sets above and none of them is assigned to that administrator. Every assertion in
[`testing-strategy.md`](testing-strategy.md) §2i was therefore verified through the NorthstarIQ
integration identity — the same identity the assessment uses. Least privilege made the test harder
to write, which is the point.

**The policy is configuration, not runtime user input.** `Lifecycle_Transition__mdt` is readable by
the integration principal and writable only through `NIQ_Rule_Configuration`, which remains
**unassigned to any principal**. Nothing a user submits on a Lead can widen what transitions are
allowed.

**The assessment application still mutates nothing.** The governed lifecycle mutation is performed
by the Salesforce Flow during the user's own save. NorthstarIQ reads the result; it does not write
it, and §4b establishes that its principal could not write it if it tried.

---

## 5. Queues — Superseded by the implemented design

**Candidate design — 2 queues:** `Routing_Exception_Queue` for unassignable records;
`Data_Review_Queue` for match review, probable duplicate, unsegmentable and unnormalizable records.

**Implemented — 3 queues:**

| Queue | Holds | Worked by |
|---|---|---|
| `NIQ North America Coverage` | Routable Leads in NA-West and NA-East | `PER-03`, `PER-04` |
| `NIQ EMEA Coverage` | Routable Leads in UK-IE and DACH | `PER-03`, `PER-04` |
| `NIQ Routing Exception` | Unassignable records — no eligible destination, unmapped territory | `PER-01` |

Routing resolves to a **coverage queue** rather than to an individual seller, because round robin
(`BR-09`, `PD-07`) is deferred. `Data_Review_Queue` was **not built** — review states are carried by
`Match_Status__c` and `Exception_Type__c` on the record, which the reasoning below anticipated.

One exception queue, not five. Exception **class** is a field on the record, so list views filter by class
without a queue per class. Per-class ownership is `OD-04` — open, with all classes visible and owned
in the interim.

---

## 6. Per-Persona Access

| Persona | Permission sets | Can | Cannot |
|---|---|---|---|
| `PER-01` Revenue Operations | `NIQ_Revenue_Operations` (+ `NIQ_Rule_Configuration` where assigned) | Work any revenue record; reassign; resolve exceptions | Merge records; administer the platform; change access |
| `PER-02` Sales Manager | `NIQ_Revenue_Seller` + role roll-up | See and work team records; view SLA and distribution reports | Change routing rules or thresholds |
| `PER-03` Account Executive | `NIQ_Revenue_Seller` | Work owned records; log activity; convert | See others' records; change any governed rule |
| `PER-04` SDR / BDR | `NIQ_Revenue_Seller` | Work owned Leads; **see customer status on their own Lead** | Browse the Account base; see others' records |
| `PER-05` Salesforce Administrator | System Administrator | Configure and deploy | — (the practitioner; least-privilege applies to the model being built, not to the builder) |
| `PER-06` Data / BI Analyst | `NIQ_Analytics_Read` | Read revenue data for analysis | **Write any operational record** |
| Analytics principal (non-human) | `NIQ_Analytics_Read` | Read for extraction | **Write anything; administer anything** |

---

## 7. PII and Field-Level Access

| Field | Classification | Access |
|---|---|---|
| `Email`, `Phone`, `MobilePhone` on Lead and Contact | **PII** | Sellers on owned records; Revenue Operations; **analytics principal read is justified only for match and dedup analysis** |
| Name, Title, Company | Business contact data | Standard record access |
| Derived and decision fields (`Segment__c`, `Routing_Reason__c`, `Match_Basis__c`) | Operational, non-PII | Readable wherever the record is readable — **explainability requires visibility** |

**All data is synthetic and fictional.** The classification exists because the *design* must be
correct. **No real personal data enters this repository or the org.**

---

## 8. Verification Approach

Access is proven by execution, never by inspection (`BR-20`, `SP-5`).

| Step | What is done |
|---|---|
| 1 | Create a test user per persona with only the intended permission sets |
| 2 | Execute the positive matrix — each persona performs what they must be able to do |
| 3 | Execute the **negative matrix** — each persona attempts what they must not be able to do |
| 4 | Record results with date and org state in [`implementation-log.md`](implementation-log.md) |
| 5 | A failed negative assertion blocks the model from being called verified |

**Negative assertions are the primary evidence.** The full matrix is in
[`testing-strategy.md`](testing-strategy.md) §5.

---

## 8b. Representative Seller — implemented

One user, `NIQ Seller`, on **Minimum Access - Salesforce** plus `NIQ_Revenue_Seller`. No role. Member
of `NIQ_North_America` only. Consumes 1 of 4 Salesforce licences (3 used, 1 free).

| Grant | Justification |
|---|---|
| Lead **Read** | View records routed to their coverage queue (`BR-08`) |
| Lead **input FLS** — `Website`, `NumberOfEmployees`, `Address` | Seller-maintained business inputs. `Address` is the **compound** field: its components (Street, City, State, PostalCode, Country, and the State/Country picklists) are **not individually permissionable**, so one grant covers all of them. |
| Lead **Edit** | Maintain seller-owned business inputs (`BR-18`) |
| Account **Read** | So `Matched_Account__c` can resolve |
| `LightningExperienceUser` | `Minimum Access - Salesforce` does not grant it, so the user opened in Classic. Added to the permission set, **not** by changing profile. |
| **Create / Delete — withheld everywhere** | No requirement or test calls for them |
| Contact / Opportunity — **not granted** | No Increment 3 test needs them |

**Verified:** the seller's effective FLS is read-only on all 10 derived fields from **every** grantor,
and neither grantor holds `Modify All Data` or `View All Data` — so FLS **is** enforced for them.
Platform-computed `UserRecordAccess`: **3 of 42 Leads readable**, exactly the `NIQ_North_America`
queue records.

> ### Page-layout assignment is profile-scoped — a permission set cannot do it
>
> Granting Lead access through `NIQ_Revenue_Seller` did **not** give the profile a Lead page-layout
> assignment, because **layout assignment exists only on Profiles**. `Minimum Access - Salesforce`
> ships with no Lead assignment (it normally has no Lead access), so Lightning failed to render the
> record page:
>
> *"One or more profiles have no page layout assigned for the 'Lead' Object."*
>
> **This is the boundary of the permission-set-first model.** Capability is grantable by permission
> set; **presentation assignment is not.** `Minimum Access - Salesforce` therefore carries exactly one
> declared element in source — the Lead layout assignment — and no permissions. Profile deployments
> are partial, so nothing else on the profile is touched.
>
> `Account` still has no layout assignment on this profile. **Deliberately left alone:** the Seller has
> 0 record access to Accounts under Private OWD and never opens an Account detail page, so it cannot
> manifest in the approved Increment 3 experience.

> ### FLS is granted per *permissionable* field, and compounds are one unit
>
> `NIQ_Revenue_Seller` originally granted FLS on the ten **derived** fields and none of the **inputs**.
> The inputs were on the layout but invisible to the Seller. The Admin never saw this because the
> System Administrator profile carries FLS on standard fields by default.
>
> Two platform constraints surfaced while fixing it:
>
> | Attempted | Rejected because |
> |---|---|
> | `Lead.StateCode`, `Lead.CountryCode` | With State/Country picklists enabled these are **not FLS-permissionable**; the base fields govern them |
> | `Lead.Street`, `City`, `State`, `Country`, `PostalCode` | All are components of the **compound `Lead.Address`**, which is the permissionable unit |
>
> The correct grant is therefore **three rows** — `Website`, `NumberOfEmployees`, `Address` — delivering
> exactly the seven approved logical fields. **PII (`Email`, `Phone`, `MobilePhone`) remains ungranted.**

> ### SLA fields follow the same authority model
>
> All four SLA fields are **system-derived**: read for both `NIQ_Revenue_Seller` and
> `NIQ_Revenue_Operations`, **editable by neither**. Sellers must *see* their deadline - that is the
> point of `BR-12` - but no principal may write it. Object CRUD, OWD, sharing, roles, queues and
> profiles are unchanged.

> ### Known limitation — Account visibility
> Under `Account` OWD = **Private**, the Seller holds Account **object** Read but has **no
> record-level access** to Accounts they do not own — 0 of 13. `Matched_Account__c` may therefore
> render blank rather than a resolvable Account name.
>
> **Deliberately not remediated.** No sharing rule, role, View All, wider OWD, or Account team was
> added. For Increment 3, `Routing_Reason__c` is the primary seller-facing explainability mechanism.
> Revisit only if the demo shows this materially damages usability.

---

## 9. Developer Edition Constraints

| Constraint | Consequence |
|---|---|
| Limited user licences | 4 Salesforce licences, 2 consumed by administrators. Access is **validated against a representative non-admin Seller principal** — 1 user, not 64. Platform licences (6 free) cannot access Lead or Opportunity. |
| No Shield / field audit trail | Standard field history tracking only |
| Standard sharing features only | No criteria-based sharing beyond what the edition provides |
| Single org | The access model is tested where it is built; no promotion path |

**The model is designed for the enterprise case and validated against a representative non-admin
Seller principal.** One user is not multi-user scale testing, and none is claimed. Where design and
demonstration differ, the gap is stated — never substituted silently.

---

## 10. What Remains Open

| Item | Status |
|---|---|
| Per-class exception queue ownership | `OD-04` — all classes visible and owned in the interim |
| Coverage for an absent or ineligible seller | `OD-02` — eligibility flag exists; ineligible sellers are skipped and the skip is recorded |
| Merge policy | `OD-01` — **no merge capability granted in this release** |
| Number of integration principals | Depends on integrations that do not exist in this scope |
| Round-robin distribution | `BR-09`, `PD-07` — **deferred.** The three `User` routing fields are deployed and FLS-granted to `NIQ_Revenue_Operations`, but **no automation consumes them.** Territory coverage routes to a queue. |
| `NIQ_Revenue_Operations` · `NIQ_Rule_Configuration` | **Deployed, unassigned.** Neither has been executed as a principal, so neither is validated. |
| **Integration principal writable on 133 non-assessed objects** | **Open finding, 2026-08-27.** Platform describe reports create/update/delete on `LeadShare`, `OpportunityShare`, `AccountShare`, `Note`, `Attachment`, `ContentVersion` and `User`, among others. **Not granted by `NIQ_Integration_Read`** — it is licence and profile baseline. Narrowing it is a profile change on the integration identity and **needs its own approval**; it was not attempted here. Sharing rows are the material item: they are how record access widens. |
| DML rejection against an assessed object | **Never attempted.** Describe reports computed permission, not enforcement in flight. A real negative write test would need explicit approval and a target that cannot be mutated if the permission assumption is wrong. |
