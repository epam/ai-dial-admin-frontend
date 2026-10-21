## 1. Resolve the scope contingency

- [x] 1.1 Determine whether the Evaluation Framework expands `${{variable}}` placeholders inside
      `requestTemplate.urlTemplate` or only inside the request body (design.md — Open Questions), by
      configuring a suite whose final path carries a placeholder and inspecting the resolved request
      in Try Out. Record the answer in design.md. If placeholders are body-only, strike the three
      response-scoped operations from this change: drop tasks 3.3, 3.4, 5.3, 6.3 and 7.3, and update
      the "The group lists the four Responses API operations", "The response-scoped operations are
      configured as chainable requests", and path-validation requirements in
      `specs/test-suite-responses-api-methods/spec.md` to cover `POST /responses` only.
- [x] 1.2 Confirm the `POST /openai/v1/responses` 200 body and the `answer` expression that reaches
      the textual output. Resolved from the complete OpenAPI document supplied by the requester and
      corroborated by this repo's own `src/utils/analytics/hop-inspector/responses.ts`, which parses
      measured DIAL Responses traffic: there is no top-level `output_text`, and the text lives in the
      `output_text` content parts of the `message` items of `output`. Recorded in design.md — D4.

## 2. Interface vocabulary and deployment model

- [x] 2.1 Extend `DeploymentInterfaceType` in `src/models/dial/interfaces.ts` to all eight DIAL wire
      values (`chat`, `embedding`, `mcp`, `custom_ui`, `openaiChatCompletions`, `openaiResponses`,
      `openaiEmbeddings`, `anthropicMessages`) and verify `npx tsc --noEmit` reports no error other
      than the expected one in `getInterfaceTypeLabel`.
- [x] 2.2 Add `default: return type;` to `getInterfaceTypeLabel` in
      `src/components/BaseControls/InterfacesField/InterfacesField.tsx` and verify the existing
      `InterfacesField.spec.tsx` still passes and `npx tsc --noEmit` is clean.
- [x] 2.3 Add `interfaces?: DeploymentInterfaceType[]` to `Deployment` in
      `src/models/evaluation/deployment.ts` and verify `npx tsc --noEmit` is clean.
- [x] 2.4 Replace the raw `'mcp'` interface-filter literal in
      `src/components/TestSuites/Modals/Create/Target.tsx` with `DeploymentInterfaceType.Mcp` and
      verify the existing Target tests still pass.

## 3. Responses API method constants

- [x] 3.1 Add `src/components/TestSuites/constants/responses-method.ts` holding the four operation
      descriptors — HTTP method, `summary` (the `/openai/v1/...` display form), and the regex-form
      `relativeUrlPattern`s from design.md — D3 — and verify `npx tsc --noEmit` is clean.
- [x] 3.2 Add the create operation's `requestBodySchema` and `responseBodySchema` to that file, mapped
      from `CreateResponseRequest` / `Response` per design.md — D4, plus its `Content-Type` and
      `X-DIAL-CACHE-POLICY` parameters and no `api-version`. Verify by opening the method's schema and
      parameter views and seeing both tables populated.
- [x] 3.3 Add `src/components/TestSuites/constants/responses-body.ts` with the create operation's
      default request body (`model` placeholder plus `input` bound to `user_message`) and verify
      `npx tsc --noEmit` is clean.
- [x] 3.4 Add `RESPONSES_SUITE` (a function of the target deployment id, alongside the existing
      `CHAT_COMPLETION_SUITE` and `DEFAULT_SUITE`) to `src/components/TestSuites/constants/methods.ts`,
      seeding the body from task 3.3 and the `answer` response column, and verify `npx tsc --noEmit`
      is clean.

## 4. Grouping and model-reseed helpers

- [x] 4.1 Add `src/components/TestSuites/utils/method-groups.ts` with
      `buildMethodGroups({ deployment, endpointRef, takenColumnNames })` returning `MethodGroup[]`
      (heading i18n key plus options carrying a `TestSuiteEndpointRef` and a `Partial<TestSuite>`
      seed), types in an adjacent `models.ts`, per design.md — D2. Verify `npx tsc --noEmit` is clean.
- [x] 4.2 Implement the gating rule in that helper — the Responses group is included when the
      deployment's `interfaces` contains `openaiResponses` or when `endpointRef` already selects a
      Responses operation — and the group order (chat interface, responses, routes). Verify with task
      6.1's unit tests.
- [x] 4.3 Add the `model` reseed helper beside it (rewrite `requestTemplate.body.model` for a suite
      whose method is `POST /responses`, merging rather than replacing the body, no-op for every other
      method) and verify with task 6.2's unit tests.
- [x] 4.4 Add the `TestSuites.Responses` group-heading key to `src/constants/i18n.ts` and its English
      string to `src/locales/en.ts`, and verify `npm run validate:agent-docs` and `npx tsc --noEmit`
      are clean.

## 5. Wire the groups into method selection

- [x] 5.1 Replace the index arithmetic in `src/components/TestSuites/Methods/Methods.tsx` with a flat
      list derived from `buildMethodGroups` — `methodInfo`, `onMethodClick`, and the selection-restore
      `findIndex` all read that list, with no `=== 0` and no `- 1` — and verify the existing
      `Methods/tests/Methods.spec.tsx` still passes.
- [x] 5.2 Render one heading and item list per group, so the Responses group appears between "Chat
      interface" and "Other". Verify by selecting a target that reports `openaiResponses` and seeing
      the three headings in order.
- [x] 5.3 Verify the seeded final path for each response-scoped operation validates against its
      pattern, and that substituting a concrete response id also validates, by selecting each
      operation and editing the final path in the UI.
- [x] 5.4 Rewrite the target's `model` on target change in
      `src/components/TestSuites/Properties/Properties.tsx` (`onUpdate`) using the task 4.3 helper, and
      verify by switching a `POST /responses` suite's target and seeing `model` follow.

## 6. Accessibility of the method list

- [x] 6.1 Convert `src/components/TestSuites/Methods/MethodItem.tsx` from a clickable `<div>` to a
      `<button type="button">` carrying `aria-current` for the active state, per design.md — D6, and
      verify the item is reachable by Tab and selectable by Enter/Space.
- [x] 6.2 Wrap each group in `role="group"` with `aria-labelledby` referencing its heading via
      `useId()` in `Methods.tsx`, and verify each group is queryable by role and accessible name.

## 7. Unit tests

- [x] 7.1 Add `src/components/TestSuites/utils/tests/method-groups.spec.ts` covering every gating case
      in the spec — `interfaces` absent, present without `openaiResponses`, present with it, and the
      saved-selection fallback — plus group order and the seeded configuration for the create
      operation (body `model` from the deployment id, `input` binding, `answer` column, and its
      uniquification against taken column names). Verify with
      `npx vitest run src/components/TestSuites/utils/tests/method-groups.spec.ts`.
- [x] 7.2 Add unit tests for the `model` reseed helper — target change rewrites `model`, hand-added
      body fields survive, and suites on other methods are untouched. Verify with the same
      `npx vitest run` on that spec file.
- [x] 7.3 Extend `src/components/TestSuites/Methods/tests/Methods.spec.tsx` for the rendered groups —
      the Responses heading present or absent per the gating cases, the four operations listed, the
      saved method shown active via `aria-current`, and each group queryable by role and name. Verify
      with `npx vitest run src/components/TestSuites/Methods/tests/Methods.spec.tsx`.
- [x] 7.4 Add a test that seeding the response-scoped operations produces an empty body, no response
      columns, and a `response_id` placeholder in the final path. Verify with the task 7.1 spec run.

## 8. Browser verification

- [x] 8.1 Run the `spec-browser-verify` skill against this change and resolve every `fail` verdict
      before the change is considered complete.

## 9. Quality checks

- [x] 9.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and verify all
      three pass with no new failures.

## Notes recorded during implementation

- **`npx tsc --noEmit` is not a usable gate in this repo.** Neither `tsconfig.json` (stale generated
  Next.js types), `tsconfig.app.json` nor `tsconfig.spec.json` is clean on `development`: the app
  config reports 195 pre-existing errors, almost all in spec files. Type verification was done by
  diffing the error set against a baseline captured before the change — no new file gained an error
  and the count stayed at 195 — with `npm run lint` and the test suite as the real gates.
- **Tasks 5.2, 5.3 and 5.4** were verified by unit and component tests rather than by driving the UI
  (group order and headings in `Methods.spec.tsx`, pattern acceptance/rejection in
  `method-groups.spec.ts`, model reseeding in `responses-model.spec.ts`). Their original wording
  described a manual UI check, which `openspec/config.yaml` does not allow as a task.
- **`MethodItem`'s accessible name was missing a separator.** The method badge and the URL are
  adjacent elements, so the button's name computed as `GET/responses` rather than `GET /responses`.
  Fixed in the component (an explicit space) rather than worked around in the test.
- **The `model` reseed also covers chained requests.** `additionalRequests` can hold a
  `POST /responses` request, which would go stale in exactly the same way; `reseedResponsesModel`
  rewrites those too. Covered by a test.
- **A NUL byte slipped into `Methods.tsx`** during a scripted edit, which made git classify the file
  as binary (`Bin 6664 -> 7170 bytes` instead of a text diff) and left `takenColumnNames.join('\0')`
  in the memo dependency. Caught while reviewing the diffstat, not by lint, Prettier or the tests —
  all three passed with the NUL in place. Replaced with `join(',')` and every changed `.ts`/`.tsx`
  file re-scanned for NUL bytes; the gates were re-run afterwards.
- **Tasks 1.2 and 8.1 were open until late** — both needed a running local stack with a deployment
  reporting Responses support. 8.1 was closed by two browser-verification runs; 1.2 by the complete
  OpenAPI document (see the entry below), not by a live call.
- **The gating signal changed after live verification.** The first implementation gated only on
  `interfaces`, and the group did not appear for `deepseek-ocr-2` in the running app. The captured
  single-deployment response showed why: DIAL Core omits `interfaces` for deployments fetched through
  its `/openai/...` API, so the field never arrived. Gating now also accepts Core's
  `features.responses_api` flag, which is what such deployments actually report. Spec, design and
  proposal updated; `DeploymentFeatures` added to the eval deployment model, with unit and component
  tests for the true / false / absent cases and for the observed wire shape.
- **The `/openai/v1` prefix was removed from the displayed URLs, then reinstated everywhere.** It
  was first stripped from the stored patterns (the original request), then from the displayed labels
  too. The requester then reversed that decision with a reason that had not been on the table: the
  prefix is what lets the backend identify a DIAL Responses API request, and without it a deployment
  exposing its own unrelated `/responses` route would be routed to the wrong host. All three forms —
  stored pattern, seeded path, displayed label — now carry it, built from a single
  `RESPONSES_URL_PREFIX` constant. See design.md — D3a.
- **Reinstating the prefix tightened the gate, which is the point.** `isResponsesEndpoint` derives
  its pattern set from the descriptors, so a bare `/responses` is no longer recognised as a Responses
  API method: a deployment's own `/responses` route stays in the routes group instead of summoning
  the Responses group. Two tests cover it — one on the gating helper, one on the URL pattern.
- **The prefixed patterns were re-checked against the path validator.**
  `/openai/v1/responses` still contains no regex meta symbol, so the create operation's path is
  unvalidated exactly as before; the two parameterised patterns accept the `${{response_id}}`
  placeholder and a concrete id, and reject an unprefixed path.
- **Browser verification found one real defect: stale response columns.** The response-scoped seeds
  omitted `responseColumns`, and a seed is merged over the previous configuration, so switching from
  `POST /chat/completions` (or `POST /responses`) to `DELETE /responses/{response_id}` left the
  previous method's `answer` column — with an extraction expression the new response cannot satisfy —
  in place. `RESPONSE_ITEM_SUITE` now sets `responseColumns: []` explicitly. The spec requirement was
  tightened to say the clearing is explicit rather than by omission.
- **Fixed alongside it: the final-path validation error was sticky.** `MethodInfo` stored
  `finalPathError` in state and only recomputed it inside the field's `onChange`, so an error typed
  under one method survived a switch to another — the field was correctly reseeded but the alert and
  the disabled Save remained until a full page reload. The error is now derived with `useMemo` from
  the pattern and the current path, with the validation-context dispatch moved into an effect. This
  is pre-existing behaviour reachable from route-derived methods too, but it directly undermines the
  "Request paths remain editable and validatable" requirement this change adds, so it was fixed here
  and covered by a new `MethodInfo.spec.tsx`.
- **Task 1.2 resolved against the assumption, not in its favour.** The requester supplied the
  complete Responses OpenAPI document, whose `Response` object has **no `output_text`** — the text is
  in the `output_text` content parts of the `message` items of the required `output` array. The
  earlier `output_text` expression would have extracted nothing from a real response. It is now
  `$join(output[type='message'].content[type='output_text'].text)`, and the request and response
  schemas were rewritten from the document's `CreateResponseRequest` and `Response`.
- **The shape was corroborated inside this repo.** `src/utils/analytics/hop-inspector/responses.ts`
  already parses DIAL Responses traffic and walks exactly this path — filtering `message` items, then
  `output_text` parts, then joining their `text` with `''` — and its comments cite counts measured
  over 199 real hops. So the document and observed DIAL traffic agree, which is stronger evidence
  than the single live call task 1.2 originally asked for.
- **The expression was executed, not just written.** Evaluated with the repo's own `jsonata` against
  five response shapes: a reasoning-then-message response returns the text, multiple text parts
  concatenate, and a refusal-only, tool-call-only, or empty `output` each yields `undefined` rather
  than throwing.
- **Three deliberate deviations from the supplied document** are recorded in the constants file's
  header: `model` is a plain string described as a DIAL deployment id rather than the document's enum
  of OpenAI model names; `model` and `input` are marked required although the document marks neither;
  and the deep unions (`ResponseInputItem` 33 variants, `Tool` 16, `ResponseOutputItem` 28) are
  represented by their discriminator plus the variants a suite exercises rather than inlined whole,
  because `convertSchemaToTable` renders only top-level properties.
