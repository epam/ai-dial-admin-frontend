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

1. **New `SkillSelectInput` instead of generalizing `FileSelectInput`.** It reuses the `InputPopup` + `Popup`
   shell and the ITEM-only selection rule, but wraps `SkillFolderProvider`/`useSkillFolder` and has no
   Public/Application tabs. *Alternative:* inject folder hook + route into `PublicFileManager`. Rejected: it
   threads Files-specific props through a component that `add-application-file-export` is editing, and skills
   have no Application scope, so the tab logic would be dead branches.
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
- [Duplicated popup shell] → accepted small duplication over coupling to the Files picker (Decision 1).
