## MODIFIED Requirements

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
  metrics for that render, and every metric card and the Overall Score card have the data (name,
  description, condition, bindings, `outputSchema`) they need from those two responses combined

#### Scenario: Suite with no bound metrics
- **WHEN** a user opens the Metrics tab of a test suite with no bound metrics
- **THEN** the system issues the same two requests, receives empty results, and renders the
  no-metrics state without any additional request and WITHOUT an Overall Score card or Edit affordance

#### Scenario: Metric condition round-trips after being saved
- **WHEN** a user sets a metric's condition in the create/edit metric modal and confirms, and the
  Metrics tab then reloads its metrics
- **THEN** the metric card shows the saved condition (not "Always run"), and reopening the edit
  modal for that metric prefills the Condition field with the saved value

## ADDED Requirements

### Requirement: Overall Score card and Edit modal when metrics exist
When the Metrics tab has one or more bound metrics, the system SHALL render an Overall Score summary
card with an Edit control. Edit SHALL open a modal (draft suite state) where the user configures
Overall Score method (Mean, Weighted mean, or Specific function), optional Enable threshold, and —
when Specific function is selected — nested Test Case Score (Mean or Weighted mean only). Apply
SHALL commit the draft to the suite via the tab's `onChange`; Cancel SHALL discard the draft.

#### Scenario: Card visible only when metrics exist
- **WHEN** the Metrics tab has loaded and the suite has at least one bound metric
- **THEN** the Overall Score card is visible and Edit opens the Overall Score modal

#### Scenario: No score chrome when empty
- **WHEN** the Metrics tab has loaded and the suite has zero bound metrics
- **THEN** neither the Overall Score card nor the Edit modal entry point is rendered

### Requirement: Persist nested Test Case Score as `testCaseOverallScore`
When the user Applies Overall Score as Specific function (`custom_function`), the system SHALL
persist a nested Test Case Score on the suite as `testCaseOverallScore` with type `mean` or
`weighted_mean` only (never `custom_function`). When the user Applies Overall Score as Mean or
Weighted mean, the system SHALL clear `testCaseOverallScore` (omit / null) so per-test-case scoring
falls back to `overallScore`.

#### Scenario: ROC AUC Apply writes both fields
- **WHEN** the user selects Specific function (ROC AUC), configures nested Test Case Score as Mean,
  and Applies
- **THEN** the suite draft has `overallScore.type === custom_function` with a function expression and
  `testCaseOverallScore.type === mean`

#### Scenario: Mean Apply clears nested field
- **WHEN** the user selects Mean and Applies
- **THEN** the suite draft has `overallScore.type === mean` and no `testCaseOverallScore`

#### Scenario: Apply disabled without nested score for function
- **WHEN** Specific function is selected and nested Test Case Score is missing or Weighted mean has
  no valid weight rows
- **THEN** Apply is disabled
