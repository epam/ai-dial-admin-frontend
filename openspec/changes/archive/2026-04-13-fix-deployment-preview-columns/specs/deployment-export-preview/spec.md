## MODIFIED Requirements

### Requirement: Grid columns standardized across all image views

#### Scenario: Grid columns match export content grid (MODIFIED)
- **WHEN** a container tab is selected
- **THEN** the grid SHALL show columns: Display name, Description, ID
- **WHEN** the Images tab is selected
- **THEN** the grid SHALL show columns: Display name, Description, Version, ID
- **AND** image data SHALL be normalized to use `displayName` for Display name, `description` for Description, `version` for Version, and `name` for ID — same base fields as containers plus Version

#### Scenario: Grid columns refresh on tab switch (ADDED)
- **WHEN** user switches between tabs with different column counts (e.g., containers to images)
- **THEN** the grid SHALL remount to display the correct columns for the selected tab
- **AND** this SHALL be achieved via `key={selectedTab}` on the `GridView` component
