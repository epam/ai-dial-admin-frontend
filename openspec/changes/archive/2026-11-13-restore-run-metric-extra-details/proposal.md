## Why

A metric reports more than a score. `Set Comparison`, for one, stores per leaf `tp`, `fp`, `fn`,
`true_positives`, `false_positives` and `false_negatives` in `metricInfos[group][leaf]`. Before the
row-details rework (#5350) a click on a metric showed every key of that entry; since then the run's side
panel, bottom drawer and Compare read only `reason`, `verbose_logs` and `error`, so a metric whose entry holds
anything else shows nothing. The data is still loaded — it is the UI that drops it. The popups' proposal
(`redesign-run-value-popups`) scoped the score popup to `reason` and `logs` and never accounted for
metric-specific keys.

## What Changes

- The metric field info gains a `details` text: every key of the leaf's `metricInfos` entry other than
  `reason`, `verbose_logs` and `error`, serialized as pretty-printed JSON. A leaf entry that is not an object
  (a bare string or number) becomes the details as is.
- The score popup shows a third card, `details`, between `reason` and `logs`, with the same collapse, size
  label, Copy button and line numbers as its siblings, and JSON highlighting. A run with no extra keys gets no
  such card.
- Which card is open when the popup opens: `reason` when any column has one (unchanged), otherwise the first
  card any column has. Without this a metric like Set Comparison, which has no reason, would open to a
  collapsed card and look empty at first glance.
- Every surface that opens the score popup gets the card without further wiring: the single run's side panel
  and bottom drawer, and Compare's table and pivot all build their field info from the same reader.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-value-popups`: the score popup shows a `details` card for the metric's other info keys, and opens the
  first available card when there is no `reason`.

## Non-Goals

- A card per extra key, as the pre-rework panel showed. One `details` card holds them all; see design.
- Diff highlighting of `details` in a comparison. `reason` is prose, where a word diff reads well; `details` is
  structured JSON and is compared by reading the columns side by side.
- Any change to the CSV export (it already writes every `metricInfo` key), the Summary tab's metric info, the
  loading of `metricInfos`, or any server action / API.
- Changing which fields or rows exist, or when a metric cell is clickable.

## Impact

- `Runs/Details/RowDetails/utils/metric-field-info.ts`, `RowDetails/models.ts` (`MetricFieldInfo`) and
  `RowDetails/constants.ts`: read the extra keys.
- `Runs/Details/ValuePopups/` — `models.ts`, `constants.ts`, `utils.ts`, `ScoreColumn.tsx`, `ScoreModal.tsx`:
  the third card and the default-open rule.
- `constants/i18n.ts` and `locales/en.ts`: the `details` card title.
- Tests next to each of the above; `openspec/specs/run-value-popups/spec.md` via the delta.
- `TestSuites/utils/metric-info.ts` (`getInfoEntries`, `groupInfoEntries`) has had no caller since the rework;
  it is left alone here.
