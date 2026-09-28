## Context

See `proposal.md` — Why. The constraints that shape the approach:

**The fields are already on the wire.** `TryItOutResponseDto` carries `extractedColumns` (column name →
extracted value, an explicit JSON `null` for a column whose extraction failed) and
`extractionWarnings` (one entry per failed column: `column`, `expression`, `error`). Both are documented
as omitted when no extraction was performed: the suite declares no response columns, the invocation
failed, or the try-out is MCP. Every `history[]` entry is itself a `TryItOutResponseDto`, so each
invocation of a chain or a multi-turn run carries its own extraction — described as "this invocation's
own extraction, not the accumulated frame carried between requests".

**Nothing outside the Columns tab depends on client-side evaluation.** `evaluateColumns` and
`evaluateTryOutColumnSections` have exactly one consumer, `TryOutColumns.tsx`. The request preview,
template variables and Runs grid do not use them.

**Try-out already runs against the saved suite.** `tryOutTestSuite(id, { variables })` sends only
variables; the backend loads the request template and column definitions by id. Unsaved edits to the
request body are already not exercised today — the same is now true of unsaved column expressions.

**Two different things are called `TryOutResponse`.** `src/models/evaluation/test-suite.ts` exports
`TryOutResponse` for the whole envelope, and `RequestTemplate/components/TryOut.tsx` exports a local
`TryOutResponse` for the inner `{ statusCode, body, … }`. This change has to touch both, which makes
the collision a live hazard rather than a cosmetic one.

**The failure vocabulary is one boolean.** `EvaluatedColumn.valid` drives both the badge and the card
colour, so "no value" and "never attempted" cannot currently be told apart.

## Goals / Non-Goals

See `proposal.md` — Non-goals for scope. Design-level boundaries:

**Goals:**

- One source of truth per invocation, chosen before any rendering, so a card cannot mix a backend value
  with a locally derived one.
- Absence of extraction is classified into a *stated reason*, never into a silent empty state.
- The MCP fallback stays on the existing code path, unchanged, rather than being reimplemented behind a
  flag.

**Non-Goals:**

- Unifying `TryOutResponse` / `TryOutHistoryEntry` with a generated backend type. They stay hand-written.
- Making the Columns tab re-runnable against edited column definitions (see Risks).
- Reworking the Response tab's rendering of `events` / `streamingStatus`.

## Decisions

### D1. Read extraction from the DTO; keep the whole envelope in component state

Add `extractedColumns?: Record<string, unknown>` and `extractionWarnings?: ExtractionWarning[]` to both
`TryOutResponse` and `TryOutHistoryEntry` in `src/models/evaluation/test-suite.ts`, with
`ExtractionWarning` (`column`, `expression`, `error`) as its own interface in the same models file.

`TryOut.tsx` currently narrows the server response to its inner core (`res.response?.response`) and
discards the envelope, keeping `resolvedRequest`, `grafanaTraceUrl` and `history` as separate state. It
will keep the envelope itself as one piece of state and derive the inner core from it.

**Why:** the extraction lives on the envelope, beside `history`, not inside the core response. Keeping
the envelope removes the need for a third and fourth parallel `useState` and makes the restore path
identical to the fresh path — `saveTryoutResponseToStorage` already persists the whole envelope, so a
stored result from before this change is simply an envelope without the two fields.

**Alternative rejected:** threading `extractedColumns` and `extractionWarnings` as two more props from
`TryOut.tsx` into `TryOutColumns`. That is five `useState` hooks over one object and leaves the two
fields able to drift out of step with the `response` they describe.

### D2. Rename the local core-response type to `TryOutCoreResponse`

The type exported from `TryOut.tsx` becomes `TryOutCoreResponse`, matching the backend's
`TryItOutCoreResponseDto`, and moves to `src/models/evaluation/test-suite.ts` beside the envelope it
belongs to. `TryOutResponsePreview` and the storage helper import it from there.

**Why:** the change has to reason about "the envelope" and "the core response" in the same functions.
Leaving both named `TryOutResponse` guarantees an import from the wrong module type-checks in some file
and quietly means the other thing. Moving it also satisfies the project's rule that domain types live in
`src/models/`.

**Alternative rejected:** leaving the name alone and relying on import paths. Cheap now, and the exact
kind of trap that costs an afternoon later.

### D3. Classify each column into a three-state status, not a boolean

Replace `EvaluatedColumn.valid: boolean` with a status enum in the feature's models file:

| Status | Meaning | Card |
| ------ | ------- | ---- |
| `Extracted` | the extraction reported a non-null value | success, value shown |
| `Failed` | the extraction reported `null` for this column | error, warning's `error` text shown |
| `NotExtracted` | no extraction was performed for this invocation | neutral, stated reason shown |

`EvaluatedColumn` also gains `error?: string` (the warning's message) and keeps `name`, `expression`,
`type`, `result`.

**Why:** the spec distinguishes three observable outcomes and a boolean can carry two. An enum rather
than a string-literal union follows the project's standard for fixed value sets, and gives the renderer
a value to switch on instead of nested conditionals — the card already has three visual treatments to
choose between, and a nested ternary over two booleans is what the standards forbid.

**Alternative rejected:** keeping `valid` and adding `notExtracted?: boolean`. Two booleans encode four
states, one of which is nonsense, and every call site has to know which takes precedence.

### D4. Resolve the source of values once, per invocation, in a pure function

A single function in `src/components/TestSuites/utils/` decides, for one invocation, which of three
sources produces its column results, in this order:

1. **MCP suite** → evaluate locally (existing `evaluateColumns`, unchanged).
2. **`extractedColumns` present** → map each declared column to its reported value; `null` → `Failed`
   with the matching warning's `error`; a declared column the mapping omits → `NotExtracted`.
3. **no `extractedColumns`** → every declared column `NotExtracted`, with the reason taken from the
   invocation: a non-2xx `statusCode`, a terminal `streamingStatus`, or — failing both — a neutral
   "no extraction was reported" for a suite that declares columns, and no results at all for a suite
   that declares none.

`streamingStatus` becomes an enum (`SUCCESS`, `FAILED`, `TIMEOUT`, `ERROR`) in the models file;
`TIMEOUT`, `ERROR` and `FAILED` are terminal.

**Why:** the precedence has to be decided in one place or the three sources leak into the renderer. MCP
first because that suite type never gets an extraction, so testing for it first keeps the fallback off
the main path rather than reachable as a consequence of a missing field. Ordering `extractedColumns`
ahead of the status check means a partially-failed-but-extracted invocation shows its per-column reasons
rather than being flattened into one invocation-level reason.

The frontend classifies rather than re-derives: it never decides *whether* extraction should have
happened, only reports what the response says about it.

**Alternative rejected:** inferring failure purely from `statusCode`, without consulting
`extractedColumns` presence. The backend's own condition is broader than the status code (an SSE stream
that times out mid-flight can still carry a 200), so mirroring the status code alone would reintroduce a
second, wronger copy of the backend's rule.

### D5. Per-invocation values, no accumulation

`evaluateTryOutColumnSections` keeps its shape/grouping logic — `getRequestTurnCounts`,
`getTryOutSectionShape`, `groupTryOutSections`, `shouldShowTurnLabels` are unchanged and stay in
`src/utils/evaluation/tryout-sections.ts`. What is removed on the backend path is
`accumulatedBindings` / `mergeColumnBindings`: each invocation's results come from its own entry.

The function stays `async` because the MCP fallback still awaits `jsonata`, and stays named for what it
produces rather than for evaluating.

**Why:** the backend states each invocation's extraction is already reconciled against the accumulated
frame. Re-accumulating in the browser reimplements the chaining rules a second time, which is the same
class of divergence this change exists to remove. `mergeColumnBindings` and `parseColumnBindingValue`
remain reachable only from the MCP path, where a single MCP invocation has nothing to accumulate — so
they are deleted rather than left as dead branches.

### D6. Format values for display without collapsing falsy ones

A pure formatter renders a reported value: a string verbatim, anything else via `JSON.stringify`. The
*only* signal of failure is `null` in the mapping, so `false`, `0` and `""` render as themselves and
stay `Extracted`.

**Why:** today's `valid = evaluated != null` plus `String(evaluated)` is close to this, but the failure
signal was a JSONata "no match", which conflates "matched nothing" with "matched an empty string". The
backend separates them and the display must not put them back together — a column legitimately
extracting `false` is not a failure.

### D7. Presentation: reason text, and status exposed non-visually

Each card keeps its name, type tag, status badge and expression. It gains a reason line — the warning's
`error` for `Failed`, the stated invocation reason for `NotExtracted` — placed above the value area, and
`NotExtracted` renders no value area at all.

Because a card's kind is currently carried by colour plus a badge, each card root takes `role="group"`
with an `aria-label` naming the column and its outcome, per the project's accessibility rules for
row-like collections. The neutral `NotExtracted` treatment uses existing layer/stroke tokens rather than
a new colour, so contrast is inherited from the token set.

Where a warning supplies the `expression` the backend actually evaluated, the card shows that expression
in place of the locally held one.

**Why:** the last point is what makes the trade-off in Risks visible instead of confusing — if the
user's unsaved edit differs from what ran, the card shows what ran.

### D8. i18n

New keys under the existing test-suites domain enum in `src/constants/i18n.ts` with values in
`src/locales/en.ts`: the `NotExtracted` badge, and the three reasons (request failed with a status,
stream did not complete, no extraction reported). `ValidityStatusI18nKey.Valid` / `.Invalid` keep their
current use for `Extracted` / `Failed`.

## Risks / Trade-offs

- **Unsaved column edits are no longer previewable.** Today a user can edit a column expression and
  press Try Out to see the new expression evaluated locally; after this change the backend extracts using
  the *saved* definitions. → The request body has always behaved this way (try-out sends only variables),
  so this removes an inconsistency rather than adding one. D7 shows the expression the backend actually
  evaluated, so a mismatch is visible rather than silent. If previewing unsaved expressions turns out to
  matter, it is a separate change with a real requirement, not an accident of two evaluators.

- **An older evaluation backend sends neither field.** Every column would then read `NotExtracted` with
  the neutral reason. → The state is honest and self-explanatory rather than wrong, and the neutral reason
  is distinguishable from a failure. The eval backend in this workspace reports the fields (verified
  against its `/v3/api-docs` and a live try-out).

- **Stored try-out results from before this change lack extraction.** → Same path as above: restored
  legacy results present as `NotExtracted`, which the spec requires explicitly. No storage migration and
  no version stamp — the fields' absence is the signal.

- **The chat-completions SSE normalizer becomes near-dead code.** It is reached only on the MCP fallback,
  where a `choices[]`-shaped stream is unlikely. → Left in place rather than deleted: it is the fallback
  path's only handling of streamed responses, and removing it is a separate cleanup with its own risk.

- **`role="group"` on every card adds announcements to a long list.** → The label is short and names the
  column plus its outcome, which is the distinction currently carried by colour alone; this is the pattern
  the project's a11y rules prescribe for exactly this shape of collection.

## Migration Plan

None. No data migration, no persisted schema version, no backend change: both fields already ship. The
absence of the fields is itself the compatibility signal (see Risks), so a rollback is a plain revert —
the frontend returns to evaluating locally and stored results stay readable in both directions.
