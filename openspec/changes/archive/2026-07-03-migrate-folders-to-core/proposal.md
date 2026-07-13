## Why

Folders are the last piece of the assets domain still on the admin BE (`foldersApi` → `/api/v1/folders/*`), and they're the capstone for a reason discovered during the earlier per-type migrations: `FolderService` doesn't talk to Core directly at all for two of its five operations. Rule updates and folder delete are actually built on the **publication** create+approve flow (`PublicationService.createPublication`/`approvePublication`), and folder listing/move fan out across all five resource types. This change is only possible now that conversation, prompt, toolset-resource, application-resource, and file are all Core-backed, and it surfaces one more gap: `migrate-publications-to-core-api` deliberately did not port `createPublication` (its Non-goals: "admins review/approve, never create here") — this change is the first real caller of `create`, so it adds that method to `CorePublicationsApi`.

## What Changes

- **Cut folder list, delete (unpublish), and move over to Core**, replacing `foldersApi.getFolders`/`deleteFolder`/`changeFolder` with logic built on the five already-migrated per-type Core clients.
- **Cut rules get over to Core**, adding a `ruleList` method to `CorePublicationsApi` for `POST /v1/ops/publication/rule/list` — an endpoint `migrate-publications-to-core-api`'s own design doc already identified in its cutover map as a Phase 1 Core target, but left unwired because nothing consumed it at the time (folders stayed on the BE). This change is that first consumer.
- **Cut rules update and folder delete over to Core publications' create+approve**, adding `createPublication` to `CorePublicationsApi` — the one publication operation `migrate-publications-to-core-api` explicitly deferred ("admins review/approve, never create here"), now needed because folder rules and folder-delete both drive it under the hood.
- **Port cross-type recursive URL gathering** (`getResourceUrls`): to move or unpublish a folder, the system must recursively list every resource under it, across all five types, and flatten the tree into a URL set — logic with no prior FE precedent since no earlier change needed a recursive, cross-type listing.
- **Preserve the BE's fan-out semantics**: folder listing merges results from all five types and validates cross-type consistency (name/parentPath/bucket/path must agree); folder move validates the folder exists in every targeted type before moving, copies rules to the new path, then moves each type's resources sequentially, fail-fast, no cross-type rollback — matching current behavior exactly, not improving on it.
- **Preserve unpublish's best-effort cleanup**: after the publish-delete-and-approve step, `unpublishFolder` best-effort deletes the folder from each type's storage, swallowing all exceptions (documented BE workaround for Azure Blob Storage hierarchical-namespace empty-folder quirks).
- **Hard cutover, no fallback** — same framing as every prior change in this series.

## Capabilities

### New Capabilities
- `folders-core-api`: folder listing (cross-type merge), rules get/update (via Core publications create+approve), and folder delete/move (cross-type fan-out with unpublish-via-publication semantics) executed directly against DIAL Core, replacing the admin-BE proxy, while `FoldersStorage`/`RuleFolderContext`, routes, and the `folders-storage/actions.ts` signatures stay identical.

### Modified Capabilities
<!-- publications-core-api hasn't been archived to openspec/specs/ yet (migrate-publications-to-core-api is still pending), so there's no base spec to delta against. The createPublication/ruleList additions to CorePublicationsApi are captured as a requirement under this change's own folders-core-api spec instead; fold them into publications-core-api's spec when that capability is archived. -->


## Impact

- **Modified code:**
  - `src/app/[lang]/folders-storage/actions.ts` — `getFolders`, `getRules`, `updateRules`, `removeFolder`, `changeFolder` call Core-backed logic instead of `foldersApi`
  - `src/server/entities/core-publications-api.ts` — add `createPublication`
  - New: a folder orchestration module (exact location decided in design) implementing cross-type merge, recursive URL gathering, and the move/unpublish fan-out, built on the five per-type Core clients from `add-core-asset-client` and the per-type migrations
- **Unchanged:** `FoldersStorage` components, `RuleFolderContext`/`PromptFolderProvider`, the `/folders-storage` route(s), `DialFolder`/`DialRule` models.
- **Explicitly not touched by this change** (stays deferred to the corresponding per-type fast-follows): `createFolderWithFiles`, `previewPromptZip`, `previewAppZip`, `previewToolsetZip` — these are import operations scoped by view (`buildCreateFolderUrl` routes to each type's import endpoint), not folder-specific logic; they ride on the same import work already deferred in `migrate-prompts-to-core`/`migrate-toolset-resources-to-core`/`migrate-application-resources-to-core`'s fast-follows.
- **Hard dependency:** all five per-type changes (`migrate-conversations-to-core`, `migrate-prompts-to-core`, `migrate-toolset-resources-to-core`, `migrate-application-resources-to-core`, `migrate-files-to-core`) and `migrate-publications-to-core-api` must be implemented first.
- **Auth:** forwards the logged-in user's JWT via the existing Core client pipeline throughout.

## Non-goals

- `createFolderWithFiles` and the three `previewXZip` actions — deferred to the respective per-type import fast-follows (prompts, toolsets, application-resources), not reimplemented here.
- Improving the BE's fan-out consistency model (sequential, fail-fast, no rollback across types; best-effort exception-swallowing on unpublish cleanup) — ported as-is, not hardened, since correctness parity is this change's bar, not a redesign.
- `migrate-publications-enrichment-to-core` — a separate, already-proposed change; this change only adds `createPublication`, which that change does not need.
- Any change to `FoldersStorage`/rules UI, columns, or i18n.
