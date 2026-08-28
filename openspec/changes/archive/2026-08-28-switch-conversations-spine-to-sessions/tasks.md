## 1. Repoint the entity and its identity field

- [x] 1.1 Set `CONVERSATIONS_ENTITY` to `sessions` in
      `src/constants/analytics/conversations-trace.ts`.
- [x] 1.2 Set `ConversationsField.ChatId` to `client_session_id` in
      `src/models/analytics/conversations-trace.ts`, keeping the symbol name (design D1).
- [x] 1.3 Rename the `chat_id` property on `ConversationRow` (and the two other interfaces declaring it) to
      `client_session_id`, then fix the three literal reads the enum does not cover:
      `conversations-trace/actions.ts` and both lookups in `src/utils/analytics/conversation-rows.ts`
      (design D2). Leave `conversation-trace-groups.ts` alone — task 3.2 covers it.
- [x] 1.4 Update the query-shape specs under `src/utils/analytics/tests/` that assert the entity name, the
      unconditional identity field, the sort tie-breaker and the search predicates.

## 2. Move the insight enrichment namespace

- [x] 2.1 Repoint the eight `Insight*` values of `ConversationsField` to `session_insights.*` and delete
      `InsightSentimentScore`, which `session_insights` does not expose (design D5).
- [x] 2.2 Remove `InsightSentimentScore` from `DETAIL_INSIGHT_FIELDS` and from the insights panel's field
      list, leaving the remaining fields' order unchanged.
- [x] 2.3 Rekey `ENRICHMENT_PROVENANCE` from `conversation_insights` to `session_insights`, so the insight
      columns keep their provenance colour instead of falling to the unattributed group.
- [x] 2.4 Update the column-catalog and detail-panel specs that name `conversation_insights.*` fields.

## 3. Scope the hop log per session

- [x] 3.1 Add the identity enrichment's column to `UsageLogField`, then make the six hop-log builders in
      `src/utils/analytics/conversations-queries.ts` take the predicate column from the session's
      `client_session_source`: `chat_id` for a chat-origin session, the enrichment column otherwise
      (design D3). Keep every existing time bound as it is.
- [x] 3.2 Make `hasConversationLabel` in `src/utils/analytics/conversation-trace-groups.ts` test the session
      id the query was scoped by, so an agent session's roots are not all marked Core-internal (design D4).
- [x] 3.3 Thread `client_session_source` from the loaded session row to the trace, span, hop and body
      actions in `conversations-trace/actions.ts`, without adding a query to fetch it.
- [x] 3.4 Extend the query-shape specs to cover both predicate paths and to assert that the chat path still
      names `chat_id`.

## 4. Close the loop

- [x] 4.1 Update the i18n copy that describes what the page lists and what the feedback filter narrows, so
      neither claims a rating exists for every row (`ConversationsTraceI18nKey` entries in
      `src/locales/en.ts`).
- [x] 4.2 Run `npm run lint` and the full `npm run test` from `apps/ai-dial-admin/`, and fix what the entity
      rename surfaces in unrelated specs.
