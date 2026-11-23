## MODIFIED Requirements

### Requirement: Platform Routers page uses the platform- prefix
The Auto Routers page SHALL be accessible at `/platform-routers`, with its detail page at
`/platform-routers/{id}` addressed by the id segment alone, and its sidebar entry SHALL link to it.

#### Scenario: Platform Routers page is reachable
- **WHEN** a user navigates to `/<lang>/platform-routers`
- **THEN** the system renders the Auto Routers list page

#### Scenario: Router detail page is addressed by id alone
- **WHEN** a user opens a router from the list
- **THEN** the URL is `/<lang>/platform-routers/{id}` with no bucket or path segment

#### Scenario: Sidebar entry links to the platform route
- **WHEN** the user views the AI Gateway section of the sidebar
- **THEN** the `Auto Routers` entry links to `/platform-routers`
- **AND** the separate `Routes` entry retains its label and destination
