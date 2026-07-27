## Why

The assets→Core migration has been landing capability-by-capability over several changes, and four
BE-backed operations are the last holdouts: folder creation for files, two dead zip-preview actions
(and the `FoldersApi` class they justify keeping alive), applications' try-out-tool call, and the
`AssetsApi` class itself. Closing these out lets the admin BE dependency for assets be removed from
this codebase entirely — no partial capability is left routing through the old proxy.

## What Changes

- Reimplement `createFolderWithFiles` (`folders-storage/actions.ts`) to create a Files-view folder by
  uploading an empty marker file directly via `filesCoreApi.uploadFile`, instead of
  `foldersApi.createFolder` (admin BE).
- **BREAKING (internal)**: Delete `previewAppZip`/`previewToolsetZip` server actions — confirmed dead
  (no callers) — and delete `FoldersApi` (`src/server/entities/assets/folders-api.ts`), its `foldersApi`
  singleton, and its dedicated spec file, once `createFolderWithFiles` no longer needs it.
- Branch `tryOutAssetTool`'s `ResourceType.APPLICATION` case (`assets-toolsets/actions.ts`) onto a direct
  DIAL Core MCP client session, mirroring the existing `ResourceType.TOOLSET` path, instead of
  `assetsApi.tryOutTool` (admin BE). Requires a new URL builder for Core's
  `/v1/deployments/{deployment_name}/mcp` route (distinct from the toolset route's
  `/v1/toolset/{path}/mcp` shape) — see design.md for the open question this raises.
- **BREAKING (internal)**: Delete `AssetsApi` (`src/server/entities/assets/assets-api.ts`), its
  `assetsApi` singleton, and its spec file, once its one remaining call (above) is migrated.

## Capabilities

### New Capabilities

(none — this change completes existing capabilities rather than introducing new behavior)

### Modified Capabilities

- `folders-core-api`: `createFolderWithFiles` moves from the admin-BE-backed `foldersApi.createFolder`
  to a direct Core file upload; the two dead zip-preview actions and `FoldersApi` are removed.
- `toolset-resources-core-api`: the existing requirement "Application try-out-tool remains unaffected"
  (application resource types stay on the admin BE) is replaced — applications now route through Core's
  MCP endpoint the same way toolsets already do.

## Impact

- **Affected code**: `src/app/[lang]/folders-storage/actions.ts`, `src/components/Assets/Files/List.tsx`
  (caller, signature unchanged), `src/server/entities/assets/folders-api.ts` (deleted),
  `src/app/[lang]/assets-toolsets/actions.ts`, `src/server/toolsets/mcp-client.ts` (new URL builder),
  `src/server/entities/assets/assets-api.ts` (deleted), `src/app/api/api.ts` (removes `foldersApi` and
  `assetsApi` singletons and their imports).
- **Tests**: existing specs for `folders-storage/actions.spec.ts`, `assets-toolsets/actions.spec.ts`,
  `folders-api.spec.ts` (deleted), `assets-api.spec.ts` (deleted) need updating/removing accordingly.
- **No route or component-facing signature changes** — `createFolderWithFiles` and `tryOutAssetTool`
  keep their existing parameters and return shapes; only their internal implementation changes.
- **Dependency reduction**: once both classes are removed, no code in this repo calls the admin BE for
  asset (files/prompts/applications/toolsets/conversations) operations — the admin-BE asset API surface
  becomes fully unused from the frontend.
