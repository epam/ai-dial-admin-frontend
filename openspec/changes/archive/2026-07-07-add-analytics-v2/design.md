## Context

The admin sidebar is built from `MENU_CONFIGURATION(iconSize, featureFlags)` — an array of `MenuGroupConfiguration` objects, each an expandable/collapsible group (icon + label) whose `items[]` are the link rows ("the submenu"). Group visibility is controlled by `.filter()` calls at the end of `MENU_CONFIGURATION` keyed off `FeatureFlags` (today: `deploymentsEnabled`, `evaluationEnabled`). Feature flags are built once in `app/[lang]/layout.tsx` from `process.env.*` (booleans via `isValueTruthy`) and passed through `AppContextProvider`; `MenuContent` reads them from `useAppContext()`.

The Preview tag already exists (`components/Common/PreviewTag/PreviewTag.tsx`) and is applied only to **sub-items** via a `PREVIEW_TAG_MENU_ITEMS` set in `MenuItemContent.tsx`. The **group header** is rendered separately in `MenuItem.tsx` (a `<button>` with icon + label + chevron) and has no tag slot today.

Server API classes extend `BaseApi` (typed `get`/`post`/`patch`/`deleteAction`, standard auth headers, `host` normalization), are grouped by area under `src/server/<area>/`, and are instantiated once in `app/api/api.ts` with `host: process.env.DIAL_<SERVICE>_API_URL`. The Analytics 2.0 backend is a distinct service, so it gets its own host var and its own `src/server/analytics/` area.

The `/v1/queries` and `/v1/tables` request surface was mined from the service's demo pages (`analytics-data-access-service/.../static/demo/{schema,query,tables}.html`).

## Goals / Non-Goals

**Goals:**
- Menu entry point (group + two sub-items), gated by a single flag, with a Preview tag on the group header.
- Two routes that resolve and render nothing.
- A complete, typed server API layer for both base paths, wired but uncalled.

**Non-Goals:**
- Any Query Builder / Tables UI, page data fetching, or server actions.
- Auth/permissions beyond `BaseApi`'s standard headers.
- A third "Schema Discovery" menu item (its endpoints fold into the Queries client).

## Decisions

### D1 — "Analytics 2.0" is a menu group, not a leaf item
The repo's only submenu mechanism is a `MenuGroupConfiguration` with `items[]`. So Analytics 2.0 becomes a new group whose `items` are Query Builder → `/analytics-v2/query-builder` and Tables → `/analytics-v2/tables`. This matches the existing pattern exactly and needs no new navigation primitive.

- *Alternative — two top-level leaf items:* rejected. There is no top-level-leaf concept; everything is group→items, and the request explicitly calls for a submenu.

### D2 — Flag gating via the existing `MENU_CONFIGURATION` filter
Add `analyticsV2Enabled: boolean` to `FeatureFlags`, initialize it in `layout.tsx` as `isValueTruthy(process.env.ANALYTICS_V2_ENABLED)`, and append a `.filter()` in `MENU_CONFIGURATION` dropping the Analytics 2.0 group when the flag is false — identical to `deploymentsEnabled`/`evaluationEnabled`. This keeps gating independent and composable (per the existing `menu-group-visibility` spec).

### D3 — Preview tag on the group header via an opt-in flag on the group config
Extend `MenuGroupConfiguration` with an optional `isPreview?: boolean` and render `<PreviewTag />` in `MenuItem.tsx`'s header when `config.isPreview` is set (and the sidebar is expanded, mirroring the sub-item rule `isSidebarOpen`). Only the Analytics 2.0 group sets `isPreview: true`; every other header is unaffected. The tag is **not** added to sub-items (`PREVIEW_TAG_MENU_ITEMS` stays empty), so it appears once, on the parent.

- *Alternative — tag each sub-item via `PREVIEW_TAG_MENU_ITEMS`:* rejected per the explore decision (user chose the group header); it would also double the tag.
- *Alternative — a separate "preview group keys" set in `MenuItem.tsx`:* rejected; an `isPreview` field on the config is more local and discoverable than a parallel key set.

### D4 — Pages render nothing
Each `page.tsx` returns `null` (no layout, no fetch, no `force-dynamic` — there is nothing dynamic yet). This satisfies "renders nothing" while making the menu links resolve. When the UI lands, these become real server/client components.

### D5 — One `AnalyticsV2Api` client, one host
Create a single `AnalyticsV2Api` under `src/server/analytics/analytics-v2-api.ts`, extending `BaseApi`, instantiated once in `app/api/api.ts` as `analyticsV2Api` with `host: process.env.DIAL_ANALYTICS_API_URL`. It covers both endpoint families — Queries (`/v1/queries`: entities, schema, execute) and Tables (`/v1/tables`: CRUD, schema patch, rows) — with the two groups of methods clearly sectioned. URL builders live as module constants (`QUERIES_URL`, `TABLES_URL`, …); `{name}` segments are `encodeURIComponent`-wrapped, matching the demo pages.

Both families belong to the same backend service and are consumed together by the feature, so a single client keeps the one host/base-path in one place and avoids a second near-identical file.

- *Alternative — split `QueriesApi` / `TablesApi` by base path:* considered, then consolidated at the user's request into one `AnalyticsV2Api`. If the surface grows large later, it can be split again with no call-site churn beyond the export.

### D6 — DTOs under `src/models/analytics/`, enums for fixed sets
Model files hold the request/response shapes: entity list, entity field schema (`{ fields: [{ name, type, source, tag }] }`), the structured-query envelope (mode row/aggregate, filter groups with `and`/`or`/`not`, predicates with operators `eq|ne|co|nc|lt|gt|le|ge|in`, value types, aggregates `count|sum|avg|min|max`, bucket units, sort), and table definitions/columns/rows. Fixed string sets (operators, value types, aggregate functions, bucket units, field types) are TypeScript `enum`s per code-standards, not string-literal unions. Constants (URLs) stay separate from models per the file-organization rule.

### D7 — API layer is wired but uncalled; tested at the unit level
No page or server action invokes the clients in this slice. The testable surface is therefore URL construction / method+path correctness and (for the flag→menu path) the gating and preview-tag rendering. These are the unit-test targets; there is no page behavior to drive beyond "route resolves, renders nothing."

## Risks / Trade-offs

- **Backend contract mined from demo pages, not an OpenAPI spec** → Field/shape details (esp. the structured-query envelope and table create/enrichment body) may drift. Mitigation: isolate every shape in `src/models/analytics/` and every path in one constants block per client, so a rename is a localized edit; the clients are uncalled, so drift cannot break runtime UI in this slice.
- **`MenuItem.tsx` is a shared header component** → The preview slot is additive and opt-in (`config.isPreview`), so existing groups render identically; the menu specs (`menu-group-visibility`, `model-servings-visibility`) must still pass.
- **`POST /v1/tables` is body-discriminated (table vs enrichment)** → Modeled as one method taking a discriminated create DTO rather than two endpoints, matching the demo's single POST target.
- **Empty pages** → A blank canvas is hard to visually confirm; the menu group + preview tag + route resolution are the observable signals for this slice.
