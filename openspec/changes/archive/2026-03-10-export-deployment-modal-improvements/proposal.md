## Why

The Export Deployments "Add" modal currently shows a generic "Add" title without specifying the entity type, making it unclear what the user is adding. Additionally, container entities (MCP, Interceptor, Adapter) that are built from internal images don't show their Image dependency in the modal, while Core entities already show Dependencies for their related types.

## What Changes

- **Modal title**: Extend the existing `entityTypeToMenuKey` mapping and `getButtonTitle` function to support deployment entity types, so the modal displays entity-specific titles (e.g., "Add MCP Containers", "Add Images"). Remove `.toLowerCase()` from title generation for consistent casing across core and deployment entities.
- **Container image dependencies**: Extend `getAllAvailableDependencies` to return image dependencies for container types. Add a `disabled` prop to the existing `Dependencies` component to render always-checked, non-interactive checkboxes (e.g., "MCP Image" for MCP Containers).

## Capabilities

### New Capabilities
- `deployment-modal-title`: Entity-specific titles for the deployment Add Entities modal by extending existing `entityTypeToMenuKey` mapping
- `container-image-dependencies`: Dependencies sidebar for container entity types by extending existing `getAllAvailableDependencies` and adding `disabled` prop to `Dependencies` component

### Modified Capabilities

## Impact

- `AddEntities/utils.ts`: `entityTypeToMenuKey` extended with deployment types; `.toLowerCase()` removed from `getButtonTitle` for consistent casing
- `get-export-deps.ts`: `getAllAvailableDependencies` extended with deployment container image dependency cases; new `DEPLOYMENT_IMAGE_DEP` constants
- `Dependencies` component: new `disabled` prop to hide "All dependencies" toggle and disable checkboxes
- `AddEntitiesModal`: new `disabledDependencies` prop passed through to Dependencies
- `DeploymentConfigContent`: passes `disabledDependencies` to AddEntitiesModal
- i18n: 3 new keys for image dependency labels (McpImage, InterceptorImage, AdapterImage)
