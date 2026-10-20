## ADDED Requirements

### Requirement: Entity and image lists share one list shell
The entity lists (Models, Applications, Adapters, Interceptors, Keys, Roles, Routes, Prompts, Files and the other lists rendered through `BaseEntityList`) and the Images list SHALL render their header and grid through the `ListEntities` shell. The list title SHALL be shown as the page's `<h1>`. The shell SHALL provide the Columns toggle and the Reset filters control; a list's own header buttons SHALL contain only its entity-specific actions (Create, Add, Global firewall).

#### Scenario: List title is the page heading
- **WHEN** an entity list or the Images list is shown
- **THEN** its title is exposed as a level-one heading

#### Scenario: Entity-specific actions stay in the header
- **WHEN** the operator is not a read-only admin and the list supports creation
- **THEN** the Create (or Add) action is shown in the list header
- **AND** the Columns and Reset filters controls are rendered once, by the shell

### Requirement: Columns toggle availability
The Columns toggle SHALL be offered only when the list has rows and the list enables the column panel. An entity list that does not enable the column panel SHALL NOT show the toggle.

#### Scenario: Toggle shown with rows
- **WHEN** a list that enables the column panel has at least one row
- **THEN** the Columns toggle is shown

#### Scenario: Toggle hidden when empty
- **WHEN** a list has no rows
- **THEN** the Columns toggle is not shown

#### Scenario: Toggle hidden when the list opts out
- **WHEN** an entity list does not enable the column panel
- **THEN** the Columns toggle is not shown even if it has rows

### Requirement: Column layout persists across the migration
A list's saved column layout SHALL be stored under the same key as before the list moved to the shared shell, so an operator's saved layout is still applied.

#### Scenario: Saved layout is applied
- **WHEN** an operator opens a list for which they previously saved a column layout
- **THEN** the grid applies that saved layout
