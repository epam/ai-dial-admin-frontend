## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **Method selection is index-arithmetic today.** `Methods.tsx` treats index `0` as chat completions
  and `index - 1` as an offset into route-derived methods, in three places (`methodInfo`,
  `onMethodClick`, and the selection-restore `findIndex`). A third group has no place in that scheme.
- **`relativeUrlPattern` is a regex, not a path template.** `MethodInfo.tsx` validates the editable
  final path against it whenever it contains regex meta symbols, and `path-error.ts` counts `{` and
  `}` among those. `new RegExp('/responses/{response_id}')` matches only that literal text, so a
  `{response_id}`-style pattern would reject every real response id a user types.
- **DIAL's Responses API endpoint is not deployment-parameterised.** `/chat/completions` is reached at
  `/openai/deployments/{deployment}/chat/completions`; `/openai/v1/responses` has no deployment
  segment, so `model` in the request body is the only deployment selector.
- **DIAL's OpenAPI defines `ResponsesApiRequest` as a bare `type: object`.** It cannot supply the
  request or response schema.
- **The Evaluation Framework contract was confirmed against the running service** (`/v3/api-docs` on the local evaluation-framework backend): `DeploymentInfoDto.interfaces` is a
  `string[]` whose item enum is exactly the eight values below, documented there as "Populated on
  single-deployment responses only; absent from listing entries". The enum in D1 and the model
  field match it value for value.
- **The needed fetch already happens.** `Methods.tsx` calls `getDeployment(deploymentId, $type)` on
  mount — the single-deployment endpoint that now returns `interfaces`. No new request is required.
  Surfaces backed by the listing (`MethodTabContent`'s `selectedApplication`, target pickers) cannot
  see `interfaces` at all.

## Goals / Non-Goals

**Goals:**

- Keep grouping and gating logic out of the component, as a pure function with unit tests.
- Retire the index arithmetic rather than extend it, so a fourth group later costs nothing.
- Make the seeded configuration for each operation immediately runnable where that is possible, and
  honestly chain-only where it is not.
- Keep `model` and the suite's target from diverging.

**Non-Goals:**

- No general refactor of `Methods.tsx` beyond what a third group requires.
- No change to how route-derived methods are discovered (`generateMethodPathCombinations`).
- No new server action, API method, or request.

## Decisions

### D1. Extend `DeploymentInterfaceType` to all eight wire values

The Evaluation Framework's `interfaces` array and the existing `interface` query parameter draw on the
same DIAL vocabulary: `chat`, `embedding`, `mcp`, `custom_ui`, `openaiChatCompletions`,
`openaiResponses`, `openaiEmbeddings`, `anthropicMessages`. The enum currently holds the last four.

Extending it keeps one runtime-usable source for these strings, as `code-standards.md` requires, and
removes an existing raw string — `Target.tsx` passes the literal `'mcp'` as an interface filter, which
becomes `DeploymentInterfaceType.Mcp`.

*Alternative rejected:* a second enum for the Evaluation Framework's vocabulary. It duplicates four
wire strings across two enums that must then be kept in step, for no gain — the vocabularies coincide
because both come from DIAL Core.

*Consequence:* `getInterfaceTypeLabel` in `InterfacesField.tsx` is an exhaustive switch with no
`default` returning `string`, so widening the enum breaks its return type. It gains
`default: return type`. This weakens the compile-time guarantee that a newly configurable type gets a
label — accepted because the configurable set is not the enum but the explicit `*_INTERFACE_TYPES`
allowlists in `constants/deployment-interfaces.ts`, which this change does not touch.

### D1a. Gate on `features.responses_api`, keeping `interfaces` as a secondary signal

The `interfaces` array is the documented field and the Evaluation Framework DTO carries it, but it is
not the field that arrives in practice: DIAL Core does not report `interfaces` for deployments fetched
through its `/openai/...` API, so a Responses-capable model surfaces its support only through Core's
per-deployment feature map, as `features.responses_api: true`. That was confirmed on the wire — the
single-deployment response for a Responses-capable model came back with `capabilities`, `owner`,
`reference` and `inputAttachmentTypes` but no `interfaces` at all.

So the gate is `features.responses_api === true` **or** `interfaces` containing `openaiResponses`,
**or** an already-selected Responses method. Both reported signals are honoured rather than one
replacing the other: `features` is what models actually send, `interfaces` is the documented contract
and is authoritative wherever Core populates it, and neither is expensive to check.

The Evaluation Framework types `features` as a free-form object (`additionalProperties: {}`), so Core's
keys pass through verbatim. `DeploymentFeatures` therefore declares Core's snake_case wire names and
keeps Core's spelling rather than this repo's `is`/`has` boolean convention, and declares only the
flags this app reads.

*Alternative rejected:* replacing `interfaces` with `features` outright. It would discard a field the
backend documents and populates for non-model deployment types, for no saving.

### D2. Grouping as a pure, data-only helper

New `src/components/TestSuites/utils/method-groups.ts`:

```
buildMethodGroups({ deployment, endpointRef, takenColumnNames }) -> MethodGroup[]
```

Each `MethodGroup` carries a heading i18n key and its options; each option carries the
`TestSuiteEndpointRef` to display and the `Partial<TestSuite>` to seed on selection. Types go in an
adjacent `models.ts`, per `code-standards.md`.

Seeds are **data, not callbacks** — `takenColumnNames` is a parameter, so column-name uniquification
happens inside the helper and the result stays plain data. That keeps `utils.md`'s purity rule
satisfied and makes every gating and seeding rule in the spec testable without rendering React.

`Methods.tsx` then keeps a flat list derived from the groups for index-based selection, and renders
headings by iterating groups. `methodInfo`, `onMethodClick`, and the selection-restore `findIndex` all
read the flat list — no `=== 0` and no `- 1`.

*Alternative rejected:* keeping a second hardcoded block in `Methods.tsx` alongside the chat one. It
would leave three index-arithmetic sites to hand-maintain and put the gating rule inside a component
that already carries fetch, resize, and sidebar state.

### D3. Regex-form URL patterns for the response-scoped operations

Given the validation constraint in Context:

| Operation | `relativeUrlPattern` | seeded final path |
| --------- | -------------------- | ----------------- |
| create | `/openai/v1/responses` | `/openai/v1/responses` |
| retrieve, delete | `/openai/v1/responses/[^/]+` | `/openai/v1/responses/${{response_id}}` |
| cancel | `/openai/v1/responses/[^/]+/cancel` | `/openai/v1/responses/${{response_id}}/cancel` |

`[^/]+` matches both the seeded `${{response_id}}` placeholder and any concrete id a user substitutes,
which is what the spec's two path-validation scenarios require. The readable `{response_id}` form
lives in the descriptor's `summary`, as `CHAT_COMPLETION_METHOD` does with
`/openai/deployments/{Deployment Name}/chat/completions`.

The `/openai/v1` prefix is stated once, as `RESPONSES_URL_PREFIX`, and every pattern, template, and
display form is built from it — so the decision has one place to change.

Verified against `isContainRegexSymbols`: `/openai/v1/responses` contains no regex meta symbol, so the
create operation's path is not regex-validated (unchanged from the unprefixed form); the two
parameterised patterns are, and they accept the placeholder and a concrete id while rejecting both a
wrong-shape path and an unprefixed one.

*Alternative rejected:* literal `{response_id}` patterns. They read better in the sidebar but make the
final path unvalidatable against a real id, which breaks the operation.

### D3a. The `/openai/v1` prefix is kept, not stripped

Reverses the original decision to strip it. The prefix is not cosmetic: it is what tells the
Evaluation Framework backend that a request targets DIAL's Responses API. Without it, a deployment
that exposes its own unrelated `/responses` route is indistinguishable from the DIAL Responses API,
and the backend would route the request to the wrong host. `/chat/completions` has no equivalent
problem because its URL names the deployment.

Applied to all three forms — stored pattern, seeded path, displayed label. Keeping the label
unprefixed while the Final path showed the prefix was considered and rejected: the Final path is the
`urlTemplate` that is actually sent, so it must carry the prefix, and a sidebar label that disagreed
with it would misdescribe the request.

*Consequence:* the gating helper no longer recognises a bare `/responses` pattern, which is the
intended effect — a deployment's own `/responses` route stays in the routes group and does not
summon the Responses group. Covered by two tests.

### D4. Schemas mapped from the supplied OpenAI Responses document

DIAL's own schema is a stub (Context), so `requestBodySchema` is mapped from the document's
`CreateResponseRequest` and `responseBodySchema` from its `Response`, both covering every top-level
property with an explicit `type` and `description`.

**The response has no `output_text`.** `Response` requires `output`, an ordered array of
`ResponseOutputItem`, and the generated text sits in the `output_text` content parts of the items whose
`type` is `message`; reasoning items and tool calls share that array. `output_text` is an SDK
convenience accessor, not a wire field. So the `answer` column extracts:

```
$join(output[type='message'].content[type='output_text'].text)
```

`$join` collapses the match to a single string, because a model may split its answer across several
text parts or messages and the column is declared `string` — an unjoined multi-match would hand the
column an array. Evaluated with the repo's `jsonata` against five shapes: reasoning-then-message
returns the text, multiple parts concatenate, and refusal-only / tool-call-only / empty `output` each
yield `undefined` rather than throwing.

This is corroborated inside the repo. `src/utils/analytics/hop-inspector/responses.ts` already parses
DIAL Responses traffic for the trace inspector and walks the identical path — `message` items, then
`output_text` parts, then `text` joined with `''` — with comments citing counts measured over 199 real
hops. Document and observed DIAL traffic agree.

Three deliberate deviations from the document, recorded in the constants file's header:

- `model` is a plain string described as a DIAL deployment id, not the document's enum of ~90 OpenAI
  model names. The value that belongs here is a deployment id.
- `model` and `input` are marked required. The document marks neither — `model` can arrive via
  `prompt`, `input` via `conversation` — but DIAL's endpoint has no deployment segment in its URL, so
  `model` is the only deployment selector, and a suite with no input does nothing.
- The deep unions (`ResponseInputItem` 33 variants, `Tool` 16, `ResponseOutputItem` 28) are
  represented by their `type` discriminator plus the variants a suite exercises, not inlined whole.
  `convertSchemaToTable` renders only top-level properties, so a full expansion would be invisible in
  the table and unreadable in the JSON view.

Every top-level property carries an explicit `type` even where the value is a union, because a
property with only `oneOf` renders a blank Type cell in the schema table.

Operation-level parameters follow DIAL's own operation definition, which is reliable even where its
component schemas are not: `Content-Type` and `X-DIAL-CACHE-POLICY`. No `api-version` parameter — DIAL
does not declare one on this operation, unlike `/chat/completions`. Note `X-DIAL-CACHE-POLICY` differs
from the `X-CACHE-POLICY` in the existing chat-completion descriptor; each descriptor mirrors its own
operation.

Constants split per `code-standards.md`: the descriptor and the body template as separate files under
`TestSuites/constants/`, mirroring the existing `chat-completion-method.ts` / `chat-completion-body.ts`
pair, with `RESPONSES_SUITE` joining `CHAT_COMPLETION_SUITE` in `methods.ts`.

### D5. Seed `model` literally, and re-seed it when the target changes

`model` is set to the target's deployment id at selection time. On its own that goes stale:
`Properties.tsx`'s `onUpdate` replaces `deploymentRef` without touching `requestTemplate.body`, so the
suite would invoke the previous deployment while displaying the new one — and silently, because the
stale value still names a real deployment.

So `onUpdate` also rewrites `body.model`, guarded on the suite's method being `POST /responses`, and
merging rather than replacing the body so hand-added fields survive. The rewrite logic is a pure helper
next to the grouping one, for the same testability reason.

*Alternatives rejected:* a defaulted template variable `${{model:<id>}}` makes the value visible in the
bindings UI but bakes the same stale default, so it renames the problem; leaving the staleness
undocumented was declined by the requester.

### D6. Targeted accessibility fix in the code being changed

`MethodItem` is a clickable `<div>` with no role, no keyboard handler, and selection conveyed only by a
background class. The spec requires the selected method to be "shown as active", and `a11y.md` requires
that state to be programmatic and the control to be a real button. Since this change renders a third
group of these items and asserts activeness in tests, `MethodItem` becomes a
`<button type="button">` carrying `aria-current`, and each group is wrapped in `role="group"` with
`aria-labelledby` referencing its heading via `useId()`.

Scope is deliberately limited to those two changes — they are what the new requirements need in order
to be queryable by role and name, per `testing.md`.

## Risks / Trade-offs

- **~~`output_text` may not exist on the wire response~~ — it does not; corrected.** The complete
  document confirms `Response` has no such field, and this repo's `hop-inspector/responses.ts` agrees
  from measured traffic. The `answer` column now walks `output` (D4). The residual risk is narrower:
  a deployment that answers only with a refusal or a tool call yields `undefined` for `answer` —
  correct, since there is no assistant text to extract, but worth knowing when reading a run.
- **`${{variable}}` may not be expanded inside `urlTemplate`** → Unconfirmed (see Open Questions). If
  body-only, the three response-scoped operations cannot be driven and are dropped; the group then
  ships with `POST /responses` alone. Gating, model seeding, grouping, and the a11y fix are unaffected,
  so this costs one constant and one group of tasks, not a re-plan.
- **Widening the enum removes a compile-time prompt to add an interface label** → `default` returns the
  raw wire string, so a future configurable type would display unlabelled rather than fail to build.
  Mitigated by the `*_INTERFACE_TYPES` allowlists being the real gate on what is configurable.
- **`Properties.tsx` is shared between the suite view and the create modal** → The `model` rewrite is
  guarded on the selected method, so suites on any other method are untouched; a scenario covers that.
- **Streaming responses are not covered** → `text/event-stream` is out of scope (`proposal.md` —
  Non-goals); the descriptor documents only the JSON variant, matching how the chat-completion
  descriptor behaves today.

## Open Questions

- **Resolved from the codebase — placeholders in `urlTemplate` are a supported surface.**
  `getTemplateParameterVariables` in `src/components/TestSuites/utils/request-template-params.ts`
  scans the whole `TestSuiteRequestTemplate` object via `collectParamsFromValue`, and its own doc
  comment names the surface explicitly: "a request template's URL, headers, query params, and body".
  `AdditionalRequestVariables.tsx` calls it for chained requests, in place of the server-fetched
  variables used for request `#0`. So a `${{response_id}}` in the final path already becomes a
  bindable variable in the UI for exactly the chained-request case the response-scoped operations
  need. All four operations are therefore implemented.

  **Residual, unverified:** this is the frontend's contract for *discovering* and binding the
  variable. That the Evaluation Framework substitutes it into the outgoing URL at run time was not
  confirmed against a live backend. If a live Try Out shows an unsubstituted `${{response_id}}` in
  the request URL, the subtraction described in task 1.1 still applies and costs one constant plus one
  group of tests.

- **Resolved — the create operation's response shape.** It is an `output: [...]` array, not a
  top-level `output_text`; see D4 for the resolved expression and the two independent sources. No
  live call was needed after all, so task 1.2 is closed on documentary plus in-repo evidence rather
  than on a captured 200 body — a live Try Out would still be the strongest confirmation.
