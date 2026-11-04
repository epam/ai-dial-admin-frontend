## MODIFIED Requirements

### Requirement: Folder listing merges all five resource types, one level at a time, and validates consistency
The system SHALL build a folder's listing by querying the five resource types (application-resource, toolset-resource, conversation, prompt, file) and the Skill and Project resource types **non-recursively** (one level — direct FOLDER-type children only), merging their results into one tree, and SHALL reject the merge with an error if the types disagree on a folder's name, parent path, bucket, or path. Skill and Project SHALL contribute folder rows only: the skills and projects themselves SHALL NOT appear in the listing. A Skill or Project listing that fails or is absent SHALL contribute nothing and SHALL NOT fail the listing. This matches the admin BE's actual `getFolders` behavior (each per-type `ResourceService.getFolders` uses whatever `recursive` flag the caller's request carries, and the admin FE's own request never set one) — callers walk deeper by calling `getFolders` again with a child path, the same lazy per-segment pattern already used by `RuleFolderContext`. Folder listing is not, and was never, an eager deep-tree fetch.

#### Scenario: Folder listing reflects all types
- **WHEN** a folder contains resources of more than one type
- **THEN** the merged listing includes items from every type present

#### Scenario: Skill and Project folders appear
- **WHEN** a folder contains a subfolder that exists only for Skills or only for Projects
- **THEN** the merged listing includes that subfolder

#### Scenario: Skills and projects themselves are omitted
- **WHEN** a folder directly contains skills or projects
- **THEN** the merged listing includes no entry for them, only for their grouping folders

#### Scenario: Unavailable Skill or Project listing does not break the tree
- **WHEN** the Skill or Project listing for a path fails
- **THEN** the listing still returns the folders from the other types

#### Scenario: Folder listing does not descend into nested subfolders
- **WHEN** `getFolders(path)` is called on a folder containing nested subfolders
- **THEN** the returned tree's items include only `path`'s direct FOLDER-type children — items nested inside those children are absent, requiring a separate `getFolders` call with the child's path to fetch

#### Scenario: Cross-type inconsistency is surfaced, not silently resolved
- **WHEN** two resource types report conflicting metadata for what should be the same folder
- **THEN** the listing fails with an error rather than picking one type's view silently

#### Scenario: Rules of a Skill or Project folder are managed like any other
- **WHEN** a folder that exists only for Skills or Projects is selected in Folders Storage
- **THEN** its rules are read and saved through the same `getRules` and `updateRules` calls
