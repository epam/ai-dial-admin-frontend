## 1. Toolset aggregate-document export/import (mirrors Prompts)

- [x] 1.1 `buildToolsetsExport(assetApi, token, paths)` implemented in `src/server/toolsets/exim.ts` — fetches merged content+metadata per path, sets `id` to `${RESOURCE_TYPE_PREFIX[TOOLSET]}${path}`, returns `ParsedAssets` (`{ toolSets: AssetToolset[] }`), no secret redaction
- [x] 1.2 `importToolsetsExport(assetApi, token, document, options)` implemented — per-folder existence lookup cached within a batch, `OVERRIDE`/`SKIP` handling, reusing `ConsecutiveFailureCircuitBreaker`
- [x] 1.3 `buildToolsetsZip`/`mergeToolsetsExports`/`extractToolsetsFromZip` implemented in `src/server/toolsets/zip-exim.ts`, reusing `isValidZipEntryPathWithPrefix`
- [x] 1.4 Unit tests in `src/server/toolsets/tests/exim.spec.ts` and `tests/zip-exim.spec.ts` — mirroring the prompts test suite's cases (export mapping incl. unredacted authSettings, OVERRIDE/SKIP, malformed/missing id, circuit breaker, multi-entry merge, in-archive collision rejection, real-zip-built export inspected for the single `toolSets/toolSets.json` entry) — 15/15 passing

## 2. Toolset-only Core ops client

- [x] 2.1 `ToolsetOpsApi extends CoreApi` implemented in `src/server/core/toolset-ops-api.ts` — `discoveredTools(token, path)`, `signIn(token, body)`, `signOut(token, body)`
- [x] 2.2 Unit tests in `src/server/core/tests/toolset-ops-api.spec.ts` — URL/verb/body shape for each of the three methods — 3/3 passing
- [x] 2.3 `toolsetOpsApi` instance exported from `src/app/api/api.ts`

## 3. Wire actions

- [x] 3.1 `exportToolsets`/`importToolsets` in `src/app/[lang]/assets-toolsets/actions.ts` call the new Core-backed logic instead of `assetsApi.exportAssets`/`importAssets`
- [x] 3.2 `getAssetTools` calls `toolsetOpsApi.discoveredTools` instead of `assetsApi.getTools`
- [x] 3.3 `signInToolset`/`signOutToolset` call `toolsetOpsApi.signIn`/`signOut` instead of `assetsApi.signInToolset`/`signOutToolset`, reusing `getToolsetBasicBody`/`getToolsetSignInBody` unchanged
- [x] 3.4 Confirmed `assetsApi.importAssets`/`exportAssets`/`getTools`/`signInToolset`/`signOutToolset` have zero remaining references for toolsets (class itself untouched — still used by applications' deferred work and toolsets' own deferred try-out-tool). Note: `src/app/[lang]/assets-toolsets/[id]/page.tsx` still calls `assetsApi.getAssetWithEtag`/`getAssetList` for toolset *reads* — pre-existing gap from `migrate-toolset-resources-to-core`, unrelated to this change, out of scope here (same class of gap as the prompts equivalent).
- [x] 3.5 Targeted `vitest run` for every spec file touched/added in this change — 94/94 passing (`src/server/toolsets/tests/*`, `src/server/core/tests/toolset-ops-api.spec.ts`, `src/app/[lang]/assets-toolsets/actions.spec.ts`, plus `src/server/files/tests/*`/`src/server/prompts/tests/*` re-run to confirm the shared zip-guard/circuit-breaker modules are unaffected)
- [x] 3.6 `openspec validate migrate-toolset-auth-discovery-import-to-core --strict` — passes

<!--
No browser-verification task: the Import/Export buttons, ImportModal/ExportModal UI, and the
sign-in/sign-out AuthButtons UI are unchanged — only what backs these actions changes. Unit
tests are the verification bar, consistent with this series' established pattern.
-->
