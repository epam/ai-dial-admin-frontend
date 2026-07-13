## Context

The FE's conversation surface is narrower than the other four asset types: `src/app/[lang]/conversations/actions.ts` exports exactly four server actions — `getConversations` (list), `getConversation` (single, with etag), `deleteConversation` (single, conditional), `deleteConversations` (bulk). There is no create/update/move action anywhere in `src/components/Assets/Conversations/`. The BE mirrors this: `ConversationService` does implement `putConversation`, but nothing in the FE calls the equivalent BE endpoint — conversations are end-user chat history that admins browse and moderate (view/delete), not author.

`add-core-asset-client` (prerequisite, currently spec-only) provides: the generic Core client (content+metadata GET, PUT, DELETE, keyed by `ResourceType`), the consolidated version-path helper, the conversation content+metadata mapper, and default path/limit injection for conversation reads. This change's job is narrow: replace the `assetsApi` calls in the four existing server actions with that client, and confirm nothing else references `ResourceType.CONVERSATION` under the hood.

## Goals / Non-Goals

**Goals**
- `getConversations`, `getConversation`, `deleteConversation`, `deleteConversations` call the Core conversation client instead of `assetsApi`.
- Zero change to `ConversationsList`, `ConversationView`, the `DialConversation` model, or the `/conversations` routes — this is a server-internal cutover, same framing as `migrate-publications-to-core-api`.
- Hard cutover: no flag, no BE fallback, BE-backed conversation code path removed once this lands.

**Non-Goals**
- Building any client/mapper logic — entirely owned by `add-core-asset-client`.
- Adding create/update/move for conversations — out of scope; not a current FE feature.
- Folders/rules — separate change.

## Decisions

### D1 — Hard cutover, mirroring `migrate-publications-to-core-api`'s D2
No feature flag. The four conversation server actions call the Core client unconditionally the moment this change lands. Note: `assetsApi`'s methods are generic across `ResourceType`, not conversation-specific branches — `getAssetList`'s paginated `else` branch, `getAssetWithEtag`, `removeAssetWithEtag`, and `bulkDeleteAssets` are all shared with application-resource, toolset-resource, and prompt. Nothing is deleted from `assetsApi` itself in this change; it stays fully alive for the other three types. This change only stops *conversations* from calling it, by routing the four conversation actions elsewhere.

### D2 — List path defaulting is consumed, not re-implemented
`getConversations(path)` passes whatever path the caller supplies (a real folder path in the `[id]/page.tsx` sibling-list case, or the browse root in `ConversationsList`). Whether an empty/root call should default to `"public/"` is `add-core-asset-client`'s registry behavior (already specced there); this change verifies via its own tests that an empty-path call to the wired action produces the same list the BE-backed path produced today, without re-deciding the default here.

### D3 — Delete stays conditional; bulk delete has no per-item etag today
`deleteConversation(path, etag?)` already accepts an optional etag and calls `removeAssetWithEtag`, which falls back to `DEFAULT_ETAG` (`*`) when omitted — that behavior carries over unchanged to the Core client's `If-Match` handling (a `*` sentinel etag means "no header", per `add-core-asset-client`'s D4). `deleteConversations` (bulk) takes bare paths with no etag today; this change does not add per-item etags — it preserves the existing unconditional-bulk-delete behavior, now expressed as `If-Match: *` (no header) per path through the Core client.

## Risks / Trade-offs

- **[Risk] `add-core-asset-client` ships with a different exported shape than assumed** (e.g., per-type classes instead of a `ResourceType`-keyed registry) → **Mitigation**: this change's task list starts with re-reading that change's actual implementation (not just its spec) before touching `actions.ts`.
- **[Trade-off] Narrow scope means low derisking value for the harder types** — conversations don't exercise create/update/move/import-export, so this change alone doesn't validate those paths for application-resource/toolset-resource/prompt/file. Accepted: the goal here is proving list/get/delete wiring works end-to-end quickly, not front-loading every pattern.

## Migration Plan

1. Confirm `add-core-asset-client` has landed and read its actual conversation-client + mapper exports.
2. Swap the four `assetsApi` calls in `conversations/actions.ts` for the Core client.
3. Run the existing `conversations/actions.spec.ts` (adapted to mock the Core client) plus any new unit tests; no BE fallback to compare against beyond manual smoke-check against a running Core instance.

## Open Questions

None outstanding — the `assetsApi` sharing question is resolved (D1): `assetsApi` stays untouched for the other three types since its methods are generic, not conversation-specific.
