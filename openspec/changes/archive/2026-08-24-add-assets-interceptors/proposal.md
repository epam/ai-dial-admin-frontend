## Why

`Assets > Models` and `Assets > App Runners` already let admins manage DIAL Core config resources
directly, without the admin backend as an intermediary. Interceptors are next in that migration.
Unlike App Runners, Core already treats interceptors as a first-class, server-validated resource
type (`ResourceTypes.INTERCEPTOR`, `interceptors/{bucket}/{path}`) — the frontend even has
`ResourceType.INTERCEPTOR` registered today, but deliberately read-only, used only to build option
lists for other surfaces. Nothing lets an admin create, edit, or delete an interceptor directly
against Core.

## What Changes

- Add an `Interceptors` menu item to the Assets section, immediately after `App Runners`, linking to
  a new `/assets-interceptors` route.
- Add a flat, non-nested asset list over Core's `interceptors/platform/*` resources — the API-written
  half of Core's interceptor population — with create, delete, and bulk-delete actions and
  metadata-only columns (name, author, created-at, updated-at). No folders.
- Add a two-tab detail view: `Properties` (display name, description, icon, endpoint/interfaces,
  override name, forward-auth-token, topics) and `Configuration` (the existing `ParameterSchema`
  component's schema-rendering, pointed at a new Core-direct fetch —
  `GET v1/deployments/{name}/configuration` — instead of the admin-BE lookup it defaults to). No
  Features tab: ai-dial-core never reads an interceptor's `features` switches, only `configuration
  Endpoint` (covered by the Configuration tab) and `overrideName` (on Properties). No reverse-index
  tabs (no `ApplicationRunners`/`Entities` tabs — there is no admin-BE index of what references a
  Core-only interceptor), no Audit tab, no Core-sync banner, no chained/local-interceptors tab on the
  interceptor itself.
- Fix `Assets > Models`' Interceptors tab, which turned out to read the admin-BE interceptor list
  despite the surface's own no-admin-backend-call requirement: switch it to read Core's own
  Api/ConfigFile-merged population directly, mirroring `Assets > App Runners` exactly (same
  `readConfigEntities`/`readGlobalInterceptors` helpers, now shared between both pages).
- Finish the `ResourceType.INTERCEPTOR` wiring that the App Runner asset work left read-only: add
  `ASSET_MERGERS[INTERCEPTOR]`, a `DialInterceptorResource` model, and server actions that write
  through `assetApi.put`/`assetApi.delete`.
- Introduce `AssetInterceptorOrigin.Entity | Asset`, mirroring `AppRunnerOrigin`, and widen every
  interceptor-attach picker — on `Entities > Applications`, `Entities > Models`,
  `Entities > Application Runners`, and the entity `Interceptors` view's own reverse-index tabs — to
  offer both the admin-BE-tracked population and the new Core-only asset population, with a `Source`
  column distinguishing them. This is additive to the existing `ConfigEntityOrigin.Api | ConfigFile`
  distinction (which of Core's own two populations an option came from) — a picker now carries both
  dimensions independently, never collapsed into one.
- Client-side validation stays minimal: Core deserializes an interceptor write into its own
  `Interceptor` entity class and rejects an invalid one server-side, unlike App Runner's raw-JSON
  schema resource, so this surface does not need App Runner's client-side meta-schema-validation
  layer.

## Capabilities

### New Capabilities

- `assets-interceptors`: the `Assets > Interceptors` menu entry, list, detail view, and server-side
  wiring over Core's `interceptors/platform/*` resources, plus the `AssetInterceptorOrigin`-aware
  widening of every interceptor-attach picker across the app.

### Modified Capabilities

- `assets-models`: the Interceptors tab's option list now reads Core's Api/ConfigFile-merged
  population directly instead of the admin-BE list, gaining the same `Source` column and
  incomplete-list warning `Assets > App Runners` already has.

## Impact

- New route `src/app/[lang]/assets-interceptors/` (list page, `[id]` detail page, `actions.ts`).
- New components under `src/components/Assets/Interceptors/` (List, View, TabsContent, Properties,
  ParameterSchema), following the `Assets/Models` shape.
- `src/constants/assets-core.ts`, `src/server/core/asset-metadata.ts`, `src/models/dial/resource.ts`:
  add the missing `INTERCEPTOR` merger and resource model.
- `src/server/core/deployment-configuration-api.ts` (new): Core's generic
  `deployments/{name}/configuration` read, reused by the Configuration tab.
- `src/server/config-entities/read-page-options.ts` (new): the `readConfigEntities`/
  `readGlobalInterceptors` helpers, extracted out of `assets-app-runners/[id]/page.tsx` so
  `assets-models/[id]/page.tsx` can share them rather than re-deriving the same read/degrade/warn
  logic.
- `src/components/EntityView/Interceptors/` (shared attach-picker component) and every surface that
  renders it: `Entities > Applications`, `Entities > Models`, `Entities > Application Runners` (all
  widened), and the already-Core-direct `Assets > App Runners`/`Assets > Models` Interceptors tabs
  (left to their own Core-direct population, not widened by this component).
- `src/components/Menu/menu-configuration.tsx`, `src/constants/i18n.ts`, `src/types/routes.ts`.
- No changes to `Entities > Interceptors` itself (route, admin-BE storage, Audit, the existing
  CORE-format JSON toggle) — it keeps behaving exactly as it does today.
