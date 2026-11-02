## Why

The analytics registry and the enrichment runner are moving to one run control for a pipeline: its `enabled`
flag in the registry (epam/ai-dial-analytics#36, epam/ai-dial-analytics-enrichment-runner#5). The runner drops
its own operator pause, keeps a disabled pipeline's queued work instead of discarding it, and reports a
disabled pipeline as `stopped` rather than as one it does not hold. The console still offers that operator
pause, so once the matching runner is deployed its Pause control fails on every use, and a backfill held by a
disabled pipeline reports a pause reason the console has no wording for.

## What Changes

- **BREAKING (console behaviour):** the pipeline Pause control and its confirmation are removed from the
  Runtime tab. Stopping a pipeline is done with the existing enable/disable control only.
- Resume is kept, and offered only for a pause the runner's circuit breaker took. A resume the runner refuses
  because the pipeline is no longer paused reports the service's message and re-reads the runtime view.
- The pause banner states only a breaker pause; the operator-pause wording is retired. A pause whose origin
  is missing still raises the banner with Resume.
- The detail page states a runtime view reporting `stopped` for an enabled pipeline the way it states one the
  runner has not picked up yet, because that is what it is: the runner has not synced the enable.
- The listing counts a pipeline as taken on only when the runner's cache lists it as enabled, because the
  cache now lists stopped pipelines too.
- Backfill: a run paused with reason `pipeline_stopped` states that its pipeline is disabled. Resume on such a
  run, and Start on a disabled pipeline, are withheld with a line saying the pipeline must be enabled first,
  because the runner refuses both with `409`.
- Specs and the runner API client lose the pause verb; `pipeline_paused_operator` stays readable because
  older backfill runs carry it.

## Non-goals

- No change to the registry calls: enable/disable already sends `enabled` through the existing update.
- No new runtime chip for `stopped`: a disabled pipeline states no runtime, and an enabled one reported
  `stopped` is a sync lag the existing "not running" state already describes.
- No change to how the stale-revision notice compares `generation`; the registry simply bumps it less often.
- No migration helper for operator pauses taken on the old runner; the runner's upgrade note covers it and a
  runner restart clears them.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/pipelines`: runtime control loses the pipeline pause; resume is breaker-only; the banner,
  runtime status table, listing derivation and backfill controls account for a disabled pipeline the runner
  reports as `stopped`.

## Impact

- `apps/ai-dial-admin/src/server/analytics/analytics-runner-api.ts`, `app/[lang]/pipelines/actions.ts` — the
  pause verb and URL go away.
- `components/Analytics/Pipelines/Common/` — `PausePipelinePopup`, `use-pipeline-pause`, `PipelinePauseBanner`,
  `PipelineDetailFrame`, `PipelineRuntimeAlerts`, `runtime-view.ts`, `use-paused-pipelines.ts`.
- `components/Analytics/Pipelines/Backfill/` — run controls, start form and banner.
- `models/analytics/pipeline-runtime.ts`, `models/analytics/pipeline-backfill.ts`,
  `constants/analytics/backfill.ts`, `locales/en.ts` and its i18n keys.
- Release coupling: this ships with the runner release that removes the pause. Against an older runner the
  console no longer offers a pause, which is acceptable because disabling the pipeline still stops it.
