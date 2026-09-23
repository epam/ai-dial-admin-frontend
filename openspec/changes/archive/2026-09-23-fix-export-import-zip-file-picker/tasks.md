## 1. Shared accept-types constant

- [x] 1.1 Add `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/constants.ts` exporting
      `TEST_CASES_IMPORT_ACCEPT_TYPES`, combining `'text/csv'` with `APPLICATION_ZIP_TYPES`
      (`apps/ai-dial-admin/src/constants/request-headers.ts`).

## 2. Fix the file pickers

- [x] 2.1 In `ImportFile.tsx`, pass `TEST_CASES_IMPORT_ACCEPT_TYPES` as `DialLoadFileArea`'s
      `acceptTypes` instead of the hardcoded `"text/csv"`.
- [x] 2.2 In `SelectedFile.tsx`, pass `TEST_CASES_IMPORT_ACCEPT_TYPES` as the "Change" `<input>`'s
      `accept` instead of the hardcoded `"text/csv"`.
- [x] 2.3 In `SelectedFile.tsx`, derive the `DialFileIcon`'s `extension` from the actual selected
      file's name via `getNameExtensionFromFile` (falling back to `.csv` when a file has no
      extension), instead of the hardcoded `.csv`.

## 3. Regression tests

- [x] 3.1 New `Import/tests/SelectedFile.spec.tsx`: renders the selected file name; the "Change"
      input's `accept` contains both `text/csv` and every `APPLICATION_ZIP_TYPES` entry; the file
      icon shows the CSV icon for a `.csv` file and the ZIP icon (not the CSV icon) for a `.zip` file.
- [x] 3.2 New `Import/tests/ImportFile.spec.tsx`: the initial file-picker input's `accept` contains
      both `text/csv` and every `APPLICATION_ZIP_TYPES` entry.

## 4. Spec update

- [x] 4.1 Update the "Import test cases from CSV" requirement in
      `openspec/specs/dataset-test-cases/spec.md` to describe ZIP-file selectability.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and
      `npm run test` from `apps/ai-dial-admin/` and fix any failures. Lint (0 errors, pre-existing
      `no-explicit-any`/`jsx-a11y` warnings only, unchanged from before this fix), format, and both
      typecheck gates pass clean. Full suite: 12857 passed, 1 pre-existing failure unrelated to this
      change (`MethodTabContent.spec.tsx > renders TryOutButton only for the first request`, a stale
      test contradicting the already-merged "show try out button for every selected request" commit
      on this branch — reproduces identically with this change's edits stashed out).

## Note on browser verification

No dedicated browser-verification task is included: the observable behavior is a native OS file-picker
dialog's file-selectability, which is outside what Playwright/the `spec-verification-gate` agent can
drive or assert (browsers do not expose the OS file-picker's enabled/disabled file list to automation).
This is covered by the unit tests in section 3, which assert the actual `accept` attribute values the
fix produces — the attribute the OS file picker reads to decide selectability.
