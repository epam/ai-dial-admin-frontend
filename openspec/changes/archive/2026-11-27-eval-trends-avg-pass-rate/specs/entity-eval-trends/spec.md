## ADDED Requirements

### Requirement: Average pass rate across all test suites

When at least one suite is available, the Eval Trends tab SHALL show an **Avg Pass Rate Across All
Test Suites** KPI card in a row immediately before the month-to-date eval cost card under the
“Trends in All Test Suites” header. The card SHALL load a summary from
`POST /api/v1/analytics/test-suites/pass-rate` with the loaded suite ids (batched at most 100
distinct ids per request). The displayed value SHALL be the (batch-combined) `passRate` as a
percentage with at most one decimal. When both `passRate` and `previousPassRate` are present and
differ, the card SHALL show a trend badge: **Trending up** (positive tone) when the latest mean is
higher, **Trending down** (negative tone) when it is lower. The footer SHALL use the loaded suite
count (same “Based on all … test suites” wording as the cost card). Loading or failure SHALL not
block the suite picker or Trends; a missing or failed rate SHALL render an em dash without a trend
badge. The pass-rate card SHALL be omitted from the empty-suite state together with the cost card.

#### Scenario: Pass-rate card with trending up

- **WHEN** suites exist and the summary returns `passRate` `0.613` and `previousPassRate` `0.5`
- **THEN** the card shows `61.3%`, a Trending up badge, and a footer based on the loaded suite count
- **AND** the card appears in the same row before the month-cost card

#### Scenario: Pass-rate card with trending down

- **WHEN** suites exist and the summary returns `passRate` `0.4` and `previousPassRate` `0.6`
- **THEN** the card shows `40%` and a Trending down badge

#### Scenario: No trend badge when previous rate is missing or equal

- **WHEN** suites exist and `previousPassRate` is absent, or both rates are equal
- **THEN** the card shows the percentage (or an em dash when `passRate` is absent) without a trend
  badge

#### Scenario: Em dash when the pass-rate request fails

- **WHEN** the pass-rate request rejects
- **THEN** the card shows an em dash without a trend badge and the suite picker and Trends remain
  usable

#### Scenario: Pass-rate card omitted when no suites

- **WHEN** no suites match the entity
- **THEN** the Trends in All Test Suites header, pass-rate card, and cost card are not shown
