## Why

Analytics 2.0 is a new, in-development area of the admin app backed by a separate service (`analytics-data-access-service`, `:8095`, exposing `/v1/queries` and `/v1/tables`). This first slice lands the scaffolding so the feature can be shipped incrementally behind a flag: the menu entry point, the routes, the on/off switch, and the full server-side API layer. The UI itself is intentionally deferred — pages render nothing today — so subsequent stories can build Query Builder and Tables without re-touching navigation, feature-flag wiring, or transport.

This change is the first story against the consolidated master spec at `openspec/specs/analytics-v2/spec.md`; later stories append their requirements into that same master spec.

## What Changes

- **Feature flag:** add `ANALYTICS_V2_ENABLED` → `featureFlags.analyticsV2Enabled` (via `isValueTruthy`), initialized in the root layout and added to the `FeatureFlags` model.
- **Menu:** add an "Analytics 2.0" group to `MENU_CONFIGURATION` with two sub-items — "Query Builder" and "Tables" — gated by `analyticsV2Enabled` (same filter pattern as Deployments/Evaluation). Add the two routes to `ApplicationRoute` and the labels to `MenuI18nKey` / `locales/en.ts`.
- **Preview tag on the group header:** extend the group-header component (`MenuItem.tsx`) to render the existing `PreviewTag` for groups flagged as preview, and mark the Analytics 2.0 group as preview. (Today the preview mechanism only tags sub-items.) The tag shows only when the sidebar is expanded; sub-items do not each carry a tag.
- **Pages (render nothing):** add `app/[lang]/analytics-v2/query-builder/page.tsx` and `app/[lang]/analytics-v2/tables/page.tsx`, each rendering no visible content, so both links resolve.
- **Server API layer** (configured, not yet called by any page), one client `AnalyticsV2Api`, host `DIAL_ANALYTICS_API_URL`:
  - Queries (`/v1/queries`): `GET /entities`, `GET /entities/schema/{name}`, `POST /execute`.
  - Tables (`/v1/tables`): `GET /`, `POST /`, `GET /{name}`, `DELETE /{name}`, `PATCH /{name}/schema`, `POST /{name}/rows`.
  - Instantiated/exported once from `app/api/api.ts` as `analyticsV2Api`; DTOs under `src/models/analytics/`.

## Capabilities

### New Capabilities
- `analytics-v2`: A flag-gated ("Analytics 2.0", `ANALYTICS_V2_ENABLED`) menu group with a Preview tag on its header and Query Builder + Tables sub-items opening empty pages, plus a server-side API layer covering the analytics-data-access-service `/v1/queries` and `/v1/tables` endpoints.

## Impact

- **New code:**
  - `app/[lang]/analytics-v2/query-builder/page.tsx`, `app/[lang]/analytics-v2/tables/page.tsx` (empty renders)
  - `server/analytics/analytics-v2-api.ts` (single `AnalyticsV2Api extends BaseApi`)
  - `models/analytics/` — request/response DTOs (entities, entity schema, structured-query envelope, table definitions/rows)
- **Modified code:**
  - `models/feature-flags.ts` — add `analyticsV2Enabled`
  - `app/[lang]/layout.tsx` — initialize the flag from `ANALYTICS_V2_ENABLED`
  - `components/Menu/menu-configuration.tsx` — add the group; filter when flag off; mark it preview
  - `components/Menu/MenuItem/MenuItem.tsx` — render `PreviewTag` on flagged group headers
  - `types/routes.ts` — `AnalyticsV2QueryBuilder`, `AnalyticsV2Tables`
  - `constants/i18n.ts` + `locales/en.ts` — Analytics 2.0 / Query Builder / Tables labels
  - `app/api/api.ts` — instantiate/export `analyticsV2Api` with `host: DIAL_ANALYTICS_API_URL`
- **New env vars:** `ANALYTICS_V2_ENABLED` (on/off), `DIAL_ANALYTICS_API_URL` (backend host).
- **Shared component touch:** `MenuItem.tsx` gains a preview slot on group headers — additive and opt-in (only groups flagged preview render it), so existing groups are unaffected.

## Non-goals

- No Query Builder or Tables UI — the pages render nothing in this slice.
- No page-level data fetching; the server API layer is provided for later stories and is not called yet.
- No server actions wiring the API to components (added when the UI lands).
- No changes to the "Schema Discovery" concept as a separate page — its endpoints share the `/v1/queries` base and belong to the Queries client; there is no third menu item.
- No auth/permission model beyond the standard API headers already applied by `BaseApi`.
