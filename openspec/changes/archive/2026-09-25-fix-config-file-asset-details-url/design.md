## Context

Config-file asset rows use the normal asset detail route with an additional `configFile=true` marker. Versioned public asset URLs already contain `?path=...`. `BaseAssetList` appends the marker with a second literal `?`, causing it to be encoded into the path rather than parsed as a separate query parameter.

## Goals / Non-Goals

**Goals:**

- Preserve `path` and append `configFile=true` as a separate query parameter for config-file asset navigation.
- Apply the same URL rule to same-tab, modifier-click, and explicit action-menu new-tab flows.
- Cover both BaseAssetList call sites with regressions tests.

**Non-Goals:**

- Altering asset identity/path construction or detail-page query parsing.
- Changing navigation for non-config-file rows.

## Decisions

### Reuse `appendUrlQuery`

`BaseAssetList` will use the existing `appendUrlQuery(url, query)` helper from `utils/open-in-new-tab`. The helper selects `&` when the detail URL already has `?path=`, otherwise `?`, and already defines the intended behavior for entity-list and generic new-tab navigation.

Changing `getEntityPath` is rejected because its `?path=` result is correct and broadly consumed. Reimplementing separator logic locally is rejected because it would duplicate the existing shared behavior.

### Fix both direct call sites

Both BaseAssetList paths that add the config-file marker will use the helper: row/details navigation (including modifier-driven new tabs through `navigateEntityUrl`) and the action-menu new-tab callback. This prevents the same defect from persisting behind a different user entry point.

## Risks / Trade-offs

- [A name-only row has no existing query] → `appendUrlQuery` produces the same `?configFile=true` URL as before.
- [A versioned row already has `?path=`] → regression tests assert `&configFile=true`, preventing the marker from becoming path data.
- [Other query-bearing entity routes] → the helper's separator behavior is URL-generic and existing tests cover both separator cases.

## Migration Plan

No data migration or backend deployment change is required. Rollback is a frontend revert.

## Open Questions

None.
