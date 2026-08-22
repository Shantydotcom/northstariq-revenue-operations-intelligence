# Decision Governance

| Field | Value |
|---|---|
| **Document** | Decision Governance |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Related** | [`../requirements/open-decisions.md`](../requirements/open-decisions.md) · [`change-management.md`](change-management.md) · [`implementation-status-conventions.md`](implementation-status-conventions.md) |

---

## 1. Why This Document Exists

This project is built with AI assistance. The dominant failure mode of AI-assisted engineering is not
bad code — it is **plausible-looking business rules that nobody actually decided**.

A fabricated threshold does not announce itself. It appears in a document, gets referenced by a
requirement, gets implemented in a Flow, gets tested against its own invented expectation, and passes.
At no point does anything fail. The rule simply becomes real without anyone having chosen it.

> **Decision governance is the control that prevents this.** It is the mechanism that makes the rest
> of the repository trustworthy, and it is itself portfolio evidence: it demonstrates the difference
> between governed AI-assisted engineering and unsupervised generation.

---

## 2. The Decision Lifecycle

```
Unknown
   │  something is needed but nobody has established what
   ▼
Open Decision  ──────────────────  DEC-### allocated
   │  registered, owned, and visible
   ▼
Analysis
   │  what is known / what is conditional / options / consequences
   ▼
Recommendation                     ← the assistant may reach here
   │  analysis with a proposed direction, explicitly not a decision
   ▼
════════════ HUMAN DECISION BOUNDARY ════════════
   │  only a human crosses this line
   ▼
Accepted  ─────────────────────── recorded with approver and date
   │
   ▼
Requirement / ADR
   │  the decision becomes a specified obligation
   ▼
Implementation
   │
   ▼
Test
   │
   ▼
Validated
```

### The boundary is the point

Everything above the boundary is analysis and may be produced by the assistant. Nothing below it may
be. **A decision that has not crossed the boundary does not exist**, however thoroughly it has been
analysed and however obvious the recommendation appears.

---

## 3. Decision States

| State | Meaning | Requires |
|---|---|---|
| `Open` | Registered; awaiting human decision | A `DEC-###` entry |
| `Accepted` | Human-approved | **Recorded approver and date** |
| `Superseded` | Replaced by a later decision | The superseding `DEC-###`; original retained |
| `Withdrawn` | No longer required | Retained reasoning; identifier permanently retired |

**State as of Phase 0C: all 22 decisions are `Open`. Zero are `Accepted`.**

---

## 4. What Requires a Decision

Not every uncertainty is a decision. Misclassifying one wastes the register's authority; misclassifying
the other is how unmade decisions get encoded.

| Classification | Definition | Where it lives |
|---|---|---|
| **Open Decision** | A business rule that must be **chosen**; multiple defensible answers exist and the choice has business consequences | `DEC-###` register |
| **Assumption** | Something believed true and unverified; **has a fact of the matter** | `ASM-###` register |
| **Risk** | Something that may go wrong | `RISK-###` register |
| **Dependency** | Something needed from outside the work | `DEP-###` register |
| **Question** | Something unknown that investigation would answer | Open Question in context |

### The distinguishing test

> **Would investigation resolve it, or does someone have to choose?**
>
> If investigation resolves it, it is an Assumption or a Question.
> **If someone has to choose, it is a Decision.**

Worked examples:

| Item | Classification | Why |
|---|---|---|
| "Marketing owns Lead Source values" | **Assumption** | Either true or not; asking resolves it |
| "The Enterprise threshold is 500 employees" | **Decision** | No fact of the matter — the business must choose |
| "Enrichment coverage is ~70%" | **Assumption** | A provider would state it |
| "Whether we depend on enrichment at all" | **Decision** | An architectural choice with consequences |
| "Developer Edition user licence count" | **Dependency** | Checkable, externally determined |
| "Which claim wins: territory or named account" | **Decision** | Pure business policy (`PROB-005`) |

---

## 5. Rules Binding the Assistant

1. **Never mark a decision `Accepted`.** Only a human does this, and only with an approver and date
   recorded.
2. **Never invent a value where a decision is open.** Not a threshold, weight, taxonomy, precedence
   order, duration, or calendar. **Not even as a placeholder** — placeholders become real by being
   referenced.
3. **Never fabricate approval.** There are no stakeholders. "Stakeholders agreed" and "as approved by
   the business" are prohibited phrasings.
4. **Recommendations are permitted and encouraged**, provided they are labelled **Recommendation**,
   state their reasoning, and do not change status.
5. **Surface rather than resolve.** On encountering an unmade decision mid-task: register it, state
   what is known, state what is conditional, proceed with everything not dependent on it.
6. **Illustrative values must be unmistakably marked.** Where a structure's *shape* must be shown, the
   values carry an explicit warning that they are not proposals — as in
   [`../requirements/segmentation-model.md`](../requirements/segmentation-model.md) §4.3.
7. **A decision resolved outside the register does not exist.** Approval in conversation, a commit
   message, or a code comment is not approval.

### The separation that makes this workable

Most requirements are **partly** specifiable. The discipline is not "stop until decided" — it is
**separate the specifiable from the conditional and deliver the specifiable part.**

`BR-030` is the model case. The order of ownership precedence is unknown. But *"a documented,
approved precedence exists, is applied consistently, and is recorded on each record"* is a complete,
testable requirement today. Consistency delivers most of the value: a consistently applied order some
disagree with is arbitrable; an inconsistent one is not.

---

## 6. Recording an Approved Decision

When a human accepts a decision, the register entry gains:

```markdown
| **Status** | `Accepted` |
| **Approved by** | <name or role> |
| **Approved on** | <YYYY-MM-DD> |

**Decision.** <what was decided, stated precisely enough to implement>

**Rationale.** <why this option over the alternatives considered>

**Consequences.** <what this makes true, and what it forecloses>
```

Then, in order:

1. Dependent requirements move from `Open Decision` toward `Proposed`/`Approved`, and conditional
   acceptance criteria are resolved to concrete criteria.
2. Where the decision is architecturally significant, an **ADR** is written.
3. The traceability matrix is updated.
4. Where the decision changes a governed rule, the change follows
   [`change-management.md`](change-management.md).

**The analysis is never deleted.** Superseded decisions retain their reasoning. Decision history is a
project principle: understanding *why* a rule exists is what prevents it being casually reversed
later by someone who does not know what it was solving.

---

## 7. Decision Quality Standards

An entry is ready for human decision when it states:

| Element | Test |
|---|---|
| The question | Answerable as posed, not a topic heading |
| What is known | Cited to discovery evidence, with provenance labels |
| What is conditional | Explicit about what remains unknown |
| Options | Genuine alternatives with real costs, not one option and two strawmen |
| Consequences | What each option makes true and forecloses |
| Owner | A named persona who can actually decide it |
| Blocked work | Which requirements wait on it |
| Urgency | When it must be decided, and **whether delay is recoverable** |

The last row carries the most weight. `DEC-018` is not merely urgent — **delay destroys the option**,
which is a categorically different kind of urgency from the other twenty-one entries and is flagged
as such wherever it appears.

---

## 8. Anti-Patterns

| Anti-pattern | Why it is damaging |
|---|---|
| **The reasonable default** | "500 employees is a common threshold, so use it" — plausibility is precisely what makes a fabricated rule survive review |
| **The placeholder that persists** | "TBD: 4 hours" becomes 4 hours by being referenced |
| **Deciding by implementing** | Building it first makes the decision by making change expensive |
| **Deciding by testing** | A test asserting an invented expected result converts a fabrication into apparent validation |
| **Silent scope narrowing** | Solving only the decided part and quietly dropping the rest |
| **Approval by absence** | "Nobody objected" is not approval |
| **The confident summary** | Stating an open decision as settled in a summary while the detail says otherwise |

**The fourth is the most dangerous in this project specifically**, because a passing test suite is
the strongest evidence a portfolio can offer. A test suite that passes against invented rules is worse
than no tests: it is fabricated validation, which the repository conventions classify as a Critical
finding.

---

## 9. Review Points

Decisions are reviewed at every phase gate. At each gate:

1. Have any decisions been resolved? By whom, recorded where?
2. Have new decisions emerged? Are they registered?
3. Has any decision been **implicitly** resolved — a value appearing in a requirement, test, or
   document that no `Accepted` entry authorises?
4. Are dependent requirements still correctly marked?
5. Has anything urgent become irrecoverable?

**Point 3 is the audit that matters**, and it is mechanical rather than judgemental: cross-check every
concrete business value appearing anywhere in the repository against the register. A value with no
`Accepted` decision behind it is a governance defect regardless of how sensible it looks.
