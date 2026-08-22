# CLAUDE.md — Engineering Contract

**Project:** NorthstarIQ — Revenue Operations Intelligence Platform
**Read this before making any change.**

---

## 1. Purpose

NorthstarIQ is a **fictional** B2B SaaS company (~$42M ARR, ~650 customers, 4 markets) used as the
setting for a portfolio-quality Revenue Operations build in Salesforce Sales Cloud and Power BI.

**The implementation is the primary artifact. Documentation supports the implementation.**

This is not an enterprise-architecture documentation exercise. The target is a system one strong
Salesforce Administrator / Revenue Operations professional could realistically build, maintain,
explain, and demonstrate.

Every implementation must trace to a requirement. **If you cannot name the `BR-##` a change serves,
the change is not ready to be made.**

Documentation lives in `docs/` — nine files. Start with `docs/requirements.md` and
`docs/architecture.md`. `docs/implementation-log.md` is the only authority on what actually exists.

---

## 2. Scope

**In scope:** data quality · identity and matching · segmentation · territory · routing · SLA ·
exceptions · security and access · reports · Power BI analytics · testing · a small synthetic
dataset.

**Out of scope — do not design, configure, reference as active, or create directories for:**

- **Salesforce Data Cloud**
- **Salesforce Agentforce**
- CPQ, Revenue Cloud, Field Service, Experience Cloud
- Live marketing-automation or enrichment integrations
- Multi-org / CI-CD promotion

The only permitted mention of Data Cloud and Agentforce is as future expansion, explicitly outside
this release.

**Adding any technology beyond Salesforce · Power BI · Salesforce CLI · Git · GitHub · D2 · Python ·
PowerShell requires documented business justification.**

---

## 3. Build Principles

### Standard Salesforce first

Evaluate every candidate component in this order, top first:

```
Standard Salesforce capability → existing org configuration → formula / validation /
configuration → Flow → Custom Metadata → custom field → Apex (last resort)
```

**Do not create metadata that duplicates standard Salesforce capability.** Business Hours, Holidays,
field history tracking, Duplicate Rules, `ParentId`, and standard firmographic fields already exist.

**Inspect the org before finalizing any metadata design.** Everything in `docs/architecture.md` and
`docs/data-model.md` is a **candidate** until then. Candidates are expected to be removed after
inspection — that is the purpose of the step.

### Flow before Apex

**Apex target is zero.** No requirement has been identified that Flow and configuration cannot meet.
If one emerges, record the justification before writing the class.

Every Flow: bulk-safe (no DML or SOQL in a loop) · fault paths on fallible elements · before-save
for same-record field assignment · no hard-coded thresholds, IDs, or mappings · recursion control ·
named and commented decision elements.

**Prefer cohesive automation over Flow proliferation.** Do not create placeholder Flows.

### Minimal customization

Preferred envelope — **guidelines, not quotas.** Exceeding one requires a documented reason in
`docs/implementation-log.md`.

| Custom fields | Flows | CMDTs | Permission sets | Queues | Reports | Dashboards | Apex |
|---:|---:|---:|---:|---:|---:|---:|---:|
| ~15–25 | ~3–5 | ~1–3 | ~3–5 | ~1–3 | ~5–8 | 1 | **0** |

**Never add metadata to reach a number.** Fewer components that fully serve a requirement beat more
components that partially serve several.

### Configuration over code

Rules the business is expected to change — segmentation thresholds, territory maps, routing
precedence, SLA targets — belong in Custom Metadata, not inside a Flow. Record the rule version on
affected records so historical decisions stay interpretable after a rule change.

### Do not over-engineer

The objective is not maximum file count, automation, dataset size, technology count, custom fields,
Flows, or complexity. It is a coherent, traceable, testable, secure, explainable,
administrator-maintainable architecture.

---

## 4. Data Rules

| Rule | Detail |
|---|---|
| **Fictional only** | Invented companies and people. **No real organizational or personal data, ever.** |
| **No real PII** | Under no circumstance, in the repository or the org |
| **Deterministic** | The same generation inputs produce the same dataset — tests must be repeatable |
| **Purposeful** | Every record exercises a named scenario in `docs/testing-strategy.md`. A record serving no scenario is deleted. |
| **Small** | ~190 records total. Volume is not evidence. Developer Edition limits are binding. |
| **Labelled** | Data is identifiable as synthetic wherever it surfaces |
| **Deliberate defects** | Broken records match the documented baseline defect profile; they are not randomly corrupted |

---

## 5. Safety

### Secrets and authentication

- **Never** commit credentials, tokens, certificates, private keys, or `.env` files
- **Never** commit Salesforce auth artifacts (`.sfdx/`, `.sf/`, `alias.json`, auth URLs)
- **Never** echo an auth URL, access token, or session ID into output or a file
- Verify `.gitignore` coverage before any commit that touches configuration
- Authenticate with `sf org login web` only — **never** paste a credential into a command

### Approval gates

| Action | Requires |
|---|---|
| Create or modify local files · `git add` | Normal working authority |
| `git commit` | **Explicit approval** |
| `git push` | **Explicit approval** |
| Create GitHub repository / change visibility | **Explicit approval** |
| `sf org login` | **Explicit approval** |
| `sf project deploy` | **Explicit approval** |
| Any org data load | **Explicit approval** |
| Any security or sharing change in the org | **Explicit approval** |

**Before every commit:** run `git status` and `git diff`, and *actually read the diff*.
**Before every push:** verify `git remote -v`, the branch, and that no secret or auth artifact is
staged.

Never perform destructive git operations (force push, history rewrite, hard reset over uncommitted
work) without explicit instruction.

---

## 6. Honesty

**These are the rules whose violation would make this project worse than not doing it.**

| Rule | Detail |
|---|---|
| **Planned ≠ Implemented ≠ Validated** | **Candidate** = documented, not built. **Implemented** = exists in org and source control. **Validated** = implemented *and* proven by an executed test with recorded results. Exactly one applies. |
| **Never claim planned capability is implemented** | `docs/implementation-log.md` is the sole authority on what exists |
| **Never fabricate a test result** | Record only what was executed, with date, org state, and **failures included** |
| **Never fabricate stakeholder approval** | There are no stakeholders. Decisions made by the practitioner as scenario owner are labelled **Portfolio Decision** — never "approved" or "agreed by the business". |
| **Separate synthetic baselines from measured results** | Every baseline is invented. A synthetic baseline can show a design *would* move a metric — never that a metric *was* moved. |
| **Never claim performance at scale** | Bulk-safe *design* is demonstrated at fixture volume. Production scale is not claimed. |
| **Surface uncertainty; do not resolve it silently** | Classify as Assumption, Open Decision, Risk, or Question and raise it. Never silently invent a material business rule. |

---

## 7. Testing

A capability is **Validated** only when: the metadata is in source control · the scenario was
executed against a loaded dataset · the actual outcome was recorded including failures · a
re-runnable SOQL query or report supports the claim · the date and org state are in
`docs/implementation-log.md`.

- Test the **requirement**, not the implementation — assert the acceptance criteria in
  `docs/requirements.md` so tests survive a change of mechanism
- **Negative assertions are the primary evidence** for access. A failed negative assertion blocks
  the access model from being called verified.
- Test at **boundaries**, on both sides
- Assert **bulk safety** at batch volume — a Flow that works at 1 record and fails at 200 is the
  most common defect in an org of this shape
- **An empty `Routing_Reason__c` on a routed record is a test failure**, not a cosmetic gap
- SOQL validation queries live in `scripts/soql/` — a re-runnable query is evidence; a screenshot is
  an illustration

---

## 8. Documentation Synchronization

**Metadata and its documentation change in the same commit.**

| When you | Update |
|---|---|
| Create or modify a field | `docs/data-model.md` — status Candidate → Implemented → Validated |
| Create or modify a Flow or CMDT | `docs/architecture.md` |
| Create or modify a permission set, OWD, or queue | `docs/security-model.md` |
| Execute any test | `docs/testing-strategy.md` results and `docs/implementation-log.md` |
| Resolve an assumption or open decision | `docs/assumptions.md` |
| Complete any increment | `docs/implementation-log.md` |

Never modify the architecture without updating its documentation. Never leave a documented component
in a status that no longer matches reality.

---

## 9. Working Sequence

```
Consolidate documentation → validate → human review → commit
    → create GitHub repository → configure remote → pre-push review → push
    → authenticate Developer Edition → inventory org
    → compare standard Salesforce against candidate design → finalize minimal metadata
    → implement incrementally → deploy → generate and load dataset → test
    → update documentation → commit and push each increment → Power BI
```

Each arrow crossing an approval gate in §5 is a **stop point**. Do not advance automatically.

---

**Current state:** Documentation consolidated. No Salesforce org authenticated. No metadata. No
dataset. No tests executed. No remote configured.
