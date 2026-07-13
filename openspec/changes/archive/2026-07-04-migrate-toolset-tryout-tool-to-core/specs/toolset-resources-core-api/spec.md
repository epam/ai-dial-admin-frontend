## ADDED Requirements

### Requirement: Toolset try-out-tool runs a direct MCP client session against Core
The system SHALL invoke a toolset's tool directly against DIAL Core's MCP endpoint by opening a short-lived MCP client session (initialize handshake, then a single `callTool` request), authenticated with the admin bearer token, and SHALL close that session after the call completes or fails.

#### Scenario: Try-out-tool calls Core's MCP endpoint directly
- **WHEN** `tryOutAssetTool` is called for `ResourceType.TOOLSET`
- **THEN** an MCP client session is opened directly against DIAL Core's toolset MCP endpoint, not the admin BE

#### Scenario: The session is closed after a successful call
- **WHEN** a tool call completes successfully
- **THEN** the MCP client session is closed before the result is returned

#### Scenario: The session is closed after a failed call
- **WHEN** a tool call fails
- **THEN** the MCP client session is still closed, and a recognizable error response is returned

### Requirement: Try-out-tool preserves the existing request/response contract
The system SHALL accept the same `{ toolSetPath: { path }, callToolRequest: { name, arguments } }` request shape and return the same raw tool-call-result shape the admin BE previously returned, so no caller-side change is required.

#### Scenario: Request and response shapes are unchanged
- **WHEN** `tryOutAssetTool` is called with a toolset path and a `callToolRequest`
- **THEN** the response shape matches what the admin-BE-backed implementation previously returned

### Requirement: Application try-out-tool remains unaffected
The system SHALL continue routing `tryOutAssetTool` calls for `ResourceType.APPLICATION` through the admin BE, unchanged by this capability.

#### Scenario: Application resource type is unaffected
- **WHEN** `tryOutAssetTool` is called for `ResourceType.APPLICATION`
- **THEN** the request is still routed through the admin BE, not DIAL Core
