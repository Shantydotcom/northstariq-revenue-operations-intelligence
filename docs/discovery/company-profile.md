# Company Profile — NorthstarIQ

| Field | Value |
|---|---|
| **Document** | Company Profile |
| **Phase** | 0B — Enterprise Discovery |
| **Status** | Proposed |
| **Implementation State** | Current State (fictional environment) |
| **Related** | [`revenue-model.md`](revenue-model.md) · [`sales-organization.md`](sales-organization.md) · [`technology-landscape.md`](technology-landscape.md) |

> **NorthstarIQ is a fictional company.** Every figure in this document is either Known Context
> (given in the project brief) or a Synthetic Planning Assumption invented to make the scenario
> coherent. Nothing here was measured from a real organization.

---

## 1. Company at a Glance

| Attribute | Value | Classification |
|---|---|---|
| Annual Recurring Revenue | ~$42M | **Known Context** |
| Customers | ~650 | **Known Context** |
| Employees | ~450 | **Known Context** |
| Markets | United States, Canada, United Kingdom, Germany | **Known Context** |
| Segments | SMB, Mid-Market, Enterprise, Strategic | **Known Context** |
| CRM | Salesforce Sales Cloud | **Known Context** |
| Analytics | Microsoft Power BI | **Known Context** |
| Company stage | Established, post-Series C scale-up | **Synthetic Planning Assumption** |
| Founded | ~11 years ago | **Synthetic Planning Assumption** |
| YoY ARR growth | 20.7% | **Synthetic Planning Assumption** (see revenue model) |

---

## 2. What NorthstarIQ Sells

> **Synthetic Planning Assumption.** The project brief does not specify a product. A product
> category is assumed here because it materially affects later ICP and segmentation design — an
> ICP framework cannot be designed without knowing what "good fit" means.

NorthstarIQ sells a **workforce planning and labor-operations SaaS platform**. The product helps
organizations with large hourly and shift-based workforces forecast labor demand, build compliant
schedules, and manage labor cost against operational targets.

| Attribute | Detail | Classification |
|---|---|---|
| Delivery | Multi-tenant cloud SaaS | Synthetic Planning Assumption |
| Pricing model | Per-employee, per-month subscription, annual contract | Synthetic Planning Assumption |
| Primary buyer | VP/Director of Workforce Operations; VP Human Resources | Synthetic Planning Assumption |
| Economic buyer | CFO or COO at Enterprise and Strategic | Synthetic Planning Assumption |
| Contract term | 12 months (SMB/Mid-Market); 24–36 months (Enterprise/Strategic) | Synthetic Planning Assumption |

### Why the product shape matters to this project

The subscription scales with the customer's **employee count**. That single fact has consequences
that run through the entire later architecture:

1. **Employee count is simultaneously the pricing driver, the ICP fit signal, and the segmentation
   input.** It is the most commercially important firmographic field NorthstarIQ holds.
2. A record missing employee count cannot be reliably qualified, segmented, routed, or forecast.
3. Industry matters because labor patterns differ sharply between retail, healthcare, logistics,
   manufacturing, and hospitality — the product's value proposition is industry-shaped.

This makes the data-quality baselines in [`baseline-metrics.md`](baseline-metrics.md) commercially
material rather than cosmetic. **Finding:** the two firmographic fields with the highest business
importance (employee count, industry) are among the least reliably populated.

---

## 3. Target Customer Profile

> **Synthetic Planning Assumption.** This describes who NorthstarIQ *currently sells to*, observed
> from the customer base. It is **descriptive**, not an approved ICP definition. A governed ICP
> definition is a Phase 0C requirement and depends on unresolved decisions.

| Attribute | Typical |
|---|---|
| Organization size | 50–15,000 employees, concentrated 150–3,000 |
| Industries | Retail, Healthcare & Senior Care, Logistics & Warehousing, Manufacturing, Hospitality |
| Workforce shape | ≥40% hourly or shift-based staff |
| Geography | US, Canada, UK, Germany |
| Multi-site | Most customers operate 5+ physical locations |

### Corporate structure characteristics — relevant to identity design

**Finding.** NorthstarIQ's customer base is structurally prone to identity and matching problems,
independent of any CRM configuration:

- **Multi-site organizations.** Customers routinely operate under multiple trading names, regional
  brand names, or site-level entity names. One commercial relationship may legitimately generate
  inbound interest from many differently-named locations.
- **Parent/subsidiary groups.** Retail and senior-care groups frequently acquire and rebrand.
  A subsidiary's staff may enquire without knowing a parent-level contract exists.
- **Franchise and licensee models.** Common in hospitality and retail. Whether a franchisee is a
  distinct customer or part of the parent relationship is a **commercial** question, not a data
  question — and NorthstarIQ has not defined it.

This last point matters: **Open Question.** Several apparent "duplicate Account" problems may in
fact be an undefined commercial policy on franchise and subsidiary treatment. Solving it purely as
a matching problem would encode an unmade business decision. This requires validation before any
matching hierarchy is designed.

---

## 4. Market Distribution

> **Synthetic Planning Assumption.** Reconciles to the ~$42M / ~650 Known Context totals.

| Market | Customers | % of customers | ARR | % of ARR | ARR / customer |
|---|---:|---:|---:|---:|---:|
| United States | 400 | 61.5% | $26.04M | 62.0% | $65,100 |
| United Kingdom | 105 | 16.2% | $6.72M | 16.0% | $64,000 |
| Canada | 85 | 13.1% | $5.04M | 12.0% | $59,300 |
| Germany | 60 | 9.2% | $4.20M | 10.0% | $70,000 |
| **Total** | **650** | **100%** | **$42.00M** | **100%** | **$64,615** |

### Operating implications

| Factor | Detail | Classification |
|---|---|---|
| Time zones spanned | UTC−8 to UTC+1 | Synthetic Planning Assumption |
| Business-day overlap | US West Coast and Germany share ~1 hour of standard business day | Finding (arithmetic) |
| Public holidays | Four distinct national holiday calendars | Known Context (implied by markets) |
| Data protection | UK and Germany customers fall under UK GDPR / EU GDPR | Assumption |

**Finding.** A single global response-time expectation cannot be measured consistently across four
markets without an agreed business-hours and holiday definition. NorthstarIQ has not established
one. This is a direct input to `DEC-006` (SLA business hours) in Phase 0C.

**Open Question.** Whether German-market records carry data-handling obligations that constrain
field-level access or retention has not been assessed. This is flagged rather than assumed — it
could materially affect the security model. All portfolio data is synthetic, so this is a design
consideration for the Enterprise Design column only.

---

## 5. Growth History and the Origin of Operational Debt

> **Synthetic Planning Assumption**, consistent with the Known Context that NorthstarIQ "grew
> faster than its operational architecture matured."

| Period | ARR | Characteristic |
|---|---:|---|
| Years 1–4 | $0 → $4M | Founder-led sales. Single market (US). Salesforce implemented in year 2 as a simple pipeline tracker. |
| Years 5–7 | $4M → $15M | First sales hires. Territories introduced informally. Canada entered. First routing automation added. |
| Years 8–9 | $15M → $28M | UK and Germany entered. Segment model introduced. Sales team roughly triples. Multiple automation mechanisms accumulate. |
| Years 10–11 | $28M → $42M | Enterprise and Strategic motions formalized. SDR/BDR function built. Reporting demand rises sharply. |

### Why this history produces the current state

Each growth phase added requirements without retiring the prior phase's implementation. This is the
central mechanism behind the operational debt described in [`current-state.md`](current-state.md):

| Phase decision | Made sense at the time | Consequence at $42M |
|---|---|---|
| Simple owner assignment when there were 3 sellers | Trivially correct | Assignment logic never designed for 30 AEs across 4 markets |
| Territories agreed verbally between managers | Fast, no system change needed | No system-of-record for territory definition |
| Segment introduced as a picklist for reporting | Solved the reporting need | Became a routing input without being redesigned for that purpose |
| Each new market handled as an exception | Unblocked revenue | Four accumulated exception patterns, none documented |
| Reporting built per-request | Responsive to leadership | Multiple divergent definitions of the same metric |

**Finding.** The operational debt is not the result of poor individual decisions. It is the result
of reasonable local decisions that were never consolidated into a governed architecture. This
framing matters for the later project: the objective is **consolidation and governance**, not the
correction of incompetence.

---

## 6. Organizational Context

| Function | Approx. headcount | Classification |
|---|---:|---|
| Go-to-market (sales, SDR/BDR, marketing, CS, RevOps, support) | ~160 | Synthetic Planning Assumption |
| Engineering, Product, Design | ~180 | Synthetic Planning Assumption |
| Professional Services & Implementation | ~35 | Synthetic Planning Assumption |
| General & Administrative | ~50 | Synthetic Planning Assumption |
| Executive | ~10 | Synthetic Planning Assumption |
| **Unallocated / not modeled** | ~15 | — |
| **Total** | **~450** | **Known Context** |

Only the go-to-market organization is modeled in detail, in
[`sales-organization.md`](sales-organization.md). Functions outside the revenue organization are
out of scope for this project and are deliberately **not** invented in detail — doing so would add
fictional surface area with no analytical value.

---

## 7. The Practitioner's Position

**Known Context.** This project is framed as though the author has joined NorthstarIQ as the senior
Salesforce / Revenue Operations / GTM Systems practitioner responsible for assessing and improving
the revenue architecture.

This framing carries three constraints that shape every discovery document:

1. **This is an assessment, not an audit of a system already understood.** Most statements about
   how NorthstarIQ's Salesforce org currently works are `Assumption` or `Open Question`, not
   `Finding`. No metadata has been inspected.
2. **There is no authority to invent business policy.** Where a business rule is genuinely
   undefined (franchise treatment, SLA targets, Strategic Account designation), the correct output
   of discovery is an Open Decision, not a decision.
3. **The problems must justify the architecture, not the reverse.** Problems are recorded in
   [`business-problems.md`](business-problems.md) because they were assessed as real, not because
   a Salesforce feature exists that would address them.

---

## 8. Classification Summary

| Classification | Count in this document | Examples |
|---|---:|---|
| Known Context | 8 | ARR, customers, employees, markets, segments, CRM, analytics tool, practitioner role |
| Synthetic Planning Assumption | 24 | Product category, pricing model, market distribution, growth history, headcount split |
| Finding | 5 | Firmographic importance vs population; structural identity exposure; business-hours inconsistency; debt mechanism; time-zone overlap |
| Open Question | 3 | Franchise/subsidiary commercial policy; German data-handling constraints; whether apparent duplicates are policy gaps |
| Assumption | 1 | GDPR applicability |

**No statement in this document asserts that any NorthstarIQ system behaviour has been inspected
or measured.**
