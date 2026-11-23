## RENAMED Requirements

- FROM: `### Requirement: Add-model popup offers only models, from both Core populations`
- TO: `### Requirement: Add-models popup offers only models, from both Core populations`

## MODIFIED Requirements

### Requirement: Entities tab shows attached models with a count and an add action

The system SHALL render the role asset's Entities tab with a header reading `Entities: {n}`, where `n`
is the number of entries currently keyed in the role's `limits` map, and an `Add` dropdown action offering
`Add models` and `Add applications`. `Add models` SHALL open the model-selection popup and `Add applications`
SHALL open the application-selection popup.

#### Scenario: Header reflects the attached-entry count

- **WHEN** a user opens the Entities tab of a role with three entries keyed in `limits`
- **THEN** the header reads `Entities: 3`

#### Scenario: The add action offers models and applications

- **WHEN** a user opens the `Add` dropdown on the Entities tab
- **THEN** it lists `Add models` and `Add applications`

#### Scenario: A read-only admin sees no add action

- **WHEN** a read-only admin opens the Entities tab
- **THEN** no `Add` action is offered

### Requirement: Add-models popup offers only models, from both Core populations

The system SHALL populate the popup opened by `Add models` exclusively with DIAL Core models — drawn from both the
`platform` population and the config-file population already merged for `Assets > Models` — and SHALL
exclude every other entity type (applications, routes, toolsets, keys). The popup SHALL allow selecting
several models before applying, and SHALL exclude any model already keyed in the role's `limits` map.

#### Scenario: Popup lists platform and config-file models only

- **WHEN** a user opens the add-models popup
- **THEN** every row is a model sourced from either the platform or config-file population, and no
  application, route, toolset, or key row is shown

#### Scenario: Already-attached models are not offered again

- **WHEN** a user opens the add-models popup for a role with two models already in `limits`
- **THEN** neither of those two models appears as a selectable row

#### Scenario: Selecting several models and applying attaches all of them

- **WHEN** a user selects three models in the popup and applies
- **THEN** all three appear as new rows in the Entities grid after the popup closes

## ADDED Requirements

### Requirement: Add-applications popup attaches applications by root-dependent key

The system SHALL open, for `Add applications`, a multi-select popup that browses the application tree, including
its `file/`, `platform/` and `public/` roots, and offers only application entries as selectable (grouping folders
are browsable but never selectable). Applying SHALL add one entry to the role's `limits` map per selected
application, each with an empty limits object. The entry's key SHALL be the application's `name` when it was
picked from the `file/` or `platform/` root, and `applications/{path}` when it was picked from the `public/` root.
A selected application whose key is already in `limits` SHALL be skipped silently and keep its existing limits.
Apply SHALL be disabled while nothing is selected, and a cancelled pick SHALL NOT carry into the next open.

#### Scenario: A file or platform application is keyed by its name

- **WHEN** a user selects an application under the `file/` or `platform/` root and applies
- **THEN** `limits` gains an entry keyed by that application's name and it appears as a row in the Entities grid

#### Scenario: A public application is keyed with the applications prefix

- **WHEN** a user selects an application under the `public/` root and applies
- **THEN** `limits` gains an entry keyed `applications/{path}` for it

#### Scenario: Several applications are attached at once

- **WHEN** a user selects three applications across the roots and applies
- **THEN** three entries are added and the popup closes

#### Scenario: An already-attached application is skipped

- **WHEN** a user applies a selection containing an application whose key is already in `limits`
- **THEN** no duplicate row appears and the existing entry keeps its token limits

#### Scenario: Nothing selected disables Apply

- **WHEN** the popup is open with no application selected
- **THEN** the Apply action is disabled

#### Scenario: Cancelling discards the pick

- **WHEN** a user selects an application, cancels, and reopens the popup
- **THEN** no application is shown as selected and Apply is disabled
