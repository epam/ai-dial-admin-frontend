## MODIFIED Requirements

### Requirement: Dataset header section on Test Cases tab
When a suite is bound to a dataset, the Test Cases tab SHALL show a `DatasetHeader` section above the test cases grid. The header SHALL display: the dataset ID (truncated with tooltip), a visibility badge (PUBLIC or PRIVATE), an "Open in new tab" icon button linking to `/datasets/{datasetId}`, a contextual action button, and a description text.

#### Scenario: Dataset header shows for bound suite
- **WHEN** the suite has a non-null `datasetId`
- **THEN** the DatasetHeader component is rendered at the top of the Test Cases tab
- **THEN** the dataset ID is shown (truncated via EllipsisTooltip if long)
- **THEN** the visibility badge reflects the dataset's visibility (PUBLIC or PRIVATE)

#### Scenario: Open in new tab button
- **WHEN** user clicks the "Open in new tab" icon button in DatasetHeader
- **THEN** the dataset detail page (`/datasets/{datasetId}`) opens in a new browser tab
