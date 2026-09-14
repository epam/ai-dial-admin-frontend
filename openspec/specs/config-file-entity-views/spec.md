# config-file-entity-views Specification

## Purpose
The UI surface that exposes DIAL Core's config-file entity population on platform and asset list
views, gated behind a `showConfigFiles` toggle that appears only when the admin backend is not
configured. Allows an admin to view read-only, config-file-sourced entity detail pages by navigating
from the toggled-on list, without introducing new routes. Covers the toggle's placement and
persistence, the shared name-only list component swap, the lazy names-only data fetch, and the
`configFile=true` detail page rendering on platform/asset routes. Created by archiving change
`add-config-file-entity-views`; expanded to cover App Runners as a seventh entity type by
`expand-config-file-entity-views`.

## Requirements

### Requirement: `showConfigFiles` toggle exists in `AppContext`
The system SHALL expose a `showConfigFiles: boolean` value and a toggle function on `AppContextType`, defaulting to `false` and persisted to `localStorage` the same way `sidebarOpen` is (read on mount, written on every toggle).

#### Scenario: Default value is false
- **WHEN** the app loads with no prior stored value
- **THEN** `showConfigFiles` is `false`

#### Scenario: Toggling persists across reloads
- **WHEN** a user toggles `showConfigFiles` on and reloads the app
- **THEN** `showConfigFiles` is still `true`

### Requirement: The toggle control is rendered only where it applies
The system SHALL render a `showConfigFiles` toggle control, placed adjacent to the page title, on exactly seven views: `platform-models`, `platform-interceptors`, `platform-routes`, `platform-roles`, `platform-app-runners`, `assets-applications`, and `assets-toolsets` — and only when `featureFlags.adminApiEnabled` is `false`. The control SHALL NOT be rendered on `platform-keys` or any other route, and SHALL NOT be rendered on any of the seven covered views when `featureFlags.adminApiEnabled` is `true`.

#### Scenario: Toggle appears on a covered view without the admin API
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title

#### Scenario: Toggle is absent with the admin API configured
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is set
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle is absent on Keys
- **WHEN** a user opens `platform-keys`, regardless of `DIAL_ADMIN_API_URL`
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle appears on App Runners
- **WHEN** a user opens `platform-app-runners` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title, the same as on the other six covered views

### Requirement: Toggling swaps the list component in place
On each of the seven covered views, the system SHALL render the existing asset/platform list (`BaseAssetList`) when `showConfigFiles` is `false`, and a shared, name-only config-file list component when `showConfigFiles` is `true` — on the same route, with no navigation. That shared component SHALL be the same one across all seven covered views, parameterized by the view's `ApplicationRoute`, rather than each entity type rendering its own full-columns admin-grid list component for this branch. The toggle control SHALL also be rendered in the config-file list's own header, so the user can switch back.

#### Scenario: Turning the toggle on swaps to the config-file list
- **WHEN** a user on `platform-models` turns `showConfigFiles` on
- **THEN** the page renders the shared config-file list in place of `BaseAssetList`, without a URL change

#### Scenario: Turning the toggle off restores the asset list
- **WHEN** a user on the config-file-backed list view turns `showConfigFiles` off
- **THEN** the page renders `BaseAssetList` again

#### Scenario: The same list component renders for every covered entity type
- **WHEN** a user turns `showConfigFiles` on for any of the seven covered views
- **THEN** the same shared list component renders, differing only in the route it links rows to and the data it was given

### Requirement: Config-file entity data is fetched lazily, only when the toggle is on
The system SHALL NOT fetch config-file entity data for any of the seven covered views until the user turns `showConfigFiles` on for that view. Turning it on SHALL trigger a request for that entity type's config-file entity **names** (not their full bodies); turning it off, or never turning it on, SHALL issue no such request.

#### Scenario: No config-file request on initial page load
- **WHEN** a user opens `platform-models` with `showConfigFiles` off
- **THEN** no request is made to read config-file model entities

#### Scenario: Turning the toggle on triggers a names-only fetch
- **WHEN** a user turns `showConfigFiles` on for the first time on a given view
- **THEN** a single request for that entity type's config-file entity names is issued, with no follow-up request per name

### Requirement: The config-file-backed list shows only entity names
The shared config-file list component SHALL render a single name column (plus the action column carrying the "open in new tab" action) for every covered entity type, and SHALL NOT render any of the type-specific columns (status, endpoint, type, etc.) the entity's own admin-grid list shows. This applies uniformly across all seven covered views — there is no per-entity-type column configuration for this list.

#### Scenario: A config-file list shows a name column and nothing else
- **WHEN** a user turns `showConfigFiles` on for any covered view
- **THEN** the rendered list's only data column is the entity's name

#### Scenario: The action column still offers "open in new tab"
- **WHEN** a user views a config-file-backed list
- **THEN** each row's action column offers "open in new tab" and no other row action (no remove, duplicate, or move)

### Requirement: A config-file entity row links to its platform/asset detail route
The system SHALL navigate to the entity type's platform/asset detail route (`/platform-models/{id}`, `/assets-applications/{id}`, `/platform-interceptors/{id}`, `/platform-routes/{id}`, `/platform-roles/{id}`, `/assets-toolsets/{id}`, `/platform-app-runners/{id}`) when a row in the config-file-backed list is clicked, or when its "open in new tab" row action is used, appending a `configFile=true` query parameter in both cases. The entity type's bare/admin-grid detail route (e.g. `/models/{id}`, `/applications/{id}`) SHALL NOT be used for this navigation. No new, dedicated route SHALL be introduced for this.

#### Scenario: Clicking a config-file model row navigates to the platform route
- **WHEN** a user clicks a row in the config-file-backed Models list
- **THEN** the browser navigates to `/platform-models/{id}?configFile=true`

#### Scenario: The "open in new tab" row action includes the query flag
- **WHEN** a user activates the "open in new tab" row action on a config-file-backed list row
- **THEN** the new tab opens the same platform/asset detail route the row click would (e.g. `/platform-models/{id}?configFile=true`), not the bare detail route

### Requirement: A detail page opened with `configFile=true` renders read-only, sourced from Core's config file
When a covered entity's platform/asset detail route (`platform-models/[id]`, `assets-applications/[id]`, `platform-interceptors/[id]`, `platform-routes/[id]`, `platform-roles/[id]`, `assets-toolsets/[id]`, `platform-app-runners/[id]`) is requested with `configFile=true`, the system SHALL fetch the entity via `configFileApi` instead of the platform/asset entity's normal fetch, SHALL resolve any embedded Roles/Interceptors picker through the config-file-aware read, and SHALL render the platform/asset view read-only — no field on the page SHALL be editable, regardless of the viewer's own admin role. The view SHALL NOT render the ADMIN|CORE format toggle when its JSON editor is opened, since a config-file-sourced entity has no admin-backend "compare with Core" projection of its own to switch to — it already is Core's own view. The entity type's bare/admin-grid detail route SHALL NOT respond to `configFile=true` — it has no config-file branch.

#### Scenario: A config-file-sourced model detail view is read-only
- **WHEN** a user opens `/platform-models/{id}?configFile=true`
- **THEN** the model is read from `configFileApi`, and every field on the page is disabled

#### Scenario: The view returns to normal after leaving
- **WHEN** a user navigates away from a `configFile=true` detail view to any other page
- **THEN** that other page is not read-only as a result of having visited the config-file view

#### Scenario: Direct navigation to a covered detail route with the flag works without the admin API
- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user navigates directly to `/platform-interceptors/{id}?configFile=true`
- **THEN** the page renders the config-file-sourced interceptor read-only, rather than redirecting home

#### Scenario: A config-file-sourced App Runner detail view is read-only
- **WHEN** a user opens `/platform-app-runners/{id}?configFile=true`
- **THEN** the runner is read from `configFileApi`, and every field on the page is disabled

#### Scenario: The format toggle is hidden on a config-file-sourced detail view
- **WHEN** a user opens the JSON editor on any `configFile=true` detail view
- **THEN** no ADMIN|CORE format selector is rendered, only the editor itself

#### Scenario: The format toggle still renders on the equivalent admin-backend view
- **WHEN** a user opens the JSON editor on the platform/asset detail view without `configFile=true`
- **THEN** the ADMIN|CORE format selector renders as before this change

#### Scenario: The bare admin-grid detail route ignores the config-file flag
- **WHEN** a user navigates to `/models/{id}?configFile=true`
- **THEN** the page behaves exactly as `/models/{id}` without the flag — the admin-grid view, not a config-file read

### Requirement: App Runners is a covered config-file entity type
The system SHALL treat App Runners (`platform-app-runners` / `application-runners`) as a seventh covered entity type, on equal footing with the original six, reading its config-file population under `ConfigFileEntityType.Schemas`.

#### Scenario: App Runners' config-file list is reachable the same way as the other six
- **WHEN** a user turns `showConfigFiles` on for `platform-app-runners`
- **THEN** the config-file-backed list renders, fetching App Runner names from Core's config-file `schemas` type

#### Scenario: An App Runner config-file row opens its detail route with the query flag
- **WHEN** a user clicks a row in the config-file-backed App Runners list
- **THEN** the browser navigates to `/application-runners/{id}?configFile=true`
