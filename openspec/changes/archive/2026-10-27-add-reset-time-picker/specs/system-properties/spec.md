## MODIFIED Requirements

### Requirement: Rate Limit Schedule tab exposes the schedule controls

The System Properties page SHALL offer a Rate Limit Schedule tab alongside Global Interceptors,
rendering controls for the `rateLimitSchedule` fields of Core's global settings — timezone
(searchable select over the full IANA id list), week start day (select over Monday..Sunday), and
reset time (design-system time picker with masked `HH:mm` entry and visual hour/minute selection)
— with a description stating that these values anchor the day/week/month rate-limit windows configured per role.
The reset-time field SHALL have an accessible Reset time label and a clock control opening a popover
with hours `00–23` and minutes `00–59`. The selected time SHALL remain a 24-hour `HH:mm` string
in the schedule's selected timezone, without date/UTC conversion or a viewer-timezone hint.

#### Scenario: Controls reflect a stored schedule

- **WHEN** the page is opened and the global-settings blob contains a `rateLimitSchedule`
- **THEN** the three controls show its stored `timezone`, `weekStartDay` and `resetTime` values

#### Scenario: Absent schedule shows defaults without going dirty

- **WHEN** the global-settings blob contains no `rateLimitSchedule` field
- **THEN** the controls display Core's default values (UTC, Monday, 00:00) and the page shows no unsaved-changes state, because the field is not written to the page state until a control is changed

#### Scenario: Timezone search reaches any IANA id

- **WHEN** the user types a region or city fragment into the timezone control's search
- **THEN** the option list filters over the full IANA timezone id set, so any timezone Core's validation accepts is selectable (e.g. searching "Warsaw" offers `Europe/Warsaw`)

#### Scenario: Opening the time picker does not edit the schedule

- **WHEN** the user opens and dismisses the clock popover or focuses and blurs an unchanged reset-time field on a page with no schedule
- **THEN** no schedule is materialized and no unsaved-changes state appears

#### Scenario: Visual selection commits a canonical time

- **WHEN** the stored reset time is `09:30`, the user opens the clock popover and selects hour `14`, then minute `05`
- **THEN** selecting the hour shows `14:30` and leaves the popover open, and selecting the minute shows `14:05`, updates the schedule, and closes the popover

#### Scenario: All minutes and boundary hours are selectable

- **WHEN** the user chooses `00:00` or `23:59` through the time picker
- **THEN** the field and schedule contain that exact zero-padded value without rounding or a restricted minute interval

#### Scenario: Keyboard users can select time

- **WHEN** a keyboard user activates the clock control, navigates the hours and minutes options, and activates a minute option
- **THEN** the selected options are programmatically exposed, the field shows the chosen `HH:mm` value, and the popover closes

### Requirement: Reset time is validated before save

The system SHALL validate `resetTime` client-side against Core's 24-hour `HH:mm` format
(`^([01][0-9]|2[0-3]):[0-5][0-9]$`) and SHALL disable Save while the value is invalid,
showing an error state and validation message on the time field, so an invalid schedule cannot be sent
to Core's global-settings singleton (`v1/settings/platform/global`). Typed digits SHALL be masked
and completed segments constrained to the valid hour/minute range. Complete valid times SHALL update
the schedule immediately; incomplete or empty typed drafts SHALL be synchronized and validated when
the field loses focus, including moving focus to Save. The system MUST NOT silently save the previous
complete time while an incomplete or cleared draft is displayed.
Malformed stored values SHALL remain invalid until corrected rather than being silently replaced.
Inline validation SHALL not produce a save-success notification; valid saves retain the existing
update-success notification, and failed update requests retain the existing error notification.

#### Scenario: Invalid time disables Save

- **WHEN** the stored reset time does not match the `HH:mm` 24-hour format (e.g. `9:99` or `25:00`), or an incomplete typed value loses focus
- **THEN** the field shows an error state with a validation message and the Save button is disabled

#### Scenario: Correcting the time re-enables Save

- **WHEN** the user corrects the reset time to a valid value (e.g. `09:30`), with the other schedule fields valid
- **THEN** the error state clears and the Save button is enabled again when the page has unsaved changes

#### Scenario: Cleared draft cannot save the previous complete time

- **WHEN** the page has unsaved changes, the user clears or partially types the reset-time field, and attempts to click Save without first blurring elsewhere
- **THEN** the draft is validated before any update request, the field shows the validation error, Save is disabled, and no update request or success notification occurs

#### Scenario: Complete typed time is normalized

- **WHEN** the user types the four digits `0930` into an empty reset-time field
- **THEN** the field displays `09:30` and the schedule contains `09:30`

#### Scenario: Correcting one stored segment is not sufficient when the other is invalid

- **WHEN** the stored reset time is `25:99` and the user selects only a valid hour
- **THEN** the still-invalid minutes keep the error visible and Save disabled until a valid complete time is selected or typed

### Requirement: Read-only admin disables the schedule controls

The system SHALL disable all three Rate Limit Schedule controls for a read-only admin, consistent
with how the Global Interceptors tab withholds its mutating actions. Both the reset-time input and
its clock control SHALL be disabled; no visual selection or typing SHALL produce a page edit.

#### Scenario: Controls are disabled for read-only admin

- **WHEN** a read-only admin opens the Rate Limit Schedule tab
- **THEN** the timezone, week start day, reset-time input, and clock control are all disabled and cannot produce a page edit or open the time popover
