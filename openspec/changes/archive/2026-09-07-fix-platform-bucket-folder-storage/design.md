## Context

Applications and toolsets are dual-bucket: DIAL Core stores them under both a flat `platform/` bucket
and the hierarchical, versioned `public/` bucket (`DUAL_BUCKET_VIEWS` in `utils/files/root-folder.ts`).
Three surfaces need to treat the two buckets differently but currently can't, all because of one shared
gap: a platform-bucket resource's `folderId` comes back as `''` on every GET.

- **Write path** (`createPlatformApplication`/`updatePlatformApplication` and the toolset equivalents)
  already sets `folderId: 'platform/'` explicitly.
- **Read path** (`dualBucketMetadataFields` in `server/core/asset-metadata.ts`) folds the `platform`
  segment into the *prefix* it strips before calling `flatMetadataFields`, so the remainder handed to
  `flatMetadataFields` never contains `platform/` and `folderId` always comes back `''`.

Both `ApplicationAssetProperties` and `ToolsetAssetProperties` already guard their Move-to control with
`!isPlatformBucketPath(asset.folderId)` — that guard is dead code today because `folderId` never carries
the `platform/` prefix it's checking for. `FoldersStorageLabel` gates the whole Folder Storage field on
`asset.folderId &&`, so a platform asset's `''` folderId hides the field entirely instead of showing
`platform`. And `FilePath`'s Move-to popup reads its `items`/`rootItem` straight from the shared
`AssetsFolderContext`'s `files` array, which holds both the `platform` and `public` root nodes for
dual-bucket views (`AppsFolderProvider`/`ToolsetsFolderProvider` are singletons mounted once in
`app/[lang]/layout.tsx`, shared between the grid and every entity's Move-to control) — nothing filters
that array down to just `public` before it reaches the popup.

## Goals / Non-Goals

**Goals:**
- Make a platform-bucket application/toolset's `folderId` read back as `'platform/'`, so
  `isPlatformBucketPath` gives a correct answer wherever it's already checked.
- Show `platform` (no link) in the header Folder Storage field for platform-bucket assets.
- Stop the Move-to popup from offering `platform` as a destination for public-bucket
  applications/toolsets.

**Non-Goals:**
- No folder or versioning support for the `platform` bucket.
- No change to `public`-bucket read/write behavior, or to any other consumer of
  `flatMetadataFields`/`AssetsFolderContext` (models, app runners, interceptors, routes, roles, keys,
  Prompts, Conversations, Files).

## Decisions

**D1 — Fix `folderId` at the merge layer, not by threading a new flag.**
`dualBucketMetadataFields` already knows which bucket a resource is in (it branches on
`isPlatformBucketPath(remainder)` to pick `flatMetadataFields` vs `metadataFields`). Keep folding
`platform/` into the prefix passed to `flatMetadataFields` (that's still required for `name` to parse
correctly — `parseEncodedFlatPath` treats its whole remainder as `name` with no `/` splitting), but
override the `folderId` field it returns: `flatMetadataFields`'s underlying `parseEncodedFlatPath`
hardcodes `folderId: ''` unconditionally (flat resources have no folder concept), so the platform
branch spreads that result and sets `folderId: 'platform/'` explicitly. This fixes the read path at
its one source of truth — every downstream consumer (`isPlatformBucketPath` checks in
`ApplicationAssetProperties`, `ToolsetAssetProperties`, `FoldersStorageLabel`) starts working with no
changes of its own, instead of adding a second, parallel way to detect "is this platform" that could
drift from the first.
*Alternative considered*: have each consuming component independently detect "platform" from
`asset.path` or `asset.id` instead of `folderId`. Rejected — `folderId` is the field
`isPlatformBucketPath` already targets everywhere else; fixing it once keeps that single existing
convention intact rather than introducing a second one.

**D2 — `FoldersStorageLabel` gets an explicit platform branch, not a generic "no link" prop.**
Add an `isPlatformBucketPath(asset.folderId)` check inside `FoldersStorageLabel` that renders the
literal `platform` bucket name with no `IconExternalLink` postfix, alongside the existing
folder-path-and-link rendering. Keep the existing `asset.folderId &&` gate for the no-folder case (a
public-bucket asset with a genuinely empty `folderId`, if that occurs) — the new branch takes priority
over it, since a fixed `folderId` of `'platform/'` is now truthy anyway.
*Alternative considered*: pass an `isPlatformBucket` boolean prop down from each caller instead of
checking `folderId` inside the component. Rejected — every current caller already has `asset` in scope
and no caller currently needs to override the derivation, so a prop would be pure duplication of what
`isPlatformBucketPath(asset.folderId)` already tells the component directly.

**D3 — Filter the Move-to popup's source tree at the `FilePath` call site, not inside the shared
context.**
`AssetsFolderContext`'s `files` array is intentionally shared (grid + Move-to both need the same fetched
tree) and intentionally holds both roots for dual-bucket views — that's correct for the grid. The fix
belongs where the tree is *consumed for the popup*: in `FilePath.tsx`, drop the `platform` root node
before computing `items`/`rootItem`, scoped to `DUAL_BUCKET_VIEWS` so Prompts/Files/Conversations (which
never have a `platform` root in their `files` array to begin with) are structurally unaffected even
without an explicit view check. This also resolves the secondary `rootItem={files?.[0]}` observation
from explore mode for free: once `platform` is filtered out, `files[0]` is the `public` root, which is
what `rootItem` should be for a Move-to popup that only ever offers `public` destinations.
*Alternative considered*: give `AppsFolderProvider`/`ToolsetsFolderProvider` a second, filtered `files`
selector and have `FilePath` request that instead. Rejected — no other consumer needs a
platform-filtered view of `files`, so adding one to the shared context is speculative surface area for
a need that exists at exactly one call site.

## Risks / Trade-offs

- **[Risk]** Fixing `folderId` centrally in `dualBucketMetadataFields` affects every place that reads a
  platform-bucket application/toolset's `folderId`, not just the three surfaces in scope — a caller
  relying on the old (incorrect) `''` value would silently change behavior.
  → **Mitigation**: grep every read of `.folderId` on `DialApplicationResource`/`DialToolsetResource`
  before landing the fix (tasks.md will enumerate them) and confirm each either already expects
  `'platform/'` (the create/update write path does) or is one of the three surfaces this change
  targets.
  → **Materialized (inverse case)**: the initial audit (tasks.md 1.2) missed that
  `Modals.tsx`/`BaseAssetList.tsx` had a `platformAsset.path || platformAsset.folderId` fallback that
  predated this fix (needed back when `folderId` was always `''`). Once landed, `folderId` became the
  correct signal but the stale `.path ||` fallback still won the `||` and was never the correct one —
  this shipped as Issue #4420 (wrong duplicate modal for a platform-bucket row) and was fixed in
  `Modals.tsx` by dropping the fallback. The equivalent read in `BaseAssetList.tsx`'s `handleDuplicate`
  carried the same bug and was fixed the same way; its two bucket-branch spec files' fixtures were
  updated from a stale `folderId: undefined` to `folderId: 'platform/'` to match.
- **[Risk]** Scoping the `FilePath` fix to `DUAL_BUCKET_VIEWS` only, rather than "always drop a
  `platform`-named root if present," could miss a future view that legitimately has both a `platform`
  and `public` root added without updating `DUAL_BUCKET_VIEWS`.
  → **Mitigation**: `DUAL_BUCKET_VIEWS` is already the single explicit source of truth this exact
  scenario is designed around (see its own doc comment: "a third dual-bucket entity is a one-line
  addition here and nowhere else") — a new dual-bucket view registers there, and `FilePath`'s filter
  keys off the same list, so the two can't drift independently.

## Open Questions

None — all three fixes are localized to the files listed in the proposal's Impact section, with no
external dependency or backend change involved.
