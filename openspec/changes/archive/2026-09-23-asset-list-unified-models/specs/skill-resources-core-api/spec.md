# skill-resources-core-api Specification (delta)

## MODIFIED Requirements

### Requirement: Skill folder metadata can be listed
The system SHALL provide a Skill Core API method that lists the direct children of a Skill folder
path (`GET /v2/metadata/skills/{bucket}/{path}`), mapping each returned item through the shared
asset row mapper into the unified asset row shape (`name`, `path`, `nodeType`, `author`,
`createdAt`, `updatedAt`, `bucket`, and the movable flavor's root-level `folderId`) the folder-tree
context consumes for every other asset type, with the skills-specific path parsing and the
FOLDER-row trailing-slash convention applied inside that shared mapper. Pagination SHALL follow
Core's continuation token through the shared paginated-list helper until the full folder has been
read.

#### Scenario: Listing returns metadata-only rows
- **WHEN** the list method is called for a folder path
- **THEN** it returns one row per child with `name`, `path`, `nodeType`, `author`, `createdAt`,
  `updatedAt`, `bucket`, and `folderId` populated from Core's response, and no other per-row Core
  request is made

#### Scenario: A folder child is distinguished from a skill child
- **WHEN** the listing response classifies a child as `FOLDER` versus `ITEM`
- **THEN** the mapped row's `nodeType` reflects that distinction, so the folder-tree context can
  decide whether the row is expandable

#### Scenario: A paginated folder is fully read
- **WHEN** Core's response for a folder includes a continuation token
- **THEN** the method continues requesting subsequent pages until no token is returned, and the
  combined result includes every child across all pages

#### Scenario: Skills rows are produced by the shared mapper
- **WHEN** the skills list maps Core's response
- **THEN** it runs through the same row mapper as every other asset type, and the hand-rolled
  per-type skills row mapping no longer exists
