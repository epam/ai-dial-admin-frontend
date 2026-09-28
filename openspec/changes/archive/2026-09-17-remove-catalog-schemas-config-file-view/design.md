# Design

## Context

`apply-catalog-schemas-to-deployments` made `platform-catalog-schemas` the eighth view of the
`config-file-entity-views` surface. The evidence for it was Core's `FileConfigController`:
`listFileConfigCatalogSchemas` and `getFileConfigCatalogSchema` exist, and `entitySource` maps
`CATALOG_SCHEMA` to `config.getCatalogSchemas()`. That evidence is still true; it was the wrong
question. The surface covers the views product treats as split between two populations, and Catalog
Schemas is not one of them — Issue #4605.

## Decisions

### D1 — Withdraw the view, keep the type readable

`PlatformCatalogSchemas` leaves `CONFIG_FILE_ENTITY_VIEWS`. That set has one production use —
`BaseAssetList`'s `headerExtra` — so it gates the toggle and nothing else. The list swap was gated
separately, by `PageList` rendering `ConfigFileListSwap`, which reads only the persisted
`showConfigFiles` flag from `AppContext`. Removing the set member alone would therefore have left a
user whose stored flag is `true` on the config-file list with no toggle to escape it: worse than the
reported bug. Both halves have to go, which is why task 1.2 deletes the wrapper rather than
hollowing it out.

`ConfigFileEntityType.CatalogSchemas` stays in `READABLE_CONFIG_FILE_TYPES`. That set guards
`ConfigFileApi` as a whole, single-entity reads included, and the detail route's fallback read is the
only way a schema a deployment points at opens when just the configuration file declares it.
Removing the member would answer `TypeNotReadable` and reintroduce the 404 that fallback fixed. The
constant's doc comment says so, so the next reader does not "finish the job".

### D2 — Drop the `configFile=true` branch of the detail page

Only the config-file list produced that URL. The requirement that owns `configFile=true` detail
rendering enumerates seven routes and never included this one, so the rendering half of the branch
was undocumented from the day it was written; the linking half was specified, and this change's
delta takes `/platform-catalog-schemas/{id}` back out of that route list. The fallback already covers the same case and reaches it from the address a
user actually has: read the bucket resource, and on a miss read the configuration file by `$id`,
marking the result read-only. Keeping both would leave two code paths to the same render, one of them
unreachable.

### D3 — Delete `PageList.tsx` rather than hollow it out

With the swap gone the wrapper would forward a single child. `platform-keys/page.tsx` — the other
platform view outside this surface — renders its `List` directly inside
`SaveValidationContextProvider`, so this page matches it. The deleted spec file goes with it; what it
pinned (the swap) no longer exists.

### D4 — Pin the absence, not just the presence

`config-file-actions.spec.ts` asserted membership in both sets and the count of eight. It now asserts
that `PlatformCatalogSchemas` is absent, that the covered set is seven, and that the readable type
survives — the three facts a future widening would have to break deliberately.

## Alternatives considered

- **Leave the toggle and close #4605 as by-design.** Defensible on Core's contract, and it keeps
  file-declared schemas browsable. Rejected: which views carry the toggle is a product decision, and
  the answer is seven.
- **Remove the view but keep the list action for a later surface.** It would be dead code guarded by
  nothing, and the action is three lines to write again.
- **Keep `configFile=true` for bookmarks.** A bookmark to it is a URL no UI ever produced; the bare
  address resolves the same schema.
