## MODIFIED Requirements

### Requirement: Asset Keys listing page
The system SHALL render a flat grid at `/assets-keys` using the shared tabbed listing with a single Platform source
and therefore no tab row. Keys are a flat platform-bucket resource — no folder creation, no nested navigation, and
no config.json tab. The header SHALL show the Platform count.

#### Scenario: Listing displays keys from Core
- **WHEN** the user navigates to `/assets-keys`
- **THEN** the system fetches keys via `assetApi.list(token, ResourceType.PROJECT_KEY, path)` and
  displays them in the grid with Name, Author, Created time, and Updated time columns

#### Scenario: Empty state
- **WHEN** no keys exist in the platform bucket
- **THEN** the system displays an empty-state message
