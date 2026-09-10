## ADDED Requirements

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
