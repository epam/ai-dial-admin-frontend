# Spec Delta

## ADDED Requirements

### Requirement: Trace link for a single Try out request
After a Try out request, when Grafana is configured and Core returned a `traceparent` for it, the Try out panel SHALL offer an "Open trace" link to that one trace in Grafana Explore on the configured Tempo datasource and organization, opening in a new tab without giving the opened page access to the admin console tab. The link SHALL be offered as soon as Core's response headers arrive, including for a stream still in progress.

#### Scenario: Link shown
- **WHEN** Grafana is configured and Core's response carries a valid `traceparent`
- **THEN** the panel shows an "Open trace" link that opens that trace in a new tab

#### Scenario: Link during a stream
- **WHEN** a streamed reply is still arriving
- **THEN** the link is already shown

### Requirement: No trace link without Grafana or a trace id
The Try out panel SHALL NOT show the trace link when `GRAFANA_TRACES_URL` is unset, empty or whitespace-only, or when Core's response has no valid `traceparent` (for example, Core runs with no tracing SDK). No Grafana URL SHALL be built in either case, and the rest of the panel SHALL behave as it does with a link.

#### Scenario: Grafana not configured
- **WHEN** Grafana is not configured
- **THEN** no trace link is shown

#### Scenario: No traceparent
- **WHEN** Core's response has no `traceparent`, or one that is malformed
- **THEN** no trace link is shown
