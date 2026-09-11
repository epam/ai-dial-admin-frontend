## ADDED Requirements

### Requirement: `adminApiEnabled` feature flag reflects `DIAL_ADMIN_API_URL` presence

The system SHALL expose an `adminApiEnabled: boolean` field on the `FeatureFlags` object, computed at request time in the root layout as `process.env.DIAL_ADMIN_API_URL != null`.

#### Scenario: Flag is true when the env var is set

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is set to any non-null value and the root layout
  initializes `FeatureFlags`
- **THEN** `featureFlags.adminApiEnabled` is `true`

#### Scenario: Flag is false when the env var is unset

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is unset
- **THEN** `featureFlags.adminApiEnabled` is `false`

### Requirement: Import/Export config menu actions are hidden without the admin API

The Menu content SHALL render the "Import config" and "Export config" actions (in both the expanded actions bar and the collapsed `MenuActions` bar) only when `featureFlags.adminApiEnabled` is `true`. The "System properties" action MUST NOT be affected by this flag. The Home page (`WelcomeView`) quick-actions row SHALL apply the same `featureFlags.adminApiEnabled` gate to its own "Import config" and "Export config" buttons, in addition to its existing read-only-admin check.

#### Scenario: Admin API disabled hides Import/Export actions

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **THEN** neither the "Import config" nor "Export config" action is rendered in the menu
- **AND** "System properties" is still rendered

#### Scenario: Admin API enabled shows Import/Export actions

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **THEN** both "Import config" and "Export config" actions are rendered in the menu

#### Scenario: Admin API disabled hides Import/Export quick actions on the Home page

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **AND** the user is not a read-only admin
- **THEN** neither the "Import config" nor "Export config" quick-action button is rendered on the Home page
- **AND** "System properties" is still rendered

#### Scenario: Admin API enabled shows Import/Export quick actions on the Home page

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **AND** the user is not a read-only admin
- **THEN** both "Import config" and "Export config" quick-action buttons are rendered on the Home page

### Requirement: Footer and its polling are suppressed without the admin API

The `Content` component SHALL NOT render the `Footer`, and SHALL NOT start the `checkAppStatus` / `checkCoreVersion` polling intervals (nor issue their initial calls), when `featureFlags.adminApiEnabled` is `false`. Both actions call the admin backend, which is unreachable without `DIAL_ADMIN_API_URL`.

#### Scenario: Admin API disabled hides Footer and stops polling

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **THEN** the Footer is absent from the page
- **AND** `getAppProcessStatus` and `getCoreVersions` are never called

#### Scenario: Admin API enabled renders Footer and polling as today

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **THEN** the Footer renders
- **AND** `checkAppStatus` and `checkCoreVersion` run on mount and on their existing intervals

### Requirement: Direct navigation to admin-API-only routes redirects home

The system SHALL redirect to `ApplicationRoute.Home`, before issuing any admin-backend request, when `process.env.DIAL_ADMIN_API_URL` is unset and a user navigates directly to any route owned exclusively by the Entities group (`/models`, `/applications`, `/interceptors`, `/toolsets`, `/routes`), the Builders group (`/adapters`, `/application-runners`, `/interceptor-templates`), the Access Management group (`/roles`, `/keys`), the Audit group (`/activity-audit`, `/dashboard`, `/usage-log`), or the Import/Export actions (`/import-config`, `/export-config`) — including every `[id]` and `[id]/[subId]` sub-route under them.

#### Scenario: Bookmarked entity URL redirects when the admin API is disabled

- **WHEN** a user navigates directly to `/<lang>/models`, `/<lang>/models/<id>`, `/<lang>/roles`,
  `/<lang>/import-config`, or any other route listed above
- **AND** `DIAL_ADMIN_API_URL` is unset
- **THEN** the server issues a redirect to `ApplicationRoute.Home`
- **AND** no admin-backend call is made for that page

#### Scenario: Routes render normally when the admin API is enabled

- **WHEN** a user navigates to any of those routes
- **AND** `DIAL_ADMIN_API_URL` is set
- **THEN** the page renders as it does today
