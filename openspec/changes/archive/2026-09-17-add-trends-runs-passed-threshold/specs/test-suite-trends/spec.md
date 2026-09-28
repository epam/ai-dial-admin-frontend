## Purpose

Defines Test Suite Trends tab behavior for summarizing how recent suite runs compare against the
suite’s optional overall score threshold, including KPI card visibility and pass/fail/error counts.

## ADDED Requirements

### Requirement: Runs Passed Threshold KPI card visibility
When the Trends tab has at least one run in its Trends window, the system SHALL render a
**Runs Passed Threshold** KPI card if and only if the suite’s `overallScoreThreshold` is set
(including `0`). When `overallScoreThreshold` is unset (`null` / `undefined`), the card SHALL be
omitted entirely — not shown as empty or “No Data”.

#### Scenario: Card shown when threshold is configured
- **WHEN** the Trends tab has run data and the suite has `overallScoreThreshold` set to a number
  (including `0`)
- **THEN** the KPI strip includes a Runs Passed Threshold card

#### Scenario: Card hidden when threshold is unset
- **WHEN** the Trends tab has run data and the suite has no `overallScoreThreshold`
- **THEN** the Runs Passed Threshold card does not appear in the KPI strip

### Requirement: Runs Passed Threshold metric and window label
The Runs Passed Threshold card SHALL show a primary metric of `passed / total`, where `total` is
the number of runs in the current Trends window and `passed` is the count of those runs that meet
the pass rule below. The card title SHALL include a fixed window label of the form
“Last {N} Runs” where `N` is the Trends run-window size (currently 10), even when fewer than `N`
runs exist.

#### Scenario: Metric reflects passed count over window size
- **WHEN** the Trends window has 7 runs and 3 of them pass the threshold
- **THEN** the card displays `3` as the primary numerator and `/7` as the denominator

#### Scenario: Window label uses configured Trends window size
- **WHEN** the Trends run-window size is 10 and the suite has fewer than 10 runs with a threshold set
- **THEN** the card title still includes “Last 10 Runs”

### Requirement: Threshold outcome aggregation for the Trends window
For each run in the Trends window, the system SHALL classify outcomes against
`overallScoreThreshold` as follows:
- **error** — the run is failed (`isFailed === true`), regardless of whether an overall score exists
- **passed** — the run is not failed, has a non-null overall score, and that score is greater than or
  equal to the threshold
- **failed** — the run is not failed, has a non-null overall score, and that score is less than the
  threshold
- runs that are not failed and have a null overall score SHALL count toward `total` only and SHALL
  not increment passed, failed, or error

The card SHALL always show all three legend statuses (pass, fail, error) with their counts,
including zeros.

#### Scenario: Passed and failed by score against threshold
- **WHEN** the threshold is `0.5`, and the window has a non-failed run with overall score `0.6` and
  a non-failed run with overall score `0.4`
- **THEN** the legend shows 1 pass and 1 fail for those runs

#### Scenario: Exact threshold counts as pass
- **WHEN** the threshold is `0.5` and a non-failed run has overall score `0.5`
- **THEN** that run is counted as pass

#### Scenario: Failed run counts as error even with a score
- **WHEN** a run is failed and has an overall score
- **THEN** that run is counted as error, not pass or fail

#### Scenario: Unscored non-failed run only increases total
- **WHEN** a run is not failed and has no overall score
- **THEN** that run increases `total` but does not increase pass, fail, or error counts

#### Scenario: Legend always shows zero counts
- **WHEN** the card is shown and one of pass, fail, or error has count `0`
- **THEN** that status still appears in the legend with `0`
