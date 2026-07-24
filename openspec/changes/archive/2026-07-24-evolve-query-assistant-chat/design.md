## Context

The AI view (`QueryBuilder/Ai/AiPanel.tsx`) currently keeps only the *latest* proposal: `messages`
grows on every Generate (already the full OpenAI `messages[]` contract), but the UI only ever shows
`proposedSql`/`rawReply` for the newest turn, and `onGenerated(sql)` fires automatically after every
successful generate, immediately loading the query into the parent's `aiGeneratedSql`/`aiRepresentable`
state and, from there, into the Builder/JSON/SQL views. The toolbar's single `Run` button then executes
whatever that latest generation produced (`QueryBuilder.tsx`'s `isAiView` branch in `onRun` and
`runDisabled`).

This change turns the transcript into the primary UI (every turn stays visible and respondable) and
moves the run trigger from the toolbar into the transcript itself, since more than one candidate query
can now exist in a single conversation and any of them must be runnable — not only the latest.

## Goals / Non-Goals

**Goals:**
- Render the full conversation, so a reply with no SQL (clarifying question, caveat) is just a normal
  turn the user can respond to in place.
- Let the user run *any* previously surfaced query from the thread, not only the newest.
- Keep the mental model to one control per concern: a message's inline Run both loads that query into
  Builder/JSON/SQL and executes it, in one click — no separate "select" step.
- Preserve the existing translate-to-builder-or-fallback-to-SQL path and execute paths unchanged;
  this is a UI/state reshuffle around them, not new query machinery.

**Non-Goals:**
- No automatic injection of run results/errors back into the conversation (proposal's non-goals).
- No streaming, no inline SQL editing, no persistence of the conversation across a page reload/entity
  change — same as before.
- No change to `QueryAssistantApi`, `generateQuery`, or the `ChatCompletionResponse`/`QueryAssistantMessage`
  models — the transport is unchanged.

## Decisions

### 1. Per-message rendering, no new parsing utility

`extractSql(content)` already operates on a single message's content and already implements
last-block-wins/untagged-fallback/null. Calling it once per assistant message (instead of once for "the
latest reply") is sufficient for the extraction rule itself.

For display, rendering `message.content` verbatim alongside a separate formatted SQL panel would show
the winning block twice — once as raw fenced text inline, once in the clean copyable panel. Revised
during implementation to avoid that: a new `splitMessageAroundSql(content)` util reuses the exact same
last-block-wins match `extractSql` uses, but also returns the prose before and after that block
(`{ before, sql, after }`). The bubble renders `before` (if any) as prose, the winning block once as a
formatted, copyable panel with Copy + Run, then `after` (if any) as prose — no duplication, no markdown
renderer added.

`extractSql` itself is unchanged (still the pure last-block-wins/untagged-fallback/null contract the
spec and its tests describe); `splitMessageAroundSql` is an additive sibling in the same file that
shares its matching logic rather than re-implementing it.

### 2. Message identity: array index

Turns are addressed by their index in `messages` when wiring Run (`onRunMessage(sql, index)`). The
array is append-only for the lifetime of a conversation (no edit/delete/regenerate of past turns), and
the whole panel remounts (`key={state.entityName}`) on entity change, so index is stable for as long as
it's referenced. No message-id scheme is introduced.

### 3. Inline Run replaces toolbar Run for the AI view; inline Copy replaces toolbar Copy too

Rather than a hybrid (toolbar Copy kept, only Run moved), **both** move inline, for one reason: the
toolbar's Copy today copies "the thing the current view represents," which is well-defined for
Form/JSON/SQL (one query per view) but not for AI (many candidate queries in one view). Per-message
Copy sidesteps the ambiguity instead of picking an arbitrary target (e.g. "whatever was last run").
Builder/JSON/SQL keep their own existing Copy once a query has actually been loaded there by a Run
click — nothing new needed on that side.

`QueryBuilderToolbar` gains `showRun?: boolean` (default `true`); `QueryBuilder.tsx` passes
`showRun={!isAiView}` and simply omits the `CopyButton` child when `isAiView` is true (the child is
already conditionally built in the parent — no toolbar change needed for Copy).

Alternatives considered:
- *Keep toolbar Run, add a "use this query" per-message action* (design's Approach B from the earlier
  exploration): rejected — reintroduces a two-click select-then-run flow the archived design deliberately
  removed, without the payoff of running arbitrary past queries in one click.
- *Toolbar Run always fires the latest message with SQL*: rejected — defeats the purpose; a user
  wanting to re-run an earlier candidate would have to scroll up, copy its SQL, and paste it into the
  SQL view manually.

### 4. Parent state: `aiLoadedMessageIndex` replaces "latest generation" as the notion of "current query"

`QueryBuilder.tsx` state changes:
- `aiGeneratedSql` / `aiRepresentable` turned out to be write-only once the toolbar Run/Copy branches
  were removed (Decision 3) — nothing read them anymore — so they were deleted rather than kept as
  dead state.
- New `aiLoadedMessageIndex: number | null` — the index of the message whose Run was last clicked.
  `AiPanel` disables that message's Run action (in addition to disabling all of them during
  `runInFlight`) — the disabled state itself is the only indicator of which turn the Builder/JSON/SQL
  views reflect. (An earlier pass added a separate "Loaded" `DialTag` badge; simplified away per
  feedback — one signal, not two, for "this is the current query.")
- `resetAiQuery()` clears `aiLoading` and `aiLoadedMessageIndex`, and also bumps a new
  `aiConversationKey` counter (see below).

`onQueryGenerated(sql)` — previously invoked automatically by `AiPanel` right after a successful
generate — is replaced by `onRunAiMessage(sql, index)`, invoked **only** when a message's inline Run is
clicked. It merges what used to be two separate moments (auto-load-on-generate, then a later toolbar
Run) into one handler. One correctness issue surfaced during implementation and had to be designed
around: `state` hasn't re-rendered yet inside this same synchronous handler, so building the executed
query from `buildQuery(state, freshBound)` (as sketched in an earlier draft of this doc) would run
against the *pre-hydration* state — wrong filter/group-by, and a stale time bound. Fix: `hydrateBuilderFromQuery`
was changed to return `{ fields, state, timeBound }` — the just-computed values, not the closure — so
the caller can build the request from those directly:

```
const onRunAiMessage = async (sql: string, index: number) => {
  setAiLoadedMessageIndex(index);
  setAiLoading(true);
  const res = await translateSqlToQuery(sql);
  let runFields = state.fields;
  let request: QueryRunRequest = { kind: QueryRequestKind.Sql, sql };
  if (res.success && res.response?.query && isBuilderRepresentable(res.response.query)) {
    const hydrated = await hydrateBuilderFromQuery(res.response.query);
    runFields = hydrated.fields;
    setSqlText(''); setJsonText(''); setJsonDiverged(false); lastGeneratedSql.current = '';
    request = { kind: QueryRequestKind.Structured, query: buildQuery(hydrated.state, hydrated.timeBound) };
  } else {
    setSqlText(formatSql(sql));
    lastGeneratedSql.current = '';
  }
  setAiLoading(false);

  // Execute immediately — Run means "load and run" in one click.
  setIsRunning(true);
  const runRes = request.kind === QueryRequestKind.Sql
    ? await executeSqlQuery(request.sql)
    : await executeQuery(request.query);
  if (runRes.success) {
    const response = runRes.response ?? { rows: [] };
    setResult(response);
    setResultMeta(buildExecutedMeta(request, response, runFields));
  } else {
    showNotification(getErrorNotification(runRes.errorHeader || t(QueryBuilderI18nKey.RunFailed), runRes.errorMessage, runRes.requestId));
  }
  setIsRunning(false);
};
```

`onRun`/`runDisabled`'s `isAiView` branches are deleted — the toolbar Run button they guarded no
longer renders in the AI view (Decision 3), so the branches are dead code.

**Bug found by browser verification, fixed here too:** `AiPanel` was rendered as
`<AiPanel key={state.entityName} .../>`, matching the archived design's remount-on-entity-change trick.
But `onRunAiMessage`'s hydration can itself change `state.entityName` (the generated query may target a
different entity than the one currently selected — see the existing cross-entity schema-refresh test).
That silently changed the `key` mid-click, unmounting and remounting `AiPanel` and wiping the whole
conversation the instant Run succeeded — so the disabled-Run state could never actually be observed. Fix:
a dedicated `aiConversationKey` counter, bumped only inside `resetAiQuery()` (whose only call site is
`onSelectEntity`, the user's own explicit entity switch). `AiPanel` is now `key={aiConversationKey}` —
decoupled from whatever value `state.entityName` happens to hold at render time.

### 5. `AiPanel` prop contract

```
interface Props {
  onRunMessage: (sql: string, messageIndex: number) => void;
  loadedMessageIndex: number | null;
  runInFlight: boolean; // disables inline Run buttons while a translate+execute is in progress
}
```

`runInFlight` is `aiLoading || isRunning` computed in the parent and passed down, so all inline Run
buttons disable together the instant one is clicked (same debounce guarantee the single toolbar Run
had). A message's Run is disabled when `runInFlight` is true **or** when it is the `loadedMessageIndex`
— the same boolean drives both the "don't double-click while running" guard and the "this is already
the current query" indicator; no separate badge. `AiPanel` keeps owning `input`, `messages`, and the
"assistant is thinking" `loading` flag for the Send action — those are independent of `runInFlight` (a
user can still read/scroll the transcript and type a follow-up while a previous message's query is
running).

### 6. Suggested-prompt chips only show on an empty transcript

Once the first message is sent, the chips are dropped from view (only the textarea + Send button
remain pinned below the transcript). Keeps the transcript from competing for space with chips that stop
being useful once a real conversation is underway — consistent with "keep it simple."

## Risks / Trade-offs

- **Index-based message identity** (Decision 2) → fine today (append-only, remount-on-reset); would need
  revisiting if a future change adds message edit/delete/regenerate.
- **Toolbar Run/Copy disappearing specifically in the AI view** → an inconsistency across the four
  views, called out explicitly in the proposal as **BREAKING**; mitigated by every SQL-bearing message
  carrying its own Run + Copy, so no capability is lost, only relocated.
- **Two loading flags to reason about** (`loading` for generate, `runInFlight` for translate+execute) →
  necessary because a user should be able to send a follow-up message while an earlier query is still
  running; kept as two separate booleans rather than one combined state to avoid falsely blocking the
  Send action during a run.
- **`generateQuery` failures that reject rather than resolve `{success:false}` still hang the Send
  button forever with no notification.** Confirmed live: when the assistant deployment is unreachable,
  the Next.js server-action call surfaces as an uncaught `TypeError: fetch failed` at the RSC transport
  layer, bypassing `AiPanel`'s `else` branch entirely — `loading` never resets. This is a **pre-existing
  gap carried over from the archived design** (`onGenerate` had the same unguarded `await
  generateQuery(...)`, no try/catch), not something this change introduced, and it's out of this
  change's scope (no transport changes) — flagged here as a follow-up worth a small fix (wrap the call,
  reset `loading` and show a notification in a `catch`) since it directly affects this feature's
  usability whenever the assistant backend hiccups.

## Migration Plan

Pure modification of an existing, already-shipped feature; no data migration. i18n keys tied to the
removed single-proposal UI (e.g. the old run-hint/proposed-query/response-label keys) are replaced by
chat-oriented keys (Send label, per-message Run/Copy labels) — check `QueryBuilderI18nKey` for any of the
old keys used elsewhere before deleting them; otherwise remove alongside the old rendering code. (An
`AiLoadedBadge` key was briefly added for the "Loaded" `DialTag`, then removed when the badge itself was
dropped in favor of disabling Run.)

## Open Questions

- None outstanding — chat shape, Run/Copy placement, and feedback-loop scope were all decided in
  discovery before this design was written.
