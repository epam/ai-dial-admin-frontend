## Context

See `proposal.md` — Why. What shapes the approach is that every piece already exists somewhere in this
repo, so the work is placement rather than invention.

`Common/ExpandableText` clamps to `lines` with a `-webkit-line-clamp` and renders a **Show more** link
only when a `ResizeObserver` reports overflow; with `popupHeader` the link opens a popup instead of
expanding in place. Three features use it already (`TestSuites/Metrics`, `AddMetric/Configuration`,
`Assets/Conversations/View/Properties`).

`TableDetailView` is the exemplar for deleting an entity from a detail header: a `DialDangerButton`
guarded by a permission flag, a `DialConfirmationPopup` with the danger variant whose description carries
a labelled name row, and a server action on confirm. `PipelinesView` already deletes a pipeline from the
listing with the same dialog shape, so the pipeline copy exists too.

## Goals / Non-Goals

**Goals:**

- A description is read where it is, by keyboard as well as by mouse.
- One delete confirmation, presented from two places.
- The operator lands where the work continues.

**Non-Goals:**

- Changing `DialEllipsisTooltip` or where else it is used.
- A route change, a new page, or a new server action.

## Decisions

### D1 — The column grid clamps in a cell renderer, and the row grows with it

AG Grid sizes a row before its cell renders, so a cell that grows on demand needs `autoHeight` on the
column and a height re-measure when the clamp opens. The description column therefore gets
`autoHeight: true`, `wrapText: true` and a cell renderer wrapping `ExpandableText`, with the renderer
calling `params.api.resetRowHeights()` after the toggle.

**Alternative considered:** `popupHeader`, which keeps the row height fixed and opens the full text in a
popup. Rejected as the default — the user asked for the text to open in place — but it stays the fallback
if `autoHeight` proves to fight the grid's virtualisation on a long catalog; that would be a visible
change of behaviour, so it is a decision to bring back rather than make silently.

**Clamp depth — revised in the second pass:** one line, with the control on that same line. Two was chosen
here and reversed on seeing it: `ExpandableText` puts **Show more** on a line of its own, so a two-line
clamp costs three lines per row and a one-line clamp costs two — the grid gave up more height to the
control than to the text. `Tables/ClampedDescription.tsx` replaces it: a single line truncated with
`truncate`, the control inline beside it, and a `ResizeObserver` on the span deciding whether there is
anything to reveal. The cell renderer and `autoHeight` stay as described above; only what they wrap
changed.

### D2 — The header description reuses the same component, not a second mechanism

`TableDetailView`'s header swaps `DialEllipsisTooltip` for the same `ClampedDescription` the grid uses, so
the two places a description is read behave identically. Nothing else about the header row changes — it
already spans the full width and already keeps the action controls on one line, both of which the spec
states and neither of which the swap touches.

### D3 — The forward is the shell's, not the popup's

`CreatePipelineShell` owns the submit, the notification and `onCreated`; the navigation belongs with them
rather than in `CreatePipelinePopup`, which would otherwise have to learn the outcome of a request it does
not make. The shell takes the created pipeline's name from the DTO it submitted — the service echoes no
body the console reads — and pushes `/{lang}/pipelines/{name}` after `onCreated()` has refreshed the
listing.

**Alternative considered:** having `PipelinesView` navigate from its `onCreated` callback. Rejected: that
callback exists to reload the listing, and giving it a second job would put the navigation two components
away from the request that justifies it.

### D4 — Delete lives in `PipelineDetailFrame`, beside the enable toggle

The frame already owns the header's controls, the notification helpers and the router. It gains the danger
button, the confirmation and a `deletePipeline` call, guarded by the `isFullAdmin` flag it already reads
for the save. On success it pushes the listing route rather than refreshing, the pipeline being gone.

The confirmation copy is the listing's, which already states the transform warning for an enrichment and
identifies the pipeline by name — the spec requires the two surfaces to present identical content, so the
description is built by a shared helper rather than written twice.

### D5 — The missing translation is added, not the key renamed

`AnalyticsTablesI18nKey.SourceTable` is referenced from four files; renaming the enum member to match the
label would touch all four for no gain. Only `locales/en.ts` gains the entry, with the value `Source`.

### D6 — The scope is controls, and the way to a table is beside the control that names it

Three fields do not earn an accordion, and two of them were named again in the facts a few centimetres
above. So the section loses its container and its heading, and the facts lose the pair.

That leaves the links the facts carried. They move to the controls as an `Open` button — the layout
`CatalogSchemaField` already uses for a control-plus-action pair — opening the table in a **new tab**,
because the operator is reading the pipeline and wants the table as well, not instead.

Every `Open` carries the same label, and the ui-kit button takes its accessible name from that label
rather than from an `aria-label` a caller passes. `BoundTableField` therefore wraps each pair in a group
named after the **table**, which is the thing that differs; the control's own label still names the field.

**Alternative considered:** labelling each button "Open dial_usage_log". Rejected — the ui-kit button does
not forward `aria-label`, so the distinction would have had to go into visible text, making the two
buttons different widths in a row where they sit under matching controls.

### D7 — The runtime state splits by what the reader does with it, not by where it comes from

`PipelineStateSection` presented all of `state` under one heading at the tail of the form. Most of it is
four short measured values, which read better beside `generation` and `updated_at`; three of its members
are conditions an operator acts on, which read badly as small print anywhere.

So the measured values fold into the facts row — omitted rather than em-dashed when absent, because these
appear as the pipeline runs and a placeholder would claim an absence that is really a "not yet" — and the
failure, the clamp and the required rebuild become `Notification` alerts. The alerts render **between the
identity row and the tab strip**: a held or failing pipeline is a fact about the pipeline, and the reader
most likely to want it is the one who just opened the activity history to find out what it has been doing.
They withdraw with everything else when the JSON editor takes the view, since the document on screen is a
draft the alerts may already contradict.

`unclamped_reads` is dropped from the page. Each entry says why a window was *not* held, from a closed
dictionary of six reasons of which the common ones mean "nothing to hold" — a list of non-events, which
is why nobody reading the page could say what it was for. It stays in the JSON editor.

**Alternative considered:** keeping the section and moving only the alerts out. Rejected: what remained
would be a heading over four values, which is the shape that made them easy to skip in the first place.

## Risks / Trade-offs

- **`autoHeight` on a description column makes row heights uneven**, which is the point but also a visual
  change on catalogs with long descriptions. Bounded by the one-line clamp: a row is one line high until
  someone opens one.
- **Dropping `unclamped_reads` removes the only place the console showed it.** It is recoverable from the
  JSON editor, and a reader who needs it in the page can have it back in a shape that says what it means.
- **The alerts sit above the tab strip**, which is one more band of page before the content on a pipeline
  that is failing and held at once. Bounded at three, and only a pipeline in trouble pays it.
- **Forwarding after creation takes the operator off the listing**, so registering several pipelines in a
  row now costs a back-navigation each. That is the trade the user asked for, and the common case is one
  registration followed by authoring.
- **A delete control in the header sits next to the enable toggle**, two destructive-ish actions side by
  side. Mitigated by the danger variant and the confirmation, which is the pattern `TableDetailView`
  already ships.
