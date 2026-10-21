## Why

The admin backend (`ai-dial-admin-backend`) is being retired incrementally (see the archived
`migrate-publications-to-core-api`, `add-core-asset-client`, and `core-config-file-client`-backing
changes). `UtilityApi` still proxies three endpoints to the admin backend that only ever forward the
request to DIAL Core unchanged: deployment listing/lookup, the caller's own identity, and the
global-settings singleton. These can move to Core directly today, ahead of any UI-visibility work
(`hide-ui-without-admin-api`) — they are independent of whether the admin backend is configured at all,
except for identity, where the admin backend still computes a mapped `FULL_ADMIN`/`READ_ONLY_ADMIN`
role Core does not know about.

## What Changes

- Add `CoreUtilityApi` (`DIAL_CORE_API_URL`-hosted) with `checkDeploymentByName` and `getAllDeployments`,
  reading Core's `GET /v1/deployments[/{name}]` directly instead of the admin-BE proxy. `checkDeploymentByName`
  switches from a `HEAD` request to a plain `GET`, because Core's `DeploymentController` only registers
  `GET` for that route.
- Add `CoreUtilityApi.getUserInfo`, reading Core's `GET /v1/user/info` directly. Core reports the
  caller's own raw, unmapped roles (not `FULL_ADMIN`/`READ_ONLY_ADMIN`), so this method only ever
  returns `id`/`email` — no role is derived from it.
- Extend `SettingsApi` (which already owns Core's global-settings singleton for `getGlobalInterceptors`)
  with `getSystemProperties`/`updateSystemProperties`, the etag-conditional GET/PUT the System
  Properties page needs — removing the duplicate URL constant and duplicate resource ownership that
  would otherwise exist between it and `CoreUtilityApi`.
- Add `getUserInfo(token)` in `src/app/api/api.ts`: calls `UtilityApi.getUserInfo` (admin backend, which
  still computes the mapped role) when `DIAL_ADMIN_API_URL` is configured, otherwise
  `CoreUtilityApi.getUserInfo` (Core direct, `id`/`email` only, no role).
- `UtilityApi` keeps `getUserInfo` and everything else it already owns (import/export, version, config
  sync) — nothing is removed from it besides the three methods that move to `CoreUtilityApi`/`SettingsApi`.
- `readConfigEntities`'s underlying `getConfigEntityOptions` now skips the config-file half of its union
  read (`configFileApi.listNames`) when `DIAL_ADMIN_API_URL` is unset, resolving it as an empty success
  rather than a reported failure — that population is the admin console's own configuration surface, so
  without the admin backend there is nothing declaring it. The API-written half
  (`assetApi`-based, Core-direct either way) is always read.
- The System Properties page's interceptor picker now reads from `readConfigEntities` (Core's unioned
  API-written + config-file populations, matching `platform-models`) instead of the admin-BE-only
  `interceptorsApi.getInterceptorsList`, and surfaces a partial-read warning the same way `ModelView` does.

## Capabilities

### New Capabilities

- `utility-core-api`: `CoreUtilityApi`'s direct-to-Core deployment listing/lookup and user-identity read,
  and the `getUserInfo` picker in `src/app/api/api.ts` that chooses between it and the admin-BE-routed
  `UtilityApi.getUserInfo`.

### Modified Capabilities

- `core-config-file-client`: the config-file half of the two-population union read is skipped (not
  reported as failed) when the admin backend is not configured.

## Impact

- `apps/ai-dial-admin/src/server/core/core-utility-api.ts` — new class.
- `apps/ai-dial-admin/src/server/core/settings-api.ts` — two new methods, same URL constant.
- `apps/ai-dial-admin/src/server/utility-api.ts` — three methods removed (moved out), `getUserInfo` kept.
- `apps/ai-dial-admin/src/app/api/api.ts` — new `coreUtilityApi` instance, new `getUserInfo` picker.
- `apps/ai-dial-admin/src/server/config-entities/read.ts` — `getConfigEntityOptions` gates the
  config-file read.
- Call-site updates: `src/app/actions.ts`, `src/app/layout.tsx`, `src/app/[lang]/layout.tsx`,
  `src/app/[lang]/conversations/actions.ts`, `src/app/[lang]/system-properties/{actions,page}.tsx`,
  `src/app/[lang]/interceptors/{page,[id]/page}.tsx`.
- `apps/ai-dial-admin/src/models/dial/core-user-info.ts` — new model for Core's raw `/v1/user/info` shape.
- No new environment variables; no dependency changes.
