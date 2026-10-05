## Context

See proposal.md — Why. The Dashboards page is driven by per-view tables in
`components/Analytics/Usage/constants.ts` and `utils/kpi-cards.ts` — event kinds, KPI metrics,
time-series plots and breakdown tabs, each a `Record<UsageView, …>` — and every request is built in
`queries.ts` from a `QueryScope` whose `view` picks the rows through `buildFilter`. Adding a view is
therefore mostly adding a key to those tables. Two things are not table entries:

- Every existing breakdown dimension is a stored column (`deployment`, `parent_deployment`,
  `project_id`, `mcp_tool_call_name`), named once in `BREAKDOWN_TAB_COLUMN` and used as the select
  field, the `group_by` key and the sort key. A route's owner and path are not stored; they are
  derived from `event_kind`, `deployment` and `request_uri`.
- The view's rows are not an event-kind set. Global route calls share the empty event kind with
  unclassified LLM calls and are told apart only by a missing `deployment`.

What the data looks like, measured on dev over 30 days (shapes only):

| Row | `event_kind` | `deployment` | `request_uri` | price, tokens |
|---|---|---|---|---|
| application route | `route` | the declaring deployment | `/v1/deployments/<deployment>/route/<path>[?query]` | none |
| global route | empty | empty | the route's own path, e.g. `/<prefix>/v1/messages` | none |
| unclassified LLM call | empty | the model | `/anthropic/v1/…`, `/openai/v1/…` | present |

Every row with an empty `deployment` and an empty event kind had a non-model URI; no priced row had
an empty `deployment`.

## Goals / Non-Goals

**Goals:**

- Routes is one more `UsageView`, served by the same request shapes, hooks and widgets as LLM and
  MCP, with no widget forked for it.
- Derived dimensions are computed by the backend, so ranking, top-N and dialog paging stay correct.

**Non-Goals:**

- No new widget, no new request shape, no new endpoint, no backend change.
- No change to the telemetry dashboard.

## Decisions

### D1. Derived dimensions are aliased select expressions, grouped by alias

`BREAKDOWN_TAB_COLUMN` keeps the name every consumer reads a row by; for a derived column that
name is an alias, and `queries.ts` holds its expression in `DERIVED_COLUMNS`, keyed by the alias —
by column rather than by tab, because `route_owner` is both the `Owners` dimension and a `Paths`
qualifier. `buildTabQuery`, `buildTabKeysQuery`,
`buildDimensionBucketedQuery` and the leading-dimension request select `{ expr, as: column }` when
an expression exists and `field(column)` otherwise, and keep `group_by` / `sort` on the column
name. The analytics service resolves a `group_by` or sort key to a select alias
(`StructuredQueryBuilder`), which is how the bucket alias already works.

The expressions, from DSL functions the service's catalog lists (`if`, `not_empty`, `concat`,
`split_string`, `array_slice`, `array_to_string`):

- `route_owner` — `if(not_empty(deployment), deployment, '/' + second element of
  split_string(<path>, '/'))`, where `<path>` is the URI with its query cut, so a query on a
  one-segment global path stays off the owner;
- `route_path` — the URI with its query cut (`split_string(…, '?')`, first element); for an
  application route, `'/'` + everything after the first `'/route/'` of that, rejoined by it — the
  old writer's lazy regex, so a path that itself carries `/route/` stays whole. `array_slice` has no
  "to the end" form, but a slice past the end returns what exists, so the rest is read with a bound
  no URI reaches.

The branch tests the deployment rather than the event kind because the grammar has no comparison
in expression position — `if(event_kind = 'route', …)` is refused. Inside the Routes view the two
tests agree by construction: D3 admits a row without a deployment only as a global route, and every
application-route row carries its declaring deployment. Verified against dev through `execute-sql`,
which runs the same translation: both expressions group, rank and filter as intended.

The keys-query filter that compares a block's dimension values to the previous window compares the
same expression, not the alias, because a filter does not see select aliases.

*Alternative rejected:* fetch rows grouped by `request_uri` and derive owner and path on the client.
A top-N over raw URIs ranks URIs, not owners — an owner with many low-traffic paths would be cut
before its sum was known — and the dialog's offset paging would page URIs.

*Alternative rejected:* a pipeline that materializes `route_owner` / `route_path` columns. A real
improvement for cost, but it adds a backend artefact to answer a question the DSL already answers,
and leaves the page dependent on its refresh.

### D2. A tab may carry several qualifiers; the kind is read from the owner

`BREAKDOWN_TAB_QUALIFIER` (one column) becomes `BREAKDOWN_TAB_QUALIFIERS`, a list per tab. `Paths`
is qualified by `route_owner` and `request_method`. A row's identity is already the join of its
group values (`ROW_KEY_SEPARATOR`), and `foldBreakdownRows` keeps the qualifier values on the row,
so the table can state a path's method and owner beneath it.

A row's kind is not a group key. The owner expression builds a global route's owner from its path,
slash first, and a deployment is named by an id or a bucket path that never starts with one — so
`getRouteKind(owner)` answers on the client from a value the row already carries.

*Alternative rejected:* a `route_kind` expression as a further qualifier. It qualified the `Owners`
rows too, which made the leading dimension's ids compound: the split plot filters its series by
those ids and reads them back from a single column, so it would have matched nothing.

*Alternative rejected:* a kind measure (`max(route_kind)`). It reads a constant through an
aggregate, and the next reader has to prove the row cannot mix kinds to trust it.

### D3. The view is selected by a filter node, not by an event-kind list

`USAGE_VIEW_EVENT_KINDS` gives way to a `viewFilter(view)` node built in `queries.ts`, beside the
DSL helpers it needs; `constants.ts` keeps only the event-kind values:

- LLM — event kind in (`llm_call`, `embedding`, empty) **and not** (event kind empty and
  `deployment` missing);
- MCP — unchanged: event kind `mcp` and method `tools/call` (the method clause moves into the node);
- Routes — event kind `route` **or** (event kind empty and `deployment` missing).

"Missing" is `not_empty(deployment)` being false, which covers both null and the empty string. A
boolean call is a filter predicate only as a comparison, so the node is
`not(eq(not_empty(deployment), true))` — the shape the service's own SQL translation emits.
`buildFilter` takes the node for the view and keeps the time, entity and project clauses. The two
definitions share one predicate, so a row cannot be in both views or in neither by drift.

*Alternative rejected:* keep the kind list and add `route` to a new entry. It cannot express the
global-route rows, and leaving them in the LLM view keeps the nameless row this change exists to
remove.

### D4. Per-view tables gain a Routes entry; the cost guards move to one predicate

`VIEW_KPI_METRICS`, `VIEW_TIME_SERIES_VIEWS` and `VIEW_BREAKDOWN_TABS` get a `Routes` entry. The
places that test `view === UsageView.Llm` to offer cost — `ShareBreakdown`, `BreakdownTable`, the
heatmap figure switch — read one `isPricedView(view)` helper (`utils/views.ts`) instead, so a fourth view cannot
inherit a cost control by falling into an `else`.

### D5. Fallback labels

`Callers` (`parent_deployment`) reuses `Direct call` and the existing
`DirectCallRouteTooltip` ("called directly by key or user"), which already describes a route called
without a deployment in between — `getFallbackTooltipKey` keeps the MCP tooltip for MCP alone.
`Owners` and `Paths` never carry a missing value — an owner is always derived — so they carry no
fallback, as `Tools` does not.

## Risks / Trade-offs

- [The global-route predicate is an inference from row shape, not a recorded kind] → It rests on
  two facts measured above: no priced row lacks a deployment, and every unpriced empty-kind row
  without one has a non-model URI. A unit test pins the predicate; if ADAS later classifies these
  rows (a `global_route` kind), D3 changes one node.
- [Owners merge global routes that share a first segment] → Stated in the `Owners` description, as
  the spec requires. Naming the route properly is a non-goal (proposal).
- [String expressions over `request_uri` on every request cost more than a column read] → Route
  traffic is a small fraction of the log and every request is already time-bounded. If it shows on
  the page, D1's rejected pipeline is the fix.
- [Paths with ids rank one row per id] → Parity with the old view; templating is a non-goal.
- [The LLM view's request count, error rate and latency drop when global routes leave it] → That is
  the correction; spend and tokens are unchanged. Called out in the PR description so a reader
  comparing before and after is not surprised.

## Migration Plan

Frontend only, behind the existing `ANALYTICS_ENABLED` / `ANALYTICS_USAGE_ENABLED` flags; rollback
is a revert.
