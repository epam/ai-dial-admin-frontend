## Why

The conversations view reads the `conversations` rollup, which is grouped by `chat_id` and therefore sees
only DIAL Chat traffic. Work done through a coding agent — Claude Code, Codex, OpenCode — carries no
`chat_id` on most of its hops and is invisible to the view entirely: measured on the dev instance, 1 250
agent sessions over the last eleven days that no page of this console can reach.

The analytics service now materializes a `sessions` rollup that mirrors `conversations` measure for measure
while keying on the client's own session id, so the same view can cover both populations without a second
page, a second grid, or a second query layer.

## What Changes

- The conversations view's base entity moves from `conversations` to `sessions`. The list query, the totals
  query, the single-conversation query and the column catalog all follow the entity, so they inherit the
  agent-session population without further work.
- The identity field moves from `chat_id` to `client_session_id`. The service reports
  `client_session_id == chat_id` for every chat session, so a conversation keeps the same id it has today and
  every existing link, filter and rating lookup resolves unchanged.
- The insight columns move from the `conversation_insights.` namespace to `session_insights.`.
- The trace, span, hop and body queries — all against `dial_usage_log` — move their scoping predicate from
  `chat_id` to `usage_client_identity.client_session_id`. **This is the edit that makes an agent session's
  trace reachable at all**: those rows carry an empty `chat_id`, verified against dev.
- **BREAKING** for one column: `sentiment_score` has no counterpart in `session_insights`, so the sentiment
  score leaves the detail panel. It drops through the existing schema-intersection path rather than erroring.
- Ratings and the feedback filter stay chat-only. `response_ratings` is keyed on rated responses of chat
  traffic, so an agent session has no rating to show and its rating cells render the existing unavailable
  placeholder. The two-step feedback query itself is unchanged.

### Non-goals

- **History depth.** `sessions` begins 2026-08-12 where `conversations` begins 2026-07-01, because the
  identity enrichment it depends on was backfilled only that far. The user has explicitly ruled this out of
  scope; it resolves itself as the backfill extends, with no frontend change.
- **Renaming the surface.** The route `/conversations-trace`, the `ConversationsTraceI18nKey` group and the
  `analytics/conversations` storage key keep their names. Renaming them is a larger, purely cosmetic change
  and would discard every operator's saved column state.
- **New columns for the session-only fields.** `client_type`, `client_types`, `auth_types`, `user_ref` and
  `user_refs` arrive in the column catalog through the existing schema-driven path and are selectable there.
  Promoting any of them to a curated column is separate work — and `client_type` is not fit for it as it
  stands: it is a `max()` over the session's hops, so it labels a router-wrapped chat conversation
  `claudecode`. Two of three conversations sampled on dev were mislabelled this way.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the conversations view's base entity, identity field, insight namespace and hop-query scoping
  key all change, and the view's population widens from chat conversations to client sessions. Affects the
  list query, the single-conversation query, the schema-gating rule, the trace-listing scope invariant, the
  transcript assembly, the provenance line, the detail panels and the grid's column attribution.

## Impact

- `src/constants/analytics/conversations-trace.ts` — `CONVERSATIONS_ENTITY`, `ENRICHMENT_PROVENANCE`.
- `src/models/analytics/conversations-trace.ts` — `ConversationsField` (identity and the eight `Insight*`
  values), `ConversationRow`.
- `src/models/analytics/conversations-trace.ts` — a `UsageLogField` value for the identity enrichment column.
- `src/utils/analytics/conversations-queries.ts` — the six hop-query scoping predicates.
- `src/app/[lang]/conversations-trace/actions.ts` and `src/utils/analytics/conversation-rows.ts` — the three
  literal `row.chat_id` reads the enum does not cover.
- No API-client, auth or routing changes. No change to the `response_ratings` or `dial_usage_log` query
  shapes beyond the one renamed predicate field.
- The entity-schema endpoint reports no identity or grain marker, so the row key cannot be derived from the
  schema and stays a frontend constant — repointed, not made dynamic.
