## 1. Model the type

- [x] 1.1 Add `Map = 'map'` to `AnalyticsFieldType` (`src/models/analytics/entity.ts`), declared after `Array`, and rewrite the picker-order comment to cover two types past the ten-row fold
- [x] 1.2 Update the `COLUMN_TYPE_OPTIONS` comment in `src/constants/analytics/tables.ts` (map is no longer absent) and subtract `Map` explicitly from `ELEMENT_TYPE_OPTIONS`; update the `element_type` comment in `src/models/analytics/table.ts`
- [x] 1.3 Give Map a colour (`text-accent-primary`) in `src/components/Analytics/Common/TypeBadge.tsx`
- [x] 1.4 Add Map to `NON_SCALAR_FIELD_TYPES` in `src/constants/analytics/sessions-trace.ts`

## 2. Tables editors

- [x] 2.1 In `src/components/Analytics/Tables/utils.ts`: add Map to `isNullableLockedType`; exclude Map in `isKeyableRow` and `getGrainKeyColumnNames`, and Array, Object and Map in `getIdentityColumnNames` (all three are refused as a scan cursor); return `{}` for Map in `templateValueFor`
- [x] 2.2 Connect panel: widen `SnippetValue` to `Record<string, string>` (`ConnectPanel/models.ts`), add the Map sample `{ key: 'value' }` to `ANALYTICS_FIELD_TYPE_SAMPLE`, and make `toPythonValue` / `toJsonValue` in `connect-snippets.ts` serialise object entries (an empty object still prints `{}`)
- [x] 2.3 Add `ConnectFormatRule.Map` with its `FORMAT_RULE` entry and `CONNECT_FORMAT_RULE_ORDER` position after Array, wire it in `ConnectWriteTab.tsx`, and add the `ConnectFormatMap` key to `src/constants/i18n.ts` and `src/locales/en.ts`

## 3. Query Builder

- [x] 3.1 Add `comparableFieldOptions(options, kept)` (drops `map` fields unless already named by the row being edited) in `src/components/Analytics/QueryBuilder/utils/fields.ts` and apply it to the Filter left-operand column options, the plain Group by column options and `sortFieldOptions`; leave the row-mode Select and function-argument option lists unfiltered
- [x] 3.2 Update the type list in the `FIELD_TYPE_VALUE_CLASS` comment (`src/constants/analytics/query-builder.ts`)

## 4. Tests

- [x] 4.1 `components/Analytics/Tables/tests/utils.spec.ts`: Map nullable lock, exclusion from ordering key / grain key / identity options, key selection cleared on retype to Map, `{}` template value, `ELEMENT_TYPE_OPTIONS` without Map
- [x] 4.2 `components/Analytics/Tables/tests/connect-snippets.spec.ts` and `ConnectPanel.spec.tsx`: Map literal in Python, JSON and shell snippets, unchanged `{}` for an object column, Map format guidance named against the column
- [x] 4.3 `components/Analytics/Tables/tests/ColumnRowsEditor.spec.tsx`: Map offered last in the type picker, Nullable disabled and forced off on retype to Map, no element-type control
- [x] 4.4 Query Builder specs (`QueryBuilder/utils` and `Filter/tests/FilterCondition.spec.tsx`, `Sort`, `Aggregate/tests`): a map field absent from Filter operand, Group by column and Sort key options, present in row-mode Select and in a function argument dropdown
- [x] 4.5 `utils/analytics/tests/session-column-catalog.spec.ts` and `session-insights.spec.ts`: a map field is not offered as a derived column / not selected as an insight column

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for `analytics-map-column-type` against the local stack (auth disabled) and resolve every `fail` verdict

## 6. Quality gates

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass
