## 1. Adapter

- [x] 1.1 Bridge admin `DialFile[]` to the library's `DialFile[]` with a single cast at the `items` prop, as the admin `FileManager` wrapper does (no mapping helper; see design decision 4)
- [x] 1.2 In `FolderList.tsx`, replace `renderTree`/`getFolderClassName` with `DialFoldersTree` per design: `expandedPaths`, `selectedPath`, `loadedPaths` from `fetchedFoldersData` keys, `areHiddenFilesVisible`, localized `ariaLabel`, `onItemClick` resolving back to the original node for `toggleFolder`, and a commented no-op `onExpandedPathsChange`
- [x] 1.3 Keep fetch effects, `scrollToFolder`, root-path filtering, loader and `NoFolders` state unchanged; remove now-unused imports (`IconCaret*`, `IconFolder`, `classNames`, `isFolder`, `BASE_BUTTON_ICON_PROPS`)

## 2. Tests

- [x] 2.1 Test against the real tree; stub `document.elementFromPoint` (missing in jsdom, used by the ui-kit `Dropdown` the tree wraps rows in) in `apps/ai-dial-admin/test-setup.tsx`
- [x] 2.2 Not applicable — no mapping helper (see 1.1)
- [x] 2.3 Rewrite/extend `FolderList.spec.tsx` for the `folder-list-tree` scenarios: folders only, dot-folder shown, root path excluded, one `toggleFolder` call per click and per Enter, expansion/selection from context, caret hidden for fetched leaf, tree role and localized name, no auto focus, existing fetch/empty/loader cases
- [x] 2.4 Confirm `CreateAsset.spec.tsx` still passes and fix any assertion tied to the old DOM

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and fix findings
