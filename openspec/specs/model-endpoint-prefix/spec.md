# model-endpoint-prefix Specification

## Purpose

Rules for composing `source.completionEndpointPath` on Models seeded from a source container. The prefix is always `openai/v1`, regardless of container type or unresolved ids. The rule applies to template creation and explicit source-container selection only, never to opening existing Models for edit.

## Requirements

### Requirement: Endpoint prefix is always openai/v1

When the admin UI seeds `source.completionEndpointPath` for a Model whose source is a Model Serving container, the path prefix SHALL always be `openai/v1`, regardless of the container's `$type` or whether the container could be resolved. `getEndpointPrefix()` takes no arguments.

The full path MUST be composed as `<prefix><postfix>`, where `<postfix>` is the existing value returned by `getEndpointPostfix(DialModelType)` (e.g. `/chat/completions`, `/embeddings`). The prefix MUST NOT include a trailing slash, and composition MUST NOT introduce double slashes.

#### Scenario: HF (inference) container with Chat type

- **WHEN** `getEntityTemplate` is called for `ApplicationRoute.ModelServings` with a container whose `$type` is `CONTAINER_TYPE.HF`
- **THEN** the returned template's `source.completionEndpointPath` equals `openai/v1/chat/completions`

#### Scenario: Container with Embedding type

- **WHEN** a Model with `type` other than `DialModelType.Chat` is templated from a Model Serving container
- **THEN** the returned template's `source.completionEndpointPath` equals `openai/v1/embeddings`

### Requirement: Prefix applied when picking a source container in the Models view

When a user selects a source container for a Model in the Models view (`ApplicationRoute.Models`) via the `Containers` source field, the component SHALL rewrite `source.completionEndpointPath` using the `openai/v1` prefix and the postfix for the current `DialModel.type`.

#### Scenario: User selects a container

- **WHEN** a user picks a container of any `$type` in the source field on the Models view
- **THEN** the `onChange` payload's `source.completionEndpointPath` starts with `openai/v1`

#### Scenario: Selected id does not resolve to a loaded container

- **WHEN** `onSelect` is called with an id that does not match any loaded container in state
- **THEN** the path falls back to the `openai/v1` prefix (previous default behavior)

### Requirement: Edit flow preserves persisted prefix

Opening an existing Model for edit SHALL NOT recompute or overwrite `source.completionEndpointPath`. The prefix rule applies only to template creation (`getEntityTemplate`) and to explicit container selection in the source field (`Containers.onSelect`).

#### Scenario: Opening an existing model

- **WHEN** a user opens a previously saved Model that has a source container
- **THEN** `source.completionEndpointPath` is rendered as stored by the backend, with no client-side rewrite
