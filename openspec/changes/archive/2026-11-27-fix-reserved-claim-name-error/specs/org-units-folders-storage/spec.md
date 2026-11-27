# Spec Delta

## MODIFIED Requirements

### Requirement: Holder form offers a custom claim
The add-holder form SHALL offer the holder types Email, Role, Custom claim and Everyone signed in, in that order,
each with its icon; Custom claim SHALL use a braces icon. For Email and Role the form SHALL show one value input.
For Custom claim it SHALL show a claim name input and a value input, and Add SHALL stay disabled until both are
valid. Adding SHALL create an `EQUAL` `claimsPredicate` on the trimmed claim name with the trimmed value as its only
target. The claim names `email`, `roles` and `sub` SHALL be refused because they have their own holder types.
Matching SHALL be case-sensitive after trimming. Both inputs SHALL have an accessible name. A reserved claim name
SHALL mark the name input invalid and show the existing reserved-name message, independently of the value. Other
invalid Custom claim input SHALL NOT show an inline validation error; other holder inputs SHALL show their error once
they have content. A successful add SHALL clear both inputs.

#### Scenario: Holder types and order
- **WHEN** the add-holder form is shown
- **THEN** the types are Email, Role, Custom claim and Everyone signed in, in that order, and there is no Group type

#### Scenario: Custom claim shows two inputs
- **WHEN** the user selects Custom claim
- **THEN** a claim name input and a value input are shown, and Add is disabled until both have valid text

#### Scenario: Other types keep one input
- **WHEN** the user selects Email or Role
- **THEN** only the value input is shown

#### Scenario: Custom claim sent to core
- **WHEN** the user adds claim name ` realm_access.roles ` and value ` analysts ` to `editor` and saves
- **THEN** the assignment is sent with `source` `realm_access.roles`, `function` `EQUAL` and `targets`
  `["analysts"]`

#### Scenario: Reserved claim name
- **WHEN** the user enters `email`, `roles` or `sub` as the claim name, with or without surrounding whitespace
- **THEN** the claim name is marked invalid, the message "Email, role and everyone have their own types. Use a different claim name." appears under it, and Add is disabled

#### Scenario: Reserved name with a valid value
- **WHEN** the user enters a reserved claim name and a valid claim value
- **THEN** the claim value is not marked invalid and no validation error appears under it

#### Scenario: Correcting a reserved name
- **WHEN** the user changes a reserved claim name to a valid non-reserved name while the claim value is valid
- **THEN** the reserved-name error and invalid state disappear and Add is enabled

#### Scenario: Incomplete custom claim
- **WHEN** the claim name or claim value is blank and the claim name is not reserved
- **THEN** Add is disabled without marking either input invalid or showing an inline validation error

#### Scenario: Reserved name with a blank value
- **WHEN** the claim name is reserved and the claim value is blank
- **THEN** the claim-name error is shown, the claim value is not marked invalid, and Add is disabled

#### Scenario: Reserved name in another case
- **WHEN** the user enters `Email` as the claim name
- **THEN** it is accepted and the chip reads `Email=<value>`

#### Scenario: Inputs cleared after add
- **WHEN** the user adds a custom claim holder
- **THEN** the claim name and value inputs are empty

#### Scenario: Duplicate holder
- **WHEN** the draft already holds `department=risk` for the role and the user adds the same claim and value
- **THEN** no second chip is added
