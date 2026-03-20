### Requirement: Adapter container creation from docker image reference
The system SHALL allow users to create Adapter containers from a direct docker image reference, in addition to the existing internal image path.

#### Scenario: User creates adapter container from docker image reference
- **WHEN** user navigates to Adapter Containers page and clicks "Create"
- **THEN** a dropdown SHALL appear with two options: "From Internal Adapter Image" and "From Docker Image Reference"

#### Scenario: User selects "From Docker Image Reference" for adapter
- **WHEN** user selects "From Docker Image Reference" from the adapter container create dropdown
- **THEN** the system SHALL open a single-step creation form with a docker image reference input field, environment variables, resources, and scaling configuration
- **THEN** the form SHALL NOT include a transport field

#### Scenario: User submits adapter container with docker image reference
- **WHEN** user fills in the docker image reference and submits the form
- **THEN** the system SHALL create a container with `source.$type = 'image_reference'` and `source.imageReference` set to the entered value
- **THEN** the system SHALL validate the docker image reference format before submission

### Requirement: Interceptor container creation from docker image reference
The system SHALL allow users to create Interceptor containers from a direct docker image reference, in addition to the existing internal image path.

#### Scenario: User creates interceptor container from docker image reference
- **WHEN** user navigates to Interceptor Containers page and clicks "Create"
- **THEN** a dropdown SHALL appear with two options: "From Internal Interceptor Image" and "From Docker Image Reference"

#### Scenario: User selects "From Docker Image Reference" for interceptor
- **WHEN** user selects "From Docker Image Reference" from the interceptor container create dropdown
- **THEN** the system SHALL open a single-step creation form with a docker image reference input field, environment variables, resources, and scaling configuration
- **THEN** the form SHALL NOT include a transport field

#### Scenario: User submits interceptor container with docker image reference
- **WHEN** user fills in the docker image reference and submits the form
- **THEN** the system SHALL create a container with `source.$type = 'image_reference'` and `source.imageReference` set to the entered value
- **THEN** the system SHALL validate the docker image reference format before submission

### Requirement: Adapter container detail page supports docker image reference containers
The system SHALL render adapter container detail pages for containers created from docker image references without requiring an internal image.

#### Scenario: User navigates to adapter container created from docker image reference
- **WHEN** user opens the detail page of an adapter container with `source.$type = 'image_reference'`
- **THEN** the system SHALL render the page without fetching an internal image
- **THEN** the image header section SHALL be hidden

#### Scenario: User navigates to adapter container created from internal image
- **WHEN** user opens the detail page of an adapter container with `source.$type = 'internal_image'`
- **THEN** the system SHALL fetch and display the internal image information as before

### Requirement: Interceptor container detail page supports docker image reference containers
The system SHALL render interceptor container detail pages for containers created from docker image references without requiring an internal image.

#### Scenario: User navigates to interceptor container created from docker image reference
- **WHEN** user opens the detail page of an interceptor container with `source.$type = 'image_reference'`
- **THEN** the system SHALL render the page without fetching an internal image
- **THEN** the image header section SHALL be hidden

#### Scenario: User navigates to interceptor container created from internal image
- **WHEN** user opens the detail page of an interceptor container with `source.$type = 'internal_image'`
- **THEN** the system SHALL fetch and display the internal image information as before

### Requirement: Docker image reference validation for adapter and interceptor
The system SHALL use the same docker image reference validation as MCP containers (existing `getDeploymentsURIError` function).

#### Scenario: Invalid docker image reference entered
- **WHEN** user enters an invalid docker image reference in the adapter or interceptor creation form
- **THEN** the system SHALL display a validation error matching the existing MCP validation behavior
