## Context

`Assets > App Runners` (`add-app-runner-asset-resource`, `unlink-app-runner-assets-from-admin-be`,
`app-runner-create-asset-application`) and `Assets > Models` (`assets-models`) established the
pattern for exposing a DIAL Core config resource directly, bypassing the admin backend. Interceptors
are the next resource to migrate, and they don't fit the App Runner precedent as closely as they
first appear to:

- An app runner is stored as a raw-JSON-string `schemas/platform/{$id}` resource
  (`ResourceTypes.APP_TYPE_SCHEMA`, `WriteSpec(entityClass = null)`), identified by a URI-shaped `$id`
  that needs percent-encoding and client-side meta-schema validation because Core performs none.
- An interceptor is `ResourceTypes.INTERCEPTOR` (`interceptors/{bucket}/{path}`), the same tier as
  `MODEL`/`ROLE`/`ROUTE`, written as `WriteSpec(Interceptor.class, ...)` — a real Jackson entity class.
  Its name follows Core's generic `^[A-Za-z0-9._%:-]+$` pattern, and Core itself rejects a malformed
  write.

Structurally, an interceptor asset is a flat, unversioned, plain-named Core resource — the same shape
`Assets > Models` already has. `ResourceType.INTERCEPTOR` exists in the frontend today, but the App
Runner work registered it **read-only**, to build option lists for its own Interceptors tab; nothing
writes it through `AssetApi`.

`Interceptor extends Deployment extends RoleBasedEntity` in ai-dial-core, so the entity carries
`displayName`, `description`, `iconUrl`, `endpoint`/`interfaces`, `overrideName`, `forwardAuthToken`,
`author`, `createdAt`/`updatedAt`, `descriptionKeywords` (topics), `defaults` (interceptor
configuration values), `userRoles`, and — structurally, inherited from the shared base class —
`interceptors: List<String>`. That last field has no product meaning for an interceptor calling other
interceptors; it is not exposed here.

## Goals / Non-Goals

**Goals:**
- Add a Core-direct `Assets > Interceptors` list + detail view, following `Assets > Models`'
  flat/unversioned shape rather than App Runner's schema-hack shape.
- Finish the `ResourceType.INTERCEPTOR` wiring the App Runner work left read-only, so it supports
  full CRUD through the existing generic `AssetApi`.
- Introduce `AssetInterceptorOrigin.Entity | Asset` and widen every interceptor-attach picker to
  offer both populations, mirroring how `AppRunnerOrigin` widened the App Runner source picker.
- Keep `Entities > Interceptors` — route, admin-BE storage, Audit, the existing CORE-format JSON
  toggle — completely unchanged.

**Non-Goals:**
- No client-side meta-schema-validation layer replacing Core's checks (Core validates
  `Interceptor.class` writes itself; App Runner needed this only because its write is raw JSON).
- No reverse-index tabs (`ApplicationRunners`/`Entities`) on the asset interceptor's own detail view
  — there is no admin-BE index of what references a Core-only resource, the same reasoning that
  dropped App Runner's `Applications` tab.
- No merging of `ConfigEntityOrigin.Api | ConfigFile` into `AssetInterceptorOrigin` — they stay two
  independent dimensions on any row that carries both.
- No changes to Core's own interceptor execution semantics (global → app-type → local chain).

## Decisions

### D1: Model on `Assets > Models`, not `Assets > App Runners`
Despite the user's initial instinct to use App Runners as the template, App Runner's complexity
(URI `$id`, percent-encoding, client-side validation) is specific to its raw-JSON-schema storage and
does not apply here. Modeling on `Assets > Models` avoids importing that complexity where Core
already does the validation and the identity is a plain name.

### D2: Finish, don't re-derive, the `ResourceType.INTERCEPTOR` wiring
`CORE_RESOURCE_URL`, `CORE_RESOURCE_METADATA_URL`, `PLATFORM_BUCKET_RESOURCE_TYPES` membership, and
the `RESOURCE_TYPE_PREFIX`/`isVersioned` exclusions already exist for `INTERCEPTOR`. The only gaps
are `ASSET_MERGERS[INTERCEPTOR]` (add `mergeInterceptorResource`, following `mergeModelResource`'s
`flatMetadataFields` shape exactly — flat and unversioned, same as Model) and a
`DialInterceptorResource` model. Server actions (`createInterceptor`/`updateInterceptor`/
`removeInterceptor`/`bulkDeleteInterceptors`/`getInterceptors`) follow the `assets-app-runners`
`actions.ts` shape, using `assetApi.put`/`assetApi.delete` instead of the app-runner-specific
`toRunnerPayload`/`toCoreRunnerName` detours (neither applies here — no `$id`, no raw-JSON body).

### D3: Detail view is two tabs — Properties and Configuration; no Features, no Roles
`Assets > Models` has four tabs (Properties, Features, Roles, Interceptors) because a model routes
traffic and can itself carry local interceptors and per-role access gates meaningful in that context.
An interceptor asset gets:
- **Properties**: the Core-writable fields listed in Context, composed from the same individual
  `BaseControls`/`EntityMainProperties` pieces `Assets/Models/Properties.tsx` uses
  (`DisplayNameControl`, `DescriptionControl`, `IconControl`, `EndpointControl`, `InterfacesField`,
  `OverrideNameControl`, `TopicsControl`, `ForwardAuthTokenField`) rather than the monolithic
  entity-side `InterceptorProperties` wrapper — that wrapper always renders a container/deployment
  `SourceField`, `MaintainerControl`, and `Defaults`, none of which apply to a headless Core resource
  with no deployment container behind it.
- **Configuration**: see D7 — reuses `ParameterSchema`'s rendering, pointed at a Core-direct fetch.

No **Features** tab: see D6 — Core never reads an interceptor's `features` switches.

No **Roles** tab: `userRoles`/`RoleBasedEntity` access-gating for a stand-alone interceptor resource
was not requested and has no existing UI precedent to reuse (Models' Roles tab governs who can use a
*model*, a materially different access question from who can view an *interceptor's own config*).
Flagged as an open question below rather than assumed away.

**History**: an earlier pass of this design first added a `Configuration` tab, then dropped it
entirely on discovering `ParameterSchema` defaults to an admin-BE-only fetch, then reinstated it once
a Core-direct fetch was built (D7). It also first proposed a Features tab (per direct request), then
dropped it once no Core code path was found reading an interceptor's `features` switches (D6). Both
are settled as the two-tab set above.

### D4: `AssetInterceptorOrigin` widening lives inside the shared `EntityInterceptors` component
`src/components/EntityView/Interceptors/Interceptors.tsx` already branches on view (`isAppRunnerView`,
`isCollapsableView`) and already special-cases Core-origin rows (`hasConfigEntityOrigin`,
`onOpenInNewTab` suppression). It has exactly five consumers: `Entities > Applications/Models/
Application Runners`, `Assets > Models`, and `Assets > App Runners`.

**Correction during implementation**: the design originally planned the merge as a second read added
to each consumer's *page-level* data-fetching (mirroring `assets-app-runners/[id]/page.tsx`'s
`roles`/`interceptors`/`globalInterceptors` triple-read), landing several separate page edits.
Building it, the simpler and more DRY option was to fetch and merge the `Assets > Interceptors`
population **inside `EntityInterceptors` itself** — it already receives the `interceptors` prop, so
adding one `useEffect` there (gated on an explicit `NEEDS_ASSET_MERGE_VIEWS` allow-list:
`Applications`, `Models`, `ApplicationRunners` — see D8 for why `AssetsModels` isn't in it) widens
every applicable consumer through one change point, with no page edits at all for those three. A read
failure falls back to `setAvailableInterceptors(interceptors)`, degrading to the admin-BE-only list.

Also corrected: the entity `Interceptors` view's own `ApplicationRunners`/`Entities` tabs were
initially listed as needing widening too. They don't — those are reverse-index lookups (which
entities already reference *this one, already-resolved* admin-BE interceptor), not attach pickers,
so there is no origin ambiguity to widen. They render through `AddEntitiesView`/`EntitiesTabContent`,
not `EntityInterceptors`, and are untouched by this change.

The widened surfaces are therefore exactly: `Entities > Applications`, `Entities > Models`, and
`Entities > Application Runners`. `Assets > App Runners` and `Assets > Models` are both left
untouched by this component (see D8 for how `Assets > Models` gets fixed instead).

`onOpenInNewTab` for an `AssetInterceptorOrigin.Asset` row now has a real target
(`/assets-interceptors/{path}`), unlike the current Core-`ConfigEntityOrigin.Api` rows on
`Assets > App Runners`, which stay unopenable because `getEntityPath` has no admin-BE route to send
them to.

### D5: Two independent origin axes, not one
A row surfaced by the widened picker can be:
1. `AssetInterceptorOrigin.Entity` (admin-BE) — never carries a `ConfigEntityOrigin`, since the
   admin-BE population has no such split.
2. `AssetInterceptorOrigin.Asset` (Core, API-written) — this is exactly the population
   `ConfigEntityOrigin.Api` already names on the Core-direct surfaces' merged option lists.
3. Config-file-only (`ConfigEntityOrigin.ConfigFile`) — never has an `AssetInterceptorOrigin.Asset`
   counterpart, since a config-file interceptor has no bucket resource to CRUD.

The Source column added by this change shows `Entity`/`Asset`; on surfaces that also carry
`ConfigEntityOrigin` (the already-Core-direct App Runner/Model asset Interceptors tabs), that
existing Api/ConfigFile distinction is unaffected — this change does not touch `withSourceColumn`'s
existing rendering there, only the newly-widened entity-surface pickers gain the new column.

### D6: No Features tab — nothing in Core reads it for an interceptor
Requested directly, but checked against ai-dial-core before building: `Deployment.features`
(`rateEndpoint`, `tokenizeEndpoint`, `truncatePromptEndpoint`, `configurationEndpoint`, and ~20
capability switches like `toolsSupported`/`temperatureSupported`) is declared on the shared base
class, but every actual `getFeatures()` read site outside the interceptor controllers themselves
(`ConsentService`, `HandleRateResponseFn`, `MessagesBaseController`, `ResponsesController`,
`ApplicationSchemaService`) sits on the chat-completion/responses pipeline for Models and
Applications — a pipeline an interceptor sits alongside, not participates in as the invoked
deployment. `BaseInterceptorController`/`ChatCompletionInterceptorController`/
`ResponsesInterceptorController` never call `getFeatures()` at all; only `overrideName` matters
there (already on Properties). The one exception, `configurationEndpoint`, is read generically for
any deployment by `DeploymentFeatureController` — covered by D7, not a Features-tab switch. Building
a tab of ~20 controls Core would silently ignore was rejected in favor of building nothing.

### D7: Configuration tab reads Core's generic deployment-configuration route
`GET /v1/deployments/{name}/configuration` (`RouteTemplate.CONFIGURATION`,
`DeploymentFeatureController`) proxies to `deployment.getFeatures().getConfigurationEndpoint()` for
whatever `Config.selectDeployment(name)` resolves — and that method checks `interceptors.get(id)` as
one of its populations (last, after applications/models/toolsets), so an interceptor's plain Core
name resolves here with no admin-BE row required. This is the Core-side counterpart of the admin
backend's own `{admin-be}/api/deployments/{name}/configuration` (`CONFIGURATION_URL` in
`interceptors-api.ts`) — same route shape, Core-direct instead of admin-BE, confirming the tip that
prompted checking it.

Rather than duplicate `ParameterSchema`'s loading/rendering, that shared component gained an
injectable `getSchema` prop (default: the existing admin-BE `getConfigurationSchema` action, so the
entity surface's behavior is unchanged) — the asset surface passes a new
`getInterceptorConfigurationSchema` action backed by `DeploymentConfigurationApi` instead.

### D8: `Assets > Models`' Interceptors tab gets the Core-direct fix, not the `AssetInterceptorOrigin` merge
Once `Assets > Models` needed a real fix (not just a documented gap), the correct one is the same fix
`Assets > App Runners` already has: read Core's own Api/ConfigFile-merged population directly
(`readConfigEntities(ConfigFileEntityType.Interceptors)` + `readGlobalInterceptors`), rather than
route it through this change's `AssetInterceptorOrigin` merge (D4). The two are not equivalent to
apply together: `ConfigEntityOrigin.Api` (Core's own merged population) *is* the same underlying
`Assets > Interceptors` CRUD population D4 merges in elsewhere — doing both would show every
API-written interceptor as two rows on the Models picker. `Assets/Models`' page-level fetch now
mirrors `assets-app-runners/[id]/page.tsx` exactly, and the two pages' `readConfigEntities`/
`readGlobalInterceptors` helpers were extracted to `src/server/config-entities/read-page-options.ts`
so the read/degrade/warn behavior is defined once. `Assets > Models` was removed from D4's
`NEEDS_ASSET_MERGE_VIEWS` accordingly — the widened surfaces are now exactly the three entity ones.

## Risks / Trade-offs

- **Picker widening touches many surfaces at once** (three entity detail views plus `Assets > Models`)
  → mitigated by centralizing the merge inside the shared `EntityInterceptors` component itself
  (D4), so every consumer gets it from one change point rather than four bespoke page edits.
- **Core's server-side validation error shape is unverified** — `WriteSpec(Interceptor.class, ...)`
  rejects a bad write, but the exact 4xx body isn't confirmed against a live Core instance. Mitigate
  by surfacing whatever `errorMessage` Core returns verbatim (matching how other asset surfaces
  already handle a Core rejection), and treat sharper client-side pre-validation as a follow-up if a
  concrete bad-UX case turns up.
- **No Roles tab is a judgment call** (D3) → flagged as an open question rather than silently decided.

## Open Questions

- Should the asset interceptor's Properties tab expose `userRoles` (a Roles tab, or inline on
  Properties) at all, or is that access question out of scope for this change?
