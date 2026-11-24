# Tasks

## 1. Data layer

- [x] 1.1 Add `apps/ai-dial-admin/src/models/evaluation/health-distribution.ts` (`HealthDistributionWeek`,
  `HealthDistribution`), `AnalyticsApi.getHealthDistribution(weeks, threshold, token)` in
  `server/eval/analytics-api.ts` (with an `ANALYTICS_HEALTH_DISTRIBUTION_URL` constant beside the run-trends
  one), and the `getHealthDistribution(weeks, threshold)` server action in `app/[lang]/runs/actions.ts`. Done
  when `server/eval/tests/analytics-api.spec.ts` asserts the URL carries `weeks` and `threshold` and the
  parsed body is returned, a failed response yields `null`, and `app/[lang]/runs/actions.spec.ts` asserts the
  token is passed and a `null` result is returned as is.

## 2. Mapping and chart option

- [x] 2.1 Add `HEALTH_DISTRIBUTION_WEEKS = 5` and `HEALTH_DISTRIBUTION_THRESHOLD = 0.75` to
  `components/EvalSystemHealth/constants.ts`, the `HealthDistributionBar` and `HealthDistributionData` types to
  `models.ts`, and the pure `utils/build-health-distribution-bars.ts` of design D2 (UTC week label, shares with
  one decimal that always add to 100%, `null` shares for an empty week, `suiteCount` taken from the
  response). Done when its spec covers a typical week, a week with 0 suites, all-healthy and all-failing
  weeks, a half-way share that must not sum to 99.9 or 100.1, a week start whose UTC date differs from the
  local date (assert with a fixed epoch), and the order being the response's.
- [x] 2.2 Add the pure `utils/build-health-distribution-option.ts` of design D3: category labels, the fixed
  0–100 axis, the two stacked series with the success and error colours, no series labels, theme-colour axis
  text, and the tooltip formatter (week, `Healthy N suites · P%`, `Fail N suites · P%`, empty text for an empty
  week). Done when its spec asserts the option's series data and colours, that no label is shown, the axis
  bounds, and each formatter outcome through a translation stub.

## 3. Chart UI

- [x] 3.1 Add the i18n entries (`EvalSystemHealthI18nKey` in `constants/i18n.ts`, strings in `locales/en.ts`:
  the title gains `{count}`, legend `Healthy ≥ {threshold}` and `Fail < {threshold}`, the info control's label
  and tooltip text (design D5), the chart tooltip lines, the empty
  state title and description, load error, retry, and the hidden table's column headers). Done when
  `npm run typecheck` is clean and no key is unused.
- [x] 3.2 Add `use-health-distribution-data.ts` of design D6: load state, retry, drop of a superseded
  response, `null` or throwing request as error, bars via `useMemo`, an empty flag. Done when a hook spec
  covers loading, a successful response, the request arguments (5 weeks, 0.75), a stale response dropped
  after a retry, a `null` result, a throw, retry, and all-empty weeks reported as empty.
- [x] 3.3 Build `HealthDistributionChart` (the `ReactECharts` wrapper, `aria-hidden`, height 320),
  `HealthDistributionLegend` (on `ChartLegend`, no handlers), the `sr-only` table and
  `HealthDistributionInfoTooltip` (design D5, modelled on `CoverageInfoTooltip`), with the
  `HealthDistributionSection` of design D6 around them (`SummarySection` titled with the text and the info
  control, spinner, alert with retry, empty state, or chart). Confirm the kit `Notification`, `Button`,
  `NoDataContent`, `Spinner`, `Tooltip` and `GhostIconButton` props through the `ai-dial-ui-kit` MCP server
  first. Done when component specs (with `echarts-for-react` mocked) query by role and accessible name and
  cover the legend text and swatches, the hidden table's rows, the option passed to the chart, the info
  control opening its tooltip on hover and on keyboard focus with the threshold in the text and no third band
  named, the loading indicator, the empty state, the error alert with retry requesting again, and that nothing
  in the visible chart text carries a percentage.
- [x] 3.4 Replace the placeholder: render `HealthDistributionSection` in `SystemHealth.tsx` in the cell
  `HealthDistributionPlaceholder` held, then delete `HealthDistributionPlaceholder.tsx` and its spec. Done
  when `SystemHealth.spec.tsx` asserts the section and `RunTrendsSection` share one row with the table first,
  no reference to the placeholder remains (`grep`), and `npm run typecheck` and `typecheck:specs` are clean.

## 4. Docs

- [x] 4.1 Add the health distribution chart to the System Health entry in `docs/MENU-DOCUMENTATION.md`. Done
  when the entry describes the five weekly bars, the healthy and fail split at 0.75, and the tooltip.

## 5. Browser verification

- [ ] 5.1 Run the `spec-browser-verify` skill against
  `openspec/changes/add-eval-system-health-distribution-chart` with the local stack up, auth disabled and an
  eval backend that has the health-distribution endpoint; fix every `fail` verdict and re-run the failing
  scenarios until none remain. Done when the VerificationReport has no `fail`, and any `blocked` scenario is
  explained.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` at zero,
  then the full `npm run test`; run `openspec validate add-eval-system-health-distribution-chart --strict`.
  Done when all of them pass.
