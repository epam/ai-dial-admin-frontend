## ADDED Requirements

### Requirement: Policy create modal presents Details and Subjects as steps

The policy create modal SHALL present two steps through `Steps`: **Details** (the existing name, cost object, and
budget fields) and **Subjects** (the subject rule list). The Details step footer SHALL offer Cancel and Next, with Next
unavailable while the details are invalid. The Subjects step footer SHALL offer Back, Cancel, and Finish labeled
**Create**, unavailable while the details or any subject rule is invalid. Values entered on Details SHALL survive going
back from Subjects. Validation, the create call, the success notification, and navigation to the policy detail view
SHALL be unchanged.

#### Scenario: Both steps are visible

- **WHEN** a user opens the policy create modal
- **THEN** the modal shows the Details and Subjects steps with Details current

#### Scenario: Next waits for valid details

- **WHEN** the policy name or budget fields are invalid
- **THEN** Next is unavailable and the Subjects step cannot be selected in the indicator

#### Scenario: Create on the last step

- **WHEN** the user is on the Subjects step with valid details and valid rules
- **THEN** the footer shows Back, Cancel, and Create
- **AND** Create writes the policy and opens its detail view

#### Scenario: Going back keeps the entered details

- **WHEN** the user moves from Subjects back to Details
- **THEN** the previously entered values are still present
