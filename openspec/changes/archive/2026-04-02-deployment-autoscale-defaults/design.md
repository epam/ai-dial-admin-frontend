## Context

All container types currently share a single `DEFAULT_SCALING` constant (`minReplicas: 1, maxReplicas: 1`). This keeps non-serving containers (MCP, Interceptor, Adapter) running permanently even at zero traffic, wasting resources. Model servings (NIM, HF) need to stay warm due to GPU cold-start costs.

The `getContainerTemplate` function uses an if-chain where Adapter/Interceptor with `INTERNAL_IMAGE` source silently falls through to a generic catch-all (line 165), receiving the correct scaling only by accident.

Verified against local BE (localhost:8085): the backend does not assign default scaling when omitted — it stores whatever the FE sends. Delegating defaults to BE is not viable.

## Goals / Non-Goals

**Goals:**
- Non-serving containers default to scale-to-zero (min:0, max:1, 5 min delay)
- Model servings retain always-on defaults (min:1, max:1)
- Eliminate the fallthrough bug in `getContainerTemplate`
- Each template concern (scaling, resources, source) independently testable

**Non-Goals:**
- Changing the autoscaling UI component
- Backend-side default scaling logic
- Affecting existing containers

## Decisions

### D1: Two named scaling constants

Rename current `DEFAULT_SCALING` to `SERVING_SCALING`. Introduce new `DEFAULT_SCALING` with scale-to-zero.

```typescript
export const DEFAULT_SCALING: Autoscaling = {
  minReplicas: 0,
  maxReplicas: 1,
  scaleToZeroDelaySeconds: 300,
};

export const SERVING_SCALING: Autoscaling = {
  minReplicas: 1,
  maxReplicas: 1,
};
```

`DEFAULT_SCALING` is the resource-efficient default. `SERVING_SCALING` is the exception for GPU-backed model servings. Naming reflects that scale-to-zero is the norm, always-on is the special case.

### D2: Decompose getContainerTemplate into helper functions

Replace the if-chain with composed helpers:

```typescript
export const getContainerTemplate = (
  type: CONTAINER_TYPE,
  defaults?: ResourcesDefaults,
  sourceType?: CONTAINER_SOURCE_TYPE,
  options?: ContainerTemplateOptions,
): Container | null => {
  if (!type) return null;

  return {
    $type: type,
    displayName: '',
    name: '',
    description: '',
    status: CONTAINER_STATUS.NOT_DEPLOYED,
    metadata: { envs: [] },
    source: getContainerSource(type, sourceType, options),
    scaling: getContainerScaling(type),
    resources: getContainerResources(type, defaults),
    ...(type === CONTAINER_TYPE.MCP && { transport: CONTAINER_TRANSPORT.HTTP }),
    ...(type === CONTAINER_TYPE.HF && { modelFormat: MODEL_FORMAT.HF }),
  };
};
```

Each helper is a pure function with a simple type-based switch. No fallthrough possible — every `CONTAINER_TYPE` maps to a defined result in each helper.

### D3: Inline container extras (transport, modelFormat)

MCP's `transport` and HF's `modelFormat` are inlined as conditional spreads rather than extracted into a helper. Only two sparse cases — a function would add indirection without substance. If more type-specific extras appear, extract then.

## Risks / Trade-offs

**[Risk] `DEFAULT_SCALING` name reuse with different shape** → Any code importing `DEFAULT_SCALING` expecting `{ minReplicas: 1, maxReplicas: 1 }` will silently get the new shape. Mitigated by: all current usages are inside `getContainerTemplate` which we're refactoring — there are no external consumers of the constant.

**[Trade-off] FE owns scaling defaults, not BE** → If BE adds default scaling logic later, we'd have competing defaults. Acceptable for now — the BE doesn't support it and there's no planned work to add it.
