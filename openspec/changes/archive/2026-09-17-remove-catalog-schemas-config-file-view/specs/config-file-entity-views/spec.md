## MODIFIED Requirements

<!--
The Catalog Schemas scenario below was authored as `Toggle appears on Catalog Schemas` with inverted
content, because a MODIFIED requirement may not drop a scenario the current spec still has — no
route could rename it. It was renamed to its present heading when this delta was synced into the
consolidated spec.
-->

### Requirement: The toggle control is rendered only where it applies
The system SHALL render a `showConfigFiles` toggle control, placed adjacent to the page title, on exactly seven views: `platform-models`, `platform-interceptors`, `platform-routes`, `platform-roles`, `platform-app-runners`, `assets-applications`, and `assets-toolsets` — regardless of whether `featureFlags.adminApiEnabled` is set. The control SHALL NOT be rendered on `platform-keys`, `platform-catalog-schemas`, or any other route.

#### Scenario: Toggle appears on a covered view without the admin API
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title

#### Scenario: Toggle appears on a covered view with the admin API configured
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is set
- **THEN** the `showConfigFiles` toggle is still rendered, offering Core's config-file population alongside the admin-backend list

#### Scenario: Toggle is absent on Keys
- **WHEN** a user opens `platform-keys`, regardless of `DIAL_ADMIN_API_URL`
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle appears on App Runners
- **WHEN** a user opens `platform-app-runners`
- **THEN** the `showConfigFiles` toggle is rendered next to the page title, the same as on the other six covered views

#### Scenario: Toggle is absent on Catalog Schemas
- **WHEN** a user opens `platform-catalog-schemas`
- **THEN** no `showConfigFiles` toggle is rendered, the same as on `platform-keys`

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

#### Scenario: An App Runner config-file row opens its detail route with the query flag
- **WHEN** a user clicks a row in the config-file-backed App Runners list
- **THEN** the browser navigates to `/application-runners/{id}?configFile=true`

## REMOVED Requirements

### Requirement: Catalog schemas are a covered config-file type

**Reason**: This surface covers the views whose population is split between the admin backend and
Core's configuration file. Catalog Schemas was added as an eighth type because Core exposes
`catalog_schemas` on its file-config route, which is a statement about Core, not about which views
carry the toggle — Issue #4605 reports the resulting toggle as a bug.

**Migration**: None for stored data; nothing was written through this surface. A file-declared
catalog schema stays readable at its own detail address, which resolves either population and
renders a file-declared schema read-only — see `platform-catalog-schemas`. Operators who need the
full list of file-declared schemas read Core's own `/v1/admin/config/file/catalog_schemas` route.
