## Context

`src/app/[lang]/assets-toolsets/actions.ts` mirrors `prompts/actions.ts`'s CRUD+move shape almost exactly: `getToolsets` (list), `createToolset`/`updateToolset` (with payload shaping via `getAllowTools`/`getTransport`), `getToolset` (list-then-filter single get), `removeToolset`/`bulkDeleteToolsets`, `moveToolsets`. It additionally exposes five operations this change does not touch: `importToolsets`, `exportToolsets`, `getAssetTools`, `tryOutAssetTool`, `signInToolset`, `signOutToolset` — each belongs to a different BE subsystem (import/export streaming, MCP tool discovery/call, or the dedicated `ResourceCredentialService`), not the `ToolSetResourceService` CRUD this change ports.

The BE's `ToolSetResourceService` is structurally near-identical to `ApplicationResourceService` minus two things: no validity-state resolver call on get, and `callTool`'s transport comes directly from `toolSet.getTransport()` with no schema-fallback chain (Application falls back to its type-schema's MCP transport). Since call-tool is deferred here anyway, that asymmetry is `migrate-application-resources-to-core`'s concern, not this change's.

## Goals / Non-Goals

**Goals**
- `getToolsets`, `createToolset`, `getToolset`, `updateToolset`, `removeToolset`, `bulkDeleteToolsets`, `moveToolsets` call the Core toolset-resource client instead of `assetsApi`.
- Preserve conditional-header semantics exactly (same as prompts: create → `If-None-Match: *`, update/delete → `If-Match`).
- Zero change to `Toolsets/List`/`Toolsets/View`, `Toolset`/`AssetToolset`, or routes.
- Hard cutover for the seven CRUD+move operations; no flag.

**Non-Goals**
- Import/export/zip-preview, discovered-tools, call-tool, sign-in/sign-out — all deferred per proposal.
- Building any client/mapper logic — owned by `add-core-asset-client`.
- Folders/rules.

## Decisions

### D1 — Hard cutover, same shape as prompts' D1
No feature flag. The seven toolset-resource actions call the Core client unconditionally once this lands. `assetsApi` stays alive for application-resource and file; only toolset-resource CRUD call sites move (conversation and prompt already moved).

### D2 — No default-path/limit injection (unlike conversation/prompt)
The BE's `ToolSetResourceService.getMetadata` does not default `path` or `limit` — confirmed distinct from `ConversationService`/`PromptService`. This change relies on `add-core-asset-client`'s per-type registry (design D7 there) correctly omitting defaults for toolset-resource; it does not add defaulting here.

### D3 — `getToolset`'s list-then-filter path resolution is preserved (same reasoning as prompts' D2)
Kept for the same reason: the returned `path` field is guaranteed correct; hand-building it from `folderId`/`name`/`version` risks an encoding mismatch with no fixture to catch it in this change.

### D4 — Payload-shaping helpers (`getAllowTools`, `getTransport`) stay untouched
These run in `assets-toolsets/actions.ts` before the create/update call to derive `allowedTools`/`transport`/`displayVersion` on the payload. They are pure functions independent of which client sends the request; this change only swaps the client call, not the payload shaping.

## Risks / Trade-offs

- **[Risk] Deferred five operations still call the admin BE while CRUD is Core-backed** — `assets-toolsets/actions.ts` ends this change with a split backend (CRUD → Core, auth/discovery/import-export → BE). Acceptable short-term inconsistency, same pattern already accepted for prompts' import/export deferral; the fast-follow closes it.
- **[Trade-off] Splitting sign-in/out + discovered-tools/call-tool into one deferred bucket** rather than two separate fast-follows — they're unrelated subsystems (credential storage vs. MCP proxy) bundled only because both are "not CRUD." If either turns out substantial on its own, split them when that fast-follow is proposed.

## Migration Plan

1. Confirm `add-core-asset-client` has landed; read its toolset-resource client and mapper exports.
2. Swap the seven `assetsApi` calls in `assets-toolsets/actions.ts`.
3. Confirm `getAllowTools`/`getTransport` payload shaping still runs before the Core call, unchanged.
4. Update `assets-toolsets/actions.spec.ts` to mock the Core client for the seven migrated actions; leave the five deferred actions' tests targeting `assetsApi` as-is.

## Open Questions

None outstanding.
