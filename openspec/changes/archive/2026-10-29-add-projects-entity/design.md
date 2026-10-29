## Context

Core serves `skills` and `projects` through one engine: `ComplexResourceController` /
`ComplexResourceMetadataController` (`/v2/{skills|projects}/{bucket}/{path}[/files/{f}]`,
`/v2/metadata/{group}/...`), a versioned `.dial-resource` marker per resource, move through
`/v1/ops/resource/move`, publications, and share limits. `ProjectHandler` validates nothing and stores no
marker metadata; Core only requires at least one uploaded file on create and enforces limits (default 1000
files, 64 MiB total, 5 MiB per file).

The chat app owns the project layout: `PROJECT.md` at the root (YAML frontmatter `name` + `description`, markdown
body = instructions; extra frontmatter keys written by other clients are preserved, the frontmatter `name` is
ignored because the name is the path) and context files under `context/`. Chat caps context with
`PROJECT_CONTEXT_ALLOWED_EXTENSIONS` (`csv,pdf,xlsx`), `PROJECT_CONTEXT_FILE_MAX_BYTES` (1 MiB),
`PROJECT_CONTEXT_TOTAL_MAX_BYTES` (10 MiB) and a 100-file constant.

The admin's Skill vertical is a hand-built stack: `SkillsCoreApi`, `toSkillList`, `skill-manifest.ts`,
`walkSkillFolder`/`removeSkillFolderCore`, `SkillFolderContext`, `SkillHeader`/`SkillButtonsWrapper`, a
`SkillView`, `BaseAssetList` wiring, and a Skill branch in `Publications/View/View.tsx`. Projects are the same
shape with a different manifest, a `context/` folder and no manifest tab.

## Goals / Non-Goals

**Goals:**
- Add `Projects` (menu, list, create, detail, delete) and Project publications (in the Approvals list) using the
  Skill vertical's shape.
- Interoperate with chat: an admin-created project opens in chat and the reverse.
- Land the shared client refactor with zero Skill behaviour change before any Project code.

**Non-Goals:**
- Folders Storage for Skills/Projects, folder move on the detail page (core#1861), a file listing beyond
  `context/`, import/export, a feature flag, changes to the other publication types' view.

## Decisions

### D1. Shared complex-resource client, UI copied

Extract `ComplexResourceCoreApi` (constructor: group, manifest file name) holding everything in `SkillsCoreApi`
that is not Skill-specific: `getMetadata` (item node + files), `getFiles`, `uploadFile`, `create` (manifest-only
bundle, `If-None-Match: *`), `createFolder`, `getManifestContent`, `download`/`preview`, `deleteFile`,
`listMetadata`, `delete`, `deleteFolder`. `SkillsCoreApi` and `ProjectsCoreApi` are subclasses that only bind the
group URLs (`v2/skills` / `v2/projects`, metadata variants) and manifest name.

The frontmatter helpers move from `utils/skill-manifest.ts` to a neutral module (`parseManifest` /
`buildManifest`), with `skill-manifest.ts` re-exporting thin wrappers so Skill imports and specs keep working.
`walkSkillFolder` / `removeSkillFolderCore` become group-parameterised (`walkComplexFolder`,
`removeComplexFolderCore`) with Skill wrappers. The `ResourceType` to prefix/URL tables in
`constants/publications-core.ts` and `assets-core.ts` gain `PROJECT`.

*Alternatives:* copy `SkillsCoreApi` into `ProjectsCoreApi` (rejected: two near-identical 270-line clients drift);
generalise the UI too (rejected: Skill has a manifest tab and Project has none, so the views differ in structure
and a shared view would be a pile of conditionals).

### D2. Manifest convention and Project field mapping

`PROJECT.md` uses frontmatter `name`, `description` and a body of instructions. The neutral `parseManifest` / `buildManifest` keep the Skill behaviour (body verbatim, trailing newline added). Chat's convention differs in the blank line after the closing fence (written on build, stripped once on parse) and in adding no trailing newline, so Projects get their own `parseProjectManifest` / `buildProjectManifest` on top of the shared frontmatter parser, to stay byte-compatible with chat.
Create writes frontmatter only with an empty body. On Save the admin re-reads nothing: it rebuilds from the
last-fetched raw content plus staged description/instructions so untouched frontmatter keys survive, exactly as
`buildSkillManifest(original, {...})` does for Skills. The manifest is read by the detail page's server component and
passed to the view (it backs the main tab, so it is not lazy); the publication view, which is client-side, reads
it on mount. The staging (Description, Instructions, Context) is one shared hook, `useProjectStaging`, so both
views save the same way; the fields are derived from the manifest and only the user's edits are state. A malformed or missing manifest renders empty Description and
Instructions and keeps the raw text as instructions, mirroring chat's parser.

### D3. Context section

Context files live under `context/`. The listing strips the prefix and hides everything else (including
`PROJECT.md`). Uploads go to `context/{name}`, removals delete `context/{name}`. A new feature component under
`components/Assets/Artifacts/Projects/View/` renders the chat-style block (capacity meter, `Add` dropdown, ui-kit
`FileDropzone`, attachment cards, rejection list, `aria-live` status) as a controlled component: it receives the
stored names, the staged additions and removals, and the limits, and reports `onAdd`/`onRemove`. Validation
(extension, per-file size, total size, file count, duplicate name) is a pure util tested on its own; stored files
count toward the total using sizes from Core's file listing.

Each file is a square tile like the chat application's attachment card (`ContextFileCard`): the name without its
extension, a type icon with `EXT · size` beneath, actions in the corner on hover or focus. The `Add` control is a
`ButtonDropdown` with `From device` and `From file storage`. The latter opens `ContextFilesPicker`: a popup over the
existing file browser (`EntitySelectManager`, given an opt-in multi-select mode that reports only file rows), which
downloads each pick through `/api/files/download` into a `File` and hands the copies to the same validation as a
device upload. Core's metadata and `/files` listing report no per-file size, so the capacity meter needs another source. The
chat application reads the project's whole-bundle archive (`GET /v2/projects/{bucket}/{path}`) and takes each
entry's uncompressed size from the ZIP central directory; `ProjectsCoreApi.getProjectMetadata` does the same
(zip.js, nothing inflated), buffered under Core's default 64 MiB per-project total, in parallel with the metadata
read. A failed, oversized or unreadable archive leaves the sizes unset (counted as 0) and never fails the page.

### D4. Env-driven limits

Three optional server env vars, read by a small `getProjectContextLimits()` in `utils/env/` (alongside the other
env readers, mirroring `server/zip/limits.ts` parsing and defaults): extension list is trimmed, lower-cased,
dot-stripped, empty entries dropped, empty/unset gives the default; byte values fall back to the default when
unset or not a positive integer. The 100-file cap is a constant in `constants/project.ts`. The limits reach the
views through a `getContextLimits` server action (the detail page's server component calls it and passes the
result down; the client-side publication view calls it on mount), so there is no `NEXT_PUBLIC_*`.
They are documented as commented entries in `.env.template` and in the env docs.

### D5. Create flow

`Create > Project` opens the existing create modal with a `ProjectCreateProperties` body (`Name` + required
`Description`), a sibling of `SkillCreateProperties`. Name validation reuses the same deployment-id-shaped check
and duplicate-name message pattern. `createProject(name, description, folderId)` generates the manifest and PUTs
the whole bundle create-only. On success the user lands on the project's detail page.

### D6. Publications: dedicated view for Skill and Project

`Publications/View/View.tsx` currently carries Skill file/manifest staging state. Skill and Project publications
move to a new `ComplexResourcePublicationView` (one view, `view` prop selecting Skill or Project behaviour) and
the generic view is reverted to its pre-Skill shape for the other five types. Project publications use the
single-tab Properties layout (Description, Instructions, Context) plus the shared Permissions tab; Skill keeps
`Properties`, `Skill`, `Permissions`. The route-to-view switch is the publication page (`publications/[id]/page.tsx`), using
`isComplexResourcePublicationView`. Approvals stays a single menu entry and one list with a Type column, so
Project publications need no menu item of their own.

Server side, `PROJECT` is added to `PUBLICATION_TYPE_REGISTRY` (`resourceKey: 'projectResources'`, `assetKey:
'projectResource'`, `hasFiles: false`), a `project-resource.ts` resolver clones `skill-resource.ts` over the
shared client, `CoreResourceType.PROJECT` is added to the three mapper tables with resolution order
APPLICATION → CONVERSATION → PROMPT → TOOL_SET → FILE → SKILL → PROJECT, and `update.ts` treats PROJECT like SKILL
(recalculate target URL, never queue a JSON asset PUT).

*Alternative:* keep growing the generic view (rejected: it would hold two full staging state machines unrelated
to the other types).

### D7. Roles

`PlatformSharingType.PROJECT = 'PROJECT'` (Core's `ResourceTypes.name()`), default `{ invitationTtl: '72',
maxAcceptedUsers: '10' }`, label `MenuI18nKey.Projects`.

### D8. Naming

`ResourceType.PROJECT = 'PROJECT'` sits beside the existing `PROJECT_KEY` (Keys). UI strings say "Project" for the
artifact and keep "Key" for access keys; code never reuses `Project` for key entities.

## Risks / Trade-offs

- **Refactor regresses Skills** → land it first as its own task group; run the full Skill spec set (client,
  actions, view, list, publications, folders, resolver) green before Project code starts.
- **Interop drift with chat** (manifest format, `context/` prefix) → helpers mirror chat's builder/parser including
  extra-frontmatter preservation; covered by round-trip tests against chat-shaped fixtures.
- **Capacity meter accuracy and cost** (no per-file size in Core's listing, so the archive is downloaded to read its
  central directory) → sizes come from the archive, capped at 64 MiB, and are optional; limits are still enforced
  by Core, whose 400/413 errors surface as notifications.
- **Two views for publications** adds a view to maintain → the Skill logic is moved, not duplicated, so the net
  code is roughly unchanged and the generic view gets simpler.
- **Env limits differ from chat's actual deployment values** → defaults match chat's; operators set the same vars
  for both apps. Core's own limits remain the hard ceiling.
- **Publication view split touches working Skill publication behaviour** → Skill publication specs are the
  safety net and run unchanged.

## Migration Plan

Single PR, ordered: (1) shared client and helper refactor with Skill specs green, (2) Project server layer and
vertical, (3) Roles and menu, (4) publications split and Project publications, (5) docs and env template. No data
migration; new env vars are optional. Rollback is a revert.

## Open Questions

- Should extension filtering apply to files already stored by other clients (display only, no filter)? Default:
  stored files are always shown, the filter applies to additions only.
