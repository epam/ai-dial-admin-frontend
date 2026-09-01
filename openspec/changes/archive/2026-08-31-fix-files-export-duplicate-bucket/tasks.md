<!-- No spec-browser-verify task: both modified scenarios describe server-side archive entry paths,
     not UI state. Coverage is provided by the unit tests below. -->

## 1. Fix export archive path

- [x] 1.1 In `apps/ai-dial-admin/src/server/files/export.ts`, remove the hardcoded `public/` prefix
  from both branches of `toExportArchivePath`: the single-file branch (`exportFolderPath === null`)
  returns `getFolderNameAndPath(storagePath).name`; the folder branch returns
  `${lastSegment}/${relativePath}`. Update the JSDoc comment to reflect the new contract.

## 2. Update tests

- [x] 2.1 In `apps/ai-dial-admin/src/server/files/tests/export.spec.ts`, update the four
  `toExportArchivePath` assertions to remove the `public/` prefix from expected values.
- [x] 2.2 In the same file, update the `buildFilesExportZip` test's expected `filePaths` array to
  remove the `public/` prefix from each entry (e.g. `files/folder/a.txt` instead of
  `files/public/folder/a.txt`).

## 3. Update spec

- [x] 3.1 In `openspec/specs/files-core-api/spec.md`, apply the delta: replace the
  "Archive path differs for single-file vs. folder selection" requirement prose and its two scenarios
  with the corrected versions from the delta spec (no `public/` prefix, bucket-agnostic language).

## 4. Quality gate

- [x] 4.1 Run `npx vitest run src/server/files/tests/export.spec.ts` from `apps/ai-dial-admin/`
  and confirm all tests pass.
- [x] 4.2 Run `npm run lint` and `npm run format` from the repo root and confirm no new errors.
