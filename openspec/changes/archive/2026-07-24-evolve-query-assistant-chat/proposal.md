## Why

The Query Assistant AI view (shipped in the archived `add-analytics-query-assistant` change) is
one-shot: each "Generate query" call replaces the previous proposal, and there is no way to react to a
bad or partial reply except retyping the whole request from scratch. The underlying app can also reply
with something other than a query — a clarifying question, a caveat — which today just shows as inert
text with no way to respond. And because only one proposal exists at a time, a user who wants to
compare or run more than one candidate query from the same exploration has no path to do so; only the
newest one is ever runnable. Turning the one-shot exchange into a real conversation, and letting any
query surfaced during that conversation be run (not just the latest), removes both limitations.

## What Changes

- **Chat transcript replaces the single proposal/reply slots.** The AI panel renders the full
  `messages` history as user/assistant bubbles instead of collapsing it into a single `proposedSql` /
  `rawReply` pair. The prompt textarea + suggested-prompt chips move below the transcript and become a
  persistent follow-up input (relabeled Send once a conversation has started), so a user can add detail
  or respond to a clarifying question in place, in the same thread.
- **Per-message SQL extraction.** `extractSql` runs against each assistant message's content
  individually (still last-fenced-block-wins, untagged fallback, `null` if none), not once against a
  single latest reply. An assistant turn with no extractable SQL renders as a plain bubble with no run
  affordance — it does not clear or otherwise affect any previously surfaced query.
- **BREAKING: inline Run per message replaces the toolbar Run for the AI view.** Each assistant message
  that has extracted SQL gets its own small inline Run control. The toolbar Run/Copy actions no longer
  apply when the AI view is active — there is no single "the loaded query" arming a shared Run button.
  This lets any query from the conversation be run, not only the most recent.
- **BREAKING: no more automatic load on generate.** Today a successful generation immediately hydrates
  the Builder/JSON/SQL views (no Apply step). That auto-load is removed: a query only reaches the
  Builder/JSON/SQL views when its message's inline Run is clicked. That click both loads (existing
  translate-to-builder-or-fallback-to-SQL path, unchanged) and executes (existing
  `executeQuery`/`executeSqlQuery` paths, unchanged) the query in one action. The most recently run
  message is visually marked so it is clear which turn the other views and Copy now reflect.
- **No change to the feedback transport.** A bad or incomplete result is handled by the user typing a
  follow-up message ("that returned 0 rows, drop the date filter") — a plain next turn, not a special
  flow. The full accumulated `messages[]` continues to be sent on every follow-up call, exactly as
  today; no run outcome (error, row count, result sample) is ever auto-injected into the conversation.

## Non-goals

- **No automatic feedback injection.** Run results/errors are never fed back into the assistant
  conversation automatically; the user describes the issue themselves in a follow-up message.
- **No streaming.** Replies are still fetched non-streamed (`stream: false`).
- **No editing of proposed SQL inline.** Still Copy-to-SQL-view for hand edits.
- **No changes to Builder/JSON/SQL's own run/translate behavior**, to the transport/model contracts
  (`QueryAssistantApi`, `ChatCompletionResponse`, gating), or to result rendering (`ResultArea` is
  unchanged; a run from any message renders there like any other run).
- **No conversation persistence.** The thread lives in component state and is still cleared on entity
  change (`resetAiQuery` + panel remount keyed by `state.entityName`), exactly as before.

## Capabilities

### Modified Capabilities

- `analytics`: the Query Builder AI view moves from a single-shot generate/apply flow to a multi-turn
  chat transcript with per-message run affordances. Modifies the requirements "AI panel accepts a
  plain-language prompt with suggestions," "Generate calls the assistant and shows the proposed query,"
  "SQL is extracted from the assistant reply," and "A generated query loads automatically into the
  builder" (the last one is superseded by per-message Run — see design.md).

## Impact

- **Modified components**: `QueryBuilder/Ai/AiPanel.tsx` (transcript rendering, per-message extraction,
  inline Run, follow-up input) and its spec; `QueryBuilder.tsx` (drops the single
  `aiGeneratedSql`/`aiRepresentable` "latest generation" model in favor of "last message Run," removes
  the AI-view branch from the toolbar `onRun`/`runDisabled`/Copy wiring); `QueryBuilderToolbar.tsx`
  (Run/Copy no longer rendered — or rendered disabled-and-inert — when the AI view is active, needs a
  decision in design.md).
- **i18n**: new keys under `QueryBuilderI18nKey` for chat-specific copy (Send label, per-message Run
  label, "loaded" badge/indicator); some existing AI keys (e.g. the current run-hint text) may be
  repurposed or dropped.
- **No impact** on the transport (`QueryAssistantApi`, `generateQuery` action), gating
  (`queryAssistantEnabled`), models (`QueryAssistantMessage`, `ChatCompletionResponse`), or the
  Builder/JSON/SQL views' own behavior.
