## Context

Eval references files with `FileSelectInput` (value `files/...` / `public/...`), rendered by
`FileSelectCellRenderer` in grids and directly in `VariableRow`. Skills live in Core as `skills/<bucket>/<path>`
and are already browsable through `SkillFolderProvider` / `getSkills`; in a listing a skill is an `ITEM` and a
grouping folder a `FOLDER`. `FileSelectInput` is hard-wired to `FileFolderProvider` and the Files tree
(`PublicFileManager`, `ApplicationRoute.Files`), and `toFileSelectPath` accepts any string containing `/`.
No server code serializes `FormDataType` / `TestCaseItemType`; values pass through to the backend.

## Goals / Non-Goals

**Goals:** a skill reference type in request-template parts and schema columns, picked from the Skills tree,
stored as `skills/<bucket>/<path>`, never mistaken for a file reference.

**Non-Goals:** see proposal (no skill editing, no bundle-file selection, no Core changes, no file-picker redesign,
no entity-scoped skills).

## Decisions

1. **Generic `EntitySelectInput` / `EntitySelectManager` keyed by `EntitySelectType` (`Skill` | `File`), instead of a
   standalone `SkillSelectInput`.** *Revised during review; the first draft proposed a separate `SkillSelectInput`.*
   The `InputPopup` + `Popup` shell (`SelectInputPopup`) and the folder-tree browser are shared; the per-type
   differences (prefix, route, header key, grid columns, folder provider/hook) live in `ENTITY_SELECT_CONFIGS`.
   The existing file-tree manager was renamed and parameterised rather than a second component being injected
   alongside it, and the file picker's Public tab renders it with the `File` type. *Alternatives:* (a) a new
   `SkillSelectInput` duplicating the popup shell and tree browser, rejected as two copies to keep in sync;
   (b) injecting folder hook + route into `PublicFileManager`, rejected because it threads Files-specific props
   through a component that `add-application-file-export` is editing. Skills have no Application scope, so the
   Application tab and tab logic stay in `FileSelectInput`.
2. **Value is the bare skill resource path.** The picker emits the `ITEM` path as listed (`skills/<bucket>/<path>`);
   folders cannot be selected, and the picker never descends into `getSkillFiles`, so `SKILL.md` or bundle files
   cannot be produced. `toSkillSelectPath` (in `utils/files/path.ts`, next to `toFileSelectPath`) accepts only
   strings starting with `skills/`.
3. **Mutual stale-value guards.** `toFileSelectPath` is tightened to reject `skills/`-prefixed values so a skill
   reference never reaches the file picker (today it would be misread as an application file). Combined with
   `toSkillSelectPath`, a type switch needs no explicit clearing in schema editors; `FormDataGrid` already
   clears the value on any type change.
4. **`SkillSelectCellRenderer`** mirrors `FileSelectCellRenderer`; the four FILE branches
   (`getFormDataColumns`, `columns.tsx` input-binding and template-variable cells, `turn-columns.tsx`) and
   `VariableRow` gain a SKILL branch, extracting a small shared "picker for type" selector only if the branch
   would otherwise be copied a third time.
5. **Datasets inherit SKILL** through `getGroupedSchemaColumn` (decided with the requester).
6. **Labels stay enum-derived** (Type options come from `Object.values(TestCaseItemType)`); only the popup header
   needs a new key, `TestSuitesI18nKey.SelectSkill`.

## Risks / Trade-offs

- [Backend rejects `skill`/`SKILL`] → coordinate with evaluation-framework-backend#268; the UI change is inert
  until users pick the new type.
- [`getSkills` returns `ResourceInfo[]` whereas the file tree expects another shape] → map it inside the skill
  browser; cover with a component test.
- [Tightening `toFileSelectPath` changes an existing util] → add a regression spec; no valid file path starts with `skills/`.
- [Shared shell couples the two pickers] → accepted: per-type differences are isolated in `ENTITY_SELECT_CONFIGS` (Decision 1).
