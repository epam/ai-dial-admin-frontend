## Why

The split plot stacked its series, so every line was drawn at the cumulative height and the topmost
one traced the bucket total. A reader took a 15k spike for that model's own figure while the donut
beside it stated 7k for the whole window, and concluded the page was lying. The tooltip was right
throughout — only the picture misled, which is the worse failure of the two.

Three surfaces were answering two questions: the `Requests` tab states the total, the donut states
composition, and the split plot was doing both badly. Unstacked it answers the one neither does —
what each entity did over time.

## What Changes

- The split plot draws each series from a shared zero rather than on a stack, so a value comes off
  the axis and a spike belongs to whoever caused it.
- Its areas are drawn faintly, because unstacked areas overlap where a stack's never did.
- The dimension cell's label and its tooltip become one element. The button clipped the text and the
  tooltip's own element clipped it again, so two elements each believed they were the one truncated:
  hovering produced two boxes carrying the same name, beside a third from the info icon.

## Impact

- Affected specs: `analytics/dashboards`
- Affected code: `Usage/utils/chart-options.ts`, `Usage/Charts/TimeSeries.tsx`,
  `Usage/Breakdown/cells/DimensionCell.tsx`
- The window total leaves this plot. It is not lost from the page: the `Requests` tab states it.
