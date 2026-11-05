## MODIFIED Requirements

### Requirement: File root shown above physical buckets in the Assets Applications grid
The system SHALL display synthetic `file`, `platform`, and `public` roots in the existing `Assets ▸ Applications` grid, using the same `BaseAssetList` instance. The order SHALL be `file`, `platform`, then `public`. No new menu entry or top-level list route SHALL be introduced.

#### Scenario: All roots appear
- **WHEN** a user opens `/assets-applications`
- **THEN** the grid shows `file`, `platform`, and `public` roots in that order
