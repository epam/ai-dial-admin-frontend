## ADDED Requirements

### Requirement: `showConfigFiles` toggle exists in `AppContext`
The system SHALL expose a `showConfigFiles: boolean` value and a toggle function on `AppContextType`, defaulting to `false` and persisted to `localStorage` the same way `sidebarOpen` is (read on mount, written on every toggle).

#### Scenario: Default value is false
- **WHEN** the app loads with no prior stored value
- **THEN** `showConfigFiles` is `false`

#### Scenario: Toggling persists across reloads
- **WHEN** a user toggles `showConfigFiles` on and reloads the app
- **THEN** `showConfigFiles` is still `true`

### Requirement: The toggle control is rendered only where it applies
The system SHALL render a `showConfigFiles` toggle control, placed adjacent to the page title, on exactly six views: `platform-models`, `platform-interceptors`, `platform-routes`, `platform-roles`, `assets-applications`, and `assets-toolsets` — and only when `featureFlags.adminApiEnabled` is `false`. The control SHALL NOT be rendered on `platform-keys`, `platform-app-runners`, or any other route, and SHALL NOT be rendered on any of the six covered views when `featureFlags.adminApiEnabled` is `true`.

#### Scenario: Toggle appears on a covered view without the admin API
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title

#### Scenario: Toggle is absent with the admin API configured
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is set
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle is absent on Keys
- **WHEN** a user opens `platform-keys`, regardless of `DIAL_ADMIN_API_URL`
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle is absent on App Runners
- **WHEN** a user opens `platform-app-runners`, regardless of `DIAL_ADMIN_API_URL`
- **THEN** no `showConfigFiles` toggle is rendered

### Requirement: Toggling swaps the list component in place
On each of the six covered views, the system SHALL render the existing asset/platform list (`BaseAssetList`) when `showConfigFiles` is `false`, and that entity's existing admin-grid list component (`Models/List`, `ApplicationsList`, `InterceptorsList`, `RoutesList`, `RolesList`, `ToolsetsList`) when `showConfigFiles` is `true` — on the same route, with no navigation. The toggle control SHALL also be rendered in the admin-grid list's own header, so the user can switch back.

#### Scenario: Turning the toggle on swaps to the admin-grid list
- **WHEN** a user on `platform-models` turns `showConfigFiles` on
- **THEN** the page renders `Models/List` in place of `BaseAssetList`, without a URL change

#### Scenario: Turning the toggle off restores the asset list
- **WHEN** a user on the config-file-backed `Models/List` view turns `showConfigFiles` off
- **THEN** the page renders `BaseAssetList` again

### Requirement: Config-file entity data is fetched lazily, only when the toggle is on
The system SHALL NOT fetch config-file entity data for any of the six covered views until the user turns `showConfigFiles` on for that view. Turning it on SHALL trigger a request for the full population of that entity type's config-file entities; turning it off, or never turning it on, SHALL issue no such request.

#### Scenario: No config-file request on initial page load
- **WHEN** a user opens `platform-models` with `showConfigFiles` off
- **THEN** no request is made to read config-file model entities

#### Scenario: Turning the toggle on triggers the fetch
- **WHEN** a user turns `showConfigFiles` on for the first time on a given view
- **THEN** a request for the full config-file population of that entity type is issued

### Requirement: A config-file entity row links to its existing admin-grid detail route
The system SHALL navigate to the entity type's existing "hidden" admin-grid detail route (e.g. `/models/{id}`, `/applications/{id}`, `/interceptors/{id}`, `/routes/{id}`, `/roles/{id}`, `/toolsets/{id}`) when a row in the config-file-backed list is clicked, appending a `configFile=true` query parameter. No new, dedicated route SHALL be introduced for this.

#### Scenario: Clicking a config-file model row navigates with the query flag
- **WHEN** a user clicks a row in the config-file-backed Models list
- **THEN** the browser navigates to `/models/{id}?configFile=true`

### Requirement: A detail page opened with `configFile=true` renders read-only, sourced from Core's config file
When a covered entity's detail route (`models/[id]`, `applications/[id]`, `interceptors/[id]`, `routes/[id]`, `roles/[id]`, `toolsets/[id]`) is requested with `configFile=true`, the system SHALL fetch the entity via `configFileApi` instead of the admin backend, SHALL resolve any embedded Roles/Interceptors picker through the config-file-aware read, and SHALL render the view read-only — no field on the page SHALL be editable, regardless of the viewer's own admin role.

#### Scenario: A config-file-sourced model detail view is read-only
- **WHEN** a user opens `/models/{id}?configFile=true`
- **THEN** the model is read from `configFileApi`, and every field on the page is disabled

#### Scenario: The view returns to normal after leaving
- **WHEN** a user navigates away from a `configFile=true` detail view to any other page
- **THEN** that other page is not read-only as a result of having visited the config-file view

#### Scenario: Direct navigation to a covered detail route with the flag works without the admin API
- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user navigates directly to `/interceptors/{id}?configFile=true`
- **THEN** the page renders the config-file-sourced interceptor read-only, rather than redirecting home

### Requirement: A config-file detail page's breadcrumb returns to the platform/asset list
When a covered entity's detail route is opened with `configFile=true`, the breadcrumb segment that would otherwise link to this hidden route's own list SHALL instead link to the platform/asset route the row was reached from — that hidden list redirects home without the admin backend, so it is never a valid "back" target in this mode.

#### Scenario: The breadcrumb points at the platform route for a platform-scoped type
- **WHEN** a user opens `/models/{id}?configFile=true`
- **THEN** the breadcrumb's list segment links to `/platform-models`, not `/models`

#### Scenario: The breadcrumb points at the asset route for an asset-scoped type
- **WHEN** a user opens `/applications/{id}?configFile=true`
- **THEN** the breadcrumb's list segment links to `/assets-applications`, not `/applications`

#### Scenario: The breadcrumb is unaffected outside config-file mode
- **WHEN** a user opens `/models/{id}` without `configFile=true`
- **THEN** the breadcrumb's list segment links to `/models`, unchanged from before this change
