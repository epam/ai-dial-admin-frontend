## 1. Core client and models

- [x] 1.1 Re-read core's `docs/org-units.md` on the merged branch (PRs #2137–#2165) and note any contract drift from the design before coding
- [x] 1.2 Add `src/models/dial/org-unit.ts` (unit, role, role assignment, subject, unit-delete and assignment-delete responses) and a `SubjectKind` enum
- [x] 1.3 Add `src/server/entities/core-org-units-api.ts` extending `CoreApi` (list recursive, get, create, rename, delete, roles, assignments list/add/remove) with per-segment path encoding via `encodeCorePath`, and export an instance from `src/app/api/api.ts`
- [x] 1.4 Add server actions to `src/app/[lang]/folders-storage/actions.ts` for each client call, authenticated with `getUserToken`

## 2. Pure helpers

- [x] 2.1 Add `getOwningUnit` / `isInsideUnit` / `containsUnit` / `getUnitLevel` helpers (segment-boundary prefix match on `folder`) under `src/utils/`
- [x] 2.2 Add `classifySubject` and `buildSubject` (person, group via configured claim, everyone, DIAL role, raw) under `src/utils/`
- [x] 2.3 Add the core-error mapping (400/403/404/409/5xx → field error, hidden control, message) as a pure function shared by dialogs and the card

## 3. Context and configuration

- [x] 3.1 Load the unit map once and expose `units`, `unitsStatus`, `refreshUnits` and `getOwningUnit` (first built on `RuleFolderContext`; moved to the shared `OrgUnitsContext` in 7.1)
- [x] 3.2 Add the single-value `ORG_UNITS_GROUP_CLAIM` env variable (default `groups`): read it in `src/app/[lang]/layout.tsx`, pass it to `RuleFolderProvider` as a prop alongside `attributes`, expose it from the context, and document it in `.env.template` (commented) and the README environment table
- [x] 3.3 Add i18n keys (`FoldersI18nKey` additions in `src/constants/i18n.ts`, strings in `src/locales/en.ts`), reusing shared button/basic keys where they exist

## 4. Tree marker

- [x] 4.1 After the maintainer's releases, bump `@epam/ai-dial-ui-kit` and `@epam/ai-dial-react-file-manager` in `package.json` and confirm `npm run typecheck` still passes (ui-kit `FileName` `icon` prop; file-manager `DialFoldersTree` `getItemIcon` prop)
- [x] 4.2 Pass `getItemIcon` from `FolderList` (unit icon from `@tabler/icons-react`, `aria-hidden`) for unit folders only; the prop is not passed, and rows are unchanged, for contexts without a unit map

## 5. Details panel

- [x] 5.1 Refactor `FolderInfo` into a switch over ownership (rules editor unchanged / unit body / inside-unit note / units-load error) without altering the rules draft behaviour
- [x] 5.2 Add the unit header (display name, path, badge) with New unit, Rename and Remove unit actions, reusing the `FolderInfoHeader` layout
- [x] 5.3 Add `use-unit-roles-draft` (stored/added/removed model, diff, sequential Save, reload on partial failure) under the Folders Storage components
- [x] 5.4 Add `UnitRolesCard` and its role/holder components following the `RulesList` card and chip styling, with `role="group"` + `aria-label` per role and labelled remove buttons; hide on 403
- [x] 5.5 Wire Save/Discard through `ChangedEntityButtons` and the holder validation (blank, length, control characters)

## 6. Unit lifecycle dialogs

- [x] 6.1 Add the New unit dialog (parent, name, display name, inline core errors) and its disabled states for plain-folder parents and level-4 units
- [x] 6.2 Add the Rename dialog (`displayName` only, 128-character limit)
- [x] 6.3 Add the Remove unit dialog (sub-unit list, recursive delete, 409 message shown in place)
- [x] 6.4 Reload units and restore selection after create, rename and remove

## 7. Content-page guards

- [x] 7.1 Add `src/context/OrgUnitsContext.tsx` (units, status, group claim, `ensureUnits`, `refreshUnits`, `getOwningUnit`), mount it in `layout.tsx` above the folder providers, move the unit state out of `RuleFolderContext`, switch `FolderList`, `FolderInfo`, `UnitInfo` and the unit buttons to `useOrgUnits`, and add its mock to `test-setup.tsx`
- [x] 7.2 After the maintainer releases the file-manager `getItemActionRestriction` prop, bump `@epam/ai-dial-react-file-manager` and keep both typechecks at zero
- [x] 7.3 Call `ensureUnits` from `FileManager` on mount and pass `getItemActionRestriction` that returns an i18n reason for Move, Rename and Delete on a unit folder or a folder containing a unit, and `undefined` otherwise
- [x] 7.4 Add the i18n reasons in `FoldersI18nKey` / `en.ts`
- [x] 7.5 Pass `gridOptions.getItemIcon` from `FileManager` (same `UnitFolderIcon`) once the file-manager release that adds it is bumped (the tree icon is already wired)

## 8. Tests

- [x] 8.1 Unit-test the helpers from section 2, including the `Risk` / `Risk2` prefix case, nearest-unit-wins and each subject kind
- [x] 8.2 Unit-test the Units API client (paths, encoding, bodies, delete response shapes) and the server actions
- [x] 8.3 Component-test `FolderInfo` ownership switching, the roles card (classification, add/remove, Save diff, partial failure, Discard, selection-change drop, 403 hide) and units-off / units-error states
- [x] 8.4 Component-test the three dialogs, including each core error mapping and the disabled New unit states
- [x] 8.5 Add tests for `OrgUnitsContext` (single load, 404, error, refresh) and the `FileManager` restriction callback (unit, containing folder, inside-only folder, units off); extend `FolderList` specs for the marker and for contexts without units; keep `npm run typecheck` and `npm run typecheck:specs` at zero

## 9. Docs and quality gates

- [x] 9.1 Update `docs/` and the consolidated specs if any describe Folders Storage behaviour changed here
- [x] 9.2 Run lint, format, both typechecks and the full test suite, and fix findings
