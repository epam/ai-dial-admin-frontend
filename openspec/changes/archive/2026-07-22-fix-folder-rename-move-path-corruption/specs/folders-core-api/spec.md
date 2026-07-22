## MODIFIED Requirements

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
