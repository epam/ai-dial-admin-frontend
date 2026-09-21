## 1. Flag, route and module shell

- [x] 1.1 Add `analyticsUsageEnabled: boolean` to `src/models/feature-flags.ts` and initialize it in
      `src/app/[lang]/layout.tsx` from `ANALYTICS_ENABLED && ANALYTICS_USAGE_ENABLED` via
      `isValueTruthy`, beside the existing flags. Add the variable to `.env.template` as a
      commented entry.
- [x] 1.2 Add `src/app/[lang]/usage/page.tsx`: `notFound()` unless both flags are truthy, `Page403`
      when `isAnalyticsForbidden()`, otherwise the module's page root. Add the route to
      `src/types/routes.ts` and the menu item to `src/components/Menu/menu-configuration.tsx`, in
      the Analytics group after Queries, filtered out when the flag is off.
- [x] 1.3 Scaffold `src/components/Analytics/Usage/` with the page root, a `models.ts` for its types
      and a `constants.ts` for its const values, kept separate per `.claude/rules/code-standards.md`.
- [x] 1.4 Unit tests: the page mounts, the route and menu gates agree on the flag pair.

## 2. Requests, windows and folds

- [x] 2.1 Add `Usage/utils/windows.ts`: derive the previous window from the current one — the same
      span ending where the current begins — for both a preset and a custom range.
- [x] 2.2 Add `Usage/queries.ts`: the structured-query builders — totals, bucketed, per-dimension
      bucketed, breakdown tab and calendar-truncated spend — plus the shared select aliases. Every
      window bound is an epoch-millis timestamp literal; every bucketed shape states its row limit.
      Do not import `src/constants/telemetry.tsx`.
- [x] 2.3 Add `Usage/utils/folds.ts`: read the typed rows by select alias into measures, bucket
      points, per-dimension bucket points, spend buckets and breakdown rows. Do not import or modify
      the existing dashboard's folds.
- [x] 2.4 Count tokens only on rows that reached an upstream, so an orchestrator's row does not
      repeat its children's tokens; leave spend unguarded, since an orchestrator row carries none.
- [x] 2.5 Add `Usage/use-usage-dashboard-data.ts` as the request holder: issue each shape per window,
      hold `{ data, isLoading, hasFailed, error }` per shape, drop a superseded response through a
      generation counter, and never reject.
- [x] 2.6 Unit tests for 2.1–2.4: window derivation, the builders' filters, aliases, limits and
      timestamp form, and every fold including the missing-dimension fallback id.

## 3. Controls bar

- [x] 3.1 Add `Usage/Controls/` with the module's own view selector (LLM / MCP), reusing
      `Common/TimeFilter` for the period.
- [x] 3.2 Add the `Compare` selector (`Previous period` / off), on by default, held across a view
      switch.
- [x] 3.3 Add the manual `Refresh` control: re-take the window and re-issue every request once per
      activation, disabled while any request is in flight. Mount no timer anywhere in the module.
- [x] 3.4 Component tests: both selectors report their choice, refresh fires once and is disabled
      while in flight, and the window is taken exactly once per input change.

## 4. KPI row

- [x] 4.1 Add `Usage/Kpi/KpiCard.tsx`: value, unit, delta and sparkline, with the delta rendered as
      an arrow plus a magnitude and its direction also given as text for a screen reader.
- [x] 4.2 Add `Usage/Kpi/Sparkline.tsx` (ECharts): a line over the current window's buckets, no
      axes, legend, tooltip or interaction.
- [x] 4.3 Add `Usage/Kpi/KpiRow.tsx`: the cards each view offers, in order — spend, requests,
      tokens, cost per 1M tokens, unique users, error rate and average latency for LLM; requests,
      tool calls, unique users, error rate and average latency for MCP. A window with no calls
      states no figure on any card rather than a zero on some.
- [x] 4.4 Component tests: per-view composition, value and unit formatting, the empty-window rule,
      the comparison footnote carrying its unit, and the failure state.

## 5. Time series and activity heatmap

- [x] 5.1 Add `Usage/Charts/TimeSeries.tsx` (ECharts) with a tab control over four plots: requests,
      a stacked split by the view's leading dimension, spend, and p50/p95 latency. The bucket grid
      is padded across the whole window, so a window whose traffic stops halfway is not redrawn as
      a shorter window.
- [x] 5.2 Add `Usage/utils/spend-periods.ts` and the spend plot: 14 days when the page window is a
      week or less, 12 months when it is longer, the period the window ends in picked out.
- [x] 5.3 Add `Usage/Charts/ActivityHeatmap.tsx` over `Common/HeatMap/HeatMapGrid` on its own week:
      seven day rows and 24 hour columns whatever the response carried, week-by-week paging,
      intensity scaled to the week's busiest cell, hours that have not happened yet left blank and
      silent, a legend naming both ends, and a per-cell accessible name carrying day, hour and count.
- [x] 5.4 Component tests: the four plots and their legends, the padded grid, the spend scale and
      its periods, heatmap paging, the empty week, and the scale legend.

## 6. Share breakdown donut

- [x] 6.1 Add `Usage/Charts/ShareBreakdown.tsx` and `DonutFigure.tsx` (ECharts): the view's leading
      dimension, top five plus one `Others` slice taken from the window total, the total in the
      centre, ties ordered by name, and the dimension's fallback label for a missing name. The
      ranking is its own request, so the ring does not change meaning when the breakdown tab below
      it changes.
- [x] 6.2 Add the full-list dialog: the same figure over every row fetched, its legend scrollable
      and filterable, the ring left whole while the list narrows.
- [x] 6.3 Component tests: folding and the residual, the empty window, the dialog and its filter.

## 7. Breakdown table

- [x] 7.1 Add `src/components/Common/ShareBar/ShareBar.tsx` — neutral linear bar, fill proportional
      to a 0–1 ratio, no value-dependent colouring.
- [x] 7.2 Add `Usage/Breakdown/BreakdownTable.tsx` and `BreakdownGrid.tsx` on `Grid/GridView` with
      `Common/TabSelector`: per-view tab sets, the share bar normalized against the window total,
      calls, error rate, average latency, and the delta column when comparison is on. No column
      sort and no column filters on the card, since the rows are one ranked page.
- [x] 7.3 Wire server-side top-N and search: `orderBy` + `limit` on the tab builder, an `Ico` clause
      for the search term, debounced, and an empty-result state naming the term.
- [x] 7.4 Add the full-list dialog: the same grid at the full page size, with its own column filters
      — there the page is the whole list.
- [x] 7.5 Add `Usage/Breakdown/RowDetailPanel.tsx` over `Common/SidePanel`: calls, share using the
      table's normalization, error rate and average latency.
- [x] 7.6 Add the module's fallback labels — `No Project` and `Direct call` with view-specific
      tooltips — to the tabs and the donut slices.
- [x] 7.7 A row absent from the previous window is called new only when that window's response was
      the whole dimension; when it recorded nothing, or was cut at the page size, the row states no
      comparison instead.
- [x] 7.8 Component tests: tab sets per view, share normalization, the delta column and the
      new-row rule in all three of its cases, search, the empty state keeping the grid's headers,
      and the dialog's filters.

## 8. Empty states, i18n and quality gate

- [x] 8.1 Add the module's empty states: the time series keeps its axes and states the window was
      idle, the donut keeps its silhouette, the heatmap keeps its grid, the breakdown keeps its
      headers, and a KPI card keeps its shape and states no figure.
- [x] 8.2 Add the module's i18n keys to `src/constants/i18n.ts` and `src/locales/en.ts`, reusing
      shared keys where they exist (`BasicI18nKey`, `ButtonsI18nKey`) per
      `.claude/rules/components.md` §10. Repurpose no existing key.
- [x] 8.3 Add `src/scss/ui-kit-2-tokens.scss` with dark values for the ui-kit 2.0 token set the
      themes service does not serve, registered in `src/scss/style.scss`, carrying its own removal
      condition.
- [x] 8.4 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run test` from the
      repository root; run single specs with `npx vitest run <file>` from `apps/ai-dial-admin/`
      while iterating. Resolve every failure before the change is complete.

## 9. Responsive layout and failure reporting

Follow-up on the shipped module, kept in this change because the deltas it answers to are still
unarchived.

- [x] 9.1 Reflow the KPI row from the row's measured width rather than a breakpoint: the cards sit
      on one line when they all fit, and otherwise split across two lines rather than leaving one
      card alone on the second.
- [x] 9.2 Give the charts a taller plot area, sample the line series so a long window stays legible,
      and derive the bucket size from the window alone — a resize SHALL NOT re-issue a request.
- [x] 9.3 Let the donut sit beside its legend on a narrower card, and let the legend shrink below
      its longest label: an unbreakable entity name otherwise fixes the list's intrinsic minimum and
      spills it past the card. Truncate the label with the ui-kit ellipsis tooltip.
- [x] 9.4 Compact the heatmap's week pager onto the card's title line, widen the day-label column,
      and raise the row height on a narrow card.
- [x] 9.5 Keep the breakdown's search and tab control together on one line, and pin `View all` to
      the title's line.
- [x] 9.6 Add `Usage/use-load-failure-notice.ts`: one notification per distinct message for the life
      of a load, shared by the data and heatmap hooks, with the widget left in its empty state.
- [x] 9.7 Unit tests for 9.1–9.6, and the full gate from 8.4 again.

## Out of scope

Planned while this change was first written, not built, and deliberately left out rather than
carried as unfinished work. Each is a change of its own.

- **Tree mode on the breakdown table.** A `Group by parent deployment` toggle rendering rows
  through `Common/TreeGrid` with a persisted preference. The usage log's `parent_deployment` makes
  it possible; nothing in the module depends on its absence.
- **A richer row detail panel.** The per-method list, a requests-over-time chart for the row, and
  the row's child entities. The panel ships with the four figures the row already carries.
- **Entity and project filters.** An `Add filter` affordance over distinct values of the active
  dimension. The query scope already accepts the clauses; no caller sets them.
- **A stated full row count.** `View all` opens the full list without naming how many rows it holds,
  because the count the page could state is the count of the page it fetched.
- **A retention cap and delta suppression.** The realtime dataset's range limit does not apply to
  the usage log, so there is no union range to overflow and no delta to suppress.
- **A Routes view.** See proposal.md — Non-goals: the usage log has no route path.
