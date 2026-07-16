# Tasks — adopt consolidated column-metadata PATCH

## 1. Models

- [x] 1.1 In `src/models/analytics/table.ts`, remove `AnalyticsColumnRetag`, `AnalyticsColumnSetDisplayName`, and `AnalyticsColumnRedescribe`, and add `AnalyticsColumnMetadataUpdate { name: string; tag?: string; display_name?: string; description?: string; sensitive?: boolean }`.
- [x] 1.2 Replace the `retag` / `set_display_name` / `redescribe` fields on `AnalyticsSchemaPatch` with `update?: AnalyticsColumnMetadataUpdate[]`; keep `add` / `drop` / `rename` unchanged. Update the blank-clears comment to reference merge-patch semantics.

## 2. Patch builder

- [x] 2.1 In `src/components/Analytics/Tables/utils.ts`, rewrite `buildColumnEditPatch` to emit a single `update` entry `{ name: target, ...changedMetadataFields }` (tag / display_name / description added only when changed, blank sends `""`), guarded so a metadata-only `update` is omitted when only a rename changed; return `null` when nothing changed.

## 3. Edit modal

- [x] 3.1 In `src/components/Analytics/Tables/EditColumnPopup.tsx`, add a fourth `DialInput` for description (id `column-edit-description`, seeded from `values.description`, `onChange={setValue('description')}`) labeled with `AnalyticsTablesI18nKey.Description`.

## 4. Tests

- [x] 4.1 Update `src/components/Analytics/Tables/tests/utils.spec.ts` to assert the new single-`update`-entry shape: only-changed fields, blank-clears, post-rename `name`, and no `update` when only rename changed.
- [x] 4.2 Update `src/components/Analytics/Tables/tests/EditColumnPopup.spec.tsx` to cover the description field rendering and its inclusion in the submitted patch.
- [x] 4.3 Update `src/server/analytics/tests/analytics-data-api.spec.ts` and `src/utils/tests/schema.spec.ts` if they assert the old `retag` / `set_display_name` / `redescribe` op names.

## 5. Sensitive marking (visual + editable)

- [x] 5.1 Add `sensitive?: boolean` to the read models: `AnalyticsTableColumn` (`table.ts`), `AnalyticsEntityField` (`entity.ts`), `FieldOption` (`query-builder.ts`); add `sensitive: boolean` to `ColumnEditValues` (`tables-ui.ts`).
- [x] 5.2 Add the shared `Common/SensitiveIndicator/SensitiveIndicator.tsx` (colored `bg-yellow-400` dot + "Sensitive" `DialTooltip`, `role="img"`).
- [x] 5.3 Table detail grid (`TableDetailView.tsx`): render the marker inline in the name cell (after the name) via a `ColumnNameCellRenderer`; the name column stays editable.
- [x] 5.4 Query Builder dropdown (`CategorizedFieldDropdown.tsx`): render the indicator before the field label when `option.sensitive`; carry `sensitive` through `fieldsToOptions` (`utils/fields.ts`).
- [x] 5.5 Edit modal (`EditColumnPopup.tsx`): add a Sensitive `DialSwitch`; seed from `column.sensitive`; diff into `update.sensitive` in `buildColumnEditPatch` (`Tables/utils.ts`).
- [x] 5.6 i18n: add `AnalyticsTablesI18nKey.Sensitive` + `SensitiveTooltip` (enum + `en.ts`).
- [x] 5.7 Create-time: add `sensitive: boolean` to `ColumnRow` (`tables-ui.ts`) + `createColumnRow` default; render a per-row Sensitive `DialSwitch` in `ColumnRowsEditor.tsx` (Add columns + Create table); carry it through `toTableColumns` (`utils.ts`, omit when off).
- [x] 5.8 Tests: `fields.spec.ts` (sensitive passthrough), `CategorizedFieldDropdown.spec.tsx` (dropdown marker), new `SensitiveIndicator.spec.tsx`; extend `utils.spec.ts` for the sensitive diff + `toTableColumns`/`createColumnRow` passthrough, and `EditColumnPopup.spec.tsx` for the sensitive toggle.

## 6. Spec

- [x] 6.1 Apply the delta from `specs/analytics/spec.md` into the master spec `openspec/specs/analytics/spec.md` (the "Table detail column schema management" requirement + scenarios, and the sensitive marker on the categorized-field-dropdown requirement).

> Browser verification: not added — the user opted to rely on unit/component tests. The browser-observable scenarios (description input renders, sensitive toggle/marker) are covered by the `EditColumnPopup`, `CategorizedFieldDropdown`, and `SensitiveIndicator` component tests.

## 7. Quality checks

- [x] 7.1 Run lint, typecheck, and the analytics tests (`vitest` from `apps/ai-dial-admin/`); ensure no remaining references to the removed op names across the app.
