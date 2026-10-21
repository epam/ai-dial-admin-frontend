## 1. Record thrown fetches as failures

- [x] 1.1 In `apps/ai-dial-admin/src/context/assets/AssetsFolderContext.tsx`, add a `catch` to `fetchRoots`, `fetchFolder` and `fetchFolderHierarchy` that dispatches `FolderActionType.FetchFailed` only when `request.isLatest()`; keep the existing `finally { request.finish() }`
- [x] 1.2 Extend `apps/ai-dial-admin/src/context/assets/tests/AssetsFolderContext.spec.tsx`: a rejecting fetch sets `hasFetchError` and leaves `isFetchingFiles` false for each of the three fetchers; a stale rejection after a newer success keeps the loaded folders and reports no error

## 2. Issue the empty-state auto-fetch once

- [x] 2.1 In `apps/ai-dial-admin/src/components/Common/FolderList/FolderList.tsx`, guard the empty-state auto-fetch with a ref holding the root-set key already fetched (`rootPaths` joined), so a context update with empty files, including the fetching flag flipping or a recorded failure, does not fetch again; leave the `initialPath` branch unchanged
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/Common/FolderList/FolderList.spec.tsx`: rerendering with a changed context value and empty files issues one fetch; a failed (`hasFetchError`) empty context is not refetched; a changed root set fetches again; single-root and multi-root (`fetchFiles(rootPaths)`) paths both stay covered

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the two touched spec files with `npx vitest run` from `apps/ai-dial-admin/`; then the full `npm run test`, re-running any unrelated failing file in isolation before attributing it to this change
