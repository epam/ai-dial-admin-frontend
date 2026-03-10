## Why

MCP containers can currently only be created from internal MCP images (two-step modal with image grid selection). Users need the ability to create MCP containers directly from a Docker image reference (e.g., `docker.io/org/image:tag`), enabling external/custom MCP server images without requiring them to be registered as internal images first.

## What Changes

- **MCP Create button becomes a dropdown** with two options: "From Internal MCP Image" (existing flow) and "From Docker Image Reference" (new flow).
- **Reuse `ServingCreate` modal** for the Docker image reference flow. The modal renders a Docker reference text field (similar to NIM's `imageRef` field) instead of the image grid, by leveraging conditional rendering based on `CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE`.
- **Extend `ContainerSource` component** to handle `IMAGE_REFERENCE` source type, rendering a Docker image reference input field.
- **Extend `ContainerFields`** to show the `ContainerSource` field for MCP containers with `IMAGE_REFERENCE` source (not just `ModelServings` route).
- **Extend `getContainerTemplate`** to support creating an MCP template with `IMAGE_REFERENCE` source type.
- **Add new `ModalType`** entry for the Docker image reference MCP creation flow.

## Capabilities

### New Capabilities
- `mcp-docker-image-source`: UI flow for creating MCP containers from a Docker image reference, including dropdown button, modal reuse, and source field rendering.

### Modified Capabilities
- `unified-container-source`: The existing spec states "No UI flow SHALL be implemented for creating containers with `image_reference` source." This requirement changes — we now add a UI flow for `IMAGE_REFERENCE` source type.

## Impact

- **Components**: `HeaderButtons`, `ContainerSource`, `ContainerFields`, `ServingCreate` (prop types)
- **Utils**: `getContainerTemplate` (new MCP + IMAGE_REFERENCE branch)
- **Types**: `ModalType` enum (new entry)
- **i18n**: New translation keys for dropdown labels
- **No backend changes** — `CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE` and `imageReference` field already exist in the type system and are supported by the backend
