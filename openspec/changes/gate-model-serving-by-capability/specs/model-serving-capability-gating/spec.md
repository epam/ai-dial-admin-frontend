## ADDED Requirements

### Requirement: Container model carries the backend inference capability

The `Container` model SHALL expose an optional `inferenceTask` field typed as an `INFERENCE_TASK` enum with values `TEXT_GENERATION`, `TEXT_CLASSIFICATION`, and `NONE`, mapping the read-only field returned by the deployment-manager backend for inference deployments.

The field SHALL be optional: it is present only on containers of type inference (`$type: "inference"`) and absent on all other types (NIM, MCP, adapter, interceptor, application).

#### Scenario: Inference container exposes a capability value

- **WHEN** the frontend receives an inference container (`$type: "inference"`) from `GET /deployments`
- **THEN** the container's `inferenceTask` holds one of `TEXT_GENERATION`, `TEXT_CLASSIFICATION`, or `NONE`

#### Scenario: Non-inference container omits the field

- **WHEN** the frontend receives a NIM container (`$type: "nim"`)
- **THEN** the container's `inferenceTask` is `undefined`

### Requirement: Model-Serving source picker filters incompatible containers

The Models create flow SHALL exclude from the Model-Serving container picker any container whose `inferenceTask` is an explicit `NONE` or `TEXT_CLASSIFICATION`, in addition to the existing "running status" filter. Containers without an `inferenceTask` value (e.g. NIM) SHALL remain selectable as today.

#### Scenario: Text-generation container is selectable

- **WHEN** a user opens the Model-Serving source picker while creating a model
- **AND** a running container has `inferenceTask = TEXT_GENERATION`
- **THEN** that container appears in the picker

#### Scenario: Incompatible containers are hidden

- **WHEN** a user opens the Model-Serving source picker while creating a model
- **AND** a running container has `inferenceTask = NONE` or `inferenceTask = TEXT_CLASSIFICATION`
- **THEN** that container does not appear in the picker

#### Scenario: NIM container is unaffected

- **WHEN** a user opens the Model-Serving source picker while creating a model
- **AND** a running container has no `inferenceTask` value
- **THEN** that container appears in the picker, unchanged from current behavior

### Requirement: Container detail page create action branches by capability

On the Model-Serving container detail page (`/model-servings/[id]`), the "Create" action SHALL be determined by the container's `inferenceTask`:

- `TEXT_GENERATION` SHALL offer "Create model", invoking the existing model creation with the chat-completions endpoint template.
- `TEXT_CLASSIFICATION` SHALL offer "Create toolset", invoking toolset creation.
- `NONE` SHALL show no create action.
- A container without an `inferenceTask` value SHALL retain current behavior (offer "Create model").

The create action SHALL continue to require the container be in the running state, as today.

#### Scenario: Text-generation container offers model creation

- **WHEN** a user opens a running container with `inferenceTask = TEXT_GENERATION`
- **THEN** the page shows a "Create model" action that opens the model create modal

#### Scenario: Text-classification container offers toolset creation

- **WHEN** a user opens a running container with `inferenceTask = TEXT_CLASSIFICATION`
- **THEN** the page shows a "Create toolset" action that opens the toolset create modal

#### Scenario: Incompatible container offers no creation

- **WHEN** a user opens a running container with `inferenceTask = NONE`
- **THEN** the page shows no create action

### Requirement: Toolset created from a classification container uses a fixed MCP template

When creating a toolset from a `TEXT_CLASSIFICATION` Model-Serving container, the frontend SHALL pre-fill the toolset with a fixed MCP template: a container source referencing the container (`source.$type = CONTAINER`, `source.containerId = <container name>`), `source.mcpEndpointPath = '/mcp'`, and a streamable-HTTP transport (`ToolsetTransport.HTTP`).

#### Scenario: Toolset template is pre-filled

- **WHEN** a user triggers "Create toolset" from a `TEXT_CLASSIFICATION` container
- **THEN** the toolset create modal opens with `source.containerId` set to the container, `source.mcpEndpointPath = '/mcp'`, and transport set to streamable HTTP

### Requirement: External-Endpoint source is unaffected

Gating SHALL apply only to the Model-Serving (container) source. The External-Endpoint model source, including embeddings models, SHALL behave exactly as before.

#### Scenario: Embeddings via External Endpoint still works

- **WHEN** a user creates an embeddings model using the External Endpoint source
- **THEN** creation proceeds unchanged, with no capability gating applied
