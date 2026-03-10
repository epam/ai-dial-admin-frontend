## 1. Type Definitions

- [x] 1.1 Add `CONTAINER_SOURCE_TYPE` enum with values `internal_image`, `image_reference`, `ngc_registry`, `huggingface` to `apps/ai-dial-admin/src/types/deployments/containers.ts`
- [x] 1.2 Add flat `ContainerSource` type with `$type: CONTAINER_SOURCE_TYPE` and optional fields `imageDefinitionId`, `imageReference`, `imageRef`, `modelName` to `apps/ai-dial-admin/src/types/deployments/containers.ts`
- [x] 1.3 Remove `SERVING_SOURCE` type and `MODEL_SOURCE_TYPE` enum from `apps/ai-dial-admin/src/types/deployments/containers.ts`

## 2. Model Updates

- [x] 2.1 Update `Container` interface in `apps/ai-dial-admin/src/models/deployments/containers.ts`: remove `imageDefinitionId: string`, change `source?: SERVING_SOURCE` to `source: ContainerSource`
- [x] 2.2 Update `ContainerRedeploySnapshot` interface: replace `imageDefinitionId: string` with `source: ContainerSource`

## 3. Utility Updates

- [x] 3.1 Update `getContainerTemplate` in `apps/ai-dial-admin/src/utils/deployments/containers.ts` to initialize `source` with appropriate `$type` per container type instead of `imageDefinitionId`
- [x] 3.2 Update `getContainerRedeploySnapshot` to use `source` field instead of `imageDefinitionId`

## 4. Component Updates — Container Creation

- [x] 4.1 Update `ContainerCreate.tsx`: replace all `imageDefinitionId` references with `source.imageDefinitionId` direct access, use spread pattern `{ ...container.source, imageDefinitionId: id }` in callbacks
- [x] 4.2 Update `ImageCreateContainer.tsx`: same migration from `imageDefinitionId` to `source` field with spread pattern
- [x] 4.3 Update `ImageAddContainer.tsx`: replace `(container.source as InternalImageSource).imageDefinitionId` with `container.source.imageDefinitionId`

## 5. Component Updates — Fields & Views

- [x] 5.1 Update `ContainerFields.tsx`: replace `MODEL_SOURCE_TYPE` references with `CONTAINER_SOURCE_TYPE`
- [x] 5.2 Update `ContainerSource.tsx`: replace `NgcRegistrySource` cast with direct `container.source` access, remove intermediate `source` variable
- [x] 5.3 Update `HFModelNameField.tsx`: replace `HuggingFaceSource` cast with direct `container.source` access, remove intermediate `source` variable
- [x] 5.4 Update `Port.tsx`: replace `MODEL_SOURCE_TYPE.NIM` with `CONTAINER_SOURCE_TYPE.NGC_REGISTRY`
- [x] 5.5 Update `TabsContent.tsx`: replace `InternalImageSource` cast with spread pattern in `onApply` callback

## 6. Page & Grid Updates

- [x] 6.1 Update `mcp-containers/[id]/page.tsx`, `adapter-containers/[id]/page.tsx`, `interceptor-containers/[id]/page.tsx`: replace `(container?.source as InternalImageSource).imageDefinitionId` with `container?.source.imageDefinitionId as string`
- [x] 6.2 Update `grid-columns.tsx`: replace `field: 'imageDefinitionId'` with `valueGetter` using `params.data?.source?.imageDefinitionId`
- [x] 6.3 Update `Delete/utils.ts`: replace `InternalImageSource` cast with direct `source.imageDefinitionId` access

## 7. Testing & Validation

- [x] 7.1 Update unit tests: replace `imageDefinitionId: 'img-1'` in mock containers with `source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' }` across all test files
- [x] 7.2 Run full lint, format, and test suite (`nx lint ai-dial-admin`, `nx test ai-dial-admin`)
- [x] 7.3 Verify TypeScript compilation passes with no errors (`nx build ai-dial-admin`)
