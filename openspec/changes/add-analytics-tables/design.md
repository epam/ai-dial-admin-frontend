## Context

The scaffold shipped an empty Tables page and a client-only Query Builder that fetched everything on mount. Two problems drove this design: (1) client-only fetching means a blank page + spinner on first paint and diverges from every other entity page in the app, which fetch server-side and pass data to a client view; and (2) the create-table form carried a manual reset effect because the popup was permanently mounted.

## Goals

- Match the app's established server-fetch → client-view convention for both Analytics pages.
- Keep interactive concerns (schema re-loads, inline edits, refresh-after-mutation) on the client.
- Make popup form state naturally scoped to a single open, with no manual reset.

## Data flow

```
                 server component (page.tsx, force-dynamic)
                 ── await server action ─→ analyticsDataApi ─→ service
                                │
                 initial data as props
                                ▼
                 client view (QueryBuilder / TablesView / TableDetailView)
                 ── holds interactive state ──
                 ── re-fetches via server actions on user action ──
```

- **Query Builder:** page prefetches `getEntities()`; if the first entity is simple, also `getEntitySchema(first)`. Props: `initialEntities`, `initialEntityName`, `initialFields`. The client seeds `QueryBuilderState` from `initialFields` and only calls `getEntitySchema` / `getDetailedEntitySchema` again when the user changes the entity or supplies an instance id.
- **Tables catalog:** page `await getTables()`; `notFound()` if the list call fails (null). `TablesView` seeds `tables` from `initialTables` and exposes a client `reload()` used only after create/delete.
- **Table detail:** page `await getTable(name)`; `notFound()` if missing. `TableDetailView` seeds `table` from `initialTable` and `reload()`s after each schema patch.

## Decisions

### Server-fetch in the page, not client mount fetch
Follows `models/page.tsx` and `routes/[id]/page.tsx`: `async` page, try/catch with `errorObjLog`, `notFound()` on null, client view receives ready data. First paint has content; auth token is already available server-side; behavior is consistent with the rest of the app. The client view keeps only the interactive refetches it genuinely needs.

### Create-table popup is mounted only while open
`TablesView` renders `{createType !== null && <CreateTablePopup … />}` rather than keeping it mounted and toggling an `open` prop. Closing unmounts the component, so React discards its state — no reset `useEffect`. This matches every other popup in the feature (`{addOpen && …}`, `{deleteTarget && …}`). The `useState(() => createTableForm(tables))` initializer runs once per mount = once per open.

### One `TableForm` object instead of eight `useState`s
The form is a single `TableForm` seeded by a `createTableForm(tables)` factory (which also derives enrichment defaults from the first source table). A small typed `update(key, value)` helper handles field changes. This makes "fresh on open" a one-liner and groups related state.

### Column schema edits go through one `applyPatch`
Add / drop / rename / retag all build an `AnalyticsSchemaPatch` and call `updateTableSchema`; inline grid rename fires the same path via `onCellValueChanged`. Each success re-fetches the table so the grid reflects the server state.

### Result total field
The execute response's total row count is read from `totalCount` (the field the live service returns); the model exposes only `totalCount`.

### Fixed value sets are enums
`PartitionGranularity` (day/month/year) and `QuerySortNulls` (default/first/last) are enums per the code standards; option lists and typed fields are built from them.

## Risks / trade-offs

- Conditional-mount popups skip any exit animation (unmount is immediate) — accepted, and already the feature's norm.
- Server-side prefetch adds one request to the page's server render; acceptable for a dynamic, auth-gated admin page.
- `notFound()` on a failed **list** fetch (catalog) is blunt, but mirrors `models/page.tsx`.
