## Why

DIAL Core now serves a second "complex resource" type, `projects` (`ResourceTypes.PROJECT`), next to `skills`.
Chat users create projects (a name, a description, markdown instructions and context files), and the admin
console has no way to list, inspect, delete, share-limit or approve them. Projects are the same engine as
Skills in Core (`/v2/projects/...`, `/v2/metadata/projects/...`, move, publications, share limits), so the admin
can support them by reusing the Skill vertical rather than building a new shape.

## What Changes

- **Refactor first, no behaviour change:** extract a shared complex-resource Core client (parameterised by
  group and manifest file name) from `SkillsCoreApi`, and generalise the `SKILL.md` frontmatter build/parse
  helpers and the recursive folder walk/delete that currently hard-code Skills. `SkillsCoreApi` becomes a thin
  subclass; every existing Skill spec stays green before any Project code is added.
- **New entity `Project`** (`ResourceType.PROJECT`), menu item `Projects` directly after `Skills` in the
  `Artifacts` group, no feature flag, routes `/projects` and `/projects/[id]`.
- **List** on the shared asset list as a folder tree (Name, Author, Created time, Updated time), with row delete,
  bulk delete, folder create and recursive folder delete via Projects' own Core endpoints. No import, export or
  row-level move.
- **Create** modal with `Name` and `Description` only. The admin writes a `PROJECT.md` manifest under the hood
  (frontmatter `name` + `description`, empty body), matching the chat app's layout, so no files are required.
- **Detail view** with a single `Properties` tab: read-only path/author/dates, a disabled `Name`, an editable
  `Description`, an editable markdown `Instructions` editor, and a `Context` section (add files, dropzone,
  capacity meter, attachment cards, styled like chat's `ProjectCreateForm`). Everything is staged and written on
  Save (PROJECT.md rewrite, `context/*` uploads and deletes), Discard reverts without contacting Core. The
  `PROJECT.md` manifest and any file outside `context/` are never shown or editable. The destination-folder
  field is hidden, as it is for Skills.
- **Context limits from env vars**, named and defaulted like the chat app: `PROJECT_CONTEXT_ALLOWED_EXTENSIONS`
  (`csv,pdf,xlsx`), `PROJECT_CONTEXT_FILE_MAX_BYTES` (1 MiB), `PROJECT_CONTEXT_TOTAL_MAX_BYTES` (10 MiB), plus a
  100-file cap as a constant. Documented as commented entries in `.env.template`.
- **Approvals:** Project publications appear in the existing Approvals list (Type `Project`) and open in a dedicated
  Skill/Project publication view; the existing generic publication view keeps serving the other types unchanged.
  publication view; the existing generic publication view keeps serving the other types unchanged.
- **Roles:** add `PROJECT` as a platform sharing type (TTL 72 h, max accepted users 10, matching Core's limit).

## Capabilities

### New Capabilities
- `projects`: the `Artifacts > Projects` surface — menu entry, list, create, detail view with Description,
  Instructions and Context, delete/bulk delete/folder delete, env-driven context limits.
- `project-publications`: the Approvals-facing Project Publications list and detail view.
- `complex-resource-core-client`: the shared Core client, manifest helpers and folder walker both Skills and
  Projects are built on.

### Modified Capabilities
- `skills`: implementation moves onto the shared client; add a requirement that Skill behaviour is unchanged.
- `skill-resources-core-api`: Core calls are issued through the shared client.
- `skill-publications`: Skill publications move to the dedicated Skill/Project publication view.
- `publications-core-api`: add `PROJECT` to the resource-type list and resolution priority
  (APPLICATION → CONVERSATION → PROMPT → TOOL_SET → FILE → SKILL → PROJECT).
- `platform-roles`: add `PROJECT` sharing type.

## Non-goals

- Folders Storage support for Skills and Projects (the rules tree and org-unit awareness) — done separately.
- Moving a skill or project between folders from the detail view (blocked by core#1861, field stays hidden).
- A file listing for Projects beyond the Context section; adding or showing files outside `context/`.
- A `projectsSupported` feature flag or any menu gating.
- Import and export of projects.

## Impact

- **Server:** `server/core/skills-core-api.ts` split into a shared base plus subclasses; new
  `projects-core-api.ts`; `server/folders/folders-core.ts` (`walkSkillFolder`, `removeSkillFolderCore`) taking a
  group; `server/publications/{resolver,mappers,models,update}` gain `PROJECT`; `app/api/api.ts` instances.
- **App:** new `app/[lang]/projects/**`, `app/api/projects/download`, `components/Assets/Artifacts/Projects/**`,
  `ProjectFolderContext`, `ProjectHeader`/wrapper, Project publication view; wiring in `BaseAssetList`,
  `Assets/utils`, breadcrumbs, tabs, `open-in-new-tab`, `is-view`, menu config and icons, i18n.
- **Existing code at risk:** every Skill file touched by the refactor, and `Publications/View/View.tsx`, which
  stops handling Skill publications.
- **Config:** three new optional env vars in `.env.template`.
- **Docs:** env var documentation under `docs/`.
