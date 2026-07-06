### Requirement: Model Serving as a toolset container source option
The system SHALL offer two container-source options when creating a toolset: **MCP Container** and **Model Serving**. Both SHALL persist as a container source (`source.$type = CONTAINER`); they SHALL differ only in the container list they present. The Model Serving option SHALL be a frontend-only selector value and SHALL NOT introduce a new backend source type.

#### Scenario: Both container options offered
- **WHEN** a user creates a toolset from the Toolsets list and opens the source-type selector
- **THEN** both "MCP Container" and "Model Serving" options are available (alongside External Endpoint and MCP Registry)

#### Scenario: Model Serving selection persists as a container source
- **WHEN** the user picks the Model Serving option and selects a container
- **THEN** the saved toolset source has `$type = CONTAINER` and the chosen `containerId`

#### Scenario: Container-source options gated by deployments feature
- **WHEN** the deployments feature is disabled
- **THEN** both the MCP Container and Model Serving options are disabled, consistent with the existing container option gating

### Requirement: Toolset container list scoped per option
The system SHALL fetch both MCP and inference containers for the toolset flow via a dedicated action (`?type=MCP,INFERENCE`) and SHALL filter the list client-side by the selected option: the **MCP Container** option SHALL show only MCP containers; the **Model Serving** option SHALL show only inference containers whose `inferenceTask` is `text_classification`. The system SHALL NOT change `getMCPContainers` or its non-toolset call sites.

#### Scenario: MCP Container option lists only MCP containers
- **WHEN** the user has the MCP Container option selected
- **THEN** only containers of type MCP appear in the picker

#### Scenario: Model Serving option lists only text-classification inference containers
- **WHEN** the user has the Model Serving option selected
- **THEN** only inference containers with `inferenceTask = text_classification` appear — text-generation, none, and NIM containers are excluded

#### Scenario: MCP-only call sites unaffected
- **WHEN** the export-config flow or the mcp-containers page fetches containers
- **THEN** they still receive MCP containers only (`?type=MCP`)

### Requirement: Type-aware navigation for a container-source toolset
The system SHALL resolve the "Go to container" navigation for a toolset's container source from the referenced container's real type, not from the toolset view. An MCP source SHALL link to the MCP container detail route; a Model Serving (inference) source SHALL link to the Model Servings detail route.

#### Scenario: Open an MCP-sourced toolset's container
- **WHEN** a toolset's source container is an MCP container and the user clicks "Go to container"
- **THEN** the system opens `/mcp-containers/[id]`

#### Scenario: Open a Model-Serving-sourced toolset's container
- **WHEN** a toolset's source container is a text-classification Model Serving container and the user clicks "Go to container"
- **THEN** the system opens `/model-servings/[id]`

#### Scenario: Detail-page banner finds a Model Serving source
- **WHEN** a toolset whose source is a non-running Model Serving container is opened
- **THEN** the container-status banner is shown (the toolset flow fetches inference containers, so the source is found)
