## Why

The Container model currently uses a flat `imageDefinitionId` field for MCP, Adapter, and Interceptor containers, while Model Servings (NIM/HF) use a separate `SERVING_SOURCE` discriminated union. The backend is unifying all deployment source handling into a single `source` JSON column with a sealed `Source` interface hierarchy (PR #182). The frontend needs to align with this new API contract by introducing a universal `ContainerSource` type that supports both internal image definitions and direct Docker image references across all container types.

## What Changes

- **Introduce universal `ContainerSource` flat type**: A single type with `$type` field and all source-specific fields as optional (`imageDefinitionId`, `imageReference`, `imageRef`, `modelName`)
- **Replace `imageDefinitionId` with `source` field** on the Container model for MCP, Adapter, and Interceptor containers
- **Unify `SERVING_SOURCE` into the new `ContainerSource` type** so NIM and HF containers use the same type
- **Update container creation/edit forms** to use `source` field with direct property access
- **Update utilities** to work with the new `source` field instead of `imageDefinitionId`
- **BREAKING**: Remove `imageDefinitionId` as a top-level Container field; it moves inside `source`

## Non-goals

- Changes to the Image (image definition) model itself
- Changes to the `SOURCE_FIELD` type used by Models/Adapters/Interceptors to reference containers/runners/endpoints
- Backend API changes (handled separately in BE PR #182)
- UI implementation for Docker image reference source type (model-only)
- Changes to the server API layer (`server/deployments/containers.ts`)

## Capabilities

### New Capabilities
- `unified-container-source`: Universal `ContainerSource` flat type that replaces both `imageDefinitionId` and `SERVING_SOURCE`, supporting `internal_image`, `image_reference`, `ngc_registry`, and `huggingface` source types via `CONTAINER_SOURCE_TYPE` enum

### Modified Capabilities

## Impact

- **Types**: `containers.ts` types — new `ContainerSource` type and `CONTAINER_SOURCE_TYPE` enum, removal of `SERVING_SOURCE`, `MODEL_SOURCE_TYPE`, `InternalImageSource`, `NgcRegistrySource`, `HuggingFaceSource`, `ImageReferenceSource`
- **Models**: `Container` and `ContainerRedeploySnapshot` interfaces in `models/deployments/containers.ts`
- **Components**: `ContainerCreate.tsx`, `ImageCreateContainer.tsx`, `ImageAddContainer.tsx`, `ContainerSource.tsx`, `HFModelNameField.tsx`, `ContainerFields.tsx`, `Port.tsx`, `TabsContent.tsx`, container detail page.tsx files, `Delete/utils.ts`
- **Utils**: `utils/deployments/containers.ts` — template and snapshot functions
- **Grid**: `grid-columns.tsx` — valueGetter for source-based column access
