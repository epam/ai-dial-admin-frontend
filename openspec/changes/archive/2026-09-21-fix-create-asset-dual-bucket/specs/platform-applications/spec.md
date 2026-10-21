## MODIFIED Requirements

### Requirement: Creating a platform application has no version field
The system SHALL NOT display or require a version field on any create form whose destination is
the `platform` bucket — the list-page create form while browsing the `platform` bucket, and the
runner-seeded create modal opened from an app-runner detail view with the `platform` folder
selected — since the bucket has no versioning concept. Creating into the `public` bucket is
unaffected and keeps requiring a version. A create submitted with the `platform` bucket as its
destination SHALL write the flat, unversioned `platform/{name}` resource through the
platform-bucket create action, and the resulting application SHALL open from the post-create
navigation and from the Assets Applications grid's platform bucket without a 404.

#### Scenario: No version field when creating into the platform bucket
- **WHEN** the user opens the create form while browsing the `platform` bucket
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the public bucket
- **WHEN** the user opens the create form while browsing the `public` bucket
- **THEN** the version field is shown and required, unchanged from current behavior

#### Scenario: The runner-seeded create modal hides the version field for a platform destination
- **WHEN** the user opens the create-assets-application modal from an app-runner detail view and
  selects the `platform` folder
- **THEN** no version field is shown, the form can be submitted without one, and no version suffix
  is written into the created resource's path

#### Scenario: The runner-seeded create modal keeps the version field for a public destination
- **WHEN** the user opens the create-assets-application modal from an app-runner detail view and
  selects a `public` folder
- **THEN** the version field is shown and required, and the created resource keeps its
  `{folderId}{name}__{version}` path, unchanged from current behavior

#### Scenario: A platform-bucket application created from a runner opens without a 404
- **WHEN** a user creates an application from an app-runner detail view with the `platform`
  folder selected
- **THEN** the post-create navigation opens the new application's platform-bucket detail view, and
  clicking the application's row in the Assets Applications grid's `platform` bucket opens the
  same detail view — neither resolves to a 404 page
