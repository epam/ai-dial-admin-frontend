## Context

See proposal.md — Why. The pieces this change composes already exist:

- **Saved queries** (`analytics/saved-queries`) store a body (structured DSL or SQL), a time intent, a
  result view and a chart configuration, and the query page restores all of them.
- **Rendering**: the query viewer draws a result as a `GridView` table (`QueryBuilder/Result/ResultArea.tsx`)
  or an ECharts chart (`QueryBuilder/Result/ResultChart.tsx`, `chart-options.ts`). `ResultArea` is an
  editor surface — it owns the view toggle and CSV export — so a widget composes the table and the chart
  directly rather than embedding it.
- **Time range**: `hooks/use-time-filter.ts` is the period selector state; the query page turns it into
  bounds with `timeRangePredicates` / `withTimeBound` on the field `findTimestampField` picks
  (`QueryBuilder/utils/time.ts`). SQL bodies are never rewritten.
- **Execution**: `Analytics/Common/use-analytics-query.ts` runs a structured query through
  `/api/analytics/query`; the data API client also covers `execute-sql` and `translate-sql`
  (`server/analytics/analytics-data-api.ts`). There is no execute-by-id and no batch execution, and the
  service caps a page at 1000 rows.
- **SQL translation**: the service runs a single-block SQL statement by translating it to the DSL, and
  `translate-sql` returns that same DSL. A composite statement (join, subquery, derived table) runs but
  has no DSL form.
- **Layout today**: the usage dashboard is fixed flex markup; the repo has `react-dnd` and `re-resizable`
  but no grid engine.

## Goals / Non-Goals

**Goals:**

- One model a dashboard of any size is read and written through, with no per-widget writes.
- Every query a user can save can be put on a dashboard; the limits of composite SQL are stated on the
  widget, not hidden.
- Layout editing reachable by keyboard from the first version.

**Non-Goals:**

- Per-user or per-role sharing beyond Private and Public (see Decisions — Access).
- Generalising the usage dashboard into widgets (its views are offered as widget views instead).

## Decisions

### Widgets live inside the dashboard aggregate

A widget is a member of its dashboard and every change is one replace of the whole dashboard, guarded by
its generation.

- *Alternative — widget as its own resource with CRUD:* a layout change touches several widgets at once
  (a move reflows the ones below), so it would become several writes that can half-succeed, and a reader
  could see a layout no one saved. Reusing one widget on several dashboards (Grafana's library panels) is
  the only thing it buys, and the saved query already is the reusable unit.
- The `Dashboard` and `Widget` interfaces are still separate types in `src/models/analytics/`, so a later
  split does not change call sites.

### A widget references its saved query

The widget stores the saved query's id, never a copy of its body or view settings, so editing the query
updates every dashboard it is on — the Superset, Redash and PostHog model.

- *Alternative — embed a copy (Grafana's default):* the widget is self-contained, but copies drift from
  their source and the user ends up maintaining duplicates.
- The cost is that deleting a saved query leaves its widgets pointing at nothing; they show the
  not-available placeholder and keep Remove in their menu.
- *Two exceptions hold an inline copy:* SQL typed straight into Add widget, which has no saved query, and
  publishing, which copies each personal query so other viewers can run it. A copy no longer follows its
  source; that drift is the price of not exposing a personal query by reference.

### Grid engine: react-grid-layout 2.x, 12 columns, vertical packing

`react-grid-layout` is what Grafana, Metabase and PostHog ship; 2.x is a TypeScript rewrite with hooks
(`useContainerWidth`). Configuration: 12 columns, a fixed row height (80px), vertical compaction, drag
and resize enabled only in edit mode, one column below 768px with editing off. Placement is persisted as
`{ x, y, w, h }`, the shape every surveyed tool persists.

- *gridstack.js:* imperative DOM ownership fights React's.
- *dnd-kit:* the only option with built-in keyboard support, but it has no grid packing, resize or
  collision handling — we would be writing the grid engine.
- *Custom CSS-grid engine (Kibana's route):* most control, highest cost; not justified for an MVP.
- *Existing `react-dnd` + `re-resizable` (Superset's route):* Superset uses them for a row/column tree,
  not a packed grid; packing and collision would again be ours.
- The grid renders in a `'use client'` component and measures its width before mounting widgets, so the
  server render never lays out at a wrong width. Widget children are memoised, which 2.3 requires.
- The engine has no keyboard move or resize, which is why the widget menu carries Move up/down and size
  presets (see below).

### Keyboard layout editing through the widget menu

Move up / Move down swap a widget with its neighbour in reading order (y, then x) by exchanging their
positions; Extra small / Small / Medium / Large set `w×h` to 3×2, 4×3, 6×4, 12×4 — Extra small fits one KPI
card, four to a row. The menu is the kit's dropdown menu on an
icon button with an accessible name, so it is keyboard-reachable without extra wiring. This meets the
keyboard-parity rule in `.claude/rules/a11y.md` without a second drag implementation.

### Loading: one read for the dashboard, one request per widget run

The dashboard page's server component reads the dashboard and, in parallel, every distinct saved query
its widgets reference; for a SQL query it also calls `translate-sql`. Each widget arrives at the client
already **resolved** to one of:

| Resolution | When | How the widget runs |
| --- | --- | --- |
| structured | DSL body, or SQL that translates | `execute` with the dashboard range bound and `page.limit = row_limit` |
| composite SQL | translation answers no DSL equivalent | `execute-sql` with the stored text, unchanged |
| unavailable | query missing or unreadable (403 or 404) | not-available placeholder, no run |
| failed | any other failure reading or resolving the query | error state with Retry, which resolves again |

Widgets then run independently from the client through the existing analytics query hook, so a slow or
failing one does not block the rest and a range change re-runs only the widgets that take a range.

- *Alternative — run every widget inside the page's server read:* one round trip, but the page waits for
  the slowest widget and one budget overrun fails the whole page.
- *Alternative — translate SQL on every range change:* translation does not depend on the range, so it is
  done once per page load. It is redone on every load, not cached on the widget, because the saved query
  can change after it was added.
- No concurrency cap in this version (non-goal); every widget starts at once.

### Time range: one selector, transient in view mode

The header reuses the usage dashboard's period selector via `use-time-filter`, initialised from the
dashboard's stored time intent. The range is bound into each structured body with the query page's own
helpers, so a widget and its query page compute the same bounds for the same range. In view mode a change
only re-runs widgets; in edit mode it joins the draft. The saved query's own time intent is ignored on a
dashboard.

### Compare: one dashboard choice, two views use it

The dashboard stores `compare` beside its time intent and treats it the same way. The compared window
comes from the usage dashboard's `buildComparedWindows`, so both dashboards compare the same span for the
same choice. Single value, Time series and tables draw a comparison: a delta on one figure, an overlaid line,
and a change badge beside each table figure, which is how the usage breakdown reads a compared table. A
table row is matched to the compared row with the same dimension values. The table cell is the breakdown's
`MeasureCell`, made generic over its row so a query result can feed it. A donut, a heatmap or a chart with
a second window doubles its marks without a clear reading, so those widgets show only the current window
and skip the second request. The badge colour comes from the widget's "A rise is" setting, because the
widget, unlike a usage metric, cannot know whether a rise is good.

### Widget views are judged from the executed result

A widget's `view` is stored on the widget, not the saved query: the same query can be a table on one
dashboard and a single figure on another. Which views fit is decided from the executed query's meta —
dimension and aggregate columns, and the date-time value class (or, for a computed column such as a
`date_trunc` bucket, which carries no schema class, values that are all ISO instants) — the same classification the query page
uses for its chart pickers, so no second reading of the DSL is needed. The picker therefore lives in Edit
settings, where the widget has a result; a new widget starts with the query's own view. A stored view that
no longer fits falls back to the query's own view instead of an error, since the query changing under the
widget is expected. A Single value widget is the usage dashboard's `KpiCard` itself rather than a widget frame around a figure,
so the two dashboards' figures look the same; it shows one aggregate, chosen per widget, so one query with
several aggregates feeds several cards. Its sparkline is a second run of the same query grouped by an hourly (up to a week) or daily `date_trunc`
of the time field, kept separate so a slow trend never holds up the figure. Its badge takes its colour from
the widget's "A rise is" setting, because the widget, unlike a usage metric, cannot know which way is good.
The Activity heatmap always reads the calendar week holding the range's end — the usage heatmap's unit —
so a two-day range does not draw two lonely rows.

Widget views are the usage dashboard's own components, not lookalikes: the frame is `DashboardCard` (with a
header class for the drag handle), Share is `DonutFigure`, the heatmap is `HeatmapWeekGrid` (the grid taken
out of `ActivityHeatmap`, which now renders it too), and the line chart comes from
`buildValueTimeSeriesOptions`, which `buildTimeSeriesOptions` now wraps. The two usage builders were widened
from usage buckets to a time → value series (`TimedValue`) so a query column can feed them; the usage
dashboard passes the same figures it did before.

### Edit mode is a draft compared by payload

Edit mode holds a draft copy of the write payload (name, description, time intent, widgets). Save is
available when the draft's payload differs from the stored dashboard's payload — the same "compare what
would be written" rule the query page uses, so the indicator cannot disagree with what is persisted. A
refused stale save keeps the draft and reports the conflict; the user reloads to see the other version.

### Row count field

`DEFAULT_WIDGET_ROWS = 100` and `MAX_WIDGET_ROWS = 1000` live in `src/constants/analytics/dashboards.ts`: the
add-widget modal, widget settings, Add to dashboard on the query page and the model's validation all read
them. The range is stated through the ui-kit label's own `caption`, which renders as a keyboard-reachable
info button next to the label; `Common/FieldCaveat` carries the composite-SQL hint in a widget header,
where there is no form label. A new widget starts from its query's saved page limit
(`getInitialRowLimit`), so it shows what the query page shows; the widget's own value wins after that,
since the dashboard decides how much room a widget has. The written payload always carries an explicit integer, so no layer has to know the default
except the form that fills it.

### Switcher and routes

`/dashboards` stays the usage dashboard; `/dashboards/[id]` is a new `force-dynamic` page that answers
not found unless the custom-dashboards flag and the analytics page are both on, deciding from the same
inputs as the switcher. The switcher is the kit's select with the dashboards as options and Create
dashboard as a trailing action entry; if the select cannot carry an action entry, a dropdown menu with the
same items is used instead — the spec fixes the items, not the control.

### Storage: the Analytics service owns dashboards

Dashboards are an entity of the Analytics service, beside saved queries, under `/v1/dashboards`: list,
read, create, whole-document replace guarded by `generation`, delete. The Admin server API is a thin client
of it; the server actions and the UI keep the shape they had. The service validates every write (422 with
its message) and answers a stale replace with 409, so Admin keeps no payload validator of its own: the
forms bound only what they offer, the row limit and the layout, and a refused write shows the service's
message. A 409 is the one refusal Admin words itself, as "changed elsewhere", because the service's
message names the dashboard by id.

- *Alternative — store dashboards in Admin:* no backend dependency, but a store in Admin's process loses
  everything on a restart and differs between replicas, so it cannot reach an environment.
- *Alternative — store them as files in DIAL Core:* durable, but ownership, visibility and the refusal of
  unseen dashboards would be re-implemented beside the saved-query rules they mirror.

### Access

Dashboards mirror saved-query scope: Private is the owner's, Public is everyone's who can open Analytics,
and the publish permission that guards common saved queries guards Public dashboards and every visibility
change. An unseen dashboard answers 404, the service's non-disclosure rule for saved queries.

The service reports with each dashboard whether the caller may write and publish it, and with the list
whether the caller may create a Private or a Public one. Admin reads those flags rather than mapping roles
to privileges itself, so a change to the service's role mapping needs no change here.

Admin never decides data access. Each widget runs with the viewer's token, so table grants, sensitive
columns and row policies apply per viewer, and no result is stored or shared between viewers — a cached
result would carry one viewer's row policy to another. A 404 on the query and a 403 on the data render one
identical placeholder, so a viewer cannot tell a deleted query from a forbidden one.

- *Alternative — refuse to publish while personal queries are referenced:* safe, but forces the author to
  promote each query to common first, which needs the same administrator anyway. Copying keeps publishing
  one step, and the confirmation names what becomes visible.
- *Alternative — hide a dashboard with no readable widget from the list:* deciding that needs every widget
  run at list time; the dashboard-level message costs nothing and discloses nothing more.

## Risks / Trade-offs

- [The service refuses a widget field Admin sends] → the service rejects unknown fields, so a display
  preference the service does not model — the Unit setting and its currency — goes in the widget's
  `settings`, an object the service stores as sent and never reads. A replace writes the whole document and
  drops any `settings` it omits, so Admin writes back every dashboard and widget `settings` member it does
  not set itself.

- [A published inline copy exposes the text of a personal query] → the publish confirmation names every
  query that will be copied before anything is written.
- [Row policies make the same widget show different figures to different viewers, silently] → accepted;
  a "rows restricted" marker needs the service to report which tables a query reads.
- [Many widgets start many queries at once against a 20s budget] → widgets fail independently; a
  concurrency cap is a listed follow-up.
- [react-grid-layout makes no official React 19 statement] → Grafana, Metabase and PostHog run it on
  React 19; the first task pins the version and the grid is isolated in one component.
- [Two editors save the same dashboard] → generation check refuses the second save and keeps the draft.
- [Composite SQL widgets ignore the dashboard range] → stated on the widget with an info hint; removing
  the limit needs query parameters, which is out of scope here.

## Migration Plan

Additive and flag-gated: with `ANALYTICS_CUSTOM_DASHBOARDS_ENABLED` unset nothing renders differently.
Rollback is unsetting the flag.

## Decision: a picked chart lives in the widget's settings

The service accepts a closed set of widget views and rejects any other, so a chart picked on a widget — Bar,
Line or Scatter — is kept as `settings.chart.type` with no `view`, and read back before `view`. The axes
are not stored: a chart of the type the query keeps uses the query's axes, any other takes the first
column that is not an aggregate for X and, for Bar and Line, every other aggregate as a series. Alternative considered: a new
`chart` view token in the service, which keeps `view` honest but needs a service release first.

A widget on an inline copy of a pie query resolves to the Pie chart view, which draws the first category column
by the first aggregate, not the pie's stored axes; a pie stored on other columns shows another figure once it
is copied on publishing. Accepted for now: carrying the pie's value column into the Pie chart view is a
follow-up.

