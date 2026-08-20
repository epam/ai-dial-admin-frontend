## Context

`Assets > Skills` (archived change `add-assets-skills`) deliberately shipped without any way to
create a skill or a folder, sharing `BaseAssetList`/`FileManager` with the five other asset surfaces
but opting out of every per-type action map: `getToolbarOptionLabels` falls to its `default: []` case
for `AssetsSkills`, and `getTreeActionLabels` explicitly early-returns `[]` for it with a comment
citing this exact Non-Goal. Skill is also absent from `CreateAssetRoute`/`CrudAssetRoute`, the unions
`CreateAssetActionMap`/`ImportAssetActionMap`/`MoveAssetActionMap` key off.

Two things make Skill's create flow structurally different from Prompts/Toolsets/Applications, both
confirmed against `ai-dial-core`'s actual source (not just its own design doc, which the prior change
found to oversell what's implemented):

1. **No version, no `CrudAssetRoute` membership.** Skill has no version field anywhere in the
   generic pipeline (`AssetProperties`, `isAssetWithVersion`), so the standard `CreateEntity` body
   (name/version/displayName) doesn't fit — the same reason `AssetsAppRunners` already bypasses it
   with its own `AppRunnerCreateProperties`.
2. **Folder-create and skill-create are two different Core endpoints, not one.** Every other asset
   type creates a folder-marker resource through the *same* generic action its real entities use
   (e.g. `createPrompt` writes an empty-content prompt at the folder path — Core doesn't distinguish
   a "real" prompt from a folder-marker one). Skill has no such shared shape: a grouping folder is
   `PUT /v2/skills/{bucket}/{path}/` (trailing slash, no body), while a real skill is
   `PUT /v2/skills/{bucket}/{path}` (multipart, must include a `SKILL.md` part). One `CreateAssetActionMap`
   entry cannot serve both without inventing a way to tell them apart from a generically-shaped
   `AssetWithVersion` argument — which is exactly the kind of implicit, easy-to-regress branching this
   codebase's per-type actions maps exist to avoid.

## Goals / Non-Goals

**Goals:**
- Add `Create > Folder` and `Create > Skill` to the `Assets > Skills` toolbar.
- `Folder`: creates an empty grouping folder at the current path.
- `Skill`: a create modal (name + required description) that writes a new skill's `SKILL.md` and
  navigates to its detail page on success.
- Add the one Core API method genuinely missing for this: whole-bundle create
  (`PUT /v2/skills/{bucket}/{path}`, multipart, single `SKILL.md` part).

**Non-Goals:**
- No change to folder-tree right-click actions (`getTreeActionLabels` stays `[]` for
  `AssetsSkills`) — only the toolbar `Create` button is in scope, matching what was asked for. Tree
  create/rename/move for Skills remains a separate, unrequested expansion.
- No bundling additional files into a new skill at creation time — only `SKILL.md` is written; adding
  further files is the existing staged-add flow on the detail view.
- No in-browser `SKILL.md` frontmatter editing after creation (still deferred, per the archived
  design) — only initial creation writes it.
- No changes to `CrudAssetRoute`, `ImportAssetActionMap`, `ExportAssetActionMap`, or
  `MoveAssetActionMap` — Skill still has no import/export/list-move, unrelated to this change.

## Decisions

### D1: Reuse the `CreateEntity`/`Properties` shell with a bespoke `SkillCreateProperties` body — not a standalone modal

`Properties.tsx` already dispatches `ApplicationRoute.AssetsAppRunners` to its own
`AppRunnerCreateProperties` before reaching the generic `AssetProperties`, specifically because App
Runner's identity model doesn't fit the generic version-carrying form. Skill gets the same treatment:
a new `SkillCreateProperties` (name + description, no version/displayName) rendered inside the
existing `CreateEntity`/`DialFormPopup` shell — reusing its header, Save/Cancel buttons, and
`useSaveValidationContext` wiring — rather than building a new modal component from scratch.

Alternative considered: a fully standalone modal outside `CreateEntity`. Rejected — it would
duplicate the header/footer/validation-context wiring `CreateEntity` already provides for exactly
this "two-field create body" shape, for no behavioral gain.

### D2: Folder-create and skill-create get their own explicit branch in `BaseAssetList`, not new `CreateAssetActionMap`/`CreateAssetRoute` entries

Both `handleCreateFolder` and `handleCreateAsset` currently look up `CreateAssetActionMap[view]`
unconditionally. Rather than stretching that map to hold a per-type function that would need to
distinguish "folder-marker create" from "real entity create" from a generically-shaped argument (the
two are genuinely different Core calls for Skill, unlike every existing entry), each handler gets an
explicit `if (view === ApplicationRoute.AssetsSkills)` branch calling a dedicated action, alongside
the existing generic path — the same shape `onMultipleRemove` already uses for Skill's folder delete
(`else if (view === ApplicationRoute.AssetsSkills)` next to the generic `getResourceTypeByRoute`
branch). `CreateAssetRoute`/`CreateAssetActionMap` stay exactly as they are; no new union member.

Alternative considered: add `AssetsSkills` to `CreateAssetRoute` and give it a `CreateAssetActionMap`
entry whose function inspects the incoming asset to decide which Core call to make. Rejected — it
would hide a real branch inside a map entry that every other type keeps as one clean function call,
and the map's type signature (`(asset: AssetWithVersion) => ...`) has no natural way to express "this
call is a folder marker, not a real entity" without a sentinel the other five types don't need.

### D3: Two new Core API methods, both whole-resource operations distinct from the existing per-file route

- `createSkillFolder(token, path)` → `PUT /v2/skills/{bucket}/{path}/` (trailing slash, no body) —
  mirrors `deleteSkillFolder`'s existing trailing-slash convention for the same grouping-folder route.
- `createSkill(token, path, manifestFile)` → `PUT /v2/skills/{bucket}/{path}` (multipart, one part
  named for `SKILL.md`) — create-only: no `If-Match` header sent, so Core rejects if a resource
  already exists at that path (confirmed: omitting `If-Match` on this route means "create, don't
  overwrite," per `ai-dial-core`'s `ComplexResourceController`).

Both live on `SkillsCoreApi`, alongside `uploadSkillFile`/`deleteSkillFile`/`deleteSkillFolder` — not
on the generic `AssetApi`, for the same reason `deleteSkill` already isn't: `CORE_RESOURCE_URL[SKILL]`
is a `v1/skills/...` path Core doesn't serve.

### D4: `SKILL.md` content is built client-side from name + description, both written bare

The manifest is generated as:

```
---
name: <name>
description: <description>
---
```

Both fields are written as bare YAML scalars — no quoting or escaping. `name` needs none under the
FE's own `/^[a-z0-9-]+$/` charset (no YAML-special characters possible). `description` was initially
quoted (escaping embedded `"` and newlines) to be safe against arbitrary input, but the user asked for
this to be removed — Core's `SkillHandler` only requires the frontmatter parse to a non-blank
`description` string, with no formatting preference confirmed in its source, so the extra escaping
logic wasn't judged worth keeping.

### D5: Post-create navigation needs an explicit `path`, since Skill has no version to build one from

`CreateEntity.onCreate`'s success branch builds `newEntity = { folderId, name, version, $id }` and
navigates via `getEntityPath`, whose shared branch (Prompts/Files/AssetsApplications/AssetsToolsets/
**AssetsSkills**) falls back to `` `${folderId}${name}__${version}` `` only when `data.path` is absent.
For Skill, `version` is always `undefined` post-create, which would produce a literal `__undefined`
suffix and a broken navigation target. Fix: `onCreate` adds `path` to `newEntity` whenever the route
has no version concept (mirroring the already-working `AssetsModels`/`AssetsAppRunners` case, which
avoids this exact trap via its own `path`/`$id` fallback in `getEntityPath`) — computed as
`` `${folderId}${name}` `` for Skill. This is additive: every other branch already supplies its own
`version` and ignores the extra field.

Alternative considered: give `getEntityPath`'s shared branch a `AssetsSkills`-specific case instead.
Rejected as a larger, riskier touch to a function five other types depend on, for a fix only Skill
needs — matching the same "don't touch the working generic path" instruction the folder-deletion work
in the prior change was given.

### D6: Name/description validation lives in `SkillCreateProperties`, not a shared control

- **Name**: required, `/^[a-z0-9-]+$/` (reusing the existing `ContainerId`-style convention and error
  copy already used for deployment-id-shaped fields), plus a duplicate check against the `names` array
  `CreateEntity` already receives (the current folder's already-loaded skill/folder names) — the same
  source Prompts/Toolsets already use for their own duplicate-name check, so no new data fetch.
- **Description**: required (the generic `DescriptionControl` is optional-by-default; `
  SkillCreateProperties` dispatches its own required-field validity to `useSaveValidationContext`
  rather than changing `DescriptionControl`'s default for every other consumer).
- Both dispatch through the same `ValidationActionType.SetField` mechanism `AssetProperties`/
  `AppRunnerCreateProperties` already use, so `CreateEntity`'s Save button disables consistently with
  every other create form.

## Risks / Trade-offs

- **Two new Core calls with no existing FE test coverage of the multipart create shape** → mitigated
  by mirroring `uploadSkillFile`'s already-working `FormData`/`postFiles('PUT', ...)` construction as
  closely as possible, and by explicit unit tests for the new `SkillsCoreApi` methods.
- **Client-side-only duplicate-name check** (per the confirmed answer) → a race where two admins
  create the same skill name simultaneously isn't caught client-side; the create-only `PUT` (no
  `If-Match`) still fails server-side in that case, so the check is a UX nicety, not the sole
  correctness guard.
- **A skill created with only `SKILL.md` has an empty bundle otherwise** — acceptable: the detail
  view's existing staged-add flow is exactly where further files get added.

## Migration Plan

Net-new capability on an existing surface; no data migration. Purely additive except the small,
targeted `CreateEntity.onCreate` fix in D5, which only changes behavior for routes with no version
(Skill; already-working `AssetsModels`/`AssetsAppRunners` are unaffected since they don't hit that
fallback path at all).

## Open Questions

- None outstanding — name casing, duplicate-check placement, and post-create navigation were resolved
  during exploration (see proposal's confirmed answers and D5 above).
