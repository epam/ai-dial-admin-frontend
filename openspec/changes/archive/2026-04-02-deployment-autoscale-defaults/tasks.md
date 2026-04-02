## 1. Constants

- [x] 1.1 In `src/constants/deployments/containers.tsx`: rename `DEFAULT_SCALING` to `SERVING_SCALING` (`{ minReplicas: 1, maxReplicas: 1 }`); add new `DEFAULT_SCALING` (`{ minReplicas: 0, maxReplicas: 1, scaleToZeroDelaySeconds: 300 }`); export both

## 2. Helper functions

- [x] 2.1 In `src/utils/deployments/containers.ts`: extract `getContainerScaling(type: CONTAINER_TYPE): Autoscaling` — returns `SERVING_SCALING` for NIM/HF, `DEFAULT_SCALING` otherwise
- [x] 2.2 In `src/utils/deployments/containers.ts`: extract `getContainerResources(type: CONTAINER_TYPE, defaults?: ResourcesDefaults): ContainerResources` — returns CPU + memory + GPU for NIM/HF, CPU + memory for others
- [x] 2.3 In `src/utils/deployments/containers.ts`: extract `getContainerSource(type: CONTAINER_TYPE, sourceType?: CONTAINER_SOURCE_TYPE, options?: ContainerTemplateOptions): ContainerSource` — returns source config based on type/sourceType/options

## 3. Refactor getContainerTemplate

- [x] 3.1 In `src/utils/deployments/containers.ts`: replace the if-chain in `getContainerTemplate` with composition of `getContainerScaling`, `getContainerResources`, `getContainerSource`; inline MCP `transport` and HF `modelFormat` as conditional spreads
- [x] 3.2 Update any imports of `DEFAULT_SCALING` outside of `containers.ts` to use the correct constant (`DEFAULT_SCALING` or `SERVING_SCALING` as appropriate)

## 4. Tests

- [x] 4.1 In `src/utils/deployments/tests/containers.spec.ts`: add unit tests for `getContainerScaling` — returns `SERVING_SCALING` for NIM, HF; returns `DEFAULT_SCALING` for MCP, INTERCEPTOR, ADAPTER
- [x] 4.2 In `src/utils/deployments/tests/containers.spec.ts`: add unit tests for `getContainerResources` — includes GPU for NIM/HF, no GPU for others; uses defaults when provided
- [x] 4.3 In `src/utils/deployments/tests/containers.spec.ts`: add unit tests for `getContainerSource` — correct source type for each container type and source type combination, including MCP registry option
- [x] 4.4 In `src/utils/deployments/tests/containers.spec.ts`: update existing `getContainerTemplate` tests to reflect new scaling defaults and verify composed output for each container type (including Adapter/Interceptor with INTERNAL_IMAGE)

## 5. Quality

- [x] 5.1 Run `npm run lint` and fix any issues
- [x] 5.2 Run `npm run format:write` and commit formatting changes
- [x] 5.3 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass
