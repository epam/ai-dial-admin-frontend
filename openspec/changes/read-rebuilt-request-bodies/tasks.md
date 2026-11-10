## 1. Schema contract

- [x] 1.1 Add `projection_only?: boolean` to `AnalyticsEntityField` in `src/models/analytics/entity.ts`
- [x] 1.2 Add `isProjectionOnly(field)` to the analytics schema utils (`src/utils/analytics/`), with unit tests for `true`, `false` and an absent flag

## 2. Hop inspector request side

- [x] 2.1 Add `UsageLogField.RequestBodyFull` and `UsageLogField.RequestBodyRebuild`, and a `RequestBodyRebuildStatus` enum (`stored`, `rebuilt`, `partial`, `resolvable`), in `src/models/analytics/sessions-trace.ts`
- [x] 2.2 Make `hopBodyFields` in `src/utils/analytics/session-column-catalog.ts` resolve `request_body_full` before `request_body`, return the status column's name when reported, and grant the request side on either column; cover both instance shapes and the non-admin schema in unit tests
- [x] 2.3 Make `readHopBody` in `src/app/[lang]/sessions/actions.ts` select the resolved request column and the status, and map the row so every request tier decodes one field regardless of which column fed it
- [x] 2.4 Carry `isPartial` on `HopRequestEnvelope` and `HopRawBody` (`src/utils/analytics/hop-inspector/envelope.ts`), derived from the status; an unknown or `NULL` status yields `false`
- [x] 2.5 Render the incomplete statement on the Request tab, the Chat tab and in the request raw view under `components/Analytics/SessionsTrace/Detail/Inspector/`, next to `HopClampNote`, associated through `aria-describedby`; add its i18n key to the sessions-trace group and `src/locales/en.ts`
- [x] 2.6 Unit tests: actions select `request_body_full` + status only when the schema reports them; envelope and message tiers number the same messages; `partial` renders messages plus the statement and no error; `stored`/`rebuilt` render no statement

## 3. Query Builder pickers

- [x] 3.1 Exclude projection-only fields from every non-Select position in `components/Analytics/QueryBuilder/utils/fields.ts` (filter operand, group-by, sort, having, aggregate operand, function arguments), leaving `comparableFieldOptions`'s map rule as is
- [x] 3.2 Leave SQL completions unchanged: they are not clause-aware, and a projection-only field is legal in the select list (spec delta updated)
- [x] 3.3 Unit tests for 3.1, including a map field that stays a function argument and a projection-only field that does not

## 4. Pipeline editors

- [x] 4.1 Exclude projection-only fields from the source-field options of `Filter/FilterConditionRow.tsx`, `Aggregate/GroupKeysEditor.tsx`, `Aggregate/MeasuresEditor.tsx`, `Enrich/OrderByEditor.tsx`, `Enrich/MemberSelectEditor.tsx` and `Enrich/VariablesEditor.tsx`, next to the existing type rules; an already-authored value stays shown
- [x] 4.2 Unit tests for each editor's option list with a projection-only field in the source schema

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled) backed by a local ADAS built from the `request-body-rebuild` branch with `SYNC_REQUEST_BODY_MODE=delta`, covering the browser-observable scenarios of the three deltas; resolve every `fail` verdict before the change is complete

## 6. Quality gates

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and fix every failure
