# Test Suite List

## ADDED Requirements

### Requirement: Suite type column in test suites list

The test suites list grid SHALL include a `suiteType` column showing whether each suite is a `DEPLOYMENT` or `MCP_TOOL` suite.

#### Scenario: suiteType column displays suite type value
- **WHEN** user views the test suites list
- **THEN** the `suiteType` column SHALL display `DEPLOYMENT` or `MCP_TOOL` for each row
- **AND** the column SHALL be visible by default (not hidden)

#### Scenario: suiteType column supports equals filter
- **WHEN** user applies a filter on the `suiteType` column with value `MCP_TOOL`
- **THEN** the grid SHALL send `filter=suiteType:eq:MCP_TOOL` to the backend
- **AND** only MCP_TOOL suites SHALL be returned

#### Scenario: suiteType column filter options are equals only
- **WHEN** user opens the filter for the `suiteType` column
- **THEN** only the "Equals" filter option SHALL be available (matching `evalStringFilter` pattern)

### Requirement: Application column shows MCP deployment name as fallback

The `Application` column in the test suites list SHALL display `mcpDeploymentRef.name` for MCP_TOOL suites that have no `deploymentRef`.

#### Scenario: MCP suite shows mcpDeploymentRef name in Application column
- **WHEN** a test suite has `suiteType: 'MCP_TOOL'` and `mcpDeploymentRef.name: 'Confluence Search'`
- **THEN** the Application column SHALL display "Confluence Search"

#### Scenario: DEPLOYMENT suite Application column is unchanged
- **WHEN** a test suite has `suiteType: 'DEPLOYMENT'`
- **THEN** the Application column SHALL display `deploymentRef.name` as before
