## ADDED Requirements

### Requirement: Undeclared-property messages remain contained and readable

The undeclared-properties warning or error SHALL constrain the height of its message and provide vertical scrolling when needed. The full message, including all undeclared property names, SHALL remain available without truncation and accessible by keyboard. Long names SHALL wrap without causing horizontal page overflow. The editor SHALL remain usable beneath the banner. An existing removal control SHALL remain available outside the message's scrolling area.

#### Scenario: A long warning does not conceal the editor

- **WHEN** undeclared values produce a message longer than the banner's maximum height
- **THEN** the message is scrollable and its full contents remain reachable
- **AND** the catalog values editor remains available below it

#### Scenario: A long forbidden-values error retains its removal action

- **WHEN** `additionalProperties` is `false` and a long undeclared-values error is shown to an editable user
- **THEN** the full error remains reachable by scrolling
- **AND** the removal control remains accessible outside the scrolling message
- **AND** removing the undeclared values keeps declared values and updates validation as before

#### Scenario: Read-only access does not expose removal

- **WHEN** a read-only user sees a long undeclared-values error
- **THEN** the full message remains reachable without offering a removal control
