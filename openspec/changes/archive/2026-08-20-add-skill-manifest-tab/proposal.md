## Why

`assets-skills` and `skill-publications` both deliberately left a skill's own parsed metadata
(`name`/`description`/`version`, and its markdown body) out of scope — that data lives only in
`SKILL.md`'s YAML frontmatter, and neither surface parses or edits it. Core's skill file API already
supports reading and editing `SKILL.md` (single-file `GET`/`PUT`, with `DELETE` specifically blocked)
and re-validates/re-parses frontmatter on every edit, refreshing the resource's cached marker metadata.
This change closes that gap: a dedicated `Skill` tab that shows the parsed name (read-only) and lets a
user edit the description and the markdown body, on both the Assets detail view and the Skill
Publications properties view.

## What Changes

- Add a Skill Core API method to fetch `SKILL.md`'s raw content (single-file `GET`) and a frontmatter
  parse/serialize utility (`gray-matter`, already a dependency) that splits it into `{ name,
  description, body }` and reassembles `{ name, description }` + an edited body back into a valid
  frontmatter document.
- Add a new `Skill` tab, after `Properties`, to both the Assets > Skills detail view and the Skill
  Publications properties view: a disabled `Name` input populated from parsed frontmatter, an editable
  `Description` input, and an `MdEditor` (existing component, already used by Prompts) for the body.
- Edits to `Description` and the body are staged locally, matching the existing Save/Discard pattern
  (staged file add/remove, staged folder move) already used by both surfaces — no request reaches Core
  until Save, and Discard reverts without contacting Core. On Save, the staged name/description/body are
  reassembled into `SKILL.md` and written via the existing single-file `PUT`.
- Filter `SKILL.md` out of both surfaces' file listing grid — it no longer appears as a row (currently
  shown with its Remove action suppressed).
- Remove the unconditional `name` `LabelledText` from the shared `SkillDetails` component (used by both
  Properties tabs), since the new Skill tab now owns the name display. `description`/`version`
  `LabelledText`s in `SkillDetails` are removed too, since `SkillDetails` no longer receives populated
  values for them and the Skill tab is now their home — see Non-goals for `version`.
- A `SKILL.md` edit that fails Core's frontmatter validation (e.g. an empty description after edit,
  though the UI already requires description to be non-empty) surfaces as a save error rather than
  silently discarding the edit, matching how other staged-save failures are reported.

## Non-goals

- No editing of `version` — Core's frontmatter schema treats it as optional cached metadata with no
  required format, and no part of this change's UI writes it; if a skill's `SKILL.md` already has a
  `version` field, it round-trips unchanged through the reassembled document (parsed and re-serialized
  as-is), but no input is added for it.
- No change to the skill create modal (`SkillCreateProperties`) — creation already collects name and
  description; this change only adds the ability to edit them afterward.
- No change to `SKILL.md`'s protection from deletion or to the file listing's staged add/remove
  behavior for other files — only its presence as a row in the grid changes.
- No renaming of a skill (the `name` input stays disabled) — a skill's identity is its path, and
  renaming is a distinct move/rename operation this change does not add.

## Capabilities

### Modified Capabilities
- `assets-skills`: adds the `Skill` tab to the detail view; removes the unconditional `name`
  `LabelledText` (and the always-empty `description`/`version` ones) from the Properties tab's shared
  `SkillDetails`; filters `SKILL.md` out of the file listing.
- `skill-publications`: adds the same `Skill` tab to the properties view; removes the skill-metadata
  block's `LabelledText`s from the Properties tab (superseded by the new tab, which is editable here
  too, matching this capability's existing staged-edit/save pattern for files); filters `SKILL.md` out
  of the file listing.
- `skill-resources-core-api`: adds a method to read a single file's raw content (`GET
  /v2/skills/{bucket}/{path}/files/{filePath}`), needed to populate the new tab's fields; the existing
  per-file upload method is reused (not modified) to write the reassembled `SKILL.md` on Save.

## Impact

- `apps/ai-dial-admin/src/server/core/skills-core-api.ts` — new single-file-read method.
- `apps/ai-dial-admin/src/utils/` — new frontmatter parse/serialize utility (new file).
- `apps/ai-dial-admin/src/utils/tabs/utils.ts` — new `EntityViewTab` entry; `getTabsForAsset` (Skill
  branch) and `getSkillPublicationTabs` both gain the new tab.
- `apps/ai-dial-admin/src/components/Assets/Skills/View/` — `View.tsx` (staged name/description/body
  state, Save/Discard wiring), `Properties.tsx` (unchanged shape, still renders `SkillDetails`), new
  Skill-tab component.
- `apps/ai-dial-admin/src/components/Publications/Properties/SkillProperties.tsx` and
  `apps/ai-dial-admin/src/components/Publications/Assets/Skill/SkillDetails.tsx` — remove metadata
  `LabelledText`s, filter `SKILL.md` from `rowData`, wire the new tab's staged state into the
  publication's existing save flow.
- `apps/ai-dial-admin/src/models/dial/resource.ts` — `DialSkillResource` gains a way to carry parsed
  frontmatter (or the new tab fetches/parses independently — a design decision).
- `apps/ai-dial-admin/src/app/[lang]/assets-skills/actions.ts` and the Publications equivalent —
  reuse existing `uploadSkillFile`-style actions for saving the reassembled `SKILL.md`; a new action for
  reading its raw content.
