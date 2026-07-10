## Context

Files differ structurally from the other four asset types in ways that shaped every prior change's design:
- **Unversioned**: no `__` suffix, no `parseVersionedPath` involvement.
- **No create/update action**: `src/app/[lang]/files/actions.ts` has no `createFile`/`updateFile` — the only way to add a file is `src/app/api/files/import/route.ts` (plain multi-file or zip archive). This is why import can't be deferred here the way it was for prompts/toolsets/application-resources.
- **No detail/view page**: `src/app/[lang]/files` has only `page.tsx` (list) — no `[id]/page.tsx`. Download (`api/files/download/route.ts`) and preview (`api/files/preview/route.ts`) are the only per-file reads.
- **Confirmed BE bug**: `FileService.delete(path, etag)` accepts an etag and never uses it — `fileClient.deleteFile(path)` sends no conditional header. `add-core-asset-client`'s own D5 already commits to fixing this at the client level (delete requires a real etag); this change is the first and only consumer that has to actually thread an etag through the FE UI to satisfy it.
- **Import has two BE-side protections with no FE-side equivalent today**: a `SimpleCircuitBreaker` that aborts a multi-file upload batch after N consecutive per-file failures (config `files.import.consecutiveErrorsThreshold`), and `PathUtils.validateZipEntryPath` for zip imports (rejects `..`, absolute paths, null bytes, backslash-normalized paths, entries outside the `files/` prefix) — a real security control, not just a nicety.

## Goals / Non-Goals

**Goals**
- `getFiles`, `bulkDeleteFiles`, `removeFile`, `moveFiles` call the Core file client instead of `assetsApi`.
- Download and preview stream from Core.
- Plain and zip import work against Core, with the circuit breaker and zip path-traversal defense reproduced faithfully.
- File delete/bulk-delete require and send a real etag (`If-Match`), closing the BE's bug per the earlier decision to fix known bugs during this port.
- Zero change to `Files/List.tsx` rendering/columns beyond what's needed to carry the new `etag` field, and to the `/files` route.

**Non-Goals**
- Export — deferred fast-follow.
- Any create/update/detail-view UI — none exists; not introduced.
- Building the underlying Core client — owned by `add-core-asset-client`.
- Folders/rules.

## Decisions

### D1 — `DialFile` gains an `etag` field, sourced from Core metadata
Core's file metadata response carries an ETag (used elsewhere in this codebase already, e.g. `bucket-api.ts`/`files-core-api.ts` from the publications work); the BE's `FileClientMapper` never surfaced it to the FE because nothing needed it. This change adds `etag?: string` to `src/models/dial/file.ts` and populates it in `getFiles`'s mapped results, so `Files/List.tsx` has an etag available to pass into delete without an extra round-trip per delete.

**Alternative considered**: fetch a fresh etag right before each delete. Rejected — doubles delete latency and reintroduces a race window (the etag could go stale between the extra fetch and the delete) that the list-provided etag doesn't meaningfully avoid, since Core's own conditional check is what actually guards against a stale write.

### D2 — Bulk delete becomes per-item conditional, not a single "bulk" Core call
The BE's own `deleteFiles(List<String>)` was never a real bulk endpoint — it's a sequential loop over `fileClient.deleteFile(path)`, one HTTP call per path, fail-fast with no rollback. This change keeps that shape (sequential per-path calls) but each call now carries `If-Match` with that item's etag (D1), rather than looping with no conditional header at all. `bulkDeleteFiles`'s signature changes from `{ path }[]` to `{ path, etag }[]`.

### D3 — Import: circuit breaker ported as a simple consecutive-failure counter
Port `SimpleCircuitBreaker` as a small stateful counter scoped to one import request: increment on failure, reset on success, abort the remaining batch once the configured consecutive-failure threshold is hit. No new config system needed — the threshold becomes a constant (matching the BE's current configured value) unless product wants it tunable later.

### D4 — Import: zip path-traversal validation ported verbatim
Port `validateZipEntryPath` checks exactly: reject entries containing `..`, absolute paths, null bytes, or that normalize (backslash→forward-slash) outside the `files/` prefix; reject the whole zip as `INVALID_EXPORT_ZIP`-equivalent if no valid entries remain. This is a security control, not a behavioral nicety — no simplification.

### D5 — Content-type detection for zip entries
The BE guesses content-type from filename (`URLConnection.guessContentTypeFromName`) when unpacking a zip entry, since zip entries carry no content-type header. Port an equivalent filename-extension-based content-type lookup (Node has no direct equivalent to `URLConnection.guessContentTypeFromName`; use a small extension→MIME map covering the file types this app's users actually upload, falling back to `application/octet-stream`).

### D6 — Move/List/Download/Preview have no hidden BE logic to reproduce
Confirmed from the BE research: `FileService.getMetadata` is a pure passthrough (no default path/limit, unlike conversation/prompt); `move` delegates straight to the generic resource move; `get`/download is a raw streamed passthrough with no etag/version handling. These four operations are the simplest ports in this entire migration — no design decision needed beyond "call the Core client."

## Risks / Trade-offs

- **[Risk] Threading a new required `etag` parameter through `removeFile`/`bulkDeleteFiles`'s callers** could be missed at a call site, causing a runtime error instead of a silent no-op (the opposite failure mode of today's bug, but a real regression risk during implementation). → **Mitigation**: task list requires grepping every caller of these two actions, not just the action definitions.
- **[Risk] Circuit-breaker/path-traversal port has security consequences if subtly wrong** (a path-traversal check that's slightly looser than the BE's would be a real vulnerability, not just a bug). → **Mitigation**: task list requires dedicated unit tests for every rejection case in `validateZipEntryPath` (`..`, absolute path, null byte, backslash-normalized escape, outside-`files/`-prefix), not just the happy path.
- **[Trade-off] Import stays in scope despite being the most complex piece here** — unlike every prior change, which deferred import/export wholesale. Accepted: there's no alternative create path for files, so deferring it would leave file creation broken after this change lands.

## Migration Plan

1. Confirm `add-core-asset-client`'s file client (metadata+etag, streamed content, delete-requires-etag per its D5) has landed.
2. Add `etag` to `DialFile`; wire `getFiles` to populate it.
3. Swap `bulkDeleteFiles`/`removeFile`/`moveFiles` to the Core client; update signatures and all call sites for the new etag requirement.
4. Swap download/preview routes to stream from Core.
5. Port the circuit breaker and zip path-traversal validation; wire the import route to Core for both plain and zip.
6. Full test pass, including the security-relevant zip-entry rejection cases.

## Open Questions

None outstanding.
