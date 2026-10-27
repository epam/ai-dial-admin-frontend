## RENAMED Requirements

- FROM: `### Requirement: A single skill's author, created/updated dates, and etag are read from a single parent-folder listing`
- TO: `### Requirement: A single skill's author, created/updated dates, and etag are read from its own metadata path`

## MODIFIED Requirements

### Requirement: A single skill's author, created/updated dates, and etag are read from its own metadata path
The system SHALL populate a single skill's `author`/`createdAt`/`updatedAt` — inside the skill
entity's `_metadata` object (see the `core-resource-entity-metadata` capability) — from one read of the
skill's own metadata path (`GET /v2/metadata/skills/{bucket}/{path}`, no trailing slash), which Core
answers with that skill as a single `ITEM` node (Core ≥ 0.48.0). The system SHALL NOT scan the skill's
parent folder listing for this purpose, because Core pages that listing over raw blobs (every file,
version and marker inside every skill) and a skill's row can therefore sit on any page, or be absent from
the first one, regardless of how few skills the folder holds. It SHALL NOT issue a separate `SKILL.md`
manifest fetch either. `etag` SHALL keep flowing as a separate value, outside `_metadata`.
`name`/`description`/`version` remain unpopulated by this method — they live only in `SKILL.md`'s
frontmatter, out of scope until in-browser `SKILL.md` editing is built. A response that is not an `ITEM`
(Core's empty `FOLDER` answer for an unknown path, or any older Core) SHALL be treated as not found.
A skill read costs exactly two Core requests: this metadata read, plus the files listing (see the
file-listing requirement above), independent of the parent folder's size.

#### Scenario: Author, dates, and etag come from the skill's own metadata read
- **WHEN** a single skill is read
- **THEN** its `_metadata.author`, `_metadata.createdAt`, and `_metadata.updatedAt` are populated from
  the `ITEM` Core returns for the skill's own metadata path, with no parent-folder listing read and no
  separate manifest fetch, and the etag is returned as a separate value outside `_metadata`

#### Scenario: A skill in a folder larger than one listing page opens
- **WHEN** a skill lives in a parent folder whose Core listing spans more than one page and the skill's
  row is not on the first page
- **THEN** the read still succeeds with the skill's `author`, dates, and etag populated, because the
  parent folder's listing is never read

#### Scenario: A skill that does not exist is reported not found
- **WHEN** Core answers the skill's own metadata path with a 404, or with a node that is not an `ITEM`
- **THEN** the read reports the skill as not found, rather than returning a partial result with the
  missing fields left undefined
