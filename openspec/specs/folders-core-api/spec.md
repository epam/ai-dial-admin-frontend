# folders-core-api Specification

## Purpose
Folder listing (cross-type merge), rules get/update (via Core publications create+approve), and folder delete/move (cross-type fan-out with unpublish-via-publication semantics) executed directly against DIAL Core, replacing the admin-BE proxy, while `FoldersStorage`/`RuleFolderContext`, routes, and the `folders-storage/actions.ts` signatures stay identical — created by archiving change `migrate-folders-to-core`. This is the capstone of the assets→Core migration: `FolderService` makes no direct Core calls of its own, instead fanning out to the five per-type Core clients and the Core publications client. Import-related folder actions (`createFolderWithFiles`, the three `previewXZip` actions) remain on the admin BE, deferred to the corresponding per-type fast-follows.

## Requirements

### Requirement: Folders served directly by DIAL Core via the per-type clients
The system SHALL route folder listing, rules get/update, delete (unpublish), and move to DIAL Core unconditionally, built on the five per-type Core clients and the Core publications client — there is no admin-BE fallback and no feature flag. The cutover SHALL NOT change `FoldersStorage`/`RuleFolderContext`, the folder routes, or the `folders-storage/actions.ts` signatures.

#### Scenario: Folder operations call Core
- **WHEN** any of `getFolders`, `getRules`, `updateRules`, `removeFolder`, `changeFolder` runs
- **THEN** it resolves entirely through DIAL Core (via the per-type clients and the Core publications client), not the admin BE

### Requirement: Folder listing merges all five resource types, one level at a time, and validates consistency
The system SHALL build a folder's listing by querying all five resource types (application-resource, toolset-resource, conversation, prompt, file) **non-recursively** (one level — direct FOLDER-type children only), merging their results into one tree, and SHALL reject the merge with an error if the types disagree on a folder's name, parent path, bucket, or path. This matches the admin BE's actual `getFolders` behavior (each per-type `ResourceService.getFolders` uses whatever `recursive` flag the caller's request carries, and the admin FE's own request never set one) — callers walk deeper by calling `getFolders` again with a child path, the same lazy per-segment pattern already used by `RuleFolderContext`. Folder listing is not, and was never, an eager deep-tree fetch.

#### Scenario: Folder listing reflects all types
- **WHEN** a folder contains resources of more than one type
- **THEN** the merged listing includes items from every type present

#### Scenario: Folder listing does not descend into nested subfolders
- **WHEN** `getFolders(path)` is called on a folder containing nested subfolders
- **THEN** the returned tree's items include only `path`'s direct FOLDER-type children — items nested inside those children are absent, requiring a separate `getFolders` call with the child's path to fetch

#### Scenario: Cross-type inconsistency is surfaced, not silently resolved
- **WHEN** two resource types report conflicting metadata for what should be the same folder
- **THEN** the listing fails with an error rather than picking one type's view silently

### Requirement: Folder rules are read and written via Core publications
The system SHALL read folder rules via a Core publication rule-list call and SHALL write folder rules by creating a publication targeting the folder's rules and immediately approving it, matching the admin BE's create-then-approve behavior.

#### Scenario: Reading rules
- **WHEN** `getRules(path)` is called
- **THEN** the rules are fetched via the Core publications rule-list operation

#### Scenario: Updating rules creates and approves a publication
- **WHEN** `updateRules(targetFolder, rules)` is called
- **THEN** a publication targeting those rules is created and then immediately approved, with no separate approval step exposed to the caller

### Requirement: Folder delete unpublishes across all resource types
The system SHALL delete a folder by gathering every resource URL under it (recursively, across all five types), creating and approving a DELETE-action publication for those URLs, and then best-effort deleting the folder from each type's own storage, swallowing per-type deletion errors during that best-effort cleanup step.

#### Scenario: Delete gathers resources recursively across types
- **WHEN** `removeFolder(path)` is called on a folder containing nested subfolders with resources of multiple types
- **THEN** every resource URL under that folder tree, across all types, is included in the unpublish operation

#### Scenario: Best-effort cleanup does not fail the overall delete
- **WHEN** a per-type storage delete fails during the post-unpublish cleanup step
- **THEN** the overall folder delete still reports success, matching current behavior

### Requirement: Folder move validates existence, copies rules, then moves each type sequentially
The system SHALL move a folder by first confirming it exists in every targeted resource type, then copying its rules to the destination path, then moving each type's resources one at a time — stopping at the first per-type failure without rolling back types already moved.

#### Scenario: Move validates existence before mutating anything
- **WHEN** a folder move targets a resource type where the folder does not exist
- **THEN** the move is rejected before any resource is moved in any type

#### Scenario: Rules are copied to the new path
- **WHEN** a folder move succeeds
- **THEN** the rules previously set on the old path are present on the new path

#### Scenario: A failure partway through leaves earlier types moved
- **WHEN** a folder move succeeds for some resource types and then fails for a later one
- **THEN** the earlier types' resources remain moved (no rollback), matching current behavior

### Requirement: Core publications client gains create and rule-list operations
The system SHALL add a `createPublication` operation (Core `POST /v1/ops/publication/create`) and a `ruleList` operation (Core `POST /v1/ops/publication/rule/list`) to the Core publications client, used by folder rules/delete and not exposed to any publication-authoring UI.

#### Scenario: Create is used only by folder flows
- **WHEN** `createPublication` is invoked
- **THEN** the caller is folder rules-update or folder-delete logic, not a publication-authoring UI action
