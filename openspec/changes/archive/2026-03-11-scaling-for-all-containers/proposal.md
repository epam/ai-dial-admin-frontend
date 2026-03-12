# Scaling for All Containers (except NIM)

## Problem

The Scaling (Autoscaling) section is currently only visible for HuggingFace containers (`CONTAINER_SOURCE_TYPE.HUGGINGFACE`). Other container types like MCP and ADAPTER (using `IMAGE_REFERENCE` or `INTERNAL_IMAGE` sources) have no access to scaling configuration, even though the backend supports it.

## Solution

Expose the Scaling section to all containers except NIM (`NGC_REGISTRY` source type). Rework the UI to derive field visibility from min/max replica values, making the form self-consistent and preventing invalid configurations.

## Key Decisions

### Visibility gate
- Show Scaling for all `source.$type` except `NGC_REGISTRY`
- File: `src/components/Containers/Fields/ContainerFields.tsx:35`

### Derived UI (Strategy B)
Fields appear/disappear based on min/max values instead of showing everything at once:

| Condition | Visible fields |
|-----------|---------------|
| Always | Scale-to-Zero dropdown, Min Replicas, Max Replicas |
| `min === 0` (scale-to-zero selected) | Min Replicas disabled (locked to 0) |
| `max > min && max > 1` | Strategy selector + Threshold |

### State cleanup on value changes

| User action | Side effect |
|-------------|-------------|
| Selects scale-to-zero delay | Set min=0, set scaleToZeroDelaySeconds |
| Selects "Never" | Set min=1, remove scaleToZeroDelaySeconds |
| Sets max such that `max > min && max > 1` | Auto-populate strategy: `{ $type: 'active_requests', threshold: 2 }` |
| Sets max such that `max === min` or `max <= 1` | Remove strategy from state |

### Defaults
- All non-NIM containers get `{ minReplicas: 1, maxReplicas: 1 }` — no strategy, no scaleToZero
- Scale-to-Zero dropdown defaults to "Never"
- When strategy auto-populates: `active_requests` with threshold `2`

### New dropdown option
Add "After 5 Minutes" (300s) to the Scale-to-Zero dropdown, as the first option after "Never".

### Validation fix
Current `getReplicasError` has a truthiness bug where `min=0` short-circuits validation. Update to enforce:
- `min >= 0`
- `max >= 1`
- `min <= max`

## Non-goals
- Expanding `ContainerConfiguration` to non-HuggingFace containers (separate task)
- Changes to NIM container scaling behavior
- Backend API changes (backend already supports scaling for all container types)

## Affected Files
- `src/components/Containers/Fields/ContainerFields.tsx` — visibility gate
- `src/components/Deployments/Fields/ContainerAutoscaling.tsx` — derived UI, state management
- `src/constants/deployments/containers.tsx` — DEFAULT_SCALING, AUTOSCALE_OPTIONS
- `src/utils/deployments/containers.ts` — default scaling for container creation
- `src/utils/deployments/validation.ts` — getReplicasError fix
- `src/locales/en.ts` + `src/constants/i18n.ts` — new i18n key for "After 5 Minutes"
