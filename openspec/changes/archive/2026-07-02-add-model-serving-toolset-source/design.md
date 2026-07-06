## Context

The backend now accepts a `text_classification` Model Serving (inference) container as a toolset container source. The FE toolset source flow was built MCP-only. Two things must change: the **selection** flow (picking a container when creating a toolset from the Toolsets list) and the **display/navigation** of an existing container-source toolset.

Key constraint from the code: the source-type picker (`SourceField`) is rendered **only during creation** (`DeploymentProperties` renders it when `!initialValues`). The toolset detail page shows the source read-only (banner + formatter). So the two source options mainly need to behave at creation time; existing toolsets are handled by read-only display + type-aware navigation.

## Key decision 1 — two source items that both persist as `$type: CONTAINER`

The backend toolset source discriminator is `CONTAINER` for **both** MCP and Model Serving. So "MCP Container" and "Model Serving" cannot be distinguished by `source.$type`.

**Precedent to follow: `CODE_APP_SOURCE_TYPE`.** The Applications flow already has a FE-only selector value that is its own dropdown item, is intercepted in `onChangeSource`, is detected on load via `isCodeAppSource`, and persists as a real backend type. Model Serving mirrors this:

```
TOOLSET_SOURCE_ITEMS (new):
  External Endpoint    → SOURCE_TYPE.ENDPOINTS
  MCP Container        → SOURCE_TYPE.CONTAINER          (mcp list)
  Model Serving        → MODEL_SERVING_SOURCE_TYPE      (FE-only; text-classification inference list)
  MCP Registry         → SOURCE_TYPE.MCP_REGISTRY
```

- Both container items render the `<Containers>` picker and both save `source.$type = CONTAINER`.
- They differ only by which client-side filter is applied to the fetched list.

**Selected-item state.** `SourceField` derives its `source` state from `entity.source.$type`. Since both items map to `CONTAINER`, that derivation would collapse Model Serving back to MCP Container on re-render. Fix: treat both as a **container family** and let the local selected item win while it is a container item — i.e. when `entity.source.$type === CONTAINER`, keep the currently selected container-family item instead of forcing it to `CONTAINER`. During creation the selected item is the source of truth. For an already-saved toolset shown read-only, the displayed item/label is resolved by looking up the referenced container's real type (see decision 3).

**Why not one generic "Container" item?** The user asked for two explicit items so the intent (MCP vs Model Serving) is chosen up front and each list is scoped. It also keeps each list short and unambiguous.

## Key decision 2 — new fetch, keep `getMCPContainers` intact

`getMCPContainers` (`?type=MCP`) is used by export-config and the mcp-containers page, which legitimately want MCP-only. Do **not** widen it.

Add `getToolsetContainers()` → `?type=MCP,INFERENCE`. The toolset flow fetches both types once and filters client-side:

```
isToolsetCapableContainer(c):
  c.$type === CONTAINER_TYPE.MCP
  OR (c.$type === CONTAINER_TYPE.HF /* 'inference' */ && c.inferenceTask === INFERENCE_TASK.TEXT_CLASSIFICATION)

per-item picker filter:
  MCP Container item   → c.$type === CONTAINER_TYPE.MCP
  Model Serving item   → c.$type === CONTAINER_TYPE.HF && c.inferenceTask === TEXT_CLASSIFICATION
```

`isToolsetCapableContainer` mirrors the existing `isModelCapableContainer` (which excludes `TEXT_CLASSIFICATION` and `NONE`) — this is its inverse-ish complement for toolsets. NIM containers carry no `text_classification` task, so they are naturally excluded.

Call sites moved onto `getToolsetContainers`: the toolset source picker (`DeploymentProperties`) and `getContainersByView(Toolsets)` (used by the detail-page banner). Everything else keeps `getMCPContainers`.

## Key decision 3 — route by the container's real type (the "honest route" fix)

`getContainerRoute(view)` keys off the toolset *view* and defaults to `McpContainers`. That is the shortcut trap: a Model Serving source would still link to `/mcp-containers/[id]`. Instead resolve the route from the **container object's real type**:

```
container.$type === mcp        → /mcp-containers/[id]
container.$type === inference  → /model-servings/[id]
(nim)                          → /model-servings/[id]
```

Both the `<Containers>` picker Open button and `ContainerStatusBanner` already fetch the container list and locate the selected container object — so they have `$type`/`inferenceTask` available and can pick the route from it. This keeps the route honest to what the container actually is rather than piggybacking on the toolset view.

## Alternatives considered

- **Widen `getMCPContainers` to `MCP,INFERENCE`.** Rejected: it is shared with MCP-only call sites; widening it would leak Model Serving containers into the mcp-containers page and export flow.
- **Single generic "Container" item.** Rejected per the chosen UX (two explicit items).
- **A new backend `$type` for the model-serving source.** Out of scope and unnecessary — the backend models it as a `ToolSetContainerSource` (`CONTAINER`); the MCP-vs-Model-Serving distinction is a FE presentation concern resolved by the container's type.

## Risks

- **Load-time item detection** for an existing container-source toolset depends on looking the container up in the fetched list (containerId → container). If the container has been deleted, the label falls back to a sensible default (MCP Container) and navigation is best-effort. Acceptable — mirrors current behavior where a missing container hides the banner.
- The `Containers` component gains toolset-specific filtering. Keep it minimal and parameterized (active item / view) rather than sprinkling route checks.
