## Purpose
Define the Application Containers capability: a deployment container type backed by an internal application image or a direct docker image reference, with a dedicated list page, detail page, creation flows, navigation entry, and integration into the shared deployment-images list.

## Requirements

### Requirement: Application container type
The system SHALL recognize `application` as a deployment container type, mirroring the existing Adapter type.

#### Scenario: Containers API returns $type=application
- **WHEN** the containers API returns an entry with `$type: "application"`
- **THEN** the UI SHALL treat it as a container of type `CONTAINER_TYPE.APPLICATION` for filtering, routing, and rendering

### Requirement: Application image type
The system SHALL recognize `application` as an image-definition type, mirroring the existing Adapter type.

#### Scenario: Images API returns $type=application
- **WHEN** the images API returns an entry with `$type: "application"`
- **THEN** the UI SHALL treat it as an image of type `IMAGE_TYPE.APPLICATION`
- **THEN** the shared `/deployment-images` Type column SHALL render the label "Application image"

### Requirement: Application Containers list page
The system SHALL expose a dedicated list page at `/application-containers` showing only containers of type APPLICATION.

#### Scenario: User opens /application-containers
- **WHEN** the user navigates to `/application-containers`
- **THEN** the page SHALL fetch all containers and render only those with `$type = application`
- **THEN** the list SHALL use the same column definitions (`CONTAINERS_COLUMNS`) as Adapter Containers
- **THEN** the page header SHALL show a "Create" dropdown with two options: "From Internal Application Image" and "From Docker Image Reference"

#### Scenario: No application containers exist
- **WHEN** the user navigates to `/application-containers` and no APPLICATION containers exist
- **THEN** the page SHALL render the empty state identical in layout to the Adapter Containers empty state

### Requirement: Application Container detail page
The system SHALL expose a detail page at `/application-containers/[id]` for viewing and editing a single APPLICATION container.

#### Scenario: Container with internal image source
- **WHEN** the user navigates to `/application-containers/[id]` for a container whose `source.$type = internal_image`
- **THEN** the page SHALL fetch the referenced image and pass it to `ContainerView`

#### Scenario: Container with docker image reference source
- **WHEN** the user navigates to `/application-containers/[id]` for a container whose `source.$type = image_reference`
- **THEN** the page SHALL render `ContainerView` without fetching an internal image
- **THEN** the image header section SHALL be hidden

#### Scenario: Rename validation
- **WHEN** the user renames an application container
- **THEN** the form SHALL reject names that collide with any other existing application container

#### Scenario: No companion entity
- **WHEN** the user views or edits an application container
- **THEN** the detail page SHALL NOT display a picker or prompt to create a linked `DialApplication` entity

### Requirement: Application container creation
The system SHALL allow creating an APPLICATION container from either an internal APPLICATION image or a direct docker image reference.

#### Scenario: User selects "From Internal Application Image"
- **WHEN** the user clicks "Create" on `/application-containers` and selects "From Internal Application Image"
- **THEN** the system SHALL open the two-step internal-image creation wizard
- **THEN** the image picker SHALL show only images of type APPLICATION

#### Scenario: User selects "From Docker Image Reference"
- **WHEN** the user clicks "Create" and selects "From Docker Image Reference"
- **THEN** the system SHALL open the single-step creation form with a docker image reference input, environment variables, resources, and scaling fields
- **THEN** the form SHALL NOT render a transport field

#### Scenario: Successful submission
- **WHEN** the user submits a valid creation form (either path)
- **THEN** the system SHALL POST a container with `$type = application` and a source matching the selected path
- **THEN** on success the user SHALL be redirected to the new container's detail page at `/application-containers/[id]`

### Requirement: Navigation entry
The system SHALL surface a navigation item for Application Containers in the Deployments menu group.

#### Scenario: Deployments enabled
- **WHEN** the user opens the menu and `deploymentsEnabled` is true
- **THEN** the Deployments group SHALL include "Application Containers" positioned immediately after "Adapter Containers"

#### Scenario: Deployments disabled
- **WHEN** `deploymentsEnabled` is false
- **THEN** the entire Deployments group, including "Application Containers", SHALL be hidden

### Requirement: Shared deployment-images list renders application images
The existing `/deployment-images` list SHALL render APPLICATION images alongside MCP, Interceptor, and Adapter images without a separate route.

#### Scenario: Mixed image types
- **WHEN** the user opens `/deployment-images` and the API returns images of all supported types
- **THEN** images of type `APPLICATION` SHALL appear with the Type column label "Application image"
- **THEN** all other columns (name, status, transport, updated-at, etc.) SHALL render identically to Adapter images
