## Why

Clicking a config-file row in `assets-applications` or `assets-toolsets` navigates to a malformed URL
(`…/echo?path=undefinedecho__undefined%3FconfigFile%3Dtrue`) and the detail page renders 404
(Issue #4590). The other covered views work because their routes build a flat `{id}` segment; the two
dual-bucket views always emit `?path=…` for non-platform rows, and a config-file row — which carries
only a `name` — fails the platform-bucket check and falls into the public-bucket branch, which
fabricates `undefined{name}__undefined`. The spec's navigation requirement is already correct; the
implementation violates it, and the spec's scenarios only assert the URL shape via `platform-models`,
so nothing caught the dual-bucket case.

## What Changes

- `getEntityPath`'s dual-bucket branch (`AssetsApplications`/`AssetsToolsets`, in
  `src/utils/open-in-new-tab.ts`) treats a row with neither `path` nor `folderId` as flat: bare encoded
  name, no `?path=` — the same segment a platform-bucket row produces. A config-file row from
  `ConfigFileEntityList` is exactly `{ name }`, so it resolves like a platform-bucket row, and the
  detail page's existing no-`path` platform-bucket branch fetches it via `getConfigFileApplication`/
  `getConfigFileToolset` once `configFile=true` is appended.
- The `configFile=true` suffix concatenation joins correctly — `&` when the built URN already carries
  a query string, `?` otherwise — through one shared helper in `src/utils/open-in-new-tab.ts`, applied
  at all three concat sites: `onCellClicked` (`components/EntityListView/utils/on-cell-clicked.ts`,
  row click), `onOpenInNewTab` (`src/utils/open-in-new-tab.ts`, the open-in-new-tab row action — both
  utils take a `urlSuffix` and both currently concatenate it blindly), and the `getHref` callback in
  `EntityListView.tsx`. Precedent for the join: `Assets/Resources/utils.ts` (`setUrl` derives `?`
  vs `&` from the built URN — the fix for the platform bucket's redirect in Issue #4447). Harmless today
  once the dual-bucket branch is flat, but closes the latent trap for any future suffix on a
  query-carrying route.
- Spec delta for `config-file-entity-views`: the navigation requirement gains a dual-bucket scenario
  asserting `/assets-applications/{id}?configFile=true` — no `?path=` — so the regression the current
  scenarios miss is pinned.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `config-file-entity-views`: the row-click navigation requirement's scenario set gains the
  dual-bucket URL shape (`/assets-applications/{id}?configFile=true`, no `?path=`); the requirement
  text itself already specifies this and is unchanged.

## Impact

- `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` — dual-bucket branch of `getEntityPath`, plus the
  shared suffix-join helper used by `onOpenInNewTab`; spec in
  `src/utils/tests/open-in-new-tab.spec.ts` (it already covers `AssetsApplications`/`AssetsToolsets`
  and an `onOpenInNewTab` suffix call).
- `apps/ai-dial-admin/src/components/EntityListView/utils/on-cell-clicked.ts` — `onCellClicked` joins
  via the shared helper; spec in `components/EntityListView/tests/EntityListView.spec.tsx`.
- `apps/ai-dial-admin/src/components/EntityListView/EntityListView.tsx` — `getHref` joins via the
  shared helper.
- No route, page, server-action, or Core API changes: `[id]/page.tsx` for both views already handles
  `configFile=true` and the platform-bucket (no-`path`) case correctly.
- Public-bucket rows are unaffected — every row from the real asset list carries a `folderId`, so the
  new flat condition (`path == null && folderId == null`) is unreachable for them.

## Non-goals

- No change to how public-bucket or platform-bucket rows navigate — only the neither-bucket
  (config-file) row shape.
- No new route or detail-page behavior; the read-only config-file detail rendering is already
  specified and implemented.
- Not addressing `platform-catalog-schemas` (works via the flat branch) or any future suffix-bearing
  route beyond making the join correct.
