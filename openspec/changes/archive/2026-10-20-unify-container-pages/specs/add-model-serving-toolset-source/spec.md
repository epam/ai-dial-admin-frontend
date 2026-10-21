## MODIFIED Requirements

### Requirement: Toolset container list scoped per option
The system SHALL fetch both MCP and inference containers for the toolset flow via a dedicated action (`?type=MCP,INFERENCE`) and SHALL filter the list client-side by the selected option: the **MCP Container** option SHALL show only MCP containers; the **Model Serving** option SHALL show only inference containers whose `inferenceTask` is `text_classification`. The system SHALL NOT change `getMCPContainers` or its non-toolset call sites.

#### Scenario: MCP Container option lists only MCP containers
- **WHEN** the user has the MCP Container option selected
- **THEN** only containers of type MCP appear in the picker

#### Scenario: Model Serving option lists only text-classification inference containers
- **WHEN** the user has the Model Serving option selected
- **THEN** only inference containers with `inferenceTask = text_classification` appear — text-generation and none containers are excluded

#### Scenario: MCP-only call sites unaffected
- **WHEN** the export-config flow or the MCP-typed container fetch is used
- **THEN** they still receive MCP containers only (`?type=MCP`)

### Requirement: Type-aware navigation for a container-source toolset
The system SHALL resolve the "Go to container" navigation for a toolset's container source from the referenced container's real type, not from the toolset view. An MCP source SHALL link to the unified container detail route; a Model Serving (inference) source SHALL link to the Model Servings detail route.

#### Scenario: Open an MCP-sourced toolset's container
- **WHEN** a toolset's source container is an MCP container and the user clicks "Go to container"
- **THEN** the system opens `/containers/[id]`

#### Scenario: Open a Model-Serving-sourced toolset's container
- **WHEN** a toolset's source container is a text-classification Model Serving container and the user clicks "Go to container"
- **THEN** the system opens `/model-servings/[id]`

#### Scenario: Detail-page banner finds a Model Serving source
- **WHEN** a toolset whose source is a non-running Model Serving container is opened
- **THEN** the container-status banner is shown (the toolset flow fetches inference containers, so the source is found)
