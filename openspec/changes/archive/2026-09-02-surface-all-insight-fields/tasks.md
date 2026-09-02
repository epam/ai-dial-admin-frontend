No browser-verification task is included: the user declined one for this change. The scenarios are covered
by the component and unit tests in section 5.

## 1. The schema-derived insight descriptor

- [x] 1.1 Add `ConversationInsightField` — `{ name, label, hint?, type }` — to
      `src/models/analytics/conversations-trace.ts`, and `INSIGHTS_ENRICHMENT = 'session_insights'` to
      `src/constants/analytics/conversations-trace.ts`, reusing it as the key of `ENRICHMENT_PROVENANCE`
      so the namespace is named once.
- [x] 1.2 Add `insightColumnsOf(fields?: AnalyticsEntityField[]): ConversationInsightField[]` to
      `src/utils/analytics/conversation-insights.ts`: keep fields whose name is in the enrichment namespace,
      drop `AnalyticsFieldType.Object` and `.Array` (reuse `NON_SCALAR_FIELD_TYPES`), take `label` from
      `columnHeaderName` and `hint` from `description`, preserve the schema's order.
- [x] 1.3 Rewrite `conversationInsightsState` to decide over the descriptor list rather than
      `session_insights.title`: no descriptor's key present on the row → `EnrichmentUnavailable`; every
      descriptor's value null or blank → `NotEvaluated`; otherwise `Available`.

## 2. The single-conversation query

- [x] 2.1 Change `buildConversationDetailQuery` in `src/utils/analytics/conversations-queries.ts` to take
      `schemaFields?: AnalyticsEntityField[]`, and select the curated set from `availableSelectFields` union
      the names from `insightColumnsOf`, deduplicated and order-stable.
- [x] 2.2 Change `getConversationDetail` in `src/app/[lang]/conversations-trace/actions.ts` to pass the
      schema's fields through instead of their names.
- [x] 2.3 In `src/app/[lang]/conversations-trace/[id]/page.tsx`, resolve `insightColumnsOf` once from the
      already-fetched schema and pass it to `ConversationDetailView`. A failed schema read leaves it empty,
      which the existing absence statement already covers.

## 3. Threading the descriptors to the rail

- [x] 3.1 Add the `insightColumns` prop to `ConversationDetailView`, `ConversationDetailBody` and
      `ConversationDetailRail`, alongside the props those components already forward. Do not rebuild the
      array inside a client component — `ConversationDetailRail` is memoized on prop identity.

## 4. The insights panel

- [x] 4.1 Rewrite `ConversationInsightsPanel` to render from `{ conversation, columns }`: the summary as
      prose with no label, every other descriptor as a labelled value row in schema order, the title
      excluded, and a descriptor the record carries no value for omitted entirely.
- [x] 4.2 Render values in full, wrapping — no ellipsis clamp — since no insight field is length-bounded.
      Format by declared type: `Timestamp`/`Date` through `formatDateTimeToLocalString`, `Enum` through
      `readableWords`, everything else as recorded.
- [x] 4.3 Offer each descriptor's `hint` through the existing `FieldCaveat`, so the schema's description is
      keyboard-reachable rather than a `title` attribute.
- [x] 4.4 Delete what the panel no longer uses: `CONVERSATION_INSIGHT_FIELDS`, `DETAIL_INSIGHT_FIELDS` as a
      panel input (it stays in `OPTIONAL_DETAIL_SELECT_FIELDS`), `resolveInsightFields`,
      `ResolvedInsightFields`, `sentimentBadgeClass`, `resolutionBadgeClass`, `SENTIMENT_BADGE_CLASS`,
      `RESOLUTION_BADGE_CLASS` and `INSIGHT_BADGE_NEUTRAL_CLASS`.
- [x] 4.5 Remove the eight now-unused label keys from `ConversationsTraceI18nKey` and `src/locales/en.ts`
      (`DetailSummary`, `DetailSentiment`, `DetailResolutionStatus`, `DetailTopic`, `DetailTopics`,
      `DetailLanguage`, `DetailActivityType`, `DetailActivitySubTaskType`), after confirming no other
      caller reads them.

## 5. Tests

- [x] 5.1 Unit-test `insightColumnsOf` and the new `conversationInsightsState` in
      `src/utils/analytics/tests/conversation-insights.spec.ts`: namespace filtering, non-scalar exclusion,
      label and hint from the schema, label fallback with no display name, and the three states.
- [x] 5.2 Extend `src/utils/analytics/tests/conversation-detail-queries.spec.ts`: a namespace column the
      frontend does not enumerate is named, a non-scalar one is not, and a schema reporting no insight
      column still yields a valid query.
- [x] 5.3 Rewrite `ConversationInsightsPanel.spec.tsx` against the descriptor shape — a field the frontend
      has never heard of renders, an enum value reads as words, a null-valued field is omitted, the summary
      renders unlabelled, and no badge renders. Assert schema-supplied labels as literal text, not as i18n
      keys.
- [x] 5.4 Update `ConversationDetailRail.spec.tsx`, `detail-actions.spec.ts` and `detail-page.spec.tsx` for
      the changed signatures and the removed label keys.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, and the full `npm run test` from `apps/ai-dial-admin/`, and
      fix what they report.

## 7. One value register across the rail's row panels

Follow-up: the rewritten insights panel introduced a second row treatment beside the metadata panel's
existing monospace-and-ruled one, so two lists of the same record's fields read as two kinds of surface.

- [x] 7.1 Add `ConversationTerm` — `{ key, label, hint?, value }` — to
      `src/models/analytics/conversations-trace.ts`, and a `ConversationTermList` component rendering the
      rail's one label-and-value register: the `dl`, the two-column row, the label with its optional
      caveat, and the wrapping right-aligned value.
- [x] 7.2 Render `ConversationInsightsPanel`'s rows through it, dropping the panel-local `InsightTerm`.
- [x] 7.3 Render `ConversationFieldRows`' `Rows` layout through it, dropping the monospace type and the
      row dividers, and rendering values in full rather than clamped to a tooltip. The `Grid` layout keeps
      its headline-figure treatment and its clamp, which `FieldValue` now takes as `isClamped`.
- [x] 7.4 Delete `ConversationFieldRows`' local `FieldHint` in favour of the identical `FieldCaveat`, so
      one control carries every caveat in the rail.
