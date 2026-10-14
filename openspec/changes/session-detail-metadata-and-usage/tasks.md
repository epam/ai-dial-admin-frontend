## 1. Card start and cache hit (PR 1)

- [x] 1.1 In `components/Analytics/SessionsTrace/Detail/SessionTraceList.tsx`, state a card's start with `formatDateTimeToLocalString` instead of `formatTimeToLocalString`; keep the unavailable marker for a missing start
- [x] 1.2 Add `CachedPromptTokens = 'cached_prompt_tokens'` to `SessionsField` in `models/analytics/sessions-trace.ts` and to `SessionDetailRow`; add it to `OPTIONAL_DETAIL_SELECT_FIELDS` in `constants/analytics/sessions-trace.ts`
- [x] 1.3 Add a cache-hit field format to `SessionFieldFormat` and resolve it in `utils/analytics/session-detail-fields.ts`: `cached_prompt_tokens / prompt_tokens` as a percentage, unavailable when either is null or the prompt count is not positive, exact `0%` for a reported zero
- [x] 1.4 In `SESSION_DETAIL_PANELS`, replace the Total tokens field with Cache hit; add its label, hint and caveat keys to `locales/en.ts` and `constants/i18n.ts`; the hint states that prompt tokens are summed over every hop
- [x] 1.5 Unit tests: card start with date on different days and with no start; cache-hit resolver (share, reported zero, null cached, zero prompt, column absent); Usage panel renders Cache hit and no total

## 2. Schema-grouped metadata (PR 2)

- [x] 2.1 Extract the schema-to-groups derivation from `spanFields()` in `utils/analytics/session-column-catalog.ts` into a shared function; keep `spanFields()` behaviour and its base-list fallback unchanged; add `sessionFields()` over it for the `sessions` entity
- [x] 2.2 Change `buildSessionDetailQuery` in `utils/analytics/sessions-queries.ts` to project the curated list plus the columns `sessionFields()` reads beyond it (never heavy, except the trace ids; a sensitive column only where the schema reports it), falling back to the required set on a failed schema read
- [x] 2.3 Leave out of the groups only the insight columns; state a column the Usage panel shows in headline form exactly in its group, and a reported zero as zero
- [x] 2.4 Widen the row type of `SpanFieldsSection` and `SpanGroupPanel` to any record and add an optional `isRecord` (copy control, and a reported zero is a value) and a map of the column each closed group previews, with the caller group previewing the user name; resolve the groups on the server and thread `metadataGroups` page → view → body → rail; render them with `SpanFieldsSection` inside the Metadata panel (`SessionDetailPanel` with `isFramed={false}`), with `SESSION_FIELD_LABEL_KEY` giving the former Metadata rows their labels, and the unreadable-schema text where no group exists
- [x] 2.5 Remove the curated Metadata rows: their fields (session id, user, project, first activity, successful turns, trace ids, deployments) are stated in their groups, `traces` read despite being heavy
- [x] 2.6 Unit tests for the shared derivation (heavy and unreadable skipped, tag order, untagged fallback), the span rail still receiving the same groups, the detail query projection and fallback, and the groups' deduplication and role-withheld fields

## 3. Copy and JSON (PR 3)

- [x] 3.1 Add a copy control to every group row: `copyText` on `SpanFactRow` using `Common/CopyButton`, full formatted value, list values joined with a comma and a space, no control on a row with no value, enabled only for the session's panel
- [x] 3.2 Add an Open JSON control to the Metadata panel that opens `ViewerContentType.Json` with the whole `SessionDetailRow`, as `SessionSpanDetail.tsx` does for a span; add its i18n keys
- [x] 3.3 Unit tests: copy writes the full value and announces; list value format; unavailable row has no control; the dump holds omitted fields, uses published column names, adds no key, and issues no read

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill against this change's scenarios (card date and time, Cache hit, grouped Metadata, copy, JSON dump) on the local app with auth disabled; resolve every `fail` verdict before the change is complete

## 5. Documentation and final checks

- [x] 5.1 Update `docs/` where a page describes the session detail panels, if one does
- [x] 5.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`
