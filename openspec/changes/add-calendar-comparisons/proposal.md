## Why

The `Compare` control offers one comparison: the span immediately before the window. That answers
"busier than the two days before these two", which is the right question for an incident and the
wrong one for a trend. A reader asking whether September costs more than August, or than September
a year ago, has no way to ask it — the adjacent span for a month-long window is the previous month
only when the window happens to be aligned to a month, and never the same month a year back.

Both comparisons are already expressible: the page derives its previous window from the current one
when the window is taken, so a second derivation rule costs one function and no extra request.

## What Changes

- The `Compare` selector offers `Previous month` and `Previous year` alongside `Previous period`
  and the off option.
- Each takes the current window back by whole calendar months — one and twelve — keeping its
  duration rather than its end date, and clamping a day the target month does not have.
- A KPI card's footnote names the window it is compared against rather than always saying
  "previous period"; the delta's screen-reader text names no period, since it is rendered in places
  that do not know which one is selected.

## Impact

- Affected specs: `dashboard-period-comparison`
- Affected code: `Usage/utils/windows.ts`, `Usage/Controls/UsageControls.tsx`, `Usage/Kpi/KpiRow.tsx`,
  `Usage/utils/labels.ts`, `Usage/models.ts`, the module's i18n keys
- No new request shape and no change to how many requests a window costs.
