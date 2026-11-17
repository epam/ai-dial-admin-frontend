## Why

The Query Builder is reachable only through a stored query: to look at a table an operator must first
create and name a saved query, and the Queries grid stands between the menu and the builder. Exploring
data should start at the builder, and only a query worth keeping should be saved.

This is the first step of the Query Builder redesign. It changes how the builder is entered and how a
source is picked; the rest of the redesign builds on the panel it introduces.

## What Changes

- **`/queries` becomes a draft builder.** The menu item opens the Query Builder on a table with no
  stored query behind it. The draft's table travels in the URL as `?table=<name>`; without it the first
  queryable table is used. A draft's unsaved state does not survive a reload.
- **A Source panel on the left of both query pages** (`/queries` and `/queries/{id}`), collapsible to a
  narrow strip, with two tabs:
  - **Tables** — the queryable tables as a tree: table → column-tag group with a column count → column
    with its type. Untagged columns are listed flat under the table, after the groups. A table shows
    its description on hover; a column shows its name when the row does not show it in full, its
    description, and a marker when it is sensitive. Columns load when a table is expanded.
  - **Queries** — the saved queries of both scopes as one flat list with search and an
    All / Personal / Common filter; a row shows its scope and description on hover.
- **Picking a table always opens a new draft on it**, including while a saved query is open. Picking a
  query opens that query. Either one asks for confirmation first when the open page holds unsaved work.
- **BREAKING — the Queries grid page is removed.** Its row actions move or go: Open in new tab is what a
  panel row link already does, Edit stays on the query page, Delete moves to the query page, Duplicate is
  replaced by Save as.
- **BREAKING — the standalone Create modal is removed.** A query is created by saving a draft
  ("Save as query"), which reuses the existing Save as modal and opens the new query's page.
- **BREAKING — the Source dropdown is removed from the builder toolbar.** A saved query's source is no
  longer switched from a control; picking another table starts a draft instead.
- **Save as is offered on a saved query whether or not it has unsaved changes**, so a clean query can
  still be copied once the grid's Duplicate action is gone.
- **Delete is offered on the query page** to a caller who may write the query.

## Non-goals

- Moving the builder above the results, the builder/results resize handle, and a separate Ask AI panel
  on the right — later steps of the redesign. The right rail and its four views stay as they are.
- Acting on a column click (adding it to the builder or the SQL text). Columns are read-only here.
- Searching the Tables tab by column name; it matches table names only.
- Persisting a draft across reloads or sessions.
- Any change to the Tables catalog page or to the saved-query storage contract.

## Capabilities

### New Capabilities

- `analytics/source-panel`: the Source panel shared by the query pages — its Tables tree and Queries
  list, collapsing, how picking a row navigates, and the confirmation that guards unsaved work.

### Modified Capabilities

- `analytics/query-builder`: the builder is reachable without a stored query (the draft page), the
  toolbar no longer carries a source selector, and the page layout gains the Source panel.
- `analytics/saved-queries`: the list page, the standalone create and the grid duplicate are removed;
  a draft can be saved as a new query; Save as is always offered on a saved query; Delete moves to the
  query page; a vanished query returns the user to the draft builder instead of the list.

## Impact

- **Routes**: `app/[lang]/queries/page.tsx` changes from the grid to the draft builder; a new
  `app/[lang]/queries/layout.tsx` hosts the Source panel for both query pages. The menu item, the
  `/queries/{id}` deep links and the `/query-builder` redirect are unchanged.
- **Components**: `components/Analytics/QueryBuilder/QueryBuilder.tsx`,
  `Toolbar/QueryBuilderToolbar.tsx` and `use-saved-query-page.tsx` learn the draft mode; a new
  `components/Analytics/QueryBuilder/SourcePanel/` holds the panel. `Queries/List/QueriesList.tsx` and
  `Queries/Modals/CreateQuery.tsx` are deleted, with the `QUERIES_COLUMN` grid columns and the
  list-view constants that served only the grid.
- **API**: no new endpoint. The panel reads `GET /v1/queries/entities`, `GET /v1/tables`,
  `GET /v1/queries/entities/schema/{name}` and `GET /v1/saved-queries?scope=` through the existing
  server actions.
- **Other features**: Custom Dashboards links to `/queries/{id}` and is unaffected. Anything that linked
  to `/queries` expecting the grid now lands on the draft builder.
- **Docs**: the sub-capability list in `AGENTS.md`, the Analytics rule in `openspec/config.yaml` and the
  routing table in `openspec/specs/analytics/spec.md` gain `analytics/source-panel`.
