## 1. Core client layer + config

- [x] 1.1 Add `DIAL_CORE_API_URL` and `PUBLICATIONS_USE_CORE` to `.env.template` and document both in `README.md`
- [x] 1.2 Create `src/server/core/core-api.ts` — `CoreApi extends BaseApi` (host `DIAL_CORE_API_URL`), reusing the existing JWT-Bearer header; no new auth logic
- [x] 1.2a (R3/D9) In `CoreApi`, normalize Core error bodies to the FE `ErrorObject` shape `{ error: <status reason>, message: <core text / nested message>, status }` before `handleResponse`/`getError`/`getErrorMessage`, reproducing the BE's `ErrorView`; unit-test plain-text, flat-JSON, nested `{error:{message}}`, and empty bodies
- [x] 1.3 Create `src/server/core/bucket-api.ts` — `getBucket(token)` → `GET /v1/bucket` returning the user bucket id
- [x] 1.4 Create `src/server/core/files-core-api.ts` — `getFileMetadata(token, path)` → `GET /v1/metadata/files/{path}?recursive&token&permissions`; `uploadFile(token, path, file)` → `PUT /v1/files/{path}` (multipart, OVERRIDE)
- [x] 1.5 Create `src/constants/publications-core.ts` — Core endpoint paths (`/v1/ops/publication/*`), resource prefixes, `publications/public/`, `PUBLICATIONS_PREFIX`, `PUBLICATION_NOT_FOUND_STATUSES`, `publications_updates/` folder
- [x] 1.6 Instantiate the Core-backed clients in `src/app/api/api.ts`
- [x] 1.7 Specs for the Core client methods (URL built, token forwarded, response parsed) per `.claude/rules/testing.md`

## 2. Deterministic helpers (pure utils)

- [x] 2.1 Create `src/server/publications/path.ts` — strip `{prefix}`, decode path, `__` name/version split, `buildEncodedPath(folderId,name,version)` (per-segment encode), `ensureTrailingSlash`, `encodeFolderPath`
- [x] 2.2 Create `src/server/publications/sanitize-comment.ts` — strip all HTML tags → plain text (Jsoup `Safelist.none()` parity)
- [x] 2.3 Create `src/server/publications/resolver/url-resolver.ts` — status×action → review/target/source URL (D4 table)
- [x] 2.4 Unit tests for §2.1–2.3 covering positive, negative/edge, and missing-param fallbacks (chase branch coverage — these are the highest-risk bits)

## 3. Resolver registry + publication mappers

- [x] 3.1 Create `src/server/publications/resolver/types.ts` — `PublicationTypeConfig` interface + `EnrichmentClients` (injected to avoid circular import)
- [x] 3.2 Create `src/server/publications/resolver/registry.ts` — one config per resource type (prefix, resourceKey, assetKey, hasFiles, issue messages); enrichment delegates injected via `EnrichmentClients` → `assetsApi`
- [x] 3.2a (R4) Enrichment fetch via `assetsApi.getAssetWithEtag` sends `DEFAULT_ETAG` ('*') — confirmed the FE pattern returns the merged shape (200 + `res.response`); a 404 → not-found issue; existing target (200) → already-exists issue
- [x] 3.3 Create `src/server/publications/resolver/resolve.ts` — shared resolve flow: per-resource URL resolution, enrichment + issue collection, target-exists check (only PENDING is ever resolved)
- [x] 3.4 Create `src/server/publications/resolver/file-resource.ts` — staging upload to `{bucket}/publications_updates/`, build `ADD_IF_ABSENT` resources; file metadata enrichment via `files-core-api`
- [x] 3.5 Create `src/server/publications/mappers.ts` — Core publication DTO ↔ FE `Publication` (publication-level): prefix handling, resource-type resolution, action derivation, target-folder decode, rule mapping
- [x] 3.6 Specs for resolve (per-type enrichment, issue collection on not-found/already-exists) and helpers — covered in `core-publications-api.spec.ts` + §2 specs

## 4. Rewrite PublicationsApi against Core (flag-gated)

Implemented as `CorePublicationsApi` (drop-in for `PublicationsApi`) rather than editing the BE class, so the flag swaps the whole instance in `api.ts`.

- [x] 4.1 `getPublication*List` → `POST /v1/ops/publication/list` (body `url:"publications/public/"`) + resource-type filter
- [x] 4.2 `getPublication` → `POST /v1/ops/publication/get` (prefix `publications/`); APPROVED/REJECTED → not-found; run resolver enrichment (§3)
- [x] 4.3 `approvePublication` → `POST /v1/ops/publication/approve`
- [x] 4.4 `declinePublication` → sanitize comment (§2.2) → `POST /v1/ops/publication/reject`
- [x] 4.5 `deletePublication` → `POST /v1/ops/publication/delete`
- [x] 4.6 `updatePublication` → two waves (D6): file staging upload, target-URL recalc, `POST /v1/ops/publication/update`, then per-resource re-PUT via `assetsApi`
- [x] 4.7 N/A — the FE's rules consumer is `foldersApi.getRules` (admin BE `GET /api/v1/folders?path=`, an assets/folders-domain endpoint), **not** Core's `publication/rule/list`. Like `createPublication`, that Core endpoint is unused by this FE, so rules stay on the BE in Phase 1 (migrate with assets). See proposal non-goals.
- [x] 4.8 Gate on `PUBLICATIONS_USE_CORE` in `api.ts`: flag off → `PublicationsApi` (BE) unchanged; flag on → `CorePublicationsApi`
- [x] 4.9 `core-publications-api.spec.ts` covers the Core path (list filter/map, get not-found + enrichment + issues, approve/reject(sanitize)/delete URLs+body, update recalc + per-resource PUT); BE path stays covered by `publications-api.spec.ts`; toggle covered by `get-publications-toggle.spec.ts`

## 5. Parity verification

- [ ] 5.1 (runtime gate — needs a live Core) With the flag on, exercise list/get/approve/reject/delete/update for all 5 types against a real Core (non-prod) and diff the resulting `Publication` against the BE path
- [ ] 5.2 (runtime gate — R3) Trigger a Core 400/404/403/409 and confirm `ServerActionResponse.errorMessage/errorHeader` match the BE path (real message preserved); confirm Core's actual error body format
- [ ] 5.3 (runtime gate — R4) Confirm `assetsApi` (with `DEFAULT_ETAG`) accepts the FE-style paths from `path.ts` and returns the expected merged shape for every type
- [x] 5.4 Run the targeted specs from §1–§4 via `vitest run` from `apps/ai-dial-admin/` — 49 passing
- [x] 5.5 Run `openspec validate migrate-publications-to-core-api --strict` — valid

## 6. Phase 2 (separate change `migrate-publications-enrichment-to-core` — do not implement here)

- [ ] 6.1 After the assets→Core migration lands the Core asset client + content/metadata mapper layer, repoint the registry fetch/put/exists delegates from `assetsApi` to those Core clients and remove the feature flag (tracked in `migrate-publications-enrichment-to-core`)
