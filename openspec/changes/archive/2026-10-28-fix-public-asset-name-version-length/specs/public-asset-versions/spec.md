## MODIFIED Requirements

### Requirement: Newly entered versions accept text with unambiguous valid paths

Create, duplicate, and edited publication Version inputs SHALL accept non-semver text. Newly entered versions MUST be nonblank, MUST NOT start with `_`, and MUST NOT contain `__`, `/`, `{`, `}`, `"`, or U+0000–U+001F. Their assembled destination path MUST NOT contain a component ending in a dot or exceed Core's 900 UTF-8 byte absolute-storage-path limit including the bucket/type prefix and parent folders. For public applications and toolsets, the assembled `name__version` leaf MUST contain at most 255 characters, counting the `__` delimiter and using the existing JavaScript string-length convention; this limit SHALL exclude parent folders and the type/bucket prefix. This implements the strictly-less-than-256 deployment identifier constraint confirmed in [issue #5279](https://github.com/epam/ai-dial-admin-frontend/issues/5279), in addition to the existing Core storage-path contract used by the admin-backend asset integration. URI-reserved text SHALL be segment-encoded at the request boundary; nonblank labels SHALL NOT be silently rewritten. Invalid inputs SHALL show localized field feedback and block submission. Combined name/version length failures SHALL appear on Version and SHALL be re-evaluated when name or Version changes. These new-entry rules SHALL NOT make an untouched legacy identity block an ordinary details save. Existing success and server-error notification behavior SHALL remain unchanged.

#### Scenario: A non-semver text version is accepted
- **WHEN** an administrator enters `release candidate` as Version for a valid, available destination
- **THEN** semver validation does not block submission and the encoded request preserves that label

#### Scenario: The delimiter cannot be entered as a version
- **WHEN** an administrator types or pastes `release__candidate` or `_preview` into Version
- **THEN** the field reports the reserved delimiter and submission is blocked

#### Scenario: Blank and path-invalid versions are rejected
- **WHEN** an entered Version is whitespace-only, contains a forbidden decoded character, or makes the stored leaf end in `.`
- **THEN** localized validation feedback is displayed and submission is blocked

#### Scenario: Server-side creation validation preserves specific localized reasons
- **WHEN** application or toolset creation reaches the server action with a blank, ambiguous, path-invalid, or oversized version
- **THEN** the action returns `{ success: false, errorHeader, errorMessage }` with a localized validation header and the specific localized validation reason
- **AND** no resource PUT is sent to Core

#### Scenario: Total path length is measured in UTF-8 bytes
- **WHEN** a version makes the assembled absolute storage path exceed 900 UTF-8 bytes
- **THEN** submission is blocked even when the version's character count alone is below 900

#### Scenario: The combined leaf accepts 255 characters
- **WHEN** a public application or toolset has a 100-character name and a 153-character Version, with an otherwise valid and available destination
- **THEN** the 255-character `name__version` does not produce a length error or block submission

#### Scenario: The combined leaf rejects 256 characters
- **WHEN** a public application or toolset has a 100-character name and a 154-character Version, with its total storage path below 900 UTF-8 bytes
- **THEN** Version displays a localized error explaining the maximum 255-character combined name/version length including the delimiter, and submission is blocked

#### Scenario: The reported oversized identity is rejected
- **WHEN** an administrator enters a 100-character name and a 160-character Version for a public application or toolset
- **THEN** Version displays the combined-length validation error and creation is blocked

#### Scenario: Changing the name rechecks the combined limit
- **WHEN** an administrator changes an otherwise valid name/version pair from 255 combined characters to 256 by extending the name
- **THEN** Version displays the combined-length validation error and submission is blocked
- **AND** shortening either field to restore a valid, available destination clears the error and restores submission validity

#### Scenario: Character and byte limits remain independent
- **WHEN** the `name__version` leaf is within 255 characters but valid parent folders make the absolute storage path exceed 900 UTF-8 bytes
- **THEN** the existing localized storage-path-length error blocks submission
- **AND** a multibyte name/version leaf within both limits is not rejected solely because its UTF-8 byte count exceeds 255

#### Scenario: Server creation rejects an oversized combined leaf
- **WHEN** `createApp` or `createToolset` receives an otherwise valid public asset whose `name__version` has 256 characters and whose absolute storage path is below 900 bytes
- **THEN** it returns `{ success: false, errorHeader, errorMessage }` with the localized validation header and combined-length reason
- **AND** no resource PUT is sent to Core
