Group 1 ships on its own and needs no service change — it is the Deployments filter. Groups 2–3 are the
enum filter, which stays dormant until the analytics service reports the `enum` field type.

No browser-verification task is included: the change has browser-observable scenarios, so the question was
asked, and the user chose unit tests only.

## 1. Deployments filter

- [x] 1.1 Add a query builder in `src/utils/analytics/conversations-queries.ts` that resolves deployment
      names from `dial_usage_log`'s scalar `deployment` column by the entered text, grouped and scoped to
      the view's period. No cap — see design.md.
- [x] 1.2 Add a query builder for the listing predicate calling `array_has_any` over `deployments`, and
      `array_has` for the equals operator. The `fn` expression form is what the service accepts; the
      comparison operators reject an array operand.
- [x] 1.3 Have the conversations list server action in `src/app/[lang]/conversations-trace/actions.ts`
      resolve names and then filter within the one call, so the two-step shape does not reach the client.
      A contains filter whose resolution returns nothing must narrow the result to nothing rather than be
      dropped.
- [x] 1.4 Drop `filter: false` from the Deployments column in
      `src/constants/grid-columns/grid-columns.tsx`, keep `sortable: false`, and replace the comment —
      it records a conclusion about the query language that is not correct.
- [x] 1.5 Add `deployments` to `CONVERSATION_FIELD_VALUE_TYPE`
      (`src/constants/analytics/conversations-trace.ts`), which has no entry for it today.

## 2. Enum type, operator and value discovery

- [x] 2.1 Add `Enum` to `AnalyticsFieldType` in `src/models/analytics/entity.ts` and fix the exhaustive
      switches over it that the compiler reports across the analytics views.
- [x] 2.2 Add a set-membership member to `ConversationFilterOperator`
      (`src/models/analytics/conversations-trace.ts`) and map it to the existing `QueryOperator.In` in
      `CONVERSATION_FILTER_QUERY_OPERATOR` (`src/constants/analytics/conversations-trace.ts`).
- [x] 2.3 Widen `GridColumnFilter` in `src/utils/analytics/conversation-grid-models.ts` with an optional
      selected-values list and return a set-membership filter from `toColumnFilter` when it is present and
      non-empty; an empty list must fall through to the existing `null` return. Build the predicate with
      the existing `inValues()`.
- [x] 2.4 Add a grouped-count query builder for one field, ordered by count descending, whose filter
      carries the period, search, feedback and every **other** column's predicate but not the opened
      column's own — the facet rule in design.md. Expose it as a server action.

## 3. The value filter control

- [x] 3.1 Register `CustomFilterModule` in `ModuleRegistry.registerModules`
      (`src/components/Grid/AgGridWrapper.tsx`).
- [x] 3.2 Write the filter component under `src/components/Analytics/ConversationsTrace/`, rendering the
      design system's `Checkbox` per value with its count and driving AG Grid's filter lifecycle from the
      selection. It must render distinct loading, empty and failed states and contribute no predicate in
      any of them.
- [x] 3.3 Give it the accessibility the project's rules require: each option's accessible name carries the
      value and its count, the list is a group named for the column, and the transient states are announced
      through a live region rather than shown only visually.
- [x] 3.4 Add the enum branch to `typeColumn` in `src/utils/analytics/conversation-column-catalog.ts` so
      every column of an enum-typed field binds the filter.
- [x] 3.5 Add the i18n keys for the control's labels and states to `src/locales/en.ts` under the
      conversations-trace key group.

## 4. Tests

- [x] 4.1 Unit-test the deployments query builders: the name resolution groups and scopes to the period,
      the listing predicate uses `array_has_any` for contains and `array_has` for equals, and an empty
      resolution yields a predicate matching nothing rather than no predicate.
- [x] 4.2 Unit-test the filter-model translation in
      `src/utils/analytics/tests/conversation-grid-models.spec.ts`: a selected list becomes one
      set-membership filter, an empty list contributes nothing, and text filters are unaffected.
- [x] 4.3 Unit-test the grouped-count builder: it groups by the field, orders by count descending, carries
      the page's other predicates and omits the opened column's own.
- [x] 4.4 Unit-test `typeColumn`'s enum branch in
      `src/utils/analytics/tests/conversation-column-catalog.spec.ts`: an enum field binds the value
      filter, and timestamp and boolean fields still bind none.
- [x] 4.5 Component-test the filter control: values render with counts, selection drives the model, the
      loading, empty and failed states each render and contribute no predicate, and the options are
      reachable by role and accessible name.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format` and `npm run test` from the workspace root, and resolve
      everything they report.
