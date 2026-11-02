## ADDED Requirements

### Requirement: An assigned role is edited from the roles grid

The roles grid SHALL offer **Edit** on each row, beside **Remove**, in the row's action menu. Choosing Edit SHALL open the same drawer that activating the row opens, in its edit mode and pre-filled with that role's privileges and row limit. Edit SHALL be unavailable under the same condition as Remove: while the table's access has not finished loading. Activating a row, by click or by Enter on a focused cell, SHALL remain an equivalent way to open the drawer, so changing a role's permissions never requires removing it and adding it again.

#### Scenario: The row menu offers Edit and Remove

- **WHEN** the user opens the action menu of a roles-grid row
- **THEN** the menu offers Edit and Remove

#### Scenario: Edit opens the drawer pre-filled for the role

- **WHEN** the user chooses Edit on a role's row
- **THEN** the drawer opens in edit mode for that role
- **AND** it shows that role's current privileges and row limit

#### Scenario: Editing and removing stay separate

- **WHEN** the user chooses Remove on a role's row
- **THEN** the removal confirmation opens and the drawer does not
