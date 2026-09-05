## Why

A result cell holding a JSON document is unreadable in the grid, and the app offered no way to read it.
Hovering helped only by accident: the shared grid's tooltip reads the **raw** cell value and its renderer
drops anything that is not a string, so a string column showed a tooltip and an object column showed
nothing — the asymmetry an operator sees as "some columns have tooltips, some don't".

Fixing the tooltip alone would not make these values readable. The heavy columns — a request body, a
response body, a tag map — run to whole JSON documents, and a tooltip cannot be scrolled, selected,
searched, or kept open, and is bounded by the viewport whatever the value's size.

## What Changes

- A result column's tooltip is the **rendered** text, so an object cell has one at all, and it is offered
  only while that text is short enough for a tooltip to actually show it.
- Past that length the cell shows a bounded preview and a control that opens the value in a dialog: the
  value pretty-printed in a read-only editor that scrolls, folds and searches, with copy and close.
- A value that arrives as JSON *text* — which is how the heavy columns actually arrive — is indented
  rather than shown as one line.
- The cell stops carrying whole documents in the DOM: it keeps a bounded preview, and the full value
  lives in the dialog.

## Non-goals

- **The shared grid wrapper is left alone.** Its string-only tooltip renderer is the root cause and
  affects every grid in the app; this change is deliberately local to the Analytics result grid, so the
  treatment can be judged on one surface before it moves down.
- **No new viewer component.** The dialog composes the existing read-only editor and formatter rather
  than adding another one to `Common/`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the result grid's requirement gains how a cell value is presented — tooltip below a
  threshold, preview plus viewer above it.

## Impact

- `src/components/Analytics/QueryBuilder/Result/` — the cell renderer and its dialog
- `src/components/Analytics/QueryBuilder/utils/result.ts` — the threshold helpers and the tooltip getter
- `src/constants/analytics/query-builder.ts` — two thresholds
- `src/constants/i18n.ts` + `src/locales/en.ts` — two labels
- No server action, API route, or backend change.
