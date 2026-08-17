## Why

The conversations grid shows turns, tokens and cost, but not how long a conversation took or which
models served it — the two questions asked most often when scanning for slow or misrouted traffic.
Both are now answerable: the analytics backend populates `duration_ms` (from 2026-08-12) and exposes
`deployments`, a per-conversation array of every deployment that handled a hop. Neither field reaches
the grid today, because the column catalog filters out array types entirely and no curated column
projects duration.

## What Changes

- Add a **Duration** column to the conversations grid, backed by `duration_ms`, sortable and
  range-filterable server-side like the other numeric columns.
- Add a **Models** column rendering `deployments` as pills with a `+N` overflow badge and the full
  list in a tooltip, reusing the existing `TagsCellRenderer` / `TOPICS_COLUMN` pattern.
- Both columns join the curated set, so they are projected by the initial list query with no user
  action — no second round-trip when the grid first paints.
- `deployments` mixes models with orchestrators, applications, MCP toolsets and embeddings. The
  Models column applies client-side filtering to surface the models: it drops `applications/` and
  `toolsets/` resource paths, embedding deployments, and any entry that contains another entry of the
  same conversation as a substring (the naming pattern of a routing deployment). When filtering would
  empty the cell, the unfiltered list is shown instead. Measured against the structural ground truth
  on 2011 real conversations: exact match on 69%, one surviving orchestrator on 14%, fallback on 2%.
- A `duration_ms` of `0` renders as the existing `UNAVAILABLE_VALUE` em dash, not `0s` — the backend
  only began recording durations on 2026-08-12, so a zero means "not recorded", not "instant".
- Wire the detail panel's Metadata card `Deployment` row, which today renders a label with no bound
  column, to the same data.

## Capabilities

### New Capabilities

None. This extends the existing conversations grid rather than introducing a new capability.

### Modified Capabilities

- `analytics`: the conversations grid gains two curated columns (duration and models) with defined
  projection, sorting, filtering and empty-value behaviour, and the conversation detail panel's
  deployment row gains a bound value.

## Non-goals

- **No backend change.** The exact way to separate models from orchestrators is to subtract the set of
  `parent_deployment` values from `deployments`, which would need a new rollup measure and a matching
  patch on the dev environment. This change deliberately takes the client-side approximation instead;
  the measure remains available as a follow-up if the 14% residual proves annoying.
- **No general array support in the column catalog.** `deployments` becomes one curated column. The
  catalog keeps filtering array types, so `conversations.traces` (heavy, one id per turn) and
  `dial_usage_log.execution_path` stay out of the grid.
- **No `avg_duration_ms` column.** It stays in the detail panel. The backend documents it as a mean per
  hop rather than per turn, so it reads low for chained conversations and would mislead in a scannable
  column.
- **No sorting or filtering on the Models column.** The query DSL rejects arrays, and the grid pages
  server-side, so a client-side comparator would only order the current page.
- **No catalog-based classification.** Deciding whether a deployment name is a model, an application or
  a router properly requires joining against the DIAL deployment catalog per row; out of scope here.

## Impact

- `src/constants/grid-columns/grid-columns.tsx` — two entries in `BASE_CONVERSATIONS_TRACE_COLUMNS`.
- `src/constants/analytics/conversations-trace.ts` — `SORTABLE_CONVERSATION_FIELDS`,
  `FILTERABLE_CONVERSATION_FIELDS`, `CONVERSATION_FIELD_VALUE_TYPE`,
  `CONVERSATION_PROVENANCE_GROUPS`, and the Metadata panel's deployment row.
- `src/utils/analytics/conversations-queries.ts` — `CURATED_SELECT_FIELDS` gains both fields.
- `src/models/analytics/conversations-trace.ts` — `ConversationsField` gains `Deployments`.
- `src/utils/analytics/` — a new pure helper for the model-ordering rules, plus duration formatting
  in `conversation-formatting.ts`.
- `src/locales/en.ts` and `src/constants/i18n.ts` — two column headers and their tooltips.
- Reused unchanged: `TagsCellRenderer`, `numericColumn`, `baseNumberFilter`, `UNAVAILABLE_VALUE`.
- No server action, API-route or backend contract changes; both fields already ship in the query
  response on dev and locally.
