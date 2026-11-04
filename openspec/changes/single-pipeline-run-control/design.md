## Context

The console reads the enrichment runner through `AnalyticsRunnerApi` and states its answer in three places:
the listing's runtime column (`use-paused-pipelines.ts`, `runtimeStatusOf`), the detail header and Runtime tab
(`use-pipeline-runtime-view.ts`, `runtime-view.ts`, `PipelineDetailFrame`, `PipelinePauseBanner`,
`PipelineRuntimeAlerts`), and the backfill drawer and banner (`components/Analytics/Pipelines/Backfill/`). The
pause itself is driven by `use-pipeline-pause.ts` and confirmed by `PausePipelinePopup`.

The runner contract this design targets is the one in epam/ai-dial-analytics-enrichment-runner#5: no
`POST …/pause`; `POST …/resume` lifts a breaker pause and answers `409 pipeline_not_paused` otherwise;
`GET …/runtime` answers `200` with `status.state: stopped` for a disabled pipeline; `GET /v1/pipelines/cache`
lists stopped pipelines with `enabled: false`; a backfill can carry `paused_reason: pipeline_stopped`, and
starting or resuming one on a stopped pipeline answers `409 backfill_conflict`. The registry side
(epam/ai-dial-analytics#36) changes nothing the console calls.

## Goals / Non-Goals

**Goals:**

- Remove every path that issues the retired pause verb, so no control can fail with a 404.
- Keep breaker resume, and make its refusal self-correcting by re-reading the view.
- State a disabled pipeline's held backfill, and withhold backfill verbs the runner will refuse on it.

**Non-Goals:**

- The `Runtime` tab's refresh-control wording ("a peer of the pause control") and the Groups tooltip and
  dead-letter re-run copy that mention a paused pipeline stay as they are: a breaker pause still exists and
  those texts remain true for it. A disabled pipeline's Groups and re-run copy is not reworded here.
- No runtime chip for `stopped`.

## Decisions

### `stopped` maps onto the existing `not running` status, and only for an enabled pipeline

`PipelineRuntimeState` gains `Stopped`, and `STATUS_OF_STATE` maps it to `PipelineRuntimeStatus.NotTracked`.
`runtimeStatusOfView` already returns `Unknown` for a disabled pipeline before it looks at the view, so the
mapping only fires during the sync lag after an enable — which is exactly the "has not picked it up yet" cause
the `NotTracked` warning names.

*Alternative — a `Stopped` chip:* rejected. A disabled pipeline already states "disabled" in the header, and a
chip saying the same thing again is the duplication the two-axis header was built to avoid.

*Alternative — leave it unmapped:* rejected. The unknown-state fallback states `Running`, which is wrong in
precisely the case it would fire.

### The listing counts only enabled cache entries as tracked

`usePausedPipelines` builds `tracked` from entries whose `enabled` is not `false`. `RunnerPipelineEntry`
already types `enabled`. An entry missing the member (older runner) still counts, so an older build keeps its
current behaviour.

### Resume lives in the banner only; the Runtime tab's control bar loses the pause/resume control

`use-pipeline-pause.ts` is reduced to a resume hook (rename to `use-pipeline-resume.ts`), `PausePipelinePopup`
and its i18n keys are deleted, and `isPauseOfferedFor` is deleted with its callers. Resume is offered exactly
where `pauseOf(status)` returns a pause, so the banner already owns the only place a resume makes sense.
After a resume, success or refusal, the hook calls the runtime view's reload, so a `409 pipeline_not_paused`
clears the banner.

*Alternative — keep a resume button in the control bar too:* rejected. It would render only while the banner
is up, so it duplicates the banner's control on the one tab where both are visible.

### Operator-origin pauses are tolerated, not stated

`PauseOrigin.Operator` stays in the model, because the paused listing of a runner older than this release can
still return one. The banner stops branching on origin: it states the breaker wording when `origin` is
`breaker`, and the origin-less wording otherwise. No operator-pause copy remains.

### Backfill: `pipeline_stopped` is a reason of its own, not a pipeline-pause reason

`PipelineBackfillPauseReason.PipelineStopped` is added with a message, and it is **not** added to
`PIPELINE_PAUSE_REASONS`, because that set hides the backfill banner on the assumption that the pipeline's own
banner is up — which a disabled pipeline never raises. `PipelinePausedOperator` stays in the enum and the set:
older runs carry it.

`PipelineBackfillSidebar` gains an `isPipelineEnabled` prop beside the existing `isPipelinePaused`, passed by
the detail frame from its pipeline. It hands the flag to `PipelineBackfillRunView`, which withholds Resume, and
renders the enable-first line in place of `PipelineBackfillStartForm` while it is `false` — the form itself
stays unaware of the pipeline, as it is today. Because the frame re-renders on an enable, the drawer follows it without reopening.

### The runner API client loses `pause` and `RUNNER_PAUSE_URL`

`pausePipeline` in `app/[lang]/pipelines/actions.ts` goes with it. Nothing else issues the verb.

## Risks / Trade-offs

- [The console ships before the runner] → Against the old runner an operator loses the in-runner pause, but
  disabling the pipeline still stops it there (the old runner drops a disabled pipeline from its cache). The
  release note says so.
- [The runner ships before the console] → Pause answers 404 until the console catches up. Mitigation: land
  this change in the same release as the runner.
- [`409 backfill_conflict` body shape not seen live] → The console shows the service's message through the
  existing refusal path, so an unexpected `error` code degrades to the generic message rather than failing.

## Migration Plan

Ship with the runner release that carries epam/ai-dial-analytics-enrichment-runner#5. Rollback is a revert of
this change together with the runner; neither leaves stored state behind in the console.
