## Context

See proposal.md — Why. The design-relevant state:

- `buildExecutedMeta` is the sole producer of `ExecutedQueryMeta`, and both run paths (`onRun`,
  `onRunAiMessage`) call it. Its structured branch derives
  `aggregateColumns` as "returned columns minus `group_by`", so the whole classification hinges on
  `dimensionColumns` naming actual result columns.
- `translateSqlToQuery` → `POST /v1/queries/translate-sql` is already wired and already called on
  two paths (the SQL → Builder view switch, and Run from an AI message). It is validation-only and
  never reaches ClickHouse, so its cost is a round trip, not a query.
- `ExecutedQueryMeta.columnLabels` is built from `state.fields`, the schema of the *currently
  selected* entity. The spec requires labels to follow the *executed* query's entity.

The behavior contracts below were measured against a live analytics-data-access-service, not
inferred from its source.

## Goals / Non-Goals

**Goals:**

- One classification mechanism, not two: a SQL run should flow into the same
  `dimensionColumns` / `aggregateColumns` derivation a structured run already uses.
- Keep the primary (translated) and fallback (row-derived) classifiers as separate pure functions,
  each unit-testable without a component render.
- Make a failed translation invisible to the user — it must not fail the run, notify, or delay the
  result.

**Non-Goals:**

- Improving `translate-sql`'s coverage, or working around constructs it rejects.
- Reworking the chart slot descriptors, `ChartColumnSource`, or how `ResultChart` derives defaults.
  This change only changes what the two column lists contain.

## Decisions

### 1. The backend's translation is the source of truth; row classification is the fallback

The client does not parse SQL. `onRun`'s SQL branch issues `translateSqlToQuery(sqlText)` and
`executeSqlQuery(sql)` together under `Promise.all`, and the translated query supplies `mode` and
`group_by`.

*Alternative rejected — regex the `GROUP BY` clause.* The reported query defeats it three separate
ways: an expression with an alias (`date_trunc('day', request_time) AS d`), a quoted identifier
containing a dot (`"usage_client_identity.client_type"`), and `DISTINCT` inside an aggregate. The
backend already owns a real parser.

*Alternative rejected — classify from rows only, skipping translation.* Simpler, but it throws away
the query semantics the service will hand over for free, and it cannot distinguish a numeric
dimension from a measure (see Risks).

**Gate on `res.success && res.response?.query` only.** Not on `isBuilderRepresentable` — that
predicate only checks filter/having nesting depth for the visual builder's benefit and is
irrelevant to naming columns. Using it would reject queries this path can serve.

### 2. Translated `group_by` entries must be resolved to result column names

Measured against the live service:

| SQL | `group_by` returned | result keys |
| --- | --- | --- |
| `date_trunc('day', request_time) AS d` | `d` | `d` |
| `"usage_request_summary.model" AS client` | `usage_request_summary.model` | `client` |
| `deployment AS dep … GROUP BY dep` | `deployment` | `dep` |
| `deployment` (no alias) | `deployment` | `deployment` |
| `date_trunc('day', request_time)` (no alias) | `date_trunc` | `date_trunc` |
| `GROUP BY 1` over `response_status` | `response_status` | `response_status` |

Only one shape diverges: a **plain column selected under an alias** is named by the underlying
column in `group_by` and by the alias in the rows. Every other shape is already identity.

Resolution rule, given the run's actual result columns: an entry that already names a returned
column is that column; otherwise, if a translated `select` item's `expr` is a plain field named `g`
and carries a non-empty `as`, use the `as`. An entry that resolves to no returned column is dropped
rather than offered as an axis nothing can plot.

Consulting the result columns first matters for one input the measured shapes do not cover:
`SELECT deployment, deployment AS dep … GROUP BY deployment` returns both `deployment` and `dep`,
and an alias-first rule would resolve the entry to `dep` while misfiling the real `deployment`
column as an aggregate.

Without this, `dimensionColumns` would carry a name that is `undefined` in every row — the X
selector would offer a phantom column and plot nothing — while the real dimension (`client`) would
fall into `aggregateColumns` because it is "not in `group_by`".

This is a SQL-path concern only: `serialize.ts` emits plain group-by columns with no `as`, so the
structured path cannot produce the divergent shape and its behavior is untouched.

### 3. `columnLabels` are applied only when the translated entity matches the selected one

`state.fields` describes the selected source. A SQL run may name a different `FROM` target, and the
spec requires labels to follow the executed query. So: apply display names when
`translated.entity === state.entityName`, otherwise leave `columnLabels` empty and let columns show
their returned names.

### 4. The fallback offers every column as a dimension, and strictly numeric columns as measures

When translation is rejected, the client has no query semantics. Rather than guess which column is
a dimension, it offers all of them on the dimension slot and lets the user choose. The measure slot
takes only columns whose every value is a number.

**A new strict helper, not `getNumericColumns`.** The existing one routes through `comparableKey`,
which accepts date-like strings via `Date.parse` — correct for a scatter axis, wrong here, since it
would make a timestamp column a valid Y value. The new helper is a sibling in the same module, and
is stricter than a bare `Number()` coercion in both directions: it accepts only numbers and numeric
strings, so a boolean column (`Number(true) === 1`) or an array-valued column such as `request_tags`
(`Number([]) === 0`) is not offered as a measure. `getNumericColumns` is left exactly as it is for
scatter.

**The two lists overlap on this path only.** A structured or translated run divides its columns
between dimensions and aggregates; the fallback puts its numeric columns in both. Anything consuming
both lists together must therefore deduplicate — `ResultChart` builds its numeric-column set from a
`Set` of the two, or scatter would count a single numeric column twice and offer to plot it against
itself.

### 5. An untranslatable SQL run keeps `mode: Row`

`mode` reports what was executed. It is not relabelled `Aggregate` to satisfy a predicate. Nor does
`chartAvailable` need to branch on `meta.kind`: once each run's columns are divided upstream, the two
lists alone decide availability, and `kind`/`mode` stay a truthful record of the run rather than
inputs to the gate. One consequence, accepted: a JSON-view query written as `mode: "row"` but
carrying a `group_by` becomes chartable, where the old mode check refused it.

### 6. The AI-message run path reuses the translation it already has

`onRunAiMessage` already calls `translateSqlToQuery` before deciding how to run. When it falls
through to the SQL branch it still holds `res.response?.query`, so `buildExecutedMeta` takes the
translated query as a parameter rather than fetching it. That path issues no additional request.

### 7. One hint key per cause

`QueryBuilderI18nKey.ChartUnavailable` is rendered from `ResultArea` and `ResultChart` for four
unrelated causes. Each gets its own key and wording: a result with no dimension to plot against, a
result with no column that can serve as a value, a result with no rows, and a chart whose selectors
hold no valid pick. Reusing one string for all four is what made an unimplemented path read as a
GROUP BY bug in the report.

## Risks / Trade-offs

- **A numeric dimension appears in both selectors on the fallback path** (a time bucket returned as
  epoch millis, a numeric status code) → Accepted, not mitigated. Any heuristic that tried to
  separate them would misfire on real measures, and the fallback exists precisely where the client
  has no semantics to appeal to. The user's pick decides. Note this affects only queries
  `translate-sql` rejects; the primary path classifies exactly.
- **One extra round trip per SQL run** → It is validation-only and never touches ClickHouse, and it
  runs concurrently with execution under `Promise.all`, so it is hidden behind the query itself
  unless the query is faster than a parse. No user-visible latency change is expected.
- **A translation failure must stay silent** → It is an expected outcome (the SQL view exists for
  DSL-inexpressible SQL), so it must not reach `showNotification`; only the run's own failure does.
  The risk is a future edit routing it into the shared error handler; the fallback path is covered
  by a test asserting no notification.
- **`translate-sql` could change how it names `group_by` entries** → The resolution rule is
  identity for every shape except the aliased plain column, so a service that started returning
  aliases directly would still resolve correctly. A service that changed shape more deeply would
  surface as a chart offering a column absent from the rows; the resolver is a pure function with
  the measured shapes as its test fixtures.
