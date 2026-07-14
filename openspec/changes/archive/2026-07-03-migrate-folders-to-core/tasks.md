## 0. Prerequisite

- [x] 0.1 Confirmed all five per-type changes and `migrate-publications-to-core-api` have landed. Confirmed the per-type recursive-metadata signatures differ (`AssetApi.getMetadata(token, type, path, {recursive})` vs. `FilesCoreApi.getFileMetadata(token, path, recursive)`) — per design's own mitigation, adapted at the call site with a small per-type callback wrapper rather than forcing one leaky signature; also found `DialFileNodeType` uses lowercase `'item'/'folder'` while the four-type `CoreResourceMetadataNode.nodeType` uses uppercase `'ITEM'/'FOLDER'` — the walker compares case-insensitively to avoid depending on an unverified Core casing convention

## 1. Core publications client additions

- [x] 1.1 Added `createPublication(token, targetFolder, resources, rules?)` to `CorePublicationsApi` (`POST /v1/ops/publication/create`), scoped to folder flows only (D1)
- [x] 1.2 Added `ruleList(token, path)` to `CorePublicationsApi` (`POST /v1/ops/publication/rule/list`)
- [x] 1.3 Unit tests in `core-publications-api.spec.ts` — 10/10 passing, including a create→approve integration-style chain

## 2. Recursive cross-type URL gathering (design D3)

- [x] 2.1 Implemented `flattenResourceUrls`/`gatherResourceUrls` (`src/server/folders/resource-walk.ts`) — case-insensitive `nodeType` comparison, swallows read failures/nulls into an empty result
- [x] 2.2 Unit tests in `resource-walk.spec.ts` — 7/7 passing (top-level collection, nested recursion, case-insensitivity, empty-node, thrown-read swallowing, null-read swallowing)

## 3. Folder listing (design D4)

- [x] 3.1 `getFoldersCore` (`src/server/folders/folders-core.ts`) calls each type's recursive metadata read, converts to a `FolderNode` tree via `toFolderTree` (`src/server/folders/folder-tree.ts`), filters nulls
- [x] 3.2 `mergeFolderTrees` validates name/parentPath/bucket/path agree across types, throwing on mismatch
- [x] 3.3 Unit tests in `folder-tree.spec.ts` (6/6) and `folders-core.spec.ts` (multi-type merge, no-type-has-it→null) — all passing

## 4. Rules (design D1, D2)

- [x] 4.1 `getRulesCore` wired to `publicationsApi.ruleList`, unwrapping the `{rules}` envelope
- [x] 4.2 `updateRulesCore` wired to `createPublication` + `approvePublication` via a shared `createAndApprovePublication` helper (also reused by `removeFolderCore`)
- [x] 4.3 Unit tests in `folders-core.spec.ts` — both passing, including create-failure short-circuiting before approve

## 5. Folder delete / unpublish (design D3, D6)

- [x] 5.1 `removeFolderCore` gathers resource URLs across all five types via `gatherResourceUrls`, builds `CoreResourceAction.DELETE` resources, creates + approves the publication
- [x] 5.2 Best-effort per-type cleanup via `Promise.allSettled` after the publish succeeds — comment explains the Azure Blob Storage empty-folder rationale; cleanup failures are never surfaced
- [x] 5.3 Unit tests: multi-type gathering feeds the publication correctly; cleanup failures (mocked to reject) do not fail the overall delete; a failed publish step does fail the overall delete — all passing

## 6. Folder move (design D5)

- [x] 6.1 `changeFolderCore` validates existence via `folderExists` for every type in `resourceTypes` before mutating anything, rejecting on the first missing type
- [x] 6.2 Rules copied from old to new path by replaying `getRulesCore` + `updateRulesCore` before any resource move
- [x] 6.3 Sequential, fail-fast per-type move: `gatherResourceUrls` + `assetApi.move` per URL (generic move op, works for files too — no `replacePathSegment`-specific logic needed since `assetApi.move` already takes bare source/destination paths)
- [x] 6.4 Unit tests: existence check blocks the move before any `assetApi.move` call; rules are copied to the destination before resources move; a failure on the second URL stops there with the first already moved (no rollback) — all passing
- [x] **Scoping note (evidence-based, not a design deviation):** the FE's only real caller of `changeFolder` (`BaseAssetList.tsx`, `Files/List.tsx`) always passes exactly one `ResourceType` per call, never an empty/omitted set — the BE's "default to all five if unspecified" branch has no FE-reachable caller. `changeFolderCore` takes `resourceTypes: ResourceType[]` generically (supporting the all-five case if ever needed) but the wired action passes `[resourceType]`, matching the existing single-type signature exactly

## 7. Wire server actions and cleanup

- [x] 7.1 `folders-storage/actions.ts` updated: `getFolders` (returns `getFoldersCore`'s top-level `.items`, matching the prior `DialFolder[]` list contract exactly), `getRules`, `updateRules`, `removeFolder`, `changeFolder` (passes `[resourceType]` — see the scoping note in section 6) all call the new Core-backed `folders-core.ts` functions instead of `foldersApi`
- [x] 7.2 Confirmed `createFolderWithFiles`/`previewPromptZip`/`previewAppZip`/`previewToolsetZip` are untouched (deferred, per Non-goals) — still call `foldersApi` directly
- [x] 7.3 Confirmed `foldersApi`'s only remaining callers are exactly the four deferred import-related actions above; `assetsApi`'s remaining callers across all five per-type action files are exactly the previously-deferred features (export/import/discovered-tools/sign-in-out/application's validity-state Phase-1 seam) — zero CRUD or folder callers remain on either class; neither class was deleted
- [x] 7.4 `npm run lint` / `npm run format` — clean (2 Prettier-only issues auto-fixed)
- [x] 7.5 `vitest run` — 88/88 across `folders-storage/actions.spec.ts`, `server/folders/`, `server/entities/tests/core-publications-api.spec.ts`, and `server/core/`; full-repo suite green
- [x] 7.6 `openspec validate migrate-folders-to-core --strict` — passes

<!--
No browser-verification task, per explicit user decision: unit tests are sufficient, keeping verification consistent with the other five changes in this migration series.
-->
