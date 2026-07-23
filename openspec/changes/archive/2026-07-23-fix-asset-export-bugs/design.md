## Context

Both bugs live in the Core-direct export path built by `migrate-application-import-export-to-core` and
`migrate-files-export-to-core`. Neither Core nor an admin-BE proxy is involved in the defect — Core
only serves generic metadata/download endpoints; all folder-expansion, marker-filtering, and
archive/document assembly happens in `apps/ai-dial-admin/src/server/{assets,files}/`.

Two independent root causes, in two independent files:

- `assets/exim.ts`'s `expandFolderPath()` (shared by applications/toolsets/prompts export) walks every
  descendant of a folder via `gatherResourceUrls` but never excludes the `.dial_folder` marker resource
  that Core creates to represent an otherwise-empty folder. `files/export.ts` already has this
  exclusion (`isTechnicalItem`), added when Files export was built — it just never got ported to the
  shared assets path (#4002).
- `files/export.ts`'s `isFolderPath(path) = path.endsWith('/')` decides folder-vs-file purely from the
  path string, discarding the caller's already-known `DialFile.nodeType` at the `List.tsx onExport` →
  `exportFiles(paths: string[])` boundary. When that string convention doesn't hold for a given
  selection, `resolveExportEntries` treats a folder as a single file (or vice versa), and — because
  `listFolderChildren` is skipped — the export can end with zero resolved entries and a valid,
  fully-empty zip (#4001).
- A second, independent bug in the same function, only surfaced by live testing after fixing the
  above: `listFolderChildren`/`resolveExportEntries` read each child's storage path from `item.path`.
  Core's raw `getFileMetadata` response never carries a `path` field on its items — only `url`
  (`files/<bucket>/<...>`). `path` is a field `files/actions.ts`'s `toFileList` derives from `url` via
  `getPathFromUrl` for the UI grid, one layer above where `export.ts` reads Core's response directly.
  So every real child was silently dropped regardless of folder detection, which is why the D2 fix
  alone still produced an empty archive against a real backend even though it fixed the folder-vs-file
  classification the design originally targeted.

## Goals / Non-Goals

**Goals:**
- Applications/Toolsets/Prompts folder export never includes `.dial_folder`/`.dial_folder__<version>`
  marker resources, matching Files' existing behavior.
- Files folder export determines folder-vs-file from the resource's actual type, not from whether its
  path string ends in `/`, so a real folder selection can never silently resolve to zero entries.
- No change to public server-action signatures, route contracts, or the shape of exported
  JSON/zip documents.

**Non-Goals:**
- Not changing the UI selection model (`List.tsx`, ui-kit `DialFileManager`) — the fix stays entirely
  server-side.

**Revised**: Files' "one level deep" folder-expansion behavior was originally scoped as a non-goal (a
deliberate like-for-like port of the admin BE's legacy limit). Live verification after the D2/D3 fixes
showed this actively loses data — a folder containing a nested subfolder with files silently excluded
those files with no error or warning — so recursive expansion (D4 below) is now in scope, bringing
Files' folder-walk in line with the recursive walk Applications/Toolsets/Prompts export already uses
via `gatherResourceUrls`. `nextToken` pagination follow-through remains out of scope: switching to
`gatherResourceUrls` for the recursive walk (D4) gets pagination handling for free (it already follows
`nextToken` to exhaustion), so this is resolved as a side effect rather than a separate follow-up.

## Decisions

### D1 — Share one marker-exclusion predicate between Files and assets export

Move `isTechnicalItem` (currently private to `files/export.ts`) into `server/folders/resource-walk.ts`
— the module already shared by `assets/exim.ts` and conceptually the right home, since it's where
`isFolderNode`/`isItemNode` already live for exactly this kind of cross-type folder-walk helper. Both
`assets/exim.ts#expandFolderPath` and `files/export.ts#resolveExportEntries` import the same predicate.

Alternative considered: duplicate the marker constant/check directly in `assets/exim.ts`. Rejected —
it's the exact gap that caused #4002 (the two folder-walkers already drifted once); a shared predicate
makes a future third folder-walker (if one appears) get this for free instead of needing to remember to
port it again.

### D2 — Detect a Files folder selection from Core's `nodeType`, not the path string

Replace `isFolderPath(path) = path.endsWith('/')` with a check against the metadata node's own
`nodeType` (`'folder'` vs `'item'`, case-insensitively — mirroring the casing note already documented
in `resource-walk.ts`). Since `listFolderChildren` already calls
`filesCoreApi.getFileMetadata(token, path, false)` to get a folder's children, the same response
carries the node's own `nodeType` at the top level (Core's `MetadataBase.nodeType`) — so this collapses
into a single metadata call per selected path instead of adding a second round-trip: fetch metadata
once, branch on the returned node's `nodeType` to either add its `items` as expanded entries (filtered
through D1's marker exclusion) or treat the path itself as a single file entry.

Alternative considered: keep `paths: string[]` but thread an explicit `isFolder` flag from
`List.tsx#onExport` through `exportFiles`/`buildFilesExportZip`, since the UI already has
`DialFile.nodeType` for each selected row. Rejected for this fix — it would touch the
`onExport`/`exportFiles` signatures and their tests for no added reliability over asking Core directly
(the export must trust Core's current state over client-side selection state anyway, since a folder
could be deleted/renamed between selection and export), and keeps the fix contained to
`files/export.ts`.

### D3 — Derive a child's storage path from `item.url`, not `item.path`

Since a folder's children now come from the same `getFileMetadata` node used for D2's `nodeType`
check, read each item's storage path via `getPathFromUrl(item.url)` — the same derivation
`toFileList` already applies for the UI grid — instead of `item.path`, a field that only exists on
`DialFile` objects the app itself has already enriched, never on Core's raw metadata response.

Alternative considered: widen the `FileNode` type to keep `path` as a fallback alongside `url`.
Rejected — there is no live path where Core's raw response carries a usable `path`; keeping a fallback
would hide the fact that `path` was never a real field here and invite the same mistake again.

### D4 — Expand a Files folder recursively via the shared `gatherResourceUrls` walker

Replace reading a folder's direct `node.items` (D2's one-level read) with the same
`gatherResourceUrls` helper `assets/exim.ts#expandFolderPath` already uses: call
`filesCoreApi.getFileMetadata(token, path, true, nextToken)` (recursive) instead of `false`, and let
`gatherResourceUrls` follow `nextToken` to exhaustion and flatten every descendant `ITEM` url at any
depth. Each returned url still goes through `getPathFromUrl` (D3) and `isTechnicalItem` (D1) exactly as
before — only the source of URLs changes, from one non-recursive call's direct children to a fully
paginated recursive walk.

The top-level `getNode(path)` call (non-recursive) is unchanged — it's still needed to decide
folder-vs-file (D2) before deciding whether to walk at all, and a single-file selection never pays for
a recursive read it doesn't need.

Alternative considered: keep the one-level `node.items` read for Files and layer a second recursive
call only when a subfolder is present among the direct children. Rejected — that's the same recursive
walk in a hand-rolled, one-off form (its own pagination/flattening logic) instead of the walker already
proven correct for assets; no benefit over reusing `gatherResourceUrls` directly.

### D5 — Encode `Content-Disposition` filenames so streamed downloads never throw on non-Latin1 names

Discovered live, after D4 shipped: recursive expansion reached a real nested file whose name
contained a non-Latin1 character (`™`, U+2122), and `buildFilesExportZip` hung indefinitely. Root
cause is in `utils/api/create-stream-request.ts`'s `streamRequest`, shared by every file/asset
download and preview path in the app (not specific to Files export): it built
`Content-Disposition: attachment; filename=<raw name>` and called `headers.append(...)` with it.
`Headers` values must be ByteString-safe (Latin1 only) per the Fetch spec — any filename character
above code point 255 throws `"Cannot convert argument to a ByteString..."` at that call. Worse,
`streamRequest`'s own `catch` swallows that throw into `return new Promise(() => null)` — a promise
that never resolves — so every awaiting caller (including `buildFilesExportZip`'s per-entry
`downloadFile` loop) hangs forever rather than failing visibly.

Fix: `buildFilenameDisposition(fileName)` builds both `filename="<ascii-fallback>"` (non-Latin1
characters replaced with `_`) and `filename*=UTF-8''<percent-encoded>` (RFC 6266/5987) — both
components are always pure ASCII, so `headers.append` can never throw on this path regardless of the
actual filename.

Alternative considered: strip/sanitize the filename before it ever reaches `streamRequest` (e.g. in
`buildFilesExportZip`). Rejected — the header-encoding bug is general (every `streamRequest` caller
is exposed, not just Files export), so the fix belongs at the shared function, not re-implemented at
each call site.

Left unaddressed (out of scope for this change): `streamRequest`'s catch-all still returns a
never-resolving promise for *any other* error (network failure, non-2xx upstream response, etc.), not
just the one this change fixes. That's a real latent hang risk but is a distinct, pre-existing defect
unrelated to the two reported export bugs — flagged here rather than fixed, to avoid scope creep
beyond what was reported.

## Risks / Trade-offs

- [Every selected path now costs a metadata round-trip before download, even for a plain single-file
  selection that previously skipped straight to `downloadFile`] → Acceptable: `getFileMetadata` is a
  lightweight metadata-only call, and a single-file selection already needed metadata implicitly (its
  content-type/existence) elsewhere in the surrounding flow; this doesn't add a new call type, just
  reorders when it happens.
- [Moving `isTechnicalItem` changes `files/export.ts`'s public surface] → Mitigated by re-exporting it
  from `files/export.ts` if any other module imports it directly today (verify during implementation),
  so no import path breaks.

## Open Questions

None — both fixes are scoped enough that implementation can proceed directly into tasks.
