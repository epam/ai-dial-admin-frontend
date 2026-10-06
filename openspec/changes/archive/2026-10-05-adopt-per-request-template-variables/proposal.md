## Why

Both template-variable endpoints used to extract placeholders from the suite's own `requestTemplate`
only, ignoring `additionalRequests` — so in a multi-request suite every request after the first reported
no variables at all (backend GH #217). The frontend compensated by reusing the one flat list for every
request group in Try Out and by falling back to request `#0`'s bindings for names a later request did not
bind (`mergeRequestBindings`). Both workarounds produce values that look plausible and are wrong.

The backend now returns the whole chain from one call, keyed by request index, and the paired try-out
endpoint takes its variables the same way. Adopting both shapes together removes the compensating logic
rather than re-aiming it.

## What Changes

- **BREAKING (inbound).** `GET …/template-variables` and `GET …/test-cases/{id}/template-variables`
  return `Map<requestIndex, TemplateVariableDto[]>` instead of a flat `TemplateVariableDto[]`. Key `"0"`
  is the suite's own request, `"n"` is `additionalRequests[n-1]`; every index `0..N` is always present,
  and a request with no placeholders maps to `[]`. MCP and single-request DEPLOYMENT suites return
  exactly `{"0": [...]}`.
- **BREAKING (outbound).** `POST …/try-out` takes `{ variables: Map<requestIndex, Map<name, value>> }`
  instead of a flat `{ variables: Map<name, value> }`. The `{ variables }` envelope is unchanged; only
  the value nests.
- **Try Out resolves per request.** Each request's section is built from that request's own variable
  list and that request's own `inputBindings`. Nothing is inherited from request `#0`, matching how the
  runner executes the chain.
- **`mergeRequestBindings` is removed**, not adapted. It existed only to paper over the old flat
  response and now contradicts the backend's per-request resolution.
- **Suite-level Try Out gains per-request sections.** Today it always renders one section (its turn
  counts are hard-coded to `[1]` when no test case is selected) and posts one flat variable map, so a
  chain's requests `1..N` have nowhere to receive values. With an index-keyed payload they get their own
  editable sections and the request tab strip.
- **Request `#0` may legitimately contribute no variables** while later requests do. That combination
  was previously unreachable and currently renders an empty bordered section.
- Per-request `effectiveType` and `declaredType` now arrive correctly for requests `1..N`, so the editor
  widget a variable row renders (file picker, number input, …) stops being request `#0`'s.

The authoring path is untouched: the Method tab's Dynamic Configuration derives variables by scanning the
selected request's own template client-side (`getTemplateParameterVariables`) and never calls these
endpoints. GH #217's symptom never appeared there for that reason.

## Capabilities

### New Capabilities

- `tryout-chain-variables`: How Try Out obtains and presents template variables for a request chain —
  the index-keyed response contract, per-request resolution with no inheritance from request `#0`, the
  index-keyed suite-level try-out payload, per-request sections at both suite and test-case level, and
  the empty-request-section case.

### Modified Capabilities

- `multi-turn-test-cases`: the per-turn Dynamic configuration requirement resolves values "using the
  suite's input bindings". It becomes the selected request's own bindings, and per-turn sections now
  nest inside a request when a suite has a chain.

## Impact

**Modified** — `apps/ai-dial-admin/src/`

- `models/evaluation/test-suite.ts` — new `TemplateVariablesByRequest` map alias beside
  `TemplateVariable`.
- `server/eval/test-suites-api.ts` — both template-variable getters' return types; `tryOutTestSuite`'s
  `variables` payload.
- `app/[lang]/test-suites/actions.ts` — the two getters forward only, but `tryOutTestSuite`'s parameter
  type changes.
- `components/TestSuites/RequestTemplate/components/TryOutRequestPreview.tsx` — map-shaped state,
  per-request variable lists, removal of the `testCaseId ? … : [1]` turn-count shortcut, per-request
  seeding of the editable body.
- `components/TestSuites/RequestTemplate/components/TryOut.tsx` — nested `requestBody` state; the request
  tab strip's `!!testCaseId` gate.
- `components/TestSuites/RequestTemplate/components/Variables.tsx` — writes into its own request's slice
  of the body rather than a flat map.
- `components/TestSuites/utils/template-variables.ts` — `mergeRequestBindings` deleted.

**Unaffected but worth stating**

- `test-suite-jsonata-request-body`'s claim that "the try-out endpoints send `{ variables }` and `{}`"
  stays true — the envelope key does not change, so that spec needs no delta.
- The frontend keeps resolving per-turn values itself (`resolveVariablesForTurn` over
  `buildTurnEffectiveData`). The backend's `resolvedValue` is still resolved against the test case's
  shared `data` only, with no `multiTurnData` handling, so it cannot replace that logic.
- Request count stays derived from the in-memory suite (`getRequestCount`), not from the response's key
  set: the fetch runs once per Try Out open while the suite can gain a request afterwards.

**Confirmed by the backend handoff** — a suite-level try-out of a chain does execute every request and
returns a per-invocation `history`, so the per-request input sections are warranted. The try-out response
body itself is unchanged, so the response side of Try Out needs no work.

**Rejected shapes** — the endpoint returns `400 VALIDATION_ERROR` for a `variables` key outside the saved
chain's `0..N`, for a non-integer key (which is what the old flat body looks like), and for a non-object
value. Nothing is invoked in those cases, so a wrong payload fails loudly rather than silently running
with the wrong values.

## Non-goals

- Reordering requests, or any Method-tab authoring change. Dynamic Configuration keeps its client-side
  template scan.
- Using the DTO's `binding` / `declaredType` fields in place of reading `inputBindings` from the suite in
  state. The in-memory suite is the authority while editing; adopting the server's copy is a separate
  question.
- Per-turn `resolvedValue` from the backend. Still frontend-side.
- Column extraction and the response/history presentation (`tryout-column-extraction` keeps its
  requirements unchanged).
