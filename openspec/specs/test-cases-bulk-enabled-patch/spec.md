### Requirement: Bulk enabled patch for large test suites
The system SHALL use `PATCH /api/v1/test-suites/{id}/test-cases:bulk` to persist `enabled` flag changes for existing test cases, instead of including them in the existing `PUT /test-cases` batch request. This removes the 256-item cap for `enabled`-only changes and supports test suites with up to 10 000 test cases.

#### Scenario: Saving enabled-only changes on a large test suite
- **WHEN** a user toggles `enabled` on more than 256 existing test cases and clicks Save
- **THEN** the system sends a bulk PATCH request with `bulkOperations` grouped by `enabled` value (one operation per distinct value) and no `itemOperations`
- **THEN** all `enabled` changes are persisted successfully and the success notification is shown

#### Scenario: Saving enabled changes alongside field edits
- **WHEN** a user changes `testCaseName` on row A AND toggles `enabled` on rows A and 500 other rows
- **THEN** row A is sent via PUT (full object including its new `enabled` value) and is NOT included in the bulk PATCH payload
- **THEN** the 500 other rows (enabled-only changes) are sent via the bulk PATCH request

#### Scenario: Saving only field edits with no enabled changes
- **WHEN** a user edits `testCaseName` or `data` on a small number of rows and clicks Save
- **THEN** the system sends only a PUT request with the changed rows; no bulk PATCH request is made

### Requirement: Separate dirty tracking for enabled vs field changes
The system SHALL maintain two independent change-tracking stores in `TestCasesList`:
- `dirtyRowsRef` — rows where non-`enabled` fields changed (used for PUT).
- `dirtyEnabledRef` — per-row final `enabled` value for existing test cases that had their `enabled` toggled (used for bulk PATCH).

#### Scenario: Enabled change on a row with no prior field edits
- **WHEN** the user toggles `enabled` on row B (no other changes to row B)
- **THEN** row B is added to `dirtyEnabledRef` only; `dirtyRowsRef` is not updated for row B

#### Scenario: Enabled change on a row that already has field edits
- **WHEN** the user first edits `testCaseName` on row A (added to `dirtyRowsRef`)
- **AND** the user then toggles `enabled` on row A
- **THEN** `dirtyEnabledRef` is updated with row A's new `enabled` value
- **THEN** `dirtyRowsRef` entry for row A is updated to reflect the new `enabled` value
- **THEN** row A is sent via PUT (not bulk PATCH) because it has non-`enabled` changes

#### Scenario: Field edit on a row that already has an enabled change
- **WHEN** the user first toggles `enabled` on row B (added to `dirtyEnabledRef`)
- **AND** the user then edits `testCaseName` on row B
- **THEN** row B is added to `dirtyRowsRef` with `enabled` value from `dirtyEnabledRef`
- **THEN** row B is excluded from the bulk PATCH payload (PUT covers it)

#### Scenario: Enabled change on a new (unsaved) test case
- **WHEN** the user creates a new test case and toggles its `enabled` field
- **THEN** the change is tracked in `newTestCases` state only (existing path)
- **THEN** `dirtyEnabledRef` is NOT updated for this row

### Requirement: Clear dirty state on discard and after save
The system SHALL clear both `dirtyRowsRef` and `dirtyEnabledRef` when the user discards changes or when a save completes successfully.

#### Scenario: Discard clears both tracking stores
- **WHEN** the user clicks Discard
- **THEN** both `dirtyRowsRef` and `dirtyEnabledRef` are cleared
- **THEN** the grid reloads from the server

#### Scenario: Successful save clears both tracking stores
- **WHEN** all save steps complete without error
- **THEN** both `dirtyRowsRef` and `dirtyEnabledRef` are cleared via `clearDirtyAndRefresh`

### Requirement: ETag stale-state recovery on save failure
The system SHALL call `router.refresh()` on any save step failure so the component receives a fresh ETag from the server and subsequent save attempts are not blocked by a 412 error.

#### Scenario: Suite update succeeds but test case update fails
- **WHEN** `updateTestSuite` succeeds but a subsequent `updateTestCases` or `bulkPatchTestCases` call fails
- **THEN** an error notification is shown
- **THEN** `router.refresh()` is called so the ETag prop is refreshed
- **THEN** the user can click Save again without receiving a 412 error

#### Scenario: Suite update itself fails
- **WHEN** `updateTestSuite` fails (e.g., 412 Precondition Failed)
- **THEN** an error notification is shown
- **THEN** `router.refresh()` is called
- **THEN** subsequent save attempts use the fresh ETag
