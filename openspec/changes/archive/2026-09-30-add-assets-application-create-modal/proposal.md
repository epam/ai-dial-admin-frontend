## Why

Assets Applications currently use the generic, single-screen creation form, which mixes required identity fields with source-specific configuration. Administrators need a guided creation flow that establishes resource identity first and then configures the appropriate source, including interface-based applications.

## What Changes

- Replace Assets Applications creation with a dedicated two-step `CreateApplication` modal, following the existing `CreateKeyModal` step-flow pattern.
- Keep the existing identity-field behavior in the first step for id, display name, version, and description; source configuration moves to the second step.
- Add an Interfaces source as the first, default source mode and render the existing asset interface editor when it is selected.
- Keep Endpoints and App Runner sources available, and retain Code App when its editor URL is configured.
- Constrain the second-step popup content to a maximum height of 540px.
- Add component coverage for the two-step flow, source ordering/default, and source-specific rendering.

## Non-goals

- Change the existing application save/update source editor.
- Change Core resource contracts or create new source serialization formats.
- Remove Code App from existing asset application editing or creation when it is configured.

## Capabilities

### New Capabilities

- `assets-application-creation`: Guided two-step creation of Assets Applications and its source-mode behavior.

### Modified Capabilities

- `application-source`: Asset application source selection gains Interfaces as the default source mode while retaining the supported existing modes.

## Impact

- Affected UI: Assets Applications list creation entry point, generic entity creation integration, asset source selector, and asset interface editor composition.
- Affected client models: `DialApplicationResource` drafts retain their existing Core-compatible field casing and create action behavior.
- No backend API, dependency, or route contract changes are expected.
