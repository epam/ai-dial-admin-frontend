## Context

The Export Config feature has an `AddEntitiesModal` component used for both Core and Deployment entity types. Currently, for deployment entities, the modal title defaults to a generic "Add" because `getButtonTitle` only maps `EntityType` values via `entityTypeToMenuKey`, not `DeploymentExportEntityType`. Additionally, the `Dependencies` sidebar only appears for Core entities (via `getAllAvailableDependencies`), but container types (MCP, Interceptor, Adapter) built from internal images should also show their image dependency.

## Goals / Non-Goals

**Goals:**
- Display entity-specific titles in the Add modal for deployment entities (e.g., "Add MCP Containers")
- Show a Dependencies sidebar for container entity types with the related image type as a disabled, always-checked item
- Reuse and extend existing infrastructure (`entityTypeToMenuKey`, `getAllAvailableDependencies`, `Dependencies`) with minimal new code

**Non-Goals:**
- Changing Core entity dependency behavior
- Auto-including related images in the export data (visual indicator only for now)
- Refactoring the existing `AddEntitiesButton` or Core entity flow

## Decisions

### 1. Extend `entityTypeToMenuKey` with deployment types instead of separate title functions

**Rationale**: The `entityTypeToMenuKey` mapping in `getButtonTitle` is `Record<string, string>`, so it naturally accepts any string key regardless of enum type. Adding `DeploymentExportEntityType` values to the same map lets `getButtonTitle` work for both core and deployment entities with zero changes to the function signature. This is simpler than creating separate `getDeploymentModalTitle` functions or passing a `title` prop.

**Alternative considered**: Adding optional `title` prop to `AddEntitiesModal` with a separate `getDeploymentModalTitle` in deployment-utils — rejected as unnecessary indirection when the existing map can be extended.

### 2. Extend `getAllAvailableDependencies` with deployment container cases

**Rationale**: The dependency resolution function already handles different entity types via if-else chains. Adding deployment container cases (MCP_CONTAINER → MCP_IMAGE, etc.) follows the same pattern. New `DEPLOYMENT_IMAGE_DEP` string constants serve as dependency keys that map to i18n labels via `entityTypeToMenuKey`.

**Alternative considered**: A `fixedDependencies` prop on the `Dependencies` component with a separate render path — rejected as it duplicated rendering logic and required a new interface.

### 3. Add `disabled` prop to `Dependencies` instead of separate render path

**Rationale**: A single `disabled` boolean prop controls two behaviors: (1) hides the "All dependencies" toggle checkbox, (2) makes individual dependency checkboxes disabled. This is simpler than a `fixedDependencies` prop that required a separate interface and conditional render branch. The existing render logic is reused entirely.

### 4. Remove `.toLowerCase()` from `getButtonTitle` for consistent casing

**Rationale**: With deployment types now using `getButtonTitle`, the `.toLowerCase()` call would incorrectly lowercase acronyms like "MCP" → "mcp". Removing it ensures consistent casing between button labels and modal titles for both core entities ("Add Models") and deployment entities ("Add MCP Containers").

## Risks / Trade-offs

- [Minimal risk] `getAllAvailableDependencies` uses `as unknown as EntityType` casts for deployment image dependency strings. This is pragmatic — the values flow through as string keys and work correctly at runtime without widening the `EntityType` type across multiple components.
- [Casing change] Core entity modal titles change from lowercase ("Add models") to original case ("Add Models"). This is more consistent with button labels.
