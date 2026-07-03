## Why

A toolset can now be created from a **text-classification Model Serving** container, not just an MCP container — the backend change (admin-backend PR #1079 + deployment-manager PR #383) allows a `text_classification` inference deployment as a toolset container source. But the frontend still assumes MCP-only:

- The toolset source picker lists MCP containers only (`getMCPContainers` → `?type=MCP`), so a Model Serving container can never be chosen from the Toolsets list.
- The single "MCP Container" source option and the detail-page "MCP Container" label are inaccurate once the source is a Model Serving container.
- On a toolset detail page the "Go to container" button always links to `/mcp-containers/[id]`, sending the user to the wrong page for a Model Serving source.

Creating a toolset *from* the Model Serving container page already works (header button prefills the source) — this change covers the two remaining gaps: **picking** a Model Serving container as a toolset source, and **displaying/navigating** an existing one correctly.

## What Changes

- Add a second toolset source option **Model Serving** alongside **MCP Container**. It is a FE-only selector value (following the existing `CODE_APP_SOURCE_TYPE` pattern) that still persists as a `CONTAINER` source — the two items differ only in which container list they show.
- Add a new server action `getToolsetContainers()` (`?type=MCP,INFERENCE`) used by the toolset flow. `getMCPContainers` is left untouched — it stays `?type=MCP` for its other call sites (export-config, mcp-containers page).
- Filter the fetched list **client-side** per selected item: **MCP Container** → `$type === mcp`; **Model Serving** → `$type === inference && inferenceTask === text_classification`. Mirrors the existing `isModelCapableContainer` helper used by Models.
- Resolve the "Go to container" route from the **container's real type**, not the toolset view: a Model Serving source links to `/model-servings/[id]`, an MCP source to `/mcp-containers/[id]`. Applies to both the picker's Open button and the detail-page container-status banner.
- Point `getContainersByView(Toolsets)` at `getToolsetContainers` so the detail-page banner can find a Model Serving source (otherwise the "container not running" banner never appears for it).

## Capabilities

### New Capabilities
- `add-model-serving-toolset-source`: A toolset can be created from and correctly display a text-classification Model Serving container as its container source, in addition to an MCP container — via a distinct source option, a client-filtered container list, and type-aware navigation.

### Modified Capabilities
<!-- None — no existing capability spec's requirements change. getMCPContainers behavior is preserved. -->

## Impact

- **New code:**
  - `app/actions/deployments.ts` — `getToolsetContainers()` server action
  - `server/deployments/containers.ts` — `getToolsetContainers` (`?type=MCP,INFERENCE`)
  - `components/SourceField/` — `MODEL_SERVING_SOURCE_TYPE` FE-only selector const; `isToolsetCapableContainer` / per-item container filter; a container-type → route helper
- **Modified code:**
  - `components/SourceField/constants.ts` — add the **Model Serving** item to `TOOLSET_SOURCE_ITEMS`; `getSourceItems` gating for the new item
  - `components/SourceField/SourceField.tsx` — treat MCP-Container and Model-Serving as container-family (render the picker for both; keep the selected item across re-render; both persist `source.$type = CONTAINER`)
  - `components/SourceField/Containers/Containers.tsx` — filter the fetched list by the active item; route the Open button by container type
  - `components/EntityMainProperties/Properties/DeploymentProperties.tsx` — use `getToolsetContainers` for the toolset picker
  - `utils/deployments/containers.ts` — `getContainersByView(Toolsets)` → `getToolsetContainers`
  - `components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner.tsx` — route + banner label by the found container's real type
  - Source-item labels are hardcoded strings (existing convention) — no i18n key added
- **External dependency:** backend already merged/open — admin-backend PR #1079 and deployment-manager PR #383. This FE change is only useful once those ship (they gate whether the backend accepts/returns the source).

## Non-goals

- No change to creating a toolset *from* the Model Serving container page (already works via the header button).
- No change to `getMCPContainers` or its non-toolset call sites (export-config, mcp-containers page).
- No support for `text_generation` / `none` inference or NIM containers as toolset sources — only `text_classification`.
- No backend changes (shipped separately).
- No change to the read-only toolset **list grid** source-type label: `sourceTypeFormatter` receives only `source` (a `containerId`), not the container's `$type`, and a synchronous `valueFormatter` cannot look the container up — so that column keeps showing "MCP Container". The user-facing MCP-vs-Model-Serving distinction is delivered by the creation picker (correct option) and the type-correct "Go to container" navigation.
