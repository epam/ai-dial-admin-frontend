## Why

Two existing top-of-view banners — the `entity-container-status-banner` (Models / Applications / Toolsets / Interceptors when the source container is not running) and the `image-not-installed` banner (Container detail view when the referenced image is not installed or its build failed) — already explain *what* is wrong, but the user has no inline visual cue tying the warning to the specific form field that needs attention. When the page is scrolled, the banner is out of view; when there are multiple fields on the screen, the user has to read to figure out which one is broken.

The `@epam/ai-dial-ui-kit` package recently added an `iconBefore?: ReactNode` slot to `DialInputPopup`, which removes the previous ui-kit gap that blocked inline warning decoration. We can now light up a yellow warning triangle inside the affected field with a short tooltip — making the connection between banner and field visually obvious without duplicating the banner's full sentence.

This was explicitly deferred in the archived `entity-container-status-banner` change (proposal "Non-goals" item: "Not adding a warning triangle next to the Container field's value … `DialInputPopup` only supports `errorText`/`invalid`"). That blocker is now gone.

## What Changes

- **Generalize and move** `components/UpstreamEndpoints/Endpoint/WarningIcon.tsx` → `components/Common/WarningIcon/WarningIcon.tsx`. Rename the `endpointWarning?: string` prop to `warningText?: string` (no behavioral change — when truthy, the icon and its tooltip render; when falsy, nothing renders). Move the colocated test alongside.
- **Update the existing consumer** `UpstreamEndpoints/Endpoint/Endpoint.tsx` to import from the new location and pass `warningText={endpointWarning}`.
- **Decorate the Container source field** in `components/SourceField/Containers/Containers.tsx`:
  - Stop discarding the unfiltered container list. Keep the saved container reference (any status) alongside the dropdown's running-only list.
  - Pass `iconBefore={<WarningIcon warningText={...} />}` to `DialInputPopup` when the saved container is found in the unfiltered list and `status !== 'running'`. Tooltip text comes from a new short i18n key `ContainersI18nKey.ContainerNotRunningTooltip` ("Container is not running").
  - The non-modal popup branch is the only target — the modal create-flow uses `DialSelectField` and only ever offers running containers, so the icon is structurally impossible there.
- **Decorate the Container image field** in `components/Deployments/Fields/ContainerSource/InternalImageField.tsx`:
  - Pass `iconBefore={<WarningIcon warningText={...} />}` to `DialInputPopup` when the linked image is in a problematic state.
  - Tooltip text picks between two short keys based on `image.buildStatus`:
    - `IMAGE_STATUS.BUILD_FAILED` → `ContainersI18nKey.ImageBuildFailedTooltip` ("Image build failed")
    - Otherwise (general not-installed) → `ContainersI18nKey.ImageNotInstalledTooltip` ("Image is not installed")
  - Trigger condition reuses the existing `isImageNotInstalled(image)` helper to stay in sync with the banner that already lives on the same view.
- **i18n**: add three keys under `ContainersI18nKey`:
  - `ContainerNotRunningTooltip = 'Containers.ContainerNotRunningTooltip'` → `'Container is not running'`
  - `ImageNotInstalledTooltip = 'Containers.ImageNotInstalledTooltip'` → `'Image is not installed'`
  - `ImageBuildFailedTooltip = 'Containers.ImageBuildFailedTooltip'` → `'Image build failed'`

## Non-goals

- **Not changing the banners.** Both the entity-container-status-banner and the image-not-installed banner stay as-is — content, copy, button, placement. The icon is supplemental, not a replacement.
- **Not adding helper text below the field.** `DialInputPopup` still has no neutral / warning-styled `helperText` slot (only `errorText`, which is paired with red error styling — incompatible with a warning state). A future ui-kit `warningText` prop would unblock this; out of scope for this change.
- **Not changing `errorText`/`invalid` semantics.** Warning is its own visual state, distinct from form validation errors.
- **Not extending to the `isModal` create-flow** of the Container source field — it uses `DialSelectField` (different ui-kit primitive) and only ever lets the user pick running containers, making the warning structurally unreachable.
- **Not adding polling.** Both states are read once on mount, same as the banners they pair with.
- **Not introducing a new fetch.** The Container source field already fetches the full list; we just stop discarding the saved-container reference. The Image field already receives `image` as a prop.
- **Not generalizing further** (e.g., to other deployment routes' fields, to interceptor templates, etc.). Scope is exactly the two fields whose top-banners already exist.

## Capabilities

### New Capabilities

- `inline-source-field-warnings`: Defines the inline warning-icon decoration on the Container source field (entity views) and the Container image field (container detail view), reusing the moved-and-generalized `WarningIcon` common component, and the tooltip-text contracts that pair each field with its corresponding top-banner trigger.

### Modified Capabilities

_(none — additive decoration. The archived `entity-container-status-banner` capability and the existing `change-image-button` / image-not-installed behavior keep their current contracts.)_

## Impact

- **Components**:
  - **New**: `components/Common/WarningIcon/WarningIcon.tsx`
  - **New**: `components/Common/WarningIcon/tests/WarningIcon.spec.tsx`
  - **Deleted**: `components/UpstreamEndpoints/Endpoint/WarningIcon.tsx`
  - **Deleted**: `components/UpstreamEndpoints/Endpoint/tests/WarningIcon.spec.tsx` (if it exists; otherwise N/A)
  - **Modified**: `components/UpstreamEndpoints/Endpoint/Endpoint.tsx` — updated import + prop rename
  - **Modified**: `components/SourceField/Containers/Containers.tsx` — keep unfiltered reference, render `iconBefore`
  - **Modified**: `components/Deployments/Fields/ContainerSource/InternalImageField.tsx` — render `iconBefore`
- **i18n**:
  - `constants/i18n.ts` — three new entries under `ContainersI18nKey`
  - `locales/en.ts` — three new translations under `Containers`
- **Tests**:
  - New: `WarningIcon.spec.tsx` at the new location (moved + adapted to the renamed prop)
  - Updated: `Containers.spec.tsx` — add cases for icon presence on non-running, absence on running, absence when no `containerId`
  - Updated: `InternalImageField.spec.tsx` — add cases for icon presence on `BUILD_FAILED` (correct tooltip), presence on not-installed (correct tooltip), absence when image is fine
- **Routes affected (visible change)**:
  - `/[lang]/models/[id]`, `/[lang]/applications/[id]`, `/[lang]/toolsets/[id]`, `/[lang]/interceptors/[id]` — Container source field gains warning icon when applicable
  - `/[lang]/mcp-containers/[id]`, `/[lang]/adapter-containers/[id]`, `/[lang]/interceptor-containers/[id]`, `/[lang]/application-containers/[id]`, `/[lang]/model-servings/[id]` — Container image field gains warning icon when applicable
- **No backend / API / server-action changes.**
