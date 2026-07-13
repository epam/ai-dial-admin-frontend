## 1. Application aggregate-document export/import (mirrors Toolsets)

- [x] 1.1 `buildApplicationsExport(assetApi, token, paths)` implemented in `src/server/applications/exim.ts` — fetches merged content+metadata per path, sets `id` to `${RESOURCE_TYPE_PREFIX[APPLICATION]}${path}`, returns `ParsedAssets` (`{ applications: AssetApp[] }`)
- [x] 1.2 `importApplicationsExport(assetApi, token, document, options)` implemented — per-folder existence lookup cached within a batch, `OVERRIDE`/`SKIP` handling, reusing `ConsecutiveFailureCircuitBreaker`
- [x] 1.3 `buildApplicationsZip`/`mergeApplicationsExports`/`extractApplicationsFromZip` implemented in `src/server/applications/zip-exim.ts`, reusing `isValidZipEntryPathWithPrefix`
- [x] 1.4 Unit tests in `src/server/applications/tests/exim.spec.ts` and `tests/zip-exim.spec.ts` — mirroring the toolsets test suite's cases (export mapping, OVERRIDE/SKIP, malformed/missing id, circuit breaker, multi-entry merge, in-archive collision rejection, real-zip-built export inspected for the single `applications/applications.json` entry) — 15/15 passing

## 2. Remove the validityState Phase 1 seam

- [x] 2.1 `withValidityState` and its call site in `getApp` removed from `src/app/[lang]/assets-applications/actions.ts`
- [x] 2.2 `validateApp`/`validationFailure`/`assetApi` usage elsewhere in the file left untouched
- [x] 2.3 Existing `actions.spec.ts` tests referencing `withValidityState`/the BE `getAsset` merge updated to reflect its removal (three tests collapsed into one `Should call getApp action` asserting `assetsApi.getAsset` is never called and `validityState` is `undefined`)

## 3. Wire actions

- [x] 3.1 `exportApps`/`importApps` in `src/app/[lang]/assets-applications/actions.ts` call the new Core-backed logic instead of `assetsApi.exportAssets`/`importAssets`
- [x] 3.2 Confirmed `assetsApi.importAssets`/`exportAssets`/`getAsset` (validityState-only call) have zero remaining references for this file's operations (class itself untouched — still used by `getAssetTools`, the only remaining `assetsApi` call in this file, and by `tryOutAssetTool`'s `APPLICATION` branch elsewhere plus the deployment-config `applications` domain)
- [x] 3.3 Targeted `vitest run` for every spec file touched/added in this change — 106/106 passing (`src/server/applications/tests/*`, `src/app/[lang]/assets-applications/actions.spec.ts`, plus `src/server/files/tests/*`/`src/server/prompts/tests/*`/`src/server/toolsets/tests/*` re-run to confirm the shared zip-guard/circuit-breaker modules are unaffected)
- [x] 3.4 `openspec validate migrate-application-import-export-to-core --strict` — passes

<!--
No browser-verification task: the Import/Export buttons and ImportModal/ExportModal UI are
unchanged; validityState removal has no UI-visible effect since no component under
src/components/Assets/ currently reads it (confirmed via grep). Unit tests are the
verification bar, consistent with this series' established pattern.
-->
