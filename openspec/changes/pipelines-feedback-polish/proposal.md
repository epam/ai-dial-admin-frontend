## Why

Demo feedback on the Pipelines pages found a run of small defects that each cost an operator a question: a
red "not running" alert on every enable, a two-part schedule control nobody could read, long errors cut off
at the edge, a failures grid that names stages without saying what they do, and a Runtime tab whose
vocabulary ("Behind its input", "Backlog", "Last scan") and State card do not fit the kinds of pipeline the
registry now reports a position for.

## What Changes

- The "Nothing is running this pipeline" alert moves from a red page-level notification above the tab strip
  into the `Runtime` tab as a warning, with copy that says a minute's delay after enabling is normal.
  **Already implemented in the working tree; the change records it.**
- The cron control becomes one field: an input holding the six-field expression, a Presets menu beside it,
  labelled Presets. The separate Custom mode and any caption go. The label
  becomes "Schedule".
- Service messages wrap instead of being cut off wherever the Runtime tab and the alerts show them.
- The failures grid describes each dead-letter stage — on hover and focus, and in the row's detail.
- Runtime tab, aggregate and SQL pipelines: "Behind its input" becomes "Data up to", read from the
  registry's cursor version (aggregate) or materialized-through version (SQL) as a local timestamp, and the
  State card is withdrawn. Model-calling enrichments keep the lag and the State card.
- Runtime tab, every kind: "Backlog" / "Caught up" becomes "Status" / "Up to date" or "Catching up".
- "Last scan" becomes "Last run", and the tab shows one such row rather than two.
- A cursor identity that is still shown (model-calling enrichments) is readable in full and copyable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the cron control, the Runtime tab's progress and state groups and their
  vocabulary, the failures grid's stage column, where the not-running warning sits, and message wrapping.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Pipelines/`: `Common/CronField.tsx`, `PipelineRuntime.tsx`,
  `Common/PipelineDetailFrame.tsx`, `Common/PipelineRuntimeAlerts.tsx`, `Failures/FailuresGrid.tsx`,
  `Failures/FailureRowDetail.tsx`, and their specs.
- `src/locales/en.ts`, `src/constants/i18n.ts`, `src/constants/analytics/` (stage descriptions, cron presets).
- No server action, DTO or backend change: every member read is already on the pipeline's `state`.

## Non-goals

- No change to the model-calling pipeline's Runtime tab beyond the shared renames (Status, Last run).
- No edit to a shared `Common/*` component to fit one caller.
- No change to the runner's or the registry's contract, and no new field requested from either.
