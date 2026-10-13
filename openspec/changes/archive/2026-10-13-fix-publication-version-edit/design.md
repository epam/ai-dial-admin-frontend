## Context

A versioned resource's identity is its path `…/{name}__{version}`; merged Core reads expose it as
`_metadata.{name,version,path}` and no flat `version`. For a pending publication, Core's
`updatePublication` takes the client's `targetUrl`, derives `reviewUrl = {type}/{reviewBucket}/{suffix}`,
and — when `sourceUrl` matches an existing resource but `reviewUrl` differs — calls `moveResource`
(application and toolset moves are supported). It also rejects a `targetUrl` that already exists for ADD.

Today the edit flow splits across three places that disagree: the control (`_metadata.version`, in the
working tree), `buildUpdatePlan` (flat `asset.version`), and `updateAsset` (PUTs to the old `_metadata.path`).

## Goals / Non-Goals

**Goals:** a version edit on a pending Application/Toolset publication round-trips: shown correctly, sent in `targetUrl`, content written to the moved review copy.
**Non-Goals:** name edits, new-target-exists UX, Core changes.

## Decisions

1. **`_metadata` is the single source of truth for version.** The control writes `_metadata.version` (plus `display_version`, as today). `buildUpdatePlan` reads `asset._metadata?.version ?? asset.version`.
   *Alternative:* also write flat `version` as a shim — rejected; it keeps the dual state that caused the bug.
2. **Rewrite the review path inside `buildUpdatePlan`**, not in `api.ts`. For versioned types it returns the asset with `_metadata.path` replaced by the old path's last segment swapped to `{name}__{version}`. `updateAsset` keeps reading `_metadata.path`, so `api.ts` is untouched.
   *Alternative:* compute the review path from the Core response — rejected; the update response does not return resource URLs and an extra read is unnecessary since only the last segment changes.
3. **Order stays: Core update first, then content PUT.** The move happens during the update call, so the PUT to the new path hits the moved copy.
4. **Remove path fabrication in `*Details`.** They pass the edited resource straight into the publication; `updatePathWithNameAndVersion` is deleted if no caller remains.

## Risks / Trade-offs

- [Move fails or the app is active (409)] → Core's error propagates through `updatePublication` before any PUT; nothing is written.
- [Content PUT fails after a successful move] → review copy sits at the new path with old content; the publication still points to it, and a retry rewrites it. Same failure window as today.
- [Shared `Properties` components] → only the `isPublication` branch changes; non-publication views keep current behavior.
