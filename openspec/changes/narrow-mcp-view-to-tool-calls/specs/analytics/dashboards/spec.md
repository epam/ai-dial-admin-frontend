## ADDED Requirements

### Requirement: The MCP view counts tool calls, not protocol traffic

Every request the MCP view issues SHALL be narrowed to the `tools/call` method, alongside its
event-kind clause. Each figure in that view — the count card, the share chart, the time series, the
breakdown rows, the error rate and the average latency — SHALL therefore rest on the same rows, and
those rows SHALL be tool executions.

An MCP client fires a handshake and a discovery exchange per connection: `initialize`,
`notifications/initialized`, `tools/list`, `resources/list`. Measured on the live dataset those are
the large majority of `mcp` rows and `tools/call` is a small minority of them. Counting them as
calls made the view rank servers by how often clients connected rather than by what they did, and
made its error rate and latency describe handshakes — which are fast and rarely fail — instead of
tool execution.

The view SHALL NOT offer a separate tool-call card, since every row it counts is a tool call and the
card would restate the count beside it. The count card SHALL be named for tool calls in this view,
so the figure that card carried is still stated.

The view's surfaces SHALL be named for what they now count: its count card, its plain time-series
plot and its share chart SHALL say tool calls rather than requests or calls.

The LLM view SHALL carry no method clause: the method is an MCP concept and the column is empty on
its rows.

#### Scenario: Every MCP request is narrowed to the method

- **WHEN** the MCP view issues any of its requests
- **THEN** each carries a clause restricting the method to `tools/call`

#### Scenario: The LLM view is unchanged

- **WHEN** the LLM view issues its requests
- **THEN** none of them carries a method clause

#### Scenario: One count card, named for what it counts

- **WHEN** the KPI row renders in the MCP view
- **THEN** it offers no separate tool-call card
- **AND** its count card is named for tool calls

#### Scenario: The surfaces are named for tool calls

- **WHEN** the MCP view renders
- **THEN** its time-series plot and its share chart are named for tool calls

#### Scenario: A ranking describes use rather than connections

- **GIVEN** a server a client connects to often and calls rarely
- **WHEN** the share chart and the breakdown rank the view's servers
- **THEN** that server is ranked by the calls it served, not by the connections it received
