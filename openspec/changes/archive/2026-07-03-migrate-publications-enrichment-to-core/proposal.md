## Why

`migrate-publications-to-core-api` (Phase 1, shipped in PR #3776) moved every publication-native operation to DIAL Core but, to avoid a high-risk port with no FE precedent, kept **one** dependency on the admin BE: per-resource **enrichment** (fetching application/conversation/prompt/toolset content + metadata for `get`) and the per-resource **re-PUT** on `update`, both via `assetsApi` (→ admin BE), injected into the resolver layer as `EnrichmentClients.getAsset`/`updateAsset` and wired in `src/app/api/api.ts`.

**Correction from the original proposal/design**, confirmed against the actual shipped code:
- There is **no `PUBLICATIONS_USE_CORE` feature flag** anywhere in the codebase — Phase 1 was a hard cutover from the start. Nothing to remove.
- There is **no `src/server/entities/publications-api.ts`** (the BE-backed client) — it was already deleted in Phase 1.
- The BE-delegate functions (`fetchResource`/`putResource`/`existsAtTarget`) don't live in `src/server/publications/resolver/registry.ts` — that file only holds static per-type metadata (prefix, resource/asset field keys, messages). The actual delegates are the two `EnrichmentClients` methods (`getAsset`, `updateAsset`), consumed by `resolve.ts`/`update.ts` and wired to `assetsApi` in `src/app/api/api.ts`.
- **File resources are already fully Core-native** — `enrichFileResource` (`src/server/publications/resolver/file-resource.ts`) always calls `clients.getFileMetadata` (→ `filesCoreApi`, Core since Phase 1), never `getAsset`/`updateAsset`. This change only touches the four versioned types (application, conversation, prompt, toolset).

This change closes the remaining gap: with the assets→Core migration (seven changes, archived) having built `AssetApi` (`getMergedWithEtag`, `put`), publications enrichment can route through it instead of `assetsApi`. The genuinely risky part — Core resource shape-mapping (content+metadata merge, versioned-path parsing) — was delivered by that migration and is **consumed** here, not re-built.

## What Changes

- **Re-point `EnrichmentClients.getAsset`/`updateAsset` in `src/app/api/api.ts`** from `assetsApi.getAssetWithEtag`/`updateAssetWithEtag` to `assetApi.getMergedWithEtag`/`assetApi.put`, for the four versioned types. `getBucket`/`getFileMetadata`/`uploadFile` are untouched (already Core-native).
- **No changes to the resolver logic itself** (`resolve.ts`, `file-resource.ts`, `update.ts`, `url-resolver.ts`, `path.ts`, `registry.ts`, `mappers.ts`) — they call `clients.getAsset`/`updateAsset` through the injected interface; only what's behind that interface changes.
- **`assetsApi` drops out of the publications path entirely** — it stays imported/exported in `api.ts` for the fast-follow features (import/export/discovered-tools/sign-in-out/application validity-state) that still use it.
- No change to the publication UI, routes, server-action signatures, or the FE-facing `Publication` model.

## Capabilities

### Modified Capabilities
- `publications-core-api`: per-resource enrichment (`get`) and the per-resource update PUT now run against DIAL Core via `AssetApi`, not the admin BE. The already-Core-native `list`/`get`/`approve`/`reject`/`delete`/rule-list/file-staging operations are unaffected.

### New Capabilities
<!-- None — this completes an existing capability using the already-built core-asset-client capability. -->

## Impact

- **Modified code:**
  - `src/app/api/api.ts` — `publicationEnrichmentClients.getAsset`/`.updateAsset` re-point to `assetApi`
- **Unchanged:** `src/server/publications/resolver/resolve.ts`, `file-resource.ts`, `update.ts`, `url-resolver.ts`, `registry.ts`, `mappers.ts`, `path.ts`, `sanitize-comment.ts`, `EnrichmentClients`'s type signature (the interface shape doesn't need to change, only its implementation)
- **Auth/UI:** unchanged (user JWT; identical `Publication` contract)

## Non-goals

- Building the Core asset client/mapper layer itself — already delivered by the assets→Core migration; this change only consumes it.
- Migrating any other asset-domain feature (import/export, discovered-tools, sign-in/out, application validity-state Phase 2) — those are separate fast-follows.
- `createPublication`/`ruleList` on `CorePublicationsApi` — already added by `migrate-folders-to-core` for folder rules/unpublish; unrelated to this change's scope.
- Any change to publication UX, rules-compare, or i18n.
