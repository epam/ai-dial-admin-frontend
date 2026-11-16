## Context

See proposal.md for why. Every run surface builds a metric cell's info through one reader,
`getMetricFieldInfo` (`Runs/Details/RowDetails/utils/metric-field-info.ts`): the bottom drawer calls it from
`BottomDrawer/utils.ts`, the side panel and Compare get the result through `row-detail-sections.ts` and
`getRowDetailRunInfo`. `ScoreModal` then turns a field's `MetricFieldInfo` into one `ScoreRunData` per run
(`ValuePopups/utils.ts`) and `ScoreColumn` renders a `MetricInfoCard` for each of `INFO_SECTIONS`.

The reader keeps three keys of `metricInfos[group][leaf]` — `reason`, `verbose_logs`, `error` — and
returns `undefined` when none is set, so a leaf whose entry holds other keys carries no info at all. That is the
whole defect: the loading (`getTestCaseRunResultDetails` → `metricInfos`) and the cell wiring are intact.

## Goals / Non-Goals

**Goals:**
- Every key of a leaf's entry is reachable from the score popup, on every surface, with one change to the
  reader and the popup.
- No new data path, no new surface-specific wiring.

**Non-Goals:**
- Anything in the proposal's Non-Goals.
- Rendering `details` as a typed table (counts, lists). The metric owns its keys; the popup cannot know them.

## Decisions

**1. `details` is a pre-serialized string on `MetricFieldInfo`, not a record.**
`MetricFieldInfo` already carries `reason` and `logs` as `string | null`, and `ScoreRunData` formats them with
`formatInfoText`. A `details: string | null` fits that shape: `getMetricFieldInfo` builds it from the leaf entry
minus the three reserved keys (`JSON.stringify(rest, null, 2)`), and `formatInfoText` already detects JSON and
tags it `json`. Alternative — carry the record and serialize in the popup — would put a second serializer next
to `serializeValue` for nothing; the record is never read for anything but display.

**2. One `details` card, not one card per key.**
The pre-rework panel emitted a card per key. For Set Comparison that is six cards for one metric, in a popup
whose cards are mutually exclusive (one open at a time), so reading `tp` next to `true_positives` would need
opening and closing. A single JSON card keeps the keys together, matches the existing card component and
the single-open rule unchanged, and needs no knowledge of the metric. Cost: nested values are JSON, not
prose — acceptable for data a metric returns for explanation.

**3. Reserved keys are subtracted, not whitelisted.**
`details` is "everything else", so a metric adding a key tomorrow shows up with no frontend change. A whitelist
of known metrics would drift the way this one did. `error` is reserved too, so a failed metric's message is
not shown twice (Error card and details). For the same reason a leaf whose own name is a reserved key — a failed
metric reports its single value as `error` — gets no details: `metricInfos[group].error` is the group's message, not
an entry of that leaf.

**4. A non-object entry (string, number, array) becomes the details as is.**
The old panel showed such an entry under a synthetic `value` key. Serializing it through the existing
`toText` keeps that reachable without inventing a key. Blank strings and `null` stay absent, as for `reason`.

**5. Falsy values are kept.**
`tp: 0` and `false_positives: []` are the answer, not an absence: Set Comparison's point is that nothing fell
in a bucket. The reader drops only keys that are absent; `details` is `null` only when no key remains.

**6. Default-open is the first available card.**
`DEFAULT_OPEN_SECTION` in `ScoreModal.tsx` is a constant `Reason`. With no `reason`, a Set Comparison popup
would open with its only card collapsed. The initial section becomes the first of `[Reason, Details, Logs]`
that any column holds, computed once from `columns` (`useState` initializer), so `reason` stays the default
whenever it exists and nothing changes for metrics that have one. "Any column", not "the first column", keeps a
comparison from opening nothing when only the second run has content. Alternative — always open `details` when
present — would demote the reason, which the popup was designed around.

**7. Card order is reason, details, logs.**
`details` is a short structured summary and `logs` the long tail, so details sits above logs. The order lives
in `INFO_SECTIONS` in `ScoreColumn.tsx`; the `MetricInfoSection` enum gains `Details = 'details'`, and
`METRIC_INFO_SECTION_I18N` a `Runs.MetricDetails` key (`details`, lowercase like its siblings).

## Risks / Trade-offs

- [Large entries] A metric returning a big list makes a long JSON card → the card collapses by default unless it
  is the only one, shows a size label like its siblings, and the editor scrolls.
- [Behaviour change for existing `Error` cards] None: `error` stays reserved, so the card's content is
  unchanged.
- [Default-open rule touches every popup] For a metric with a `reason` the result is identical to today, which
  the existing reason-default scenario keeps covered.
- [Fixtures] Two cases in `metric-field-info.spec.ts` pin the defect and flip: "Should ignore entries other than
  reason and logs" (unknown keys now become `details`) and "Should ignore a leaf entry that is not an object"
  (a string or array entry now becomes `details`). The typecheck gate catches any fixture that builds a
  `MetricFieldInfo` without the new field.
