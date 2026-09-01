---
name: visual-fidelity
description: Implement or review a NorthstarIQ visual change against approved design authority. Use when the task is about matching an approved reference, correcting visual drift, layout, spacing, typography, sizing, alignment, visual hierarchy, responsive presentation, visual consistency or visual regression — or when deciding whether an implementation matches its reference. Resolves the design-authority manifest before trusting any reference, makes bounded changes, and verifies by rendering. Escalates to context-discovery if fidelity would require changing product behaviour.
---

# Visual Fidelity

A bounded procedure for changing or reviewing how a NorthstarIQ surface **looks**, without letting a
stale screenshot, a filename, a shared selector or a picture of old data change what the product
**does**.

Governance comes from `~/.claude/CLAUDE.md` and the repository `CLAUDE.md`; both apply throughout and
are not restated here. What follows is procedure.

## When to run it

Run it when the work is primarily about matching an approved reference · correcting visual drift ·
layout · spacing · typography · sizing · alignment · visual hierarchy · responsive presentation ·
visual consistency · visual regression · or judging whether an implementation matches its reference.

**Bounded visual work is Tier 1.** It needs no business authority and no requirements lookup —
editing application files is not by itself a reason to investigate business rules. Do not invoke
`context-discovery` for a spacing correction.

## Escalation boundary

Visual authority governs **presentation**, never business truth.

If matching a reference would require changing business meaning · calculations · assessment or
control logic · runtime values · lifecycle behaviour · findings · populations · statuses · evidence ·
navigation semantics · or other consequential product behaviour — **the task is no longer visual.**
Stop the visual pass and invoke or recommend `context-discovery` before any such change.

> **Never change logic, data or configuration to make the application resemble an image.** A figure
> in a reference is illustrative. If the rendered value differs from the reference, the
> implementation is the truth and the reference is a picture of a different moment.

## Procedure

### 1 · Resolve design authority

Read `.claude/design-authority.md` **before** relying on any reference. Establish which reference
governs the target surface · which regions are authoritative · which are explicitly not · the
recorded known deviations · and whether the reference has been superseded.

**A filename never establishes identity.** When the local reference is available, open and inspect
the image itself; do not infer its contents from its name, from this procedure, or from memory of an
earlier session.

If the reference images are not present locally, say so and stop — fidelity cannot be established
from a description of an image.

If the manifest and the inspected image disagree in a way that prevents determining authoritative
intent, that is a genuine authority problem. Do not guess.

### 2 · Establish the implementation baseline

Inspect the current implementation of the target surface: the components rendering it, the styling
sources, any **shared** components or selectors it depends on, its responsive behaviour, and nearby
code a change could reach.

Capture the working-tree state before editing, so pre-existing differences stay distinguishable from
task-introduced ones. Do not rewrite unrelated components because they could be cleaner.

### 3 · Classify every observed difference

Compare against **authoritative regions only**, then sort what you find:

**FIX** — a genuine mismatch inside the authorised visual scope.

**RESOLVE AND CONTINUE** — understandable without a human decision: a deviation already recorded in
the manifest · a region the manifest marks non-authoritative · a shared selector or component
touching more than one surface, where inspection reveals the correct bounded fix · an uncertainty the
current source settles. Resolve it and carry on.

**REPORT — DO NOT FIX** — a real visual or implementation issue outside the requested scope. One
line; no scope expansion.

**HARD STOP** — only when authoritative visual intent cannot be established · two authoritative
references genuinely conflict and nothing resolves them · the requested result depends on an
unresolved consequential product decision · the change would overwrite unrelated or pre-existing
work · or another repository stop condition applies.

> **Not every difference from a screenshot is a defect.** A recorded deviation is the manifest doing
> its job, not a finding.

### 4 · Make the smallest bounded change

Implement only what corrects the verified mismatch. Reach for existing components, existing CSS
patterns, existing tokens and variables, and existing layout primitives before introducing any new
abstraction.

Do not add a UI, CSS, icon or font library for visual polish.

**Shared selectors and components need blast-radius care.** Before changing one, inspect the other
surfaces it reaches. If a shared change would regress an approved surface, scope the change to the
target instead — narrowing the selector is an engineering answer, not a reason to stop.

### 5 · Render the affected surface

**Fidelity cannot be established from source inspection alone.** Render the surface using the
project's existing workflow, respecting the repository's build and dev hygiene — in particular, check
whether a development server is already running before starting another.

### 6 · Compare the rendered result to the authority

Evaluate the authoritative regions for the dimensions the task concerns: layout · spacing ·
alignment · typography · sizing · hierarchy · component placement · responsive behaviour where
relevant.

**Do not require literal pixel identity** where the reference establishes no exact specification. The
goal is faithful implementation of approved design intent, not overfitting to a screenshot.

State the **viewport actually inspected**. If it is narrower than the reference, implement at the
reference's proportions and report the difference rather than compressing the design to fit the
screen available.

### 7 · One correction pass

If the render exposes a clear task-introduced fidelity problem, make one focused correction and
render again.

**One pass. Then stop.** If what remains is subjective, marginal, or outside the authorised scope,
report it rather than continuing. This procedure improves fidelity; it does not turn a bounded task
into a redesign.

### 8 · Validate proportionately

Use evidence the change actually warrants: the rendered comparison · targeted source inspection · a
responsive check · verification of any shared component the change reached · a type check or tests
where the edit could have touched behaviour.

Do not run unrelated validation because it exists. **Never claim visual fidelity from code inspection
alone** — a render is the evidence.

## Output — the Visual Fidelity Report

Keep it proportional to the change.

```
### Surface                 route or component reviewed
### Design authority        manifest entry used, and its authoritative scope
### Baseline                relevant current implementation and pre-existing state
### Differences             classified FIX / RESOLVE AND CONTINUE / REPORT — DO NOT FIX / HARD STOP
### Changes made            the smallest bounded visual changes
### Render verification     what was rendered and compared, at what viewport
### Remaining deviations    known, unrelated, non-authoritative or unresolved
### Validation              checks actually performed, with real results
### Result                  PASS | PASS WITH REPORTED DEVIATIONS | BLOCKED
```

Name what supports each material claim — the manifest entry, the file changed, the rendering
observed. Never claim a check ran that did not.

## Boundaries

This skill must never: invent a business rule · alter assessment or control logic for presentation ·
alter Salesforce data or configuration · fabricate a runtime value · change a calculation to match a
screenshot · treat screenshot content as runtime truth · redesign an unrelated surface · silently
expand scope · add a dependency · **modify the design-authority manifest to make an implementation
pass** · stage · commit · push.

Where consequential behaviour genuinely must change, escalate to `context-discovery`.

It must not contain, or write back into itself, any current design fact — reference filenames ·
mockup pixel measurements · routes · page inventory · component names · navigation items · the
deviations currently recorded · reference checksums · implementation status. Those live in the
manifest or in the implementation, are discovered per task, and are reported in the Visual Fidelity
Report.

**The manifest is amended when a human approves a design change — never to close a gap this
procedure found.**
