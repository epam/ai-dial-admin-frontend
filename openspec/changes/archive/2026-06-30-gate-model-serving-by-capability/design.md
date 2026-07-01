## Context

Creating a Model from a Model-Serving container only validated that a container was selected (`isValidSourceField` → `!!source.containerId`). Nothing checked whether the container's model can serve chat/completions, so incompatible containers produced silently-broken models (#1994, #2502).

Merged BE PR #377 (spec `024-model-serving-capability`) adds a read-only `inferenceTask` field to inference deployments. Verified wire contract:

- Discriminator `$type: "inference"` (FE: `CONTAINER_TYPE.HF = 'inference'`).
- `inferenceTask` enum values: `TEXT_GENERATION`, `TEXT_CLASSIFICATION`, `NONE`; never null on inference deployments; present **only** on inference (`InferenceDeploymentDto`), absent on NIM/MCP/etc.
- Returned by both `GET /deployments/{id}` and `GET /deployments` (the FE already lists via `?type=NIM,INFERENCE`).
- BE FR-006: the value carries no endpoint/path — the frontend owns the mapping to a consumption surface.

Two FE surfaces consume containers for model creation:
1. **Source picker** — Models create modal → source "Model Serving" → `SourceField/Containers/Containers.tsx` (fetches `getModelContainers`, filters `status === 'running'`).
2. **Container detail page** — `/model-servings/[id]` → `ContainerView` → `ContainersButtonsWrapper` renders a "Create model" button when the container is running; `getEntityTemplate` builds the initial entity.

## Goals / Non-Goals

**Goals:**
- Map `inferenceTask` to a consumption surface entirely on the FE.
- Stop incompatible containers from producing broken models (the reported bugs).
- Let a single Model-Serving container page create either a Model (`TEXT_GENERATION`) or an MCP Toolset (`TEXT_CLASSIFICATION`).
- Preserve current behavior for NIM and for the External-Endpoint source.

**Non-Goals:**
- No changes to the External-Endpoint source or embeddings creation.
- No new FE API endpoints or server actions for capability (reuse the existing deployments fetch).
- Not proving end-to-end MCP routing of a classification deployment — the FE fills a fixed template; whether DIAL core serves it is a backend concern.
- No backfill handling on the FE — the BE migration backfills `inferenceTask` for existing rows.

## Decisions

**Gate on an explicit value only; treat absent as "allowed".**
Rule: block/filter only when `inferenceTask` is explicitly `NONE` or `TEXT_CLASSIFICATION` (for the model path). `undefined` means non-inference (NIM) and keeps today's behavior. This avoids regressing NIM model-servings, which never carry the field. Inference is never null, so there is no ambiguity for inference containers.

**Model the field as an enum, not a string union.**
Add `INFERENCE_TASK` enum in `types/deployments/containers.ts` (values `text_generation`/`text_classification`/`none`, matching the backend wire format) and `inferenceTask?: INFERENCE_TASK` on `Container`. Follows the repo enum-over-union standard.

**Filter at the picker, not in `isValidSourceField`.**
Excluding incompatible containers from the list (`Containers.tsx`, alongside the `status === 'running'` filter) is simpler and clearer than adding capability logic to validation, and means the user can't select an invalid option in the first place. Validation stays as-is.

**Branch the create button on the detail page by `inferenceTask`.**
`ContainersButtonsWrapper` already branches per route (MCP shows a toolset dropdown, others a single button). Extend the Model-Serving case to pick the action/label/route from `inferenceTask`, and wire `createToolset` onto `model-servings/[id]/page.tsx` so the toolset branch has an action. `getEntityTemplate` gains a toolset branch for a classification container.

**Hardcode the MCP toolset template.**
Per BE FR-006 the inference container exposes no transport/path. For the `TEXT_CLASSIFICATION` → toolset case, fill a fixed template: `source = { $type: CONTAINER, containerId }`, `source.mcpEndpointPath = '/mcp'`, `transport = ToolsetTransport.HTTP` (streamable HTTP = MCP). This mirrors the shape an MCP-container toolset uses (`source.containerId` + transport), with constants standing in for the fields the inference DTO does not provide.

## Risks / Trade-offs

- **Pre-feature rows read as `NONE`** → BE migration backfills `inference_task` for existing deployments (commit present in merged PR), so old text-generation containers recover their capability without FE special-casing.
- **Classification toolset may not route end-to-end** → out of FE scope; the FE only pre-fills the agreed template. If DIAL core does not yet serve a classification deployment over MCP, the toolset is created but may not function until the backend supports it. Flagged, not blocked.
- **BE could later add the field to other types** → the FE keys off the explicit value, so a future NIM `inferenceTask` would automatically participate; acceptable and arguably desirable.
- **Transport enum has no literal "MCP"** → streamable HTTP (`ToolsetTransport.HTTP`) is MCP's transport; documented so the hardcoded choice is not mistaken for a bug.

## Migration Plan

Additive FE change, no data migration. Depends on merged BE PR #377 already deployed. Rollback is a straight revert; with the field absent the gating simply never triggers (everything reverts to current behavior).

## Open Questions

None blocking. End-to-end MCP serving of a classification deployment is tracked as a backend concern, not a precondition for this FE change.
