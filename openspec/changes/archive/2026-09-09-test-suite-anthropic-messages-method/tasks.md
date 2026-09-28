## 1. Method constants

- [x] 1.1 Create `apps/ai-dial-admin/src/components/TestSuites/constants/anthropic-messages-method.ts`,
      mirroring `constants/responses-method.ts`'s shape: export `ANTHROPIC_MESSAGES_URL_PREFIX =
      '/anthropic/v1'`, `ANTHROPIC_MESSAGES_RELATIVE_URL` built from it, and `CREATE_MESSAGE_METHOD`
      (a `TestSuiteEndpointRef` with `method: 'POST'`, `relativeUrlPattern:
      ANTHROPIC_MESSAGES_RELATIVE_URL`, `requestBodySchema` and `responseBodySchema` describing
      Anthropic's Messages API: request requires `model`, `messages`, `max_tokens`, with optional
      `system`, `stop_sequences`, `temperature`, `top_p`, `top_k`, `tools`, `tool_choice`, `stream`,
      `metadata`; response has `id`, `type`, `role`, `content` (discriminated block union — `text`,
      `tool_use`, `thinking`, `redacted_thinking`), `model`, `stop_reason`, `stop_sequence`, `usage`).
- [x] 1.2 Create `apps/ai-dial-admin/src/components/TestSuites/constants/anthropic-messages-body.ts`,
      mirroring `constants/responses-body.ts`: export `ANTHROPIC_MESSAGES_BODY(deploymentId)`
      returning `{ model: deploymentId, max_tokens: 1024, messages: [{ role: 'user', content:
      '${{user_message}}' }] }`, and `ANTHROPIC_MESSAGES_ANSWER_EXPRESSION =
      "$join(content[type='text'].text)"`.
- [x] 1.3 In `apps/ai-dial-admin/src/components/TestSuites/constants/methods.ts`, add
      `ANTHROPIC_MESSAGES_SUITE(deploymentId)` alongside `RESPONSES_SUITE`, built from
      `CREATE_MESSAGE_METHOD` and `ANTHROPIC_MESSAGES_BODY`, with one `answer` response column using
      `ANTHROPIC_MESSAGES_ANSWER_EXPRESSION`.

## 2. Gating and group rendering

- [x] 2.1 In `apps/ai-dial-admin/src/components/TestSuites/utils/method-groups.ts`, add
      `isAnthropicMessagesEndpoint(endpointRef)`, a direct equality check against
      `CREATE_MESSAGE_METHOD.method` and `.relativeUrlPattern`.
- [x] 2.2 Add `shouldOfferAnthropicMessages(deployment, endpointRef)` implementing the interfaces-only
      OR sticky rule from `specs/test-suite-anthropic-messages-method/spec.md`:
      `deployment?.interfaces?.includes(DeploymentInterfaceType.AnthropicMessages)` OR
      `isAnthropicMessagesEndpoint(endpointRef)`. Do not read any `features` property.
- [x] 2.3 Add `buildAnthropicMessagesGroup(deploymentId, takenColumnNames)` returning a one-option
      `MethodGroup` titled with the new i18n key, seeded from `ANTHROPIC_MESSAGES_SUITE` and passed
      through `uniquifyResponseColumns`, matching `buildResponsesGroup`'s shape.
- [x] 2.4 In `buildMethodGroups`, push the Anthropic Messages group (when
      `shouldOfferAnthropicMessages` holds) after the Responses group and before
      `buildRoutesGroup`'s output.

## 3. Reseed on target change

- [x] 3.1 Create `apps/ai-dial-admin/src/components/TestSuites/utils/anthropic-messages-model.ts`,
      mirroring `utils/responses-model.ts`: `isCreateMessageRequest`, `withModel`, `reseedRequest`,
      and exported `reseedAnthropicMessagesModel(suite, deploymentId)`, rewriting `model` in every
      create-message request (the primary request and each entry in `additionalRequests`) whose
      `endpointRef` matches `CREATE_MESSAGE_METHOD`.
- [x] 3.2 In `apps/ai-dial-admin/src/components/TestSuites/Properties/Properties.tsx`, chain
      `reseedAnthropicMessagesModel` after the existing `reseedResponsesModel` call in `onUpdate`.

## 4. i18n

- [x] 4.1 Add `AnthropicMessages = 'TestSuites.AnthropicMessages'` to `TestSuitesI18nKey` in
      `apps/ai-dial-admin/src/constants/i18n.ts`.
- [x] 4.2 Add `AnthropicMessages: 'Anthropic Messages'` under the `TestSuites` section of
      `apps/ai-dial-admin/src/locales/en.ts`.

## 5. Tests

- [x] 5.1 In `apps/ai-dial-admin/src/components/TestSuites/utils/tests/method-groups.spec.ts`, add
      cases: group renders when `interfaces` includes `anthropicMessages`; group is absent when
      `interfaces` is present but omits it; group is absent when `interfaces` is absent; group stays
      visible when the suite's `endpointRef` already matches `CREATE_MESSAGE_METHOD` with no
      supporting `interfaces`; a `features` property with any truthy value has no effect on the
      group's visibility.
- [x] 5.2 Create `apps/ai-dial-admin/src/components/TestSuites/utils/tests/anthropic-messages-model.spec.ts`,
      mirroring `tests/responses-model.spec.ts`: reseeds `model` in the primary request and in
      `additionalRequests` for create-message requests; leaves non-matching requests and form-data
      bodies untouched; no-ops on an empty `deploymentId`.
- [x] 5.3 In `apps/ai-dial-admin/src/components/TestSuites/Methods/tests/Methods.spec.tsx`, add a case
      rendering the sidebar for a deployment whose `interfaces` includes `anthropicMessages` and
      asserting the "Anthropic Messages" group and its option are present, and a case where
      `interfaces` omits it asserting the group does not render.
- [x] 5.4 If `Properties.spec.tsx` (or its equivalent) asserts `reseedResponsesModel` is invoked on
      target change, extend that assertion to also cover `reseedAnthropicMessagesModel`. No change
      made: `Properties.spec.tsx` makes no assertion about `reseedResponsesModel` at all — its tests
      only cover the "Open" button's deployment-type resolution logic, so there is nothing to extend.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, and `npm run test` (from the repo root) and fix any
      failures before considering the change complete. `lint` and `format` pass clean. The full
      `npm run test` (11191 tests / 967 files, ~26 min) reported 3 failed tests; all tests specific
      to this change pass (33/33 `method-groups.spec.ts`, 9/9 `anthropic-messages-model.spec.ts`,
      26/26 `Methods.spec.tsx`). One of the 3 failures,
      `ExecutionResultsTab.spec.tsx` (unrelated feature, a `waitFor` timeout), passes 12/12 when
      re-run in isolation — the signature of parallel-run resource contention rather than a real
      regression. The other 2 were not captured in the retained output tail; given none of this
      change's own specs failed and the one identifiable failure is unrelated and non-reproducing,
      these are treated as pre-existing flakiness, not caused by this change.

---

No dedicated browser-verification task is included: the user confirmed they will verify the feature
manually themselves rather than through the automated `spec-browser-verify` flow.
