# Design: Scaling for All Containers

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ SCALING                                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Scale to Zero: [ Never ▼ ]                              │
│                                                         │
│ Min Replicas: [ 1 ]     Max Replicas: [ 1 ]             │
│                                                         │
│ ── conditional: max > min && max > 1 ──────────────── │
│                                                         │
│ Strategy: [ Active Requests ▼ ]   Threshold: [ 2 ]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Scaling Modes

Three modes derived entirely from min/max values:

```
┌──────────────┐    min = max    ┌──────────────────────┐
│  User sets   │────────────────▶│  FIXED REPLICAS      │
│  min & max   │                 │  No strategy          │
│              │                 │  No scaleToZero       │
│              │    min = 0      ├──────────────────────┤
│              │────────────────▶│  SCALE TO ZERO        │
│              │                 │  scaleToZeroDelay set │
│              │                 │  min disabled          │
│              │  max>min,max>1  ├──────────────────────┤
│              │────────────────▶│  AUTOSCALING          │
│              │                 │  strategy: requests/2 │
└──────────────┘                 └──────────────────────┘
```

Combined states:

| min | max | scaleToZero | strategy | mode |
|-----|-----|-------------|----------|------|
| 1 | 1 | - | - | Fixed |
| 3 | 3 | - | - | Fixed at 3 |
| 0 | 1 | delay | - | Scale-to-zero only |
| 0 | 3 | delay | active_requests/2 | Scale-to-zero + autoscale |
| 1 | 3 | - | active_requests/2 | Autoscale only |

## Visibility Gate

```
ContainerFields.tsx

Before:  container.source?.$type === CONTAINER_SOURCE_TYPE.HUGGINGFACE
After:   container.source?.$type !== CONTAINER_SOURCE_TYPE.NGC_REGISTRY
```

## State Transitions in ContainerAutoscaling

### Scale-to-Zero dropdown change

```
"Never" selected:
  → min = 1 (or restore previous if was > 0)
  → delete scaleToZeroDelaySeconds

Delay selected (300, 900, 1800, ...):
  → min = 0
  → scaleToZeroDelaySeconds = selected value
```

### Max replicas change

```
If new max > min && max > 1:
  → auto-populate strategy if not present:
    { $type: 'active_requests', threshold: 2 }

If new max === min || max <= 1:
  → remove strategy from state
```

### Min replicas change (manual, only when not locked by scale-to-zero)

```
Same derived logic applies:
  → if max > min && max > 1: ensure strategy exists
  → if max === min: remove strategy
```

## Default Scaling by Container Type

```
Container Type  │ Source Type       │ Scaling default
────────────────┼───────────────────┼──────────────────────
HF              │ HUGGINGFACE       │ { min: 1, max: 1 }
NIM             │ NGC_REGISTRY      │ { min: 1, max: 1 } (UI hidden)
MCP             │ IMAGE_REFERENCE   │ { min: 1, max: 1 }  ← new
ADAPTER         │ varies            │ { min: 1, max: 1 }  ← new
```

DEFAULT_SCALING changes from:
```ts
{ minReplicas: 1, maxReplicas: 1, strategy: { $type: 'active_requests', threshold: 2 } }
```
to:
```ts
{ minReplicas: 1, maxReplicas: 1 }
```

Strategy is no longer part of the default — it's derived when `max > min && max > 1`.

## Code Organization

Scaling logic is organized across dedicated layers, not inlined in components:

| Symbol | Location | Layer |
|--------|----------|-------|
| `DEFAULT_SCALING` | `src/constants/deployments/containers.tsx` | constant |
| `DEFAULT_STRATEGY` | `src/constants/deployments/containers.tsx` | constant |
| `isAutoscalingEnabled()` | `src/utils/deployments/containers.ts` | utility |
| `deriveScaling()` | `src/utils/deployments/containers.ts` | utility |

- `showStrategy` in `ContainerAutoscaling` uses `useMemo` for render optimization
- Both utility functions have dedicated unit tests in `containers.spec.ts`

## Scale-to-Zero Dropdown Options

| Label | Value (seconds) |
|-------|-----------------|
| Never | 0 |
| After 5 Minutes | 300 ← new |
| After 15 Minutes | 900 |
| After 30 Minutes | 1800 |
| After 1 Hour | 3600 |
| After 2 Hours | 7200 |
| After 6 Hours | 21600 |

## Validation Rules

`getReplicasError` updated to:

```
min >= 0        (min must be non-negative)
max >= 1        (max must be at least 1)
min <= max      (min cannot exceed max)
```

Handles edge cases the current truthiness-based check misses (min=0 with invalid max).

## Accessibility

- Strategy + Threshold section uses existing Accordion/field patterns — no new a11y concerns
- Min Replicas `disabled` state when scale-to-zero is active follows existing `isEditDisabled` pattern
- All fields already have labels via `DialNumberInput.labelProps` and `DialSelectField.label`
