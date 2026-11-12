# system-properties Specification

## Purpose
The System Properties page's read/save behavior against DIAL Core's global-settings singleton
(`v1/settings/platform/global`) — how a first-ever save is distinguished from a save that must
guard against concurrent edits, how a read failure is surfaced, and how fields the page doesn't
own survive a save.
## Requirements
### Requirement: First-ever save succeeds when no settings blob exists yet
The system SHALL allow saving global interceptors from the System Properties page even when Core has
never had a global-settings blob written via the API, and SHALL NOT send a conditional header that
asserts the resource already exists in that case.

#### Scenario: Save succeeds on an environment with no prior API-written settings
- **WHEN** a user opens System Properties on an environment where Core's global-settings GET
  previously returned 404, edits the global interceptors list, and clicks Save
- **THEN** the save request succeeds and the page reflects the newly saved interceptors, with no
  precondition-failure error shown

### Requirement: Save asserts existence once a settings blob is known to exist
The system SHALL send `If-Match: *` when saving global interceptors and a prior read confirmed a
settings blob exists, so the write is rejected if the blob was deleted in the meantime. Core's GET
for this singleton never returns an ETag, so a real concurrent-edit (lost-update) guard is not
achievable through this endpoint and is not attempted.

#### Scenario: A save after the blob was deleted is rejected
- **WHEN** a user saves global interceptors after the settings blob was deleted since this page's
  last read
- **THEN** the save is rejected and an error notification is shown

### Requirement: A full-settings read failure is surfaced to the user
The system SHALL distinguish "no settings blob exists yet" (expected, not an error) from any other
read failure when fetching global settings for the System Properties page, and SHALL show a warning
for the latter rather than proceeding as if the read had succeeded.

#### Scenario: A non-404 read failure shows a warning
- **WHEN** the System Properties page's full-settings read fails for a reason other than "no blob
  exists yet"
- **THEN** a warning notification is shown on the page, consistent with how an incomplete
  interceptor option list is already surfaced

### Requirement: Non-interceptor settings fields survive a global-interceptors save
The system SHALL preserve any other field already present on the global-settings object (such as
`retriableErrorCodes`) when saving a change to global interceptors, rather than omitting it and
letting Core reset it to its default.

#### Scenario: Saving interceptors does not clear other settings
- **WHEN** Core's global settings already contain a non-default value for a field other than
  `globalInterceptors`, and a user changes and saves the global interceptors list from System
  Properties
- **THEN** the saved settings retain that other field's existing value unchanged

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

### Requirement: Schedule validation remains active across tabs and resets

The system SHALL validate all stored schedule fields for the page lifetime, including when Rate Limit Schedule has not been opened or is no longer active. An absent schedule SHALL remain valid. A save-validation reset SHALL NOT clear validation of the current draft.

#### Scenario: Invalid schedule on a hidden tab blocks saving
- **WHEN** the stored schedule is invalid or the user makes it invalid and switches to another tab
- **THEN** Save is disabled and no update request is sent

#### Scenario: Earlier save completes after a newer invalid edit
- **WHEN** a successful save resets validation after the user has made the schedule invalid
- **THEN** Save remains disabled for the current draft

### Requirement: Invalid tabs show an error status

The system SHALL show an accessible error status on each System Properties tab containing invalid settings, including when that tab is not active. The status SHALL clear when the settings are corrected or discarded.

#### Scenario: Hidden invalid cost object is identifiable
- **WHEN** the stored default cost object is blank and another tab is active
- **THEN** the Spending Limits tab has an accessible error status

### Requirement: Rejected updates show an error

The system SHALL show a localized error notification when an update request rejects, preserve the edits, and avoid a success notification, validation reset or refresh.

#### Scenario: Update request rejects
- **WHEN** the user saves and the update request rejects
- **THEN** an error notification is shown and edits remain available

### Requirement: The Sessions source tab saves independently of Core global settings

The System Properties page SHALL offer a **Sessions source** tab alongside Global Interceptors and Rate Limit
Schedule when Analytics is enabled. The tab SHALL read and save the Sessions source setting against the analytics
service, as specified by `analytics/sessions-source`, and SHALL NOT read or write DIAL Core's global-settings
object.

The tab's unsaved-changes state, Save and Discard SHALL be its own: saving the Sessions source SHALL NOT send a
global-settings write, and saving global interceptors or the rate-limit schedule SHALL NOT send a Sessions source
write. A failure on one store SHALL NOT be reported as a failure of the other.

Where Analytics is disabled, the tab SHALL NOT be offered and no request SHALL be made to the analytics service.

#### Scenario: Saving the Sessions source does not touch Core settings

- **WHEN** the operator changes the Sessions source and saves
- **THEN** one write is sent to the analytics service
- **AND** no write is sent to `v1/settings/platform/global`

#### Scenario: Saving interceptors does not touch the Sessions source

- **WHEN** the operator saves a change to global interceptors
- **THEN** no write is sent to the analytics service

#### Scenario: The tab is absent without Analytics

- **WHEN** Analytics is disabled and System Properties is opened
- **THEN** no Sessions source tab is offered

