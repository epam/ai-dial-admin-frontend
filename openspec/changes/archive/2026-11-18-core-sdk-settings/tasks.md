## 1. Adapter headers

- [x] 1.1 Add an optional `headers?: Record<string, string>` argument to `sdkAction`, `sdkGet` and `sdkValue`; `runSdkCall` drops any `authorization` key from it (case-insensitive) and then adds `getAuthorizationHeader(token)`
- [x] 1.2 Narrow the return type of `createIfMatchHeaders` and `createIfNoneMatchHeaders` (`asset-headers.ts`) to `Record<string, string>`; existing callers keep type-checking
- [x] 1.3 Add the one-line comment at the 403 early return in `sdkValue` (`core-api.ts`)
- [x] 1.4 Extend `core-api-sdk.spec.ts`, both adapters: extra header is sent with authorization; an `Authorization` (capitalised) extra header leaves exactly the caller's value; with no token an `authorization` extra header is not sent; an absent header is not sent

## 2. SettingsApi on the SDK

- [x] 2.1 `globalSettings` and `getSystemProperties` call `sdk.getGlobalSettings('platform', 'global', init)` through `sdkAction`; `getSystemProperties` sends `createIfNoneMatchHeaders(etag)`, so no `If-None-Match` for `DEFAULT_ETAG`; both return the settings without `name` / `status` via one private mapper (denylist, cast to `GlobalSettings` there)
- [x] 2.2 `updateSystemProperties` calls `sdk.saveGlobalSettings('platform', 'global', init)` with the properties as body and `{ [IF_MATCH]: etag }` when `etag` is truthy, so `DEFAULT_ETAG` goes out as `If-Match: *`; do not use `createIfMatchHeaders`, which drops `*`
- [x] 2.3 Remove `CORE_GLOBAL_SETTINGS_URL`; confirm `system-properties`, `interceptors` and `config-entities/read.ts` need no edits (check whether `read.ts` uses `name` / `status`)
- [x] 2.4 Add `core/tests/settings-api.spec.ts` driving the real SDK against `vitest-fetch-mock` on `CORE_TEST_URL`: URL and method, `If-None-Match` absent for `DEFAULT_ETAG` and sent for a real etag, read 404, `If-Match: "e1"` for a real etag, `If-Match: *` for `DEFAULT_ETAG`, no `If-Match` for undefined, 412, `name`/`status` omitted while an unmodelled field survives read and save, abort resolves to `status 0`
- [x] 2.5 Update or retire the existing `SettingsApi` spec cases that stubbed `BaseApi` for these methods

## 3. Specs and gates

- [x] 3.1 Run `npx vitest run src/server/core src/app/[lang]/system-properties src/app/[lang]/interceptors` from `apps/ai-dial-admin/`, then `npm run typecheck`, `npm run typecheck:specs` and `npm run lint`
- [x] 3.2 Run the full `npm run test` as the final gate
