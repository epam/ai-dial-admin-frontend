# Tasks — Adopt query-translation endpoints

> Suggested delivery: **PR 1** operators (case-insensitive contains) + server layer; **PR 2** SQL view
> seeding via `translate` (retire client-side generation); **PR 3** SQL → Builder round-trip via
> `translate-sql`. Each lands green independently.

## 1. Models, constants, i18n

- [x] 1.1 `src/models/analytics/query.ts`: add `Ico = 'ico'` and `Inc = 'inc'` to `QueryOperator` (keep
      `Co`/`Nc`); add DTOs `TranslateResponse { sql: string }` and `TranslateSqlResponse { query: StructuredQuery }`
      (reuse `SqlQueryRequest` as the translate-sql request body). No inline anonymous object types.
- [x] 1.2 `src/constants/analytics/query-builder.ts`: rebuild `OPERATOR_OPTIONS` from a `FILTER_OPERATORS`
      list that uses `Ico`/`Inc` (not `Co`/`Nc`); operators show as short uppercased codes, with the
      contains operators `ico`/`inc` displayed under the familiar `CO`/`NC` labels.
- [x] 1.3 `src/constants/analytics/sql.ts`: add `ILIKE` to `SQL_KEYWORDS`.
- [x] 1.4 i18n (`src/constants/i18n.ts` analytics enum + `src/locales/en.ts`): SQL-view "translating…"
      loading text and the translate-error message. (Operators use uppercased codes — no i18n label needed.)

## 2. Server API layer and actions

- [x] 2.1 `src/server/analytics/analytics-data-api.ts`: add `QUERIES_TRANSLATE_URL` and
      `QUERIES_TRANSLATE_SQL_URL` constants; add `translateAction(query, token)` →
      `postAction<StructuredQuery>` returning `ServerActionResponse<TranslateResponse>`, and
      `translateSqlAction(sql, token)` → `postAction<SqlQueryRequest>` returning
      `ServerActionResponse<TranslateSqlResponse>`.
- [x] 2.2 `app/[lang]/query-builder/actions.ts`: add `translateQuery(query)` and `translateSqlToQuery(sql)`
      server actions injecting the user token (mirror `executeQuery`/`executeSqlQuery`).
- [x] 2.3 Tests: `translateAction`/`translateSqlAction` target the correct URLs with the correct bodies and
      map the response envelope; actions inject the token. Extend the existing analytics-data-api /
      query-builder action specs.

## 3. Case-insensitive contains in the Filter builder

- [x] 3.1 `Filter/FilterCondition.tsx`: operator select uses the updated `OPERATOR_OPTIONS`
      (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`). Contains authoring produces `ico`/`inc`.
- [x] 3.2 Verify `serialize`/`deserialize` pass `ico`/`inc` through unchanged and still tolerate an
      incoming `co`/`nc` (no crash, round-trips through JSON). No coercion or special UI is added.
- [x] 3.3 Tests: CONTAINS authors `op: "ico"`; `OPERATOR_OPTIONS` excludes `co`/`nc`; a `co` in incoming
      JSON deserializes without error; extend serialize/deserialize specs.

## 4. SQL view seeding via `translate` (retire client-side generation)

- [x] 4.1 `QueryBuilder/context.tsx`: add `sqlLoading: boolean` and `sqlError: string | null` to state
      alongside `sqlText`.
- [x] 4.2 `QueryBuilder.tsx`: entering the SQL view (buffer empty or equal to the last generated text)
      calls `translateQuery(buildQuery(state, timeBound))`; on success seed the editor with `response.sql`
      and record it as the last generated text; on `400`/error set `sqlError` (surface via the notification
      convention) and leave the editor empty. User-edited SQL is never re-seeded.
- [x] 4.3 `Sql/SqlEditor.tsx`: render a loading affordance while `sqlLoading`.
- [x] 4.4 Delete `QueryBuilder/utils/sql-generate.ts` and remove all `sqlFromQuery` imports.
- [x] 4.5 Tests: entering the SQL view calls `translateQuery` and fills the editor from the response;
      translate `400` surfaces the error and leaves the editor empty and Run disabled; edited SQL is not
      re-seeded on re-entry; delete `utils/tests/sql-generate.spec.ts`.

## 5. SQL → Builder round-trip via `translate-sql`

- [x] 5.1 `QueryBuilder.tsx` view switching: switching SQL → Builder with an edited buffer calls
      `translateSqlToQuery(sqlText)`. On success, if `isBuilderRepresentable(query)` → `parseQuery(query)`,
      hydrate builder state, clear `sqlText`, switch (no popup). If not representable, or on `400`/error →
      open `DiscardQueryPopup` (existing fallback). Empty/unedited-generated buffer still switches silently.
- [x] 5.2 Confirm the `DiscardQueryPopup` copy still reads correctly for the "SQL couldn't be translated"
      case (query dropped, builder reset); reuse as-is if so.
- [x] 5.3 Tests: success+representable hydrates the builder with no popup and the builder reflects the SQL;
      success+unrepresentable opens the popup; `400` opens the popup; confirm resets builder to defaults and
      switches; cancel stays in SQL with text intact; empty/unedited buffer switches silently.

## 6. Autocomplete

- [x] 6.1 Confirm `ILIKE` appears in SQL completion suggestions (driven by the `SQL_KEYWORDS` addition);
      add/extend the autocomplete test.

## 7. Quality checks

- [x] 7.1 Run lint (`npm run lint`), format check (`npm run format`), and the full test suite
      (`npm run test` from `apps/ai-dial-admin/`); fix any failures.
- [ ] 7.2 (Optional, not run) Browser-verify the SQL↔Builder round-trip via `spec-browser-verify`
      against the live app — deferred; coverage relies on the unit/component tests above.
