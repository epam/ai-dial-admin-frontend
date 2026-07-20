# Design — Analytics Query Assistant (AI view)

## Context

The Query Builder rail is a client component (`QueryBuilder.tsx`) that switches between three views via
a `DialSegmentedControl` bound to the `QueryBuilderView` enum (`Form`, `Json`, `Sql`). Each written
view already holds its own text state and feeds the shared toolbar **Run** through a discriminated
`QueryRunRequest` (`Structured` → `executeQuery`, `Sql` → `executeSqlQuery`). This change adds a fourth
`Ai` view that produces SQL from natural language and arms it for that same Run path.

The transport is DIAL Core's OpenAI-compatible chat endpoint, reached through the existing
`CoreApi` base (JWT-Bearer auth + Core error normalization) on `DIAL_CORE_API_URL`. The behavior was
verified end-to-end against the live app before writing this design (see **Verified contract**).

## Goals / constraints

- Reuse existing machinery: `CoreApi`/`BaseApi` transport, the `QueryRunRequest`/`executeSqlQuery` run
  path, the result area, `CopyButton`, `DialSegmentedControl`, `DialTextarea`, `DialPrimaryButton`.
- Zero visible change when the feature is off: with `DIAL_QUERY_ASSISTANT_DEPLOYMENT` unset the rail is
  exactly its current three-view self.
- Follow repo standards: enums over string unions, types in `models/`, consts split into `constants/`,
  `@/` imports, i18n for all strings, pure + unit-tested utils.

## Verified contract (from live probe)

`POST {DIAL_CORE_API_URL}/openai/deployments/{encoded deployment}/chat/completions?api-version=2024-10-21`
with `{ messages, stream: false }` and an `Authorization: Bearer <token>` header returns HTTP 200:

```jsonc
{ "choices": [ { "finish_reason": "stop", "message": {
  "role": "assistant",
  "content": "…prose…\n\n```sql\nSELECT deployment, SUM(total_price) AS total_cost\nFROM dial_usage_log\nWHERE …\nGROUP BY deployment ORDER BY total_cost DESC\n```\n\n**Note:** …",
  "custom_content": { "stages": [ { "name": "Calling …_list_entities via MCP", "status": "completed", "content": "…" } ] }
} } ] }
```

Decisive findings:
- Standard OpenAI chat-completions envelope; the query is in `choices[0].message.content`.
- The SQL is **inside a fenced ` ```sql … ``` ` block**, wrapped in prose and a trailing note — it is
  **not** our structured DSL. → Apply runs it via `executeSqlQuery`, not `executeQuery`.
- `custom_content.stages` describes the app's MCP steps (optional display; not consumed in v1).
- The routing deployment id **includes the version suffix** (`…/<app>__<version>`); the exact string
  must come from `GET /v1/deployments?interface_type=chat`, not the admin asset URL.

## Decisions

### 1. Fourth view via the existing enum + switcher

Add `Ai = 'ai'` to `QueryBuilderView`. In `QueryBuilder.tsx`, append the AI option to `viewOptions`
**only** when `featureFlags.queryAssistantEnabled` is true (read via `useAppContext()`), so the
segmented control shows three or four segments depending on config. The AI option label carries the
spark (✨) via a `@tabler/icons-react` icon, consistent with §6 (no unicode glyphs).

### 2. Gating derives from config presence (no standalone toggle)

`queryAssistantEnabled` is added to `FeatureFlags` and initialized in `layout.tsx` as:

```
queryAssistantEnabled: isValueTruthy(process.env.ANALYTICS_ENABLED)
                     && !!process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT
```

One env var (`DIAL_QUERY_ASSISTANT_DEPLOYMENT`) does double duty: it enables the segment **and**
supplies the deployment name the server action posts to. There is no way to enable the feature without
a target, and no orphan flag. The AI segment additionally requires analytics itself to be enabled
(the whole page already is).

### 3. Transport: `QueryAssistantApi extends CoreApi`

New `src/server/core/query-assistant-api.ts`:

```
class QueryAssistantApi extends CoreApi {
  chatCompletion(messages, deployment, token): Promise<ServerActionResponse<ChatCompletionResponse>> {
    const path = `/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`;
    return this.postAction(path, { messages, stream: false }, token);
  }
}
```

Wired in `api.ts` as `queryAssistantApi = new QueryAssistantApi({ host: process.env.DIAL_CORE_API_URL })`
— same host as `assetApi`/`toolsetOpsApi`. `postAction` already attaches Bearer auth and normalizes
Core errors, returning the `{ success, response?, errorHeader?, errorMessage?, requestId? }` shape the
UI already handles.

### 4. Server action `generateQuery`

New action in `query-builder/actions.ts`:

```
export async function generateQuery(
  messages: QueryAssistantMessage[],
): Promise<ServerActionResponse<ChatCompletionResponse>> {
  const deployment = process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT;
  if (!deployment) return { success: false, status: 0, errorMessage: '…not configured…' };
  return queryAssistantApi.chatCompletion(messages, deployment, await token());
}
```

The deployment name is read server-side only (never shipped to the client). Mirrors the existing
`token()` helper and action shape in the same file.

### 5. SQL extraction is a pure, tested util

`components/Analytics/QueryBuilder/utils/extract-sql.ts`:

```
export const extractSql = (content: string): string | null => { … }
```

Rule: return the contents of the **last** ` ```sql … ``` ` fenced block (case-insensitive language
tag), trimmed. If there is a fenced block with no language tag, accept it as a fallback. If there is
no fenced block at all, return `null` (the panel then shows the raw assistant text as an explanation
and offers no Apply). Kept pure and colocated with the other QueryBuilder utils; unit-tested for:
fenced `sql` block, block among prose, multiple blocks (last wins), untagged block fallback, no block
→ null, empty input.

Rationale for "last block wins": the observed reply leads with prose and can restate SQL; the final
fenced block is the app's actual answer.

### 6. AI panel component

`QueryBuilder/Ai/AiPanel.tsx` (feature component; composes ui-kit + Common):

- Heading + explanatory paragraph (i18n).
- `DialTextarea` bound to local `input` state; placeholder from i18n.
- Suggested-prompt chips from a `QUERY_ASSISTANT_SUGGESTIONS` constant
  (`constants/analytics/query-assistant.ts`) — clicking a chip sets the textarea value. Chips are
  i18n keys, rendered with `DialButton` (ghost/secondary), not raw HTML.
- `DialPrimaryButton` "Generate query" — disabled while `input` is empty or a request is in flight;
  shows a spinner/loading state during the call.
- On Generate: append the user message to a local `messages` array, call `generateQuery`, and on
  success append the assistant message verbatim (preserving `custom_content` for future multi-turn),
  then run `extractSql` on the assistant content. When SQL is extracted, hand it straight to the
  parent via `onGenerated(sql)` — there is **no Apply step**.
- Proposed-query area: when SQL was extracted, show it read-only (monospace block) with a `CopyButton`
  and a hint to switch views or Run; when not, show the raw assistant text as an explanation and load
  nothing.
- Errors from the action surface via the existing `useNotification()` toast (`getErrorNotification`),
  matching the SQL/JSON views.

State ownership: the panel keeps `input`, `messages`, `loading`, `proposedSql`, and `rawReply`
locally; the loaded query lives in `QueryBuilder.tsx` (below).

### 7. A generated query loads automatically into the builder (`QueryBuilder.tsx`)

`AiPanel`'s `onGenerated(sql)` calls a parent handler that loads the query immediately (no Apply). It
reuses the **existing SQL→builder path** the SQL view already runs when leaving edited SQL for the
Form view:

```
const res = await translateSqlToQuery(sql);
if (res.success && res.response?.query && isBuilderRepresentable(res.response.query)) {
  hydrateBuilderFromQuery(res.response.query);   // Form/JSON/SQL now all derive from builder state
  setSqlText(''); setJsonText(''); setJsonDiverged(false); lastGeneratedSql.current = '';
  setAiRepresentable(true);
} else {
  setSqlText(sql); lastGeneratedSql.current = '';  // builder can't show it — SQL view keeps it runnable
  setAiRepresentable(false);
}
```

Parent state: `aiGeneratedSql: string | null` (the raw SQL, for Copy and the fallback run) and
`aiRepresentable: boolean`. Then, alongside the existing `isSqlView`/`isJsonView` branches:

- `onRun` (AI view): if `aiRepresentable`, run the builder query (`buildQuery(state, …)` via
  `executeQuery`); otherwise run the raw SQL via `executeSqlQuery`.
- `runDisabled`: `... || (isAiView && (!aiGeneratedSql || aiLoading))` — `aiLoading` gates Run while the
  translate call is in flight so it can't run against an unsettled `aiRepresentable`.
- Copy button value: in AI view, the builder JSON when `aiRepresentable` (so Copy tracks builder
  edits, matching Run), otherwise the generated SQL.
- `buildExecutedMeta` already handles both kinds — results render in the existing `ResultArea`.

Consistency guarantees (from code review):

- **No stale armed query.** `AiPanel` calls `onGenerated(sql | null)` on every generation; a reply with
  no SQL passes `null`, which clears `aiGeneratedSql`/`aiRepresentable` so Run cannot fire the previous
  query while the panel shows only prose.
- **Entity change resets AI state.** `onSelectEntity` calls `resetAiQuery()` and the panel is keyed by
  `state.entityName` so it remounts (clearing its conversation/proposal) when the entity changes.

The user stays in the AI view after generation and switches to Builder/JSON/SQL themselves to see or
edit the loaded query. This reverses the earlier "no builder hydration" stance in favor of the user's
request to inspect the generated query in every view; it adds no new machinery — only a call into the
path that already exists.

### 8. Models

`src/models/analytics/query-assistant.ts`:
- `enum QueryAssistantRole { System = 'system', User = 'user', Assistant = 'assistant' }`
- `interface QueryAssistantMessage { role: QueryAssistantRole; content: string; custom_content?: QueryAssistantCustomContent }`
- `interface QueryAssistantCustomContent { state?: unknown; stages?: QueryAssistantStage[]; attachments?: unknown[] }`
- `interface ChatCompletionChoice { index: number; finish_reason: string; message: QueryAssistantMessage }`
- `interface ChatCompletionResponse { choices: ChatCompletionChoice[] }`

`QueryBuilderView` (existing enum in `models/analytics/query-builder.ts`) gains `Ai = 'ai'`.

## Risks / tradeoffs

- **Deployment version pinning.** The routing id includes `__<version>`, so bumping the app version
  requires updating `DIAL_QUERY_ASSISTANT_DEPLOYMENT`. Acceptable for a preview feature; publishing the
  app under a stable version-less deployment name for prod is a deployment-side follow-up, not a
  frontend change.
- **Generated SQL vs the execute-sql subset.** The app emits general SQL (e.g. `TIMESTAMP '…'`
  literals) that may not always match the analytics `/execute-sql` accepted subset. Any mismatch
  surfaces through the existing SQL-run error toast — no special handling in v1; operators can Copy the
  SQL into the SQL view to adjust.
- **No SQL extracted.** If a reply has no fenced block (e.g. the app asks a clarifying question), the
  panel shows the text and loads nothing — a benign dead-end for one-shot v1; multi-turn would let
  the user answer, which the preserved `messages`/`custom_content` contract already accommodates later.
- **Not builder-representable.** When translation fails or the query is too deep for the builder, only
  the SQL view reflects it (the builder/JSON keep their prior state); it stays runnable via the raw
  SQL. Most assistant queries (aggregate/filter/group-by) are representable; this is the edge.
- **One-shot only.** Each Generate replaces the prior proposal. Chosen for scope; the transport keeps
  the full `messages` contract so a conversation UI is additive later.

## Migration / rollout

Pure addition behind an env var. No data migration, no changes to existing views. Ship with
`DIAL_QUERY_ASSISTANT_DEPLOYMENT` unset in environments that shouldn't show it.
