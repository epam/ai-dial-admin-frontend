## MODIFIED Requirements

### Requirement: Deployment import preview not available
The Configuration step (step 2) SHALL show a "Preview not available" state for deployment import using `NoDataContent` with `IconEyeOff`, matching the pattern used in export for Active Config format.

#### Scenario: Configuration step for deployment import
- **WHEN** the user proceeds to step 2 with "Deployments" config scope
- **THEN** the system SHALL display "Preview not available" with an eye-off icon
- **AND** an Import button SHALL be available to trigger the import
