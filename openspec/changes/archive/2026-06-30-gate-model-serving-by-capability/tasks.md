## 1. Model the backend capability field

- [x] 1.1 Add `INFERENCE_TASK` enum (`TEXT_GENERATION` / `TEXT_CLASSIFICATION` / `NONE`, string values = enum names) to `src/types/deployments/containers.ts`
- [x] 1.2 Add optional `inferenceTask?: INFERENCE_TASK` to the `Container` interface in `src/models/deployments/containers.ts`

## 2. Filter the Model-Serving source picker

- [x] 2.1 In `src/components/SourceField/Containers/Containers.tsx`, extend the fetch filter (currently `status === 'running'`) to also exclude containers whose `inferenceTask` is explicitly `NONE` or `TEXT_CLASSIFICATION`; leave containers without the field untouched (added `isModelCapableContainer` helper in `SourceField/utils.ts`, gated to the Models view)
- [x] 2.2 Add/extend unit coverage in `src/components/SourceField/Containers/Containers.spec.tsx` for: text-generation kept, NONE/text-classification hidden, NIM (no field) kept (+ `isModelCapableContainer` unit tests in `SourceField/tests/utils.spec.ts`)

## 3. Branch the container-detail create action by capability

- [x] 3.1 In `src/utils/deployments/entity.ts` `getEntityTemplate`, add a toolset branch for a `TEXT_CLASSIFICATION` Model-Serving container: `source = { $type: CONTAINER, containerId }`, `source.mcpEndpointPath = '/mcp'`, `transport = ToolsetTransport.HTTP`; keep the existing `TEXT_GENERATION` model template (chat-completions endpoint)
- [x] 3.2 In `src/components/EntityHeaderControls/Wrappers/ContainersButtonsWrapper.tsx`, for the Model-Serving route select the create action/label/target route from `container.inferenceTask`: `TEXT_GENERATION` → "Create model", `TEXT_CLASSIFICATION` → "Create toolset", `NONE` → no button, field absent → current "Create model" behavior (threaded `createToolset`/`toolsetNames` through `ContainerView`)
- [x] 3.3 Wire `createToolset` (and toolset `entityNames`) into `src/app/[lang]/model-servings/[id]/page.tsx` so the toolset branch has an action and unique-name list
- [x] 3.4 Add the "Create toolset" i18n label needed on the Model-Serving page — reused existing `CreateI18nKey.CreateEntity` + `EntitiesI18nKey.Toolset`, no new key required

## 4. Tests

- [x] 4.1 Add unit coverage for the `getEntityTemplate` toolset branch (hardcoded transport / `mcpEndpointPath` / source) in `src/utils/deployments/tests/entity.spec.ts`
- [x] 4.2 Add component coverage for the `ContainersButtonsWrapper` capability branching (model vs toolset vs no button vs absent-field) in `src/components/EntityHeaderControls/Wrappers/tests/ContainersButtonsWrapper.spec.tsx`

## 5. Browser verification

- [x] 5.1 Verified the browser-observable scenarios against the live app: picker shows TEXT_GENERATION + NIM and hides TEXT_CLASSIFICATION + NONE; detail page shows Create Model / Create Toolset / no-button respectively; External Endpoint unaffected. Result: 6 pass / 0 fail. The toolset `/mcp` template value isn't rendered in the create modal (carried in form state, submitted on create) — covered by the `entity.spec.ts` unit test instead.

## 6. Quality checks

- [x] 6.1 Run lint, format, and the full test suite from `apps/ai-dial-admin/`; fix any issues (lint: 0 errors; tests: 550 files / 5440 passed)
