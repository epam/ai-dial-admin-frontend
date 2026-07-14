## Why

Files are the last of the five asset types still proxied through the admin BE (`assetsApi`/`FileController` → `/api/v1/files/*`), and the shape is different enough from the other four to need its own change: files are unversioned (no `__` suffix), have no create/update view (upload **is** the only create path), and the BE has a confirmed bug — file delete silently ignores its etag parameter and never sends `If-Match`, unlike every other type. Per the earlier decision to fix known bugs during this port, this change also closes that gap, which means it changes the file delete/bulk-delete contract (a real, scoped breaking change) rather than being a pure like-for-like swap.

## What Changes

- **Cut file list/delete/bulk-delete/move over to Core**, replacing the corresponding `assetsApi` calls in `src/app/[lang]/files/actions.ts` with `add-core-asset-client`'s file client.
- **Cut file download and preview over to Core streaming**, replacing `assetsApi.downloadFile`/`previewFile` in `src/app/api/files/download/route.ts` and `.../preview/route.ts`.
- **Port file import (plain + zip) to Core**, replacing `assetsApi.importAssets`/`uploadFile`/`uploadFileZip` in `src/app/api/files/import/route.ts` — this is the FE's **only** file-creation path (there is no separate `createFile` action), so unlike prompts/toolsets/application-resources this change cannot defer import. It reproduces the BE's consecutive-failure circuit breaker (`SimpleCircuitBreaker`, aborts a batch after N consecutive per-file failures) and the zip-import path-traversal defense (`PathUtils.validateZipEntryPath`: rejects `..`, absolute paths, null bytes, backslash-normalized paths, and entries outside the `files/` prefix).
- **BREAKING (bugfix): file delete now requires a real etag.** `removeFile`/`bulkDeleteFiles` gain an etag per path (sourced from Core's file metadata, which the BE never exposed for this purpose) and send `If-Match`, correcting the BE's silent no-op. The FE's `DialFile` model gains an `etag` field, populated by the Core metadata read this change already performs for listing.
- **List default behavior unchanged**: no path/limit defaulting for files, matching the BE's `FileService.getMetadata` (a pure passthrough, unlike conversation/prompt).

## Capabilities

### New Capabilities
- `files-core-api`: file list, delete, bulk-delete, move, download, preview, and import (plain + zip, with circuit-breaker and path-traversal protections preserved) executed directly against DIAL Core via `add-core-asset-client`, replacing the admin-BE proxy, while the FE-facing `DialFile` contract (plus a new `etag` field), routes, and server-action signatures otherwise stay identical.

## Impact

- **Modified code:**
  - `src/app/[lang]/files/actions.ts` — `getFiles`, `bulkDeleteFiles`, `removeFile`, `moveFiles` call the Core file client instead of `assetsApi`; `removeFile`/`bulkDeleteFiles` gain a required etag parameter
  - `src/app/api/files/download/route.ts`, `.../preview/route.ts` — stream from Core instead of the admin BE
  - `src/app/api/files/import/route.ts` — plain and zip import routed through Core, with the circuit breaker and zip path-traversal defense ported to TypeScript
  - `src/models/dial/file.ts` — `DialFile` gains an `etag` field
  - Callers of `removeFile`/`bulkDeleteFiles` in `src/components/Assets/Files/List.tsx` (and wherever delete is triggered) — updated to pass the etag now available on listed items
- **Unchanged:** `Files/List.tsx`'s columns/rendering, the `/files` route (no detail/view page exists for files today, and this change doesn't add one).
- **Explicitly not touched by this change** (stays on `assetsApi`/admin BE): `exportFiles` — see Non-goals.
- **Hard dependency:** `add-core-asset-client` (file client: metadata GET with `contentType`/`contentLength`/etag, streamed content GET/PUT, delete requiring etag per its own D5) must be implemented first.
- **Auth:** forwards the logged-in user's JWT via the existing Core client pipeline.

## Non-goals

- **Export** (`exportFiles`, zip-building of existing files) — deferred to a fast-follow, same reasoning as prompts'/toolsets' export deferral: it's a read-side convenience feature, not on the critical path for CRUD parity, and building a Core-backed zip stream is separable risk.
- Folders/rules — `migrate-folders-to-core` (separate, later change).
- Any other asset type — all four others are done as of this change.
- A file detail/view page — none exists today; not added by this change.
- Changing the circuit-breaker threshold or path-traversal rules — ported as-is from the BE, not tuned.
