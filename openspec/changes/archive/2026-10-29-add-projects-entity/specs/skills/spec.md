## ADDED Requirements

### Requirement: Skills behaviour is unchanged by the shared complex-resource client
The system SHALL serve every Skills surface (list, create, detail, file staging, manifest tab, delete, bulk
delete, folder delete, move) through the shared complex-resource client, with the same requests, notifications,
and UI as before the extraction. No Skill requirement in this capability changes.

#### Scenario: Existing Skill behaviour is preserved
- **WHEN** a user lists, creates, edits, and deletes skills
- **THEN** each action sends the same Core requests and shows the same results as before the extraction
