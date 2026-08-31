## ADDED Requirements

### Requirement: Run results show the request number and total request count

The run results grid SHALL display two flat columns in the `EXECUTION` column group, mirroring how `Turn`
and `Total turns` mirror `# Run number`:

- **Request** — the result's `requestIndex` rendered 1-based.
- **Total requests** — the result's `totalRequests` as supplied.

Both SHALL render empty when the underlying field is absent.

#### Scenario: A chained result shows its request position

- **WHEN** a result row has `requestIndex` 1 within a 3-request chain
- **THEN** the Request column shows `2` and the Total requests column shows `3`

#### Scenario: The first request is shown as request one

- **WHEN** a result row has `requestIndex` 0
- **THEN** the Request column shows `1`, not `0`

#### Scenario: A non-chained result leaves both cells empty

- **WHEN** a result row carries neither `requestIndex` nor `totalRequests`
- **THEN** both columns render empty

### Requirement: Chained results remain flat, exactly as multi-turn results do

The results grid SHALL continue to render one flat row per result when a run contains chained requests.
It SHALL NOT group rows by request, add an expander column, synthesize summary rows, or alter sorting —
the same scope boundary already established for multi-turn results.

#### Scenario: A chained run renders flat

- **WHEN** a run containing a 3-request chain is opened
- **THEN** each request's result is its own row, with no expander column and no summary rows

#### Scenario: Per-request metric scores need no special handling

- **WHEN** a metric is scored for each request of a chain
- **THEN** each request's row shows its own score in the existing metric columns

### Requirement: Run summary shows the chain size

The run header SHALL show a "Requests in chain: N" row whenever `N > 1`, where `N` is `1 +` the number of
`additionalRequests` on the run's `suiteSnapshot` (falling back to the live test suite when the run has no
snapshot, following the header's existing `suiteSnapshot ?? testSuite` fallback). The row SHALL be omitted
entirely when `N` is `1` or the chain length cannot be determined.

#### Scenario: Chain size shown for a chained run

- **WHEN** a run's `suiteSnapshot.additionalRequests` has two entries
- **THEN** the run header shows "Requests in chain: 3"

#### Scenario: No row for a non-chained run

- **WHEN** a run's `suiteSnapshot.additionalRequests` is empty or absent
- **THEN** the run header does NOT show a "Requests in chain" row

#### Scenario: Row reflects the run's frozen chain, not the suite's current one

- **WHEN** the run's `suiteSnapshot` recorded a two-request chain, and the live test suite has since been
  edited to a four-request chain
- **THEN** the run header shows "Requests in chain: 2", the snapshot's value
