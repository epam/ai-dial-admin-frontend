## MODIFIED Requirements

### Requirement: Core validates a write; the client adds only shape checks
The system SHALL send assignment writes to Core and SHALL NOT re-implement Core's semantic rules (policy
existence, cost-object ownership, subject pinned exactly once, instance-id collisions, `expiresAt` in the
future). The system SHALL render Core's 400, 409, and 422 messages unchanged in an error notification
and SHALL omit `id` from payloads. A failed create SHALL show exactly one error notification and keep the
create form open with the user's edits.

#### Scenario: A 422 is shown as returned
- **WHEN** Core answers 422 because the referenced policy does not exist
- **THEN** that message is shown in the error notification and the form keeps the user's edits

#### Scenario: Failed create shows one error
- **WHEN** a valid assignment form is submitted and Core rejects the write, including a subject-rule error or priority conflict
- **THEN** exactly one notification shows Core's unchanged error details and the create form remains open with the entered values
