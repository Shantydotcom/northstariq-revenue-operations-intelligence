# Change Management

| Field | Value |
|---|---|
| **Document** | Change Management |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Implementation State** | Target State |
| **Related** | `BR-058`, `BR-059`–`BR-062` · [`decision-governance.md`](decision-governance.md) · [`naming-conventions.md`](naming-conventions.md) |

---

> ⚠️ **No release process currently exists at NorthstarIQ.** Whether metadata is source-controlled or
> a sandbox is used **has not been confirmed** (`PROB-016`, evidence status **To Be Validated**). This
> document describes a **Target State** process. Nothing here describes how changes are made today.

---

## 1. Why This Is a Primary Workstream

From `PROB-016`, root-cause significance:

> **Weak change management is what allowed the operational debt to accumulate in the first place.**
> Without governance, each growth phase could add behaviour with nobody accountable for consolidating
> it.

The consequence for this project is direct:

> **Fixing routing without fixing change management would guarantee the same accumulation recurs.**

This is why change management is a requirement (`BR-060`, **P0**) rather than an administrative
appendix. It is the requirement that prevents this project's own output from becoming the next
generation of operational debt.

### The constraint that shapes it

One Salesforce Administrator supports 64 revenue users across ~9 years of accumulated configuration
(`PROB-018`). **A process too heavy for one person to follow will not be followed.** Every design
choice below weighs governance value against the cost `PER-13` must actually bear.

---

## 2. The Change Lifecycle

```
Business Need
    │  a persona cannot do something they need to
    ▼
Requirement                        BR-### — states the outcome, not the solution
    │
    ▼
Decision                           DEC-### where a business rule must be chosen
    │                              ══ HUMAN DECISION BOUNDARY ══
    ▼
Design                             ADR where architecturally significant
    │
    ▼
Development                        configuration or metadata
    │
    ▼
Source Control                     branch, commit citing BR-###
    │
    ▼
Validation                         does it do what the requirement says?
    │
    ▼
Testing                            TEST-### with Actual Result populated by a real run
    │
    ▼
Approval                           human; recorded
    │
    ▼
Deployment
    │
    ▼
Post-Deployment Validation         verify in the target, not assume
    │
    ▼
Documentation                      part of the change, not after it
    │
    ▼
Operational Monitoring             does it keep working?
```

### Two properties that make it real

**Documentation is inside the loop, not after it.** Documentation produced separately from work always
drifts, because the incentive to update it disappears once the work is done (`PROB-017`, `BR-061`). A
change is not complete until its documentation is current.

**Monitoring closes the loop.** A change that works on deployment day and silently fails a month later
is indistinguishable from one that never worked, unless something is watching (`BR-045`).

---

## 3. Stage Definitions

| Stage | Produces | Gate |
|---|---|---|
| **Business Need** | A stated capability gap with an affected persona | Is there a real persona need? |
| **Requirement** | `BR-###` stating an outcome | Does it state an outcome, not a solution? |
| **Decision** | `DEC-###` resolution where a rule must be chosen | **Is every dependent decision `Accepted`?** |
| **Design** | Approach; ADR where significant | Is it the simplest approach meeting the requirement? |
| **Development** | Configuration or metadata | Does it cite its `BR-###`? |
| **Source Control** | Branch and commits | Is the change reviewable as a diff? |
| **Validation** | Confirmation against acceptance criteria | Does it satisfy every criterion? |
| **Testing** | `TEST-###` with `Actual Result` | Do negative and boundary cases pass? |
| **Approval** | Recorded human approval | Has a human approved deployment? |
| **Deployment** | Change in the target org | Did deployment succeed completely? |
| **Post-Deployment Validation** | Verification in the target | Does it behave correctly **there**? |
| **Documentation** | Updated docs and traceability | Is intended behaviour determinable without reading logic? |
| **Monitoring** | Observability | Would failure be visible? |

### The gate that matters most

> **"Is every dependent decision `Accepted`?"**
>
> A change implementing a rule that no human approved is the failure this repository's governance
> exists to prevent. Once built, tested against its own invented expectation, and deployed, the
> fabrication is indistinguishable from a real requirement — and is now expensive to reverse.

---

## 4. Change Classification

| Class | Examples | Path |
|---|---|---|
| **Configuration data** | Threshold, territory mapping, pool membership, holiday calendar | Full path; **no deployment required** (`BR-059`) |
| **Metadata** | Field, Flow, validation rule, page layout | Full path, deployment required |
| **Access** | Permission Set, sharing rule, OWD | Full path **plus** access verification (`BR-057`, `BR-058`) |
| **Data** | Import, bulk correction | Full path; provenance recorded |
| **Emergency** | Production-impacting fault | Expedited; **retrospectively reviewed** |

**Configuration-data changes are the point of `BR-059`.** Because they need no deployment, the
governed rules `PER-10` most often needs to change become the *cheapest* to change safely — while
still being source-controlled, diffable, and reviewable. This is what makes the process sustainable
at a 1:64 administrator ratio.

**Access changes get an extra gate deliberately.** Access is the change type most often exempted from
governance on urgency grounds, and the one where an unreviewed change carries the highest
consequence. Exempting it would recreate `PROB-016` in the security domain specifically.

---

## 5. Source Control Standards

Established in [`naming-conventions.md`](naming-conventions.md) §6 and binding here.

| Element | Standard |
|---|---|
| Branches | `feat/`, `fix/`, `docs/`, `test/`, `chore/` + kebab-case |
| Commits | Conventional Commits; imperative, lowercase, ≤72 characters |
| Commit body | Cites affected identifiers (`BR-###`, `DEC-###`) |
| Review | Pull request against the template |
| Main branch | Represents the intended state of the org |

### What must be source-controlled

| Artifact | Rationale |
|---|---|
| Salesforce metadata | The change is reviewable as a diff |
| **Governed rule configuration** | Rule changes are as consequential as code changes (`BR-059`) |
| Permission Sets | Access changes are reviewable (`BR-058`) |
| KPI definitions | Definitions must be versioned to be attributable (`BR-048`) |
| Test matrices and fixtures | Reproducibility |
| Documentation | Changes with the thing it documents (`BR-061`) |

---

## 6. Testing Requirements

| Requirement | Statement |
|---|---|
| Governed behaviour is tested | `BR-060`; a business rule without a test is unverified |
| **Negative paths are tested** | For every capability, behaviour on absent inputs (`BR-006`) |
| Boundary cases are tested | Either side of every threshold, and exactly at it |
| Bulk behaviour is tested | Automation must be bulk-safe |
| **Access is tested in both directions** | Intended access works; unintended access is denied (`BR-057`) |
| `Actual Result` comes from a real run | A predicted result is not a result |

### The two most-omitted classes

**Negative paths.** At 48% incomplete data, the negative path is the **main path**. `BR-006` requires
a negative fixture per capability per consumed attribute — deliberately the largest single test
obligation in the register.

**Negative access assertions.** Confirming a persona can see what they should proves little.
Confirming they **cannot** see what they should not is the actual security assertion, and sharing
interactions are the least predictable part of Salesforce configuration from inspection alone.

---

## 7. Approval

| Change class | Approver | Recorded |
|---|---|---|
| Configuration data | `PER-10` Revenue Operations | Pull request approval |
| Metadata | `PER-13` with the requirement owner | Pull request approval |
| Access | `PER-13` with `PER-10` | Pull request approval + verification |
| Data import | `PER-10` | Documented with provenance |
| **Business rule (`DEC-###`)** | **The decision owner** | **Decision register** |
| Emergency | `PER-13`, retrospectively reviewed | Post-hoc record within a defined period |

**Rules.** Approval is recorded, not verbal. **The person who made a change does not solely approve
it.** Approval by absence is not approval.

> ⚠️ **Portfolio note.** This project has one human. Approval means **the human owner explicitly
> approved**, recorded in the repository. It does **not** mean a fabricated approval chain.
> "Stakeholders approved" is a prohibited phrasing (`implementation-status-conventions.md` §8).

---

## 8. Rollback

`BR-062`. Rollback capability is what makes change safe enough to be frequent; without it, the
rational response to risk is to change less — which is how configuration ossifies and debt
accumulates.

| Change class | Rollback |
|---|---|
| Configuration data | Revert the configuration record from source control — **fastest and safest** |
| Metadata | Redeploy the prior version from source control |
| Access | Revert the Permission Set and re-verify (`BR-057`) |
| Data import | **Often not reversible** — must be stated before proceeding |
| Emergency | Defined before the emergency change is made |

### Principles

1. **The rollback path is known before deployment**, not devised after failure.
2. **Where rollback is not possible, that is stated before deployment** and the change is treated
   accordingly — with a smaller scope, a reversible alternative, or explicit acceptance of the risk.
3. **Rollback is tested** for at least one representative change per class.

**Data imports and record merges are the honest exceptions.** Neither is generally reversible, which
is precisely why merge is a separately granted capability (`BR-012`) and why imports carry recorded
provenance.

---

## 9. Emergency Changes

Emergency changes are **permitted**. A process that forbids them is ignored under pressure, which is
worse than one that governs them.

| Rule | Detail |
|---|---|
| Scope | The minimum that resolves the immediate impact |
| Record | What was changed, by whom, when, and why — **at the time** |
| Review | Retrospectively, within a defined period |
| Source control | Brought into source control as part of the review |
| Testing | Applied retrospectively |
| Access changes | Explicitly reviewed — `BR-058` criterion 4 |

**The retrospective review is the control.** An emergency change never reviewed becomes permanent
undocumented configuration — one of the exact mechanisms that produced NorthstarIQ's current state.

---

## 10. Post-Deployment Validation and Monitoring

| Activity | Purpose |
|---|---|
| Verify in the target | Configuration that deployed successfully can still behave incorrectly |
| Re-run access verification | Sharing interactions are not predictable from inspection (`BR-057`) |
| Confirm observability | Would this failing be visible? (`BR-045`) |
| Update traceability | Requirement status advances only on evidence |

### Ongoing monitoring

| Signal | Requirement |
|---|---|
| Automation failure | Observable and classified (`BR-045`) |
| Exception volume by class | Measurable (`BR-044`, `KPI-015`) |
| Unassigned records | Visible without running a report (`BR-033`, `KPI-006`) |
| Data quality rates | Tracked over time (`BR-007`) |

**Principle** — *automation requires observability*. An automation whose failure is invisible has no
meaningful implementation status: nobody can say whether it is working.

---

## 11. Documentation Obligations

| Artifact | Obligation |
|---|---|
| Governed automation | States the `BR-###` it implements (`BR-061`) |
| Custom field | Appears in the data dictionary with a business purpose and `BR-###` before it is built |
| Governed rule configuration | Purpose and owner documented |
| Access grant | Business justification recorded (`BR-053`) |
| KPI | Full governed definition (`BR-048`) |
| Decision | Recorded in the decision register with approver and date |

> **A change is not complete until its documentation is current.** Not a quality aspiration — a
> completion criterion. It is the only mechanism that has ever kept documentation from drifting.

---

## 12. What This Document Does Not Do

- ❌ It does not claim any release process exists at NorthstarIQ today.
- ❌ It does not describe an inspected current-state deployment practice — `PROB-016` is **To Be
  Validated**.
- ❌ It does not fabricate an approval chain or stakeholder body.
- ❌ It does not specify CI/CD tooling — that is a Phase 0D decision with its own trade-offs.
- ❌ It does not claim any change has been made, deployed, or validated.
