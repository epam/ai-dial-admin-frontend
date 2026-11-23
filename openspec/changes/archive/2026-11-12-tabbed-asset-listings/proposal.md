## Why

Platform entities, Applications and Toolsets all render through one file-manager tree that can hold up to
three top-level roots (`file/`, `platform/`, `public/`). Only `public/` is a real folder tree: `platform/`
and `file/` are flat lists dressed as folders. The cost shows up everywhere — multi-root fetching, a synthetic
`file` root that switches off about eight actions, bucket branching in every create/duplicate/delete/move path
of `BaseAssetList`, and an entity picker that has to understand all three roots. The listing also looks
different from every other entity page (`/models` before the migration): no title row, no create button, no
count.

## What Changes

- Every platform entity listing, plus Applications and Toolsets, gets one layout: a header (title,
  `{n} {entities}` count where it is meaningful, Create button), then a tab row, then the active tab's body.
- Tabs: **Public** (Applications and Toolsets only, selected by default), **Platform**, **config.json**. A tab
  appears only where its source exists (Keys has no `file/`, so no config.json tab and no tab bar at all).
  Entities without a Public tab open on **Platform**.
- Platform and config.json tabs show a count badge after the label.
- **Public** tab: the current file manager, narrowed to the single `public/` root, with its existing
  Import / Folder / Entity dropdown. The tree no longer renders its own title (it duplicated the page title).
  No Create button in the header.
- **Platform** tab: a flat grid. Header Create, row duplicate and row delete behave as on `/models`; there is no selection column and no bulk action for now.
  Policies and Policy Assignments, which nest one cost-object folder level, become flat too, with a
  **Cost object** column.
- **config.json** tab: a flat read-only grid; no Create button.
- **Header count**: Applications and Toolsets show none (Public is a tree and is not counted); every other
  entity shows the Platform + config.json total (Platform only, for Keys).
- The file manager works with a single root, `public/`. `platform/` and `file/` are removed from it
  everywhere, along with the multi-root machinery.
- The entity picker (`EntitySelectManager`, used by `AddApplicationsPopup`) is rewritten to the same three
  tabs: a Public tree and two grids, all selectable. It reports each selection with its source.
- **BREAKING (internal)**: `getRootDescriptors` / `getRootFolders` / `DUAL_BUCKET_VIEWS`,
  `FILE_ROOT_FOLDER`, the `string[]` form of `fetchFiles`, and `ENTITY_SELECT_CONFIGS[*].rootFolders` /
  `rootLabelI18nKey` are removed. No API, route or stored-data change: role limits still store
  `applications/{path}` for Public and the bare name for Platform and config.json.

## Capabilities

### New Capabilities

- `tabbed-asset-listings`: the shared listing shell — header, tab visibility and default rules, badges, header
  count rule, per-tab body, unit-mode behaviour — and the tabbed entity picker contract.

### Modified Capabilities

- `config-file-entity-views`: the synthetic `file` root requirements are replaced by the config.json tab.
- `platform-applications`, `platform-toolsets`: file-root and platform-bucket grid requirements become tab
  requirements; the dual-bucket row/action branching is removed.
- `platform-policies`, `platform-policy-assignments`: the one-level cost-object tree becomes a flat grid with a
  Cost object column; cost-object folder deletion goes away.
- `platform-models`, `platform-app-runners`, `platform-catalog-schemas`, `platform-interceptors`,
  `platform-translators`, `platform-routers`, `platform-routes`, `platform-roles`, `platform-keys`: the listing
  requirement moves from a file-manager root to the Platform tab grid. `platform-roles` also gets the
  add-applications popup contract.
- `asset-list-rows`: bucket-explicit action handling shrinks to the Platform grid; rows no longer need a
  root-level `folderId` to tell buckets apart.
- `user-org-units-access`: "File roots exclude the config-file and platform buckets" becomes "unit mode shows
  Public only".
- `asset-folder-tree-expansion`, `resource-tree-file-folders`: re-check for multi-root wording while writing
  the deltas; add a delta only where a requirement actually changes.

## Non-goals

- Counting entities inside the Public tree.
- Changing detail pages, detail routes, or the `configFile=true` addressing.
- Changing what Core is asked for or any server action; only how the client groups and renders results.
- Touching entities that already have one public-only tree (Prompts, Skills, Projects, Files, Conversations)
  beyond what removing multi-root machinery forces.
- Migrating stored role limits.

## Impact

- `utils/files/root-folder.ts`, `utils/files/folder-nodes.ts`, `context/assets/AssetsFolderContext.tsx` and
  `folder-reducer.ts` (multi-root fetch and root nodes go; Public loads one root).
- `components/Common/FileManager/*` (single root, no label wrapper, no file-root gating),
  `components/Assets/BaseAssetList/*` (bucket branching removed; split Public vs flat paths).
- `components/ListView/List.tsx` (tabs slot), new tabbed shell and flat-grid component(s) under
  `components/Assets/`.
- `components/Common/EntitySelectInput/*`, `components/Assets/Platform/Roles/AddApplicationsPopup.tsx`,
  `Roles/utils.ts` (source-aware mapping replaces `isPublicPath` prefix sniffing).
- All `platform-*`, `assets-applications`, `assets-toolsets` list pages; `locales/en.ts` and i18n enums.
- Overlaps to check before implementing: active changes `flat-page-layout` and `restore-folder-on-menu-return`.
- Large blast radius, deliberately landed as a single PR (see design.md for how the work is ordered inside it).
