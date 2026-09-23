## Why

Follow-up to `fix-export-file-field-zip-extension`: exporting a dataset/test suite whose schema
contains a `FILE`-type field now correctly downloads a `.zip` file (previous fix). However, trying to
import that `.zip` back via "Import from PC storage" still fails — on macOS, the native file picker
grays out (makes unselectable) any file that doesn't match the `accept` attribute of the underlying
`<input type="file">`, and the import UI hardcodes that attribute to CSV only.

Root cause: the shared import modal (`ImportFileModal`,
`apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/ImportFile.tsx`, used by both
Datasets and Test Suites via `Header.tsx` in each entity) passes `acceptTypes="text/csv"` to
`DialLoadFileArea`, which forwards it verbatim to a native `<input type="file" accept="text/csv">`.
The same hardcoded `accept="text/csv"` exists on the secondary "Change file" input in
`SelectedFile.tsx`. Both predate ZIP exports being possible, so neither was ever updated to allow
selecting a `.zip` file. `SelectedFile.tsx` also hardcodes the file-icon extension to `.csv`, which
would show the wrong icon once a `.zip` file becomes selectable.

The codebase already has a shared `APPLICATION_ZIP_TYPES` constant
(`apps/ai-dial-admin/src/constants/request-headers.ts`) used for exactly this purpose elsewhere
(`ImportFileType.tsx`, `ImportConfig/Files/Files.tsx`).

## What Changes

- Both file inputs in the dataset/test-suite test-case import flow (`ImportFile.tsx`'s
  `DialLoadFileArea` and `SelectedFile.tsx`'s "Change" input) accept CSV **and** ZIP files, via a new
  shared `TEST_CASES_IMPORT_ACCEPT_TYPES` constant (`text/csv` + `APPLICATION_ZIP_TYPES`).
- `SelectedFile.tsx`'s file icon now reflects the actual selected file's extension (via the existing
  `getNameExtensionFromFile` util, already used the same way elsewhere) instead of always showing the
  CSV icon.
- No backend or import-processing change — the import server action/route already forwards whatever
  file content it's given to the backend unmodified; only the front-end file-picker gate is fixed.

## Non-goals

- No change to the import preview/commit flow, conflict handling, or the backend import
  endpoints/contracts.
- No change to the Export flow (already fixed by `fix-export-file-field-zip-extension`).
- No new client-side validation of ZIP contents — the backend's existing preview step is the
  validation surface, same as for CSV today.

## Capabilities

### Modified Capabilities

- `dataset-test-cases`: the "Import test cases from CSV" requirement gains the ability to select a
  ZIP file (not just CSV) from the file picker.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/constants.ts` — new shared accept
  types constant.
- `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/ImportFile.tsx` — use the new
  constant for `DialLoadFileArea`'s `acceptTypes`.
- `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/SelectedFile.tsx` — use the new
  constant for the "Change" input's `accept`, and derive the file icon extension from the actual
  selected file.
- New tests: `Import/tests/SelectedFile.spec.tsx`, `Import/tests/ImportFile.spec.tsx`.
- Both `Datasets/TestCases/Header.tsx` and `TestSuites/TestCases/Header.tsx` render this shared modal,
  so the fix applies to both entities without touching either `Header.tsx`.
