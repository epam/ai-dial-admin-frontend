## ADDED Requirements

### Requirement: Spending Limits tab exposes the spending-limit controls

The System Properties page SHALL offer a Spending Limits tab alongside Global Interceptors and Rate
Limit Schedule, rendering controls for the `spendingLimits` field of Core's global settings
(`v1/settings/platform/global`): a mode select with the options `off`, `shadow` and `enforce`, and a
text field for the default cost object. The tab SHALL carry a description stating that saving writes
the values into the settings and overrides any value set in Core's configuration file. The selected
mode SHALL be accompanied by helper text describing it, and selecting `enforce` SHALL show an inline
warning that requests will be blocked once limits are exceeded.

#### Scenario: Controls reflect stored spending limits

- **WHEN** the page is opened and the global-settings blob contains `spendingLimits` with mode `shadow` and default cost object `TEAM-A`
- **THEN** the mode control shows `shadow` and the default cost object field shows `TEAM-A`

#### Scenario: Absent spending limits show defaults without going dirty

- **WHEN** the global-settings blob contains no `spendingLimits` field
- **THEN** the controls display Core's defaults (mode `off`, default cost object `ORG`) and the page shows no unsaved-changes state, because the field is not written to the page state until a control is changed

#### Scenario: Focusing a control does not edit the settings

- **WHEN** the user opens and dismisses the mode select, or focuses and blurs the unchanged default cost object field, on a page with no `spendingLimits`
- **THEN** no `spendingLimits` value is materialized and no unsaved-changes state appears

#### Scenario: Selecting enforce shows a warning

- **WHEN** the user selects mode `enforce`
- **THEN** an inline warning stating that requests will be blocked once limits are exceeded is shown, and it is not shown for `off` or `shadow`

#### Scenario: The override note is visible

- **WHEN** the user opens the Spending Limits tab
- **THEN** the description states that saving overrides the value set in Core's configuration file

### Requirement: Editing spending limits saves them explicitly and preserves the rest of the settings

The system SHALL treat a change to either Spending Limits control as a normal page edit: the first
change materializes both `mode` and `defaultCostObject` (including a value still at its default), Save
persists the whole global-settings object through the existing singleton update, preserving
`globalInterceptors`, `retriableErrorCodes` and `rateLimitSchedule` unchanged, and the existing
update-success notification and page refresh apply. Editing any other tab SHALL preserve an existing
`spendingLimits` value unchanged. Discard SHALL restore the read values.

#### Scenario: Saving a mode change keeps other settings intact

- **WHEN** a user changes the mode on the Spending Limits tab and clicks Save on a blob that also has global interceptors, retriable error codes and a rate-limit schedule
- **THEN** the update request body carries an explicit `spendingLimits` with both fields plus the unchanged other settings, and the success notification is shown

#### Scenario: First edit materializes both values

- **WHEN** a user on a blob without `spendingLimits` changes only the mode to `shadow` and saves
- **THEN** the update request body carries `spendingLimits` with mode `shadow` and default cost object `ORG`

#### Scenario: Another tab's save preserves spending limits

- **WHEN** the blob contains `spendingLimits` and a user changes and saves the global interceptors list
- **THEN** the saved settings retain the existing `spendingLimits` unchanged

#### Scenario: Discard restores the read spending limits

- **WHEN** a user changes the Spending Limits controls and clicks Discard
- **THEN** the controls return to the values from the last read (or to the displayed defaults, when the blob had no `spendingLimits`)

#### Scenario: Core rejects the value

- **WHEN** a user saves and Core answers the update with a 400
- **THEN** the existing error notification is shown with Core's message and the edited values remain on screen

### Requirement: Default cost object is validated before save

The system SHALL disable Save while the default cost object is empty or whitespace-only, regardless of
the active tab, and show an error state and an inline validation message on the field when the Spending
Limits tab is open, so a blank value is not sent to Core. The system SHALL NOT impose any other format
rule on the value; stricter validation is Core's, surfaced through the existing error notification.
Inline validation SHALL NOT produce a save-success notification.

#### Scenario: Empty cost object disables Save

- **WHEN** the user clears the default cost object field
- **THEN** the field shows an error state with a validation message and the Save button is disabled

#### Scenario: Whitespace-only cost object disables Save

- **WHEN** the user enters only spaces in the default cost object field
- **THEN** the field shows the same error state and the Save button is disabled

#### Scenario: Blank cost object keeps Save disabled across tabs

- **WHEN** the user clears the default cost object or enters only whitespace, then switches to Global Interceptors or Rate Limit Schedule
- **THEN** Save remains disabled and no update request or success notification occurs

#### Scenario: Invalid stored cost object blocks another tab's save

- **WHEN** the stored spending limits have an empty or whitespace-only default cost object and the user makes an edit on another tab without opening Spending Limits
- **THEN** Save is disabled and no update request or success notification occurs

#### Scenario: Correcting the cost object re-enables Save

- **WHEN** the user returns to Spending Limits and enters a non-blank value such as `TEAM-A`
- **THEN** the error state clears and the Save button is enabled when the page has unsaved changes and no other validation errors

#### Scenario: Any non-blank value is accepted client-side

- **WHEN** the user enters a value such as `team/a b`
- **THEN** no client-side validation message is shown

### Requirement: Read-only admin disables the spending-limit controls

The system SHALL disable both Spending Limits controls for a read-only admin, consistent with the Rate
Limit Schedule tab. No typing or selection SHALL produce a page edit.

#### Scenario: Controls are disabled for read-only admin

- **WHEN** a read-only admin opens the Spending Limits tab
- **THEN** the mode select and the default cost object field are disabled and cannot produce a page edit

### Requirement: Spending Limits controls are accessible

The mode select and default cost object field SHALL each have a visible label that is their accessible
name. The cost-object validation message SHALL be announced as an alert, and the `enforce` warning
SHALL be exposed as a status region separate from the select's label.

#### Scenario: Controls are addressable by accessible name

- **WHEN** a user of assistive technology opens the Spending Limits tab
- **THEN** the mode select and the default cost object field are each found by their label

#### Scenario: Validation and warning are announced

- **WHEN** the cost object becomes empty, or mode `enforce` is selected
- **THEN** the validation message is exposed with role alert, and the enforce warning with role status
