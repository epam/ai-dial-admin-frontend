## Purpose

Selection-independent lazy loading for the shared content-page FileManager folder tree: caret and keyboard expansion reveal children while preserving the selected folder, reusing cached loads, and coordinating pending requests.

## ADDED Requirements

### Requirement: Content-page folder expansion loads children independently of selection

The shared content-page FileManager SHALL load the direct children of an uncached folder when it becomes expanded through its controlled tree-expansion callback. Caret clicks and keyboard expansion SHALL use the same callback. Expansion and collapse through that callback SHALL preserve the selected folder, grid's displayed folder, and navigation. Folder-name activation SHALL retain its existing selection behavior. This requirement applies to content-page FileManager consumers, not the separate FolderList surface.

Loading SHALL reuse the existing per-entity folder-context `fetchFiles(path)` operation and server-action contract, as exemplified by `prompts/actions.ts` `getPrompts` and `PromptFolderContext`; no admin-backend or deployment-manager-backend endpoint changes are required. Existing Core resource-listing contracts remain unchanged. No form fields or validation rules are introduced.

#### Scenario: Caret expands an unloaded subfolder
- **GIVEN** the public root lists a subfolder whose children have not been loaded
- **WHEN** the user clicks that subfolder's expand caret
- **THEN** the subfolder is expanded and its direct children are requested
- **AND** the returned nested folders appear beneath it without clicking its name
- **AND** selection, the displayed grid folder, and navigation remain unchanged

#### Scenario: Keyboard expansion loads children
- **GIVEN** an unloaded, collapsed folder row is focused
- **WHEN** the user presses the tree's expansion Arrow key
- **THEN** its direct children are requested and the folder expands without changing selection or navigation

#### Scenario: Collapse does not load or select
- **WHEN** an expanded folder is collapsed through the tree-expansion callback
- **THEN** its children are hidden without issuing a folder-load request or changing selection

#### Scenario: Folder-name activation keeps selection behavior
- **WHEN** the user activates a folder name
- **THEN** the existing folder-selection handler runs and the grid displays that folder's contents

### Requirement: Expansion reuses successful loads and coordinates pending requests

The FileManager SHALL reuse successfully cached folder contents, including an empty result and preloaded roots. It SHALL NOT issue a duplicate expansion request for a path whose expansion load is still pending. A failed request SHALL NOT count as successfully loaded; a later collapse and expansion after pending requests settle SHALL be able to retry. Loading SHALL preserve the latest requested expansion state.

#### Scenario: Cached folder is reopened
- **GIVEN** a folder's contents were loaded successfully
- **WHEN** the folder is collapsed and expanded again
- **THEN** the cached children are shown without another folder request

#### Scenario: Empty folder is cached
- **GIVEN** a folder load succeeded with no children
- **WHEN** another expansion request is made for that path
- **THEN** no additional request is issued solely because the cached result is empty

#### Scenario: Preloaded roots are reused
- **GIVEN** the initial root batch has successfully populated physical or synthetic file roots
- **WHEN** an already-loaded root is expanded
- **THEN** the tree uses the mounted cache without repeating the root request

#### Scenario: Reopening while pending does not duplicate a request
- **GIVEN** an expansion request for a folder is still pending
- **WHEN** the folder is collapsed and expanded again before that request settles
- **THEN** no second expansion request for the same folder is issued

#### Scenario: Collapse while loading is respected
- **GIVEN** an expanded folder's load is pending
- **WHEN** the user collapses the folder and its load subsequently succeeds
- **THEN** the loaded children are cached but the folder remains collapsed

#### Scenario: Failed expansion can be retried
- **GIVEN** a folder's expansion request failed without adding successful cached contents and pending requests have settled
- **WHEN** the user collapses and expands that folder again
- **THEN** the folder's children are requested again without changing selection

### Requirement: Expansion retains established request feedback

Expansion loading SHALL retain the folder context's existing loading and error behavior and the consumer listing's established request-error notification path. Successful expansion SHALL NOT produce a success toast, and the expansion callback SHALL NOT add a duplicate error notification.

#### Scenario: Expansion load fails
- **WHEN** an expansion load fails
- **THEN** the folder context follows its existing fetch-error behavior and the listing uses its existing request-error feedback
- **AND** the selected folder and navigation remain unchanged

#### Scenario: Expansion load succeeds
- **WHEN** an expansion load succeeds
- **THEN** the loaded children are visible if the folder remains expanded and no success toast is added
