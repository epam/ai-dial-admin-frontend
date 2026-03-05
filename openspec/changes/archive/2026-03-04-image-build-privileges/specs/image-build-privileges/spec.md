## ADDED Requirements

### Requirement: Image model includes imageBuilder field
The `Image` interface SHALL include an optional `imageBuilder` field of type `IMAGE_BUILDER_TYPE` with possible values `buildkit_rootless` and `buildkit`.

#### Scenario: New image created with default builder
- **WHEN** a new image is created without specifying `imageBuilder`
- **THEN** the `imageBuilder` field SHALL default to `buildkit_rootless`

#### Scenario: Existing image without imageBuilder field
- **WHEN** an existing image is loaded that does not have an `imageBuilder` field
- **THEN** the UI SHALL treat it as `buildkit_rootless` (display "Rootless" as selected)

### Requirement: Build Privileges radio group in Properties view
The Image Properties view SHALL display a "Build privileges" section with a `DialRadioGroup` containing two options in column orientation.

#### Scenario: Radio group displays two options with captions
- **WHEN** the user views the Image Properties tab
- **THEN** a "Build privileges" radio group SHALL be displayed with:
  - Option "Rootless (recommended)" with caption "Builds the image without root privileges for improved security and reduced risk."
  - Option "Root" with caption "Builds the image with root privileges. Increasing security risks."

#### Scenario: Rootless selected by default
- **WHEN** the user views the Image Properties tab for a new image
- **THEN** the "Rootless (recommended)" option SHALL be selected by default

#### Scenario: User changes build privilege
- **WHEN** the user selects "Root" in the Build Privileges radio group
- **THEN** the `imageBuilder` field on the image SHALL be set to `buildkit`
- **AND** the change SHALL be reflected in the save payload

### Requirement: Properties view fields separated by dividers
The Image Properties view SHALL use `divide-y divide-primary` on the parent container to render horizontal dividers between three field groups:
1. Base fields (name, description, maintainer, topics)
2. Source and transport fields (source type, URL/URI, branch, base directory, transport type)
3. Build Privileges

#### Scenario: Dividers render between field groups
- **WHEN** the Image Properties tab is displayed
- **THEN** a divider SHALL appear between the base fields group and the source/transport fields group
- **AND** a divider SHALL appear between the source/transport fields group and the Build Privileges radio group

### Requirement: Build Privileges hidden in create modal
The Build Privileges radio group SHALL NOT be displayed in the create image modal.

#### Scenario: Create modal does not show Build Privileges
- **WHEN** the user opens the create image modal
- **THEN** the Build Privileges radio group SHALL NOT be visible

#### Scenario: Properties view shows Build Privileges
- **WHEN** the user views an image in the Properties tab (not modal)
- **THEN** the Build Privileges radio group SHALL be visible

### Requirement: ImageBuildPrivileges component unit tests
The `ImageBuildPrivileges` component SHALL have unit tests covering rendering and user interaction.

#### Scenario: Should render correctly
- **WHEN** the component is rendered with an image prop
- **THEN** the `DialRadioGroup` element SHALL be present in the document

#### Scenario: onChange called with correct value on user selection
- **WHEN** the user selects a radio option
- **THEN** `setImage` (provided as `vi.fn()`) SHALL be called with the image object containing the updated `imageBuilder` value

### Requirement: ImageFields component unit tests
The `ImageFields` component SHALL have unit tests covering rendering in both Properties view and modal modes.

#### Scenario: Should render correctly in Properties view
- **WHEN** `ImageFields` is rendered without `isModal`
- **THEN** the `ImageBuildPrivileges` component SHALL be present in the document

#### Scenario: Should not render ImageBuildPrivileges in modal
- **WHEN** `ImageFields` is rendered with `isModal={true}`
- **THEN** the `ImageBuildPrivileges` component SHALL NOT be present in the document

#### Scenario: Should render dividers between field groups
- **WHEN** `ImageFields` is rendered without `isModal`
- **THEN** the parent container SHALL have `divide-y` and `divide-primary` classes
