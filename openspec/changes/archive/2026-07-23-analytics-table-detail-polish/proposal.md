## Why

A round of UX polish on the Analytics Tables detail view and the Query Builder's SQL tab, driven by
direct product feedback: the schema-definition surface had redundant name fields and an invisible
partition-column restriction, the active-table grid was missing useful at-a-glance schema metadata,
delete confirmations were inconsistent between the two surfaces that offer them, an enrichment column
with a dotted name silently showed no data, and the SQL editor required a manual format step. None of
these are new capabilities — they're corrections and refinements to the analytics Tables/Query Builder
surfaces already specified in `openspec/specs/analytics/spec.md`.

## What Changes

- **Schema-definition surface** (`DraftSchemaEditor`/`ColumnRowsEditor`): merge the column row's separate
  "Source name"/"Name" inputs into a single **Name** field (both DTO fields are always equal at
  definition time); add an info-icon + tooltip to the Partition column label explaining the
  Date/Timestamp restriction; render Granularity only once a partition column is selected, and clear
  both the partition column and granularity together when the selected column is retyped away from
  Date/Timestamp.
- **Active-table detail view** (`TableDetailView`): show the table's `description` under the
  name/status header (any status); show a read-only schema-metadata summary (ordering key/partition
  column/granularity for a source table, grain key for an enrichment table) while `ACTIVE`; drop the
  redundant "Source name" grid column; for an enrichment table, pin its grain key as a non-editable row
  at the top of the columns grid, backfilling its type/tag/display-name metadata from the matching
  source-table column.
- **Add rows template** (`buildRowsTemplate`): key template fields by each column's physical
  **source name**, not its exposed name (the backend's insert endpoint only accepts source names — a
  real bug for any renamed column), and include the grain key as a top-level field for enrichment
  tables (the backend requires it on every inserted row).
- **Delete confirmations**: align the catalog list's and the detail view's delete-table dialogs so both
  show a Name row identifying the target table.
- **Query Builder SQL tab**: auto-format the SQL editor's contents on type, paste, and initial seed
  (via a Monaco document-formatting provider backed by `sql-formatter`) — no manual "Format" action.
- **Result grid bug fix**: a result column whose name contains a literal `.` (an enrichment projection
  such as `table.column`) now renders its actual value instead of blank, by looking the value up by
  exact column name instead of ag-grid's default dotted-path field resolution.

## Impact

- **Components**: `TableDetailView.tsx`, `TablesView.tsx`, `ColumnRowsEditor.tsx`,
  `DraftSchemaEditor.tsx`, `QueryBuilder.tsx`, `Sql/SqlEditor.tsx`.
- **Utils**: `Analytics/Tables/utils.ts` (`buildRowsTemplate`, `getTemporalColumnNames`),
  `Analytics/Tables/use-draft-schema-form.ts`, new `Analytics/QueryBuilder/utils/sql-format.ts`,
  `Analytics/QueryBuilder/utils/result.ts`.
- **i18n**: removed dead `SourceName`/`ColumnNameHint` keys; added `AddRows` (renamed from `WriteRows`).
- **Dependency**: `sql-formatter` (^15.8.2) added to the root `package.json`.
- **Tests**: updated/added specs across all touched components and utils; no change to any
  server/API contract.
