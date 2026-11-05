## 1. Response validation and Save gating

- [x] 1.1 In `apps/ai-dial-admin/src/utils/app-runners/validation.ts`, add response-only validation for all Core-shaped routes and reuse it in `validateAppRunner`, matching the form rules and safely handling malformed JSON.
- [x] 1.2 In `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/View.tsx`, register response validity derived from the staged runner in `SaveValidationContext`, restore it after resets, and remove it on unmount, preserving existing JSON and save-notification behavior.

- [x] 1.3 In `apps/ai-dial-admin/src/components/Routes/View/Properties/RouteProperties.tsx`, derive upstream-required state from the active route so route switching clears hidden endpoint errors.

## 2. Regression tests

- [x] 2.1 Extend `apps/ai-dial-admin/src/utils/app-runners/tests/validation.spec.ts` for missing, empty, malformed, invalid, and valid response values; boundary statuses; upstream-only routes; and multiple routes.
- [x] 2.2 Add a real-header Platform App Runner view test covering Response selection, both fields, route and tab changes, invalid-route removal, discard, and preservation of unrelated edits.
- [x] 2.3 Extend `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/tests/View.spec.tsx` or a suitable integration spec to verify invalid JSON response saves are rejected with a notification and no update action, while corrected valid data saves.

The user declined an automated browser-verification task.

## 3. Quality checks

- [x] 3.1 Run targeted tests, lint, formatting, both typechecks, and the full test suite with coverage; report any failures or unavailable checks.

Targeted tests, changed-file lint and formatting, and both typechecks passed. Full lint and the coverage suite were started and remain pending at the time of archiving; the repository-wide format check was not run. This task is marked complete at the user's request.
