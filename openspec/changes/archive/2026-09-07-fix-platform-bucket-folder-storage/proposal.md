## Why

Platform-bucket applications and toolsets are flat, unversioned, and unmoveable, but three surfaces
still treat them as if they had a `public`-bucket folder location: the Properties tab tries to show a
Move-to control, the header's Folder Storage field is blank instead of naming the `platform` bucket,
and the shared Move-to popup used by public-bucket entities lists `platform` as a valid drop
destination. All three trace back to the same read-path gap — a platform-bucket resource's `folderId`
is hardcoded to `''` on every GET (see `dualBucketMetadataFields`/`flatMetadataFields` in
`server/core/asset-metadata.ts`), so nothing downstream can tell a platform-bucket asset apart from a
public-bucket one with no folder.

## What Changes

- Fix the read-path asymmetry: a platform-bucket application/toolset's `folderId` on GET SHALL be
  `'platform/'`, matching what the write path already sets on create/update, so `isPlatformBucketPath`
  can reliably distinguish the two buckets everywhere it's checked.
- `FoldersStorageLabel` (header Folder Storage field): render the `platform` bucket name for a
  platform-bucket asset, without the existing `IconExternalLink` open-in-new-tab affordance (there is
  no folder to link to).
- `ApplicationAssetProperties`/`ToolsetAssetProperties`: the existing
  `!isPublication && !isPlatformBucketPath(asset.folderId)` guard around the Move-to (`FilePath`)
  control starts working once `folderId` is correct, hiding Move-to for platform-bucket entities as
  already intended (already-specified behavior in `platform-applications`/`platform-toolsets` — this
  closes the gap, no new requirement needed).
- `FilePath`'s Move-to destination popup (used by public-bucket applications/toolsets, and shared with
  Prompts): filter the injected `AssetsFolderContext`'s shared `files` tree down to the `public` root
  before building `items`/`rootItem`, so the `platform` bucket never appears as a selectable move
  destination for a `public`-bucket entity.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform-applications`: add a requirement that a platform-bucket application's `folderId` reads
  back as `'platform/'` (not `''`), and that its header Folder Storage field shows the `platform`
  bucket name with no link — the existing "no folder-move control" requirement already covers hiding
  Move-to once `folderId` is correct.
- `platform-toolsets`: same two additions as `platform-applications`, mirrored for toolsets.

## Impact

- `apps/ai-dial-admin/src/server/core/asset-metadata.ts` — `dualBucketMetadataFields`/
  `flatMetadataFields` read path (also used by models/interceptors/routes/roles/keys via
  `flatMetadataFields`; only the dual-bucket branch changes).
- `apps/ai-dial-admin/src/components/Assets/Header/FolderStorage.tsx` — add a platform-bucket,
  no-link rendering branch.
- `apps/ai-dial-admin/src/components/Common/FilePath/FilePath.tsx` and
  `apps/ai-dial-admin/src/components/Common/FilePath/utils.ts` — filter the `platform` root out of
  the Move-to popup's `items`/`rootItem` for dual-bucket views; Prompts (non-dual-bucket) is
  unaffected since it has no `platform` root in its `files` tree to begin with.
- No `ai-dial-core` change, no server-action signature change, no admin-BE involvement.

## Non-goals

- Not adding folder/versioning support to the `platform` bucket — it stays structurally flat, per
  `platform-applications`/`platform-toolsets`.
- Not changing behavior for `public`-bucket applications/toolsets, or for any other dual-bucket-adjacent
  view (Prompts, Conversations, Files) beyond the Move-to popup's platform-root filtering, which is a
  no-op for them today.
- Not touching the six existing flat platform-only views (models, app runners, interceptors, routes,
  roles, keys) — they have no `public` counterpart and are already fully flat/unmoveable with no
  Folder Storage field.
