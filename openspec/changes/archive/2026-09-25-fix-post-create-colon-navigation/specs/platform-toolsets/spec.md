## MODIFIED Requirements

### Requirement: Creating a platform toolset has no version field
The system SHALL NOT display or require a version field on any create form whose destination is
the `platform` bucket — the list-page create form while browsing the `platform` bucket in the
Toolsets view, and the container-seeded create-asset modal opened from an MCP container detail
view with the `platform` folder selected — since the bucket has no versioning concept. Creating
into the `public` bucket is unaffected and keeps requiring a version. A create submitted with the
`platform` bucket as its destination SHALL write the flat, unversioned `platform/{name}` resource
through the platform-bucket create action, and the resulting toolset SHALL open from the
post-create navigation and from the Assets Toolsets grid's platform bucket without a 404.

#### Scenario: No version field when creating into the platform bucket
- **WHEN** the user opens the create form while browsing the `platform` bucket in the Toolsets view
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the public bucket
- **WHEN** the user opens the create form while browsing the `public` bucket in the Toolsets view
- **THEN** the version field is shown and required, unchanged from current behavior

#### Scenario: The container-seeded create modal hides the version field for a platform destination
- **WHEN** the user opens the create-asset-toolset modal from an MCP container detail view and
  selects the `platform` folder
- **THEN** no version field is shown, the form can be submitted without one, and no version suffix
  is written into the created resource's path

#### Scenario: The container-seeded create modal keeps the version field for a public destination
- **WHEN** the user opens the create-asset-toolset modal from an MCP container detail view and
  selects a `public` folder
- **THEN** the version field is shown and required, and the created resource keeps its
  `{folderId}{name}__{version}` path, unchanged from current behavior

#### Scenario: A platform-bucket toolset created from a container opens without a 404
- **WHEN** a user creates a toolset from an MCP container detail view with the `platform` folder
  selected
- **THEN** the post-create navigation opens the new toolset's platform-bucket detail view, and
  clicking the toolset's row in the Assets Toolsets grid's `platform` bucket opens the same detail
  view — neither resolves to a 404 page

#### Scenario: A colon-named platform toolset opens through an encoded detail route
- **WHEN** a user creates a platform-bucket toolset with `:` in its name from either create entry point
- **THEN** the post-create redirect opens its detail view with `:` URL-encoded in the `[id]` segment and no `path` query parameter
