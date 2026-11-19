## ADDED Requirements

### Requirement: Inactive OAuth credentials do not block saving

Client ID and Client Secret validation SHALL apply only while their controls are mounted. Hiding or leaving the OAuth credential editor SHALL remove those controls' validation entries without removing unrelated validation. Showing the editor again SHALL validate the current credential values using the existing rules.

#### Scenario: Invalid credentials are hidden
- **WHEN** invalid Client ID or Client Secret controls are hidden by leaving the OAuth configuration editor
- **THEN** their validation no longer blocks Save
- **AND** other invalid fields continue to block Save

#### Scenario: Credentials are shown again
- **WHEN** the OAuth configuration editor is shown again
- **THEN** Client ID and Client Secret are validated using their current values
- **AND** invalid visible credentials block Save and show their existing errors

#### Scenario: External service editor is closed
- **WHEN** a user leaves an external service editor with invalid OAuth credentials
- **THEN** those hidden credentials no longer block the enclosing form
