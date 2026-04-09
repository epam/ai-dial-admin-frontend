## Context

The `Containers` component (`src/components/SourceField/Containers/Containers.tsx`) fetches all containers and immediately filters to `status === 'running'`. This means `selectedContainer` resolves to null when the entity's linked container is stopped, and the `DialInputPopup` shows "No Containers" instead of the container's name.

The component has two render paths:
- **Modal mode** (creation): `DialSelectField` dropdown — no existing `containerId`, always picks from running containers. No change needed.
- **Non-modal mode** (edit view): `DialInputPopup` for display + `SelectContainerModal` for selection. These are already decoupled — the input shows `selectedContainer?.displayName`, the modal receives the `containers` array as options.

## Goals / Non-Goals

**Goals:**
- Show the stopped container's display name in the `DialInputPopup` input in the edit view
- Keep the `SelectContainerModal` offering only running containers for selection

**Non-Goals:**
- No status indicators, warnings, or error styling on the container field
- No backend changes (save rejection for stopped containers is a separate concern)
- No changes to the modal (creation) flow
- No changes to business logic (container filtering, selectedContainer resolution, validation)

## Decisions

### Cache display name from the full API response before filtering

**Decision**: Add a `currentContainerDisplayName` state. In the `fetchContainers` effect, before filtering to running-only, find the container matching `entity.source?.containerId` and save its `displayName`. Use this as a fallback in the `DialInputPopup`'s `selectedValue` prop.

**Why over alternatives:**
- *Alternative: Store full `allContainers` list and resolve `selectedContainer` from it* — Changes business logic unnecessarily. Affects `selectedContainerName` memo (used by modal mode) and `selectedContainer` resolution (used by Endpoints section and Open button). Too much coupling for a display-only fix.
- *Alternative: Show `containerId` as fallback* — Works but shows a technical ID instead of a human-readable name. The display name is already available in the fetch response.

### No changes to modal mode or business logic

**Decision**: Only the `DialInputPopup`'s `selectedValue` prop gains a fallback. All state (`containers`, `selectedContainer`, `selectedContainerName`), filtering, validation, and the modal path remain identical.

## Risks / Trade-offs

- **[Container deleted from API]** → If the container is completely removed (not returned by API at all), `currentContainerDisplayName` stays undefined and the input falls back to `emptyValueText` ("No Containers") as before.
- **[DialInputPopup is stateless]** → Verified: the component derives display directly from props with no internal state caching. When `currentContainerDisplayName` is set after the async fetch, the re-render correctly updates the displayed value.
