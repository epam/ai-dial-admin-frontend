# platform-toolsets Specification (delta)

## MODIFIED Requirements

### Requirement: Platform toolset folderId identifies the platform bucket
The system SHALL identify a platform-bucket toolset's bucket explicitly on every shape that carries
one: listing rows carry `bucket: 'platform'` and no `folderId`, and a merged detail read carries
`'platform/'` as `_metadata.folderId` for write-path identity, matching what the write path sets on
create and update. No code path SHALL infer the bucket by applying a `platform/`-prefix check to a
`folderId`; the folderId-prefix check remains only as a path-level helper for the browsed current
path, not as a row or entity discriminator.

#### Scenario: A freshly-fetched platform toolset's bucket is identified explicitly
- **WHEN** the user opens a platform-bucket toolset that was not created or updated in the current
  session
- **THEN** the fetched resource identifies its bucket through its metadata shape, and every
  consumer answers "which bucket" from that explicit field — no `isPlatformBucketPath(asset.folderId)`
  check is performed on a freshly-fetched resource

#### Scenario: A platform listing row carries no folderId
- **WHEN** platform-bucket toolsets are listed into the folder tree
- **THEN** each row carries `bucket: 'platform'` and no `folderId`, and row-action handling (delete
  shaping, open-in-new-tab) selects the platform treatment from the row's bucket
