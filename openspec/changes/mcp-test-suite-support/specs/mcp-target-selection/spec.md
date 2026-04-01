# MCP Target Selection

## Purpose

Extends the test suite create wizard's Target step to support selecting a DIAL toolset and tool as an alternative to selecting an HTTP application. The selected target determines the suite type (`DEPLOYMENT` vs `MCP_TOOL`), which is immutable after creation.

## ADDED Requirements

### Requirement: Target step has Applications and Toolsets tabs

The Target step in the create wizard SHALL display two tabs: "Applications" and "Toolsets". The Applications tab is active by default and shows the existing application grid (behavior unchanged). The Toolsets tab shows a grid of toolsets fetched from `GET /api/v1/deployments?type=dial-toolset`.

#### Scenario: Default tab is Applications
- **WHEN** user reaches the Target step
- **THEN** the "Applications" tab SHALL be active and show the deployments grid as before

#### Scenario: Toolsets tab loads toolset list
- **WHEN** user clicks the "Toolsets" tab
- **THEN** the system SHALL call `GET /api/v1/deployments?type=dial-toolset`
- **AND** display the toolsets in a grid with columns: Display Name, ID, Transport, Created At

#### Scenario: Toolsets tab shows loading state
- **WHEN** the toolsets request is in-flight
- **THEN** the system SHALL display a `DialLoader` in place of the grid

#### Scenario: Toolsets tab shows empty state
- **WHEN** the API returns no toolsets
- **THEN** the system SHALL display the standard "No data" empty state

### Requirement: Tool picker appears after toolset selection

After selecting a toolset row in the Toolsets grid, the system SHALL display an inline tool picker section below the grid showing available tools for the selected toolset.

#### Scenario: Tool picker loads tools on toolset selection
- **WHEN** user selects a toolset row
- **THEN** the system SHALL call `GET /api/v1/deployments/dial-toolset/{id}/tools`
- **AND** display the tool list as a selectable grid with columns: Tool Name, Description, Input Schema (field count)
- **AND** the toolset row SHALL remain visually selected

#### Scenario: Tool picker shows loading state
- **WHEN** the tools request is in-flight
- **THEN** the system SHALL display a `DialLoader` inside the tool picker section

#### Scenario: Tool picker shows empty state
- **WHEN** the API returns no tools for the selected toolset
- **THEN** the system SHALL display a "No tools available" message

#### Scenario: Tool picker shows error state
- **WHEN** the tool discovery API call fails
- **THEN** the system SHALL display a toast error notification
- **AND** the tool picker section SHALL show an error message with a retry option

#### Scenario: Tool selection completes target setup
- **WHEN** user selects a tool from the tool picker
- **THEN** the suite state SHALL be updated with:
  - `suiteType: 'MCP_TOOL'`
  - `mcpDeploymentRef: { id, type: 'dial-toolset', name }`
  - `toolRef: { name, description, inputSchema, outputSchema }`
- **AND** the Target step status SHALL become valid (green checkmark in stepper)

#### Scenario: Selecting different toolset resets tool selection
- **WHEN** user selects a different toolset after already selecting a toolset+tool
- **THEN** the previously selected tool SHALL be deselected
- **AND** the tool picker SHALL reload tools for the new toolset

### Requirement: Suite type derived from target selection

The system SHALL derive `suiteType` from the user's selection in the Target step. It is never an explicit user input.

#### Scenario: Application selection sets DEPLOYMENT type
- **WHEN** user selects an application in the Applications tab
- **THEN** `testSuite.suiteType` SHALL be set to `'DEPLOYMENT'`
- **AND** `testSuite.deploymentRef` SHALL be populated
- **AND** `testSuite.mcpDeploymentRef`, `toolRef`, `argumentTemplate` SHALL be cleared

#### Scenario: Tool selection sets MCP_TOOL type
- **WHEN** user selects a tool in the Toolsets tab
- **THEN** `testSuite.suiteType` SHALL be set to `'MCP_TOOL'`
- **AND** `testSuite.mcpDeploymentRef` and `toolRef` SHALL be populated
- **AND** `testSuite.deploymentRef`, `endpointRef`, `requestTemplate` SHALL be cleared

### Requirement: Create wizard step flow adapts to suite type

After the Target step, the Methods step SHALL only appear for `DEPLOYMENT` suites. `MCP_TOOL` suites proceed directly to finish (no Methods step).

#### Scenario: DEPLOYMENT suite shows Methods step
- **WHEN** user selects an application in the Target step
- **THEN** the stepper SHALL show: Properties → Target → Methods
- **AND** the "Next" button from Target navigates to Methods

#### Scenario: MCP_TOOL suite skips Methods step
- **WHEN** user selects a toolset+tool in the Target step
- **THEN** the stepper SHALL show: Properties → Target (no Methods step)
- **AND** the Target step "Next" / "Finish" button SHALL submit the suite creation directly

#### Scenario: Target step validity for MCP suite
- **WHEN** user has selected a toolset but NOT yet selected a tool
- **THEN** the Target step status SHALL remain incomplete
- **AND** the "Next/Finish" button SHALL be disabled

#### Scenario: Switching from Toolsets tab back to Applications resets MCP fields
- **WHEN** user is on the Toolsets tab with a selection and then clicks the Applications tab and selects an application
- **THEN** `suiteType` SHALL become `'DEPLOYMENT'`
- **AND** all MCP fields SHALL be cleared from the suite state

### Requirement: Change Tool modal for existing MCP suites

On the MCP method tab of an existing MCP_TOOL suite, a "Change Toolset / Tool" button SHALL open a modal containing the same Toolsets tab content (toolset grid + tool picker) to replace `mcpDeploymentRef` and `toolRef`.

#### Scenario: Change Tool modal opens
- **WHEN** user clicks "Change Toolset / Tool" on the MCP method tab
- **THEN** a modal SHALL open showing the toolset grid with the current toolset pre-selected
- **AND** the tool picker SHALL show tools for the current toolset with the current tool pre-selected

#### Scenario: Confirming Change Tool updates suite
- **WHEN** user selects a new toolset+tool and clicks "Save"
- **THEN** `mcpDeploymentRef` and `toolRef` SHALL be updated to the new selection
- **AND** `argumentTemplate` SHALL be reset to a fresh template with all fields in Binding mode (empty binding)

#### Scenario: Cancelling Change Tool preserves existing values
- **WHEN** user opens the Change Tool modal and clicks "Cancel"
- **THEN** `mcpDeploymentRef`, `toolRef`, and `argumentTemplate` SHALL remain unchanged
