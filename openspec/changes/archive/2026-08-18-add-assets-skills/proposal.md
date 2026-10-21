## Why

DIAL Core added a `SKILL` resource type (a versioned folder bundle rooted at a `SKILL.md` manifest) with full
support for list/get/delete/move/share/publish. The FE already ships Skill Publications (the Approvals-facing,
read-only review surface), which proved the resource shape and naming convention but deliberately implemented no
Assets-facing surface. Admins currently have no way to browse, inspect, or remove Skills outside of a pending
publication review. `Assets > Skills` closes that gap using the same generic Core operations Skill Publications
already depends on, and is scoped to what Core's metadata-only listing endpoint actually returns — no per-row
content fetch, no bundle authoring UI.

## What Changes

- Add an `Assets > Skills` menu item, positioned after `Files` (the last existing Assets entry), linking to a new
  `/assets-skills` route.
- Add a Skills asset list built on the shared asset list, showing only columns sourced from Core's
  `/v2/metadata/skills` response (name/path, author, created-at, updated-at) — no `SKILL.md` fetch per row, so no
  display name or description column.
- Add a Skills asset detail view built on the standard Save/Discard pattern every other asset uses: file
  add/remove and the destination folder are staged locally and only committed to Core when the user clicks Save
  (Discard reverts everything, including staged files). The file listing shows name only — Core reports no
  per-file size on this surface — with preview/download/remove per row (`SKILL.md` protected from removal) plus
  an Add-file control, reusing the `SkillDetails` rendering already built for Skill Publications. The skill's own
  parsed metadata (description/version) is out of scope for this change — see Non-goals — but its real read-only
  fields (path, author, created/updated dates) are corrected to source from Core's actual endpoints (see below).
  The destination-folder field enables Move, applied on Save like Prompts/Toolsets already do.
- Rework Skill Publications' file listing the same way: preview/download are now available there too (previously
  none of preview/download/remove/add were offered), and add/remove are staged locally, applied when the reviewer
  clicks the publication's existing Save (which already handles other publication-field edits) rather than
  firing immediately.
- Fix a real bug found in use: the skill detail header showed no maintainer/created/updated values. Root cause,
  confirmed by reading `ai-dial-core`'s actual implementation (not just its `skills.md` design doc): no metadata
  endpoint returns a skill's `author`/`createdAt`/`updatedAt` for a direct "read this one skill" call — they're
  only present on that skill's row in its *parent folder's* listing. Fixed by having the Skill Core client look
  up that row, and by reading the current aggregate etag from the `SKILL.md` file GET's `ETag` header (the only
  place it's exposed for a single skill). `name`/`description`/`version` remain unavailable through any metadata
  endpoint — they live only in `SKILL.md`'s frontmatter — and are deliberately left unpopulated until in-browser
  `SKILL.md` editing is built (see Non-goals).
- Add delete and bulk-delete actions against Core's Skill delete endpoint.
- Add the Core API surface these actions need: extend the Skill Core client with a list-metadata method, a
  whole-skill delete method, per-file upload/download/preview/delete methods, and the parent-folder lookup above,
  following the `toolset-resources-core-api`/`files-core-api` client pattern. Move reuses the existing generic
  `AssetApi.move` unchanged — Core's move op already accepts `SKILL`.
- Add a new `SkillFolderContext` (via the existing `createFolderContext` factory), and use it to fix the TODO in
  `Publications/View/TabsContent.tsx` that currently wraps `SkillProperties` in the wrong `FileFolderProvider`.
- **Non-goals**: creating a brand-new skill (with its own `SKILL.md`) from the Assets UI, and any editing of the
  skill's own parsed metadata (name/description/version) — both require parsing and regenerating `SKILL.md`'s
  YAML frontmatter, deferred to a future change alongside in-browser `SKILL.md` editing. Also unchanged from the
  original scope: an Audit tab, revisions/rollback, a Core-sync banner, import/export, and realtime list refresh
  (Core's resource subscription allow-list excludes `SKILL`). List-level Move (a row's "Move to folder" context
  action, as `MoveAssetActionMap` offers Prompts/Applications/Toolsets) stays out of scope — only the detail
  view's folder field + Save moves a skill; wiring the list action too would need carving a narrower
  `MoveAssetRoute` type out of the existing `CrudAssetRoute` union (which otherwise forces Import/Export
  obligations onto any route added to it), out of proportion for what was asked.

## Capabilities

### New Capabilities

- `assets-skills`: the `Assets > Skills` surface — menu entry, metadata-only list, detail view (Save/Discard
  header; staged file add/preview/download/remove with `SKILL.md` protected; folder field that moves the skill
  on Save), delete, and bulk delete.
- `skill-resources-core-api`: the Skill Core API client additions (list metadata, parent-folder author/date
  lookup, whole-skill delete, per-file upload/download/preview/delete) backing the assets-skills surface, and the
  `SkillFolderContext` that both `assets-skills` and the corrected `skill-publications` properties view depend on.

### Modified Capabilities

- `skill-publications`: the file listing gains preview/download (previously offered none of preview/download/
  remove/add) and staged add/remove, applied through the publication's existing Save/Discard rather than firing
  immediately — a real behavior change from the archived capability's "no add, remove, or download action"
  requirement, so its spec needs an update alongside `assets-skills`'s new one.

## Impact

- New routes: `src/app/[lang]/assets-skills/{page.tsx, actions.ts, [id]/page.tsx}`.
- New components: `src/components/Assets/Skills/{List.tsx, View/View.tsx, View/Properties.tsx}` (reusing
  `SkillDetails` from `src/components/Publications/`), `src/components/EntityHeaderControls/SkillHeader.tsx` +
  `Wrappers/SkillButtonsWrapper.tsx` (a narrower `AssetHeader` variant without the version control every other
  asset header renders unconditionally — Skill has no version concept exposed at this layer).
- New context: `src/context/assets/SkillFolderContext.tsx`.
- Modified: `src/components/Menu/menu-configuration.tsx` (new Assets menu item), `src/types/routes.ts` (new
  `AssetsSkills` route), `src/constants/i18n.ts` + `src/locales/en.ts` (new menu/label/delete/update keys),
  `src/server/core/skills-core-api.ts` (list/delete, parent-folder lookup, per-file upload/download/preview/
  delete), `src/components/Publications/View/{View.tsx,TabsContent.tsx}` (staged Skill file state lifted to
  `PublicationView`, applied on its existing Save; TabsContent also gets the `SkillFolderProvider` TODO fix),
  `src/components/Publications/Properties/SkillProperties.tsx` and
  `src/components/Publications/Assets/Skill/SkillDetails.tsx` (reworked to take the plain `DialSkillResource` and
  staged add/remove props instead of a `SkillPublication` wrapper and immediate mutation), two new API routes
  (`/api/skills/download`, `/api/skills/preview`) mirroring the equivalent Files routes, `src/models/dial/
  resource.ts` (`DialSkillResource` gains `folderId`), `EntityView/Modals/Delete/utils.ts` + `utils/entities/
  update-entity.ts` + `utils/is-view.ts` (new `AssetsSkills` entries — the detail page's Delete button now goes
  through the same generic confirmation/notification flow every other asset uses).
- No admin-BE involvement — all operations go directly to DIAL Core, consistent with how Toolsets/Applications/Files
  asset surfaces already work.
