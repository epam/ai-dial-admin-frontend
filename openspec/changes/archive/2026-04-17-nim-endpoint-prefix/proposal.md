## Why

Backend changed the expected completion endpoint prefix for NIM model servings from `openai/v1` to `v1`. The admin UI currently hardcodes `openai/v1` for every Model Serving container, so any model created from a NIM container receives a wrong path and inference calls fail until a user edits the endpoint manually.

## What Changes

- Add a `getEndpointPrefix(containerType)` helper alongside the existing `getEndpointPostfix` in `utils/models/model-endpoint.ts`. It returns `v1` for `CONTAINER_TYPE.NIM` and keeps `openai/v1` for all other container types (today: HF / inference).
- Use the helper in both places that seed `source.completionEndpointPath` when a Model is created or a source container is picked:
  - `utils/deployments/entity.ts:getEntityTemplate` — template built from the "Create model from Model Serving" flow.
  - `components/SourceField/Containers/Containers.tsx:onSelect` — container picked inside the source field for the Models view. Look up the container from local state to read `$type`.
- Update affected tests: `utils/deployments/tests/entity.spec.ts` splits into NIM vs non-NIM cases, and `components/SourceField/Containers/Containers.spec.tsx` asserts the prefix applied on select per container type.

## Capabilities

### New Capabilities
- `model-endpoint-prefix`: Rules for how the Model Serving source container's `$type` maps to the completion endpoint path prefix when a model is created or re-sourced.

### Modified Capabilities

(none — existing specs do not cover this behavior)

## Impact

- Code
  - `apps/ai-dial-admin/src/utils/models/model-endpoint.ts` (+helper)
  - `apps/ai-dial-admin/src/utils/deployments/entity.ts` (prefix call site)
  - `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.tsx` (prefix call site)
- Tests
  - `apps/ai-dial-admin/src/utils/deployments/tests/entity.spec.ts`
  - `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.spec.tsx`
- Behavior
  - Newly created models from NIM servings get `v1/chat/completions` / `v1/embeddings`.
  - Existing persisted models keep whatever is on the backend; edit flows do not rewrite the path (backend handles any historical migration separately).
  - HF / non-NIM servings are unchanged (`openai/v1/...`).

## Non-goals

- Migrating or rewriting the `completionEndpointPath` of already-saved models.
- Supporting per-container-type prefixes beyond NIM today (the helper is shaped to extend, but only NIM needs a different value now).
- Changing backend behavior or the container `$type` source of truth.
