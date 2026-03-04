## Why

Administrators need control over image build privileges to balance security and compatibility. Currently, there is no way to specify whether an image should be built with or without root privileges, forcing a one-size-fits-all approach that doesn't accommodate teams needing rootless builds for improved security or root builds for legacy workflows.

## What Changes

- Add a new `imageBuilder` field to the Image data model with values `buildkit_rootless` (default) and `buildkit`
- Add a "Build Privileges" radio group to the Image Properties view using `DialRadioGroup`, placed below existing fields and separated by a divider
- Create a new `ImageBuildPrivileges` field component in `Deployments/Fields/`
- Default new images to `buildkit_rootless` (Rootless) in the image template
- The build privileges field should **not** appear in the create image modal — only in the Properties view
- Display descriptive captions for each option explaining security implications

## Capabilities

### New Capabilities
- `image-build-privileges`: Adds a radio group to the Image Properties view allowing administrators to select between rootless (recommended, default) and root build modes via the `imageBuilder` field

### Modified Capabilities

## Impact

- **Data model**: New `imageBuilder` field on `Image` interface and related types/enums
- **UI components**: New `ImageBuildPrivileges` field component, updates to `ImageFields` and image template constant
- **API**: The `imageBuilder` field will be sent as part of image create/update payloads
- **i18n**: New translation keys for field title, option names, and captions
