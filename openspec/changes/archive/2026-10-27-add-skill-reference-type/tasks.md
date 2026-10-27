## 1. Models, constants, utils

- [x] 1.1 Add `FormDataType.Skill = 'skill'` in `src/models/form-data.ts` and `TestCaseItemType.SKILL = 'SKILL'` in `src/types/evaluation.ts`
- [x] 1.2 Map `skill` → `TestCaseItemType.SKILL` in `src/components/TestSuites/utils/constants.ts` (consumed by `request-template-params.ts`)
- [x] 1.3 Add `toSkillSelectPath` and make `toFileSelectPath` reject `skills/`-prefixed values in `src/utils/files/path.ts`
- [x] 1.4 Add `TestSuitesI18nKey.SelectSkill` in `src/constants/i18n.ts` and the string in `src/locales/en.ts`

## 2. Skill picker

- [x] 2.1 Create `src/components/Common/SkillSelectInput/` (`SkillSelectInput`, skill browser over `useSkillFolder`/`getSkills`, `models.ts`, `constants.ts`): folders browsable but not selectable, emits `skills/<bucket>/<path>`, disabled state, a11y per `.claude/rules/a11y.md`
- [x] 2.2 Add `SkillSelectCellRenderer` in `src/components/Grid/CellRenderers/` mirroring `FileSelectCellRenderer`

## 3. Wiring

- [x] 3.1 `getFormDataColumns` in `src/constants/grid-columns/grid-columns.tsx`: add the Skill Type item and the skill Value renderer branch
- [x] 3.2 SKILL branches in `src/components/TestSuites/utils/columns.tsx` (input-binding and template-variable cells), `TestSuites/Common/DynamicConfiguration/VariableRow.tsx`, and `src/components/Grid/columns/turn-columns.tsx` (`getGroupedSchemaColumn`, shared with Datasets)

## 4. Tests

- [x] 4.1 Unit tests: `toSkillSelectPath`, tightened `toFileSelectPath`, `|type` hint mapping in `request-template-params.spec.ts`
- [x] 4.2 Component tests: `SkillSelectInput` (folder not selectable, skill selectable, value format, stale value, disabled), `SkillSelectCellRenderer`
- [x] 4.3 Update existing specs and cover the wiring: `columns.spec.ts` (type options list now includes SKILL), `turn-columns.spec.tsx`, `VariableRow.spec.tsx` (new), `form-data-columns.spec.tsx` (new: Type items and Value editor per part type), `columns-reference-types.spec.tsx` (new: SKILL/FILE value editors in the input-binding and template-variable cells), `SkillManager.spec.tsx` (new: only skill rows selectable, folder/hierarchy loading)

## 5. Browser verification

- [x] 5.1 ~~Run the `spec-browser-verify` skill for this change's scenarios against the local app (requires the local stack running with auth disabled) and resolve any `fail` verdicts~~ — skipped: the gate runs were blocked by the sign-in wall and then a 403, so it produced no pass/fail verdicts; the change was verified manually in the browser by the author instead

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix all failures — lint, format and both typechecks pass locally; the full test suite was run on another machine by the author and passed
