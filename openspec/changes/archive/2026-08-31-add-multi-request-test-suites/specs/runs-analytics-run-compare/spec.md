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

## ADDED Requirements

### Requirement: Merged compare rows are ordered by request before turn

The merge function SHALL order its output by `testCaseName`, then `runIndex`, then `requestIndex`, then
`turnIndex` (both index fields defaulting to `0` when absent), so a chained test case reads down the grid
in chain order with each request's turns kept together.

#### Scenario: Chained multi-turn rows read in chain order

- **WHEN** a test case produces rows for `requestIndex` `0`/`1` each with `turnIndex` `0`/`1`
- **THEN** the merged rows are ordered request `0` turn `0`, request `0` turn `1`, request `1` turn `0`,
  request `1` turn `1`

### Requirement: Heat map columns are one per merged row identity

The Compare Runs page's Heat Map tab SHALL derive each test-case column's id from the full row identity —
test case key, `runIndex`, `requestIndex`, and `turnIndex` — so a chained request gets its own column
rather than colliding with a sibling request of the same test case. The `requestIndex` segment SHALL be
omitted from the column id when the field is absent, leaving a non-chained run's column ids unchanged.

#### Scenario: Each chained request gets its own heat map column

- **WHEN** a test case has results for `requestIndex` `0` and `1` in the same sub-run
- **THEN** the heat map renders two distinct columns, each carrying only its own request's metric values

#### Scenario: Non-chained runs keep their existing column ids

- **WHEN** no row carries a `requestIndex`
- **THEN** column ids are identical to before this change

### Requirement: Heat map headers disambiguate chained requests

When any primary or compared row reports more than one request (`totalRequests > 1` or
`requestIndex > 0`), the heat map test-case header SHALL append a 1-based `R<n>` segment, placed after the
sub-run segment and before the turn segment. The segment SHALL be omitted entirely for non-chained runs.

#### Scenario: Chained headers carry the request number

- **WHEN** a chained test case "BLR" has two requests
- **THEN** its headers read `BLR_R1` and `BLR_R2`

#### Scenario: Chained multi-turn headers carry both segments

- **WHEN** a chained test case "BLR" has two requests, each with two turns, across two sub-runs
- **THEN** a header reads `BLR_<subRun>_R<request>_T<turn>`

#### Scenario: Non-chained headers are unchanged

- **WHEN** no row reports more than one request
- **THEN** headers carry no `R` segment

### Requirement: Compare grid exposes Request and Turn identity columns

The Compare Runs page's Execution Results grid SHALL offer `Request` and `Turn` columns in the `EXECUTION`
group — a Current/Compared pair each, rendered 1-based — so that chained and multi-turn rows of the same
test case can be told apart. Both pairs SHALL be hidden by default and toggleable from the column panel
alongside `# Run number`, and SHALL appear there as their own field groups. A Current cell SHALL render
empty when the field is absent; a Compared cell SHALL render `—` when the field is absent or the row has
no compared counterpart.

#### Scenario: Chained rows are distinguishable once the column is shown

- **WHEN** a user enables the `Request` column for a run containing a 2-request chain
- **THEN** the two rows of one test case show `1` and `2`

#### Scenario: Both identity pairs default to hidden

- **WHEN** the compare grid first renders
- **THEN** `Request` and `Turn` are hidden for both the Current and the Compared run, exactly as
  `# Run number` is

#### Scenario: Non-chained, single-turn rows render empty

- **WHEN** a row carries neither `requestIndex` nor `turnIndex`
- **THEN** the Current cells are empty and the Compared cells render `—`
