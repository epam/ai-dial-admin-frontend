## 1. Shared footer

- [x] 1.1 Add optional `isLastStepInformative` to `Common/StepperModalButtons/StepperModalButtons.tsx`: on the second-to-last step render Finish (`finishButtonLabel`, `onFinishClick`) instead of Next, enabled when all steps before the last are `VALID` and `isLoading` is false; on the last step render only a `PrimaryButton` Close (`ButtonsI18nKey.Close`, calls `onClose`). Default behavior unchanged.
- [x] 1.2 Add `Common/StepperModalButtons/tests/StepperModalButtons.spec.tsx` (the component has no spec today): default footer (first, middle, last step), plus the three `isLastStepInformative` scenarios from `multi-step-modals`.

## 2. Key modals

- [x] 2.1 Refactor `Assets/Platform/Keys/CreateKeyModal.tsx` to one `Popup` with `Steps` (Details, Roles, Key) and `StepperModalButtons` (`isLastStepInformative`, Finish labeled Create). Derive step statuses with `useMemo` from `isDetailsValid` / `isRolesValid`; on the Key step set earlier steps `disabled`. Keep `createKey` called directly, the role loader, validation reset on step change, a fixed body height that fits the roles grid, and `onCloseAndReset` navigation on Close.
- [x] 2.2 Refactor `Assets/Platform/Keys/DuplicatePlatformKeyModal.tsx` the same way (Name, Key; Finish labeled Create).
- [x] 2.3 Refactor `Assets/Platform/Keys/KeyRotateModal.tsx` the same way (Confirm, Key; Finish labeled Rotate).
- [x] 2.4 Add i18n keys for step names that have no existing key (at minimum the Key reveal step) in `src/locales/en.ts` and the matching enum in `src/constants/i18n.ts`, reusing existing keys first. (Done: every step name reuses an existing key, so none were added.)

## 3. Policy and application modals

- [x] 3.1 Refactor `Assets/Platform/PolicySubjects/CreatePolicyModal.tsx` to `Steps` (Details, Subjects) and `StepperModalButtons` with Finish labeled Create. Keep the details form mounted but hidden on Subjects, the heading focus management, `isCreatingRef` double-submit guard, notifications, and navigation.
- [x] 3.2 Refactor `Assets/Entities/Apps/CreateApplication.tsx` to `Steps` (Details, Source) and `StepperModalButtons` with Finish labeled Create. Keep the 540px bound on the Source step content, the loader, and the unique-name check on Next.

## 4. Rule

- [x] 4.1 Add the multi-step rule to `.claude/rules/components.md` §5 (any wizard or multi-step flow uses `Steps` with `getStepStatusLabels` and `StepperModalButtons`; no hand-rolled step swap or bespoke indicator; a trailing informative step uses `isLastStepInformative` with earlier steps `disabled`) and add `TestSuites/Modals/Create/CreateTestSuite.tsx` to §12 exemplars. Edit only the `.claude` file, then run `npm run sync:agent-mirrors` and `npm run validate:agent-docs`.

## 5. Specs and tests

- [x] 5.1 Update `Assets/Platform/Keys/tests/DuplicatePlatformKeyModal.spec.tsx` for the single-popup stepper flow; add `CreateKeyModal.spec.tsx` and `KeyRotateModal.spec.tsx` covering steps shown, Finish label, reveal step Close-only footer, locked earlier steps, and failed-create staying on the previous step.
- [x] 5.2 Update `Assets/Platform/PolicySubjects/tests/CreatePolicyModal.spec.tsx` (policy and assignment variants: Next gating, Create on Subjects, values kept after Back, locked cost object) and `Assets/Entities/Apps/tests/CreateApplication.spec.tsx` (steps shown, Next gating, Create on Source).
- [x] 5.3 Run the existing specs of every other `StepperModalButtons` consumer to confirm no regression (`CreateTestSuite`, `AddMetricModal`, `ContainerCreate`, `ImportModal`, `ImportConfig`, `EditRequestWizard`, `ImportFile`, `PickPublicDataset`).

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full test suite (`npm run test`) and fix any findings.
