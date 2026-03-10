## Context

The Container model currently has two separate mechanisms for referencing images:
- **MCP/Adapter/Interceptor**: Use a flat `imageDefinitionId: string` field on the Container interface
- **Model Servings (NIM/HF)**: Use a `source?: SERVING_SOURCE` field with `$type` discriminator (`ngc_registry` | `huggingface`)

The backend (PR #182) is unifying these into a single `source` JSON column with a sealed `Source` interface hierarchy supporting four types: `internal_image`, `image_reference`, `ngc_registry`, and `huggingface`.

The frontend needs to align with this API contract. Currently, `imageDefinitionId` is used directly in:
- `Container` interface (`models/deployments/containers.ts`)
- `ContainerRedeploySnapshot` interface (`models/deployments/containers.ts`)
- `ContainerCreate.tsx` — image selection sets `container.imageDefinitionId`
- `ImageCreateContainer.tsx` — same pattern
- `containers.ts` utils — `getContainerTemplate` and `getContainerRedeploySnapshot`
- Multiple page.tsx files, grid columns, delete utils

## Goals / Non-Goals

**Goals:**
- Unify all container source references into a single `ContainerSource` type
- Replace `imageDefinitionId` top-level field with a `source: ContainerSource` field
- Merge `SERVING_SOURCE` into the new `ContainerSource` type
- Keep changes minimal — use direct property access, no unnecessary abstractions

**Non-Goals:**
- Changing the Image (image definition) model
- Modifying the `SOURCE_FIELD` type (used by Models/Adapters/Interceptors to reference containers/runners/endpoints)
- Backend API changes (handled in BE PR #182)
- UI implementation for `image_reference` source type (model-only definition)
- Changes to the server API layer (`server/deployments/containers.ts`)

## Decisions

### 1. Single flat `ContainerSource` type replacing both `imageDefinitionId` and `SERVING_SOURCE`

**Choice**: Create a unified flat `ContainerSource` type with `$type` field and all source-specific fields as optional.

```typescript
enum CONTAINER_SOURCE_TYPE {
  INTERNAL_IMAGE = 'internal_image',
  IMAGE_REFERENCE = 'image_reference',
  NGC_REGISTRY = 'ngc_registry',
  HUGGINGFACE = 'huggingface',
}

type ContainerSource = {
  $type: CONTAINER_SOURCE_TYPE;
  imageDefinitionId?: string;
  imageReference?: string;
  imageRef?: string;
  modelName?: string;
};
```

**Rationale**: A flat type with optional fields avoids the need for type narrowing casts (`as InternalImageSource`, etc.) throughout the codebase. Components can directly access `container.source.imageDefinitionId` without casting. The `$type` field is still available for conditional rendering logic.

**Alternative considered**: Discriminated union with separate types per source variant — rejected because it required `as` casts at every access site, adding verbosity without practical benefit since the backend API sends a flat object.

### 2. Remove `imageDefinitionId` from Container interface, keep `source` as required

**Choice**: Remove `imageDefinitionId` from the `Container` interface. The `source` field becomes the single source-of-truth for all container types. Make `source` required (not optional) since every container must have a source.

**Rationale**: Keeping both fields creates ambiguity about which is canonical. The backend is making the same change.

### 3. Remove `SERVING_SOURCE`, `MODEL_SOURCE_TYPE`, and individual source types

**Choice**: Delete `SERVING_SOURCE` type, `MODEL_SOURCE_TYPE` enum, and all individual source types (`InternalImageSource`, `ImageReferenceSource`, `NgcRegistrySource`, `HuggingFaceSource`). Replace with single `ContainerSource` type and `CONTAINER_SOURCE_TYPE` enum.

**Rationale**: Individual types become unnecessary with the flat type approach. A single type eliminates import complexity and casting overhead.

### 4. Direct property access pattern — no helper functions or intermediate variables

**Choice**: Access source fields directly via `container.source.imageDefinitionId`, `container.source?.imageRef`, etc. No helper functions like `getImageDefinitionId()` or intermediate `const source = container.source as X` variables. Use `as string` only where TypeScript requires it for function parameters expecting non-optional strings.

**Rationale**: Keeps the code minimal and close to the original patterns. Helper functions and intermediate variables add indirection without real benefit.

### 5. Spread pattern for source updates in callbacks

**Choice**: When updating source fields in callbacks, use the spread pattern: `{ ...container.source, imageDefinitionId: id }`. Do not reconstruct `$type` — it's preserved via spread since it's immutable after template creation.

**Rationale**: Matches existing codebase patterns, avoids accidental `$type` changes, and is minimal.

### 6. Container templates initialize source with correct `$type`

**Choice**: `getContainerTemplate` sets the appropriate `$type` per container type:
- MCP/Adapter/Interceptor: `{ $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' }`
- NIM: `{ $type: CONTAINER_SOURCE_TYPE.NGC_REGISTRY }`
- HF: `{ $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE }`

### 7. Server API layer left unchanged

**Choice**: `server/deployments/containers.ts` is not modified. The backend API contract change is handled by the backend deployment, and the existing server layer already passes through the `source` field.

## Risks / Trade-offs

- **[Risk] API contract mismatch during rollout** → The backend PR #182 must be deployed before or alongside these frontend changes. If the backend still sends `imageDefinitionId` at the top level, the frontend will break.
  → Mitigation: Coordinate deployment with backend team.

- **[Risk] Optional fields allow invalid combinations** → The flat type allows setting both `imageRef` and `modelName` on the same source object, which is semantically invalid.
  → Mitigation: `$type` is the source of truth for which fields are meaningful. The UI controls which fields are editable based on `$type`. Runtime validation is not needed for an internal admin tool.

- **[Trade-off] Breaking change for any external consumers** → `imageDefinitionId` removal is breaking, but this is an internal admin tool with no external API consumers.
