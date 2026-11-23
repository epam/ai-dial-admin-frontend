## Context

Core's `Router` extends `Deployment` (the base `Model` extends) and is served by the same
`ConfigResourceController` as models, translators and interceptors: `/v1/routers/{bucket}/{path}`,
`/v1/metadata/routers/...`, `/v1/admin/config/file/routers[/{name}]`. A router declares `interfaces` (no
`endpoint`/`responsesEndpoint`), a `mode`, optional `decision` settings, and an optional
`applicationTypeSchemaId` + `applicationProperties` pair. It rejects `upstreams`, `limits`, `pricing`, and
`interceptors`.

The repo already has the machinery for a flat Core-direct platform entity. `Assets/Platform/Translators` is
the nearest whole-surface sibling (flat list, file root, `SimpleEntityHeader`, `assetApi` against a
`ResourceType`); `Assets/Platform/Models` is the nearest field-level sibling (Properties with
`InterfacesField`, Features, Catalog, Roles). A router is Translators' plumbing with Models' content, minus
upstreams and interceptors, plus decision mode and schema properties.

## Goals / Non-Goals

**Goals:**

- A complete admin surface for Core's Router: list, create, delete, edit every field Core accepts, and a
  read-only view of file-declared routers.
- Reuse existing controls and shared maps; introduce no new shape.
- Make the one combination Core rejects at write time and the UI can prevent (decision mode + translated
  interface) unreachable in the form.

**Non-Goals:** see the proposal. In particular, no deployment-listing consumers, no analytics `decision`
rows, no Audit tab.

## Decisions

### D1. Placement: `Assets/Platform/Routers`, route `/platform-routers`

`Platform` holds entities written to `…/platform/{name}` through `assetApi`; `Entities` holds the versioned,
folder-nested user resources (`Apps`, `Toolsets`); `Artifacts` holds user content. A router is a
config-store entity, so it belongs with Models/Translators/Routes. The URL follows `platform-entity-routes`
(`/platform-*`, id segment alone). The label stays "Routers" even though "Routes" sits in the same menu group:
the two are distinct Core entities and the spec names both.

### D2. Menu: AI Gateway, after Toolsets; icon `IconArrowsSplit`

`MenuI18nKey.PlatformRouters` goes between `Toolsets` and `PlatformTranslators`. `IconRouter` is already the
group's icon and `IconRoute` is `Routes`', so neither can distinguish this entry. `IconArrowsSplit` reads as
"one request, many possible targets", which is what a router does. Implementation re-checks
`menu-item-icons.tsx` for a collision and may substitute `IconRouteAltLeft`. `menu-configuration.spec.ts`
pins item order; it is updated, not worked around.

### D3. Server plumbing mirrors Translators

- `ResourceType.ROUTER` with entries in `RESOURCE_TYPE_PREFIX`, `CORE_RESOURCE_URL`,
  `CORE_RESOURCE_METADATA_URL`, and the versionless/`VersionedResourceType` exclusion lists. Routers are
  versionless, `ConfigResourceController`-served (etag from the metadata node, not the content GET), and
  not folder-nested.
- `ConfigFileEntityType.Routers = 'routers'`, added to `READABLE_CONFIG_FILE_TYPES`. The file root and the
  read-only detail need it; this is the deliberate widening that set's comment asks for.
- `app/[lang]/platform-routers/actions.ts`: `getRouters`, `createRouter`, `getRouter`, `updateRouter`,
  `removeRouter`, `bulkDeleteRouters`, `getConfigFileRouters`, `getConfigFileRouter`, with a
  `toRouterPayload` that applies `stripMetadata` (see `core-resource-entity-metadata`).
- `RoutersFolderContext` via `createFolderContext`, registered in `AssetFolderProviders`.
- `PlatformRouters` is added to `FLAT_PLATFORM_VIEWS` so every shared asset-list util keys off it.

Alternative considered: route through the admin backend like entity-side Models. Rejected — Core's PR gives
the entity no admin-backend counterpart, and every Platform sibling is Core-direct.

### D4. Model: `DialRouterResource`

A new resource type in `models/dial/resource.ts`, registered in the `PlatformAsset` union. It reuses
`DialResourceInterface` for `interfaces` (snake_case `base_url`, as `isAsset` surfaces do), the same
display/localized-text fields as `DialModelResource`, and adds `mode`, `decision`, `applicationTypeSchemaId`,
`applicationProperties`. It deliberately omits `upstreams`, `limits`, `pricing`, `interceptors`, `endpoint`,
`responsesEndpoint`, `type`, `tokenizerModel`. `mode` is a `RouterMode` enum (`Proxy`, `Decision`) and
`decision` a `RouterDecision` interface (`body?: boolean`, `timeoutMs?: number`, `maxDecisions?: number`),
in the feature `models.ts`.

Casing note: Core's `Router` has `@JsonAlias` for `applicationTypeSchemaId` and its snake forms, and
`@JsonInclude(NON_NULL)` on the router-only fields. The resource writes camelCase (the shape the config file
and `RouterData` documentation use) and omits unset fields rather than sending `null`.

### D5. Interfaces: reuse `InterfacesField`, plus `isTranslatorDisabled`

`ROUTER_INTERFACE_TYPES` in `constants/deployment-interfaces.ts` lists the four types Core's `RouterData`
reports (`openaiChatCompletions`, `openaiResponses`, `anthropicMessages`, `openaiEmbeddings`) — the same set
as `MODEL_INTERFACE_TYPES`. `InterfacesField` is used with `isAsset`, `translators`, and
`entityBaseUrl={router.baseUrl}`, exactly as Models do: per-row `base_url` is optional when the router has a
top-level `baseUrl`, which is Core's rule. `OVERRIDE_PATH_OPERATIONS` already covers all four types.

Gap: Core rejects a translated interface on a router in `decision` mode. `InterfacesField` and
`InterfaceRow` gain one optional prop, `isTranslatorDisabled`, passed through unchanged; `InterfaceRow`
restricts the mode `Select` to Passthrough when it is set. Switching the router's `mode` to `decision`
clears `mode`/`translator` on every interface row that is in translator mode, the same drop-the-unused-field
move `onChangeMode` already makes. Row validation fields (`-translator`) are reset by the row's own effect.

Alternatives considered: (a) leave the form open and surface Core's rejection verbatim — rejected, an
invalid combination reachable in the UI is avoidable; (b) a router-specific interfaces editor — rejected,
it would duplicate ~1000 lines for one conditional.

`InterfaceFeaturesButton` picks the model feature set only for `ApplicationRoute.PlatformModels`. A router
carries the same `Features` as a model (`FeaturesData.createDeploymentFeatures(router)`), so the check
widens to include `PlatformRouters`. Same for any `view ===` branch in the interface controls found at
implementation time.

### D6. Detail view: tabs `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`

`getTabsForAsset` gets a `PlatformRouters` branch. Reasons per tab:

- **Features**, **Catalog**, **Roles** — `Deployment` fields, same controls as Models
  (`ModelResourceFeatures`, `CatalogPropertiesEditor` with `catalogSchemaId`/`catalogProperties`,
  `AssetRoles` with `userRoles`). The roles list is read Core-direct, as Models do.
- **Parameters** — shown only when `applicationTypeSchemaId` is set; reuses `ParametersTab` (table view over the
  schema's properties, schema defaults seeded on pick), which already writes camelCase `applicationProperties` for
  every view but `AssetsApplications`. The tab never offers the iframe UI view, because Core says the schema
  "contributes nothing else to a router"; without an iframe there is no pending-iframe state, so the
  `useParametersTabGuard` tab-switch guard Applications need is not used. `ParametersTab` and `getAppRunner` gain a
  fallback that reads `applicationTypeSchemaId`. Core answers 502 at request time if stored properties stop
  matching the schema, so the table reports validity through the existing `applicationProperties` field.
- **No Interceptors, no Audit** — Core rejects `interceptors`; Audit waits for the analytics follow-up.
  A router has no limits of its own in Core, so there is no limits control either.

Schema picking reuses `AppRunnersResource` (its `onChangeValue(id, defaults)` contract), fed by
`buildAppRunnerOptions` over Core's config-file `schemas` plus the platform App Runners (`getAllRunners`) — both
Core-direct, so the router page needs no admin-backend read. Core's spec states the
router schema "is still an app-type schema", and an app-type schema listed in `GET
/v1/application_type_schemas/schemas` is exactly the App Runners population. Picking a schema seeds
`applicationProperties` with its defaults; clearing it clears both fields together, so the "set both or
neither" rule holds by construction. Because the picker is shared with applications and is required there, `isOptional` makes it non-required and adds a clear control
for a selection (a router without a schema is the normal case), and `isPopup` opens the same popup picker the
App Runners views use instead of a dropdown.

### D7. Create flow

The create modal uses the generic entity form, as Platform Models do: id, display name (required), display version
(optional) and description. It seeds `userRoles: []` like Models, leaves `mode` absent (absent means proxy), and
navigates to the new detail view. Core's write check (`validateRouterInvariants`) has no "interfaces required"
rule, so a router with no interfaces is accepted. Duplicate is available, as for Models. A router needs `interfaces`, but
Core's rejection of an empty one is surfaced by the existing 422 path on save, as for other entities;
the detail view's `InterfacesField` is where the first interface is added.

### D8. Decision settings

`decision` fields render only when `mode === 'decision'`. `timeoutMs` and `maxDecisions` are numeric
inputs with client-side range checks matching Core (`timeoutMs` > 0, `maxDecisions` 1–10) so a bad value
blocks save through `SaveValidationContext` instead of costing a round trip; `body` is a switch. Switching
back to `proxy` removes the whole `decision` object because Core rejects `decision` on a proxy router.
Switching to `decision` does not seed defaults: absent means Core's defaults (5000 ms, 3, no body), and the
inputs show them as placeholders.

## Risks / Trade-offs

- **Menu name collision (Routes vs Routers)** → distinct icons and the descriptive tooltips/headers already
  used by neighbouring entries; naming is the user's decision.
- **Shared-control edits (`InterfaceRow`, `AppRunnersResource`) affect Models/Apps** → both new props are
  optional with the current behaviour as default, and existing specs for those components must pass
  unchanged.
- **Core may change `RouterData`/`Router` before the PR merges** → the model is a small interface file; the
  resource field list is the single place to adjust. The PR is already at the head of Core's `development`.
- **`READABLE_CONFIG_FILE_TYPES` widening** → intentional and covered by a spec requirement.
- **Schema list source** → if the App Runners option reader does not surface a router-only schema (a schema
  with no completion or MCP endpoint is still listed by Core), the picker would miss it; verified at
  implementation by reading `buildAppRunnerOptions`, with a unit test over a schema that declares no endpoints.

## i18n

Every string goes through `useI18n`; keys live in the enums in `constants/i18n.ts` and text in
`locales/en.ts` (the only locale). Following what Translators touched, the Routers keys are:

- `MenuI18nKey.PlatformRouters`, and the AI Gateway group description (`en.ts` "Models, toolsets,
  translators, routes, and applications served by DIAL Core…") extended to name routers.
- Breadcrumb label (reuses `MenuI18nKey.PlatformRouters`).
- `Router` / `Routers` members of the Delete (entity + bulk-delete), Duplicate, Update, and Create entity
  enums, and of `FileManager` (`Routers`, `Router`, `RoutersEmptyStateTitle`,
  `RoutersEmptyStateDescription`).
- `EntityFields`: `routerMode`, the two mode options, `decisionBody`, `decisionTimeoutMs`,
  `decisionMaxDecisions`, their placeholders (Core defaults) and validation errors, and the schema picker
  label/placeholder; reuse existing keys (`baseUrl`, `overrideName`, `forwardAuthToken`,
  `maxRetryAttempts`) rather than adding duplicates, after checking `BasicI18nKey`/`EntityFieldsI18nKey`.
- `InterfacesI18nKey`: an info line for the Passthrough-only mode in decision mode.
- Tab labels already exist (`Properties`, `Features`, `Parameters`, `Catalog`, `Roles`).

## Migration Plan

Additive; no data migration, no feature flag. `routers` is a new Core entity, so a Core without it answers
404 on the list; the list shows its normal empty/error state and nothing else in the app depends on it.
Rollback is reverting the change.

## Open Questions

- Final icon, after the collision check in D2.
