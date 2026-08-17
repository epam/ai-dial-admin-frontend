## 1. Field and query plumbing

- [x] 1.1 Add `Deployments = 'deployments'` to `ConversationsField` in
      `src/models/analytics/conversations-trace.ts` (`DurationMs` and `AvgDurationMs` already exist)
- [x] 1.2 Add `duration_ms` and `deployments` to `CURATED_SELECT_FIELDS` in
      `src/utils/analytics/conversations-queries.ts`, so both are projected by the first list query
- [x] 1.3 Add `ConversationsField.DurationMs` to `SORTABLE_CONVERSATION_FIELDS` and
      `FILTERABLE_CONVERSATION_FIELDS`, and map it to `QueryValueType.Long` in
      `CONVERSATION_FIELD_VALUE_TYPE` (`src/constants/analytics/conversations-trace.ts`)
- [x] 1.4 Add both fields to the `ColumnProvenance.Conversations` entry of
      `CONVERSATION_PROVENANCE_GROUPS`, and add `deployments` to `CURATED_COMPOSED_FIELDS` so the catalog
      does not offer it a second time

## 2. Formatting and narrowing utils

- [x] 2.1 Add a duration formatter to `src/utils/analytics/conversation-formatting.ts`: milliseconds to
      seconds, or minutes and seconds past a minute, returning `UNAVAILABLE_VALUE` for `0` and for
      null/undefined
- [x] 2.2 Add a pure `src/utils/analytics/conversation-models.ts` exporting the narrowing helper — excludes
      `applications/` and `toolsets/` resource paths, embedding deployments, and any value containing another
      value of the same array as a substring; returns the unnarrowed array when narrowing empties it
- [x] 2.3 Unit-test the duration formatter: sub-minute, multi-minute, `0` to marker, null to marker
- [x] 2.4 Unit-test the narrowing helper against the shapes measured in design.md — substring-wrapped router
      (`dial-chathub-v2-gemini-3.1-pro-preview` over `gemini-3.1-pro-preview`), undetectable orchestrator
      (`anthropic_switchyard-model`) which must survive, application-only fallback, toolset path, embedding
      deployment, and a single plain model left untouched

## 3. Grid columns

- [x] 3.1 Add the Duration column to `BASE_CONVERSATIONS_TRACE_COLUMNS` in
      `src/constants/grid-columns/grid-columns.tsx` using `numericColumn` and the new formatter
- [x] 3.2 Add the Models column to the same list: `TagsCellRenderer` with `cellRendererParams` calling the
      narrowing helper, `tooltipValueGetter` returning the complete unnarrowed list, and explicit
      `sortable: false` / `filter: false`
- [x] 3.3 Make the overflowed values reachable by keyboard per `.claude/rules/a11y.md` — the pill row's full
      list must not be pointer-only
- [x] 3.4 Add the two column headers and their header tooltips to `ConversationsTraceI18nKey`
      (`src/constants/i18n.ts`) and `src/locales/en.ts`

## 4. Detail panel

- [x] 4.1 Bind the Metadata card's dangling `DetailDeployment` row to `ConversationsField.Deployments` in
      `CONVERSATION_DETAIL_PANELS`, with a field format that renders the array
- [x] 4.2 Apply the same zero-to-marker rule to the Usage card's Duration and Avg duration rows, so the
      panel and the grid state the same thing about the same conversation

## 5. Corrections found while specifying

- [x] 5.1 Fix the `TurnsHint` copy in `src/locales/en.ts` — the rollup now counts distinct trace ids, so
      "including embedding, MCP and routing calls" is no longer true; describe it as requests

## 6. Tests

- [x] 6.1 Extend `src/utils/analytics/tests/conversations-queries.spec.ts` to assert the select names
      `duration_ms` and `deployments`, and that a sort key or column filter naming `deployments` is rejected
- [x] 6.2 Extend `src/constants/grid-columns/tests/conversations-trace-columns.spec.ts` for the two new
      columns: both present in the curated set, Models offering neither sort nor filter, Duration carrying a
      number filter

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and resolve anything
      they report
