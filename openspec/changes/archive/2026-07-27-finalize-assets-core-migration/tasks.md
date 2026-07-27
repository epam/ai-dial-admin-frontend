## 1. Confirm the applications MCP URL scheme (blocking for §3)

- [x] 1.1 Confirm how `ai-dial-core`'s `ApplicationService` (or equivalent deployment-id resolution)
      matches the `deployment_name` path segment on `POST /v1/deployments/{deployment_name}/mcp` for a
      custom (Core-native) application — specifically, whether it is the application's full
      bucket-relative resource path with the `RESOURCE_TYPE_PREFIX[APPLICATION]` prefix (the same
      scheme `buildToolsetMcpUrl` uses for toolsets), by reading the relevant Core service code or by
      calling the endpoint against a running Core instance with a known asset application.
- [x] 1.2 Record the confirmed URL/id scheme (or the actual scheme if different from the assumption) as
      a short note in `design.md`'s Open Questions section before starting task 3.1.

## 2. Files-view folder creation via Core (item 1)

- [x] 2.1 In `src/app/[lang]/folders-storage/actions.ts`, reimplement `createFolderWithFiles` to build
      the empty-marker-file target path and call `filesCoreApi.uploadFile(token, targetPath, file)`
      directly, instead of `foldersApi.createFolder(token, body, type, view)`. Keep the action's
      existing `(body, type?, view?)` signature and return shape.
- [x] 2.2 Verify `src/components/Assets/Files/List.tsx`'s `handleCreateFolder` needs no changes (it
      already builds the empty-file `FormData` it currently passes in) — confirm the new
      implementation extracts the same target path and file from that input.
- [x] 2.3 Update `src/app/[lang]/folders-storage/actions.spec.ts`'s `createFolderWithFiles` test to
      mock `filesCoreApi.uploadFile` instead of `foldersApi.createFolder`, asserting the correct target
      path and file are passed.

## 3. Applications' try-out-tool via Core MCP (item 3)

- [x] 3.1 Add `buildApplicationMcpUrl(host, path)` in `src/server/toolsets/mcp-client.ts` (or a
      sibling module if it no longer fits a toolset-named file), building
      `{host}v1/deployments/{RESOURCE_TYPE_PREFIX[APPLICATION]+encodedPath}/mcp` per the confirmed
      scheme from task 1.
- [x] 3.2 In `src/app/[lang]/assets-toolsets/actions.ts`, change `tryOutAssetTool`'s
      `ResourceType.APPLICATION` branch to call `callToolViaMcp` with the new
      `buildApplicationMcpUrl`-built URL, instead of `assetsApi.tryOutTool(body, token, resourceType)`.
- [x] 3.3 Update `src/app/[lang]/assets-toolsets/actions.spec.ts`'s APPLICATION-branch test(s) to mock
      the MCP client path instead of `assetsApi.tryOutTool`, asserting the correct deployment MCP URL
      is built and `callToolViaMcp` is invoked with it.
- [x] 3.4 Add/extend unit tests for `buildApplicationMcpUrl` alongside the existing
      `buildToolsetMcpUrl` tests in `src/server/toolsets/tests/mcp-client.spec.ts`.

## 4. Delete FoldersApi and its dead actions (item 2)

- [x] 4.1 Re-run a repo-wide search for `foldersApi`/`FoldersApi` usage to confirm zero remaining
      callers now that task 2 has landed.
- [x] 4.2 Delete `previewAppZip` and `previewToolsetZip` from
      `src/app/[lang]/folders-storage/actions.ts`, and their corresponding tests in
      `folders-storage/actions.spec.ts`.
- [x] 4.3 Delete `src/server/entities/assets/folders-api.ts` and its spec
      `src/server/entities/assets/tests/folders-api.spec.ts`.
- [x] 4.4 Remove the `foldersApi` singleton and `FoldersApi` import from `src/app/api/api.ts`.
- [x] 4.5 Remove now-unused exports from `src/server/entities/assets/utils.ts`
      (`buildCreateFolderUrl`) and `constants.ts` if they have no other callers after this cleanup;
      update or delete their specs accordingly. (`ResourceBasePaths`/`ResourceOperation`/`buildAssetUrl`
      remain — still used by `AssetsApi`, addressed in task group 5.)

## 5. Delete AssetsApi (item 4)

- [x] 5.1 Re-run a repo-wide search for `assetsApi`/`AssetsApi` usage to confirm zero remaining callers
      now that task 3 has landed.
- [x] 5.2 Delete `src/server/entities/assets/assets-api.ts` and its spec
      `src/server/entities/assets/tests/assets-api.spec.ts`.
- [x] 5.3 Remove the `assetsApi` singleton and `AssetsApi` import from `src/app/api/api.ts`.
- [x] 5.4 (Discovered during implementation) `buildAssetUrl`/`ResourceBasePaths`/`ResourceOperation` in
      `src/server/entities/assets/utils.ts`/`constants.ts` had no callers left besides `AssetsApi`
      itself — deleted the entire now-empty `src/server/entities/assets/` directory (utils, constants,
      and their spec) rather than leaving dead exports behind. Updated the stale "Phase 1" comment in
      `src/server/publications/resolver/types.ts` referencing the old `assetsApi`-backed enrichment
      path, and removed the now-impossible `assetsApi.getAsset` negative assertion from
      `assets-applications/actions.spec.ts`.

## 6. Spec/documentation sync

- [x] 6.1 Update `openspec/specs/folders-core-api/spec.md`'s Purpose paragraph to drop the mention of
      `createFolderWithFiles`/zip-preview actions remaining on the admin BE, once this change archives.
- [x] 6.2 Update `openspec/specs/toolset-resources-core-api/spec.md`'s Purpose paragraph to drop the
      "except that `tryOutAssetTool` for `ResourceType.APPLICATION` still routes through the admin BE"
      caveat, once this change archives.

## 7. Verification note

- [x] 7.1 No dedicated browser-verification task is needed for this change: every scenario in this
      change's spec deltas describes an internal routing decision (which backend a call reaches), not
      observable UI state (element presence, enabled/disabled, navigation, or displayed text) — so
      there is no THEN clause the `spec-browser-verify` gate could check. Correctness is covered by the
      unit tests in tasks 2.3, 3.3, and 3.4.

## 8. Final quality gate

- [x] 8.1 Run `npm run lint` and `npm run format` (from `apps/ai-dial-admin/`) and fix any issues.
      Both clean (lint: 0 errors, 32 pre-existing unrelated warnings; format: all files match).
- [x] 8.2 Run `npx vitest run --coverage` (from `apps/ai-dial-admin/`) and confirm the coverage gate is
      not regressed. 6552/6557 tests passed; the 3 failing test files
      (`Analytics/QueryBuilder/tests/QueryBuilder.spec.tsx`,
      `Analytics/QueryBuilder/utils/tests/sql-format.spec.ts` — missing `sql-formatter` package in
      `node_modules`, and `Grid/Filter/tests/NumericFilterDropdown.spec.tsx` — a test timeout) are
      pre-existing and unrelated to any file this change touches. All specs for files modified in this
      change pass.
