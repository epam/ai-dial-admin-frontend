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

### Requirement: Application container creation
The system SHALL allow creating an APPLICATION container from either an internal APPLICATION image or a direct docker image reference.

#### Scenario: User selects "From Internal Application Image"
- **WHEN** the user clicks "Create" on `/containers`, selects the type Application and selects "From Internal Application Image"
- **THEN** the system SHALL open the two-step internal-image creation wizard
- **THEN** the image picker SHALL show only images of type APPLICATION

#### Scenario: User selects "From Docker Image Reference"
- **WHEN** the user clicks "Create", selects the type Application and selects "From Docker Image Reference"
- **THEN** the system SHALL open the single-step creation form with a docker image reference input, environment variables, resources, and scaling fields
- **THEN** the form SHALL NOT render a transport field

#### Scenario: Successful submission
- **WHEN** the user submits a valid creation form (either path)
- **THEN** the system SHALL POST a container with `$type = application` and a source matching the selected path
- **THEN** on success the user SHALL be redirected to the new container's detail page at `/containers/[id]`

### Requirement: Shared deployment-images list renders application images
The existing `/deployment-images` list SHALL render APPLICATION images alongside MCP, Interceptor, and Adapter images without a separate route.

#### Scenario: Mixed image types
- **WHEN** the user opens `/deployment-images` and the API returns images of all supported types
- **THEN** images of type `APPLICATION` SHALL appear with the Type column label "Application image"
- **THEN** all other columns (name, status, transport, updated-at, etc.) SHALL render identically to Adapter images

