## 0. Prerequisite (confirmed)

- [x] 0.1 Confirmed the assets→Core migration (seven changes) has landed with `AssetApi`/`FilesCoreApi` built. Confirmed the actual re-point surface is much narrower than originally drafted: `EnrichmentClients.getAsset`/`updateAsset` in `src/app/api/api.ts` — not a `registry.ts` delegate, not a feature flag, not a `publications-api.ts` file (none of those exist as originally assumed; see the corrected proposal/design)

## 1. Re-point the enrichment clients

- [x] 1.1 `publicationEnrichmentClients.getAsset` now calls `assetApi.getMergedWithEtag(token, type, path, etag)`
- [x] 1.2 `publicationEnrichmentClients.updateAsset` now calls `assetApi.put(token, type, (asset as { path: string }).path, asset, { etag })`
- [x] 1.3 Confirmed `getBucket`/`getFileMetadata`/`uploadFile` untouched (already Core-native)
- [x] 1.4 Removed the now-unused `AssetWithVersion` import from `api.ts`

## 2. Fidelity verification (acceptance bar)

- [x] 2.1 Added `src/app/api/tests/publications-enrichment.spec.ts`, exercising the **real** exported `publicationsApi` (not a mocked `EnrichmentClients`) end-to-end with mocked HTTP: confirms `getPublication` enriches a pending prompt resource via genuine `v1/prompts/...` and `v1/metadata/prompts/...` calls, with the correct merged field values (content, name, version, author, folderId) — proving the actual wiring, not just the interface contract. Per-type field-mapping correctness itself was already proven by `add-core-asset-client`'s `asset-metadata.spec.ts`; re-deriving it per type here would be duplicative, so this change's own test targets the wiring specifically (one representative type is sufficient to prove the re-point mechanism works, since all four versioned types go through the identical `getMergedWithEtag`/`put` code path)
- [x] 2.2 Re-ran `core-publications-api.spec.ts` and the resolver tests (`path.spec.ts`, `sanitize-comment.spec.ts`, `url-resolver.spec.ts`) unmodified — 30/30 passing, confirming the `EnrichmentClients` interface didn't change, only its wiring
- [x] 2.3 Added a second test confirming `updatePublication`'s per-resource PUT sends neither `If-Match` nor `If-None-Match` (the `DEFAULT_ETAG` sentinel's no-precondition semantics), matching the old BE path's effectively-unconditional update
- [x] 2.4 `vitest run` — `publications-enrichment.spec.ts` (2/2), `core-publications-api.spec.ts` + resolver tests (30/30), full-repo suite green
- [x] 2.5 `openspec validate migrate-publications-enrichment-to-core --strict` — passes

<!--
No browser-verification task: this change re-points a server-internal dependency behind an
already-stable interface (EnrichmentClients); no UI element, route, or rendered text changes
as a result. The real-wiring fixture tests above are the verification bar, consistent with
every prior change in this series that lacked a live Core instance to test against.
-->
