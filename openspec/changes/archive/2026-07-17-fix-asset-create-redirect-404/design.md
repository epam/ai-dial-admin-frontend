## Context

Direct-to-Core writes (`AssetApi.put`) return Core's metadata node verbatim. Core format carries the resource identity inside a single encoded `url` string; the frontend everywhere else consumes the admin-format split (`path`, `folderId`, `name`, `version`). Reads were migrated to bridge this (`getMerged*` runs the response through `parseEncodedVersionedPath`), but writes were not — so `put`'s response is the one place a Core-format object leaks into admin-format consumers.

## Decision: normalize at `put()`, derive from the `path` argument

Fix the mismatch once, at the boundary where the Core response enters the app, rather than at each consumer.

**Where:** `AssetApi.put`. On a successful `putAction`, merge `{ path, folderId, name, version }` onto `response` before returning.

**Source of the fields:** the `path` argument `put` already receives (e.g. `my-folder/mytoolset__1.0`), parsed with the existing `parseVersionedPath(path)` helper. This is preferred over parsing `response.url` because:
- It does not depend on the Core PUT response body carrying a `url` (defensive against empty/204-style bodies).
- The path we wrote to is authoritative for identity; the response body is not needed to know where the resource now lives.

```
put(token, type, path, body)
  └─ putAction(...) → { success, response, etag }
       if success:
         const { path, folderId, name, version } = parseVersionedPath(path)
         return { ...result, response: { ...result.response, path, folderId, name, version } }
```

Existing `response` fields (Core `name`/`url`/etc.) are preserved; admin fields are added on top, so nothing that reads the Core shape regresses.

### Alternatives considered

- **Fix `CreateAsset.onSubmit` only** (drop `res.response`, redirect from `currentEntity`): `onSubmit` already does `res.response || currentEntity`, and `currentEntity` carries `name`/`version`/`folderId` from the modal form, so dropping `res.response` would fix the observable 404 with a one-line change. Since verification showed `CreateAsset.onSubmit` is the *only* consumer that trusts `res.response`, this is a legitimately smaller fix. Not chosen because it leaves `put`'s response Core-shaped — a latent trap for the next consumer that reads it — but it is the fallback if the `put`-level change proves risky.
- **Teach `getEntityPath` to derive from `url`**: pushes Core-encoding knowledge into a presentation util and only covers the redirect. Rejected as leaky.

## Edge cases

- **Slashless path must not throw (confirmed risk):** `parseVersionedPath` throws `"The path does not contain a '/'"` when the path has no `/`. `ROOT_FOLDER` is the bare string `'public'` (no trailing slash), and `createToolset` falls back to `folderId = toolset.folderId || ROOT_FOLDER` — so an empty `folderId` yields a slashless path like `publicName__1.0`. In practice the modal gates submit until a real folder path (`public/…`) is selected, but normalization MUST be defensive: guard the parse (skip enrichment / try-catch) so a slashless path returns the original response unchanged rather than throwing and breaking an otherwise-successful write. Covered by a test.
- **Update path (`etag` supplied):** `updateToolset`/`updateAsset` also go through `put`; they gain the same normalized fields — harmless and consistent.
- **Unversioned resources:** `version` comes back `undefined` from `parseVersionedPath`, matching `getEntityPath`'s existing `data.path` branch (which uses `path` directly), so the redirect stays correct.
- **Failed writes:** leave the error `ServerActionResponse` untouched — only merge on `success`.

## Verification

Browser-observable acceptance for the gate: MCP container → Create Asset Toolset → Create → lands on the new toolset's detail page (no 404), URL contains a valid `?path=`.
