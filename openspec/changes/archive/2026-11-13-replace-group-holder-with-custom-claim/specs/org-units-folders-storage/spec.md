## MODIFIED Requirements

### Requirement: Roles card lists roles and holders
The roles card SHALL list the roles returned by `GET …/roles` in core's order, each with its description,
and under each role its holders from `GET …/role-assignments` as chips. Holder chips SHALL be classified
by the subject alone, with no configuration: person (`EQUAL` on `email`), DIAL role (`EQUAL` on `roles`),
everyone signed in (`TRUE` on `sub` with no targets), or custom claim (`EQUAL` on any other source). A custom claim
chip SHALL show the claim and its targets as `key=value`, with no spaces around `=`. Any other subject SHALL render
as a raw chip `source = targets` that can still be removed. A `403` from either call SHALL hide the card.

#### Scenario: Configured role appears without a panel change
- **WHEN** core returns a role named `files-reader` after the built-in four
- **THEN** the card shows a `files-reader` section after `member`

#### Scenario: Person and custom claim chips
- **WHEN** an assignment subject is `EQUAL` on `email` with target `carol@acme.com`, and another is
  `EQUAL` on `department` with target `risk`
- **THEN** the first renders as a person chip showing `carol@acme.com` and the second as a custom claim chip
  showing `department=risk`

#### Scenario: Former group assignment
- **WHEN** an assignment subject is `EQUAL` on `groups` with target `us-risk-analysts`
- **THEN** it renders as a custom claim chip `groups=us-risk-analysts` and can be removed

#### Scenario: Email-like value on another claim
- **WHEN** an assignment subject is `EQUAL` on `upn` with target `carol@acme.com`
- **THEN** it renders as a custom claim chip `upn=carol@acme.com`, not as a person chip

#### Scenario: Multiple targets
- **WHEN** an assignment subject is `EQUAL` on `department` with targets `risk` and `legal`
- **THEN** the custom claim chip shows `department=risk, legal`

#### Scenario: Unrecognised subject
- **WHEN** an assignment subject is `TRUE` on `tenant`
- **THEN** a raw chip is shown for it, with no custom claim styling, and can be removed

#### Scenario: Card hidden on 403
- **WHEN** the role-assignments call answers 403
- **THEN** the roles card is not shown

#### Scenario: Read-only caller
- **WHEN** the caller cannot write role assignments at the unit
- **THEN** every chip, custom claim included, shows its icon and text without a remove button and no add form is
  shown

### Requirement: Role edits are a draft saved with Save and Discard
Adding or removing a holder SHALL change a local draft only. The page SHALL show Save and Discard
(`ChangedEntityButtons`) while the draft differs from the stored assignments. Save SHALL `POST` each added
assignment (`roleName` and a `claimsPredicate` subject with `source`, `function`, `targets`) and `DELETE`
each removed one, sequentially, then reload the assignments from core. Discard SHALL restore the stored
assignments. Selecting another folder SHALL discard the draft without a prompt. Holder values, and the claim name
of a custom claim holder, SHALL be non-blank, at most 256 characters and free of control characters before Save is
enabled.

#### Scenario: Add a holder
- **WHEN** the user adds custom claim `department` = `risk` to `editor`
- **THEN** the chip `department=risk` appears, Save and Discard are shown, and nothing has been sent to core

#### Scenario: Save sends only the difference
- **WHEN** the draft has one added and one removed holder and the user clicks Save
- **THEN** one POST and one DELETE are sent and the card shows the reloaded assignments

#### Scenario: Partial failure
- **WHEN** a POST succeeds and the following DELETE fails
- **THEN** sending stops, the assignments are reloaded from core, and core's error message is shown in a
  notification

#### Scenario: Discard
- **WHEN** the user clicks Discard
- **THEN** the card shows the stored assignments and Save/Discard disappear

#### Scenario: Selection change drops the draft
- **WHEN** the draft has changes and the user selects another folder
- **THEN** the draft is dropped without a prompt

#### Scenario: Invalid holder blocks Save
- **WHEN** an added holder value, or the claim name of an added custom claim, is blank or longer than 256
  characters
- **THEN** Save is disabled

### Requirement: Unit map is shared by every folder context
One org units context SHALL hold the unit map, its status and the ownership lookup, and SHALL load the units once
on first use by Folders Storage or any file manager. Asset folder contexts SHALL NOT fetch units themselves.

#### Scenario: One load for several consumers
- **WHEN** Folders Storage and a file manager are used in one session
- **THEN** the units call is made once until a unit is created, renamed or removed

## ADDED Requirements

### Requirement: Holder form offers a custom claim
The add-holder form SHALL offer the holder types Email, Role, Custom claim and Everyone signed in, in that order,
each with its icon; Custom claim SHALL use a braces icon. For Email and Role the form SHALL show one value input.
For Custom claim it SHALL show a claim name input and a value input, and Add SHALL stay disabled until both are
valid. Adding SHALL create an `EQUAL` `claimsPredicate` on the trimmed claim name with the trimmed value as its only
target. The claim names `email`, `roles` and `sub` SHALL be refused with an inline error, because they have their own
holder types. Both inputs SHALL have an accessible name, and a field SHALL show its error once it has content. A
successful add SHALL clear both inputs.

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
- **WHEN** the user enters `email`, `roles` or `sub` as the claim name
- **THEN** an inline error is shown and Add is disabled

#### Scenario: Reserved name in another case
- **WHEN** the user enters `Email` as the claim name
- **THEN** it is accepted and the chip reads `Email=<value>`

#### Scenario: Inputs cleared after add
- **WHEN** the user adds a custom claim holder
- **THEN** the claim name and value inputs are empty

#### Scenario: Duplicate holder
- **WHEN** the draft already holds `department=risk` for the role and the user adds the same claim and value
- **THEN** no second chip is added

## REMOVED Requirements

### Requirement: Group claim is configured
**Reason**: Group holders are replaced by the Custom claim holder, where the admin enters the claim name. No
deployment-level claim name is needed to recognise or create a holder.
**Migration**: Remove `ORG_UNITS_GROUP_CLAIM` from deployment values; it is no longer read. Existing assignments on
that claim render as custom claim chips (`groups=<value>`) and keep working unchanged.
