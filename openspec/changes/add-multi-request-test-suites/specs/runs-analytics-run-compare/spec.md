## MODIFIED Requirements

### Requirement: Rows are joined by test case identity

The system SHALL merge current and compared result sets into a single row array using a join key of
`testCaseId` (falling back to `testCaseName` when `testCaseId` is absent) combined with `runIndex`,
`requestIndex`, and `turnIndex`, so that a re-run test case, a chained request, and a conversation turn
each pair with their exact counterpart in the compared run rather than colliding with a sibling run,
request, or turn of the same test case. `requestIndex` and `turnIndex` SHALL default to `0` when absent,
so a non-chained, non-multi-turn run's join key is unchanged from before this change. Only rows present in
the current run are shown; test cases that exist only in the compared run are omitted.

This join key is shared by both the Analytics tab's "Compare with" sibling-run mode and the dedicated
Compare Runs page's Execution Results tab — both consume the same underlying merge function.

#### Scenario: Matched test case shows both current and compared data

- **WHEN** compare mode is active and a test case exists in both result sets, with matching `runIndex`,
  `requestIndex`, and `turnIndex`
- **THEN** the row shows current run values in Current columns and compared run values in Compared columns

#### Scenario: Unmatched test case shows dash in Compared columns

- **WHEN** compare mode is active and a test case from the current run has no matching entry (by the full
  join key) in the compared run
- **THEN** all Compared columns for that row render `—`

#### Scenario: Chained requests of the same test case pair independently

- **WHEN** compare mode is active and a test case has results for `requestIndex` `0` and `1` in both runs
- **THEN** each request's row is paired with the same request's row in the compared run, not with the
  other request

#### Scenario: A non-chained, non-multi-turn run pairs exactly as before

- **WHEN** compare mode is active and neither run's results carry `requestIndex` or `turnIndex`
- **THEN** rows pair by `testCaseId` (or `testCaseName`) and `runIndex` alone, exactly as before this
  change
