## Why

The Dashboard route renders 22 widgets from 20 separate telemetry queries, each with its own fetch
and its own refresh interval, and its three views answer "how much traffic" without ever answering
"more or less than before". A design for the system dashboard now exists: a KPI row with
previous-period deltas, a time series, an hour-by-day activity heatmap, a share donut, and one
tabbed breakdown table with a row detail panel in place of eight separate grids.

This change builds that design as **a new page of its own**, at `/usage` in the Analytics menu
group, behind an environment flag. Not as a rewrite of the current dashboard, and not as a second
implementation of the same route: the two answer different questions from different datasets, and
putting them behind one URL would mean a reader could not see both. The existing dashboard keeps
`/dashboard`, unchanged, for as long as it is useful.

The page reads the **analytics data-access service** (`dial_usage_log` through the structured-query
endpoint), not the realtime telemetry dataset. That reverses the source this change was first
planned around — see D1 in `design.md` for the measurement that reversed it. In short: the
usage log is ~11 minutes behind live, not a day; its `deployment` column *is* the model on an
LLM row; and it carries `success` and `operation_duration_ms`, which is what makes error rate and
the latency percentiles possible here and impossible on the realtime dataset.

## What Changes

- **New environment flag** `ANALYTICS_USAGE_ENABLED`, gating both the `/usage` route and its menu
  item. Off by default, and ANDed with `ANALYTICS_ENABLED` in both places.
- **New page and menu item** — `/usage`, in the Analytics group next to Queries. The existing
  Dashboard route, its menu item and the entity Audit tab are untouched.
- **New self-contained module** under `src/components/Analytics/Usage/`, with its own structured
  queries, its own response folds and its own controls bar.
- Two views — **LLM / MCP** — selected by the module's own view control. Each offers the cards,
  plots and breakdown dimensions its rows can answer: the MCP view has no spend, because an `mcp`
  row carries no price at all.
- **KPI row**: Total spend, Requests, Tokens, Cost per 1M tokens, Unique users, **Error rate** and
  **Avg latency**, each with a previous-period delta and a sparkline.
- **`Compare` control** (`Previous period` / off), **on by default**, governing every widget.
- **Time series with four plots** behind a tab control: Requests, a stacked split by the view's
  leading dimension, Cost, and p50/p95 Latency.
- **Activity heatmap** (hour × day) on its own week, paged independently of the page period.
- **Share donut** (top 5 + `Others`) with a full-list dialog.
- **Tabbed breakdown table** with a share-of-calls bar, calls, error rate, latency, a delta column,
  server-side top-N and search, and a full-list dialog. `Share of calls` is normalized against the
  window total, not against the top row.
- **No polling**: a manual `Refresh` control, and no interval selector.

## Non-goals

- **Touching the existing dashboard.** No component, constant, fold or spec of the current
  implementation is modified, and the entity Audit tab keeps rendering it.
- **Removing the old implementation.** Both pages coexist; retiring `/dashboard` is a later
  decision, not part of this change.
- **A Routes view.** The usage log has no `route_path`: routes live in the telemetry dataset's own
  `routes_analytics` table, pre-templated, and ADAS exposes no equivalent. `event_kind = 'route'`
  names the routed deployment, not the path, so a Routes view here would answer a different
  question under the same word. Deferred until ADAS carries the column.
- **Tree mode on the breakdown table**, a **richer row detail panel** (per-method list, its own
  time series, child entities), and **entity / project filters**. All three were in the first plan
  and are not built; see `tasks.md` § Out of scope.
- **User-created dashboards** from the design: the widget library, layout editing, drafts, sharing,
  `Duplicate as custom`. Only the system dashboard is in scope.
- **Auto-refresh.** The data is ~11 minutes behind by construction, so polling faster than that
  reads the same rows; a manual control is honest about it.

## Capabilities

### New Capabilities

- `dashboard-redesign-gating`: the environment flag, the route and menu surfaces it reaches, and
  the rule that the new page shares no mutable state and no modified component with the old one.
- `dashboard-period-comparison`: the `Compare` control, how the previous window is derived, and the
  rule that each window is a request of its own.
- `dashboard-query-consolidation`: the per-widget request contract, the row-limit rule every
  bucketed request states, per-request failure degradation, and the manual `Refresh` affordance.
- `dashboard-kpi-row`: the KPI cards, their delta and sparkline presentation, which request each
  figure comes from, the upstream-only summation the token figures require, and the rule that a
  window with no calls states no figure rather than a zero.
- `dashboard-breakdown-table`: the tabbed table, its per-view tab sets, the share bar and its
  normalization, the delta column and when a row may be called new, server-side top-N and search,
  the fallback labels, and the full-list dialog.
- `dashboard-activity-heatmap`: the hour × day grid, its independent week, intensity scale, future
  cells and empty-cell rules.
- `dashboard-share-breakdown`: the donut, its top-5 + `Others` folding, the residual taken from the
  window total, and its share and tie rules.

### Modified Capabilities

None. The existing dashboard's capabilities — `mcp-dashboard-view`, `entities-consumption-tree`,
`consumption-project-aggregation`, `dashboard-total-tokens-chart`,
`telemetry-call-grid-fallback-labels` — keep describing the implementation on `/dashboard`, which
this change leaves untouched. Where the new page needs the same behaviour (the `No Project` and
`Direct call` fallbacks), its own specs state it for its own module rather than amending theirs.

## Impact

- **New**: `src/app/[lang]/usage/page.tsx`; a module under `src/components/Analytics/Usage/`
  holding the page, its controls, the KPI row, the time series and its four plots, the heatmap, the
  donut and its figure, the breakdown table and grid, the empty states and the delta value; its own
  query builders, response folds and window/bucket/scale utilities; one domain-free share bar under
  `src/components/Common/`.
- **Modified**: `src/models/feature-flags.ts` and the root layout (the new flag),
  `src/components/Menu/menu-configuration.tsx` (the new item), `src/types/routes.ts` (the new
  route), `.env.template` (commented entry), `src/constants/i18n.ts` and `src/locales/en.ts` (new
  keys only — no existing key is repurposed), `src/scss/style.scss` plus a new
  `src/scss/ui-kit-2-tokens.scss` (dark values for the ui-kit 2.0 token set, which the themes
  service does not yet serve).
- **Modified, shared**: `src/components/Common/TimeFilter/TimeFilter.tsx` gains an `appearance`
  prop defaulting to the existing look. See D8 for why the mismatch is not handled in a wrapper.
- **Untouched**: `Telemetry/**`, `constants/telemetry.tsx`, `utils/telemetry.ts`,
  `EntityTabs/Audit/EntityAudit.tsx`, and every existing dashboard spec.
- No server action, API client or backend contract changes: the page issues structured queries
  through the existing `executeQuery` action.
