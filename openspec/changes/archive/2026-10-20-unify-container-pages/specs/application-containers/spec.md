## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Application Containers list page
**Reason**: Superseded by the unified container pages.
**Migration**: See the `containers` capability; `/application-containers` and `/application-containers/[id]` redirect to `/containers` and `/containers/[id]`.

### Requirement: Application Container detail page
**Reason**: Superseded by the unified container pages.
**Migration**: See the `containers` capability; `/application-containers` and `/application-containers/[id]` redirect to `/containers` and `/containers/[id]`.

### Requirement: Navigation entry
**Reason**: Superseded by the unified container pages.
**Migration**: See the `containers` capability; `/application-containers` and `/application-containers/[id]` redirect to `/containers` and `/containers/[id]`.
