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

## REMOVED Requirements

### Requirement: A missing dimension value carries its tab's fallback label

**Reason**: The `Tools` tab's `Other methods` bucket collected the protocol methods, and the MCP view
no longer reads those rows at all — no row reaching the tab can be without a tool name. The scenario
asserting that bucket, and the pinning rule written for it, cannot be kept in a modified block, so
the requirement is replaced rather than edited.

**Migration**: The `No Project` and `Direct call` fallbacks are unchanged and are restated in the
added requirement below. No stored data or preference refers to the removed bucket.

## ADDED Requirements

### Requirement: Missing dimension values carry the shared fallback labels

A row whose dimension value is missing — falsy or the literal string `undefined` — SHALL render its
dimension's fallback label: `No Project` on the `Projects` tab, for a call made outside any project,
`Direct call` on the `Applications` tab, for a call with no calling deployment. Each SHALL carry a tooltip stating the
cause, and the `Direct call` tooltip SHALL be specific to the active view, because an LLM call with
no parent was made against the model directly while an MCP call with no parent came from a try-out.

The `Tools` tab SHALL carry no fallback bucket. It existed for the protocol methods —
`initialize`, `tools/list`, a notification — and the MCP view no longer reads those rows at all, so
no row reaching the tab can be without a tool name. No tab SHALL pin a fallback row below the ranked
ones; every fallback row keeps its ranked place.

Both labels SHALL be localized, SHALL be presentational — the underlying value is unchanged — and
SHALL be what a copied cell carries. The literal text `undefined` SHALL never be rendered, on any
tab, in the side panel, or in a copied cell.

#### Scenario: Missing project renders No Project

- **WHEN** a row on the `Projects` tab has no project value
- **THEN** the cell renders `No Project` with its tooltip

#### Scenario: Missing parent deployment renders Direct call

- **WHEN** a row on the `Applications` tab has no calling deployment value
- **THEN** the cell renders `Direct call` with the tooltip its view defines

#### Scenario: The Tools tab has no fallback bucket

- **GIVEN** the MCP view's `Tools` tab
- **WHEN** the table renders
- **THEN** no `Other methods` row is shown
- **AND** every row keeps its ranked place

#### Scenario: A fallback row on another tab keeps its rank

- **GIVEN** the `Applications` tab, whose fallback bucket outranks every named row
- **WHEN** the table renders
- **THEN** `Direct call` sits in its ranked place

#### Scenario: Side panel uses the same fallback

- **WHEN** a row carrying a fallback label is opened
- **THEN** the panel's title carries the same label
- **AND** the literal text `undefined` is not shown

## MODIFIED Requirements

### Requirement: A delta states direction, magnitude and the compared value

When comparison is on, a card's delta SHALL show the signed percentage change from the previous
window's value to the current one, and the card SHALL make the compared figure available — either in
its caption or on hover — so a percentage is never the only thing a reader can see.

Direction SHALL be conveyed by more than colour: the sign SHALL be rendered as text, and the colour
SHALL only reinforce it.

A delta SHALL be coloured by whether the change is the welcome one **for that metric**, which the
page declares per metric rather than inferring from the sign: spend, cost per token, error rate and
latency are better falling; requests, tokens and users are read as better rising. A
metric with no declared direction SHALL render its delta without a judgement. Colour is therefore
never the only carrier of meaning, and a rise is not uniformly green.

A previous window whose value is zero while the current one is not SHALL render as a new-activity
marker rather than an infinite or 100% change. Both windows at zero SHALL render no delta.

#### Scenario: Delta shows sign as text

- **WHEN** a card's current value exceeds its previous value
- **THEN** the delta reads with an explicit `+` sign
- **AND** the direction is legible without relying on colour

#### Scenario: Colour follows the metric, not the sign

- **WHEN** spend rises and requests rise by the same proportion
- **THEN** the spend delta is coloured as unwelcome and the requests delta as welcome

#### Scenario: Previous value is available to the reader

- **WHEN** a delta is shown
- **THEN** the previous window's value is reachable from the card

#### Scenario: Growth from zero is not a percentage

- **GIVEN** the previous window's value is zero and the current one is not
- **WHEN** the card renders
- **THEN** the card marks this as new activity
- **AND** it shows neither an infinite change nor `+100%`

#### Scenario: Both windows empty show no delta

- **GIVEN** both windows' values are zero
- **WHEN** the card renders
- **THEN** no delta is shown
