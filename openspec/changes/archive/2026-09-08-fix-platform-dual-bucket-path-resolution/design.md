## Context

Two independent bugs surface only for platform-bucket (`platform/`) toolsets/applications, never for
public-bucket ones, because both stem from code that was written when only the public bucket existed
and never accounted for the platform bucket's different URN/path shape.

**Bug A.** `mergeToolsetResource`/`mergeApplicationResource` (`asset-metadata.ts`) route a
platform-bucket resource through `dualBucketMetadataFields` → `flatMetadataFields`, which returns
`path` as the bare resource name (`parseEncodedFlatPath`'s output) while separately forcing
`folderId: 'platform/'`. For a public-bucket resource, the sibling `metadataFields` branch returns
`path` already folder+version-qualified (e.g. `public/my-toolset__1.0`) — a complete path. This
breaks the one consumer that genuinely needs a complete, `{bucket}/{name}`-qualified path:
`getEntityPath`'s `AssetsApplications`/`AssetsToolsets` branch (`open-in-new-tab.ts:59-64`), used for
delete. Confirmed against `ai-dial-core`: delete goes through `AssetApi`/`ConfigResourceController`'s
CRUD routes (`/v1/toolsets/{bucket}/{path}`), which parse a resource path the same way
`ResourceDescriptorFactory.fromAnyUrl` does for the public bucket — a bare name resolves to no bucket
at all.

List rows are unaffected: `BaseAssetList`'s rows come from `toResourceInfo`
(`asset-metadata.ts:75-93`), which always uses `parseEncodedVersionedPath` regardless of bucket — it
has no flat/dual-bucket branch and so never drops the bucket segment. This is exactly why the user
observed delete working from the list but not from the detail view.

**Bug A amendment — two different addressing conventions, not one.** The first pass at this fix
assumed every consumer of a platform-bucket resource's `.path` wants the same complete,
`platform/{name}`-qualified shape `getEntityPath`/delete needs, and updated `Tools.tsx` → `discoveredTools`
and `getToolsetBasicBody` to send `toolsets/platform/{name}`. That produced a *different* Core error —
"Forbidden deployment", not "Unknown deployment" — which traced to a second, distinct mechanism:
`ToolSetToolsController`'s `/v1/toolset/{id}/tools` (discovered-tools) and
`ResourceCredentialsController`'s sign-in/sign-out both resolve `{id}` via
`DeploymentService.findDeployment`, which tries `context.getConfig().selectDeployment(id)` — the
merged **config store**, keyed by bare name — *before* ever falling back to
`ResourceDescriptorFactory.fromAnyUrl`'s resource-path parse (confirmed by `ToolSetController.
mergeToolsets`'s `config.getToolsets()` lookup, also by bare name). Platform-bucket toolsets and
applications are config-managed, so they're registered there by bare name; a public-bucket toolset is
never in the config store, so `findDeployment` always falls through to the resource-path parse for it.

So there are two addressing conventions, not one:

| Consumer | Resolution path | Platform-bucket id needed |
|---|---|---|
| `getEntityPath` → delete (`AssetApi`/`ConfigResourceController`) | Resource-path CRUD route | `platform/{name}` (this is what Bug A's `flatMetadataFields` fix produces) |
| `ToolSetToolsController` (discovered-tools) / `ResourceCredentialsController` (sign-in/out) via `DeploymentService.findDeployment` | Config-store lookup by bare name, first | bare `{name}` — **no** `platform/` segment, **no** resource-type prefix |

`ToolsetOpsApi.discoveredTools` and `getToolsetBasicBody` — the two call sites feeding the
config-store-resolved routes — must therefore strip `.path`'s `platform/` segment back off (and skip
the `toolsets/`/`applications/` prefix entirely) for a platform-bucket resource, rather than trusting
`.path` verbatim the way `getEntityPath` correctly does. Both now branch on
`isPlatformBucketPath(path)` to choose bare name vs. prefixed path.

**Bug B.** `setUrl`/`getUrl` (`components/Assets/Resources/utils.ts:71-76`) stash the OAuth callback
target URL with a hardcoded trailing `&`, so `AuthPage.tsx:18`'s `` `${url}code=${oAuthCode}` `` lands
on a valid `?...&code=...` URL — but only because a public-bucket toolset's URN
(`getEntityPath`'s non-platform branch) already contains `?path=...`. A platform-bucket toolset's URN
(`getEntityPath`'s platform branch, `forRemove=false`) is a bare encoded name with no query string at
all (by design — flat platform entities need no `?path=`), so the stored value becomes
`/assets-toolsets/{name}&`, and appending `code=...` produces the malformed
`/assets-toolsets/{name}&code=...` from issue #4447.

The sibling legacy module `components/Toolsets/Auth/utils.ts` already has a workaround for an
analogous case: its own `setUrl` branches on `view === ApplicationRoute.Toolsets` (whose URN also has
no query) to use `?` instead of `&`. It shares the same `toolset-auth-redirect-url` localStorage key
with `Assets/Resources/utils.ts`'s `setUrl`/`getUrl` (both modules read/write the same key, which is
how `AuthPage.tsx` — wired to the legacy module — still works for the Assets flow today), but the
Assets module's own `setUrl` never got the equivalent branch for the platform bucket.

## Goals / Non-Goals

**Goals:**

- Fix `flatMetadataFields` so a platform-bucket resource's `path` is a complete, bucket-qualified path
  — the single point where the value is wrong — rather than patching each of the three call sites that
  currently compensate (or fail to).
- Fix `setUrl` in `Assets/Resources/utils.ts` to choose the correct separator regardless of whether
  the target URN already carries a query string, covering both bucket cases without depending on the
  caller's `view`.
- Cover both Applications and Toolsets, since Bug A is in code shared by both (`flatMetadataFields`),
  and the user confirmed the Applications delete-from-details case is also broken.

**Non-Goals:**

- Touching `components/Toolsets/Auth/utils.ts` (the legacy, non-asset Toolsets flow) — it has no
  platform-bucket concept and its existing `?`/`&` branch is already correct for the two URN shapes it
  handles.
- Unifying the two parallel `setUrl`/`getUrl` implementations into one shared module — they already
  coexist via a shared storage key, and de-duplicating them is a separate refactor, not needed to fix
  either reported bug.
- Any change to `ai-dial-core` — verified its routing/resolution (`ResourceDescriptorFactory`,
  `DeploymentService.findDeployment`, the `/v1/toolsets/{bucket}/{path}` and
  `/v1/applications/{bucket}/{path}` write routes) already expects exactly the
  `{resourceType}/platform/{name}` shape this fix produces; nothing there needs to change.

## Decisions

### Fix `flatMetadataFields`'s `path`, not each of its three broken consumers

Two shapes were considered:

- **A — fix the merge source** (chosen): change `flatMetadataFields`'s `isDualBucketPlatform` branch
  to return `path: `${PLATFORM_ROOT_FOLDER}/${name}`` instead of the bare name.
- **B — fix each consumer**: teach `getEntityPath`, `Tools.tsx`, and `getToolsetBasicBody` to
  recompute a bucket-qualified path from `folderId`+`name` themselves, the way the write-side
  `createToolset`/`updateToolset`/`updateApp` already do (per the earlier `fix-platform-toolset-update-path`
  change).

A is chosen because the bug is that `path` itself carries wrong information, not that three unrelated
call sites each independently need to work around it — matching this repo's comment-density guidance
of stating a fact once at its source of truth rather than at every place that consumes it. It also
means any *future* consumer of a platform-bucket resource's `.path` gets the correct value for free,
rather than inheriting the same bug a fourth time.

B was rejected: it would leave `.path` itself still wrong (misleading for any code that reads it
directly, e.g. debugging, logging, a future feature), and requires three separate, easy-to-miss edits
for one underlying fact.

**Consequence:** `asset-metadata.spec.ts`'s two existing tests asserting a bare-name `path` for a
platform-bucket resource (`mergeApplicationResource`/`mergeToolsetResource`, lines ~47-60 and ~78-91)
assert exactly the buggy value and must be updated to expect `platform/{name}`.

### Fix `setUrl` by checking for an existing `?`, not by branching on bucket or view

Considered mirroring the legacy module's `view === ApplicationRoute.Toolsets` branch inside
`Assets/Resources/utils.ts`'s `setUrl` — but that file is shared by both `AssetsApplications` and
`AssetsToolsets`, each with a public bucket (URN has `?path=`) and a platform bucket (URN doesn't), so
a view-keyed branch would need to also know the bucket, duplicating logic `getEntityPath` already
encodes in the URN itself. Instead, `setUrl` inspects the URN it already computed
(`getUrnForEntity(...).includes('?')`) and appends `&` or `?` accordingly — one branch, no bucket- or
view-specific knowledge duplicated into the auth module.

## Risks / Trade-offs

- **[Risk] A caller other than the three identified for Bug A relies on the current bare-name
  `path` for a platform-bucket toolset/application.** → Mitigation: grep every read of `.path` on a
  toolset/application entity in components under `Assets/` before implementing, matching the
  `fix-platform-toolset-update-path` change's task 1.1 precedent.
- **[Risk] Bug B's fix changes the stored URL shape for the public bucket too, if the `?` check is
  wrong.** → Mitigation: the public-bucket URN already contains `?path=`, so `.includes('?')` is
  `true` and the `&` branch is taken unchanged — verified against `getEntityPath`'s non-platform
  `AssetsToolsets` branch.
