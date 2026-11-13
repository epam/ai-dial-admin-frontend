## 1. Dependency

- [x] 1.1 Add `@epam/ai-dial-typescript-sdk` at `^0.2.0` to the root `package.json` and `package-lock.json`, and confirm it resolves under `npm run typecheck`, `npm run typecheck:specs`, vitest, and `next build` without a `transpilePackages` entry.

## 2. Shared client

- [x] 2.1 Add `apps/ai-dial-admin/src/server/core/sdk-client.ts`: `coreFetch` (registry registration, combined abort signal, `cache: 'no-store'`, default `Accept`) and `getCoreSdk(host)` memoizing one `createSDK` instance per host.
- [x] 2.2 Add `apps/ai-dial-admin/src/server/core/models.ts` with the adapter's call/result interfaces.

## 3. Adapters on `CoreApi`

- [x] 3.1 Add `protected get sdk()`, `sdkAction`, and `sdkGet` to `apps/ai-dial-admin/src/server/core/core-api.ts`, and make `BaseApi`'s two error-logging helpers `protected` so both paths log the same lines.

## 4. Pilot migration

- [x] 4.1 Move `BucketApi.getBucket` (`apps/ai-dial-admin/src/server/core/bucket-api.ts`) onto `sdkGet` + `getUserBucket`.
- [x] 4.2 Move `CoreUtilityApi.getUserInfo` (`apps/ai-dial-admin/src/server/core/core-utility-api.ts`) onto `sdkAction` + `getUserInfo`, keeping its identity mapping; leave deployments and `getCoreVersion` on `BaseApi`.

## 5. Tests

- [x] 5.1 Add `apps/ai-dial-admin/src/server/core/tests/sdk-client.spec.ts`: one instance per host, registry register/unregister, `cancelAll` aborts, caller signal combined, `no-store`, default and preserved `Accept`, trailing-slash host.
- [x] 5.2 Add `apps/ai-dial-admin/src/server/core/tests/core-api-sdk.spec.ts`: `sdkAction` for 2xx JSON, `text/plain`, non-JSON 2xx, 2xx with `error`, JSON / text / empty error bodies, `etag`, `traceparent`, abort; `sdkGet` for 2xx, 403, other failure, abort.
- [x] 5.3 Update `bucket-api.spec.ts` and the `getUserInfo` cases of `core-utility-api.spec.ts` for the SDK request shape.

## 6. Quality checks

- [x] 6.1 Run the changed specs with `npx vitest run` from `apps/ai-dial-admin/`, then `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test`.

No browser-verification task: every scenario's THEN clause describes a server-side request or return value, none describes UI state.
