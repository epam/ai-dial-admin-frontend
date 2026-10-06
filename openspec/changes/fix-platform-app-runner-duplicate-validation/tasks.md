## 1. Shared inline validation support

- [x] 1.1 Extend `apps/ai-dial-admin/src/components/BaseControls/Id/Id.tsx` with an optional external validation error that renders beneath the input and updates its configured `SaveValidationContext` field without affecting existing callers.

## 2. Platform App Runner duplication

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx` so only the `PlatformAppRunners` branch initializes and renders the required Core storage Name field as `<source-name>-copy`, validates it against the existing `names` collection, and submits it with the cloned asset.
- [x] 2.2 Add submit-time declared-ID collision handling to the Platform App Runner branch using `getResolvedRunnerSchema`; show the inline existing-ID error, block the Core create callback when a schema resolves, and clear the error when ID changes.

## 3. Automated test coverage

- [x] 3.1 Update `apps/ai-dial-admin/src/components/BaseControls/Id/tests/Id.spec.tsx` and centralized test mocks in `apps/ai-dial-admin/test-setup.tsx` as needed to cover external inline-error rendering and recovery.
- [x] 3.2 Update `apps/ai-dial-admin/src/components/Assets/Modals/tests/DuplicatePlatformAsset.spec.tsx` to cover the copied storage name, inline duplicate-name validation, resolved-ID collision, error recovery after an ID change, successful payload, and unchanged non-runner forms.

Browser verification task omitted: the user explicitly declined the dedicated automated `spec-browser-verify` task.

## 4. Quality checks

- [x] 4.1 Run the targeted Vitest specs, `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the appropriate full test gate; resolve failures attributable to this change.
