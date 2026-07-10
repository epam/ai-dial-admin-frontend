# Analytics 2.0 — Master Spec

## Purpose

Define the Analytics 2.0 feature: a new, experimental left-navigation menu group ("Analytics 2.0") gated by the `ANALYTICS_V2_ENABLED` environment variable, carrying a "Preview" tag on its group header, with two sub-items — "Query Builder" and "Tables" — that open dedicated pages. In this iteration the pages intentionally render no content; the deliverable is the menu, the routes, the feature flag, and the server-side API layer wired to the Analytics data-access service (`analytics-data-access-service`, sourced from `DIAL_ANALYTICS_API_URL`). The API layer covers every request surfaced by the service's demo pages (`/v1/queries` and `/v1/tables`) so later stories can build the UI without touching transport.

This folder (`openspec/specs/analytics/`) is the single home for all Analytics 2.0 specs; this file is the consolidated master spec for the feature.

## Requirements

### Requirement: ANALYTICS_V2_ENABLED feature flag is surfaced on FeatureFlags

The system SHALL expose an environment variable `ANALYTICS_V2_ENABLED` whose value is surfaced at runtime on the `FeatureFlags` object as `analyticsV2Enabled: boolean`. The flag MUST be `true` only when `process.env.ANALYTICS_V2_ENABLED` is present and resolves truthy per the existing `isValueTruthy` helper; otherwise it MUST be `false`. The flag SHALL be initialized in the root layout (`app/[lang]/layout.tsx`) alongside the other feature flags and added to the `FeatureFlags` model (`models/feature-flags.ts`).

#### Scenario: Flag is true when env var is explicitly truthy

- **WHEN** `process.env.ANALYTICS_V2_ENABLED` is set to `'true'` and the root layout initializes `FeatureFlags`
- **THEN** `featureFlags.analyticsV2Enabled` is `true`

#### Scenario: Flag defaults to false when env var is unset

- **WHEN** `process.env.ANALYTICS_V2_ENABLED` is not set
- **THEN** `featureFlags.analyticsV2Enabled` is `false`

#### Scenario: Flag is false when env var is falsy

- **WHEN** `process.env.ANALYTICS_V2_ENABLED` is set to `'false'`, `''`, `'0'`, or any value that `isValueTruthy` treats as falsy
- **THEN** `featureFlags.analyticsV2Enabled` is `false`

### Requirement: Analytics 2.0 menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics 2.0" menu group whose sub-items are, in order, "Query Builder" (linking to the Query Builder route) and "Tables" (linking to the Tables route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. New routes SHALL be added to the `ApplicationRoute` enum (`types/routes.ts`) — `/query-builder` and `/tables` — and new labels SHALL be added to `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics 2.0", "Query Builder", "Tables").

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsV2Enabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics 2.0" group is present
- **AND** expanding it shows a "Query Builder" sub-item linking to `/query-builder`
- **AND** it shows a "Tables" sub-item linking to `/tables`

### Requirement: Analytics 2.0 menu group is gated by the feature flag

The "Analytics 2.0" group SHALL be present in the menu only when `featureFlags.analyticsV2Enabled` is `true`, following the same filtering pattern used for the Deployments and Evaluation groups in `MENU_CONFIGURATION`. When the flag is `false`, the entire group and both sub-items MUST be absent from the sidebar, and the group's gating MUST compose independently of every other flag-gated group (disabling or enabling any other group MUST NOT affect Analytics 2.0's visibility, and vice versa).

#### Scenario: Group hidden when flag disabled

- **WHEN** `featureFlags.analyticsV2Enabled` is `false` and the sidebar menu renders
- **THEN** the "Analytics 2.0" group and both its sub-items are absent from the sidebar

#### Scenario: Gating composes independently of other groups

- **WHEN** `featureFlags.analyticsV2Enabled` is `true` while `featureFlags.deploymentsEnabled` and `featureFlags.evaluationEnabled` are `false`
- **THEN** the "Analytics 2.0" group is present
- **AND** the Deployments and Evaluation groups are absent

### Requirement: Preview tag on the Analytics 2.0 group header

The "Analytics 2.0" menu group header SHALL display the existing `PreviewTag` component. Because the current preview-tag mechanism (`PREVIEW_TAG_MENU_ITEMS` in `MenuItemContent.tsx`) applies only to sub-items, the group header component (`MenuItem.tsx`) SHALL be extended to render a `PreviewTag` for groups marked as preview (an opt-in field on `MenuGroupConfiguration`). The tag MUST render only when the sidebar is expanded (consistent with the existing sub-item behavior), and MUST NOT appear on any other group header. Sub-items ("Query Builder", "Tables") MUST NOT each carry their own preview tag.

#### Scenario: Preview tag shown on expanded group header

- **WHEN** the sidebar is expanded and the "Analytics 2.0" group is rendered
- **THEN** a "Preview" tag is shown on the "Analytics 2.0" group header
- **AND** no other group header shows a "Preview" tag

#### Scenario: Preview tag hidden when sidebar collapsed

- **WHEN** the sidebar is collapsed
- **THEN** the "Preview" tag is not rendered on the group header

### Requirement: Query Builder and Tables pages render no content

Two App Router pages SHALL exist so both menu links resolve without error: `app/[lang]/query-builder/page.tsx` and `app/[lang]/tables/page.tsx`. In this iteration each page SHALL render no visible content (return `null` or an equivalent empty render). No data fetching is performed by these pages yet.

#### Scenario: Query Builder route resolves and renders nothing

- **WHEN** the user navigates to `/query-builder`
- **THEN** the route resolves without error
- **AND** the page renders no visible content

#### Scenario: Tables route resolves and renders nothing

- **WHEN** the user navigates to `/tables`
- **THEN** the route resolves without error
- **AND** the page renders no visible content

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsV2Api`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsV2Api` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-v2-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/` per the project's constants/models conventions. The client MUST cover every request exercised by the service's demo pages across both endpoint families. Pages do not call this client in this iteration; the layer is provided for subsequent stories.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `POST /v1/queries/execute` — execute a structured query (structured-query envelope body)

Tables endpoints (base path `/v1/tables`):
- `GET /v1/tables` — list tables
- `POST /v1/tables` — create a table or enrichment (body-discriminated)
- `GET /v1/tables/{name}` — read one table by name
- `DELETE /v1/tables/{name}` — delete a table by name
- `PATCH /v1/tables/{name}/schema` — update a table's schema
- `POST /v1/tables/{name}/rows` — insert rows into a table

All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

#### Scenario: Client targets the Analytics data-access host

- **WHEN** `analyticsV2Api` is instantiated in `app/api/api.ts`
- **THEN** it is constructed with `host: process.env.DIAL_ANALYTICS_API_URL`

#### Scenario: Client covers the demo queries endpoints

- **WHEN** `analyticsV2Api` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, and `POST /v1/queries/execute`

#### Scenario: Client covers the demo tables endpoints

- **WHEN** `analyticsV2Api` is used
- **THEN** it can issue `GET /v1/tables`, `POST /v1/tables`, `GET /v1/tables/{name}`, `DELETE /v1/tables/{name}`, `PATCH /v1/tables/{name}/schema`, and `POST /v1/tables/{name}/rows`
