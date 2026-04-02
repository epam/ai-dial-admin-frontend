# Container Scaling Defaults

## Purpose

Ensures non-serving containers (MCP, Interceptor, Adapter) default to scale-to-zero after 5 minutes of inactivity, while model servings (NIM, HF) retain their current always-on defaults. Also refactors `getContainerTemplate` from a fragile if-chain into composed helper functions.

## MODIFIED Requirements

### Requirement: Scaling constants reflect container purpose

The system SHALL define two scaling constants:

- `DEFAULT_SCALING` — `{ minReplicas: 0, maxReplicas: 1, scaleToZeroDelaySeconds: 300 }`
- `SERVING_SCALING` — `{ minReplicas: 1, maxReplicas: 1 }`

**File:** `src/constants/deployments/containers.tsx`

#### Scenario: DEFAULT_SCALING used for non-serving containers
- **WHEN** a new MCP, Interceptor, or Adapter container template is created
- **THEN** the template SHALL use `DEFAULT_SCALING`
- **AND** the container SHALL have `minReplicas: 0`, `maxReplicas: 1`, `scaleToZeroDelaySeconds: 300`

#### Scenario: SERVING_SCALING used for model servings
- **WHEN** a new NIM or HF container template is created
- **THEN** the template SHALL use `SERVING_SCALING`
- **AND** the container SHALL have `minReplicas: 1`, `maxReplicas: 1`
- **AND** `scaleToZeroDelaySeconds` SHALL NOT be set

#### Scenario: Existing containers are unaffected
- **GIVEN** a container that was previously created with any scaling configuration
- **WHEN** the container is fetched or edited
- **THEN** the existing scaling values SHALL be preserved as-is

### Requirement: getContainerTemplate decomposed into helper functions

The `getContainerTemplate` function SHALL be refactored from an if-chain into a composition of focused helpers. This eliminates the silent fallthrough where Adapter/Interceptor with `INTERNAL_IMAGE` source type bypassed their intended branch and hit a generic catch-all.

**File:** `src/utils/deployments/containers.ts`

#### Helper: getContainerScaling(type)

Returns the appropriate scaling configuration based on container type.

- **WHEN** `type` is `NIM` or `HF`
- **THEN** SHALL return `SERVING_SCALING`
- **OTHERWISE** SHALL return `DEFAULT_SCALING`

#### Helper: getContainerResources(type, defaults?)

Returns the resource configuration based on container type and optional defaults.

- **WHEN** `type` is `NIM` or `HF`
- **THEN** SHALL return CPU + memory resources AND `nvidia.com/gpu` in both requests and limits
- **OTHERWISE** SHALL return CPU + memory resources only

Resource values SHALL fall back to: CPU `'1'`, memory `2048 MiB`, GPU `'1'` when `defaults` is not provided.

#### Helper: getContainerSource(type, sourceType?, options?)

Returns the source configuration based on container type, source type, and options.

- **WHEN** `type` is `NIM` — SHALL return `{ $type: NGC_REGISTRY }`
- **WHEN** `type` is `HF` — SHALL return `{ $type: HUGGINGFACE }`
- **WHEN** `sourceType` is `IMAGE_REFERENCE` and `options.mcpRegistry` is true — SHALL return `{ $type: IMAGE_REFERENCE, imageReference: '', externalRegistryRef: { $type: 'mcp-registry', packageName: '' } }`
- **WHEN** `sourceType` is `IMAGE_REFERENCE` — SHALL return `{ $type: IMAGE_REFERENCE, imageReference: '' }`
- **OTHERWISE** — SHALL return `{ $type: INTERNAL_IMAGE, imageDefinitionId: '' }`

#### Composed template function

`getContainerTemplate` SHALL compose the helpers:

```
{
  ...baseTemplate,
  source:    getContainerSource(type, sourceType, options),
  scaling:   getContainerScaling(type),
  resources: getContainerResources(type, defaults),
  ...(type === MCP && { transport: CONTAINER_TRANSPORT.HTTP }),
  ...(type === HF && { modelFormat: MODEL_FORMAT.HF }),
}
```

#### Scenario: Every CONTAINER_TYPE is explicitly handled
- **GIVEN** any value of `CONTAINER_TYPE` enum (MCP, INTERCEPTOR, ADAPTER, NIM, HF)
- **WHEN** `getContainerTemplate` is called with that type
- **THEN** each helper SHALL resolve to a defined value — no container type falls through to a generic default

#### Scenario: Adapter with INTERNAL_IMAGE gets correct scaling
- **WHEN** `getContainerTemplate` is called with `type: ADAPTER` and no `sourceType`
- **THEN** the template SHALL have `DEFAULT_SCALING` (min:0, max:1, scaleToZero:300)
- **AND** source SHALL be `{ $type: INTERNAL_IMAGE, imageDefinitionId: '' }`

#### Scenario: Adapter with IMAGE_REFERENCE gets correct scaling
- **WHEN** `getContainerTemplate` is called with `type: ADAPTER` and `sourceType: IMAGE_REFERENCE`
- **THEN** the template SHALL have `DEFAULT_SCALING` (min:0, max:1, scaleToZero:300)
- **AND** source SHALL be `{ $type: IMAGE_REFERENCE, imageReference: '' }`

#### Scenario: Null returned for falsy type
- **WHEN** `getContainerTemplate` is called with a falsy `type`
- **THEN** SHALL return `null`

## Validation

No validation changes required. Existing `getReplicasError` already accepts `min >= 0`.

## Accessibility

No UI changes — this only affects default values in container creation templates.

## Error Handling

No new error states. The autoscaling UI component (`ContainerAutoscaling.tsx`) already handles `minReplicas: 0` with `scaleToZeroDelaySeconds > 0` correctly — it disables the min replicas input and shows the selected scale-to-zero option.
