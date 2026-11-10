## MODIFIED Requirements

### Requirement: Unified Containers list page
The system SHALL expose one list page at `/containers` showing containers of type ADAPTER, APPLICATION, INTERCEPTOR and MCP. Containers of other types (inference) SHALL NOT appear.

#### Scenario: Mixed types listed
- **WHEN** the user opens `/containers` and the API returns containers of all four types plus inference containers
- **THEN** the list SHALL render the adapter, application, interceptor and MCP containers
- **THEN** the inference containers SHALL NOT be rendered

#### Scenario: Type column
- **WHEN** the list renders
- **THEN** it SHALL include a "Type" column showing a human-readable label for each container's type
- **THEN** all other columns of the existing container list SHALL remain available

#### Scenario: Empty state
- **WHEN** no container of the four types exists
- **THEN** the list SHALL render the existing empty state

#### Scenario: Row and name navigation
- **WHEN** the user clicks a container's name link or opens it in a new tab
- **THEN** the system SHALL navigate to `/containers/[id]`

#### Scenario: A row click outside the name does not navigate
- **WHEN** the user clicks a container row outside its name link
- **THEN** no navigation occurs

