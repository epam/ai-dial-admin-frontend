## MODIFIED Requirements

### Requirement: Schema tab in TestSuite view is read-only
The Schema tab in the TestSuite view SHALL display the bound dataset's `testCaseSchema` as a read-only list. Editing schema fields SHALL NOT be possible from the TestSuite context. The tab SHALL include a link button ("Edit on Dataset page") that opens the bound dataset's detail page in a new tab.

#### Scenario: Schema tab shows linked dataset's schema
- **WHEN** the user opens the Schema tab of a bound TestSuite
- **THEN** the list of schema fields from the linked dataset is displayed
- **THEN** fields are not editable (no add/remove/edit controls)

#### Scenario: Edit on Dataset page link
- **WHEN** user clicks "Edit on Dataset page" in the Schema tab
- **THEN** the bound dataset's detail page (`/datasets/{datasetId}`) opens in a new tab

#### Scenario: Schema tab hidden for unbound suite
- **WHEN** the suite has `datasetId = null`
- **THEN** the Schema tab is not visible in the tab navigation

## REMOVED Requirements

### Requirement: Editable schema manager on TestSuite
**Reason**: `testCaseSchema` has been moved from TestSuite to Dataset. The TestSuite no longer owns schema.
**Migration**: Schema editing is now performed on the Dataset page via the Schema tab. The `SchemaManager` component with full edit capability remains on the Dataset view.
