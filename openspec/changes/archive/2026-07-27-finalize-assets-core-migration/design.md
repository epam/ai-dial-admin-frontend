## Context

Four BE-backed operations remain from the assets→Core migration series. Two (`FoldersApi`,
`AssetsApi`) are classes whose removal is purely a *consequence* of migrating their one remaining
live call site each — not independent work:

- `FoldersApi.createFolder` is called only from `createFolderWithFiles`, which itself is called only
  from `Files/List.tsx`'s `handleCreateFolder` (Files view). `FoldersApi.previewAppZipFiles`/
  `previewToolsetZipFiles` have zero callers already (confirmed by repo-wide grep) — their wrapping
  actions `previewAppZip`/`previewToolsetZip` are dead code, not a migration target.
- `AssetsApi.tryOutTool` is called only from `tryOutAssetTool`'s `ResourceType.APPLICATION` branch —
  confirmed the *only* remaining production reference to `assetsApi` anywhere in `apps/ai-dial-admin/src`.

Plain-file import already proves the Core-native pattern for files: `src/app/api/files/import/route.ts`
uploads via `filesCoreApi.uploadFile` directly, no BE involved. Toolset try-out-tool already proves the
Core-native pattern for MCP call-tool: `src/server/toolsets/mcp-client.ts`'s `callToolViaMcp` opens a
real MCP client session (`@modelcontextprotocol/sdk`) against Core's
`/v1/toolset/{RESOURCE_TYPE_PREFIX[TOOLSET]+encodedPath}/mcp`. Both items in this change extend an
existing, already-shipped pattern to their last unmigrated case — no new pattern is being invented for
folders/files. Applications' try-out-tool is the one place where the existing toolset pattern does
*not* transfer as a pure parameterization; see Decision 2 and the Open Question below.

## Goals / Non-Goals

**Goals:**
- Route `createFolderWithFiles` (Files view) and `tryOutAssetTool` (APPLICATION) through DIAL Core,
  matching the pattern their sibling operations already use.
- Delete `FoldersApi` and `AssetsApi` once their last call sites are migrated, removing the admin BE
  as a dependency for assets entirely.
- Preserve existing external signatures (`createFolderWithFiles(body, type?, view?)`,
  `tryOutAssetTool(body, resourceType?)`) and response shapes — this is an internal routing change,
  not a behavior or contract change for callers.

**Non-Goals:**
- Migrating `previewAppZip`/`previewToolsetZip` to Core — they have no callers and are deleted, not
  reimplemented.
- Any change to `folders-core-api`'s existing operations (`getFolders`/`getRules`/`updateRules`/
  `removeFolder`/`changeFolder`) — `folders-core.ts` is already fully Core-native and untouched here.
- Extending applications' try-out-tool to any resource type beyond what `tryOutAssetTool` already
  supports (TOOLSET, APPLICATION) — no new capability, just a routing change for the existing
  APPLICATION case.
- Application-side (Core) changes — `ApplicationMcpProxyController` already exists and is treated as a
  given; this change only touches the admin FE.

## Decisions

### Decision 1 — `createFolderWithFiles` uploads an empty file via `filesCoreApi` directly

Mirror `src/app/api/files/import/route.ts`'s pattern: call `filesCoreApi.uploadFile(token, targetPath,
emptyFile)` instead of `foldersApi.createFolder(token, body, type, view)`. `handleCreateFolder` in
`Files/List.tsx` already constructs the target path and an empty `File` via `createEmptyFile()`/
`getFormDataForImport` — the action's job narrows to taking that path and file and calling
`filesCoreApi.uploadFile` instead of posting `FormData` to the admin BE. The `type`/`view` parameters
become unused once only the Files-view call path remains real; keep the action's public signature
stable (per Goals) but its body no longer branches on them via `buildCreateFolderUrl`.

**Alternative considered**: keep `buildCreateFolderUrl`-style branching and add Core routes for the
other three types too. Rejected — those branches have no live caller today (confirmed by grep); adding
speculative support for call paths that don't exist would violate the project's no-speculative-code
convention and expand this change's blast radius for no observable benefit.

### Decision 2 — Applications' try-out-tool needs its own MCP URL builder, not a parameterized toolset one

`buildToolsetMcpUrl` builds `v1/toolset/{RESOURCE_TYPE_PREFIX[TOOLSET]+encodedPath}/mcp` — a
resource-path-addressed URL in the same family as `assetApi`'s CRUD calls. Core's application MCP route
is structurally different: `ApplicationMcpProxyController` mounts at
`^/v1/deployments/(?<id>.+?)/mcp$`, where `{id}` is documented as `deployment_name`
(`OpenApiDescriptions.DEPLOYMENT_IDENTIFIER`) — the same deployment-addressing convention this FE
already uses elsewhere for custom applications (e.g. `query-assistant-api.ts`'s
`openai/deployments/{deployment}/chat/completions`).

Add a second builder, e.g. `buildApplicationMcpUrl(host, path)`, returning
`{host}v1/deployments/{RESOURCE_TYPE_PREFIX[APPLICATION]+encodedPath}/mcp`, and branch
`tryOutAssetTool`'s APPLICATION case to call `callToolViaMcp` with that URL instead of
`assetsApi.tryOutTool`. `callToolViaMcp` itself is URL-shape-agnostic (takes a pre-built `URL`), so no
change needed there beyond accepting the new builder's output.

**Alternative considered**: extend `buildToolsetMcpUrl` to take a `resourceType` and switch its path
segment (`toolset` vs `deployments`) internally. Rejected in favor of two small named builders —
`toolset` and `deployments` aren't just different literals in the same template, the id semantics
differ enough (deployment name vs toolset resource path) that conflating them behind one
resource-type switch would obscure the distinction this design doc exists to flag. A future reader
should be able to see the deployment-scheme is different at a glance, not buried in a branch.

## Risks / Trade-offs

- **[Risk] The assumption that a custom application's full resource path (`RESOURCE_TYPE_PREFIX[APPLICATION]
  + encodedPath`) equals its Core deployment name/id is unverified against `ai-dial-core`'s
  `ApplicationService`/deployment-id resolution — it's inferred by analogy with the toolset scheme and
  the existing `openai/deployments/{deployment}/...` convention, not confirmed by reading
  `ApplicationService`'s actual id-matching logic or by a live call.**
  → Mitigation: make confirming this the first task (read `ApplicationService` in
  `ai-dial-core`, or — faster — call `POST /v1/deployments/{candidate-id}/mcp` against a running Core
  instance with a known asset application and inspect the response) before writing
  `buildApplicationMcpUrl`'s implementation. If the assumption is wrong, this decision's URL shape
  changes but the rest of the design (separate builder, `callToolViaMcp` reuse) still holds.
- **[Risk] Deleting `FoldersApi`/`AssetsApi` is only safe if the "zero other callers" grep result stays
  true through implementation** — a rebase or concurrent change could add a new caller.
  → Mitigation: re-run the grep for `foldersApi`/`assetsApi` usage immediately before deleting each
  class, as the last step of their respective tasks, not just once during design.
- **[Trade-off] `createFolderWithFiles`'s `type`/`view` parameters become effectively unused** (Files
  view is the only live caller) but are kept in the signature per the Goals' "preserve external
  signatures" constraint, rather than narrowing the signature and touching every call site's typing.
  Accepted since the caller-facing contract stability outweighs the minor unused-parameter noise, and
  the parameters remain meaningful documentation of what the action conceptually supports.

## Open Questions

- ~~Does `ApplicationService`'s deployment-id resolution in `ai-dial-core` treat a custom application's
  full bucket-relative resource path (with the `applications/` prefix) as its deployment name/id,
  identically to how `ToolSetService` resolves toolset paths?~~ **Resolved**: confirmed by reading
  `DeploymentService.findDeployment` (`ai-dial-core/server/.../service/DeploymentService.java`): it
  first tries `context.getConfig().selectDeployment(id)` (static config deployments), and on a miss
  falls through to `toResourceDescriptor(context, id)`, which calls
  `ResourceDescriptorFactory.fromAnyUrl(UrlUtil.encodePath(id), encryptionService)` — i.e. `id` is
  parsed as a full resource URL for both `APPLICATION` and `TOOL_SET` resource types alike, the exact
  same scheme `buildToolsetMcpUrl` already uses. `buildApplicationMcpUrl` can therefore build
  `v1/deployments/{RESOURCE_TYPE_PREFIX[APPLICATION]+encodedPath}/mcp` with no scheme differences from
  the toolset builder beyond the `deployments` vs `toolset` path segment.
