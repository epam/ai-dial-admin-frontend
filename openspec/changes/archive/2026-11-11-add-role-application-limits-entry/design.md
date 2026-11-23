## Context

The Entities tab of a platform role (`Assets/Platform/Roles/Entities.tsx`) has one `PrimaryButton` that opens
`AddEntitiesGrid` over `availableModels`. Applying calls `addModelLimits`, which writes `limits[name] = {}` for
each pick and keeps an existing entry untouched (`updatedLimits[model.name] ?? {}`).

Core keys `limits` by plain deployment name, so nothing in the stored map says whether an entry is a model or an
application. Applications live in three roots of the tree `AppsFolderProvider` serves: `file/` (config file,
`EntitySource.File`), `platform/` and `public/` (`BucketType`). `EntitySelectManager` already supports a
multi-select mode and reports `row.path` only; it is shared by the Skill and File pickers.

## Goals / Non-Goals

**Goals**
- An Add dropdown with Add models (unchanged popup) and Add applications (tree picker, multi-select).
- Picked applications become `limits` keys by the root-dependent rule; existing keys are skipped.

**Non-Goals**
- Cost limits, a type column or icon, the legacy Entities > Roles surface, and changes to what
  `EntitySelectManager` reports (see the proposal).

## Decisions

### 1. Dropdown follows `AddDependenciesButton`
`ButtonDropdown` (`ButtonVariant.Primary`, label `ButtonsI18nKey.Add`) with two `DropdownItem`s, each opening its own
popup. The role's `+` icon is dropped: the kit's dropdown button is the established "Add with choices" shape in this
repo. *Alternative:* keep `PrimaryButton` and add a kit menu beside it. Rejected — two controls for one action.

### 2. Applications popup is a feature component wrapping `EntitySelectManager`
New `Roles/AddApplicationsPopup.tsx`, modelled on `ContextFilesPicker`: its own `AppsFolderProvider` (so the popup's
folder state is isolated from the Applications page), a `Popup` with `getFormPopupButtons`, local `selectedPaths`
state cleared on cancel, Confirm disabled while nothing is selected. It lives under `Roles/`, not `Common/`, because
it ends in role-specific key derivation.
*Alternative:* generalise `ContextFilesPicker`. Rejected — it downloads files on confirm; nothing else is shared
except the popup chrome.

### 3. New `EntitySelectType.Application`, with roots declared per type
Config entry in `ENTITY_SELECT_CONFIGS` with `route: ApplicationRoute.AssetsApplications` (the dual-bucket route; the
legacy `Applications` route has no file/platform roots), `FolderProvider: AppsFolderProvider`, `useFolder:
useAppsFolder`, `ENTITY_SELECT_GRID_COLUMNS`, a header i18n key and `portalId`. `prefix` is unused on this path (the
type is only used through the manager, like `File`).

`EntitySelectConfig` gains `rootFolders: string[]` (with trailing slash, as `getRootFolders` yields) and an optional
`rootLabelI18nKey`. Skill and File declare `[`${ROOT_FOLDER}/`]`, i.e. today's behavior; Application declares
`getRootFolders(AssetsApplications).map(...)`, i.e. `file/`, `platform/`, `public/`. `EntitySelectManager` reads the
list instead of the hard-coded `${ROOT_FOLDER}/`: one root → `fetchFiles(root)`, several → `fetchFiles(roots)` (the
array form builds all top-level nodes in one update, as `FileManager` does); the unresolved-value fallback reloads
the same list. With several roots the manager passes `rootItem={{ label }}` to the file manager, as `FileManager`
does, so no single bucket is shown as "the" root.
*Alternative:* a `roots` prop on the manager set by each caller. Rejected — the roots follow from the type, and
callers (`EntitySelectInput`, `ContextFilesPicker`) would each have to repeat them.

### 4. Key derivation is a pure util on the picked path
`getApplicationLimitKey(path)` in `Roles/utils.ts`: `isPublicPath(path)` → `` `${APPLICATIONS_PREFIX}${path}` ``,
anything else → the entry name (`getFolderNameAndPath(path).name`). That covers `file/` rows (`path` is the bare name)
and `platform/{name}` alike. The manager is not changed in what it reports.
*Alternative:* report whole rows and read `bucket` / `entitySource`. More robust, but it changes the shared
component's contract; the owner chose to keep it.

### 5. Apply reuses `addModelLimits`
`addModelLimits` takes `PlatformRoleModelOption[]` (`{ name }`). The apply handler maps derived keys to `{ name }`
rows and calls it, so skip-existing needs no new code. Both popups close through the same
`updatedRole` / `roleRef` / `onChangeRef` path as `onAddModels`. Duplicates within one pick collapse for the same
reason.

### 6. The tree cannot hide already-added applications
Models are filtered with `getAvailableModels`; a tree has no equivalent. Duplicates are skipped silently on apply,
as the owner specified, with no notification.

## Risks / Trade-offs

- [The manager's single-root load is generalised] → Skill and File declare today's single root, so their behavior
  and specs stay as they are; the multi-root path is covered by new manager tests.
- [A `public/` path may carry a version suffix] → the key keeps whatever `row.path` is; one util with a per-root test.
- [`ENTITY_SELECT_CONFIGS` is shared with Skill/File] → add an entry only; their existing specs stay green.
- [A key derived from a `file/` or `platform/` name could collide with a model name] → by design: Core keys both in
  one map, and a collision is the same entry, which is skipped.
- [Mixed models and applications in one grid with no type signal] → accepted; recorded as a non-goal.
- [The grid heading `Entities: n` and the "No models" empty title read as model-only] → the heading already says
  "Entities"; the empty title is re-checked during implementation and generalised only if it is misleading.

## Migration Plan

Frontend-only; no data or API change. Rollback is a revert.

## Open Questions

- Whether the empty-state title should become entity-neutral.
