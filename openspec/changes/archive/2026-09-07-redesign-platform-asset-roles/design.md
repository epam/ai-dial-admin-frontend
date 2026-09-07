## Context

`AssetRoles` (`src/components/EntityView/Roles/AssetRoles.tsx`) is the Roles tab for every
platform-bucket asset that extends Core's `RoleBasedEntity` — Models, Routes, and the
platform-bucket detail views of Applications and Toolsets. It was built earlier and separately from
`EntityRoles`/`RolesGrid`, the Roles tab config entities (admin-BE-backed Models/Applications/etc.)
use. The two have diverged: `AssetRoles` has no counter, no availability toggle, uses
`DialNeutralButton` for Add, and shows the "not available" message as the grid's empty state rather
than a dedicated notification. `AssetRoles` also treats `userRoles` as membership-only (no per-role
token limits), operating on a plain `string[]` rather than `RolesGrid`'s `roleLimits` record — so it
cannot simply be swapped for `RolesGrid`; its internals need to be rebuilt to match the *layout and
interaction* pattern while keeping the array-shaped data model that Core's `RoleBasedEntity` (Model,
Route) and the snake_case `user_roles` field (Application, ToolSet) already define.

Availability itself has been under-specified: nothing distinguishes "no one has looked at this
entity's roles yet" from "this entity was deliberately made available to everyone," because both
read as `userRoles: undefined`. A freshly created entity defaults to available-to-everyone by
omission, which is the wrong default for a moment where an admin hasn't yet decided who should see
it.

`AssetRoles` is consumed by four call sites, each already adapting its own field name/casing to the
`userRoles` prop the component expects: `Assets/Platform/Models/TabsContent.tsx`,
`Assets/Platform/Routes/TabsContent.tsx` (both plain `userRoles`), and
`Applications/View/TabsContent.tsx`, `Assets/Toolsets/View/TabsContent.tsx` (both adapting
`user_roles` at the boundary via an `onChangeAssetRoles` wrapper). None of these adapters need to
change — only `AssetRoles`'s internals and its rendering contract.

## Goals / Non-Goals

**Goals:**

- Bring `AssetRoles`'s layout and interaction pattern in line with `RolesGrid`: counter, toggle,
  button style, empty-state copy, bottom notification.
- Define one unambiguous three-state meaning for `userRoles`/`user_roles`
  (`[]` / `['role', ...]` / `undefined | null`) and apply it consistently to the new toggle, the new
  notification, and the fixed `getNoAvailableTitle`.
- Default every newly created platform-bucket Model, Route, Application, and Toolset to an explicit
  empty roles array at creation time, so "not yet decided" reads as "not available" rather than
  "available to everyone."

**Non-Goals:**

- Reworking `EntityRoles`/`RolesGrid`, `roleLimits`, or `isPublic` — config-entity Roles tabs are
  untouched.
- Adding per-role token limits to platform entities — `AssetRoles` remains membership-only.
- Touching `PlatformAppRunners`, `PlatformInterceptors`, `PlatformRoles`, `PlatformKeys` — their Core
  classes don't extend `RoleBasedEntity`, so there is no `userRoles` field and no Roles tab there.
- A save-time "empty roles" confirmation modal — the new bottom notification communicates the state
  without blocking save.

## Decisions

### Toggle binds to array-vs-undefined, not to a `isPublic`-style boolean field

`RolesGrid`'s toggle reads/writes a real `isPublic` boolean field. `RoleBasedEntity` has no
equivalent boolean — only the array. So the new "Make available to specific roles" `DialSwitch`
derives its checked state from `Array.isArray(userRoles)` and writes through the same three-state
rule on toggle:

- **Toggling ON** (was `undefined`/`null`, i.e. available to all) sets `userRoles: []`. This is a
  deliberate narrowing: flipping the switch on is "I want to restrict this," and the natural start of
  a restriction is zero roles, with the Add-role grid immediately available to build the list up.
- **Toggling OFF** (was an array, populated or not) sets `userRoles: undefined` — not `null`. Reason:
  `PlatformModels/TabsContent.tsx` and its sibling call sites build their PUT payload directly from
  `selectedModel`/`selectedX` without merging over a stale previous value, so an `undefined` field is
  simply absent from the JSON body Core receives, which is what "go back to the default" must mean.
  Writing `null` would instead send an explicit `null`, which is a different wire signal (and,
  depending on Core's deserializer, may not be treated the same as "field absent").

Alternative considered: model availability as a separate boolean prop (`isAvailableToAll`) alongside
`userRoles`, mirroring `RolesGrid` exactly. Rejected — it would require a new field on four resource
interfaces and matching Core-side support, when the array alone already carries every bit of
information needed; introducing a parallel boolean risks the two disagreeing.

### `getNoAvailableTitle` gets an explicit `AssetsApplications` branch

Today `getNoAvailableTitle` has no branch for `ApplicationRoute.AssetsApplications` and falls
through to the ToolSet wording. This must be fixed as part of this change since the redesigned
bottom notification depends on this function to pick user-facing copy per view — leaving the gap
would ship the redesign with wrong wording for platform-bucket Applications. Fix: add
`if (view === ApplicationRoute.AssetsApplications) return RolesI18nKey.NotAvailableApplication;`
alongside the existing `AssetsToolsets` fallback.

### New availability predicate lives beside, not inside, `isDisableRole`

`isDisableRole` (`!Object.keys(entity.roleLimits || {}).length && !entity.isPublic`) is config-entity
-specific — it reads `roleLimits`/`isPublic`, fields `AssetRoles`'s array-shaped entities don't have.
Rather than overload that function with a second code path, add a sibling predicate in the same
`utils.ts` (e.g. `isAssetUnavailable(userRoles: string[] | null | undefined) => Array.isArray(userRoles) && userRoles.length === 0`)
that encodes the three-state rule once, and use it both for the bottom notification's visibility and
anywhere else the redesigned `AssetRoles` needs to ask "is this available to no one right now."

### Create-time default is set once, in `CreateEntity.tsx`'s initializer, not per-call-site

`CreateEntity.tsx` already branches its `useState<T>` initializer per route
(`isAssetWithVersion`, `ApplicationRoute.PlatformModels`, fallback), and `isPlatformDualBucketCreate`
already exists there to distinguish a platform-bucket Applications/Toolsets create from an admin-BE
one. Setting the default at this single point — rather than in each entity's server action — keeps
the default a pure client-side "what does a blank form look like" concern, consistent with how
`version`/`displayVersion` defaults are already handled there, and requires no changes to
`toModelPayload` or its Route/Application/Toolset equivalents, which already pass `userRoles`/
`user_roles` through untouched.

Concretely: add `userRoles: []` to the existing `PlatformModels` branch, add a new branch for
`ApplicationRoute.PlatformRoutes` with `userRoles: []`, and add a new branch guarded by
`isPlatformDualBucketCreate && (route === ApplicationRoute.AssetsApplications || route === ApplicationRoute.AssetsToolsets)`
with `user_roles: []`. The existing admin-BE-only creation paths for Applications/Toolsets (i.e.
`isPlatformDualBucketCreate` false) are untouched — they're config entities using `roleLimits`, out
of scope here.

Alternative considered: default at the server-action layer (e.g. `createModel` filling in
`userRoles: []` when absent). Rejected — it would silently rewrite any payload missing the field
(including a hypothetical future bulk-import path), whereas the create-modal is the one place "a
brand-new entity" is unambiguous.

## Risks / Trade-offs

- **Existing entities with `userRoles: undefined` are unaffected, by design** — this change only
  sets the new default on create, so pre-existing platform entities keep reading as
  available-to-all until an admin explicitly toggles their Roles tab. → Acceptable: changing
  existing entities' effective availability as a side effect of a UI redesign would be a silent
  behavior change on data the admin never touched; scope is intentionally limited to new entities.
- **The OFF→`undefined` write could regress if a call site starts merging over stale state** — if a
  future change to `PlatformModels/TabsContent.tsx` (or its siblings) starts spreading a previous
  snapshot before sending the PUT, an `undefined` field would stop meaning "absent" and the toggle-off
  path would break silently. → Mitigation: the specs for this change assert the round-trip
  (toggle off → saved entity has no `userRoles` in the request body), so a regression here fails a
  test rather than shipping unnoticed.
- **`isAssetUnavailable`'s empty-array check and the toggle's checked state must stay in sync** — if
  a future edit changes one without the other, the switch could show "restricted" while the
  notification stays hidden (or vice versa). → Mitigation: both derive from the same predicate
  function rather than duplicating the `Array.isArray`/length check inline in two components.
