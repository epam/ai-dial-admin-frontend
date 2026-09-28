## Context

Every entity the asset folder tree serves (prompts, conversations, files, skills, asset
applications/toolsets in both buckets, plus the eight flat platform views) already flows through one
shared server-side mapper — `toResourceInfo` in `src/server/core/asset-metadata.ts` — producing one
de-facto row DTO (`ResourceInfo`: name, folderId, path, version?, author?, createdAt?, updatedAt?,
nodeType?, etag?), sourced from one raw wire shape (`CoreResourceMetadataNode`, which carries
`bucket`). Files and skills hand-roll their own near-copies of this mapping and pagination loop.

The client type system models none of this: `AssetsFolderContext` is typed against
`Asset = AssetApp | AssetToolset | DialFile`, `DialFile` forces a required `folderId: string` onto
every row, and each per-entity context casts its getter into `Asset[]`. "Is this row movable /
platform / public" is therefore re-derived client-side by prefix-sniffing `folderId`
(`isPlatformBucketPath(row.folderId)` at `Assets/utils.ts:415,455`, `Modals/utils.tsx:69-71`,
`open-in-new-tab.ts:82`, and the detail pages' `!rawPath` inversion).

Constraints established by prior changes this design must respect:

- `core-resource-entity-metadata` (in flight, uncommitted): merged detail reads graft identity under
  `_metadata`; write paths resolve `folderId ?? _metadata.folderId`. This convention is kept — only
  row and create-flow shapes get root-level `folderId`, where it is already flat today.
- `root-folder.ts` documents that for dual-bucket views "which bucket" is a property of the path
  being browsed, not a per-row concern (`isPlatformDualBucketView`), and `FLAT_PLATFORM_VIEWS`
  enumerates the views with no folder concept at all.
- The platform detail DTOs (`PlatformAsset` family, `src/models/dial/resource.ts`) are correct as-is
  and are not touched.

## Goals / Non-Goals

**Goals:**

- One client row model matching what the server already serves, with an explicit `bucket` field and
  a type-level movable / tree-immovable / platform split.
- `createFolderContext` generic over the row type; the ~14 per-entity contexts lose their casts.
- Bucket detection in row/action handling reads the explicit `bucket` (or view-level resolution
  where the view is in scope) instead of sniffing `folderId` prefixes.
- Consolidate the skills mapper and the triplicated pagination loop into the shared client.
- Remove dead models/utils/properties the union was hiding, each removal verified.

**Non-Goals:**

- No platform detail DTO changes, no `_metadata` convention reversal, no backend/wire changes.
- No user-visible behavior change beyond correctness fixes the sniffing removal exposes.
- Not part of the uncommitted `core-resource-entity-metadata` work — a separate, later change.

## Decisions

### D1. One base row model with `bucket`, three flavors — not a discriminated union on a tag

```
AssetListItem            name, path, nodeType, author?, createdAt?, updatedAt?, etag?,
                         bucket: 'public' | 'platform'   (enum, per code-standards value-set rule)
  ├─ MovableAssetListItem      folderId: string — required at root, changeable
  │                            (prompts, files, skills, apps/toolsets public rows; version? on the
  │                             versioned two)
  ├─ TreeAssetListItem         folderId: string — required at root, no move support (conversations)
  └─ PlatformAssetListItem     no folderId, no path semantics beyond the flat root
                               (8 flat platform views + apps/toolsets platform rows)
```

- **Why a hierarchy plus optional/absent `folderId`, not a `nodeType`-like discriminant:** movability
  and bucket-ness are *type-level* facts the UI gates on; making `folderId` present-and-required on
  movable rows and absent on platform rows lets the compiler reject both "move a platform row" and
  "read `folderId` off a platform row" without any runtime check. The existing `isPlatformBucketPath`
  sniffing sites each become either `row.bucket === BucketType.Platform` or disappear entirely
  because the branch is unreachable for that row type.
- **Why `bucket` on the row instead of deriving it from `path`:** the raw metadata node already
  carries `bucket` — `toResourceInfo` just drops it today. Deriving from path re-implements the
  prefix sniff with extra steps; mapping the field once at the source of truth removes the entire
  class of "which bucket is this row in" heuristics.
- Alternative considered: a boolean `isPlatform`/`isMovable` pair of flags on one flat interface —
  rejected: flags can disagree with the data (a row with `isMovable: false` but a folderId that
  changes), and nothing at compile time stops reading the wrong combination.

### D2. `createFolderContext<T extends AssetListItem>` — generic context, per-entity contexts declare their row type

- The factory's `getFilesFunc` signature becomes `(path: string) => Promise<T[] | null | undefined>`;
  `AssetsFolderContext<T>` mirrors it. The per-entity one-liner contexts (e.g.
  `PromptFolderContext`) stop casting and declare `MovableAssetListItem & …`-shaped rows.
- The union `Asset` in `deployment-asset.ts` loses its row role; detail-view models that genuinely
  intersect app/toolset shapes keep whatever they need, but rows never again flow through it.
- `DialFile.folderId` moves from required to the movable/tree row flavors; `DialFile` itself remains
  the files *detail* model (its wire DTO really does have `bucket`/`parentPath`/`url`), but its list
  rows map into `MovableAssetListItem` like every other asset type.
- Alternative considered: keep `Asset` and add overloads — rejected: the casts are the bug surface;
  genericity removes them rather than wrapping them.

### D3. Bucket resolution: row-level `bucket` where a row is the input; view-level where the view is

Two distinct questions the current code conflates, split by input:

- **"Shape this row's action correctly"** (delete-toast name/version, open-in-new-tab URL,
  delete-modal grid columns) — input is a row → use `row.bucket`. Sites:
  `Assets/utils.ts:415,455`, `Modals/utils.tsx:69-71`, `open-in-new-tab.ts:82`'s
  `isPlatformBucketPath(path || folderId)`.
- **"Which surface am I browsing"** (create-modal shape, move availability) — input is view +
  current path → use the existing `isFlatPlatformView` / `isPlatformDualBucketView` in
  `root-folder.ts`, which already encode this and already document it as a path-level concern.
- The detail pages' `isPlatformBucket = !rawPath` inversion (`assets-applications/[id]/page.tsx:59`,
  `assets-toolsets/[id]/page.tsx:43`) stays as the URL contract (design.md D5 of
  `platform-applications`: presence of `?path=` distinguishes the buckets) but is renamed/derived
  through one helper so the contract is stated once.

### D4. Skills and files mappers fold into the shared client; pagination loop is written once

- `toSkillResourceInfo` (`skill-metadata.ts`) is a near-verbatim copy of `toResourceInfo` — fold it
  in, keeping skills' one real difference (path parsing for the `/v2/metadata/skills` shape and the
  FOLDER trailing-slash convention, which then lives in exactly one place instead of three).
- The identical do/while `nextToken` loops (`asset-api.ts:79-91`, `files/actions.ts:17-24`,
  `skills/actions.ts:23-30`) become one paginated-list helper; the token-vs-nextToken quirk stays
  documented at that single helper.
- `toPlatformApplicationPayload` / `toPlatformToolsetPayload` (character-for-character twins) merge
  into one generic stripper.

### D5. Dead-code removal is a tracked task with a verification protocol, not a drive-by

Each candidate is removed only after a usage search confirms zero non-spec references, and the sweep
ends with both typecheck gates at zero (`typecheck`, `typecheck:specs`) — the spec project is the
only thing that catches a fixture drifting from its production type, so it is the arbiter here.
Known candidates from exploration (to re-verify at implementation time, not trusted blindly):
`AssetModel` and the `DeploymentAsset`/`AssetWithVersion` aliases in `deployment-asset.ts`, the
legacy admin-BE `[lang]/keys/actions.ts` remnants, the `console.log`s at
`AssetsFolderContext.tsx:125,171` and `asset-api.ts:147`, and the
`// TODO: Remove When we get real permissions` placeholder at `AssetsFolderContext.tsx:132`.

## Risks / Trade-offs

- [The model split touches every row consumer; a missed one surfaces as a type error, not a runtime
  bug] → That is the point of the split; both typecheck gates plus the spec fixtures are the net.
  Sequence: introduce the new models alongside, migrate one context family at a time, delete `Asset`
  last.
- [`DialFile` is imported broadly (FileManager, FilePath, FolderList, publications); loosening its
  `folderId` could break unrelated consumers] → `DialFile` keeps its shape for detail/file-manager
  use; only the *row* construction paths move to the new flavors. Files rows get `folderId` derived
  where the raw DTO lacks it (from `parentPath`/`bucket`), so the movable contract holds.
- [Conversations sharing prompts' versionless handling but not movability invites copy-paste
  divergence] → The two differ only in the move gate; the design keeps one tree-row flavor with
  movability expressed by *which* flavor the context declares, so the shared paths stay shared.
- [Folding the skills mapper changes a `/v2` endpoint's row construction] → Skills spec
  (`skill-resources-core-api`) scenarios cover the list shape; run them against the consolidated
  mapper before deleting the old one.
- [Behavior fixes exposed by de-sniffing (e.g. a toast that showed a versioned name for a platform
  row) are technically behavior changes in a "behavior-preserving" refactor] → Each such site gets
  called out in tasks as an explicit, testable expectation rather than silently absorbed.

## Migration Plan

Internal-only (types + client mapping), deployed in one PR series behind the normal gates — no
runtime migration, no rollback strategy beyond reverting. Ordering inside the change: server mapping
(`bucket` on rows, mapper consolidation) → new row models → generic context + per-entity migration →
action-handling de-sniffing → dead-code sweep → both typecheck gates + full suite as the final gate.

## Open Questions

- Exact spec-delta scope for `versionless-prompts-conversations`, `files-core-api`, and
  `skill-resources-core-api` — whether their requirement text references the row shape directly or
  only the API surface (flagged in the proposal; resolved while writing the deltas).
- Whether the files row's derived `folderId` (raw DTO has `parentPath` + `bucket` instead) should be
  derived in the server mapper or at the context boundary — leaning server mapper, so every movable
  row arrives with the same field provenance.
