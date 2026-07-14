## Context

The admin BE will be removed; its logic moves into this FE. Publications is the first slice. Reverse-engineering the BE (`com.epam.aidial.cfg`) shows the controller (`/api/v1/publications/*`) is thin, but the work lives in `PublicationService` + 5 per-type resolvers (`{Application,Conversation,Prompt,ToolSet,File}PublicationResolver`) + mappers (`PublicationClientMapper`, `CoreMetadataUtils`, per-type `*ClientMapper`). Those call DIAL Core `/v1/ops/publication/*` and, during `get`/`update`, the per-resource Core endpoints.

Current FE chain: browser → FE server action → `PublicationsApi extends BaseApi` (host `DIAL_ADMIN_API_URL`) → BE → Core. The FE already obtains the user JWT (`getUserToken`) and sends `Authorization: Bearer`. The BE's default `core.auth.method=token` forwards that same JWT to Core — so the FE can hit Core directly with the token it already has (confirmed with the team).

## Goals / Non-Goals

**Goals**
- A direct FE→Core path for all publication-native operations, preserving every BE-side transformation and side effect.
- The publication UI, routes, server-action signatures, and `Publication` model stay byte-for-byte the same — a server-internal cutover.
- ~~A feature flag with safe fallback to the BE proxy for rollout~~ — superseded by D2 during design: shipped as a hard, unconditional cutover instead (corrected at archive time).
- Reusable, config-driven per-type logic (the 5 types are ~90% identical), with small deterministic helpers that are cheap to unit-test.

**Non-Goals**
- Porting the 5 Core resource *content* mappers + versioned-path/shape logic (Phase 2).
- `createPublication` (unused by this FE).
- Touching any other entity or the BE itself.

## The cutover map

```
Operation                         Phase 1 target
────────────────────────────────  ───────────────────────────────────────────────
list                              Core  POST /v1/ops/publication/list  (body url="publications/public/")
get (bare publication)            Core  POST /v1/ops/publication/get
  └─ per-resource enrichment      BE    assetsApi.getAsset(path,type)         ← reused, Phase 2 → Core
approve                           Core  POST /v1/ops/publication/approve
reject                            Core  POST /v1/ops/publication/reject       (comment HTML-stripped first)
delete                            Core  POST /v1/ops/publication/delete
rule/list                         Core  POST /v1/ops/publication/rule/list
update (publication-level)        Core  POST /v1/ops/publication/update
  ├─ file staging upload          Core  GET /v1/bucket → PUT /v1/files/{bucket}/publications_updates/...
  ├─ file metadata                Core  GET /v1/metadata/files/{path}
  └─ per-resource re-PUT          BE    assetsApi.updateAsset(...)            ← reused, Phase 2 → Core
```

## Decisions

### D1 — New Core client layer, separate from the BE-facing `BaseApi`
Add `src/server/core/core-api.ts` extending `BaseApi` with `host: DIAL_CORE_API_URL`. It inherits the existing JWT-Bearer header logic (`getApiHeaders`/`getAuthorizationHeader`) and error handling unchanged. `bucket-api.ts` and `files-core-api.ts` extend it. Keeping a distinct client (vs. overloading the admin one) makes the BE→Core seam explicit. New env var `DIAL_CORE_API_URL` (required for Publications).

### D2 — Hard cutover; the BE publication client is removed
No feature flag. `CorePublicationsApi extends CoreApi` implements the same surface as the old `PublicationsApi` and is wired in `api.ts` as `publicationsApi` unconditionally; the BE-backed `PublicationsApi` (and its spec) are deleted. Server actions, components, routes, and the `Publication` model are unchanged — they call the same `publicationsApi` export. Enrichment still reuses the live admin BE (`assetsApi`) in this phase; that BE dependency is removed in Phase 2.

### D3 — Config-driven resolver registry instead of 5 classes
The BE has one resolver class per type that differ only in: resource prefix (`applications/`, `conversations/`, `prompts/`, `toolsets/`, `files/`), `applicableResourceTypes` (`{X, FILE}`), whether the type carries attached files, and the resource-content fetch/map/PUT/exists calls. Model this as:

```ts
interface PublicationTypeConfig {
  resourceType: ResourceType;
  prefix: string;
  applicableTypes: ResourceType[];
  hasFiles: boolean;
  fetchResource(core, beAssets, path, token): Promise<ResourceBody>;   // Phase 1 → beAssets
  putResource(core, beAssets, body, token): Promise<void>;             // Phase 1 → beAssets
  existsAtTarget(core, beAssets, targetPath, token): Promise<boolean>;
  toPublicationResource(coreResourceDto, body): PublicationEntity;
}
```

`registry.ts` is a `Record<ResourceType, PublicationTypeConfig>`; the resolver core (shared base) handles status→URL resolution, issue collection, applicable-type guard, and path parsing once. File is the outlier (staging upload, no PUT-back, appears as a *secondary* resource on app/conv/toolset) and is handled by a dedicated file helper the configs delegate to.

### D4 — Status-driven URL resolution (ported verbatim from `PublicationResourceUrlResolver`)
Per resource, choose the URL by `action` × `status`:

| action | PENDING | APPROVED | REJECTED |
|---|---|---|---|
| ADD / ADD_IF_ABSENT | reviewUrl | targetUrl | sourceUrl |
| DELETE | targetUrl | targetUrl | targetUrl |

This URL is then prefix-stripped + decoded + version-parsed to the FE-style path the asset endpoints expect.

### D5 — `get` semantics preserved
- `list`: body path is hardcoded `publications/public/`; filter the returned publications by resource type (priority resolver order APP→CONV→PROMPT→TOOLSET→FILE).
- `get`: prefix path with `publications/`; if Core returns status APPROVED or REJECTED, surface **404/not-found** (BE's `PUBLICATION_NOT_FOUND_STATUSES`). Then enrich: for each resource, resolve URL (D4), fetch the body (Phase 1: `assetsApi`), and on PENDING + non-DELETE run the **target-exists** check; catch not-found / already-exists into `resourceIssues[]` instead of failing the whole request.

### D6 — `update` semantics preserved (two waves)
1. If files were added: `GET /v1/bucket`, upload each to `{bucket}/publications_updates/` via `PUT /v1/files/{path}` with OVERRIDE; build `FilePublicationResource` entries with `action=ADD_IF_ABSENT`, `sourceUrl=files/{bucket}/publications_updates/{name}`, `targetUrl=files/{folderId}/{name}`; merge with existing resources.
2. Recalculate every resource's `targetUrl` from the (trailing-slashed) `folderId` + name + version, per-segment encoded.
3. `POST /v1/ops/publication/update` with the rebuilt publication DTO.
4. Per-resource re-PUT (no etag) — Phase 1 via `assetsApi.updateAsset`.

### D7 — Reject comment sanitization
BE runs `Jsoup.clean(comment, Safelist.none())` → strips all tags, keeps text. Port as a small `sanitizeComment` (strip tags / decode entities to plain text) so saved comments match BE output. Done server-side before the Core call.

### D8 — Path & encoding helpers (`path.ts`)
Centralize: strip `{prefix}` from a Core URL; `UrlUtil.decodePath` equivalent; `__`-separated `name`/`version` split; `buildEncodedPath(folderId, name, version)` that encodes each `/`-segment individually; `ensureTrailingSlash`; `encodeFolderPath` for rule-list requests. These are the deterministic, branch-heavy bits — covered hard by unit tests per `.claude/rules/utils.md`.

## Risks / open questions

- **R1 (Phase 2 risk, deferred):** Core resource shape-mapping has no FE precedent — the BE always merged content + metadata DTOs and parsed versioned paths. Phase 1 sidesteps it by reusing `assetsApi`. Validate field-by-field when Phase 2 starts.
- **R2:** `DIAL_CORE_API_URL` must be reachable from the FE server runtime (it is, in deployments where the BE reaches Core). Confirm network topology per environment before flipping the flag.
- **R3 — RESOLVED (real gap, fix scoped):** The FE parser (`utils/api/error.ts`) only understands flat JSON `{message,error,status}` and degrades any non-JSON body to a generic message. Today the BE hides this: `FeignErrorDecoder` + `DefaultExceptionHandler.handleFeignClientError` flatten Core's (plain-text or minimal-JSON) body into an `ErrorView` `{error,message,status}`. Direct-to-Core would therefore **lose Core's real error text** (e.g. a 400 "Target file already exists" → "Request error"). **Decision (D9):** `CoreApi` overrides response/error handling to normalize any Core error body — text or JSON — into `{ error: <status reason>, message: <core text / nested message>, status }` before `getError`/`getErrorMessage`/`handleResponse`, reproducing `ErrorView`. Unit-test plain-text, flat-JSON, nested `{error:{message}}`, and empty bodies.
- **R4 — RESOLVED (compatible, one wrinkle):** Confirmed against `PromptsController` (conversation/toolset/application controllers mirror it): the admin asset `/get` takes `ResourcePathDto { path }` where `path` is the decoded, prefix-stripped, `__`-versioned form — exactly what `path.ts` (D8) produces (the BE derived it via the same `parseEncodedVersionedPath`). The returned DTO is the already-merged content+metadata shape the FE models expect, so it drops straight into the `Publication*` resource wrapper — no Core metadata parsing in Phase 1. **Wrinkle:** asset `/get` makes `If-None-Match` a **mandatory** header; the plain `assetsApi.getAsset` omits it and would 400. The enrichment reuse MUST send an etag (e.g. `DEFAULT_ETAG`). Captured as a task.

### D9 — Core error normalization in `CoreApi`
See R3. `CoreApi` wraps Core's error body into the `{error, message, status}` ErrorObject the FE already consumes, so `ServerActionResponse.errorMessage/errorHeader` and the list/get null-degradation keep working identically to the BE path.

## Migration / rollout

Ship plumbing + flag off → enable in a non-prod env → compare list/get/update/approve/reject/delete against the BE path → enable in prod → schedule Phase 2 → remove flag + BE calls.
