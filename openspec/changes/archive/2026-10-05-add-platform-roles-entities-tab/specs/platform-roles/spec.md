## MODIFIED Requirements

### Requirement: Role asset detail view tab set

The system SHALL render a role asset's detail view with exactly two tabs, `Properties` and `Entities`,
in that order, and SHALL NOT include a `Keys` or `Audit` tab, or an Admin/CORE-format toggle.

#### Scenario: Detail view renders Properties and Entities

- **WHEN** a user opens a role asset's detail view
- **THEN** the tab list contains exactly `Properties` and `Entities`, with `Properties` first

#### Scenario: No Keys or Audit tab, and no format toggle

- **WHEN** a user opens a role asset's detail view
- **THEN** no `Keys` tab, no `Audit` tab, and no Admin/CORE-format toggle is shown

## ADDED Requirements

### Requirement: Entities tab shows attached models with a count and an add action

The system SHALL render the role asset's Entities tab with a header reading `Entities: {n}`, where `n`
is the number of models currently keyed in the role's `limits` map, and an `+Add` action that opens a
model-selection popup.

#### Scenario: Header reflects the attached-model count

- **WHEN** a user opens the Entities tab of a role with three models keyed in `limits`
- **THEN** the header reads `Entities: 3`

#### Scenario: A read-only admin sees no add action

- **WHEN** a read-only admin opens the Entities tab
- **THEN** no `+Add` action is offered

### Requirement: Add-model popup offers only models, from both Core populations

The system SHALL populate the add-model popup exclusively with DIAL Core models — drawn from both the
`platform` population and the config-file population already merged for `Assets > Models` — and SHALL
exclude every other entity type (applications, routes, toolsets, keys). The popup SHALL allow selecting
several models before applying, and SHALL exclude any model already keyed in the role's `limits` map.

#### Scenario: Popup lists platform and config-file models only

- **WHEN** a user opens the add-model popup
- **THEN** every row is a model sourced from either the platform or config-file population, and no
  application, route, toolset, or key row is shown

#### Scenario: Already-attached models are not offered again

- **WHEN** a user opens the add-model popup for a role with two models already in `limits`
- **THEN** neither of those two models appears as a selectable row

#### Scenario: Selecting several models and applying attaches all of them

- **WHEN** a user selects three models in the popup and applies
- **THEN** all three appear as new rows in the Entities grid after the popup closes

### Requirement: Entities grid shows name and four token-limit columns

The system SHALL render the Entities grid with a `Name` column and four independently editable
token-limit columns — `Tokens per minute`, `Tokens per day`, `Tokens per week`, and `Tokens per
month` — one row per model keyed in the role's `limits` map.

#### Scenario: Grid shows one row per attached model

- **WHEN** a user opens the Entities tab of a role with two models in `limits`
- **THEN** the grid shows exactly two rows, each showing that model's name and its four token columns

### Requirement: Token-limit values are plain numbers with explicit no-limit, zero, and clear semantics

The system SHALL write an edited token-limit value as a plain number — including `0` when the user
enters it — into that model's entry under the role's `limits` map. A token column with no key present
in the model's entry SHALL display a "No limits" placeholder rather than a blank or zero value.
Clearing a token field that previously had a value SHALL remove that key from the model's entry
entirely, leaving the model's other token values and its row in the grid unaffected — including when
every token key for a model ends up removed, which SHALL leave the model attached with an empty limits
entry rather than removing it from the grid.

#### Scenario: Entering zero stores zero, not no-limit

- **WHEN** a user enters `0` into a model's `Tokens per day` column
- **THEN** the model's `limits` entry stores `day: 0`, and the column shows `0`, not the "No limits"
  placeholder

#### Scenario: An absent token key shows the No limits placeholder

- **WHEN** a model's `limits` entry has no `week` key
- **THEN** the `Tokens per week` column shows a "No limits" placeholder

#### Scenario: Clearing a value removes only that key

- **WHEN** a user clears a previously entered `Tokens per minute` value on a model that also has a
  `Tokens per day` value set
- **THEN** the model's `limits` entry no longer has a `minute` key, keeps its `day` key, and the model's
  row remains in the grid

#### Scenario: Clearing every token value keeps the model attached

- **WHEN** a user clears every token column for a model, one at a time
- **THEN** the model's `limits` entry becomes an empty object and the model's row remains in the
  Entities grid, showing the "No limits" placeholder in all four columns

### Requirement: Editing multiple rows does not disrupt the grid

The system SHALL apply a token-limit edit to its row's underlying data without rebuilding the Entities
grid's row set, so that editing values on several rows in sequence preserves the grid's scroll
position, focus, and any other row's in-progress edit.

#### Scenario: Editing a second row does not reset the first

- **WHEN** a user edits a token value on one row and then edits a token value on a different row
- **THEN** the first row's edited value remains visible and the grid does not scroll or lose focus as a
  result of the second edit

### Requirement: Removing a model deletes its limits entry

The system SHALL offer a remove action per Entities-grid row that deletes that model's entry from the
role's `limits` map entirely and removes its row from the grid.

#### Scenario: Removing a model deletes its entry and row

- **WHEN** a user removes a model from the Entities grid
- **THEN** that model's key no longer exists in the role's `limits` map and its row no longer appears in
  the grid

#### Scenario: A read-only admin is offered no mutating row actions

- **WHEN** a read-only admin opens the Entities tab
- **THEN** no Set unlimited or Remove action is offered on any row

### Requirement: Entities rows allow clearing all token limits without removing the model

The system SHALL render all four editable token-limit cells without a triangle indicator. For every writable Entities-grid row, the system SHALL offer a Set unlimited action immediately before Remove. Selecting Set unlimited SHALL clear the model's minute, day, week, and month token keys by replacing its limits entry with an empty object, while keeping the model attached and visible in the grid.

#### Scenario: Set unlimited clears all limits and retains the attached model

- **WHEN** a user selects Set unlimited for a model with configured token limits
- **THEN** that model's limits entry becomes an empty object, the model remains in the Entities grid, and other models' limits remain unchanged

#### Scenario: Set unlimited is immediately before Remove

- **WHEN** a writable model row renders its actions
- **THEN** Set unlimited is listed immediately before Remove

#### Scenario: Token cells render without triangle indicators

- **WHEN** an attached model row renders
- **THEN** its Tokens per minute, Tokens per day, Tokens per week, and Tokens per month cells have no triangle indicator
