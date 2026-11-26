## 1. Contract and server layer

- [x] 1.1 Add `PipelineModelRun`, `ModelRunEvaluation`, `ModelRunUsage`, `ModelRunStatus` and `ModelRunUsageUnit` (stages reuse `DlqStage`) to `src/models/analytics/pipeline-model-run.ts`, typed after the runner's `DryRunResponse` / `DryRunEvaluationDto` (snake_case members, absent rather than null).
- [x] 1.2 Add `RUNNER_TRY_URL(name)` and `runWithModel(name, token)` (POST, no body) to `src/server/analytics/analytics-runner-api.ts`.
- [x] 1.3 Add the `runPipelineWithModel(name)` server action to `src/app/[lang]/pipelines/actions.ts`, guarded by `analyticsRunnerApi.isConfigured` like the other runner actions.
- [x] 1.4 Unit tests: the runner method's URL, method and token in `src/server/analytics/tests/`, and the action's `noRunner` guard and pass-through in `src/app/[lang]/pipelines/tests/actions.spec.ts`.

## 2. Pure helpers

- [x] 2.1 Add the stage order constants (row-grain and group) to `src/components/Analytics/Pipelines/Preview/constants.ts`, and a `getStageStates(status, stage, isGroup)` helper under `Preview/utils/`, following design.md "Stage order kept in the console".
- [x] 2.2 Add helpers to match an evaluation to its preview row by grain key (falling back to the first row), to derive the `From model` columns from `outputs` keys, and to pretty-print text only when it parses as JSON.
- [x] 2.3 Extend `PreviewFailureKind` and `getFailureKind` in `Preview/utils/preview-state.ts` with the runner refusals (`dry_run_in_progress`, `spend_budget_exhausted`, `dial_rate_limited`, `pipeline_not_runnable`, `adas_unavailable` / `adas_contract_mismatch` as one kind, runner `not_found`, generic model-run failure), leaving registry codes on their existing kinds.
- [x] 2.4 Unit tests for every helper and for each new failure-kind mapping.

## 3. Hook

- [x] 3.1 Extend `usePipelinePreview` with `runWithModel()`: a shared run id, a held result carrying the preview plus optional `evaluations` and the issued generation, last-to-return-wins, `previousGroupKey` across both kinds, and an `isModelRunUnsupported` flag set by the runner's `not_found`.
- [x] 3.2 Update `src/components/Analytics/Pipelines/Preview/tests/use-pipeline-preview.spec.tsx` (or add it) for: a model run replacing a preview, a preview replacing a model run, a refusal keeping the held result, a late answer after unmount dropped, and the unsupported flag.

## 4. Run bar, confirmation and in-flight state

- [x] 4.1 Render the model-run control in `PreviewRunBar` with its four labels, gated in `PipelineDetailFrame` / `PipelinePreview` on `llm` transform and runtime outcome not `Pending` / `Unavailable`, disabled while either run is in flight or when unsupported.
- [x] 4.2 Add `Preview/ModelRunConfirmPopup.tsx` modelled on `Failures/RequeueFailuresPopup.tsx`: deployment or application and route, the call count by preset, the budget note, `Cancel` / `Run with model`, focus returned to the opener.
- [x] 4.3 Add the in-flight banner naming the deployment and row or group, and reuse the existing dimmed / reading states; extend the unsaved banner text and the stale banner action for model runs.
- [x] 4.4 Add the new `PipelinePreviewI18nKey` entries to `src/constants/i18n.ts` and `src/locales/en.ts`.
- [x] 4.5 Component tests for the control's presence per kind and runner outcome, its labels, the popup's confirm and cancel paths, and the in-flight banner.

## 5. Result presentation

- [x] 5.1 Extend `PreviewGrid` for a model-run result: the leading `Model` column, `From model` columns, `Preview only` rows, and the evaluated grain key as an expand control with `aria-expanded` / `aria-controls`.
- [x] 5.2 Add `Preview/ModelResultPanel.tsx`: outcome line (alert when failed), stage track with text states, facts (attempts with corrective retries for `chat_completion`, usage with unit, latency, deployment), values table, schema violations, and Request sent / Reply received accordions with `CopyButton` and the `Cut at 64 KB` mark.
- [x] 5.3 Group-pipeline variant: no model columns in the grid, members sent / left out / partial in the panel, and the run bar chip `Group tried with model`.
- [x] 5.4 Show the panel in place of `PreviewOutputs` beside a model-run result, and add the model-run completion announcement to the existing live region.
- [x] 5.5 Render the runner refusal states in `PreviewError` with their actions (`Run again with model`, `Open Runtime`, `Open Properties`) and the unsupported-installation notice.
- [x] 5.6 Component tests for the grid marking, both panel variants (ok, `validate` after retry, `dial_call` with status, truncated request, non-JSON reply), and each refusal state.

## 6. Docs

- [x] 6.1 Add an entry to `docs/INFRA-CHANGELOG.md`: the model run needs the runner build with the dry run paired with the matching registry build, and an ingress in front of the console or the runner must allow a request of several minutes.

## 7. Quality checks

No browser verification task: the user chose unit and component tests only, because no local or dev runner serves the dry run yet.

- [ ] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and fix every failure.
