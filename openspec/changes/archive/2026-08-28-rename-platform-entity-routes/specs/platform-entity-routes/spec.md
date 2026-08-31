## ADDED Requirements

### Requirement: Platform entity routes use platform- prefix
The six World-B platform entity pages (Models, App Runners, Interceptors, Routes, Roles, Keys)
SHALL be accessible under `/platform-*` URL paths. The previous `/assets-*` URLs for these pages
are not preserved.

| Entity | New URL | Old URL (removed) |
|--------|---------|-------------------|
| Models | `/platform-models` | `/assets-models` |
| App Runners | `/platform-app-runners` | `/assets-app-runners` |
| Interceptors | `/platform-interceptors` | `/assets-interceptors` |
| Routes | `/platform-routes` | `/assets-routes` |
| Roles | `/platform-roles` | `/assets-roles` |
| Keys | `/platform-keys` | `/assets-keys` |

#### Scenario: Platform Models page is reachable at new URL
- **WHEN** a user navigates to `/<lang>/platform-models`
- **THEN** the system renders the Platform Models list page

#### Scenario: Platform App Runners page is reachable at new URL
- **WHEN** a user navigates to `/<lang>/platform-app-runners`
- **THEN** the system renders the Platform App Runners list page

#### Scenario: Platform Interceptors page is reachable at new URL
- **WHEN** a user navigates to `/<lang>/platform-interceptors`
- **THEN** the system renders the Platform Interceptors list page

#### Scenario: Platform Routes page is reachable at new URL
- **WHEN** a user navigates to `/<lang>/platform-routes`
- **THEN** the system renders the Platform Routes list page

#### Scenario: Platform Roles page is reachable at new URL
- **WHEN** a user navigates to `/<lang>/platform-roles`
- **THEN** the system renders the Platform Roles list page

#### Scenario: Platform Keys page is reachable at new URL
- **WHEN** a user navigates to `/<lang>/platform-keys`
- **THEN** the system renders the Platform Keys list page

### Requirement: Sidebar navigation links point to platform- routes
The sidebar Assets section entries for the six platform entities SHALL link to their new
`/platform-*` URLs. The sidebar display labels remain unchanged (Models, App Runners,
Interceptors, Routes, Roles, Keys).

#### Scenario: Sidebar Assets section contains correct platform-entity links
- **WHEN** the user views the sidebar Assets section
- **THEN** the six platform entity entries link to the `/platform-*` URLs
- **AND** their display labels are identical to the labels shown before this rename

### Requirement: World-C asset routes are unaffected
The user-resource (World C) routes `/assets-applications`, `/assets-toolsets`, `/assets-skills`,
`/prompts`, `/conversations`, and `/files` SHALL remain unchanged.

#### Scenario: Asset Applications page remains accessible at its original URL
- **WHEN** a user navigates to `/<lang>/assets-applications`
- **THEN** the system renders the Asset Applications list page (no change in behavior)
