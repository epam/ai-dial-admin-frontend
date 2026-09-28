## ADDED Requirements

### Requirement: Rate Limit Schedule tab exposes the schedule controls
The System Properties page SHALL offer a Rate Limit Schedule tab alongside Global Interceptors,
rendering controls for the `rateLimitSchedule` fields of Core's global settings — timezone
(searchable select over the full IANA id list), week start day (select over Monday..Sunday), and
reset time (`HH:mm` text input) — with a description stating that these values anchor the
day/week/month rate-limit windows configured per role.

#### Scenario: Controls reflect a stored schedule
- **WHEN** the page is opened and the global-settings blob contains a `rateLimitSchedule`
- **THEN** the three controls show its stored `timezone`, `weekStartDay` and `resetTime` values

#### Scenario: Absent schedule shows defaults without going dirty
- **WHEN** the global-settings blob contains no `rateLimitSchedule` field
- **THEN** the controls display Core's default values (UTC, Monday, 00:00) and the page shows no
  unsaved-changes state, because the field is not written to the page state until a control is
  changed

#### Scenario: Timezone search reaches any IANA id
- **WHEN** the user types a region or city fragment into the timezone control's search
- **THEN** the option list filters over the full IANA timezone id set, so any timezone Core's
  validation accepts is selectable (e.g. searching "Warsaw" offers `Europe/Warsaw`)

### Requirement: Editing the schedule saves it explicitly and preserves the rest of the settings
The system SHALL treat a change to any Rate Limit Schedule control as a normal page edit: the
first change materializes all three values (including any still at their default), Save persists
the whole global-settings object through the existing singleton update (preserving
`globalInterceptors` and `retriableErrorCodes` unchanged), and the existing update-success
notification and page refresh apply. Discard SHALL restore the read values.

#### Scenario: Saving a schedule change keeps other settings intact
- **WHEN** a user changes the timezone on the Rate Limit Schedule tab and clicks Save on a blob
  that also has global interceptors and retriable error codes
- **THEN** the update request body carries an explicit `rateLimitSchedule` with all three fields
  plus the unchanged other settings, and the success notification is shown

#### Scenario: Discard restores the read schedule
- **WHEN** a user changes schedule controls and clicks Discard
- **THEN** the controls return to the values from the last read (or to the displayed defaults,
  when the blob had no schedule)

### Requirement: Reset time is validated before save
The system SHALL validate `resetTime` client-side against Core's 24-hour `HH:mm` format
(`^([01][0-9]|2[0-3]):[0-5][0-9]$`) and SHALL disable Save while the entered value is invalid,
showing an error state on the input, so an invalid schedule cannot be sent to Core.

#### Scenario: Invalid time disables Save
- **WHEN** the user enters a reset time that does not match the `HH:mm` 24-hour format (e.g. `9:99`
  or `25:00`)
- **THEN** the input shows an error state with a validation message and the Save button is disabled

#### Scenario: Correcting the time re-enables Save
- **WHEN** the user corrects the reset time to a valid value (e.g. `09:30`)
- **THEN** the error state clears and the Save button is enabled again

### Requirement: Read-only admin disables the schedule controls
The system SHALL disable all three Rate Limit Schedule controls for a read-only admin, consistent
with how the Global Interceptors tab withholds its mutating actions.

#### Scenario: Controls are disabled for read-only admin
- **WHEN** a read-only admin opens the Rate Limit Schedule tab
- **THEN** the timezone, week start day and reset time controls are all disabled and cannot
  produce a page edit
