## 1. Model and request

- [x] 1.1 Add `input_token_budget?: number` to `PipelineAdvanced` in `apps/ai-dial-admin/src/models/analytics/pipeline.ts`
- [x] 1.2 In `buildPipelineDto` (`apps/ai-dial-admin/src/utils/analytics/pipeline-dto.ts`), delete `advanced.input_token_budget` when the trigger kind is not `group`, before `dropEmptyMembers`, so an `advanced` block emptied by the strip is dropped

## 2. Form

- [x] 2.1 Add `isInputTokenBudgetValid` (empty, or a whole number ≥ 0) to `useEnrichForm` (`apps/ai-dial-admin/src/components/Analytics/Pipelines/Enrich/use-enrich-form.ts`), counted in `hasFieldErrors` only while the trigger kind is `group`
- [x] 2.2 Add the input token budget `Input` to the Advanced block in `EnrichSection.tsx`, after the sample fraction, rendered only for a `group` trigger: `type="number"`, `min={0}`, `step={1}`, caption, error and `invalid` from 2.1
- [x] 2.3 Add `InputTokenBudget`, `InputTokenBudgetCaption`, `InputTokenBudgetInvalid` to `AnalyticsPipelinesI18nKey` (`apps/ai-dial-admin/src/constants/i18n.ts`) and their English text to `apps/ai-dial-admin/src/locales/en.ts`

## 3. Tests

- [x] 3.1 `utils/analytics/tests/pipeline-dto.spec.ts`: a `group` pipeline sends the budget, `0` included; a `schedule` or unset trigger drops it; `advanced` holding only the budget disappears under `schedule`
- [x] 3.2 `Enrich/tests/use-enrich-form.spec.ts`: validity for empty, `0`, positive, negative and fractional values; an invalid value blocks the save only under `group`
- [x] 3.3 `Pipelines/tests/PipelineDetailView.spec.tsx`: the field is presented for `group` and absent for `schedule`; an invalid value shows the error key

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill against this change's scenarios on the local stack with auth disabled, and resolve every `fail` verdict before the change is complete

## 5. Quality gates

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, all at zero
