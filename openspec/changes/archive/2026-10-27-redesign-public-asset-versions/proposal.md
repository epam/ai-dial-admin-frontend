## Why

Public-bucket asset applications and toolsets are independent Core resources identified by complete paths, but Admin groups same-name resources into semantic-version families and exposes sibling-version actions. This prevents arbitrary version labels and makes individual-resource operations ambiguous; `display_version` is also coupled to the path version instead of independently editable content on existing entities.

## What Changes

- **BREAKING UI behavior:** show each stored application/toolset version as a separate row, with a plain-text Version column and path-based selection. Move, export, delete, previews, and folder pickers no longer group or expand sibling versions; detail-page moves/deletes target only the opened resource.
- Keep the existing `{folderId}{name}__{version}` storage convention, path-derived version metadata, and existing asset URLs. No resource migration or Core version API is introduced.
- Accept non-semver text versions on create, duplicate, and publication review. Require a nonblank value, reject `__` and a leading `_`, apply Core-compatible path restrictions, and reject duplicate complete destinations on create/duplicate rather than duplicate names alone.
- Create/duplicate and publication version edits synchronize `display_version` under the hood and show no separate display-version input. Duplication has only the new-entity flow: no New Version mode or inferred semantic-version increment.
- Existing asset details show Version as read-only `LabelledText`, remove version selection and Save as new version, and add an independent optional Display version input below Display name. Ordinary saves preserve that value without modifying the path version.
- Import keeps incoming path versions read-only; import/export preserve independent display-version content and existing document formats.
- Update the affected specs and add regression coverage for public assets, publications, and unchanged neighboring surfaces. Deliver all changes together in **one PR**.

## Capabilities

### New Capabilities

- `public-asset-versions`: per-path public application/toolset identity, independent rows/actions, text-version validation, create/duplicate synchronization, and read-only detail versions with independent display-version editing.

### Modified Capabilities

- `asset-list-rows`: public application/toolset rows and action previews remain separate by full path rather than same-name/version-family aggregation.
- `assets-application-creation`: guided public creation accepts text versions, validates complete destination uniqueness, and synchronizes display version without a second input.
- `application-resources-core-api`: create/update preserve the distinction between path version and display-version content; single-entity move/delete and import/export retain complete identities.
- `toolset-resources-core-api`: the equivalent toolset contract, including direct path-based detail reads and unchanged authentication/discovery behavior.
- `core-asset-client`: retain consolidated last-`__` parsing and round-trip non-semver path versions independently of `display_version`.
- `publications-core-api`: retain editable publication versions, synchronize display-version content, validate text versions, and preserve review-path relocation and existing target-conflict semantics.

## Impact

Shared `Assets/BaseAssetList`, `Assets/Modals`, `Assets/ExportAssets`, `Common/FilePath`, entity import/export previews, `EntityHeaderControls`, and delete confirmation currently encode grouped-version behavior. Application/toolset views, create actions, duplicate flows, publication properties, and resource payload builders need coordinated changes. Shared semver helpers and image/deployment version controls must remain available for their unaffected callers.

Core already accepts non-semver resource names and independent `display_version` strings. The inspected contracts are `ResourceDescriptorFactory`/`ResourceController` for paths and `Deployment`/`Application`/`ToolSet` for content in the sibling `ai-dial-core` repository. PR #4627 supplies the existing path-based, one-resource-per-row precedent, but its versionless parsing changes must not be applied to these assets.

## Non-goals

- No Core changes, data migration, new delimiter/escaping scheme, resource renames, or export-format redesign.
- No removal of path versions from applications/toolsets and no change to prompt/conversation versionless handling.
- No change to platform-bucket identity/creation UI, image/container semantic versioning, catalog entity display versions, or other unrelated asset capabilities.
- No multi-PR rollout. Automated browser verification was offered and declined; unit/component tests and the final quality gates remain required.
