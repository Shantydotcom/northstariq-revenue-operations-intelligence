# Security Model

| | |
|---|---|
| **Purpose** | Who can do what, why, and how that is proven |
| **Status** | 🟡 **CANDIDATE** — no org inspected, no permission set built, nothing tested |
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

| Object | Candidate OWD | Rationale |
|---|---|---|
| Lead | **Private** | Ownership is the entire point of the routing architecture. Public read would make misassignment invisible as a problem. |
| Account | **Private** | Protects named and strategic relationships (`BR-07`) |
| Contact | **Controlled by Parent** | Follows Account; a separate posture would create a path around Account visibility |
| Opportunity | **Private** | Standard for a segmented sales organization |

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

**Four, reduced from thirteen.** Capability-based rather than persona-based, so capabilities compose
without duplication.

| Permission set | Grants | Personas |
|---|---|---|
| `NIQ_Revenue_Seller` | Read/write on owned Leads, Accounts, Contacts, Opportunities; activity logging; lead conversion | `PER-03`, `PER-04` |
| `NIQ_Revenue_Operations` | Cross-team record write; reassignment; exception and duplicate review resolution; queue work | `PER-01` |
| `NIQ_Rule_Configuration` | **Write to governed rule configuration** (Custom Metadata) | `PER-01` — **separately assigned** |
| `NIQ_Analytics_Read` | Broad read across revenue objects; **no operational write** | `PER-06` and the analytics principal |

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
