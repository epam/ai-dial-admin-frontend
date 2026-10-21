# platform-keys — `_metadata` write-strip delta

## MODIFIED Requirements

### Requirement: Payload sanitization on write
On every PUT (create or update), the system SHALL strip the merge layer's `_metadata` object —
which holds the read-only and derived fields `status`, `validationWarnings`, `path`, `folderId`,
`author`, `createdAt`, `updatedAt` (see the `core-resource-entity-metadata` capability) — from the
payload, and SHALL keep the existing `name`/`description` junk-field handling unchanged, since the
generic create form seeds those fields although `Key.class` declares neither.

#### Scenario: Read-only fields stripped
- **WHEN** the system sends a PUT for a key whose fetched entity carries `_metadata`
- **THEN** the payload does not contain `_metadata`, and none of `status`, `validationWarnings`,
  `path`, `folderId`, `author`, `createdAt`, or `updatedAt` appears as a flat field on the payload
