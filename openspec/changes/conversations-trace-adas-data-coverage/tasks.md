## 1. Models, constants and i18n

- [x] 1.1 Extend `ConversationsField` in `src/models/analytics/conversations-trace.ts` with `Traces`,
      `CacheCreationTokens`, `CachedPromptTokens`, `ReasoningTokens`, `ChainPriceTotal`, and the insight
      members `InsightTitle`, `InsightSentiment`, `InsightSentimentScore`, `InsightTopic`, `InsightTopics`,
      `InsightLanguage`, `InsightResolutionStatus` whose values are the service's qualified flat names
      (`conversation_insights.title`, …). Add the matching keys to `ConversationDetailRow` and
      `ConversationListRow`.
- [x] 1.2 Add a `TurnsField` enum for the `turns` rollup (`chat_id`, `trace_id`, `first_request_time`,
      `hop_count`, `total_tokens`, `total_price`, `duration_ms`). Leave `UsageLogField` and
      `ConversationTurnField` / `ConversationTurnRow` unchanged — the span query still reads
      `dial_usage_log` and the turn row shape is preserved by aliasing (design §1).
- [x] 1.3 In `src/constants/analytics/conversations-trace.ts`: add `TURNS_ENTITY = 'turns'`; add the ten new
      scalar fields to `CONVERSATION_FIELD_VALUE_TYPE`, `SORTABLE_CONVERSATION_FIELDS` and
      `FILTERABLE_CONVERSATION_FIELDS` (not `Traces` — array fields stay unsortable and unfilterable).
- [x] 1.4 In `CONVERSATION_DETAIL_PANELS`: bind the Trace entry to `ConversationsField.Traces` with
      `ConversationFieldFormat.List`, and delete the Region entry.
- [x] 1.5 Add the new labels and header tooltips to `ConversationsTraceI18nKey` (`src/constants/i18n.ts`) and
      `src/locales/en.ts`: title, sentiment, sentiment score, topic, topics, language, resolution status,
      cache-creation/cached-prompt/reasoning tokens, chain cost, plus the insight-provenance and
      chain-cost-coverage tooltips. Restate `DetailSuccessful` to say a turn counts when at least one hop
      succeeded, and remove `DetailRegion` from both files.

## 2. Queries

- [x] 2.1 Add `ConversationsField.InsightTitle` to `CURATED_SELECT_FIELDS` in
      `src/utils/analytics/conversations-queries.ts` — and only that field; the rest project through
      visibility (design §3).
- [x] 2.2 Rewrite `buildConversationTurnsQuery` as a row query over `TURNS_ENTITY`, aliasing the rollup's
      columns to the existing `ConversationTurnField` names per the table in design §1, filtered by
      `eq(chat_id, …)`, sorted by `started` ascending, paged to `CONVERSATION_TURN_LIMIT`. It must name no
      body column and must carry no group-by.
- [x] 2.3 Confirm `buildConversationDetailQuery` now names `traces` and the insight columns through
      `Object.values(ConversationsField)`; keep the select explicit (no wildcard) so the heavy `traces`
      column is actually returned.

## 3. Projection follows visibility

- [x] 3.1 Add `projectableCatalogFields(curated, schemaFields)` to
      `src/utils/analytics/conversation-column-catalog.ts`: the offerable schema fields plus every curated
      column whose `field` is a field of the entity schema (which excludes the composed `rating` column).
- [x] 3.2 Use it for `modelScope.projectableFields` in
      `src/components/Analytics/ConversationsTrace/use-conversations.ts`, leaving `offerableSchemaFields`
      as the catalog's own gate.

## 4. Detail page

- [x] 4.1 Add `conversationTitle(row)` to `src/utils/analytics/conversation-detail-fields.ts` (or a sibling
      util): the insight title trimmed, falling back to `chat_id`. It backs both the header and the grid
      column so the two cannot drift.
- [x] 4.2 In `ConversationDetailHeader.tsx`, replace the Title placeholder with `conversationTitle(...)` and
      the Model placeholder with the rollup's `deployments`, dropping the `ColumnProvenance.None` marker from
      both entries now that each has a real source. (The field was first narrowed by `narrowToModels` and
      labelled Model; group 10 retired both — see design §13.)
- [x] 4.3 Verify the metadata panel renders trace ids and no longer renders Region, and that no panel entry
      resolves to `ConversationFieldState.Unavailable`.

## 5. List page columns

- [x] 5.1 Add the eleven curated columns to `BASE_CONVERSATIONS_TRACE_COLUMNS` in
      `src/constants/grid-columns/grid-columns.tsx` following design §7: title immediately after the
      conversation column and visible, the other ten `hide: true`, each with its i18n header and
      `headerTooltip`. The title column renders through `DialEllipsisTooltip` with the
      `conversationTitle` fallback.
- [x] 5.2 Set `suppressFieldDotNotation: true` in the conversations grid's `additionalGridOptions`
      (`List/ConversationsList.tsx`) so dotted enrichment names resolve as flat keys — this also fixes the
      schema-derived `conversation_insights.*` columns that render blank today.
- [x] 5.3 Confirm the curated insight fields are no longer offered as schema-derived catalog columns (they
      are consumed by curated columns now) and that all eleven are attributed to the `conversations`
      provenance group.

## 6. Tests

- [x] 6.1 Update `src/utils/analytics/tests/conversations-queries.spec.ts` and
      `conversation-detail-queries.spec.ts`: the turn query targets `turns` in row mode with the aliased
      select, the chat-id filter, the `started` sort and no group-by; the list select names
      `conversation_insights.title`; the detail select names `traces`.
- [x] 6.2 Add unit tests for `conversationTitle` (title present, blank, whitespace-only, insight row absent)
      and for `projectableCatalogFields` (curated field-backed column included, `rating` excluded, a curated
      field missing from the schema excluded).
- [x] 6.3 Update `conversation-column-catalog.spec.ts` and `conversations-trace-columns.spec.ts` for the new
      curated set, the default-visible set (nine plus title plus Rating), and the insight fields no longer
      being offered as raw columns.
- [x] 6.4 Update `conversation-detail-fields.spec.ts` and `ConversationDetailRail.spec.tsx` for the Trace
      entry and the removed Region entry; add a header test asserting the title falls back to the chat id and
      the model states the narrowed deployments.
- [x] 6.5 Update `app/[lang]/conversations-trace/tests/actions.spec.ts` and `detail-page.spec.tsx` fixtures
      for the new detail-row keys, and assert a conversation with no turn rows renders the empty-turn-list
      presentation rather than an error.

## 7. Schema-driven projection

Added 2026-08-18: browser verification found the change taking both pages down on an instance without the
`conversation_insights` enrichment. See design §9–§12.

- [x] 7.1 In `src/constants/analytics/conversations-trace.ts`, declare the required/optional split:
      `REQUIRED_LIST_SELECT_FIELDS` / `OPTIONAL_LIST_SELECT_FIELDS` for the list query and
      `REQUIRED_DETAIL_SELECT_FIELDS` / `OPTIONAL_DETAIL_SELECT_FIELDS` for the detail query, the optional
      detail set being the twelve members this change added to `ConversationsField`.
- [x] 7.2 Add `availableSelectFields(required, optional, schemaFieldNames?)` to
      `src/utils/analytics/conversation-column-catalog.ts`: required unconditionally, optional only when
      reported, and required alone when no schema is given.
- [x] 7.3 Thread it through `src/utils/analytics/conversations-queries.ts` — `buildConversationListQuery`
      and `buildConversationDetailQuery` take the available field names and stop enumerating
      `ConversationsField` wholesale.
- [x] 7.4 Pass the field names in from both routes: the list page already fetches the schema server-side, so
      carry `schemaFields` into the page request through `use-conversations`; the detail route
      (`app/[lang]/conversations-trace/[id]/page.tsx`) gains a `getConversationsSchema()` call in its first
      `Promise.all` alongside feedback and turns, with only `getConversationDetail` awaiting it.
- [x] 7.5 Map `undefined` to `ConversationFieldState.Unavailable` and `null`/`''` to `Empty` in
      `resolveConversationField`, so a column the instance never projected reads as unavailable.
- [x] 7.6 Drop a curated column from `CONVERSATIONS_TRACE_COLUMN_GROUPS` when its field is in the optional
      set and the schema does not report it; leave the original columns and `rating` unconditional.
- [x] 7.7 Tests: the select omits an unreported optional field and keeps every required one; a missing
      schema yields the required set alone; the detail route builds its query from the fetched schema and
      does not await it for feedback or turns; the seven insight columns disappear from the column set when
      the schema omits them while Rating survives; `resolveConversationField` distinguishes absent from
      null; and a guard asserting every curated field beyond the original set appears in an optional set.

## 12. Header deployments entry dropped

- [x] 12.1 Remove the header's Deployments entry, its spec clauses and its tests: the metadata panel already
      states the field, and one fact in two places is what the header's turn-count and rating rules forbid.
      Browser-verified: the header states title, project, turns, duration and last activity, and no
      deployments or model entry; the metadata panel states the deployments.

## 10. Deployments relabel

Added 2026-08-18 after review: the narrowing was measured against `turns.models` on dev and disagrees in both
directions — it kept three orchestrating `statgpt-*` deployments the rollup excludes and dropped two embedding
deployments the rollup includes as billed. A name heuristic cannot decide this, so both surfaces name the
field they read.

- [x] 10.1 Rename the grid column and the header entry to **Deployments**, add `Deployments` /
      `DeploymentsHint` i18n keys stating what the field records, and drop the now-unused `Models`,
      `ModelsHint` and `DetailModel` keys.
- [x] 10.2 Render `deployments` unnarrowed in both surfaces (pills, overflow badge and keyboard-reachable full
      list unchanged), and delete `narrowToModels` with `MODEL_EXCLUDED_RESOURCE_PREFIXES` and
      `EMBEDDING_NAME_MARKER`, which have no callers left.
- [x] 10.3 Update the column and header specs for the unnarrowed set and the new labels; delete
      `conversation-models.spec.ts` with its subject.

## 11. Review findings

- [x] 11.1 Guard the detail route's schema read with `.catch`, so a rejected read costs the optional columns
      rather than the page, and test both the `success: false` and the rejected path (design §14).
- [x] 11.2 Intersect `visibleFields` unconditionally in `conversationSelect` — with no schema it now drops
      them, matching the floor, so a stale stored column state cannot name a field the instance lacks.
- [x] 11.3 Add the parallelism test task 7.7 claimed: the feedback and turn reads are issued before the
      schema resolves, and only the conversation query awaits it.
- [x] 11.4 Reconcile design §4 and task 4.2 with the shipped Deployments behaviour, and correct §9's
      documented `availableSelectFields` signature.

## 8. Verification

- [x] 8.1 Verify the browser-observable scenarios that a **non-provisioned** instance can show: both pages
      render, the insight columns are omitted rather than offered empty, Rating survives, projection follows
      visibility for the token and cost columns, `traces` renders, Region is gone, the successful-request
      label is restated, the Deployments column and header entry name the field and render it unnarrowed, and
      the timeline reports a failed turn read. Conclusion supportable from this run: "safe to deploy against a
      non-provisioned instance", not "works". See proposal — Verification status.
- [ ] 8.2 BLOCKED on provisioning: re-run against an instance carrying the `conversation_insights` enrichment
      and the `turns` rollup, covering the scenarios no degradation path can show — an insight title
      rendering in the header and the grid, the six insight columns appearing with values, and the timeline
      reading `turns` rows in `first_request_time` order with its clipped-list disclosure and a working trace
      drawer.

## 9. Quality gate

- [x] 9.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; fix everything they
      report.
