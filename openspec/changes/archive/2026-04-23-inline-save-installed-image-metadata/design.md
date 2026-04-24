## Context

The image header in `src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper.tsx` decides which action buttons to render when the image is dirty. Today, `allowEditing = buildStatus !== BUILT && buildStatus !== BUILDING` gates the primary **Save** button, and `isSaveAllowed = allowEditing && !forceNewVersion` is handed to `ChangedEntityButtons`. The net effect: once an image is `BUILT`, Save is hidden unconditionally and the user's only option is "Save as new version" via `AddVersionModal` → `createImage` (new record, new id, redirect).

The backend PUT already supports in-place updates: `ImagesApi.updateImage` in `src/server/deployments/images.ts` calls `PUT /api/images/definitions/{id}`, and the `ImageView.onSave` handler (`src/components/Images/View/ImageView.tsx`) already invokes it with the right `ImagesI18nKey.ImagesUpdateSuccess` toast. The gate is the only thing blocking a plain Save on a BUILT image.

Product confirmed that `transportType` and `allowedDomains` participate in install/build, so they cannot be saved in place on a BUILT image. Only `description`, `author`, and `topics` are safe to PATCH on a BUILT image; every other Image field must continue to route through "Save as new version".

A similar pattern exists for containers (`src/utils/deployments/containers.ts::getContainerRedeploySnapshot`), but containers re-label a single Save button to "Save & redeploy" on redeploy-affecting changes. Images cannot use the same relabel strategy because the new-version path creates a **new record**, not an in-place update — the two paths have different side effects and must stay as two distinct buttons.

## Goals / Non-Goals

**Goals:**
- Show a functional Save button on a `BUILT` image when, and only when, the user's dirty diff is confined to the metadata whitelist (`description`, `author`, `topics`).
- Keep "Save as new version" available in every case it is today (including as a deliberate choice on a BUILT image when the user wants a version bump for metadata).
- Keep non-`BUILT` image states visually unchanged.
- Add unit coverage for the new diff util and component coverage for the `ImagesButtonsWrapper` state matrix.

**Non-Goals:**
- Reshaping the non-`BUILT` header (Save + Save-as-new-version remain side by side there).
- Adopting the container "Save / Save & redeploy" single-button pattern for images.
- Changing `AddVersionModal` or the `createImage` flow.
- Expanding the whitelist beyond `description`/`author`/`topics`.
- Any backend changes or i18n additions.

## Decisions

### Decision 1: Whitelist, not blacklist

**Chosen:** Maintain `METADATA_ONLY_IMAGE_FIELDS = ['description', 'author', 'topics']` and treat any change outside that set as build-affecting.

**Alternatives considered:**
- *Blacklist of build-affecting fields* (`source`, `name`, `version`, `transportType`, `allowedDomains`, `imageBuilder`, build privileges, …). Rejected: the Image model can grow; a future field landing in the model would default to "safe", silently letting users PUT a build-affecting field in place.
- *Per-field `isSafe` metadata on the Image type.* Rejected: too much apparatus for three known-safe fields; the whitelist is smaller and easier to audit.

**Rationale:** The safe set is small and stable by product definition. Any new Image field defaults to "Save as new version", which is the safe failure mode.

### Decision 2: Pure util in utils, computed inside `ImagesButtonsWrapper`

**Chosen:** Add `hasOnlyMetadataChanges(original: Image, edited: Image): boolean` to `src/utils/deployments/images.tsx`. Replace the `originalImageName: string` prop on `ImagesButtonsWrapper` with `originalImage: Image`; compute both `isOnlyMetadataChange` (new) and `forceNewVersion` (existing, was already reading original name) inside the wrapper via `useMemo`.

**Alternatives considered:**
- *Compute in `ImageView` and pass `isOnlyMetadataChange: boolean` as a prop.* This was the first implementation; rejected on review because the wrapper already derives `forceNewVersion` from the original-vs-edited diff. Adding a second derived boolean prop when the same source material (the original image) would suffice is redundant — it splits one diff concept across two files.
- *Compute inside the wrapper using the existing `originalImageName` prop.* Rejected: name alone is insufficient — we need the full original to compare `description`/`author`/`topics`. Hence passing `originalImage: Image`.

**Rationale:** The wrapper is the single owner of "can we Save, and under what label?". Receiving the full `originalImage` is symmetric with the existing `image` prop (also a full `Image`), and it consolidates all diff logic next to `forceNewVersion`. The diff function stays pure in utils so it remains unit-testable without rendering React.

### Decision 3: Gate relaxation, not button restructure

**Chosen:** Introduce a new `allowSave` memo in `ImagesButtonsWrapper` — `BUILDING → false`, `BUILT → isOnlyMetadataChange`, else `true` — and use it in place of `allowEditing` in the `isSaveAllowed = allowSave && !forceNewVersion` expression passed to `ChangedEntityButtons`. Keep the existing `allowEditing` memo untouched; it continues to gate the **Install** button in the non-dirty branch (BUILT and BUILDING images must not show Install regardless of diff). Splitting the two flags avoids overloading one boolean with two unrelated roles.

No changes to button render order, labels, modal flow, or `ChangedEntityButtons` itself.

**Alternatives considered:**
- *Relabel one button "Save" ↔ "Save as new version" based on the diff (container style).* Rejected: the two paths have different side effects (`updateImage` PUT vs `createImage` POST + redirect). Collapsing them to one button would be dishonest about what "Save" does when a version bump is required.
- *Always show both buttons on BUILT, disabling Save instead of hiding.* Rejected: adds a disabled control with no affordance explaining why; current hide-on-unsafe stays simpler.

**Rationale:** Smallest possible surface to fix the bug. The already-wired `onSave` handler (using `updateImage`) is re-used as-is.

### Decision 4: `forceNewVersion` still overrides Save

**Chosen:** Keep `isSaveAllowed = allowEditing && !forceNewVersion`. `forceNewVersion` fires when the user changed `name` to a value whose `version` already exists — a build-affecting change that should never be savable in place regardless of build status.

**Rationale:** The existing invariant is correct and orthogonal to this change.

## Risks / Trade-offs

- **[Risk]** Backend silently accepts a PUT for a non-whitelisted field on a BUILT image, causing definition/binary desync. → **Mitigation:** The frontend whitelist prevents the user from triggering that PUT. If the backend PUT is ever called for a non-whitelisted field (e.g. via JSON editor or future regression), the resulting error will surface through the existing toast pathway.

- **[Risk]** JSON editor (`isEditorEnabled=true`) allows arbitrary field edits, and when the user toggles back and saves, our util sees a multi-field diff and keeps Save hidden. → **Accepted behavior.** Matches the spec: non-metadata edits route through "Save as new version" regardless of how they were entered. The user can switch off the editor or use the version flow. No new code path needed.

- **[Risk]** `topics` is a string array — a reorder with identical elements would look "different" under naive equality. → **Mitigation:** Use `lodash.isEqual` for the per-field comparison (already a project dependency; used in `ContainerView`'s diff).

- **[Trade-off]** No shared abstraction between the image diff and the container redeploy snapshot. → **Accepted.** The two have different semantics (forbid-in-place vs relabel-and-redeploy). Premature abstraction would obscure both.

- **[Trade-off]** The whitelist is a small constant kept in `src/utils/deployments/images.ts` rather than in `constants/`. → **Accepted.** Per project convention, the constant is colocated with the only util that uses it and only exported if a test needs it.
