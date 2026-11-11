## 1. Per-root paths (resolved from the tree code)

- [x] 1.1 Confirmed: `file/` rows have `path = name`, `platform/` rows `platform/{name}`, `public/` rows `public/...`; design Decision 4 updated

## 2. Application picker type and per-type roots

- [x] 2.0 Add `rootFolders` and optional `rootLabelI18nKey` to `EntitySelectConfig`; make `EntitySelectManager` load that list (single root → string, several → array) instead of `${ROOT_FOLDER}/`, reuse it in the unresolved-value fallback, and pass `rootItem={{ label }}` when there are several; Skill and File declare their single `public/` root

- [x] 2.1 Add `EntitySelectType.Application` to `Common/EntitySelectInput/models.ts` and its entry to `ENTITY_SELECT_CONFIGS` in `constants.ts` (`ApplicationRoute.AssetsApplications`, `rootFolders` for `file/`, `platform/`, `public/`, `AppsFolderProvider` / `useAppsFolder`, `ENTITY_SELECT_GRID_COLUMNS`, header i18n key, `portalId`), leaving the Skill and File entries unchanged
- [x] 2.2 Add the popup header i18n key to the matching i18n enum and `locales/en.ts`, reusing an existing label if one fits

## 3. Key derivation and apply

- [x] 3.1 Add `getApplicationLimitKey(path)` to `Assets/Platform/Roles/utils.ts`: `public/` paths → `applications/{path}`, `file/` and `platform/` paths → the entry name
- [x] 3.2 Add a util that maps picked paths to `{ name }` rows for `addModelLimits`, so existing keys are skipped and duplicates in one pick collapse

## 4. Entities tab UI

- [x] 4.1 Create `Roles/AddApplicationsPopup.tsx` after `ContextFilesPicker`: own `AppsFolderProvider`, `Popup` with `getFormPopupButtons`, multi-select `EntitySelectManager`, Confirm disabled with no selection, selection cleared on cancel
- [x] 4.2 Replace the `+Add` `PrimaryButton` in `Roles/Entities.tsx` with a `ButtonDropdown` (Add models / Add applications) following `AddDependenciesButton`; Add models keeps opening `AddEntitiesGrid`, Add applications opens the new popup and applies through the same `roleRef` / `onChangeRef` path as `onAddModels`; read-only admins still see no add control
- [x] 4.3 Add the dropdown item labels to i18n, reusing existing keys where present, and check whether the "No models" empty title should become entity-neutral

## 5. Tests

- [x] 5.1 Unit tests in `Roles/tests/utils.spec.ts` for `getApplicationLimitKey` (one case per root) and for the pick-to-rows util, covering skip-existing and duplicates within a pick
- [x] 5.2 Component tests in `Roles/tests/Entities.spec.tsx` for the dropdown options, Add models unchanged, Add applications applying picks into `limits`, skip of an existing key, and no add control for a read-only admin
- [x] 5.3 Component test for `AddApplicationsPopup`: Confirm disabled with no selection, cancel discards the pick, confirm reports the picked paths
- [x] 5.4 Extend the `EntitySelectManager` / `EntitySelectInput` specs: the Application config loads all three roots, and Skill and File still load only `public/`

## 6. Quality checks

- [x] 6.1 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs` and the full test suite, and fix any failures
