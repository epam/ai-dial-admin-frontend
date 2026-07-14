## Context

Phase 1 established `publications-core-api`: all publication-native operations call DIAL Core directly. Per-resource enrichment (`get`) and the per-resource re-PUT (`update`) were deliberately left on the admin BE, behind an injected `EnrichmentClients` interface (`src/server/publications/resolver/types.ts`) rather than a feature flag — the actual shipped code never had `PUBLICATIONS_USE_CORE` (correcting the original design's assumption).

`EnrichmentClients` has five methods, wired in `src/app/api/api.ts`:
```ts
getAsset: (token, path, type, etag) => assetsApi.getAssetWithEtag(token, path, type, etag),
updateAsset: (token, asset, type, etag) => assetsApi.updateAssetWithEtag(token, asset as AssetWithVersion, type, etag),
getBucket: (token) => bucketApi.getBucket(token),
getFileMetadata: (token, path) => filesCoreApi.getFileMetadata(token, path),
uploadFile: (token, path, file) => filesCoreApi.uploadFile(token, path, file),
```
Only `getAsset`/`updateAsset` are BE-backed; the other three were already Core-native in Phase 1. `getAsset` is called from `resolve.ts`'s `enrichAssetResource` (for the primary resource of application/conversation/prompt/toolset publications) always with `DEFAULT_ETAG` ('*') — a plain, unconditional fetch, never a real conditional read. `updateAsset` is called from `core-publications-api.ts`'s `updatePublication`, also always with `DEFAULT_ETAG`, for each `ResourcePut` built by `update.ts`'s `buildUpdatePlan` (each `asset` is the raw `DialPrompt`/`DialApplicationResource`/`DialConversation`/`DialToolsetResource` body posted from the View, which carries its own `path`).

File resources never call `getAsset`/`updateAsset` — `enrichFileResource` (`file-resource.ts`) uses `getFileMetadata` exclusively for both the primary resource (file-type publications) and attached files (on application/conversation/toolset publications), and that's already `filesCoreApi`-backed. So this change's scope is exactly two arrow functions in `api.ts`.

The assets→Core migration (seven changes, archived) built exactly what's needed: `AssetApi.getMergedWithEtag<T>(token, type, path, etag)` returns `ServerActionResponse<T>` — the same shape `EnrichmentClients.getAsset` already returns. `AssetApi.put(token, type, path, body, { etag })` sends a PUT with `If-Match` when an etag is given (or `If-None-Match: *` when omitted/`allowOverride` is false) — matches `updateAsset`'s always-etag'd, no-real-precondition call pattern when passed `{ etag: '*' }` (resolves to no header, same as the BE path's behavior today).

## Goals / Non-Goals

**Goals**
- `EnrichmentClients.getAsset`/`updateAsset` call `AssetApi` instead of `assetsApi`, for the four versioned types.
- Zero change to the resolver/update/mapper logic that consumes `EnrichmentClients` — only the implementation behind the interface changes.
- Field-by-field fidelity: the enriched `Publication` (per type) must be identical to what the BE-backed path produced.

**Non-Goals**
- Touching file-resource enrichment — already Core-native.
- Building or changing `AssetApi`/`FilesCoreApi` — consumed as-is.
- Any UI/contract change.

## Decisions

### D1 — Re-point in `api.ts` only; `EnrichmentClients`'s type signature is unchanged
`getAsset`'s signature `(token, path, type, etag) => Promise<ServerActionResponse>` is satisfied directly by `AssetApi.getMergedWithEtag`, modulo argument order (`type` and `path` are swapped between the two: `EnrichmentClients.getAsset(token, path, type, etag)` vs. `AssetApi.getMergedWithEtag(token, type, path, etag)`). The `api.ts` wiring adapts the order; nothing else needs to know.

```ts
getAsset: (token, path, type, etag) => assetApi.getMergedWithEtag(token, type, path, etag),
updateAsset: (token, asset, type, etag) =>
  assetApi.put(token, type, (asset as { path: string }).path, asset, { etag }),
```

### D2 — `updateAsset` derives `path` from the asset body, not a new parameter
`EnrichmentClients.updateAsset`'s signature has no explicit `path` — the old BE endpoint was a fixed `/update` URL with the BE resolving the target from the posted body. Core's PUT needs an explicit `path` in the URL. Since every `asset` passed through `update.ts`'s `ResourcePut.asset` already carries `.path` (it's the raw content body posted from the View, and all four versioned models — `DialApplicationResource`, `DialToolsetResource`, `DialConversation`, `DialPrompt` — declare `path`), the adapter reads it directly rather than changing `EnrichmentClients`'s signature (which would ripple into `resolve.ts`/`update.ts`, neither of which needs to change otherwise).

### D3 — `DEFAULT_ETAG` ('*') continues to mean "no real precondition"
Both call sites always pass `DEFAULT_ETAG`. `AssetApi.getMergedWithEtag`'s conditional-GET header helper (`createIfNoneMatchHeaders`) and `AssetApi.put`'s (`createHeadersForCreate`) already treat `'*'` as the no-header sentinel (built and tested in `add-core-asset-client`) — no new logic needed, this "just works" by reusing the existing helper's documented behavior.

## Risks / Trade-offs

- **[Risk] Mapper fidelity**: `AssetApi.getMergedWithEtag`'s merge (via `ASSET_MERGERS`) must reproduce every field the old BE-backed `assetsApi.getAssetWithEtag` response carried, since publications enrichment displays these fields in the review UI. → **Mitigation**: field-by-field diff test per type (application, conversation, prompt, toolset) using the same fixture data, comparing the new `AssetApi`-based result against what the old `assetsApi`-based mock would have returned — this is the acceptance bar (D3 in this design, formerly numbered differently in the stale draft).
- **[Risk] `updateAsset`'s no-etag PUT semantics drift**: confirm `AssetApi.put` with `{ etag: '*' }` truly sends no conditional header (already unit-tested in `add-core-asset-client`, but re-verify here since a regression would silently start requiring/rejecting on preconditions for publication approvals).

## Migration Plan

1. Re-point the two `EnrichmentClients` functions in `api.ts`.
2. Field-by-field fidelity tests per type against fixtures.
3. Full publications test suite pass (`core-publications-api.spec.ts`, resolver tests) — these already mock `EnrichmentClients` directly, so they shouldn't need changes, only re-verification that they still pass unmodified (proving the interface didn't change).
4. Manual verification note: no live BE/Core to compare against in this environment; rely on the fixture-based fidelity tests as the acceptance bar, consistent with how every prior change in this series has verified without a live Core instance.

## Open Questions

None outstanding.
