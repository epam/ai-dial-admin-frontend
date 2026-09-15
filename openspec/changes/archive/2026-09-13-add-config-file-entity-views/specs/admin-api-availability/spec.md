## MODIFIED Requirements

### Requirement: Direct navigation to admin-API-only routes redirects home

The system SHALL redirect to `ApplicationRoute.Home`, before issuing any admin-backend request, when `process.env.DIAL_ADMIN_API_URL` is unset and a user navigates directly to any route owned exclusively by the Entities group (`/models`, `/applications`, `/interceptors`, `/toolsets`, `/routes`), the Builders group (`/adapters`, `/application-runners`, `/interceptor-templates`), the Access Management group (`/roles`, `/keys`), the Audit group (`/activity-audit`, `/dashboard`, `/usage-log`), or the Import/Export actions (`/import-config`, `/export-config`) — including every `[id]` and `[id]/[subId]` sub-route under them — **except** the `[id]` detail route of `/models`, `/applications`, `/interceptors`, `/routes`, `/roles`, and `/toolsets`, which SHALL render instead of redirecting when the request carries a `configFile=true` query parameter, per `config-file-entity-views`.

#### Scenario: Bookmarked entity URL redirects when the admin API is disabled

- **WHEN** a user navigates directly to `/<lang>/models`, `/<lang>/models/<id>`, `/<lang>/roles`, `/<lang>/import-config`, or any other route listed above
- **AND** `DIAL_ADMIN_API_URL` is unset
- **THEN** the server issues a redirect to `ApplicationRoute.Home`
- **AND** no admin-backend call is made for that page

#### Scenario: Routes render normally when the admin API is enabled

- **WHEN** a user navigates to any of those routes
- **AND** `DIAL_ADMIN_API_URL` is set
- **THEN** the page renders as it does today

#### Scenario: A covered detail route with `configFile=true` renders instead of redirecting

- **WHEN** `DIAL_ADMIN_API_URL` is unset
- **AND** a user navigates to `/<lang>/models/<id>?configFile=true` (or the equivalent `/applications/<id>`, `/interceptors/<id>`, `/routes/<id>`, `/roles/<id>`, or `/toolsets/<id>` route)
- **THEN** the server does not redirect, and the page renders the config-file-sourced entity read-only

#### Scenario: The same detail route without the query flag still redirects

- **WHEN** `DIAL_ADMIN_API_URL` is unset
- **AND** a user navigates to `/<lang>/models/<id>` with no `configFile` query parameter
- **THEN** the server issues a redirect to `ApplicationRoute.Home`, unchanged from before this change

#### Scenario: Keys and App Runners are unaffected

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user navigates to `/<lang>/keys/<id>` or `/<lang>/application-runners/<id>` with any query parameters
- **THEN** the server redirects to `ApplicationRoute.Home`, since neither route is part of the `configFile=true` exception
