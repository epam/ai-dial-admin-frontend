## Why

The design for the Image Fields layout has been updated. `ImageBuildPrivileges` should be grouped with the base components (name, description, etc.) instead of being in its own separate section. The divider should only separate the base components group from the source component section.

## What Changes

- Move `ImageBuildPrivileges` from its own divider-separated section into the same group as `ImageBase` (name, description, version, etc.)
- The divider now only separates the base group (ImageBase + ImageBuildPrivileges) from the source group (ImageSource + ImageTransport)
- Remove the extra divider that previously separated ImageBuildPrivileges from the rest

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- `apps/ai-dial-admin/src/components/Images/Fields/ImageFields.tsx` - layout restructuring
- `apps/ai-dial-admin/src/components/Images/Fields/tests/ImageFields.spec.tsx` - test updates to match new layout
