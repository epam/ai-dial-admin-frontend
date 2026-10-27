## MODIFIED Requirements

### Requirement: Calculating state shows elapsed time until settle

Until `getRunCosts` has settled the cards, each cost card SHALL show a spinner with the Calculating
label as its value and a description of the form `MM:SS elapsed · usually under 2 min`, where
`MM:SS` is the wall-clock time since the first attempt started. The elapsed counter SHALL keep
running across retries — it measures the wait, not the current request. The system SHALL NOT use
`AnalyticsCard.isLoading` for this state, because that path hides the description.

#### Scenario: Calculating copy while costs are pending

- **WHEN** the structured-query slice has resolved and `getRunCosts` has not yet settled
- **THEN** each cost card’s value area shows a spinner and the Calculating label
- **AND** each cost card’s description shows elapsed time in `MM:SS` plus the soft “usually under
  2 min” expectation

#### Scenario: Elapsed time ticks while pending

- **WHEN** fifteen seconds have elapsed since the costs fetch started and the fetch is still pending
- **THEN** the cost card description includes `00:15 elapsed`
