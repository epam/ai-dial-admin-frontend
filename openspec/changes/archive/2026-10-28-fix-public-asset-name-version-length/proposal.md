## Why

Issue #5279 reports that Admin creates public applications/toolsets whose `name__version` exceeds Core's deployment identifier limit, causing chat requests to fail. The issue's development-team clarification requires strictly fewer than 256 characters (maximum 255), independently of the existing 900 UTF-8 byte storage-path limit.

## What Changes

- Enforce a maximum of 255 characters for the assembled `name__version` leaf in the shared public-asset destination validator.
- Show a localized Version-field error and block submission when the combined limit is exceeded; revalidate when either name or version changes.
- Keep the independent 900-byte absolute-storage-path validation and server-side create-action rejection before any resource PUT.
- Add boundary, field-feedback, and server-action regression tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-asset-versions`: Add the combined name/version character limit to new public application/toolset identity validation.

## Impact

The shared `getAssetDestinationError` in `src/utils/validation/asset-version.ts`, validation constants, and error i18n keys/messages change. Existing `AssetVersion`, application creation, duplication, publication editing, and application/toolset server-create callers inherit the same check without separate validation implementations. Existing valid identities and ordinary details saves remain unchanged. No API shape changes or new dependencies.

## Non-goals

- Changing platform-bucket identity, image semver validation, or prompts/conversations.
- Renaming or migrating existing oversized assets or adding validation to untouched legacy details saves.
- Changing import/move behavior or the 900-byte storage-path constraint.
- Browser automation: the user selected tests only and declined the optional browser-verification task.
