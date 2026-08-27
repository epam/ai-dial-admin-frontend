## 1. Query layer

- [x] 1.1 In `apps/ai-dial-admin/src/utils/analytics/conversations-queries.ts`, add
  `buildConversationRatingTotalsQuery({ range, feedback })`: an aggregate over `FEEDBACK_ENTITY` selecting
  `count(DISTINCT chat_id)` under the `last_rate_time` range predicate, the `chat_id != ''` guard and
  `ratePredicates(feedback)`. Reuse the existing `ratePredicates` helper rather than restating the thumb
  semantics (design D1).
- [x] 1.2 Change `buildConversationTotalsQuery` to take the period alone — drop `search`, `chatIds` and
  `columnFilters` from its filter — and add `buildFilteredConversationCountQuery` for the grid's row total,
  carrying the full filter and selecting only the count (design D3).
- [x] 1.3 Add the totals field aliases and the `ConversationRatingTotals` / widened `ConversationTotals` types
  to `apps/ai-dial-admin/src/models/analytics/conversations-trace.ts`; keep value-set constants in
  `constants/analytics/conversations-trace.ts`, not in the models file.

## 2. Server action

- [x] 2.1 In `apps/ai-dial-admin/src/app/[lang]/conversations-trace/actions.ts`, rework
  `resolveConversationTotals` to resolve the period figures: the conversations count/cost aggregate plus the
  two rating aggregates (rated, negative), issued concurrently. A failed rating aggregate SHALL leave the
  count and cost standing and mark only the rating figures unresolved.
- [x] 2.2 Resolve the grid's `total` from `buildFilteredConversationCountQuery` only when a search term, a
  column filter or a feedback filter is active; otherwise reuse the period conversation count. Keep the
  existing short-page termination as the fallback when the count is unavailable.
- [x] 2.3 Extend `ConversationsPage` so the first page carries the period figures and the grid total as
  distinct values, and update `getConversations` to return them.

## 3. Header components

- [x] 3.1 Rewrite `Header/ConversationsProvenanceLine.tsx` to take `schemaFields` and derive its entity list:
  base entity, then the distinct enrichment namespaces in first-appearance order (reusing `enrichmentOf` and
  `columnProvenance` from `conversation-column-catalog.ts`), then the page's directly-queried entities.
  Render the base entity alone when the schema reports no enrichments.
- [x] 3.2 Replace `CONVERSATION_SOURCE_ENTITIES` in `constants/analytics/conversations-trace.ts` with a
  constant naming only the entities the page queries directly (today: `FEEDBACK_ENTITY`).
- [x] 3.3 Update `Header/ConversationsSummary.tsx`: the rated pill reads the resolved rated total over the
  period conversation count; the negative pill reads the resolved negative total. Replace the
  `SummaryLoadedScope` caption with a period caption on every pill, keeping the existing hover and
  screen-reader text alongside it (`.claude/rules/a11y.md` — status feedback and visible caveats).
- [x] 3.4 Pass `schemaFields` from `ConversationsTraceView.tsx` to the provenance line.

## 4. Hook and cleanup

- [x] 4.1 In `use-conversations.ts`, drop the `summary` state derived from loaded rows and surface the
  resolved period rating totals instead. As shipped this also removed the `loaded` map, `loadedCount`,
  `LoadedConversations` and `resultKey`: the task assumed the map was still needed for block
  de-duplication, which turned out to be wrong — AG Grid owns its own block cache and the count was the
  map's only reader. See `design.md` D5.
- [x] 4.2 Delete `summariseConversations` from `utils/analytics/conversation-rows.ts` and its spec coverage;
  leave `conversationRatingCounts`, `attachRatings` and `unresolvedRatings` untouched — the Rating column and
  the detail panel still use them.

## 5. i18n

- [x] 5.1 Remove `SummaryLoadedHint` / `SummaryLoadedScope` and add the period-scope keys to
  `constants/i18n.ts` and `locales/en.ts`, keeping every other locale file in sync.

## 6. Tests

- [x] 6.1 Unit-test `buildConversationRatingTotalsQuery`, the period-only `buildConversationTotalsQuery` and
  `buildFilteredConversationCountQuery` in `utils/analytics/tests/` — assert the emitted filter carries the
  period and, for the totals query, that it carries no search or column predicate.
- [x] 6.2 Extend `conversations-trace/tests/actions.spec.ts`: period figures resolve independently of the grid
  filter; a failed rating aggregate leaves count and cost standing; the grid total is resolved only when a
  filter narrows.
- [x] 6.3 Extend `ConversationsProvenanceLine.spec.tsx`: a schema with two enrichments lists both; an unknown
  enrichment is still listed; a schema with none lists the base entity alone.
- [x] 6.4 Extend `ConversationsSummary.spec.tsx`: pills show period figures and a visible period caption, show
  no loaded-scope caption, and report unavailability per-figure rather than zeros.

## 7. Quality gate

- [x] 7.1 Run lint, format and the full test suite; update `openspec/specs/analytics/spec.md` via the archive
  flow, and confirm no other caller of the removed constants and helper remains.

## Verification

No browser-verification task. The user was asked whether to add the `spec-browser-verify` task for this
change's browser-observable scenarios and declined; component tests in group 6 cover the rendered pills and
provenance line.
