## Purpose

Lets an administrator price prompt-cache traffic on a model — the per-token rates DIAL Core charges
for cache reads and cache writes — from the same pricing block that already carries the prompt and
completion rates, on both the entity and asset model surfaces.

## Requirements

### Requirement: Cache read and cache write rates are editable on both model surfaces

The model pricing block SHALL expose two additional rate fields, cache read price and cache write
price, alongside the existing prompt and completion prices. Both fields SHALL be available on the
`Entities > Models` Properties tab and on the `Assets > Models` properties surface, and a value
entered on either surface SHALL be persisted to that surface's backend as `pricing.cacheRead` and
`pricing.cacheWrite` respectively.

Both fields SHALL be read-only for a read-only administrator, matching the existing prompt and
completion price fields.

#### Scenario: Cache rate fields are present on the entity surface

- **WHEN** a user opens a model under `Entities > Models` and views its Properties tab
- **THEN** the pricing block presents a cache read price field and a cache write price field, each
  labelled and addressable by its own accessible name

#### Scenario: Cache rate fields are present on the asset surface

- **WHEN** a user opens a model under `Assets > Models`
- **THEN** the pricing block presents the same cache read price and cache write price fields

#### Scenario: Entered cache rates are persisted

- **WHEN** a user enters a cache read price and a cache write price on a model whose cost unit is
  Tokens, and saves
- **THEN** the saved model carries both values under `pricing.cacheRead` and `pricing.cacheWrite`

#### Scenario: Read-only administrator cannot edit cache rates

- **WHEN** a read-only administrator views a model's pricing block
- **THEN** the cache read and cache write fields are disabled, as the prompt and completion fields are

### Requirement: Cache rates are accepted only for the token cost unit

DIAL Core treats a cache rate set under any cost unit other than `token` as a validation violation
and excludes the offending model from the merged configuration. The pricing block SHALL therefore
prevent that state from being produced: the cache read and cache write fields SHALL be enabled only
while the cost unit is Tokens, and SHALL be disabled for every other cost unit, including when no
cost unit is selected.

#### Scenario: Cache rates are editable under the token unit

- **WHEN** a model's cost unit is Tokens
- **THEN** the cache read and cache write fields are enabled

#### Scenario: Cache rates are disabled under the character unit

- **WHEN** a model's cost unit is Char without whitespace
- **THEN** the cache read and cache write fields are disabled

#### Scenario: Cache rates are disabled when no cost unit is set

- **WHEN** a model's cost unit is None
- **THEN** the cache read and cache write fields are disabled

### Requirement: Changing the cost unit clears every rate

Changing the cost unit changes the meaning of every rate under it, so selecting a different cost unit
SHALL clear the prompt, completion, cache read, and cache write rates, leaving each unset rather than
setting it to zero. Selecting the None cost unit SHALL leave the model with no cost unit and no rates.

#### Scenario: Switching to the character unit clears entered rates

- **WHEN** a model priced in Tokens with all four rates set has its cost unit changed to Char without
  whitespace
- **THEN** all four rate fields are empty

#### Scenario: Switching to None leaves no pricing values behind

- **WHEN** a model with a cost unit and rates set has its cost unit changed to None
- **THEN** the saved model carries neither a cost unit nor any rate value, and in particular no rate
  is persisted as `"0"`

### Requirement: An unset cache rate is persisted as absent, never as zero

DIAL Core reads an absent cache rate as an instruction to bill cached tokens at the prompt rate, and a
rate of `"0"` as an instruction to bill them as free. The system SHALL preserve that distinction: an
empty cache rate field SHALL be omitted from the saved model, and a cache rate the user explicitly
sets to zero SHALL be persisted as `"0"`.

#### Scenario: Empty cache rate is omitted

- **WHEN** a user saves a token-priced model leaving the cache read field empty
- **THEN** the saved model contains no `pricing.cacheRead` value

#### Scenario: Explicit zero cache rate is preserved

- **WHEN** a user enters `0` in the cache write field and saves
- **THEN** the saved model carries `pricing.cacheWrite` as `"0"`

### Requirement: Cache rates use the same per-million display scaling as the other token rates

Under the Tokens cost unit the pricing block displays rates per million tokens while storing them per
token. The cache read and cache write fields SHALL follow that same scaling in both directions, so all
four rates on a token-priced model are read and entered on one consistent scale.

#### Scenario: Stored cache rate is displayed per million

- **WHEN** a token-priced model with a stored `pricing.cacheRead` of `0.0000008` is opened
- **THEN** the cache read field displays `0.8`

#### Scenario: Entered cache rate is stored per token

- **WHEN** a user enters `0.8` in the cache read field of a token-priced model and saves
- **THEN** the saved model carries `pricing.cacheRead` as `0.0000008`

### Requirement: Cache rates are available as model list columns

The models grid SHALL offer a cache read price column and a cache write price column, hidden by
default, matching how the prompt price and completion price columns are already offered.

#### Scenario: Cache rate columns can be shown

- **WHEN** a user opens the column chooser on the models grid
- **THEN** cache read price and cache write price appear as available columns, hidden by default, and
  selecting one shows that model's stored rate

### Requirement: Cache rate changes appear in the activity audit

A change to either cache rate SHALL appear in a model's activity audit pricing comparison, labelled
and scaled consistently with the prompt and completion rates in the same comparison.

#### Scenario: Audit shows an added cache rate

- **WHEN** a revision of a token-priced model added a `pricing.cacheRead` value
- **THEN** the audit comparison for that revision shows the cache read rate as added, displayed per
  million tokens
