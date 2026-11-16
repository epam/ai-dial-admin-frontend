## Context

Core aliases (see `proposal.md`) live in three places:

| Source      | Stored at                 | Called as                    | In Core's config?                       | FE access                                               |
| ----------- | ------------------------- | ---------------------------- | --------------------------------------- | ------------------------------------------------------- |
| config.json | `aliases` in the config   | `assistant-v1`               | yes                                     | read-only, `GET /v1/admin/config/file/aliases[/<name>]` |
| Platform    | `aliases/platform/<name>` | `assistant-v1` (short name)  | yes — merged on reload (#2258)          | `PUT/GET/DELETE /v1/aliases/platform/<name>`, list `GET /v1/metadata/aliases/platform/` |
| Public      | `aliases/public/<name>`   | `aliases/public/<name>` (URL)| no — read on demand per call (#2236)    | same, with `public`                                      |

All management endpoints are admin-only (`GET` included), honour `If-Match`/`If-None-Match`, reject folders and names
outside `[A-Za-z0-9._-]` with 400, and reject any body field other than `target`, `presentAs`, `userRoles`,
`displayName`, `displayVersion`, `iconUrl`, `description`, `intro`, `descriptionKeywords` (a `status` and a `name` equal
to the URL name are tolerated so a `GET` answer can be sent back). A stored blob that calls ignore comes back from `GET`
with `status: invalid` and `validationWarnings`.

The admin console already has the pieces: `TabbedAssetList` (Public / Platform / config.json tabs, used by Applications
and Toolsets), `FlatAssetGrid` (Platform and config.json grids), the platform-entity registries
(`BaseAssetList/utils.tsx`, `FlatAssetGrid/readers.ts`, …), the `config-file-entity-views` detail routes, and the
`Common/EntitySelectInput` picker (today used only by role limits, through `AddApplicationsPopup`). Aliases are the
first entity whose Public source is **flat** rather than the `public/` tree, and the first that needs to _pick one
entity of a chosen type_.

## Goals / Non-Goals

**Goals:**

- Aliases managed end to end on the Public and Platform sources, visible read-only from config.json, in the shape every
  sibling entity has (list, create, duplicate, delete, detail view with Properties and JSON).
- A target picker that reuses the existing entity picker instead of forking it.
- Every user-facing string through `t()`.
- No behavior change for Applications, Toolsets, Roles or any other entity.

**Non-Goals:** as in `proposal.md` (no config-file editing, versions, share/publish/copy/move, folders, import/export,
usage views).

## Decisions

### D1. Route and placement: `/assets-aliases`, under `components/Assets/Entities/Aliases/`

`assets-*` is the convention for entities with several sources (`assets-applications`, `assets-toolsets`);
`platform-*` is for single-source platform entities. The listing is `TabbedAssetList view={ApplicationRoute.AssetsAliases}`
in a ten-line `List.tsx`, exactly like `Entities/Toolsets/List.tsx`. View code is `Entities/Aliases/View/{View,TabsContent,Properties}.tsx`
(the `Entities/Toolsets/View/` shape). Menu: **AI Gateway**, directly after `PlatformTranslators`.

_Alternative — `platform-aliases` under `Assets/Platform/`_: rejected; it would hide two of the three sources behind a
name that says "platform", and `TabbedAssetList` is keyed on the `assets-*` views.

### D2. A flat Public source, separate from the Public tree

`utils/files/asset-sources.ts` treats "has a Public source" and "Public is the `public/` tree" as one thing
(`PUBLIC_SOURCE_VIEWS`, `hasPublicSource`). Split them:

- `PUBLIC_TREE_VIEWS` = Applications, Toolsets (unchanged behavior) with `hasPublicTree(view)`.
- `FLAT_PUBLIC_VIEWS` = Aliases, with `hasFlatPublic(view)`.
- `hasPublicSource(view)` = either, so callers that only ask "is there a Public tab" keep working.

For a flat-Public view `getAvailableSources` returns `[Platform, Public, ConfigFile]` for a full admin. Aliases are
admin-only, like every platform entity: `filterMenuForUnitMode` already drops any menu item whose route has no unit
namespace, so the item never appears for a unit user and `getRouteNamespace('/assets-aliases')` must stay undefined.
A unit user who types the URL gets what they get on `/platform-translators` today — the Platform source only, whose
admin reads Core refuses — so `getAvailableSources` returns `[Platform]` for a flat-Public view in unit mode rather
than an empty list that `parseSourceParam` cannot index. The default tab is **Platform**: a Platform alias behaves like a config alias (short name, merged into config) and is the
bucket Core's issue #2256 argues is the right home for admin-managed aliases; the Public tab is the exception, not the
default. Public is a flat grid read through `useFlatAssets(view, AssetSource.Public)`, so it is **counted**: badge on all
three tabs and a header count (sum of the three), unlike the tree views. `getHeaderCount` keeps withholding the count
when a source's read failed.

`useFlatAssets` and `FlatAssetGrid` take the source as a parameter already (Platform / ConfigFile); adding `Public` for
a flat view is one more branch in `FlatAssetGrid/readers.ts` (`list` for the bucket) rather than a new grid.

_Alternative — render the alias Public tab in the file-manager tree_: rejected; Core allows no folders under
`aliases/public/`, and the tree's folder affordances (create folder, move, rename) would all be dead controls.

_Alternative — omit the Public tab, Platform only_: rejected by the user's scope decision (Platform, Public and file together).

### D3. Aliases ride the generic `AssetApi`, as a dual-bucket flat resource type

No bespoke client. Every platform entity and both dual-bucket entities (Applications, Toolsets) go through
`AssetApi` and the type maps in `constants/assets-core.ts`; a one-off `AliasApi` would be a second shape for the same
job. `ResourceType.ALIAS` is registered with prefix `aliases/` (the **bucket is part of the path**, `public/<name>` or
`platform/<name>`, as for Applications) so the same type serves both buckets:

- `CORE_RESOURCE_URL` / `CORE_RESOURCE_METADATA_URL` give `v1/aliases/` and `v1/metadata/aliases/`;
- `FOLDER_NESTED_VERSIONLESS_TYPES` gets `ALIAS`, so a path parses as folder + plain name (`platform/` + `x`) and a `__`
  in a name is never read as a version; `VersionedResourceType` and `PublishableResourceType` exclude it;
- it is **not** in `PLATFORM_BUCKET_RESOURCE_TYPES` (those bake `platform/` into the prefix) and **not** in
  `RESOURCE_CONTROLLER_TYPES` (Core serves aliases from `ConfigResourceController`, so the etag is read from the
  metadata node, like models);
- `ASSET_MERGERS[ALIAS]` is `mergeAliasResource`: content plus `_metadata` (name, bucket-qualified `path`,
  `folderId`, author, timestamps) plus the `status`/`validationWarnings` that a read of an ignored blob adds, relocated
  into `_metadata` by `splitValidityFields`, as for every other `ConfigResourceController` type.

Listing is `assetApi.list(token, ResourceType.ALIAS, 'platform/' | 'public/')`; create is `assetApi.put` (no
`allowOverride`, so it carries `If-None-Match: *`); update passes the loaded `etag`; delete is `assetApi.delete`.
Core's own `docs/open_api_core.yaml` still says the `bucket` parameter "Must be public" although the code accepts
`platform` since #2258 (that PR did not update the file); the URL shape above follows the code. Config-file reads use
the existing `configFileApi` with `ConfigFileEntityType.Aliases = 'aliases'` added to the enum, to
`READABLE_CONFIG_FILE_TYPES` and to `CONFIG_FILE_ENTITY_TYPE_BY_VIEW`. The SDK (`@epam/ai-dial-typescript-sdk`) is not
involved: it is not installed in this checkout, and the resource clients do not use it.

The write path builds the body from an allow-list of the nine fields above. This is stricter than the sibling
`stripMetadata` approach on purpose: Core answers 400 to _any_ other field, including the `_metadata` object the merged
detail entity carries and the read-only `name`/`status`/`validationWarnings` (Core tolerates `name` equal to the path and
`status`, but nothing else it adds). Sending only the allow-list makes a stale or extra field impossible rather than a
runtime 400.

Entity identity in the FE is the **path** `public/<name>` or `platform/<name>` (what `isPlatformBucketPath` /
`isPublicPath` already read); config.json aliases open through the existing config-file detail route. `ResourceType`
gains `ALIAS`; `server/core/asset-metadata.ts` gets a merge function in the flat, unversioned family
(`mergeTranslatorResource` is the template); `ALIASES_PREFIX = 'aliases/'` joins the other prefixes in `constants/publications-core.ts`.

### D4. Resource shape and read normalisation

`models/dial/alias.ts`:
`DialAliasResource { name, target: { path }, presentAs?: AliasPresentAs, userRoles?, displayName?, displayVersion?, iconUrl?, description?, intro?, descriptionKeywords?, status?, validationWarnings? }`,
`enum AliasPresentAs { Model = 'model', Application = 'application', Toolset = 'toolset' }`,
and `enum AliasTargetType { Model, Application, Toolset }`.

Unlike Applications and Toolsets (whose reads come back snake_case, see `DialSnakeCaseRoleCatalogFields`), an alias is
read and written **camelCase only**: Core's `ConfigResourceController.handleAliasGet` serialises through
`StoredAliases.toJson`, which emits exactly `presentAs`, `target`, `userRoles`, `displayName`, `displayVersion`,
`iconUrl`, `description`, `intro`, `descriptionKeywords` (each only when set), then adds `name` and `status`. For a blob
Core ignores it returns the stored body with `status: "invalid"` and
`validationWarnings: [{ field, message }]`. `PUT` also accepts the snake_case spellings, but the FE never sends them. No
snake_case normaliser is needed, and `DialSnakeCaseRoleCatalogFields` is not reused.

### D5. Target picker: generalise `EntitySelectManager`, add a single-selection mode

`AddApplicationsPopup` is a 60-line shell; the reusable layer is `Common/EntitySelectInput/`, already keyed by
`EntitySelectType` through `ENTITY_SELECT_CONFIGS`. Changes:

1. **Entity types.** Add `EntitySelectType.Toolset` (route `AssetsToolsets`, `ToolsetsFolderProvider`) and
   `EntitySelectType.Model` (route `PlatformModels`, `ModelsFolderProvider`; no Public source). Each is one
   `ENTITY_SELECT_CONFIGS` entry, like `Application`.
2. **Tabbed vs tree.** `EntitySelectManager` falls back to the single tree whenever `!hasPublicSource(route)`, which would
   send Model (Platform + config.json only) to the wrong component. Change the gate to "tabbed whenever a
   multi/single-entity callback is supplied", leaving Skill and File (which never pass one) on the tree.
3. **Single-selection mode.** Add `onChangeSelectedEntity?: (entity: PickedEntity | null) => void` beside the existing
   multi callback. In `TabbedEntityPicker` a pick on any tab clears picks on the other tabs (the tabs stay mounted, so
   this is state, not remounting), the Public tree and the flat grids use single selection, and the same-name-on-two-flat-tabs
   rule still holds (both store the bare name). `PublicEntityTree` already has a single-path mode
   (`onChangeSelectedPath`); `FlatAssetGrid`'s select mode is hard-wired to `MULTI_ROW_SELECTION`, so it gains an
   `isSingleSelect` flag that selects the single-row mode instead.
4. **Popup.** Generalise `Roles/AddApplicationsPopup.tsx` into `Common/EntitySelectInput/SelectEntitiesPopup.tsx` taking
   `entityType`, `isSingle`, an optional `header`, and `onApply`; the portal id comes from the type's config.
   `AddApplicationsPopup` stays as a thin wrapper (`entityType=Application`, multi) so the Roles flow and its specs do
   not move.
5. **Mapping to `target.path`.** One util, `toAliasTargetPath(type, picked)`:
   Public → `<type-plural>/<picked.path>` (e.g. `applications/public/team/assistant`, `toolsets/public/search`);
   Platform and config.json → `<type-plural>/<name>` (bare name, the form the picker already emits for them and the form
   Core's merged platform entities answer to). The inverse, `parseAliasTargetPath`, seeds the field when editing; a path
   it cannot parse (a hand-edited blob) is shown as plain text and left unchanged until the user picks again.

_Alternative — copy `AddApplicationsPopup` per entity_: rejected; the popup carries no per-type logic, so three copies
would differ only in an enum value.

### D6. Target type, `presentAs` and the compatibility table

The form asks **Target type** (Model / Application / Toolset) first, then **Target** (the picker for that type, single
selection), then **Present as**. Core's table is encoded once as a constant:

| Target type | Allowed `presentAs`                 |
| ----------- | ----------------------------------- |
| Model       | Model, Application                  |
| Application | Model, Application, Toolset         |
| Toolset     | Toolset                             |

(Application → Toolset additionally needs the application to have `mcp`; the FE cannot tell cheaply, so it offers the
option and lets Core's 400 `validationWarnings` message surface verbatim.) `presentAs` defaults to the target type
(Core's own default) and is stored only when the user changes it, so a plain alias writes no `presentAs`. Changing the
target type clears the target and re-validates `presentAs`; changing `presentAs` to one the new target type does not
allow is impossible by construction because the option list is derived.

### D7. Validation and error behavior

Client side, via the existing `SaveValidationContext`: `name` required and `^[A-Za-z0-9._-]+$` (the only characters
Core accepts; also no `/`), `target` required, `presentAs` within the table. Core's `PUT` answers 400 with
`validationWarnings` for a target of an unsupported form, an alias as target, an incompatible `presentAs`, a resource
target outside the public and platform buckets, or an existing resource target whose type does not fit; those messages
are shown verbatim in the error notification, as Translators do. A target that does not exist is accepted by Core and
by the form. A `412` on save follows the existing etag-conflict handling. Create/duplicate/delete success and failure
use the established notification patterns.

**Name clashes are the FE's to prevent, for Platform aliases.** Verified in Core: `ConfigResourceController` guards
the other five deployment types with `rejectDuplicateDeploymentId` (409), but `handleAliasPut` does **not** call it.
A platform alias whose name equals a model, application, toolset, interceptor, router or another alias is therefore
written (200) and applied, and only the next full config rebuild skips it (`skipOnDuplicate` — "Duplicate deployment
ID"), after which the alias silently stops working and appears in the health report. The six types share one flat
namespace (`isDeploymentIdTakenByAnotherDeploymentType`). So `createAlias` and duplicate, for the **Platform** bucket
only, read the names of those six types (platform resources plus config-file population, through the readers the
listings already use) and refuse a taken name with a validation failure before the `PUT`. This is best-effort, not a
lock: a concurrent write can still race it, and Core remains the final arbiter at reload. A **Public** alias cannot
clash — its name is the URL `aliases/public/<name>`, never a config deployment name — so it is not pre-checked.

A `GET` answering `status: invalid` shows its `validationWarnings` (`field`, `message`) in a banner on the details view
(`InvalidModelBanner` is the template). The viewed alias's entry in `/v1/admin/health/config` is read once on the
details page (admin only). The response lists `skipped: [{ id, reason }]`; the entry is matched by `id`: `aliases/<name>`
for a config or Platform alias, `aliases/public/<name>` for a Public one, and a duplicate-name skip may also appear under
its canonical id with Core's free-text reason. Reasons `alias_target_missing` and `alias_target_incompatible` map to the
two banner messages; any other reason is shown as Core's text. No global dashboard.

### D8. i18n — one place per concern, reusing before adding

`locales/en.ts` is the only locale file. Following Translators and Toolsets, the keys land in these enums
(`constants/i18n.ts`) with matching trees in `locales/en.ts`:

| Enum              | New keys                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `MenuI18nKey`     | `PlatformAliases` → "Aliases" (menu item, list title via `listViewTitleMap`, breadcrumb root)               |
| `DeleteI18nKey`   | `Entities.Alias` → "Alias"; `BulkDelete.Aliases` → "Aliases"                                                |
| `DuplicateI18nKey`| `Entities.Alias` → "Alias"                                                                                  |
| `UpdateI18nKey`   | `Entities.Alias` → "Alias"                                                                                  |
| `CreateI18nKey`   | `Entities.Alias` → "Alias"                                                                                  |
| `FileManagerI18nKey` | `Aliases`, `Alias`, `AliasesEmptyStateTitle` → "You don't have any aliases", `AliasesEmptyStateDescription` → "Create an alias using the Create button" |
| `AliasI18nKey` (new section) | `Target`, `TargetType`, `TargetTypeModel/Application/Toolset`, `PresentAs`, `PresentAsModel/Application/Toolset`, `TargetPlaceholder`, `SelectTarget`, `ChangeTarget`, `SelectModelTarget/ApplicationTarget/ToolsetTarget` (picker headers, singular), `DisplayVersion`, `NameInvalid`, `TargetRequired`, `UnparsableTarget`, `InvalidBannerTitle`, `TargetMissing`, `TargetIncompatible` |

Reused unchanged: `BasicI18nKey` / `ButtonsI18nKey` (Create, Delete, Duplicate, Cancel, Apply, Close, Search),
`AssetTabsI18nKey` (Public / Platform / config.json tab labels and `TabsLabel`), `EntitiesI18nKey` (display name,
description, icon, author, created/updated columns). Test `t()` returns the key, so specs assert keys; no spec asserts
English text.

### D9. Menu, breadcrumbs, docs

`menu-configuration.tsx`: `{ key: MenuI18nKey.PlatformAliases, href: ApplicationRoute.AssetsAliases }` after Translators
in AI Gateway; `menu-item-icons.tsx` maps it to a Tabler icon (`IconArrowsRight`/`IconLink` family; chosen when the
icon map is open). The AI Gateway group has no feature flag, so the item shows whenever the group does; the existing
`menu-configuration.spec.ts` ordering assertion is updated. `components/Breadcrumbs/constants.ts` gets the
`AssetsAliases` entry (`PlatformTranslators` is the template). `docs/MENU-DOCUMENTATION.md` gets the item description, and `docs/org-units-access.md` adds Aliases to its "Hidden in
unit mode" list.

## Risks / Trade-offs

- **Shared `asset-sources.ts` change affects Applications/Toolsets.** → Keep `hasPublicSource`'s contract for the two tree
  views byte-for-byte (spec scenarios for them unchanged), and add table-driven tests over all views for
  `getAvailableSources` / `getDefaultSource` / `getHeaderCount`.
- **Picker gate change (D5.2) could move Skill/File onto the wrong component.** → The gate is keyed on a callback only
  the role flow and aliases pass; a spec pins Skill/File to the tree path.
- **A Platform alias whose name clashes with another deployment is accepted by Core's `PUT` and skipped on the next
  rebuild** (verified in Core, see D7), so the FE could create an alias that works until the next reload. →
  Pre-check against the six colliding types before a Platform write (D7); race windows remain and are Core's to resolve.
- **Core's OpenAPI for aliases is stale** (`bucket` documented as "Must be public"). → The client follows the code and
  #2258's description; the first read against `platform` in a test environment is the first real confirmation, covered
  by the `alias-api` specs mocking Core's documented behavior.
- **Two names for one thing**: a Public alias is called `aliases/public/<name>`, a Platform one `<name>`. → Not shown
  on the details view (the admin asked for the "Called as" field to go); the Public/Platform tab already says which.
- **Admin-only listing in unit mode.** → Hidden from the unit menu by the existing namespace filter (a spec pins that
  `/assets-aliases` has no namespace) and listed under "Hidden in unit mode" in `docs/org-units-access.md`; a typed URL
  behaves like the other platform entities.

## Migration Plan

Additive: no data migration, no env variable. Ships behind the existing admin-only access; requires a Core that includes
#2235/#2236/#2258 — against an older Core the listing's requests 404 and the established request-error notification
shows. Rollback is reverting the PR series; no stored data is touched by the FE beyond what the admin creates.

## Open Questions

Resolved against the Core checkout (`development`, after #2235/#2236/#2258):

1. _SDK coverage_ — not determinable here (the SDK is not in `node_modules`); decided: hand-written client (D3).
2. _`userRoles` vs `user_roles` on read_ — camelCase only (D4).
3. _Does `PUT` refuse a clashing Platform name?_ — no; the FE pre-checks (D7).
4. _Single selection in `FlatAssetGrid`_ — not supported (`MULTI_ROW_SELECTION`); it gains `isSingleSelect` (D5.3).

Still open:

5. Tab order/default: this design puts **Platform** first and default (D2). The Applications/Toolsets order is
   Public, Platform, config.json. If consistency with those matters more than the Platform-first argument, swap both — a
   one-line change in `getAvailableSources`/`getDefaultSource` and the spec.
6. Menu icon for Aliases — picked during implementation from `@tabler/icons-react`.
