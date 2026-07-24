# Tasks — Analytics Tables detail polish + SQL auto-formatting

## 1. Schema-definition surface

- [x] Merge `ColumnRowsEditor`'s separate "Source name"/"Name" inputs into a single Name field, writing
      both `source_name` and `name` from the one control.
- [x] Rebalance the Name/Type/Tag field width proportions in the merged row.
- [x] Add an info-icon + hover tooltip to the Partition column label (Date/Timestamp restriction) in
      `DraftSchemaEditor.tsx`.
- [x] Render Granularity only once a partition column is selected.
- [x] In `use-draft-schema-form.ts`, clear `partitionColumn`/`granularity` together when the currently
      selected partition column is retyped away from Date/Timestamp; extract `getTemporalColumnNames`
      into `utils.ts` so the temporal-name check and the reset check share one source of truth.

## 2. Active-table detail view

- [x] Show the table's `description` under the name/status header in `TableDetailView.tsx` (any status).
- [x] Add a read-only schema-metadata summary row (ordering key/partition column/granularity for a
      source table; grain key for an enrichment table), shown only while `ACTIVE`.
- [x] Remove the redundant "Source name" grid column and the now-dead `SourceName` i18n key.
- [x] For an enrichment table, pin its grain key as a non-editable row at the top of the columns grid
      (`pinnedTopRowData`), backfilling type/tag/display-name metadata from the matching source-table
      column when one exists.

## 3. Add rows template

- [x] Key `buildRowsTemplate`'s fields by each column's `source_name` instead of `name`.
- [x] Include the grain key as a top-level template field for enrichment tables.

## 4. Delete confirmation consistency

- [x] Align `TableDetailView`'s and `TablesView`'s delete confirmation dialogs so both show a Name row
      identifying the target table.

## 5. Query Builder SQL auto-formatting

- [x] Add `sql-formatter` dependency; wrap it in `Analytics/QueryBuilder/utils/sql-format.ts`
      (`formatSql`, try/catch fallback to the original text).
- [x] Register a Monaco `sql` document-formatting provider in `SqlEditor.tsx` (relies on the existing
      global `formatOnType`/`formatOnPaste` editor options — no manual Format action).
- [x] Format the seeded SQL text in `QueryBuilder.tsx` (`seedSqlFromBuilder`, the rejected-JSON
      fallback) before setting it into the editor buffer.

## 6. Result grid bug fix

- [x] Fix `Analytics/QueryBuilder/utils/result.ts` so a column whose name contains a literal `.` (e.g.
      an enrichment projection) renders its value via an exact-name `valueGetter`, instead of ag-grid's
      default dotted-path `field` resolution silently returning blank.

## 7. Tests

- [x] Cover every behavior above in its component/util spec (`TableDetailView`, `TablesView`,
      `ColumnRowsEditor`, `DraftSchemaEditor`, `use-draft-schema-form`, `utils`, `QueryBuilder`,
      `sql-format`, `result`).

## 8. Verify

- [x] `npx vitest run` across all touched spec files green (from `apps/ai-dial-admin/`).
- [x] `eslint` clean on all touched non-test source files.
