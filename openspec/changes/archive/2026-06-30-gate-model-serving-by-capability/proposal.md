## Why

A user can create a Model from a Model-Serving container whose underlying model cannot serve chat/completions. The form only checks that a container is selected, so creation "succeeds" and silently produces a non-working model (issues #1994 and #2502).

The deployment-manager backend now tells us what a container exposes. Merged BE PR #377 (spec `024-model-serving-capability`) adds a read-only `inferenceTask` field to inference deployments with values `TEXT_GENERATION`, `TEXT_CLASSIFICATION`, or `NONE`. The frontend owns the mapping from this capability to a consumption surface, so we can now gate creation correctly.

## What Changes

- Model the new backend field on the FE: a new `INFERENCE_TASK` enum and an optional `inferenceTask` on the `Container` model. The field is present only on inference containers (`$type: "inference"`); NIM and other types omit it.
- **Filter the Model-Serving source picker**: in the Models create flow, drop containers whose `inferenceTask` is an explicit `NONE` or `TEXT_CLASSIFICATION`. Containers without the field (NIM) are unaffected.
- **Branch the "Create" action on the Model-Serving container detail page** (`/model-servings/[id]`) by `inferenceTask`:
  - `TEXT_GENERATION` → "Create model" (existing `createModel`, chat-completions endpoint as today).
  - `TEXT_CLASSIFICATION` → "Create toolset" (`createToolset`), with a hardcoded MCP template: `transport = HTTP` (streamable), `source.mcpEndpointPath = '/mcp'`, `source = { $type: CONTAINER, containerId }`.
  - `NONE` → no create button.
  - field absent (NIM) → unchanged behavior.
- Wire the `createToolset` action and toolset template onto the Model-Serving container page so a single page can create either a Model or an MCP Toolset.

## Capabilities

### New Capabilities
- `model-serving-capability-gating`: Gates Model-Serving entity creation by the container's backend-detected `inferenceTask`, mapping `TEXT_GENERATION` → chat-completion Model, `TEXT_CLASSIFICATION` → MCP Toolset, and `NONE`/incompatible → blocked, both in the Models source picker and on the container detail page.

### Modified Capabilities
<!-- No existing spec's requirements change; gating is additive on top of current container-source behavior. -->

## Impact

- **Models**: `models/deployments/containers.ts` (add `inferenceTask`), `types/deployments/containers.ts` (new `INFERENCE_TASK` enum).
- **Source picker**: `components/SourceField/Containers/Containers.tsx` (filter list alongside the existing `status === 'running'` filter).
- **Container detail create flow**: `components/EntityHeaderControls/Wrappers/ContainersButtonsWrapper.tsx` (branch button by task), `app/[lang]/model-servings/[id]/page.tsx` (wire `createToolset` + toolset names), `utils/deployments/entity.ts` (`getEntityTemplate` toolset branch with hardcoded MCP fields).
- **i18n**: new label(s) for the "Create toolset" action where the Model-Serving page can produce a toolset.
- **External**: depends on merged BE PR #377; no FE API/endpoint changes (uses existing `GET /deployments?type=NIM,INFERENCE`). External-Endpoint source (including embeddings) is untouched.
