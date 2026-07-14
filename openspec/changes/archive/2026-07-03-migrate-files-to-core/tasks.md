## 0. Prerequisite

- [x] 0.1 Confirmed `add-core-asset-client`'s file client has landed (`FilesCoreApi`: metadata GET, streamed content GET/PUT, delete requiring a real etag per its D5). Found and closed a gap while implementing: `FilesCoreApi.uploadFile` had no way to send a conditional header (`postFiles` didn't accept custom headers at all) — needed for import's SKIP-on-conflict policy. Extended `BaseApi.postFiles` with an optional `extraHeaders` param (additive, backward-compatible) and `uploadFile` with an `{ overwrite?: boolean }` option (defaults to `true`, preserving the existing publications file-staging caller's behavior unchanged). Added `previewFile` (was missing entirely — only `downloadFile` existed).
- [x] 0.2 Grepped every caller of `removeFile`/`bulkDeleteFiles` — only `Files/List.tsx` (besides the actions file and its own spec) calls them; scope confirmed narrow

## 1. Model and list changes

- [x] 1.1 Added `etag?: string` to `DialFile` (`src/models/dial/file.ts`)
- [x] 1.2 `getFiles` — calls `filesCoreApi.getFileMetadata(token, path, false)` and returns `.items`. **Flagged assumption (user-confirmed):** Core's metadata JSON is assumed to carry a per-item `etag` field (no live Core instance available to verify this against an HTTP header vs. JSON-body placement) — if wrong, `etag` will come back `undefined` and every delete will correctly, safely reject rather than silently corrupting data, since D5's delete-requires-etag guard rejects `undefined`/empty etags before calling Core.
- [x] 1.3 Updated `Files/List.tsx`'s `handleDeleteItems` to read `file.etag` and pass `{ path, etag }` pairs to `bulkDeleteFiles`

## 2. Delete and move

- [x] 2.1 `removeFile` — now requires a concrete etag parameter (was previously unused anywhere in the UI, only in its own spec — signature change is safe); calls `filesCoreApi.deleteFile`, which itself rejects before calling Core if etag is falsy
- [x] 2.2 `bulkDeleteFiles` — signature changed to `{ path, etag }[]`; validates every item has an etag up front (rejects the whole batch with no Core calls at all if any is missing, rather than partially processing); otherwise deletes sequentially, fail-fast
- [x] 2.3 `moveFiles` — now calls `assetApi.move(token, ResourceType.FILE, ...)`, reusing the generic Core move op built for the other four types (files have no special move semantics — design D6)

## 3. Download and preview

- [x] 3.1 `src/app/api/files/download/route.ts` — now streams from `filesCoreApi.downloadFile`
- [x] 3.2 `src/app/api/files/preview/route.ts` — now streams from `filesCoreApi.previewFile` (added to `FilesCoreApi`, was missing — only `downloadFile` existed)

## 4. Import: circuit breaker and plain multi-file upload (design D3)

- [x] 4.1 Implemented `ConsecutiveFailureCircuitBreaker` (`src/server/files/circuit-breaker.ts`) — increment on failure, reset on success. **Flagged assumption:** the BE's actual configured `files.import.consecutiveErrorsThreshold` value isn't available to this frontend-only migration; used a reasonable default constant (`FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD = 5`), documented inline as needing reconciliation against the real BE config if it differs materially.
- [x] 4.2 `importPlainFiles` (`src/server/files/import.ts`) uploads each file via `filesCoreApi.uploadFile`, classifying a 412 response as `skipped` (not a circuit-breaker failure) and any other failure as `failure`, aborting once the breaker opens
- [x] 4.3 Unit tests in `src/server/files/tests/import.spec.ts` and `tests/circuit-breaker.spec.ts` — batch abort after N consecutive failures, success mid-batch resets the counter, 412→skipped classification, partial results reported correctly — all passing

## 5. Import: zip archive (design D4, D5)

- [x] 5.1 `isValidZipEntryPath` (`src/server/files/zip-import.ts`) rejects `..`, absolute POSIX/Windows paths, null bytes, and backslash-normalized escapes outside the `files/` prefix
- [x] 5.2 `importZipFile` throws `InvalidImportZipError` (mapped to a 400 in the route) when zero entries survive validation
- [x] 5.3 `inferContentTypeFromFileName` — extension→MIME map with `application/octet-stream` fallback
- [x] 5.4 `importZipFile` (`src/server/files/import.ts`) extracts valid entries via `jszip` (new dependency, user-confirmed) and uploads each through the same circuit breaker as plain import
- [x] 5.5 Unit tests: every individual rejection case (`..`, absolute POSIX, absolute Windows, null byte, backslash-escape, outside-prefix, empty path) in `zip-import.spec.ts`; an end-to-end zip built with `jszip` in `import.spec.ts` confirming a traversal entry is silently excluded and a no-valid-entries archive throws — 19 tests total, all passing

## 6. Tests and cleanup

- [x] 6.1 `files/actions.spec.ts` rewritten to mock `filesCoreApi`/`assetApi`; asserts `bulkDeleteFiles` rejects the whole batch pre-Core when any item lacks an etag, and fail-fast behavior otherwise — 8/8 passing
- [x] 6.2 Confirmed `exportFiles` is untouched (still calls `assetsApi.exportFiles`, deferred per Non-goals)
- [x] 6.3 Confirmed `assetsApi`'s only remaining callers across all five asset-type action files are the already-deliberately-deferred features (files' `exportFiles`; prompts' `exportAssets`; toolsets' `importAssets`/`getTools`/`signIn`/`signOut`/`exportAssets`/`tryOutTool`; applications' Phase-1 `validityState` seam, `importAssets`, `exportAssets`, `getTools`) — zero remaining CRUD callers; `assetsApi` itself untouched
- [x] 6.4 `npm run lint` / `npm run format` — clean (3 Prettier-only issues auto-fixed)
- [x] 6.5 `vitest run` — 74/74 across `files/actions.spec.ts`, `server/files/`, and `server/core/`; full-repo suite green
- [x] 6.6 `openspec validate migrate-files-to-core --strict` — passes

<!--
No browser-verification task, per explicit user decision made for this change: unit tests (including dedicated security-relevant zip-path-traversal rejection cases) are sufficient, keeping verification consistent with the other four per-type changes.
-->
