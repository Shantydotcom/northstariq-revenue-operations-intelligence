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
| **Assessment application** (`web/`) | Next.js App Router — 4 pages, 6 API routes, **Assessment Model v2: 11 controls across 6 assessment areas**, deterministic scoring. Authenticates by OAuth 2.0 Client Credentials and reads `Lead` and `Opportunity` by SOQL. 166 unit tests over the checks, the lifecycle controls and the scoring. |
| **Live assessment snapshot — 2026-08-24** | HTTP 200, 81 records assessed, overall health 68, six findings, three high. A dated record of that run, **not** current state. |
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

```
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

## The assessment

Five areas, each phrased as the question an operator would ask, each scored only over the population
it could actually judge.

| Area | Question it answers | Check |
|---|---|---|
| Inbound Lead Data Integrity | Do Leads carry the data routing needs, and does the Segment they hold still agree with the evidence behind it? | Missing routing data · Segment assignment mismatch |
| Lead Routing Reliability | Are governed inbound Leads reaching a valid territory and owner path? | Routing exceptions · Missing territory |
| Account Match Confidence | Can Leads be matched to an Account without ambiguity? | Ambiguous account match |
| Lead Response SLA | Are Leads with a measurable SLA within the expected response window? | SLA risk and breach |
| Open Pipeline Date Health | Do open Opportunities have a current or future Close Date? | Stale open pipeline |

**Populations are scoped deliberately, and by Salesforce rather than by the application.** Which
Lead Sources carry a routing-readiness expectation is read each run from
`Routing_Readiness_Source__mdt`. Ownership routing stays narrower — its entry criterion is
`LeadSource = 'NorthstarIQ Inbound'`, the population the Salesforce automation actually governs —
because the process makes no promise about Leads it never handled. Every check accounts for its whole
starting population: a record is either evaluated, or it is listed with the reason it was not.

**Scoring is traceable end to end. No weights, no adjustment, no inference.**

```
checkScore    = evaluated === 0 ? 100 : round(100 × (1 − failing / evaluated))
categoryScore = round(mean(check scores in that area))
overallHealth = round(mean(area scores))
```

- **Mean, not minimum.** One weak check should not erase an area that is otherwise healthy.
- **`evaluated` is what the check could judge, not the size of the org.** SLA is measured only over
  Leads carrying an `SLA_Target_DateTime__c`. A Lead never given a commitment is excluded from the
  denominator rather than counted as a breach. **Unmeasurable is not Breached.**
- A check that evaluated nothing scores 100 — absence of data is not evidence of failure.

**Finding Detail.** Each finding opens to one page that states why the control exists, what the
process does when it is working, the numbers with their arithmetic shown, the failing records
(up to ten, each linking into the connected org, showing only the fields the check reasons over),
the safeguard that was actually built, and the verification executed against it with its date and
source. Safeguards are labelled **preventive** — Salesforce stops or safely redirects the outcome —
or **detective**, where NorthstarIQ reports the condition and nothing prevents it. Five checks carry
a preventive safeguard. **Open pipeline hygiene is labelled detective, and the page says plainly
that no automated control was built for it.**

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

```
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

```
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

`npm test` runs 166 unit tests over the checks, the lifecycle controls and the scoring with no
network and no org. Four runtime dependencies: `next`, `react`, `react-dom`, `server-only`.

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
