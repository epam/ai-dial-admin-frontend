## Why

The visual builder lives in a fixed-width rail beside the results and is a form of eight sections —
mode, projection, group by, aggregates, a nested filter tree, having, sort, paging. Most queries an
operator writes use a small part of it, and the form's size is paid on every one of them. The redesign
moves the builder above the results and reduces it to a bar of chips, each naming one part of the query
and edited in a small popup, so a query reads left to right the way it is thought of.

This is the second step of the Query Builder redesign; the first introduced the draft builder and the
Source panel.

## What Changes

- **The builder moves above the results.** The page becomes one column: heading with the table or query
  description, a view switcher with Run, the builder area, a resize handle, and the results. The height
  of the builder area is draggable and remembered.
- **The builder becomes a bar of chips.** Period and Limit are always there; Filter, Aggregate, Show
  columns and Sort are added from an Add menu. A chip states its part of the query in words and opens a
  popup to edit or remove it. A popup's edits apply on Apply and are dropped on Cancel.
  - **Period** — presets and a custom range; replaces the toolbar time filter. Not shown for a table
    with no temporal column.
  - **Limit** — rows and offset.
  - **Filter** — one condition per chip: column, operator, value. Conditions are combined with AND. An
    enum column offers its values; null checks are their own operators.
  - **Aggregate** — a group-by column, an optional time bucket when that column is temporal, one
    optional secondary group-by, and one function with its column. One Aggregate chip per query; its
    presence is what makes the query an aggregate one.
  - **Show columns** — the columns of a row query, picked in a tree grouped by tag.
  - **Sort** — one key per chip: field and direction.
- **BREAKING — the form rail is removed**, with its mode switcher, sections, nested filter groups, HAVING
  editor, function operands, multiple metrics, aliases, sort nulls and paging strategy controls. Whatever
  the chips cannot express is written in the SQL view.
- **BREAKING — the JSON view is removed.** The builder offers Builder and SQL, plus AI when the assistant
  is enabled. A stored query whose structured body the chips cannot show opens in the SQL view, translated
  by the service.
- **The results header changes**: a single result count replaces the stat tiles, and Add to dashboard
  moves there beside Export CSV.
- **Copy is offered in the SQL view only.**

## Non-goals

- Any change to the assistant itself. It moves from a third view into a collapsible panel at the right
  edge of the page; its conversation, suggestions and per-message Run and Copy are unchanged.
- Any change to the structured-query DSL, the saved-query storage contract, or the service.
- Hiding result columns of an aggregate query. Show columns shapes the projection of a row query only.
- Expressing in chips what the removed form could: nested AND/OR/NOT groups, HAVING, scalar functions as
  operands, group-bys or projections, several metrics, DISTINCT rows, caller-value comparisons, cursor
  paging, a requested total. These stay available through SQL.
- The scope badge and source chip in the header of a saved query.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/query-builder`: the page layout, the view switcher, the chip bar and its six chip kinds
  replace the rail and the form sections; the JSON view is removed; what the builder can represent
  narrows to what chips express, and everything else is held in the SQL view.
- `analytics/query-viewer`: Run no longer has a JSON source; the stat tiles become one result count.
- `analytics/saved-queries`: a stored query opens in the Builder or the SQL view, never JSON; a
  structured body the chips cannot show is opened as SQL.

## Impact

- **Components**: `components/Analytics/QueryBuilder/QueryBuilder.tsx` is restructured. New
  `QueryBuilder/Chips/` holds the bar, the chips and their popups; new `QueryBuilder/Layout/` holds the
  resizable builder area. Removed: `Rail/`, `Mode/`, `Select/`, `Aggregate/`, `Filter/`, `Sort/`,
  `Page/`, the section and chip-row pieces of `Common/` that only they used, the toolbar time filter
  wiring, and the JSON buffer in `QueryBuilder.tsx`, `use-saved-query-page.tsx` and
  `utils/saved-query.ts`.
- **Utils**: `utils/deserialize.ts` gains the chip representability rule; `utils/serialize.ts`,
  `utils/state.ts` and the state model are unchanged in shape.
- **Routes**: `app/[lang]/queries/[id]/page.tsx` translates an unrepresentable structured body to SQL on
  the server before rendering.
- **API**: no new endpoint. `POST /v1/queries/translate` gains one server-side caller.
- **Result area**: `Result/ResultArea.tsx` header; `CustomDashboards/AddToDashboard/AddToDashboardButton`
  is rendered there instead of in the toolbar.
- **Saved queries**: a query stored with a structured body the chips cannot show keeps its stored body
  until it is saved again; saving it from the SQL view stores it as SQL.
- **Tests**: the specs of the removed sections and of the JSON view are deleted or rewritten; new specs
  cover the chips, the popups, the layout and the representability rule.
