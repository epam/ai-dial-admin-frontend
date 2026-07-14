## Context

`src/app/[lang]/folders-storage/actions.ts` exposes: `getFolders`, `getRules`, `updateRules`, `createFolderWithFiles` (deferred, see proposal), three `previewXZip` actions (deferred), `removeFolder`, `changeFolder`. The BE's `FolderService` backing these is a pure orchestrator — it makes **zero** direct Core calls itself; every operation fans out to the five per-type `ResourceService` implementations (`FileService`, `ConversationService`, `PromptService`, `ApplicationResourceService`, `ToolSetResourceService`, all now Core-backed by the five prior changes) or to `PublicationService`:

- `getFolders(request)` — calls `getFolders` on all five services, merges into one tree, validates name/parentPath/bucket/path agree across types.
- `getRules(path)` / `updatesRules(request)` — thin delegate to `PublicationService.getRules` (Core `rule/list`) and a create+auto-approve publication (Core `create`+`approve`) respectively. No cross-type fan-out here — this is purely a publications concern wearing a folder-shaped API.
- `unpublishFolder(path)` (behind the FE's `removeFolder` → BE `DELETE /folders`) — gathers every resource URL under the folder across all five types (`getResourceUrls`: recursive metadata walk, flattens FOLDER/ITEM tree, swallows not-found into empty set), builds a DELETE-action publication resource list, creates+approves it, then best-effort deletes the folder from each type's own storage, swallowing all exceptions (documented Azure Blob Storage empty-folder quirk workaround).
- `moveFolder(request)` (FE's `changeFolder`) — validates the folder exists in every targeted type (defaults to all five if unspecified), copies rules from old to new path (replays `updatesRules`), then moves each type's resources sequentially (`getResourceUrls` per type → per-URL `move` with `CoreMetadataUtils.replacePathSegment` for the destination), fail-fast, no rollback.

Two gaps exist that no prior change filled:
1. **`createPublication` was never ported.** `migrate-publications-to-core-api` explicitly scoped it out because the FE's publication-review UI never creates publications — only this folder flow does, indirectly.
2. **Recursive, cross-type URL gathering (`getResourceUrls`) has no FE precedent.** Every per-type migration built list/get/create/update/delete/move for its own type; none needed to recursively walk a folder tree and flatten it into a flat URL list across types.

## Goals / Non-Goals

**Goals**
- `getFolders`, `getRules`, `updateRules`, `removeFolder`, `changeFolder` call Core-backed logic instead of `foldersApi`.
- Preserve the BE's exact fan-out semantics: cross-type consistency validation on list, sequential fail-fast fan-out on move, best-effort exception-swallowing on unpublish cleanup.
- Add `createPublication` and `ruleList` to `CorePublicationsApi`.
- Build the recursive URL-gathering helper once, shared by unpublish and move (both need it).

**Non-Goals**
- Import-related folder actions (`createFolderWithFiles`, `previewXZip`) — deferred to per-type fast-follows.
- Hardening the fan-out model (adding rollback, parallelism, etc.) — out of scope; parity, not improvement.
- `migrate-publications-enrichment-to-core`'s own scope (resolver re-point) — unaffected by this change.

## Decisions

### D1 — `createPublication` added to `CorePublicationsApi`, scoped narrowly
Add a `createPublication(publication)` method calling Core `POST /v1/ops/publication/create`, matching the shape publications' own design doc already sketched for its cutover map but never implemented. It is used **only** by this change's rules-update and unpublish flows — not exposed to any publication-authoring UI, since none exists.

### D2 — `ruleList` added to `CorePublicationsApi` for folder rules
Add `ruleList(path)` calling Core `POST /v1/ops/publication/rule/list`, replacing `foldersApi.getRules`'s BE delegate. This is a straight 1:1 port — no BE-side transformation beyond the request/response shape publications' Phase 1 client-error-normalization (`CoreApi`'s `D9`) already handles generically.

### D3 — Recursive URL gathering ported as one shared helper, not five per-type copies
The BE's `ResourceService.getResourceUrls` default method is generic — it walks a service's `getMetadata(path, recursive=true)` result tree (FOLDER nodes recursed into, ITEM nodes collected as URLs), and is inherited identically by all five services. Port it once as a function that takes a per-type "recursive metadata read" callback (the five per-type Core clients already built) and returns a flat URL list, reused by both `unpublishFolder`'s URL-gathering and `moveFolder`'s per-type move. Not-found errors during the walk are swallowed to an empty result, matching the BE.

### D4 — Cross-type list merge and consistency validation ported as-is
`getFolders` calls each type's folder-listing, filters nulls, and merges into one tree; if two types disagree on `name`/`parentPath`/`bucket`/`path` for what should be the same folder, the BE throws `IllegalArgumentException`. Port this as a hard validation error (not a silently-resolved merge) — surfacing a real data-inconsistency loudly is the BE's existing behavior, not a defect to soften.

### D5 — Move fan-out stays sequential and fail-fast, matching the BE exactly
`moveFolder` first validates existence in every targeted type (or all five, if `resourceTypes` is omitted), then copies rules, then moves each type's resources one at a time, stopping on the first failure with no rollback of types already moved. This is a real limitation of the current system (a partial move can leave a folder split across types with no way back except manual repair) — ported unchanged per Non-goals, not a place for this change to introduce transactional guarantees the BE never had.

### D6 — Unpublish's exception-swallowing cleanup step is ported unchanged, with a comment explaining why
`unpublishFolder`'s final step (best-effort per-type delete after the publish-delete-approve) silently swallows every exception, which looks like a bug in isolation but is a documented workaround for Azure Blob Storage's hierarchical-namespace empty-folder semantics. Port with the same behavior and preserve the BE's rationale as a comment, so a future reader doesn't "fix" it into a hard failure.

## Risks / Trade-offs

- **[Risk] `createPublication`'s validation/shape drifts from what `approvePublication` (already built) expects**, since this change is the first to chain create→approve end-to-end in the FE. → **Mitigation**: task list requires an integration-style test chaining create then approve against fixtures, not just unit-testing each method in isolation.
- **[Risk] The shared recursive-walk helper (D3) diverges subtly per type** if a per-type Core client's metadata-read signature isn't uniform enough to share one walker. → **Mitigation**: confirm the five per-type clients expose a common `getMetadata(path, { recursive })`-shaped call before committing to one shared helper; if one type's shape doesn't fit, adapt at the call site rather than forcing a leaky abstraction.
- **[Trade-off] Preserving the BE's non-transactional fan-out** means this migration inherits, not fixes, a known fragility (partial folder move/unpublish across types). Accepted per Non-goals — this change's job is parity.

## Migration Plan

1. Confirm all five per-type changes and `migrate-publications-to-core-api` have landed.
2. Add `createPublication` and `ruleList` to `CorePublicationsApi`.
3. Build the shared recursive URL-gathering helper (D3) against the five per-type Core clients.
4. Wire `getFolders` (cross-type merge + validation, D4), `getRules`/`updateRules` (D1/D2), `removeFolder` (unpublish: D3 + create/approve + D6's best-effort cleanup), `changeFolder` (D5's fan-out + rules copy).
5. Full test pass, including the create→approve integration case and a multi-type consistency-violation case for `getFolders`.

## Open Questions

None outstanding.
