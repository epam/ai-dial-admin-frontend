## Context

The component migration is finished in source; this change removes what it left behind. The one item with a real decision is the `tooltip.scss` shim. It restyles the 1.0 tooltip bubble, found as the single element with `data-floating-ui-focusable` and no `data-placement` inside `#tooltip-portal`. Its comment names `DialInput`, `DialSelect` and `DialDropdown` as the sources; the app imports none of them, but a kit component the app does use could still portal the 1.0 bubble internally, and that cannot be read off the source.

## Goals / Non-Goals

**Goals:**
- Remove the shim only if no 1.0 bubble can still appear.
- Leave no spec, doc or comment naming a component the app does not use.

**Non-Goals:**
- The legacy color-token family, and anything in archived changes.

## Decisions

### Shim: check, then delete or re-comment
Alternatives: delete on the strength of the missing imports (fast, but a regression shows as unstyled tooltips only at runtime), or keep it indefinitely (no risk, but a dead rule hides behind a comment that points at the wrong components).

The check is two steps. First, read the kit's non-`New` components that still import the 1.0 `Tooltip` and see whether the app renders any of them. Second, run the app with the shim removed and hover tooltips across the surfaces the removed components used to cover (grids, form fields, icon buttons), looking for a bubble that is bordered or lacks `data-placement`. Neither step is a browser-verification task in the OpenSpec sense: it is the evidence for a delete-or-keep decision, recorded in the PR.

If the bubble still appears, the block stays and only its comment changes, naming the component that portals it.

### Specs: deltas for requirements, direct edits for Purpose text
`### Requirement` blocks and their scenarios change through delta specs, so archiving folds them in. A Purpose paragraph is outside the delta mechanism, so those edits are made directly to the main spec. Both the delta and the direct edit are renames only.

### Mirrors
`.claude/rules/a11y.md` is the canonical file. The `.github/instructions` copy and the `.cursor/rules` stub are regenerated with `npm run sync:agent-mirrors`, never edited by hand.

## Risks / Trade-offs

- [The shim guards a bubble the static check missed] → The runtime hover check is the gate; if it finds one, the block stays.
- [Rewording a spec Purpose changes a line other agents quote] → The edits only swap a retired component name for its current one.
