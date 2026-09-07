## Why

A table's detail header and the Tables catalog grid never name the source table an enrichment
enriches, so a reader looking at `session_insights` cannot tell which table its rows hang off without
opening Connect or the pipelines that feed it. The value is already on the wire — `TableDto` carries
`source_table` on both the list and single-get surfaces — and the `AnalyticsTables.SourceTable` label
already exists, used only by the create popup.

In the same header, the description is rendered as a single ellipsis-truncated line inside a flex row
that also holds up to four header buttons. Because the button container may shrink, a longer
description squeezes the buttons until their labels wrap onto two lines, and the description itself is
cut after roughly half of its first sentence.

## What Changes

- The table detail header shows the enrichment's source table as a labelled value, alongside the
  grain key when the table is `ACTIVE` and on its own while the table is still a draft (`PENDING`) or
  `FAILED`, where the grain key does not exist yet.
- The Tables catalog grid gains a Source table column, populated for enrichments and blank for source
  tables.
- The table detail header states the table's kind (Source / Enrichment) as a neutral tag beside the
  status badge; until now the kind was visible only in the catalog grid.
- The description moves out of the header's title/actions row onto its own row below it, where its
  single line spans the full header width instead of the remainder the buttons leave over. It keeps
  the ellipsis tooltip, so the full value stays reachable.
- The header's action container stops shrinking, so button labels stay on a single line regardless of
  the description's length.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics`: the "Tables catalog page" requirement gains the Source table column; the table detail
  view requirement's header scenarios change — the description is presented in full over multiple
  lines rather than as one truncated line, and an enrichment's source table is presented in the header
  summary.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/TablesView.tsx` — one added column definition.
- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` — header layout, the
  description block, and the metadata summary's render condition.
- Specs: `openspec/specs/analytics/spec.md` (delta in this change).
- No API, server action, model, or i18n key additions: `source_table` is already on `AnalyticsTable`
  and `AnalyticsTablesI18nKey.SourceTable` already exists.

## Non-goals

- Changing the catalog grid's Description column, which already exposes its full value through the
  grid's cell tooltip.
- Making the table description editable from the detail view; it stays in the catalog row's edit
  action (see the "Table metadata editing" requirement).
- Capping how long a description may be, or how tall its header block may grow. The stored value
  stays unbounded — neither the admin UI nor the data-access service validates its length — and the
  header shows one line of it however long it is.
