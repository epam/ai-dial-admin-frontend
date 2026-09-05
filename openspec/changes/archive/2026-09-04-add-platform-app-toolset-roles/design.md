## Context

`Assets > Applications` and `Assets > Toolsets` are the only two Core-direct asset surfaces left that
still serve **both** buckets (`public` and `platform`) through one route and one `[id]/page.tsx`,
distinguished by a `?path=` query param (present → public, absent → platform). Every other flat
platform entity (Models, App Runners, Interceptors, Routes, Roles, Keys) was split into its own
dedicated `platform-*` route, and the in-progress `remove-platform-entity-path-param` change's own
Non-goals confirm this dual-bucket sharing for Applications/Toolsets is permanent, not transitional:
*"No change to versioned asset entities (`AssetsApplications`, `AssetsToolsets`, ...) — their
`name ≠ path`, so `?path=` remains required."* Any fix here has to work within that shared-route
shape rather than assume a future split will remove it.

Concretely, both buckets' Views reuse the same tab-list builder and the same `TabsContent`:

```
assets-applications/[id]/page.tsx  (?path= present/absent selects the branch below)
        │
        ├─ AppView.tsx  ─────────────┐
        └─ PlatformApplicationView.tsx ─┤→ Applications/View/TabsContent.tsx
                                        view = ApplicationRoute.AssetsApplications
                                        tabs = getTabsForAsset(t, AssetsApplications)

assets-toolsets/[id]/page.tsx
        │
        ├─ ToolsetView.tsx  ─────────┐
        └─ PlatformToolsetView.tsx ──┤→ Assets/Toolsets/View/TabsContent.tsx
                                     tabs = getTabsForAsset(t, AssetsToolsets, featureFlags)
```

`getTabsForAsset`'s `AssetsApplications`/`AssetsToolsets` branches carry no `Roles` entry today —
confirmed by Issue #4406 — while `PlatformModels`/`AssetsRoutes` (now `platform-models`/
`platform-routes`) already have one, added by the archived `add-assets-roles` change. That change
also left the reusable pieces this one needs: `EntityView/Roles/AssetRoles.tsx` (generic membership
editor over `{ userRoles?: string[] }`) and the `readConfigEntities<DialRole>(...,
ConfigFileEntityType.Roles)` role-population read.

Core's `Application`/`ToolSet` classes both extend `RoleBasedEntity` and accept `userRoles` in both
buckets — there is no backend gap, only a missing client-side field and tab.

## Goals / Non-Goals

**Goals:**

- Add a Roles tab to the **platform-bucket** detail views only, editing `userRoles`, reusing
  `AssetRoles` and the `readConfigEntities` role population exactly as `platform-models`/
  `platform-routes` already do.
- Leave the public-bucket `AppView.tsx`/`ToolsetView.tsx` and their props completely untouched.
- Leave `getTabsForAsset`'s `AssetsApplications`/`AssetsToolsets` branches — shared by both
  buckets — untouched, so the public bucket's tab list is unaffected without needing a new
  bucket-aware parameter threaded through a widely-called shared function.

**Non-Goals:**

- No Roles tab on the public-bucket views (see proposal's Non-goals).
- No per-role limits editing (`roleLimits`) — Core's `Application`/`ToolSet` classes have no such
  field; membership only, matching every other asset Roles tab's documented scope boundary
  (`AssetRoles`'s own doc comment).
- No route split for `assets-applications`/`assets-toolsets` — out of scope, and contradicted by
  `remove-platform-entity-path-param`'s own Non-goals.

## Decisions

### D1: Insert the Roles tab locally in the platform View components, not in `getTabsForAsset`

`getTabsForAsset(t, ApplicationRoute.AssetsApplications | AssetsToolsets, ...)` is called by all four
Views (`AppView`, `PlatformApplicationView`, `ToolsetView`, `PlatformToolsetView`). Adding `rolesTab(t)`
inside that function would put it on all four, which is exactly the scope this change excludes.

Instead, `PlatformApplicationView.tsx` and `PlatformToolsetView.tsx` each call `getTabsForAsset(...)`
as they do today and locally splice `rolesTab(t)` into the result before calling `setTabs`/passing it
to the header — the same shape `PlatformApplicationView`/`AppView` already use to conditionally splice
in `toolsTab(t)` when an application is MCP-configured. This is an established idiom in these exact
files for "this tab exists only under a condition the shared tab list doesn't encode," so it needs no
new concept, and `getTabsForAsset`'s signature and its other seven call sites are untouched.

Insertion point: `Applications` gets `Roles` immediately before `Interceptors` (matching
`PlatformModels`' `[Properties, Features, Roles, Interceptors]` ordering); `Toolsets` gets `Roles`
immediately after `Tools` and before the conditional `Audit` tab (matching the admin-BE `Toolsets`
entity's own `[Properties, Tools, Roles, Audit]` ordering). Both insertions are positional
(`toSpliced` by index or by finding the neighboring tab's `id`), not appended at the end, so the tab
order stays consistent with its nearest existing precedent rather than looking bolted-on.

**Alternative considered**: add an `isPlatformBucket` boolean parameter to `getTabsForAsset` and
branch on it inside the two shared cases. Rejected — it forces every other call site (and there are
several unrelated ones, e.g. `Conversations`, `PlatformModels`, `Skills`) to reason about a parameter
that means nothing to them, for a distinction only two of the eight branches need.

### D2: the field is `user_roles`, not `userRoles` — `Application`/`ToolSet` are snake_case on the wire, unlike `Model`/`Route`

Verified against `ai-dial-core`: `RoleBasedEntity.java` declares
`@JsonAlias({"userRoles", "user_roles", "dial:userRoles"}) private Set<String> userRoles;`. A
`@JsonAlias` only widens what a **write** accepts — it has no effect on what a **read** returns. The
serialized name a `GET`/round-tripped `PUT` response actually uses is governed by the containing
class's own `@JsonNaming`, and `Application.java`/`ToolSet.java` are both
`@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)` — confirmed by `DialResource`
(their shared base in this app) already carrying `display_name`, `description_keywords`,
`max_retry_attempts`, `forward_auth_token`, `created_at`, `updated_at`, and an existing comment
elsewhere in this codebase noting "*Asset applications carry snake_case `viewer_url`/`editor_url`;
other views use camelCase*." `Route.java`/`Model` carry no such annotation, which is why
`DialRouteResource`/`DialModelResource` are genuinely plain camelCase (`userRoles` is correct there)
— that precedent does not transfer to `Application`/`ToolSet`. Writing `userRoles` here would be
silently *accepted* by Core on save (the alias covers it) but read back as `user_roles` — a real
round-trip bug where a just-saved selection appears to vanish on reload.

`DialApplicationResource`/`DialToolsetResource` therefore gain `user_roles?: string[]` (not
`userRoles`), each documented with the `@JsonNaming`/`@JsonAlias` finding above so the divergence
from `DialRouteResource`/`DialModelResource` isn't rediscovered later. This still reaches
`DialPlatformApplicationResource`/`DialPlatformToolsetResource` automatically via their existing
`Omit<..., 'path' | 'folderId' | ...>` derivation, which does not exclude the new field.

### D2a: `AssetRoles` stays generic over `userRoles`; the two snake_case surfaces adapt at the boundary

`AssetRoles<T extends { userRoles?: string[] }>` is correct as-is for its two existing consumers
(`Model`/`Route`, genuinely camelCase) — widening it to know about a second field-name convention
would leak this one pair of resources' wire quirk into a component three other call sites already
use correctly. Instead, each new `TabsContent`'s `Roles` case builds a small view object —
`{ ...resource, userRoles: resource.user_roles }` — to satisfy `AssetRoles`'s prop type, and a local
`onChangeAssetRoles` adapter translates back: it reads only `updated.userRoles` off `AssetRoles`'s
callback and rebuilds the write value from the current resource plus `user_roles`, rather than
spreading `AssetRoles`'s own output (which would carry both keys — the stray camelCase `userRoles`
would still be present, and the platform-bucket write path deserializes strictly, so a leaked unknown
property is a rejected save, not a no-op). This is the same "small local casing adapter" shape
`ApplicationEndpoint.tsx`'s `isAssetApplication ? 'editor_url' : 'editorUrl'` branch already uses
elsewhere in this codebase for the identical Application/ToolSet snake_case quirk.

### D3: `TabsContent`'s `Roles` case renders `AssetRoles` for the asset shape, `EntityRoles` unchanged for the admin-BE shape

`Applications/View/TabsContent.tsx` already branches Properties/Features on
`view === ApplicationRoute.AssetsApplications` to select the asset-specific component
(`ApplicationAssetProperties`/`ResourceFeatures`) over the admin-BE one. The `Roles` case gets the
same branch: `AssetRoles` (via the D2a view-object/`onChangeAssetRoles` adapter) when
`view === AssetsApplications`, else the existing `EntityRoles` call unchanged — preserving the
admin-BE `Applications` route's current `roleLimits`-based behavior exactly.

This branch is reachable for both buckets structurally (the `view` prop is `AssetsApplications` for
both), but D1 means only `PlatformApplicationView`'s tab list ever includes `EntityViewTab.Roles`, so
`activeTab` can only equal `Roles` when the platform-bucket View rendered `TabsContent` — the public
bucket's `AppView` never offers a way to select that tab. No bucket flag needs to reach `TabsContent`
for the scope boundary to hold.

`Assets/Toolsets/View/TabsContent.tsx` has no existing `Roles` case and no admin-BE variant to
preserve (it is asset-only, used by both toolset buckets already) — its new case renders `AssetRoles`
unconditionally, cast to `DialToolsetResource` the same way its existing `Properties`/`Tools` cases
already cast `selectedToolset`.

### D4: Role population comes from `readConfigEntities`, fetched in the existing shared `page.tsx`, passed only to the platform View

`assets-applications/[id]/page.tsx` already runs an unconditional `Promise.all` for `interceptors`/
`globalInterceptors` regardless of which bucket the request resolves to, then passes those props to
whichever View renders. The roles read (`readConfigEntities<DialRole>(token,
ConfigFileEntityType.Roles, optionWarnings)`) joins that same `Promise.all`, following the identical
pattern `platform-models/[id]/page.tsx` already uses. The resulting `roles` prop is passed to
`PlatformApplicationView` only — `AppView`'s props are untouched, so its component and tests need no
change.

`assets-toolsets/[id]/page.tsx` has no such read today (Toolsets' Tools/Properties tabs need no
Core-config-file population). It gains the same `readConfigEntities` call plus an `optionWarnings`
array, mirroring the Applications page, with the `roles` prop passed only to `PlatformToolsetView`.

**Alternative considered**: gate the fetch itself behind `isPlatformBucket` to avoid an unnecessary
Core read on public-bucket page loads. Rejected for `assets-applications` to stay consistent with the
interceptors read already done unconditionally there; for `assets-toolsets`, gating would be the only
inconsistency between the two pages for the same reason, so both fetch unconditionally and only wire
the prop into the platform branch.

## Risks / Trade-offs

- **`TabsContent`'s `Roles` case is reachable in principle for the public bucket, relying on the tab
  list to gate it (D3)** → acceptable: it is the same reachability shape the existing `Properties`/
  `Features` branches in the same file already have, and a future change deliberately adding Roles to
  the public bucket would get the *correct* (`AssetRoles`, not `roleLimits`) component for free rather
  than needing to redo this decision.
- **Fetching the role population unconditionally on every `assets-toolsets` detail page load, even for
  the public bucket where it's unused (D4)** → acceptable: matches the existing unconditional
  interceptors read on the sibling Applications page, and Core's config-entities read is already
  proven cheap enough there.
- **`getTabsForAsset`'s branches for `AssetsApplications`/`AssetsToolsets` and this change's local
  splice can drift** if a future change edits the base tab list without checking the platform Views'
  splice logic → mitigated by keeping the splice adjacent to the existing `toolsTab` splice in the
  same `useEffect`/`useMemo`, so both conditional insertions are visible together at the same call
  site.

## Open Questions

None outstanding — the dual-bucket architecture this change works within is confirmed permanent by
`remove-platform-entity-path-param`'s own Non-goals, and the reusable pieces (`AssetRoles`,
`readConfigEntities`) are already proven by the archived `add-assets-roles` change.
