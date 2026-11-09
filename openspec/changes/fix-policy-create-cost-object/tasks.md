## 1. Create flow

- [x] 1.1 Add a dedicated policy/assignment creation modal and wire it in `apps/ai-dial-admin/src/components/Assets/BaseAssetList/Modals.tsx`, offering Details → Subjects and preserving both steps' state on Back. Leave the generic `CreateEntity` and other routes unchanged.
- [x] 1.2 Update `apps/ai-dial-admin/src/components/Assets/Platform/Policies/CreateProperties.tsx` and `apps/ai-dial-admin/src/components/Assets/Platform/PolicyAssignments/CreateProperties.tsx` to keep Details validation separate from subject validation; reuse `PolicySubjects/SubjectRulesEditor.tsx` and `src/utils/policies/subjects.ts` for the optional Subjects step. Ensure valid Details gates Next and valid Details plus rule shapes gate Create even after step changes.
- [x] 1.3 In the dedicated modal, derive a policy body `costObject` from the final folder only when a nonempty subject list and a cost-object folder are both present; omit it otherwise. Preserve assignment payloads, policy updates and duplicates, and error/success handling.
- [x] 1.4 Update `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` for step labels and hints, reusing existing keys where appropriate.

## 2. Automated tests

- [x] 2.1 Update or add component tests alongside the dedicated create modal, policy and assignment create properties, and `apps/ai-dial-admin/src/components/Assets/BaseAssetList/tests/policy-assignment-create.spec.tsx`: cover Details validity, navigation and preserved edits, optional and invalid rules including TRUE/FALSE, unchanged Core error notifications and success navigation, and a non-policy route regression.
- [x] 2.2 Cover policy-create request bodies for subjects with and without a folder and a folder without subjects; cover assignment body preservation and empty-subject omission, plus policy update and duplicate regressions. Use the existing action and payload tests under `src/app/[lang]/platform-policies/`, `src/app/[lang]/platform-policy-assignments/`, and `src/utils/policies/tests/` as appropriate.

## 3. Quality checks

- [x] 3.1 Run lint, format check, both `npm run typecheck` and `npm run typecheck:specs`, and the full `npm run test` suite; resolve failures or report blockers.
