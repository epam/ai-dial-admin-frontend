## 1. Aggregate-document export (reusing existing `ParsedAssets`/`DialPrompt` models)

- [x] 1.1 `buildPromptsExport(assetApi, token, paths)` implemented in `src/server/prompts/exim.ts` — fetches merged content+metadata per path via `assetApi.getMerged`, sets each prompt's `id` to `${RESOURCE_TYPE_PREFIX[PROMPT]}${path}`, returns `ParsedAssets` (`{ prompts: DialPrompt[] }`) — no new wire type
- [x] 1.2 Unit tests in `src/server/prompts/tests/exim.spec.ts` — id derivation matches the existing `isInvalidJson` regex, empty-selection edge case

## 2. JSON import with conflict resolution

- [x] 2.1 Id-regex validation implemented (reusing the same shape `isInvalidJson` already checks client-side), rejecting malformed entries before any Core call
- [x] 2.2 `importPromptsExport(assetApi, token, document, policy)` implemented — per-folder existence lookup cached within a batch, `OVERRIDE`/`SKIP` handling per the spec, reusing `ConsecutiveFailureCircuitBreaker` from `src/server/files/circuit-breaker.ts`
- [x] 2.3 Unit tests — `OVERRIDE` writes through on conflict, `SKIP` reports skipped not failed and doesn't trip the circuit breaker, malformed id rejected, circuit breaker aborts after threshold consecutive real failures

## 3. Zip export/import

- [x] 3.1 Zip export: wraps the `ParsedAssets` document from step 1 as a single `prompts/prompts.json` entry via `jszip`
- [x] 3.2 `mergePromptsExports(documents)` implemented in `src/server/prompts/zip-exim.ts` — concatenates `prompts[]`, throws on a prompt id repeated across documents
- [x] 3.3 Zip import: unpacks `prompts/*.json` entries (validated via `isValidZipEntryPathWithPrefix`, generalized from `isValidZipEntryPath` in `src/server/files/zip-import.ts`), merges via 3.2, delegates to `importPromptsExport`
- [x] 3.4 Unit tests — multi-entry merge, in-archive id-collision rejection, path-traversal rejection reusing the existing guard, real-zip-built export inspected for the single `prompts/prompts.json` entry

## 4. Wire actions, route, and zip preview

- [x] 4.1 `exportPrompts` in `src/app/[lang]/prompts/actions.ts` calls the new Core-backed logic (JSON and archive) instead of `assetsApi.exportAssets`
- [x] 4.2 New `importPrompts` server action added alongside `exportPrompts`, and `src/app/api/prompts/import/route.ts` rewired to call it instead of `assetsApi.importAssets` (route contract — `FormData` in, `ServerActionResponse` out — unchanged)
- [x] 4.3 `FolderCreateReview.tsx`'s `previewPromptZip` server-action call replaced with a client-side `jszip` parse (`previewPromptZipFile`, `Common/FolderCreate/utils.tsx`) producing the same `{name, version, fileName}` preview shape the review grid already consumes; the now-dead `previewPromptZip` action (`folders-storage/actions.ts`, BE-proxied) and its test were removed. Note: the entire `Common/FolderCreate` wizard (and this preview code with it) was subsequently deleted in a separate, unrelated manual cleanup by the user after this change was implemented — see `FolderList`/`EntityListView` history for that removal, not this change.
- [x] 4.4 Confirmed `assetsApi.exportAssets`/`importAssets` have zero remaining references for `ResourceType.PROMPT` (class itself untouched, still used by toolsets/applications). Note: `src/app/[lang]/prompts/[id]/page.tsx` still calls `assetsApi.getAssetWithEtag`/`getAssetList` for prompt *reads* — pre-existing gap from `migrate-prompts-to-core`, unrelated to import/export, out of scope here.
- [x] 4.5 Targeted `vitest run` for every spec file touched/added in this change — 104/104 passing (`src/server/prompts/tests/*`, `src/app/[lang]/prompts/actions.spec.ts`, `src/app/[lang]/folders-storage/actions.spec.ts`, `src/components/Common/FolderCreate/tests/*`, `src/server/files/tests/*` re-run after the shared zip-guard refactor)
- [x] 4.6 `openspec validate migrate-prompts-import-export-to-core --strict` — passes

<!--
No browser-verification task: the Import/Export buttons, ImportModal/ExportModal UI, and the
Create-Folder wizard's review grid are unchanged — only what backs `exportPrompts`/`importPrompts`
and the wizard's preview call changes. Unit tests (including a real jszip-built-and-parsed archive)
are the verification bar, consistent with this series' established pattern.
-->
