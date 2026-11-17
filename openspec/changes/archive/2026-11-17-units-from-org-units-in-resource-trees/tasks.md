## 1. Org-units context

- [x] 1.1 In `src/context/OrgUnitsContext.tsx`, make `refreshUnits` resolve with the map it settled on (`{}` on `DISABLED`, the last good map on `ERROR` or a throw) and mirror `units` and `unitsStatus` in refs
- [x] 1.2 Add `loadUnits(): Promise<Record<string, OrgUnit>>` (in-flight request if any, first load if never requested, else the current map; never rejects) and expose it on `OrgUnitsContextType`
- [x] 1.3 Make `refreshUnits` skip the request and resolve `{}` once the status is `DISABLED`
- [x] 1.4 Update the `OrgUnitsContext` mock in `apps/ai-dial-admin/test-setup.tsx` (`loadUnits`, a `refreshUnits` that resolves a map)

## 2. Unit row utils

- [x] 2.1 In `src/utils/org-units/units.ts` add `getChildUnitRows(units, path)` returning folder rows for the units directly below a normalized `public/…/` path (`name` from `unit.name`, `path` from `unit.folder`, `nodeType` FOLDER, `bucket` Public, `folderId` = parent path)
- [x] 2.2 Add `getUnitSetSignature(units)` (sorted normalized unit folder keys joined, so a display-name change keeps it equal)

## 3. Folder context factory

- [x] 3.1 Replace the `getFolderRows` argument of `createFolderContext` in `src/context/assets/AssetsFolderContext.tsx` with `includeUnits?: boolean`; for `public/` paths await `loadUnits()` (rejection → `{}`) in parallel with `getFilesFunc` and merge `getChildUnitRows` through `mergeFolderRows`, keeping the `undefined` → `FetchFailed` path unchanged
- [x] 3.2 Record the signature of the units each build used in a ref
- [x] 3.3 Add `FolderActionType.TreeInvalidated` (`context/assets/models.ts`) and its case in `folder-reducer.ts` (empties `files`, `fetchedFoldersData` and `expandedFolders`, keeps `filePath` and `hasFetchError`)
- [x] 3.4 Add the provider effect on `units`: when a tree was built and the new signature differs from the recorded one, dispatch `TreeInvalidated`
- [x] 3.5 Pass `true` from `ToolsetsFolderContext`, `AppsFolderContext`, `SkillFolderContext`, `ProjectFolderContext`, `ConversationsFolderContext` and `PromptFolderContext`; leave every other context as is

## 4. Listing open refresh

- [x] 4.1 In `src/components/Common/FileManager/FileManager.tsx`, change the mount effect: `refreshUnits()` when `getRouteNamespace(view) != null`, otherwise `ensureUnits()`; the effect runs on mount only and before the root fetch effect

## 5. Remove the Files read

- [x] 5.1 Delete `src/context/assets/file-folders.ts` and `getFileFolders` from `src/app/[lang]/files/actions.ts`
- [x] 5.2 Remove their specs (`file-folders-opt-in.spec.ts`, the `getFileFolders` cases in `files/actions.spec.ts`) and any now-unused imports (`DialFileNodeType` in the actions file)

## 6. Specs and docs

- [x] 6.1 Rewrite the Purpose line of `openspec/specs/resource-tree-file-folders/spec.md` to describe unit folders, not Files folders
- [x] 6.2 Check `docs/` for text that describes the Files folder merge or the units load and update it in this change

## 7. Unit tests

- [x] 7.1 `utils/org-units` specs: `getChildUnitRows` (root, nested, encoded segment, no children, unit below a deeper path excluded) and `getUnitSetSignature` (order independence, display-name change keeps it, add/remove changes it)
- [x] 7.2 `OrgUnitsContext` spec: `loadUnits` shares the in-flight request, `refreshUnits` resolves the map, `DISABLED` → `{}` and later refreshes make no request, `ERROR` keeps the last good map
- [x] 7.3 `AssetsFolderContext` spec: unit rows merged on `public/` loads, own node wins, no merge off `public/` or without the flag, units rejection leaves rows and timing unaffected, type listing `undefined` still reports the fetch error, unit-only folder expands
- [x] 7.4 Reducer and provider specs: `TreeInvalidated` keeps selection and open folders; signature change invalidates, equal signature and first build do not
- [x] 7.5 `FileManager` spec: unit-aware view refreshes units once on mount and not on folder selection; a view without a namespace only ensures them

## 8. Quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`, and fix every failure
