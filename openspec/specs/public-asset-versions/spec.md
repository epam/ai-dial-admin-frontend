# public-asset-versions Specification

## Purpose

Independent path-addressed public application and toolset assets with text path versions, exact-path list actions, synchronized creation/publication display versions, and independently editable display-version content on existing details.

## Requirements

### Requirement: Public asset identity retains a text path version

Public-bucket asset applications and toolsets SHALL retain the existing `{folderId}{name}__{version}` identity and URL format. Their Version SHALL be parsed from that stored path, independently of content `display_version`. Existing resources SHALL remain addressable without migration, including older semver labels and resources with an absent suffix.

#### Scenario: A text version remains part of identity
- **WHEN** an application or toolset is stored at `public/team/assistant__release candidate`
- **THEN** its name is `assistant`, its Version is `release candidate`, and reads/actions address that complete path
- **AND** content `display_version` does not alter the parsed Version

#### Scenario: Existing resources are not renamed
- **WHEN** an existing public application/toolset is listed, opened, or saved without changing its identity
- **THEN** its stored path and parsed version remain unchanged without a resource migration

### Requirement: Each public asset path is an independently selectable entity

Lists, export/delete previews, and folder-picker asset grids SHALL preserve separate application/toolset rows for every complete path. Version SHALL use a plain text column, with the usual sorting/filtering and accessible truncation, not a single- or multiversion picker. Selection identity and preview path mappings SHALL use complete paths, never folder-plus-name alone. The system SHALL NOT infer a latest semantic version.

#### Scenario: Same-name versions remain separate rows
- **WHEN** a folder contains `assistant__stable` and `assistant__release candidate`
- **THEN** both resources appear as separate rows with their own plain-text Version values
- **AND** selecting either does not select or replace the other

#### Scenario: Same-name delete-preview entries remain distinct
- **WHEN** both same-name resources are selected for deletion
- **THEN** the preview contains both entries and maps each entry back to its own original path

### Requirement: Asset actions never implicitly expand sibling versions

Move, export, and delete SHALL act only on explicitly selected complete resource paths, or on descendants of explicitly selected folders according to existing folder recursion. Existing detail-page move/delete SHALL target only the opened resource. No version-selection or All versions affordance SHALL appear in these flows. Existing conflict handling, progress, success/error notifications, and technical-folder-marker exclusions SHALL remain intact.

#### Scenario: Moving one version does not move its sibling
- **WHEN** an administrator moves only `public/a/assistant__stable` to `public/b/` from the list or details
- **THEN** only that resource moves with its versioned leaf preserved
- **AND** `public/a/assistant__preview` remains at its original path

#### Scenario: Exporting or deleting one version does not affect its sibling
- **WHEN** an administrator exports or deletes only `assistant__stable`
- **THEN** only the selected resource is exported or deleted, and no sibling-version selector is displayed

#### Scenario: Folder selection retains recursive semantics
- **WHEN** an administrator selects a folder for an operation
- **THEN** the existing recursive descendant behavior is retained without collapsing same-name versions inside that folder

### Requirement: Newly entered versions accept text with unambiguous valid paths

Create, duplicate, and edited publication Version inputs SHALL accept non-semver text. Newly entered versions MUST be nonblank, MUST NOT start with `_`, and MUST NOT contain `__`, `/`, `{`, `}`, `"`, or U+0000–U+001F. Their assembled destination path MUST NOT contain a component ending in a dot or exceed Core's 900 UTF-8 byte absolute-storage-path limit including the bucket/type prefix and parent folders. URI-reserved text SHALL be segment-encoded at the request boundary; nonblank labels SHALL NOT be silently rewritten. Invalid inputs SHALL show localized field feedback and block submission. These new-entry rules SHALL NOT make an untouched legacy identity block an ordinary details save.

#### Scenario: A non-semver text version is accepted
- **WHEN** an administrator enters `release candidate` as Version for a valid, available destination
- **THEN** semver validation does not block submission and the encoded request preserves that label

#### Scenario: The delimiter cannot be entered as a version
- **WHEN** an administrator types or pastes `release__candidate` or `_preview` into Version
- **THEN** the field reports the reserved delimiter and submission is blocked

#### Scenario: Blank and path-invalid versions are rejected
- **WHEN** an entered Version is whitespace-only, contains a forbidden decoded character, or makes the stored leaf end in `.`
- **THEN** localized validation feedback is displayed and submission is blocked

#### Scenario: Server-side creation validation preserves specific localized reasons
- **WHEN** application or toolset creation reaches the server action with a blank, ambiguous, path-invalid, or oversized version
- **THEN** the action returns `{ success: false, errorHeader, errorMessage }` with a localized validation header and the specific localized validation reason
- **AND** no resource PUT is sent to Core

#### Scenario: Total path length is measured in UTF-8 bytes
- **WHEN** a version makes the assembled absolute storage path exceed 900 UTF-8 bytes
- **THEN** submission is blocked even when the version's character count alone is below 900

### Requirement: Creation and duplication synchronize display version and enforce path uniqueness

Create/duplicate SHALL expose one editable Version input and no separate Display version input. Both Version changes and submission SHALL set content `display_version` to the submitted path version. Uniqueness SHALL be checked against the destination folder/name/version tuple, rechecked after changing any member, and enforced by Core's existing create precondition against races. Same-name/different-version resources SHALL be permitted. Duplication SHALL use the new-entity flow only, seed the source's parsed version rather than infer a next semver, and permit editing its name, folder, and Version.

#### Scenario: Same name with a new version can be created
- **WHEN** `public/team/assistant__stable` exists and an administrator creates `assistant` with Version `preview` in the same folder
- **THEN** name-only uniqueness does not block creation
- **AND** the submitted `display_version` is `preview`

#### Scenario: A duplicate destination is rejected
- **WHEN** creation or duplication targets an existing complete path
- **THEN** submission is blocked by destination-conflict feedback, or a racing Core conflict shows the existing error notification and retains the draft

#### Scenario: A folder change rechecks uniqueness
- **WHEN** an available name/version pair is changed to a destination folder containing that same pair
- **THEN** the new complete destination is rejected rather than reusing the previous folder's validation result

#### Scenario: Duplication has no version-family mode
- **WHEN** an administrator opens Duplicate for a public application/toolset
- **THEN** name, folder, and Version can be edited and no New Version mode or automatic semver increment is offered
- **AND** submitting without editing the seeded Version still synchronizes `display_version` to that Version

### Requirement: Existing details separate immutable version from editable display version

Existing public application/toolset details SHALL show Version as read-only `LabelledText` as the first item of the properties metadata row, before Maintainer. Version SHALL NOT appear in the top entity/action header and SHALL follow the visibility of the other metadata when JSON editing is enabled. They SHALL NOT expose a sibling version selector, create-version entry point, or Save as new version button. An optional Display version string input SHALL appear immediately below Display name and permit independent editing or clearing without semver/path validation. Ordinary saves, including JSON-editor content saves, SHALL preserve the original path version and the independently entered display version. Read-only administrators SHALL not be able to edit Display version.

#### Scenario: Details show both values with distinct editability
- **WHEN** an entity has path Version `stable` and content `display_version` of `Spring release`
- **THEN** the properties metadata row shows read-only Version `stable` first, before Maintainer, and the properties form shows editable Display version `Spring release` below Display name
- **AND** no sibling selector or Save as new version action appears

#### Scenario: Editing display version does not change identity
- **WHEN** an administrator changes Display version to `Summer release` and saves
- **THEN** the entity remains at the same complete path, Version remains `stable`, and content stores `Summer release`

#### Scenario: Display version can be cleared
- **WHEN** an administrator clears Display version and saves
- **THEN** the value remains empty after reload rather than being reset to the path version

#### Scenario: JSON content editing cannot change path version
- **WHEN** an ordinary detail save includes edited content or a draft version field
- **THEN** the save uses the original identity's version and does not create or target a different versioned resource

### Requirement: Import preserves path version and independent display-version content

Public application/toolset import SHALL keep Version as plain read-only preview text, preserve it when an incoming name/folder is changed, and retain `display_version` content independently. It SHALL NOT offer a version picker or editable version cell. Existing aggregate JSON/zip formats and conflict strategies SHALL remain unchanged.

#### Scenario: Import preview cannot edit version
- **WHEN** an imported application/toolset id ends with `assistant__release candidate`
- **THEN** the preview shows Version `release candidate` without an editable cell or picker

#### Scenario: Renaming an import preserves both versions
- **WHEN** an incoming resource with path Version `stable` and display version `Spring release` is renamed to resolve a conflict
- **THEN** the new destination retains suffix `__stable` and the content retains `display_version` of `Spring release`

### Requirement: Neighboring version behaviors remain unchanged

Platform-bucket identity/creation UI, prompts/conversations, image/deployment semver controls, and unrelated catalog display-version controls SHALL retain their existing behavior. Publication version editing SHALL follow `publications-core-api`, not the immutable ordinary-details rule.

#### Scenario: Platform resources remain unversioned
- **WHEN** an application/toolset is created or opened in the platform bucket
- **THEN** its identity remains flat without a version suffix or new public-only version controls

#### Scenario: Image semver validation is retained
- **WHEN** an image/deployment flow validates a semantic version
- **THEN** the asset text-version relaxation does not disable that validation
