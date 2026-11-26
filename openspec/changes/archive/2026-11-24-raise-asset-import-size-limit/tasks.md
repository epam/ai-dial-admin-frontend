# Tasks

## 1. Asset import limits and copy

- [x] 1.1 Update `src/utils/import/get-import-size-limits.ts` and `src/constants/file.ts` so only Prompts, Assets Applications and Assets Toolsets use 64 MiB per file and total; add and run `src/utils/import/tests/get-import-size-limits.spec.ts` cases for those routes, Files and the existing fallback.
- [x] 1.2 Update `src/constants/import.tsx` and `src/locales/en.ts` so affected radio descriptions show 64 MB for archive, per-file and total limits, with the existing 30-file count; update and run `src/constants/tests/import.spec.ts` to check the descriptions and unaffected routes.
- [x] 1.3 Update `src/components/EntityListView/Import/ImportModal.tsx` and `ImportFileType.tsx` to apply size and count validation, including clear errors, to picker, drop, Add and preselected files without silently truncating; add and run component tests for exactly 64 MiB, one byte over, multi-file totals, 30 versus 31 files, and the unchanged Files route.

## 2. Request transport and import safety

- [x] 2.1 Bound prepared JSON to 64 MiB on the client and show a clear error before submission; preserve edits and test exactly at and over the limit, including a source selection that expands during preparation.
- [x] 2.2 Set a finite Next.js action request budget above 64 MiB for bounded config, filenames and framing; verify its configured allowance with a Node assertion and test prompt multipart limits with `src/server/assets/tests/read-import-form-data.spec.ts`. Real application HTTP boundary tests were declined after the local app could not load without Core.
- [x] 2.3 Bound archive and prepared JSON payloads to 64 MiB and config before reading in `src/server/assets/import-export-action.ts`, and protect `src/app/api/prompts/import/route.ts`; extend and run tests for allowed boundaries, oversized payload rejection, and importer invocation.
- [x] 2.4 Add and run regression tests for the existing import preview, edits, toolset secrets, notifications and ZIP safety checks, including `src/components/EntityListView/Import/tests/ImportModal.spec.tsx` and `src/server/zip/tests/zip-safety.spec.ts`; confirm no other import route limits change.

## 3. Final quality checks

- [x] 3.1 Run `npm run lint`, `npm run lint:specs`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; resolve failures or report any environment blocker and its output.

Browser verification was offered and declined by the user; no browser-verification task is included.
