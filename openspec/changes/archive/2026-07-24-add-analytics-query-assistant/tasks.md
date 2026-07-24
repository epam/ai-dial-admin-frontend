# Tasks — Analytics Query Assistant (AI view)

> No browser-verification task is included (the user opted out). Unit tests are covered by task 9.

## 1. Models & enum

- [x] Create `src/models/analytics/query-assistant.ts` with `QueryAssistantRole` enum,
      `QueryAssistantMessage`, `QueryAssistantCustomContent`, `QueryAssistantStage`,
      `ChatCompletionChoice`, and `ChatCompletionResponse` interfaces (per design §8).
- [x] Add `Ai = 'ai'` to the `QueryBuilderView` enum in `src/models/analytics/query-builder.ts`.

## 2. Feature flag & gating

- [x] Add `queryAssistantEnabled: boolean` to `FeatureFlags` (`src/models/feature-flags.ts`).
- [x] Initialize it in `app/[lang]/layout.tsx`:
      `isValueTruthy(process.env.ANALYTICS_ENABLED) && !!process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT`.

## 3. Transport client

- [x] Create `src/server/core/query-assistant-api.ts` — `QueryAssistantApi extends CoreApi` with
      `chatCompletion(messages, deployment, token)` posting to
      `/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`
      with `{ messages, stream: false }` via `postAction` (returns `ServerActionResponse<ChatCompletionResponse>`).
- [x] Wire `queryAssistantApi = new QueryAssistantApi({ host: process.env.DIAL_CORE_API_URL })` in
      `src/app/api/api.ts` (next to the other Core-direct clients).

## 4. Server action

- [x] Add `generateQuery(messages)` to `src/app/[lang]/query-builder/actions.ts` — read
      `DIAL_QUERY_ASSISTANT_DEPLOYMENT` server-side, return a failure `ServerActionResponse` when unset,
      otherwise delegate to `queryAssistantApi.chatCompletion(...)` with `await token()`.

## 5. SQL extraction util

- [x] Create `src/components/Analytics/QueryBuilder/utils/extract-sql.ts` exporting pure
      `extractSql(content: string): string | null` (last `sql`-tagged fenced block → untagged fenced
      block fallback → `null`), per design §5.

## 6. Constants & i18n

- [x] Add `src/constants/analytics/query-assistant.ts` with `QUERY_ASSISTANT_SUGGESTIONS` (suggested
      prompt entries as i18n keys).
- [x] Add AI-view i18n keys to `QueryBuilderI18nKey` (`src/constants/i18n.ts`) and their English text
      in `src/locales/en.ts` (view label, panel heading, description, textarea placeholder, Generate,
      Apply, run hint, "not configured"/failure messages, suggested-prompt labels). Reuse shared keys
      (Copy, etc.) where they exist.

## 7. AI panel component

- [x] Create `src/components/Analytics/QueryBuilder/Ai/AiPanel.tsx` — `DialTextarea` + suggested
      chips (`DialButton`) + `DialPrimaryButton` Generate; calls `generateQuery`, appends assistant
      message to a local `messages` array, runs `extractSql`; renders the proposed SQL read-only with a
      `CopyButton` and an Apply button (or the raw explanation with no Apply when no SQL); shows the
      "click Run" hint after Apply; surfaces failures via `useNotification()`. Props include
      `onApply(sql: string)`.

## 8. Wire the AI view into the rail

- [x] In `src/components/Analytics/QueryBuilder/QueryBuilder.tsx`: read
      `featureFlags.queryAssistantEnabled` via `useAppContext()`; conditionally append the AI option
      (with spark icon) to `viewOptions`; render `AiPanel` when `view === QueryBuilderView.Ai`.
- [x] Add `aiAppliedSql` state; pass `onApply` to `AiPanel`; branch `onRun` (AI view + applied SQL →
      `QueryRequestKind.Sql` via `executeSqlQuery`) and `runDisabled` (`isAiView && !aiAppliedSql`);
      set the Copy value for the AI view to the applied/proposed SQL.

## 9. Tests

- [x] Unit-test `extractSql` (`utils/tests/extract-sql.spec.ts`): sql block, block among prose,
      multiple blocks (last wins), untagged fallback, no block → null, empty input.
- [x] Component test `AiPanel` (`Ai/tests/AiPanel.spec.tsx`): chip fills textarea; Generate disabled
      when empty/in-flight; success renders proposed SQL + Apply; reply without SQL shows explanation
      and no Apply; failure shows notification; Apply calls `onApply`.
- [x] Extend `QueryBuilder.spec.tsx`: AI option present only when `queryAssistantEnabled` (mock
      `useAppContext`); Run disabled until Apply; Apply enables Run and routes to `executeSqlQuery`.
- [x] Add a `generateQuery` action test and a `QueryAssistantApi` test following
      `src/server/analytics/tests/*` patterns (unset-deployment failure; success maps the response).

## 10. Quality checks

- [x] Run `npm run lint`, `npm run format`, and `npm run test` (from `apps/ai-dial-admin/`) and fix any
      failures. — lint clean on changed files; prettier clean; full suite 6227 passed / 5 skipped.
