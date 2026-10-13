## Context

See `proposal.md` for motivation. Today, three independent code paths resolve a score to a color
(`Common/ColorScale/{constants,models,utils}.ts` for the Heat Map's accuracy/delta buckets,
`Common/ScoreBar/{constants,utils}.ts` for the Extraction Result bar's fill color, and a third,
seemingly-legacy `getAccuracyColors` call inline in `Runs/Compare/ExecutionResults/utils/columns.ts`
that is immediately overridden), and two renderers draw a score (`MetricScoreCellRenderer` + `ScoreBar`,
and `Common/HeatMap/HeatMapValueCellRenderer`, which renders only the number — its background/border
color comes from a separate `cellStyle` callback on the AG Grid `ColDef`, not the renderer itself).
There is no `Score` type anywhere; a score is validated ad hoc via `isScoreIndicatorValue` (`typeof
value === 'number' && value >= 0 && value <= 1`). The new palette's colors are read from the Figma
file's own variable definitions via the Figma MCP server (`get_variable_defs`), not transcribed from
a screenshot — see Decisions below for how that maps onto this app's token architecture, where every
existing color (`--bg-layer-0`, `--text-primary`, …) is a `var(--name, #darkFallback)` populated at
runtime by an external, per-deployment theme service (`applyThemeColors`), not by static CSS.

## Goals / Non-Goals

**Goals:**
- One palette module and one AG Grid cell renderer for every score/delta cell this change touches.
- Preserve today's automatic width-based value-hiding as the default in the shared `Common/HeatMap`
  layer; add the explicit override only in the Compare Heat Map's own toolbar.
- Keep `HeatMapGridRow`'s and `HeatMapColorDisplayMode`'s existing data shape and Absolute/Delta
  split — this change replaces how a value maps to a color, not how rows/columns are built.

**Non-Goals:**
- Touching `Runs/Compare/ExecutionResults/*`'s diff-border system (`MetricDeltaKind`,
  `.compare-metric-*` CSS, `CompareDeltaCellRenderer`, `MetricDeltaBadge`) — confirmed out of scope.
- Migrating `Runs/Details/RowDetails/FieldValue.tsx`'s inline score-bar row — flagged as a follow-up.
- Pixel-verifying every bucket's hex value against Figma Dev Mode — superseded; see Decisions (the
  values now come straight from Figma's variable definitions via the Figma MCP server).
- Introducing a reusable `Score` branded type beyond what the new module already needs
  (`isScoreIndicatorValue`'s existing guard shape is kept).

## Decisions

### Bucket colors are Tailwind tokens, not computed values

The first implementation pass computed the 20 buckets' colors from a handful of HSL stops in
`Common/ScoreCell/constants.ts`, selected by theme in `utils.ts`. The user rejected this: colors must
be real `tailwind.config.js` tokens, like every other color in the app, not generated in a TS file —
and the HSL guess didn't match Figma anyway, since it was never checked against the file's actual
variables. The corrected design:

- **`tailwind.config.js`** gains `scoreCellBackgroundColors` / `scoreCellTextColors` /
  `scoreCellBorderColors`, one entry per bucket (`score-abs-00`…`score-abs-11`,
  `score-delta-n4`…`score-delta-p4`), each `var(--score-<bucket>-<channel>, <darkHex>)` — the same
  shape as every existing token in that file. The dark fallback hex is read directly from Figma's
  variable definitions (`Heat Map/Absolute values/{Background,Text,Stroke}/*` and
  `Heat Map/Delta/{Background,Text,Stroke}/*`, node `62:572` / `72:409`) via the Figma MCP server's
  `get_variable_defs`, cross-checked bucket-by-bucket against the base palette (node `62:307`) —
  not a screenshot transcription. This gives every bucket real Tailwind utility classes
  (`bg-score-abs-00`, `text-score-abs-00`, `border-score-abs-00`, …) usable anywhere, not just from
  this feature's renderer.
- **Light Mode has no token in the external theme service** for these new buckets (that service only
  overrides keys it knows about), so `Common/ScoreCell/constants.ts`'s `SCORE_CELL_LIGHT_OVERRIDES`
  holds the Light Mode hex per bucket — also read from Figma's variable defs, resolved per-swatch
  where Figma's own light-column labels turned out to be unreliable (see below) — and
  `getScoreCellLightOverrideStyle(bucketKey, theme)` applies them as an inline
  `--score-<bucket>-<channel>` custom-property override only when the active theme isn't dark. This
  is the same mechanism `applyThemeColors` already uses for every other token in the app; it's just
  supplied locally here because the theme service doesn't carry these keys.
- **`models.ts`**: `ScoreColorMode { Absolute = 'absolute', Delta = 'delta' }`,
  `ScoreCellBorderSides { top?; right?; bottom?; left? }`, `ScoreCellBucketClasses { background:
  string; text: string; border: string }` (Tailwind class names, not colors).
- **`utils.ts`**: `getScoreCellBucketKey(value, mode): string | null` (bucket lookup — `null` for
  `delta === 0`, matching the "Zero delta is neutral" scenario), `getScoreCellBucketClasses(bucketKey)`
  (builds the three class names), `getScoreCellLightOverrideStyle(bucketKey, theme)` (the Light Mode
  override above).

**Figma data quirks surfaced while reading the variable defs** (worth recording, since they'd
otherwise look like bugs in this code): the file's own "Stroke"-named layer for the Absolute scale is
actually bound to the `.../Text/*` variable (and a second, correctly-bound `.../Stroke/*` layer sits
elsewhere) — a label/binding mismatch in the Figma file itself, resolved by reading `get_variable_defs`
per-frame rather than trusting layer names. One Light Mode swatch is text-labeled "Yellow/850", which
doesn't exist in the base palette; querying its node directly resolved it to `#6a7523`, i.e. the file's
own `Green/1150` under a stale label. Delta's most-negative bucket is the one case where Text and
Stroke genuinely diverge in Dark Mode (Text `#ff4e50` / Red-600, Stroke `#eb503e` / Red-800); every
other bucket's Text and Stroke match.

Two tooltip swatches (`HeatMapCellTooltipSwatch`, used by `HeatMapCellTooltip.tsx`) move the same way:
from `{ backgroundColor, borderColor }` hex fields to `{ className, style? }`, built by
`build-heat-map-cell-tooltip-data.ts` / `build-stability-columns.ts`'s tooltip builder from the same
`getScoreCellBucketClasses`/`getScoreCellLightOverrideStyle` pair.

`HeatMapColorDisplayMode` (`Runs/Compare/HeatMap/models.ts`) becomes a thin re-export of the new
`ScoreColorMode`, rather than being merged into it directly at every call site — it's consumed
throughout the Compare feature folder and renaming it would ripple through unrelated imports for no
behavioral change. `Common/HeatMap/models.ts`'s `HeatMapValueFormatMode` (the same two values, a
second enum predating `ScoreColorMode`) is removed outright instead of re-exported: once
`Common/HeatMap/HeatMapValueCellRenderer.tsx` and its Compare wrapper — its only two callers — are
deleted (see below), nothing references it.

`Common/ColorScale/{constants.ts,models.ts,utils.ts}` and all of `Common/ScoreBar/` are **kept,
unmodified** — not deleted as originally planned. Both still have live callers this change does not
touch: `Runs/Compare/ExecutionResults/utils/columns.ts` (`getAccuracyColors` for its own metric-cell
background, plus `MetricScoreCellRenderer`/`ScoreBar` for score rendering, interleaved with the
diff-border `cellClassRules` on the same columns), `Runs/Details/RowDetails/FieldValue.tsx` +
`row-detail-sections.ts` (`ScoreBar`/`isScoreIndicatorValue`), and `Runs/Details/MetricCard.tsx`
(`getAccuracyColors` for its fill-bar color) — a small Run Details summary card not part of
Extraction Result or the Heat Map tables, out of scope per the user's explicit call. Once this
change's three callers (Extraction Result, Heat Map, Stability) move to `Common/ScoreCell`, both old
modules keep exactly their current shape for their remaining three callers.
`Common/ColorScale/ColorScale.tsx` (the legend) is rewritten against the new bucket keys and Tailwind
classes — kept in its existing folder since nothing else currently lives in `Common/ScoreCell/` that a
legend component would naturally join, and relocating it is a rename with no behavioral benefit.

**Alternative considered:** keep `ColorScale` and `ScoreBar` as two modules and only change their
constants. Rejected — the two modules disagree on bucket count and shape (`{bg,border}` vs. a single
fill color) today, which is exactly the inconsistency the new design eliminates for the three
callers this change owns; patching both in place would keep that duplication for those three.

### `ScoreCellRenderer` as a new `Grid/CellRenderers/` component, not a `MetricScoreCellRenderer` edit

A new `ScoreCellRenderer.tsx` is added following the sibling convention (flat file, `<Name>Params
extends ICellRendererParams`, default export — see `BooleanButtonCellRenderer`,
`CompareDeltaCellRenderer`). It takes `{ value, mode, theme, isBorderVisible?, borderSides? }` and renders the right-aligned number (or nothing, when hidden), applying the
bucket's Tailwind background/text classes plus, when the border is enabled, the border-color class
and Tailwind's border-width side classes (`border-t`/`border-r`/`border-b`/`border-l`, or bare
`border` for all sides). `Runs/View/utils.ts`, `build-heat-map-columns.ts`, and
`build-stability-columns.ts` switch to it directly. `Common/HeatMap/HeatMapValueCellRenderer.tsx`
(+ its `Runs/Compare/HeatMap` wrapper) is deleted once those are its only callers.
`MetricScoreCellRenderer.tsx` is **not** deleted — `Runs/Compare/ExecutionResults/utils/columns.ts`
is its other caller, and that file is out of scope — but it keeps only that one remaining caller once
Extraction Result moves off it. Unlike today's heatmap renderer, `ScoreCellRenderer` owns its own
background/border styling instead of relying on a separate `cellStyle` callback on the `ColDef` —
this removes the split between "what renders the text" and "what colors the cell" that exists today,
for the three callers this change owns.

**Alternative considered:** keep `cellStyle` doing the coloring and only change the color-returning
functions it calls. Rejected for Extraction Result and Stability, whose existing renderers
(`MetricScoreCellRenderer`, the Stability column builder) already compute the value inside the
renderer — splitting color resolution back out to a `cellStyle` callback would mean computing the
same value twice (once in the renderer, once in `cellStyle`) for every cell.

### Hidden-value accessibility: `aria-label` on the cell, not a second live region

When the value text is hidden (column narrower than the automatic width threshold), `ScoreCellRenderer` renders its container with `aria-label` set to the
formatted score (reusing the existing `formatHeatMapCellValueForMode`/number-formatting logic), so a
screen reader still announces the value even though no digits are visible. The existing
`HeatMapCellTooltip` already surfaces the value on hover/focus for sighted keyboard users; this
`aria-label` is the screen-reader equivalent, not a duplicate `aria-live` region — the value doesn't
change without a user action (resizing a column re-renders cells, it doesn't post an
announcement), so `a11y.md`'s live-region guidance doesn't apply here.

### Tailwind safelist for class names built at runtime

Building each bucket's class name via string interpolation (`` `bg-score-${bucketKey}` ``) means
Tailwind's static content scan never sees a literal class name token, so it generates no CSS for most
of them — confirmed by compiling `tailwind.config.js` directly: only 7 of the 60 `score-*` classes
existed in the output, and only because they happened to also appear as literal strings in test
fixtures (an accident, not a mechanism — e.g. `text-score-abs-11` was never written literally
anywhere, so it silently had no rule and the score-`1.000` text fell back to the default text color).
`tailwind.config.js` now carries `safelist: [{ pattern: /^(bg|text|border)-score-(abs-(0[0-9]|1[01])
|delta-[np][1-4])$/ }]` — Tailwind's documented mechanism for exactly this case — covering all 20
bucket keys across the 3 color categories. Verified by compiling the config and grepping the output
for all 60 expected classes, not just by re-running the test suite (the suite's class-name assertions
can't tell a safelisted class from a merely-present-in-source accident).

## Risks / Trade-offs

- **[Resolved]** An earlier pass had computed the 20 buckets' colors from guessed HSL stops, not
  Figma's actual values, and the user caught it ("colors are not right"). The fix: hex values now
  come from Figma's own variable definitions (`get_variable_defs` via the Figma MCP server), read
  bucket-by-bucket and cross-checked against the base palette — see Decisions above, including the
  Figma-file quirks (a mislabeled layer, one mis-named swatch) that surfaced while verifying. No
  outstanding transcription risk remains for Dark Mode; Light Mode's values came from resolving each
  swatch node directly for the same reason, so the same confidence applies.
- **[Risk]** `Common/ColorScale` and `Common/ScoreBar` keep exports that now have only out-of-scope
  callers (`Runs/Compare/ExecutionResults/utils/columns.ts`, `FieldValue.tsx`/
  `row-detail-sections.ts`, `MetricCard.tsx`). A future cleanup pass could delete them without
  noticing those callers, since nothing marks the modules as "still needed." → **Mitigation**: this
  design doc and the proposal's Impact section record the three remaining callers explicitly; a
  future removal still needs the same repo-wide grep this change ran before concluding either module
  is dead.
- **[Risk]** Light Mode's per-bucket hex lives only in `Common/ScoreCell/constants.ts`
  (`SCORE_CELL_LIGHT_OVERRIDES`), applied as a runtime inline-style override rather than a second
  `tailwind.config.js` fallback — Tailwind's `var(--x, fallback)` syntax only accepts one fallback, and
  this app has no static `[data-theme]`/light-stylesheet mechanism to hang a second one on (every
  other token's "light" value comes from the external theme service instead, which doesn't know
  these new keys). → **Mitigation**: both the dark (Tailwind fallback) and light (JS override) values
  sit next to each other in code with matching bucket keys, so a future audit can diff them directly
  rather than needing to understand the override mechanism first.
- **[Trade-off]** `HeatMapColorDisplayMode` stays as its own name re-exporting `ScoreColorMode`,
  rather than every Compare call site importing `ScoreColorMode` directly. Slightly more indirection,
  in exchange for not touching that feature folder's unrelated imports.
