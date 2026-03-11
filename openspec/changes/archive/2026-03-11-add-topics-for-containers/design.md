## Context

Containers (MCP, Interceptor, Adapter, Model Servings) are deployment entities that extend `BaseEntity`, which already includes `topics?: string[]`. However, the container UI currently does not expose or utilize the topics field. Other entity types (models, applications, toolsets) already support topics through the shared `TopicsControl` component.

There are two separate topics APIs:
- **Admin backend** (`DIAL_ADMIN_API_URL`): `getModelsTopics()` in `src/app/[lang]/models/actions.ts` — used by models/applications
- **Deployment manager backend** (`DIAL_DEPLOYMENTS_API_URL`): `getTopics()` in `src/app/actions/deployments.ts` via `TopicApi` — used by Images and should be used by containers

The `TopicsControl` component currently hardcodes `getModelsTopics` for fetching suggestions. Since containers are managed by the deployment manager, they need to use the deployments `getTopics` API instead.

## Goals / Non-Goals

**Goals:**
- Add topics editing to the container properties form (all container types)
- Display topics in the container list grid as a column
- Reuse existing `TopicsControl` and grid column infrastructure

**Non-Goals:**
- Backend API changes (topics are already part of `BaseEntity` serialization)
- Changes to topic management, creation, or validation logic
- Topics for container export/import flows
- Topics filtering on list pages

## Decisions

### 1. Place TopicsControl in ContainerBase component

**Decision**: Add `TopicsControl` to `ContainerBase` (after Description, before Maintainer), consistent with how other entities place topics near basic identity fields.

**Alternative considered**: Adding it to `ContainerFields` as a separate section. Rejected because topics are a base property and belong alongside name/description/author.

### 2. Use deployments topics API via a `getItems` prop on TopicsControl

**Decision**: Extend `TopicsControl` to accept an optional `getItems` prop that overrides the default `getModelsTopics` fetch function. For containers, pass `getTopics` from `src/app/actions/deployments.ts`. This matches how `ImageBase` uses `TopicsControl` — Images are also deployment entities using the deployment manager's topics endpoint.

**Alternative considered**: Creating a separate `DeploymentTopicsControl`. Rejected because the only difference is the data source; a prop is simpler.

**Alternative considered**: Using `descriptionKeywords` like toolsets. Rejected because containers extend `BaseEntity` which has `topics`, and the backend already serializes this field.

### 3. Use standard `topics` property (not `descriptionKeywords`)

**Decision**: Use `TopicsControl` without the deployment-asset `view` prop, so it reads/writes `entity.topics`. Containers are not "deployment assets" in the `isDeploymentAsset()` sense — they are deployment entities that use `topics` directly.

### 4. Add topics column to CONTAINERS_COLUMNS

**Decision**: Add a `topics` column to `CONTAINERS_COLUMNS` in `grid-columns.tsx`, hidden by default (users can enable via column panel). Use a tag-style cell renderer consistent with how topics appear in other grids.

**Alternative considered**: Always-visible column. Rejected to avoid cluttering the default view — users who need it can enable it.

### 5. Topics available in both modal (create) and properties (edit) views

**Decision**: Show TopicsControl in both the create modal and the properties page. The `isModal` flag on `ContainerBase` already controls layout width via `isFullWidth`.

## Risks / Trade-offs

- **[Risk]** Backend may not persist `topics` for containers if the deployment manager hasn't implemented it yet → **Mitigation**: Verify with backend team; the field is part of `BaseEntity` so it should serialize, but confirm it's not stripped.
- **[Risk]** `TopicsControl` currently hardcodes `getModelsTopics` → **Mitigation**: Add optional `getItems` prop to `TopicsControl` so containers can pass `getTopics` from deployments actions.
