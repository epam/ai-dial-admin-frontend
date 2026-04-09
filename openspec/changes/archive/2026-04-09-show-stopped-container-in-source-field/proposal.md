## Why

When an entity (Model, Toolset, Interceptor) is created from a container and that container later stops running, the Container field in the entity's edit view shows "No Containers" instead of the selected container's name. This happens because the `Containers` component filters fetched containers to running-only, so the referenced container disappears from the list and `selectedContainer` resolves to null. The user loses context about which container the entity is linked to.

Issue: [#2708](https://github.com/epam/ai-dial-admin-frontend/issues/2708)

## What Changes

- **Show stopped container name in the input**: In the non-modal (edit view) `Containers` component, resolve `selectedContainer` from the full unfiltered container list so the `DialInputPopup` displays the container's display name regardless of status.
- **Keep selection modal running-only**: The `SelectContainerModal` dropdown continues to show only running containers — users can only switch to a running container.
- **No status indicators**: The container name is shown as-is, without error/warning styling.

## Non-goals

- No backend changes — the backend still rejects saves when the container URL is absent (container not running). That is a separate concern.
- No changes to the modal (creation) flow — it already only shows running containers and has no pre-existing `containerId`.
- No container status highlighting or warning indicators on the field.

## Capabilities

### New Capabilities
- `stopped-container-display`: Show the selected container's display name in the source field input even when the container is not running.

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **`src/components/SourceField/Containers/Containers.tsx`**: Main change — store full container list separately for lookup, keep filtered list for selection modal.
- No API changes, no new dependencies, no impact on other components consuming the `Containers` component in modal mode.
