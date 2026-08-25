## Why

`Assets > Skills` currently offers no way to create a skill or a folder from the admin UI — the
`add-assets-skills` change deliberately scoped that out ("no creating a brand-new skill... from the
Assets UI"). The empty-state copy already tells users to "Create skill using the Create button," but
that button doesn't exist. Every other Assets surface (Prompts, Toolsets, Applications) lets a user
create both a folder and a new entity directly from the list; Skills is the one surface left without
it, with no path to a skill's first version except manual Core API calls.

## What Changes

- Add a `Create` button to the `Assets > Skills` list toolbar, offering two options: `Folder` and
  `Skill` — mirroring the existing `Assets > Prompts` toolbar shape (`baseToolbarOptionLabels` +
  a type-specific `newItem` entry).
- `Folder`: creates an empty grouping folder at the current path, reusing the same
  `onCreateFolder`/`handleCreateFolder` plumbing `BaseAssetList` already wires for every other asset
  type — no new folder-creation logic.
- `Skill`: opens a bespoke create modal (not the generic `CreateEntity`/`AssetProperties` form, since
  Skill has no version and isn't in `CrudAssetRoute`) with two fields:
  - `Name`: required, validated to lowercase letters, digits, and hyphens only
    (`/^[a-z0-9-]+$/`, matching the existing `ContainerId`-style validation convention), and checked
    for uniqueness against the skill names already loaded for the current folder.
  - `Description`: required (unlike the generic, optional `DescriptionControl`).
  - On submit, the two fields are written into a `SKILL.md` manifest (YAML frontmatter with `name`
    and `description`), sent as the sole part of a new multipart create request, and the new skill's
    folder is named after `Name`, created under the currently open folder.
  - On success, the list refreshes and the browser navigates to the new skill's detail page, matching
    Prompts/Toolsets/Applications' own create-then-navigate convention.
- **New Core API method**: `SkillsCoreApi` gains a whole-bundle create method
  (`PUT /v2/skills/{bucket}/{path}`, multipart, single `SKILL.md` part, create-only — no `If-Match`
  sent, so Core rejects if the path already exists) — the one Core route capable of creating a skill
  from scratch. The existing `uploadSkillFile` (`.../files/{filePath}`) only mutates a file inside an
  *already-existing* bundle and cannot be reused for this.
- New `createSkill` server action (`app/[lang]/assets-skills/actions.ts`) wrapping the new client
  method, following the same shape as `createPrompt`/`createApp`/`createToolset`.

## Capabilities

### New Capabilities
(none — this extends the existing Skills surfaces below rather than introducing a new one)

### Modified Capabilities
- `assets-skills`: reverses the "no create" requirement — the list toolbar now offers `Create >
  Folder` and `Create > Skill`, with the new skill modal's fields, validation, and post-create
  navigation.
- `skill-resources-core-api`: adds the whole-bundle create Core API method backing the new skill
  modal.

## Impact

- `components/Assets/BaseAssetList/utils.tsx` — `getToolbarOptionLabels` gains an `AssetsSkills` case;
  `getEmptyAsset`/`CreateAssetActionMap` are not extended, since Skill's create flow doesn't go
  through the generic `CreateEntity`/`AssetProperties` path.
- `components/Assets/utils.ts` — `getTreeActionLabels`'s current `AssetsSkills` early-return (`[]`,
  citing this exact non-goal) needs reassessment for whether folder-tree create should also open up,
  or stay toolbar-only (see design.md).
- New: a Skill-specific create modal component and its name/description validation, under
  `components/Assets/Skills/`.
- `server/core/skills-core-api.ts` — new whole-bundle create method.
- `app/[lang]/assets-skills/actions.ts` — new `createSkill` server action.
- No changes to `ai-dial-core` — the required endpoint already exists and is documented in this
  proposal's exploration; only the admin frontend client was missing it.
