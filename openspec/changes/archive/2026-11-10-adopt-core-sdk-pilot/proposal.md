## Why

Every direct DIAL Core call in the console is hand-written: `BaseApi`/`CoreApi` build URLs and headers
and parse responses, and `src/models/dial/*` re-declares Core's DTOs. `@epam/ai-dial-typescript-sdk` is
generated from Core's OpenAPI document, so adopting it removes hand-maintained routes and gives typed
operations that follow Core's contract. This change is the pilot: it proves the SDK can sit behind the
existing API classes without any caller noticing, before the larger resource groups move.

## What Changes

- Add `@epam/ai-dial-typescript-sdk` at the stable `^0.2.0`.
- Add one shared SDK client per Core host (`src/server/core/sdk-client.ts`) with a custom `coreFetch`
  that registers each request in the logout `requestRegistry`, combines a caller's own abort signal with
  the registry's, sets `cache: 'no-store'`, and defaults `Accept: application/json`.
- Add two protected adapters on `CoreApi` mirroring `BaseApi`'s two existing return contracts:
  `sdkAction` (the `ServerActionResponse` envelope) and `sdkGet` (`R | null | undefined`).
- Move `BucketApi.getBucket` and `CoreUtilityApi.getUserInfo` onto the SDK. Their signatures and
  results are unchanged.

## Capabilities

### New Capabilities
- `core-client`: The transport contract every SDK-backed Core call follows — one client per host,
  per-call authorization, cancellation, response-to-envelope mapping, and the gap policy.

### Modified Capabilities
- None. `utility-core-api` describes the identity read by route and result, not by transport, so its
  requirements hold unchanged.

## Non-goals

- Migrating `SettingsApi`, deployment listing/lookup, or any other Core call — later phases.
- Replacing admin's Core domain models with SDK types.
- Moving calls the SDK cannot express (multipart PUT, file streaming, `text/plain` reads such as
  `getCoreVersion`, `v2/skills`, generic `v1/metadata/{type}`, the MCP client, streamed chat completion).
- Touching the admin-backend, deployment-manager, evaluation, or analytics clients.

## Impact

- `package.json` / `package-lock.json`: new dependency (brings `openapi-fetch@0.17`).
- `apps/ai-dial-admin/src/server/core/core-api.ts`, `sdk-client.ts` (new), `models.ts` (new),
  `bucket-api.ts`, `core-utility-api.ts`, and `src/server/base-api.ts` (error-logging helpers become
  `protected` so the SDK path logs the same lines).
- Specs under `src/server/core/tests/`.
- No server action, UI, or envelope change; publication file resolution (`getBucket`) and the Core-only
  identity read behave exactly as before.
