## Why

Containers (MCP, Interceptor, Adapter, Model Servings) currently lack topics/tags support, making it difficult for admins to categorize and filter containers. Other entity types (models, applications, toolsets) already support topics, and this gap prevents consistent organization across the platform. This is tracked as [Issue #1874](https://github.com/epam/ai-dial-admin-frontend/issues/1874).

## What Changes

- Add a Topics field to the container properties form (in `ContainerBase` section), allowing admins to assign topics when creating or editing containers
- Add a Topics column to the containers list grid (AG Grid) for all container types (MCP, Interceptor, Adapter, Model Servings)
- Ensure topics are persisted through the existing container create/update API calls (the `Container` model already extends `BaseEntity` which includes `topics?: string[]`)
- Reuse the existing `TopicsControl` component with the deployments `getTopics` action (from `src/app/actions/deployments.ts`) for topic suggestions, matching the pattern used by Images

## Non-goals

- No new API endpoints — topics are already part of the `BaseEntity` schema and the deployment manager backend already has a `/api/topics` endpoint (`TopicApi`)
- No changes to topic management or creation logic — reusing existing infrastructure
- No changes to export/import functionality for containers

## Capabilities

### New Capabilities

- `container-topics`: Add topics field to container properties form and topics column to container list grids

### Modified Capabilities

_(none)_

## Impact

- **Components**: `ContainerBase` (add TopicsControl), `ContainerFields`, container grid columns (`CONTAINERS_COLUMNS`)
- **API**: No backend changes expected — `BaseEntity.topics` should already be serialized. Need to verify the deployment manager backend handles `topics` on container entities.
- **Tests**: Update `ContainerBase` and `ContainersList` tests; update grid column specs
