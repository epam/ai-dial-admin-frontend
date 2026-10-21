## Context

`getEntityPath`'s dual-bucket branch (`AssetsApplications`/`AssetsToolsets`, in
`src/utils/open-in-new-tab.ts`) decides a row's bucket from its data: a `platform/`-prefixed
`path`/`folderId` yields the flat `{id}` segment, anything else is treated as a public-bucket row and
gets `?path={folderId}{name}__{version}`. A config-file row from `ConfigFileEntityList` is `{ name }`
only — neither bucket — so it falls into the public branch, which stringifies the missing fields into
`undefined{name}__undefined`. The `configFile=true` suffix is then concatenated blindly
(`…?path=…?configFile=true`, encoded as `%3FconfigFile%3Dtrue`), the detail page treats the garbage
`path` as a public-bucket resource, Core 404s, and the page renders 404 (Issue #4590). The flat-platform
views never break because their `getEntityPath` branch emits no query at all, so the blind suffix join
is harmless there.

Three places concatenate a `urlSuffix` onto a built URN: `onCellClicked`
(`components/EntityListView/utils/on-cell-clicked.ts`), `onOpenInNewTab`
(`src/utils/open-in-new-tab.ts`), and the inline `getHref` in `EntityListView.tsx`.

## Goals / Non-Goals

**Goals:**

- A config-file row in `assets-applications`/`assets-toolsets` navigates to
  `/assets-{type}/{id}?configFile=true` — flat segment, no `path` param — row click, open-in-new-tab,
  and rendered href alike.
- Every suffix concatenation joins as a proper query parameter, so no future suffix caller can
  reproduce this bug.

**Non-Goals:**

- No route, page, server-action, or Core API change — both `[id]` pages already fetch via
  `configFileApi` when `configFile=true` and the row has no `path`.
- No change to how public-bucket or platform-bucket rows navigate.
- No change to either toolset-auth `setUrl` (see D3).

## Decisions

### D1: The neither-bucket row is flat, decided inside `getEntityPath` (approach A)

The dual-bucket branch gains a second flat condition, ordered after the platform check:

1. `isPlatformBucketPath(path || folderId)` → existing platform branch (unchanged).
2. `path == null && folderId == null` → flat: bare `encodeURIComponent(name)`, mirroring the
   platform branch's return.
3. Otherwise → existing public branch (unchanged).

The alternative — threading `isConfigFileSource` from `EntityListView` through `onCellClicked` into
`getUrnForEntity` (approach B) — was rejected: the branch already infers the bucket from the data
shape, and "in neither bucket" is a property of the row, not of the list that rendered it. Deciding in
the util also fixes callers outside `EntityListView` for free — notably the toolset-auth redirect
(`Assets/Resources/utils.ts` `setUrl` builds its return URL from the same `getUrnForEntity` call, with
the full config-file toolset entity, which likewise carries no `path`/`folderId`) — which a
list-scoped flag would have left broken.

Safety of the inference: every public/platform row reaching this branch carries a `folderId` or `path`
(asset-browser rows from `BaseAssetList`, save-redirect entities from the Views, tree targets from
`Assets/utils.ts`, auth entities built with an explicit `path`). The `{name}`-only shape exists solely
in `ConfigFileEntityList`'s rows (and in config-file-sourced detail entities, where flat is equally
correct).

### D2: One shared join helper, applied at all three concat sites

A pure helper in `src/utils/open-in-new-tab.ts` — `appendUrlQuery(url, query)` returning
`` `${url}${url.includes('?') ? '&' : '?'}${query}` `` — used by `onCellClicked`, `onOpenInNewTab`,
and `EntityListView`'s `getHref`. `CONFIG_FILE_URL_SUFFIX` becomes the bare `'configFile=true'`
(separator supplied by the helper); it stays in `EntityListView.tsx`, its only consumer's file.

Fixing only the `EntityListView` call sites was rejected: `onCellClicked` and `onOpenInNewTab` both
take a `urlSuffix` parameter and would keep the blind concat for the next caller. The `URL` API was
rejected as overkill — the codebase's own precedent (`Assets/Resources/utils.ts` `setUrl`, the
Issue #4447 fix) is the string check.

### D3: Toolset-auth `setUrl` files are verified, not changed

`Assets/Resources/utils.ts` `setUrl` — the one the Assets/Toolsets and Platform Toolsets views reach
through `ResourceAuthButtons` — already derives `?` vs `&` from the built URN (the #4447 fix), so once
D1 makes the config-file toolset URN flat it correctly picks `?`. `Toolsets/Auth/utils.ts`'s older
view-keyed `setUrl` only serves the bare `Toolsets`/publication callers in `Toolsets/Auth/AuthButtons`,
whose entities always carry an explicit `path` (its `&` assumption holds). Neither needs a change;
both re-verified against their callers in this change so the conclusion is on record.

### D4: Spec delta pins the dual-bucket URL shape

MODIFIED (full block) on `config-file-entity-views`' "A config-file entity row links to its
platform/asset detail route": the requirement text states the flag is joined as a proper query
parameter and that the dual-bucket URL carries no `path` param; two scenarios assert the
`/assets-applications/{id}?configFile=true` and `/assets-toolsets/{id}?configFile=true` shapes, plus
one for the `&`-join contract. The current scenarios all assert the URL via `platform-models`, which
is why this regression was invisible to the gate.

## Risks / Trade-offs

- **[A future dual-bucket caller passes a `{name}`-only row that is not a config-file entity]** → It
  would silently get the flat URL. Every current caller was audited (see D1); the condition is
  documented in the branch so the assumption is visible where the next editor will read it.
- **[Behavior change for platform-bucket rows with `path == null && folderId != null`]** → None: the
  platform check reads `path || folderId`, so such rows already took the platform branch; the new
  condition only catches rows the old code misrouted to the public branch.
- **[Suffix-bearing routes outside these three sites]** → `Actions.tsx`'s `router.push` and every
  other `getUrnForEntity` call site pass no suffix; the helper is available for them if that changes.
