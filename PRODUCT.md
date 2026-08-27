# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — the portfolio evaluator.** Hiring managers, Revenue Operations leaders, and Salesforce
practitioners assessing the practitioner's craft. They arrive cold, skeptical, and time-boxed. Their
job is to decide, quickly, whether this is real engineering judgment or a documentation exercise
dressed up as one. The fictional NorthstarIQ scenario is the vehicle; the person reading the screen
is evaluating the person who built it.

**Secondary — the six operator personas the system models.** The application must hold up as a
genuine operator tool, because that realism is precisely what the evaluator is judging. Where the
two conflict, the evaluator wins.

| ID | Persona | What they need from the system |
|---|---|---|
| `PER-01` | Revenue Operations | Explainable decisions, configurable rules, visible exceptions |
| `PER-02` | Sales Manager | Breach visibility, distribution fairness, reassignment cause |
| `PER-03` | Account Executive | Correct assignment, visible deadline, readable reason for ownership |
| `PER-04` | SDR / BDR | Fast, correct assignment; whether a record is an existing customer |
| `PER-05` | Salesforce Administrator | Maintainable automation, source-controlled configuration, rollback |
| `PER-06` | Data / BI Analyst | Governed definitions, decision data, read access without write |

Six personas, reduced from seventeen. A persona earns a place only if it owns a requirement or holds
distinct access. Analytics and capture integration principals are non-human and specified in
`docs/security-model.md`.

## Product Purpose

NorthstarIQ is a governed Revenue Operations architecture built on **Salesforce Sales Cloud** for a
fictional $42M-ARR B2B SaaS company, plus a **read-only assessment application over the org**.
Power BI analytics is deferred future work and is not part of the implemented portfolio scope.

The application demonstrates one loop: **CONNECT → ASSESS → FIND → INVESTIGATE.** Connect to a
Salesforce org, run an assessment of the governed inbound revenue process, see which checks failed,
and open the actual records behind every number.

Success is the evaluator concluding, without being told, that every number on screen is traceable to
records and that the system says only what it can prove.

## Positioning

**Explainability is a data-capture obligation designed in at the decision point, not a reporting
feature bolted on afterwards.** Every decision the system makes — how a record was segmented, which
territory it landed in, why it went to that seller, whether the SLA clock was even measurable — is
recorded as data at the moment it is made.

That position comes from the scenario's founding finding: 18.6% of Leads are reassigned within 30
days, only 11.3 points are identifiable corrections, and the remaining 7.3 points cannot be
classified at all because nothing records why any assignment happened. The routing error rate is
somewhere between 11.3% and 18.6%, and no query can narrow it.

The neighboring product — a dashboard over the same org — cannot truthfully make this claim, because
the data it would need was never captured.

## Operating Context

The evaluator's scene: arriving from a résumé link or a GitHub README, on desktop, with minutes not
hours, likely comparing several candidates' work in one sitting. Often reading the repository and
the application in the same session, cross-checking one against the other.

The operator's scene: Salesforce is the system of record and the place work is actually done. This
application is a read-only lens beside it, not a replacement for it — every finding ends by handing
the operator back to the real record in Salesforce.

The build follows a governed chain: business problem → requirement → business rule → architecture
decision → data design → security design → Salesforce component → automation → operational evidence
→ reporting → analytics → testing → measured outcome.

## Capabilities and Constraints

**The assessment application** (`web/`)

| | |
|---|---|
| Routes | Overview (`/`), Findings (`/findings`), Finding detail (`/findings/[checkId]`), Integrations (`/integrations`) |
| Checks | 6 displayed, all deterministic and pure; a 7th runs and is never displayed because it returns zero |
| Objects read | `Lead`, `Opportunity`; record counts for `Account`, `Contact` |
| Salesforce operations | SOQL query only. No create, update, or delete path exists — not disabled, absent. |
| Persistence | None. Every view reads the org live. |
| AI | None. Nothing is inferred, generated, or estimated. |
| Runtime dependencies | `next`, `react`, `react-dom`, `server-only` |
| Hosting target | Vercel Hobby free plan — no database, no queue, no scheduled work |
| Auth | OAuth 2.0 Client Credentials Flow, server-side only, never logged or returned |
| PII | None rendered. No Contact email, phone, or personal field is queried anywhere. |

**Scoring.** `checkScore = evaluated === 0 ? 100 : round(100 × (1 − failing / evaluated))`;
`categoryScore = round(mean(check scores in category))`; `overallHealth = round(mean(category
scores))`. Mean, not minimum. `evaluated` is what the check could judge, not the size of the org.
**Unmeasurable is not Breached.** A check that evaluated nothing scores 100 — absence of data is not
evidence of failure.

**Terminology that must not drift**

- **Governed intake** — `LeadSource = 'NorthstarIQ Inbound'`, the population the automation actually
  governs. Checks judging routing outcomes are scoped to it.
- **Candidate** — documented, not built, not committed to being built.
- **Implemented** — exists in the org and in source control.
- **Validated** — implemented *and* proven by an executed test with recorded results, including
  failures. Exactly one of the three applies at any time.
- **Portfolio Decision** — a decision made by the practitioner as scenario owner, with rationale and
  reversibility recorded. Never "approved" or "agreed by the business."
- **Synthetic Baseline** — an invented figure. Can show a design *would* move a metric; never that a
  metric *was* moved.

**Constraints**

- Salesforce Data Cloud, Agentforce, CPQ, Revenue Cloud, Field Service, and Experience Cloud are out
  of scope and may be mentioned only as future expansion.
- Apex target is zero. Flow and configuration before code.
- Adding any technology beyond Salesforce · Power BI · Salesforce CLI · Git · GitHub · D2 · Python ·
  PowerShell requires documented business justification. This binds the web application's dependency
  list as much as the org.
- `git commit`, `git push`, org login, deploy, data load, and any sharing change are explicit
  approval gates (`CLAUDE.md` §5).

**Explicitly undecided.** Five business rules remain open with defined interim behaviour; none block
the build. Where a rule is unagreed, the pattern is to build the capability and leave the rule
configurable rather than inventing the rule. See `docs/assumptions.md`.

## Brand Commitments

- **Name and wordmark.** "NorthstarIQ", set with `IQ` visually distinct from `Northstar`. Fixed.
- **The synthetic-data banner.** A persistent, unmissable statement that all companies, people, and
  records are fictional and the application is read-only. This is a data rule from `CLAUDE.md` §4
  ("data is identifiable as synthetic wherever it surfaces"), not a style element, and may not be
  removed, collapsed, or made dismissible.
- **Honesty labelling stays visible in the interface.** Candidate / Implemented / Validated and
  Synthetic Baseline distinctions must remain legible on screen and must never be smoothed away for
  visual calm.
- **Voice.** Plain, specific, and unhedged. States figures with their reliability class attached.
  Says what it cannot prove. No marketing register, no invented enthusiasm.
- **Runtime dependency floor.** Four runtime packages: `next`, `react`, `react-dom`, `server-only`.
  No UI framework, CSS library, icon package, or font package. The lean dependency list is a
  deliberate part of the argument, so design must be achievable in hand-written CSS and inline SVG.

## Evidence on Hand

**Real and usable**

- A deployed and human-accepted Salesforce implementation — configuration-driven segmentation,
  matching, territory and routing, with SLA and explainability captured on the record. **Zero Apex.**
  `docs/implementation-log.md` is the sole authority on what exists.
- The implemented `web/` application: six checks, deterministic scoring, 20 unit tests over checks
  and scoring, running with no network against fixtures in `web/test/fixtures.ts`.
- Nine consolidated documents in `docs/` covering business case, requirements, architecture, data
  model, metrics, security, testing, assumptions and the implementation log.
- A working disconnected state that renders honestly without credentials.
- A ~190-record synthetic dataset **specification** in `docs/testing-strategy.md` §3 — deterministic
  and scenario-purposeful. **The dataset itself has not been generated;** `data/` is empty.
- `CLAUDE.md` — the engineering contract governing how work is done.

**Absences future work must not fabricate**

- **No real customers, logos, testimonials, case studies, press, or usage numbers exist.**
  NorthstarIQ is fictional and has no stakeholders. Never render invented social proof.
- **Every baseline figure is synthetic** — 48% incomplete data, 6.4h median and 41h P90 time to
  assignment, 21% unassigned beyond 24 business hours, 34% SLA attainment, 27% first touch
  undeterminable, 18.6% 30-day reassignment. Label them as such wherever they surface.
- **The application is not deployed.** No hosting project, no environment variables, no URL. The
  Connected App exists and the connected **read path** has been exercised — that validates
  authentication and SOQL read, and **nothing about Salesforce control behaviour.** A finding is a
  **symptom report, not a control test**, and no claim may imply otherwise.
- No screenshots of live org data. No performance-at-scale claims. Measured outcomes exist **only**
  where a measurement was taken and its scope stated — accessibility contrast and focus at 1366×599,
  and one recorded live assessment run.

## Product Principles

1. **Every number is traceable to records.** The interface's job is to shorten the distance between
   a figure and the rows behind it. A number the visitor cannot open is a number they cannot trust.
2. **Say only what can be proven, and label the rest.** Candidate, Implemented, Validated, Synthetic
   Baseline. Precision about the limits of a claim *is* the credibility, not a caveat that dilutes
   it.
3. **Unmeasurable is not failure.** A population with no commitment to miss cannot breach one. The
   product distinguishes "we checked and it is broken" from "we could not judge this" everywhere it
   reports.
4. **Explainability at the decision point.** Surface *why*, not just *what* — which rule fired, which
   version of it, and what it acted on.
5. **Restraint is the argument.** Zero Apex, four runtime dependencies, six checks, ~190 records.
   Nothing is added to reach a number. Anything added must serve a named requirement.

## Accessibility & Inclusion

**WCAG 2.2 AA** is the required standard for the application, held as a product commitment rather
than a nice-to-have: enterprise Salesforce buyers expect it, and the evaluator audience includes
practitioners who will check.

Achieved without an accessibility library, consistent with the four-dependency floor — semantic HTML,
correct heading order, real focus states, keyboard-operable evidence tables, contrast held at AA for
the status colours that carry meaning, and status never encoded by colour alone.
