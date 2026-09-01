# Design authority

Which local design reference governs which application surface, and — just as importantly — which
parts of each reference govern nothing.

## Why this file is tracked and the images are not

The reference images live in `design-references/`, which is **git-ignored**. They are roughly 5 MB of
PNG kept on the working machine as design input; the repository otherwise tracks no binaries.

This file is tracked, so the **mapping survives a fresh clone even though the images do not**. A
clone has the authority map without the artwork. That is deliberate, and it has one consequence worth
stating plainly:

> **Visual-fidelity work can only proceed when the local reference images are actually present.** If
> they are absent, say so and stop rather than working from this description of them. This file
> records what governs what; it is not a substitute for looking at the image.

## Rules for using a reference

1. **A filename never establishes page identity.** This project has already renamed a reference and
   changed which page it governs. Read the table below, not the file name.
2. **Open and inspect the image.** Do not infer its contents from this file, from its name, or from
   memory of an earlier session.
3. **Read the reference's Known deviations before comparing anything.** They exist to stop stale
   elements inside an approved image from silently becoming requirements.
4. **A reference governs visual design only.** It never establishes a runtime fact — see
   *What no reference governs*.
5. **Approved is not final, but it is not optional either.** Build to the reference; do not redesign
   it unprompted. Refinement needs implementation evidence, controlled test data, or a usability
   finding.

## Current authoritative references

| Route / surface | Reference | SHA-256 (first 16) | Approval status | Governs | Known deviations |
|---|---|---|---|---|---|
| `/` — Dashboard / Homepage | `Homepage.png` | `e28d6f220f32c97c` | Approved working baseline — **approval date not recorded** | Main content, at all times | see below |
| `/assessment` — Assessment | `Assessment Page.png` | `e4833665db682c6a` | Approved working baseline — **approval date not recorded** | Main content | see below |

Full checksums, computed from the files on disk:

```
e28d6f220f32c97cfbf896eb27a48652357476d398045bf4ab67186e138b1a85  Homepage.png
e4833665db682c6a90a4f9e172c662d06ae2643c97191aa1e817556128026d36  Assessment Page.png
```

**On approval dates.** No authoritative project source records the date a human approved either
reference. File and Git timestamps record file history, not approval, so none is used here. The
status is stated honestly rather than dated inaccurately; if an approval date is later established
from an authoritative source, record it here with that source named.

**Route mapping evidence.** Both entries are corroborated by repository `CLAUDE.md` §10 *UX & Design
Authority* and by `design-references/README.md`, which agree. Each image was also opened and
inspected directly when this file was written.

## What a reference governs

Only within the surface named in the table, and only where the *Known deviations* below do not
exclude it:

page composition · visual hierarchy · layout · spacing and vertical rhythm · typography treatment ·
component placement · surfaces, borders and radii · icon treatment · the visual relationships between
that page's own sections.

Everything visible in an image is **not** automatically authoritative. Where this file marks
something a deviation, the implementation governs.

## What no reference governs

A screenshot is a picture of one moment. It establishes no current truth about:

runtime record counts · finding totals · severities · timestamps · Salesforce org names ·
connection status · assessment results · evaluated populations · failing populations · undetermined
populations · lifecycle results · live Salesforce state · current data · calculation results ·
implemented-feature status.

The application and its authoritative data sources govern all of the above.

> **Never change application logic, assessment behaviour, Salesforce configuration or displayed data
> to make output match a static image.**

## The sidebar

**Neither image's sidebar is authoritative.** Both record older rails, and they do not even agree with
each other — `Homepage.png` labels the first navigation group `CONTROL SURFACE` while
`Assessment Page.png` labels it `CONTROL LIFECYCLE`, and only the latter shows a `Settings` entry.
Two references cannot both be right about one shared component, which is evidence enough that the
imagery is historical.

The **implemented shared sidebar is authoritative**. Do not copy, rebuild, restyle or re-label it
from either image, and do not treat an active-navigation highlight in an image as a statement about
which page the reference governs.

## Known deviations

Recorded from direct inspection of each image. Each is present in the approved reference and does
**not** govern the current application.

### `Homepage.png` → `/`

- **Sidebar** — a *System status* panel (Salesforce Connected · MCP Server Online · Last verified ·
  View integration details). The connection treatment moved into main content; MCP status is not
  presented in the application.
- **Header** — the text *"No assessment yet"*. Deliberately not implemented.
- **Summary band** — shows **four** metrics; the fourth is *Read-only / No changes made in
  Salesforce*. Deliberately reduced to three, because the read-only guarantee is stated once, in the
  hero.
- **Coverage section** — a green *"Read-only. Nothing in Salesforce is created, changed or deleted."*
  banner. Deliberately removed as a duplicate of the same guarantee.
- **Coverage cells** — per-area check-count pills (*"2 checks"*) and right chevrons. Which checks
  belong to which area is established by the detectors at run time, so no per-area count exists
  before an assessment has run.

### `Assessment Page.png` → `/assessment`

This image carries **historical Dashboard identity markers**. It is the same file that was previously
filed as the completed-Dashboard state (see *Superseded*), and the markers below are artifacts of
that history rather than statements about the Assessment page.

- **Sidebar** — `Dashboard` is the active navigation item, not `Assessment`. This does **not** mean
  the reference governs the Dashboard; the table above governs the mapping.
- **Sidebar** — includes a `Settings` entry, and a *System status* panel showing *Read-only access ·
  Active* and *MCP Server · Planned*.
- **Page title** — reads *"Hello, Shantelle"* with the lede *"Here's what NorthstarIQ found in your
  Salesforce org."* That is a Dashboard greeting. **Route identity governs what a page calls
  itself**: this page is Assessment and says so.
- **Header controls** — a notification bell, and a caret beside *Run new assessment* implying a split
  button. Neither is implemented, and neither is a requirement.
- **Orientation banner** — written from the Dashboard's point of view: *"Dashboard gives you an
  at-a-glance view… Go deeper in Assessment…"*, with the action *View assessment details →*. On the
  Assessment page that action would point at itself. The banner's **placement and treatment** govern;
  its wording and destination do not.
- **Lifecycle panel** — its footer link reads *Explore lifecycle details in Assessment →*, another
  cross-page pointer authored while this content lived on the Dashboard.

## Superseded

| Former name | Current identity | Established from |
|---|---|---|
| `Dashboard State 2 - Re-run Assessment.png` | `Assessment Page.png` | Repository `CLAUDE.md` §10, which records that the current Assessment reference *"is the same image that was previously filed as the completed-Dashboard state"*, and that no file of the former name remains in current authority. |

The two-state Dashboard model that name belonged to is retired: the Dashboard keeps one architecture
whether or not an assessment has completed.

**No other rename history is recorded, because no other is established by current project evidence.**
This file's purpose is current authority, not the reconstruction of history.

## Changing this file

A reference becomes authoritative when a human approves it and it is recorded here. Adding a row,
changing a route mapping, or retiring a reference is a governance change, not an implementation
detail. Recompute the checksum whenever a reference image is replaced — a changed checksum against an
unchanged filename is exactly the failure this column exists to catch.
