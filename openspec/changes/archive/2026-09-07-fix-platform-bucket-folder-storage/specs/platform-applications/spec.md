## ADDED Requirements

### Requirement: Platform application folderId identifies the platform bucket
The system SHALL return `'platform/'` as `folderId` when reading a platform-bucket application from
DIAL Core, matching the value the write path already sets on create and update, so that any check of
`isPlatformBucketPath(asset.folderId)` correctly identifies a platform-bucket application on a
freshly-fetched resource, not only on one just created or updated in the current session.

#### Scenario: A freshly-fetched platform application's folderId identifies its bucket
- **WHEN** the user opens a platform-bucket application that was not created or updated in the current
  session
- **THEN** the fetched resource's `folderId` is `'platform/'`, and `isPlatformBucketPath` on that value
  returns `true`

### Requirement: Platform application header shows the platform bucket with no link
The system SHALL show `platform` as the value of the header's Folder Storage field for a
platform-bucket application, without the open-in-new-tab link shown for a `public`-bucket folder
path, since the platform bucket has no folder location to link to.

#### Scenario: Header Folder Storage names the platform bucket
- **WHEN** the user views a platform-bucket application's detail header
- **THEN** the Folder Storage field shows `platform`, with no open-in-new-tab affordance

#### Scenario: Public-bucket header Folder Storage is unaffected
- **WHEN** the user views a public-bucket application's detail header
- **THEN** the Folder Storage field shows the folder path with its existing open-in-new-tab link,
  unchanged from current behavior
