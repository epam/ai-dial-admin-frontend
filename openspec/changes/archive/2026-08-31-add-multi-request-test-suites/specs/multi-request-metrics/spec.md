## ADDED Requirements

### Requirement: Metric conditions gain a request namespace

`TestSuitesI18nKey.ConditionHint` SHALL document a `request.*` namespace usable in a metric's condition
JSONata expression, alongside the existing `data.*`, `response.*`, and `turn.*` namespaces:
`request.index` (0-based), `request.total`, `request.last` (boolean), and `request.name`.

#### Scenario: Condition hint documents the request namespace

- **WHEN** the Condition field's hint is shown
- **THEN** its text includes `request.index`, `request.total`, `request.last`, and `request.name`

### Requirement: Response-typed metric bindings offer the whole chain's response columns

A metric's Response-typed input binding SHALL offer, as its selectable columns, the concatenation of
`responseColumns` across the entire chain in chain order — request `#0`'s `responseColumns` followed by
`additionalRequests[0].responseColumns`, then `additionalRequests[1].responseColumns`, and so on — rather
than request `#0`'s alone. The union SHALL NOT de-duplicate by column `name`: response-column names are
already guaranteed globally unique across the chain by the backend (a duplicate name is a backend
validation error surfaced on save, not something the client resolves), so no client-side collision
handling is needed.

For a suite with no `additionalRequests`, the offered options SHALL be identical to today's — request
`#0`'s `responseColumns` alone.

#### Scenario: A column from an additional request is selectable

- **WHEN** `additionalRequests[0].responseColumns` includes a column named `followUpAnswer` that request
  `#0` does not have
- **THEN** the Response-typed binding's column selector offers `followUpAnswer`

#### Scenario: A single-request suite is unaffected

- **WHEN** a suite has no `additionalRequests`
- **THEN** the Response-typed binding's column selector offers exactly `testSuite.responseColumns`, as
  before this change

#### Scenario: Columns are offered in chain order

- **WHEN** a suite has request `#0`'s `responseColumns` and two additional requests, each with their own
  `responseColumns`
- **THEN** the column selector offers request `#0`'s columns first, then `additionalRequests[0]`'s, then
  `additionalRequests[1]`'s, in that order
