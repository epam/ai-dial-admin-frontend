## Context

MCP containers already support two creation paths: "From Internal MCP Image" (two-step wizard via `ContainerCreate`) and "From Docker Image Reference" (single-step form via `ServingCreate`). The `ServingCreate` modal, `ContainerFields`, and `ContainerSource` components are source-type driven — they render the docker image reference input whenever `source.$type === IMAGE_REFERENCE`, regardless of container type. The backend already supports `IMAGE_REFERENCE` source for adapter and interceptor containers.

## Goals / Non-Goals

**Goals:**
- Enable "From Docker Image Reference" creation for Adapter and Interceptor containers
- Reuse the existing MCP docker reference flow with minimal changes

**Non-Goals:**
- Modifying the `ServingCreate` modal or `ContainerFields`/`ContainerSource` components
- Adding new form fields or validation rules
- Changing adapter/interceptor entity configuration (models, interceptor assignment)

## Decisions

### 1. Extend `HeaderButtons` dropdown to adapter/interceptor routes

The `showDropdown` condition currently checks for `ModelServings` and `McpContainers`. We add `AdapterContainers` and `InterceptorContainers` to this condition and create new dropdown item arrays for each.

**Why**: Follows the exact same pattern as MCP. The dropdown shows "From Internal X Image" and "From Docker Image Reference" options.

**Alternative considered**: A single shared dropdown builder function. Not worth it — each route has slightly different labels and modal types, and the current explicit approach is clear.

### 2. Extend `getContainerTemplate` for ADAPTER and INTERCEPTOR with IMAGE_REFERENCE

Add branches so that `ADAPTER` and `INTERCEPTOR` types with `IMAGE_REFERENCE` source produce a template with:
- `source: { $type: IMAGE_REFERENCE, imageReference: '' }`
- `scaling: DEFAULT_SCALING`
- No `transport` field (transport is MCP-specific)

**Why**: The template function is the only place that is container-type aware in the creation flow. Everything downstream is source-type driven.

### 3. Reuse existing `FromDockerImageReference` i18n key

Add two new keys: `FromInternalAdapterImage` and `FromInternalInterceptorImage`. The "From Docker Image Reference" label is already shared and container-type agnostic.

### 4. Add new `ModalType` entries

Add `createAdapterDockerImage` and `createInterceptorDockerImage` to the `ModalType` enum, following the existing `createMcpDockerImage` pattern.

## Risks / Trade-offs

- **Low risk**: All changes follow an established pattern. The `ServingCreate` modal already accepts arbitrary `type` + `sourceType` props.
- **[Risk] Untested container type + source type combination** → Verify the backend accepts `{ $type: 'adapter', source: { $type: 'image_reference', ... } }` and `{ $type: 'interceptor', source: { $type: 'image_reference', ... } }` payloads. (User confirmed BE supports this.)
