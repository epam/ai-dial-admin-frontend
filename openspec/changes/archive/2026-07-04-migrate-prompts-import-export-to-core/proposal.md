## Why

`importPrompts`/`exportPrompts` are the last prompt operations still proxied through the admin BE — deferred by `migrate-prompts-to-core` as a fast-follow. Reverse-engineering `PromptsController`/`PromptEximService`/`ZipPromptEximService` shows this isn't the Files precedent (independent per-file zip entries): prompts import/export operate on a **structured JSON aggregate document**, with cross-entry uniqueness validation against what's already in Core and an `OVERRIDE`/`SKIP` conflict-resolution policy applied per prompt. The FE already has a live client-side contract for that document — `ParsedAssets.prompts: DialPrompt[]` (`src/models/import-asset.ts`), already validated by `isInvalidJson` and rewritten by `getFormDataForImport` — so this change reuses that shape rather than inventing a new one. Zip import/export are thin wrappers around that same JSON document. This change ports both directly against Core.

## What Changes

- **Port `exportPrompts`** (`src/app/[lang]/prompts/actions.ts`) to build a `{ prompts: DialPrompt[] }` (`ParsedAssets`) JSON document directly against Core instead of calling `assetsApi.exportAssets`:
  - For each selected path, fetch merged content+metadata (`assetApi.getMerged`) and set each prompt's `id` to its Core-prefixed path (the `prompts/public/([^/]+/)*[^/]+__[^/]+` shape the FE's own `isInvalidJson` already validates).
  - **JSON export** (`fileType=json`) returns the `{ prompts: [...] }` document directly (existing browser-side JSON-download handling is unchanged).
  - **Zip export** (`fileType=archive`) wraps the same JSON document as a single `prompts/prompts.json` zip entry (matching `ZipPromptEximService`'s export shape) via `jszip`.
- **Port `importPrompts`** (currently routed through `POST /api/prompts/import` → `assetsApi.importAssets`) to run directly against Core:
  - **JSON import**: parse the uploaded `{ prompts: DialPrompt[] }` document, validate each prompt's `id` against the path regex, resolve per-prompt conflicts against Core (`assetApi.list`/`getMetadata` for the destination folder) using the supplied `ConflictResolutionPolicy` (`OVERRIDE` writes through; `SKIP` is treated as a non-error outcome when the destination already exists — `MANUAL` stays resolved client-side before submission, as today), then `assetApi.put` each accepted prompt.
  - **Zip import**: unpack `prompts/*.json` entries (path-traversal-guarded the same way as Files' zip import — reuse `isValidZipEntryPath`), merge/de-duplicate multiple JSON documents into one (a prompt id repeated across entries is rejected as a conflict within the archive itself, mirroring `compactPromptsEximDtos`), then delegate to the same JSON-import logic.
  - Preserve the consecutive-failure circuit breaker already built for Files import (reused, not reimplemented) so a batch aborts after too many consecutive per-prompt failures rather than grinding through the rest.
- **Simplify the zip-preview flow** (`previewPromptZip`, used only by the Create-Folder wizard's `FolderCreateReview.tsx`): since the uploaded document is already structured JSON, previewing it needs no network round-trip at all — parse the zip client-side, extract `prompts/*.json`, and render `{name, version, fileName}` per entry directly in the browser instead of proxying through the admin BE.

## Capabilities

### Modified Capabilities
- `prompts-core-api` *(new capability spec, sibling to the existing per-type Core specs)*: prompt JSON/zip export and JSON/zip import, executed directly against DIAL Core, replacing the admin-BE proxy. Prompts have zero remaining admin-BE dependency after this change.

## Impact

- **Modified code:**
  - `src/app/[lang]/prompts/actions.ts` — `exportPrompts`/new `importPrompts` action call the new Core-backed logic instead of `assetsApi.exportAssets`/`assetsApi.importAssets`
  - `src/app/api/prompts/import/route.ts` — rewired to the new import logic (still receives `FormData`, same route contract)
  - `src/utils/prompts/import-prompts.ts` — unchanged (still posts to the same route)
  - New: `src/server/prompts/exim.ts` (or similar) — `{ prompts: DialPrompt[] }` (`ParsedAssets`) mapping, conflict resolution, uniqueness validation
  - New: `src/server/prompts/zip-exim.ts` (or similar) — zip wrap/unwrap of the JSON document, reusing `isValidZipEntryPath` from `src/server/files/zip-import.ts`
  - `src/components/Common/FolderCreate/Components/FolderCreateReview.tsx` — `previewPromptZip` server-action call replaced with a client-side zip parse (no network call)
- **Unchanged:** `ImportModal.tsx`/`ExportModal.tsx` UI, `ConflictResolutionPolicy` enum, `ParsedAssets`/`DialPrompt` models, the `{ prompts: DialPrompt[] }` JSON wire shape consumers already expect.
- **Dependency:** `jszip` (already a dependency), `assetApi.list`/`getMerged`/`put` (already built), `isValidZipEntryPath`/circuit breaker (already built for Files).
- **Removed:** `assetsApi.exportAssets`/`importAssets` become unreferenced for `ResourceType.PROMPT` (the class itself stays alive for toolsets/applications, still deferred).

## Non-goals

- **Folder-rules propagation on import**: the BE's `folderService.updatesRules` call after a successful prompt import is real, but on the FE today it's only reachable from the Create-Folder wizard, never the plain Prompts-list Import button being ported here. Deferred — confirmed with the user — until/unless the Create-Folder wizard itself is migrated.
- **Exact circuit-breaker threshold**: the real BE config value (`prompts.import.consecutiveErrorsThreshold`) isn't FE-visible; this change reuses the same hardcoded threshold already accepted for Files.
- Toolsets/applications import/export — separate fast-follows, later in this sequence.
- Any change to the JSON wire format prompts import/export already commits to (the `PromptsExim{prompts[], folders[]}` shape is preserved exactly, not redesigned).
