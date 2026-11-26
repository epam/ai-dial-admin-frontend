## Context

See `proposal.md` for motivation and scope, and the `eval-system-health` spec for the requirements. The
constraints that shape the approach:

- **A ready-made backend read.** `GET /api/v1/analytics/test-suites/run-trends` returns an offset page of
  suites with their last 10 completed runs, the latest pass rate, the previous one and the delta, already
  ordered worst first. The metadata/analytics join that the call worried about is the backend's job. A run is
  visible only once its pass count is recorded; the backend writes missing records at start-up (after 60 s)
  and then hourly.
- **Same pass rate as Test Suite Trends.** The backend states one pass rule for every number (a test case
  counts once, passes when every execution succeeded and it is not below the run's threshold), so the
  table's rate and the Trends tab's pass-rate card agree for the same run.
- **Where analytics reads live.** `AnalyticsApi` (`server/eval/analytics-api.ts`) holds the eval analytics
  calls; `app/[lang]/runs/actions.ts` exposes them as server actions that authenticate with `getUserToken`.
  `BaseApi.get` returns `null` on a failed request, which is how failure reaches the client. The eval list
  views already use `EvaluationPageData<T>` for the page envelope.
- **Existing building blocks.** `GridView` (the repo's AG Grid shell, with the kit empty state), `PassRateBar`
  and `formatPassRatePercent`, `formatPassRateDelta` (the signed percentage-point string), the kit `Badge`,
  and, in the runs table, `TitleSubtitleCellRenderer` with the _Test suite run name_ (name over id) and
  _Target_ (name over kind) columns that the new columns copy.
- **The suite view keeps its tab in local state**, so a link can reach `/test-suites/{id}` but not its Trends
  tab.
- **Server actions run one after another.** The page already queues the deployment listing, the coverage
  query and the activity batch (see the archived `add-eval-system-health-coverage` design, D4).

## Goals / Non-Goals

**Goals:**

- A table whose row content, rates and deltas come from pure, unit-tested mapping utils.
- A paging hook with stale-response protection, so a quick Next/Previous never shows an old page.
- A table that fails, loads and is empty independently of the cards.

**Non-Goals:**

- Folding the table request into the page's other server actions (see Risks).
- A reusable server-paged grid abstraction. One table with one pager; extract it when a second consumer
  needs it.

## Decisions

### D1. Data path: `getRunTrends(page, size)` through a server action

`AnalyticsApi.getRunTrends(page, size, token)` calls `GET {ANALYTICS_URL}/test-suites/run-trends?page=&size=`
and returns `EvaluationPageData<SuiteRunTrend> | null`. A server action of the same name in
`app/[lang]/runs/actions.ts` supplies the token. No `filter` is sent, so the method takes no filter argument
now; adding one later is a signature extension, not a rework. The response models live in
`models/evaluation/run-trend.ts`: `SuiteRunTrend` (`suiteId`, `suiteName`, `suiteType`, `evaluatee`, `runs`,
`latestPassRate?`, `previousPassRate?`, `delta?`), `RunTrendEvaluatee` (all four fields optional),
`RunTrendPoint` (`passRate?`, `passedCount`, `totalCount`, `runId`, `createdAt`) and a `SuiteType` enum
(`DEPLOYMENT`, `MCP_TOOL`, `ROUTE`) — optional fields stay optional because the backend omits them rather
than sending `null`.

_Alternatives:_ the structured-query API — rejected, it cannot read the pass counts or the order and would
mean rebuilding the join on the client; a route handler — rejected, the repo uses server actions for reads.

### D2. Row view-model built by a pure mapper

`buildRunTrendRows(items)` turns each `SuiteRunTrend` into a flat `RunTrendRow` the grid and cells render
without further logic:

- `suiteId` and `suiteName` — the Test suite cell's two lines, as the runs table pairs a run's name with its id.
- `evaluateeName` and `kindKey` — the Evaluatee cell's two lines, as the runs table's Target column pairs a
  name with its kind. The name is `evaluatee.name`, else `evaluatee.id`, else `null`. The kind is a label key:
  `dial-model` → Model, `dial-application` → Application, `dial-toolset` → Toolset; an evaluatee that has a
  name but no known type falls back by suite type (`ROUTE` → Route, `MCP_TOOL` → Toolset, `DEPLOYMENT` →
  Model), so a new deployment kind never renders a blank line. An evaluatee with no name and no id has
  `evaluateeName` and `kindKey` both `null`: the suite type alone says nothing true about a suite with no
  reference, so the cell shows a dash. The mapping is an enum-keyed lookup, not a ternary chain. The tool
  name of an MCP-tool suite is not shown: the cell follows the Target column, which names the toolset only.
- `points` — the runs' pass rates, oldest first, dropping runs with no rate.
- `latestRate`, `deltaLabel` — `latestPassRate` and `formatPassRateDelta(latestPassRate, previousPassRate)`;
  the latter returns `null` for a missing rate or a delta that rounds to zero, which the cell shows as a
  dash. The backend's `delta` field is not read: the two rates carry the same information and the existing
  formatter takes rates.
- The Test suite column builds its link with `getUrnForEntity(ApplicationRoute.TestSuites, { id })`, the
  helper the other lists use.

### D3. The table is a `GridView` with static columns

Five fixed columns (`sortable: false`, no filters, no columns panel, no persisted column state — nothing for
a user to customise): Test suite, Evaluatee, Run trends - 10 runs, Latest, Δ prev. The Test suite and
Evaluatee columns reuse `TitleSubtitleCellRenderer` (two lines, `EllipsisTooltip` for truncation, per
`a11y.md`), exactly as the runs table's _Test suite run name_ and _Target_ columns do; the first adds
`getHref` so the suite name links to the suite. Custom cell renderers: `RunTrendBarsCell`,
`RunTrendLatestCell` (`formatPassRatePercent` + `PassRateBar`) and `RunTrendDeltaCell`. The Evaluatee
column's `valueGetter` returns the dash for a `null` name, as the Target column does. The grid takes the
current page as `rowData`; the row height fits two lines and the bars.

_Alternatives:_ a plain `<table>` — lighter, but the repo's convention is `GridView` for tabular data and it
brings the kit empty state and tooltip handling; AG Grid's infinite row model — rejected, it virtualises a
long scrolling list while this is a 10-row page with an explicit pager.

### D4. Run trend bars: plain elements, not an ECharts instance

The mock draws the trend as ten vertical bars, tallest on the left in the example, shading from green to
yellow. `RunTrendBarsCell` renders one `div` per point in a bottom-aligned flex row: height is the pass
rate as a percentage of the cell's chart height (a fixed 0–100% scale, so rows compare), with a small
minimum so a 0% bar stays visible, and the fill is the band class `PassRateBar` already uses
(`PASS_RATE_BAND_CLASS[getPassRateBand(rate)]`), so green, yellow and red mean the same in both cells. The
bars are `aria-hidden`; a visually hidden text equivalent (the rates as percentages, oldest first, through
one parameterised i18n key) carries the data per `a11y.md`. The column header carries the run count through
a parameterised key, `RUN_TRENDS_LENGTH = 10`, the backend's own constant.

Plain elements need no chart library, so a page of ten rows costs ten small flex rows rather than ten
ECharts instances. The analytics `Sparkline` therefore stays as it was: the optional `maxValue` prop an
earlier plan added to it is dropped.

_Alternatives:_ an ECharts bar series per row — rejected: a heavier instance per row for a chart with no axes,
tooltip or interaction; the sparkline line chart — superseded by the design, which asks for bars.

### D5. Delta cell: a compact badge, not `KpiDeltaBadge`

`KpiDeltaBadge` renders `+10% vs prev.`, which repeats the column header ten times. The delta cell renders the
kit `Badge` (filled, green for a rise, red for a fall, the sign taken from the formatted label as
`KpiDeltaBadge` does) with the bare `+10%` / `-10%`. Higher is better, so a rise is green. Prop names are
confirmed against the `ai-dial-ui-kit` MCP server at implementation time.

### D6. Paging hook and pager

`useRunTrendsData()` holds `page`, `status` (reusing `CoverageStatus`: Loading / Error / Ready) and the
`EvaluationPageData` of the loaded page. Changing `page` or pressing retry reruns one effect; each run owns an
`isCancelled` flag so a response for a superseded request is dropped. While a page loads the rows are cleared,
so the spec's "no stale rows" holds, and the pager is disabled. A request that returns `null` or throws
becomes `Error`. `page` is clamped when the backend reports fewer pages than the current index (a suite
deletion shrinking the total), by stepping back to the last page.

The pager is a small `RunTrendsPager` component: two `GhostIconButton`s with `aria-label`s, decorative icons
`aria-hidden`, and a `{page} / {pages}` label; it is not rendered for a single page. The kit has no
pagination component. Page size is `RUN_TRENDS_PAGE_SIZE = 10` in `constants.ts`, well inside the backend's
1–1000 range.

_Alternative:_ show the rows of the previous page dimmed while the next loads — rejected, it contradicts the
spec and makes a failed load look like a stale success.

### D7. States and placement

`RunTrendsSection` renders the heading, then exactly one of: a `Spinner` (loading), a `Notification` with
`role="alert"` plus a retry `Button` (error), the kit `NoDataContent` (empty page and total 0) or the grid and
pager. In `SystemHealth` it shares one row with `HealthDistributionPlaceholder`, a titled `SummarySection`
holding a kit `Skeleton` where the _Test Suite Health Distribution_ chart will go. The row is
`grid grid-cols-1 gap-4 xl:grid-cols-2` — the breakpoint the card rows already switch columns at — so on a
standard screen the table takes the left half and on a smaller one the two stack at full width. The cells are
`items-start`, so the shorter placeholder does not stretch to the table's height. The placeholder is purely
decorative (`aria-hidden` skeleton) and carries no data or states; when the chart is built it replaces the
skeleton inside the same section, with no layout change.

At half width the grid has less room, so the column minimum widths are kept small (the bars need about 140 px)
and AG Grid scrolls horizontally rather than squashing a cell below its minimum.

### D8. i18n

New `EvalSystemHealthI18nKey` entries: section title, the five column headers, the four type labels, the
empty-state title and body, the load-error message, retry, pager labels (`previous`, `next`, `{page} of
{pages}`), and the bars' text equivalent. Generic wording (retry, previous/next) reuses existing shared
keys where one fits, checked at implementation per `components.md` §10.

## Risks / Trade-offs

- **The table queues behind the cards.** Next.js runs the page's server actions one after another, so the
  table's request starts after the listing, coverage and activity actions return (about 28 s on the instance
  measured earlier). → The table shows its own loading state meanwhile. If it proves too slow, the follow-up
  is the already-noted single concurrent server action; the table's hook keeps its fetch behind one function,
  so moving it into a batch is local. Not done here.
- **A run is invisible until recorded.** After a backend restart, or for a run that just completed, the table
  can be empty or one run behind. → The empty-state copy says so; no polling is added.
- **A short page.** A suite deleted mid-request drops its item but leaves `totalElements` unchanged. → The
  pager follows `totalPages`, the grid renders what it received, and an out-of-range page steps back.
- **Opens the suite, not its Trends tab.** Tab state is local to the suite view. → Accepted; deep-linking a
  tab is a separate change to the suite view.
- **Row-level truncation.** Long evaluatee ids and names clip in a fixed-height row. → `EllipsisTooltip` keeps
  the full text reachable by keyboard.
