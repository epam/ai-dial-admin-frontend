## MODIFIED Requirements

### Requirement: Cache read and cache write rates are editable on both model surfaces

The model pricing block SHALL expose two additional rate fields, cache read price and cache write
price, alongside the existing prompt and completion prices. Each field SHALL accept either a flat
rate or a conditional decision tree (see the added requirements below), and SHALL be available on the
`Entities > Models` Properties tab and on the `Assets > Models` properties surface. A value entered
on either surface SHALL be persisted to that surface's backend as `pricing.cacheRead` and
`pricing.cacheWrite` respectively — a flat rate as a bare rate string, a decision tree as a
`{ test, ifTrue?, ifFalse? }` object, matching DIAL Core's `PricingRate` wire format.

Both fields SHALL be read-only for a read-only administrator, matching the existing prompt and
completion price fields.

#### Scenario: Cache rate fields are present on the entity surface

- **WHEN** a user opens a model under `Entities > Models` and views its Properties tab
- **THEN** the pricing block presents a cache read price field and a cache write price field, each
  labelled and addressable by its own accessible name

#### Scenario: Cache rate fields are present on the asset surface

- **WHEN** a user opens a model under `Assets > Models`
- **THEN** the pricing block presents the same cache read price and cache write price fields

#### Scenario: Entered flat cache rates are persisted as strings

- **WHEN** a user enters a flat cache read price and a flat cache write price on a model whose cost
  unit is Tokens, and saves
- **THEN** the saved model carries both values under `pricing.cacheRead` and `pricing.cacheWrite` as
  rate strings

#### Scenario: An authored decision tree is persisted as an object

- **WHEN** a user configures the cache write price as a decision tree whose test is `ttl == 1h`,
  whose if-true rate is `0.000006` and whose if-false rate is `0.00000375`, and saves
- **THEN** the saved model carries `pricing.cacheWrite` as
  `{ "test": { "field": "ttl", "operator": "==", "value": "1h" }, "ifTrue": "0.000006", "ifFalse": "0.00000375" }`

#### Scenario: An existing flat rate round-trips unchanged

- **WHEN** a user opens and saves a model whose stored `pricing.cacheRead` is the flat string
  `0.0000008` without touching the cache fields
- **THEN** the saved model still carries `pricing.cacheRead` as the flat string `0.0000008`

#### Scenario: Read-only administrator cannot edit cache rates

- **WHEN** a read-only administrator views a model's pricing block
- **THEN** the cache read and cache write fields are disabled, as the prompt and completion fields
  are — including every control of an open decision tree

### Requirement: Cache rates use the same per-million display scaling as the other token rates

Under the Tokens cost unit the pricing block SHALL display rates per million tokens while storing
them per token. The cache read and cache write fields SHALL follow that same scaling in both
directions, so all four rates on a token-priced model are read and entered on one consistent scale,
and for a conditional decision tree the scaling SHALL apply to every leaf rate at every nesting
depth, in both directions.

#### Scenario: Stored cache rate is displayed per million

- **WHEN** a token-priced model with a stored `pricing.cacheRead` of `0.0000008` is opened
- **THEN** the cache read field displays `0.8`

#### Scenario: Entered cache rate is stored per token

- **WHEN** a user enters `0.8` in the cache read field of a token-priced model and saves
- **THEN** the saved model carries `pricing.cacheRead` as `0.0000008`

#### Scenario: Every leaf rate of a tree is displayed per million

- **WHEN** a token-priced model with a stored `pricing.cacheWrite` of
  `{ "test": { "field": "ttl", "operator": "==", "value": "1h" }, "ifTrue": "0.000006", "ifFalse": "0.00000375" }`
  is opened
- **THEN** the if-true rate displays `6` and the if-false rate displays `3.75`

#### Scenario: Entered tree leaf rates are stored per token

- **WHEN** a user enters `6` as the if-true rate and `3.75` as the if-false rate of a conditional
  cache write price on a token-priced model and saves
- **THEN** the saved tree carries `ifTrue` as `0.000006` and `ifFalse` as `0.00000375`

### Requirement: Cache rates are available as model list columns

The models grid SHALL offer a cache read price column and a cache write price column, hidden by
default, matching how the prompt price and completion price columns are already offered. A column
showing a conditional decision tree SHALL render a readable summary of the tree — never a raw object
dump — with leaf rates displayed per million under the token unit, matching the pricing block's
scale.

#### Scenario: Cache rate columns can be shown

- **WHEN** a user opens the column chooser on the models grid
- **THEN** cache read price and cache write price appear as available columns, hidden by default, and
  selecting one shows that model's stored rate

#### Scenario: A tree value renders as a readable summary

- **WHEN** a model's stored `pricing.cacheWrite` is the decision tree
  `{ "test": { "field": "ttl", "operator": "==", "value": "1h" }, "ifTrue": "0.000006", "ifFalse": "0.00000375" }`
  and the cache write price column is shown
- **THEN** the cell/tooltip presents a conditional summary equivalent to `ttl == 1h ? 6 : 3.75`
  rather than `[object Object]`

### Requirement: Cache rate changes appear in the activity audit

A change to either cache rate SHALL appear in a model's activity audit pricing comparison, labelled
and scaled consistently with the prompt and completion rates in the same comparison. A change
involving a conditional decision tree SHALL render the tree as a readable conditional summary with
per-million-scaled leaf rates, so a revision that added, changed, or removed a tree shows a
meaningful before/after diff.

#### Scenario: Audit shows an added cache rate

- **WHEN** a revision of a token-priced model added a `pricing.cacheRead` value
- **THEN** the audit comparison for that revision shows the cache read rate as added, displayed per
  million tokens

#### Scenario: Audit shows an added decision tree as a readable summary

- **WHEN** a revision of a token-priced model changed `pricing.cacheWrite` from a flat rate to the
  decision tree `{ "test": { "field": "ttl", "operator": "==", "value": "1h" }, "ifTrue": "0.000006", "ifFalse": "0.00000375" }`
- **THEN** the audit comparison shows the before value as a per-million rate and the after value as a
  conditional summary equivalent to `ttl == 1h ? 6 : 3.75`, with neither side rendered as `NaN` or
  `[object Object]`

## ADDED Requirements

### Requirement: A cache rate can be authored as a conditional decision tree

The pricing block SHALL let a user switch each cache rate field between a flat rate and a conditional
decision tree. A decision-tree node SHALL be authored as a test row — field, operator, and value —
plus an if-true branch and an if-false branch, and each branch SHALL itself accept either a flat rate
or another decision tree, so trees nest without a fixed depth limit, matching DIAL Core's evaluation
contract. The flat and conditional modes SHALL be addressable as distinct, labelled states of the
same cache rate field.

#### Scenario: Switching a flat rate to a conditional tree

- **WHEN** a user activates conditional editing on a cache rate field that holds the flat rate `3`
- **THEN** the field presents a test row, an if-true rate and an if-false rate, each seeded with the
  current value `3`, so the switch does not change billing semantics until the user edits something

#### Scenario: Nesting a tree inside a branch

- **WHEN** a user activates conditional editing on the if-true branch of an existing tree
- **THEN** that branch presents its own test row, if-true and if-false rates, and the parent tree
  persists the branch as a nested `{ test, ifTrue?, ifFalse? }` object on save

#### Scenario: Collapsing a tree back to a flat rate

- **WHEN** a user switches a conditional cache rate back to flat editing
- **THEN** the flat field is seeded with the if-true rate when that branch holds a flat value, and
  left empty otherwise

### Requirement: The test field offers standard usage fields and free-text JSONPath

The test row's field input SHALL suggest the standard usage fields DIAL Core resolves by bare name —
`cachedReadTokens`, `cachedWriteTokens`, `promptTokens`, `serviceTier`, `ttl` — via a suggestion
list, and SHALL also accept arbitrary free text so a `$`-prefixed JSONPath expression (RFC 9535) can
be entered. Suggestions SHALL narrow as the user types, and selection and free-text entry SHALL be
reachable by keyboard.

#### Scenario: Standard fields are offered as suggestions

- **WHEN** a user focuses the field input of a test row
- **THEN** the five standard usage fields are offered as suggestions, and choosing one enters that
  bare field name

#### Scenario: A JSONPath expression can be entered as free text

- **WHEN** a user types `$.usage.details.ttl` into the field input and confirms it
- **THEN** the test row's field carries the exact expression as entered

### Requirement: The operator list matches DIAL Core and couples to the field's type

The test row's operator input SHALL offer exactly the six operators DIAL Core defines — `==`, `!=`,
`>`, `<`, `>=`, `<=`. When the selected field is a standard field Core types as a string
(`serviceTier`, `ttl`), the ordering operators (`>`, `<`, `>=`, `<=`) SHALL be unavailable, because
Core rejects such a condition at config load. When a field change makes the current operator
unavailable, the operator SHALL reset to `==`.

#### Scenario: All six operators are available for a numeric field

- **WHEN** the test row's field is `cachedReadTokens`
- **THEN** the operator input offers `==`, `!=`, `>`, `<`, `>=`, `<=`

#### Scenario: Ordering operators are unavailable for a string-typed field

- **WHEN** the test row's field is `ttl`
- **THEN** the operator input offers only `==` and `!=`

#### Scenario: The operator resets when the field type changes

- **WHEN** the test row's field changes from `cachedReadTokens` with operator `>` to `serviceTier`
- **THEN** the operator resets to `==`

### Requirement: An empty decision-tree branch is persisted as absent

The pricing block SHALL preserve DIAL Core's omitted-branch semantics — Core reads an omitted
`ifTrue`/`ifFalse` branch as an instruction to fall back to the prompt rate. A branch the user
leaves empty SHALL be omitted from the saved object rather than persisted as `"0"` or an empty
string, while a branch the user explicitly sets to zero SHALL be persisted as `"0"`.

#### Scenario: Empty branch is omitted on save

- **WHEN** a user saves a conditional cache read price whose if-false rate is left empty
- **THEN** the saved `pricing.cacheRead` object carries no `ifFalse` key

#### Scenario: Explicit zero branch is preserved

- **WHEN** a user enters `0` as the if-true rate of a conditional cache read price and saves
- **THEN** the saved object carries `ifTrue` as `"0"`
