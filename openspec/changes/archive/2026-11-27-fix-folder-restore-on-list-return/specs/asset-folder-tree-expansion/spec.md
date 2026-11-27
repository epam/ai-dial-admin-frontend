## ADDED Requirements

### Requirement: Content-page FileManager restores the selected nested folder on mount

When the shared content-page FileManager mounts and the folder context holds a selected folder below the root whose contents are not cached, it SHALL load that folder's whole chain of parents through the folder context's `fetchFolderHierarchy(path, true)` and expand it, instead of loading only the root folders. When the selection is empty, a root, or already cached, the FileManager SHALL keep its existing behavior of loading the roots only when the tree is empty. A folder context without `fetchFolderHierarchy` SHALL keep the root load. A failed restore SHALL use the context's existing fetch-error state.

The restore reuses the existing per-entity folder-context operations and server-action listing contracts; no admin-backend or deployment-manager-backend endpoint changes are required. No form fields or validation rules are introduced.

#### Scenario: Return to the list through the menu keeps the folder content
- **GIVEN** a folder `public/team/` is selected and an entity inside it is open on its details page
- **AND** the tree no longer holds that folder's contents
- **WHEN** the user opens the section from the menu or the first breadcrumb
- **THEN** the listing shows `public/team/` selected and expanded with its content visible
- **AND** its parent folders are expanded in the tree

#### Scenario: Cached selection is not reloaded
- **GIVEN** the selected folder's contents are already cached
- **WHEN** the listing mounts
- **THEN** no hierarchy request is issued and the tree is unchanged

#### Scenario: Root selection loads the roots
- **GIVEN** the selection is empty or a root folder
- **WHEN** the listing mounts with an empty tree
- **THEN** the root folders are loaded as before

#### Scenario: Context without hierarchy loading keeps the root load
- **GIVEN** the folder context offers no `fetchFolderHierarchy`
- **WHEN** the listing mounts with an uncached nested selection and an empty tree
- **THEN** the root folders are loaded as before

#### Scenario: Failed restore shows the fetch error
- **WHEN** a level of the selected folder's chain cannot be loaded
- **THEN** the context reports its fetch error and the tree stays as it was
