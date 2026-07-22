## Context

`changeFolderCore` (`apps/ai-dial-admin/src/server/folders/folders-core.ts:188-230`) is the single function behind both folder rename and folder move-to-folder, for every Assets resource type. Its call sites (`BaseAssetList.tsx:319-334`, `Files/List.tsx:200-210`) pass `folder.sourceUrl`/`folder.destinationUrl` straight from the ui-kit `FileManager`'s `onMoveToFiles` callback — the same callback fires for both a drag/cut-paste move and a rename, so both operations land in `changeFolderCore` with an `oldPath`/`newPath` pair whose trailing-slash shape is whatever the ui-kit produced (not guaranteed consistent — call sites only do a `.replaceAll('//', '/')` collapse, no slash normalization).

Inside the function, for every descendant resource URL gathered under `oldPath` (including the hidden `.dial_folder` marker resource that represents an otherwise-empty folder), the destination path is computed as:

```ts
const destinationPath = barePath.replace(oldPath, newPath);
```

`String.prototype.replace` with a string argument matches the **first literal occurrence** of `oldPath` anywhere in `barePath` — it has no concept of a path-segment boundary and doesn't care whether `oldPath` ends in `/`. Two concrete failure modes follow directly:

1. If `oldPath` and `barePath` disagree on trailing slash (e.g. `oldPath = "bucket/als_code_apps"`, `barePath = "bucket/als_code_apps/als-quickapp20"`), the substring `"bucket/als_code_apps"` still matches at index 0, and `newPath` (say `"bucket/renamed"`, no trailing slash) replaces it — producing `"bucket/renamedals-quickapp20"` with the folder name glued directly onto the child's name. This is the `als_code_apps` + `als-quickapp20` → `als_code_appsals-quickapp20` symptom in #3974, and the `.dial_folder`-as-file symptom in #3983 (same mechanism applied to the marker resource).
2. If normalization elsewhere causes `oldPath` and `barePath`'s representation of that prefix to differ in any other way (encoding, double slash collapse timing), `.replace()` silently no-ops — the descendant keeps its old path, falls out of the renamed/moved subtree, and later parent-path resolution (`FileManager.tsx:172`'s `getParentPathByFullPath(...) || ROOT_FOLDER`) falls back to `public/`.

The codebase already has a segment-aware helper, `changeFolderName(oldPath, newFolderName)` (`apps/ai-dial-admin/src/utils/files/path.ts:39-45`), but it solves a *different* sub-problem: given a folder's own full path, replace its **last segment** with a new name. It does not perform prefix substitution across a descendant's full path, so it cannot be dropped in as-is for the per-descendant rewrite loop — the actual gap is a missing **prefix-rewrite** primitive.

## Goals / Non-Goals

**Goals:**
- Make `changeFolderCore`'s per-descendant destination-path computation segment-safe: only ever match `oldPath` as a genuine path-segment prefix of `barePath`, and always join the remainder onto `newPath` with exactly one `/`.
- Cover the case that has no test today: `oldPath`/`newPath` with mismatched trailing slashes.
- Cover the `.dial_folder` marker resource explicitly, since it's the descendant that produces #3983's "folder becomes a file" symptom.
- Keep `changeFolder`, `FoldersStorage`, `RuleFolderContext`, and all call site signatures unchanged — this is a pure internal correctness fix.

**Non-Goals:**
- No change to ai-dial-core or ai-dial-admin-backend. Core's `ResourceOperationService` already rejects folder-level moves by design and only ever sees correctly-computed single-resource move calls once this lands — that boundary is not being hardened as part of this change.
- No change to the "fail-fast, no rollback across resource types" behavior of `changeFolderCore`, and no change to rules-copying — those are existing, separately-specified behaviors in `folders-core-api`.
- No fix for the empty-branch file-rename no-op at `BaseAssetList.tsx:300-316` ("// Rename file") — that's a distinct gap (files can't be renamed at all today), not a corruption bug, and out of scope here.
- No change to the ui-kit `FileManager` itself or its `onMoveToFiles`/`useItemRenaming` contract.

## Decisions

**D1 — Introduce a dedicated segment-safe prefix-rewrite helper, don't force-fit `changeFolderName`.**
`changeFolderName` renames a path's terminal segment; the bug is in rewriting an *ancestor prefix* shared by many descendant paths. These are different operations with different signatures. Add a new helper (working name `replacePathPrefix(fullPath: string, oldPrefix: string, newPrefix: string): string`) to `apps/ai-dial-admin/src/utils/files/path.ts`, next to the existing path helpers, following `.claude/rules/utils.md` (pure, deterministic, named export, colocated unit tests).
- Alternative considered: extend `changeFolderName` to accept a full descendant path and do prefix replacement. Rejected — it would overload one function with two different contracts (rename-last-segment vs. replace-ancestor-prefix) and make both harder to reason about and test.
- Alternative considered: fix in place inside `folders-core.ts` without extracting a utility. Rejected — this is exactly the kind of pure path-string logic `.claude/rules/utils.md` says belongs in `utils/`, and extracting it gives isolated, fast unit tests independent of the async Core-calling machinery in `folders-core.ts`.

**D2 — Normalize trailing slash before comparing, at the boundary where `oldPath`/`newPath` enter `changeFolderCore`.**
Both `oldPath` and `newPath` represent folders and should be treated as always having exactly one trailing `/` for the purpose of prefix matching. `replacePathPrefix` normalizes both its `oldPrefix` and the prefix portion of `fullPath` internally (reusing/paralleling `removeTrailingSlash`/`addTrailingSlash` already in this codebase) rather than trusting callers to pass consistent slashes — the current bug exists precisely because callers (ui-kit-driven `BaseAssetList.tsx`) don't guarantee that.

**D3 — Segment-boundary match, not substring match.**
`replacePathPrefix` must confirm `fullPath` starts with `oldPrefix` (slash-normalized) as a full path segment sequence — e.g. via splitting both on `/` and comparing segment arrays — not via `startsWith` on raw strings, to avoid a different but related bug class (e.g. `oldPath = "bucket/foo"` wrongly matching `"bucket/foobar/..."`). This closes a latent issue beyond the two reported bugs but is the same boundary check needed to fix them correctly.

**D4 — Fail loudly instead of silently no-op-ing when a descendant's path doesn't actually start with `oldPath`.**
Today's `.replace()` silently returns `barePath` unchanged when there's no match, which is how items "disappear" (they keep their old path but the UI now expects them under the new tree) and fall back to being displayed under `public`. `replacePathPrefix` throws (or `changeFolderCore` treats a non-matching descendant as a hard per-item failure, consistent with the existing fail-fast/no-rollback semantics in `folders-core-api`) rather than returning a guessed or unchanged path. This surfaces future bugs as errors instead of silent data misplacement.
- Alternative considered: keep the current best-effort silent behavior to avoid changing observable behavior on edge cases. Rejected — silent misplacement into `public/` is itself the bug being fixed; a loud failure on a genuinely unexpected input is strictly safer than corrupting an unrelated public folder.

## Risks / Trade-offs

- **[Risk]** Making mismatched-prefix descendants a hard error could turn a previously-silent (if wrong) partial success into a visible failure mid-move, for some edge case not covered by the two reported bugs. → **Mitigation**: `changeFolderCore` already has fail-fast, no-rollback semantics for cross-type failures (per `folders-core-api`'s existing "A failure partway through leaves earlier types moved" scenario) — this change is consistent with, not a departure from, that existing contract at the per-resource-type level; we're only removing a silent-corruption path within a single type's descendant loop.
- **[Risk]** The `.dial_folder` marker resource may have subtly different path shape than a "real" resource path (e.g. no encodable content beyond the marker name) that the new segment-based check doesn't anticipate. → **Mitigation**: explicit test case for the marker resource in `folders-core.spec.ts`, verified against the current `RESOURCE_TYPE_PREFIX`/`decodeCorePath`/`stripPrefix` pipeline already in `folders-core.ts`.
- **[Trade-off]** Adding a new utility function instead of patching `folders-core.ts` inline is slightly more surface area, but keeps the fix unit-testable in isolation per `.claude/rules/utils.md`, which is worth the extra file for logic this easy to get subtly wrong twice.

## Migration Plan

No data migration. This is a pure code-path fix with no schema, storage, or API contract change — deploy as a normal frontend release. No rollback concerns beyond a standard revert, since no persisted data format changes.

## Open Questions

- None outstanding — scope is confirmed limited to `apps/ai-dial-admin` per user decision; ai-dial-core and ai-dial-admin-backend are explicitly out of scope for this change.
