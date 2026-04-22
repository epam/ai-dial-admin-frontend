## ADDED Requirements

### Requirement: Prefix selection based on source container type

When the admin UI seeds `source.completionEndpointPath` for a Model whose source is a Model Serving container, the path prefix SHALL be derived from the container's `$type`:

- `CONTAINER_TYPE.NIM` → `v1`
- Any other container type, or an unresolved/unknown container → `openai/v1`

The full path MUST be composed as `<prefix><postfix>`, where `<postfix>` is the existing value returned by `getEndpointPostfix(DialModelType)` (e.g. `/chat/completions`, `/embeddings`). The prefix MUST NOT include a trailing slash, and composition MUST NOT introduce double slashes.

#### Scenario: NIM container with Chat type

- **WHEN** `getEntityTemplate` is called for `ApplicationRoute.ModelServings` with a container whose `$type` is `CONTAINER_TYPE.NIM`
- **THEN** the returned template's `source.completionEndpointPath` equals `v1/chat/completions`

#### Scenario: HF (inference) container with Chat type

- **WHEN** `getEntityTemplate` is called for `ApplicationRoute.ModelServings` with a container whose `$type` is `CONTAINER_TYPE.HF`
- **THEN** the returned template's `source.completionEndpointPath` equals `openai/v1/chat/completions`

#### Scenario: NIM container with Embedding type

- **WHEN** a Model with `type` other than `DialModelType.Chat` is templated from a NIM container
- **THEN** the returned template's `source.completionEndpointPath` equals `v1/embeddings`

### Requirement: Prefix applied when picking a source container in the Models view

When a user selects a source container for a Model in the Models view (`ApplicationRoute.Models`) via the `Containers` source field, the component SHALL rewrite `source.completionEndpointPath` using the same prefix rule based on the selected container's `$type` and the current `DialModel.type`.

#### Scenario: User selects a NIM container

- **WHEN** a user picks a container of `$type` `CONTAINER_TYPE.NIM` in the source field on the Models view
- **THEN** the `onChange` payload's `source.completionEndpointPath` starts with `v1` and has no `openai/` segment

#### Scenario: User selects a non-NIM container

- **WHEN** a user picks a container of any non-NIM `$type` in the source field on the Models view
- **THEN** the `onChange` payload's `source.completionEndpointPath` starts with `openai/v1`

#### Scenario: Selected id does not resolve to a loaded container

- **WHEN** `onSelect` is called with an id that does not match any loaded container in state
- **THEN** the path falls back to the `openai/v1` prefix (previous default behavior)

### Requirement: Edit flow preserves persisted prefix

Opening an existing Model for edit SHALL NOT recompute or overwrite `source.completionEndpointPath`. The prefix selection rule applies only to template creation (`getEntityTemplate`) and to explicit container selection in the source field (`Containers.onSelect`).

#### Scenario: Opening an existing NIM-sourced model

- **WHEN** a user opens a previously saved Model whose source container is NIM
- **THEN** `source.completionEndpointPath` is rendered as stored by the backend, with no client-side rewrite

#### Scenario: Opening an existing non-NIM-sourced model

- **WHEN** a user opens a previously saved Model whose source container is not NIM
- **THEN** `source.completionEndpointPath` is rendered as stored by the backend, with no client-side rewrite
