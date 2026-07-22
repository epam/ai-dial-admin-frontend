## 1. Folder detection and expansion in buildAssetsExport

- [x] 1.1 In `apps/ai-dial-admin/src/server/assets/exim.ts`, add a helper that, given a single `path`, determines via a non-recursive `assetApi.getMetadata(token, resourceType, path, { recursive: false })` call whether it resolves to a folder (`isFolderNode`) or an item (`isItemNode`), reusing `isFolderNode`/`isItemNode` from `apps/ai-dial-admin/src/server/folders/resource-walk.ts`.
- [x] 1.2 Add a helper that expands a confirmed folder path into every descendant resource's bare path at any depth, via `gatherResourceUrls((path, nextToken) => assetApi.getMetadata(token, resourceType, path, { recursive: true, nextToken }), path)` (reusing `gatherResourceUrls` from `resource-walk.ts`), decoding each returned URL back to a bare path with `decodeCorePath(stripPrefix(url, RESOURCE_TYPE_PREFIX[resourceType]))` (matching the pattern already used in `folders-core.ts`'s `changeFolderCore`).
- [x] 1.3 Update `buildAssetsExport` to, for each incoming path: check if it's a folder (1.1); if so, expand it (1.2) into leaf paths and process each through the existing `getMerged` + `id`-tagging logic; if not, process the path exactly as today (unchanged single-path behavior).

## 2. Regression tests

- [x] 2.1 In `apps/ai-dial-admin/src/server/assets/tests/exim.spec.ts`, add a case: `buildAssetsExport` called with a folder path whose folder contains one or more entities returns those entities in the built document (not empty).
- [x] 2.2 Add a case: a folder containing nested subfolders with entities at multiple depths — all entities at every depth are included in the export.
- [x] 2.3 Add a case: a folder with no entities under it (empty folder) still produces a successful export with zero entities for that path, not a failure.
- [x] 2.4 Confirm the existing "skips a path that resolves to nothing" test still passes and still represents a genuinely-missing (non-folder, non-existent) path, distinct from the new folder-path cases.
- [x] 2.5 Add a case verifying non-folder (single-item) paths still go through `getMerged` directly, unchanged from current behavior (no unnecessary folder-check side effects on the export result for plain item paths).

## 3. Quality checks

- [x] 3.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`, `npm run test` from `apps/ai-dial-admin/`) and fix any failures. Lint and format pass clean. Full suite has the same pre-existing flaky failures in `Runs/Compare/tests/CompareView.spec.tsx` and `Runs/Compare/ExecutionResults/tests/ExecutionResultsTab.spec.tsx` (ag-grid rendering-timing flakiness, varying subset fails each run) — unrelated to this change.

## Note on browser verification

No dedicated browser-verification task is included: every scenario in this change's delta specs describes the contents of the exported document (a server-action/data contract), not browser-observable UI state (no element presence/absence, enabled/disabled state, navigation, or displayed text) — so per the verification-task rule, this falls under the "pure server-action contract" exemption and is covered by the unit tests in section 2 instead.
