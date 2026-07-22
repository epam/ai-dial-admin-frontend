## 1. Path-rewrite utility

- [x] 1.1 Add `replacePathPrefix(fullPath: string, oldPrefix: string, newPrefix: string): string` to `apps/ai-dial-admin/src/utils/files/path.ts`: normalize trailing slashes on `oldPrefix`/the matched portion of `fullPath`, compare as path-segment sequences (not raw substring), and either return the correctly-joined rewritten path or throw when `fullPath` does not actually start with `oldPrefix` as a segment-aligned prefix.
- [x] 1.2 Add unit tests in `apps/ai-dial-admin/src/utils/files/tests/path.spec.ts` for `replacePathPrefix`: matching prefix with both slash styles, mismatched trailing slash on either side, a descendant one level deep, the `.dial_folder` marker resource path, a non-matching-prefix path (expect throw), and a `oldPrefix` that is a segment-prefix look-alike but not an actual ancestor (e.g. `"bucket/foo"` vs `"bucket/foobar/..."`).

## 2. Wire the fix into changeFolderCore

- [x] 2.1 In `apps/ai-dial-admin/src/server/folders/folders-core.ts`, replace `barePath.replace(oldPath, newPath)` (`changeFolderCore`, current line 221) with `replacePathPrefix(barePath, oldPath, newPath)`.
- [x] 2.2 Handle the new throw path from `replacePathPrefix` inside `changeFolderCore`'s descendant loop: catch it and return a `ServerActionResponse` failure (consistent with the function's existing fail-fast, no-rollback return shape) instead of letting it propagate as an unhandled exception.

## 3. Regression tests for changeFolderCore

- [x] 3.1 In `apps/ai-dial-admin/src/server/folders/tests/folders-core.spec.ts`, add a case: renaming a folder with contents (`oldPath`/`newPath` differing only in the final segment) results in each descendant's destination path being `newPath` + the original relative suffix, with no glued-together names.
- [x] 3.2 Add a case: `oldPath` or `newPath` passed without a trailing slash still produces correct, separator-safe destination paths for descendants.
- [x] 3.3 Add a case: moving a folder represented only by its `.dial_folder` marker resource produces a destination marker path of `<newParentPath>/<folderName>/.dial_folder`, not a `<folderName>.dial_folder` file.
- [x] 3.4 Add a case: a gathered descendant whose path does not start with `oldPath` as a segment-aligned prefix causes `changeFolderCore` to return a failure response for that move, rather than leaving the item unmoved or misplaced.

## 4. Quality checks

- [x] 4.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`, `npm run test` from `apps/ai-dial-admin/`) and fix any failures. Lint and format pass clean. Full suite has 2 pre-existing flaky failures in `Runs/Compare/tests/CompareView.spec.tsx` and `Runs/Compare/ExecutionResults/tests/ExecutionResultsTab.spec.tsx` (ag-grid rendering-timing flakiness, failure count varies between runs) — unrelated to this change, not touched by it.
