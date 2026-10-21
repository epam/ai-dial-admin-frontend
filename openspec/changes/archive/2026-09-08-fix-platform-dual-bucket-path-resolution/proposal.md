## Why

Platform-bucket toolsets and applications 404 (or silently no-op) on several detail-view actions —
delete (#4443), the Tools Overview tab (#4445), and toolset login/sign-in, both API-key and OAuth
(#4447) — while the same actions work fine from the list view. Both bugs trace to the platform bucket
segment getting lost or mishandled once a resource is loaded into its detail view; neither is a new
requirement, both are the implementation violating requirements the `platform-toolsets`,
`platform-applications`, and `toolset-resources-core-api` specs already state (e.g. "the system sends
a delete request against its `platform/`-prefixed path", "the sign-in/sign-out flow behaves
identically to a public-bucket toolset").

## What Changes

- **Bug A — detail-view `path` drops the `platform/` bucket segment.** `flatMetadataFields`
  (`server/core/asset-metadata.ts`), used by `mergeToolsetResource`/`mergeApplicationResource` for a
  dual-bucket platform resource, returns the bare resource name as `path` instead of
  `platform/{name}`. `folderId` already carries `'platform/'` correctly — only `path` is wrong. Every
  consumer that trusts `.path` as a complete, bucket-qualified path (matching what it already gets for
  a public-bucket resource) inherits the bug:
  - `getEntityPath`'s `AssetsApplications`/`AssetsToolsets` branch (delete, #4443 + the
    Applications equivalent — confirmed broken from the detail view, working from the list view since
    list rows are built by the unaffected `toResourceInfo`/`parseEncodedVersionedPath` path)
  - `Tools.tsx`'s asset-toolset tools fetch → `discoveredTools` (#4445)
  - `getToolsetBasicBody`'s sign-in/sign-out request body (#4447's API-key login failure)
  - Fix: `flatMetadataFields`'s `isDualBucketPlatform` branch returns
    `path: `${PLATFORM_ROOT_FOLDER}/${name}`` instead of the bare name, matching the shape
    `metadataFields` already produces for a public-bucket resource's `path`. No per-call-site patching.
- **Bug B — OAuth toolset login redirect is malformed for a platform-bucket toolset.**
  `setUrl`/`getUrl` (`components/Assets/Resources/utils.ts`) stash the post-login callback URL with a
  hardcoded trailing `&`, assuming the URN already carries a `?path=...` query string. That's true for
  a public-bucket toolset's URN but not a platform-bucket one (flat, no `?path=`), so the OAuth
  callback page appends `code=...` straight onto the bare URN, producing `.../{name}&code=...` instead
  of `.../{name}?code=...` — a 404 on redirect. Fix: choose `?` vs `&` based on whether the URN
  already contains a `?`, or build the URL through `URL`/`URLSearchParams` instead of string
  concatenation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — this fix brings the implementation into compliance with scenarios the `platform-toolsets`,
`platform-applications`, and `toolset-resources-core-api` specs already state (e.g. "Deleting a
platform toolset" / "Platform toolset sign-in and sign-out work the same as public"). No spec-level
behavior is changing.

## Impact

- `apps/ai-dial-admin/src/server/core/asset-metadata.ts` — `flatMetadataFields` path fix; ripples
  through `mergeToolsetResource` and `mergeApplicationResource`.
- `apps/ai-dial-admin/src/components/Assets/Resources/utils.ts` — `setUrl` separator fix.
- No API surface, route, or component signature changes.
- Existing tests asserting the current (buggy) bare-name `path` for a platform-bucket resource in
  `asset-metadata.spec.ts` need updating; new tests cover the OAuth redirect separator logic.
