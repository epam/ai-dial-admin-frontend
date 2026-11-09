## Why

DIAL Core ([epam/ai-dial-core#2232](https://github.com/epam/ai-dial-core/pull/2232)) adds `Router` as a
deployment kind: a deployment that picks the deployment serving a request, either by proxying the request
to a router service (`mode: proxy`) or by being asked which deployment should serve (`mode: decision`).
Routers are managed like models, in the `platform` bucket at `/v1/routers/platform/{name}`. The admin console
has a surface for every sibling platform entity (Models, Translators, Routes, App Runners, …) and none for
this one, so an administrator can only create a router by editing Core's config file or calling Core directly.

## What Changes

- Add `Routers` as a flat, unversioned platform entity under **AI Gateway**, directly after `Toolsets`
  (menu order: Models, Toolsets, **Routers**, Translators, Routes, Applications, …), linking to a new
  `/platform-routers` route, with its own menu icon.
- Add a flat Routers asset list (`platform` root with create, delete, bulk-delete; synthetic read-only
  `file` root for config-file-declared routers), built on the shared `BaseAssetList`, following
  `Assets/Platform/Translators/List.tsx`.
- Add a Routers detail view with tabs `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`:
  - **Properties** — name, display fields, `baseUrl`, `forwardAuthToken`, `maxRetryAttempts`,
    `overrideName`, `mode` (`proxy` / `decision`), the `decision` settings (`body`, `timeoutMs`,
    `maxDecisions`) shown only in decision mode, the app-type schema picker, and the shared `Interfaces`
    editor.
  - **Features**, **Catalog**, **Roles** — the same controls Models use; a router is a `Deployment` and
    carries the same fields.
  - **Parameters** — the values of `applicationProperties`, edited against the picked app-type schema,
    shown only when a schema is set.
  - No `Interceptors` tab: Core rejects `interceptors` on a router.
- Let the shared `Interfaces` editor offer only the Passthrough mode while a router is in `decision` mode,
  because Core rejects a translated interface there.
- Add `ResourceType.ROUTER`, `ConfigFileEntityType.Routers` (readable), `ApplicationRoute.PlatformRouters`,
  server actions, a `RoutersFolderContext`, the `DialRouterResource` model, i18n keys, breadcrumbs, and the
  entries of the shared asset-list maps.
- **BREAKING**: none. Additive surface; `Translators`, `Routes` and the entries after them shift one
  position down in the AI Gateway menu group.

**Non-goals**:

- No limits, pricing, upstreams, or interceptors UI. Core rejects those fields on a router; the form never
  offers them.
- No `/v1/deployments` / `/v1/deployment-names` consumer changes (`object: "router"` entries) — other
  surfaces that list deployments are untouched.
- No analytics changes for the router `decision` object in analytics rows or the audit/trace views.
- No Audit tab. Revisit with the analytics follow-up.
- No client-side re-implementation of Core's cross-entity validation (a router naming an unknown translator,
  a schema that no longer matches the stored properties, a candidate that is itself a router). Core answers
  those with a rejection, shown through the existing error-notification path.

## Capabilities

### New Capabilities

- `platform-routers`: the `AI Gateway ▸ Routers` list and detail view — menu entry, flat asset list with
  platform and file roots, tab set, Properties fields, decision-mode settings, schema and properties,
  roles, and file-defined read-only view over DIAL Core's `routers/platform` resources.

### Modified Capabilities

- `deployment-interfaces-config`: the `Interfaces` section also renders on `AI Gateway ▸ Routers` with the
  four interface types, and hides the Translator mode while the router is in decision mode.
- `platform-entity-routes`: a seventh platform route, `/platform-routers`.
- `core-config-file-client`: `routers` joins the readable config-file types.

## Impact

- New: `apps/ai-dial-admin/src/components/Assets/Platform/Routers/`,
  `app/[lang]/platform-routers/`, `context/assets/RoutersFolderContext.tsx`, `DialRouterResource` in
  `models/dial/resource.ts`.
- Touched: `Menu/menu-configuration.tsx`, `Menu/menu-item-icons.tsx`, `types/routes.ts`,
  `types/resource-type.ts`, `types/config-file-entity.ts`, `constants/{assets-core,config-file-core,
  publications-core,deployment-interfaces,i18n}.ts`, `locales/en.ts`, `Breadcrumbs/constants.ts`,
  `utils/tabs/utils.ts`, `utils/files/root-folder.ts`, `context/assets/AssetFolderProviders.tsx`, the shared
  `BaseAssetList` / `Assets/utils.ts` / `Assets/Modals/utils.tsx` / `Common/FileManager/utils.ts` maps, and
  `BaseControls/InterfacesField/{InterfacesField,InterfaceRow}.tsx` (one optional prop).
- i18n: new keys in the Menu, Delete/Duplicate/Update/Create entity, FileManager, EntityFields, and Interfaces enums and `locales/en.ts`.
- Docs: `docs/` and `.claude/reference/areas.md` mention the AI Gateway entities; update in the same change.
- Backend: only DIAL Core `/v1/routers/...` and `/v1/admin/config/file/routers`; no admin-backend call.
