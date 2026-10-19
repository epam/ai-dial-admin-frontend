## 1. Characterization tests

- [x] 1.1 In `apps/ai-dial-admin/src/context/assets/tests/AssetsFolderContext.spec.tsx`, add cases for single-path `fetchFiles`: first load merges into the tree and auto-expands the first node; a later load merges without re-expanding; `refreshData` replaces the cache; `resetFolder` resets `filePath`; `undefined` result sets `data` to `null`.
- [x] 1.2 Add cases for `fetchFiles([rootA, rootB])`: both root nodes in the given order, last physical root opened, a failing physical root nulls `data`, a failing config-file root is remembered and keeps `toggleFolder` from fetching it, `refreshData` replaces vs. merges the cache.
- [x] 1.3 Add cases for `fetchFolderHierarchy`: `fullTree` true vs. false, a missing next folder gets a placeholder node, a failing level nulls `data`, `isFetchingFiles` is true during and false after, a path without `/` is ignored.
- [x] 1.4 Add cases for `toggleFolder`: expand fetches an uncached folder, expand of a cached folder does not fetch, collapse restores that folder's cached items, `skipFetch`, `collapseAll`, and a failed config-file path sets `data` to `null`.
- [x] 1.5 Add cases for the hook throwing outside its provider, and for the config-file root (`getConfigFileNames` maps names to `File` items under the platform bucket).
- [x] 1.6 Pin the quirks the later steps flip, each named for the current behavior with a comment naming the step: `data` set for a fetched path that is not `filePath`; a slower earlier response overwriting a later one; `isFetchingFiles` cleared by the first of two overlapping fetches.

## 2. Pure helpers

- [x] 2.1 Add `getFolderItems` to `apps/ai-dial-admin/src/utils/files/folder.ts` and use it at the three existing call sites in the factory; unit tests in `src/utils/files/tests/`.
- [x] 2.2 Add `toConfigFileItems(names)` and `buildRootNodes(paths, results)` under `src/utils/files/` (types in an adjacent `models.ts`, constants in `constants.ts`), with unit tests; replace the inline versions in the factory.
- [x] 2.3 Add `loadFolderHierarchy({ fullPath, fullTree, fetchByPath })` under `src/utils/files/` returning the computed state or `null` on a failing level; unit tests with a stub fetcher cover `fullTree`, the placeholder branches, and failure. Make `fetchFolderHierarchy` call it.
- [x] 2.4 Type the helpers generically and remove the `as T` / `as unknown as T` / `as DialFile[]` casts they make unnecessary; keep any remainder at one commented boundary.
- [x] 2.5 Leave the step 1 suite untouched by this group; it is the regression check run at the end (7.2).

## 3. Reducer and async/await

- [x] 3.1 Move `files`, `filePath`, `expandedFolders`, `fetchedFoldersData` and `data` into one `useReducer` with named actions (`rootsLoaded`, `folderLoaded`, `hierarchyLoaded`, `folderToggled`, `fetchFailed`); reducer lives beside the factory with its own `models.ts`/`constants.ts` split.
- [x] 3.2 Convert `fetchRoots` and `fetchFiles` to `async/await` with `try/catch/finally`.
- [x] 3.3 Add reducer unit tests (one per action, plus the first-load auto-expand decision made from current state). Leave the step 1 suite untouched by this group (run at the end, 7.2).

## 4. Hazard fixes

- [x] 4.1 Remove the `toggleFolder` call from inside the `setFiles` updater; auto-expand is decided in the reducer. Test that the auto-expand happens exactly once under StrictMode double-invocation.
- [x] 4.2 Add the request-id guard so only the newest request updates the selected folder, while cache writes always apply; update the quirk test to the new behavior and add a "late response still fills the cache" case.
- [x] 4.3 Replace the boolean with an in-flight counter so `isFetchingFiles` stays true until the last overlapping fetch settles; update the quirk test.
- [x] 4.4 Remove stale-closure reads of `filePath`, `expandedFolders` and `fetchedFoldersData` after an `await`; test a fetch that resolves after the selected folder changed.

## 5. Remove `data`

- [x] 5.1 Decisions are recorded in `design.md` (one `hasFetchError` boolean; `CreateAsset` shows a notification on failure and stays usable; no verification task). Confirm nothing else reads `data == null` as a signal.
- [x] 5.2 Add state-backed `hasFetchError` to the factory (the internal failed-paths ref stays for the config-file root logic) and expose it on `AssetsFolderContext` and `AssetsFolderContextReader`.
- [x] 5.3 Migrate `apps/ai-dial-admin/src/components/Assets/BaseAssetList/BaseAssetList.tsx` to read `fetchedFoldersData[filePath]` only, and `ImportModal` likewise, by moving its private `getExistingFolderItems` into `apps/ai-dial-admin/src/components/EntityListView/Import/utils.ts`; drop the `data` fallback in both.
- [x] 5.4 Migrate `apps/ai-dial-admin/src/components/Assets/Deployments/CreateAsset.tsx` to `fetchedFoldersData[filePath]`: spinner while `isFetchingFiles`, and on `hasFetchError` an error notification with the form still usable.
- [x] 5.5 Delete `data` from the reducer, `AssetsFolderContext` and the factory; update the `data` cases in the factory spec to the derived equivalents and fix the fixtures/mocks in the 21 specs and `test-setup.tsx` that supply `data`.
- [x] 5.6 Component tests: `CreateAsset` (loader until the selected folder is cached, names from the selected folder, notification and usable form on failure, no notification on success) and `getExistingFolderItems` (in `Import/tests/utils.spec.ts`). `BaseAssetList` is covered by its existing specs, whose mock contexts no longer supply `data`.

## 6. Stable callbacks

- [x] 6.1 List every consumer that has `fetchFiles`, `fetchFolderHierarchy` or `toggleFolder` in an effect dependency array and confirm none relies on re-running each render.
- [x] 6.2 Wrap the three functions in `useCallback` and the context value in `useMemo`; add a test that their identity is stable across an unrelated re-render.

## 7. Quality checks

- [x] 7.1 Once, after all groups are implemented: `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs`, all at zero errors.
- [x] 7.2 Once, at the end: `npx vitest run src/context src/utils/files` from `apps/ai-dial-admin/`, then the full suite via the Windows-safe command (re-run any failures in isolation before attributing them to this change).

<!--
All groups ship in one PR; groups are an implementation order, not separate PRs. Tests and quality checks
run only once, at the end (group 7), by request.

No browser-verification task: the user declined it.
-->
