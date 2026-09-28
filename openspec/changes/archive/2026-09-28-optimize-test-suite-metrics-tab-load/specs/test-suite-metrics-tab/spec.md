## Purpose

Governs what data the test suite Metrics tab fetches, and when, so that opening the tab and opening
its create/edit metric modal each make only the requests their own render actually needs.

## ADDED Requirements

### Requirement: Single aggregated fetch for the Metrics tab's initial render
The system SHALL fetch a test suite's bound metrics for the Metrics tab's initial render with a
single request that returns each metric together with its metric declaration (including
description) and metric declaration version (including `outputSchema`). The system SHALL NOT issue
a separate per-metric request to obtain a metric's `outputSchema`.

#### Scenario: Suite with multiple bound metrics
- **WHEN** a user opens the Metrics tab of a test suite that has several bound metrics
- **THEN** the system issues exactly one request to load the metrics for that render, and every
  metric card and the score-settings panel have the data (name, description, condition, bindings,
  `outputSchema`) they need from that single response

#### Scenario: Suite with no bound metrics
- **WHEN** a user opens the Metrics tab of a test suite with no bound metrics
- **THEN** the system issues the same single request, receives an empty result, and renders the
  no-metrics state without any additional request

### Requirement: Metric declarations listing deferred to the create/edit metric modal
The system SHALL NOT fetch the metric declarations listing when the Metrics tab is opened or
rendered. The system SHALL fetch the metric declarations listing only when the create/edit metric
modal is opened, and SHALL show a loading state within the modal's metric-selection step until that
fetch resolves.

#### Scenario: Opening the Metrics tab does not list declarations
- **WHEN** a user opens the Metrics tab
- **THEN** the system does not request the metric declarations listing, regardless of how many
  metrics are bound to the suite

#### Scenario: Opening the add-metric modal triggers the listing
- **WHEN** a user opens the create/edit metric modal from the Metrics tab
- **THEN** the system requests the metric declarations listing at that point, and the modal's
  metric-selection step shows a loading indicator until the response arrives

### Requirement: Metric card descriptions render from the aggregated response
The system SHALL render each metric card's description from the metric declaration nested in the
aggregated fetch's response, without depending on the metric declarations listing.

#### Scenario: Description shown without the declarations listing having been fetched
- **WHEN** the Metrics tab has loaded via the aggregated fetch and the metric declarations listing
  has never been requested (the user has not opened the add/edit modal)
- **THEN** each metric card whose declaration has a description shows that description
