## Context

Test Suites' method sidebar builds its groups in `buildMethodGroups`
(`apps/ai-dial-admin/src/components/TestSuites/utils/method-groups.ts`) from a single-deployment
fetch's `interfaces` array and `features` object. The existing "Responses" group is gated by a
3-way OR: `features.responses_api === true`, `interfaces` containing `openaiResponses`, or the
suite already having a Responses method selected (sticky visibility). That OR exists because Core
reports Responses support two different ways depending on how the deployment was fetched —
`features.responses_api` is what actually arrives for models fetched through Core's `/openai/...`
API, which does not populate `interfaces` for them.

Anthropic's Messages API support has no such split: it is reported only through `interfaces`
containing `anthropicMessages`. There is no Core feature flag equivalent to `responses_api` for
this interface, so `DeploymentFeatures` is not extended and the new group's gating is a 2-way OR
(interfaces + sticky) rather than Responses' 3-way OR.

## Goals / Non-Goals

**Goals:**

- Let a user configure a Test Suites request against DIAL's `/anthropic/v1/messages` passthrough,
  with the same seed/reseed/answer-extraction UX Responses already provides.
- Gate the new group's visibility strictly by `deployment.interfaces` containing
  `anthropicMessages`, plus sticky visibility for a suite whose selected method is already the
  Anthropic create-message operation — no other signal.
- Keep the new group and the existing Responses group independent: neither's gating predicate nor
  builder reads the other's constants or state.

**Non-Goals:**

- No `DeploymentFeatures` change. Core does not report a feature-flag equivalent for
  `anthropicMessages`, so there is nothing to add there, and no code path should be written as if
  one might arrive later.
- No retrieve/delete/cancel operations. Anthropic's Messages API is create-only from DIAL's
  perspective — unlike Responses' four operations — so the new group has exactly one method
  option.
- No new frontend response-parsing code. Response column extraction is already generic: the
  Evaluation Framework backend evaluates each column's JSONata `expression` against the real
  response body and reports `extractedColumns`/`extractionWarnings`. This change only needs to
  seed the correct expression.
- No changes to `Methods.tsx`, `MethodInfo.tsx`, `MethodItem.tsx`, or any other rendering
  component — they are already generic over whatever `buildMethodGroups` returns.

## Decisions

- **Gating predicate is interfaces-only, by explicit design.** `shouldOfferAnthropicMessages`
  checks `deployment?.interfaces?.includes(DeploymentInterfaceType.AnthropicMessages)` OR the
  suite's current `endpointRef` already matching the Anthropic create-message method. It
  deliberately has no third branch reading `features`, asymmetric with `shouldOfferResponses`'s
  3-way OR. This mirrors the real asymmetry in what Core reports for the two interfaces, rather
  than adding a speculative flag check that would always evaluate false.

- **One method option, not a `Set` of URL patterns.** `isResponsesEndpoint` uses a `Set` because
  Responses has four distinct method/URL pairs to match against. Anthropic Messages has one, so
  `isAnthropicMessagesEndpoint` is a direct equality check against `CREATE_MESSAGE_METHOD.method`
  and `.relativeUrlPattern` — introducing a `Set` for a single member would be an unnecessary
  abstraction.

- **`/anthropic/v1` URL prefix, mirroring `/openai/v1` for Responses.** The prefix disambiguates
  DIAL's own Anthropic Messages passthrough from a deployment's arbitrary, unrelated `/messages`
  route — the same reasoning `test-suite-responses-api-methods` already documents for
  `/openai/v1`. The prefix is confirmed as DIAL's actual convention by existing Analytics
  hop-inspector code that parses `/anthropic/v1/messages` as a distinct dialect
  (`utils/analytics/hop-inspector/tests/dialect.spec.ts`).

- **Reseed-on-target-change via a second, independent helper.** `anthropic-messages-model.ts`
  exports `reseedAnthropicMessagesModel`, structured identically to `reseedResponsesModel`
  (same `isCreateXRequest` / `withModel` / `reseedRequest` shape) rather than generalizing the two
  into one parameterized helper. Both existing methods lack a shared abstraction point beyond
  "match this method, then rewrite `model` in this template," and forcing one now would couple two
  independently-evolving API integrations for a two-line saving.

- **Group insertion point in `buildMethodGroups`.** The Anthropic Messages group is appended right
  after the Responses group (when offered) and before the routes group, so sidebar order stays
  Chat interface → Responses → Anthropic Messages → Other. This keeps DIAL-native passthrough
  groups adjacent and ahead of the catch-all routes group, consistent with how Responses was
  inserted relative to Chat interface and routes.

## Risks / Trade-offs

- **Two near-identical reseed helpers.** `responses-model.ts` and `anthropic-messages-model.ts`
  duplicate structure. Accepted per the decision above — the duplication is small, and a shared
  abstraction would need to be revisited anyway the moment a third API's reseed rule differs in
  any way (e.g. a method that also needs a header rewritten).
- **Interfaces-only gating means a deployment whose Anthropic support is real but unreported by
  Core (e.g. a future fetch path that omits `interfaces` the way `/openai/...` omits it for
  Responses) will not show the group.** This mirrors a real limitation already accepted for
  Responses' `interfaces`-only branch; the sticky-selection fallback is the same mitigation Test
  Suites already relies on in that case, so no new mitigation is introduced here.
