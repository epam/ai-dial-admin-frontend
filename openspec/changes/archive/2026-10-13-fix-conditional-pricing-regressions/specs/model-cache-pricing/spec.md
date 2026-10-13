## MODIFIED Requirements

### Requirement: Cache read and cache write rates are editable on both model surfaces

The model pricing block SHALL expose two additional rate fields, cache read price and cache write price, alongside the existing prompt and completion prices. Each field SHALL accept either a flat rate or a conditional decision tree (see the added requirements below), and SHALL be available on the `Entities > Models` Properties tab and on the `Assets > Models` properties surface. A value entered on either surface SHALL be persisted to that surface's backend as `pricing.cacheRead` and `pricing.cacheWrite` respectively — a flat rate as a bare rate string, a decision tree as a `{ test, ifTrue?, ifFalse? }` object, matching DIAL Core's `PricingRate` wire format.

Both fields SHALL be read-only for a read-only administrator, matching the existing prompt and completion price fields. For every conditional decision tree, every interactive control — including the selected test-field remove action — SHALL be disabled or unavailable while the pricing block is read-only.

#### Scenario: Cache rate fields are present on the entity surface

- **WHEN** a user opens a model under `Entities > Models` and views its Properties tab
- **THEN** the pricing block presents a cache read price field and a cache write price field, each labelled and addressable by its own accessible name

#### Scenario: Cache rate fields are present on the asset surface

- **WHEN** a user opens a model under `Assets > Models`
- **THEN** the pricing block presents the same cache read price and cache write price fields

#### Scenario: Entered flat cache rates are persisted as strings

- **WHEN** a user enters a flat cache read price and a flat cache write price on a model whose cost unit is Tokens, and saves
- **THEN** the saved model carries both values under `pricing.cacheRead` and `pricing.cacheWrite` as rate strings

#### Scenario: An authored decision tree is persisted as an object

- **WHEN** a user configures the cache write price as a decision tree whose test is `ttl == 1h`, whose if-true rate is `0.000006` and whose if-false rate is `0.00000375`, and saves
- **THEN** the saved model carries `pricing.cacheWrite` as `{ "test": { "field": "ttl", "operator": "==", "value": "1h" }, "ifTrue": "0.000006", "ifFalse": "0.00000375" }`

#### Scenario: An existing flat rate round-trips unchanged

- **WHEN** a user opens and saves a model whose stored `pricing.cacheRead` is the flat string `0.0000008` without touching the cache fields
- **THEN** the saved model still carries `pricing.cacheRead` as the flat string `0.0000008`

#### Scenario: Read-only administrator cannot edit cache rates

- **WHEN** a read-only administrator views a model's pricing block
- **THEN** the cache read and cache write fields are disabled, as the prompt and completion fields are — including every control of an open decision tree

#### Scenario: Read-only administrator cannot remove a selected decision-tree field

- **WHEN** a read-only administrator views a conditional prompt, completion, cache read, or cache write rate with a selected test field
- **THEN** the selected field's remove action is unavailable or disabled and cannot clear the field

### Requirement: Cache rates are available as model list columns

The models grid SHALL offer prompt price, completion price, cache read price, and cache write price columns, hidden by default. A column showing a conditional decision tree SHALL render a readable summary of the tree — never a raw object dump — with leaf rates displayed per million under the token unit, matching the pricing block's scale. The cell value and its tooltip SHALL use the same summary.

#### Scenario: Cache rate columns can be shown

- **WHEN** a user opens the column chooser on the models grid
- **THEN** cache read price and cache write price appear as available columns, hidden by default, and selecting one shows that model's stored rate

#### Scenario: A tree value renders as a readable summary

- **WHEN** a model's stored `pricing.cacheWrite` is the decision tree `{ "test": { "field": "ttl", "operator": "==", "value": "1h" }, "ifTrue": "0.000006", "ifFalse": "0.00000375" }` and the cache write price column is shown
- **THEN** the cell and tooltip present a conditional summary equivalent to `ttl == 1h ? 6 : 3.75` rather than `[object Object]`

#### Scenario: Every pricing column renders a decision tree as a readable summary

- **WHEN** a model has a conditional prompt, completion, cache read, or cache write rate and the corresponding Models grid column is shown
- **THEN** its cell and tooltip show the same readable conditional summary using the configured pricing unit's display scale
