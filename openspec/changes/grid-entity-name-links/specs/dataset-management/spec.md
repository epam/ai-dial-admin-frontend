## MODIFIED Requirements

### Requirement: Dataset detail view navigation
The system SHALL navigate to `/datasets/{id}` when the user clicks a dataset's name link in the listing grid; a click elsewhere in the row SHALL NOT navigate.

#### Scenario: Click row to open dataset
- **WHEN** user clicks a dataset's name link in the datasets listing grid
- **THEN** the user is navigated to `/datasets/{id}` showing the dataset detail view

---

