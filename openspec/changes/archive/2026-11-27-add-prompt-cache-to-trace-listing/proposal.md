## Why

A trace's token total and its cost often disagree: an agent trace can state hundreds of thousands of tokens
and a cost that only makes sense once most of the prompt was read from the provider's cache. The hop log
records that split per hop (`cached_prompt_tokens`, `cache_creation_tokens`), but the trace listing and the
span tree state neither, so the reader has no way to see why a trace cost what it did, or which calls reused
their prompt.

## What Changes

- A trace's figures state the share of its prompt tokens that came from cache, next to its token total
  (`N% cached`). The share is summed over every hop of the trace, by the figures query that already sums its
  tokens and cost.
- A card's own facts (the root call's row) do not state cache. An application root records no tokens of its
  own, so its cache is always zero; a model root's trace and call coincide, so a card fact would repeat the
  trace figure.
- A metered span row in the trace tree states its own cache read and write (`cache r/w <read> / <write>`)
  where either is non-zero. The exact figures, zeros included, stay in the rail's token usage group.
- A span row's figures are separated by a middle dot, so a row carrying four figures stays scannable.
- The cache columns are read only where the hop log schema reports them; an instance predating them keeps
  its listing without the share.

## Non-goals

- No cache figure on the session header, the session grid or the session rollup — those already state the
  session's cached prompt tokens.
- No absolute cache token counts at trace level; the share is the figure that explains a cost.
- No change to the rail's token usage group or to the inspector's response facts, which already state the
  hop's cache usage.
- No cost attribution of cache savings — the log does not record a counterfactual price.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/session-trace-listing`: a trace states the cached share of its prompt; the figures query sums
  prompt and cached prompt tokens; card facts carry no cache.
- `analytics/session-trace-detail`: a metered span row states its own cache read and write, and the row's
  figures are separated.

## Impact

- Queries: `buildSessionTraceFiguresQuery` in `src/utils/analytics/sessions-queries.ts` gains two sums,
  schema-gated. It is shared with the entity call listing, which therefore states the share too.
- Server action: `src/app/[lang]/sessions/actions.ts` resolves whether the hop log serves the cache column
  before building the figures query (both the session listing and the entity call listing).
- Models and assembly: `SessionTraceFigureRow`, `SessionTraceGroup`, `SessionSpanRow`, `HopMeteredFacts`
  (`src/models/analytics/sessions-trace.ts`); `traceFiguresOf`, `hopFactsOf`.
- UI: `SessionTraceList.tsx` (trace figures) and `SessionEventStream.tsx` (span row); two i18n keys.
- No backend change: both columns are already published by the hop log.
