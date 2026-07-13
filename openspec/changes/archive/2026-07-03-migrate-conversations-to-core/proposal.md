## Why

Conversations are the second-smallest asset surface still proxied through the admin BE (`assetsApi` → `GET/POST /api/v1/conversations/*`), and the FE only ever lists, views, and deletes them — there is no create/update/move exposed anywhere in the UI. That makes conversations the cleanest first consumer of `add-core-asset-client`'s generic client: it proves the wiring pattern (list with default-path injection, conditional-GET view, conditional-delete) without also having to prove create/update/move, which the other four asset types need.

## What Changes

- **Cut conversation list/get/delete over to Core**, replacing `assetsApi.getAssetList/getAssetWithEtag/removeAssetWithEtag/bulkDeleteAssets(ResourceType.CONVERSATION, ...)` with `add-core-asset-client`'s conversation client, in `src/app/[lang]/conversations/actions.ts`.
- **Hard cutover, no fallback** — matching `migrate-publications-to-core-api`'s D2: no feature flag, the BE-backed conversation path is removed outright once this lands. Views (`ConversationsList`, `ConversationView`), routes, the `getConversations`/`getConversation`/`deleteConversation`/`deleteConversations` server-action signatures, and the `DialConversation` model are unchanged.
- **List default-path/limit injection** for the conversations list, matching the BE's `ConversationService.getMetadata` defaulting path to `"public/"` and limit from config when the caller omits them (already built by `add-core-asset-client`; this change just confirms the conversations list actually relies on that default today via `getConversations` callers that pass a folder path or omit one).
- **Conditional delete via `If-Match`** for single and bulk delete, matching `ConversationService.delete`'s conditional-header support (unlike File, which the BE silently drops the etag for).

## Capabilities

### Modified Capabilities
<!-- No existing consolidated spec named "conversations" exists yet in openspec/specs/ — this is the first change to touch conversation behavior at the spec level, so it is additive, not a delta against a prior spec. -->

### New Capabilities
- `conversations-core-api`: conversation list, get, delete, and bulk-delete executed directly against DIAL Core via `add-core-asset-client`, replacing the admin-BE proxy, while the FE-facing `DialConversation` contract, routes, and server-action signatures stay identical.

## Impact

- **Modified code:**
  - `src/app/[lang]/conversations/actions.ts` — `getConversations`, `getConversation`, `deleteConversation`, `deleteConversations` call the Core conversation client instead of `assetsApi`
  - `src/app/api/api.ts` — wherever `assetsApi` is instantiated/exported, conversation operations now route through the Core client (exact shape depends on `add-core-asset-client`'s registry-vs-per-type-class decision)
- **Removed code:** none yet — `assetsApi`'s generic `ResourceType.CONVERSATION` branches become dead code for conversations specifically, but `assetsApi` itself stays alive for the other four types until each migrates; removal of the now-unused conversation branches happens as part of this change's cleanup, not a separate one.
- **Unchanged:** `ConversationsList`, `ConversationView` and its `Conversations.tsx`/`Properties.tsx`/`TabsContent.tsx`/`utils.ts`, `src/models/dial/conversation.ts`, the `/conversations` and `/conversations/[id]` routes.
- **Hard dependency:** `add-core-asset-client` must be implemented (client + version-path helper + conversation mapper) before this change's server-action wiring can start — it is currently spec-only.
- **Auth:** forwards the logged-in user's JWT via the existing Core client pipeline — no new credential.

## Non-goals

- Create, update, or move for conversations — not exposed in the FE today and not added by this change.
- Import/export of conversations — no such FE feature exists; not built here.
- Folders/rules for conversations — `migrate-folders-to-core` (separate, later change) owns cross-type folder behavior.
- Any other asset type (application-resource, toolset-resource, prompt, file) — each gets its own change.
- Any change to `ConversationsList`/`ConversationView` UI, columns, or i18n beyond what's needed to keep them working against the new data source.
