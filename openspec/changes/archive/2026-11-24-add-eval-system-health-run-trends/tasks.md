# Tasks

## 1. Data layer

- [x] 1.1 Add `apps/ai-dial-admin/src/models/evaluation/run-trend.ts` (`SuiteType` enum, `RunTrendEvaluatee`,
  `RunTrendPoint`, `SuiteRunTrend`; optional fields stay optional), `AnalyticsApi.getRunTrends(page, size,
  token)` in `server/eval/analytics-api.ts`, and the `getRunTrends(page, size)` server action in
  `app/[lang]/runs/actions.ts`. Done when `server/eval/tests` asserts the URL carries `page` and `size`, and
  `app/[lang]/runs/actions.spec.ts` asserts the token is passed and a `null` result is returned as is.

## 2. Row mapping and paging hook

- [x] 2.1 Add `components/EvalSystemHealth/` constants and models for the table (`RUN_TRENDS_PAGE_SIZE = 10`,
  the type-label lookup keyed by deployment type and by suite type, `RunTrendRow`) and the pure
  `utils/build-run-trend-rows.ts` of design D2. Done when its spec covers the spec's _Run trends row content_,
  _Latest pass rate and change_ and _Run trend bars_ scenarios: model, application and toolset types, an
  unknown evaluatee type, an evaluatee with an id but no name, route with name only, an empty evaluatee, a
  missing latest rate, a delta that rounds to zero, a single run, and runs without a rate left out of the
  points.
- [x] 2.2 Add the `use-run-trends-data` hook of design D6: page state, loading / error / ready, retry, drop of
  a superseded response, null or throwing request as error, and stepping back when the reported page count
  falls below the current page. Done when a hook spec covers loading, a successful page, next and previous,
  a stale response dropped after a quick page change, a `null` result, a throw, retry, and the out-of-range
  step back.

## 3. Table UI

- [x] 3.1 Add the optional `maxValue` prop to `components/Analytics/Usage/Kpi/Sparkline.tsx` (axis maximum
  when set, automatic otherwise). Done when its spec asserts both and the existing Usage KPI specs still
  pass untouched. _Superseded by 3.5, which drops the sparkline and reverts this._
- [x] 3.2 Add the i18n entries (`EvalSystemHealthI18nKey` in `constants/i18n.ts`, strings in `locales/en.ts`:
  section title, the five headers, four type labels, empty-state copy, load error, retry, pager labels,
  sparkline text equivalent), reusing shared keys for retry and previous/next where one fits. Done when
  `npm run typecheck` is clean and no key is unused.
- [x] 3.3 Build the cells and the table: the Name column on the existing `TitleSubtitleCellRenderer`,
  `RunTrendSparklineCell` (with the visually hidden text), `RunTrendLatestCell`, `RunTrendDeltaCell` (kit
  `Badge`, green for a rise, red for a fall, dash when there is no figure), `RunTrendsTable` (`GridView`, no
  sorting, filters, columns panel or persisted state) and `RunTrendsPager`. Confirm the kit `Badge`,
  `EllipsisTooltip`, `GhostIconButton` and `NoDataContent` props through the `ai-dial-ui-kit` MCP server
  first. Done when component specs query by role and accessible name and cover each cell, the pager's page
  label and its disabled states at the first page, last page and while loading, and no pager for one page.
- [x] 3.4 Build `RunTrendsSection` (heading plus loading, error with retry, empty, or table with pager) and
  mount it in `SystemHealth.tsx` after the activity row. Done when a section spec covers loading, the empty
  state copy, the error alert with retry requesting the same page again, and the table with its columns in
  order, and `SystemHealth`'s spec still passes with the section present.
- [x] 3.5 Rework the columns and the trend chart (design D2–D4). Replace the Type and Name columns with **Test
  suite** (name over id) and **Evaluatee** (name over type, a dash with no second line for an evaluatee with
  neither name nor id), both on `TitleSubtitleCellRenderer`; rename the trend column to **Run trends - 10
  runs** (count from `RUN_TRENDS_LENGTH`); replace `RunTrendSparklineCell` with `RunTrendBarsCell` (one bar per
  rate, height from the rate on a 0–100% scale, `PASS_RATE_BAND_CLASS` colour, `aria-hidden` bars plus the
  visually hidden text); revert `Sparkline.tsx` and delete its `maxValue` spec; update the `RunTrendRow` model,
  the mapper, the i18n keys and every spec that names the old columns. Done when the mapper, columns and bars
  specs cover the revised _Run trends table_, _Run trends row content_ and _Run trend bars_ scenarios
  (including the suite name over id, the evaluatee name over type, the no-reference dash, bar order, height
  and band colour, and a run without a rate left out), `git diff` shows `Sparkline.tsx` unchanged, and
  `npm run typecheck`, `typecheck:specs`, lint and format are clean.

- [x] 3.6 Lay the section out beside a chart placeholder (design D7): add `HealthDistributionPlaceholder` (a
  `SummarySection` titled by a new i18n key, holding an `aria-hidden` kit `Skeleton`; confirm its props through
  the `ai-dial-ui-kit` MCP server) and put it with `RunTrendsSection` in a `grid grid-cols-1 gap-4
  xl:grid-cols-2` row of `SystemHealth`, `items-start`; lower the column minimum widths so the table fits half
  a standard screen. Done when a placeholder spec asserts the title and that the skeleton is hidden from
  assistive technology, `SystemHealth`'s spec asserts the section and the placeholder share one row and the
  table comes first, `npm run typecheck`, `typecheck:specs`, lint and format are clean, and the _Run trends
  placement_ scenarios are covered by the browser verification below.

## 4. Docs

- [x] 4.1 Add the run-trends table to the System Health entry in `docs/MENU-DOCUMENTATION.md`. Done when the
  entry describes the table, its fixed backend order and its paging.

## 5. Browser verification

- [ ] 5.1 Run the `spec-browser-verify` skill against `openspec/changes/add-eval-system-health-run-trends`
  with the local stack up and auth disabled; fix every `fail` verdict and re-run the failing scenarios until
  none remain. Done when the VerificationReport has no `fail`, and any `blocked` scenario is explained.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` at zero,
  then the full `npm run test`; run `openspec validate add-eval-system-health-run-trends --strict`. Done when
  all of them pass.
