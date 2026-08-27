## Why

The Chart view is unreachable from the SQL view by construction: `ResultArea` gates charts on
`meta.kind === QueryRequestKind.Structured`, and `buildExecutedMeta` returns empty dimension and
aggregate lists for every `QueryRequestKind.Sql` request. A SQL query that *does* group — the
reported case, `… count(DISTINCT trace_id) … GROUP BY d, client` — still lands on the hint
"Charts are available for aggregate results with at least one group-by column", which reads as a
GROUP BY detection bug rather than an unimplemented path. The SQL view is the escape hatch for
everything the visual builder cannot express, and today that escape hatch costs the user charts
entirely.

The same single hint string is rendered from two components for what are really several unrelated
causes, which is why the gap presented as a bug in the first place.

## What Changes

- **A SQL-view run's result becomes chartable.** Its executed-query meta is derived from the
  backend's own SQL → DSL translation (`POST /v1/queries/translate-sql`), which already exists, is
  already wired into the app, and is validation-only — it never reaches ClickHouse. The SQL branch
  of Run therefore produces the same shape of meta as a structured run instead of an empty one.
- **Group-by entries are resolved to result column names before use.** Verified against a live
  service: `translate-sql` returns an aliased *plain column* under its raw name while the result
  column carries the alias (`"usage_request_summary.model" AS client` → `group_by:
  ["usage_request_summary.model"]`, result key `client`). Taken verbatim this would put a column
  that is absent from every row on the X axis and misfile the real dimension as an aggregate.
- **A fallback classifies from the result rows** when translation is rejected — reachable by
  design, since the SQL view exists precisely for SQL the DSL cannot express (measured:
  `sum(total_tokens) / count(*)` → `400 SQL construct '/' cannot be expressed…`). Every returned
  column is offered as a dimension; only strictly numeric columns are offered as measures.
- **The chart-unavailable hint splits into per-cause messages.** One string is currently reused for
  a row-mode result, a result with nothing numeric to plot, an empty result, and a chart with no
  valid axis pick. Each gets its own wording naming its actual reason.
- No change to the structured path, to chart rendering, or to the X = dimension / Y = measure model
  the axis selectors are built on.

## Non-goals

- **Parsing SQL on the client.** The reported query breaks a `GROUP BY` regex three separate ways
  (an expression with an alias, a quoted identifier containing a dot, `DISTINCT` inside an
  aggregate). The backend already owns SQL parsing and this change routes through it.
- **Making every column selectable on both axes.** That would dissolve the dimension/measure
  distinction the selectors, their labels, and the pie/scatter slot descriptors all depend on.
- **Charting structured row-mode results.** Out of scope; row mode keeps its hint (with clearer
  wording).
- Any change to `getNumericColumns` or to scatter's existing column eligibility.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the "Result table and chart views" requirement — chart availability is no longer
  restricted to aggregate-mode *structured* runs; a SQL run's dimension and aggregate columns are
  defined, as is the fallback when translation fails. The chart-unavailable hint requirement gains
  per-cause wording.

## Impact

- `src/components/Analytics/QueryBuilder/QueryBuilder.tsx` — `buildExecutedMeta` gains the SQL
  branch; `onRun` pairs translation with execution; `onRunAiMessage` reuses the translation it
  already performs rather than issuing a second one.
- `src/components/Analytics/QueryBuilder/Result/ResultArea.tsx` — the `chartAvailable` predicate and
  the hint it renders.
- `src/components/Analytics/QueryBuilder/Result/ResultChart.tsx` — the no-valid-axis hint.
- `src/components/Analytics/QueryBuilder/Result/chart-options.ts` — a new strict-numeric helper
  alongside the existing `getNumericColumns`, which is left as-is.
- `src/constants/i18n.ts`, `src/locales/en.ts` — the split hint keys.
- No API-layer, server-action, or backend contract changes: `translateSqlToQuery` is used exactly as
  it is today.
- Existing tests in `Result/tests/ResultArea.spec.tsx` and `tests/QueryBuilder.spec.tsx` assert the
  single hint key and the current one-request SQL run, and are updated with the behavior.
