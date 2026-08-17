## Why

DIAL Core added a new `SKILL` resource type (a folder-of-files resource rooted at a `SKILL.md`
manifest) and already allows it into the generic publication workflow
(`PublicationService.ALLOWED_RESOURCES`), on par with Application, Toolset, Prompt, Conversation,
and File. The admin frontend has no way to review or act on pending Skill publications — reviewers
can approve/reject Application/Toolset/Prompt/Conversation/File publications today, but a Skill
publication request has no queue, no menu entry, and no view. This closes that gap.

## What Changes

- Add a new **Skill Publications** entry to the Approvals menu, positioned last: Application,
  Toolset, Prompt, Conversation, File, Skill.
- Add `ResourceType.SKILL` / `CoreResourceType.SKILL` and wire Skill into every registry/mapping the
  publication resolver keys off of (`PUBLICATION_TYPE_REGISTRY`, `PublicationResourceKey`/
  `PublicationAssetKey` unions, `CORE_RESOURCE_TYPE_TO_RESOURCE_TYPE` and its inverse, resolution
  order, primary-type detection in `update.ts`).
- Add a Skill-specific enrichment path (`enrichSkillResource`) that fetches folder **metadata only**
  (`GET /v2/metadata/skills/{bucket}/{path}/` — name, description, version, etag) — mirroring how
  File resources are already enriched by metadata rather than by fetching/PUTting a whole JSON body.
  No new `/v2` multipart-upload or ZIP-download client is introduced.
- Add `getPublicationSkillList` to `CorePublicationsApi`, a new `skill-publications` route and app
  router pages (list + detail), and server-side wiring to reach them.
- Add `PublicationSkill`/`SkillPublication` models, a read-only `SkillProperties`/`SkillDetails`
  properties tab (base name/folder/comment fields + skill metadata + a read-only file-list grid of
  the bundle's contents, cloned from the File publication's file grid), and wire the new `view` arm
  into the shared `TabsContent`/`View`/breadcrumbs/i18n/help-doc-link/list-title registries.
- Reuse the existing generic approve/reject/delete/update server actions and modal copy unchanged —
  they operate on a publication `path`, not a resource type, so no behavior changes there beyond new
  i18n copy for the Skill-specific modal text.

## Non-goals

- **No in-browser Skill authoring or editing.** Unlike Toolset/Application (single-JSON assets
  edited via a reused asset-editor form), a Skill is a multi-file bundle served through Core's new
  `/v2/skills/...` multipart/ZIP API. Building an editor for that (SKILL.md + frontmatter editing,
  per-file add/remove/replace) is a separate, larger feature and out of scope here. This change's
  properties view is read-only: metadata display plus a file listing, no edit/save path for the
  bundle's contents.
- No changes to Core's publication API surface — it already accepts `SKILL` in
  `ALLOWED_RESOURCES` and publishes/approves/rejects it through the same generic
  `/v1/ops/publication/*` endpoints used by every other type.
- No support for Skills as a standalone asset-management entity (create/edit/delete a Skill outside
  of reviewing a pending publication) — this change is scoped to the Approvals queue only, per the
  request.

## Capabilities

### New Capabilities

- `skill-publications`: The Approvals-facing Skill Publications feature — menu entry, route, list,
  and read-only detail view (metadata + file listing) for reviewing pending Skill publication
  requests.

### Modified Capabilities

- `publications-core-api`: Extends the resource-type-filtered publication list, and the per-resource
  enrichment behavior, to recognize `SKILL` as a publishable resource type enriched via
  metadata-only lookup (parallel to the existing File-resource treatment), rather than via the
  full content+metadata merge used for the four versioned types.

## Impact

- **Server**: `src/types/resource-type.ts`, `src/server/publications/models.ts`,
  `src/server/publications/mappers.ts`, `src/server/publications/resolver/{registry,types,resolve}.ts`,
  a new `src/server/publications/resolver/skill-resource.ts`, `src/server/publications/update.ts`,
  `src/server/entities/core-publications-api.ts`.
- **Models**: `src/models/dial/publications.ts` (`PublicationSkill`, `SkillPublication`).
- **Routing**: `src/types/routes.ts`, new
  `src/app/[lang]/skill-publications/page.tsx` and `src/app/[lang]/skill-publications/[id]/page.tsx`.
- **Components**: `src/components/Publications/Properties/SkillProperties.tsx`,
  `src/components/Publications/Assets/Skill/SkillDetails.tsx` (+ a read-only file-list reusing the
  File publication's list component), plus edits to `TabsContent.tsx`, `View.tsx`, `InfoHeader.tsx`
  (only if Skill needs no auth header — verify during design), `Menu/menu-configuration.tsx`,
  `Breadcrumbs/constants.ts`, `ListView/constants.ts`, `utils/tabs/utils.ts`, `utils/publications.ts`.
- **i18n**: `src/constants/i18n.ts` (`MenuI18nKey.SkillPublications`, a `PublicationsI18nKey` Skill
  block), `src/locales/en.ts`.
- **Docs**: `src/constants/help-documentation-links.ts`.
- No changes to `ai-dial-admin-backend` or `ai-dial-admin-deployment-manager-backend` — this change
  is FE-only, calling DIAL Core directly per the existing `publications-core-api` pattern.
