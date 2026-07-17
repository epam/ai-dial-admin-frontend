# Adopt consolidated column-metadata PATCH, surface description editing, and mark sensitive columns

## Why

The analytics backend shipped `feat/consolidate-column-metadata-patch` (merged to `development`),
a **breaking** change to `PATCH /v1/tables/{name}/schema`: the separate column-metadata operations
(`retag`, `set_display_name`, `set_sensitive`, `set_description`) are collapsed into a single
`update` merge-patch list, each entry carrying a column `name` plus optional `tag`, `display_name`,
`description`, and `sensitive` fields. Per-field semantics: **absent/null → leave unchanged**,
**blank `""` → clear**, **non-blank → set** (`sensitive`: `true`/`false` → set).

The frontend still targets the old shape and the backend **silently ignores unknown patch keys**, so:

- The FE sends `retag` and `set_display_name` (`models/analytics/table.ts:90-91`,
  `components/Analytics/Tables/utils.ts:47-52`). The backend no longer recognizes these, so **tag and
  display-name editing now silently no-op** on `development` — a success toast over a save that did
  nothing. Adopting the new shape is **mandatory**, not optional.
- The FE also emits `redescribe` (`utils.ts:54`), an op the backend **never** had (`git log -S
  redescribe` on the backend is empty). It was a speculative guess from
  `add-column-labels-and-descriptions`; the real op landed as `update.description`. The
  `redescribe` path is dead today because the edit modal never renders a description input.

Because the backend now supports editing `description`, the condition the analytics spec already set —
"the description field joins the modal **once that operation ships**"
(`openspec/specs/analytics/spec.md:684`) — is now satisfied. So this change both fixes the regression
and cashes in that promise.

## What Changes

- **Models** (`src/models/analytics/table.ts`): replace the three metadata op interfaces
  (`AnalyticsColumnRetag`, `AnalyticsColumnSetDisplayName`, `AnalyticsColumnRedescribe`) and the three
  `AnalyticsSchemaPatch` fields (`retag`, `set_display_name`, `redescribe`) with a single
  `update?: AnalyticsColumnMetadataUpdate[]`, where `AnalyticsColumnMetadataUpdate` is
  `{ name: string; tag?: string; display_name?: string; description?: string; sensitive?: boolean }`.
  Structural ops (`add`, `drop`, `rename`) are unchanged.
- **Patch builder** (`components/Analytics/Tables/utils.ts`): rewrite `buildColumnEditPatch` to emit at
  most one `update` entry `{ name: target, ...changedMetadataFields }` containing **only** the metadata
  fields that changed (merge-patch: unchanged fields omitted, blank sends `""` to clear). `rename` stays
  a separate structural op; when a rename is present, the `update` entry references the post-rename
  name (unchanged `target` logic). Return `null` when nothing changed.
- **Edit modal** (`components/Analytics/Tables/EditColumnPopup.tsx`): add the **Description** input as a
  fourth field (seeded from `column.description`, `ColumnEditValues.description` already exists),
  reusing `AnalyticsTablesI18nKey.Description`. Now that the backend supports it, description is
  editable alongside name / display name / tag.
- **Sensitive marking (visual + editable).** The backend returns `sensitive` on both column responses
  (`TableDto.ColumnDto`) and query-schema fields (`QuerySchemaFieldDto`), where a sensitive column is
  "exposed on the query path to full admins only" — so it is an access-restriction signal worth showing.
  - **Read models**: `AnalyticsTableColumn`, `AnalyticsEntityField`, and `FieldOption` gain
    `sensitive?: boolean`.
  - **Shared indicator**: a new `Common/SensitiveIndicator` renders a small colored dot (warning token)
    with a "Sensitive" tooltip, reused across surfaces (plus a `SensitiveCellRenderer` for ag-grid).
  - **Table detail grid**: a narrow **Sensitive** column renders the dot for sensitive columns.
  - **Query Builder field dropdown**: the dot appears in each sensitive option's primary line.
  - **Editable (post-creation)**: the edit modal gains a **Sensitive** `DialSwitch`;
    `buildColumnEditPatch` diffs it into `update.sensitive` (the wire field is already there).
  - **Editable (at creation)**: the column-row editor (`ColumnRowsEditor`, shared by the Add columns
    popup and the Create table form) gains a per-row **Sensitive** `DialSwitch`; `toTableColumns` carries
    `sensitive: true` into the create/add payload (backend `CreateTableRequest.ColumnRequest` accepts it).
- **Spec** (`openspec/specs/analytics/spec.md`): update the "Table detail column schema management"
  requirement — drop the "description SHALL NOT be offered" clause, list the single `update` op in
  place of `retag`/`set_display_name`, add the Sensitive grid column + toggle, and reword/add scenarios;
  extend the categorized-field-dropdown requirement with the sensitive dropdown marker.

## Non-goals

- No changes to structural ops (`add`, `drop`, `rename`), row writes, or query serialization.
- No value-masking of sensitive data in the query-results grid.

## Capabilities

### Modified Capability

- `analytics` (master spec `openspec/specs/analytics/spec.md`): the "Table detail column schema
  management" requirement changes its patch contract — the `retag`/`set_display_name`(/`redescribe`)
  operations collapse into one `update` merge-patch entry, and the description field becomes editable in
  the modal. Scenario wording follows.

## Dependencies / sequencing

- Backend `feat/consolidate-column-metadata-patch` is **already merged** to the analytics service
  `development`, so there is no merge-before-release caveat — the FE can ship immediately.

## Impact

- **Models**: `src/models/analytics/table.ts`, `src/models/analytics/entity.ts`,
  `src/models/analytics/query-builder.ts` (`FieldOption`), `src/models/analytics/tables-ui.ts`
  (`ColumnEditValues`).
- **Components**: `src/components/Analytics/Tables/utils.ts` (patch builder + `toTableColumns`/`createColumnRow`),
  `src/components/Analytics/Tables/EditColumnPopup.tsx` (description field + Sensitive toggle),
  `src/components/Analytics/Tables/ColumnRowsEditor.tsx` (per-row Sensitive toggle at creation),
  `src/components/Analytics/Tables/TableDetailView.tsx` (Sensitive grid column),
  `src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown.tsx` (dropdown marker),
  `src/components/Analytics/QueryBuilder/utils/fields.ts` (`fieldsToOptions` passthrough),
  new `src/components/Common/SensitiveIndicator/SensitiveIndicator.tsx`.
- **i18n**: reuse `AnalyticsTablesI18nKey.Description`; add `AnalyticsTablesI18nKey.Sensitive` (used as
  the switch/column label, the marker's `aria-label`, and the short tooltip note).
- **Tests**: `Tables/tests/utils.spec.ts` (patch-builder shape + sensitive diff),
  `Tables/tests/EditColumnPopup.spec.tsx` (description + sensitive toggle),
  `QueryBuilder/utils/tests/fields.spec.ts` (sensitive passthrough),
  `QueryBuilder/Common/tests/CategorizedFieldDropdown.spec.tsx` (dropdown marker),
  new `Common/SensitiveIndicator/tests/SensitiveIndicator.spec.tsx`. (`analytics-data-api.spec.ts` and
  `utils/tests/schema.spec.ts` needed no change — they never asserted the old op names.)
