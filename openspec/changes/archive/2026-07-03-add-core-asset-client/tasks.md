## 0. Prerequisite reading (not implementation)

- [x] 0.1 Read `src/server/core/core-api.ts`, `bucket-api.ts`, `files-core-api.ts`, `error.ts` (Phase 1 publications) to reuse the existing Core request/error pipeline rather than duplicating it
- [x] 0.2 Read `src/server/publications/path.ts` and `sanitize-comment.ts` for the established pattern of porting one BE helper instead of its duplicates
- [x] 0.3 Decide file/module layout: **reuse `src/server/publications/path.ts` directly** (it already implements every version/path helper this change needs, verbatim to design D2 — no duplicate file created); new asset-client code lives under `src/server/core/` (`asset-headers.ts`, `asset-metadata.ts`, `asset-api.ts`) plus `src/constants/assets-core.ts`; `files-core-api.ts` is **extended in place**, not superseded

## 1. Version-path helper (design D2)

- [x] 1.1 `extractNameAndVersion` — already implemented in `src/server/publications/path.ts` using `lastIndexOf('__')`; reused as-is, not duplicated
- [x] 1.2 `getVersionedName` — already implemented in `path.ts` (blank/missing version returns `name` unchanged); reused as-is
- [x] 1.3 `buildEncodedPath` — already implemented in `path.ts`; reused as-is
- [x] 1.4 `parseVersionedPath`/`parseEncodedVersionedPath` — already implemented in `path.ts`; reused as-is
- [x] 1.5 Unit tests already exist and pass in `src/server/publications/tests/path.spec.ts` (last-`__`-occurrence, blank-version-as-absent, build/parse round trip) — no new tests needed for this reused module

## 2. Conditional-header helpers (design D4, D5)

- [x] 2.1 Implemented `createIfMatchHeaders(etag)` / `createIfNoneMatchHeaders(etag)` in `src/server/core/asset-headers.ts` — empty object when etag is `null`/`'*'`, else the real header, reusing `IF_MATCH`/`IF_NONE_MATCH`/`DEFAULT_ETAG`
- [x] 2.2 Implemented `createHeadersForCreate(allowOverride, etag)` in `src/server/core/asset-headers.ts`
- [x] 2.3 Unit tests in `src/server/core/tests/asset-headers.spec.ts` — passing (6/6)

## 3. Asset type registry and generic client (design D1, D3, D7)

- [x] 3.1 Defined `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`/`DEFAULT_LIST_PATH_TYPES`/`DEFAULT_LIST_LIMIT` in `src/constants/assets-core.ts` (reuses existing `RESOURCE_TYPE_PREFIX` from publications rather than a new per-type config object)
- [x] 3.2 Implemented the generic client `AssetApi` (`src/server/core/asset-api.ts`): `getContent`, `getMetadata`, `list`, `getMerged`, `put`, `delete`, dispatching via `ResourceType`
- [x] 3.3 Default path/limit injection wired in `getMetadata`/`resolveListPath`, gated by `DEFAULT_LIST_PATH_TYPES` (conversation + prompt only)
- [x] 3.4 Unit tests in `src/server/core/tests/asset-api.spec.ts` — 9/9 passing (path/segment per type, conditional headers, default path/limit gating, list flattening, content+metadata merge, put/delete precondition headers)

## 4. Content+metadata mappers (design D3)

- [x] 4.1 `mergeApplicationResource` in `src/server/core/asset-metadata.ts` — metadata-sourced (`name`, `folderId`, `updatedAt`, `author`, `version`, `path`) + content passthrough for everything else (`endpoint`, `viewerUrl`, `editorUrl`, `maxInputAttachments`, `routes`, `description`, etc.)
- [x] 4.2 `mergeToolsetResource` — same pattern minus `routes`
- [x] 4.3 `mergeConversation` — same pattern
- [x] 4.4 `mergePrompt` — same pattern, plus `nodeType: ITEM` (prompt extends `DialFile`); uses the shared `parseEncodedVersionedPath` from `publications/path.ts`, not a re-copied inline parser
- [x] 4.5 Unit tests in `src/server/core/tests/asset-metadata.spec.ts` — 6/6 passing, one fixture-diff case per type plus `toResourceInfoList` ITEM/FOLDER filtering

## 5. File asset client (design D1 outlier, D5 bugfix)

- [x] 5.1 File metadata GET already existed (`FilesCoreApi.getFileMetadata`, Phase 1 publications work) — `contentType`/`contentLength`, no version parsing; reused as-is
- [x] 5.2 Streamed content GET added (`downloadFile`); PUT already existed (`uploadFile`)
- [x] 5.3 Added `deleteFile(token, path, etag)` to `FilesCoreApi` — rejects (via `Promise.reject`, not a sync throw) before calling Core if etag is falsy; always sends `If-Match` otherwise
- [x] 5.4 Unit tests in `src/server/core/tests/files-core-api-delete.spec.ts` — 2/2 passing (missing-etag rejection with no fetch call made; concrete-etag sends `If-Match`)

## 6. Shared validation for application-resource fields (design D6)

- [x] 6.1 `validateApplicationResourceFields` in `src/server/core/asset-validation.ts` — endpoint-format check (`isValidEndpointUrl`, approximating the BE's `EndpointValidator`) + positive/max-1000 range check (`isValidMaxInputAttachments`); one function usable by both create and update payloads (no separate create-only path)
- [x] 6.2 Unit tests in `src/server/core/tests/asset-validation.spec.ts` — 7/7 passing

## 7. Quality checks

- [x] 7.1 Ran `npm run lint` and `npm run format` from repo root — one real error (`no-useless-escape` in `asset-validation.ts`) fixed; `prettier --write` applied to one test file; all other lint warnings are pre-existing and unrelated to this change
- [x] 7.2 Ran `vitest run` for all new specs (`src/server/core/tests/*`) — 40/40 passing; full-repo `vitest run --coverage` run as the final gate
- [x] 7.3 `openspec validate add-core-asset-client --strict` — passes: "Change 'add-core-asset-client' is valid"

<!--
No browser-verification task: this change adds a server-side client, mapper, and helper layer with no consumer wired to any view, route, or server action yet. Every requirement's scenarios describe request shape, header behavior, and merged-object shape — none has a browser-observable THEN (no UI element, navigation, or rendered text changes as a result of this change). Verification is unit tests only; browser verification belongs to the per-type follow-up changes that actually wire a view to this client.
-->
