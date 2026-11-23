## MODIFIED Requirements

### Requirement: Key detail view
The system SHALL display a detail view at `/platform-keys/<encodedName>` fetched via
`assetApi.getMergedWithEtag(token, ResourceType.PROJECT_KEY, path, etag)`. The view SHALL include
a Properties tab and a Roles tab.

#### Scenario: User opens a key detail
- **WHEN** the user clicks a key's name link in the listing
- **THEN** the system navigates to `/platform-keys/<encodedName>` and renders the key
  detail with Properties and Roles tabs

