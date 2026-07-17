## ADDED Requirements

### Requirement: Write operations resolve with normalized admin-format path fields

On a successful `put` (create or update) of a versioned asset resource, the client SHALL resolve with a response that includes the admin-format identity fields `path`, `folderId`, `name`, and `version`, derived from the resource path written to (via the shared version-path helper). This matches the field shape the merge readers already return, so post-write consumers (redirects, list refresh) receive a consistent object regardless of Core's raw response shape.

Existing Core-format fields on the response SHALL be preserved; the admin-format fields SHALL be added alongside them.

#### Scenario: Successful versioned write returns parsed path fields
- **WHEN** `put` succeeds for a resource written to `folder/Name__1.0`
- **THEN** the resolved response SHALL include `path`, `folderId=folder/`, `name=Name`, and `version=1.0`

#### Scenario: Unversioned write omits version
- **WHEN** `put` succeeds for a resource written to a path with no `__version` suffix
- **THEN** the resolved response SHALL include `path`, `folderId`, and `name`, with `version` undefined

#### Scenario: Failed write is unchanged
- **WHEN** `put` fails (non-success `ServerActionResponse`)
- **THEN** the response SHALL be returned unchanged, with no path fields added

#### Scenario: Unparseable path does not break the write
- **WHEN** `put` succeeds but the written path cannot be parsed into folder + name (e.g. a path with no `/` separator)
- **THEN** the successful response SHALL be returned unchanged rather than raising an error

### Requirement: Post-create redirect resolves to the created resource

After creating an asset resource through the create-asset flow, the application SHALL redirect to the created resource's detail route using the normalized `path` from the write response, without producing an invalid path containing `undefined` segments.

#### Scenario: Create Asset Toolset from an MCP container
- **WHEN** a user creates an Asset Toolset from an MCP container page and the write succeeds
- **THEN** the app SHALL navigate to `/assets-toolsets/<name>?path=<encoded resource path>`
- **AND** the target page SHALL load the created toolset instead of a 404
