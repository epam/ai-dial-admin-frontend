## Context

`UtilityApi` (`src/server/utility-api.ts`) is a single BE-hosted class holding every admin-console
endpoint the frontend calls. Most of its methods are genuine admin-BE logic (import/export, version,
config-sync) with no Core equivalent, but three — `checkDeploymentByName`, `getAllDeployments`,
`getSystemProperties`/`updateSystemProperties`, and `getUserInfo` — only ever forwarded the request to
DIAL Core unchanged (confirmed against `ai-dial-core`'s `DeploymentController`, `ConfigResourceController`
(`/v1/settings/{bucket}/{path}`), and `UserInfoController`). `SettingsApi` (`src/server/core/settings-api.ts`)
already talks to Core's global-settings singleton for a different caller (`getGlobalInterceptors`), so
the system-properties move lands there instead of a new class, to avoid two clients owning one Core
resource.

Separately, `getConfigEntityOptions` (`src/server/config-entities/read.ts`) unions two Core populations —
API-written (`assetApi`) and config-file (`configFileApi`) — for every entity-picker read across the app
(`platform-models`, `assets-applications`, `assets-toolsets`, `platform-app-runners`, `platform-routes`,
`platform-keys`, and now `system-properties`). The config-file population is declared through the admin
console's own configuration surface; without the admin backend there is nothing to read there.

## Goals / Non-Goals

**Goals:**

- Every endpoint that only ever proxied Core unchanged calls Core directly, with no change in the
  response shape its callers already depend on (except `getUserInfo`'s role, see below).
- No duplicate ownership of one Core resource across two client classes.
- `getConfigEntityOptions`'s config-file read degrades to "nothing to union" rather than a reported
  failure when the admin backend isn't configured, since a failure there would surface as an
  "incomplete option list" warning for a population that was never expected to exist.

**Non-Goals:**

- Migrating any endpoint that has genuine admin-BE-only logic (import/export, version, config-sync) —
  those stay on `UtilityApi`, commented out or otherwise, exactly as `UtilityApi` already has them.
- Reproducing the admin backend's `FULL_ADMIN`/`READ_ONLY_ADMIN` role-mapping logic
  (`identity-providers.*.role-mapping` config) against Core's raw roles. Core's `/v1/user/info` reports
  unmapped roles; `CoreUtilityApi.getUserInfo` intentionally returns no role, and the admin-BE-routed
  path (`UtilityApi.getUserInfo`, used whenever `DIAL_ADMIN_API_URL` is set) keeps computing it as
  before. `hide-ui-without-admin-api`'s `AppContext` treats `isFullAdmin`/`isReadOnlyAdmin` as `true`/
  `false` respectively whenever the admin backend isn't configured, so no role is needed in that case.
- Skipping the API-written half of `getConfigEntityOptions`'s union. `listApiWrittenNames` reads through
  `assetApi`, which is Core-direct regardless of `DIAL_ADMIN_API_URL` — only the config-file half is
  admin-console-owned.

## Decisions

**`checkDeploymentByName` switches from `HEAD` to `GET`.** Core's `DeploymentController` registers only
`GET /v1/deployments/{deployment_name}` (`ControllerSelector`'s route table matches HTTP method exactly,
with no implicit `HEAD`→`GET` fallback), so a `HEAD` request 404s unconditionally against Core. `GET`
still resolves to `null` on a real 404 (`BaseApi.get`'s existing failure handling), preserving the
"name is unique" check `checkIsUniqueDeploymentName` does with the result — just with a body attached
that the caller ignores.

**System properties move to `SettingsApi`, not a new class.** `SettingsApi.globalSettings` already reads
Core's `v1/settings/platform/global` for `getGlobalInterceptors`, unconditionally (no etag). Adding
`getSystemProperties`/`updateSystemProperties` (etag-conditional GET/PUT) there — instead of on a new
`CoreUtilityApi` — means one class, one URL constant, one place a reader checks for how this resource is
read and written.

**`getUserInfo` stays admin-BE-routed when the admin backend is configured.** The admin backend's
`SecurityInfoController` doesn't call Core at all — it reads `id`/`email`/mapped-`roles` off its own
Spring Security authentication context, built from the incoming OIDC token via
`identity-providers.*.role-mapping` config that has no Core equivalent. Reproducing that mapping
client-side (decoding the JWT independently, adding new `FULL_ADMIN_ROLE_NAMES`/
`READ_ONLY_ADMIN_ROLE_NAMES` env vars) was considered and rejected: `hide-ui-without-admin-api` already
gives every caller full-admin treatment when the admin backend isn't configured, so no role is needed on
that path, and duplicating role-mapping logic the admin backend still owns (while it's still configured)
would be one more thing to keep in sync for no behavior change. `src/app/api/api.ts`'s `getUserInfo`
picker is the single place that decides which client to call; every consumer (`app/layout.tsx`,
`app/[lang]/layout.tsx`) calls the picker, never `UtilityApi.getUserInfo` or `CoreUtilityApi.getUserInfo`
directly.

**`getConfigEntityOptions` skips only the config-file read, not the whole union.** The two reads
(`listApiWrittenNames` via `assetApi`, `configFileApi.listNames`) are independent Core calls with
different ownership: `assetApi`'s population exists regardless of the admin backend, `configFileApi`'s
does not. Skipping the whole function (as an earlier iteration of this change did, before this was
narrowed) would also have suppressed the still-valid API-written population everywhere `readConfigEntities`
is called, not only where the config-file population would have been empty.

**System Properties' interceptor picker moves to `readConfigEntities`.** It previously called
`interceptorsApi.getInterceptorsList` (admin-BE-only, doesn't see config-file-declared interceptors).
Reading it the same way `platform-models` does — through `readConfigEntities`, which already
composes both populations — is strictly more complete, and gets the admin-API skip in the same
change for free.

## Risks / Trade-offs

- **`getUserInfo`'s role silently disappears if a caller forgets to route through the `api.ts` picker**
  → Mitigated by removing `UtilityApi`/`CoreUtilityApi` imports from every existing consumer in this
  change (`app/layout.tsx`, `app/[lang]/layout.tsx`) — there is no remaining direct call to either
  class's `getUserInfo` to accidentally use instead.
- **A future caller of `getConfigEntityOptions` might expect the config-file read to always attempt and
  report a failure, e.g. for a health check** → Mitigated by the `core-config-file-client` spec delta
  making the skip an explicit, spec-level requirement rather than an implementation detail a reader
  would need to find in the source to notice.
