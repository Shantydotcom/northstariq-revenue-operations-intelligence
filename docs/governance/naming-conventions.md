# Naming Conventions

| Field | Value |
|---|---|
| **Document** | Naming Conventions |
| **Phase** | 0A — Repository Foundation |
| **Status** | Approved (repository convention) |
| **Applies to** | All artifacts in this repository |

Consistent naming is graded portfolio evidence. Inconsistent naming reads as inconsistent
thinking. This document is the single source of truth for what things are called.

---

## 1. Canonical Subsystem Names

These names are **canonical**. Use them exactly, including capitalization and ampersands.

| Capability | Canonical Name |
|---|---|
| Entire project | Revenue Operations Intelligence Platform |
| Business process | Lead-to-Revenue Lifecycle |
| Salesforce / data architecture | Revenue Operations Architecture |
| Data quality | Revenue Data Quality Framework |
| Identity | Account Identity & Matching Engine |
| Qualification | ICP Intelligence Framework |
| Lifecycle | Lifecycle Governance Framework |
| Segmentation | Revenue Segmentation Framework |
| Territories | Territory Management Framework |
| Routing | Revenue Routing Engine |
| SLA | Revenue SLA Framework |
| Exceptions | Revenue Operations Exception Framework |
| Analytics model | Revenue Intelligence Model |
| Power BI experience | Revenue Intelligence Command Center |

### The "intelligence" rule

**Do not call everything "intelligence."** The word is reserved for exactly four things:

- Revenue Operations Intelligence **Platform** (the project)
- **ICP Intelligence** Framework (fit scoring)
- Revenue **Intelligence** Model (the analytics semantic model)
- Revenue **Intelligence** Command Center (the Power BI experience)

Everything else is a *Framework*, an *Engine*, a *Model*, or an *Architecture*. Reserving the term
keeps it meaningful.

### Word choice by artifact type

| Suffix | Means | Example |
|---|---|---|
| **Framework** | A governed set of rules, definitions and controls | Revenue Data Quality Framework |
| **Engine** | Something that executes a decision at runtime | Revenue Routing Engine |
| **Model** | A structured representation of data or process | Revenue Intelligence Model |
| **Architecture** | The overall structural design of a layer | Revenue Operations Architecture |
| **Platform** | The whole system | Revenue Operations Intelligence Platform |

---

## 2. Retired Names

The following names are **retired**. They must not appear except when explicitly documenting
historical naming, and then only with the label "(historical name)".

- ~~Revenue Control Tower~~
- ~~Lead-to-Revenue Control Tower~~
- ~~Lead-to-Revenue Control Tower Platform~~

---

## 3. Identifier Conventions

| Prefix | Meaning | Format | Example |
|---|---|---|---|
| `BR-###` | Business Requirement | 3 digits, zero-padded | `BR-001` |
| `DEC-###` | Open Decision | 3 digits, zero-padded | `DEC-001` |
| `ADR-####` | Architecture Decision Record | 4 digits, zero-padded | `ADR-0001` |
| `TEST-###` | Test case | 3 digits, zero-padded | `TEST-001` |
| `KPI-###` | Governed KPI definition | 3 digits, zero-padded | `KPI-001` |
| `RISK-###` | Risk register entry | 3 digits, zero-padded | `RISK-001` |
| `ASM-###` | Assumption | 3 digits, zero-padded | `ASM-001` |
| `DEP-###` | Dependency | 3 digits, zero-padded | `DEP-001` |
| `PER-##` | Persona | 2 digits, zero-padded | `PER-01` |

### Rules

1. **Identifiers are immutable.** Once assigned, an identifier never changes meaning.
2. **Never renumber.** If items are reordered in a document, identifiers stay attached to content.
3. **Never reuse.** A withdrawn item keeps its identifier and is marked `Withdrawn`. The identifier
   is permanently retired. This preserves decision history — a core project principle.
4. **Always cross-reference by identifier.** Write "as recorded in `DEC-003`", never "as discussed
   above." Documents are read out of order and in isolation.
5. Identifiers are assigned in the phase that creates the artifact and are allocated sequentially
   in order of creation, not importance.

---

## 4. File & Directory Naming

| Artifact | Convention | Example |
|---|---|---|
| Markdown documents | `kebab-case.md` | `business-requirements.md` |
| ADRs | `ADR-####-kebab-case-title.md` | `ADR-0001-metadata-driven-revenue-architecture.md` |
| D2 diagrams | `kebab-case.d2` | `revenue-routing-architecture.d2` |
| Python scripts | `snake_case.py` | `generate_lead_fixtures.py` |
| PowerShell scripts | `Verb-Noun.ps1` (PascalCase, approved verb) | `Test-RepositoryStructure.ps1` |
| SOQL files | `kebab-case.soql` | `unassigned-leads-by-territory.soql` |
| DAX files | `kebab-case.dax` | `sla-breach-rate.dax` |
| Power Query | `kebab-case.pq` | `lead-source-normalization.pq` |
| Data fixtures | `object-scenario.csv` | `lead-duplicate-scenarios.csv` |

Directories are `kebab-case`, except `docs/ADR/` which is uppercase by convention for visibility.

---

## 5. Salesforce Metadata Naming

> **Status:** Convention established in Phase 0A. **No Salesforce metadata exists yet.**
> These rules govern Phase 1+ implementation.

### Custom fields

| Rule | Detail |
|---|---|
| API name | `Pascal_Snake_Case__c` — e.g. `Routing_Reason__c` |
| Label | Business language, title case — e.g. `Routing Reason` |
| No abbreviations | `Territory__c` not `Terr__c`. Administrator maintainability wins. |
| No system prefixes | Do not prefix with `NIQ_` — the org is single-purpose |
| Boolean naming | State the true condition: `Is_Strategic_Account__c`, `Has_Valid_Domain__c` |
| Timestamp naming | End with `_Timestamp__c` or `_Date__c` — e.g. `Assignment_Timestamp__c` |
| Reason/explainability | End with `_Reason__c` — e.g. `Match_Reason__c`, `Routing_Reason__c` |
| Score naming | End with `_Score__c`; grades end with `_Grade__c` |
| Status naming | End with `_Status__c` — e.g. `SLA_Status__c`, `Duplicate_Status__c` |

**Every custom field must appear in the data dictionary before it is built**, with a documented
business purpose and a linked `BR-###`. Fields without a requirement are not created.

### Flows

| Rule | Detail |
|---|---|
| API name | `Object_Trigger_Purpose` — e.g. `Lead_BeforeSave_Normalize_Data` |
| Trigger position | Include `BeforeSave` / `AfterSave` / `Screen` in the name |
| One purpose per Flow | Name states the single responsibility |
| Description | Mandatory. Must cite the `BR-###` it implements. |

Examples: `Lead_BeforeSave_Normalize_Data` · `Lead_AfterSave_Route_Owner` ·
`Lead_AfterSave_Set_SLA_Deadline` · `Account_Screen_Review_Match_Exception`

### Other metadata

| Type | Convention | Example |
|---|---|---|
| Custom Metadata Type | `Purpose_Setting__mdt` | `Routing_Rule__mdt` |
| Validation Rule | `Object_Condition_Must_Be_X` | `Lead_Country_Must_Be_Supported` |
| Permission Set | `Persona_Access` | `Revenue_Operations_Access` |
| Permission Set Group | `Persona_Group` | `Sales_Manager_Group` |
| Public Group | `Descriptive_Group` | `Enterprise_Sellers` |
| Queue | `Purpose_Queue` | `Routing_Exception_Queue` |
| Role | Business title | `Enterprise AE - East` |
| Report folder | Business domain | `Revenue Operations - SLA` |

---

## 6. Git Naming

### Branches

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/kebab-case` | `feat/revenue-routing-engine` |
| Documentation | `docs/kebab-case` | `docs/revenue-operations-discovery` |
| Fix | `fix/kebab-case` | `fix/routing-null-territory` |
| Test | `test/kebab-case` | `test/routing-boundary-scenarios` |
| Chore | `chore/kebab-case` | `chore/initialize-repository` |

### Commits — Conventional Commits

Format: `type: imperative summary in lowercase`

| Type | Use for |
|---|---|
| `chore` | Repository/tooling housekeeping |
| `docs` | Documentation only |
| `feat` | New capability (including declarative Salesforce configuration) |
| `fix` | Corrections to existing behaviour |
| `test` | Test matrices, fixtures, validation |
| `refactor` | Restructuring without behaviour change |

Rules: imperative mood ("add", not "added"), lowercase after the type, no trailing period,
subject ≤ 72 characters. Use the body to cite affected identifiers (`BR-012`, `DEC-004`).

Examples:

```
chore: initialize NorthstarIQ revenue operations intelligence
docs: add revenue operations discovery
docs: define lead lifecycle requirements
feat: add revenue data quality framework
feat: implement metadata-driven segmentation
feat: implement revenue routing engine
feat: add revenue SLA automation
test: add routing boundary scenarios
docs: add routing failure runbook
```

---

## 7. Terminology Discipline

Use Salesforce terminology precisely. Imprecision here is immediately visible to a Salesforce
hiring manager.

| Use | Not |
|---|---|
| Record-triggered Flow | "workflow", "trigger" (unless Apex trigger is meant) |
| Organization-Wide Defaults (OWD) | "org defaults", "sharing settings" |
| Permission Set | "permission", "profile" |
| Lead Status | "lead stage" |
| Opportunity Stage | "opportunity status" |
| Lead conversion | "lead promotion" |
| Custom Metadata Type | "custom setting" (these are different things) |
| Queue | "group" (these are different things) |
| Field-Level Security (FLS) | "field permissions" |

Business terms are equally governed. `MQL`, `SAL`, `SQL`, `ICP`, `Segment`, `Territory`,
`Lifecycle Stage`, and `First Touch` each get a single governed definition — established in
Phase 0C, not improvised per document.

---

## 8. Capitalization

- **Salesforce objects** — capitalized: Lead, Account, Contact, Opportunity, User, Case.
- **Salesforce features** — capitalized: Flow, Queue, Permission Set, Sharing Rule, Report,
  Dashboard, Validation Rule, Custom Metadata Type.
- **Generic nouns** — lowercase: field, record, user (a person), seller, owner, territory
  (the concept, as opposed to the Territory Management Framework).
- **Product names** — exactly as vendor writes them: Salesforce Sales Cloud, Microsoft Power BI,
  Salesforce DX, Salesforce CLI, Claude Code, VS Code, GitHub, D2.
