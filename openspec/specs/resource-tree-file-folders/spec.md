# resource-tree-file-folders Specification

## Purpose
Files folders on the folder trees of the toolsets, applications, skills, projects, conversations and prompts listings: which trees and paths merge them, folders only, the dedupe rule and failure isolation — created by archiving change `show-file-folders-in-resource-trees`.

## Requirements

### Requirement: Resource trees include Files folders
When a folder is loaded on the toolsets, applications, skills, projects, conversations or prompts listing, the tree SHALL contain the union of that resource type's folders and the Files folders at the same path, deduplicated by path. When both sources contain a folder, the resource type's own node SHALL be kept. The merged folders SHALL arrive in the same load as the type's own folders, so a folder that exists only in Files can be expanded and its children loaded like any other folder.

#### Scenario: Folder that exists only in Files
- **WHEN** `public/` is loaded on the prompts listing and Files has folder `public/Acme/` that prompts does not
- **THEN** `Acme` appears in the prompts folder tree next to the prompt folders

#### Scenario: Folder in both sources
- **WHEN** both prompts and Files contain `public/Shared/`
- **THEN** the tree shows `Shared` once, with the prompts node's fields

#### Scenario: Expanding a Files-only folder
- **GIVEN** `public/Acme/` appears in the prompts tree only because of Files
- **WHEN** the user expands it
- **THEN** the prompts listing for that path is requested and its nested folders merge with the Files folders at that path

#### Scenario: Folder with no items of the type
- **WHEN** the user opens a Files-only folder and the type's listing returns no rows
- **THEN** the folder is shown empty and is not reported as a load failure

### Requirement: Only Files folders are added
The Files read SHALL return folder nodes only. File items, including the `.dial_folder` marker, SHALL NOT appear in the tree or in the folder's cached items, and the item grid SHALL keep listing only the resource type's own items.

#### Scenario: Files rows are dropped
- **WHEN** the Files listing for a path contains folders, files and a `.dial_folder` marker
- **THEN** only the folders are added to the tree and no file row reaches the item grid

#### Scenario: Marker folder still appears
- **WHEN** a folder is present in Files only through its `.dial_folder` marker
- **THEN** the folder appears in the tree and the marker itself does not

### Requirement: Scope of the merge
The Files folders SHALL be merged only for the six listings above and only for paths under `public/`. The Files listing, the models, keys, roles, routes, interceptors, translators, catalog schemas and app runners trees SHALL load exactly as before. The Applications `platform` root and the synthetic config-file roots SHALL NOT trigger a Files read.

#### Scenario: Other trees are unchanged
- **WHEN** a folder is loaded on the models listing
- **THEN** no Files folder read is made

#### Scenario: Applications platform root
- **WHEN** the Applications listing loads its `platform` root
- **THEN** no Files folder read is made, and the `public` root is loaded with its Files folders merged

### Requirement: Files folder read failures are isolated
A rejected, forbidden or empty Files folder read SHALL add no folders and SHALL NOT change the outcome of the resource type's own listing. A failure of the type's own listing SHALL keep its existing fetch-error behavior regardless of the Files result.

#### Scenario: Files read fails
- **WHEN** the Files folder read fails while the type's listing succeeds
- **THEN** the tree shows the type's own folders and no error is reported

#### Scenario: Type listing fails
- **WHEN** the type's own listing fails
- **THEN** the folder context reports its usual fetch error, even if the Files read returned folders
