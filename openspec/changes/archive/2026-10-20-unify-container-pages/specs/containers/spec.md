## Purpose

Define the unified Containers pages: one list and one detail page that serve adapter, application, interceptor and MCP containers, replacing four per-type page pairs while keeping each type's behavior and validation.

## ADDED Requirements

### Requirement: Unified Containers list page
The system SHALL expose one list page at `/containers` showing containers of type ADAPTER, APPLICATION, INTERCEPTOR and MCP. Containers of other types (inference) SHALL NOT appear.

#### Scenario: Mixed types listed
- **WHEN** the user opens `/containers` and the API returns containers of all four types plus inference containers
- **THEN** the list SHALL render the adapter, application, interceptor and MCP containers
- **THEN** the inference containers SHALL NOT be rendered

#### Scenario: Type column
- **WHEN** the list renders
- **THEN** it SHALL include a "Type" column showing a human-readable label for each container's type
- **THEN** all other columns of the existing container list SHALL remain available

#### Scenario: Empty state
- **WHEN** no container of the four types exists
- **THEN** the list SHALL render the existing empty state

#### Scenario: Row and name navigation
- **WHEN** the user clicks a container row or opens it in a new tab
- **THEN** the system SHALL navigate to `/containers/[id]`

### Requirement: Container list column display
The `/containers` list SHALL render every cell as human-readable text; no cell SHALL show `[object Object]` or a raw epoch/ISO timestamp.

#### Scenario: Source type column
- **WHEN** the list renders a container with an internal image, a docker image reference or an MCP registry source
- **THEN** the "Source type" cell SHALL show "Internal <Type> Image", "Docker Image Reference" or "MCP Registry" respectively
- **THEN** the "Source Name" cell SHALL show the image name, the image reference or the registry package (with version when present)

#### Scenario: Time columns
- **WHEN** the list renders a container with `createdAt` and `updatedAt` values
- **THEN** the "Creation time" and "Updated time" cells SHALL show the value formatted as a local date and time
- **THEN** a container without a value SHALL show an empty cell

#### Scenario: Persisted column state
- **WHEN** the user has previously reordered, hidden or resized columns on the list
- **THEN** the cells SHALL still render formatted text, not raw values

### Requirement: Unified Container detail page
The system SHALL expose one detail page at `/containers/[id]` for viewing and editing a container of any of the four types. The page SHALL render the same view, tabs and fields the per-type pages rendered before, selected by the container's `$type`.

#### Scenario: Container with internal image source
- **WHEN** the user opens `/containers/[id]` for a container whose `source.$type = internal_image`
- **THEN** the page SHALL fetch the referenced image and pass it to the view

#### Scenario: Container with docker image reference source
- **WHEN** the user opens `/containers/[id]` for a container whose `source.$type = image_reference`
- **THEN** the page SHALL render the view without fetching an internal image
- **THEN** the image header section SHALL be hidden

#### Scenario: Unknown or unsupported type
- **WHEN** the user opens `/containers/[id]` for a container whose `$type` is inference or unknown
- **THEN** the page SHALL render the not-found page

#### Scenario: Companion entity per type
- **WHEN** the user views a container of type ADAPTER, INTERCEPTOR or MCP
- **THEN** the page SHALL offer to create the linked entity of that type (adapter, interceptor, toolset) and SHALL validate the new entity's name against existing entities of that type
- **WHEN** the user views a container of type APPLICATION
- **THEN** the page SHALL NOT display a picker or prompt to create a linked `DialApplication` entity

#### Scenario: Tabs per type
- **WHEN** the user opens containers of different types
- **THEN** each SHALL show the same tab set it showed on its former per-type page (for example the MCP tools tab only for MCP)

### Requirement: Container name validation
A container name SHALL be unique across all deployment containers of every type, because the backend identifies a container by one id shared by all types. Creating or duplicating a container SHALL reject any name already used by a container of any type. Renaming on the detail page SHALL keep rejecting names that collide with another container of the same type.

#### Scenario: Create collides with a container of another type
- **WHEN** the user creates an adapter container named like an existing MCP container
- **THEN** the create form SHALL reject the name

#### Scenario: Duplicate collides with a container of another type
- **WHEN** the user duplicates a container under the name of an existing container of a different type
- **THEN** the duplicate form SHALL reject the name

#### Scenario: Rename collides within the same type
- **WHEN** the user renames an adapter container on its detail page to the name of another adapter container
- **THEN** the form SHALL reject the name

### Requirement: Container creation with type selector
The create modal on `/containers` SHALL include a type selector offering Adapter, Application, Interceptor and MCP. The source options offered afterwards SHALL be those of the selected type.

#### Scenario: Type selector shown
- **WHEN** the user clicks "Create" on `/containers`
- **THEN** the modal SHALL present a required type selector listing the four types

#### Scenario: Source options follow the type
- **WHEN** the user selects the type MCP
- **THEN** the source options SHALL be "From Internal MCP Image", "From Docker Image Reference" and, when the MCP registry feature is enabled, "From MCP Registry"
- **WHEN** the user selects the type Adapter, Application or Interceptor
- **THEN** the source options SHALL be "From Internal <Type> Image" and "From Docker Image Reference"

#### Scenario: Image picker follows the type
- **WHEN** the user chooses an internal-image source for a type
- **THEN** the image picker SHALL show only images of that type

#### Scenario: Successful creation
- **WHEN** the user submits a valid form
- **THEN** the system SHALL POST a container with `$type` equal to the selected type
- **THEN** on success the user SHALL be redirected to `/containers/[id]`

#### Scenario: Read-only admin
- **WHEN** the current user is a read-only admin
- **THEN** the "Create" control SHALL NOT be rendered

### Requirement: Legacy container URLs redirect
The system SHALL permanently redirect the legacy per-type container URLs to the unified routes, preserving the language prefix and any trailing path segments.

#### Scenario: List URLs
- **WHEN** the user requests `/{lang}/adapter-containers`, `/{lang}/application-containers`, `/{lang}/interceptor-containers` or `/{lang}/mcp-containers`
- **THEN** the system SHALL redirect to `/{lang}/containers`

#### Scenario: Detail URLs
- **WHEN** the user requests `/{lang}/<legacy-segment>/{id}`
- **THEN** the system SHALL redirect to `/{lang}/containers/{id}`

#### Scenario: Audit detail URLs
- **WHEN** the user requests `/{lang}/<legacy-segment>/{id}/{activityId}`
- **THEN** the system SHALL redirect to `/{lang}/containers/{id}/{activityId}`

#### Scenario: Older deployment URLs
- **WHEN** the user requests `/{lang}/mcp-deployments[/{id}]` or `/{lang}/interceptor-deployments[/{id}]`
- **THEN** the system SHALL redirect directly to the matching `/containers` URL

### Requirement: Single Containers menu entry
The Deployments menu group SHALL contain one "Containers" entry linking to `/containers` in place of the four per-type container entries. The entry SHALL be hidden together with the group when `deploymentsEnabled` is false.

#### Scenario: Deployments enabled
- **WHEN** the user opens the menu and `deploymentsEnabled` is true
- **THEN** the Deployments group SHALL include one "Containers" entry
- **THEN** it SHALL NOT include "MCP Containers", "Interceptor Containers", "Adapter Containers" or "Application Containers"

#### Scenario: Deployments disabled
- **WHEN** `deploymentsEnabled` is false
- **THEN** the Deployments group, including "Containers", SHALL be hidden

#### Scenario: Active state
- **WHEN** the user is on `/containers` or `/containers/[id]`
- **THEN** the "Containers" entry SHALL be shown as active

### Requirement: Contextual documentation link per container type
The header help button SHALL open the documentation of the container's type on `/containers/[id]` (MCP, adapter, application or interceptor documentation). On `/containers` (the mixed-type list) the help button SHALL NOT be shown, because no single documentation page covers all types.

#### Scenario: Detail page of an adapter container
- **WHEN** the user opens `/containers/[id]` for an adapter container and uses the help button
- **THEN** the system SHALL open the adapter containers documentation (configuration section)

#### Scenario: Containers list
- **WHEN** the user opens `/containers`
- **THEN** the help button SHALL NOT be rendered

#### Scenario: Leaving the detail page
- **WHEN** the user navigates from a container detail page to the list or another page
- **THEN** the help button SHALL stop using the container type and resolve documentation from the URL
