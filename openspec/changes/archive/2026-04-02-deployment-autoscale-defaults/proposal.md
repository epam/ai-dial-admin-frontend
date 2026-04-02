## Why

All non-serving containers (MCP, Interceptor, Adapter) currently default to `minReplicas: 1, maxReplicas: 1` — they stay running permanently even with zero traffic. This wastes resources. Model servings (NIM, HF) need to stay warm due to GPU cold-start costs, but lightweight containers should scale to zero by default.

Issue: https://github.com/epam/ai-dial-admin-frontend/issues/2819

## What Changes

- **Rename and split scaling constants** — current `DEFAULT_SCALING` becomes `SERVING_SCALING` (min:1, max:1) for NIM/HF; new `DEFAULT_SCALING` (min:0, max:1, scaleToZeroDelaySeconds:300) for everything else
- **Refactor `getContainerTemplate`** — decompose the current if-chain into focused helper functions (`getContainerScaling`, `getContainerResources`, `getContainerSource`), eliminating the silent fallthrough for Adapter/Interceptor with internal images. The template function becomes pure composition
- **Update tests** — adjust existing `getContainerTemplate` tests and add tests for each extracted helper

## Design Decisions

- **FE must set scaling explicitly** — verified against local BE (localhost:8085) that the backend does not assign default scaling when omitted; it stores whatever the FE sends. Delegating defaults to BE is not viable without BE changes.
- **Decomposed helpers over if-chain** — the current `getContainerTemplate` has a fragile fallthrough: Adapter/Interceptor with `INTERNAL_IMAGE` source silently falls to a generic catch-all (line 165). Extracting `getContainerScaling(type)`, `getContainerResources(type, defaults)`, `getContainerSource(type, sourceType, options)` makes each concern independently testable and eliminates the fallthrough.
- **Inline container extras** — type-specific fields (MCP `transport`, HF `modelFormat`) are inlined with spread operators rather than extracted into a helper, since there are only two sparse cases today.

## Non-goals

- Changing scaling defaults for NIM/HF containers
- Modifying the autoscaling UI component (`ContainerAutoscaling.tsx`)
- Adding BE-side default scaling logic
- Changing behavior for existing containers (only affects new container creation templates)

## Impact

### Code
- **Modified constants**: `src/constants/deployments/containers.tsx` — rename `DEFAULT_SCALING` to `SERVING_SCALING`, add new `DEFAULT_SCALING`
- **Modified utils**: `src/utils/deployments/containers.ts` — refactor `getContainerTemplate` into composition of `getContainerScaling`, `getContainerResources`, `getContainerSource` helpers
- **Modified tests**: `src/utils/deployments/tests/containers.spec.ts` — update template tests, add tests for extracted helpers

### Risk
- Low. Only affects the template used for new container creation. Existing containers are untouched. The autoscaling UI already handles min:0 + scaleToZeroDelaySeconds correctly.
