## ADDED Requirements

### Requirement: Assets > Models menu entry
The system SHALL add a `Models` menu item as the first entry in the Assets section of the admin menu, linking to a new `/assets-models` route.

#### Scenario: Models is the first Assets entry
- **WHEN** the Assets section of the menu renders
- **THEN** `Models` is its first item, appearing before Apps/Toolsets/Conversations/Prompts/Files

### Requirement: Model asset list view is flat
The system SHALL render the model asset list as a single, non-nested list of entries under the `platform` root, with no folder-create, rename-folder, or move-into-folder controls in the list toolbar or row actions — unlike the Apps asset list, which supports arbitrary nested folders.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens the `/assets-models` list
- **THEN** all model resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder action is present
- **WHEN** a user opens the model asset list toolbar
- **THEN** there is no create-folder action, unlike the Apps asset list toolbar

### Requirement: Model asset detail view has only Properties and Features tabs
The system SHALL render a model asset's detail view with exactly two tabs, `Properties` and `Features`, and SHALL NOT include Roles, Interceptors, Audit, Tools, or Dependencies tabs — matching what `Entities > Models` supports today.

#### Scenario: Detail view renders exactly two tabs
- **WHEN** a user opens a model asset's detail view
- **THEN** the tab list contains exactly `Properties` and `Features`, in that order

### Requirement: Model asset Features tab mirrors the Models-entity feature set, not the Applications-entity set
The system SHALL render the model asset Features tab with a dedicated component whose switch groups match the Models-entity feature set: sampling/output control, tools/function calling, prompt/message composition, attachments, caching, session access (without `consent_required`), and feedback. It SHALL NOT reuse `Assets/Resources/ResourceFeatures`, whose switch groups mirror the Applications-entity feature set (session access with `consent_required`, no caching group) and whose app-runner-scheme-inherited-readonly logic does not apply to models.

#### Scenario: Caching group is present
- **WHEN** a user opens a model asset's Features tab
- **THEN** a caching group with `cache_supported` and `auto_caching_supported` switches is shown

#### Scenario: consent_required is absent
- **WHEN** a user opens a model asset's Features tab
- **THEN** the session-access group does not include a `consent_required` switch, unlike the Apps asset Features tab

#### Scenario: Text features match the Apps asset Features tab
- **WHEN** a user opens a model asset's Features tab
- **THEN** the same four text-endpoint fields (`rate_endpoint`, `tokenize_endpoint`, `truncate_prompt_endpoint`, `configuration_endpoint`) are shown, unchanged from the Apps asset Features tab
