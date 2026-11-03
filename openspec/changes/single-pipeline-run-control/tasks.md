## 1. Runner client and models

- [x] 1.1 Remove `RUNNER_PAUSE_URL` and `AnalyticsRunnerApi.pause` from `src/server/analytics/analytics-runner-api.ts`, and `pausePipeline` from `src/app/[lang]/pipelines/actions.ts`
- [x] 1.2 Add `Stopped = 'stopped'` to `PipelineRuntimeState` in `src/models/analytics/pipeline-runtime.ts`; update the `PauseOrigin` and `PipelinePause` doc comments to say an operator origin only comes from an older runner
- [x] 1.3 Add `PipelineStopped = 'pipeline_stopped'` to `PipelineBackfillPauseReason` in `src/models/analytics/pipeline-backfill.ts`, with its entry in `PIPELINE_PAUSE_REASON_MESSAGE` (`src/constants/analytics/backfill.ts`) and an i18n key in `locales/en.ts`; keep it out of `PIPELINE_PAUSE_REASONS`

## 2. Runtime status

- [x] 2.1 In `components/Analytics/Pipelines/Common/runtime-view.ts` map `PipelineRuntimeState.Stopped` to `PipelineRuntimeStatus.NotTracked` and delete `isPauseOfferedFor`
- [x] 2.2 In `use-paused-pipelines.ts` build `tracked` only from cache entries whose `enabled` is not `false`

## 3. Pause removal and breaker resume

- [x] 3.1 Delete `Common/PausePipelinePopup.tsx` and its i18n keys; reduce `use-pipeline-pause.ts` to a resume-only hook (`use-pipeline-resume.ts`) that re-reads the runtime view after success and after a refusal
- [x] 3.2 In `PipelineDetailFrame.tsx` remove the Runtime tab's pause/resume control and every `isPauseOfferedFor` use; wire the banner's Resume to the new hook; raise the banner only while the pipeline is enabled
- [x] 3.3 In `PipelinePauseBanner.tsx` drop the operator-pause branch and its copy: breaker wording when `origin` is `breaker`, origin-less wording otherwise, lift time stated only where present
- [x] 3.4 Update comments in `PipelineDetailFrame.tsx`, `PipelineRuntimeBadge.tsx` and `use-paused-pipelines.ts` that describe an operator pause or a paused-but-enabled axis

## 4. Backfill on a disabled pipeline

- [x] 4.1 Add `isPipelineEnabled` to `Backfill/PipelineBackfillSidebar.tsx`, pass it from `PipelineDetailFrame.tsx` and on to `PipelineBackfillRunView`
- [x] 4.2 In `PipelineBackfillRunView.tsx` withhold Resume while the pipeline is disabled and state that it must be enabled first; keep Cancel
- [x] 4.3 In `PipelineBackfillSidebar.tsx` render the enable-first line instead of `PipelineBackfillStartForm` while the pipeline is disabled and state that it must be enabled first; keep the latest runs listed
- [x] 4.4 Confirm `PipelineBackfillBanner.tsx` shows a `pipeline_stopped` run with its reason (no change expected, because the reason is outside `PIPELINE_PAUSE_REASONS`)

## 5. Tests

- [x] 5.1 `Common/tests/runtime-view.spec.ts`: `stopped` on an enabled pipeline yields `NotTracked`, on a disabled one `Unknown`; remove `isPauseOfferedFor` cases
- [x] 5.2 `Common/tests/use-paused-pipelines.spec.tsx`: a cache entry with `enabled: false` is not tracked; one without the member still is
- [x] 5.3 Specs for the resume hook and `PipelinePauseBanner`: no confirmation, success notification and re-read, `409 pipeline_not_paused` error notification and re-read, origin-less pause still offers Resume, no pause control anywhere
- [x] 5.4 `Backfill/tests/PipelineBackfillSidebar.spec.tsx`: Resume and Start withheld with the enable-first text on a disabled pipeline and restored when the prop flips; a `pipeline_stopped` run states its reason
- [x] 5.5 Remove specs and `test-setup.tsx` mocks that exercise `pausePipeline` or `PausePipelinePopup`

No browser verification task: the user declined it, because it needs a local runner built from the
unreleased runner change; the scenarios are covered by the unit tests in group 5.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test` from the repo root and fix what they report
