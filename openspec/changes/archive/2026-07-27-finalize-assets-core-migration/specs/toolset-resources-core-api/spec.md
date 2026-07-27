## MODIFIED Requirements

### Requirement: Application try-out-tool runs a direct MCP client session against Core
The system SHALL invoke an application's tool directly against DIAL Core's application MCP endpoint by
opening a short-lived MCP client session (initialize handshake, then a single `callTool` request),
authenticated with the admin bearer token, and SHALL close that session after the call completes or
fails — mirroring the toolset try-out-tool behavior, but addressed via Core's deployment-scoped MCP
route rather than the toolset-scoped one.

#### Scenario: Try-out-tool calls Core's application MCP endpoint directly
- **WHEN** `tryOutAssetTool` is called for `ResourceType.APPLICATION`
- **THEN** an MCP client session is opened directly against DIAL Core's application (deployment-scoped)
  MCP endpoint, not the admin BE

#### Scenario: The session is closed after a successful call
- **WHEN** an application tool call completes successfully
- **THEN** the MCP client session is closed before the result is returned

#### Scenario: The session is closed after a failed call
- **WHEN** an application tool call fails
- **THEN** the MCP client session is still closed, and a recognizable error response is returned

#### Scenario: Request and response shapes are unchanged
- **WHEN** `tryOutAssetTool` is called for `ResourceType.APPLICATION` with a path and a `callToolRequest`
- **THEN** the response shape matches what the admin-BE-backed implementation previously returned

## REMOVED Requirements

### Requirement: Application try-out-tool remains unaffected
**Reason**: Superseded by the "Application try-out-tool runs a direct MCP client session against Core"
requirement above — applications now route through Core the same way toolsets already do, closing the
last admin-BE dependency for this capability.
**Migration**: No caller-facing change — `tryOutAssetTool`'s signature and response shape are unchanged
(see the new requirement's scenarios). No action needed by callers.
