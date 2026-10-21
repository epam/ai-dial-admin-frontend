## Why

Every entity the asset folder tree serves already flows through one shared server-side row
mapper (`toResourceInfo`, `src/server/core/asset-metadata.ts`) producing one de-facto row DTO —
but the client type system doesn't know it. `AssetsFolderContext` is typed against the kitchen-sink
`Asset = AssetApp | AssetToolset | DialFile` union, where `DialFile` forces a required `folderId: string`
onto every row — including platform-bucket rows and flat platform entities where the field is
semantically void. Consequently, "is this row movable / platform / public" is re-derived all over the
client by sniffing `folderId` prefixes (`isPlatformBucketPath(row.folderId)`), and each of the ~14
per-entity folder contexts casts its getter into `Asset[]`, ending type safety exactly where rows
enter the tree. This also blocks a dead-code sweep: `AssetModel`, `DeploymentAsset`,
`AssetWithVersion` aliases and hand-rolled mappers (skills) survive only because the union hides
what is actually used.

## What Changes

- **BREAKING** (internal types only, no wire/API change): replace the `Asset` union's row role with a
  client-side row model promoted from the existing server `ResourceInfo` shape:
  - `AssetListItem` base — `name`, `path`, `nodeType`, `author?`, `createdAt?`, `updatedAt?`,
    `etag?`, and an explicit `bucket` ('public' | 'platform') mapped from the raw metadata node
    (currently dropped by `toResourceInfo`).
  - `MovableAssetListItem` — `folderId: string` at root, changeable (move support): prompts, files,
    skills, asset applications and asset toolsets in the public bucket.
  - Tree rows with `folderId` but **no** move support: conversations (versionless, immovable).
  - Platform rows (8 flat platform views + apps/toolsets platform-bucket rows): no `folderId`, no
    path semantics.
- Make `createFolderContext` generic over the row type; per-entity folder contexts declare their
  actual row type and lose their `as (path) => Promise<Asset[]>` casts.
- Fold the skills hand-rolled mapper (`toSkillResourceInfo`) and the files/skills duplicated
  pagination loops into the shared core-asset-client mapping.
- Replace all `folderId`-prefix sniffing in row/action handling (delete-toast shaping, delete-modal
  grid columns, open-in-new-tab path resolution, detail-page bucket detection) with the row's
  explicit `bucket` and the existing view-level resolution (`isPlatformDualBucketView`), per
  `root-folder.ts`'s documented "bucket is a property of the path being browsed, not a per-row
  concern".
- Remove dead code uncovered by the model split: unused models/utils/properties (e.g.
  `AssetModel`, `DeploymentAsset`/`AssetWithVersion` aliases if unsed, legacy `[lang]/keys/actions.ts`
  remnants, debug `console.log`s, the `// TODO: Remove When we get real permissions` placeholder) —
  each removal verified by usage search and both typecheck gates.

## Capabilities

### New Capabilities

- `asset-list-rows`: the unified asset row model (base + movable / tree-immovable / platform
  flavors), the `bucket` field on rows, the typed generic folder-context, and bucket-aware
  move/delete/update/open-in-new-tab row handling.

### Modified Capabilities

- `core-asset-client`: rows served by the shared list mapping gain the explicit `bucket` field and
  the skills/files mapping consolidation (requirements on the served row shape change).
- `platform-applications`: platform-bucket rows no longer carry a `folderId`; row-level action
  handling (delete/move/open-in-new-tab) resolves the bucket explicitly instead of inferring it
  from `folderId`.
- `platform-toolsets`: same as `platform-applications` for toolsets.

(To verify while writing the spec deltas: whether `versionless-prompts-conversations` and
`files-core-api`/`skill-resources-core-api` requirements reference the row shape directly or only
the API surface — include only those whose requirement text actually changes.)

## Non-goals

- No changes to the platform detail DTOs (`PlatformAsset` family in `src/models/dial/resource.ts`)
  — they are correct as-is.
- No reversal of the `core-resource-entity-metadata` `_metadata` convention for merged detail
  reads: identity stays grafted under `_metadata` there; this change only puts `folderId` at the
  root of row and create-flow shapes, where it is already flat today.
- No backend or wire-protocol changes — the raw metadata node already carries `bucket`; the client
  just stops dropping it.
- Not part of the in-flight uncommitted `core-resource-entity-metadata` work — strictly a separate,
  later change.
- No behavioral change for end users beyond the correctness fixes the sniffing removal exposes
  (delete toasts, move gating); the refactor is behavior-preserving by intent.

## Impact

- `src/models/dial/deployment-asset.ts`, `src/models/dial/file.ts` — `Asset` union splits; `DialFile`
  loses its blanket-required `folderId` (becomes a movable/tree-row concern).
- `src/context/assets/*` (14 per-entity contexts) — typed against the new row model, casts removed.
- `src/components/Assets/` (`utils.ts`, `Modals/utils.tsx`, `Deployments/CreateAsset.tsx`),
  `src/components/EntityView/Modals/Delete/Delete.tsx`, `src/components/EntityListView/CreateEntity/CreateEntity.tsx`,
  `src/utils/open-in-new-tab.ts`, the assets-applications/assets-toolsets detail pages — bucket
  detection moves from `folderId` sniffing to explicit `bucket` / view-level resolution.
- `src/server/core/asset-metadata.ts`, `skill-metadata.ts`, `file-metadata.ts`, the files/skills
  actions — mapping and pagination consolidation.
- Both typecheck gates (`typecheck`, `typecheck:specs`) must stay at zero; spec fixtures referencing
  `Asset`/`DialFile` row shapes will need updating alongside production types.
