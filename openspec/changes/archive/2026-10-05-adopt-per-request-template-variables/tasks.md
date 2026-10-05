## 1. Contract types and API layer

- [x] 1.1 Add the `TemplateVariablesByRequest` type alias (`Record<string, TemplateVariable[]>`) beside `TemplateVariable` in `src/models/evaluation/test-suite.ts`, and verify `npm run typecheck` stays at zero.
- [x] 1.2 Change both template-variable getters in `src/server/eval/test-suites-api.ts` to return `Promise<TemplateVariablesByRequest | null>`, and verify `npm run typecheck` reports the expected break only at the single consumer, `TryOutRequestPreview.tsx`.
- [x] 1.3 Change `tryOutTestSuite` in `src/server/eval/test-suites-api.ts` and `src/app/[lang]/test-suites/actions.ts` to take `Record<string, Record<string, unknown>>` for the `variables` payload, keeping the `{ variables }` envelope, and verify `npm run typecheck` reports the expected break only at `TryOut.tsx`.

## 2. Per-request resolution in Try Out

- [x] 2.1 Hold the fetched variables as `TemplateVariablesByRequest` in `TryOutRequestPreview.tsx` (state, the `varsRes ?? {}` default), and verify the component renders a single-request suite unchanged via `npx vitest run src/components/TestSuites/RequestTemplate/tests/TryOutRequestPreview.spec.tsx`.
- [x] 2.2 Build each group in `groupedSlots` from `variablesByRequest[String(requestIndex)] ?? []` instead of the shared list, and verify a two-request fixture renders each request's own variables.
- [x] 2.3 Delete `mergeRequestBindings` from `src/components/TestSuites/utils/template-variables.ts` and its cases in `utils/tests/template-variables.spec.ts`, replacing the call site with `toRequestView(testSuite, requestIndex).inputBindings ?? []`, and verify no reference remains (`grep -rn mergeRequestBindings apps/ai-dial-admin/src`) and `npm run typecheck` is clean.

## 3. Suite-level per-request sections

- [x] 3.1 Remove the `testCaseId ? getRequestTurnCounts(...) : [1]` short-circuit in `TryOutRequestPreview.tsx` so turn counts always come from the suite, and verify a suite-level open of a chained suite resolves to the `requests` shape while a single-request suite stays `single`.
- [x] 3.2 Nest `requestBody` by request index in `TryOut.tsx` and thread the index into `Variables.tsx` so it writes into its own slice, and verify `Variables` writes `{ "1": { name: value } }` rather than a flat map.
- [x] 3.3 Drop the `!!testCaseId` clause from `renderRequestTabs` in `TryOut.tsx` (unsent branch only), and verify the request tab strip appears for a suite-level try-out of a chained suite and stays hidden for a single-request suite.
- [x] 3.4 Seed the editable body per request from each request's variable defaults in `TryOutRequestPreview.tsx` (replacing the flat `convertVariableIntoInitialRequest` call), and verify every request index is present in the initial body.

## 4. Empty-request state

- [x] 4.1 Add a `TestSuitesI18nKey` entry plus its `src/locales/en.ts` string for a request that declares no template variables, and render it in place of the empty configuration box, verifying the key is asserted (tests resolve `t()` to the key itself).

## 5. Tests

- [x] 5.1 Update the template-variable fixtures to the map shape in `src/server/eval/tests/test-suites-api.spec.ts`, `src/app/[lang]/test-suites/actions.spec.ts`, `src/components/TestSuites/RequestTemplate/tests/TryOut.spec.tsx` and `tests/TryOutRequestPreview.spec.tsx`, and verify `npm run typecheck:specs` is back to zero.
- [x] 5.2 Add `TryOutRequestPreview` cases for: request `#0` empty with a later request populated; a name bound differently by two requests; a name declared by a later request but bound only by request `#0` (must not inherit); and a missing key for a newly added request. Verify with `npx vitest run src/components/TestSuites/RequestTemplate/tests/TryOutRequestPreview.spec.tsx`.
- [x] 5.3 Add `TryOut` cases for the suite-level request tab strip and the index-keyed send payload, and verify with `npx vitest run src/components/TestSuites/RequestTemplate/tests/TryOut.spec.tsx`.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and verify all pass with both typecheck gates at zero.

No browser-verification task: the user was asked (the change has browser-observable scenarios) and chose unit and component coverage only.
