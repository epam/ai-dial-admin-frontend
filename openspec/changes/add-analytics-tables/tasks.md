# Tasks

> The implementation already exists in the codebase; these tasks document the work this change specifies. Checked = present in code.

## 1. Server-side data loading

- [x] 1.1 `tables/page.tsx`: `async` server component, `await getTables()`, `notFound()` on null, render `<TablesView initialTables={…} />`.
- [x] 1.2 `tables/[id]/page.tsx`: `await getTable(name)`, `notFound()` if missing, render `<TableDetailView name initialTable />`.
- [x] 1.3 `query-builder/page.tsx`: prefetch `getEntities()` and (for a simple first entity) `getEntitySchema()`, pass `initialEntities` / `initialEntityName` / `initialFields`.
- [x] 1.4 All three pages: `export const dynamic = 'force-dynamic'`; errors logged via `errorObjLog`.

## 2. Query Builder state from props

- [x] 2.1 Add `Props` (`initialEntities`, `initialEntityName`, `initialFields`); seed `QueryBuilderState` via a lazy `useState` initializer.
- [x] 2.2 Remove the mount-time entities/schema fetch effect; keep client re-loads for entity change and complex-entity detailed schema.
- [x] 2.3 Empty entities renders the entities-load-failed empty state.

## 3. Tables catalog (`TablesView`)

- [x] 3.1 Grid columns: name, type, description, column count; row click navigates to detail (skips the actions column).
- [x] 3.2 Per-row delete via action column with a red (`Danger`) confirmation popup.
- [x] 3.3 Header buttons create enrichment (neutral) and source (primary).
- [x] 3.4 Seed from `initialTables`; `reload()` after create/delete only.

## 4. Create table popup (`CreateTablePopup`)

- [x] 4.1 Mounted only while open (`{createType !== null && …}`); no reset effect.
- [x] 4.2 Single `TableForm` object + `createTableForm(tables)` factory + typed `update(key, value)`.
- [x] 4.3 Source: columns via `ColumnRowsEditor`, ordering key (multi-select of column source names), partition column restricted to temporal columns + `PartitionGranularity`.
- [x] 4.4 Enrichment: source-table select + grain key from the source's ordering key (reset when source changes).
- [x] 4.5 Submit builds the discriminated `CreateTableDto`; success/error notifications.

## 5. Table detail (`TableDetailView`)

- [x] 5.1 Seed `table` from `initialTable`; `reload()` after each patch.
- [x] 5.2 Column grid: editable name (inline rename), source name, type badge, tag, nullable (true/false), action column (rename / retag / delete).
- [x] 5.3 Header: delete (red confirm), write rows, add columns.
- [x] 5.4 Add columns / write rows via form popups; row writes parse a JSON array; all edits go through one `applyPatch` → `updateTableSchema`.

## 6. Types, constants, i18n

- [x] 6.1 `models/analytics/tables-ui.ts`: `ColumnRow`, `TableForm`.
- [x] 6.2 `models/analytics/table.ts`: `PartitionGranularity` enum; `AnalyticsTablePartition.granularity` typed by it.
- [x] 6.3 `AnalyticsTablesI18nKey` + `locales/en.ts` labels.

## 7. Transport

- [x] 7.1 `analyticsDataApi` (`AnalyticsDataApi`, `server/analytics/analytics-data-api.ts`) exposes `getTables` (unwraps `{ tables }`), `getTable`, `createTable`, `deleteTable`, `updateTableSchema`, `addRows`, and `executeAction`.

## 8. Tests

- [x] 8.1 `TablesView` renders the server-provided catalog and the create buttons; empty catalog.
- [x] 8.2 `QueryBuilder` renders from seeded props; tag filter; Run enabled; empty entities.
- [x] 8.3 Server-action specs assert token pass-through (`query-builder/actions`, `tables/actions`).
- [x] 8.4 `analytics-data-api` client spec covers URL/method/body + `executeAction`.
- [x] 8.5 Utils specs (`serialize`, `deserialize`, `fields`, `result`, Tables `utils`).
- [x] 8.6 `TableDetailView` spec: system table hides modify actions + shows read-only badge; non-system shows actions.

## 9. System-owned tables (read-only)

- [x] 9.1 `AnalyticsTable.system?: boolean` from the API `system` flag.
- [x] 9.2 Catalog: System column indicator; row delete action hidden for system tables.
- [x] 9.3 Detail: delete/write-rows/add-columns hidden, column action menu + inline rename suppressed, read-only badge shown; table stays viewable.
- [x] 9.4 i18n: `System`, `SystemReadOnly` labels.
