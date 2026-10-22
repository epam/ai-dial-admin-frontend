## MODIFIED Requirements

### Requirement: Display stopped container name in entity edit view
The `Containers` component in non-modal (edit view) mode SHALL display the linked container's display name in the `InputPopup` input regardless of the container's status, as long as the entity has a valid `source.containerId` that matches a container returned by the API.

#### Scenario: Entity linked to a stopped container
- **WHEN** the entity has `source.containerId` set and the referenced container has status other than `running`
- **THEN** the `InputPopup` input SHALL display the container's `displayName`

#### Scenario: Entity linked to a running container
- **WHEN** the entity has `source.containerId` set and the referenced container has status `running`
- **THEN** behavior is unchanged — the input displays the container's `displayName`

#### Scenario: Entity linked to a container not returned by API
- **WHEN** the entity has `source.containerId` set but no container with that ID is returned by the API
- **THEN** the input SHALL show the empty state ("No Containers") as before
