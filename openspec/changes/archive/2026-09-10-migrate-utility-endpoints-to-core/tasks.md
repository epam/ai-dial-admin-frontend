## 1. CoreUtilityApi — deployments and identity

- [x] 1.1 Add `apps/ai-dial-admin/src/server/core/core-utility-api.ts` (`CoreUtilityApi extends CoreApi`)
      with `checkDeploymentByName` (GET `v1/deployments/{name}`, not `HEAD` — Core registers only GET)
      and `getAllDeployments` (GET `v1/deployments`).
- [x] 1.2 Add `getUserInfo` to `CoreUtilityApi`, reading Core's `GET /v1/user/info` and mapping the raw
      response into `{ id, email, roles: [] }` — `id` from `userId` or `project`, `email` from the
      `userClaims.email` claim, no role derived.
- [x] 1.3 Add `apps/ai-dial-admin/src/models/dial/core-user-info.ts` for Core's raw `/v1/user/info`
      response shape.
- [x] 1.4 Wire `coreUtilityApi` in `src/app/api/api.ts`, and add the `getUserInfo(token)` picker there
      that calls `utilityApi.getUserInfo` when `DIAL_ADMIN_API_URL` is set, else
      `coreUtilityApi.getUserInfo`.
- [x] 1.5 Update every consumer to use the new instances: `src/app/actions.ts`
      (`checkIsUniqueDeploymentName`), `src/app/layout.tsx`, `src/app/[lang]/layout.tsx`, and
      `src/app/[lang]/conversations/actions.ts` (`getAllDeployments`) — none call `utilityApi` for
      these three endpoints, or either client's `getUserInfo` directly, any more.
- [x] 1.6 Add `src/server/core/tests/core-utility-api.spec.ts` covering `checkDeploymentByName` (URL,
      null-on-404), `getAllDeployments`, and `getUserInfo` (JWT-caller mapping, API-key-caller
      fallback, failed-response passthrough).

## 2. SettingsApi — system properties

- [x] 2.1 Add `getSystemProperties`/`updateSystemProperties` to `src/server/core/settings-api.ts`,
      sharing `CORE_GLOBAL_SETTINGS_URL` with the existing `globalSettings` method — remove the
      duplicate `GLOBAL_SETTINGS_URL` constant and methods that had briefly lived on `CoreUtilityApi`.
- [x] 2.2 Update every consumer to call `settingsApi` instead: `src/app/[lang]/system-properties/actions.ts`,
      `src/app/[lang]/system-properties/page.tsx`, `src/app/[lang]/interceptors/page.tsx`,
      `src/app/[lang]/interceptors/[id]/page.tsx`.
- [x] 2.3 Add `src/server/core/tests/settings-api.spec.ts` covering all three methods
      (`globalSettings`, `getSystemProperties`, `updateSystemProperties`).

## 3. UtilityApi — keep everything else unchanged

- [x] 3.1 Remove only `checkDeploymentByName`, `getAllDeployments`, `getSystemProperties`,
      `updateSystemProperties` from `src/server/utility-api.ts` (moved out in §1/§2) and their
      now-unused imports/consts (`SYSTEM_PROPERTIES_URL`, `DEPLOYMENTS_URL`, `DEPLOYMENT_URL`,
      `SECURITY_INFO_URL`'s duplicate — `getUserInfo` and `SECURITY_INFO_URL` stay). Leave every other
      method (commented-out or active) untouched.
- [x] 3.2 Update `src/server/tests/utility-api.spec.ts` to drop the tests for the four moved methods
      and keep the rest as-is.

## 4. Config-entities — skip the config-file read without the admin backend

- [x] 4.1 In `src/server/config-entities/read.ts`, gate `getConfigEntityOptions`'s
      `configFileApi.listNames` call on `process.env.DIAL_ADMIN_API_URL` — resolve it as
      `{ success: true, data: [] }` when unset, instead of issuing the request. Leave
      `listApiWrittenNames` (via `assetApi`) unconditional.
- [x] 4.2 Update `src/server/config-entities/tests/read.spec.ts` to stub `DIAL_ADMIN_API_URL` for the
      existing cases (which assume the config-file half runs) and add a case proving the config-file
      read is skipped while the API-written population still comes through with no reported failure.

## 5. System Properties — interceptor picker sourcing

- [x] 5.1 In `src/app/[lang]/system-properties/page.tsx`, replace `interceptorsApi.getInterceptorsList`
      with `readConfigEntities<DialInterceptor>(token, ConfigFileEntityType.Interceptors, optionWarnings)`
      (same call `platform-models/[id]/page.tsx` uses), collecting `optionWarnings` alongside the
      existing `globalSettings` fetch.
- [x] 5.2 Add the `optionWarnings` prop to `src/components/SystemProperties/SystemProperties.tsx` and
      the same "surface as an error notification" `useEffect` `ModelView` uses for the same condition.

## 6. Verification

No browser-verification task: every scenario in this change describes a request-routing or data-shape
contract exercised by the unit/component tests added in §1-§5, except the System Properties
"incomplete option list" notification, which reuses `ModelView`'s already-verified notification pattern
verbatim rather than introducing new UI.

- [x] 6.1 Run `npx vitest run` for every spec file touched or added above; then run `npm run test` and
      `npm run typecheck` as the final gate.
