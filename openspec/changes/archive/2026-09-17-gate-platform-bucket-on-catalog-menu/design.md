## Context

`src/utils/files/root-folder.ts` is the single source of truth for "which roots does a view list".
`DUAL_BUCKET_VIEWS` (Assets Applications, Assets Toolsets) get `[PLATFORM_ROOT_FOLDER, ROOT_FOLDER]`
from `getRootFolders`; every other view gets one root. The two consumers that turn those roots into
fetches are `Common/FileManager/FileManager.tsx` (mount/refresh fetch, `isMultiRootView`) and
`Common/FilePath/FilePath.tsx` (folder-picker fetch). Both are client components, so they cannot read
`process.env` directly — Next.js only inlines env vars for server code; the app's established channel
for env-derived booleans is `FeatureFlags`, computed in the `[lang]/layout.tsx` server component and
delivered through `AppContextProvider` (`dashboardEnabled` is the existing `DISABLE_MENU_ITEMS`-based
precedent).

`DISABLE_MENU_ITEMS` already hides the whole `Catalog` menu group (the seven `Platform*` list views)
via `getMenuItems`/`getActualMenuItems` in `Menu`. Nothing today connects that setting to the
dual-bucket views, so a Catalog-disabled deployment still lists the `platform` bucket on every
assets-applications / assets-toolsets tree load.

## Goals / Non-Goals

**Goals:**

- When `DISABLE_MENU_ITEMS` contains `catalog` (case-insensitive), the dual-bucket views fetch and
  render only the `public` bucket — same single-root behavior as every other assets view.
- Keep the decision in the existing single-source-of-truth util so no caller special-cases the view.

**Non-Goals:**

- Blocking direct URL access to a platform-bucket item's detail page (an explicitly addressed entity
  stays fetchable).
- Gating the `Platform*` list routes or their server actions.
- Any change to how `DISABLE_MENU_ITEMS` filters the menu itself.

## Decisions

### D1: A `catalogEnabled` feature flag, computed like `dashboardEnabled`

`FeatureFlags` gains `catalogEnabled: boolean`; `[lang]/layout.tsx` sets it to
`!process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('catalog')` — character-for-character the
`dashboardEnabled` pattern two lines above. Client components read it via
`useAppContext().featureFlags.catalogEnabled`.

*Alternatives considered:* reading `process.env` inside `getRootFolders` (rejected: utils must stay
pure and side-effect free — `.claude/rules/utils.md` — and non-`NEXT_PUBLIC` vars aren't inlined into
client bundles anyway); threading a new context (rejected: duplicates the existing flag channel);
reusing `disableMenuItems` list passed only to `Menu` (rejected: it is a menu-local prop, not app
state).

### D2: The gate is an optional parameter on `getRootFolders`, not a filter at call sites

```ts
export const getRootFolders = (view: ApplicationRoute, isPlatformBucketEnabled = true): string[] =>
  DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketEnabled
    ? [PLATFORM_ROOT_FOLDER, ROOT_FOLDER]
    : [getRootFolder(view)];
```

A default of `true` keeps every existing call site (and the util's spec) unchanged. When `false`, a
dual-bucket view falls back to `[getRootFolder(view)]` = `['public']`, which is exactly the
single-root array every other view already produces — so `FileManager`'s
`rootPaths.length > 1 ? rootPaths : rootPaths[0]` branch, `isMultiRootView`, `FilePath`'s fetch, and
`AssetsFolderContext.fetchRoots` all collapse to the historical single-root path with no further
edits. The name `isPlatformBucketEnabled` says what the util controls; the mapping from "Catalog menu
disabled" to "platform bucket disabled" stays at the two call sites that know about feature flags.

*Alternatives considered:* filtering `PLATFORM_ROOT_FOLDER` out inside each component (rejected: the
"which roots" knowledge leaks out of `root-folder.ts` and the two call sites can drift); a separate
`getDualBucketRootFolders(view, flag)` export (rejected: two functions where one parameter suffices).

### D3: Only the two root-listing call sites pass the flag

`FileManager.tsx` (the `useEffect` fetch and `isMultiRootView`) and `FilePath.tsx` (the root-fetch
`useEffect`) read `useAppContext().featureFlags.catalogEnabled` and pass it to `getRootFolders`.
These are the only places a *bucket listing* is initiated for the tree; per-folder fetches
(`toggleFolder`, `fetchFolderHierarchy`, refresh handlers) fetch a concrete path the user is already
browsing, which cannot be a `platform` path once the platform node is absent from the tree.

`FileManager` already sits under `AppContextProvider` (it calls `useIsReadOnlyAdmin`, which reads
`AppContext`); `FilePath` is rendered inside entity views within the same provider stack, so no
provider wiring changes.

### D4: `test-setup.tsx` mocked `featureFlags` gains `catalogEnabled: true`

The centralized `useAppContext` mock returns a hardcoded `featureFlags`
(`{ deploymentsEnabled: true, adminApiEnabled: true }`). `undefined` is falsy, so without this
addition every existing `FileManager`/`FilePath` component test would silently run with the platform
bucket skipped and the new single-root behavior would be asserted by accident rather than by intent.
Adding `catalogEnabled: true` preserves current test semantics; the disabled path gets its own tests
(per testing rules: state/conditional variants).

## Risks / Trade-offs

- [Existing `FileManager`/`FilePath` specs assert two-root behavior] → the central mock keeps
  `catalogEnabled: true`, so those tests are unaffected; new specs exercise `false` explicitly.
- [A stale localStorage grid state or a deep link into `platform/...` while Catalog is disabled] →
  out of scope (Non-Goals): the platform *listing* is skipped, but an explicitly addressed platform
  path still fetches through the unchanged per-path code. No data is lost; the node simply isn't
  offered.
- [Every `FeatureFlags` literal across the codebase must grow the field] → `FeatureFlags` is an
  `interface`, so TypeScript surfaces each literal at compile time; `npm run typecheck` catches them
  all in the app project (specs are non-blocking).
- [Flag drift: `catalogEnabled` vs the menu's own `DISABLE_MENU_ITEMS` parsing] → both derive from
  the same env string with the same `toLowerCase().includes('catalog')` shape; the layout is the only
  place computing it, next to the `Menu` prop that uses `getMenuItems`.

## Migration Plan

Single deploy; no data or API migration. Rollback = revert the commit; the env var is unchanged and
a deployment without `catalog` in `DISABLE_MENU_ITEMS` sees no behavioral difference at all.
