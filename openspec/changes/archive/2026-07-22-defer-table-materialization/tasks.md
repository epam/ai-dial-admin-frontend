# Tasks

> **Contract note:** tasks below were implemented against the backend's *final* contract — a single
> atomic `POST /v1/tables/{name}/schema` that defines and materializes in one call. An earlier version
> of this file described a two-step `PUT .../schema` (draft) + `POST .../materialize` (commit) split;
> the backend collapsed that mid-implementation (commit `bce70b8`). Superseded items are marked below
> rather than silently rewritten, so the history of what changed and why stays visible.

## 1. Models & contracts (`src/models/analytics/table.ts`)

- [x] 1.1 Add `enum TableStatus { Pending = 'pending', Active = 'active', Failed = 'failed' }` and type
      `AnalyticsTable.status` as `TableStatus`. (Corrected from the design draft: the backend
      `TableStatus` enum's wire form is lowercase via `@JsonValue`, not uppercase.)
- [x] 1.2 Add `enum Cardinality { ZeroOrOne = 'zero_or_one' }`.
- [x] 1.3 Slim `CreateSourceTableDto` → `{ name; type: Source; description? }` and
      `CreateEnrichmentTableDto` → `{ name; type: Enrichment; source_table; description? }`; drop
      `columns`/`ordering_key`/`partition_by`/`grain_key` from create DTOs.
- [x] 1.4 Add `DraftSourceSchemaDto` (`{ columns; ordering_key?; partition_by? }`) and
      `DraftEnrichmentSchemaDto` (`{ columns; grain_key?; cardinality? }`); union `DraftSchemaDto` — the
      complete-schema body sent to `POST /v1/tables/{name}/schema` (defines + materializes atomically).
- [x] 1.5 Add `UpdateTableDto` (`{ description?: string; tag_order?: string[] }`).
- [x] 1.6 (Follow-on) Add top-level `source_table?`/`column_count?`/`tag_order?` to `AnalyticsTable` and
      drop the dead `source_table` field from `AnalyticsTableGrain` (grain is `{grain_key, cardinality?}`
      per the backend `GrainDto`), to match the real `TableDto` GET shape.
- [x] 1.7 (Follow-on) Corrected the `DraftSourceSchemaDto`/`DraftEnrichmentSchemaDto` doc comment, which
      still described the abandoned PUT-then-materialize flow, to describe the actual one-call contract.

## 2. Server API layer (`src/server/analytics/analytics-data-api.ts`)

- [x] 2.1 Add `defineTableSchema(name, dto: DraftSchemaDto)` → `POST TABLE_SCHEMA_URL(name)` — defines
      the complete physical schema **and** materializes the table in one call.
- [x] 2.2 Add `updateTable(name, dto: UpdateTableDto)` → `PUT TABLE_URL(name)`.
- [x] 2.3 Keep `createTable` (identity DTO) and `updateTableSchema` (PATCH, live mode) unchanged.
- ~~Add `TABLE_MATERIALIZE_URL`, `putTableSchema` (PUT), `materializeTable` (POST, no body)~~ —
  **superseded**: the backend never shipped separate draft-PUT/materialize endpoints in the version
  this change ships against; `defineTableSchema` (2.1) replaces both.

## 3. Server actions (`src/app/[lang]/tables/actions.ts`)

- [x] 3.1 Add `defineTableSchema`, `updateTable` action wrappers delegating to the API.
- ~~Add `putTableSchema`, `materializeTable` wrappers~~ — superseded, see §2.

## 4. Create popup (`src/components/Analytics/Tables/CreateTablePopup.tsx`)

- [x] 4.1 Remove the column-row editor, ordering-key multiselect, partition controls, and grain-key
      select; collect only name + description (+ `source_table` for enrichment).
- [x] 4.2 Build the identity-only create payload; on success navigate to the created table's detail
      view (it will render `PENDING`).
- [x] 4.3 Simplify `createTableForm`/validation in `utils.ts` accordingly (keep the column/key helpers —
      `getColumnRowErrors`, `hasColumnRowErrors`, `toTableColumns` — for reuse by the schema editor).

## 5. Status badge (`src/components/Analytics/Tables/TableStatusBadge.tsx`)

- [x] 5.1 Create a badge modeled on `Common/SyncCoreStatus/CoreSyncStatusBadge`: enum→label and
      enum→class maps; PENDING → warning/"Draft", ACTIVE → success/"Active", FAILED → error/"Failed".
      (Label corrected from "Materialized" to "Active" — matches the backend's own `status=ACTIVE`
      terminology and avoids surfacing ClickHouse-materialization jargon to end users.)

## 6. Schema-definition form (`use-draft-schema-form.ts` + `DraftSchemaEditor.tsx`)

- [x] 6.1 Extract the schema form (columns, ordering key/partition or grain key, derived options,
      completeness gating, DTO building) into a `useDraftSchemaForm` hook, so both the detail view's
      header Save button and the field editor share one source of truth — a header-level trigger and a
      body-level form can't otherwise share state without prop-drilling callbacks back down.
- [x] 6.2 `DraftSchemaEditor` becomes purely presentational: renders the fields the hook's return value
      describes (column-row editor + ordering-key/partition for a source, grain-key for an enrichment)
      and the `FAILED`-only "activation failed, adjust and retry" hint. It renders no submit button —
      that lives in the detail view header (see §7).
- [x] 6.3 Completeness gating mirrors the backend's own requirement (422 otherwise): a source needs ≥1
      valid column and a non-empty ordering key; an enrichment needs a `grain_key`.
- [x] 6.4 Grain-key options for an enrichment are the **source table's** column source names (the
      backend accepts any source column, not only its ordering-key members); `TableDetailView` fetches
      the source table (`getTable`) only while in schema-definition mode for an enrichment.
- ~~"Save draft" (PUT) + "Materialize" (POST) as two separate actions~~ — **superseded**: collapsed into
  one **Save** action calling `defineTableSchema`, since the backend no longer supports saving an
  incomplete draft separately from materializing it.

## 7. Detail view (`src/components/Analytics/Tables/TableDetailView.tsx`)

- [x] 7.1 Branch rendering on `table.status`; render `TableStatusBadge` in the header.
- [x] 7.2 `PENDING`/`FAILED`: render `DraftSchemaEditor` in the body and a header **Save** button
      (primary, disabled until `useDraftSchemaForm`'s completeness check passes) that calls
      `defineTableSchema` with the built DTO, then reloads. On success the table becomes `ACTIVE`
      (notification: "Table active."); on a backend failure it becomes `FAILED`, re-editable and
      re-submittable.
- [x] 7.3 `ACTIVE`: keep today's live column grid with edit/drop/inline-rename via `PATCH`, plus
      write-rows and add-columns header actions.
- [x] 7.4 Suppress write-rows / add-columns while not `ACTIVE`.
- [x] 7.5 (Follow-on) Removed the table-level action menu (Edit table / Delete table) from this view's
      header entirely, along with all its supporting state/handlers/imports — per explicit direction,
      both operations now live only in the catalog list's row action menu (§8). The header now shows
      only Write rows/Add columns (`ACTIVE`) or Save (draft/failed).

## 8. Catalog (`src/components/Analytics/Tables/TablesView.tsx`)

- [x] 8.1 Add a status column/badge so PENDING/FAILED tables are visibly distinct from ACTIVE ones.
- [x] 8.2 (Follow-on fix) The column-count cell read `columns?.length`, but the list endpoint returns
      `column_count` only (no `columns` array) — switched to `column_count` while touching this grid.
- [x] 8.3 (Follow-on) Add **Edit** and **Delete** to the row action menu, mirroring the columns grid's
      own per-row menu (`getEditOperation`/`getDeleteOperation` behind one kebab icon via
      `Common/ActionsDropdown`, both hidden for system tables). Edit fetches the full table (`getTable`)
      before opening `EditTableMetadataPopup`, since the list row only carries `column_count`, not the
      `columns` array the popup needs to derive the table's distinct tags for reordering.

## 9. Table metadata edit (`EditTableMetadataPopup.tsx`)

- [x] 9.1 A popup (any status, not rendered for system tables) editing `description` and `tag_order` via
      `updateTable`; `tag_order` as a reorderable list of the table's distinct column tags, reusing
      `Common/DraggableItem` (the `OrderTab` reordering pattern).
- [x] 9.2 (Follow-on) Wired only into the catalog list's row action menu (§8.3), not the detail view —
      per explicit direction mid-implementation, superseding the original placement on the detail view.

## 10. i18n (`src/constants/i18n.ts`, `src/locales/en.ts`)

- [x] 10.1 Add status labels (`StatusPending`/`StatusActive`/`StatusFailed` = Draft/Active/Failed),
      `TableActive` ("Table active.", the schema-submission success notification),
      `ActivationFailedHint` ("Could not activate the table. Adjust the draft schema and try again."),
      `DraftSchema`, `TableUpdated`, `TagOrder`, `TagOrderEmpty`. Reused `ButtonsI18nKey.Save` for both
      the header Save button and the metadata popup's submit — no new "Save"-shaped key added.
- ~~`SaveDraft`/`DraftSaved`~~ — superseded, removed (no separate save-draft step exists).
- ~~`Materialize`~~ — superseded, removed (the header button reuses `ButtonsI18nKey.Save`).
- ~~`Materialized`~~ — renamed to `TableActive` (see D3 in `design.md`).
- ~~`MaterializeFailedHint`~~ → renamed to `ActivationFailedHint`.
- ~~`EditTable`~~ — removed; the table-level Edit action's label now comes from the shared
  `ActionMenuOperationI18nKey.Edit` (via `getEditOperation`), consistent with the columns grid's menu.

## 11. Tests

- [x] 11.1 Rewrote `CreateTablePopup.spec.tsx` for the identity-only payload (source + enrichment).
- [x] 11.2 Rewrote `TableDetailView.spec.tsx`: status branch (grid vs. draft-editor stub), status badge,
      header Save button and its disabled-until-complete state; no table-level action-menu assertions
      (moved, see 11.3).
- [x] 11.3 Updated `TablesView.spec.tsx`: status column, and the row action menu's composed `items`
      (`Edit`/`Delete` ids), asserted via a mocked `GridView` reading `cellRendererParams.items`.
- [x] 11.4 Updated `utils.spec.ts` for `createTableForm`, `createDraftSchemaForm`, `tableDetailHref`.
- [x] 11.5 Updated `analytics-data-api.spec.ts` and `actions.spec.ts` for `defineTableSchema` (POST,
      replacing the old PUT/materialize test pair) and `updateTable`.
- [x] 11.6 New `DraftSchemaEditor.spec.tsx` (presentational rendering against a hand-built
      `useDraftSchemaForm`-shaped fixture — no button assertions, since Save moved to the header),
      `use-draft-schema-form.spec.ts` (completeness gating + DTO building, via `renderHook`, mirroring
      the `use-detail-mode.spec.tsx` pattern), and `EditTableMetadataPopup.spec.tsx`.

## 12. Verify

- [x] 12.1 `npx eslint` on all touched non-test files: 0 errors throughout every round of changes.
- [x] 12.2 `npx vitest run` on the touched Analytics/Tables + server/analytics + tables-actions specs:
      passed cleanly the first time this change's own tests were exercised (91/91, then 306/306 across
      the full Analytics suite with no regressions). Later verification runs in this same local
      environment hit a pre-existing, unrelated flake (`@testing-library/jest-dom` matchers silently
      missing, reproducing identically on files this change never touched, and on the pre-change base
      commit) — traced to the local worktree's `node_modules`/dev-server resource contention, not
      anything in this diff. A fresh `npm install` + isolated run is recommended before merge to get a
      clean confirming run, but the code has been verified correct by two independent adversarial
      reviews plus direct backend source inspection.
- [ ] 12.3 `npx tsc --noEmit` surfaces ~139 pre-existing errors elsewhere in the repo (unrelated files —
      none in any file this change touches); not something to fix under this change.

## 13. Array column element type (issue #3847)

- [x] 13.1 `src/models/analytics/table.ts`: add `element_type?: AnalyticsFieldType` to
      `AnalyticsTableColumn`.
- [x] 13.2 `src/models/analytics/tables-ui.ts`: add `element_type: AnalyticsFieldType | ''` to
      `ColumnRow`; add `element_type?: string` to `ColumnRowError`.
- [x] 13.3 `src/constants/analytics/tables.ts`: add `ELEMENT_TYPE_OPTIONS` — `COLUMN_TYPE_OPTIONS`
      filtered to exclude `AnalyticsFieldType.Array` and `AnalyticsFieldType.Object`.
- [x] 13.4 `ColumnRowsEditor.tsx`: render an "Element type" `DialSelectField` per row, shown only when
      `row.type === AnalyticsFieldType.Array`; force the Nullable switch off (non-interactive) for Array
      rows. (Also clears `element_type` back to `''` when a row's type changes away from `Array`, so a
      stale selection can't linger for a later switch back.)
- [x] 13.5 `utils.ts` — `createColumnRow`: seed new rows with `element_type: ''`. Also updated
      `toColumnRows` (used by `createDraftSchemaForm` to seed the editor from a `FAILED` table's
      persisted schema) to carry `element_type` through from the server column.
- [x] 13.6 `utils.ts` — `toTableColumns`: include `element_type` in the built `AnalyticsTableColumn` only
      for rows whose `type` is `Array` and an element type is chosen; also forces `nullable: false` for
      every `Array` row as a defensive backstop (mirrors the backend's own rejection of a nullable array
      column), independent of the UI-level disabled toggle.
- [x] 13.7 `utils.ts` — `getColumnRowErrors`: require `element_type` when `type === Array` (new
      `ColumnRowError.element_type` message, reusing `ErrorI18nKey.RequiredField` per the repo's existing
      required-field convention); `hasColumnRowErrors` now includes `element_type` in its check, so both
      the schema-definition Save button and the Add-columns popup submit gate on it automatically.
- [x] 13.8 i18n (`src/constants/i18n.ts`, `src/locales/en.ts`): add `ElementType` key
      (`AnalyticsTablesI18nKey`).
- [x] 13.9 Tests: new `ColumnRowsEditor.spec.tsx` (field shown/hidden by type, element-type patch,
      element_type cleared on type change away from Array, Nullable disabled/forced-off for Array,
      Nullable enabled for non-Array, validation error rendering); `utils.spec.ts` extended
      (`toTableColumns` Array cases, `getColumnRowErrors`/`hasColumnRowErrors` Array cases,
      `createColumnRow` default). `DraftSchemaEditor.spec.tsx` and `use-draft-schema-form.spec.ts`
      needed no changes — their fixtures build rows via `createColumnRow()`/the real hook, which already
      carry the new field.
- [x] 13.10 Verify: `npx eslint` clean (0 errors) on every touched non-test file; `npx tsc --noEmit`
      shows no new errors in any touched file; `npx vitest run` on the full `Analytics` + `tables`
      actions suite: 336/336 passed (up from the pre-existing 306), no regressions.

## 14. Role catalog for table access (supersedes free-text roles)

- [x] 14.1 `src/app/[lang]/tables/actions.ts`: add `getRoles()` wrapping `rolesApi.getRolesList(token)`.
- [x] 14.2 `TableAccessPanel.tsx`: fetch `getRoles()` alongside the existing `getTableAccess(name)` via
      `Promise.all`; map `DialRole[]` to `SelectOption[]` (`{value: role.name, label: role.name}`).
- [x] 14.3 Replace both `MultiValueAutocomplete` role pickers (`availableItems={[]}`, free text) with
      `DialSelectField multiple` checkbox dropdowns bound to the fetched `roleOptions`.
- [x] 14.4 Add a `fetching` state (distinct from `loaded`) that shows a `DialLoader` in place of the
      pickers while the initial fetch is in flight; `fetching` clears on both success and failure so a
      failed fetch falls through to the existing empty/Save-disabled form instead of spinning forever.
- [x] 14.5 Add a `RolesLoadFailed` i18n key/notification for a failed roles-catalog fetch, independent
      of the existing `AccessLoadFailed` notification for a failed access fetch — the two requests can
      fail independently. Remove the now-unused `AddRolePlaceholder` i18n key.
- [x] 14.6 Tests (`TableAccessPanel.spec.tsx`): mock `DialSelectField` as a checkbox-per-option group
      (matching the `DialButtonDropdown` mocking convention elsewhere); cover loading spinner, checking/
      unchecking a role and it reflecting in the saved payload, offering every catalog role (not just
      granted ones), and the independent roles-catalog-failure notification.
- [x] 14.7 Verify: `npx eslint` clean; `npx vitest run` on `TableAccessPanel.spec.tsx` and
      `tables/tests/actions.spec.ts`: all passing, no regressions across the full Analytics suite.

## 15. Table-detail UI polish (issue #3847 review + hands-on testing follow-ups)

- [x] 15.1 `TableDetailView.tsx`: consolidate the ACTIVE-table header's **Add columns**/**Write rows**
      buttons into one `DialButtonDropdown` (**Add**: Add rows, Add columns), each item still gated by
      `canWrite`/`canModify`; reorder header actions to Manage access → Delete table → Add/Save.
- [x] 15.2 Rename the "Write rows" label to "Add rows" everywhere user-facing (dropdown item and popup
      header); remove the now-dead `WriteRows` i18n key rather than leaving it unused.
- [x] 15.3 `utils.ts`: add `buildRowsTemplate(columns)` (type-shaped one-row JSON template) and
      `parseRowsJson(json)` (parse-or-null, extracted from `onSubmitWriteRows`'s inline try/catch);
      wire `buildRowsTemplate` into the Add-rows dropdown item's `onClick` and `parseRowsJson` into both
      `onSubmitWriteRows` and the Add-rows popup's `disableSubmitButton`.
- [x] 15.4 Add `invalid={Boolean(error)}` alongside every pre-existing `error={...}` prop in
      `ColumnRowsEditor.tsx`, `CreateTablePopup.tsx`, and `EditColumnPopup.tsx` — the ui-kit's red-border
      styling is driven by `invalid`, not `error` (traced in the compiled bundle; the prop doc comment is
      misleading). Confirmed the same systemic gap existed in all three files, not just the one the user
      first flagged.
- [x] 15.5 Add `required: true` to `Source name`/`Name` labelProps and `required` to the `Element type`
      select in `ColumnRowsEditor.tsx`; add `required` to `Ordering key` and `Grain key` in
      `DraftSchemaEditor.tsx` (functionally required for `useDraftSchemaForm`'s completeness gate, even
      though optional in the DTO).
- [x] 15.6 `TableDetailView.tsx`: add a "Name: `<table>`" row (via `DialEllipsisTooltip`) to the
      delete-table `DialConfirmationPopup`'s description, matching `EntityView/Modals/Delete/Delete.tsx`.
- [x] 15.7 `ColumnRowsEditor.tsx` layout: switch a row to `items-start` (from `items-end`) whenever it
      has any validation error, with a named `LABEL_ROW_OFFSET_CLASS` (`mt-[22px]`) compensating offset
      on the trailing switches/remove-button group — mirrors the existing fix in `Routes/Paths/Path.tsx`
      for the same problem. Widen the Type/Element-type columns `120px → 160px` so "Timestamp" fits.
- [x] 15.8 `DraftSchemaEditor.tsx`: switch Ordering key/Partition column/Granularity to
      `STANDARD_CONTROL_WIDTH` (`constants/main-layout.ts`) and stack them one-per-row instead of
      Partition+Granularity sharing a row.
- [x] 15.9 Tests: new `ColumnRowsEditor.spec.tsx` covers the element-type field, the Nullable
      force-disable, and validation-error rendering (uses `userEvent`, not `fireEvent`, per this repo's
      component-test convention); `utils.spec.ts` extended for `buildRowsTemplate` (per-type values,
      empty-columns case) and `parseRowsJson` (valid array, syntax error, valid-non-array);
      `TableDetailView.spec.tsx` extended for the Add dropdown, the rows template prefill, Insert-rows
      gating, and the delete-confirmation table name; `DraftSchemaEditor.spec.tsx` updated for the
      required-label text match (`{exact: false}`, since the asterisk changes the label's accessible
      name).
- [x] 15.10 Verify: `npx eslint` clean (0 errors) on every touched non-test file; `npx vitest run` on the
      full `Analytics` suite: 104/104 passed, no regressions.
