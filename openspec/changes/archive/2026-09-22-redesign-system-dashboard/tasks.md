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
- [x] 2.4 Sum tokens and spend over the same rows, so cost per 1M tokens divides two figures
      resting on one basis. Count callers by the principal reference, which an API-key call carries
      and the anonymized user hash does not.
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
      tokens, cost per 1M tokens, unique callers, error rate and average latency for LLM; requests,
      tool calls, unique callers, error rate and average latency for MCP. A window with no calls
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

## 10. Measure corrections and breakdown legibility

- [x] 10.1 Sum prompt and completion tokens over every row the view covers, dropping the
      upstream-URI guard: the rows it excluded are ordinary model calls carrying half of all spend,
      so it unbalanced cost per 1M tokens against its own numerator.
- [x] 10.2 Count the caller KPI by the principal reference rather than the anonymized user hash,
      and rename the metric to `Unique callers` — the figure now covers both a token call's user
      and an API-key call's project.
- [x] 10.3 Round a chart tooltip's figure to one decimal; an axis tick keeps two. Cost and latency
      printed a raw float before.
- [x] 10.4 State under the breakdown's title what the active tab counts and what one of its rows
      aggregates, naming the tab's fallback bucket where it has one.
- [x] 10.5 Add the cost column to the breakdown in the LLM view only, since an MCP row carries no
      price.
- [x] 10.6 Unit tests for 10.1–10.5.

## 11. MCP breakdown legibility

- [x] 11.1 Label the `Tools` tab's empty bucket `Other methods` with a tooltip naming the protocol
      methods it holds and pointing at `View all`, through the existing fallback-label seam, and pin
      that row below the ranked tools on this tab alone — it outranks every tool without being what
      the tab is about. Unit tests for the seam and the ordering.
- [x] 11.2 Drop the card's search field and the aggregate term behind it: the card states a ranked
      head of ten rows, and a term that re-ranks the whole window answered with rows the card never
      loaded. Raise the card's page from 7 to 10, leave finding a row to the dialog's column filters,
      and remove the now-dead debounce helper. Update the specs the search requirement describes.

## 12. The dialog pages the dimension; spend follows the page window

- [x] 12.1 Move the breakdown's tab switch into the header beside `View all`, centred against the
      title block, and state each tab's grouping in one short line — the description had grown into
      a third control on the title's own row and pushed the tabs' label out of it.
- [x] 12.2 Read the full-list dialog in blocks of 25 through the infinite row model, with the grid's
      order and column filters pushed into the query: the dimension narrows the grouping, a measure
      is compared in `having`, and the ranking carries the dimension as its last key so a block is a
      stable slice. Add the error rate as a select alias, which a sort or filter on it needs.
- [x] 12.3 Read each block's delta by asking the previous window for that block's own values by
      name, and state no comparison for a row it does not answer for. Unit tests for the grid-to-
      query translation and the row mapping both surfaces now share.
- [x] 12.4 Page the donut's dialog the same way — blocks of 25 as its legend is scrolled — with its
      ring drawing every row read so far and its residual shrinking as the legend reads on.
- [x] 12.5 Let the paged dialog state its own emptiness: an empty result there is a filter that
      matched nothing, and the card's idle-window message both said otherwise and covered the grid's
      own overlay.
- [x] 12.6 State each measure's own change in its own cell, in the pill the KPI cards use, and drop
      the `Δ vs prev` column: one column could compare only calls, and beside `Cost` it read as a
      change in money. Lay the figure and its change on fixed tracks so a column of figures ends on
      one line — the change first, the figure on the cell's right edge — and give the dialog's
      filters their real kinds — a measure compared as text reached
      the query as an unparseable bound.
- [x] 12.7 Drop the share bar and state the share as a figure on the cell's right edge like every
      other number, and give every column an equal width: the bar restated the ranking the rows
      already arrive in, and took a column's width to do it.
- [x] 12.8 Focus the donut's hovered slice and fade the rest, without scaling it.
- [x] 12.9 Replace the dialog's column filters with one server-side search over the dimension, the
      way the share dialog searches its legend: a per-column filter could only sift the blocks
      already read, and a measure filter needed a `having` clause and an alias for a figure the
      table computes itself. Drops the grid-to-query translation with them.
- [x] 12.10 Keep the donut's rows on screen while its limit widens, and say a block is in flight with
      a spinner in both dialogs — over the grid's rows and under the donut's list. Opening and
      closing the donut dialog had been putting the ring and the split plot back on their skeletons.
- [x] 12.11 Head every bucketed plot's tooltip with the period its bucket covers — start to the
      start of the next one — keeping the axis on the start alone, and align the breakdown's change
      pills in a track of their own beside the figures.
- [x] 12.12 Count tokens once per call, on rows carrying a price of their own: an application's row
      repeats the tokens of the model it called, and summing every row counted them twice — about
      two percent of the total. A price is what tells a call from a record of one; the cost of the
      rule is a model with no price configured, under a hundredth of a percent.
- [x] 12.13 Name the MCP server under a tool's own name on the `Tools` tab — one outright, several
      counted with the names in a tooltip — read in the tab's own request through a capped
      `group_uniq_array` plus a separate distinct count. A tool name alone was not addressable:
      `get_me` lives on 32 toolsets.
- [x] 12.14 Read a bar's figure from the series `value` rather than its `data`, which a toned bar
      holds as an object — the tooltip had been stating a dash — and tone every spend bar alike: the
      picked-out last bin was only true of a scale that always ended today.
- [x] 12.15 State every figure read as part of a set in full, with grouped thousands and one locale —
      breakdown, donut, row panel, plot tooltips, the heatmap's tooltip and the axes. The KPI cards
      keep their abbreviation: a card holds one figure in a fixed width.
- [x] 12.16 Offer the exact reading on hover where a column's rounding hides what the change beside
      it measures: an error rate printing `0.0%` states its failures and calls, a latency its
      milliseconds, a price its four decimals.
- [x] 12.17 State each series' colour on the series and not only on its `lineStyle`: the latency
      tooltip's markers had been reading ECharts' palette while the lines and legend read ours.
- [x] 12.18 Offer requests or cost on the activity heatmap, switched beside the week pager: both
      figures already ride its hourly response, the shading ceiling follows the active one, and cost
      is offered in the LLM view alone since an MCP row carries no price.
- [x] 12.19 Let the breakdown grid state its own emptiness with a fixed line, dropping the window
      arithmetic and the three props the card threaded through for it: the period is already stated
      in the page's time filter.
- [x] 12.20 Act on the review of §12: name a day-wide bin in UTC again (it is epoch-aligned, and
      west of Greenwich the axis read a day early); keep the dialog's datasource identity off the
      window total, which arrives late and was resetting the grid; stop pinning the fallback row in
      the dialog, where it only reached the end of its own block; guard the donut's read against a
      scroll burst and against the query ceiling; size the dialog's block cache for its own block
      size; settle the in-flight counter in `finally`; split server names on the separator the query
      joined with; clear the donut's reading flag when its scope changes; and reach the exact
      readings and the server list without a pointer.
- [x] 12.21 Cover `use-breakdown-dialog-rows` with its own spec — offsets, end-of-list, the search
      clause, the per-block comparison, the in-flight flag and datasource identity — and replace the
      two placeholder assertions that could not fail.
- [x] 12.22 Bind spend to the page window, binned at the smallest recognizable step that fills the
      row with bars, and drop the calendar scale with its periods, range and fold. Unit tests for
      the step choice across every period the page offers.

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
