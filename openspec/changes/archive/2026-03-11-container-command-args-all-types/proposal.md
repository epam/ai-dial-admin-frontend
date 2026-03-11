# Show Command & Arguments for All Container Types

## Problem

The Command and Arguments configuration section is currently only visible for HuggingFace-sourced containers. However, the underlying data model (`Container.command`, `Container.args`) and API layer already support these fields for all container types. Users of MCP, Interceptor, and Adapter containers cannot configure command/args through the UI despite the backend supporting it.

## Solution

Remove the `CONTAINER_SOURCE_TYPE.HUGGINGFACE` guard on `<ContainerConfiguration>` in `ContainerFields.tsx` so it renders for all container types in the properties view.

The existing flow is preserved — the section appears only in the detail/properties view (not in create/edit modals), matching the current HuggingFace behavior.

## Scope

- **One line change**: Remove the source type condition wrapping `<ContainerConfiguration>` at line 40-42 of `ContainerFields.tsx`
- Affects: MCP containers, Interceptor containers, Adapter containers, and Image-sourced Model Servings

## Non-goals

- Adding command/args to create/edit modals
- Changing the `ContainerConfiguration` component itself
- Modifying the data model or API layer (already supports all types)
