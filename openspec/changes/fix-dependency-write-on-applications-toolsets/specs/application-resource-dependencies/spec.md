## MODIFIED Requirements

### Requirement: Dependency validation mirrors Core
The UI SHALL validate a dependency with the same rules Core applies at write time and SHALL show the
first failing rule next to the offending field:

- `Link ID` is required (after trimming) and unique among the declaration's dependencies
  (case-sensitive; the row being edited is excluded).
- `Target path` is required (after trimming). After removing one trailing `/` and decoding each segment
  (an undecodable segment is kept as is), the first segment SHALL be one of `files`, `prompts`,
  `conversations`, `applications`, `toolsets`, `skills`; a first segment of `users` SHALL be rejected
  with a message pointing to the `{current-user}` form; a path with only the type segment SHALL be
  rejected; `{current-user}` SHALL be accepted only as the second segment; no segment after the first
  may be empty, contain `*`, or equal `.` or `..`.
- At least one access right is present, and `SHARE` is never offered.
- `Write` is not a valid right on a target whose decoded first segment is `applications` or `toolsets`.
  The modal SHALL show the error next to `Access`, naming the type, and SHALL keep `Write` selectable
  and selected. The error SHALL appear or clear as either the path or the access changes.

Core remains authoritative: a validation error returned by Core on Save SHALL be reported through the
normal save error notification.

#### Scenario: Both documented examples are accepted
- **WHEN** a user enters path `skills/{current-user}/` and, separately, `files/public/folder/`
- **THEN** each is accepted as valid

#### Scenario: Unknown root is rejected
- **WHEN** a user enters path `models/public/x`
- **THEN** the modal shows an error naming the allowed type roots and `Add` stays disabled

#### Scenario: Concrete personal path is rejected
- **WHEN** a user enters path `users/abc/files/x`
- **THEN** the modal shows an error telling the user to declare personal targets as
  `{type}/{current-user}/…`

#### Scenario: Bare type root is rejected
- **WHEN** a user enters path `files/` or `files/public` (a bucket with nothing after it)
- **THEN** the modal shows an error that a folder or resource within a bucket is required
- **AND** `files/public/` is accepted

#### Scenario: Empty segment is rejected
- **WHEN** a user enters path `files/public//x`, or one ending in `//`
- **THEN** the modal shows an error that the path must not contain empty segments

#### Scenario: Placeholder in the wrong position is rejected
- **WHEN** a user enters path `files/public/{current-user}/`
- **THEN** the modal shows an error that the placeholder is valid only as the second segment

#### Scenario: Wildcards and relative segments are rejected
- **WHEN** a user enters path `files/public/*` or `files/public/../x`
- **THEN** the modal shows the corresponding error and `Add` stays disabled

#### Scenario: Encoded relative segment is rejected
- **WHEN** a user enters path `files/public/%2e%2e/x`
- **THEN** the modal rejects it as a relative segment

#### Scenario: Duplicate Link ID is rejected on create
- **WHEN** a user enters a Link ID that another dependency already uses
- **THEN** the modal shows a uniqueness error and `Add` stays disabled

#### Scenario: Editing a row does not conflict with itself
- **WHEN** a user edits a row without changing its Link ID
- **THEN** no uniqueness error is shown

#### Scenario: Write on an applications or toolsets target is rejected
- **WHEN** a user enters path `applications/public/x/` and, separately, `toolsets/public/x/`, and
  selects `Write`
- **THEN** the modal shows an error next to `Access` saying Write is not allowed on that type, and
  `Add` stays disabled
- **AND** `Write` remains selected and selectable

#### Scenario: Write error follows the path
- **WHEN** a user selects `Write` with path `applications/public/x/`, then changes the path to
  `files/public/x/`
- **THEN** the error disappears and `Add` becomes enabled

#### Scenario: Read on an applications or toolsets target is accepted
- **WHEN** a user enters path `applications/public/x/` with only `Read` selected
- **THEN** the dependency is accepted as valid

#### Scenario: Encoded applications root is rejected for Write
- **WHEN** a user selects `Write` with path `%61pplications/public/x/`
- **THEN** the modal shows the same error as for `applications/public/x/`
