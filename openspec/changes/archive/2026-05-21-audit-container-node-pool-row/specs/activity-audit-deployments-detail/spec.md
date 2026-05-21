## ADDED Requirements

### Requirement: Container detail labels `nodePoolId` and `nodePoolName` rows

For container activities, the audit detail's "Parameter" column SHALL render the row labels for `nodePoolId` and `nodePoolName` via `CONTAINER_ROW_LABEL_KEYS`:

- `nodePoolId` → `EntityFieldsI18nKey.NodePoolId` ("Node pool ID")
- `nodePoolName` → `EntityFieldsI18nKey.NodePoolName` ("Node pool name")

The "Value" column SHALL render the stored string verbatim (no formatter). No collapsing or projection is performed between the two fields — each appears as its own row.

#### Scenario: Parameter labels resolve to the localized strings
- **GIVEN** a container audit detail whose snapshot has `nodePoolId: "cpu-pool"` and `nodePoolName: "CPU pool"`
- **WHEN** the diff body renders
- **THEN** one row has parameter `nodePoolId` rendered as "Node pool ID" and value `"cpu-pool"`
- **AND** one row has parameter `nodePoolName` rendered as "Node pool name" and value `"CPU pool"`

### Requirement: Container detail hides `nodePoolId` and `nodePoolName` rows when both sides are empty

For container activities, each of the keys `nodePoolId` and `nodePoolName` SHALL be hidden from the diff body when both compared snapshots have that field null, undefined, or an empty string. Hiding is applied per-key independently — one row may be hidden while the other is shown. The check SHALL be implemented via a `CONTAINER_HIDE_IF_EMPTY_KEYS` set consulted inside `getPrimitiveBucket()` (returning `null` to skip emission) and runs before the section-routing check so it applies regardless of bucket.

When at least one side has a non-empty value for a key, the row SHALL be emitted following the existing primitive diff semantics (`ADDED` when one side is empty, `CHANGED` when the values differ, plain row when they match).

#### Scenario: Both sides empty for both keys produces no nodePool rows
- **GIVEN** `current = { displayName: "x" }` and `compare = { displayName: "x" }` (no node-pool fields at all)
- **WHEN** the diff body renders
- **THEN** no row appears for `nodePoolId` and no row appears for `nodePoolName`

#### Scenario: Schema-migration normalization (undefined vs explicit null)
- **GIVEN** `current = { nodePoolId: null, nodePoolName: null }` and `compare = {}` (mixed null and undefined)
- **WHEN** the diff body renders
- **THEN** no row appears for `nodePoolId` or `nodePoolName`

#### Scenario: One side sets both fields, the other has them empty
- **GIVEN** `current = {}` and `compare = { nodePoolId: "cpu-pool", nodePoolName: "CPU pool" }`
- **WHEN** the diff body renders (after pass)
- **THEN** one `nodePoolId` row appears with value `"cpu-pool"` and diff status `ADDED`
- **AND** one `nodePoolName` row appears with value `"CPU pool"` and diff status `ADDED`

#### Scenario: Id changed, name preserved
- **GIVEN** `current = { nodePoolId: "cpu-pool", nodePoolName: "CPU pool" }` and `compare = { nodePoolId: "gpu-pool", nodePoolName: "CPU pool" }`
- **WHEN** the diff body renders (after pass)
- **THEN** the `nodePoolId` row's diff status is `CHANGED` and its value is `"gpu-pool"`
- **AND** the `nodePoolName` row is rendered with value `"CPU pool"` and no diff status

#### Scenario: One row hidden, the other shown
- **GIVEN** `current = {}` and `compare = { nodePoolId: "ghost", nodePoolName: null }`
- **WHEN** the diff body renders (after pass)
- **THEN** the `nodePoolId` row is emitted with value `"ghost"` and diff status `ADDED`
- **AND** no row is emitted for `nodePoolName` (both sides empty)

#### Scenario: Hide rule is scoped to nodePool keys only
- **GIVEN** a container snapshot pair where `displayName` is empty on both sides and `nodePoolId` is empty on both sides
- **WHEN** the diff body renders
- **THEN** the `displayName` row is still emitted (existing primitive behavior)
- **AND** the `nodePoolId` row is not emitted
