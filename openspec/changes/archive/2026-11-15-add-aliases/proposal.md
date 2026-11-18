## Why

DIAL Core added **aliases** (epam/ai-dial-core#2234, #2256; PRs #2235, #2236, #2258): a deployment with its own short
name, catalog entry and `userRoles` that forwards every call to a model, application or toolset, and grants its callers
the right to call that target without any rights on it. Admins use it to publish a stable name (`assistant-v1`) while
re-pointing the target, to expose a target to a role without opening the target itself, and to present an application
as a model or a toolset. The admin console has no way to see or manage them, so today they can only be edited in
`aidial.config.json` or through raw Core API calls.

## What Changes

- New **AI Gateway → Aliases** menu item, placed directly after **Translators**, linking to `/assets-aliases` (`assets-*`
  because, like Applications and Toolsets, the entity has several sources).
- A tabbed listing (`TabbedAssetList`) over Core's three alias sources, modelled on `assets-applications` /
  `assets-toolsets`:
  - **Public** — `aliases/public/<name>`; called by full URL. Core keeps these flat (no folders), so this tab is a flat
    grid, not the `public/` file-manager tree Applications and Toolsets use.
  - **Platform** — `aliases/platform/<name>`; merged into Core's config on reload and called by short name.
  - **config.json** — read-only, from `GET /v1/admin/config/file/aliases`.
- Alias **create, read, update, delete, duplicate** on the Public and Platform tabs through `PUT`/`GET`/`DELETE
  /v1/aliases/{public|platform}/<name>` and `GET /v1/metadata/aliases/{public|platform}/`, with `If-Match` /
  `If-None-Match`. Admin-only; hidden in unit mode.
- An alias **details view** with the usual Properties and JSON tabs: `target`, `presentAs`, `userRoles`, display fields
  (`displayName`, `description`, `iconUrl`, `intro`, `descriptionKeywords`, `displayVersion`) and catalog fields.
- A **target picker**: choose the target type (model, application, toolset), then pick the entity from every source it
  has (Public tree, Platform, config.json). The type/`presentAs` pair is constrained to Core's compatibility table.
  Built by generalizing the existing `EntitySelectManager` (see Impact), not by copying `AddApplicationsPopup`.
- **Broken-alias reporting** from `/v1/admin/health/config` (`alias_target_missing`, `alias_target_incompatible`) as a
  banner on the details view, in the manner of `InvalidModelBanner`.
- **i18n**: every user-facing string for the above in `locales/en.ts` and the matching enums in `constants/i18n.ts`
  (menu, list titles, empty states, create/delete/duplicate/update modals, bulk delete, breadcrumbs, properties labels,
  picker, banner, validation messages). Listed per section in `design.md`.
- Docs: `docs/MENU-DOCUMENTATION.md` gains the new item; `docs/org-units-access.md` lists Aliases as hidden in unit mode.

### Non-goals

- Editing config-file aliases (read-only, as for every other config.json tab).
- Calling an alias, a playground, or showing alias usage/analytics rows.
- Versions: Core aliases have no version of their own, so no version selector or `AddVersionModal`.
- Sharing, publication, copy and move of an alias — Core refuses them, so the UI offers none.
- Alias folders — Core allows none.
- Import/export of aliases (Core has no `Alias` manifest kind; the system export already contains stored aliases).
- Changing how Applications, Toolsets or Roles behave; their pickers must keep working unchanged.

## Capabilities

### New Capabilities

- `aliases`: the Aliases surface — menu entry and route, the three-source listing, create/edit/delete/duplicate on the
  stored sources, the details view and its fields, the target picker contract, validation, and broken-alias reporting.

### Modified Capabilities

- `tabbed-asset-listings`: a listing's Public source may be a flat grid (Aliases) as well as the `public/` tree
  (Applications, Toolsets); source availability and the `?tab=` handling cover the new view.
- `core-config-file-client`: `aliases` becomes a readable config-file entity type.
- `core-config-file-client` and `tabbed-asset-listings` together also cover the entity picker (its governing requirement,
  "The entity picker offers the same tabs", lives in `tabbed-asset-listings`).

## Impact

- **New code:** `app/[lang]/assets-aliases/{page,actions,[id]/page}.tsx`;
  `components/Assets/Entities/Aliases/{List,View/*,Properties,CreateProperties,TargetField,…}`;
  `context/assets/AliasesFolderContext.tsx`; `models/dial/alias.ts`; a server-side alias API class beside the other
  `server/core/*-api.ts` clients.
- **Shared code touched** (each is a per-entity registry; all other entities must be unaffected): `types/routes.ts`,
  `components/Menu/{menu-configuration,menu-item-icons}.tsx`, `components/ListView/constants.ts`,
  `components/Breadcrumbs/constants.ts`, `components/Assets/utils.ts`,
  `components/Assets/BaseAssetList/{types,utils}.tsx`, `components/Assets/FlatAssetGrid/readers.ts`,
  `components/Assets/Modals/utils.tsx`, `components/Assets/Platform/utils.ts`,
  `components/Common/FileManager/utils.ts`, `components/EntityView/Modals/Delete/utils.ts`,
  `utils/files/{asset-sources,root-folder}.ts`, `types/config-file-entity.ts`, `constants/config-file-core.ts`,
  `constants/publications-core.ts`, `types/resource-type.ts`, `server/core/asset-metadata.ts`,
  `context/assets/AssetFolderProviders.tsx`.
- **Shared picker change:** `Common/EntitySelectInput/` gains `Toolset` and `Model` entity types and a single-selection
  mode across tabs (today the tabbed picker is multi-select only). `AddApplicationsPopup` is generalized into a popup
  that takes the entity type; the Roles "Add applications" flow must behave as before.
- **Core:** needs a Core version that ships #2235/#2236/#2258 (aliases and the `aliases` config-file type). The alias
  client is hand-written like the other `server/core/*-api.ts` classes. Core's `PUT` does not reject a Platform alias
  whose name clashes with another deployment (it is skipped at the next rebuild), so the FE checks the name before
  writing.
- **No new environment variables.** No effect on the Public, Platform or config.json tabs of other entities.
