# test-suite-list

## Purpose

Defines how the test suites list grid surfaces suite type, distinguishing DEPLOYMENT, MCP_TOOL, and ROUTE suites through a dedicated column and through the existing Application column's fallback behavior.

## Requirements

### Requirement: Suite type column in test suites list

The test suites list grid SHALL include a `suiteType` column showing whether each suite is a `DEPLOYMENT`, `MCP_TOOL`, or `ROUTE` suite.

#### Scenario: suiteType column displays suite type value
- **WHEN** user views the test suites list
- **THEN** the `suiteType` column SHALL display `DEPLOYMENT`, `MCP_TOOL`, or `ROUTE` for each row
- **AND** the column SHALL be visible by default (not hidden)

#### Scenario: suiteType column supports equals filter
- **WHEN** user applies a filter on the `suiteType` column with value `MCP_TOOL`
- **THEN** the grid SHALL send `filter=suiteType:eq:MCP_TOOL` to the backend
- **AND** only MCP_TOOL suites SHALL be returned

#### Scenario: suiteType column filters route suites
- **WHEN** user applies a filter on the `suiteType` column with value `ROUTE`
- **THEN** the grid SHALL send `filter=suiteType:eq:ROUTE` to the backend
- **AND** only ROUTE suites SHALL be returned

#### Scenario: suiteType column filter options are equals only
- **WHEN** user opens the filter for the `suiteType` column
- **THEN** only the "Equals" filter option SHALL be available (matching `evalStringFilter` pattern)

### Requirement: Application column shows the selected target name

The `Application` column in the test suites list SHALL display the deployment, MCP deployment, or route name selected by the suite. Route references stored in canonical `routes/platform/{name}` form SHALL be displayed without the `routes/platform/` prefix.

#### Scenario: MCP suite shows mcpDeploymentRef name in Application column
- **WHEN** a test suite has `suiteType: 'MCP_TOOL'` and `mcpDeploymentRef.name: 'Confluence Search'`
- **THEN** the Application column SHALL display "Confluence Search"

#### Scenario: DEPLOYMENT suite Application column is unchanged
- **WHEN** a test suite has `suiteType: 'DEPLOYMENT'`
- **THEN** the Application column SHALL display `deploymentRef.name` as before

#### Scenario: ROUTE suite shows its unprefixed route name
- **WHEN** a test suite has `suiteType: 'ROUTE'` and `routesRef.name: 'routes/platform/search-route'`
- **THEN** the Application column SHALL display "search-route"

#### Scenario: Application filter includes route targets
- **WHEN** user filters the Application column by a route name
- **THEN** the backend filter SHALL include `routes_ref::name` alongside the deployment and MCP deployment name fields

### Requirement: Default sort by creation time descending

The test suites list grid SHALL default-sort rows by Creation time descending, declared on the `createdAt` column definition. Users SHALL still be able to change the sort by clicking a sortable column header.

#### Scenario: list opens sorted by creation time descending
- **WHEN** user opens the Test Suites list with no persisted column sort
- **THEN** rows SHALL be sorted by `createdAt` descending
- **AND** the Creation time column header SHALL show a descending sort indicator

#### Scenario: user can change the sort order
- **WHEN** user clicks a sortable column header on the Test Suites list
- **THEN** the grid SHALL apply the chosen sort instead of the default
