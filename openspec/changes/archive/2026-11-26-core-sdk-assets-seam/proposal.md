## Why

PR 1 of the Phase 4 umbrella `core-sdk-assets` (#5634, epic #5629; decisions D1-D9 live in the umbrella `design.md`).
`AssetApi` builds `v1/{prefix}/{path}` URLs for every `ResourceType`, while the SDK has one operation per type and verb.
This change builds the dispatch seam and proves it end to end on one type, `MODEL`, before eight more flat types follow as
table rows. It also carries the two adapter fixes the first SDK-backed asset write needs: `DELETE` responses (#5642) and an
equivalence pin for a `304` on a conditional read.

## What Changes

- New op table beside `asset-api.ts`: for each mapped `ResourceType`, one typed closure per verb (content get, metadata get,
  save, delete) and its bucket/path rule. This PR registers `MODEL`:
  `getModelByPath(bucket, path)`, `getModelMetadata(bucket, path)`, `saveModel(bucket, path)`, `deleteModel(bucket, path)`
  with bucket `platform`.
- `AssetApi.getMetadata`, `getContent`, `getMergedWithEtag`, `put` and `delete` route a type that has a row through
  `sdkGet` / `sdkAction` and keep the hand-written URL for any type that does not. `list`, `getMerged`, the merge functions,
  `fetchAllPages`, the prompt `id` injection, the `put` `_metadata` graft and the etag header helpers are unchanged. `move`
  stays hand-written (umbrella PR 5).
- URLs and query parameters are byte-identical to today: the table passes `encodeCorePath(path)` as the SDK path parameter
  because SDK 0.3.1 only encodes a space and non-ASCII letters and leaves `%`, `+`, `?` and `#` raw, so a raw name would
  change the URL; an encoded path goes through unchanged. Only `getMetadata` strips a leading `platform/`; content get, put
  and delete do not. An empty path (the root listing) and a folder path's trailing `/` reach Core as they do today; the
  fixture spec pins both, and if the SDK drops either the `MODEL` row builds that path itself.
- `CORE_RESOURCE_URL` and `CORE_RESOURCE_METADATA_URL` become `Partial<Record<ResourceType, string>>`; the `MODEL` rows are
  deleted, and a lookup for a type with neither an SDK row nor a URL throws a clear error.
- `AssetApi.getContent` and `getMetadata` widen to `… | null | undefined`. Both paths already resolve a 403 to `undefined`
  (`BaseApi.sendRequest` returns `void 0`, `sdkGet` mirrors it); today's `T | null` type only hides it, so the widening makes
  the type honest and changes no runtime behavior. Every caller already treats both values the same (`!node`,
  `Boolean(node)`, `?.`). `getMergedWithEtag` returns an envelope and does not widen.
- **Adapter fix (#5642):** a `DELETE` success body is returned as the raw response text (`''` when empty, `204` included),
  exactly as the hand-written `BaseApi` does. The adapter already gets `''` for an empty `200` and a `204` on SDK 0.3.1; the
  change is that a JSON body is no longer parsed into an object. Because the body stays text, the "2xx body with an `error`
  field is a failure" rule does not apply to a `DELETE`, as in the hand-written client.
- The `304` outcome of a conditional read is pinned equal on the SDK path and the hand-written path, and also pinned to a
  literal envelope so the pin survives once no hand-written reference type is left.
- `ResourceType.ROLE`'s stale "read-only" comment is not touched here (PR 2 owns `ROLE`).

**Non-goals:** every type but `MODEL`; `move`, `list` and merge changes; the admin-DTO cleanup for models (nothing in the
`MODEL` content DTO is purely duplicated by the SDK type without admin-only fields, so none is removed here and the design
records why); filing the follow-up issue for the sibling clients.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `core-client`: "Calls the SDK cannot express stay on the hand-written client" names the model asset operations as
  SDK-backed; "Envelope responses match the existing Core client" gains the `DELETE` body rule; a new requirement states
  the asset dispatch (mapped type through the SDK, unmapped type unchanged, unmapped and unrouted type fails loudly) and
  that path parameters reach Core exactly as the hand-written client sent them.
- `core-asset-client`: "Content-addressed unversioned resource support (Model)" now reads that the model content and
  metadata calls go through the SDK to the same Core endpoints; the Core-facing path is unchanged.

## Impact

- Code: `src/server/core/asset-api.ts`, new `src/server/core/asset-sdk-ops.ts` with its types in the existing
  `src/server/core/models.ts`, `src/server/core/core-api.ts` (DELETE body), `src/constants/assets-core.ts` (the `Partial`
  maps; the note on unreachable entries moves with them and now names `FILE` beside `SKILL` / `PROJECT`), and the stale comment in
  `src/server/config-entities/read.ts` that says `getMetadata` collapses a 403 to `null`. No caller's logic changes.
- Specs: `core/tests/asset-api.spec.ts` (model cases through the real SDK), new `core/tests/asset-sdk-ops.spec.ts` (path-encoding
  fixture, platform-prefix rules), `core/tests/core-api-sdk.spec.ts` (DELETE and 304); `platform-models` and `publications-enrichment`
  specs as the regression net.
- Dependencies: none.
