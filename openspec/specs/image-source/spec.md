# image-source Specification

## Purpose

Defines how the Image source section behaves in the Deployments / Images UI across all image types (`MCP`, `INTERCEPTOR`, `ADAPTER`, `APPLICATION`): when the source-type chooser is rendered, which fields (`DockerURI` vs `CodeURL` / `Branch` / `BaseDirectory`) appear for `DOCKER` vs `CODE` sources in the create modal and the Properties view, how switching source type produces a clean source object, how switching image type preserves source fields while aligning `transportType`, the suppression rules around `externalRegistryRef`, and the MCP-only scope of the `ImageTransport` control. Also captures the cleanup of the orphaned pre-refactor `ImageSourceFields/` directory.

## Requirements

### Requirement: Source-type chooser available for all image types

The Image source-type dropdown (`DialSelectField id="sourceType"`) SHALL be rendered for every `IMAGE_TYPE` value (`MCP`, `INTERCEPTOR`, `ADAPTER`, `APPLICATION`) in both the create-image modal and the Properties view, unless suppressed by the MCP Registry flow (described in capability `mcp-registry-images`). The dropdown SHALL offer the same two options for all image types: `IMAGE_SOURCE_TYPE.DOCKER` (label "Docker image") and `IMAGE_SOURCE_TYPE.CODE` (label "Source code").

#### Scenario: Adapter image in create modal
- **WHEN** the user opens the create-image modal and selects image type "Adapter"
- **THEN** a "Source type" dropdown SHALL be displayed with options "Docker image" and "Source code"
- **AND** "Docker image" SHALL be selected by default

#### Scenario: Application image in create modal
- **WHEN** the user opens the create-image modal and selects image type "Application"
- **THEN** a "Source type" dropdown SHALL be displayed with options "Docker image" and "Source code"

#### Scenario: Interceptor image in create modal
- **WHEN** the user opens the create-image modal and selects image type "Interceptor"
- **THEN** a "Source type" dropdown SHALL be displayed with options "Docker image" and "Source code"

#### Scenario: Adapter image Properties view
- **WHEN** the user opens the Properties tab of an existing Adapter image without `externalRegistryRef`
- **THEN** the "Source type" dropdown SHALL be displayed
- **AND** the dropdown value SHALL reflect the persisted `source.$type`

#### Scenario: Application image Properties view
- **WHEN** the user opens the Properties tab of an existing Application image without `externalRegistryRef`
- **THEN** the "Source type" dropdown SHALL be displayed

#### Scenario: Interceptor image Properties view
- **WHEN** the user opens the Properties tab of an existing Interceptor image without `externalRegistryRef`
- **THEN** the "Source type" dropdown SHALL be displayed

### Requirement: Docker source fields rendered when source.$type is DOCKER

When `image.source.$type === IMAGE_SOURCE_TYPE.DOCKER`, the `ImageSource` component SHALL render the `DockerURI` field and SHALL NOT render `CodeURL`, `Branch`, or `BaseDirectory`. This behavior SHALL apply uniformly to all image types.

#### Scenario: Docker URI shown for non-MCP image with Docker source
- **WHEN** an Adapter, Application, or Interceptor image has `source.$type === DOCKER`
- **THEN** the `DockerURI` input SHALL be rendered
- **AND** `CodeURL`, `Branch`, and `BaseDirectory` SHALL NOT be rendered

### Requirement: Code source fields rendered when source.$type is CODE

When `image.source.$type === IMAGE_SOURCE_TYPE.CODE`, the `ImageSource` component SHALL render:
- `CodeURL` (always)
- `Branch` (always, both modal and Properties view; includes SHA field)
- `BaseDirectory` (Properties view only — hidden in modal)

This behavior SHALL apply uniformly to all image types.

#### Scenario: Source code fields in Adapter modal
- **WHEN** the user picks "Source code" for an Adapter image in the create modal
- **THEN** `CodeURL` SHALL be rendered with the URL input labeled "Source URL"
- **AND** `Branch` and SHA inputs SHALL be rendered
- **AND** `BaseDirectory` SHALL NOT be rendered (modal layout)

#### Scenario: Source code fields in Application Properties view
- **WHEN** an Application image has `source.$type === CODE` and is viewed in the Properties tab
- **THEN** `CodeURL`, `Branch`, SHA, and `BaseDirectory` SHALL all be rendered

#### Scenario: Source code fields in Interceptor Properties view
- **WHEN** an Interceptor image has `source.$type === CODE` and is viewed in the Properties tab
- **THEN** `CodeURL`, `Branch`, SHA, and `BaseDirectory` SHALL all be rendered

### Requirement: Source-type switch produces a clean source object

When the user changes `source.$type` via the dropdown for any non-registry image, the resulting `image.source` object SHALL contain only the new `$type`, with all fields of the other source family dropped. The implementation SHALL build the new source without spreading the previous one.

#### Scenario: Docker → Source code drops imageUri
- **WHEN** the user switches an Adapter image's source type from "Docker image" to "Source code"
- **THEN** `image.source.imageUri` SHALL NOT be present in the resulting source
- **AND** `image.source.$type` SHALL equal `IMAGE_SOURCE_TYPE.CODE`

#### Scenario: Source code → Docker drops url, branchName, sha, baseDirectory
- **WHEN** the user switches an Adapter image's source type from "Source code" to "Docker image"
- **THEN** `image.source.url`, `branchName`, `sha`, and `baseDirectory` SHALL NOT be present in the resulting source
- **AND** `image.source.$type` SHALL equal `IMAGE_SOURCE_TYPE.DOCKER`

### Requirement: Image-type switch preserves source fields

When the user changes `image.$type` via the image-type dropdown in the create modal, the `source` object SHALL be preserved (no reset to a default). Specifically, `source.$type`, `url`, `imageUri`, `branchName`, `sha`, and `baseDirectory` SHALL be carried over to the updated image. `setTransport` SHALL continue to align `image.transportType` with the new image type (`IMAGE_TRANSPORT_TYPE.LOCAL` for MCP, deleted for non-MCP). `verifyVersion` SHALL be invoked with the updated image.

#### Scenario: Adapter → Interceptor preserves source code fields
- **GIVEN** an image with `$type: ADAPTER` and `source: { $type: CODE, url: 'https://github.com/x/y', branchName: 'main', sha: 'abc', baseDirectory: 'sub' }`
- **WHEN** the user switches image type to "Interceptor"
- **THEN** the resulting image SHALL have `$type: INTERCEPTOR`
- **AND** `source.$type` SHALL remain `CODE`
- **AND** `source.url`, `source.branchName`, `source.sha`, `source.baseDirectory` SHALL be unchanged

#### Scenario: Adapter → Application preserves docker source
- **GIVEN** an image with `$type: ADAPTER` and `source: { $type: DOCKER, imageUri: 'registry.example.com/img:tag' }`
- **WHEN** the user switches image type to "Application"
- **THEN** the resulting image SHALL have `$type: APPLICATION`
- **AND** `source.$type` SHALL remain `DOCKER`
- **AND** `source.imageUri` SHALL be unchanged

#### Scenario: Application → MCP sets LOCAL transport
- **GIVEN** an image with `$type: APPLICATION` and `source: { $type: CODE, url: 'https://...' }` and no `transportType`
- **WHEN** the user switches image type to "MCP"
- **THEN** the resulting image SHALL have `$type: MCP`
- **AND** `source.$type` and `source.url` SHALL be preserved
- **AND** `transportType` SHALL be set to `IMAGE_TRANSPORT_TYPE.LOCAL`

#### Scenario: MCP → Adapter deletes transportType
- **GIVEN** an image with `$type: MCP` and `transportType: IMAGE_TRANSPORT_TYPE.LOCAL`
- **WHEN** the user switches image type to "Adapter"
- **THEN** the resulting image SHALL have `$type: ADAPTER`
- **AND** `transportType` SHALL be absent from the resulting image

### Requirement: Image-type dropdown suppressed when externalRegistryRef is set

The image-type `DialSelectField` SHALL NOT be rendered when `image.source.externalRegistryRef` is present, because non-MCP image types cannot reference the MCP Registry and the user must not be allowed to change image type while the ref exists. Combined with the existing constraint that `externalRegistryRef` is only set inside the MCP Registry flow, this ensures the image-type change UI cannot strand a non-MCP image with a registry ref attached.

#### Scenario: Dropdown hidden for MCP image with registry ref
- **WHEN** an image has `source.externalRegistryRef` set
- **THEN** the image-type dropdown SHALL NOT be rendered in the modal

#### Scenario: Dropdown visible for MCP image without registry ref
- **WHEN** an MCP image has no `externalRegistryRef`
- **THEN** the image-type dropdown SHALL be rendered in the modal

### Requirement: externalRegistryRef defensively dropped when leaving MCP

As a defensive guarantee against state introduced outside the UI (e.g., via the JSON editor or future code paths), when `onImageTypeChange` transitions `image.$type` from `IMAGE_TYPE.MCP` to any other type, the resulting `source.externalRegistryRef` SHALL be dropped. Non-MCP image types do not support the MCP Registry reference.

#### Scenario: Adapter → MCP does not synthesize a registry ref
- **GIVEN** an image with `$type: ADAPTER` and `source: { $type: DOCKER, imageUri: 'x' }`
- **WHEN** the user switches image type to "MCP"
- **THEN** the resulting `image.source.externalRegistryRef` SHALL remain undefined

### Requirement: ImageTransport stays MCP-only

The `ImageTransport` radio group SHALL remain hidden for image types other than `IMAGE_TYPE.MCP`, regardless of `source.$type`. Code-source builds for Adapter, Application, and Interceptor image types do not introduce a transport setting.

#### Scenario: Adapter with code source has no transport control
- **WHEN** the user views or creates an Adapter image with `source.$type === CODE`
- **THEN** the transport radio group SHALL NOT be rendered

#### Scenario: Application with docker source has no transport control
- **WHEN** the user views or creates an Application image with `source.$type === DOCKER`
- **THEN** the transport radio group SHALL NOT be rendered

#### Scenario: MCP image continues to show transport control
- **WHEN** the user views an MCP image
- **THEN** the transport radio group SHALL be rendered (existing behavior)

### Requirement: Orphaned ImageSourceFields directory removed

The pre-refactor copy at `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSourceFields/` (`BaseDirectory.tsx`, `Branch.tsx`, `CodeURL.tsx`, `DockerURI.tsx`, `SourceType.tsx`) SHALL be deleted. The canonical implementation lives at `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSource/` and is the only one imported by the application.

#### Scenario: Directory absent after change
- **WHEN** the change is applied
- **THEN** the path `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSourceFields/` SHALL not exist

#### Scenario: No references remain in source tree
- **WHEN** searching the `apps/ai-dial-admin/src` tree for the string `ImageSourceFields`
- **THEN** zero matches SHALL be returned
