## Context

See `proposal.md` for motivation. The Runtime tab (`PipelineRuntime.tsx`) merges two upstreams per field: the
runner's view and the registry's `state`. It already receives the pipeline, so the kind
(`PipelineKind.Aggregate`) is known; the runner's `view.lane` says `Class1` for a SQL transform, but an
aggregate never has a view and a SQL enrichment's view can be missing after a runner restart. Deciding the
kind from the lane alone would flip a SQL pipeline's tab between two vocabularies on a restart.

## Goals / Non-Goals

**Goals:** one vocabulary per kind of pipeline that does not change with which upstream answered; a
schedule control with one place to type; messages that are readable whole.

**Non-Goals:** reworking how the two upstreams are merged; any change to `Common/*`.

## Decisions

- **Kind of pipeline is derived from the declaration, not from the view.** A small pure util
  (`utils/analytics/pipeline-runtime-kind.ts`) maps a `Pipeline` to aggregate, SQL or model-calling from
  `kind` and the transform's type; the lane is not an input. Alternative: read `view.lane`. Rejected because
  the view is absent exactly when the runner has restarted, which is when an operator is looking.
- **"Data up to" reads the registry's version, never the lag.** Aggregate → `cursor_version`; SQL →
  `materialized_through_version`; both epoch milliseconds, formatted through the existing
  `useLocalDateTimeString` path, which takes milliseconds as well as ISO strings. The lag is a difference against the moment of the read and
  stays for model-calling enrichments only.
- **The State card is gated by the same util**, so the two changes (Data up to, no State) cannot disagree.
- **One Last run row.** The runner's `last_scan_at` wins; the registry's `last_run_at` is drawn only where the
  runner has none. Same per-field rule the tab already follows for every other fact.
- **One cron field.** A mono `Input` plus a menu button of presets, composed in `CronField`; no Select, no
  Custom state and no caption, so there is no stored mode to drift. The menu button carries the word
  Presets, because a lone chevron did not read as a menu of schedules. Alternative
  considered: chips under the input — rejected, they cost a row of height on a form that is already long, and
  an enrichment's four presets would wrap. `isDefaultable` keeps its meaning: an empty input reads Every
  minute, and the placeholder says so.
- **Stage descriptions are one record keyed by `DlqStage`** beside `DLQ_STAGE_COLOR`, typed so a new stage
  fails to compile without a description. The grid shows it as a tooltip; the row detail states it in full,
  because a tooltip alone is not keyboard-reachable (`a11y.md`).
- **Message wrapping is fixed at our call sites.** Cause: the ui-kit `Notification` lays a section message out
  as a wrapping flex row (its default `textClassName`), whose item cannot break inside an unbroken string such
  as a request URL. The fix passes `textClassName` with `[overflow-wrap:anywhere]`, a prop the kit exposes for
  this; no edit to ui-kit.

## Risks / Trade-offs

- [A SQL pipeline whose registry state has no materialized-through version shows no Data up to row] →
  absent members are left out by the existing rule, never a placeholder.
- [Epoch millis outside the plausible range from a bad row] → the conversion returns nothing for a
  non-finite or non-positive value, so the row is omitted.
- [Renaming Backlog to Status changes labels that specs assert by i18n key] → keys are renamed together with
  the specs in the same task.
