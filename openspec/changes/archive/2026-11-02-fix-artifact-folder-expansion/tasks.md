## 1. Selection-independent expansion

- [x] 1.1 Implement expansion loading in `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx`, using `src/hooks/use-file-manager-expansion.ts` with a dedicated model file if extraction is needed: apply the requested expanded paths, load newly expanded uncached folders, and never invoke selection or navigation callbacks.
- [x] 1.2 Coordinate pending expansion paths with successful `AssetsFolderContextReader.fetchedFoldersData` and the observed `isFetchingFiles` lifecycle; reuse empty/preloaded caches, suppress duplicate pending expansion requests, and release failed paths for retry without reopening folders collapsed while loading. Preserve existing name-click, popup, root, and notification behavior.

## 2. Regression tests

- [x] 2.1 Add unit coverage for all new/updated expansion logic in `apps/ai-dial-admin/src/components/Common/FileManager/tests/FileManager.spec.tsx` and, if a hook is extracted, `src/hooks/tests/use-file-manager-expansion.spec.ts`: uncached expansion, no selection/navigation, collapse without fetch, successful and empty-cache reuse, preloaded physical/file roots, duplicate suppression before rerender and during loading, collapse during loading, and retry after failure. Keep the existing folder-name behavior covered and reuse centralized mocks in `test-setup.tsx`.
- [x] 2.2 Run the targeted expansion tests and existing FileManager regression file from `apps/ai-dial-admin/` with one-shot `npx vitest run`, resolving failures before the final gate.

Automated browser verification was offered and explicitly declined by the user. No `spec-browser-verify` task or manual-verification task is included.

## 3. Final quality gates

- [x] 3.1 Run lint, format checking, both blocking typechecks (`npm run typecheck` and `npm run typecheck:specs`), the full test suite with coverage, and `openspec validate fix-artifact-folder-expansion --strict`. Resolve change-related failures and report any unrelated failures or infrastructure blockers faithfully.
