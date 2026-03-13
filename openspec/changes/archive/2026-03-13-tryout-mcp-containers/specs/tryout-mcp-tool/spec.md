## ADDED Requirements

### Requirement: TryOut button visible for MCP container tools
The TryOut button SHALL be displayed in the tool header for each tool listed under an MCP container deployment, matching the existing behavior for core and asset toolsets.

#### Scenario: TryOut button shown for running MCP container
- **WHEN** user views the Tools tab of a running MCP container deployment
- **THEN** each tool row SHALL display a "Try Out" button in the tool header

#### Scenario: TryOut button not shown for manually added tools
- **WHEN** a tool is manually added (not discovered from MCP)
- **THEN** the TryOut button SHALL NOT be displayed (existing behavior preserved)

### Requirement: TryOut sidebar opens for MCP container tool
The TryOut sidebar SHALL open when clicking the TryOut button on an MCP container tool, displaying the tool's input schema as a form and a response section.

#### Scenario: Open TryOut sidebar
- **WHEN** user clicks the TryOut button on an MCP container tool
- **THEN** a sidebar opens with the tool name, a request section (form/JSON toggle based on input schema), a "Send Request" button, and a response section

#### Scenario: Tool with no input schema
- **WHEN** the MCP tool has no input schema properties
- **THEN** the request section SHALL display "No inputs" and the view toggle SHALL be disabled

### Requirement: Execute tool call against deployments backend
The system SHALL send tool call requests to `POST /api/v1/deployments/mcp/{containerId}/call-tool` on `DIAL_DEPLOYMENTS_API_URL` with the body `{ name, arguments }`.

#### Scenario: Successful tool execution
- **WHEN** user fills in arguments and clicks "Send Request"
- **THEN** the system SHALL POST `{ name: "<toolName>", arguments: <userInput> }` to the deployments backend
- **AND** the response SHALL be displayed in a readonly JSON editor in the response section

#### Scenario: Tool execution error
- **WHEN** the backend returns an error (e.g., container stopped, tool failure)
- **THEN** the response section SHALL display `{ error: "<errorMessage>" }`

#### Scenario: Loading state during execution
- **WHEN** a request is in flight
- **THEN** the "Send Request" button SHALL be disabled
- **AND** the response section SHALL display a loading indicator

### Requirement: API layer for container tool calls
`ContainersApi` SHALL expose a `callContainerTool(containerId, body, token)` method that POSTs to `/api/v1/deployments/mcp/{containerId}/call-tool`. A corresponding `tryOutContainerTool(containerId, body)` server action SHALL be available.

#### Scenario: Server action delegates to ContainersApi
- **WHEN** the `tryOutContainerTool` server action is called with a container ID and request body
- **THEN** it SHALL authenticate via `getUserToken` and delegate to `ContainersApi.callContainerTool`
