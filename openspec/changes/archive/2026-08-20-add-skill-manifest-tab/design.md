## Context

Both `assets-skills` and `skill-publications` deliberately left a skill's own parsed metadata out of
scope, because nothing in the app parsed `SKILL.md`'s YAML frontmatter back into a usable shape — see
`resource.ts`'s `DialSkillResource` doc comment and `getSkillMetadata`'s doc comment in
`skills-core-api.ts`. Confirmed against the actual `ai-dial-core` implementation (not just the
`skills.md` proposal doc): `SKILL.md` supports single-file `GET` (raw bytes/text, `ETag` header carries
the aggregate etag) and single-file `PUT` (multipart, re-validates frontmatter, 400s on invalid
frontmatter without mutating the skill); only single-file `DELETE` of `SKILL.md` is blocked
(`SkillHandler.validateFileMutation`). `version` in frontmatter is optional server-side — only `name`
and `description` are required.

`gray-matter` is already a dependency (used once today, in `MdViewer`, only to discard frontmatter and
keep the body). `MdEditor` (wraps `@uiw/react-md-editor`) is already used by Prompts' Properties tab for
editable markdown content, with a `readOnly` prop that switches between `'live'` (edit) and `'preview'`
modes.

Both surfaces already stage other kinds of skill edits locally (file add/remove, folder move on Assets;
file add/remove on Publications) and commit them on an explicit Save, discarding without a Core round
trip. This change's Description/body edits follow the same shape rather than introducing a second save
mechanism.

## Goals / Non-Goals

**Goals:**
- Parse `SKILL.md`'s frontmatter into `{ name, description }` plus its body, and surface all three in a
  new `Skill` tab on both the Assets skill view and the Skill Publications properties view.
- Let a user edit `Description` and the body, staged locally, committed on the existing Save action as a
  single reassembled `SKILL.md` write.
- Remove `SKILL.md` from both surfaces' file-listing grids and remove the now-redundant metadata
  `LabelledText`s from the shared `SkillDetails` component.

**Non-Goals:**
- Editing or displaying `version`.
- Renaming a skill (the `Name` input stays disabled; identity is the path).
- Changing the create-skill modal.
- A generic "any folder-resource type gets a manifest tab" abstraction — this is Skill-specific, matching
  how `SkillHeader`/`SkillView` already diverge from the generic `AssetHeader` pattern (documented in
  `View.tsx`'s own doc comment) because Skill has no version concept and no JSON editor.

## Decisions

### Where parsing happens: a new shared util, not a new model field

Add `apps/ai-dial-admin/src/utils/skill-manifest.ts` (or similar) with two pure functions:
`parseSkillManifest(content: string): { name: string; description: string; body: string }` and
`buildSkillManifest({ name, description, body }): string`. Built on `gray-matter`'s `matter()` (parse,
returning `.data` + `.content`) and `matter.stringify()` (reassemble) rather than hand-rolling YAML —
reuses the same library already vetted for this content shape, and guarantees the reassembled document
matches the delimiter/YAML format Core's `SkillHandler.parseFrontmatter` regex expects.

This stays a pure util, not a `DialSkillResource` field, because the parsed manifest is fetched
independently (a dedicated content read, not part of the folder-listing or files-listing responses that
populate `DialSkillResource` today) and only the Skill tab needs it. Adding it to the shared model would
force every consumer of `DialSkillResource` (the list, the folder tree) to either fetch content they
don't need or tolerate an undefined field — the existing doc comments on `resource.ts` already treat
`name`/`description`/`version` as deliberately absent from that model for this reason.

**Alternative considered**: populate `DialSkillResource.description`/`name` from the parsed manifest and
have the Properties/Skill tabs both read off the same object. Rejected — it would require the
folder-tree list view (which never fetches file content) to special-case a field it can't populate,
recreating exactly the ambiguity the current doc comments call out.

### Fetching content: new Skill Core API method, new server action

Add `SkillsCoreApi.getSkillManifestContent(bucket, path)` calling
`GET /v2/skills/{bucket}/{path}/files/SKILL.md`, returning raw text (matches the confirmed Core
response shape — not JSON). Add a corresponding server action (`getSkillManifest` in
`assets-skills/actions.ts`, and the Publications equivalent) that the View component calls once on
mount for the Skill tab's initial content, mirroring how other tabs lazy-fetch on first render rather
than eagerly on the page server component (the Skill tab isn't the default active tab, so there's no
reason to fetch it up front).

### Staging model: extend the existing staged-state shape, not a parallel one

`SkillView` (Assets) already holds staged folder-move / added-files / removed-files state, committed on
Save. This change adds two more staged fields to that same state — staged `description` and staged
`body` (both initialized from the parsed manifest on fetch, `undefined` until the tab is opened) — and
extends the existing "has staged changes → show Save/Discard" predicate to also check these two fields
against their last-fetched values. On Save, if either is dirty, the reassembled `SKILL.md` document is
written via the existing single-file upload action (the same one `uploadSkillFile` already uses),
alongside whatever other staged file/folder changes are being applied — one more upload call in the
same Promise.all-style batch, not a separate save flow. Discard resets both fields to the last-fetched
manifest values.

The Publications side (`SkillProperties`) follows the same shape: its own staged-files state gains
staged `description`/`body`, committed by the same "save the publication" action that already uploads
staged file changes.

**Alternative considered**: auto-save the Skill tab's fields independently of the rest of the entity
(immediate PUT on blur/debounce). Rejected — the user was asked and picked staged/batched to match the
existing pattern; an independent auto-save path would also create a second failure mode (a body edit
succeeds but a concurrent file removal fails, or vice versa) that the single reassembled write avoids
for the manifest's own two fields at least.

### Rendering the tab: reuse MdEditor, not a new editor component

The Skill tab's body field uses the existing `MdEditor` (already proven for Prompts), not `MdViewer`
(read-only) or a new component — `readOnly={false}` always, since both Assets and Publications sides are
editable per the confirmed decision. `Name` uses a plain disabled `DialInput` (matching
`SkillCreateProperties`'s `DialInput` for the same field, just disabled); `Description` uses the
existing `DescriptionControl` already used by `SkillCreateProperties`, wired to the staged state instead
of the create-modal's local state.

### Filtering SKILL.md from the files grid and removing metadata LabelledTexts

`SkillDetails.tsx`'s `rowData` (currently `skill.files` + staged `addedFiles`) filters out any row whose
name equals `SKILL_MANIFEST_FILE` before rendering — a one-line filter, not a renderer-level hide, so
`isRemoveActionHidden`'s `SKILL_MANIFEST_FILE` special case becomes dead code to delete. The `name`
(unconditional) and `description`/`version` (conditional) `LabelledText`s are removed outright; nothing
replaces them in `SkillDetails` since the Skill tab now owns that display.

## Risks / Trade-offs

- **Extra Core round trip per skill view.** Opening the Skill tab issues a dedicated content fetch that
  didn't exist before (skill reads today cost exactly two requests — parent-folder listing + files
  listing — per the `skill-resources-core-api` spec). Mitigated by fetching lazily on first tab
  activation rather than eagerly with the rest of the page.
- **Two staged-state shapes (Assets' `SkillView`, Publications' `SkillProperties`) both need the same
  new fields added independently**, since they don't share a save/staging hook today. Mitigated by
  keeping the shared pieces (the parse/build util, the fetch action, the tab's UI component) common,
  so the duplication is limited to each surface's own staging wiring — consistent with how file
  staging is already duplicated between the two today.
- **Reassembling `SKILL.md` could round-trip an existing `version` field imperfectly** if
  `matter.stringify` reorders or reformats untouched frontmatter keys. Mitigated by relying on
  `gray-matter`'s own round-trip guarantees (parse → `.data` → stringify preserves all keys, including
  ones the UI never touches) rather than hand-building the YAML block; worth a unit test asserting an
  untouched `version` key survives a save.
- **A save that fails Core's frontmatter validation** (unlikely given the UI already requires
  non-empty `description`, but possible via a body edit that accidentally breaks frontmatter delimiters
  if body content itself contains `---` at the very start — edge case) must not silently discard the
  edit. Mitigated by keeping the staged state intact on a failed save, matching how other staged-save
  failures already behave elsewhere in the app.

## Open Questions

- Should the Skill tab's fetch reuse the existing `preview`/`download` API routes
  (`app/api/skills/{preview,download}/route.ts`), or does it need its own server action? Worth checking
  during implementation whether those routes already return raw text for arbitrary files (including
  `SKILL.md`) in a way the tab can reuse directly, versus needing a purpose-built action.
