## MODIFIED Requirements

### Requirement: Registry Browser Modal

- SHALL use `McpRegistryModal` with `Popup` and `mainButtons`, header "Select MCP server from registry"
- Confirm button SHALL be disabled when no server is selected
- SHALL contain `McpRegistryGrid`
- SHALL own the server-details sidebar state (`detailsServer`, `detailsResponse`, `isDetailsOpen`, `isDetailsLoading`) and pass `infoPanel={<McpServerDetails ... />}` into `McpRegistryGrid`
- SHALL pass `onShowDetails` into `McpRegistryGrid` that updates sidebar state and invokes `getMcpServerVersion`
- Modal SHALL remain functional when the sidebar is closed (baseline behavior, no regression)

#### Scenario: Confirm button disabled until selection

- **WHEN** the modal opens and no row is selected
- **THEN** the Confirm button SHALL be disabled

#### Scenario: Details click does not affect Confirm eligibility

- **WHEN** the user clicks the details icon on a row without clicking its radio button
- **THEN** the sidebar SHALL open
- **AND** the Confirm button SHALL remain disabled (selection unchanged)

#### Scenario: Sidebar closed by default

- **WHEN** the modal first opens
- **THEN** the sidebar SHALL NOT be visible
- **AND** the grid SHALL occupy the full modal body width

### Requirement: Accessibility

- Registry grid SHALL be keyboard navigable (ag-grid default)
- Modal SHALL trap focus (handled by `Popup`)
- "Select from registry" button SHALL have descriptive label for screen readers

#### Scenario: Keyboard use of the registry modal
- **WHEN** the registry modal is open
- **THEN** focus SHALL stay inside the modal
- **AND** the grid SHALL be navigable with the keyboard
