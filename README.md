# NorthstarIQ

**Revenue Operations Intelligence for Salesforce**

A governed inbound-revenue process built in Salesforce, and a read-only application that assesses
that process against the org and shows the records behind every number.

> **NorthstarIQ is a fictional $42M-ARR B2B SaaS scenario. All business and record data is
> synthetic.** The Salesforce configuration, the assessment application, and the recorded test
> evidence are implemented artifacts in this repository.

[`docs/implementation-log.md`](docs/implementation-log.md) is the sole authority on what exists.

---

## What is implemented

| | |
|---|---|
| **Salesforce** | Four increments deployed to a Developer Edition org and human-accepted as a non-admin persona. 21 custom fields · 1 before-save Flow · 3 Custom Metadata Types holding 16 configuration records · 4 permission sets · 3 queues · 2 reports · 4 org-wide default changes · **0 Apex** |
| **Assessment application** (`web/`) | Next.js App Router. **Dashboard** orients and starts a run; **Assessment** reports what was evaluated and what each control determined; **Findings** and **Finding Detail** carry the specific issues and the investigation trail; **Integrations** holds the connection and its boundaries. Deterministic outcome evaluation across the governed Revenue Operations areas, with internal scoring retained for compatibility and **not displayed**. Authenticates by OAuth 2.0 Client Credentials and reads `Lead` and `Opportunity` by SOQL. Unit-tested over the controls, the lifecycle derivations and the presentation contract, against fixtures with no network. |
| **Live assessment snapshot — 2026-08-24** | HTTP 200, 81 records assessed, overall health 68, six findings, three high. A dated historical record of that run, **not** current UX or current state. |
| **Deferred, not built** | The ~190-record synthetic dataset · Power BI analytics · round-robin distribution · application deployment |

---

## The problem

Revenue Operations problems are rarely isolated Salesforce configuration problems. They come from
inconsistent definitions, unclear ownership logic, fragmented automation, and no way to explain why
the system did what it did.

The scenario's founding finding: **18.6% of NorthstarIQ Leads are reassigned within 30 days. Only
11.3 points are identifiable corrections. The remaining 7.3 points cannot be classified at all,
because nothing records why any assignment happened.** The routing error rate is somewhere between
11.3% and 18.6%, and no query can narrow it.

That produces the design idea running through the whole build: **every decision the system makes —
how a record was segmented, which territory it landed in, why it went to that owner, whether the SLA
clock was even measurable — is written as data at the moment it is made.** Explainability is a
data-capture obligation designed in at the decision point, not a reporting feature added afterwards.

Three terms stay distinct throughout, in the documentation and in the interface:

| Term | Meaning |
|---|---|
| **Operational control** | What governs Salesforce behaviour — a Flow, a formula, a configuration record, a permission boundary |
| **Assessment check** | How NorthstarIQ evaluates observable Salesforce state, as a pure function over records already fetched |
| **Finding** | Evidence of a condition needing investigation. **A finding is a symptom report, not a control test.** |

---

## Implemented workflow

```text
Salesforce configuration
  → governed operational data written at the decision point
    → read-only assessment over the org
      → assessment areas and checks
        → findings
          → record-level evidence, linked into the org
            → the implemented safeguard behind the condition
              → the verification executed against it
```

**The Salesforce integration is read-only by construction.** The only operation the application can
perform is a SOQL query, and every query is a static string literal with no interpolation. **There
is no create, update or delete path anywhere in the application — absent, not disabled.**

**Running an assessment does not exercise or prove the Salesforce controls.** It reads what the org
already recorded. A Lead sitting in the routing exception queue is a report of org state, not
evidence that routing behaved correctly. Control evidence is the executed increment testing recorded
in [`docs/implementation-log.md`](docs/implementation-log.md), and nothing the application displays
adds to it.

---

## Application experience

NorthstarIQ separates operational orientation, assessment evaluation and record-level investigation.

### Dashboard / Homepage

The **Dashboard is the application homepage**.

It orients: what an assessment reads, what it will not do, the Revenue Operations areas it covers,
and the one action that starts it.

**It holds a single page architecture at all times.** Completing an assessment does not replace the
Dashboard with a different page; it changes only what that page can truthfully state — when the last
run read the org, the label on its action, and the one figure that counts areas raising findings. The
completion summary, the lifecycle, the priorities and the connection snapshot belong to Assessment,
and the Dashboard does not absorb them.

The Dashboard answers:

> **What does an assessment cover, what will it not do, and how do I start one?**

### Assessment

The **Assessment page is a separate application experience** from the Dashboard/Homepage.

It shows what NorthstarIQ evaluated, how the assessment is organized, the populations the checks
were able to judge, and the outcomes produced by those checks.

The governed Lead lifecycle is incorporated into Assessment as an investigative view of the existing
Lifecycle Governance assessment area.

The Assessment page answers:

> **What did NorthstarIQ evaluate, how was it evaluated, and what did the individual checks and
> lifecycle milestones determine?**

### Findings

Findings identify conditions requiring investigation.

The Findings experience answers:

> **What specifically needs attention?**

### Finding Detail

Finding Detail provides the concise investigation trail for an individual finding: why the check
exists, the expected condition, what NorthstarIQ found, the Salesforce/source evidence behind it,
the implemented safeguard where one exists, and its verification.

Finding Detail answers:

> **Why did this fail, what evidence supports that conclusion, and what safeguard exists?**

These experiences are related but are not interchangeable.

Dashboard content should not be moved into Assessment merely because it summarizes assessment
results. Assessment content should not be moved onto the Dashboard merely because it is operationally
useful. Finding Detail remains the deeper evidence surface rather than turning Assessment into a
documentation portal.

---

## The assessment

Six areas, each phrased as the question an operator would ask, each evaluated only over the
population it could actually judge.

| Area | Question it answers | Check |
|---|---|---|
| Inbound Lead Data Integrity | Do Leads carry the data routing needs, and does the Segment they hold still agree with the evidence behind it? | Missing routing data · Segment assignment mismatch |
| Lead Routing Reliability | Are governed inbound Leads reaching a valid territory and owner path? | Routing exceptions · Missing territory |
| Account Match Confidence | Can Leads be matched to an Account without ambiguity? | Ambiguous account match |
| Lead Response SLA | Are Leads with a measurable SLA within the expected response window? | SLA risk and breach |
| Open Pipeline Date Health | Do open Opportunities have a current or future Close Date? | Stale open pipeline |
| Lifecycle Governance | Do Leads reach each lifecycle stage by a route the business permits, with the governed evidence to support the claim? | Stage progression · MQL qualification · Sales handoff and qualification · Opportunity conversion |

**Populations are scoped deliberately, and by Salesforce rather than by the application.** Which
Lead Sources carry a routing-readiness expectation is read each run from
`Routing_Readiness_Source__mdt`. Ownership routing stays narrower — its entry criterion is
`LeadSource = 'NorthstarIQ Inbound'`, the population the Salesforce automation actually governs —
because the process makes no promise about Leads it never handled. Every check accounts for its whole
starting population: a record is either evaluated, or it is listed with the reason it was not.

**The current MVP reports outcomes, not scores.** Each check resolves to one of three states over
the records it was able to judge — **Passed**, **Failed**, or **Undetermined** where the control
applies but Salesforce does not hold the evidence to settle it — shown beside the populations behind
it. No overall score, no `/100`, no area score, no gauge, no score delta and no score-derived health
classification is surfaced anywhere in the current user experience.

- **`evaluated` is what the check could judge, not the size of the org.** SLA is measured only over
  Leads carrying an `SLA_Target_DateTime__c`. A Lead never given a commitment is excluded from the
  denominator rather than counted as a breach. **Unmeasurable is not Breached.**
- **A check that judged nothing reaches no verdict.** It is reported as Undetermined with the reason
  the evidence was absent — never as a pass, a failure, or a zero.

The engine still computes a score internally, and the payload still carries one for compatibility;
the interface does not display it. Historical snapshots below may contain scores from runs made while
the UI still showed them. They are retained as historical evidence rather than descriptions of the
current UX.

### Finding Detail

Each finding opens to one page that states why the control exists, what the process does when it is
working, the numbers with their arithmetic shown, the failing records (up to ten, each linking into
the connected org and showing only the fields the check reasons over), the safeguard that was
actually built, and the verification executed against it with its date and source.

Safeguards are labelled **preventive** — Salesforce stops or safely redirects the outcome — or
**detective**, where NorthstarIQ reports the condition and nothing prevents it.

Eight checks carry a preventive safeguard and three are detective. **Open pipeline hygiene is one
of the detective three, and the page says plainly that no automated control was built for it.**

---

## Lead lifecycle in Assessment

NorthstarIQ uses one authoritative governed Lead lifecycle:

```text
Lead → MQL → SAL → SQL → Conversion → Opportunity
```

These six milestones are the lifecycle represented wherever NorthstarIQ explains governed Lead
progression.

Operational processes such as Lead Information, Lead Assignment, Account Matching, Lead Follow-Up
and Opportunity Dates exist around this lifecycle. They do not replace its stages.

The lifecycle belongs within the **Assessment experience** because it provides an understandable way
for an evaluator to investigate how NorthstarIQ assesses governed progression from Lead through
Opportunity.

It is not a separate assessment model.

It is a visual and investigative representation of the existing Lifecycle Governance assessment
area and its implemented checks.

Where supported by the current implementation, the Assessment lifecycle experience should make it
possible to understand:

- the authoritative `Lead → MQL → SAL → SQL → Conversion → Opportunity` progression;
- the meaning of each lifecycle milestone;
- what NorthstarIQ evaluates at that milestone;
- the current-run outcome for the applicable assessment;
- the population NorthstarIQ was able to evaluate;
- where the evidence was insufficient to determine an outcome; and
- the relationship between the milestone and its applicable lifecycle assessment checks.

The existing Lifecycle Governance checks remain authoritative:

- **Stage progression**
- **MQL qualification**
- **Sales handoff and qualification**
- **Opportunity conversion**

Do not create additional lifecycle checks merely to populate the visual lifecycle.

Do not change lifecycle assessment logic merely to improve presentation.

### Lifecycle presentation standard

The lifecycle experience should preserve the current approved Assessment visual language while
making the six-stage progression easy to understand.

Where appropriate, milestone interaction may expose concise information such as:

**What this milestone means**  
The business meaning of the selected lifecycle milestone.

**What NorthstarIQ checks**  
The existing assessment logic associated with that point in the lifecycle.

**Result this run**  
The runtime-supported outcome from the current assessment.

**Associated assessment checks**  
The implemented Lifecycle Governance check or checks relevant to that milestone.

This information should remain concise.

Assessment is an investigation surface, not a replacement for Finding Detail or a documentation
portal. Record-level evidence and the complete safeguard/verification trail remain the responsibility
of Finding Detail where a finding exists.

---

### Historical Assessment lifecycle design

A previous Assessment implementation contained an interactive:

```text
Lead → MQL → SAL → SQL → Conversion → Opportunity
```

lifecycle experience.

That earlier Assessment page is now a **historical visual design** and is **not an approved visual
reference**.

Its:

- page layout
- styling
- spacing
- card structure
- information hierarchy
- section placement
- overall Assessment-page composition

must not be restored or reproduced merely because the lifecycle interaction existed there.

However, the useful lifecycle concepts demonstrated by that implementation remain valid product
requirements where supported by the current implementation:

- authoritative lifecycle progression;
- milestone-level navigation or selection;
- explanation of what each milestone means;
- explanation of what NorthstarIQ evaluates at that milestone;
- current-run result; and
- relationship to applicable lifecycle assessment checks.

These concepts should be **redesigned and incorporated into the current approved Assessment-page
visual language**.

The historical implementation is therefore:

> **Functional and product-design input — not visual authority.**

Do not restore the historical Assessment page.

Do not treat an old screenshot containing the lifecycle as authority over the current Assessment
design.

---

## Design authority

Current visual design authority is maintained under `design-references/` on the working machine.

The governing rules are defined in repository `CLAUDE.md`, §10 *UX & Design Authority*, with the
local `design-references/README.md` providing the reference mapping beside the images.

Design references govern:

- visual direction;
- information hierarchy;
- layout;
- presentation;
- page structure; and
- relative placement of major components.

They do **not** govern:

- runtime counts;
- finding totals;
- severity totals;
- Salesforce populations;
- assessment calculations;
- timestamps;
- connection state;
- implemented-feature status;
- Salesforce behaviour; or
- validation evidence.

Every runtime-dependent number, result or status visible in a mockup is illustrative unless the
working application and validated data support it.

Never change assessment logic, Salesforce behaviour or runtime data merely to make application output
match a static image.

Historical screenshots and superseded mockups are not implementation targets unless explicitly
re-approved.

In particular, the historical Assessment lifecycle page described above is not current visual
authority. Its valid lifecycle concepts must be incorporated into the current approved Assessment
design rather than restoring its obsolete page design.

---

## Live assessment — 2026-08-24 snapshot

**2026-08-24T06:32:09Z — HTTP 200.** 81 records assessed · overall health 68 · six findings, three
high. `overallHealth` was reproduced by hand from the returned payload.

| Area | Score |
|---|---:|
| Inbound Lead Readiness | 94 |
| Lead Routing Reliability | 90 |
| Account Match Confidence | 96 |
| Lead Response SLA | 60 |
| Open Pipeline Date Health | 0 |

> **Historical scoring evidence.** This snapshot records the output of a run made while scoring was
> still surfaced by the application. The current MVP UX does not display overall scores, area scores,
> `/100`, gauges, score deltas or score-derived health classifications.

**What this establishes:** OAuth 2.0 Client Credentials authentication against the Developer Edition
org · SOQL read of `Lead` and `Opportunity` · six checks executing over live records · scoring
computed from those records.

**What it does not establish:** routing, segmentation, SLA or matching **behaviour** — the
application exercises no control and asserts no control outcome. Nothing was remediated; there is no
write path. The judged population was whatever records increment testing left in the org, **not** the
designed ~190-record dataset, which has not been generated. 81 records is not a scale claim.

---

## Salesforce architecture

**Standard Salesforce first.** Every candidate was evaluated in this order:

```text
standard capability → existing configuration → formula / validation → Flow
  → Custom Metadata → custom field → Apex (last resort)
```

Org inspection removed work rather than adding it: standard Duplicate and Matching Rules replaced
custom duplicate logic, enabled State/Country picklists removed most country normalization, and
standard field history replaced a custom history object. **Zero custom fields exist for firmographic
storage** — what was missing was never storage, it was governed behaviour and explainability.

**Configuration-driven.** Segmentation thresholds, the territory map, routing precedence and SLA
targets live in Custom Metadata rather than inside automation, and the rule version is stamped on
affected records so historical decisions stay interpretable after a rule changes. Adding a market is
a configuration record, not a deployment.

**What the controls enforce:**

- **Unsafe routing is withheld, not guessed.** Where the routing decision cannot be made safely, the
  Lead is redirected to the exception queue with a classified type and a written reason. Leads
  outside the governed intake keep the owner they already had.
- **Ambiguous Account matches are left unresolved deliberately.** More than one matching Account sets
  the record to review and leaves the lookup empty, rather than attaching to whichever Account sorts
  first.
- **SLA commitments are write-once, and unmeasurable conditions are represented explicitly.** The
  target is set at intake from configuration and never recalculated by a later edit, so changing a
  segment cannot quietly move a deadline already committed. Where configuration cannot produce a
  target, the record is marked unmeasurable and names the gap rather than receiving an invented
  deadline.

**Flow before Apex — and where that stopped.** Zero Apex is implemented. One Apex seam was identified
and approved when org inspection falsified the assumption that Flow could meet every requirement:
`BusinessHours.add()` is Apex-only, so holiday-aware SLA calculation cannot be declarative. **It was
deliberately not built.** The shipped SLA target uses a weekend-aware declarative calculation that is
**not** Salesforce Business Hours and does **not** honour Holidays — documented as an approximation,
with Business Hours and Holiday records left unconfigured rather than implying a fidelity the
calculation does not have.

**Access.** Org-wide defaults are restrictive first — Lead, Account and Opportunity Private, Contact
Controlled by Parent. Access is **validated against a representative non-admin Seller principal**,
not by inspecting a permission set: effective FLS is read-only on all 10 derived fields from every
grantor, neither grantor holds `Modify All Data` or `View All Data`, and platform-computed
`UserRecordAccess` returned **3 of 42 Leads readable** — exactly the coverage-queue records. A user
who cannot write `First_Touch_DateTime__c` causes it to be written, because authorized automation
retains authority the user lacks.

Application credentials are server-side only; `lib/salesforce.ts` imports `server-only`, so importing
it from browser code fails the build rather than shipping a secret.

Full detail: [`docs/architecture.md`](docs/architecture.md) ·
[`docs/security-model.md`](docs/security-model.md)

---

## Evidence and traceability

Every implemented component traces to a numbered business requirement. If a change cannot name the
`BR-##` it serves, it is not ready to be made.

| Claim | Evidence |
|---|---|
| Routing, segmentation and matching automation | [`Lead_Inbound_Before_Save.flow-meta.xml`](force-app/main/default/flows/Lead_Inbound_Before_Save.flow-meta.xml) |
| Governed rule configuration | [`customMetadata/`](force-app/main/default/customMetadata) |
| Data-quality assessment on the record | [`Data_Quality_Status__c`](force-app/main/default/objects/Lead/fields/Data_Quality_Status__c.field-meta.xml) |
| Derived SLA state | [`SLA_Status__c`](force-app/main/default/objects/Lead/fields/SLA_Status__c.field-meta.xml) |
| Access model | [`permissionsets/`](force-app/main/default/permissionsets) |
| Checks and scoring | [`checks/index.ts`](web/lib/checks/index.ts) · [`score.ts`](web/lib/score.ts) |
| Executed results, including failures | [`docs/implementation-log.md`](docs/implementation-log.md) |

**Executed and recorded:** 8/8 Increment 2 fixtures at every segment boundary, bulk-safe at batch 8 ·
9/9 Increment 3 routing fixtures covering all three ownership outcomes · 6/6 Seller negative-security
and regression tests · 15/15 Increment 4 SLA scenarios including 8 negative and guardrail tests ·
50/50 application unit tests against fixtures with no network.

**Validated** means the metadata is in source control, the scenario was executed, the outcome was
recorded **including failures**, a re-runnable query or report supports it, and the date and org
state are logged. Candidate, Implemented and Validated are distinct states, applied consistently.

> **Known evidence gap:** Salesforce validation queries were executed and their outcomes recorded,
> but most were not preserved as version-controlled, re-runnable SOQL artifacts. `scripts/soql/`
> therefore remains empty. The evidence standard has not been relaxed to accommodate this gap.

---

## Honesty and limitations

**All data is synthetic.** No real customer, personal, or organizational data appears anywhere in
this repository or in the org. Every baseline figure — 48% incomplete data, 6.4h median and 41h P90
time to assignment, 34% SLA attainment — was invented to make the scenario coherent. **A synthetic
baseline can show that a design would move a metric. It can never show that a metric was moved.**

**There are no stakeholders.** Business rules that would normally be agreed are resolved as
**Portfolio Decisions** by the practitioner, with rationale and reversibility recorded — never as
approval that did not happen.

**Scale is designed for and never claimed.** Bulk-safe design is demonstrated at fixture volume in a
Developer Edition org. Production load is not a statement this project makes.

| Limitation | Detail |
|---|---|
| Synthetic dataset not generated | Live figures read whatever records increment testing left in the org |
| Round robin deferred | Territory coverage routes to a **queue**, not an individual seller. The three `User` routing fields are deployed and consumed by no automation. |
| Single-principal access testing | Developer Edition provides 4 licences, 2 consumed by administrators. Multi-user behaviour is untested. |
| Accessibility | WCAG 2.2 AA measured for contrast, focus visibility, heading order and the zero-score meter at 1366×599. No screen-reader pass, no keyboard traversal, no viewport below 720px. |

---

## Repository

```text
force-app/main/default/   Salesforce DX source
web/                      Read-only assessment application
docs/                     Business case, requirements, architecture, data model,
                          security, testing, assumptions, implementation log
scripts/powershell/       Repository structure and secret validator
data/  tests/             Structure for the synthetic dataset and scenario results
powerbi/                  Deferred — no artifacts exist
```

`data/`, `tests/` and `scripts/soql/` hold no content yet; each is an acknowledged gap above.
`CLAUDE.md` is the engineering contract governing how work is done here.

Start with [`docs/implementation-log.md`](docs/implementation-log.md) for what exists,
[`docs/architecture.md`](docs/architecture.md) for how it works,
[`docs/requirements.md`](docs/requirements.md) for why, and [`web/README.md`](web/README.md) for the
assessment application.

---

## Running the assessment application

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The application runs at `http://localhost:3000`. Without credentials it still runs and renders its
disconnected state: every page renders, names the variables that are missing, and **shows no results
at all.** Nothing is invented when the org is absent.

Fill `.env.local` with your own org's values:

| Variable | Purpose |
|---|---|
| `SF_LOGIN_URL` | Org login host or My Domain URL |
| `SF_CLIENT_ID` | Connected App consumer key |
| `SF_CLIENT_SECRET` | Connected App consumer secret |
| `SF_API_VERSION` | Optional; defaults to `67.0` |

Authentication uses the OAuth 2.0 Client Credentials Flow — no certificate to manage and no security
token. `.env` and `.env.local` are git-ignored; `.env.example` holds placeholders only.

Tests and production build:

```bash
npm test
npm run build
```

`npm test` runs the unit suite over the controls, the lifecycle derivations, the scoring engine and
the investigation trail each finding renders, with no network and no org. It prints its own count;
none is quoted here, because a number in a README goes stale the next time a test is added. Four
runtime dependencies: `next`, `react`, `react-dom`, `server-only`.

---

## Deferred scope

**Deferred, deliberately not built under the portfolio MVP constraint:** the ~190-record synthetic
dataset · Power BI analytics over the operational decision data · round-robin distribution ·
holiday-aware SLA calculation (the approved Apex seam) · scheduled breach notification ·
activity-based first-touch capture · application deployment.

**Outside this release entirely:** Salesforce Data Cloud and Salesforce Agentforce — no
implementation, requirements, or architecture exist for them, and none will be created here. CPQ,
Revenue Cloud, Field Service, Experience Cloud, live marketing-automation or enrichment integrations,
and multi-org CI/CD promotion are likewise out of scope.

---

<sub>Salesforce Sales Cloud · Salesforce DX · Next.js · React · TypeScript · Python · PowerShell ·
Git · Claude Code. Fictional company. All data synthetic.</sub>