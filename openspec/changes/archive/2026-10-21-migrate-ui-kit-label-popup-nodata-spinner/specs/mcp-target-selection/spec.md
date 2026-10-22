## MODIFIED Requirements

### Requirement: Target step has Applications, Models, MCP, and Routes tabs

The Target step SHALL display four tabs: "Applications", "Models", "MCP", and "Routes". The Applications tab is active by default and shows the existing application grid (behavior unchanged). The Models tab shows model deployments. The MCP tab shows a grid of all MCP-capable deployments — both toolsets (`$type: 'dial-toolset'`) and applications with MCP interface (`$type: 'dial-application'`) — fetched from `GET /api/v1/deployments?interface=mcp`. The Routes tab shows platform route assets.

#### Scenario: Default tab is Applications
- **WHEN** user reaches the Target step
- **THEN** the "Applications" tab SHALL be active and show the existing deployments grid unchanged

#### Scenario: MCP tab loads all MCP-capable deployments
- **WHEN** user clicks the "MCP" tab
- **THEN** the system SHALL call `GET /api/v1/deployments?interface=mcp`
- **AND** display results in a grid with columns: Display Name, ID, Type (`$type`: "dial-toolset" or "dial-application"), Transport, Created At

#### Scenario: MCP tab shows loading state
- **WHEN** the MCP deployments request is in-flight
- **THEN** the system SHALL display a `Spinner` in place of the grid

#### Scenario: MCP tab shows empty state
- **WHEN** the API returns no MCP-capable deployments
- **THEN** the system SHALL display the standard "No data" empty state

#### Scenario: Routes tab loads platform routes
- **WHEN** user clicks the "Routes" tab
- **THEN** the system SHALL load route assets from the `platform/` routes folder
- **AND** display results in a grid with Name and Author columns

#### Scenario: Routes tab shows loading and empty states
- **WHEN** the platform routes request is in-flight
- **THEN** the system SHALL display the standard grid loading state
- **AND WHEN** the request returns no routes or fails
- **THEN** the system SHALL display the standard "No Routes" empty state

### Requirement: Tool step lets user pick a tool from the selected MCP deployment

Step 3 for MCP_TOOL suites SHALL display a `McpTool` component that fetches and lists all tools for `testSuite.mcpDeploymentRef` and allows the user to select one.

#### Scenario: Tool step loads tools for selected deployment
- **WHEN** user reaches step 3 with `suiteType === 'MCP_TOOL'`
- **THEN** the system SHALL call `GET /api/v1/deployments/{mcpDeploymentRef.type}/{mcpDeploymentRef.id}/tools`
- **AND** display results in a grid with columns: Tool Name, Description, Input Schema (field count)

#### Scenario: Tool step shows loading state
- **WHEN** the tools request is in-flight
- **THEN** the system SHALL display a `Spinner`

#### Scenario: Tool step shows empty state
- **WHEN** no tools are returned for the selected deployment
- **THEN** the system SHALL display a "No tools available" message

#### Scenario: Tool step shows error state
- **WHEN** the tool discovery API call fails
- **THEN** the system SHALL display a toast error notification and an inline retry option

#### Scenario: Tool selection sets toolRef and completes the step
- **WHEN** user selects a tool row
- **THEN** `testSuite.toolRef` SHALL be set to `{ name, description, inputSchema, outputSchema }`
- **AND** the Tool step SHALL become valid

#### Scenario: Selecting a different tool replaces toolRef
- **WHEN** user selects a different tool after already selecting one
- **THEN** `toolRef` SHALL be updated to the newly selected tool

#### Scenario: Tool step validity requires tool selection
- **WHEN** no tool has been selected in the Tool step
- **THEN** the Tool step SHALL be invalid and the "Finish" button SHALL be disabled
