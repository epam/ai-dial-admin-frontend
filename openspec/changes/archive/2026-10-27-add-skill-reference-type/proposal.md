## Why

Evaluation can reference **files** in request-template multipart parts and in test-case schema columns, but
not **skills**, which DIAL Core now stores as first-class resources (`skills/<bucket>/<path>`). Users who
evaluate skill-aware models have to paste storage references by hand. Issue #5082 (backend counterpart:
ai-dial-admin-evaluation-framework-backend#268) asks for skills to be a reference type wherever files already are.

## What Changes

- Add `skill` as a request-template form-data part type next to `text` and `file`.
- Add `SKILL` as a test-case schema column type next to `FILE`; the template `|type` hint accepts `skill`.
- Add a **skill picker** (`SkillSelectInput`) that browses the Skills folder tree and selects a skill; grouping
  folders are browsable but not selectable. The value is the canonical skill reference `skills/<bucket>/<path>` —
  never `SKILL.md`, a file inside the bundle, or a folder.
- Render the picker in every place the file picker is rendered for FILE values: the form-data grid Value cell,
  the test-suite input-binding and template-variable cells, the dynamic-configuration `VariableRow`, and the
  test-case grid columns (shared with Datasets).
- A stale value of the other kind is never shown in the wrong picker (`skills/...` is not rendered as a file path
  and vice versa), so switching a type clears the reference as FILE does today.
- Add `TestSuitesI18nKey.SelectSkill` for the popup header.

## Capabilities

### New Capabilities
- `skill-select-input`: the reusable skill picker — browse, folder non-selectable, value format, states, a11y.
- `request-template-form-data-parts`: the form-data grid's part types, including `skill`, and type-switch behavior.
  (No existing spec owns the form-data grid; `test-suite-jsonata-request-body` only covers when it is shown.)

### Modified Capabilities
- `testcase-schema-manager`: schema field type `SKILL` and its value editing.
- `dataset-test-cases`: test-case grid renders and edits SKILL columns; persistence of skill references.

## Non-goals

- No creating or editing skills from the evaluation UI.
- No selecting individual files inside a skill bundle.
- No changes to DIAL Core skill storage, access control, or request processing.
- No redesign of the existing file-reference experience, and no generalization of `FileSelectInput`.
- No entity-scoped ("Application"-tab-style) skills — the picker offers the Skills tree only.
- No client-side serialization of skill references: the value passes through to the evaluation backend as-is.

## Impact

- Code (`apps/ai-dial-admin/src/`): `models/form-data.ts`, `types/evaluation.ts`,
  `constants/grid-columns/grid-columns.tsx`, `components/TestSuites/utils/{columns.tsx,constants.ts}`,
  `components/TestSuites/Common/DynamicConfiguration/VariableRow.tsx`, `components/Grid/columns/turn-columns.tsx`,
  `components/Grid/CellRenderers/`, new `components/Common/SkillSelectInput/`, `utils/files/path.ts`,
  `constants/i18n.ts`, `locales/en.ts`.
- **Shared code**: `getGroupedSchemaColumn` (`turn-columns.tsx`) also serves Datasets, so Datasets gain SKILL
  columns. `FileSelectCellRenderer`'s stale-value guard must keep rejecting `skills/...` values.
- Backend: the evaluation backend must accept `skill` / `SKILL` verbatim (tracked in backend#268). No new
  server actions — the picker reuses `getSkills` and `SkillFolderProvider`.
- Overlap: active change `add-application-file-export` edits `ApplicationFileManager`; this change does not
  touch `FileSelectInput`, so there is no conflict.
