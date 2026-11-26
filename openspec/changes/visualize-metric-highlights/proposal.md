## Why

Some eval metrics store scored text chunks under `metricInfos[group][leaf].highlight`.
The score popup already shows that key (and `json_explanation`) as detail cards. The
single-run row-detail pivot only listed `metricValues` leaves, so readers never saw the
highlight text beside the numeric outputs. Issue #5651 asks for a colored highlight
column in that pivot.

## What Changes

- When a metric leaf has `metricInfos…highlight`, the pivot gains a `{leaf} highlight`
  column immediately after that leaf's numeric column.
- The cell renders chunk text colored by score (positive → green delta palette, negative
  → red, `0` → neutral). Non-highlight values are unchanged.
- The score popup is unchanged — it already surfaces `highlight` and `json_explanation`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `progressive-depth-detail-panel` / row-detail pivot: inject highlight columns from
  `metricInfos` and render them as colored text.

## Non-Goals

- Changing the score popup (`ScoreColumn` / `ScoreModal`).
- Compare grid, heat map, or the main AG Grid results table.
- Removing `highlight` from the popup's detail cards.

## Impact

- `Runs/Details/BottomDrawer/utils.ts` (inject highlight rows)
- `Runs/Details/RowDetails` (parser, `HighlightedText`, `FieldValue`)
- Specs under `visualize-metric-highlights`
