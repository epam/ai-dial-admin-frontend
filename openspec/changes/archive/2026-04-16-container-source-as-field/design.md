## Context

The container Properties view (`Containers/View/ContainerView.tsx` → `TabsContent.tsx`) currently renders a container's source asymmetrically:

- **`INTERNAL_IMAGE`**: rendered as a `DialLabelledText` prefix inside `EntityInfoHeader`, wrapping a `DialGhostButton` whose `onClick` opens the `ContainerChangeImage` modal (see `change-image-button` spec, archived `2026-03-13-disable-change-image-intermediate-status`).
- **`IMAGE_REFERENCE`, `NGC_REGISTRY`, `HUGGINGFACE`**: rendered in the form body via `<ContainerSource>` (`Deployments/Fields/ContainerSource.tsx`), gated by `route === ModelServings || $type === IMAGE_REFERENCE` inside `ContainerFields.tsx:39-48`.

Meanwhile other entity types (Adapters, Toolsets, Models) use a `DialSelectField` labeled "Source type" inside the form body to pick a source kind, then render per-type sub-fields — see `DeploymentProperties.tsx:181-193` and `Adapter/View/Properties/Properties.tsx:66-75`.

For containers, the source type is established at creation (via `HeaderButtons.tsx` picking a create flow per `CONTAINER_SOURCE_TYPE`) and is not user-editable afterwards. So we do not need a select — a read-only label is sufficient.

The archived `unified-container-source` capability already normalized the data model (`ContainerSource` with `$type` discriminator), so this is a pure UI/layout change.

## Goals / Non-Goals

**Goals:**
- One consistent layout for the container Properties tab regardless of `container.source.$type`: source type surfaced in the info header as read-only text; source value rendered as a form field inside `ContainerFields`.
- Preserve existing "change image" UX (single modal, same disabled semantics for PENDING / STOPPING, same open/apply flow).
- No behavior change for non-`INTERNAL_IMAGE` source types — they already render in the form body; only the header gains a new read-only `Source type` label.
- Centralize the mapping from `CONTAINER_SOURCE_TYPE` → display label in one utility.

**Non-Goals:**
- Not changing the `Container` data model or any server-action / API surface.
- Not making "Source type" editable.
- Not unifying `ReadonlyId` (from `ContainersHeader`) with the `EntityInfoHeader` row — the two rows stay distinct.
- Not reordering `updatedAt`/`createdAt` inside `EntityInfoHeader`.
- Not redesigning the `ContainerChangeImage` modal itself.

## Decisions

### 1. Place the `Source type` label via the existing `prefix` slot on `EntityInfoHeader`

**Decision:** Pass a `DialLabelledText` (label: `t(EntitiesI18nKey.SourceType)`, value: resolved display string) as the `headerPrefix` prop from `TabsContent.tsx` → `PropertiesTabContent` → `EntityInfoHeader`.

**Why:** `EntityInfoHeader` already has a `prefix` slot that's currently used for the image button. Replacing the prefix content is a minimal diff and keeps visual ordering (prefix → updatedAt → createdAt → postfix → CoreSync) intact. No change to `EntityInfoHeader`'s props.

**Alternatives considered:**
- Adding a first-class `sourceType` prop to `EntityInfoHeader`. Rejected — adds API surface to a reusable component for a container-specific concern. The generic `prefix` slot is fine.
- Rendering the label outside `EntityInfoHeader`. Rejected — it breaks visual grouping with `updatedAt`/`createdAt`/`status`.

### 2. Render container source as a form field for every `$type`, in a new `INTERNAL_IMAGE` branch of `ContainerSource.tsx`

**Decision:** Extend the switch inside `ContainerSource.tsx:renderSourceField` to handle `CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE` by delegating to a new focused component `Deployments/Fields/ContainerSource/InternalImageField.tsx`. That component accepts the `image` entity and the container status, and uses `DialLabel` + `DialInputPopup` from `@epam/ai-dial-ui-kit` — `DialInputPopup` is the input-with-modal primitive (the whole input is a popup trigger; the expand icon is built in). The popup's children is `ContainerChangeImage`; the popup open/close state is owned locally.

**Why `DialInputPopup` over a plain `DialInput` with a separate icon button:**
- It's the designated ui-kit primitive for "input that opens a modal" — same pattern used by `SourceField/Containers/Containers.tsx:150-166`, `SourceField/Adapters/Adapters.tsx`, `SourceField/Template/Templates.tsx`, `BaseControls/Icon.tsx`, etc. Reusing it matches existing conventions instead of rebuilding the trigger+icon composition from parts.
- Entire input area is clickable (better target than just an icon), with the expand icon as a visual affordance — matches the attached mockup.
- Follows the project rule "Prefer reusing components from @epam/ai-dial-ui-kit over creating new ones."

**Why a dedicated component file (not inline in `ContainerSource.tsx`):**
- Keeps `ContainerSource.tsx` organized as a per-`$type` dispatcher — matches its current style (NGC_REGISTRY → inline `DialInput`, IMAGE_REFERENCE → `McpServerNameField` or inline `DialInput`, default → `HFModelNameField`).
- Project rule: "Break down complex components into smaller, reusable components."
- The new field owns the modal-open state locally, avoiding lifting to `ContainerView`.

**Alternatives considered:**
- `DialInput` with a trailing `DialIconButton` in `iconAfter`. Rejected per user feedback — they specifically wanted the input-with-modal primitive, not an input plus a separate button.
- Putting the `INTERNAL_IMAGE` JSX inline inside `ContainerSource.tsx`. Rejected — `ContainerSource.tsx` already has multiple effects and callbacks; adding the modal state inline would grow the file. A dedicated component file mirrors `McpServerNameField.tsx` / `HFModelNameField.tsx`.
- Lifting modal state to `ContainerView.tsx`. Rejected — unnecessary prop drilling; the modal is only consumed in one place.

### 3. Remove the gate in `ContainerFields.tsx` and always render `<ContainerSource>`

**Decision:** Replace the `(route === ModelServings || $type === IMAGE_REFERENCE)` gate with unconditional rendering of `<ContainerSource>`. The switch inside `ContainerSource.tsx` already fans out correctly per `$type`, and now covers `INTERNAL_IMAGE`.

**Why:** The gate was the historical artifact of the image being in the header for `INTERNAL_IMAGE`. With that moved into the form field, the gate is redundant and would actively skip the new `INTERNAL_IMAGE` branch.

**Trade-off:** Model Servings containers already render `ContainerSource`, so those views gain no duplicate rendering — the unconditional path is safe.

### 4. Centralize `$type` → display-label mapping in a utility

**Decision:** Add `getContainerSourceTypeLabel(source: ContainerSource | undefined, route: ApplicationRoute, t: Translator): string` in `utils/deployments/containers.ts`. It returns:

| `$type` | Key |
|---|---|
| `INTERNAL_IMAGE` | `EntityFieldsI18nKey.InternalImage` with `{ type: getTranslatedType(route, t) }` |
| `IMAGE_REFERENCE` | new key `DockerImage` (display: `"Docker Image"`) |
| `NGC_REGISTRY` | new key `NgcRegistry` (display: `"NGC Registry"`) |
| `HUGGINGFACE` | new key `HuggingFace` (display: `"Hugging Face"`) |

**Why:** Both `TabsContent.tsx` (header label) and any future grid column / export view may need the same mapping. Centralizing avoids `switch` duplication.

**Alternatives considered:**
- Inline the switch in `TabsContent.tsx`. Rejected — future duplication, and the utility is trivially unit-testable.
- Reuse the select-option labels in `SourceField/constants.ts` (e.g., `MCP Container` for `CONTAINER`). Rejected — those are `SOURCE_TYPE` (entity-level source), not `CONTAINER_SOURCE_TYPE` (container image source). Different enums, different meanings.

### 5. Thread `image` into `ContainerFields` → `ContainerSource` → `InternalImageField`

**Decision:** Add `image?: Image` prop to:
- `Containers/View/Properties/Properties.tsx`
- `Containers/Fields/ContainerFields.tsx`
- `Deployments/Fields/ContainerSource.tsx` (forward to `InternalImageField`)

`ContainerView.tsx` already holds `image` and already passes it into `TabsContent` — threading it one level deeper to `Properties` is a small extension.

**Why:** The new field displays `${image.name} (${image.version})` and passes `image` to `ContainerChangeImage`. Fetching or re-deriving the image inside `ContainerSource.tsx` would require plumbing the container manager action, which is unnecessary when `ContainerView` already owns it.

### 6. Translation keys: add three new display labels; reuse existing field labels

**Decision:**
- Add to `EntityFieldsI18nKey` enum (`constants/i18n.ts`) and `en.ts`:
  - `DockerImage = 'EntityFields.DockerImage'` → `"Docker Image"`
  - `NgcRegistry = 'EntityFields.NgcRegistry'` → `"NGC Registry"`
  - `HuggingFace = 'EntityFields.HuggingFace'` → `"Hugging Face"`
- Reuse `EntityFieldsI18nKey.InternalImage` (`'Internal {type} Image'`) for `INTERNAL_IMAGE` header label.
- Reuse `ContainersI18nKey.ContainerImage` (`'{type} Image'`) for the new form-field label on the internal image field.
- Reuse `EntitiesI18nKey.SourceType` (`'Source type'`) for the info-header label.

**Why:** Keeps the number of new strings minimal, leverages existing parameterized templates.

## Risks / Trade-offs

- **[Risk]** Tests that snapshot or query for the old "MCP Image" button in the header prefix will break →  **Mitigation**: Update `Containers/View/tests/TabsContent.spec.tsx` (and sibling tests under `Containers/View/tests/`) alongside the component change. Add a new spec file `Deployments/Fields/ContainerSource/tests/InternalImageField.spec.tsx` for the new field behavior (open modal on click, label rendering, disabled state for PENDING/STOPPING).

- **[Risk]** The `change-image-button` archived spec describes the button as living inside a `DialLabelledText` in the header. After this change, the button lives inside a `DialInput` in the form body. The existing spec's behavioral requirements (DialGhostButton style, disabled during PENDING/STOPPING) still apply, but the location-specific wording is stale → **Mitigation**: note in proposal that existing spec semantics are preserved; if stakeholders want, a follow-up can refresh that spec's wording. Not required for this change.

- **[Risk]** Model Servings containers may show a visual regression: today they render `ContainerSource` in the form body AND a `MCP Image: …` / `Adapter Image: …` prefix in the header (since the prefix logic keys only on `image`, not on `$type`). After this change, Model Servings will show `Source type: NGC Registry` / `Source type: Hugging Face` in the header and keep their existing form-body `ContainerSource` rendering — a net improvement, not a regression. → **Mitigation**: visual QA on all four container routes before merging.

- **[Trade-off]** Unconditional rendering of `<ContainerSource>` in `ContainerFields.tsx` means the component is now mounted for every container regardless of `$type`. Cost is negligible (a single switch statement), gain is consistency.

- **[Trade-off]** We keep `updatedAt → createdAt` order despite the mock showing `createdAt → updatedAt`. If stakeholders push back during review we can flip it in a follow-up without touching this change's core.

## Migration Plan

No data migration. Deploy is a pure frontend change.

**Rollout:**
1. Implement and merge; Next.js rebuild is the deploy vehicle.
2. No feature flag — change is low-risk UI reshape with test coverage.

**Rollback:** Revert the PR; no schema or backend implications.

## Open Questions

- Should `InternalImageField` also expose the "install image" affordance that currently lives in the `DialNotification` at the top of `TabsContent.tsx` when `imageWarning` is true? Current proposal says **no** — the alert stays where it is. Flagging so we don't accidentally collapse the two during implementation.
