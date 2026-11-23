## 1. Flag and plumbing

- [x] 1.1 Add a commented `ENABLE_UNSAFE_TOOLSET_IMPORT` entry to `.env.template` and a row to the env table in `README.md` (optional, boolean, default false; note that imported OAUTH toolsets need a real client secret afterwards)
- [x] 1.2 Read `process.env.ENABLE_UNSAFE_TOOLSET_IMPORT` with `isValueTruthy` in `app/[lang]/assets-toolsets/page.tsx` and pass `isUnsafeImportEnabled` through `Assets/Entities/Toolsets/List.tsx` → `Assets/BaseAssetList/BaseAssetList.tsx` → `Assets/BaseAssetList/Modals.tsx` → `EntityListView/Import/ImportModal.tsx` (optional prop, default `false`, so other routes stay inert)

## 2. Import util logic

- [x] 2.1 Add `REPLACE_WITH_REAL_SECRET` to a new `EntityListView/Import/constants.ts`; add the snake-case auth typing it needs to `models/import-asset.ts` (reuse `DialToolsetResourceAuthSettings`)
- [x] 2.2 In `EntityListView/Import/utils.ts`, add pure helpers: `isOAuthToolsetFile`, `hasOAuthToolsets`, and `applyToolsetClientSecrets(files, resolution)` implementing the Finish rule table from `design.md` D1 (absent → placeholder; blank → placeholder under Skip, omitted under Override; non-blank unchanged; drop `client_secret_hint`; non-OAUTH untouched)
- [x] 2.3 Extend `generateAssetRowDataForImportGrid` (`clientSecret` default, `isOAuth` marker) and `AssetImportGridData`; add a `clientSecret` branch to `changeFilesMap` writing `auth_settings.client_secret` on the targeted toolset only
- [x] 2.4 Extend `generateAssetColumnsForImportGrid` with a flag that appends the `Client secret` column (editable on OAUTH rows, empty non-editable cell otherwise), default off so prompts/apps/files output is unchanged

## 3. Masked cell renderer

- [x] 3.1 Create `Grid/CellRenderers/EditablePasswordCellRenderer.tsx` wrapping ui-kit `PasswordInput` (confirm props via the `ai-dial-ui-kit` MCP server): reveal toggle, `autoComplete="new-password"`, per-row accessible name, calls `params.onChange(value, data, field)`, no tooltip

## 4. Modal wiring and UI

- [x] 4.1 Add i18n keys (`ImportI18nKey` in `constants/i18n.ts`, strings in `locales/en.ts`) for the warning text, the Override line (stored-secret replacement, "clearing the value means the secret already exists in Core and is not rewritten, otherwise the import fails", Skip alternative), the column header / input label; reuse shared keys where they exist
- [x] 4.2 In `ImportConflicts.tsx`, render the ui-kit warning notification (title only visible, details in a `Tooltip` around the whole banner plus an `sr-only` copy) under the Conflict Resolution radios when the flag is on, file type is JSON and ≥ 1 parsed toolset is OAUTH, with the Override-only line driven by `resolution`; pass the column flag to `generateAssetColumnsForImportGrid`
- [x] 4.3 In `ImportModal.tsx`, pass the flag and file type to `ImportConflicts` and apply `applyToolsetClientSecrets` in the JSON branch of `onFinishClick` (covering the `editedFileMap`-empty fallback); leave the ARCHIVE and FILES branches untouched

## 5. Tests

- [x] 5.1 Unit tests in `Import/tests/utils.spec.ts` for the new helpers, `changeFilesMap` and the row/column generators, using a real snake_case export fixture; include the rule-table cases, non-OAUTH toolsets, and regression cases showing prompts/applications/files output is unchanged
- [x] 5.2 Component tests for `EditablePasswordCellRenderer` (masked, toggle, `onChange` signature, no tooltip, accessible name)
- [x] 5.3 Update `Import/tests/ImportConflicts.spec.tsx` and add `ImportModal` coverage for: flag off / ZIP / other routes inert, warning title shown and details in the tooltip, Override line toggling with the resolution, Finish payload from grid-recorded edits and from the parsed-file fallback
- [x] 5.4 Run `npm run typecheck` and `npm run typecheck:specs` at zero errors

## 6. Quality checks

- [x] 6.1 Run lint, format check and the full test suite (`npm run lint`, `npm run format`, `npm run test`) and fix any failures
