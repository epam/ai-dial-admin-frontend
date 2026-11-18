## Context

Core's `Plugin` (`config/.../Plugin.java`) is a plain POJO: `type` (required, non-blank) and `settings` (object,
`{}` when absent); no other field is accepted. Entries live in the `platform` bucket only, need the admin role,
and are served by `GET|PUT|DELETE /v1/plugins/platform/{name}` and `GET /v1/metadata/plugins/platform/`. File
entries are read through `GET /v1/admin/config/file/plugins[/{name}]`. Every endpoint is `x-preview`.

The closest existing entity is **Translators** (`platform-translators`): flat, Platform bucket only, admin only,
plain POJO, no Roles tab, a create form that must send every required field because Core rejects a name-only
write. Aliases (PR #5547) is *not* the template: they are folder-scoped, have a Public bucket, are publishable and
are role-referenced, which is why that PR touched 121 files. Plugins need none of that.

## Goals / Non-Goals

**Goals:**
- List, create, view, edit and delete plugin entries, plus a read-only config.json source.
- Follow the Translators shape exactly, so the change is registry entries plus one small component folder.
- Surface Core's `422` (on `type` / `settings.<path>`) as the save error.

**Non-Goals:**
- Linking plugins to other entities (picker or validation on `dial-plugin://<name>` in models, applications,
  routers, translators). **Next step**, deliberately out of this change: Core accepts a name with no entry yet,
  so the existing free-text URL fields keep working and nothing here blocks the follow-up.
- A `type` dropdown (Core cannot list loaded plugin types), Roles / org-unit / sharing integration, jar handling.

## Decisions

### D1. Translators shape, not Aliases
Route `ApplicationRoute.PlatformPlugins = '/platform-plugins'`, `ResourceType.PLUGIN` registered like
`TRANSLATOR` (flat, versionless, in `PLATFORM_BUCKET_RESOURCE_TYPES`), `ConfigFileEntityType.Plugins = 'plugins'`
in the readable config-file types, a `mergePluginResource` merger built on `flatMetadataFields` (plugins declare
none of the merge layer's grafts, same as translators), and a `PluginsFolderContext` registered in
`AssetFolderProviders`. Alternative considered: the Alias dual-bucket flat resource. Rejected: Core has no Public
bucket for plugins, and the dual-bucket machinery (flat Public source, name-clash pre-check, picker) would be dead
code.

### D2. Location
`app/[lang]/platform-plugins/` and `components/Assets/Platform/Plugins/` (`List`, `View`, `Properties`,
`TabsContent`, `CreateProperties`), next to `Translators/`. `Platform/` is where every Platform-bucket-only sibling
lives; `Entities/` holds the folder-based Alias and Apps entities.

### D3. Menu placement
AI Gateway group order becomes `Models, Toolsets, Routers, Translators, Plugins, Aliases, Routes, Applications, ...`.
`MenuI18nKey.PlatformPlugins`, an icon in `menu-item-icons.tsx` (a plug-style tabler icon), breadcrumb entry and
`ListView` title, mirroring Translators. Unit-mode hiding needs no new code: the menu is whitelisted by namespace
and `getRouteNamespace` returns `undefined` for the route, as for Aliases; a spec asserts it.

### D4. Fields and write payload
Create and detail share `PluginCreateProperties` (as `TranslatorCreateProperties` does, `isModal` toggles layout):
`IdControl` name (create only, immutable after), a required `type` text input, and `settings` through the existing
`JsonEditorInput` (popup JSON editor, `{}` default). Name rule: URL-safe and no `/` (Core drops such a name from a
file with a warning and the name is a resource path segment); the shared `IdControl` validation is reused and a
`/` is blocked. The payload is built by `toPluginPayload`: `stripMetadata` plus dropping `name`, `createdAt`,
`updatedAt`, so only `type` and `settings` are sent (Core rejects any other field). `type` is trimmed and required
in the form because Core refuses a blank one.

### D5. `type` is free text
Core exposes no list of loaded plugin types, and an unknown `type` is a `422` on a normal write (accepted only with
`config.write.softValidation`). The form therefore validates presence only and shows Core's rejection text verbatim,
as Translators do. Alternative: a dropdown fed by a new Core endpoint, which does not exist.

### D6. Settings and preview notices
The `settings` field carries a `FieldCaveat` hint that settings hold no secrets (Core stores and returns them
as written, and credentials come from the Core pod environment). A short preview notice on the Properties tab says
plugins are a preview Core feature and may change incompatibly. Both come from i18n. No Preview badge component
exists to reuse, and a new shared one is not worth building for one entity.

### D7. Config-file source and errors
The config.json tab lists `getConfigFilePlugins` names and opens the detail view read-only
(`setEntityReadOnly`), exactly as Translators. A write the plugin code rejects returns `422` with a warning whose
`field` is `settings` or `settings.<path>`; the first version shows the existing save error notification with
Core's message, without mapping it onto the field. Per-field mapping is a possible follow-up.

### D8. Docs and specs
New consolidated capability `platform-plugins`. `docs/MENU-DOCUMENTATION.md` gets the Plugins item after
Translators; `docs/org-units-access.md` adds Plugins to the "Hidden in unit mode" list. Specs that enumerate the
AI Gateway menu order (`menu-group-visibility`, `aliases` "directly after Translators") are checked at apply time
and get a delta only if they assert the old order.

## Risks / Trade-offs

- [Registries are shared with all Platform entities] → add one entry per table, never edit a shared branch; the
  existing registry and `TabbedAssetList` specs must stay green untouched.
- [Menu order change breaks the `aliases` spec: "Aliases appears immediately after Translators"] → Plugins now
  sits between them. Either update that scenario in a delta of `aliases` or reword it. Resolve in apply, task 5.1.
- [Older Core without plugin endpoints] → the list fails like any unsupported resource. No Core capability gate in
  v1: Core ships no feature flag for plugins, and gating would need a new probe. Revisit if the menu entry confuses
  users on older Core.
- [`settings` is free JSON, so edits can silently lose keys] → the popup editor validates JSON before commit, as it
  does elsewhere.
- [Core is preview, so the shape may change] → the entity is two fields, and everything Core-specific lives in
  `toPluginPayload` and the model type.

## Open Questions

- Per-field display of Core's `422` warnings (`type`, `settings.<path>`): defer, or do it with the next-step
  picker work?
- The menu icon: which tabler plug icon (`IconPlug` vs `IconPuzzle`) matches the theme set.
