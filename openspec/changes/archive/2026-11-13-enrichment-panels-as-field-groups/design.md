## Context

See proposal.md — Why. The detail rail has two presentations of "a record's fields grouped by tag":

- The metadata panel and the span rail render `SpanFieldGroup[]` through `SpanFieldsSection` → `SpanGroupPanel` →
  `SpanFactRow` / `SpanObjectFactRow`. Values are formatted by `spanFieldText` / `spanObjectEntries`, which handle
  lists, objects, dates, enums and costs; empties are decided by `isSpanFieldEmpty`. Groups come from
  `groupSchemaFields` and carry no description.
- An enrichment panel renders `SessionEnrichmentPanel` → `SessionTermList`, formatted by `insightValueText` (dates,
  enums, strings only). `enrichmentColumnsOf` drops `NON_SCALAR_FIELD_TYPES`, and the detail projection
  (`buildSessionDetailQuery` in `sessions-queries.ts`) is built from those columns, so the dropped fields are never read.

## Goals / Non-Goals

**Goals:**

- One field-group presentation for metadata, span rail and enrichment panels.
- Every enrichment column projected and rendered, whatever its type.
- Field descriptions surfaced as hints, with no new request.

**Non-Goals:**

- Changing `SpanFieldsSection`'s open-state or preview behaviour.
- A shared Common component: these are feature components under `SessionsTrace/Detail`.

## Decisions

### Enrichment panels render through `SpanFieldsSection`

`SessionEnrichmentPanel` hands its groups to `SpanFieldsSection` and the `summary` as its optional `lead`, which the
section renders inside its own frame above the first group, clamped to two lines through `Common/ExpandableText`. With
no group left, the summary renders alone. Groups go to `SpanFieldsSection` with
`isRecord` set — an enrichment row is a record, so its values offer copy and a zero is a value. The panel is
rendered unframed (`isFramed={false}`), as the metadata panel is, because `SpanFieldsSection` draws its own frame.

`SessionTermList` loses its enrichment-panel caller but stays, because the usage panel's `SessionFieldRows` uses it.
`insightValueText` is still used for the summary paragraph. `enrichmentTagLabelKey` is deleted: a group header is now
labelled by `SpanGroupPanel`, as Metadata's are — a hop-log tag by its key, any other tag in readable words.

Alternative: keep `SessionTermList` and borrow only `spanFieldText`. Rejected by the user — two controls for one
kind of content is the inconsistency this change removes.

### Enrichment groups are built as `SpanFieldGroup[]`

`SessionEnrichmentPanel` (the model) carries `SpanFieldGroup[]` instead of `SessionEnrichmentGroup[]`.
`enrichmentColumnsOf` stops filtering `NON_SCALAR_FIELD_TYPES`; its descriptors carry the field `type` so the
shared formatter applies. `groupFieldsByTag` keeps its ordering (declared order, then appearance, `system` last) and
maps an untagged field to `UNTAGGED_SPAN_FIELD_TAG`, the key `SpanGroupPanel` already labels. `enrichmentPanelsOf` takes the Title role's field
and sets it and the `summary` field aside before the groups are built — the summary onto the panel model as
`summary`, the heading not at all — so neither the preview nor the rows state them. A panel that is evaluated but
holds neither a group nor a summary is not rendered; a summary with no group is framed by the panel itself. Closed
groups preview their own first stated value: the panel passes an empty `summaryFields`, because the hop log's
per-tag preview columns name usage-log fields an enrichment group does not hold.

The detail projection keeps deriving enrichment fields from `enrichmentPanelsOf`, so lifting the filter is what makes
the query read the list and object fields — no second list.

`sessionInsightsState` (reached / not reached / no values) keeps reading the panel's fields, now including
non-scalar ones, and decides "has a value" through `isSpanFieldEmpty`, so an empty array or an object with no entries
counts as no value exactly as the rows render it.

### Descriptions ride on `SpanFieldDescriptor`

`SpanFieldDescriptor` gains an optional `description`, filled from `AnalyticsEntityField.description` in
`groupSchemaFields` and in the enrichment builder. `SpanFactRow` and `SpanObjectFactRow` render `FieldCaveat` beside
the label when it is present. Both callers of `groupSchemaFields` — the metadata panel and the span rail — gain hints
with no further change, which is why the span rail's requirement is part of this change.

### The enrichment description is a tooltip on the panel title

`getEnrichmentTagOrders` becomes `getEnrichmentDefinitions`, returning `{ tagOrder, description }` per namespace from
the same `getTable` call, so no request is added. `SessionDetailPanel` takes an optional `hint`, rendered as the
ui-kit `Tooltip` on the title, and its `source` becomes optional; enrichment panels pass the description and no
source, because their title is already the namespace. The hinted title is a focus stop (`tabIndex={0}`) so the
tooltip reaches a keyboard, which needs one `jsx-a11y/no-noninteractive-tabindex` exemption.

Alternatives: the description as clamped text at the top of the panel (tried, rejected by the user as visual noise
above the summary), and an info icon beside the title (rejected: a second control for what the title can carry).

## Risks / Trade-offs

- [Superseded enrichment columns now render as unavailable rows] → Accepted by the user for consistency with
  Metadata; the groups are collapsed, so the noise sits behind a header.
- [Insights are behind a click: all groups start closed] → Each closed group previews its first stated value, as
  Metadata's do.
- [Monospace values replace the proportional insight text] → The long free-text summary stays a paragraph above
  the groups; other fields are short.
- [Span rail rows gain hints for every described hop-log column] → Intended: the rows are shared and a description
  is the catalog's own account of the column.

## Migration Plan

No deployment step: no new request, no new configuration.
