## Why

Issue #3932: creating an Asset Toolset from an MCP container page returns a **404 "Page not found"** instead of opening the new toolset. The toolset *is* created in Core — only the post-create redirect breaks.

Root cause is a regression from the direct-to-Core migration. `AssetApi.put` now writes straight to DIAL Core and returns Core's response verbatim — a metadata node in **Core format** (`name`, `url`, `parentPath`, `bucket`, `nodeType`). The redirect in `CreateAsset.onSubmit` feeds that response to `getEntityPath`, which expects the **admin-format** fields the admin BE used to return (`path`, `folderId`, `version`). None of those exist on the Core response, so the helper builds a garbage path:

```
data.path || `${data.folderId}${data.name}__${data.version}`
  →  "undefined" + name + "__undefined"
```

The redirect lands on `/assets-toolsets/<name>?path=undefined<name>__undefined`; the `[id]` page's `getToolset(path)` then fails, hits `notFound()`, and the user sees a 404.

**Scope of the leak (verified):** `CreateAsset.onSubmit` (the deployment "Create Asset" modal, used from MCP/model-serving container pages) is the only consumer that trusts `res.response` to carry admin-format fields. The assets-toolsets / assets-applications **list** create flows (`BaseAssetList.handleCreateAsset`) build their redirect from local form data (`getUrnForEntity(view, { name, version, folderId })`) and never read `res.response`, so they do **not** reproduce the 404. The fix still belongs at the write boundary so `res.response` is trustworthy for any consumer, but the observable bug is confined to the container "Create Asset" flow.

## What Changes

- **Normalize `AssetApi.put`'s return value** so a successful write resolves with the admin-format fields (`path`, `folderId`, `name`, `version`) merged onto the response — derived from the `path` argument `put` already receives, via the existing `parseVersionedPath` helper. Reads (`getMerged*`) already return these fields; this makes writes consistent with reads.
- No change to `getEntityPath`, `CreateAsset`, or any calling screen — they keep consuming admin-format fields exactly as before the Core migration.
- **Test coverage** for the normalized write response and for the MCP-container → Asset Toolset redirect building a valid URL.

## Non-goals

- No change to the Core wire contract or request path — only the shape `put` resolves with.
- No redesign of `getEntityPath` or the redirect logic in `CreateAsset`.
- No BE changes.

## Capabilities

### Modified Capabilities
- `core-asset-client`: `put` resolves with normalized admin-format path fields on success, so post-write consumers (redirects, list refresh) receive the same `path`/`folderId`/`version`/`name` shape as reads.

## Impact

- **API layer**: `src/server/core/asset-api.ts` — `put()` merges parsed path fields onto a successful `ServerActionResponse`.
- **Consumer (behavior restored, no code change)**: `CreateAsset.onSubmit` redirect via `getEntityPath` (`utils/open-in-new-tab.ts`) — the deployment "Create Asset" modal used from MCP/model-serving container pages. List create flows already sidestep `res.response` and are unaffected.
- **Tests**: `src/server/core/tests/asset-api.spec.ts` (or equivalent), plus the create-asset redirect spec.
