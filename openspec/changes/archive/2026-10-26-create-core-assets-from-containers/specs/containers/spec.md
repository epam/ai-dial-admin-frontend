## MODIFIED Requirements

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
- **WHEN** the user views a RUNNING container of type ADAPTER, INTERCEPTOR, APPLICATION or MCP and the admin API is available
- **THEN** the page SHALL offer to create the linked admin-backend entity of that type (adapter, interceptor, application, toolset), validated against existing admin-backend entities of that type
- **THEN** the page SHALL also offer to create the Core asset for that container, per `container-core-assets`
- **WHEN** the admin API is unavailable
- **THEN** the page SHALL offer only the Core asset, per `container-core-assets`

#### Scenario: Tabs per type
- **WHEN** the user opens containers of different types
- **THEN** each SHALL show the same tab set it showed on its former per-type page (for example the MCP tools tab only for MCP)
