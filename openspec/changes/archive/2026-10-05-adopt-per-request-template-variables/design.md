## Context

See proposal.md — Why. Three facts shape the approach:

- The flat response is consumed in exactly one place, `TryOutRequestPreview`, which holds it in state and
  reuses the single list for every request group it renders. Everything else that needs template
  variables — the Method tab's Dynamic Configuration — derives them client-side from the selected
  request's own template and never touches these endpoints.
- `getRequestTurnCounts` already computes one turn count per chain request from the suite alone, and
  `TryOut` already calls it unconditionally. Only `TryOutRequestPreview` short-circuits it to `[1]` when
  no test case is selected, which is the single reason suite-level Try Out has no request sections.
- Both backend fixes (the two GET shapes and the POST shape) are landing together, so there is no window
  in which the frontend must serve one old and one new shape.

## Goals / Non-Goals

**Goals:**

- One fetch per Try Out opening covers the whole chain; switching request sections reads from state.
- Per-request resolution with no cross-request fallback, so the preview agrees with the runner.
- Suite-level and test-case Try Out share one code path for sectioning, differing only in editability.
- The wire payload and the editable in-memory body have the same shape, so no translation layer.

**Non-Goals:**

- Tolerating both the old and the new response shape at runtime.
- Replacing the frontend's per-turn resolution with the backend's `resolvedValue`.
- Any change to the response/history side of Try Out, or to column extraction.

## Decisions

### Model the map as `Record<string, TemplateVariable[]>`, not `Map`

The payload arrives as a JSON object, so an index signature keyed by `string` is what `response.json()`
actually produces; wrapping it in a `Map` would mean a conversion at the boundary and a second shape in
the codebase for no gain. Declared as a `type` alias (`TemplateVariablesByRequest`) rather than an
`interface`, per `code-standards.md` — it aliases a record, it is not an object shape with named fields.

Lookups go through `String(requestIndex)`. Alternative considered: coercing keys to numbers at the
boundary so call sites can index with the integer they already have. Rejected — it adds a mapping step
whose only benefit is avoiding one `String()` call per lookup.

### Rendering counts requests from the suite; the payload counts them from the response

Two different questions, two different sources.

For **rendering**, request count comes from `getRequestCount` on the suite in the editor. The fetch runs
once when Try Out opens (its effect has an empty dependency list, deliberately) and the suite can gain a
request afterwards; a request the response does not mention renders as one declaring no variables, which
the spec states explicitly.

For the **submitted payload**, the keys come from the response instead. The try-out endpoint validates
`variables` keys against the *saved* chain and answers `400 VALIDATION_ERROR` for anything outside
`0..N`, and a request added in the editor but not yet saved is exactly that case: `getRequestCount` would
produce `N+1` and the send would fail. The response is derived from the same saved suite the POST
resolves against, so its key set is the allowed range by construction. A request left out of the payload
is treated by the endpoint as having no variables, which is the correct meaning for one the backend does
not know about yet.

Nothing is typed into such a section either — it renders the no-variables message rather than inputs —
so the omission cannot be contradicted by user input.

### Delete `mergeRequestBindings` rather than keep it behind a condition

It exists only because the old response described request `#0`, so a later request's variable had no
binding of its own to find. With per-request variables there is nothing for it to repair, and the backend
is explicit that nothing is inherited. Keeping it "just in case" would preserve the exact bug this change
exists to fix — a later request silently showing request `#0`'s value. Its call site becomes
`toRequestView(testSuite, requestIndex).inputBindings ?? []`.

`resolveVariablesForTurn` keeps its resolution chain unchanged (constant → bound field → same-named field
→ template default → null); only the bindings handed to it change.

### Nest the editable body by request index, mirroring the wire

`requestBody` becomes `Record<string, Record<string, unknown>>` keyed by the same string indexes, so what
`Variables` writes is what gets posted. Alternative considered: keep the flat map and namespace keys
(`"1.query"`), splitting at send time. Rejected — it invents an encoding, and the variable name is user
data that can contain a dot.

`Variables` therefore needs to know which request slice it owns. It takes the index and writes
`{ ...body, [index]: { ...body[index], [name]: value } }`. It stays a presentational component over
`DynamicConfiguration`; no new state.

### Suite-level sections come from deleting a ternary, not from new logic

`TryOutRequestPreview`'s `testCaseId ? getRequestTurnCounts(...) : [1]` becomes an unconditional call.
With no test case, `multiTurnLength` is 0, so every count is 1 and the shape resolves to `requests` for a
chain and `single` for one request — exactly the sectioning wanted, with no suite-level special case.
`TryOut`'s `renderRequestTabs` then only needs its `!!testCaseId` clause dropped from the unsent branch;
the sent branch (`!!response && !!history?.length`) is already level-agnostic.

The grouping helper `groupTryOutSections` is untouched: `groupedSlots` is built directly from the turn
counts here, not from a flat list that needs slicing.

### An empty request section states why it is empty

Request `#0` contributing nothing while a later request contributes variables was previously unreachable,
and renders today as an empty bordered box. It gets a short message instead, which needs a new
`TestSuitesI18nKey` entry and an `en.ts` string. This is a visible-text addition, not a layout change.

### No runtime shape sniffing

An `Array.isArray(response)` branch would let the frontend work against either backend. Rejected: it
doubles the paths through the one component this change rewrites, and it cannot be removed later without
revisiting the same code. The frontend version is instead coupled to the backend release — see Risks.

### The DTO's `binding` and `declaredType` stay unread

The response now carries each variable's binding, which could replace reading `inputBindings` out of the
suite. It is the server's view of a possibly-unsaved suite, and the editor's copy is newer, so adopting
it would make the preview lag edits. Left for a separate decision; `TemplateVariable` gains no fields.

## Risks / Trade-offs

- **The two backend fixes ship in different releases** → The frontend cannot half-work: against a backend
  with only the GET fix, suite-level Send posts an index-keyed payload the backend reads as variable
  names. Mitigation: confirm both are in one backend tag before merging, and keep the change to a single
  revertable commit. There is no feature flag and adding one is not worth it for a contract the backend
  controls.
- **A stale request index reaches the endpoint** → `400 VALIDATION_ERROR`, nothing invoked. Mitigated by
  deriving the payload keys from the response (see Decisions); the residual case is a request *removed*
  in the editor but still in the response, which sends a key the backend accepts and simply ignores.
- **Same-named variables across requests now diverge** → A user who previously saw one value for `query`
  across the chain will see per-request values, which is correct but will read as a change in behavior.
  Mitigation: the request tab strip already labels whose section is being shown.
- **Spec fixtures are typed `TemplateVariable[]` in four files** → These break at `npm run typecheck:specs`,
  which is a blocking gate and not exercised by a green test run. Mitigation: treated as its own task, not
  folded into the component work.

## Migration Plan

No persisted data changes: `saveTryoutResponseToStorage` stores the try-out *response*, not the entered
variables, so nothing in `localStorage` carries the old flat body shape and no migration or key bump is
needed. Rollback is reverting the commit, which is only correct alongside a backend rollback.

## Resolved Questions

Both answered by the backend's part-2 handoff:

- The POST keys are strings holding non-negative integers, the same as the GET's, and a missing index is
  explicitly read as "no variables for that request" — so omitting a request is legal, which is what the
  payload-key decision above relies on.
- `TryItOutResponseDto` is unchanged, and a chain still returns its per-invocation `history`. No
  response-side work.
