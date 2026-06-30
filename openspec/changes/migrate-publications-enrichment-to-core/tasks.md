## 0. Prerequisite (not implemented here)

- [ ] 0.1 Confirm the assets→Core migration has landed the Core asset client + content/metadata mapper layer (read / put / exists for application, conversation, prompt, toolset). If not, see design D1 before starting.

## 1. Re-point the resolver registry to Core

- [ ] 1.1 Update `src/server/publications/resolver/registry.ts`: `fetchResource` → Core `get(type, path)` + `getMetadata(type, path)` merged via the assets-migration mapper
- [ ] 1.2 `putResource` → Core `put(type, body)` (`PUT /v1/{type}/{path}`); confirm no-precondition/etag semantics match Phase 1 (R3)
- [ ] 1.3 `existsAtTarget` → Core metadata lookup (`GET /v1/metadata/{type}/{path}`) returning the "target already exists" issue on hit
- [ ] 1.4 Verify the shared base resolver, `url-resolver`, `path.ts`, `mappers.ts`, file-resource helper are unchanged and still pass their Phase-1 specs

## 2. Remove the feature flag and BE wiring

- [ ] 2.1 Delete the `PUBLICATIONS_USE_CORE` branch from `src/server/entities/publications-api.ts`; keep only the Core path
- [ ] 2.2 Stop instantiating publications against `DIAL_ADMIN_API_URL` in `src/app/api/api.ts`
- [ ] 2.3 Remove BE-only publication URL constants / dead code paths
- [ ] 2.4 Remove `PUBLICATIONS_USE_CORE` from `.env.template` and `README.md`

## 3. Fidelity verification (acceptance bar — design D3)

- [ ] 3.1 For each type (application, conversation, prompt, toolset, file), field-by-field diff the enriched `Publication` from the Core path vs the archived Phase-1 BE path on the same fixtures; reconcile any drift in the mapper
- [ ] 3.2 Re-run the publication resolver/registry specs (issue collection on not-found/already-exists, target recalc, file staging) against the Core delegates
- [ ] 3.3 Confirm `update` still succeeds for a published target (R3 etag semantics)
- [ ] 3.4 Run targeted specs via `vitest run` from `apps/ai-dial-admin/`; report output
- [ ] 3.5 Run `openspec validate migrate-publications-enrichment-to-core --strict`
