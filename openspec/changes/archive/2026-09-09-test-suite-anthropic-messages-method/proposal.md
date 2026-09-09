## Why

Test Suites' method sidebar already lets users configure a request against DIAL's Responses API,
gated by deployment support signals. Deployments that support Anthropic's Messages API
(`interfaces` containing `anthropicMessages`) have no equivalent method group, so there is no way
to build a test suite against `/anthropic/v1/messages` without falling back to the generic,
manually-typed "Other" (routes) group.

## What Changes

- Add a "Anthropic Messages" method group to the Test Suites sidebar, structurally mirroring the
  existing Responses group: a method descriptor for DIAL's `/anthropic/v1/messages` passthrough,
  a seeded request body (`model`, `messages`, required `max_tokens`), an `answer` response column
  with a JSONata expression reaching Anthropic's `content` block array, and reseeding of `model`
  when the suite's target deployment changes (the endpoint carries no deployment segment in its
  URL, so `model` is the only deployment selector — same reason `reseedResponsesModel` exists for
  Responses).
- Gate the new group's visibility **only** by `deployment.interfaces` containing
  `anthropicMessages`, plus sticky visibility for a suite whose already-selected method is the new
  Anthropic Messages operation. Unlike Responses (gated by a 3-way OR that also checks a
  `features.responses_api` flag), there is no features-flag equivalent for this interface — Core
  does not report one, so `DeploymentFeatures` is not extended.
- Add one new i18n key for the group heading.

## Capabilities

### New Capabilities

- `test-suite-anthropic-messages-method`: defines the Anthropic Messages support signal, the
  group-rendering rule (interfaces-only OR sticky-selected, no features-flag equivalent), the
  DIAL-prefix requirement on the method's URL, and the seed/reseed behavior for the create-message
  operation.

### Modified Capabilities

_None._ This does not change the requirements of `test-suite-responses-api-methods` or any other
existing capability — the two groups are built and gated independently in the same
`buildMethodGroups` function, but neither's rules affect the other's requirements.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/utils/method-groups.ts` — new gating predicate and
  group builder, wired into `buildMethodGroups`.
- `apps/ai-dial-admin/src/components/TestSuites/constants/` — two new files
  (`anthropic-messages-method.ts`, `anthropic-messages-body.ts`) plus one addition to
  `methods.ts` (`ANTHROPIC_MESSAGES_SUITE`).
- `apps/ai-dial-admin/src/components/TestSuites/utils/anthropic-messages-model.ts` — new reseed
  helper, mirroring `responses-model.ts`.
- `apps/ai-dial-admin/src/components/TestSuites/Properties/Properties.tsx` — chains the new reseed
  helper into the existing `onUpdate` target-change handler.
- `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` — one new
  `TestSuitesI18nKey` member.
- No changes to `Deployment`, `DeploymentFeatures`, `DeploymentInterfaceType` (the
  `anthropicMessages` enum member already exists), `TestSuite`/`TestSuiteEndpointRef`, or the
  rendering components (`Methods.tsx`, `MethodInfo.tsx`, `MethodItem.tsx`), which are already
  generic over whatever `buildMethodGroups` returns.
