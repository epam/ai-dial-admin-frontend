## Context

`BaseApi` owns two request paths, and callers depend on the difference:

- `sendActionRequest` → `handleResponse` returns a `ServerActionResponse`: `etag` from the header,
  `requestId` from `traceparent`, error text normalized through `parseErrorBody` (Core's override is
  `normalizeCoreError`), a 2xx body carrying an `error` field treated as a failure, and a cancelled
  request resolved to `{ success: false, status: 0, errorMessage: 'Request cancelled' }`.
- `sendRequest` (behind `get()`) returns the parsed body, `undefined` on 403, and `null` on any other
  failure or on cancellation.

Both register an `AbortController` in `requestRegistry` so logout cancels in-flight calls, send
`cache: 'no-store'`, and default `Content-Type`/`Accept` to JSON.

The SDK wraps `openapi-fetch@0.17`, which matters in three places: it hands the custom `fetch` a
`Request` object; on failure it has already read the body with `text()` and tried `JSON.parse`; and on a
2xx with no `Content-Length` it calls `JSON.parse` and throws on a non-JSON body.

## Goals / Non-Goals

**Goals:** an SDK path that a caller of `getBucket` or `getUserInfo` cannot tell apart from the
`BaseApi` path, built so later phases only add call sites.

**Non-Goals:** migrating further resources; changing any envelope field; replacing domain models.

## Decisions

### D1. The adapters are protected methods on `CoreApi`
`sdkAction` and `sdkGet` live on `CoreApi`, next to the `parseErrorBody` override they call. Every Core
client already extends `CoreApi`, so a migrated method swaps `this.getAction(url, token)` for
`this.sdkAction(token, (init) => this.sdk.operation(init))` and nothing else in the class moves.
Alternative considered: a standalone `sdk-response.ts` module — rejected because it would need the error
normalizer passed in and would be a second shape next to the class hierarchy every Core client uses.

### D2. One SDK instance per Core host, created lazily
`getCoreSdk(host)` memoizes `createSDK({ baseUrl, fetch: coreFetch })` per host, and `CoreApi` reads it
through a `protected get sdk()`. All Core clients are built from `DIAL_CORE_API_URL`, so production has
one instance; specs that construct a client against a test host get their own. The instance carries no
token — `openapi-fetch` merges per-call `init.headers`, and the adapter supplies `authorization` from
the method's `token` argument. `openapi-fetch` strips a trailing slash from `baseUrl`, so the
slash-normalized `BaseApi` host joins cleanly with the SDK's `/v1/...` paths.

### D3. `coreFetch` rebuilds the request rather than mutating it
`coreFetch(input, init)` registers a controller, then calls the global `fetch` (keeping OTel's
instrumentation) with the original request plus an init that sets `cache: 'no-store'`,
`signal: AbortSignal.any([registry, request.signal])`, and headers copied from the request with
`Accept: application/json` added when absent. The caller's signal rides in on the `Request`, because
`openapi-fetch` copies `init.signal` onto it. The controller is unregistered in `finally`.

### D4. Bodies are read as text and parsed by the adapter
Every adapted call passes `parseAs: 'text'`. `openapi-fetch` then never throws on a non-JSON 2xx, and
the adapter applies `BaseApi`'s `getResponse` rule itself: `text/plain` stays text, anything else is
`JSON.parse`d with the raw text (or `''`) as the fallback. The cost is that `data` loses its SDK type at
the call site, so each method casts to its domain model at one mapping point — the same place a
type-mismatch comment belongs. Alternative considered: keep `parseAs: 'json'` and catch the
`SyntaxError` — rejected because the body is already consumed by then, so the text fallback is
unrecoverable.

### D5. Error bodies are re-serialized for `normalizeCoreError`
On failure `openapi-fetch` yields `error` as a parsed object, a string, or `undefined` (204 /
`Content-Length: 0`). The adapter passes strings through and `JSON.stringify`s objects, so
`normalizeCoreError(body: string, status)` keeps one signature for both paths. Success is decided by
`response.ok`, never by whether `error` is set — an empty-body failure leaves `error` undefined.

### D6. Specs drive the real SDK against `vitest-fetch-mock`
API-class and adapter specs construct the real client and stub the global `fetch`, as the current specs
already do. The adapter's risk is precisely how `openapi-fetch` parses responses; a mocked SDK would
hide it. This departs from the review plan's "mock the SDK client in `test-setup.tsx`": no shared mock
is needed, and server-action specs keep automocking `@/src/app/api/api`. Specs use an absolute test host
because `Request` rejects the relative `TEST_URL`.

## Risks / Trade-offs

- **Two Core pipelines during migration** → every `BaseApi` behavior the SDK path must keep is listed in
  the `core-client` spec and pinned by adapter specs.
- **Package metadata** (`"type": "module"`, `main` → ESM `index.js`, `module` → missing `index.mjs`, no
  `exports`) → verified under `tsc` (app and spec projects), vitest, and `next build`; no
  `transpilePackages` entry unless one of them fails.
- **SDK types lag Core** — `Bucket.bucket` and `UserInfoResponse.roles` are optional in the SDK but
  always present from Core → admin keeps `UserBucket` and `CoreUserInfoResponse`, noted at the mapping.
- **Version drift** → the stable `^0.2.0` range, like the other `@epam` packages: on `0.x` a caret admits
  only stable `0.2.x` patches, never the weekly `-dev` prereleases that track Core's OpenAPI syncs. A minor
  bump is a deliberate change that runs the Core API specs and both typecheck gates.
- **`DELETE` bodies**: `BaseApi` never parses a `DELETE` response; no migrated call is a `DELETE` yet, so
  the adapter does not special-case it — the first phase that migrates one must.
