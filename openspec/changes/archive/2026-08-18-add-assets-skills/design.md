## Context

DIAL Core's `SKILL` resource type is a versioned, folder-shaped bundle rooted at a `SKILL.md` manifest,
already supported by `ResourceOperationService.ALLOWED_RESOURCES` (move/copy/delete) and
`PublicationService.ALLOWED_RESOURCES` (publish/approve/reject), but its metadata-listing endpoint
(`GET /v2/metadata/skills/{bucket}/{path}`) returns only `nodeType`/`createdAt`/`updatedAt`/`author` —
the handler-parsed `name`/`description`/`version` live in the server-side `FolderResourceMarker` and are
not projected into that response. Getting them requires reading the skill's own metadata
(`SkillsCoreApi.getSkillMetadata`, already built for Skill Publications) or its content, one request per
skill.

The FE's shared Assets surfaces (`Assets > Toolsets`, `Assets > Applications`, `Assets > Prompts`, …) are
built on one generic component, `BaseAssetList`, configured per route through a set of
`Record<ApplicationRoute, ...>` action maps in `components/Assets/BaseAssetList/utils.tsx` and route-union
types in `components/Assets/BaseAssetList/types.ts`. A route that has no entry in a given map simply
doesn't get that action rendered — this is how `Conversations`/`AssetsModels`/`AssetsAppRunners` already
ship without Create/Import/Export/Move despite sharing the same list component as `AssetsToolsets`.

## Goals / Non-Goals

**Goals:**
- Add `Assets > Skills`: menu entry, folder-tree list (metadata-only columns), a detail view (delete
  and bulk delete from the list), file management within an existing skill's bundle.
- Reuse the rendering already built for Skill Publications (`SkillDetails`) rather than duplicating it.
- Replace the placeholder `FileFolderProvider` in `Publications/View/TabsContent.tsx` with a real
  `SkillFolderContext`, fixing the tracked TODO.
- Staged (Save/Discard) file add/remove for both surfaces — Assets detail view via a Skill-specific
  header (`SkillHeader`/`SkillButtonsWrapper`) that follows the existing Prompts/Toolsets/Conversations
  Save/Discard convention, and Skill Publications via its already-existing `PublicationView` save/discard
  machinery (see D6).
- Move to another folder from the Assets detail view, using the same `FilePath` + `isNeedToMove` +
  move-on-save convention Prompts/Toolsets already use (see D6).
- Correct which read-only fields (author/createdAt/updatedAt/etag) are actually obtainable from Core,
  verified against Core's Java source rather than `skills.md`'s prose (see D6).

**Non-Goals** (see proposal's Non-goals for the full list and rationale):
- No creating a brand-new skill (its own `SKILL.md`) from the Assets UI — file management applies only
  to an *existing* skill's bundle (see D2 addendum #4).
- No list-level Move (bulk move from the list/folder tree) — deliberately deferred (see Decision D3);
  only detail-view single-skill Move is in scope (see D6).
- No editing the skill's `description` (or `name`/`version`) — these live only in `SKILL.md`'s YAML
  frontmatter, and the user explicitly deferred this until in-browser `SKILL.md` editing exists (see D6).
- No Audit tab, no Core-sync banner, no realtime refresh.

## Decisions

### D1a: A dedicated `toSkillList` mapper, not the generic `toResourceInfo`/`isVersioned` branch

`toResourceInfo` (in `asset-metadata.ts`) only has two path-parsing branches: `parseEncodedVersionedPath`
(splits folderId/name/`__version`, for the four versioned types) and `parseEncodedFlatPath` (single-level,
no folder split, for `MODEL`/`APP_TYPE_SCHEMA`). Skill fits neither: it nests in folders like a versioned
type, but its name carries no `__version` suffix. Rather than adding a third branch to that shared
function, a small `src/server/core/skill-metadata.ts` (`toSkillList`) and a new `parseEncodedFolderPath`
path helper (folderId/name split without version extraction) handle Skill's mapping independently —
keeping the change to the generic multi-type function limited to the additive `etag` field (D1 below),
not a new branch in its control flow.

### D1: List columns come only from the folder-listing response — no per-row enrichment

The list uses `SkillsCoreApi`'s new `listSkillMetadata` (folder listing, `GET
/v2/metadata/skills/{bucket}/{path}`) mapped straight to `Asset`-shaped rows: `name`/`path` (from the
listing's item name), `nodeType` (`ITEM` vs `FOLDER`, driving the folder-tree affordance), `author`,
`createdAt`, `updatedAt`. This mirrors `assets-app-runners`'s existing "metadata-only, no content read per
row" requirement and the user's explicit instruction to show list data as-is. Consequence: the list has no
display-name or description column — the folder/skill path is the only identity shown in the grid, exactly
as it already is for `Assets > App Runners`.

Alternative considered: fetch `getSkillMetadata` per visible row to show name/description. Rejected —
explicitly ruled out by the confirmed scope (no additional fetching), and it would cost one request per
row on every list render with no caching layer to amortize it.

### D2: Detail view reuses `SkillDetails`/`SkillProperties`'s read-only rendering, fed from `getSkillMetadata`

The detail page calls the existing `SkillsCoreApi.getSkillMetadata(token, path)` (already built and used by
Skill Publications) to get name/description/version/etag/files, and renders them with the same
`GridView`-based file listing `SkillDetails` already implements. No new rendering code for the files grid;
the Assets detail view composes a thin wrapper (new `View`/`Properties` under
`components/Assets/Skills/`) that supplies path/author/dates (which `SkillDetails` doesn't show, since a
publication's `BaseProperties` covers name/folder/comment instead) alongside the reused files grid.

Alternative considered: extract a shared component used by both Publications and Assets from day one.
Rejected for this change — `SkillDetails` already takes a `publication: SkillPublication` prop shape
tied to the Publications domain; reshaping that generic now is a larger refactor than this change's scope
justifies. The Assets detail view instead composes the read-only files grid pattern independently,
consistent with how `AppRunnerAssetView`/`ToolsetView` don't share a base class with their Publications
counterparts either.

### D3: No Move in v1 — the shared `CrudAssetRoute` union couples Move to Import/Export

`MoveAssetActionMap`, `ImportAssetActionMap`, and `ExportAssetActionMap` are all typed
`Record<CrudAssetRoute, ...>`, and `CrudAssetRoute` is the exact three-member union `Prompts |
AssetsApplications | AssetsToolsets`. Adding `AssetsSkills` to `CrudAssetRoute` to get Move would also
obligate `ImportAssetActionMap`/`ExportAssetActionMap` entries — i.e. a bundle import/export UI, which is
explicitly out of scope. Carving out a narrower `MoveAssetRoute` type decoupled from `CrudAssetRoute` was
considered and would work (Core's generic `POST /v1/ops/resource/move` already accepts `SKILL` via the
existing `RESOURCE_TYPE_PREFIX[ResourceType.SKILL]` entry, so `assetApi.move` needs no new server-side
code) — but the user confirmed dropping Move for v1 rather than take on that shared-type change now.
`AssetsSkills` therefore joins `BaseAssetRoute` only (list rendering, folder navigation, bulk delete) and
is absent from `CrudAssetRoute`.

### D4: Delete goes through `SkillsCoreApi`, not the generic `AssetApi`

`AssetApi.delete` builds its URL from `CORE_RESOURCE_URL[type]`, and `CORE_RESOURCE_URL[SKILL]` is a
`v1/skills/...` path documented as unreachable (Core serves skills only via `/v2/skills`, multipart/ZIP).
A new `SkillsCoreApi.deleteSkill(token, path, etag)` method calling `DELETE /v2/skills/{bucket}/{path}`
(mirroring `FilesCoreApi.deleteFile`'s required-etag pattern) is the correct client for this resource
type, exactly as `FilesCoreApi` — not the generic `AssetApi` — already owns File's delete.

### D5: `SkillFolderContext` is a plain `createFolderContext(getSkills, 'useSkillFolder')` instantiation

Same factory every other asset folder context uses (`ToolsetsFolderContext`, `FileFolderContext`, …). Its
`getSkills(path)` action wraps the new `listSkillMetadata` call and maps the response into the `Asset[]`
shape `createFolderContext` expects (`nodeType`, `path`, `name`) — the same mapping the Assets list itself
consumes, so the folder tree and the flat list read one shared shape. This context backs both the new
`Assets > Skills` list/folder-tree and the corrected Skill Publications properties view (replacing
`FileFolderProvider` in `TabsContent.tsx`), closing the TODO from a real skill-folder context instead of
a borrowed unrelated one.

### D2 addendum #2 (post-implementation fix, reported after using the feature): `SkillDetails` takes the plain skill, not a publication wrapper

The first cut of D2 reused `SkillDetails` by wrapping the Assets-side `DialSkillResource` in a
throwaway `{ skillResources: [{ skillResource: skill }] } as SkillPublication` object, since
`SkillDetails` only accepted a `publication: SkillPublication` prop. That was backwards: `SkillDetails`
itself only ever reads `skill.name/description/version/files` — it never needed the publication
wrapper — while `SkillProperties` (the actual Publications-side consumer) already has the publication
in scope and can extract the skill itself. Reworked so `SkillDetails` takes `skill?: DialSkillResource`
directly; `SkillProperties` extracts `publication.skillResources?.[0]?.skillResource` and passes it
down; the Assets `SkillView` passes its already-loaded skill straight through, with no wrapper object.

### D2 addendum #3 (post-implementation fix): a skill's files require a dedicated `/files` listing call

Reported after using the feature: the properties view showed name/description/version correctly but
never showed any files. Cause: `SkillsCoreApi.getSkillMetadata`'s single `GET
/v2/metadata/skills/{bucket}/{path}/` call addresses the skill's own path, which Core resolves as an
`ITEM` node — `items` is only populated when the *addressed* path is a folder being listed (as
`listSkillMetadata` already relies on for the Assets list). A skill's own files were never reachable
through that call at all; the previous code's `res.items` mapping was reading a field Core doesn't
populate for an item path — a latent bug carried over from the original `add-skill-publications` design,
now confirmed against real usage.

Fixed with a second method, `getSkillFiles`, calling Core's dedicated per-skill files listing
(`GET /v2/metadata/skills/{bucket}/{path}/files`, `recursive=true`), and `getSkillMetadata` now merges
its own metadata call with this files call. Each file's `name` is derived from the listing's `url`
relative to the skill's root (e.g. `scripts/run.sh`) rather than the bare `name` field, so nested files
stay distinguishable in the flat grid `SkillDetails` renders — the `add-skill-publications` design's
"unverified against a running Core instance" flag on this shape carries forward to this new call too.

### D2 addendum (discovered during implementation): no `AssetHeader` reuse, no detail-page delete button

`AssetHeader`/`AssetButtonsWrapper` (used by `ToolsetView`/`AppRunnerAssetView`) bundle save/discard,
JSON-editor toggle, and version-control affordances tightly together; and the single-item
`DeleteConfirmationModal` it wires in is keyed off route-wide, non-exhaustive `Record<string, DeleteI18nKey>`
maps (`deleteEntityMap`/`bulkDeleteEntityMap` in `EntityView/Modals/Delete/utils.ts`). Retrofitting either
for a genuinely no-edit view was judged a larger, riskier touch than this change's scope justifies. The
Skills detail view instead uses a small bespoke header (`ReadonlyId` for the name + `LabelledText` fields
for path/author/dates) and offers no *whole-skill* delete action on the detail page — that stays list-only,
per the original `assets-skills` spec. (Per-file removal within the bundle, added later in D2 addendum #4,
is a different, narrower operation and does live on the detail page.)

Also discovered: `DialSkillResource`/`SkillsCoreApi.getSkillMetadata` — built for Skill Publications' more
limited properties view — carried no `author`/`createdAt`/`updatedAt`. Added as optional fields, sourced
from the same Core metadata response already being read, since the `assets-skills` spec requires showing
them on this surface.

### D2 addendum #4 (post-implementation feature request): per-file management on the Assets surface, `SKILL.md` protected

Reported after using the feature: the read-only file grid had no way to inspect or manage a skill's
files at all — no preview, download, remove, or add. Core's per-file skill routes
(`PUT/GET/DELETE /v2/skills/{bucket}/{path}/files/{filePath}`) were already documented as available
(see the original exploration) but deliberately unused in v1's read-mostly scope. This request reverses
that scope for the Assets surface only — the Skill Publications review view is untouched and stays
fully read-only, since its own spec (`skill-publications`) already requires "no add, remove, or download
action," and a reviewer shouldn't mutate a resource still pending approval.

Implementation: `SkillDetails` gained an opt-in `readOnly` prop (default `true`, preserving Skill
Publications' existing behavior with zero changes to its call site) plus `onAddFile`/`onRemoveFile`
callbacks, following the same `getPreviewOperation`/`getDownloadOperation`/`getRemoveOperation` grid
action-column pattern already used by `Publications/Assets/Files/FilesList.tsx` — the closest existing
example of a per-row preview/download/remove grid in this codebase, per the user's own pointer to "asset
files and files publications." Preview/download open `/api/skills/preview` and `/api/skills/download`
(new routes, mirroring `/api/files/preview`/`/api/files/download`); remove and add call new
`removeSkillFile`/`uploadSkillFile` server actions backed by new `SkillsCoreApi` per-file methods; a
successful mutation triggers `router.refresh()` on the Assets detail page to reload the skill's file
list from Core (no local optimistic state).

`SKILL.md` — Core's mandatory manifest, without which a skill has no meaning — has its Remove action
hidden via the same `hidden: (api, node) => boolean` predicate mechanism the shared grid actions already
support, keyed on an exact filename match at the row level (`node.data.name === 'SKILL.md'`).

### D1 addendum (post-implementation fix): the files listing's `url` is rooted under the skill's internal `files/` sub-namespace

Reported as a visible bug: file names rendered as `files/SKILL.md` instead of `SKILL.md`. The
`getSkillFiles` listing's `url` field is `skills/{bucket}/{path}/files/{fileName}` — Core's storage
layout nests actual bundle content one level deeper than the skill's own bare path, under a `files/`
segment matching the route's own `/files` suffix. The prefix stripped to derive each row's relative name
needed that extra segment; fixed by stripping `{prefix}{path}/files/` rather than `{prefix}{path}/`.

Also fixed in the same pass: the list showed a `Size` column with no real data — Core's `/files` listing
doesn't report a per-file size at all (confirmed against actual usage, not just inferred). `size` was
removed from `DialSkillFile` and the grid entirely rather than left as an always-zero, misleading field.

### D6 (post-implementation, third round of feedback): author/dates fixed via Core source, description deferred, staged Save/Discard + Move added

Reported after using the feature, with an explicit instruction to ground the fix in `ai-dial-core`'s
actual source rather than its `skills.md` design doc (which turned out to oversell what's implemented —
its "resource's cached metadata" prose lists `name`/`description`/`etag` as part of the children-listing
response; `ComplexResourceService.nodeMetadata()`, the real mapper backing that endpoint, sets only
`nodeType`/`createdAt`/`updatedAt`/`author`). Three decisions came out of this round:

1. **Description editing is deferred, not built.** The user's initial ask included making description
   editable, but on reflection asked to skip it until `SKILL.md` editing exists (parsing and
   regenerating YAML frontmatter is real, separable work). `getSkillMetadata` therefore stops attempting
   to source `name`/`description`/`version` from a metadata field that was never real; those fields stay
   `undefined` and the UI already hides them when absent. `name` is now derived from `path` alone (the
   trailing segment), matching how App Runners derives its own identity from `$id` rather than a
   content field.
2. **`author`/`createdAt`/`updatedAt` are fixed at the source, replacing D1's now-superseded
   trailing-slash call.** `getSkillMetadata` finds the skill's own row in its *parent folder's* listing
   (the only place Core reports these) and separately reads the aggregate etag from the `ETag` header on
   a `SKILL.md` file `GET` (confirmed to carry it — see `ComplexResourceController`'s own OpenAPI
   annotations). This makes the earlier "unverified against a running Core instance" flag on the old
   single-item call moot: that call is gone, replaced by two calls whose shapes are directly confirmed
   against the real `ComplexResourceMetadataController`/`ComplexResourceController` source.
3. **File editing becomes staged (Save/Discard), on both surfaces, and gains preview/download on
   Publications.** The original per-action-immediate-write model (D2 addendum #4) is replaced with local
   staging — `addedFiles: File[]` / `removedFileNames: string[]` — applied only when the owning view's
   Save is clicked, matching how every other asset (and the Publications flow generally) already treats
   edits as a draft until saved. `SkillDetails` gained `disabled`/`addedFiles`/`removedFileNames` props
   and no longer calls Core itself at all — it only reports staged intent via `onAddFile`/
   `onRemoveExistingFile`/`onRemoveAddedFile` callbacks. Skill Publications gains preview/download (it had
   none of the four actions before) and staged add/remove, applied through `PublicationView`'s existing
   Save/Discard (new `skillAddedFiles`/`skillRemovedFileNames` state lifted there, mirroring the existing
   `addedFiles` pattern File Publications already uses) — reversing part of the `skill-publications`
   spec's "no add, remove, or download action" requirement, hence the `MODIFIED Requirements` delta for
   that capability.
4. **Move is added to the Assets detail view, and the generic `AssetHeader` doesn't fit.** Reusing
   `AssetHeader`/`AssetButtonsWrapper` (as used by `Prompts`/`Toolsets`) was tried first, since it already
   has the Save/Discard-on-change shape this needed. It was rejected: `AssetButtonsWrapper` unconditionally
   renders `AssetVersionControl` (a "Version:" dropdown) whenever the entity isn't in a changed state, and
   `AssetVersionControl`'s own "Create" flow hardcodes `getApp`/`getToolset`/`getPrompt` — none of which
   apply to Skill, which has no version concept exposed at this layer. `ConversationButtonsWrapper` was
   the next candidate (no version control) but has no Save/Discard at all. Neither existing wrapper fit,
   so a new `SkillButtonsWrapper`/`SkillHeader` pair was built: `AssetButtonsWrapper`'s Save/Discard/Delete
   shape, using the plain `ChangedEntityButtons` (no version modal) instead of `AssetChangedEntityButtons`
   (which still offers a "Save as New Version" option). Move itself reuses `Assets > Prompts`/`Toolsets`'s
   existing convention exactly: a `FilePath` folder-picker field in Properties, `isNeedToMove` computed by
   comparing `folderId`, and a new `moveSkills` action wrapping the already-generic `AssetApi.move` (no new
   Core client code — `RESOURCE_TYPE_PREFIX[SKILL]` already exists). List-level "Move to folder" (the
   `MoveAssetActionMap`/`MoveAssetRoute` carve-out design D3 originally scoped out) stays out of scope —
   only the detail view's folder field moves a skill.

Also discovered as a consequence of using the real `AssetButtonsWrapper`-adjacent Delete flow: the
Skill asset detail page's Delete button now goes through the shared `DeleteConfirmationModal`, which
reads `deleteEntityMap`/`isAssetView`/`createEntityMap` (three separate route-keyed lookup tables across
`EntityView/Modals/Delete/utils.ts`, `utils/is-view.ts`, and `utils/entities/update-entity.ts`) — none of
which had an `AssetsSkills` entry, since the earlier bespoke read-only header never exercised them. All
three gained one, following the exact `AssetsToolsets` pattern.

### D7 (post-implementation, fourth round of feedback): breadcrumbs, fewer detail-view fetches, two Save-button bugs

Three more issues reported after using the feature:

1. **Breadcrumbs.** `AssetsSkills` simply had no entry in `Breadcrumbs/constants.ts`'s route-keyed
   `breadcrumbConfig`, so the global `Breadcrumbs` component (mounted once in `Content.tsx`, driven by
   pathname) rendered nothing for the route — not a rendering bug, a missing config row. Added the entry
   plus a `getFolderContext` case, matching `AssetsToolsets` exactly.
2. **Fewer detail-view fetches, superseding D6 point 2's manifest read.** D6 added a `SKILL.md` GET
   purely to read its `ETag` response header. That's now redundant: `CoreResourceMetadataNode.etag` is
   already present on `ITEM` rows returned by the *same* parent-folder listing already being read for
   author/dates (confirmed in `asset-metadata.ts` — every other flat/unversioned asset type already
   sources its etag this way). Dropped the manifest GET entirely and the pagination loop over the parent
   listing (now a single first-page read) — `getSkillMetadata` goes from 3 Core requests to 2, with
   `getSkillFiles` as the only fetch beyond the one authoritative listing read.

   **Correction found during a later exploration session, not yet fixed:** the `asset-metadata.ts`
   comment above describes the *generic* v1 metadata mapper used by Prompts/Toolsets — a different
   mapper from the one that actually backs `GET /v2/metadata/skills/{bucket}/{path}`. Reading Core's
   real `ComplexResourceService.nodeMetadata()` shows it only ever sets `nodeType`/`createdAt`/
   `updatedAt`/`author`; it never calls `.setEtag(...)`, even though `ResourceItemMetadata` has the
   field. So a skill's parent-listing row does **not** actually carry an etag in practice, meaning
   `getSkillMetadata` likely returns `etag: undefined` for every skill today — which would make
   `deleteSkill` (which rejects without a concrete etag) fail for every skill delete from the list or
   detail view. This was flagged to the user as higher-priority than the folder-deletion work below,
   but is intentionally **out of scope** for this change's next task group, which only covers folder
   deletion (13.x) using `'*'` unconditional deletes — a path that doesn't depend on this bug either
   way. Left as an open item for a follow-up round.
3. **Two Save-button bugs in `Assets/Skills/View/View.tsx`.** (a) Removing multiple files in one Save
   reused `originalSkill.etag` — captured before any mutation — as the `If-Match` for every
   `removeSkillFile` call in the loop; each per-file delete changes the bundle's aggregate etag, so every
   delete after the first failed. Fixed by dropping the etag argument, matching `deleteSkillFile`'s
   already-optional, unconditional-delete design. (b) Post-move refresh only re-fetched the *destination*
   folder, leaving the source folder's cached listing stale. Fixed by matching `Assets > Toolsets`'s own
   post-move convention: reset the whole tree from the root on move, or a plain re-fetch of the current
   folder when only files changed.

Also surfaced by a test failure while investigating: task 10.4's `SkillHeader` rework had silently
dropped the skill's read-only path/author/created/updated display (the new header renders only
`ReadonlyId`), regressing the still-current "Skill asset detail view shows read-only metadata"
requirement. Restored via the shared `ResourceInfoHeader` component in `Properties.tsx` (the same one
`Assets > Toolsets`/`Apps`/`AppRunners`/`Models` already use for author/dates) rather than reintroducing
a bespoke header.

### D8 (explored, then applied): grouping-folder deletion for Skills, kept separate from `removeFolderCore`

Explored (not just reported): deleting a grouping-folder row in `Assets > Skills` was a **silent
no-op reporting false success** — `getResourceTypeByRoute` deliberately excludes `SKILL` (D4), so
`BaseAssetList.onMultipleRemove`'s folder-delete branch never ran for it, and `Promise.all([])`
resolves vacuously successful. Explicit user direction shaped the fix: **don't touch the working
generic path for the other five types**, and use `'*'` unconditional deletes rather than reading a
real etag per item.

Two things made a Skill-specific path both necessary and simpler than the generic one, confirmed
against Core's actual source (not `skills.md`'s prose):

1. `removeFolderCore`'s generic model — gather every flat resource URL under a folder, delete each via
   a create+approve publication — doesn't fit Skills at all: they're folder-shaped resources with
   their own dedicated v2 endpoints, not flat resources the generic `AssetApi`/publication pipeline
   can address (`CORE_RESOURCE_URL[SKILL]` is dead code, confirmed earlier this change).
2. `GET /v2/metadata/skills/{bucket}/{path}?recursive=true` (`ComplexResourceService.listChildren`)
   already returns a **flat list of marker nodes only** — a skill's internal files are excluded by
   Core itself ("a resource file, not a marker → excluded"). So a recursive walk over the *existing,
   unmodified* `listSkillMetadata` naturally treats each skill as one atomic leaf, with no FE-side
   filtering needed to keep the walk from descending into a skill's bundle.

This meant Skills' folder-delete could skip the publication indirection entirely: `deleteSkill` and a
new `deleteSkillFolder` (`DELETE /v2/skills/{bucket}/{path}/` — trailing slash, a genuinely different
Core route from `deleteSkill`, confirmed via `ComplexResourceController`'s `folderOp` dispatch to
`deleteFolder`, which 409s if not empty) can be called directly with `'*'`, since Core's shared
`createIfMatchHeaders` helper already treats `'*'` as "send no `If-Match` header at all" — the same
unconditional-delete convention `removeFolderCore`'s own per-type cleanup step already relies on.

The new `removeSkillFolderCore` therefore: walks the target folder recursively (one level at a time,
via the unmodified `listSkillMetadata` + `toSkillList`), collects every skill and every nested
`.dial-folder` marker, deletes every skill (order-independent), then every folder marker
**deepest-first**, then the target folder itself — since a non-empty folder-marker delete conflicts.
Wired into the *same* `BaseAssetList.onMultipleRemove` folder branch via an `else if (view ===
AssetsSkills)` alongside the existing `getResourceTypeByRoute` check, so both the Skills list's own
bulk-delete and the standalone Folders Storage page get the fix without any change to how the other
five types are routed.

## Risks / Trade-offs

- **No display name in the list** → a reviewer must open a skill to see its human-readable name. Accepted
  per the confirmed scope; matches `Assets > App Runners`'s identical trade-off (`$id`-only list).
- **`name`/`description`/`version` are unavailable through any metadata endpoint, confirmed against Core's
  actual source** (see D6) — not merely "unverified" as the original `add-skill-publications` design
  flagged it. Both surfaces render these fields only when present; they stay blank until a future change
  parses `SKILL.md` frontmatter (needed anyway for in-browser manifest editing).
- **Bulk delete without a per-item content read** — each row's etag is expected to come from the folder
  listing (Core's metadata node includes an aggregate etag per item per the `SkillResourceApiTest`
  findings); if a listing row is missing an etag, bulk delete for that row must fail closed (reject before
  sending, matching `files-core-api`'s "no etag, no delete" rule) rather than sending an unconditional
  delete.
- **A single skill's read is now three sequential Core requests** (manifest GET for etag, files listing,
  parent-folder listing for author/dates) instead of the original two — a real latency cost accepted
  because there is no single endpoint that returns all of this, per D6's source-level confirmation.

## Migration Plan

Net-new surface; no data migration. Rollout is additive (new route, new menu item, new context) except for
the one-line `TabsContent.tsx` provider swap, which is a behavior-preserving correction (Skill Publications'
properties view doesn't currently read anything from `FileFolderContext` — see `SkillProperties`'s own
comment — so no observable change is expected there beyond removing the TODO).

## Open Questions

- None outstanding — Move, list-column scope, and the delete client were the three points resolved during
  exploration/proposal (see the confirmed decisions above).
