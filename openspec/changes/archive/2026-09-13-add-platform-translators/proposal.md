## Why

`ai-dial-core` is adding `Translator` as a managed, blob-backed config entity at the same tier as
`Model`/`Interceptor`/`Role` — served through `ConfigResourceController` at `/v1/translators/{bucket}/{path}`
(PR [epam/ai-dial-core#1919](https://github.com/epam/ai-dial-core/pull/1919), branch `feat/issue-1907`,
expected to merge without shape changes). A translator converts a request from one LLM API interface to
another so a deployment can serve an interface it does not speak itself; deployments reference it by name
from their `interfaces` entries. The admin frontend has six existing platform-only entities in this same
family (`Models`, `App Runners`, `Interceptors`, `Routes`, `Roles`, `Keys`) and no surface for this seventh
one yet.

## What Changes

- Add `Translators` as a new flat, unversioned platform entity — `Catalog ▸ Translators` — directly
  after `Interceptors` in the Catalog menu (closest existing sibling: both are simple, roles-free,
  `platform`-bucket entities with no cascading references on write/delete).
- Add a `DialTranslatorResource` model (Core's `Translator` shape: `in`, `out`, `baseUrl` — no
  `displayName`/`description`/`endpoint`/`features`/`userRoles`, since Core's `Translator` class is a
  plain POJO, not a `Deployment` or `RoleBasedEntity`) and register it in the `PlatformAsset` union.
- Add `ResourceType.TRANSLATOR`, `ApplicationRoute.PlatformTranslators` (`/platform-translators`), and
  add `PlatformTranslators` to `FLAT_PLATFORM_VIEWS` (`utils/files/root-folder.ts`) — the array every
  shared asset-list/action-map util keys off.
- Add `platform-translators` server actions (`getTranslators`/`createTranslator`/`getTranslator`/
  `updateTranslator`/`removeTranslator`/`bulkDeleteTranslators`), mirroring
  `platform-interceptors/actions.ts`'s shape, using `assetApi` against `ResourceType.TRANSLATOR`. A
  `toTranslatorPayload` helper strips Core-rejected read-only fields (`status`, `validationWarnings`,
  `path`, `folderId`) before every write.
- Add a flat `Catalog ▸ Translators` list (create/delete/bulk-delete, no folders beyond the standard
  platform-bucket tree), built on the shared `BaseAssetList`, following `Assets/Platform/Routes/List.tsx`.
- Add a `Catalog ▸ Translators` detail view with a single **Properties** tab: name (`IdControl`, no
  display name — Core's `Translator` class has none), `in`/`out` (enum selects sourced from the existing
  `DeploymentInterfaceType` enum, same population `InterfacesField` already uses), and `baseUrl` (URL
  text field). No Configuration/Features/Roles tab — none of those apply to this entity.
- Add a `TranslatorsFolderContext` (mirroring `InterceptorsFolderContext`), wire the new `Catalog ▸
  Translators` menu item + `PlatformTranslators` i18n key + breadcrumb, and add the required entries to
  the shared `BaseAssetList` action/folder-context maps (`GetAssetActionMap`, `CreateAssetActionMap`,
  `BulkDeleteAssetActionMap`, `AssetFolderContextMap`) plus the toolbar/delete-modal label switches in
  `Assets/utils.ts`, `Common/FileManager/utils.ts`, and `Assets/Modals/utils.tsx`.
- **BREAKING**: none. This is a new, additive surface; the six existing platform entities are unaffected
  beyond `Routes`/`Roles`/`Keys` visually shifting one position down in the Catalog menu.

**Non-goals**:

- No Roles tab. Core's `Translator` class has no `userRoles` field — it extends neither `Deployment` nor
  `RoleBasedEntity` — so there is nothing for a membership-editing widget to bind to.
- No display name or description control. Same reason `Assets/Platform/Routes/CreateProperties.tsx`
  omits them: the field doesn't exist on the entity, and Core rejects a write carrying it.
- No client-side cross-reference or structural validation (e.g. checking `in ≠ out`, or that a
  deployment referencing this translator serves `out` pass-through). Core validates all of this
  server-side (`ConfigPostProcessor.validateTranslator`) and returns a 422 with `validationWarnings`,
  surfaced through the existing error-notification path — the same contract every other platform entity
  already relies on.
- No config-file readability. `Translators` is not added to `READABLE_CONFIG_FILE_TYPES` — that allow-list
  today only covers `Interceptors`/`Roles`/`Settings`, and nothing in this change needs a
  config-file-declared translator to appear in another entity's cross-reference picker.
- No inline-translator authoring UX. Core also accepts a `Translator` written inline inside a model's
  `interfaces` entry (unregistered, single-use); this change only covers the standalone `translators/`
  registry entities Core exposes through `ConfigResourceController` — the entity this admin surface is
  for. Editing a model's own `interfaces.<type>.translator` field is out of scope.
- This change has no dependency on core interface/translator resolution logic (`TranslatorRef.resolve`,
  interface-mode validation) beyond the entity CRUD surface — it does not touch how `Models`/
  `Interceptors` interface fields are edited today.

## Capabilities

### New Capabilities

- `platform-translators`: the `Catalog ▸ Translators` list + detail view — menu entry, flat
  create/delete list, and a Properties-only detail view over DIAL Core's `translators/platform`
  resources.

### Modified Capabilities

_None._ No existing capability's requirements change — the Catalog menu's item order is an
implementation detail of the `platform-translators` capability's own placement, not a requirement
change to any other entity's spec.

## Impact

- **New files**: `app/[lang]/platform-translators/{page.tsx,[id]/page.tsx,actions.ts,actions.spec.ts}`,
  `components/Assets/Platform/Translators/**` (List, View, TabsContent, Properties, CreateProperties +
  tests), `context/assets/TranslatorsFolderContext.tsx`, a `DialTranslatorResource` model.
- **Modified files**: `types/routes.ts` (`ApplicationRoute.PlatformTranslators`), `types/resource-type.ts`
  (`ResourceType.TRANSLATOR`), `utils/files/root-folder.ts` (`FLAT_PLATFORM_VIEWS`),
  `models/dial/resource.ts` (`PlatformAsset` union), `constants/i18n.ts` (new `MenuI18nKey` +
  feature-scoped i18n keys), `locales/en.ts`, `components/Menu/menu-configuration.tsx`,
  `components/Breadcrumbs/constants.ts`, `components/Assets/BaseAssetList/{utils.tsx,types.ts}`,
  `components/Assets/utils.ts`, `components/Common/FileManager/utils.ts`,
  `components/Assets/Modals/utils.tsx`, `app/[lang]/layout.tsx` (mount `TranslatorsFolderProvider`),
  `test-setup.tsx` (mock the new folder context).
- **No changes** to `Models`/`Interceptors`/`Routes`/`Roles`/`Keys`/`App Runners` beyond their menu
  position shifting down by one. No admin-backend change. No `ai-dial-core` change from this repo —
  depends on `ai-dial-core` PR #1919 merging first.
