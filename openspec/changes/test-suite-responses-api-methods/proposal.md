## Why

A test suite can only invoke a deployment through `/chat/completions` today: `Methods.tsx` hardcodes
`CHAT_COMPLETION_METHOD` as the sole entry of its "Chat interface" group, and every other selectable
method comes from the deployment's own `routes`. Deployments that serve the OpenAI Responses API have
no way to be exercised from Test Suites at all.

The Evaluation Framework backend now reports per-deployment capability on its two single-deployment
endpoints — an `interfaces` string array on `DeploymentInfoDto`, plus DIAL Core's `features` flag map
passed through verbatim. Together those are the signal needed to offer Responses API methods only
where they will work. `features.responses_api` is the one that arrives for models, since Core does not
report `interfaces` for deployments fetched through its `/openai/...` API.

## What Changes

- **New "Responses" method group** in the Test Suites method sidebar, rendered between the existing
  "Chat interface" and "Other" groups. It lists the four DIAL Responses API operations:
  `POST /openai/v1/responses` (create), `GET /openai/v1/responses/{response_id}`,
  `DELETE /openai/v1/responses/{response_id}`, and `POST /openai/v1/responses/{response_id}/cancel`.
  The `/openai/v1` prefix is kept rather than stripped, because it is what lets the backend tell a
  DIAL Responses API request apart from a deployment's own unrelated `/responses` route.
- **The group is gated on the deployment's reported support** — it renders when the fetched deployment
  reports `features.responses_api: true` (DIAL Core's feature flag, and the signal that actually
  arrives for models), or `interfaces` containing `openaiResponses`, or when the suite being edited
  already targets a Responses path (so an existing suite never silently loses its selected method).
- **`POST /responses` gets a full method descriptor** — request and response body schemas, a default
  request body, and an `answer` response column — mirroring how `CHAT_COMPLETION_METHOD` /
  `CHAT_COMPLETION_SUITE` are shaped. The three parameterised operations seed the existing
  `DEFAULT_SUITE` shape, because they carry no body and produce no extractable answer.
- **`model` is seeded into the `POST /responses` body from the selected target**, and re-seeded when
  the suite's target deployment changes. Unlike `/chat/completions`, DIAL's Responses API endpoint is
  not parameterised on deployment id in its URL, so `model` in the request body is the only thing that
  selects the deployment.
- **`DeploymentInterfaceType` grows from 4 to all 8 DIAL interface wire values**, and the Evaluation
  Framework `Deployment` model gains an optional `interfaces` array plus an optional `features` map
  carrying DIAL Core's per-deployment feature flags.
- **Method selection in `Methods.tsx` stops being index-magic.** Group membership currently lives in
  arithmetic (`activeMethodIndex === 0` means chat completions, `index - 1` indexes routes), which does
  not survive a third group. The grouping moves into a pure, unit-testable helper.

### Non-goals

- No change to the deployment listing endpoint's consumers. `GET /api/v1/deployments` returns a short
  projection with neither `interfaces` nor `features`, so surfaces backed by the list (target pickers,
  `MethodTabContent`'s `selectedApplication`) cannot gate on reported support and are left alone.
- No filtering of which deployments may be chosen as a test suite target.
- No new interface types in the Core-config Interfaces editor. The `*_INTERFACE_TYPES` allowlists in
  `constants/deployment-interfaces.ts` stay as they are, so the four values configurable per entity
  type do not change.
- No support for the streaming (`text/event-stream`) variant of `POST /responses`.
- No reuse or change of `supportsResponsesInterface`. It reads DIAL Core's `interfaces` map
  (`Record<type, { base_url }>`) on a Core resource, a different shape from the Evaluation Framework's
  string array, and serves a different surface (Assets → Models properties).

## Capabilities

### New Capabilities

- `test-suite-responses-api-methods`: which invocation methods a test suite offers for a deployment
  target, how the Responses API group is gated on the deployment's reported support, the shape of
  the four Responses operations' method descriptors and seeded suites, and how `model` tracks the
  selected target.

### Modified Capabilities

None. `deployment-interfaces-config` governs the Core-config Interfaces editor; extending the
`DeploymentInterfaceType` enum adds no configurable type there, because that editor's options come from
the explicit `*_INTERFACE_TYPES` allowlists rather than from the enum.

## Impact

**Affected code** (all under `apps/ai-dial-admin/`):

- `src/models/dial/interfaces.ts` — `DeploymentInterfaceType` extended to 8 values.
- `src/models/evaluation/deployment.ts` — `interfaces?: DeploymentInterfaceType[]` and
  `features?: DeploymentFeatures` on `Deployment`.
- `src/components/BaseControls/InterfacesField/InterfacesField.tsx` — `getInterfaceTypeLabel` is an
  exhaustive switch with no `default`, so it needs one to keep compiling against the wider enum.
- `src/components/TestSuites/Modals/Create/Target.tsx` — the raw `'mcp'` interface-filter string
  becomes `DeploymentInterfaceType.Mcp`.
- `src/components/TestSuites/constants/` — new Responses method descriptor and body constants;
  `methods.ts` gains a `RESPONSES_SUITE`.
- `src/components/TestSuites/utils/` — new grouping helper consumed by `Methods.tsx`.
- `src/components/TestSuites/Methods/Methods.tsx` — renders groups; drops index arithmetic.
- `src/components/TestSuites/Properties/Properties.tsx` — re-seeds `model` on target change.
- `src/constants/i18n.ts` + `src/locales/en.ts` — one new key for the group heading.

**Affected APIs**: none added or called. `getDeployment(id, type)` — already used by `Methods.tsx` —
is the single-deployment endpoint that now returns `interfaces` and `features`, so no new request is
introduced.

**Dependencies**: none.

**Documented assumptions.** Two facts could not be verified from the frontend and are recorded here
because they bound the change:

1. **Resolved.** DIAL's own OpenAPI defines `ResponsesApiRequest` as a bare `type: object`, so the
   request and response schemas are mapped from the complete OpenAI Responses API document supplied
   by the requester (`CreateResponseRequest` → request, `Response` → response). That document's
   `Response` carries no top-level `output_text`; the text is in the `output_text` content parts of
   the `message` items of `output`, so the `answer` column extracts
   `$join(output[type='message'].content[type='output_text'].text)`. This repo's own
   `src/utils/analytics/hop-inspector/responses.ts` walks the same path over measured DIAL traffic,
   which corroborates the document.
2. Whether the Evaluation Framework expands `${{variable}}` placeholders inside
   `requestTemplate.urlTemplate`, not only inside the request body, is unconfirmed. The three
   parameterised operations are only usable if it does. If it does not, they are dropped and the group
   ships with `POST /responses` alone — the gating, the model seeding, and the grouping refactor are
   unaffected either way.
