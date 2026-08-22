# Access Model

| Field | Value |
|---|---|
| **Document** | Access Model |
| **Phase** | 0C — Requirements & Governance |
| **Status** | **Open Decision** — candidate model and recommendation only |
| **Implementation State** | Target State |
| **Related** | `BR-053`–`BR-058`, `BR-012`, `BR-052` · `DEC-021` · [`security-principles.md`](security-principles.md) · [`../requirements/personas.md`](../requirements/personas.md) |

---

> ⚠️ **Nothing in this document is approved, configured, or implemented.**
>
> `DEC-021` is `Open`. This document presents a candidate model and a **recommendation** so the
> decision can be made on analysis rather than on defaults. **A recommendation is not a decision.**
>
> **No org security has been modified. No Permission Set, Profile, sharing rule, OWD, role, or Queue
> exists in this repository.**

---

## 1. Purpose

`BR-053` requires a documented access model stating, for each persona, what access is granted and the
business justification for it. This document is the vehicle for that requirement — and it is the
documentation that *is* the control. Undocumented access cannot be reviewed, and grants nobody can
justify are never revoked.

---

## 2. What Has and Has Not Been Established

| Established | Not established |
|---|---|
| 17 personas and their operational needs | Any current-state Salesforce access configuration |
| Genuine access tensions per persona | Whether current access is appropriate — **nothing inspected** |
| Which capabilities are destructive | OWD, role hierarchy, sharing design |
| That `PER-17` must not be administrator-equivalent | Whether one integration principal or several |
| PII classification obligations | Whether German-market records constrain field access |

---

## 3. Candidate Organization-Wide Defaults

> **Requires `DEC-021`. The rationale column states the trade-off; it does not resolve it.**

| Object | Candidate OWD | Rationale | Tension |
|---|---|---|---|
| Lead | Private | Ownership is the routing outcome; visibility should follow it | **`PER-07`** unassigned-pool visibility; **`PER-08`** customer checking |
| Account | Private or Public Read Only | `PER-08` must check customer status before outreach | **The central OWD decision** — see §4 |
| Contact | Controlled by Parent | Contact visibility should follow Account | — |
| Opportunity | Private | Commercially sensitive; ownership-driven | Manager roll-up via hierarchy |
| User | Public Read Only | Routing and eligibility require reading seller attributes | — |
| Governed rule configuration | Read for most; write narrowly granted | Rules are operational data, not record data | Who may change them |

**Each row is a candidate. None is approved.**

---

## 4. The Central Tension — `PER-08` and Account Visibility

**This is the decision that shapes the rest of the model**, and it has no obviously correct answer.

`PER-08` (BDR, 8 people) prospects outbound. Before investing effort, they must know whether a target
organization is already a customer, in an open Opportunity, or owned by another seller. This is not a
convenience — `PROB-002` records that prospecting into existing customers is both a customer-experience
failure and a direct threat to the expansion motion that produces **44% of new ARR**.

| Option | Consequence for `PER-08` | Consequence for least privilege |
|---|---|---|
| **Account Private** | Cannot check customer status. **Prospects blind** — the current failure persists | Strongest model |
| **Account Public Read Only** | Can check freely | Every seller sees every Account |
| **Private + sharing rule to prospecting personas** | Can check | Widening is deliberate and documented |
| **Private + a purpose-built customer-status check** | Can check status **without** seeing Account detail | Most precise; **most to build and maintain** |

**Analysis.** Option 4 is the most precise least-privilege answer and directly serves `PER-08`'s
actual need — which is a *status answer*, not Account access. But it is a build, and at a 1:64
administrator ratio (`PROB-018`) build cost is a first-order constraint, not a detail.

Option 1 is the strongest security posture and **preserves the business problem**, which is not a
neutral outcome.

**This is a genuine business trade-off between security posture and revenue protection. It requires a
human decision.**

---

## 5. Candidate Role Hierarchy

> **Requires `DEC-021`.** Shape derived from the Known Context org structure.

```
VP Sales
├── Sales Manager — Enterprise ──> Enterprise AE (East · Central · West)
├── Sales Manager — Mid-Market ──> Mid-Market AE (East · West)
├── Sales Manager — SMB        ──> SMB AE (round-robin pool)
├── SDR/BDR Manager            ──> SDR · BDR
└── Strategic AE                   (reports to VP Sales directly)

VP Revenue Operations
├── Revenue Operations
├── Sales Operations
├── Salesforce Administrator
└── Data / BI Analyst
```

**Design notes.**

1. The hierarchy mirrors the **business** reporting structure; it is not a permission mechanism. Roles
   provide record roll-up visibility, capabilities come from Permission Sets.
2. **Strategic AE reports to VP Sales directly** — consistent with the org structure, and it means
   Strategic records do not roll up through a segment manager.
3. Operations personas sit **outside the sales hierarchy**. Their cross-cutting access comes from
   Permission Sets and sharing, not from hierarchy position — which keeps `PER-10`'s broad access
   visible and revocable rather than structural.
4. **Portfolio implementation demonstrates at least two levels**, not the full structure.

---

## 6. Candidate Permission Set Structure

Capability-based rather than persona-based, so capabilities compose without duplication.

| Candidate Permission Set | Grants | Personas |
|---|---|---|
| `Revenue_Record_Access` | Standard object read/write on owned records | All seller and pipeline personas |
| `Lead_Working_Access` | Lead work, activity logging, conversion | `PER-07`, `PER-08`, sellers |
| `Customer_Status_Visibility` | Read customer status for prospecting checks | `PER-08` — **subject to §4** |
| `Revenue_Operations_Access` | Cross-team record write, reassignment | `PER-10`, `PER-11` |
| `Governed_Rule_Configuration` | **Write to governed rule configuration** | `PER-10` — *separately grantable* |
| `Duplicate_Review_Access` | Duplicate review and resolution workflow | `PER-11` |
| `Record_Merge_Capability` | **Merge — destructive** | Narrowly granted (`BR-012`, `SP-07`) |
| `Exception_Resolution_Access` | Exception queue work | `PER-10`, `PER-11` |
| `Revenue_Reporting_Access` | Report and dashboard consumption | Leadership personas |
| `Analytics_Read_Access` | Broad read, **no operational write** | `PER-14`, analytics principal |
| `Platform_Administration` | Configuration and access administration | `PER-13` |
| `Integration_Lead_Capture` | Scoped Lead create/update | `PER-17` — capture integration |
| `Integration_Analytics_Read` | Scoped read for extraction | `PER-17` — analytics principal |

### Three deliberate separations

| Separation | Why |
|---|---|
| **`Governed_Rule_Configuration` is separate from `Revenue_Operations_Access`** | Changing a segmentation threshold is categorically different from editing a record — it changes behaviour for **every** record. Bundling them would make a high-consequence capability invisible inside a routine grant. |
| **`Record_Merge_Capability` stands alone** | Merge is irreversible, and while `DEC-004` is open the legitimately-distinct population is unknown (`SP-07`) |
| **Integration Permission Sets are per-integration** | A single "integration access" set drifts toward administrator-equivalence as integrations are added — each new need widens the existing grant rather than creating a scoped one |

**Whether Permission Set Groups are used per persona is part of `DEC-021`.** They reduce assignment
effort — valuable at a 1:64 ratio — at the cost of a second layer to reason about when troubleshooting.

---

## 7. Candidate Queues

| Candidate Queue | Purpose | Requirement |
|---|---|---|
| `Routing_Exception_Queue` | Records that could not be assigned | `BR-033` |
| `Unsegmentable_Record_Queue` | Records lacking segmentation inputs | `BR-026` |
| `Match_Review_Queue` | Review-band identity outcomes | `BR-008` |
| `Duplicate_Review_Queue` | Probable duplicates awaiting review | `BR-010` |
| `Data_Quality_Exception_Queue` | Records failing validation or normalization | `BR-001` |

**Queue ownership per class is `DEC-019`.** Queues are named here because `BR-044` requires exceptions
to be visible and owned; **who owns each is not decided.**

---

## 8. Per-Persona Access Summary

> **Candidate only.** Every row requires `DEC-021`.

| Persona | Object access | Notable capability | Justification |
|---|---|---|---|
| `PER-01` VP Sales | Read via hierarchy | Reporting | Coverage and attainment oversight |
| `PER-02` Sales Manager | Team read/write via hierarchy | Reassignment | Arbitrates ownership; monitors SLA |
| `PER-03` Strategic AE | Owned Accounts + family | — | Named-account depth |
| `PER-04`–`PER-06` AEs | Owned records | — | Work assigned records |
| `PER-07` SDR | Assigned Leads | Conversion, activity | Inbound qualification |
| `PER-08` BDR | Assigned + **customer status** | Status visibility | **Prospecting safety — §4** |
| `PER-09` SDR/BDR Manager | Team read/write | SLA data | Owns SLA attainment |
| `PER-10` Revenue Operations | Broad write | **Rule configuration** | Owns routing, segmentation, lifecycle governance |
| `PER-11` Sales Operations | Cross-team write | Duplicate review; **merge narrowly** | Exception and remediation work |
| `PER-12` Marketing Ops | Lead source/campaign write | — | Owns source data and MQL handoff |
| `PER-13` Administrator | Full | **Full configuration** | Platform ownership |
| `PER-14` Data / BI Analyst | **Broad read, no write** | Reporting | Analytics requires no record modification |
| `PER-15` Marketing Leadership | Reports only | — | Pipeline contribution visibility |
| `PER-16` Executive Leadership | Curated analytics | — | **Seniority is not an access level** (`SP-06`) |
| `PER-17` Integration User | **Scoped per integration** | API only | Never administrator-equivalent (`BR-055`) |

---

## 9. Recommendation for `DEC-021`

> **This section is analysis with a proposed direction. It is NOT a decision, and `DEC-021` remains
> `Open`. Approval requires a recorded human decision with an approver and date.**

**Recommended: a permission-set-first model** — Profiles carry the minimum; business capability is
granted additively through capability-based Permission Sets composed per persona.

| Reason | Detail |
|---|---|
| **Administrator capacity** | A single administrator at a 1:64 ratio cannot maintain per-user permission assembly (`PROB-018`) |
| **Auditability** | Additive grants make over-provisioning visible; Profile grants hide accumulation |
| **Change safety** | Permission Sets are source-controllable, diffable, and reviewable (`PROB-016`, `BR-058`) |
| **Explainability** | "Which capabilities does this user hold, and from where?" becomes answerable |
| **Existing posture** | The repository `.forceignore` already reflects this stance |

**Also recommended:**

1. **Restrictive OWD with deliberate, documented widening** rather than permissive defaults narrowed
   later. A model built permissive-first cannot answer "why does this person have this access?"
2. **Per-integration Permission Sets** rather than one shared integration grant, which drifts toward
   administrator-equivalence as integrations accumulate.
3. **Destructive and configuration capabilities separately grantable** — merge and governed-rule write
   are not bundled into role-shaped grants.
4. **Access verified by testing in both directions**, with negative assertions treated as the primary
   evidence (`BR-057`).

### What the recommendation deliberately does NOT cover

| Not recommended here | Why |
|---|---|
| **OWD per object** | Depends on the `PER-08` trade-off in §4 — a business judgement about security posture versus revenue protection, with no technically correct answer |
| Role hierarchy depth | Depends on how much roll-up visibility leadership genuinely needs |
| Whether Permission Set Groups are used | A real maintenance trade-off at this ratio |
| Number of integration principals | Depends on how many integrations exist — itself unresolved (`DEC-014`, `DEC-015`, `DEC-020`) |
| Who may change governed rule configuration | A governance question with an integrity consequence |
| SDR unassigned-pool visibility | Affects routing measurement integrity, not only access |

> **The mechanism is recommendable; the posture is not.** The permission-set-first mechanism is
> defensible on maintainability and auditability grounds independent of any business judgement. The
> OWD posture is a genuine business trade-off, and recommending one would be substituting an
> engineering preference for a decision that belongs to the business.

---

## 10. Verification Approach

`BR-057` requires the model to be tested. Candidate approach:

| Test class | Assertion |
|---|---|
| **Positive** | Each persona can perform each documented capability |
| **Negative** | Each persona **cannot** perform at least one adjacent capability they should not hold |
| Hierarchy | A manager sees subordinate records; a peer does not |
| Sharing | Widening behaves as designed and no further |
| FLS | PII field visibility matches documented justification per persona |
| Integration | Each principal performs its required operations **and no others** |
| Destructive | A persona without `Record_Merge_Capability` cannot merge |

**Evidence.** A test matrix with `Actual Result` populated by a real run. **Documentation is never
sufficient evidence** — and negative assertions carry the security weight.

---

## 11. What This Document Does Not Do

- ❌ It does not assert any current-state access defect at NorthstarIQ.
- ❌ It does not approve `DEC-021`.
- ❌ It does not decide OWD, role hierarchy, or sharing design.
- ❌ It does not create or modify any Salesforce security metadata.
- ❌ It does not claim any access has been configured, granted, or tested.
- ❌ It does not claim GDPR compliance.
