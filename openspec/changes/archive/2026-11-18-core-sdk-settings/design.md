## Context

The adapters, `CoreSdkCall` and the one-SDK-per-host client are described in the archived
`adopt-core-sdk-pilot/design.md` (D1–D6); this change builds on them and does not revisit them.

`SettingsApi` is the only client of the global-settings singleton. Three methods hit
`v1/settings/platform/global` through `BaseApi` helpers that already carry the conditional headers:

- `globalSettings` — unconditional read; `server/config-entities/read.ts` reads `status` (404 means "no
  override yet").
- `getSystemProperties(token, etag)` — `If-None-Match` with whatever etag it is given. Every caller
  (`system-properties/page.tsx`, both interceptors pages, `Interceptors.tsx` via `getProperties`) passes
  `DEFAULT_ETAG` (`'*'`); nothing holds a cached copy to revalidate, so today each read goes out as
  `If-None-Match: *`.
- `updateSystemProperties(properties, token, etag)` — `If-Match` when `etag` is defined, none otherwise.

`runSdkCall` today builds `init` itself (`{ headers: authorization, parseAs: 'text' }`), so a method has no
way to add a header. The SDK operations declare `If-Match` / `If-None-Match` as header parameters, and the
SDK types the read as `GlobalSettings & EntityMetadata` (`name`, `status`), while admin's `GlobalSettings`
model has neither.

## Goals / Non-Goals

**Goals:** the three methods behave identically to callers; the adapter gains header support that every
later entity phase reuses as is.

**Non-Goals:** any change to `GlobalSettings`, the System Properties UI, or `BaseApi`.

## Decisions

### D1. Headers are an argument of the adapters, merged in `runSdkCall`
`sdkAction(token, call, headers?)` and `sdkGet(token, call, headers?)` pass `headers` to `runSdkCall`, which
drops any `authorization` key from `headers` (compared case-insensitively), then adds
`getAuthorizationHeader(token)`. A caller header can add to the request but never supplies or displaces
authorization — including with no token (auth disabled), where nothing is sent rather than the caller's value,
and including an `Authorization` key in another casing. The rule does not lean on `openapi-fetch`'s
`mergeHeaders` applying keys in insertion order. `CoreSdkCall` keeps its `(init) => …` shape; a callback
must not set `params.header`, which `openapi-fetch` merges after `init.headers` and so would win over
authorization.

`headers` is typed `Record<string, string>`, matching `CoreSdkCallInit.headers`, never `HeadersInit`: spreading
a `Headers` instance yields `{}`, so a `HeadersInit` parameter would let a caller silently lose `If-Match` and
turn a conditional save into an unconditional overwrite. `createIfMatchHeaders` / `createIfNoneMatchHeaders`
(`server/core/asset-headers.ts`) narrow their return type to `Record<string, string>` so they pass without a cast.
Alternative considered: each method spreads its own headers into `init` inside the callback — rejected
because it moves the auth-precedence rule into every call site, and the first method to get it wrong would
send a request under another caller's identity or none.

### D2. Conditional headers are built by the method, undefined means absent
`getSystemProperties` passes `createIfNoneMatchHeaders(etag)` (`server/core/asset-headers.ts`), which
yields no header for `DEFAULT_ETAG` or an empty etag (see D3); `updateSystemProperties` passes
`{ [IF_MATCH]: etag }` when `etag` is truthy and `undefined` otherwise, so no empty header is sent.
This mirrors `putActionWithEtag`.

The two directions are deliberately asymmetric. On the write, `DEFAULT_ETAG` is the value that actually goes
out: `SystemProperties.tsx` saves with `'*'` whenever a blob exists (Core never hands back a real etag), and
`If-Match: *` is what asserts "update, don't create". `updateSystemProperties` therefore MUST NOT use
`createIfMatchHeaders`, which drops `'*'` and would silently turn every update into an unconditional write.
A spec scenario pins `If-Match: *`.

### D3. A read with `DEFAULT_ETAG` is unconditional, so it cannot produce a 304
`If-None-Match: *` is a create-only precondition: on a GET it asks for a 304 whenever the resource exists
(RFC 9110 §13.1.2). The SDK path must not carry that over from `getActionWithEtag`. `createIfNoneMatchHeaders`
already drops the header for the `'*'` sentinel — `AssetApi` reads use it for the same reason — so
`getSystemProperties` reuses it and sends `If-None-Match` only for a real etag.
A 304 is therefore unreachable for every current caller — and today Core's settings GET ignores conditional
headers and sends no `ETag` at all (see Risks), so no caller can even obtain a real etag to send. If Core starts
honouring one and a future caller passes it, the 304 lands
in `sdkAction`'s `!response.ok` branch as a failure envelope (`status: 304`, `errorMessage: 'Error status:
304'`), which every current page would misread as a failed read; that caller must give "not modified" its own
outcome rather than reuse the failure envelope. `isFailedRequest` / `response.ok` stay 2xx-only — a 304 has
no body, so counting it as success would hand callers an empty `response`.
Alternative considered: keep sending `If-None-Match: *` and pin the 304 failure envelope in a spec — rejected
because it pins a response no caller can use, and each page would misread it (System Properties shows a
read-failed warning, the interceptors pages mark every interceptor LOCAL).
Consequence: a wire change — reads stop sending `If-None-Match: *`; a spec pins it.

### D4. `name` / `status` are omitted at the read, by denylist
One private mapper in `SettingsApi` takes the successful envelope and returns `response` with `name` and
`status` removed (`const { name, status, ...settings } = response`). Both reads use it. It is a denylist so
fields Core adds later, or that admin does not model (`retriableErrorCodes` is only kept "so a save
round-trips it"), still reach the page and the next save. The cast from the adapter's untyped body to admin's
`GlobalSettings` lives in this one mapper.
Alternative considered: allowlist the known keys — rejected because a field the SDK knows but admin has not
modelled yet would be dropped on the next save.
Consequence: a save no longer echoes `name` / `status` back to Core. They are read-only metadata, but the
current write sends whatever the read returned, so this is a wire change; a spec pins it.

### D5. The 403 early return in `sdkValue` gets a comment
One line saying the body is skipped on 403 on purpose, matching `sendRequest`, which logs status, URL and
`traceparent` but not the body of a forbidden response.

## Risks / Trade-offs

- **Reads stop sending `If-None-Match: *`** → no observable change: Core's settings GET
  (`ConfigResourceController.handleSettingsGet`) never reads `If-None-Match` or `If-Match` and never sets an
  `ETag`; it answers 404 without an API blob, otherwise 200. The Core OpenAPI (`getGlobalSettings`) lists a
  `304`, but that comes from the shared response set and this handler cannot emit it. The spec pins the
  absent header so the read stays correct if Core later wires `EtagHeader` into this handler — `EtagHeader`
  turns `If-None-Match: *` on a GET into a 304 whenever the resource has an etag, as the blob-backed entity
  GETs (`handleSingleGetFromBlob`, `respondNotModifiedIfMatched`) already do.
- **A save stops echoing `name` / `status`** → Core treats them as read-only metadata; verify at implementation
  against Core's settings controller and the spec scenario, and keep them if Core rejects their absence.
- **`globalSettings` consumers might use `name`/`status`** → check `server/config-entities/read.ts` while
  implementing; if it needs them, strip only in `getSystemProperties`.
- **The SDK is on the stable `^0.2.1`**, which admits only 0.2.x patch releases, never a `0.3.0-dev` build →
  every operation and type this change uses (`getGlobalSettings` / `saveGlobalSettings` with their
  `If-None-Match` / `If-Match` header parameters, `GlobalSettings & EntityMetadata`) is in 0.2.1, whose build is
  identical to `0.3.0-dev.4`. A 0.2.x patch can still change the generated types; the real-SDK specs in this
  change and both typecheck gates are what catch drift. Moving to 0.3 is its own dependency change.
- **Two Core pipelines still coexist** → every behavior above is pinned in the `core-client` spec and in
  adapter specs; the shared helper that would merge them is a separate change.
- **Spec ordering with `core-sdk-deployments`** → both MODIFY the `core-client` "Calls the SDK cannot express"
  requirement, and a MODIFIED block replaces the whole requirement. This change archives first; the
  deployments delta states the final list (this change's calls plus the deployment lookups) on top of it.
