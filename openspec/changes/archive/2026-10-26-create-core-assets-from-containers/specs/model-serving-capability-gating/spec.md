## MODIFIED Requirements

### Requirement: Container detail page create action branches by capability

On the Model-Serving container detail page (`/model-servings/[id]`), the "Create" action SHALL be determined by the container's `inferenceTask`:

- `TEXT_GENERATION` SHALL offer "Create model", invoking the existing model creation with the chat-completions endpoint template.
- `TEXT_CLASSIFICATION` SHALL offer "Create toolset", invoking toolset creation.
- `NONE` SHALL show no create action.
- A container without an `inferenceTask` value SHALL retain current behavior (offer "Create model").

When the admin API is available, each offered action SHALL be a dropdown of the admin-backend entity and the Core asset of the same type. When the admin API is unavailable, it SHALL be a single button that creates the Core asset. Labels and templates SHALL follow `container-core-assets`.

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

#### Scenario: Both variants with the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is set and a user opens a running container with `inferenceTask = TEXT_GENERATION`
- **THEN** the Create action is a dropdown offering the admin-backend model and "Asset model"

#### Scenario: Core-only without the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user opens a running container with `inferenceTask = TEXT_GENERATION`
- **THEN** the page shows one "Create model" button that opens the Core model create modal
