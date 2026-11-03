## 1. Flag, models and server API

- [x] 1.1 Add `ANALYTICS_CUSTOM_DASHBOARDS_ENABLED` to `src/models/feature-flags.ts`, compute it in `src/app/[lang]/layout.tsx` as the analytics page's own condition AND the new variable, and add a commented entry to `.env.template`
- [x] 1.2 Add `Dashboard`, `DashboardWidget`, `WidgetPlacement`, `DashboardListItem` and `DashboardRequest` interfaces to `src/models/analytics/dashboard.ts`; add `DEFAULT_WIDGET_ROWS`, `MAX_WIDGET_ROWS`, `DASHBOARD_GRID_COLUMNS` and the size presets to `src/constants/analytics/dashboards.ts`
- [x] 1.3 Add a pure validator for a dashboard write payload (row limit 1–1000, width 1–12, column + width ≤ 12, unique widget ids) in `src/utils/analytics/dashboard-validation.ts`
- [x] 1.4 Add the dashboards server API in `src/server/analytics/dashboards-api.ts` — list, read, create, replace guarded by generation, delete — returning the standard action result shape, and refusing payloads the validator rejects
- [x] 1.5 Add server actions in `src/app/[lang]/dashboards/custom-actions.ts` (beside the telemetry `actions.ts`) for list, read-and-resolve (dashboard + distinct saved queries in parallel + `translate-sql` per SQL query, returning each widget as structured / composite SQL / unavailable), create, replace and delete

## 2. Routes and switcher

- [x] 2.1 Add `src/app/[lang]/dashboards/[id]/page.tsx` (`force-dynamic`), answering not found unless the custom-dashboards flag is on, and prefetching the resolved dashboard on the server
- [x] 2.2 Add `DashboardSwitcher` (usage dashboard, custom dashboards, separator, Create dashboard) and host it in the usage dashboard header and the custom dashboard header only when the flag is on
- [x] 2.3 Add `DashboardDetailsModal` (required name, optional description) used for create and Edit details; create navigates to the new dashboard in edit mode

## 3. Dashboard page, grid and edit mode

- [x] 3.1 Add `react-grid-layout` 2.x to the root `package.json`, pinned, and a `DashboardGrid` client component: 12 columns, 80px rows, vertical compaction, drag/resize only when editable, one column and editing off below 768px, memoised children
- [x] 3.2 Add `CustomDashboardView` with view/edit modes: Edit → Save/Discard, draft held as the write payload, Save available only when the draft payload differs from the stored one, discard confirmation, stale-save conflict notification keeping the draft
- [x] 3.3 Add the header actions of a custom dashboard: Edit details and Delete with confirmation, success notification and navigation to `/dashboards`
- [x] 3.4 Add the empty state (Add widget in edit mode, Edit in view mode)

## 4. Widgets

- [x] 4.1 Add a `use-dashboard-widget-data` hook that runs one resolved widget: structured → bind the dashboard range with `timeRangePredicates`/`withTimeBound` on `findTimestampField` and set `page.limit` to the row limit; composite SQL → `execute-sql` with the stored text; unavailable → no run
- [x] 4.2 Add `DashboardWidget`: header with title (or the query name), the composite-SQL `FieldCaveat` hint, loading / empty / error-with-Retry states, and the body rendered with `GridView` or a read-only ECharts chart (`buildChartOptions`) from the saved query's result view and chart configuration
- [x] 4.3 Add the widget menu: Open query (both modes); Edit settings, Remove, Move up, Move down, Extra small / Small / Medium / Large (edit mode), with accessible names and first/last items unavailable
- [x] 4.4 Add `WidgetSettingsModal` used for Add widget and Edit settings: required saved-query picker (add only), optional title, Row count `NumberInput` pre-filled with 100 with the range hint as the label's `caption`, range error on blur/submit, empty → 100, unavailable for composite SQL; new widgets placed at column 0 below the lowest, Medium size
- [x] 4.5 Wire the header period selector through `use-time-filter`, initialised from the stored time intent, re-running range-taking widgets on change; transient in view mode, part of the draft in edit mode

## 5. Add to dashboard from a query page

- [x] 5.1 Add `AddToDashboardModal` (required custom-dashboard picker ending with Create dashboard, optional title) appending a widget with the default row limit at the bottom in Medium size, writing the dashboard once, success notification linking to it
- [x] 5.2 Offer Add to dashboard in the query page toolbar's actions area when the flag is on and the page holds no unsaved changes

## 6. i18n, specs index and tests

- [x] 6.1 Add i18n keys for every new string under a `CustomDashboardsI18nKey` enum in `src/constants/i18n.ts` and `src/locales/en.ts`, reusing `ButtonsI18nKey`/`BasicI18nKey` where they exist
- [x] 6.2 Add the `analytics/custom-dashboards` row to the routing table in `openspec/specs/analytics/spec.md`
- [x] 6.3 Write unit tests: the payload validator, the server API (generation conflict, refused payloads), the resolve action (structured / translated SQL / composite / unavailable), range binding and row limit in the widget hook, Move up/down and size presets, placement of a new widget
- [x] 6.4 Write component tests: switcher items and navigation, flag-off absence on `/dashboards`, `/dashboards/[id]` and the query page, view/edit mode and Save availability, widget states, Row count validation and hint, composite SQL hint, Add to dashboard availability with and without unsaved changes

## 7. Compare and widget views

- [x] 7.1 Add `compare` to the dashboard model and write payload (default Off), the Compare selector in the custom dashboard controls row sharing the usage dashboard's options, transient in view mode and part of the draft in edit mode
- [x] 7.2 Add `WidgetView` to the widget model, a pure `getFittingViews(meta, rowCount)` util and the View picker in Edit settings listing only fitting views; a stored view that no longer fits renders the query's own view
- [x] 7.3 Render Single value, Time series, Share and Activity heatmap widget views; run the compared window for Single value and Time series while compare is on, showing a neutral delta and a dashed compared line
- [x] 7.4 Write unit tests for `getFittingViews` and the view builders, and component tests for the Compare selector, the View picker and each view
- [x] 7.5 Add Default compare to the create and Edit details modal, and name empty chart categories "(no value)" in the shared chart builders and the Share view, with unit and component tests
- [x] 7.6 Compare table widgets with the usage breakdown's `MeasureCell` (made generic over its row), matching rows by dimension values, with unit tests for the row match and the comparing-view rule

## 10. Access and query sources

- [x] 10.1 Add visibility, owner and the inline query to the models, refuse a widget with both or neither source in the validator, and let the dashboards server API filter, refuse and answer 404 by caller identity
- [x] 10.2 Resolve inline queries alongside references, keyed per widget, and report refused data runs so widgets can tell a refusal from a failure
- [x] 10.3 Offer visibility to a full administrator in the create and Edit details modals, hide editing on a dashboard the caller may not write, and copy personal queries on publish after a confirmation naming them
- [x] 10.4 Add the Source choice and SQL field to Add widget and Edit settings, and the read-only query preview
- [x] 10.5 Render the not-available placeholder and the dashboard-level message, and drop Open query from inline widgets
- [x] 10.6 Write unit and component tests for the validator, visibility rules, the publish copy, the SQL source, the preview and the placeholder
- [x] 10.7 Swap the Add widget SQL textarea for a compact SQL editor shared with the query builder's SQL view
- [x] 10.8 Warn with a banner in Add widget and Add to dashboard when a personal query is about to be copied onto a public dashboard, with component tests

## 11. Storage in the Analytics service

- [x] 11.1 Replace the in-process store in `src/server/analytics/dashboards-api.ts` with a client of the service's `/v1/dashboards` endpoints — the list's `dashboards` wrapper, `generation` in the replace body, 409 on a stale replace, 422 with the service's message on a refused write — keeping the server actions' result shapes, and drop Admin's payload validator (`src/utils/analytics/dashboard-validation.ts`), which the service's own validation replaces
- [x] 11.2 Take write, publish and create permissions from the service's answers in the create and Edit details modals, the dashboard header and Add to dashboard, and drop the Admin-side owner filtering and caller identity
- [x] 11.3 Write unit tests for the client (called URL, request body, parsed response, error paths) and component tests for the permission-driven controls
- [x] 11.4 Offer Create dashboard only to a caller the service lets create one — the visibility only when it may create both, Public preselected when it may create only Public, and Add to dashboard's Create only when it may create a Private one — and word a 409 on any dashboard write as "changed elsewhere", with tests
- [x] 11.5 Store the Unit setting and its currency in the widget's `settings`, and carry the dashboard's and each widget's `settings` through every replace, with tests
- [x] 11.6 Run the `spec-browser-verify` skill against the local stack with the service's dashboards endpoints, for the scenarios that write or read a dashboard, and resolve every `fail`
- [x] 11.7 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test` and fix every failure

## 8. Browser verification

- [x] 8.1 Run the `spec-browser-verify` skill for this change against the local stack booted with `ANALYTICS_ENABLED`, `ANALYTICS_USAGE_ENABLED` and `ANALYTICS_CUSTOM_DASHBOARDS_ENABLED` truthy and auth disabled; it builds a VerificationRequest from the change's scenarios and runs them through the `spec-verification-gate` sub-agent. Resolve every `fail` verdict before the change is complete; flag-off scenarios stay covered by the unit and component tests

## 9. Quality checks

- [x] 9.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test` and fix every failure
