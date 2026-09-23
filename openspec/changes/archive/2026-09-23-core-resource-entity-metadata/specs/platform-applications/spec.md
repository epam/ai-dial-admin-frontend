# platform-applications — `_metadata` write-strip and folderId delta

## MODIFIED Requirements

### Requirement: Platform application writes strip read-only and derived fields
The system SHALL strip the merge layer's `_metadata` object — which holds the read-only and
derived fields `status`, `validationWarnings`, `author`, `createdAt`, `updatedAt`, `name`,
`path`, `folderId`, `version`, and `nodeType` (see the `core-resource-entity-metadata`
capability) — plus the client-only tracking field `reference`, before sending a create or update
write for a platform-bucket application. Unlike the `public` bucket's generic write path, the
`platform` bucket's write path deserializes strictly and rejects any unrecognized field.

#### Scenario: A platform application save round-trips without a parse failure
- **WHEN** the user edits and saves a platform-bucket application whose fetched entity carries
  `_metadata` and `reference`
- **THEN** the write succeeds, with neither `_metadata` nor `reference` present in the request
  body sent to Core

### Requirement: Platform application folderId identifies the platform bucket
The system SHALL return `'platform/'` as `_metadata.folderId` when reading a platform-bucket
application from DIAL Core, matching the value the write path already sets on create and update,
so that any check of `isPlatformBucketPath` against a freshly-fetched resource's
`_metadata.folderId` correctly identifies a platform-bucket application, not only one just
created or updated in the current session.

#### Scenario: A freshly-fetched platform application's folderId identifies its bucket
- **WHEN** the user opens a platform-bucket application that was not created or updated in the
  current session
- **THEN** the fetched resource's `_metadata.folderId` is `'platform/'`, and
  `isPlatformBucketPath` on that value returns `true`

### Requirement: Platform application name reflects the corrected dual-bucket identity
The system SHALL set both the flat `name` and `_metadata.name` on a platform-bucket application to
the name its Core resource URL encodes, overriding a divergent `content.name`, when the resource
is read from DIAL Core — the one documented exception to `core-resource-entity-metadata`'s
"content is never mutated by the merge" requirement.

#### Scenario: A platform application's stale content name is corrected on read
- **WHEN** a platform-bucket application's content response carries a `name` that no longer
  matches the name encoded in its Core resource URL
- **THEN** the merged entity's flat `name` and `_metadata.name` both hold the URL-derived name
