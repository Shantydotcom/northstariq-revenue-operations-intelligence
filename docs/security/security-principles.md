# Security Principles

| Field | Value |
|---|---|
| **Document** | Security Principles |
| **Phase** | 0C — Requirements & Governance |
| **Status** | Proposed |
| **Implementation State** | Target State |
| **Related** | `BR-053`–`BR-058` · `DEC-021` · [`access-model.md`](access-model.md) · [`../requirements/personas.md`](../requirements/personas.md) |

---

## 1. Explicit Statement of Non-Assertion

> **This project does not claim that NorthstarIQ has excessive access, misconfigured sharing, or
> over-privileged integration access. Nothing has been inspected.**
>
> Asserting a security defect without evidence would be dishonest and, in a real engagement,
> professionally damaging — it would also be trivially disproved by the first person who looked.

### What can honestly be stated

**A governance observation, not a technical finding:** security is currently treated as a
configuration task rather than a governed workstream — evidenced by its absence from the problem
framing that prompted this project.

`PROB-013` therefore carries evidence status **To Be Validated** and a **provisional** P2 priority
that may change once inspection occurs. This is why `BR-053`–`BR-058` are about **designing** access
well rather than **remediating** an asserted defect.

**No org security has been modified. No Permission Set, Profile, sharing rule, OWD, or role exists in
this repository.**

---

## 2. Security as a Primary Workstream

Security is a workstream, not a documentation footnote. The distinction is practical:

| Treated as a footnote | Treated as a workstream |
|---|---|
| Access is decided when someone is blocked | Access is designed per persona before anyone is blocked |
| Integration access is granted at deployment time | The integration principal is designed from discovery onward |
| Access is verified by inspecting configuration | Access is verified by **testing behaviour** |
| Access changes bypass governance for urgency | Access changes carry an **extra** gate |
| Security appears in one document | Security appears in requirements, tests, change management, and the data dictionary |

---

## 3. The Design Chain

```
Least Privilege                    the governing principle
      ▼
Organization-Wide Defaults         the restrictive baseline
      ▼
Role Hierarchy                     structural roll-up visibility
      ▼
Permission Sets                    capability grants, individually visible
      ▼
Permission Set Groups              persona composition, where justified
      ▼
Public Groups                      collections for sharing
      ▼
Sharing Rules                      deliberate, documented widening
      ▼
Queues                             ownership for unassigned and exception work
      ▼
Object / Field Access              FLS justified per persona
      ▼
Integration User                   a first-class principal, never an afterthought
      ▼
Security Testing                   behaviour verified in both directions
```

**The chain runs restrictive-to-permissive by design.** OWD sets the floor; every layer above widens
deliberately and traceably. A model built the other way — starting permissive and restricting — cannot
answer "why does this person have this access?", because the answer is always "they always did."

> **Nothing in this chain has been configured. This is the design sequence, not an implemented state.**

---

## 4. Principles

### `SP-01` — Least privilege is the default, and exceptions are justified

Access is granted because a documented need requires it, not because it is convenient, not because
someone is senior, and not because removing it later seems risky.

**Practical test:** for any grant, a business justification is recorded (`BR-053`). A grant nobody can
justify is a grant that should not exist.

---

### `SP-02` — Every granted capability is individually visible, grantable, and revocable

Profiles carry the minimum. Business-specific capability is granted additively through Permission
Sets composed per persona (`BR-054`).

| Reason | Detail |
|---|---|
| **`PER-13` capacity** | A single administrator at a 1:64 ratio cannot maintain per-user permission assembly |
| **Over-provisioning becomes visible** | Additive grants are individually inspectable; Profile grants hide accumulation inside a single object |
| **Change safety** | Permission Sets are source-controllable, diffable, and reviewable (`PROB-016`) |
| **Explainability** | "Which capabilities does this user hold, and from where?" becomes answerable — the security instance of the project's central theme |

> ⚠️ **This is an architectural recommendation, not an approved business decision.** The repository
> `.forceignore` already reflects a permission-set-first posture, and it **may remain as it is** — but
> a repository convention is not approval of `DEC-021`. Conflating the two would be exactly the silent
> decision the decision register exists to prevent.

---

### `SP-03` — The integration principal is designed, not improvised

`PER-17` is a first-class principal (`BR-055`). Access is scoped to exactly the objects, fields, and
operations the integration performs.

**The risk is specific and well known:** integration access is commonly granted by assigning an
administrator profile when an integration is needed, and **that grant is rarely reviewed or removed**.

Integration access is the cleanest place to demonstrate least privilege — there is no seniority
argument available to erode it — and correspondingly the most damaging place to abandon it, because
an API principal has no session to observe and no user to notice anomalies.

---

### `SP-04` — Field-level access is justified, not inherited

FLS is where least privilege is most often abandoned and most cheaply preserved (`BR-056`).

`PER-14` (Data / BI Analyst) is the clearest case: broad read is genuinely required, personal contact
detail almost certainly is not. Object-level inheritance would silently forgo a straightforward
reduction.

Every field carries a PII classification in the data dictionary, and access to PII-classified fields
is justified per persona.

---

### `SP-05` — Access is verified by testing behaviour, not by inspecting configuration

Configuration that looks correct can behave incorrectly, particularly where sharing rules, role
hierarchy, and OWD interact (`BR-057`).

> **The negative test is the one that matters and the one usually omitted.** Confirming a persona can
> see what they should proves little. Confirming they **cannot** see what they should not is the
> actual security assertion.

Evidence is a test matrix with `Actual Result` populated by a real run. **Documentation is never
sufficient evidence.**

---

### `SP-06` — Seniority is not an access level

Executive visibility is a **reporting** requirement, not an access requirement. `PER-16` needs curated
analytics, not broad org access.

This principle exists because it is the hardest to hold in practice and the most consequential to
lose. Once seniority justifies access, least privilege has no defensible boundary anywhere.

---

### `SP-07` — Destructive capability is separately granted

Merge destroys data irreversibly (`BR-012`). Capabilities whose consequences cannot be undone are
granted deliberately, not inherited from an operations role.

**Sharpened by an open decision:** while `DEC-004` is unresolved, the population of records that look
like duplicates but are legitimately distinct is **unknown**. Unrestricted merge is therefore actively
dangerous today, not merely untidy.

---

### `SP-08` — Access changes follow the governed change path

Access changes are source-controlled, reviewed, and verified after deployment (`BR-058`).

Access is the change type most often exempted from governance on urgency grounds, and the one where an
unreviewed change carries the highest consequence. Emergency access changes are permitted but
retrospectively reviewed within a defined period.

---

### `SP-09` — Access design serves genuine operational needs

Least privilege is not access minimisation for its own sake. A model that prevents people doing their
jobs is not secure — it is bypassed.

Two genuine tensions are documented rather than resolved by reflex:

| Tension | Detail | Status |
|---|---|---|
| `PER-08` BDR customer visibility | Needs read wider than ownership to avoid prospecting into existing customers. **The alternative is prospecting blind** (`PROB-002`) | `DEC-021` |
| `PER-07` SDR unassigned pool | Visibility enables self-service pickup but affects routing measurement integrity | `DEC-021` |

**Neither has an obviously correct answer.** Recording them as real trade-offs is more honest than
asserting a restrictive default that operations would immediately need to work around.

---

### `SP-10` — Security requirements are testable requirements

Security requirements state outcomes and carry acceptance criteria like any other (`BR-053`–`BR-058`).
"The system should be secure" is not a requirement. "Given persona X, access to Y is denied" is.

---

## 5. Salesforce Terminology Discipline

Precision here is immediately visible to a Salesforce reviewer.

| Correct | Not |
|---|---|
| Organization-Wide Defaults (OWD) | "org defaults", "sharing settings" |
| Permission Set | "permission", "profile" |
| Permission Set Group | "permission group" |
| Field-Level Security (FLS) | "field permissions" |
| Queue | "group" — **these are different things** |
| Public Group | "queue" — **likewise** |
| Sharing Rule | "sharing setting" |
| Role Hierarchy | "reporting structure" |

---

## 6. Developer Edition Constraint

| Enterprise Design | Portfolio Implementation |
|---|---|
| Full role hierarchy across the 64-user organization | Minimum users demonstrating hierarchy across **at least two levels** |
| Permission Set Groups per persona | Representative subset demonstrating composition |
| Sharing rules across teams and regions | Representative rules demonstrating OWD-plus-sharing behaviour |
| Multiple scoped integration principals | At least one, demonstrably not administrator-equivalent |
| Full access verification matrix | Verification across each represented persona, in both directions |

> **Design for enterprise scale. Implement representative scenarios.**

**User count is not evidence of anything.** Developer Edition licence availability is recorded as a
dependency to be verified, not assumed. **No claim is made that a Developer Edition implementation
proves enterprise-scale security.**

---

## 7. What Remains Open

Every principle above is an **architectural position**. The access **model** requires `DEC-021`.

| Question | Why it needs a human |
|---|---|
| OWD per object | Depends on the `PER-08` visibility tension — a business trade-off, not a technical one |
| Role hierarchy depth and shape | Depends on how much roll-up visibility leadership genuinely requires |
| Permission Set composition | Depends on whether Permission Set Groups justify their maintenance cost at this ratio |
| Sharing rule design | Depends on OWD |
| One integration principal or several | Depends on how many distinct integrations exist — itself unresolved (`DEC-014`, `DEC-015`, `DEC-020`) |
| Who may change governed rule configuration | A governance question with an integrity consequence |

**A recommendation is offered in [`access-model.md`](access-model.md) §9. It is analysis, not a
decision. `DEC-021` remains `Open`.**
