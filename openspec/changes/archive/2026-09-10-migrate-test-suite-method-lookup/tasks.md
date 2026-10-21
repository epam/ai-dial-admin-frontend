## 1. Method picker lookup

- [x] 1.1 Update `apps/ai-dial-admin/src/components/TestSuites/Methods/Methods.tsx` to load the selected target with `getDeploymentById(deploymentId)` and verify the component no longer calls the typed lookup.

## 2. Unit tests

- [x] 2.1 Update `apps/ai-dial-admin/src/components/TestSuites/Methods/tests/Methods.spec.tsx` to mock `getDeploymentById`, assert the selected ID is forwarded once, and verify returned routes and interfaces still populate method groups; preserve the file's existing uncommitted Responses API edits and run the focused Vitest file from `apps/ai-dial-admin/`.

## 3. Quality checks

- [x] 3.1 Validate the OpenSpec change, then run formatting checks, lint, app typecheck, and the full test suite; resolve failures attributable to this change. Browser verification is omitted per the user's decision because visible picker behavior is intentionally unchanged and covered by component tests.
