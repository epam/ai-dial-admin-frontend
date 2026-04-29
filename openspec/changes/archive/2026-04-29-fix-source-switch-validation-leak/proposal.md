## Why

Issue #3027: in the **Create Toolset** popup, switching source type from **MCP Registry → MCP Container** leaves the **Create** button disabled even after every required field is filled. Root cause is a lifecycle leak in `SaveValidationContext`: sub-source components (`McpServerNameField`, `HFModelNameField`) register a validation field on mount but never remove it on unmount, so a `false` entry lingers after the component is gone and `isValid = every(values)` stays `false` forever. The same shape leaks on the container source-type swap (HF ↔ MCP) in container create/edit.

A second, smaller hygiene issue compounds it: `SourceField.onChangeSource` spreads `entity.source` into the new source object when switching `$type`, so type-specific keys (`serverName`, `serverVersion`, `containerId`, `runnerName`, `adapterName`, etc.) leak across switches and end up persisted on the backend payload.

## What Changes

- **Validation cleanup** on unmount in `McpServerNameField` and `HFModelNameField` — dispatch `ValidationActionType.RemoveField` so the field disappears from the validation map when the component is unmounted (matches the existing `AppRunners.tsx:67-70` precedent, but uses `RemoveField` for honest lifecycle semantics).
- **Source-object cleanup** in `SourceField.onChangeSource` — drop the `...entity.source` spread when switching `$type`, so the new `source` object only carries `{ $type }` and a fresh shape. Type-specific keys never carry across.
- **Tests**:
  - Component test for the issue #3027 repro: open Create Toolset → pick MCP Registry → switch to MCP Container → fill required fields → assert Submit button enabled.
  - Component test for container source-type swap: HUGGINGFACE → IMAGE_REFERENCE (with `externalRegistryRef`) → back, assert no stale `modelName`/`mcpServerName` blocks save.
  - Unit test on `McpServerNameField` and `HFModelNameField` asserting their validation entry is removed from `SaveValidationContext` when the component unmounts.
  - Unit test on `SourceField.onChangeSource` asserting the resulting `entity.source` contains only `$type` after a switch.

## Capabilities

### New Capabilities

- `source-type-switch-cleanup`: lifecycle invariants for `SourceField` and its sub-source components when the user switches source type — validation-field cleanup on unmount, and source-object reset on switch — so transient state from one source type cannot block submission of another.

### Modified Capabilities

(none — this fix introduces a new lifecycle invariant rather than changing requirements of any existing capability)

## Non-goals

- Wider refactor of `SaveValidationContext` API. The existing `RemoveField` action is sufficient.
- Audit and cleanup of every dispatcher in `Deployments/Fields/**` — only the two components that are actually swapped in/out by a source-type selector (`McpServerNameField`, `HFModelNameField`) are in scope here. Long-lived dispatchers (`Port.tsx`, `EndpointPath.tsx`, container resources, autoscaling, image-base, env vars) stay mounted with their parent form and so cannot leak across the bug's user flow.
- Changes to backend payload schema. Cleaning up stale keys is purely client-side.
- Behavioral changes to `AppRunners.tsx` (already has cleanup; keeps `SetField(true)` rather than switching to `RemoveField` to stay localized).

## Impact

**Affected files**

- `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/McpServerNameField.tsx` — add unmount cleanup.
- `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/HFModelNameField.tsx` — add unmount cleanup.
- `apps/ai-dial-admin/src/components/SourceField/SourceField.tsx` — drop the `...entity.source` spread in `onChangeSource`.
- New tests under existing `tests/` folders next to each touched file. Toolset Create-flow test goes alongside `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/tests/CreateEntity.spec.tsx`.

**Affected user flows**

- Create Toolset (`Toolsets`) — fixes the disabled-Create regression.
- Edit/Create Container (`McpContainers`, `ModelServings`, `ApplicationContainers`, `AdapterContainers`) — fixes the same class of bug on the source-type swap.
- Models/Adapters/Interceptors create/edit — uses the same `SourceField`; the source-object cleanup in `onChangeSource` prevents stale `serverName`/`adapterName`/`runnerName` from leaking onto a switched-to type. No user-visible change unless the user was previously hitting a follow-on backend error from stale fields.

**Risk**

- Low. `RemoveField` already exists in `SaveValidationContext`. Source-object spread removal is a one-liner; every key on `SOURCE_FIELD` is type-specific by design (no field is shared across types), so dropping the spread only removes data that never belonged on the new type.
