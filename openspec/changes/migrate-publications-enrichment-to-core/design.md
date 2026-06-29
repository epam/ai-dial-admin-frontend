## Context

Phase 1 (`migrate-publications-to-core-api`) established the `publications-core-api` capability: all publication-native operations call DIAL Core, but per-resource enrichment (`get`) and the per-resource re-PUT (`update`) and target-exists checks were delegated to the admin BE via `assetsApi`, behind `PUBLICATIONS_USE_CORE`. The deliberately deferred piece was Phase 1's **R1**: Core resource shape-mapping (content+metadata merge + versioned-path parsing) has no FE precedent — the BE always did it.

The team's roadmap puts the **assets→Core migration** next. That effort must build a Core-native asset client + mapper layer (read/put/exists + content/metadata merge) for application/conversation/prompt/toolset/file to move the asset *views* off the BE. This change rides on that layer to finish publications.

## Goals / Non-Goals

**Goals**
- Route publications enrichment, update PUT, and target-exists through Core — removing the last BE dependency for publications.
- Remove the `PUBLICATIONS_USE_CORE` flag.
- Reuse the assets-migration Core asset client + mappers; do not duplicate them.
- Preserve the exact enriched `Publication` shape and all Phase 1 behavior (status→URL, issue collection, file staging, target recalc).

**Non-Goals**
- Owning/building the Core asset client layer (assets migration owns it).
- Any UI / contract change.

## What actually changes

Only the registry delegates flip. Phase 1 built the registry with a `PublicationTypeConfig` per resource type whose `fetchResource` / `putResource` / `existsAtTarget` pointed at `assetsApi`. Here they point at the Core asset clients:

```
                       Phase 1 (BE)                     Phase 2 (Core)
fetchResource     assetsApi.getAsset (+ If-None-Match)  coreAssets.get(type, path)        GET /v1/{type}/{path}
                                                         + coreAssets.getMetadata(type,…)  GET /v1/metadata/{type}/{path}
putResource       assetsApi.updateAsset                 coreAssets.put(type, body)        PUT /v1/{type}/{path}
existsAtTarget    assetsApi (exists via BE)             coreAssets.exists(type, target)   GET /v1/metadata/{type}/{path}
```

The shared resolver base, `url-resolver`, `path.ts`, `sanitize-comment`, `mappers.ts` (publication-level), and the file-resource helper are untouched.

## Decisions

### D1 — Consume the assets-migration Core asset layer; don't rebuild it
The content+metadata merge and versioned-path/shape mapping (Phase 1 R1, the genuinely risky part) are required by the assets migration regardless. This change depends on that layer and only re-points the publication registry delegates to it. **If ordering slips** and this lands before assets: build a minimal Core asset read/put/exists + mapper scoped to what publications need, structured so the assets migration can adopt it — but the preferred path is assets-first.

### D2 — Remove the feature flag, not just flip it
Once enrichment is Core-native, the BE path has no remaining caller. Delete `PUBLICATIONS_USE_CORE` and the BE branch rather than leaving dead config. Publications then have zero BE references.

### D3 — Enrichment fidelity is the acceptance bar
The risk is silent shape drift (a field the BE mapper populated that the Core mapper misses). Acceptance is a field-by-field diff of the enriched `Publication` (per type) between the Phase-1 BE path and the Phase-2 Core path, on the same fixtures — not just "it renders".

## Risks / open questions

- **R1 — Ordering dependency:** assets→Core migration must deliver the Core asset layer first (D1). Track as a hard prerequisite; if it slips, scope expands per D1's fallback.
- **R2 — Mapper fidelity:** Core content/metadata merge must reproduce every field the BE `*ClientMapper` produced (versioned-path parse, author/updatedAt from metadata, content/description from content DTO, application defaults/dependencies/interceptors). Mitigated by D3's diff.
- **R3 — etag on Core PUT:** Phase 1's per-resource PUT went through the BE with no etag (`putPrompt(..., null)`). Confirm the Core PUT path accepts the same no-precondition semantics (or supply the resource etag) so `update` keeps working for published targets.

## Migration / rollout

Assets→Core migration lands → implement this re-point → field-diff enriched publications per type against the archived Phase-1 path → remove flag + BE wiring → publications fully Core-backed.
