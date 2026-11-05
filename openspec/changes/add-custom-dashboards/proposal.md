## Why

The query builder already renders a saved query as a table or a chart, and the Dashboards page already
shows a fixed usage dashboard, but nothing connects the two: a user who has built a useful query has no
way to keep its result in view next to other ones. This change lets users assemble their own dashboards
from saved queries, starting with the core model — a dashboard, its widgets, their placement — on which
later iterations (filters, permissions, refresh, more widget kinds) can build.

## What Changes

- A new **custom dashboard** object: a name, a shared time range, and an ordered set of **widgets**. A
  widget is part of its dashboard and is stored inside it; it references one saved query by id, carries
  its placement on a 12-column grid, an optional title, and a row limit.
- The `/dashboards` page gains a **dashboard switcher** in its header. The built-in usage dashboard stays
  the default and is unchanged; custom dashboards open at `/dashboards/[id]`. The switcher always offers
  **Create dashboard**.
- A custom dashboard has a **view mode** and an **edit mode** with Save and Discard. In edit mode widgets
  are added, removed, moved and resized; every change is saved as one write of the whole dashboard.
  Moving and resizing are also reachable from each widget's menu, so the layout is editable by keyboard.
- A widget renders its saved query's own result view (table or chart) and chart configuration, under the
  dashboard's time range. A SQL query whose statement has a single-entity form takes the dashboard's time
  range and the widget's row limit like a structured query does; a composite SQL statement (join,
  subquery, derived table) runs as written and the widget says so.
- A dashboard offers the usage dashboard's **Compare** selector, off by default; Single value and Time
  series widgets show the comparison.
- A widget can be shown in a **view** other than its query's own: Table, Single value, Time series, Share
  or Activity heatmap. Its settings offer only the views its result fits.
- A saved query's page gains **Add to dashboard**, offered while the page holds no unsaved changes. It
  picks a custom dashboard (or creates one) and appends a widget at the bottom of its grid.
- A dashboard is **Private** (its owner's) or **Public** (everyone with Analytics). Changing visibility and
  writing a Public dashboard take the publish permission, as reported by the service. An unseen dashboard
  answers as not found.
- Dashboards are stored by the Analytics service, so they survive restarts and are the same on every
  server instance.
- A widget's source is a saved-query **reference** or an **inline query** — SQL typed in Add widget, or a
  copy. Making a dashboard Public copies every personal query its widgets reference, after a confirmation
  naming them; common-query references stay references.
- Widgets run with the viewer's own credentials and nothing is cached between viewers. A widget the viewer
  may not read shows one not-available placeholder; a dashboard with no readable widget says so once.
- Add widget and Edit settings preview the picked query's body.
- A new environment flag gates everything above. With the flag off the Dashboards page is exactly as
  today.
- New dependency: `react-grid-layout` 2.x, the grid engine used by Grafana, Metabase and PostHog.

## Capabilities

### New Capabilities

- `analytics/custom-dashboards`: custom dashboards as addressable objects — the flag, the dashboard and
  widget model, the server API layer, the dashboard page with its view and edit modes, the grid, widget
  rendering and its time-range and row-limit rules, create, rename and delete.

### Modified Capabilities

- `analytics/dashboards`: the Dashboards page header gains the switcher between the built-in dashboard
  and custom ones.
- `analytics/saved-queries`: a query page gains Add to dashboard.

## Non-goals

- Per-user or per-role sharing beyond Private and Public.
- Dashboard-level filters other than the time range, and query parameters.
- Auto-refresh and a manual refresh control.
- A cap on concurrent widget queries and lazy loading of off-screen widgets.
- Widget kinds beyond the saved query's table and chart views (KPI tiles, text, markdown).
- Making the built-in usage dashboard editable, or rebuilding it out of widgets.
- Moving dashboards between environments through Export Config.

## Impact

- **Routes**: `src/app/[lang]/dashboards/page.tsx` (switcher), new `src/app/[lang]/dashboards/[id]/page.tsx`
  and `src/app/[lang]/dashboards/custom-actions.ts`.
- **Components**: new `src/components/Analytics/CustomDashboards/`; widget rendering reuses the query
  viewer's result columns and chart options (read-only, without the editor's view toggle and axis
  pickers); the widget-header hint reuses `Common/FieldCaveat`. The usage dashboard under `src/components/Analytics/Usage/` is not changed beyond
  hosting the switcher in its header.
- **Query page**: `src/app/[lang]/queries/[id]` toolbar actions area gains Add to dashboard.
- **Models / flags**: new dashboard and widget models under `src/models/analytics/`, a new member on
  `src/models/feature-flags.ts`, wiring in `src/app/[lang]/layout.tsx`, a commented entry in
  `.env.template`.
- **Server**: a new dashboards server API under `src/server/analytics/`, a client of the Analytics service's
  `/v1/dashboards` endpoints; widgets use the existing `execute`, `execute-sql` and `translate-sql`
  endpoints of the same service.
- **Specs / docs**: a new row in the `openspec/specs/analytics/spec.md` routing table.
