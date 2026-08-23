# NorthstarIQ Web MVP

A read-only Next.js application over the NorthstarIQ Salesforce org. It demonstrates one loop:

**CONNECT → ASSESS → FIND → INVESTIGATE**

Connect to a Salesforce org, run an assessment of the governed inbound revenue process, see which
checks failed, and open the actual records behind every number.

---

## What it is

| | |
|---|---|
| **Routes** | Overview (`/`), Findings (`/findings`, `/findings/[checkId]`), Integrations (`/integrations`) |
| **Checks** | 6, all deterministic and pure |
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

## The six checks

| # | Check | Category | Population it judges |
|---|---|---|---|
| 1 | Leads missing routing firmographics | Data Quality | Governed-intake Leads |
| 2 | Leads in the routing exception queue | Routing | All Leads |
| 3 | Leads at risk of or in SLA breach | SLA Performance | **Leads that carry an SLA target** |
| 4 | Leads with an ambiguous account match | Identity & Matching | All Leads |
| 5 | Governed Leads without a territory | Routing | Governed-intake Leads |
| 6 | Open Opportunities with a past close date | Pipeline Hygiene | Open Opportunities |

“Governed intake” means `LeadSource = 'NorthstarIQ Inbound'` — the population the Salesforce
automation actually governs. Checks that judge routing outcomes are scoped to it, because the
process makes no promise about Leads it never handled.

A seventh check runs and is never displayed: every governed Lead should carry a segment. It returns
zero. It stays in the suite as evidence that the engine reports what it finds rather than
manufacturing work.

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
npm test     # 20 unit tests over the checks and the scoring, no network
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
    checks/index.ts             The six checks, pure functions
    score.ts                    Scoring, pure functions
    assessment.ts               Fetch, run, score
  test/                         node:test — checks and scoring
```

Checks and scoring are pure functions over records already fetched, which is why they can be tested
against fixtures with no org and no network.

---

## Status

Implemented and unit-tested. The application has **not** yet been validated against a live org —
that requires a Connected App in the Developer Edition, which is not yet created. Until then, no
claim is made about its behaviour with real data.
