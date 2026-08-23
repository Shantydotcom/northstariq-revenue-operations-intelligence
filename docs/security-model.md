# Security Model

| | |
|---|---|
| **Purpose** | Who can do what, why, and how that is proven |
| **Status** | 🟢 Org inspected 2026-08-22 · **3 permission sets + OWD approved for Increment 1** · nothing built, nothing tested |
| **Related** | [`requirements.md`](requirements.md) · [`data-model.md`](data-model.md) · [`testing-strategy.md`](testing-strategy.md) |

---

## ⚠️ Explicit Non-Assertion

**Nothing in this document has been implemented or verified.**

This project may not claim that access is secure, correctly configured, or verified until
permission sets exist in the org and the negative test matrix in
[`testing-strategy.md`](testing-strategy.md) has been executed with recorded results.

**An access model that has been designed has not been tested. An access model that has been reviewed
has not been tested.** Inspecting a permission set proves what was configured; executing an
operation as a user proves what was granted. These differ more often than anyone expects, and only
the second is evidence (`BR-20`).

What can honestly be stated today: a model has been designed, its rationale is recorded, and the
verification approach is defined.

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

## 2. Organization-Wide Defaults — Candidate

**Restrictive first, widened deliberately** (`PD-10`). A model built permissive and narrowed later
cannot answer why anyone has the access they have.

| Object | Approved OWD (Inc 1) | Current org value | Rationale |
|---|---|---|
| Lead | **Private** | `ReadWriteTransfer` | Ownership is the entire point of the routing architecture. Public read would make misassignment invisible as a problem. |
| Account | **Private** | `ReadWrite` | Protects named and strategic relationships (`BR-07`) |
| Contact | **Controlled by Parent** | `ReadWrite` | Follows Account; a separate posture would create a path around Account visibility |
| Opportunity | **Private** | `ReadWrite` | Standard for a segmented sales organization |

**The org ships fully permissive.** All four are real changes, deployed as `<sharingModel>` in the
object metadata — source-controlled, not a Setup-UI-only click.

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

## 3. Role Hierarchy — Candidate

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

## 4. Permission Sets — Candidate

**Three approved for Increment 1**, reduced from thirteen. Capability-based rather than
persona-based, so capabilities compose without duplication.

| Permission set | Grants | Personas |
|---|---|---|
| `NIQ_Revenue_Seller` | **Lead** Read + Edit · **Account** Read · `LightningExperienceUser` · read-only FLS on all derived fields | `PER-03`, `PER-04` |
| `NIQ_Revenue_Operations` | Cross-team record write; reassignment; exception and duplicate review resolution; queue work | `PER-01` |
| `NIQ_Rule_Configuration` | **Write to governed rule configuration** (Custom Metadata) | `PER-01` — **separately assigned** |
| ~~`NIQ_Analytics_Read`~~ | Broad read; no operational write | **DEFERRED to the analytics stage.** Not created now — future integration security must not be built before the integration exists. A `Salesforce Integration` licence (1 free, 0 used) is reserved for it. |

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

**Permission Set Groups are not used in this release.** At 8–10 users the assignment saving does not
justify a second layer to reason about during troubleshooting. Revisit at scale, not here.

---

## 5. Queues — Candidate

| Queue | Holds | Worked by |
|---|---|---|
| `Routing_Exception_Queue` | Unassignable records — no eligible seller, unmapped territory | `PER-01` |
| `Data_Review_Queue` | Match review, probable duplicate, unsegmentable, unnormalizable | `PER-01` |

Two queues, not five. Exception **class** is a field on the record, so list views filter by class
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
| Limited user licenses | Persona coverage is demonstrated with 8–10 users, not 64 |
| No Shield / field audit trail | Standard field history tracking only |
| Standard sharing features only | No criteria-based sharing beyond what the edition provides |
| Single org | The access model is tested where it is built; no promotion path |

**The model is designed for the enterprise case and demonstrated at portfolio scale.** Where the two
differ, the gap is stated — never substituted silently.

---

## 10. What Remains Open

| Item | Status |
|---|---|
| Per-class exception queue ownership | `OD-04` — all classes visible and owned in the interim |
| Coverage for an absent or ineligible seller | `OD-02` — eligibility flag exists; ineligible sellers are skipped and the skip is recorded |
| Merge policy | `OD-01` — **no merge capability granted in this release** |
| Number of integration principals | Depends on integrations that do not exist in this scope |
