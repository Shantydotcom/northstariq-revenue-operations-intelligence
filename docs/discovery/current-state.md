# Current-State Assessment — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Current-State Assessment |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | **Current State** — the fictional environment being assessed |
| **Related** | [`business-problems.md`](business-problems.md) · [`baseline-metrics.md`](baseline-metrics.md) · [`technology-landscape.md`](technology-landscape.md) |

---

## Reading This Document

> ### ⚠️ No Salesforce configuration has been inspected.
>
> This assessment is based on the organizational structure, the commercial model, and the symptom
> patterns described in the Known Context. **No metadata, Flow, Apex, validation rule, sharing
> setting, or report has been examined.**
>
> Consequently, almost nothing here is a technical root cause. Statements are graded:
>
> | Grade | Meaning |
> |---|---|
> | **Known** | Given in the project brief, or arithmetically derivable from it |
> | **Assumed** | Reasonable inference from structure or symptom; unverified |
> | **To Be Validated** | Explicitly requires inspection before it can be relied upon |
>
> **Acceptable:** "Routing logic has accumulated across multiple mechanisms and requires inventory
> and validation."
> **Not acceptable:** naming a specific Flow or Apex class that has never been inspected.
>
> Where this document names a *condition*, it describes a class of problem, not a diagnosed
> implementation.

### Severity scale

| Severity | Meaning |
|---|---|
| **Critical** | Directly causes revenue loss, incorrect ownership, or access exposure |
| **High** | Materially degrades seller productivity or decision reliability |
| **Medium** | Creates rework, confusion, or unreliable reporting |
| **Low** | Inefficient but tolerable at current scale |

---

## Domain Summary

| # | Domain | Severity | Evidence status | Primary consequence |
|---|---|---|---|---|
| 1 | Salesforce Administration | High | Mostly To Be Validated | Change risk; single-person dependency |
| 2 | Data Quality | **Critical** | Known (baselines) + Assumed causes | Breaks qualification, segmentation, routing |
| 3 | Duplicate Management | High | Assumed | Wasted capacity; conflicting records |
| 4 | Account Identity / Matching | **Critical** | Assumed | Existing customers treated as new prospects |
| 5 | Qualification | High | Assumed | Marketing/Sales disagreement; inconsistent MQL |
| 6 | Lifecycle Governance | High | Assumed | Progression not measurable |
| 7 | Segmentation | **Critical** | Assumed | Wrong team, wrong motion, wrong seller |
| 8 | Territory Management | High | Assumed | Ambiguous coverage; unresolved precedence |
| 9 | Routing | **Critical** | Assumed | Misassignment; unexplainable outcomes |
| 10 | Seller Ownership | High | To Be Validated | Ownership disputes; unclear precedence |
| 11 | SLA Management | **Critical** | Known (baselines) | Slow speed-to-lead; unenforceable commitments |
| 12 | Security / Access | High | **To Be Validated** | Unassessed exposure |
| 13 | Reporting | High | Assumed | Divergent numbers, low trust |
| 14 | Analytics | High | Assumed | No root-cause capability |
| 15 | Documentation | Medium | Assumed | Knowledge concentrated in individuals |
| 16 | Change Management | High | To Be Validated | Undetected regressions |
| 17 | Operational Support | Medium | Assumed | Exceptions absorbed manually, invisibly |

---

## 1. Salesforce Administration

| Aspect | Assessment |
|---|---|
| **Symptom** | Configuration has accumulated over ~9 years of Salesforce use across four growth phases without consolidation or retirement of superseded elements. |
| **Business consequence** | Every change carries unquantified regression risk. Administration is necessarily reactive. |
| **Likely contributing condition** | One administrator supporting 64 revenue users plus Marketing, CS and Support consumers ([`sales-organization.md`](sales-organization.md) §2). No documented inventory of what exists or why. |
| **Evidence status** | **To Be Validated.** No org inventory has been performed. |
| **Affected personas** | `PER-13`, `PER-10`, `PER-11` |
| **Severity** | High |
| **Validation required** | Full inventory of custom fields, automation, validation rules, page layouts, record types, and permission assignment. Identify which elements have business owners and which are orphaned. |

**Finding.** The administrator-to-user ratio is a structural constraint, not a staffing complaint.
It means any later architecture that is clever but hard to maintain will degrade. This directly
justifies the *administrator maintainability* and *metadata-driven configuration* principles.

---

## 2. Data Quality

| Aspect | Assessment |
|---|---|
| **Symptom** | Core firmographic fields are incompletely and inconsistently populated. Synthetic baselines: 44% of Leads lack employee count, 31% lack industry, 22% lack a usable domain, 17% lack country. |
| **Business consequence** | Because pricing, ICP fit, segmentation, and territory all derive from these fields ([`revenue-model.md`](revenue-model.md) §2), a missing value does not degrade one process — it breaks four simultaneously. |
| **Likely contributing condition** | Fields were introduced for reporting at different times and later became automation inputs without being made required or validated at the point of entry. Multiple entry paths (manual, import, inbound form) with differing enforcement. |
| **Evidence status** | Baselines are **Synthetic Baseline**; contributing conditions are **Assumed**. |
| **Affected personas** | `PER-07`, `PER-08`, `PER-10`, `PER-12`, `PER-14` |
| **Severity** | **Critical** |
| **Validation required** | Which fields are required at which entry point; whether validation rules exist; whether any normalization occurs; which entry paths bypass enforcement. |

**Finding.** A field that was safe to leave optional when it fed a report becomes unsafe when it
begins to feed routing. NorthstarIQ has crossed that threshold without revisiting the field
definitions. This is the single highest-leverage problem in the environment.

---

## 3. Duplicate Management

| Aspect | Assessment |
|---|---|
| **Symptom** | Duplicate Leads, duplicate Accounts, and Leads created for people who already exist as Contacts. Synthetic baselines: 14.2% Lead duplication, 9.1% Lead-to-Contact duplication, 6.8% Account duplication. |
| **Business consequence** | Multiple sellers may work the same organization. Reported Lead volume overstates real demand. Conversion rates computed on inflated denominators understate true performance. |
| **Likely contributing condition** | Inconsistent company-name and domain formatting defeats exact matching. Whether duplicate rules exist, and whether they block or merely warn, is unknown. Records arriving through different entry paths may be subject to different rules. |
| **Evidence status** | Baselines **Synthetic Baseline**; causes **Assumed**; rule configuration **To Be Validated**. |
| **Affected personas** | `PER-06`, `PER-07`, `PER-08`, `PER-11` |
| **Severity** | High |
| **Validation required** | Inventory of duplicate and matching rules; whether they block or warn; what happens to a detected duplicate; whether anyone owns the resulting review queue. |

**Open Question.** Some apparent Account duplicates may be legitimate distinct entities under an
undefined franchise/subsidiary policy ([`company-profile.md`](company-profile.md) §3). **The
duplicate rate cannot be interpreted until that commercial policy is defined.** Treating it purely
as a matching problem would encode an unmade business decision.

---

## 4. Account Identity / Matching

| Aspect | Assessment |
|---|---|
| **Symptom** | Inbound Leads are not reliably connected to the correct Account, and existing customers are not reliably identified as existing. |
| **Business consequence** | The most damaging pattern: an inbound enquiry from an existing customer is treated as a net-new prospect and routed to a prospecting seller rather than the account owner. This produces a poor customer experience at exactly the moment of expansion intent — and NorthstarIQ depends on expansion for 44% of its new ARR ([`revenue-model.md`](revenue-model.md) §3). |
| **Likely contributing condition** | Matching that relies on exact company name or email domain fails against the structural characteristics of NorthstarIQ's customer base: multi-site organizations, parent/subsidiary groups, trading names, and franchise models. Domain matching additionally fails where 22% of Leads have no usable domain. |
| **Evidence status** | **Assumed.** No matching logic has been inspected. |
| **Affected personas** | `PER-03`, `PER-04`, `PER-08`, `PER-10` |
| **Severity** | **Critical** |
| **Validation required** | Whether any Lead-to-Account matching exists; what signals it uses; whether match confidence is recorded; how ambiguous matches are handled; whether churned Accounts are excluded from customer detection. |

**Finding.** Identity risk and revenue concentration coincide. The Enterprise and Strategic segments
— 47% of ARR across 85 accounts — are precisely the multi-entity organizations hardest to match.

**Assumption requiring validation.** Churned Accounts are believed to remain in Salesforce
([`revenue-model.md`](revenue-model.md) §4). If they are not distinguishable from active customers,
existing-customer detection may match inbound interest to relationships that have ended.

---

## 5. Qualification

| Aspect | Assessment |
|---|---|
| **Symptom** | No single agreed definition of what makes a Lead marketing-qualified, and no consistent assessment of ICP fit. Marketing and Sales disagree about whether delivered volume is qualified. |
| **Business consequence** | SDR capacity is spent on poor-fit records. Marketing's reported contribution is disputed rather than trusted. The MQL → SAL conversion of 62% ([`baseline-metrics.md`](baseline-metrics.md)) is not interpretable without knowing what an MQL is. |
| **Likely contributing condition** | Qualification depends on firmographics (employee count, industry) that are missing on 31–44% of records. A fit assessment cannot be consistent when its inputs are absent — records may be qualified on the basis of who happened to have complete data rather than who is genuinely a good fit. |
| **Evidence status** | **Assumed.** Whether any scoring exists is unknown. |
| **Affected personas** | `PER-07`, `PER-09`, `PER-12`, `PER-15` |
| **Severity** | High |
| **Validation required** | Whether an MQL definition is documented; whether scoring exists and is explainable; who owns the definition; whether qualification is re-evaluated when data is later enriched. |

**Finding.** The Marketing/Sales disagreement is very likely a **definitional** dispute rather than
a performance dispute. Two functions measuring different things will disagree indefinitely
regardless of effort. This is a governance problem before it is a scoring problem.

---

## 6. Lifecycle Governance

| Aspect | Assessment |
|---|---|
| **Symptom** | Lifecycle stage and Lead Status are used inconsistently and appear to overlap. Recycling of unconverted records is not clearly defined. |
| **Business consequence** | Progression cannot be measured reliably, so funnel reporting is not trustworthy. Records stall without a defined state that says so. |
| **Likely contributing condition** | Lead Status was in use before a lifecycle model was introduced; the two now coexist without a defined relationship. |
| **Evidence status** | **Assumed.** |
| **Affected personas** | `PER-07`, `PER-09`, `PER-10`, `PER-12`, `PER-14` |
| **Severity** | High |
| **Validation required** | Current Lead Status values and their actual usage; whether a lifecycle field exists; whether stage transitions are enforced or free-form; whether transition history is retained. |

**Finding.** Without retained transition history, "how long does a record spend in each stage" is
unanswerable retrospectively. This is a hard constraint on the later analytics model and is a direct
input to `DEC-018` (event/history persistence strategy) — an architectural decision that must be
made *before* implementation, because history not captured cannot be recovered later.

---

## 7. Segmentation

| Aspect | Assessment |
|---|---|
| **Symptom** | Segment thresholds are not clearly defined, firmographic signals conflict, and manual overrides are applied without a recorded reason. |
| **Business consequence** | Segment determines the owning team, the sales motion, and the expected cycle length. An incorrect segment sends a record to the wrong team with the wrong playbook. Mid-Market is most exposed — it produces 50.4% of new ARR ([`revenue-model.md`](revenue-model.md) §5), and its boundaries touch both SMB round robin and Enterprise territory. |
| **Likely contributing condition** | Segment was introduced as a reporting attribute and later became a routing input without redesign ([`company-profile.md`](company-profile.md) §5). It depends on employee count, which is missing on 44% of Leads. |
| **Evidence status** | **Assumed.** |
| **Affected personas** | `PER-04`, `PER-05`, `PER-06`, `PER-10` |
| **Severity** | **Critical** |
| **Validation required** | Whether thresholds are documented; whether employee count or revenue takes precedence when both exist and conflict; how records with neither are segmented; who may override and whether reasons are captured. |

**Finding.** Segmentation is the load-bearing element between data quality and routing. It inherits
every data-quality defect upstream and transmits it to every ownership decision downstream. Inputs
to `DEC-001` and `DEC-002`.

---

## 8. Territory Management

| Aspect | Assessment |
|---|---|
| **Symptom** | Territory definitions have changed repeatedly, geography rules are applied inconsistently across segments, and precedence between overlapping claims is undefined. |
| **Business consequence** | Coverage gaps and overlaps. Ownership disputes consume manager time. Territory performance cannot be compared period-over-period if boundaries changed without versioning. |
| **Likely contributing condition** | Enterprise uses three regions, Mid-Market two ([`sales-organization.md`](sales-organization.md) §3). International markets were attached to US-shaped regions as exceptions. Germany resolves to a different region depending on segment. |
| **Evidence status** | **Assumed** for behaviour; the structural inconsistency is a **Finding** derived from Known Context. |
| **Affected personas** | `PER-01`, `PER-02`, `PER-04`, `PER-05`, `PER-10` |
| **Severity** | High |
| **Validation required** | Where territory definitions are stored; whether they are versioned; how boundary cases resolve; whether historical assignments were re-mapped when boundaries changed. |

**Finding.** Because segment determines which territory map applies, and segment depends on a field
missing 44% of the time, territory assignment inherits the instability of segmentation. These are
not two independent problems — they are one dependency chain. Input to `DEC-022`.

---

## 9. Routing

| Aspect | Assessment |
|---|---|
| **Symptom** | Assignment involves a mixture of automated and manual steps. Synthetic baselines: median 6.4 hours created-to-assigned, 21% unassigned beyond 24 hours, 11.3% corrected within five days. |
| **Business consequence** | Slow and unreliable assignment directly suppresses conversion. More damaging: **no record explains why a given seller was selected**, so errors cannot be diagnosed — only re-corrected case by case. |
| **Likely contributing condition** | Routing logic has accumulated across multiple mechanisms added during successive growth phases, with no inventory of what governs which case. Three assignment bases (named account, territory, round robin) coexist without documented precedence ([`sales-organization.md`](sales-organization.md) §1). |
| **Evidence status** | Baselines **Synthetic Baseline**; mechanism inventory **To Be Validated**. |
| **Affected personas** | `PER-02`, `PER-06`, `PER-07`, `PER-10`, `PER-11` |
| **Severity** | **Critical** |
| **Validation required** | Complete inventory of every mechanism that can set owner; the precedence between them; behaviour when data is incomplete; behaviour when no rule matches; whether any assignment reason is recorded. |

**Finding.** The absence of a recorded assignment reason is the defining defect. It converts every
routing question into a manual investigation and makes systematic improvement impossible — you
cannot fix a distribution of errors you cannot classify. This is the origin of the *auditable
routing* and *explainable automation* principles.

---

## 10. Seller Ownership

| Aspect | Assessment |
|---|---|
| **Symptom** | Precedence between existing-customer ownership, named Strategic accounts, and territory rules is unclear. Reassignment occurs on 18.6% of records within 30 days. |
| **Business consequence** | Reassignment churn erodes trust in the system and consumes manager time. Where an existing customer's inbound interest is routed away from the account owner, the customer relationship is damaged. |
| **Likely contributing condition** | Three assignment bases with no documented precedence. Seller availability (leave, inactivity, departure) appears to be handled manually. |
| **Evidence status** | **To Be Validated.** |
| **Affected personas** | `PER-02`, `PER-03`, `PER-04`, `PER-10`, `PER-11` |
| **Severity** | High |
| **Validation required** | Whether existing-customer ownership overrides territory; whether Strategic designation overrides everything; how seller inactivity is detected; whether records assigned to an inactive user are re-routed or stranded. |

**Finding.** Of the 18.6% reassignment rate, 11.3 points are corrections of incorrect assignment;
the remaining ~7.3 points may be legitimate business movement. **Without a recorded assignment
reason, these cannot be distinguished** — so the true error rate is unknown even though a
reassignment count exists. Input to `DEC-003`, `DEC-005`, `DEC-007`.

---

## 11. SLA Management

| Aspect | Assessment |
|---|---|
| **Symptom** | Response-time expectations are not consistently defined, measured, or enforced. Synthetic baselines: median 15.5 business hours created-to-first-touch; 34% attainment against a 4-business-hour expectation. |
| **Business consequence** | Speed-to-lead is a primary determinant of inbound conversion. At a median of nearly two business days, a substantial share of inbound intent is likely lost before contact. |
| **Likely contributing condition** | Two compounding delays: assignment latency (median 6.4h) and post-assignment response latency (median 9.1h). Additionally, **no agreed business-hours or holiday definition exists across four markets** ([`company-profile.md`](company-profile.md) §4) — so the same elapsed time yields different SLA results depending on interpretation. |
| **Evidence status** | Baselines **Synthetic Baseline**; the 4-hour expectation is **Assumed** and may not be formally agreed anywhere. |
| **Affected personas** | `PER-07`, `PER-09`, `PER-02`, `PER-10` |
| **Severity** | **Critical** |
| **Validation required** | Whether a formal SLA is documented and agreed; how first touch is defined; whether business hours are applied; how the four holiday calendars are handled; whether breaches are visible to anyone. |

**Finding.** The SLA baseline is itself unreliable: 27% of Leads have no logged first-touch activity
at all ([`baseline-metrics.md`](baseline-metrics.md)). Whether those records were genuinely
untouched or were touched without logging is unknown. **NorthstarIQ cannot currently distinguish an
SLA failure from a measurement failure.** Fixing the measurement is a prerequisite to managing the
outcome. Inputs to `DEC-006`, `DEC-012`.

---

## 12. Security / Access

> **This domain is the least evidenced in the entire assessment, and that is itself the finding.**

| Aspect | Assessment |
|---|---|
| **Symptom** | Access governance has not been assessed. Whether current access is appropriate is unknown. |
| **Business consequence** | Unquantified. Access exposure cannot be sized without inspection. |
| **Potential contributing conditions** — **all To Be Validated, none asserted** | Permissions possibly managed through profiles rather than permission sets; persona access possibly not clearly differentiated; sharing configuration possibly undocumented; integration access possibly using broader rights than required; access changes possibly untested. |
| **Evidence status** | **To Be Validated — entirely.** |
| **Affected personas** | `PER-13`, `PER-10`, `PER-17`, `PER-16` |
| **Severity** | High (provisional — cannot be sized before assessment) |
| **Validation required** | Organization-Wide Defaults per object; role hierarchy; profile vs permission-set usage; sharing rules and their documented rationale; field-level security on sensitive fields; integration user rights; whether access changes are tested. |

**Explicit statement of non-assertion.** The project brief lists these as *potential* problems to
evaluate. **This assessment does not claim any of them are true at NorthstarIQ.** They are recorded
as an inspection checklist, not as findings. Asserting a security defect without evidence would be
both dishonest and, in a real engagement, professionally damaging.

**Finding.** The one thing that *can* be stated: security is currently treated as a configuration
task rather than a governed workstream, evidenced by its absence from the problem framing that
prompted this project. Elevating it to a primary workstream is a deliberate position. Input to
`DEC-021`.

---

## 13. Reporting

| Aspect | Assessment |
|---|---|
| **Symptom** | Reports have been built per-request over several years. The same business question is answered differently by different reports. |
| **Business consequence** | Meetings begin by reconciling numbers rather than acting on them. Trust in reporting is low, which pushes users toward private spreadsheets — further fragmenting the truth. |
| **Likely contributing condition** | No governed metric definitions. Reports embed filter logic that encodes an implicit definition, and those definitions were never centralized or compared. |
| **Evidence status** | **Assumed.** |
| **Affected personas** | `PER-01`, `PER-02`, `PER-14`, `PER-15`, `PER-16` |
| **Severity** | High |
| **Validation required** | Inventory of reports and folders; identification of metrics with multiple conflicting definitions; whether any definition is documented; who owns each. |

**Finding.** There is a structural measurement defect independent of definitions: sales cycles range
from 21 to 210 days ([`revenue-model.md`](revenue-model.md) §8). **Any blended conversion metric
measured over a window shorter than ~7 months systematically under-represents Enterprise and
Strategic.** Some disputed numbers are likely correct-but-misinterpreted rather than wrong.

---

## 14. Analytics

| Aspect | Assessment |
|---|---|
| **Symptom** | Power BI is in use, but reporting is descriptive. When a metric moves, the cause cannot be isolated. |
| **Business consequence** | Leadership can see that conversion fell but cannot determine whether the cause was lead quality, routing delay, SLA failure, segmentation error, or seasonality. Decisions are made on intuition. |
| **Likely contributing condition** | Analytics reflects the operational data that exists. Because routing decisions, match decisions, and lifecycle transitions leave no explanatory record, no analytics layer can reconstruct them. |
| **Evidence status** | **Assumed.** |
| **Affected personas** | `PER-14`, `PER-16`, `PER-01`, `PER-10` |
| **Severity** | High |
| **Validation required** | Current Power BI content and refresh mechanism; whether Salesforce and Power BI figures reconcile; what history is retained. |

**Finding.** This is the clearest demonstration of the project thesis. **The analytics gap is not an
analytics problem.** No dashboard can report a routing reason that was never recorded. Root-cause
capability must be designed into the operational layer; the Revenue Intelligence Model can only
surface what the architecture chose to capture. Input to `DEC-016`, `DEC-018`, `DEC-020`.

---

## 15. Documentation

| Aspect | Assessment |
|---|---|
| **Symptom** | Business rules, automation behaviour, territory definitions, and metric definitions exist primarily as institutional knowledge. |
| **Business consequence** | Onboarding is slow. Change is risky because the intended behaviour is unknown. Knowledge leaves with people. |
| **Likely contributing condition** | Documentation was never part of the change process, so it was never produced as a by-product of work. |
| **Evidence status** | **Assumed.** |
| **Affected personas** | `PER-13`, `PER-10`, `PER-11` |
| **Severity** | Medium |
| **Validation required** | What documentation exists; whether it reflects current behaviour; whether anyone maintains it. |

**Finding.** Documentation quality is a *consequence* of change-management design, not an
independent virtue. Documentation produced separately from work always drifts. This is why the later
project treats documentation updates as part of the change itself rather than a follow-up task.

---

## 16. Change Management

| Aspect | Assessment |
|---|---|
| **Symptom** | No consistent path from requirement through design, review, testing, deployment, and verification. |
| **Business consequence** | Changes are deployed without regression testing. Defects are discovered by users in production. Because behaviour is undocumented, "was this always broken?" is often unanswerable. |
| **Likely contributing condition** | A single administrator under reactive load, with no source control over metadata and no test suite to regress against. |
| **Evidence status** | **To Be Validated.** |
| **Affected personas** | `PER-13`, `PER-10`, `PER-11` |
| **Severity** | High |
| **Validation required** | Whether a sandbox is used; whether metadata is source-controlled; whether changes are tested before deployment; whether rollback has ever been exercised. |

**Finding.** Weak change management is what allowed the operational debt to accumulate in the first
place. Without governance, each growth phase could add behaviour without anyone being accountable
for consolidating it. **Fixing routing without fixing change management would guarantee the same
accumulation recurs.**

---

## 17. Operational Support

| Aspect | Assessment |
|---|---|
| **Symptom** | Exceptions — unassigned records, duplicates, failed automation, ownership disputes — are handled ad hoc by whoever notices them. |
| **Business consequence** | Exception volume is invisible, so it is never addressed systemically. Effort spent on manual remediation is absorbed into normal work and never quantified, which means the business case for fixing root causes is never made. |
| **Likely contributing condition** | No exception queues, no classification, no ownership, no measurement. |
| **Evidence status** | **Assumed.** |
| **Affected personas** | `PER-11`, `PER-10`, `PER-13`, `PER-07` |
| **Severity** | Medium |
| **Validation required** | How unassigned records are currently detected; who resolves them; whether automation failures are visible; whether any exception volume is measured. |

**Finding.** Invisible manual remediation is self-perpetuating: because the cost is hidden, no case
for structural fix is ever built, so the manual work continues. Making exception volume visible is a
prerequisite to reducing it.

---

## Cross-Cutting Findings

### The dependency chain

The domains are not independent. Data quality defects propagate deterministically:

```
Missing employee count / industry / country / domain
        │
        ├──> Qualification cannot be assessed consistently
        │
        ├──> Segment cannot be derived reliably
        │            │
        │            └──> Territory map cannot be selected reliably
        │                          │
        │                          └──> Routing selects the wrong owner
        │                                        │
        │                                        └──> SLA clock starts late or never
        │
        └──> Account match fails ──> existing customer treated as new prospect
```

**Finding.** Six of the seven Critical/High operational domains share a single upstream cause. This
is why the later architecture sequences data quality and identity *before* routing and SLA — not
because it is tidier, but because routing built on unreliable inputs cannot be made correct.

### The explainability gap

Independently of correctness, the environment cannot answer **"why did this happen?"** for any
automated decision — why a record matched an Account, received a score, changed lifecycle stage,
was assigned a segment or territory, reached a specific seller, or breached an SLA.

**Finding.** This gap has three compounding effects:
1. Errors cannot be classified, so they cannot be reduced systematically.
2. Users cannot self-serve, so every question becomes an escalation.
3. Analytics cannot report causes that were never recorded.

**Explainability is therefore not a reporting feature. It is an operational data-capture
requirement that must be designed into the system at the point of decision.**

### The measurement reliability problem

Several baselines measure something other than what they appear to measure:

| Baseline | Appears to measure | May actually measure |
|---|---|---|
| SLA attainment 34% | Response performance | Partly activity-logging compliance (27% have no logged touch) |
| Reassignment 18.6% | Routing error | Error *plus* legitimate business movement — indistinguishable |
| Duplicate Account rate 6.8% | Data quality | Partly an undefined franchise/subsidiary policy |
| Blended funnel conversion | Sales performance | Partly a window artefact of 21–210 day cycle spread |

**Finding.** Establishing trustworthy measurement is a deliverable in its own right, and it must
precede any claim of improvement. This is why the project principle *establish baselines before
claiming improvement* exists, and why these baselines are labelled Synthetic and treated as
provisional rather than authoritative.

---

## Evidence Status Summary

| Status | Count | Interpretation |
|---|---:|---|
| **Known** | 4 domains have arithmetically-derived structural findings | Territory/segment inconsistency, cycle-length spread, concentration asymmetry, administrator ratio |
| **Assumed** | 10 domains | Reasonable inferences from structure and symptom; require validation |
| **To Be Validated** | 5 domains | Explicitly not assessable without inspection — Administration, Security, Seller Ownership, Change Management, and routing mechanism inventory |

**No technical root cause has been asserted anywhere in this document.** No Flow, Apex class,
validation rule, sharing rule, or report has been named, because none has been inspected.
