## Why

DIAL Core (PR epam/ai-dial-core#2216) added a `Plugin` config entity: Java code that Core runs in its own process
in place of an HTTP call. A jar loaded at Core start provides the code; a `plugins` entry declares one named
instance of it with a `type` (which plugin code serves it) and free-form `settings`. Models, applications,
translators and routers will reference an instance by a `dial-plugin://<name>` base URL. Core exposes full CRUD
for the entries (`/v1/plugins/platform/{name}`, `/v1/metadata/plugins/platform/`, config-file read and migrate),
but the Admin Console has no way to see or manage them, so an admin has to hand-write config or call the
Configuration API.

## What Changes

- New **Plugins** entity in the AI Gateway menu group, between `Translators` and `Aliases`, with a list page and a
  detail page.
- **List** (`/platform-plugins`): the shared tabbed listing over two sources, Platform (`plugins/platform/`) and
  config.json (Core's config-file plugins, read-only), with create and single and bulk delete (no duplicate, as for
  Translators).
- **Create**: a name (URL-safe, no `/`), a required `type` text input and a `settings` JSON input.
- **Detail**: a Properties tab (info header, `type`, `settings` JSON input with a "no secrets" hint, and a
  preview notice) and the JSON toggle. No Roles tab and no catalog fields, because Core's `Plugin` is a plain
  POJO with neither.
- Core's `422` on `type` or `settings.<path>` is shown to the user as the save error.
- Hidden in unit mode like the other Platform-only entities. `docs/org-units-access.md` and
  `docs/MENU-DOCUMENTATION.md` are updated.

This follows the **Translators** shape (flat, `platform` bucket only, admin only), not the Aliases shape: plugins
have no folders, no Public bucket, no publication and no role references, so none of the Alias PR's folder,
publication-resolver or entity-picker machinery applies.

### Non-goals

- **Connecting plugins to other entities.** A plugin picker, or a validation hint, on the `base_url` / `baseUrl`
  fields of models, applications, routers and translators (`dial-plugin://<name>`) is a **next step** and is not
  part of this change. Core accepts a name with no entry yet, so the existing free-text fields keep working.
- A `type` dropdown. Core has no endpoint that lists the loaded plugin types, so `type` is free text and Core's
  `422` is the validation.
- Loading, uploading or building plugin jars.
- Role, org-unit or sharing integration. Plugins are admin-only.
- Health display for invalid entries (`status: "invalid"`), unless the shared list already renders it for other
  entities.

## Capabilities

### New Capabilities

- `platform-plugins`: the Plugins entity of the admin console: menu entry and placement, the Platform and
  config.json listing, create, duplicate and delete, name and `type` validation, the Properties and JSON views,
  the preview and no-secrets notices, unit-mode hiding and i18n. Also records the deferred follow-up of linking
  plugins to other entities.

### Modified Capabilities

- `aliases`: the menu-entry requirement says Aliases sits "directly after Translators"; Plugins now sits between
  them, so it becomes "directly after Plugins". No other Alias behavior changes.

## Impact

- **New:** `app/[lang]/platform-plugins/` (`page`, `[id]/page`, `actions`), `components/Assets/Platform/Plugins/`
  (`List`, `View`, `Properties`, `TabsContent`, `CreateProperties`), `context/assets/PluginsFolderContext.tsx`,
  `models/dial/` plugin resource type.
- **Registered (one line each) in the per-entity registries Translators already use:** `ApplicationRoute`,
  `ResourceType`, `ConfigFileEntityType`, `assets-core`, `config-file-core`, `publications-core`,
  `asset-metadata` merger, `BaseAssetList`, `FlatAssetGrid/readers`, `Assets/utils`, `Assets/Modals/utils`,
  `Platform/utils`, `FileManager/utils`, `Delete/utils`, `ListView/constants`, `JsonToggleWithFormats`,
  `EntityMainProperties`, breadcrumbs, menu configuration and icon, `AssetFolderProviders`, i18n enums and
  `locales/en.ts`.
- **Docs:** `docs/MENU-DOCUMENTATION.md`, `docs/org-units-access.md`.
- **Backend dependency:** the Core version that carries the Plugins endpoints. Against an older Core the list
  fails to load like any unsupported resource type. Whether to gate the menu item on a Core capability is a
  design question.
- **Risk:** the touched registries are shared with every Platform entity, so the new entries must not change
  Translators, Routers or Aliases behavior. Covered by the registry specs.
