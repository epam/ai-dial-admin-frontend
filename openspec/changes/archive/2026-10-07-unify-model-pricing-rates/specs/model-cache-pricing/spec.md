## ADDED Requirements

### Requirement: Every model price supports flat and conditional rate editing

The model pricing block SHALL use the same flat-or-conditional `PricingRate` editor for prompt, completion, cache read, and cache write prices on both the `Entities > Models` Properties tab and the `Assets > Models` properties surface. Prompt and completion values SHALL persist as either a rate string or DIAL Core's recursive `{ test, ifTrue?, ifFalse? }` pricing-rate object. Existing flat prompt and completion values SHALL remain valid and round-trip unchanged when unedited.

The pricing block SHALL present all four labeled rate controls independently of whether the model is an entity-backed model or a platform asset. Prompt and completion editing SHALL be disabled when no cost unit is selected or the administrator is read-only. Cache-rate enablement SHALL continue to follow the token-only constraint.

When every rate uses flat editing, the pricing block SHALL render all four controls in one row. When any rate is a conditional decision tree, the whole group SHALL render vertically, including when the tree was already stored before the block opens or is newly created by the administrator.

#### Scenario: Entity model exposes every pricing control

- **WHEN** a user opens a model under `Entities > Models` and views its Properties tab
- **THEN** the pricing block presents prompt, completion, cache read, and cache write controls, each labelled and addressable by its own accessible name

#### Scenario: Prompt rate can be saved as a decision tree

- **WHEN** a user configures a token-priced model's prompt price as a conditional decision tree and saves
- **THEN** the saved model carries `pricing.prompt` as a `{ test, ifTrue?, ifFalse? }` object whose leaves are stored as per-token rate strings

#### Scenario: Existing flat completion rate round-trips unchanged

- **WHEN** a user opens and saves a model whose stored `pricing.completion` is a flat rate string without changing the completion price
- **THEN** the saved model retains that flat string as `pricing.completion`

#### Scenario: Conditional prompt leaves use token display scaling

- **WHEN** a token-priced model with a stored conditional prompt price is opened
- **THEN** every leaf rate displays per million tokens, and a changed leaf is persisted as a per-token rate string

#### Scenario: Read-only administrator cannot edit prompt or completion trees

- **WHEN** a read-only administrator views a model with an open conditional prompt or completion price tree
- **THEN** every control in those trees is disabled

#### Scenario: Flat rate controls share a row

- **WHEN** an administrator views a model whose prompt, completion, cache read, and cache write rates are flat values
- **THEN** all four pricing controls render in one row

#### Scenario: Conditional rate expands the pricing group

- **WHEN** an administrator opens a model with a conditional rate or changes any rate from flat editing to a conditional decision tree
- **THEN** the full pricing group renders vertically while retaining all four controls

### Requirement: Conditional rates render readably in all model pricing columns

The models grid SHALL present a conditional prompt, completion, cache-read, or cache-write rate as a readable conditional summary rather than a raw object representation. For token-priced models, every leaf in that summary SHALL use per-million display scaling. Flat rate strings SHALL retain their existing display behavior.

#### Scenario: Conditional prompt rate renders as a readable model-grid value

- **WHEN** a model's stored `pricing.prompt` is a conditional decision tree and the prompt price column is shown
- **THEN** the cell or tooltip presents a readable conditional summary rather than `[object Object]`

#### Scenario: Conditional completion rate uses token scaling in the grid

- **WHEN** a token-priced model's stored `pricing.completion` is a conditional decision tree and the completion price column is shown
- **THEN** every leaf displayed in the cell or tooltip is scaled per million tokens
