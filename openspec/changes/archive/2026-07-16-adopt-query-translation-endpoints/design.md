# Design — Adopt query-translation endpoints

Reference: backend change `query-translation-endpoints` (analytics-data-access-service). Both endpoints
are validation-only, reuse the execute-path rules (shared `StructuredQueryBuilder` pass), and never
contact ClickHouse. The two directions are round-trip coherent.

## 1. Endpoint contracts (as consumed by the frontend)

| Direction | Endpoint | Request body | Success body | `400` when |
|---|---|---|---|---|
| DSL → SQL | `POST /v1/queries/translate` | the `StructuredQuery` (same shape `execute` accepts) | `{ "sql": string }` | DSL not expressible in the SQL subset: `contains` value with `%`/`_`, null literal outside `eq`/`ne`, `include_total`, row-mode `having`, aggregate-mode `distinct`, bare projection containing object/array columns |
| SQL → DSL | `POST /v1/queries/translate-sql` | `{ "sql": string }` | `{ "query": StructuredQuery }` (accepted verbatim by `execute`) | SQL parse/validation failure or unsupported construct (join, CTE, subquery, arithmetic, `CAST`, over-max `LIMIT`) |

Both go through `postAction`, returning the standard `ServerActionResponse` envelope so failures surface
via the app's error-notification convention (same as `execute`/`execute-sql`).

## 2. Server layer

`src/server/analytics/analytics-data-api.ts`:

```
export const QUERIES_TRANSLATE_URL     = `${QUERIES_URL}/translate`;      // v1/queries/translate
export const QUERIES_TRANSLATE_SQL_URL = `${QUERIES_URL}/translate-sql`;  // v1/queries/translate-sql

translateAction(query: StructuredQuery, token): Promise<ServerActionResponse<TranslateResponse>>
  → postAction<StructuredQuery>(QUERIES_TRANSLATE_URL, query, token)

translateSqlAction(sql: string, token): Promise<ServerActionResponse<TranslateSqlResponse>>
  → postAction<SqlQueryRequest>(QUERIES_TRANSLATE_SQL_URL, { sql }, token)
```

`app/[lang]/query-builder/actions.ts`: `translateQuery(query)` and `translateSqlToQuery(sql)`, each
injecting the user token via `getUserToken(...)` exactly like `executeQuery`/`executeSqlQuery`.

DTOs in `models/analytics/query.ts` (co-located with `SqlQueryRequest`/`StructuredQuery`):

```
export interface TranslateResponse    { sql: string; }             // POST /v1/queries/translate
export interface TranslateSqlRequest  { sql: string; }             // reuse SqlQueryRequest shape
export interface TranslateSqlResponse { query: StructuredQuery; }  // POST /v1/queries/translate-sql
```

(`TranslateSqlRequest` is structurally identical to `SqlQueryRequest`; the method reuses `SqlQueryRequest`
as the post body type. A named response interface is added for each so callers stay typed.)

## 3. Operators — case-insensitive contains

- `QueryOperator` (`models/analytics/query.ts`) gains `Ico = 'ico'` and `Inc = 'inc'`. `Co`/`Nc` **stay**
  in the enum — the deserializer and JSON view must not choke on a `co`/`nc` that arrives from a
  JSON-authored query or from `translate-sql` (which renders SQL `LIKE` as `co`).
- `constants/analytics/query-builder.ts` `OPERATOR_OPTIONS`: build the contains entries from `Ico`/`Inc`
  instead of `Co`/`Nc`. Because the option labels are currently just uppercased codes, add explicit i18n
  labels so the dropdown reads **CONTAINS** (`ico`) / **NOT CONTAINS** (`inc`) rather than "ICO"/"INC".
  Non-contains operators (`eq`, `ne`, `lt`, `gt`, `le`, `ge`, `in`) are unchanged.
- Serialization needs no special-casing: operators serialize as their raw enum-value string, so `ico`/`inc`
  flow through `serialize`/`deserialize` unchanged. The `%…%` wrapping in the old client-side generator is
  now the backend's job (via `translate`), so no client mapping is added.
- `constants/analytics/sql.ts`: add `ILIKE` to `SQL_KEYWORDS` so the autocomplete offers it alongside
  `LIKE`.

> Out of scope (per the proposal's non-goals): no dedicated UI for a `co`/`nc` value that lands in the
> builder. It renders as whatever the operator select does with an unlisted value; we neither relabel nor
> coerce it.

## 4. SQL view seeding via `translate` (DSL → SQL)

Today (retired): entering the SQL view calls the synchronous `sqlFromQuery(state)` to seed the buffer.

New flow — the seed is asynchronous and backend-authoritative:

```
enter SQL view (buffer empty or == last generated text)
        │
        ├─ set sqlLoading = true
        ├─ translateQuery(buildQuery(state, timeBound))
        │       success → seed editor with response.sql, record it as "last generated text"
        │       400/error → surface backend message, leave editor empty (Run stays disabled)
        └─ set sqlLoading = false
```

- Context state (`QueryBuilder/context.tsx`) gains `sqlLoading: boolean` and `sqlError: string | null`
  alongside the existing `sqlText`. The SQL editor shows a loading affordance while `sqlLoading`.
- User-edited SQL is still never overwritten by a re-seed (unchanged rule): seeding only runs when the
  buffer is empty or equals the last generated text.
- `utils/sql-generate.ts` and its spec are deleted; all imports of `sqlFromQuery` are removed.
- The toolbar time bound is already folded into `buildQuery(state, timeBound)`; the translated SQL
  therefore carries the same visible time predicates, preserving today's behavior.

## 5. SQL → Builder round-trip via `translate-sql`

The existing guard (`DiscardQueryPopup`) is preserved but demoted to a fallback. Switching **from SQL to
the Builder view**:

```
switch SQL → Builder
        │
        ├─ empty / unedited-generated buffer ──────────────▶ switch silently (unchanged)
        │
        └─ edited buffer:
             translateSqlToQuery(sqlText)
                 ├─ success:
                 │     isBuilderRepresentable(query) ?
                 │        yes → parseQuery(query) → hydrate builder state, clear sqlText, switch
                 │        no  → DiscardQueryPopup (query nests deeper than 2 levels, etc.)
                 └─ 400 / error → DiscardQueryPopup (unsupported SQL construct)
```

- On the success+representable path there is **no confirmation** — the query is preserved, not discarded.
  This is the core UX win and the reason `translate-sql` is worth adopting.
- `isBuilderRepresentable` and `parseQuery` already exist (`utils/deserialize.ts`); the returned DSL is
  fed straight into them. The two-level nesting rule is unchanged.
- The JSON view path is unchanged (it already round-trips representable JSON locally); only the SQL view
  gains a backend translation step.
- `DiscardQueryPopup` copy is unchanged; it now also covers the "SQL couldn't be translated" case, which
  reads the same to the user (their SQL can't be shown in the builder → dropping it resets the builder).

State machine for the SQL→Builder transition:

```
        translate-sql 200 + representable        translate-sql 200 + NOT representable
 SQL ──────────────────────────────────▶ Builder        │            translate-sql 400
  │            (hydrated, no prompt)                     ▼                    │
  │                                            DiscardQueryPopup ◀────────────┘
  │                                             confirm → reset builder + switch
  └────────────────────────────────────────────  cancel → stay in SQL (query intact)
```

## 6. Loading / error surfaces

- SQL seed in flight: editor shows a loading state; Run disabled (buffer empty during load).
- `translate` 400 (DSL not expressible as SQL): error notification with the backend message; SQL editor
  left empty; the builder/JSON views are unaffected and still runnable.
- `translate-sql` 400 (bad/unsupported SQL): handled by the fallback guard above — no separate error
  toast needed since the user is choosing to leave SQL; the popup explains the loss. (Running such SQL
  still surfaces the backend error via the existing execute-sql path — unchanged.)

## 7. Testing approach

Per `.claude/rules/testing.md`:
- **Server/actions**: `translateAction`/`translateSqlAction` hit the right URLs with the right bodies and
  map the envelope; `translateQuery`/`translateSqlToQuery` inject the token (mirror existing
  `executeQuery` action tests).
- **Operators**: `OPERATOR_OPTIONS` contains `ico`/`inc` and not `co`/`nc`; a condition authored with
  CONTAINS serializes `op: "ico"`; a `co` in incoming JSON still deserializes without error.
- **SQL seeding**: entering the SQL view calls `translateQuery` and fills the editor from the response;
  a translate `400` surfaces the error and leaves the editor empty; edited SQL is not re-seeded.
- **SQL→Builder**: success+representable hydrates the builder with no popup; success+unrepresentable and
  `400` both open the discard popup; confirm resets, cancel keeps SQL.
- **Autocomplete**: `ILIKE` is offered among keyword suggestions.
- Delete `utils/tests/sql-generate.spec.ts` with the generator; keep serialize/deserialize suites green
  (extended for `ico`/`inc`).
- Component/browser verification of the round-trip is a candidate for the `spec-browser-verify` gate
  (SQL view is browser-observable) — decide at apply time.
