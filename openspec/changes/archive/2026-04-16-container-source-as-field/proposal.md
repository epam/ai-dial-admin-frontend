## Why

The container Properties view currently splits source information across two places: for `INTERNAL_IMAGE` containers, the image reference lives in the **info header** as a labelled prefix (`MCP Image: Github (1.2.1)` with an expand icon opening `ContainerChangeImage`), while all other source types (`IMAGE_REFERENCE`, `NGC_REGISTRY`, `HUGGINGFACE`) render inside the form body via `ContainerSource`. This inconsistency makes the header row coupled to a single source variant and leaves users without a clear "source type" indicator for the container. Unifying the layout — source as a form field for every `$type`, source type as a read-only label in the info header — brings containers in line with other entities (Adapters, Toolsets, Models) where "Source type" is already a first-class property separate from the source value.

## What Changes

- **Add** a read-only `Source type` `DialLabelledText` in the container info header, driven by `container.source?.$type`, applied to all container routes (`mcp-containers`, `adapter-containers`, `interceptor-containers`, `model-servings`).
- **Remove** the `MCP Image / Adapter Image / Interceptor Image` labelled button from the info header prefix (currently wired in `Containers/View/TabsContent.tsx`).
- **Add** a new `INTERNAL_IMAGE` branch to `Deployments/Fields/ContainerSource.tsx` that renders the image name and version as a read-only `DialInput` with an expand icon suffix which opens the existing `ContainerChangeImage` modal.
- **Unconditionally render** `<ContainerSource>` inside `ContainerFields.tsx` for all routes and all `$type` values — remove the current `route === ModelServings || $type === IMAGE_REFERENCE` gate.
- **Thread** the `image` prop from `ContainerView` through `ContainerFields` to `ContainerSource` so the internal-image branch can display the image name/version and open the change-image modal.
- **Move** `ContainerChangeImage` modal ownership out of `TabsContent.tsx` and into the new field (or keep it in `ContainerView` with a lifted handler) so the expand icon inside the form field is the single entry point.
- **i18n**: reuse `EntityFieldsI18nKey.InternalImage` (`'Internal {type} Image'`) for the header label when `$type === INTERNAL_IMAGE`. Add new keys for the other three `$type` values' header labels (`IMAGE_REFERENCE`, `NGC_REGISTRY`, `HUGGINGFACE`). Reuse `ContainersI18nKey.ContainerImage` (`'{type} Image'`) for the new form-field label.

## Non-goals

- No change to the `Container` data model or the `ContainerSource` type — this is a pure UI layout change building on the already-archived `unified-container-source` capability.
- No change to `ContainerChangeImage` modal behavior (open/close/apply wiring stays the same; only its trigger moves).
- No change to the `ReadonlyId` / `ContainersHeader` row — the ID stays separate from the info header row. Unifying those rows is out of scope.
- No reordering of `Update time` / `Create time` in the info header (the attached mock flipped them, but we keep the existing `updatedAt → createdAt` order used by `EntityInfoHeader`). Flagging for a future UX decision if needed.
- No change to the container list/grid column definitions or to the Image view.

## Capabilities

### New Capabilities
- `container-source-field-layout`: Defines the unified layout where the container source value is rendered as a form field for every source type, and the source type is surfaced as a read-only label in the Properties tab info header.

### Modified Capabilities

_(none — existing `unified-container-source` and `change-image-button` specs remain valid; the change-image button retains its semantics, only its location changes, which is covered by the new capability.)_

## Impact

- **Components**:
  - `apps/ai-dial-admin/src/components/Containers/View/TabsContent.tsx` — remove image-in-prefix, add source-type-in-prefix, drop local modal state.
  - `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx` — pass `image` into `ContainerFields` (and lift modal state if we don't co-locate it in the field).
  - `apps/ai-dial-admin/src/components/Containers/Fields/ContainerFields.tsx` — render `ContainerSource` unconditionally, thread `image`.
  - `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource.tsx` — add `INTERNAL_IMAGE` case rendering read-only input + expand icon; accept `image` prop.
  - Possibly new: `Deployments/Fields/ContainerSource/InternalImageField.tsx` for the new branch (to keep `ContainerSource` lean, per project rule on small focused components).
  - `apps/ai-dial-admin/src/components/Containers/View/Properties/Properties.tsx` — prop threading for `image`.
- **i18n**:
  - `apps/ai-dial-admin/src/locales/en.ts` — add three new keys for `IMAGE_REFERENCE` / `NGC_REGISTRY` / `HUGGINGFACE` display labels used by the Source type label.
  - `apps/ai-dial-admin/src/constants/i18n.ts` — register the new keys under an existing or new i18n key enum.
- **Tests**:
  - Update `Containers/View/tests/*` to reflect the new header content.
  - Add a spec for the new `INTERNAL_IMAGE` branch in `Deployments/Fields/tests/ContainerSource.spec.tsx`.
- **Routes affected**: `/[lang]/mcp-containers/[id]`, `/[lang]/adapter-containers/[id]`, `/[lang]/interceptor-containers/[id]`, and Model Servings container detail routes — all four visually gain the new `Source type` header and form-level source field.
- **No backend / API / server-action changes.**
