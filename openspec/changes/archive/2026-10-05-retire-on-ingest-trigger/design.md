## Context

See proposal.md — Why. The console models the trigger as `TriggerKind { OnIngest, Schedule, Group }` and
the Advanced block as `PipelineAdvanced { scan_every, rows_per_scan, rows_per_call, rate_rpm,
sample_fraction }`. `CronField` derives its selection from the value — a value matching a preset selects
it, any other non-empty value is Custom — and keeps state only for "Custom chosen, nothing typed yet".
`AggregateSection` and `EnrichSection` both render it. `buildTrigger` already omits an empty cron and
already forces `schedule` for an aggregate, so an aggregate registration already sends
`trigger: {kind: "schedule"}`.

ADAS resolves the default cron in `PipelineService.cronOf` on **every** write, a PATCH included, whenever an
enrich `schedule` trigger carries a blank or absent cron. That is what lets the console clear the cron to
mean "every minute" on an existing pipeline as well as on a new one.

## Goals / Non-Goals

**Goals:**
- No request the console builds carries `on_ingest` or `advanced.scan_every`.
- The service's default cron reads as a named preset, not as a raw expression.

**Non-Goals:**
- Reading the `on_ingest` kind tolerantly. ADAS migrates every stored row and never returns it, so no
  fallback label or legacy branch is kept.

## Decisions

### D1. Every minute is a matcher, not a fixed value

The existing presets are `{ value, labelKey }` pairs matched by equality. The service's default is
`S * * * * *` with `S` per pipeline, so no single value can match it. Every minute is therefore a separate
constant (`CRON_EVERY_MINUTE_PRESET`), and its match lives in `utils/analytics/cron.ts` as a pure
`isEveryMinuteCron(expression)` — `^([0-5]?\d) \* \* \* \* \*$` after trimming. `CronField` checks it before
the equality presets.

Rejected: an equality preset `0 * * * * *`. It would not match the stored default, and choosing it would
put every such pipeline on second 0, which ADAS deliberately avoids (its design D2).

### D2. Choosing Every minute clears the cron, unless it already matches

Selecting Every minute calls `onChange('')` when the current value is not every-minute, and is a no-op when it
is. `buildTrigger` already drops an empty cron, and the service resolves it on that write. Keeping a matching
value stops a re-selection from counting as an unsaved change.

Rejected: computing `MD5(name) mod 60` in the console. It duplicates the service's derivation, and Web
Crypto offers no MD5.

### D3. `CronField` takes an `isDefaultable` flag rather than knowing the pipeline kind

`isDefaultable` (true from `EnrichSection`, false from `AggregateSection`) switches three things:
whether Every minute is offered, whether an empty value reads as Every minute, and whether the label is
marked required. `CronField` is a pipeline-local component (`Pipelines/Common`), not a `Common/*` shared one,
so adding the prop is in scope. Naming it by capability rather than passing `PipelineKind` keeps the control
ignorant of why a cron may be absent.

The derived-selection rule stays: with `isDefaultable`, an empty value or a matching value selects Every
minute; *Custom chosen with nothing typed* still holds its state and sends no cron, which the service then
defaults — the same result as Every minute, so it is not blocked.

### D4. The create modal seeds the trigger in its initial draft

`CreatePipelinePopup` passes `initialDraft: { kind: Enrich, trigger: { kind: Schedule } }`. No control is
added. Switching the kind to aggregate leaves the trigger in the draft, and `buildTrigger` already rebuilds
an aggregate's trigger as `{ kind: schedule }` with no cron, so aggregate registration is byte-identical to
today.

Rejected: defaulting inside `buildTrigger` for every enrichment without a trigger. That would also give a
trigger to an existing pipeline that was registered without one, the first time anything else on it is saved.

### D5. The trigger fallback becomes `Schedule`

`use-pipeline-form`'s `onTriggerChange` falls back to `{ kind: TriggerKind.OnIngest }` when a trigger member
is edited on a pipeline with no trigger. It becomes `TriggerKind.Schedule`, the only row-grain kind left.

### D6. Fixtures move to `Schedule`, `scan_every` tests move to another knob

About twenty specs use `TriggerKind.OnIngest` only as a neutral enrichment fixture; they become
`TriggerKind.Schedule`. Where a fixture's assertions depend on the absence of a cron (for example the
`pipeline-dto.spec` case that strips a cron from a non-schedule kind), the case moves to `TriggerKind.Group`.
`PipelineDetailView.spec` uses `editScanEvery` as its generic "make the form dirty" helper; the helper is
rewritten against `rows_per_scan` rather than deleted, so the dirty-state cases keep their coverage.

## Risks / Trade-offs

- [Console deployed before ADAS] → an enrichment registered from the modal is stored as `schedule` with no
  cron and refused at enable until a cron is picked; Every minute then sends none, so the author must pick
  another preset. Ship with or after ADAS (proposal — Impact).
- [`isEveryMinuteCron` also matches a cron the author typed, such as `15 * * * * *`] → intended: it fires
  every minute, and the preset label is accurate. Re-selecting Every minute keeps the value (D2).
- [Uncommitted work on `feat/pipeline-groups-tab` touches `PipelineDetailTabs.spec.tsx`, `FailuresGrid.spec`
  and `detail-page.spec.tsx`] → the overlap is fixture lines only; whichever lands second rebases its
  `OnIngest` fixtures.
