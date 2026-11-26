## Context

See `proposal.md` for what changes and the umbrella `openspec/changes/core-sdk-assets/design.md` for the shared decisions
(D1 op table with fallback, D2 typing, D3 byte-identical URLs, D4 bucket and path per verb, D5 DELETE and 304, D6 `Partial`
URL maps, D9 403 versus failure). This document covers only what PR 1 decides on top of them.

Current code this change touches:

- `AssetApi` (`src/server/core/asset-api.ts`): `getMetadata`, `getContent`, `getMergedWithEtag`, `put`, `delete` build a URL from
  `CORE_RESOURCE_URL` / `CORE_RESOURCE_METADATA_URL` and call `get`, `sendActionRequest` or `putAction`. `getMerged` and `list`
  sit on top of `getContent` and `getMetadata`.
- `CoreApi.sdkAction` / `sdkGet` (`core-api.ts`): `sdkAction` always runs `parseSdkBody`, which `JSON.parse`s a text body. The
  hand-written `getResponse` in `base-api.ts` returns `res.text()` for a `DELETE` and tries JSON for everything else.
- `getContent` has one external caller (`platform-catalog-schemas/actions.ts`); `getMetadata` has several (`exim.ts`,
  `config-entities/read.ts`, `folders-core.ts`, `list`). Neither reads a `403` as different from other failures today.
- The hand-written `get` already resolves a `403` to `undefined`: `BaseApi.sendRequest` returns `void 0` for it and `get` casts
  the result to `R | null`. `sdkGet` reproduces exactly that, cast included. So routing a model read through the SDK does not
  change what a `403` resolves to.
- `getMetadata` builds its query with `URLSearchParams` in the order `recursive`, `token`, `limit`, and always sends
  `recursive` (`recursive=false` when unset); `limit` is only sent for `DEFAULT_LIST_PATH_TYPES`, which does not contain
  `MODEL`.
- Model facts that the table must reproduce: bucket `platform`; the name is the bare path (the prefix `models/platform/` is part
  of the Core URL); a single model's metadata is `GET /v1/metadata/models/platform/{name}` and the root listing
  `GET /v1/metadata/models/platform/`; the metadata read strips a leading `platform/` from the requested path
  (`resolveListPath`); content, put and delete do not strip; the etag for a model comes from the metadata node
  (`RESOURCE_CONTROLLER_TYPES` does not contain `MODEL`), which `getMergedWithEtag` already handles.

## Goals / Non-Goals

**Goals:**
- A reusable table and routing that PRs 2-5 extend by adding rows, with `MODEL` proving every verb.
- No request differs from today's for a model: same URL, query, method, conditional headers, body.

**Non-Goals:**
- Any type but `MODEL`; `move`; the other `AssetApi` methods' signatures; the admin DTO cleanup (see D7).

## Decisions

### D1. Table shape and file

`src/server/core/asset-sdk-ops.ts` exports `ASSET_SDK_OPS: Partial<Record<ResourceType, AssetSdkOps>>`. `AssetSdkOps` lives in
the existing `src/server/core/models.ts`, next to `CoreSdkCall`, so constants and types stay apart per `code-standards.md`. It
holds four typed closures:

```
getContent:  (sdk, path, init)       => Promise<SDKResponse<...>>
getMetadata: (sdk, path, query, init) => Promise<SDKResponse<...>>
save:        (sdk, path, body, init)  => Promise<SDKResponse<...>>
delete:      (sdk, path, init)        => Promise<SDKResponse<...>>
```

Each closure fixes its bucket (`platform` for `MODEL`) and calls the type's operation, so `AssetApi` never sees a bucket, and the
only cast is the body passed to `save` (D2 of the umbrella). The closures are given the already-encoded path
(`encodeCorePath(path)`), so the table never encodes. Alternative: put `bucket` in the row and a generic caller; rejected because
the operations differ in parameter shape (`getPlatformRouter(bucket, path)` versus `getPlatformApplication(path)` later), so a
closure per verb is the only form every later group fits.

### D2. Routing inside `AssetApi`

Each of the five methods does `const ops = ASSET_SDK_OPS[type]`. A row routes through `this.sdkGet` (reads) or
`this.sdkAction` (`getMergedWithEtag` content read, `put`, `delete`); no row keeps the current code. `getMergedWithEtag`
keeps its sequence (content read, then metadata read, etag from metadata for non-`RESOURCE_CONTROLLER_TYPES`), so only the
transport of each step changes. `put` keeps `createHeadersForCreate`, `withContentId` and the `_metadata` graft, passing the
headers to `sdkAction`. The path parameter is built once per verb exactly as the method builds its URL today
(`resolveListPath` for the metadata read only).

The metadata closure receives its query as `{ recursive, token?, limit? }`, in that key order and with `recursive` always
present, because the SDK (openapi-fetch) serializes the query in object key order with `encodeURIComponent`. That matches
`URLSearchParams` byte for byte except for a space (`%20` versus `+`) and `~ ! ' ( )`, which decode to the same value (see
the probe result below); the fixture spec in task 4.2 pins both the exact and the decoded form.

Two path shapes the umbrella's probe did not cover: an **empty** path parameter (the root listing, reached with `''` or
`platform/` after `resolveListPath`) and a path ending in `/`. **Probed on SDK 0.3.1 (task 1.3):** `getModelMetadata('platform', '')`
requests `/v1/metadata/models/platform/?recursive=false` and `('platform', 'x/')` requests `/v1/metadata/models/platform/x/?recursive=true`,
so both survive and the closure needs no restoring; `getModelByPath`, `saveModel` and `deleteModel` emit `GET` / `PUT` / `DELETE`
`/v1/models/platform/{name}`. The fixture in task 4.2 pins all of it, so an SDK change fails a test.

**Query encoding differs for a few characters, with the same decoded value.** The same probe with the token
`ab+/=~ !'()*&?#é` gives, from the SDK, `token=ab%2B%2F%3D~%20!%27()*%26%3F%23%C3%A9` and from `URLSearchParams`
`token=ab%2B%2F%3D%7E+%21%27%28%29*%26%3F%23%C3%A9`: a space is `%20` instead of `+`, and `~ ! ( )` stay raw instead of being
encoded. Both decode to the same string, so Core reads the same token. The request is therefore **not byte-identical** for a
token containing a space or `~ ! ' ( )`; for `+ / = & ? #` and non-ASCII it is. Core's continuation tokens are opaque and
do not contain those characters in practice, so this is accepted and the fixture pins it both ways: exact string equality for
a token made of `+ / =` and non-ASCII, decoded equality for one that has the others.

### D3. Return types

`getContent` and `getMetadata` become `Promise<… | null | undefined>`, documented once on a private helper (`undefined` is a
`403`, `null` any other failure), as Phases 2 and 3 did. This is a type correction, not a behavior change: both the
hand-written and the SDK path already return `undefined` for a `403` (see Context). Callers, all of which already treat the
two values the same: `getMerged` returns `null` for either (`!content`, `!metadata`); `list` and `fetchAllPages` treat a falsy
node as the end of the pages; `platform-catalog-schemas/actions.ts` reads `$id` through optional chaining; `exim.ts`
(`Boolean(node && …)`), `config-entities/read.ts` (`!node`) and `folders-core.ts` (`Boolean(node)`, or returned to a walker
that checks truthiness) use the value truthily. No caller's logic changes; the comment in `config-entities/read.ts` that says
`getMetadata` "collapses 403/404/500 to null" is corrected to say a `403` is `undefined` and the rest `null`.

### D4. DELETE body (#5642)

`sdkAction` gains a sibling, `sdkDelete(token, call, headers)`, that shares one private implementation with a `rawBody` flag.
On SDK 0.3.1 with `parseAs: 'text'` a `DELETE` gives `data` `undefined` for a `204`, `''` for an empty `200` and the raw text
for a JSON body; `parseSdkBody` already maps the first two to `''`, so the visible difference from the hand-written client is
a JSON body being parsed into an object. With the flag set, a success `data` is returned as the response text (`''` when
empty) and `parseSdkBody` is skipped; a `text/plain` body is text on either setting, so the flag only changes a body that
would otherwise parse as JSON. Failures, `etag`, `requestId` and cancellation are unchanged. The "2xx body with an `error`
field is a failure" rule does **not** apply to a `DELETE`: the hand-written client reads the `DELETE` body with `res.text()`,
so `r.error` is never set and a `200 {"error":…}` is a success carrying that text; `sdkDelete` reproduces that by skipping
the check along with `parseSdkBody`. A flag on a sibling method, not a
sniffed HTTP method, because the SDK result carries no request method and callers already choose the verb explicitly.
Alternative: always return text for `DELETE` inside `parseSdkBody` by inspecting the response URL; rejected as implicit.

### D5. The `304` equivalence pin

One spec runs a conditional content read with `If-None-Match` (`getMergedWithEtag`) through the SDK path (`MODEL`) and through
the hand-written path (a type with no row yet; `ROLE` in this PR) against a `304`, and asserts two things: the two envelopes
are equal, and each equals the literal envelope `{ success: false, status: 304, etag, requestId, errorMessage, errorHeader }`
with the values that response produces. If the two paths differ, the SDK adapter is changed to match the hand-written one in
this PR. A probe on SDK 0.3.1 shows the SDK answers a `304` as `ok: false` with an empty error body and no data, which the
adapter normalizes like any non-2xx. A second, value-path case pins that `getContent` with an etag resolves `null` on a `304`
on both paths.

The `304` mock is built as `new Response(null, { status: 304, headers })`: a `304` is a null-body status, and some runtimes
throw when one is constructed with a `''` body. It sends both an `etag` and a `traceparent` header. The `traceparent` matters:
on a failure the hand-written envelope takes `requestId` from `res.headers.get('traceparent')`, which is `null` when the header
is missing, while `sdkAction` uses `|| undefined`; `toEqual` tells those apart. That `null` versus `undefined` difference
exists for every failure envelope, predates this change and is out of its scope, so the mock avoids it instead of the PR
"fixing" it under the 304 clause.

Each later PR re-points the hand-written side at a type still without a row. `FILE`, `SKILL` and `PROJECT` only ever reach
`move`, never a content read, so once every type that reaches a content read is routed there is no hand-written reference
left: the equality half is dropped then, and the literal-envelope half stays as the pin.

### D6. `Partial` URL maps and the guard

`CORE_RESOURCE_URL` and `CORE_RESOURCE_METADATA_URL` become `Partial<Record<ResourceType, string>>`. A private
`resourceUrl(type)` lookup in `AssetApi` throws `No Core URL or SDK operation for resource type: ${type}` when neither source
has the type. The `MODEL` entries are deleted. The note on unreachable entries moves with the maps and is corrected: it names
only `SKILL` / `PROJECT` today, but `FILE` also never reaches a content or metadata verb (only `move`). The entries
themselves stay until umbrella PR 5 deletes both maps (umbrella D6).

After this PR every real `ResourceType` still has either a row or a URL, so no real type reaches the guard. Its spec calls
`AssetApi` with a fake type (`'unknown-type' as ResourceType`), which needs no module mock and so cannot leak into another
spec file (`testing.md` §10).

### D7. Admin model DTOs

`AssetModel` / `DialModelResource` carry `_metadata` and admin-only fields, and the merge function returns them from untyped
content, so no DTO duplicates the SDK `Model` type one-to-one. Nothing is deleted in this PR; the check is recorded here so
the next groups apply the same test (does the DTO add anything beyond the SDK type?) rather than assume.

## Risks / Trade-offs

- [Widening the return type could hide a caller that now sees `undefined`] -> no runtime value changes (D3); the audit in
  task 1.1 confirms each caller is truthiness-based, and the model `403` spec pins `undefined` on both paths.
- [SDK 0.3.1 encodes only a space and non-ASCII, leaving `%`, `+`, `?`, `#` raw, so a missed `encodeCorePath` changes the
  URL; and a future SDK could change this again] -> the path-encoding fixture spec runs through `AssetApi` for read, save and
  delete with `100%`, `a+b`, `q?x#y`, a space, non-ASCII, an existing `%20` (sent as `%2520`, as today) and a nested `/`,
  plus an empty path and a trailing `/` on the metadata read, asserting the hand-written URL; PRs 2-5 reuse it.
- [The SDK serializes the metadata query differently from `URLSearchParams`] -> D2 fixes the key order and keeps `recursive`
  always present; the fixture pins the exact query string for a token of `+ / =` and non-ASCII, and the decoded parameters
for one with a space or `~ ! ' ( )`, where the encoding differs but the value does not.
- [`If-None-Match: *` on create] -> `sdkAction` passes extra headers untouched; the spec asserts `*` for a create and `If-Match`
  for an update, and no `If-None-Match` on a read with the default etag.
- [`put` returns Core's metadata node, and the `_metadata` graft assumes an object body] -> unchanged logic over the same body;
  a spec keeps the existing "unparseable path does not break the write" case on the SDK route.
- [Model etag source] -> the metadata read is now an SDK read; `getMergedWithEtag` specs assert the etag still comes from the
  metadata node and the `If-Match` of a following write carries it.
