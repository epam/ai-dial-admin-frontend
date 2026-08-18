## 1. Row model and DTO mapping

- [x] 1.1 In `apps/ai-dial-admin/src/models/analytics/tables-ui.ts`, add `display_name: string` and `description: string` to `ColumnRow` (plain non-optional strings, per design D2), and add optional `display_name?` / `description?` keys to `ColumnRowError`.
- [x] 1.2 In `apps/ai-dial-admin/src/components/Analytics/Tables/utils.ts`, seed both fields to `''` in `createColumnRow`, and seed them from `c.display_name ?? ''` / `c.description ?? ''` in `toColumnRows` so a `FAILED` table's stored metadata round-trips.
- [x] 1.3 In the same file, extend `toTableColumns` to emit `display_name` and `description` only when the trimmed value is non-blank, following the existing `...(r.tag.trim() ? { tag: r.tag.trim() } : {})` shape (design D3).

## 2. Validation

- [x] 2.1 In `getColumnRowErrors` (`components/Analytics/Tables/utils.ts`), length-validate both fields with `getAnalyticsLengthError` against `ANALYTICS_DISPLAY_NAME_MAX_LENGTH` and `ANALYTICS_DESCRIPTION_MAX_LENGTH` from `constants/analytics/tables.ts`, unconditionally per row as `tag` already is.
- [x] 2.2 Add both new keys to the boolean OR in `hasColumnRowErrors`, so an over-cap value disables Save / submit instead of reaching the backend as a 422 (design D4).

## 3. Row editor UI

- [x] 3.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/ColumnRowsEditor.tsx`, add a Display name `DialInput` and a Description `DialInput` to the row, inline directly after Name and before Type (final order: Name, Display name, Description, Type, Element type, Tag), using `AnalyticsTablesI18nKey.DisplayName` and `AnalyticsTablesI18nKey.Description` with `labelProps` on the first row only, ids `col-display-name-${row.id}` / `col-description-${row.id}`, and `error` + `invalid` wired from the row's `ColumnRowError` — matching how the existing Tag field is built.
- [x] 3.2 Give the two new inputs `flex` weights and `min-w-[…]` floors consistent with the existing fields (Name `flex-[2] min-w-[160px]`, Tag `flex-1 min-w-[120px]`), weighting Description the wider of the pair. Do not add a horizontal scroll container (design D1).
- [x] 3.3 Add `display_name` and `description` to the `rowHasError` computation, so a row erroring only on one of the new fields still gets the `items-start` alignment and the first-row `LABEL_ROW_OFFSET_CLASS` offset (design D4).

## 4. Tests

- [x] 4.1 Extend `components/Analytics/Tables/tests/utils.spec.ts`: `createColumnRow` defaults both fields to `''`; `toColumnRows` seeds them from a stored column and from an absent value; `toTableColumns` emits both when filled, omits both when blank or whitespace-only, and trims; `getColumnRowErrors` reports a length error at 129 chars of display name and at 1025 chars of description and none at the caps; `hasColumnRowErrors` returns true for an error carrying only `display_name` and only `description`.
- [x] 4.2 Extend `components/Analytics/Tables/tests/ColumnRowsEditor.spec.tsx`: both fields render per row; labels appear on the first row only; typing updates the row; an over-cap value renders its error message; a row erroring only on `description` still renders with the top-aligned layout.
- [x] 4.3 Extend `components/Analytics/Tables/tests/DraftSchemaEditor.spec.tsx` and `tests/use-draft-schema-form.spec.ts`: a complete source schema whose column carries a display name and description submits them via `defineTableSchema`; a `FAILED` table seeds both from its stored definition; an over-cap value disables Save.
- [x] 4.4 Extend `components/Analytics/Tables/tests/TableDetailView.spec.tsx`: the add-columns popup renders both fields, submitting carries them in the patch's `add` entry, and an over-cap value disables the popup's submit.

## 5. Spec sync

- [x] 5.1 Fold the delta at `openspec/changes/add-column-creation-display-name-description/specs/analytics/spec.md` into `openspec/specs/analytics/spec.md`, replacing the **Define and materialize a table schema** and **Table detail column schema management** requirements with their modified versions (analytics is one master spec — no new spec file).

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill for this change against the running local app (stack up, auth disabled, `ANALYTICS_ENABLED` on), covering the browser-observable scenarios: both fields present per row on the schema-definition surface and in the add-columns popup, labels on the first row only, an over-cap value disabling Save / submit, and a `FAILED` table's stored display name and description seeded into its rows. Result: 5 of 6 scenarios pass; the FAILED-table seeding scenario is blocked on data availability (no FAILED table exists in the environment) — no `fail` verdicts.

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and fix everything they report.
