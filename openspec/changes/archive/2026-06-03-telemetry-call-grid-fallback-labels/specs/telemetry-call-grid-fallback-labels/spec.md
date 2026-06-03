## ADDED Requirements

### Requirement: Project-name grids label calls made outside any project

The Telemetry call dashboards' project-name grids — the Consumption "Calls by Projects" grid, the MCP "Calls by Project" grid, and the Route "Calls by Project" grid — SHALL render a fallback label when the project `name` value is missing (falsy or the literal string `"undefined"`). The fallback SHALL display the localized label `No Project` together with an info-circle (ⓘ) icon whose tooltip shows the localized message `Called outside of any project`. Cells with a real project name SHALL render unchanged.

#### Scenario: Row has no project name

- **WHEN** a project-name grid row has a missing `name` value
- **THEN** the cell displays `No Project` with an info-circle icon
- **AND** hovering the info-circle icon shows the tooltip `Called outside of any project`

#### Scenario: Row has a project name

- **WHEN** a project-name grid row has a non-empty `name` value
- **THEN** the cell displays the project name as-is with no fallback label or info-circle icon

### Requirement: Parent-deployment grids label direct calls

The Telemetry call dashboards' parent-deployment grids — the MCP "Calls from Parent Deployments" grid and the Route "Calls from Parent Deployments" grid — SHALL render a fallback label when the `parent_deployment` value is missing (falsy or the literal string `"undefined"`). The fallback SHALL display the localized label `Direct call` together with an info-circle (ⓘ) icon. The tooltip text SHALL be context-specific: the MCP grid shows `Called directly via Try out - no parent deployment`, while the Route grid shows `Called directly by key or user - no parent deployment`. The literal text `undefined` SHALL never be shown. Cells with a real parent deployment SHALL render unchanged.

#### Scenario: MCP call has no parent deployment

- **WHEN** an MCP parent-deployment grid row has a missing `parent_deployment` value
- **THEN** the cell displays `Direct call` with an info-circle icon
- **AND** the literal text `undefined` is not shown
- **AND** hovering the info-circle icon shows the tooltip `Called directly via Try out - no parent deployment`

#### Scenario: Route call has no parent deployment

- **WHEN** a Route parent-deployment grid row has a missing `parent_deployment` value
- **THEN** the cell displays `Direct call` with an info-circle icon
- **AND** hovering the info-circle icon shows the tooltip `Called directly by key or user - no parent deployment`

#### Scenario: Call has a parent deployment

- **WHEN** a parent-deployment grid row has a non-empty `parent_deployment` value
- **THEN** the cell displays the parent deployment value as-is with no fallback label or info-circle icon

### Requirement: Copying a fallback cell copies the label

When the user copies a fallback cell via the grid's right-click Copy action, the clipboard SHALL receive the fallback label (`No Project` or `Direct call`) rather than an empty string or the literal text `undefined`. Copying a cell with a real value SHALL copy that value unchanged.

#### Scenario: Copy a project cell with no project

- **WHEN** the user right-clicks a project-name cell whose value is missing and selects Copy
- **THEN** the clipboard contains `No Project`

#### Scenario: Copy a parent-deployment cell with no parent

- **WHEN** the user right-clicks a parent-deployment cell whose value is missing and selects Copy
- **THEN** the clipboard contains `Direct call`
- **AND** the clipboard does not contain the literal text `undefined`

#### Scenario: Copy a populated cell

- **WHEN** the user right-clicks a cell with a real value and selects Copy
- **THEN** the clipboard contains that value unchanged

### Requirement: Fallback is presentational and localized

The missing-value fallback SHALL be implemented in the grid column rendering layer only; it SHALL NOT alter `getGridData` or the underlying telemetry data. All fallback labels and tooltip messages SHALL be sourced from i18n keys.

#### Scenario: Underlying data is unchanged

- **WHEN** a grid renders a fallback label for a missing value
- **THEN** the underlying row data and `getGridData` output are unchanged
- **AND** the displayed label and tooltip text are resolved from i18n keys
