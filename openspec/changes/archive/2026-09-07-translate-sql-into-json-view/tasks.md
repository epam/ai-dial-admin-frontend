## 1. Translate on the SQL → JSON switch

- [x] 1.1 In `src/components/Analytics/QueryBuilder/QueryBuilder.tsx`, extend `onChangeView` so that
      leaving the SQL view with an edited buffer (`isSqlView && sqlEdited`) translates once through
      `translateSqlToQuery` for both destinations, and dispatch on the destination: Builder keeps
      today's rules; JSON shows the translated body, clears the SQL buffer, and sets `jsonDiverged`
      from `isBuilderRepresentable` (hydrating the builder when the body is representable).
- [x] 1.2 On a rejected translation set `pendingView` to the requested view so the existing
      `DiscardQueryPopup` is shown for the JSON switch too.
- [x] 1.3 In `onConfirmDiscard`, seed `jsonText` from the reset builder state when `pendingView` is
      the JSON view — computed from the freshly built state object, not read back from `state` — so
      confirming opens the JSON editor on the default body for the selected source rather than empty.
- [x] 1.4 Leave the unedited path untouched: an empty or generated SQL buffer still fills the JSON
      view from builder state with no request.

## 2. Tests

- [x] 2.1 Extend `src/components/Analytics/QueryBuilder/tests/QueryBuilder.spec.tsx` with the SQL →
      JSON cases: translatable SQL shows the translated body and clears the SQL buffer; a translated
      body the builder cannot represent lands in JSON and still guards the later Builder switch; a
      rejected translation shows the confirmation popup; confirming opens JSON on the default body;
      cancelling leaves the SQL view unchanged; an unedited buffer sends no translate request.
- [x] 2.2 Assert the existing SQL → Builder behaviour is unchanged by the shared translate path
      (translatable SQL hydrates without a prompt; a rejected translation still guards).

## 3. The popup names its destination

- [x] 3.1 Split `QueryBuilderI18nKey.DiscardQueryDescription` into a Builder and a JSON variant in
      `src/constants/i18n.ts` and `src/locales/en.ts`: the Builder text stays as it is, the JSON one
      states that the SQL could not be translated into a structured query.
- [x] 3.2 Give `src/components/Analytics/QueryBuilder/Modals/DiscardQueryPopup.tsx` a `destination`
      prop typed as `QueryBuilderView` and pick the description from it, keeping the shared header;
      pass `pendingView` from `QueryBuilder.tsx`.
- [x] 3.3 Assert in `tests/QueryBuilder.spec.tsx` that the Builder switch shows the builder-worded
      description and the JSON switch the translation-worded one.

## 4. Quality checks

- [x] 4.1 Run `npx prettier --check` on the changed files, `npx eslint` on them, and the vitest suite;
      fix everything they report.

No browser-verification task: the user chose unit-test coverage only for this change.
