## ADDED Requirements

### Requirement: Notification text stays inside the card
A notification's description and Request ID SHALL wrap within the card width, including strings with no
spaces such as resource paths and IDs, so the full text is readable without clipping at the right edge.

#### Scenario: Long unbroken path in an error toast
- **WHEN** an error toast shows a description containing a path longer than the card with no spaces
- **THEN** the path breaks onto following lines inside the card and nothing is cut off

#### Scenario: Long Request ID
- **WHEN** the toast shows a Request ID longer than one line
- **THEN** the Request ID wraps inside the card

#### Scenario: Multi-line message
- **WHEN** a description contains line breaks
- **THEN** the line breaks are preserved
