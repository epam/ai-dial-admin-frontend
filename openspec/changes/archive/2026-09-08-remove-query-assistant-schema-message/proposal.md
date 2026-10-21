## Why

The Query Builder's AI panel builds its own system message on the client, naming the selected entity and
listing every one of its columns, and prepends it to each request. The assistant deployment already owns a
system prompt of its own and reaches the analytics catalog through its own tools, so it can discover the
entity list and any entity's schema without being told. The client-built message therefore duplicates what
the deployment resolves for itself, and it grows the request body in proportion to the selected entity's
column count on every turn.

## What Changes

- The AI panel sends only the visible transcript — the accumulated user and assistant turns — to the
  `generateQuery` server action. No system message is constructed or sent by the admin console.
- `utils/ai-context.ts` (`buildSchemaSystemMessage`) and its spec are removed; the AI panel no longer reads
  `entityName` or `fields` from the query-builder context.
- **BREAKING** (behavioral, not API): the entity selected in the Query Builder toolbar is no longer
  communicated to the assistant. A request that does not name a source in its own text leaves the choice of
  entity to the deployment. Users who relied on "select the source, then ask" must name the source in the
  request, or accept whichever the deployment picks.
- `QueryAssistantRole.System` stays in the model: it still types assistant replies and keeps the request
  shape aligned with the chat-completions contract.

## Non-goals

- **Not a fix for the assistant's 500s.** The deployment currently fails a request when its model calls one
  of its tools by an unprefixed name; that name comes from the deployment's own prompt, not from the message
  removed here. Request bodies get smaller, the failure mode does not change.
- No change to the server action, `QueryAssistantApi`, the request URL, `stream: false`, the feature flag,
  or SQL extraction and the per-message Run / Copy actions.
- The SQL editor's schema-aware autocomplete keeps reading the selected source from the builder context;
  only the AI panel stops doing so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: removes the requirement that a request lead with a schema system message describing the
  selected source, and drops the assistant from the two requirements that reference it — the primary-source
  consumer list and the context-reading requirement — and from the Generate requirement's message ordering.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Ai/AiPanel.tsx` — sends the transcript alone;
  loses its `useQueryBuilder` read.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/ai-context.ts` and
  `utils/tests/ai-context.spec.ts` — deleted.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Ai/tests/AiPanel.spec.tsx` — the schema-message
  assertions are replaced by one asserting the transcript is sent unprefixed.
- `openspec/specs/analytics/spec.md` — one requirement removed, three amended.
- No server-side, i18n, or environment-variable change. `DIAL_QUERY_ASSISTANT_DEPLOYMENT` and
  `DIAL_CORE_API_URL` keep their current roles, so `docs/` needs no update.
