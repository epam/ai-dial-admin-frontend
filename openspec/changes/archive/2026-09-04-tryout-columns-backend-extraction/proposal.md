## Why

The Try Out **Columns** tab recomputes every response column client-side with `jsonata`, even though
the eval backend already returns its own reconciled extraction in the try-it-out DTO
(`extractedColumns`) plus a per-column failure reason (`extractionWarnings`). The frontend never reads
either field, so the tab shows a second, independently computed answer — and where the two evaluators
disagree, the tab is simply wrong about what a Run would record.

That divergence is live today. A streaming Responses API suite returns
`response.body = { events: [...] }`; `normalizeResponseBodyForColumns` only knows how to rebuild a
chat-completions `choices[]` shape from SSE deltas, so it hands the Responses envelope to `jsonata`
unchanged and every column resolves to nothing. Reproduced against the `test-responses` suite:

| | |
| --- | --- |
| Backend returned | `extractedColumns: { answer: "Hi there, friend!", id: "dial_gpt-5.6-sol-…" }`, `extractionWarnings: []` |
| Columns tab showed | `answer` **Invalid**, `id` **Invalid** |

Even the trivial expression `id` reported Invalid, because the input document was wrong rather than the
expression. The tab's only failure vocabulary is a red "Invalid" badge, which reads as "your expression
is broken" no matter what actually went wrong.

Client-side evaluation predates the backend feature — it landed in `feat: [Eval] tryout for columns`
(`08a8bd6d`) before the DTO carried extraction, and nothing revisited it when it did. Every future
response shape re-opens the same gap.

## What Changes

- The Columns tab renders the backend's `extractedColumns` for each invocation whenever the DTO
  carries it, instead of evaluating the suite's JSONata expressions in the browser.
- A column the backend could not extract (explicit JSON `null` in `extractedColumns`) is presented
  with the matching `extractionWarnings` entry's error text, rather than a bare "Invalid" badge.
- When the backend performed **no** extraction because the invocation failed (non-2xx status, or an
  SSE stream that ended `TIMEOUT`/`ERROR`), each declared column is shown as **not extracted** with
  that reason. The frontend does not fall back to evaluating expressions against an error body —
  doing so is what produces today's misleading verdict.
- MCP-tool suites keep client-side evaluation unchanged: the backend documents extraction as omitted
  for MCP try-outs, so it is the one path it genuinely does not cover.
- `TryOutResponse` / `TryOutHistoryEntry` gain the `extractedColumns` and `extractionWarnings` fields
  the backend already sends, so they stop arriving untyped and unread.

Because each history entry is itself a try-it-out DTO carrying its own extraction, multi-request and
multi-turn suites get per-invocation values straight from the backend, replacing the frontend's
`mergeColumnBindings` accumulation of prior columns into later JSONata bindings.

## Non-goals

- Teaching `normalizeResponseBodyForColumns` about Responses API SSE events. Reading the backend's
  extraction removes the need; the normalizer stays only for the MCP fallback path.
- Changing what the backend extracts, how it reconciles columns, or the JSONata dialect it accepts.
- Changing the Response tab, the resolved-request preview, or the Runs grid's extracted columns.
- Validating or editing column expressions in the Columns tab — it stays a read-only result view.
- Removing client-side evaluation outright. It remains the MCP fallback.

## Capabilities

### New Capabilities

- `tryout-column-extraction`: where the Try Out Columns tab's values come from — the backend's own
  per-invocation extraction, its per-column failure reasons, the not-extracted presentation when an
  invocation failed, and the MCP fallback to client-side evaluation.

### Modified Capabilities

None. No existing spec governs how the Columns tab derives its values; `mcp-try-it-out` and
`tryout-mcp-tool` cover MCP labels, status and transport, none of which change here.

## Impact

- `src/models/evaluation/test-suite.ts` — `TryOutResponse` and `TryOutHistoryEntry` gain
  `extractedColumns` and `extractionWarnings`.
- `src/components/TestSuites/utils/evaluate-columns.ts` — becomes a reader of backend extraction with
  local evaluation as the MCP fallback; the `mergeColumnBindings` accumulation is no longer needed for
  the backend path.
- `src/components/TestSuites/RequestTemplate/components/TryOutColumns.tsx` — per-column presentation
  gains a not-extracted state and a failure reason.
- `src/components/TestSuites/RequestTemplate/components/TryOut.tsx` — passes the DTO's extraction
  through instead of only the normalized response body.
- `src/components/TestSuites/utils/column-eval-context.ts` — unchanged, but its SSE normalizer is now
  reached only on the MCP fallback path.
- `src/locales/en.ts` and `src/constants/i18n.ts` — keys for the not-extracted state and its reasons.
- No server action, API class or backend contract changes: the fields are already on the wire.
- Contained blast radius — `evaluateColumns` has no consumer outside the Columns tab, so nothing else
  in the app depends on client-side extraction.
