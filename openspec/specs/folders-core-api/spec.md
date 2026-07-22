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

### Requirement: Folder delete unpublishes only the targeted resource type
The system SHALL delete a folder for a single caller-specified resource type by gathering every resource URL under it for that type only (recursively), creating and approving a DELETE-action publication for those URLs, and then best-effort deleting the folder from that type's own storage, swallowing errors during that best-effort cleanup step. The folder is left untouched for every other resource type.

#### Scenario: Delete gathers resources recursively for the targeted type only
- **WHEN** `removeFolder(path, resourceType)` is called on a folder containing nested subfolders with resources of multiple types
- **THEN** every resource URL under that folder tree for `resourceType` is included in the unpublish operation, and resources of other types are left untouched

#### Scenario: Best-effort cleanup does not fail the overall delete
- **WHEN** a per-type storage delete fails during the post-unpublish cleanup step
- **THEN** the overall folder delete still reports success, matching current behavior

### Requirement: Folder move validates existence, copies rules, then moves each type sequentially
The system SHALL move a folder by first confirming it exists in every targeted resource type, then copying its rules to the destination path, then moving each type's resources one at a time — stopping at the first per-type failure without rolling back types already moved. For each resource found under the folder being moved (including the hidden `.dial_folder` marker resource representing an otherwise-empty folder), the system SHALL compute the resource's destination path by replacing only the `oldPath` folder prefix — matched as a full path-segment sequence, independent of whether `oldPath`/`newPath` carry a trailing slash — with `newPath`, preserving the remainder of the resource's path unchanged and joined with exactly one `/` separator. If a resource's path does not actually begin with `oldPath` as a segment-aligned prefix, the system SHALL fail that move rather than silently leaving the resource at its original path or writing it to a guessed location.

#### Scenario: Move validates existence before mutating anything
- **WHEN** a folder move targets a resource type where the folder does not exist
- **THEN** the move is rejected before any resource is moved in any type

#### Scenario: Rules are copied to the new path
- **WHEN** a folder move succeeds
- **THEN** the rules previously set on the old path are present on the new path

#### Scenario: A failure partway through leaves earlier types moved
- **WHEN** a folder move succeeds for some resource types and then fails for a later one
- **THEN** the earlier types' resources remain moved (no rollback), matching current behavior

#### Scenario: Renaming a folder preserves its contents' names and location in the tree
- **WHEN** a folder containing resources is renamed (`oldPath` and `newPath` differ only in their final segment)
- **THEN** every contained resource ends up at `newPath` plus its original relative path beneath the folder, with no part of the old or new folder name glued onto the resource's own name

#### Scenario: Trailing-slash mismatch between oldPath and newPath does not corrupt destination paths
- **WHEN** `changeFolderCore` is called with an `oldPath` or `newPath` that omits the trailing slash a folder path would normally carry
- **THEN** each descendant's destination path is still computed as a correct, segment-aligned rewrite with exactly one `/` between the new folder path and the descendant's remaining relative path

#### Scenario: Moving a folder preserves it as a folder at the destination
- **WHEN** a folder (including one represented only by its `.dial_folder` marker resource) is moved to a new parent folder
- **THEN** the marker resource's destination path is `<newParentPath>/<folderName>/.dial_folder`, so the destination is recognized as a folder rather than a file with a `.dial_folder` suffix

#### Scenario: A descendant path that isn't actually under oldPath fails the move
- **WHEN** a gathered resource's path does not begin with `oldPath` as a segment-aligned prefix
- **THEN** the move fails for that resource instead of leaving it unmoved at its original path or writing it to an unrelated location

### Requirement: Core publications client gains create and rule-list operations
The system SHALL add a `createPublication` operation (Core `POST /v1/ops/publication/create`) and a `ruleList` operation (Core `POST /v1/ops/publication/rule/list`) to the Core publications client, used by folder rules/delete and not exposed to any publication-authoring UI.

#### Scenario: Create is used only by folder flows
- **WHEN** `createPublication` is invoked
- **THEN** the caller is folder rules-update or folder-delete logic, not a publication-authoring UI action
