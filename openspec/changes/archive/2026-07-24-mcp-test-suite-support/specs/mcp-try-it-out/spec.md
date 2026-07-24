# MCP Try-it-out

## Purpose

Extends the existing Try-it-out sidebar panel to support MCP_TOOL test suites. The actual API call (`tryOutTestSuite`) is unchanged — the backend routes by suite type internally. Only labels, the preview section, and response status rendering differ for MCP suites.

## ADDED Requirements

### Requirement: Try-it-out panel adapts to MCP_TOOL suite type

The `TryOut` component SHALL detect `testSuite.suiteType === 'MCP_TOOL'` and render MCP-specific labels and status display while keeping the variables table, send/restart controls, and Request/Response collapsibles identical to the DEPLOYMENT flow.

#### Scenario: MCP suite shows "Tool Arguments Preview" label
- **WHEN** the try-it-out panel is open for an `MCP_TOOL` suite
- **THEN** the preview label SHALL read "Tool Arguments Preview" instead of "Request Body Preview"

#### Scenario: MCP suite shows TOOL CALL identifier instead of method/URL
- **WHEN** the try-it-out panel is open for an `MCP_TOOL` suite
- **THEN** the line below the preview label SHALL read `TOOL CALL {mcpDeploymentRef.name}:{toolRef.name}`
- **AND** SHALL NOT show `endpointRef.method` or `endpointRef.relativeUrlPattern`

#### Scenario: DEPLOYMENT suite try-it-out is unchanged
- **WHEN** the try-it-out panel is open for a `DEPLOYMENT` suite
- **THEN** all existing labels, method/URL line, and status rendering SHALL be unchanged

### Requirement: MCP response status uses isError field

For MCP_TOOL suites, the response status badge SHALL use the `isError` boolean from the MCP response envelope instead of `statusCode`.

#### Scenario: Successful MCP response renders success badge
- **WHEN** try-it-out completes for an MCP suite and `response.isError === false`
- **THEN** the `DialNotification` SHALL render with `NotificationVariant.Success`
- **AND** SHALL display "Tool call succeeded" or equivalent label

#### Scenario: Error MCP response renders error badge
- **WHEN** try-it-out completes for an MCP suite and `response.isError === true`
- **THEN** the `DialNotification` SHALL render with `NotificationVariant.Error`
- **AND** SHALL display "Tool call returned an error" or equivalent label

#### Scenario: MCP response displays full MCP envelope in Response collapsible
- **WHEN** try-it-out completes for an MCP suite
- **THEN** the "Response" collapsible section SHALL display the full MCP response envelope via the existing read-only Monaco JSON viewer (`EntityJsonEditor`)
- **AND** no special rendering of content blocks or structuredContent is applied — the raw JSON envelope is shown as-is

#### Scenario: HTTP status code not shown for MCP response
- **WHEN** try-it-out completes for an MCP suite
- **THEN** the `DialNotification` SHALL NOT display a numeric HTTP status code
- **AND** SHALL use the `isError` boolean exclusively for status determination

### Requirement: TryOut button available for MCP_TOOL suites

The "Try Out" button in `McpMethodContent` SHALL function identically to the existing `TryOutButton` in `MethodTabContent` — it opens the sidebar with the `TryOut` panel passing the current suite.

#### Scenario: TryOut button opens sidebar for MCP suite
- **WHEN** user clicks "Try Out" on the MCP method tab
- **THEN** the sidebar SHALL open with the `TryOut` panel for the current MCP_TOOL suite

#### Scenario: TryOut button disabled when sidebar is already open
- **WHEN** the sidebar is already open with Try-it-out content
- **THEN** the "Try Out" button SHALL be disabled (same behavior as DEPLOYMENT suites)
