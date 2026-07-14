## Context

The BE's prompt import/export (`PromptsController` → `PromptEximService` / `ZipPromptEximService`) operates on a **structured aggregate document**, not independent per-file archive entries like Files. Crucially, the FE **already has a live client-side contract for this JSON shape** — it doesn't need to be invented: `ParsedAssets.prompts` (`src/models/import-asset.ts`) is `DialPrompt[]`, each carrying an `id` field shaped `prompts/public/([^/]+/)*[^/]+__[^/]+`, already validated by `isInvalidJson` (`src/components/EntityListView/Import/utils.ts`) and already rewritten by `getFormDataForImport`/`getAssetIdByNameAndVersion` when a user edits a row in the import-review grid before submitting. No `folders[]` array is read anywhere on the FE for prompts — this change does **not** introduce one; it reuses `{ prompts: DialPrompt[] }` (the existing `ParsedAssets` shape) as the JSON wire format end-to-end, rather than a new BE-mirroring `PromptEximDto`/`PromptsExim` type nothing else would consume.

1. **Export** (`PromptEximService.exportPrompts`): for each requested path, fetch content+metadata and produce a `DialPrompt` with its `id` set to `prompts/<path>` (prefix + bucket-relative path, version suffix retained — matching the regex above), returned as `{ prompts: DialPrompt[] }`.
   - **JSON export** returns that document directly (already how `downloadJson` in `BaseAssetList.tsx` expects to receive it).
   - **Zip export** (`ZipPromptEximService.exportZip`) writes the *same* JSON document as a single `prompts/prompts.json` entry inside a zip — it is not a "zip of prompt files," it's a zip containing one JSON file.
2. **Import** (`PromptEximService.importPrompts`): parse the uploaded `{ prompts: DialPrompt[] }`, validate each prompt's `id` against the path regex, then for each prompt check for an existing conflict at its resolved destination — and apply the caller-supplied `ConflictResolutionPolicy`:
   - `OVERRIDE`: write through regardless of an existing conflict.
   - `SKIP`: on conflict, treat as a no-op success (caught as `EntityAlreadyExistsException`, not surfaced as an error).
   - `MANUAL` is resolved client-side before submission (the FE's existing import-review grid), never sent to this layer as a live policy value.
   - `flatImport` (a real BE flag) rewrites destination paths to drop intermediate folder segments; the FE's local variable name `ignorePaths` is just that same field under a different name, not a distinct concept.
   - After a successful batch, `folderService.updatesRules` propagates folder rules to the destination — **out of scope here** (Non-goals; only reachable via the Create-Folder wizard today, confirmed with the user to defer).
   - **Zip import** (`ZipPromptEximService.importZip`) unpacks `prompts/*.json` entries (validated the same way as Files' zip import, via `PathUtils.validateZipEntryPath`), merges multiple `{ prompts: DialPrompt[] }` documents into one (rejecting an id that repeats across entries as an in-archive conflict, matching `compactPromptsEximDtos`'s intent), then delegates to the same JSON-import path.
3. **Zip preview** (`/import/zip/preview`, wired only into the Create-Folder wizard's `FolderCreateReview.tsx` via `previewPromptZip`) returns `{name, version, fileName}` per entry with no conflict info — it exists purely so the wizard's review grid has rows to show before the user commits. Since the uploaded artifact is already structured JSON once unzipped, this needs no server round-trip at all once ported.

Prompts already have full CRUD+move against Core (`migrate-prompts-to-core`) — `assetApi.getMerged`, `.list`, `.put` are the building blocks this change composes into the aggregate-document flow. Files' zip-import path-traversal guard (`isValidZipEntryPath`) and consecutive-failure circuit breaker are reused as-is, not reimplemented.

## Goals / Non-Goals

**Goals**
- JSON export produces the same `{ prompts: DialPrompt[] }` (`ParsedAssets`) shape the FE's own import-review grid, `isInvalidJson`, and `getFormDataForImport` already parse/validate/rewrite today — no new wire type introduced.
- Zip export wraps that same document as a single `prompts/prompts.json` entry.
- JSON/zip import apply `OVERRIDE`/`SKIP` conflict resolution against Core's actual current state, not a stale snapshot.
- Zip import merges multiple JSON entries and rejects in-archive id collisions.
- Zip preview becomes a pure client-side operation (no network call), simplifying the Create-Folder wizard's dependency.

**Non-Goals**
- Folder-rules propagation on import (deferred, see proposal).
- Reproducing the exact BE circuit-breaker threshold (unknowable from FE; reuse the Files threshold).
- Inventing a new `PromptsExim`/`PromptEximDto` wire type — the existing `ParsedAssets`/`DialPrompt` shape is reused as-is (see Context).
- Toolsets/applications import/export.

## Decisions

### D1 — Export builds `{ prompts: DialPrompt[] }` from already-built Core primitives, reusing `ParsedAssets`
`buildPromptsExport(assetApi, token, paths)`: for each path, `assetApi.getMerged<DialPrompt>` for content+metadata, then set `id` to `${RESOURCE_TYPE_PREFIX[PROMPT]}${path}` (matching the regex `isInvalidJson` already validates). Returns `{ prompts: DialPrompt[] }` typed as `ParsedAssets` — the same model the import-review grid already consumes — not a new type. JSON export returns this directly; zip export wraps it via `jszip` as `prompts/prompts.json`.

### D2 — Import conflict resolution queries Core directly, no local cache
For each incoming prompt (after regex validation of `id`), resolve its destination path and check for an existing prompt at that path via `assetApi.list`/`getMetadata` on the destination folder — mirroring the BE's `collectUniquenessConflicts` intent (detect an existing resource before writing) without a BE-side bulk validator to lean on. `OVERRIDE` proceeds to `assetApi.put` unconditionally; `SKIP` short-circuits to a skipped-not-failed result if a conflict is found. The existing circuit breaker (`ConsecutiveFailureCircuitBreaker`, reused from Files) aborts the batch after too many consecutive real failures — a `SKIP` outcome does not count as a failure, matching Files' precedent for precondition-based skips.

### D3 — Zip import merge mirrors `compactPromptsEximDtos` as a pure function
`mergePromptsExports(documents: ParsedAssets[])`: concatenates `prompts[]`, throwing if the same prompt `id` appears in more than one input document — matching the BE's in-archive-conflict behavior — before handing the merged document to the same import logic as D2.

### D4 — Zip preview becomes a pure client-side zip parse
Since `previewPromptZip` only ever needs `{name, version, fileName}` per prompt to populate the wizard's review grid, and that data is derivable directly from the already-unzipped `PromptsExim` document, replace the server-action round-trip with a client-side `jszip` read + JSON parse in `FolderCreateReview.tsx`'s effect, producing the same preview shape the grid already consumes. No new network dependency; matches the pattern this migration already established of trusting client-side parsing over a live server call where nothing server-side is actually needed.

## Risks / Trade-offs

- **[Risk] Import conflict-detection now costs one Core list/metadata call per destination folder** instead of a single BE-side bulk check. → **Mitigation**: cache per-folder lookups within a single import batch (same folder path checked once, not once per prompt); acceptable given the admin tool's realistic import batch sizes.
- **[Trade-off] Circuit-breaker threshold is a guess**, same caveat already accepted for Files — revisit only if it proves materially wrong in practice.

## Migration Plan

1. Implement `PromptEximDto`/`FolderEximDto`/`PromptsExim` types and `buildPromptsExim` (export path), with unit tests covering id derivation and folder de-duplication.
2. Implement JSON import (`importPromptsExim`) with conflict resolution (D2) and unit tests covering `OVERRIDE`, `SKIP`, and the id-regex-rejection path.
3. Implement zip export (wrap) and zip import (`mergePromptsExim` + unwrap, reusing `isValidZipEntryPath`), with unit tests covering the in-archive-conflict rejection.
4. Wire `exportPrompts`/new `importPrompts` action and the `/api/prompts/import` route to the new logic.
5. Replace `previewPromptZip`'s server round-trip with a client-side parse in `FolderCreateReview.tsx`.
6. Targeted test pass for all new modules.

## Open Questions

None outstanding — rules-propagation deferral confirmed with the user.
