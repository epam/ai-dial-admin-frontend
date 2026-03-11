## ADDED Requirements

### Requirement: Container properties form includes topics field

The container properties form SHALL include a Topics field using the existing `TopicsControl` component. The field SHALL appear in the `ContainerBase` section, after the Description field and before the Maintainer field. The field SHALL be available for all container types (MCP, Interceptor, Adapter, Model Servings).

#### Scenario: User adds topics to a new container via create modal

- **WHEN** user opens the container create modal for any container type
- **THEN** the Topics field SHALL be displayed in the form
- **AND** the field SHALL use `Multiselect` with suggestions from the deployments `getTopics()` action (`src/app/actions/deployments.ts`)
- **AND** the user SHALL be able to select existing topics or create new ones

#### Scenario: User edits topics on an existing container

- **WHEN** user views an existing container's properties page
- **THEN** the Topics field SHALL display the container's current topics
- **AND** the user SHALL be able to add or remove topics
- **AND** changes SHALL be persisted when the container is saved via the update API

#### Scenario: Topics field respects container edit-disabled state

- **WHEN** a container is in a transitional status (pending, stopping)
- **THEN** the Topics field SHALL be disabled (read-only), consistent with other fields in `ContainerBase`

### Requirement: Container list grid includes topics column

The containers list grid SHALL include a Topics column for all container type pages (MCP Containers, Interceptor Containers, Adapter Containers, Model Servings).

#### Scenario: Topics column is available in container list

- **WHEN** user views any container list page
- **THEN** a "Topics" column SHALL be available in the column panel
- **AND** the column SHALL be visible by default (consistent with other deployment entities such as Images)
- **AND** the column SHALL display topic values as comma-separated text

#### Scenario: User enables topics column

- **WHEN** user enables the Topics column via the AG Grid column panel
- **THEN** the column SHALL display each container's topics
- **AND** the column SHALL support text filtering

### Requirement: Topics are persisted through container CRUD operations

The container create, update, and duplicate operations SHALL preserve the `topics` field.

#### Scenario: Topics saved on container creation

- **WHEN** user creates a new container with topics selected
- **THEN** the `topics` array SHALL be included in the create API request payload

#### Scenario: Topics preserved on container duplication

- **WHEN** user duplicates a container that has topics
- **THEN** the duplicated container SHALL retain the original container's topics
