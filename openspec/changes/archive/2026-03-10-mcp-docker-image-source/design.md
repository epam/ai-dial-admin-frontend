## Context

MCP containers are currently created exclusively from internal images via a two-step `ContainerCreate` modal (image grid → properties). The `ServingCreate` modal is a single-step form used for HF and NIM model servings, rendering source-specific fields via the `ContainerSource` component. The `CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE` enum value and `imageReference` field on `ContainerSource` type already exist but have no UI flow.

Key existing components:
- `HeaderButtons` — renders Create button; uses `DialButtonDropdown` for ModelServings, plain button for MCP
- `ServingCreate` — single-step form modal, accepts `type: CONTAINER_TYPE`
- `ContainerSource` — conditional field: NIM → `imageRef` input, HF → `HFModelNameField`
- `ContainerFields` — shows `ContainerSource` only for `ApplicationRoute.ModelServings`
- `getContainerTemplate` — returns template based on `CONTAINER_TYPE`

## Goals / Non-Goals

**Goals:**
- Add dropdown Create button on MCP listing with "From Internal MCP Image" and "From Docker Image Reference" options
- Reuse `ServingCreate` modal for the Docker image reference flow with minimum changes
- Extend `ContainerSource` to render a Docker reference input for `IMAGE_REFERENCE` source type
- Keep the new flow identical to existing MCP container flow except for the source

**Non-Goals:**
- No changes to backend API or server actions
- No support for `IMAGE_REFERENCE` source on non-MCP container types (interceptors, adapters)
- No changes to the existing two-step `ContainerCreate` modal
- No edit-page changes — the detail view already renders based on source type

## Decisions

### 1. Reuse `ServingCreate` modal as-is

**Decision**: Pass `CONTAINER_TYPE.MCP` to `ServingCreate` with a new source type override mechanism.

**Rationale**: `ServingCreate` is already a clean single-step form that renders `ContainerFields`. The only issue is that `getContainerTemplate(CONTAINER_TYPE.MCP)` produces an `INTERNAL_IMAGE` source. Rather than adding a new container type, we add an optional `sourceType` prop to `ServingCreate` that overrides the template's source type.

**Alternative considered**: Create a separate modal for Docker MCP — rejected because it would duplicate the `ServingCreate` structure entirely.

### 2. Extend `ContainerSource` with IMAGE_REFERENCE branch

**Decision**: Add a third branch in `ContainerSource` for `IMAGE_REFERENCE`, rendering a `DialInput` for Docker image reference (similar to the NIM `imageRef` field but storing in `imageReference`).

**Rationale**: The NIM imageRef input and Docker reference input are structurally identical (text field with URI validation). Adding a branch keeps the pattern consistent.

### 3. Widen `ContainerFields` source rendering condition

**Decision**: Show `ContainerSource` when route is `ModelServings` OR when `source.$type === IMAGE_REFERENCE`.

**Rationale**: Minimal change — only MCP containers created via the new flow will have `IMAGE_REFERENCE` source, so the condition is precise. Internal-image MCP containers still go through the image grid and don't need the source field in the modal.

### 4. Dropdown button for MCP route in HeaderButtons

**Decision**: Use `DialButtonDropdown` (same as ModelServings) for `ApplicationRoute.McpContainers`, with two items: one opening `ContainerCreate` (existing), one opening `ServingCreate` (new).

**Rationale**: Follows the established pattern from ModelServings. The existing `DialPrimaryButton` becomes a `DialButtonDropdown` only for MCP route.

### 5. Container template for MCP + IMAGE_REFERENCE

**Decision**: Add an optional `sourceType` parameter to `getContainerTemplate`. When `sourceType === IMAGE_REFERENCE` and `type === MCP`, return MCP template with `{ $type: IMAGE_REFERENCE, imageReference: '' }` source.

**Alternative considered**: Create a completely separate template function — rejected as over-engineering for a single source type variation.

## Risks / Trade-offs

- **[Risk] `ServingCreate` modal prop surface grows** → Mitigation: Only one optional prop (`sourceType`), keeps the component generic.
- **[Risk] `ContainerFields` condition becomes source-aware** → Mitigation: Simple OR condition, no complex logic. Clear comment explaining why.
- **[Trade-off] Validation reuse** → The Docker reference field reuses `getDeploymentsURIError` (same as NIM imageRef). If Docker references need different validation in the future, a separate validator can be introduced.
