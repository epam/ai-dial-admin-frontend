## MODIFIED Requirements

### Requirement: Change Tool modal for existing MCP suites

On the MCP method tab of an existing MCP_TOOL suite, a "Change Toolset / Tool" button SHALL open `ChangeMcpToolModal`. The modal shows the MCP deployment grid and tool picker together on one screen (no step navigation) allowing the user to change both deployment and tool.

#### Scenario: Change Tool modal opens with current selection pre-selected
- **WHEN** user clicks "Change Toolset / Tool" on the MCP method tab
- **THEN** a `Popup` SHALL open showing the MCP deployments grid with the current `mcpDeploymentRef` pre-selected
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
