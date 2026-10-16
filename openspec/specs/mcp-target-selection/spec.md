# mcp-target-selection

## Purpose

Defines target and method selection in the test suite create wizard for DEPLOYMENT, MCP_TOOL, and ROUTE suites. All suite types use the same 3-step structure (Properties → Target → Method/Tool); the selected target type determines the content of step 3. The Target step offers Applications, Models, MCP, and Routes tabs.

## Requirements

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
- **THEN** the system SHALL display a `DialLoader` in place of the grid

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

### Requirement: Suite type derived from tab selection in Target step

The system SHALL derive `suiteType` from the tab in which the user selects a target. Selecting a target is sufficient to determine suite type — method or tool selection happens in the next step.

#### Scenario: Application selection sets DEPLOYMENT type
- **WHEN** user selects a deployment in the Applications tab
- **THEN** `testSuite.suiteType` SHALL be set to `'DEPLOYMENT'`
- **AND** `testSuite.deploymentRef` SHALL be populated
- **AND** `testSuite.mcpDeploymentRef`, `toolRef`, `argumentTemplate` SHALL be cleared
- **AND** the Target step SHALL become valid

#### Scenario: MCP deployment selection sets MCP_TOOL type
- **WHEN** user selects any row in the MCP tab
- **THEN** `testSuite.suiteType` SHALL be set to `'MCP_TOOL'`
- **AND** `testSuite.mcpDeploymentRef` SHALL be set to `{ id: deployment.deploymentId, type: deployment.$type, name: deployment.displayName }`
- **AND** `testSuite.deploymentRef`, `endpointRef`, `requestTemplate`, `toolRef` SHALL be cleared
- **AND** the Target step SHALL become valid

#### Scenario: Route selection sets ROUTE type
- **WHEN** user selects a route named `search-route` in the Routes tab
- **THEN** `testSuite.suiteType` SHALL be set to `'ROUTE'`
- **AND** `testSuite.routesRef` SHALL be set to `{ name: 'routes/platform/search-route' }`
- **AND** `testSuite.deploymentRef`, `mcpDeploymentRef`, `toolRef`, `argumentTemplate`, `endpointRef`, and `requestTemplate` SHALL be cleared
- **AND** the Target step SHALL become valid

#### Scenario: Switching tabs clears the previous selection
- **WHEN** user selects a deployment in the MCP tab and then switches to Applications and selects a deployment there
- **THEN** `suiteType` SHALL become `'DEPLOYMENT'`
- **AND** all MCP fields SHALL be cleared

#### Scenario: Selecting a non-route target clears the route reference
- **WHEN** user selects a route and then selects a target in the Applications, Models, or MCP tab
- **THEN** `routesRef` SHALL be cleared
- **AND** `suiteType` SHALL reflect the newly selected target

### Requirement: Create wizard uses symmetric 3-step structure

DEPLOYMENT, MCP_TOOL, and ROUTE suites SHALL use the same 3-step wizard (Properties → Target → Method/Tool). Step 3 always exists; its label and content adapt to `suiteType`.

#### Scenario: DEPLOYMENT suite step 3 shows Method content
- **WHEN** user has selected a DEPLOYMENT suite target and advances to step 3
- **THEN** the step SHALL be labelled "Method"
- **AND** SHALL render the existing `Methods.tsx` content (HTTP endpoint picker)

#### Scenario: MCP_TOOL suite step 3 shows Tool content
- **WHEN** user has selected an MCP_TOOL suite target and advances to step 3
- **THEN** the step SHALL be labelled "Tool"
- **AND** SHALL render the new `McpTool` content (tool picker for the selected MCP deployment)

#### Scenario: ROUTE suite step 3 shows route methods
- **WHEN** user has selected a ROUTE suite target and advances to step 3
- **THEN** the step SHALL be labelled "Method"
- **AND** the system SHALL load the selected route by its unprefixed name
- **AND** SHALL render method choices derived from the route's configured paths and methods

#### Scenario: Route details cannot be loaded
- **WHEN** the selected route cannot be loaded on step 3
- **THEN** the system SHALL display the "No Routes" empty state in place of the method picker

#### Scenario: Target step validity is target selection only
- **WHEN** user has selected a target in the Applications, Models, MCP, or Routes tab
- **THEN** the Target step SHALL be valid and the "Next" button SHALL be enabled
- **AND** no method or tool selection is required at this step

### Requirement: Tool step lets user pick a tool from the selected MCP deployment

Step 3 for MCP_TOOL suites SHALL display a `McpTool` component that fetches and lists all tools for `testSuite.mcpDeploymentRef` and allows the user to select one.

#### Scenario: Tool step loads tools for selected deployment
- **WHEN** user reaches step 3 with `suiteType === 'MCP_TOOL'`
- **THEN** the system SHALL call `GET /api/v1/deployments/{mcpDeploymentRef.type}/{mcpDeploymentRef.id}/tools`
- **AND** display results in a grid with columns: Tool Name, Description, Input Schema (field count)

#### Scenario: Tool step shows loading state
- **WHEN** the tools request is in-flight
- **THEN** the system SHALL display a `DialLoader`

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

### Requirement: Change Tool modal for existing MCP suites

On the MCP method tab of an existing MCP_TOOL suite, a "Change Toolset / Tool" button SHALL open `ChangeMcpToolModal`. The modal shows the MCP deployment grid and tool picker together on one screen (no step navigation) allowing the user to change both deployment and tool.

#### Scenario: Change Tool modal opens with current selection pre-selected
- **WHEN** user clicks "Change Toolset / Tool" on the MCP method tab
- **THEN** a `DialPopup` SHALL open showing the MCP deployments grid with the current `mcpDeploymentRef` pre-selected
- **AND** the tool picker SHALL immediately appear below the grid showing tools for the current deployment with the current `toolRef.name` pre-selected

#### Scenario: Changing deployment in modal resets tool selection
- **WHEN** user selects a different deployment in the modal's deployment grid
- **THEN** the tool picker SHALL reload tools for the new deployment
- **AND** no tool SHALL be pre-selected (current tool is from a different deployment)

#### Scenario: Save updates suite and resets argumentTemplate
- **WHEN** user has selected a deployment and tool in the modal and clicks "Save"
- **THEN** `mcpDeploymentRef` SHALL be updated to the new deployment
- **AND** `toolRef` SHALL be updated to the new tool
- **AND** `argumentTemplate` SHALL be reset to a fresh template via `buildInitialArguments(newToolRef.inputSchema)` (all fields in Binding mode, empty binding)

#### Scenario: Save is disabled until tool is selected
- **WHEN** user has selected a deployment but not yet selected a tool
- **THEN** the "Save" button SHALL be disabled

#### Scenario: Cancel preserves existing values
- **WHEN** user opens the modal and clicks "Cancel"
- **THEN** `mcpDeploymentRef`, `toolRef`, and `argumentTemplate` SHALL remain unchanged
