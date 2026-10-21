## Why

The `conversation_insights` enrichment carries eight fields describing what a conversation was about and
how it went — title, summary, sentiment, sentiment score, topic, topics, language and resolution status.
The conversations grid already offers every one of them, because its columns are derived from whatever the
entity schema reports. The **detail page reads three**: `title` (the heading), `topics` (fetched but rendered
nowhere) and `truncated` (the heading's caveat). So a reader who opens a conversation to understand it gets
the transcript and a title, while the evaluator's own reading of that conversation — was the user satisfied,
was the request resolved, what was it about — sits unread in a schema the page already queries.

Measured on the dev instance: 1 432 of 6 706 conversations carry an insight row, and every one of the eight
fields is populated together for all 1 432. The data is present, not pending.

## What Changes

- The conversation detail query names the five insight fields it does not name today — `summary`,
  `sentiment`, `sentiment_score`, `topic`, `language`, `resolution_status` — as **optional** fields, gated on
  the fetched entity schema the same way `topics` and `truncated` already are. Naming a field the instance
  does not carry makes the service reject the whole query, so the gate is not optional.
- A new **Insights panel** in the conversation detail rail, rendered first, presenting the enrichment's six
  descriptive fields: the summary as prose, sentiment and resolution status as badges, topic and topics, and
  language. `title` stays the heading and is not repeated.
- The panel renders **only when the conversation carries an insight row**. Where it does not — four
  conversations in five on the dev instance — a single line states that the conversation has not been
  evaluated, rather than a panel of six unavailable markers.
- The panel's monospace source identifier reads `conversations`, while its icon takes the **insight**
  provenance colour. `PanelProvenance` currently excludes `ColumnProvenance.Insights`, so the model cannot
  express that pairing today; the panel's catalog identifier and its provenance colour become two fields
  rather than one.
- Sentiment and resolution status render as badges over a frontend-held colour map keyed on the evaluator's
  vocabulary, with a neutral fallback for an unrecognised value.

Non-goals:

- No change to the conversations grid. All eight fields are already offered there as schema-derived columns,
  and the default visible set stays as it is.
- No value-list filter for sentiment or resolution status. The decision not to hold a copy of the evaluator's
  enumeration **for filtering** stands: an unrecognised filter value breaks a query, where an unrecognised
  badge value degrades to a neutral chip.
- No new query. The five fields ride the conversation read that already runs.

## Capabilities

### New Capabilities

None. The detail page's panels are already specified.

### Modified Capabilities

- `analytics`: the conversation detail side panels requirement gains the Insights panel, its absent-row
  state, and the rule that a panel's catalog identifier and its provenance colour are separate claims. The
  requirement covering which insight fields the detail read names is extended to the full descriptive set.

## Impact

- `apps/ai-dial-admin/src/models/analytics/conversations-trace.ts` — five `ConversationsField` members,
  five `ConversationDetailRow` fields, a `ConversationDetailPanel.Insights` member, the
  `PanelProvenance` split, a sentiment/resolution value model.
- `apps/ai-dial-admin/src/constants/analytics/conversations-trace.ts` — the new fields in
  `OPTIONAL_DETAIL_SELECT_FIELDS`, the panel definition, badge colour maps, i18n keys.
- `apps/ai-dial-admin/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailRail.tsx` —
  renders the new panel and its absent-row state; `SOURCE_LABEL` keys off the identifier rather than the
  colour.
- New component for the panel body (prose lead plus badges), alongside `ConversationFieldRows`.
- `apps/ai-dial-admin/src/locales/en.ts` and `src/constants/i18n.ts` — labels for six fields, the badge
  vocabulary, the not-evaluated line.
- No server-action signature changes; no new analytics request.
