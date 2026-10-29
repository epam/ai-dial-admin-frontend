## ADDED Requirements

### Requirement: One Core client serves every complex resource group
The system SHALL provide a shared complex-resource Core client parameterised by resource group (`skills`,
`projects`) and manifest file name (`SKILL.md`, `PROJECT.md`). It SHALL implement, for any group, the whole-bundle
create (create-only, `If-None-Match: *`), delete (required etag, `If-Match`), single-resource metadata read
(item node plus recursive file listing), folder listing with continuation token, grouping-folder create and
delete, per-file upload/download/preview/delete, and raw manifest read. The Skill and Project clients SHALL only
bind their group's `v2/{group}` content and `v2/metadata/{group}` URL prefixes and manifest name, and SHALL NOT
re-implement these operations.

#### Scenario: The same operation targets each group's own routes
- **WHEN** the shared client creates a resource for the `skills` group and for the `projects` group
- **THEN** the requests go to `PUT /v2/skills/{bucket}/{path}` and `PUT /v2/projects/{bucket}/{path}`
  respectively, each with a single manifest part named after that group's manifest file and
  `If-None-Match: *`

#### Scenario: Deleting without an etag is rejected before any request
- **WHEN** a delete is requested for either group with an empty etag
- **THEN** the call rejects without sending a request

#### Scenario: File names are relative to the resource root
- **WHEN** the file listing of a resource is read
- **THEN** each returned name is the file's path relative to the resource root, decoded, with grouping-folder
  entries excluded

### Requirement: Manifest frontmatter helpers are shared
The system SHALL provide group-neutral helpers that parse a manifest into `name`, `description` and a markdown
body, and that rebuild a manifest from its last-read raw content plus staged `description` and `body`. The rebuild
SHALL preserve frontmatter keys other than `name` and `description`, SHALL serialise through a YAML serializer
(never string concatenation), and SHALL keep the body verbatim, ending it with a single newline. Text with no
valid frontmatter SHALL parse to an empty description with the whole text as the body. The existing Skill helper
exports SHALL keep their signatures and behaviour.

#### Scenario: Untouched frontmatter keys survive a rebuild
- **WHEN** a manifest with an extra `version` key is parsed and rebuilt with a changed description
- **THEN** the rebuilt manifest contains the new description and the original `version` key

#### Scenario: A description cannot break out of the frontmatter
- **WHEN** a description containing `---` and a newline is rebuilt into a manifest
- **THEN** parsing the result returns that exact description and an unchanged body

#### Scenario: Missing frontmatter parses as body only
- **WHEN** a manifest without a frontmatter fence is parsed
- **THEN** the description is empty and the body is the full text

### Requirement: Recursive folder walk and delete are group-aware
The system SHALL walk and delete a grouping folder for any complex resource group: collect every resource and
nested folder marker at any depth, delete resources first, then nested folder markers deepest-first, then the
target folder, stopping at the first failure. The walk SHALL treat each resource as an atomic leaf and never
descend into its files.

#### Scenario: Deleting a Projects folder removes its projects and nested folders
- **WHEN** a Projects grouping folder containing projects and nested folders is deleted
- **THEN** every project is deleted through the projects routes, then nested folder markers deepest-first, then
  the folder itself

#### Scenario: A failure stops the operation
- **WHEN** deleting a resource or a folder marker fails partway through
- **THEN** the operation reports that failure and issues no further deletes
