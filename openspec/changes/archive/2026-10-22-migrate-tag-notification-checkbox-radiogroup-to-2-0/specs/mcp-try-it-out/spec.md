## MODIFIED Requirements

### Requirement: MCP response status uses isError field

For MCP_TOOL suites, the response status badge SHALL use the `isError` boolean from the MCP response envelope instead of `statusCode`.

#### Scenario: Successful MCP response renders success badge
- **WHEN** try-it-out completes for an MCP suite and `response.isError === false`
- **THEN** the `Notification` SHALL render with `NotificationVariant.Success`
- **AND** SHALL display "Tool call succeeded" or equivalent label

#### Scenario: Error MCP response renders error badge
- **WHEN** try-it-out completes for an MCP suite and `response.isError === true`
- **THEN** the `Notification` SHALL render with `NotificationVariant.Error`
- **AND** SHALL display "Tool call returned an error" or equivalent label

#### Scenario: MCP response displays full MCP envelope in Response collapsible
- **WHEN** try-it-out completes for an MCP suite
- **THEN** the "Response" collapsible section SHALL display the full MCP response envelope via the existing read-only Monaco JSON viewer (`EntityJsonEditor`)
- **AND** no special rendering of content blocks or structuredContent is applied — the raw JSON envelope is shown as-is

#### Scenario: HTTP status code not shown for MCP response
- **WHEN** try-it-out completes for an MCP suite
- **THEN** the `Notification` SHALL NOT display a numeric HTTP status code
- **AND** SHALL use the `isError` boolean exclusively for status determination

