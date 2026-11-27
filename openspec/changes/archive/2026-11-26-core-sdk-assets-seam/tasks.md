## 1. Checks that gate the work

- [x] 1.1 Confirm that no `getContent` / `getMetadata` caller tells `null` from `undefined` (`platform-catalog-schemas/actions.ts`, `server/assets/exim.ts`, `server/config-entities/read.ts`, `server/folders/folders-core.ts`, `AssetApi.list` / `getMerged`); the widening is a type correction only (design D3), so any caller found comparing `=== null` is recorded in `design.md` D3 and fixed here
- [x] 1.2 Write the failing specs first against the real SDK (`CORE_TEST_URL`) in `server/core/tests/core-api-sdk.spec.ts`: `DELETE` with an empty `200`, an empty `204`, a JSON body (stays text), a `200` body carrying an `error` field (stays a success with the text) and a `412`; and the `304` pin (design D5): equality between the SDK path and the hand-written path plus the literal envelope, with the mock built as `new Response(null, { status: 304 })` sending `etag` and `traceparent`, and a value-path case where `getContent` with an etag resolves `null`. **If the `304` envelopes differ, fix the adapter in this PR and note it in `design.md`**
- [x] 1.3 Re-run on the installed SDK (`^0.3.1`; a first probe is in the umbrella design) a probe showing that `getModelByPath` / `getModelMetadata` / `saveModel` / `deleteModel` emit the same method, path and query as today's hand-written `AssetApi` for a plain name, and for the metadata read also for an empty path (root listing) and a path ending in `/`; record the result in `design.md` D2, and if the SDK drops either trailing `/`, make the `MODEL` metadata closure restore it (3.1)

## 2. Adapter

- [x] 2.1 `core/core-api.ts`: add `sdkDelete` beside `sdkAction` sharing one private implementation with a raw-body flag (design D4); `DELETE` success returns the response text, `''` when empty, and skips the `error`-field check
- [x] 2.2 Specs from 1.2 pass, and the existing `core-api-sdk.spec.ts` cases still pass

## 3. Op table and routing

- [x] 3.1 New `server/core/asset-sdk-ops.ts` with `ASSET_SDK_OPS` and the `MODEL` row (closures for content get, metadata get, save, delete over `getModelByPath`, `getModelMetadata`, `saveModel`, `deleteModel`, bucket `platform`); the `AssetSdkOps` type goes in the existing `server/core/models.ts` beside `CoreSdkCall`
- [x] 3.2 `AssetApi`: route `getMetadata`, `getContent`, `getMergedWithEtag`, `put` and `delete` through the row when present, else the existing code; encode with `encodeCorePath` once per verb; `resolveListPath` for the metadata read only; pass the metadata query as `{ recursive, token?, limit? }` in that order with `recursive` always set (design D2); keep `list`, `getMerged`, `withContentId`, the `_metadata` graft, `createHeadersForCreate` and the etag helpers as they are; `delete` calls `sdkDelete`
- [x] 3.3 `constants/assets-core.ts`: make both URL maps `Partial<Record<ResourceType, string>>`, delete the `MODEL` entries, move the unreachable-entries note with the maps and correct it to name `FILE` beside `SKILL` / `PROJECT` (the entries stay until umbrella PR 5), and add the `resourceUrl(type)` guard in `AssetApi` that throws a message naming the type
- [x] 3.4 Widen `getContent` and `getMetadata` to `… | null | undefined`, documented once on a private helper; fix any caller recorded in 1.1, and correct the comment in `server/config-entities/read.ts` that says a `403` collapses to `null`

## 4. Tests

- [x] 4.1 `server/core/tests/asset-api-model.spec.ts` (new; the existing `asset-api.spec.ts` keeps the non-model cases, with its flat-platform strip cases re-pointed at `ROLE`): model cases through the real SDK (`fetch.mock.calls[i][0]` is a `Request`): content get, a single model's metadata get (`…/models/platform/{name}?recursive=false`), the root listing with `recursive` and `token`, create (`If-None-Match: *`), update (`If-Match`), delete (`If-Match`), `getMergedWithEtag` (etag from metadata), `getMerged`, and `list` pagination; keep the non-model cases on the string-URL assertions
- [x] 4.2 New `server/core/tests/asset-sdk-ops.spec.ts`: the path-encoding fixture through `AssetApi` for names with `100%`, `a+b`, `q?x#y`, an existing `%20` (sent as `%2520`), a space, non-ASCII and a nested `/` (SDK 0.3.1 leaves `%`, `+`, `?` and `#` raw, so only the `encodeCorePath`-first path keeps the URL), asserting the exact request URL for read, save and delete against the hand-written client's URL; the metadata query string: exact equality with the hand-written `URLSearchParams` string for a token of `+ / =` and non-ASCII, and equal decoded parameters for a token with a space or `~ ! ' ( )` (the SDK writes `%20` and leaves `~ ! ' ( )` raw; same value); a content/put/delete path starting with `platform/` is not stripped and a metadata path is; a metadata read with an empty path and with `platform/` both request `…/models/platform/?recursive=false`, and one with a path ending in `/` keeps the trailing `/`, each equal to the hand-written URL
- [x] 4.3 `403` and failure specs: model content and metadata reads resolve `undefined` on `403` and `null` otherwise, on the SDK path and the hand-written path alike; an unrouted type, called as `'unknown-type' as ResourceType` (no module mock), throws the guard error; a type with no row yet (a role) still uses the hand-written URL
- [x] 4.4 Regression net: run `app/[lang]/platform-models` specs, `app/api/tests/publications-enrichment.spec.ts`, `server/assets` specs and `server/folders` specs; where a spec uses the real exported API object, stub `DIAL_CORE_API_URL` to `CORE_TEST_URL` with `vi.stubEnv` in `beforeAll`

## 5. OpenSpec bookkeeping

- [x] 5.1 After archive, confirm `core-client` names the model asset operations, has the `DELETE` scenarios and the dispatch requirement, and `core-asset-client` has the SDK scenario; no browser-verification task is added because every scenario's THEN is a request, a body, an envelope or a resolved value, not UI state
- [ ] 5.2 Once this PR is merged, tick task 2.1 of the umbrella `core-sdk-assets` and note that #5642 is closed by this PR

## 6. Gates

- [x] 6.1 From `apps/ai-dial-admin/`: `npx vitest run src/server src/app/api`, then `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, `npm run lint:specs` and `npx prettier --check <touched files>`; check `git ls-files --eol` for `w/crlf` and scan changed files for invalid UTF-8 (comments ASCII)
- [x] 6.2 Run the full `npm run test` in the background as the final gate; rerun `EditableCellRenderer.spec.tsx`, `RequestsSidebar.spec.tsx` and `publications-enrichment.spec.ts` alone before treating a failure as real
