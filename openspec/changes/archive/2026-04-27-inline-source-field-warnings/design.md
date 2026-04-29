## Context

Two top-of-view warning banners already exist:

1. **Entity container status banner** (archived `entity-container-status-banner` capability) — rendered on Models / Applications / Toolsets / Interceptors detail views when the saved entity's source is a container whose `status !== 'running'`.
2. **Image not installed banner** — rendered on container detail views (`Containers/View/TabsContent.tsx:118-144`) when `isImageNotInstalled(image)` is true; copy variant for `IMAGE_STATUS.BUILD_FAILED`.

Both banners describe the problem and offer an action. Neither leaves any inline trace on the form field that's actually broken. With banner scrolled out of view, or among many fields, the user has to read the banner to map "broken state" → "broken field". The original `entity-container-status-banner` mockup included an inline ⚠ triangle next to the field value precisely to bridge that gap — but the ui-kit's `DialInputPopup` only exposed `errorText`/`invalid` (red, error styling), so the inline treatment was deferred.

`@epam/ai-dial-ui-kit` recently shipped `iconBefore?: ReactNode` on `DialInputPopup`. Both fields in question (Container source field, Container image field) are built on `DialInputPopup`. The deferred work is now mechanical.

## Goals / Non-Goals

**Goals:**
- One reusable warning-icon component, used in both fields and in the existing endpoint warning surface.
- Yellow-warning visual semantics, not red-error — the field isn't invalid, the referenced resource is in a problematic operational state.
- Triggers stay aligned with the existing banners on the same views — no new policy.
- Zero new fetches, zero new state in the page tree.

**Non-Goals:**
- Replacing the banners.
- Adding helper text below the field.
- Touching `errorText` / `invalid` semantics.
- Generalizing to fields that don't have a paired top-banner today.
- Modifying ui-kit (the `iconBefore` we need is already in).

## Decisions

### 1. Generalize `WarningIcon` and move to `Common/`

**Decision:** Move `components/UpstreamEndpoints/Endpoint/WarningIcon.tsx` → `components/Common/WarningIcon/WarningIcon.tsx`. Rename the prop `endpointWarning?: string` → `warningText?: string`. Update the existing `Endpoint.tsx` consumer to import from the new path and pass `warningText={endpointWarning}` (the local prop name on the calling side stays).

**Why:**
- The component is already generic — the rename only fixes the misleading prop name. Its body uses `IconAlertTriangleFilled` + `text-warning-icon` + `DialTooltip` placement-bottom; nothing endpoint-specific.
- We're about to add two consumers; bundling those under an endpoint-scoped folder would mislead future readers.
- `components/Common/` is the established home for shared UI primitives (CopyButton, Accordion, ValidityStatus, etc. — over 30 sibling folders).

**Alternatives considered:**
- Keep at `UpstreamEndpoints/Endpoint/` and import across the codebase. Rejected — folder location implies ownership; new consumers would create a misleading "everything imports from endpoint" pattern.
- Wrap the existing component in a new `Common/WarningIcon` re-export. Rejected — adds indirection for no gain. Single source of truth, single consumer rewrite.
- Keep the prop name `endpointWarning`. Rejected — locks future readers into the misleading historical context.

### 2. Reuse ui-kit's `iconBefore` slot rather than overlay/pseudo-element

**Decision:** Render the `<WarningIcon>` via `DialInputPopup`'s `iconBefore` prop.

**Why:**
- It's the prop the ui-kit ships exactly for "icon at the start of the field". No CSS hacks.
- Lays out correctly with the popup-trigger chevron on the right and the value in between, matching the original mockup's layout.

**Alternatives considered:**
- Absolutely-positioned overlay on top of the popup. Rejected — fragile to ui-kit internal layout changes.
- `valueClassName` with a `::before` pseudo-element. Rejected — pseudo-elements can't carry tooltip behavior.
- Wrap the `DialInputPopup` in a flex row with the icon as a sibling. Rejected — `DialInputPopup`'s built-in input border would not enclose the icon, breaking visual continuity with the field.

### 3. Trigger conditions mirror the paired top-banner exactly

**Decision:**

| Field | Trigger | Tooltip |
|---|---|---|
| Container source field (in `SourceField/Containers/Containers.tsx`) | saved container is found in fetched list AND its `status !== CONTAINER_STATUS.RUNNING` | "Container is not running" |
| Image field (in `InternalImageField.tsx`) — build failed branch | `image.buildStatus === IMAGE_STATUS.BUILD_FAILED` | "Image build failed" |
| Image field — general not-installed branch | `isImageNotInstalled(image)` returns true AND `buildStatus !== BUILD_FAILED` | "Image is not installed" |

**Why:**
- The pre-existing top-banners on both views already use these exact conditions. Having the icon flicker independently from the banner would be a regression in clarity.
- For the Container source field: the dropdown only ever offers running containers, so the icon is naturally only ever visible against the saved baseline (matches the banner's "saved state" gating).
- For the Image field: the condition function `isImageNotInstalled(image)` already exists in `utils/deployments/images.tsx` — we reuse it directly. Build-failed has its own distinct copy because the user action is different (rebuild vs. install).

**Alternatives considered:**
- Single tooltip "Image is not in good state" covering both image branches. Rejected — the banner copy already differentiates these, so the icon should too.
- Passing the banner's full sentence as the tooltip. Rejected — tooltips should be short; long sentences truncate or wrap awkwardly.

### 4. Stop discarding the unfiltered container list in `Containers.tsx`

**Decision:** Today (`Containers.tsx:91-106`) the fetched list is filtered to running before being committed to `containers` state, and the saved container's `displayName` is captured in a separate `currentContainerDisplayName` string. To know the saved container's *status*, we either keep an unfiltered reference or expand `currentContainerDisplayName` into a `currentContainer: Container | null` reference.

We keep `currentContainer: Container | null` in state — superset of `currentContainerDisplayName`. The displayName render path reads from `currentContainer.displayName`. The icon trigger reads from `currentContainer.status`. The dropdown still uses the filtered (running-only) `containers` state.

**Why:**
- Single source of truth for "what is the saved container, in full". Avoids two parallel state slices for the same record.
- `currentContainerDisplayName` was always a partial extract of the saved container; promoting it to the full object is a strict superset.

**Alternatives considered:**
- Add a separate `currentContainerStatus` slice next to the existing displayName. Rejected — same data, different slices.
- Keep both lists in state (`allContainers`, `runningContainers`). Rejected — derivable; one list + one filter at render time is cheaper.

### 5. Don't broaden the field-icon scope to non-banner fields

**Decision:** Add the icon only to the two fields whose top-banner already exists. Do not generalize to other entity fields (e.g., adapter source, interceptor template, etc.).

**Why:**
- Field-icon-without-banner means the user sees an unexplained warning icon and has to hover for context. Banner-without-icon is what we have today (acceptable). Banner + icon is the goal. Icon-without-banner is the worst combination.
- Each new pairing requires its own trigger + copy decision. Scoping to existing banners avoids opening that conversation N times in this change.

**Alternatives considered:**
- Add icons to every `DialInputPopup` that has any kind of error/warning state. Rejected — scope creep.

### 6. Tooltip copy: short labels, distinct keys

**Decision:** Three new short i18n keys, one per trigger:

```
ContainerNotRunningTooltip   → 'Container is not running'
ImageNotInstalledTooltip      → 'Image is not installed'
ImageBuildFailedTooltip       → 'Image build failed'
```

**Why:**
- Tooltips need to fit one line on hover; verbose copy looks bad and risks truncation.
- Distinct keys allow per-condition copy tuning without coupling.
- Existing `ImageNotInstalledWarning` / `ImageBuildFailedWarning` keys are sentence-form with `{imageName}`/`{imageVersion}` placeholders — they're for the banner body, not a tooltip. We don't reuse them; we add fresh short ones.

**Alternatives considered:**
- One generic key "Action required". Rejected — content-free.
- Reuse the existing banner copy. Rejected — too long, contains placeholders that don't fit a tooltip.

## Risks / Trade-offs

- **Visual collision** between the new leading warning icon and `DialInputPopup`'s built-in trailing chevron when the field is narrow. Mitigation: the field uses `CONTROL_WITH_BUTTON_WIDTH` (~360px) so collision is unlikely; quick visual check during implementation will catch any edge case.
- **Tooltip on a small icon** has a tight hit-target. Acceptable — tooltip is a hover-affordance, not a click target. The icon has visual presence (16px filled triangle) and the tooltip placement is `bottom`, matching the existing endpoint pattern.
- **Existing endpoint consumer** (`Endpoint.tsx`) needs touched as part of the move. Trivial diff (import path + prop name) but worth running its existing tests.
- **`isImageNotInstalled` may overlap with `BUILD_FAILED`** depending on its implementation. We need to gate "general not-installed" copy on `buildStatus !== BUILD_FAILED` to avoid double-firing the wrong tooltip when both conditions are true. Implementation will read the helper and decide ordering.

## Migration / Rollout

- No data migration. Pure UI decoration.
- No feature flag — the icon is safe-by-default (renders nothing when `warningText` is falsy).
- The `WarningIcon` move is a moved file, not a parallel re-export — Endpoint's import is updated in the same change so no transition window.

## Open Questions

_(none at proposal time — all design decisions resolved during exploration)_
