## MODIFIED Requirements

### Requirement: A config-file entity row links to its platform/asset detail route
The system SHALL navigate to the entity type's platform/asset detail route (`/platform-models/{id}`, `/assets-applications/{id}`, `/platform-interceptors/{id}`, `/platform-routes/{id}`, `/platform-roles/{id}`, `/assets-toolsets/{id}`, `/platform-app-runners/{id}`, `/platform-catalog-schemas/{id}`) when a row in the config-file-backed list is clicked, or when its "open in new tab" row action is used, appending a `configFile=true` query parameter in both cases. The flag SHALL be joined as a proper query parameter — `?` when the built route carries no query string, `&` when it already does. For the dual-bucket routes (`/assets-applications/{id}`, `/assets-toolsets/{id}`), the navigation URL SHALL be the bare `{id}` segment plus the flag — no `path` query parameter — the same segment shape a platform-bucket row of that type produces. The entity type's bare/admin-grid detail route (e.g. `/models/{id}`, `/applications/{id}`) SHALL NOT be used for this navigation. No new, dedicated route SHALL be introduced for this.

#### Scenario: Clicking a config-file model row navigates to the platform route
- **WHEN** a user clicks a row in the config-file-backed Models list
- **THEN** the browser navigates to `/platform-models/{id}?configFile=true`

#### Scenario: Clicking a config-file application row navigates without a path parameter
- **WHEN** a user clicks a row in the config-file-backed Applications list
- **THEN** the browser navigates to `/assets-applications/{id}?configFile=true`, with no `path` query parameter

#### Scenario: Clicking a config-file toolset row navigates without a path parameter
- **WHEN** a user clicks a row in the config-file-backed Toolsets list
- **THEN** the browser navigates to `/assets-toolsets/{id}?configFile=true`, with no `path` query parameter

#### Scenario: The query flag joins onto a route that already has a query string
- **WHEN** the system appends the `configFile=true` flag to a detail-route URL that already carries a query parameter
- **THEN** the flag is joined with `&`, not with a second `?`

#### Scenario: The "open in new tab" row action includes the query flag
- **WHEN** a user activates the "open in new tab" row action on a config-file-backed list row
- **THEN** the new tab opens the same platform/asset detail route the row click would (e.g. `/platform-models/{id}?configFile=true`, `/assets-applications/{id}?configFile=true`), not the bare detail route
