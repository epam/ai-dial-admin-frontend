## MODIFIED Requirements

### Requirement: The canonical deployment identity is visible
Because DIAL Core keys API-written models by their **bare short name** and sets the deployment's name from that key, the identifier callers use to invoke a model created through this surface is the bare name — the same value the list displays, not a `models/platform/{name}` canonical id. The system SHALL surface that deployment identifier on the model asset's detail view.

#### Scenario: The detail view shows the deployment identifier
- **WHEN** a user opens a model asset's detail view
- **THEN** the deployment identifier — the model's bare name — is shown and can be copied
