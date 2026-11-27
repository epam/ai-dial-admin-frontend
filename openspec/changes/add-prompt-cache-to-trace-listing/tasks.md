## 1. Trace cached share

- [x] 1.1 Add `PromptTokens`, `CachedPromptTokens`, `CacheCreationTokens` to `UsageLogField`, the `prompt_tokens` / `cached_tokens` aliases to `SessionTraceFigureField` and `SessionTraceFigureRow`, and `promptTokens` / `cachedTokens` to `SessionTraceGroup` (`src/models/analytics/sessions-trace.ts`)
- [x] 1.2 Give `buildSessionTraceFiguresQuery` (`src/utils/analytics/sessions-queries.ts`) a `hasCacheColumns` flag that adds `sum(prompt_tokens)` and `sum(cached_prompt_tokens)`; the roots query stays unchanged
- [x] 1.3 Resolve the flag with `isUsageLogFieldServed(UsageLogField.CachedPromptTokens, …)` in both callers in `src/app/[lang]/sessions/actions.ts` (session trace listing and entity call listing)
- [x] 1.4 Sum the two aliases in `traceFiguresOf` (`src/utils/analytics/session-trace-groups.ts`)
- [x] 1.5 Render the token total and the `N% cached` share through one `TraceTokens` piece in all three places `SessionTraceList.tsx` states trace figures; no share when `promptTokens` is 0; no cache fact in the card's middle tier; add `SessionsTraceI18nKey.TraceCachedShare`

## 2. Span row cache and separators

- [x] 2.1 Add `cached_prompt_tokens` / `cache_creation_tokens` to `SessionSpanRow` and `cacheRead` / `cacheWrite` to `HopMeteredFacts`; fill them in `hopFactsOf` (`src/utils/analytics/session-spans.ts`)
- [x] 2.2 In `RowFacts` (`SessionEventStream.tsx`) render `cache r/w {read} / {write}` after the tokens when either side is above zero, a missing side as `0`; add `SessionsTraceI18nKey.SpanCache`
- [x] 2.3 Wrap the metered facts in one flex span whose children after the first get a `::before` middle dot in `text-tertiary`, using the alt-text `content` form so assistive tech skips it

## 3. Tests

- [x] 3.1 `sessions-queries.spec.ts`: the figures query names both sums with the flag set and neither without it; the roots query names no cache column
- [x] 3.2 `session-trace-groups.spec.ts`: `traceFiguresOf` sums prompt and cached tokens across kinds, and yields 0 when the aliases are absent
- [x] 3.3 `session-spans.spec.ts`: `hopFactsOf` carries cache read and write on a metered span, `null` when unrecorded, and nothing on an unmetered span
- [x] 3.4 `SessionTraceList.spec.tsx`: the share renders beside the trace tokens, is absent with zero prompt tokens, renders `0%` for a measured miss, and the card's own facts carry no cache figure
- [x] 3.5 `SessionEventStream.spec.tsx`: a metered row states cache read and write when non-zero, states none at `0 / 0` or when unrecorded, and an unmetered row states none
- [x] 3.6 Update every hand-built `SessionTraceGroup` / `HopMeteredFacts` fixture that `typecheck:specs` reports

No browser-verification task: declined for this change; the scenarios are covered by the component tests above.

## 4. Quality checks

- [ ] 4.1 Update the `analytics/session-trace-listing` and `analytics/session-trace-detail` consolidated specs via the sync at archive time
- [x] 4.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass
