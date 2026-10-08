## 1. Not-running warning on the Runtime tab (done in the working tree)

- [x] 1.1 Move the not-running notification from `Common/PipelineDetailFrame.tsx` into `PipelineRuntime.tsx` as a Warning (prop `isNotTracked`), with the softer `RuntimeNotTrackedMessage` copy in `locales/en.ts`
- [x] 1.2 Update `tests/PipelineRuntime.spec.tsx` and `tests/PipelineDetailRuntime.spec.tsx` for the new placement

## 2. Message wrapping

- [x] 2.1 Reproduce the truncation with a long unbroken message and record the cause in this change's design
- [x] 2.2 Wrap the message in `Common/PipelineRuntimeAlerts.tsx`, the runtime-unavailable notification and the `last_error` row in `PipelineRuntime.tsx`
- [x] 2.3 Add specs asserting the wrapping on each of the three

## 3. Runtime tab vocabulary and kind-specific groups

- [x] 3.1 Add a pure util that maps a pipeline to aggregate, SQL or model-calling, and a util that validates an epoch-millisecond version (omitting non-positive or non-finite values), each with specs
- [x] 3.2 In `PipelineRuntime.tsx`, state Data up to for aggregate and SQL and keep Behind its input for model-calling; withdraw the State card for aggregate and SQL
- [x] 3.3 Rename Backlog / Caught up to Status / Up to date / Catching up, and Last scan to Last run, in `locales/en.ts` and `constants/i18n.ts`
- [x] 3.4 Present one Last run row, preferring the runner's value
- [x] 3.5 Make the cursor and materialized-through identities that remain wrap in full and carry a copy button
- [x] 3.6 Update `tests/PipelineRuntime.spec.tsx` for the three kinds, Data up to, one Last run and the never-run edge, and `tests/PipelineDetailView.spec.tsx` for the wrapped last error

## 4. Failures grid stage descriptions

- [x] 4.1 Add a record of stage descriptions keyed by `DlqStage` beside `DLQ_STAGE_COLOR` in `constants/analytics/pipeline-dlq.ts`, with the i18n keys and English copy
- [x] 4.2 Show the description as a tooltip on the stage cell in `Failures/FailuresGrid.tsx` and in full in `Failures/FailureRowDetail.tsx`
- [x] 4.3 Add specs for the grid cell and the row detail

## 5. One-field schedule control

- [x] 5.1 Reuse `CRON_PRESETS` for the menu items; no new util
- [x] 5.2 Rewrite `Common/CronField.tsx` as an input and a Presets menu button labelled Presets; drop the Custom mode and the second input; relabel to Schedule
- [x] 5.3 Update the specs under `Common/tests` and the create and edit specs that drive the old Select

## 6. Quality gate

- [x] 6.1 Run lint, format, `typecheck`, `typecheck:specs` and the full test suite, and fix what they report
