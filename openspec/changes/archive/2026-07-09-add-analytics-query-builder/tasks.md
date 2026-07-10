## 1. Transport + server actions

- [x] 1.1 Add `getDetailedEntitySchema(name, idField, id, token)` to `AnalyticsV2Api` (`server/analytics/analytics-v2-api.ts`) issuing `GET /v1/queries/entities/schema/{name}/detailed?{idField}={id}` with name, idField, and id all URL-encoded; add a `QUERIES_ENTITY_DETAILED_SCHEMA_URL` helper alongside the existing URL constants
- [x] 1.2 Confirm the `/v1/queries/execute` response total field against the live backend and align `StructuredQueryResult` (`models/analytics/query.ts`) — keep `total` or rename to `totalCount` — reading defensively in the UI either way (added `totalCount?` alongside `total`; UI reads either — live confirmation still pending)
- [x] 1.3 Add `app/[lang]/query-builder/actions.ts` (`'use server'`) with `getEntities`, `getEntitySchema`, `getDetailedEntitySchema`, and `executeQuery` (via new `executeAction` returning `ServerActionResponse`), each authenticating via `getUserToken()` and delegating to `analyticsV2Api`

## 2. Builder state model + serialization util

- [x] 2.1 Add `src/models/analytics/query-builder.ts` (UI-local builder-state types) reusing the `Query*` enums; add `src/constants/analytics/query-builder.ts` (new `constants/analytics/` folder) for fixed option lists and defaults. Split per code-standards
- [x] 2.2 Add a pure serialization util `utils/serialize.ts` (whole state → `StructuredQuery` + recursive node serializer + aggregate warnings)
- [x] 2.3 Add a `family(fieldName)` util (substring before first `:`, else `column`) — in `utils/fields.ts`
- [x] 2.4 Add a `distinctTags(fields)` util (deduped, first-seen order, untagged bucket) + `filterFieldsByTags` — in `utils/fields.ts`. Plus `utils/state.ts` (factories) and `utils/result.ts` (dynamic columns)

## 3. Source + schema

- [x] 3.1 Build the Source section: entity `DialSelectField`, instance-id `DialInput` shown only for complex entities, field-count status; on mount load entities, select the first, and auto-load its schema; on entity change reload schema and reset dependent selections
- [x] 3.2 Build the Schema preview popup (`DialFormPopup`/`DialPopup`): grid view (Field, Type, Family, Source, Tag) built on `GridView`/`AgGridWrapper`, plus a toggle to a read-only JSON view (`JsonEditor`/`CodeViewer`)

## 4. Builder sections

- [x] 4.1 Mode `DialRadioGroup` (row/aggregate) + `SELECT DISTINCT` `DialCheckbox`, toggling projection vs aggregate sections
- [x] 4.2 Recursive Filter (WHERE) tree: group operator select (AND/OR/NOT), + condition / + group / remove; condition = field select, operator select, value `DialInput`, value-type select, `is null` for eq/ne, `in` comma-entry
- [x] 4.3 Row-mode Select projection: a new tag-filter chip row (one chip per distinct tag + "untagged"; OR semantics; empty selection = all) above a multi-column responsive `DialCheckbox` field grid fed the tag-filtered fields. The tag filter changes only field *visibility*, never selection; tag selection resets on schema change
- [x] 4.4 Aggregate Group by: the same multi-column `DialCheckbox` field grid (no tag chips)
- [x] 4.5 Aggregate time-bucket rows (amount, unit, source field, alias) with add/remove
- [x] 4.6 Aggregate metric rows (fn, optional field, distinct, alias) with add/remove
- [x] 4.7 Aggregate Having tree (reuse the filter tree component) over group-by/bucket/aggregate output names
- [x] 4.8 Sort rows (field, dir, nulls) with add/remove; field options switch by mode
- [x] 4.9 Page section: include-page toggle, strategy select, offset/limit/include_total or cursor/limit controls

## 5. Preview + result + page assembly

- [x] 5.1 Right-section JSON preview: **reuse** `CodeViewer` (`components/Common/CodeViewer/CodeViewer.tsx`) for the live read-only JSON (it bundles Copy via `CopyButton` + fullscreen), plus the Run button and the aggregate validation warning banner
- [x] 5.2 Run action wired to `executeQuery`, with disabled-until-schema-loaded state and error surfaced via the app notification convention
- [x] 5.3 Result grid on `GridView` with a runtime `ColDef[]` builder (result columns or union of row keys) modeled on `getAnalyticsColumns`/`ExtractionResult` (`components/Runs/View/`), stringified object/array cells, and a row-count/total meta line; empty-state handling
- [x] 5.4 Assemble the two-section page shell and render it from `app/[lang]/query-builder/page.tsx`
- [x] 5.5 Add Query Builder i18n keys to `constants/i18n.ts` and English strings to `locales/en.ts`

## 6. Tests

- [x] 6.1 Unit-test the serialization util (`serialize.ts`): row/aggregate serialization, nested/empty groups, `not`, `in` array, is-null, sort/page omission, distinct — and the `family()` and `distinctTags()` utils
- [x] 6.2 Component tests for the key builder interactions per `.claude/rules/testing.md`: default schema load, entity-change reset, schema preview grid↔JSON toggle, filter nesting/is-null/in, mode switch, projection tag filtering (narrows visible fields, keeps already-checked fields selected while hidden), run→result grid, empty and error states

## 7. Verification

- [ ] 7.1 Run the spec-browser-verify skill against the running local app (stack up, auth disabled, analytics-data-access-service reachable): build a VerificationRequest from this change's scenarios, spawn the spec-verification-gate sub-agent via Playwright MCP, and resolve any `fail` verdicts before completing the change — **BLOCKED here: requires the live local stack + analytics-data-access-service; run when the environment is available**

## 8. Quality checks

- [x] 8.1 Run code quality checks on the change scope — ESLint clean on all new/changed files, Prettier clean, and the analytics test suite green (52 tests across `src/components/AnalyticsV2` + `src/server/analytics`). New source typechecks clean under `tsconfig.app.json`. Full-repo `npm run test` is the pre-push gate to run before merge
