## 1. Model and query gate

- [x] 1.1 Add the descriptive insight members to `ConversationsField` in
      `src/models/analytics/conversations-trace.ts` — `InsightSummary`, `InsightSentiment`,
      `InsightSentimentScore`, `InsightTopic`, `InsightLanguage`, `InsightResolutionStatus` — each bound to
      its qualified flat name, and add the matching optional properties to `ConversationDetailRow`.
- [x] 1.2 Add the six fields to `CONVERSATION_FIELD_VALUE_TYPE` (string, except the decimal sentiment score).
- [x] 1.3 Add them to `OPTIONAL_DETAIL_SELECT_FIELDS` in `src/constants/analytics/conversations-trace.ts`,
      keeping them out of `OPTIONAL_CURATED_COLUMN_FIELDS` so the list query is unchanged. Verify the list
      query's projection does not grow.

## 2. Panel identifier / colour split

- [x] 2.1 Remove `PanelProvenance` from `src/models/analytics/conversations-trace.ts` and give
      `ConversationPanelDefinition` a separate source entity and provenance colour, per design.md —
      "Split the panel's identifier from its colour".
- [x] 2.2 Update `CONVERSATION_DETAIL_PANELS` and `CONVERSATION_SOURCE_ENTITIES` for the new shape, and
      re-key `SOURCE_LABEL` in `Detail/ConversationDetailRail.tsx` on the entity rather than the provenance.
- [x] 2.3 Add `ConversationDetailPanel.Insights` and its icon to `PANEL_ICON`.

## 3. Insights panel

- [x] 3.1 Add the vocabulary badge colour maps (sentiment, resolution status) to
      `src/constants/analytics/conversations-trace.ts` as `Record<string, string>` with a neutral fallback,
      and a pure helper that renders a service token as readable words.
- [x] 3.2 Add a `ConversationInsightsPanel` body component under
      `src/components/Analytics/ConversationsTrace/Detail/` — prose summary lead, sentiment and resolution
      badges, topic/topics, language, sentiment score — reusing `ConversationDetailPanel` for the frame.
      Badges must not be the sole carrier of a distinction (`.claude/rules/a11y.md`), and truncated text must
      stay reachable.
- [x] 3.3 Add a pure resolver for the panel's three-way presence state, keyed on the title field's
      `ConversationFieldState` per the design's table, returning: render the panel, state unevaluated, or
      state that the deployment carries no insight enrichment.
- [x] 3.4 Render the panel first in `ConversationDetailRail`, with the two absent states rendered in its
      place as text.
- [x] 3.5 Add the i18n keys to `src/constants/i18n.ts` and strings to `src/locales/en.ts` — panel title, six
      field labels, the unevaluated line, the no-enrichment line.

## 4. Tests

- [x] 4.1 Unit-test the detail query builder: all descriptive insight fields named when the schema reports
      them; a field the schema omits not named while the rest are; none named when the schema reports no
      insight column.
- [x] 4.2 Unit-test the presence resolver over all three title-field states, and the readable-words helper
      including a value with no colour entry.
- [x] 4.3 Component-test `ConversationInsightsPanel`: fields render; a `partially_resolved` value renders as
      readable words; an unrecognised sentiment renders a neutral badge carrying its text.
- [x] 4.4 Component-test the rail: the panel renders first and its identifier reads `conversations` while its
      icon carries the insight colour; an unevaluated conversation renders the statement and no insight field
      as an unavailable marker; an instance with no enrichment renders the distinct statement.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and resolve
      everything they report.

**No browser-verification task.** Several scenarios here are browser-observable, so the question was put to
the user, who chose to rely on unit and component tests for this change. Recorded so a later reader does not
read the omission as an oversight.
