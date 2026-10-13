## 1. Shared score-cell palette module

- [x] 1.1 Create `src/components/Common/ScoreCell/models.ts` with `ScoreCellColorSet`,
      `ScoreColorMode`, and `ScoreCellBorderSides` per `design.md`, and verify
      `npm run typecheck` passes with the new file in place
- [x] 1.2 Create `src/components/Common/ScoreCell/constants.ts` with the 12-bucket absolute map and
      8-bucket delta map (dark + light, `{ background, text, border }` each), transcribed from the
      Figma "DIAL Data Visualization" frames referenced in `proposal.md`
- [x] 1.3 Create `src/components/Common/ScoreCell/utils.ts` with `getScoreCellColors(value, mode,
      theme)` and `getScoreCellStyle(colors, { isBorderVisible, borderSides })`, and add
      `src/components/Common/ScoreCell/tests/utils.spec.ts` covering: each absolute bucket boundary
      (including exact `0` and exact `1` as distinct buckets from their neighbors), each delta
      bucket boundary, delta `0` returning `null`, light/dark theme selection, and
      `getScoreCellStyle`'s border-off default plus per-side border output — run
      `npx vitest run src/components/Common/ScoreCell/tests/utils.spec.ts` from
      `apps/ai-dial-admin/` to verify

## 2. Unified cell renderer

- [x] 2.1 Create `src/components/Grid/CellRenderers/ScoreCellRenderer.tsx` (`ScoreCellRendererParams
      extends ICellRendererParams`, default export, matching the shape of
      `BooleanButtonCellRenderer.tsx`/`CompareDeltaCellRenderer.tsx`) rendering a right-aligned
      number styled via `getScoreCellStyle`, supporting `isBorderVisible` and `borderSides`, hiding
      the value by the existing `shouldShowHeatMapCellValue` width check, with an `aria-label`
      carrying the formatted value when hidden
- [x] 2.2 Add `src/components/Grid/CellRenderers/tests/ScoreCellRenderer.spec.tsx` covering: a
      visible score cell by role/text, a hidden-value cell exposing the score via `aria-label`
      (query by accessible name, per `.claude/rules/a11y.md`/`testing.md` §4), border rendered only
      when `isBorderVisible` is set, and only on the configured sides, and verify with
      `npx vitest run src/components/Grid/CellRenderers/tests/ScoreCellRenderer.spec.tsx`

## 3. Extraction Result migration

- [x] 3.1 Update `src/components/Runs/View/utils.ts` (`getMetricsColumns`) to use
      `ScoreCellRenderer` in place of `MetricScoreCellRenderer`, with the border left off
- [x] 3.2 Update `src/components/Runs/View/tests/*.spec.ts(x)` and
      `src/components/Runs/View/tests/ExtractionResult.spec.tsx` so assertions target the new
      renderer's right-aligned colored number instead of a progress bar, and verify with
      `npx vitest run src/components/Runs/View/tests/ExtractionResult.spec.tsx`

## 4. Heat Map tab migration

- [x] 4.1 Update `src/components/Runs/Compare/HeatMap/utils/build-heat-map-columns.ts` to render
      value cells with `ScoreCellRenderer` (passing `colorDisplayMode` as `mode`) instead of the
      Compare `HeatMapValueCellRenderer` wrapper plus the separate `cellStyle` callback, with the
      border left off for both Absolute and Delta modes
- [x] 4.3 Verify with `npx vitest run src/components/Runs/Compare/HeatMap/tests` (the now-
      unused `HeatMapValueCellRenderer.spec.tsx` files are deleted in task 6.1, once Stability's
      migration in task 5 also stops using that renderer)
- [x] 4.4 Update `src/components/Runs/Compare/HeatMap/utils/build-heat-map-cell-tooltip-data.ts` to
      resolve its tooltip swatch colors from `getScoreCellColors` instead of `getAccuracyColors`/
      `getDeltaColors`/`DELTA_NEUTRAL_SEGMENT`, falling back to the existing
      `HEAT_MAP_GROUP_ROW_BG`/`HEAT_MAP_STROKE_TERTIARY` pair when a value has no bucket (out of
      range, or delta `0`), and update
      `src/components/Runs/Compare/HeatMap/utils/tests/build-heat-map-cell-tooltip-data.spec.ts` to
      match, verifying with
      `npx vitest run src/components/Runs/Compare/HeatMap/utils/tests/build-heat-map-cell-tooltip-data.spec.ts`

## 5. Test Case Stability migration

- [x] 5.1 Update `src/components/TestSuites/Trends/utils/build-stability-columns.ts` to use
      `ScoreCellRenderer` in Absolute mode with the border left off, replacing
      `HeatMapValueCellRenderer` and `getAccuracyHeatCellStyle`
- [x] 5.2 Update `src/components/TestSuites/Trends/tests/TestCaseStability.spec.tsx` and any
      `build-stability-columns` tests for the new renderer, and verify with
      `npx vitest run src/components/TestSuites/Trends/tests/TestCaseStability.spec.tsx`

## 6. Shared heatmap grid shell cleanup

- [x] 6.1 Delete `src/components/Common/HeatMap/HeatMapValueCellRenderer.tsx` and
      `src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer.tsx` now that tasks 4 and 5 no
      longer reference either, and verify `npm run typecheck` has no dangling imports
- [x] 6.2 Restyle `src/components/Common/ColorScale/ColorScale.tsx`'s legend to the new 12-bucket
      absolute / 8-bucket delta scales, sourcing colors from `Common/ScoreCell/constants.ts`; it has
      no dedicated component test today (only `tests/utils.spec.ts`, which task 7 leaves untouched
      since those utils still serve `Runs/Compare/ExecutionResults/*`), so verify by running the
      consumers that render it (`npx vitest run src/components/TestSuites/Trends/tests/TestCaseStability.spec.tsx`)

## 7. Confirm the old modules' remaining scope

`Common/ColorScale/{constants.ts,models.ts,utils.ts}` and all of `Common/ScoreBar/` are **not**
deleted by this change — `Runs/Compare/ExecutionResults/utils/columns.ts`,
`Runs/Details/RowDetails/FieldValue.tsx` (+ `row-detail-sections.ts`), and
`Runs/Details/MetricCard.tsx` still depend on them and are out of scope (see `design.md`'s Decisions
and Risks).

- [x] 7.1 Grep the repo for remaining references to `ScoreBar`, `MetricScoreCellRenderer`,
      `ACCURACY_COLOR_MAP`, `getAccuracyColors`, `getAccuracyHeatCellStyle`, `getDeltaColors`, and
      `isScoreIndicatorValue`, and confirm every remaining hit is inside
      `Runs/Compare/ExecutionResults/*`, `Runs/Details/RowDetails/FieldValue.tsx`,
      `Runs/Details/RowDetails/utils/row-detail-sections.ts`, `Runs/Details/MetricCard.tsx`, or the
      two modules' own source/tests — i.e. that tasks 3–6 left no stray reference in Extraction
      Result, the Heat Map tab, or Stability
- [x] 7.2 Run `npm run typecheck` and `npm run typecheck:specs` and confirm both report zero errors
      with `Common/ScoreBar`, `Common/ColorScale`'s bucket maps, and `MetricScoreCellRenderer.tsx`
      left in place

## 8. Final quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and
      the full `npm run test` suite (from `apps/ai-dial-admin/`), and fix any failures

## 9. Follow-up: move bucket colors into Tailwind config, verify against real Figma data

The first pass of task 1 computed bucket colors from guessed HSL stops in TS, not Tailwind, and
never checked them against Figma's actual values. The user flagged both problems after reviewing the
implementation.

- [x] 9.1 Authenticate the Figma MCP server and pull exact hex values for every bucket (12 absolute +
      8 delta, background/text/stroke, dark + light) via `get_variable_defs` against the Figma file's
      own variable definitions — not a screenshot — resolving layer-name/variable-binding mismatches
      and one mislabeled swatch by querying specific nodes directly where the whole-section dump was
      ambiguous
- [x] 9.2 Add `scoreCellBackgroundColors`/`scoreCellTextColors`/`scoreCellBorderColors` to
      `tailwind.config.js` (one `var(--score-<bucket>-<channel>, <darkHex>)` entry per bucket,
      matching every other token's shape in that file) and wire them into
      `theme.backgroundColor`/`textColor`/`borderColor`
- [x] 9.3 Rewrite `Common/ScoreCell/{models,constants,utils}.ts` to resolve a bucket **key** (not a
      color) and expose Tailwind class names (`getScoreCellBucketClasses`) plus a Light Mode
      custom-property override (`getScoreCellLightOverrideStyle`, since the external theme service has
      no entry for these new keys) instead of computing HSL colors in JS; update
      `Common/ScoreCell/tests/utils.spec.ts` to match, verifying with
      `npx vitest run src/components/Common/ScoreCell/tests/utils.spec.ts`
- [x] 9.4 Update `ScoreCellRenderer.tsx` to apply the bucket's Tailwind classes (background, text,
      and border-color plus Tailwind border-width side classes) instead of inline
      `backgroundColor`/`color`/`border*` styles; update its spec to assert classes instead of
      computed style values, verifying with
      `npx vitest run src/components/Grid/CellRenderers/tests/ScoreCellRenderer.spec.tsx`
- [x] 9.5 Update `ColorScale.tsx`'s legend, `HeatMapCellTooltipSwatch`
      (`Common/HeatMap/models.ts`/`HeatMapCellTooltip.tsx`), and the two tooltip builders
      (`build-heat-map-cell-tooltip-data.ts`, `build-stability-columns.ts`'s `buildStabilityTooltip`)
      to the same Tailwind-class-plus-light-override pattern, replacing their remaining
      `backgroundColor`/`borderColor` hex fields; update the affected specs
      (`HeatMapCellTooltip.spec.tsx`, `build-heat-map-cell-tooltip-data.spec.ts`) to match
- [x] 9.6 Re-run `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, `npm run format`, and
      the full `npm run test` suite, and fix any failures

## 10. Follow-up: Tailwind safelist for runtime-built class names

The user reported `1.000`'s text rendering white instead of green while `0.000` rendered correctly.
Root cause: `Common/ScoreCell/utils.ts` builds class names via string interpolation
(`` `text-score-${bucketKey}` ``), so Tailwind's static content scan never sees a literal class name
to generate CSS for. Compiling the real config confirmed only 7 of the 60 `score-*` classes existed
in the output CSS — the ones that happened to also appear as literal strings in test fixtures — and
`text-score-abs-11` specifically was never written literally anywhere, so it had no CSS rule at all.

- [x] 10.1 Add a `safelist` entry to `tailwind.config.js` matching the `bg|text|border-score-(abs-*|
      delta-*)` pattern (Tailwind's documented fix for class names built at runtime), and verify by
      compiling the config directly (`npx tailwindcss -i <empty-utilities-input> -o out.css --config
      tailwind.config.js` from `apps/ai-dial-admin/`) and confirming all 60 `score-*` classes — not
      just the 7 that existed before — appear in the output with their correct fallback hex
- [x] 10.2 Re-run the full `npm run test` suite, `npm run typecheck`, `npm run typecheck:specs`,
      `npm run lint`, and `npm run format`, fixing the one fixture
      (`Runs/View/tests/utils.spec.ts`) that still asserted a pre-existing, unrelated `cellClass`
      value from before a direct edit to `Runs/View/utils.ts` (`cellClass: 'p-0'`, flush the
      colored background to the cell edge) that the test hadn't been updated for

## 11. Follow-up: hidden-value regression, default border, group-row dividers

The user reported three more issues after visual review: (1) heatmap values were truncating instead
of disappearing in narrow columns — the automatic width-threshold behavior; (2) a
missing-value dash should also disappear (not just the score number) when values are hidden, leaving
a fully empty cell, and a visible border should appear once values are hidden either way; (3) score
cells in both Extraction Result and the Heat Map should show no visible divider between each other by
default, and a Heat Map group/dropdown-title row should show no left/right dividers between its own
cells, reading as one band.

- [x] 11.1 Fix the hidden-value regression: make sure the automatic `shouldShowHeatMapCellValue`
      width check actually runs in `ScoreCellRenderer`, so narrow columns hide their text instead of
      truncating it
- [x] 11.2 Add `Common/ScoreCell/models.ts`'s `ScoreCellBucketClasses.backgroundBorder` and
      `tailwind.config.js`'s `scoreCellBackgroundBorderColors` (the same CSS variable as each bucket's
      `bg-score-*` token, exposed as a `border-*-bg` token too) so a border can be colored to match
      its own cell's background; extend the `safelist` pattern to cover the new `-bg` suffix and
      verify by recompiling Tailwind directly (60 → 80 generated `score-*` classes)
- [x] 11.3 Rewrite `ScoreCellRenderer.tsx`: compute `isHidden` once, up front, for both the
      score-value and missing-value branches; missing-value cells now hide their dash (not just score
      cells hide their digits) and both get a visible right+bottom border once hidden (bucket accent
      color for a resolved score, `border-tertiary` for a missing value); non-hidden score cells now
      always draw a right+bottom border, colored to match background by default or the bucket accent
      when `isBorderVisible` is set
- [x] 11.4 Update `Common/HeatMap/constants.ts`'s `getHeatMapGridCellBorderStyle`/
      `getHeatMapDefaultCellStyle` to accept an `isRightBorderHidden` option, and
      `build-heat-map-columns.ts` to pass it for group/dropdown-title rows (both the label column and
      the value columns) so those rows show no vertical dividers between cells while keeping their
      bottom border
- [x] 11.5 Update `Common/ScoreCell/tests/utils.spec.ts`, `Grid/CellRenderers/tests/
      ScoreCellRenderer.spec.tsx`, and `Runs/Compare/HeatMap/utils/tests/build-heat-map-columns.spec.ts`
      for the new default-border, hidden-value, and group-row behavior; update the
      `score-cell-rendering`, `run-compare-heat-map`, and `test-suite-trends` spec deltas to describe
      the real default (background-matching border, not "no border") and the new group-row
      requirement
- [x] 11.6 Re-run the full `npm run test` suite, `npm run typecheck`, `npm run typecheck:specs`,
      `npm run lint`, and `npm run format`

## 12. Follow-up: remove the manual show/hide-values toggle

The explicit toolbar toggle added earlier in this change is no longer needed; value text is hidden
by the automatic column-width threshold only.

- [x] 12.1 Remove the `isValueHidden` override end to end: `HeatMapToolbar`'s switch and props,
      `CompareView`'s state, the prop through `CompareTabsContent`/`HeatMapTab`,
      `buildHeatMapColumns`' option, and `ScoreCellRenderer`'s `isValueHidden` param (the width
      check is now the only source of `isHidden`); drop the `RunCompareHeatMapShowValues` i18n key,
      update the affected specs, and remove the "Explicit show/hide values toggle" requirement from
      the `run-compare-heat-map` delta
- [x] 12.2 Align the specs and tests with the renderer's settled border behavior: visible-value
      cells draw no border (`border-none`), hidden-value cells draw the accent right+bottom border,
      a hidden missing-value cell draws a neutral right border, and a zero delta draws a neutral
      right border on a `layer-2` background; refresh the `ScoreCellRenderer`,
      `build-heat-map-columns`, and Compare `columns` specs, and drop the group-row-divider
      requirement the code no longer implements
