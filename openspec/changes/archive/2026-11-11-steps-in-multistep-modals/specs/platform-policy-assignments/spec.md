## ADDED Requirements

### Requirement: Assignment create modal presents Details and Subjects as steps

The policy assignment create modal, which shares its implementation with the policy create modal, SHALL present two
steps through `Steps`: **Details** (cost object, ID, and policy) and **Subjects** (the subject rule list). The Details
step footer SHALL offer Cancel and Next, with Next unavailable while the details are invalid. The Subjects step footer
SHALL offer Back, Cancel, and Finish labeled **Create**. The cost-object folder rules, validation, create call, success
notification, and navigation SHALL be unchanged.

#### Scenario: Both steps are visible

- **WHEN** a user opens the assignment create modal
- **THEN** the modal shows the Details and Subjects steps with Details current

#### Scenario: Next waits for valid details

- **WHEN** the cost object, ID, or policy is empty or invalid
- **THEN** Next is unavailable and the Subjects step cannot be selected in the indicator

#### Scenario: Locked cost object survives the step change

- **WHEN** the modal was opened inside the `team-a` folder and the user moves to Subjects and back
- **THEN** Cost object still shows `team-a` and cannot be changed
