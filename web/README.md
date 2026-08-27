# NorthstarIQ Web MVP

A read-only Next.js application over the NorthstarIQ Salesforce org. It demonstrates one loop:

**CONNECT → ASSESS → FIND → INVESTIGATE**

Connect to a Salesforce org, run an assessment of the governed inbound revenue process, see which
checks failed, and open the actual records behind every number.

---

## What it is

| | |
|---|---|
| **Routes** | Pages: Overview (`/`) · Findings (`/findings`, `/findings/[checkId]`) · Integrations (`/integrations`). APIs: `GET /api/salesforce/status` · `POST /api/assessment/run` · `GET /api/findings/[checkId]` |
| **Checks** | 7, all deterministic and pure |
| **Objects read** | `Lead`, `Opportunity` — plus record counts for `Account` and `Contact` |
| **Salesforce operations** | SOQL query only |
| **Runtime dependencies** | `next`, `react`, `react-dom`, `server-only` |
| **Persistence** | None. Every view reads the org live. |
| **AI** | None. Nothing here is inferred, generated or estimated. |

### What it is not

It is not a rules engine, a monitoring product, or a Salesforce management tool. There is no
create, update or delete path anywhere in the application — not disabled, absent. It holds no
database, no queue and no scheduled work, because it targets the Vercel Hobby free plan.

---

## The seven checks

| # | Check | Area | Population it judges |
|---|---|---|---|
| 1 | Missing Routing Data | Inbound Lead Data Integrity | Leads whose Lead Source is a configured Routing Readiness Source |
| 2 | Segment Assignment Mismatch | Inbound Lead Data Integrity | Leads carrying a readable segmentation result |
| 3 | Routing Exceptions | Lead Routing Reliability | Leads submitted to NorthstarIQ ownership routing |
| 4 | Missing Territory | Lead Routing Reliability | Leads the coverage model evaluated |
| 5 | Ambiguous Account Match | Account Match Confidence | Leads carrying a recorded match decision |
| 6 | SLA Response Risk | Lead Response SLA | **Leads that carry an SLA target** |
| 7 | Stale Open Pipeline | Open Pipeline Date Health | Open Opportunities |

**Every check accounts for its whole starting population.** A record is either evaluated, or it
appears under *Records not evaluated* with a reason built from its own Salesforce values. Nothing is
dropped silently, and a record the underlying process never assessed is never counted as a pass.

**Populations are scoped from Salesforce, not from this application.** Which Lead Sources carry a
routing-readiness expectation is read each run from `Routing_Readiness_Source__mdt`; changing it is a
configuration record, not a deployment. Ownership routing stays narrower — its entry criterion is
`LeadSource = 'NorthstarIQ Inbound'` — because the process makes no promise about Leads it never
handled.

One further check runs and is never displayed: every governed Lead should carry a segment. It
returns zero. It stays in the suite as evidence that the engine reports what it finds rather than
manufacturing work.

### Source Evidence — how check 2 knows what to expect

Check 2 is the only one whose expected value comes from somewhere other than the record's own
current state, so it says where. **Source Evidence** is that statement.

When segmentation runs, Salesforce writes both the Segment and the evidence behind it onto the Lead:
the employee count it read, the Segment that count resolved to, and the version of the configuration
that decided it. The check compares **that recorded result** with the Segment the Lead carries now.

```
Lead.NumberOfEmployees            500                       input
  → Segment_Band__mdt             Segment Band, Rule v1.0   Salesforce configuration
  → Lead.Segment_Basis__c         "Employee Count: 500 -> Mid-Market | Rule v1.0"
  → Lead.Segment__c               "SMB"                     current result
  → assessment                    Mismatch
```

Four recorded forms are supported, taken from the Flow's own formula and assignment elements:
employee-count band · Strategic Account · no active band matched · employee count missing. Anything
else is reported as uninterpretable and left out of the score — **honest exclusion over false
precision.** A guessed expected Segment would either manufacture a failure or conceal one.

**It does not re-run today's bands over an older Lead.** A Lead segmented under an earlier rule
version is judged on the rule that actually decided it, so a legitimate configuration change is
never reported as record drift.

**Strategic is an Account designation, not a band.** Its Source Evidence names the Account, and does
not claim Custom Metadata decided it.

**One limitation, stated plainly.** The least-privilege integration identity cannot query
`Segment_Band__mdt` — the query returns `INVALID_TYPE`. The application therefore reports the rule
version **Salesforce recorded on the Lead**, and does **not** reconcile it against the live Custom
Metadata during a run. No permission was added to obtain that reconciliation.


---

## Scoring

Every number is traceable from the records upward. No weights, no adjustment.

```
checkScore    = evaluated === 0 ? 100 : round(100 × (1 − failing / evaluated))
categoryScore = round(mean(check scores in that category))
overallHealth = round(mean(category scores))
```

Two decisions are worth stating plainly:

- **Mean, not minimum.** A category with one weak check and one perfect check is not as bad as its
  worst check.
- **`evaluated` is what the check could judge, not the size of the org.** SLA is measured only over
  Leads that carry an SLA target. A Lead created before the SLA capability existed has no
  commitment to miss, so counting it as a breach would overstate failure. **Unmeasurable is not
  Breached.**

A check that evaluated nothing scores 100. Absence of data is not evidence of failure.

---

## Running it

```bash
cd web
npm install
cp .env.example .env.local     # then fill in your own org's values
npm run dev                    # http://localhost:3000
```

Without credentials the application still runs and renders its disconnected state — it will not
show invented results.

```bash
npm test     # 50 unit tests over the checks and the scoring, no network
npm run build
```

### Environment variables

| Variable | Purpose |
|---|---|
| `SF_LOGIN_URL` | Org login host, e.g. `https://login.salesforce.com` |
| `SF_CLIENT_ID` | Connected App consumer key |
| `SF_CLIENT_SECRET` | Connected App consumer secret |
| `SF_API_VERSION` | Optional; defaults to `67.0` |

Authentication uses the **OAuth 2.0 Client Credentials Flow** — no certificate to manage and no
security token, unlike the JWT Bearer and Username-Password flows.

---

## Credential handling

- **Server-side only.** The variables are deliberately *not* `NEXT_PUBLIC_`, and `lib/salesforce.ts`
  imports `server-only`, so importing it from browser code fails the build rather than shipping a
  secret.
- **Never logged, never returned.** Access tokens live in memory for the life of a server instance
  and never reach a cookie, storage or a response body.
- **Salesforce errors are classified, not forwarded.** A Salesforce error body can restate the query
  or the submitted credentials, so the boundary replaces it with one of a small set of safe codes.
- **No PII is rendered.** No Contact email, phone or personal field is queried anywhere.

`.env` and `.env.local` are git-ignored; `.env.example` holds placeholders only.

---

## Layout

```
web/
  app/
    page.tsx                    Overview — connection state and the assessment
    findings/page.tsx           Findings list
    findings/[checkId]/page.tsx Evidence for one check
    integrations/page.tsx       Connection detail and what is read
    api/                        status · assessment/run · findings/[checkId]
  components/                   Presentational only
  lib/
    salesforce.ts               The only module that holds credentials
    soql.ts                     Static SOQL literals — no interpolation
    checks/index.ts             The seven checks, pure functions
    score.ts                    Scoring, pure functions
    assessment.ts               Fetch, run, score
    presentation.ts             Operator-facing labels, safeguards, verification strings
  test/                         node:test — checks and scoring
```

Checks and scoring are pure functions over records already fetched, which is why they can be tested
against fixtures with no org and no network.

---

## Status

**Implemented and unit-tested** — 20 of 20 tests pass against fixtures, with no network.

**The connected read path was exercised against the Developer Edition org on 2026-08-24.** One
assessment returned HTTP 200: 81 records, overall health 68, six findings. That validates
**authentication and SOQL read, and nothing further.**

**What that run does not establish.** The application reads what the org already recorded — **a
finding is a symptom report, not a control test.** It exercises no Salesforce control, asserts no
control outcome, and remediates nothing; **there is no write path in it at all.** The judged
population was whatever records increment testing left in the org, not the designed ~190-record
dataset, which has not been generated. The five safe error codes have not been exercised against a
real Salesforce error — the failure path was tested by intercepting the browser `fetch`.

**Not deployed.** No hosting project, no environment variables, no URL.
