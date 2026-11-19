## Why

Phase 1 (`adopt-core-sdk-pilot`) proved the SDK adapters on two unconditional reads. The global-settings
singleton behind System Properties and the interceptors pages is the next Core resource, and the first
one that needs conditional headers (`If-None-Match` on read, `If-Match` on write) — which the adapters
cannot carry today. Moving it now both retires another hand-written URL and extends the adapter for the
phases that follow, all of which edit entities under ETag control.

## What Changes

- `SettingsApi.globalSettings`, `getSystemProperties` and `updateSystemProperties` call
  `sdk.getGlobalSettings` / `sdk.saveGlobalSettings` for `('platform', 'global')` through the existing
  `sdkAction` adapter. Public signatures, envelopes and consumers are unchanged.
- `sdkAction` / `sdkGet` accept an optional `headers` argument (`Record<string, string>`) that `runSdkCall`
  merges with the `authorization` header; a caller-supplied `authorization` in any casing is dropped, so the
  caller's headers can add to the request but never supply or replace authorization.
- `createIfMatchHeaders` / `createIfNoneMatchHeaders` return `Record<string, string>` instead of `HeadersInit`.
- `getSystemProperties` sends `If-None-Match` only for a real etag; for `DEFAULT_ETAG` (`'*'`), which
  every caller passes, it sends none, so a plain read can no longer be answered with 304 (today it goes out
  as `If-None-Match: *`). `updateSystemProperties` sends `If-Match` with the etag it is given — including
  `If-Match: *`, which the page sends when a blob already exists — and omits it only for a create (undefined
  etag). A 412 and a read 404 pass through with their status.
- The SDK types the read as `GlobalSettings & EntityMetadata`. `name` and `status` are omitted at the
  read; every other key is kept, so fields admin does not model still round-trip on save.
- A one-line comment at the 403 early return in `sdkValue` explaining why the body is not logged
  (carried over from a review note on #5489).

**Non-goals:** `deleteGlobalSettings` or any `DELETE` migration; the deployment reads (change
`core-sdk-deployments`); the `BaseApi` non-JSON-2xx fix (shipped separately); replacing `GlobalSettings`
with the SDK type; the shared "inspect → log → map" helper.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `core-client`: the adapters accept caller-supplied request headers without losing authorization, and
  the list of SDK-backed calls gains the three global-settings methods.
- `utility-core-api`: the global-settings owner requirement no longer promises a shared URL constant,
  since the SDK builds the route.

## Impact

- Code: `src/server/core/core-api.ts`, `src/server/core/settings-api.ts`, `src/server/core/asset-headers.ts`
  (return types only), their specs under `src/server/core/tests/`.
- Callers (no edits expected): `system-properties/actions.ts` and `page.tsx`, `interceptors/page.tsx`,
  `interceptors/[id]/page.tsx`, `server/config-entities/read.ts`.
- Specs: `openspec/specs/core-client/spec.md`.
- Ordering: archive before `core-sdk-deployments`. Both MODIFY the same `core-client` requirement; the
  deployments delta is written against this change's result.
- Dependency: `@epam/ai-dial-typescript-sdk` on the stable `^0.2.1` (from `^0.2.0`); no dev build. 0.2.1 already
  has every operation this change and `core-sdk-deployments` use.
