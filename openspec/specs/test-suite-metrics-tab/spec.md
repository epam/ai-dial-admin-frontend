# test-suite-metrics-tab Specification

## Purpose

Governs what data the test suite Metrics tab fetches, and when, so that opening the tab and opening
its create/edit metric modal each make only the requests their own render actually needs.

## Requirements

### Requirement: Aggregated fetch for the Metrics tab's initial render, with condition backfilled
The system SHALL fetch a test suite's bound metrics for the Metrics tab's initial render with a
single aggregated request that returns each metric together with its metric declaration (including
description) and metric declaration version (including `outputSchema`). The system SHALL NOT issue
a separate per-metric request to obtain a metric's `outputSchema`.

The aggregated response does not carry a metric's `condition`. The system SHALL backfill `condition`
by also fetching the plain metrics list (one additional, non-per-metric request) in parallel with the
aggregated fetch, and merging each metric's `condition` from that list by metric id. This backfill is
a stopgap for the aggregated endpoint's gap, not a feature of the tab's loading model: it SHALL be
removed once the aggregated response carries `condition` itself.

#### Scenario: Suite with multiple bound metrics
- **WHEN** a user opens the Metrics tab of a test suite that has several bound metrics
- **THEN** the system issues exactly one aggregated request and one plain-list request to load the
  metrics for that render, and every metric card and the score-settings panel have the data (name,
  description, condition, bindings, `outputSchema`) they need from those two responses combined

#### Scenario: Suite with no bound metrics
- **WHEN** a user opens the Metrics tab of a test suite with no bound metrics
- **THEN** the system issues the same two requests, receives empty results, and renders the
  no-metrics state without any additional request

#### Scenario: Metric condition round-trips after being saved
- **WHEN** a user sets a metric's condition in the create/edit metric modal and confirms, and the
  Metrics tab then reloads its metrics
- **THEN** the metric card shows the saved condition (not "Always run"), and reopening the edit
  modal for that metric prefills the Condition field with the saved value

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
