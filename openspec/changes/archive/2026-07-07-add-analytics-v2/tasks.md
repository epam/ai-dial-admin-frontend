## 1. Feature flag

- [x] 1.1 Add `analyticsV2Enabled: boolean` to `FeatureFlags` (`models/feature-flags.ts`)
- [x] 1.2 Initialize it in `app/[lang]/layout.tsx` as `analyticsV2Enabled: isValueTruthy(process.env.ANALYTICS_V2_ENABLED)` in the `featureFlags` object

## 2. Routes + i18n

- [x] 2.1 Add `AnalyticsV2QueryBuilder = '/analytics-v2/query-builder'` and `AnalyticsV2Tables = '/analytics-v2/tables'` to `ApplicationRoute` (`types/routes.ts`)
- [x] 2.2 Add `MenuI18nKey` entries for the group label ("Analytics 2.0"), "Query Builder", and "Tables" (`constants/i18n.ts`); reuse existing shared keys if an equivalent already exists
- [x] 2.3 Add the English strings for the new keys in `locales/en.ts`

## 3. Menu group + Preview tag on group header

- [x] 3.1 Add an optional `isPreview?: boolean` field to `MenuGroupConfiguration` (`menu-configuration.tsx`)
- [x] 3.2 Add the "Analytics 2.0" group to `MENU_CONFIGURATION` with its own icon, `isPreview: true`, and `items` = Query Builder (`ApplicationRoute.AnalyticsV2QueryBuilder`) then Tables (`ApplicationRoute.AnalyticsV2Tables`)
- [x] 3.3 Append a `.filter()` in `MENU_CONFIGURATION` dropping the Analytics 2.0 group when `!featureFlags.analyticsV2Enabled` (same pattern as `deploymentsEnabled`/`evaluationEnabled`)
- [x] 3.4 Extend `MenuItem.tsx` to render `<PreviewTag />` in the group header when `config.isPreview` and the sidebar is expanded (`isSidebarOpen`); leave `PREVIEW_TAG_MENU_ITEMS` empty so sub-items are not tagged

## 4. Pages (render nothing)

- [x] 4.1 Add `app/[lang]/analytics-v2/query-builder/page.tsx` — default export returning `null`
- [x] 4.2 Add `app/[lang]/analytics-v2/tables/page.tsx` — default export returning `null`

## 5. Server API layer

- [x] 5.1 Add analytics DTO/model files under `src/models/analytics/`: entity list, entity field schema (`{ fields: [{ name, type, source, tag }] }`), structured-query envelope (mode, filter groups, predicates, aggregates, buckets, sort), and table definition/column/row shapes. Use `enum`s for fixed sets (operators, value types, aggregate functions, bucket units, field types) per code-standards; keep URL constants out of model files
- [x] 5.2 Create `server/analytics/analytics-v2-api.ts` (`AnalyticsV2Api extends BaseApi`) — single client covering both endpoint families. Queries (`/v1/queries`): `getEntities()` → `GET /entities`; `getEntitySchema(name)` → `GET /entities/schema/{encoded name}`; `execute(query)` → `POST /execute`
- [x] 5.3 In the same `AnalyticsV2Api`, Tables (`/v1/tables`): `getTables()` → `GET /`; `createTable(body)` → `POST /`; `getTable(name)` → `GET /{encoded name}`; `deleteTable(name)` → `DELETE /{encoded name}`; `updateTableSchema(name, patch)` → `PATCH /{encoded name}/schema`; `addRows(name, rows)` → `POST /{encoded name}/rows`
- [x] 5.4 Instantiate and export a single `analyticsV2Api` from `app/api/api.ts` with `host: process.env.DIAL_ANALYTICS_API_URL`

## 6. Tests

- [x] 6.1 Menu config test: with `analyticsV2Enabled: true` the "Analytics 2.0" group is present with Query Builder + Tables items (correct `href`s); with `false` the group is absent; gating composes independently of `deploymentsEnabled`/`evaluationEnabled` (`components/Menu/tests/menu-configuration.spec.ts`)
- [x] 6.2 `MenuItem` component test: `PreviewTag` renders on the header when `config.isPreview` and sidebar expanded; not rendered when collapsed; not rendered for a non-preview group (`components/Menu/MenuItem/tests/MenuItem.spec.tsx`)
- [x] 6.3 `AnalyticsV2Api` test: each method issues the correct method + URL (incl. `encodeURIComponent` of `{name}`) and passes the token/body, plus a failure path returning `null` (`server/analytics/tests/analytics-v2-api.spec.ts`)
- [x] 6.4 Feature-flag init: no isolated unit seam exists — the flag is set inline in the root layout's `featureFlags` object via the already-tested `isValueTruthy`, and its observable effect (group shown/hidden) is covered by 6.1. No separate test added

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill against the running local app booted with `ANALYTICS_V2_ENABLED=true` and auth disabled. Verify the browser-observable scenarios: the "Analytics 2.0" group appears with a Preview tag on its header, expanding it shows Query Builder + Tables, and navigating to `/analytics-v2/query-builder` and `/analytics-v2/tables` resolves (empty page). Resolve any `fail` verdict before completing the change — gate green, 4/4 pass (group + sub-items with correct hrefs, Preview tag only on Analytics 2.0 header, both routes resolve with empty content, 0 console errors)

## 8. Quality checks

- [x] 8.1 Run the targeted specs from §6 via `vitest run` (from `apps/ai-dial-admin/`); report output — 25 analytics/menu tests + 42 tabs tests pass
- [x] 8.2 `npm run lint` and `npm run format` clean on changed files — lint 0 errors, prettier reports all changed files unchanged (already formatted)
