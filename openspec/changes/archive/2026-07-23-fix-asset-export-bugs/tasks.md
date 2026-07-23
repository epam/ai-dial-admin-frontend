Note: no browser-verification task is included — every scenario in this change's specs describes
exported document/archive contents (marker exclusion, entity counts), not UI element state,
navigation, or on-screen text. Coverage lives entirely in the unit tests below.

## 1. Shared marker-exclusion predicate

- [x] 1.1 Move `isTechnicalItem` (and the `.dial_folder` marker constant) from
  `apps/ai-dial-admin/src/server/files/export.ts` into
  `apps/ai-dial-admin/src/server/folders/resource-walk.ts`, alongside `isFolderNode`/`isItemNode`
- [x] 1.2 Re-export `isTechnicalItem` from `files/export.ts` if any other module imports it from there
  today, so no existing import path breaks (verified: no other module imports it — `files/export.ts`
  still re-exports it regardless, since it's part of that module's existing public surface)
- [x] 1.3 Update `apps/ai-dial-admin/src/server/folders/tests/resource-walk.spec.ts` to cover
  `isTechnicalItem` (bare marker, versioned marker, non-marker path) — move the existing assertions
  from `files/export.spec.ts` rather than duplicating them

## 2. Applications/Toolsets/Prompts: exclude `.dial_folder` from export

- [x] 2.1 In `apps/ai-dial-admin/src/server/assets/exim.ts`, filter `expandFolderPath`'s resolved leaf
  paths through the shared `isTechnicalItem` predicate before they reach `buildAssetsExport`'s entity
  loop
- [x] 2.2 Add regression tests in `apps/ai-dial-admin/src/server/assets/tests/exim.spec.ts`: exporting a
  folder whose descendants include a `.dial_folder` (and a `.dial_folder__<version>`) marker excludes
  it from the resulting `ParsedAssets` document, while sibling entities are still included
- [x] 2.3 Confirm (no code change expected) that `applications/tests/exim.spec.ts`,
  `toolsets/tests/exim.spec.ts`, and `prompts/tests/exim.spec.ts` still pass unchanged, since they
  delegate to the shared `assets/exim.ts` implementation

## 3. Files: detect folder selections by resource type, not path shape

- [x] 3.1 In `apps/ai-dial-admin/src/server/files/export.ts`, replace the path-suffix
  `isFolderPath(path) = path.endsWith('/')` check with a check against the metadata node's own
  `nodeType` returned by `filesCoreApi.getFileMetadata(token, path, false)`
- [x] 3.2 Restructure `resolveExportEntries` so it fetches metadata for each selected path once, branches
  on that node's `nodeType` (`folder` → expand `items` as before, filtering through `isTechnicalItem`;
  `item` → treat the path itself as a single entry) instead of the current two-step
  `isFolderPath`/`listFolderChildren` split
- [x] 3.3 Update `apps/ai-dial-admin/src/server/files/tests/export.spec.ts`: adjust
  `resolveExportEntries`/`buildFilesExportZip` tests to mock `getFileMetadata` returning a node with
  `nodeType: 'folder'` or `nodeType: 'item'` at the top level (instead of relying on a trailing-`/`
  path string) for both the folder and single-file cases, and add a case where a folder's path does
  **not** end in `/` to prove it's still recognized as a folder
- [x] 3.4 **Correction found via live testing**: the nodeType fix alone still produced an empty
  archive. Root cause was a second, independent bug in the same function — child items read via
  `item.path`, a field Core's raw metadata response never sends (it sends `url`; `path` is a field
  added later by `files/actions.ts`'s `toFileList` for the UI, not present on the raw
  `getFileMetadata` response `resolveExportEntries` consumes directly). Fixed by deriving each
  child's storage path from `item.url` via the existing `getPathFromUrl` helper (already used by
  `toFileList` for the same purpose). Added a regression test reproducing the exact reported shape
  (a folder containing one file and one nested subfolder) and removed a debug `console.log` left
  in `buildFilesExportZip` during live verification.

## 4. Files: expand folder export recursively at any depth

- [x] 4.1 **Scope addition found via live testing**: a folder containing a nested subfolder with files
  had those nested files silently excluded (the prior one-level-deep limit, previously a deliberate
  non-goal). In `apps/ai-dial-admin/src/server/files/export.ts`, replace the direct `node.items` read
  with the shared `gatherResourceUrls` walker (already used by `assets/exim.ts#expandFolderPath`):
  call `filesCoreApi.getFileMetadata(token, path, true, nextToken)` (recursive) and let
  `gatherResourceUrls` paginate/flatten every descendant `ITEM` url at any depth; keep the existing
  `getPathFromUrl`/`isTechnicalItem` filtering applied to each returned url
- [x] 4.2 Update `apps/ai-dial-admin/src/server/files/tests/export.spec.ts`: adjust the folder-expansion
  tests to mock a recursive `gatherResourceUrls`-style read, and add a regression test for a folder
  with a nested subfolder (and one with multiple nesting levels) proving every descendant file is
  included in the resolved entries

## 5. Fix: streamed downloads hang on a non-Latin1 filename

- [x] 5.1 **Bug found via live testing, blocking #4001 end-to-end**: after the recursive-expansion fix
  (task group 4) reached a nested file whose name contains a non-Latin1 character (e.g. `™`,
  U+2122), the export hung. Root cause: `apps/ai-dial-admin/src/utils/api/create-stream-request.ts`'s
  `streamRequest` set `Content-Disposition: attachment; filename=<raw name>` — the Fetch `Headers` API
  requires ByteString-safe (Latin1-only) values, so `headers.append(...)` threw
  `"Cannot convert argument to a ByteString..."`. That throw landed in `streamRequest`'s own
  `catch`, which does `return new Promise(() => null)` — a promise that never resolves — so every
  caller `await`ing `downloadFile`/`streamRequest` (including `buildFilesExportZip`) hung forever
  the moment such a filename was reached. This bug predates this change and affects every caller of
  the shared `streamRequest` (previews/downloads across files, test-suites, datasets, assets) — not
  Files export specifically — but recursive folder expansion is what first made it reachable for a
  reported scenario.
- [x] 5.2 Add `buildFilenameDisposition(fileName)` to `create-stream-request.ts`: build
  `filename="<ascii-fallback>"; filename*=UTF-8''<percent-encoded>` (RFC 6266/5987) instead of a raw
  `filename=<name>`, so the header value is always ByteString-safe regardless of the actual filename
- [x] 5.3 Update `apps/ai-dial-admin/src/utils/api/tests/create-stream-request.spec.ts` for the new
  header format, and add a regression test for a filename containing a non-Latin1 character (e.g.
  `Brand™.txt`) proving `streamRequest` no longer throws/hangs for it (10/10 tests pass)

## 6. Quality gate

- [x] 6.1 Run `npx vitest run src/server/folders/tests/resource-walk.spec.ts
  src/server/assets/tests/exim.spec.ts src/server/files/tests/export.spec.ts` from
  `apps/ai-dial-admin/` and confirm all pass (73/73 across the six touched/related suites)
- [x] 6.2 Run `npm run lint` and `npm run format` (or `format:write` if needed) (lint: 0 errors, same 32
  pre-existing unrelated warnings; format flagged the updated spec file, fixed via `format:write`,
  retested — still 15/15 green)
- [x] 6.3 Run `npx vitest run` across all touched suites (folders/resource-walk, assets/exim,
  files/export, applications/toolsets/prompts exim, create-stream-request) and confirm all pass
  (83/83 across 7 suites; lint 0 errors on `create-stream-request.ts`/`export.ts`; format flagged the
  updated `create-stream-request.spec.ts`, fixed via `format:write`, retested — still 10/10 green;
  full-suite coverage run deferred per explicit user instruction this session)
