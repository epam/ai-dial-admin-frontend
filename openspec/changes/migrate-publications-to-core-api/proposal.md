## Why

The admin BE (`ai-dial-admin-backend`, the Spring `cfg` service) is being deprecated; its logic must move into this frontend. Today **every** FE server API points at `DIAL_ADMIN_API_URL` — there is no direct FE→DIAL-Core path. Publications is the pilot slice for cutting that path.

The BE is not a thin proxy. The publication controller is thin, but `PublicationService` + 5 per-type **resolvers** + 2 **mappers** add behavior that the FE never sees and must not lose: a hardcoded `publications/public/` list path, treating APPROVED/REJECTED as 404 on `get`, status-driven source/target/review URL resolution, per-resource "target already published" checks, graceful issue collection, file staging uploads to a `publications_updates/` bucket folder, target-URL recalculation, comment HTML-sanitization on reject, and per-segment URL/version path encoding.

## What Changes

Introduce the **first direct FE→DIAL-Core client** and re-implement the publication server logic in TypeScript, behind a feature flag with fallback to the existing BE proxy.

- **New Core client layer** (`src/server/core/`): a `BaseApi` subclass pointing at a new `DIAL_CORE_API_URL`, forwarding the user's JWT as `Bearer` (matching the BE's default `core.auth.method=token`). Adds `bucket-api` (`GET /v1/bucket`) and `files-core-api` (`GET /v1/metadata/files/{path}`, `PUT /v1/files/{path}`).
- **Rewrite `PublicationsApi`** to call DIAL Core `/v1/ops/publication/*` directly for all publication-native operations (list, get, approve, reject, delete, update), reproducing every BE-side transformation.
- **New `src/server/publications/` module** holding the ported logic as small, deterministic, testable units: a **config-driven resolver registry** (one config per resource type instead of 5 near-duplicate classes), status→URL resolver, prefix/decode/`__`-version path parsing, issue collection, target-exists checks, and a comment sanitizer (replacing Jsoup `Safelist.none()`).
- **Phase 1 enrichment seam:** `get` resolves the *bare* publication from Core, then enriches each resource's body (application/conversation/prompt/toolset content) and re-PUTs on `update` by **reusing the still-alive admin-BE asset endpoints** (`assetsApi`) rather than porting the 5 Core resource mappers now. File metadata + staging upload go to Core directly. This isolates the only genuinely high-risk port (Core resource shape-mapping + versioned-path/encoding, which has zero FE precedent) to Phase 2, when each asset domain migrates off the BE.
- **Hard cutover, no fallback.** Publications call DIAL Core unconditionally; the old BE-backed `PublicationsApi` is **removed**. `DIAL_CORE_API_URL` is required for Publications. Server actions, components, routes, models, and the FE-facing `Publication` shape are **unchanged** — this is a server-internal cutover.

## Capabilities

### New Capabilities
- `publications-core-api`: Server-side publication operations executed directly against DIAL Core (with the BE's hidden transformations preserved), replacing the BE-backed client outright, while the FE-facing publication contract and UI stay identical.

### Modified Capabilities
<!-- None at the spec level — the publication views/actions consume the same Publication shape and ServerActionResponse as before. This change is an internal re-routing of where the server fetches/mutates data. -->

## Impact

- **New code:**
  - `src/server/core/core-api.ts` — Core `BaseApi` (`DIAL_CORE_API_URL`, Bearer JWT)
  - `src/server/core/bucket-api.ts`, `src/server/core/files-core-api.ts`
  - `src/server/publications/resolver/` — base + `registry.ts` + `types.ts` (config-driven per-type behavior)
  - `src/server/publications/mappers.ts` — Core DTO ↔ `Publication` model transforms (publication-level)
  - `src/server/publications/path.ts` — prefix strip, URL decode/encode-per-segment, `__` version parse, trailing-slash rules
  - `src/server/publications/sanitize-comment.ts` — strip-all-HTML (replaces Jsoup)
  - `src/constants/publications-core.ts` — Core endpoint paths, prefixes, `publications/public/`, status sets
  - `src/server/entities/core-publications-api.ts` — `CorePublicationsApi`, the direct-to-Core publication client
  - `src/server/publications/update.ts` — update payload + per-resource PUT plan
- **Removed code:**
  - `src/server/entities/publications-api.ts` (+ its spec) — the BE-backed publication client, replaced by `CorePublicationsApi`
- **Modified code:**
  - `src/app/api/api.ts` — `publicationsApi` is now `CorePublicationsApi` (host `DIAL_CORE_API_URL`)
  - `.env.template`, `README.md` — document `DIAL_CORE_API_URL` (required for Publications)
- **External dependency:** DIAL Core `/v1/ops/publication/*`, `/v1/bucket`, `/v1/files`, `/v1/metadata/files` (same endpoints the BE calls today).
- **Auth:** forwards the logged-in user's JWT (the user is a full admin for these ops); no service credential introduced.

## Non-goals

- **Phase 2 (separate change `migrate-publications-enrichment-to-core`):** routing `get`-enrichment and `update`'s per-resource PUT through Core, removing the last BE dependency. It consumes the Core asset client + content/metadata mapper layer built by the upcoming **assets→Core migration** (the next initiative after this one), rather than re-building the mappers.
- `createPublication`: exists on the BE but is **not** wired into this FE (admins review/approve, never create here) — not ported.
- **Folder rules (`getRules`)**: the FE's rules consumer is `foldersApi.getRules` (admin BE `GET /api/v1/folders?path=`, a folders/assets-domain endpoint) — *not* Core's `publication/rule/list`, which is unused by this FE. Rules stay on the BE in Phase 1 and migrate with assets.
- No change to the publication UI, routes, server-action signatures, `Publication` model, rules-compare UX, or i18n.
- Migrating any **other** entity off the BE (models, adapters, assets, etc.) — publications only.
- Removing/altering the admin BE itself.
