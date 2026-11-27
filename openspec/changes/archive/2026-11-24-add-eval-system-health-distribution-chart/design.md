## Context

See `proposal.md` for motivation and scope, and the `eval-system-health` spec for the requirements. The
constraints that shape the approach:

- **A ready-made backend read.** `GET /api/v1/analytics/test-suites/health-distribution?weeks&threshold`
  returns `{ threshold, weeks: [{ weekStart, healthyCount, failingCount, suiteCount }] }`, not paged, with
  exactly `weeks` entries, oldest first, the last being the week that holds the current time. Weeks are UTC,
  Monday start (`weekStart` is epoch ms). A suite's weekly pass rate is pooled (sum passed / sum total over
  its completed runs created that week), counted only in weeks where it has runs with a non-zero total, never
  carried over. Empty weeks are present with all counts 0. Absent filter = every suite with recorded runs.
- **Same pass rule and freshness as the run-trends table.** A run counts only once its pass count is
  recorded, so older weeks can be under-reported until the backend's reconciliation job has run (about a
  minute after start-up, then hourly). The empty copy has to say that rather than "no suites".
- **The slot exists.** `HealthDistributionPlaceholder` already sits beside `RunTrendsSection` in a
  `grid grid-cols-1 items-start gap-4 xl:grid-cols-2` row, a `SummarySection` with a 320px skeleton. The
  chart replaces it with no layout change.
- **Where analytics reads live.** `AnalyticsApi` holds the eval analytics calls; `app/[lang]/runs/actions.ts`
  exposes them as server actions that authenticate with `getUserToken`. `BaseApi.get` returns `null` on a
  failed request, which is how failure reaches the client (a backend without the endpoint answers 404, which
  lands in the same error state).
- **Charts in this repo.** ECharts through `echarts-for-react` (`ReactECharts`), painting on a canvas, so
  colours must be concrete: `useChartColors()` resolves the active theme's `success`, `error`, `value` and
  `neutral` colours. `ChartLegend` renders plain swatch-and-label entries when given no handlers.
  `formatPercent(ratio, digits)` lives in `components/Analytics/Usage/utils/format.ts`.
- **Server actions run one after another.** The page already queues the deployment listing, the coverage
  query, the activity batch and the run-trends page; the chart request queues behind them (see the archived
  `add-eval-system-health-coverage` design, D4).

## Goals / Non-Goals

**Goals:**

- A chart whose bars, labels and tooltip text come from pure, unit-tested mapping utils; the ECharts option
  is built by a pure function too, so what is drawn is asserted without a canvas.
- Own loading, empty and error states with retry, independent of the rest of the page.
- The same figures available without a pointer or sight: a hidden table.

**Non-Goals:**

- Folding the request into the page's other server actions (see Risks).
- A reusable stacked-share chart abstraction. One chart; extract it when a second consumer needs it.

## Decisions

### D1. Data path: `getHealthDistribution(weeks, threshold)` through a server action

`AnalyticsApi.getHealthDistribution(weeks, threshold, token)` calls
`GET {ANALYTICS_URL}/test-suites/health-distribution?weeks=&threshold=` (built with `URLSearchParams`, as
`getRunTrends`) and returns `HealthDistribution | null`. A server action of the same name in
`app/[lang]/runs/actions.ts` supplies the token. The models live in `models/evaluation/health-distribution.ts`:
`HealthDistributionWeek` (`weekStart`, `healthyCount`, `failingCount`, `suiteCount`) and `HealthDistribution`
(`threshold`, `weeks`). The call sends the week count and threshold explicitly, from constants
`HEALTH_DISTRIBUTION_WEEKS = 5` and `HEALTH_DISTRIBUTION_THRESHOLD = 0.75`, rather than leaning on the
backend's defaults (8 weeks): the title and the five bars must not change if a default does. No `filter` is
sent, so the method takes no filter argument now; adding one later is a signature extension.

_Alternatives:_ rebuilding the weeks from run-trends — rejected, it returns only each suite's last 10 runs,
paged; the structured-query API — rejected, it cannot apply the pooled weekly pass rate.

### D2. View-model built by a pure mapper

`buildHealthDistributionBars(weeks)` turns each week into a `HealthDistributionBar`: `weekStart`, `label`,
`healthyCount`, `failingCount`, `suiteCount`, and `healthyShare` / `failingShare` as percentages with one
decimal (both `null` when `suiteCount` is 0). `healthyShare` is `round1(healthy / suite × 100)` and
`failingShare` is `100 − healthyShare` (to one decimal), so the two always add to 100% instead of drifting to
99.9 or 100.1 on a half-way value. The `label` is the week start formatted as short month and day with
`Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })`, in UTC because the
backend buckets in UTC: formatting in the viewer's zone would label a Monday-midnight week `Nov 2` west of
Greenwich. `suiteCount` is taken from the response, not recomputed.

### D3. The chart: ECharts stacked bars on a fixed 0–100 axis

`buildHealthDistributionOption(bars, colors)` returns the ECharts option: a category x-axis of the labels, a
value y-axis fixed to 0–100 with the labels hidden or percent-formatted and light grid lines, and two bar
series (`healthy` in `colors.success`, `fail` in `colors.error`) sharing `stack: 'share'`, fed with the
shares (a `null` share draws nothing, so an empty week keeps its slot without a bar). No `label` is shown on
either series. The axis tick labels and grid use theme colours from `useChartColors` (`neutral`), never
hardcoded hex. A `tooltip` of `trigger: 'axis'` with `axisPointer: { type: 'shadow' }` and a formatter that
reads the bar by `dataIndex` and builds the text from translated strings (week, `Healthy N suites · P%`,
`Fail N suites · P%`); for an empty week the formatter returns an empty string, so no tooltip shows. The
formatter output is escaped text only.

The component takes the bars and the translated tooltip strings as props and passes the option to
`ReactECharts` with a fixed `height` of 320, matching the skeleton it replaces so the row does not jump.

_Alternatives:_ plotting counts on an auto axis — rejected by the user (100% bars as in the mock); drawing the
last bar's percentages as in the mock — rejected by the user (tooltip instead); a hand-built SVG/CSS stack of
divs — rejected, the repo's charts use ECharts and a tooltip with axis pointer is built in.

### D4. Legend and accessible text outside the canvas

The legend is `ChartLegend` with two entries and no handlers (`Healthy ≥ {threshold}` over the success
colour, `Fail < {threshold}` over the error colour), rendered above the chart. The threshold is the response's
`threshold`, formatted with `String(threshold)` so `0.75` reads `0.75`. The canvas wrapper is `aria-hidden`,
and a `sr-only` `<table>` (with a caption or `aria-label` equal to the section title) lists a row per week:
the week label, healthy count, failing count and the two shares. A canvas tooltip is not reachable by keyboard;
the hidden table gives non-pointer users the same figures, as the run-trend bars do with their `sr-only`
summary.

### D5. Info tooltip beside the title

`SummarySection`'s `title` is a `ReactNode`, so the section passes the title text with a
`HealthDistributionInfoTooltip` beside it in a flex row. The component copies `CoverageInfoTooltip`: the kit
`Tooltip` (`asChild`) around a `GhostIconButton` with an `IconInfoCircle` (`aria-hidden`) and an `aria-label`,
so the tooltip opens on keyboard focus as well as hover. It is a new small component rather than a reuse
because `CoverageInfoTooltip` is bound to the coverage copy and window; extracting a shared generic one for
two consumers is not worth touching the coverage card in this change. The copy takes `{threshold}` from the
response (or the request constant until it loads) and is the design mock's text with two edits: the _watch_ and
_critical_ zones are dropped (the backend and the legend have two bands), and "all active test suites" becomes
"test suites that ran that week", because the backend counts a suite only in a week where it has runs with a
non-zero total. The tooltip content is a plain translated string.

### D6. Data hook and section

`useHealthDistributionData()` holds a load state (`Loading` / `Error` / `Ready`) and an `attempt` counter for
retry, reusing `CoverageStatus`. The request runs in an effect that sets a cancelled flag in cleanup so a
superseded response is dropped (React StrictMode double-mount, a quick retry); a `null` result or a throw is
an error. It returns the status, the bars from `useMemo`, the threshold and `retry`. `isEmpty` is true when
every bar has `suiteCount` 0. `HealthDistributionSection` renders `SummarySection` (title with the week
count, `isFillHeight={false}`) around the spinner, the alert plus Retry button, the `NoDataContent` empty
state, or legend plus chart plus hidden table — the same shape as `RunTrendsSection`. The title string takes
a `{count}` parameter fed from `HEALTH_DISTRIBUTION_WEEKS`.

### D7. Replace the placeholder

`HealthDistributionPlaceholder.tsx` and its spec are deleted and `SystemHealth.tsx` renders
`HealthDistributionSection` in the same grid cell. The `SystemHealth` spec keeps asserting the section and the
table share one row, table first. The existing `HealthDistribution` i18n key stays and gains the `{count}`
parameter; no other key is renamed.

## Risks / Trade-offs

- [The chart request queues behind four earlier server actions, so the chart appears last] → Accept now, as
  for the table; folding the page's reads into one concurrent action is a separate change.
- [Older weeks are under-reported until the backend's reconciliation has run, so a fresh deployment shows a
  near-empty chart for up to an hour] → The empty state copy says a week fills in once runs are recorded; the
  spec does not promise complete history.
- [A hover-only tooltip is out of reach of keyboard users] → The visually hidden table carries every figure;
  this matches the other canvas charts in the repo.
- [`Intl` formatting differs by runtime] → Pin the locale (`en-US`) and `timeZone: 'UTC'` in the util and
  test it with fixed epoch values.
- [The backend's threshold default or week count default changes] → The request sends both explicitly.
- [The week rolls over while the page is open and the chart keeps the old last week] → Out of scope; a reload
  fixes it.
- [A backend without the endpoint (older eval API) answers 404] → It is reported as the error state with
  retry, like any failed read.
