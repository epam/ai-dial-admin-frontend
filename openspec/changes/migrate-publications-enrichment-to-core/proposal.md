## Why

`migrate-publications-to-core-api` (Phase 1) moved every publication-native operation to DIAL Core but, to avoid a high-risk port with no FE precedent, kept **one** dependency on the admin BE: per-resource **enrichment** (fetching application/conversation/prompt/toolset content + metadata for `get`) and the per-resource **re-PUT** on `update`, both via the existing `assetsApi` (→ admin BE). It gated the cutover behind `PUBLICATIONS_USE_CORE`.

This change closes that gap. With the **assets→Core migration** building a Core-native asset client + content/metadata mapper layer for all resource types, publications enrichment can route through Core too — removing the last BE dependency for publications and the feature flag. The hard part (Core resource shape-mapping: content+metadata merge, versioned-path parsing) is delivered by the assets migration and **consumed** here, not re-built.

## What Changes

- **Re-point the resolver registry** (`src/server/publications/resolver/registry.ts`): the `fetchResource` / `putResource` / `existsAtTarget` delegates move from `assetsApi` (BE) to the Core asset clients from the assets migration. The publication resolver flow, status→URL resolution, issue collection, and path helpers are unchanged.
- **Consume Core resource content+metadata mapping** for application/conversation/prompt/toolset/file: merge the content DTO (`GET /v1/{type}/{path}`) with the metadata DTO (`GET /v1/metadata/{type}/{path}`), parsing the prefix-stripped, decoded, `__`-versioned path into the FE model (`DialPrompt`, `DialApplicationResource`, etc.). Reuse the assets-migration mappers; add only any publication-specific shaping.
- **Remove the feature flag** `PUBLICATIONS_USE_CORE` and the BE branch in `PublicationsApi` — publications are fully Core-backed.
- **Remove now-dead BE wiring** for publications (BE-host instantiation, BE-only URL constants no longer referenced).
- No change to the publication UI, routes, server-action signatures, or the FE-facing `Publication` model.

## Capabilities

### Modified Capabilities
- `publications-core-api`: per-resource enrichment, the per-resource update PUT, and the target-exists check now run against DIAL Core (not the admin BE); the BE-fallback feature flag is removed.

### New Capabilities
<!-- None — this completes an existing capability. The Core asset client layer is owned by the assets→Core migration's capability. -->

## Impact

- **Dependency (hard):** the assets→Core migration must have landed the Core asset client + content/metadata mapper layer (read / put / exists for application, conversation, prompt, toolset; file metadata already on Core from Phase 1). If this change is implemented first, it would have to build that layer itself — see design D1.
- **Modified code:**
  - `src/server/publications/resolver/registry.ts` — delegates → Core asset clients
  - `src/server/entities/publications-api.ts` — drop the flag branch, BE path removed
  - `src/app/api/api.ts` — publications no longer instantiated against `DIAL_ADMIN_API_URL`
  - `.env.template`, `README.md` — remove `PUBLICATIONS_USE_CORE`
- **Removed:** BE-only publication URL constants / fallback code paths.
- **Auth/UI:** unchanged (user JWT; identical `Publication` contract).

## Non-goals

- Building the Core asset client/mapper layer itself — that belongs to the assets→Core migration; this change consumes it.
- Migrating non-publication asset *views* off the BE (that is the assets migration).
- `createPublication` (still unused by this FE).
- Any change to publication UX, rules-compare, or i18n.
