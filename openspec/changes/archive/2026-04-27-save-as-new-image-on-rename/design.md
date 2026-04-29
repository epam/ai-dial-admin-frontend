## Context

`ImagesButtonsWrapper` (`apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper.tsx`) renders one primary fork-button when the image is dirty:

```tsx
<DialPrimaryButton
  label={t(ButtonsI18nKey.SaveAsNewVersion)}   // hard-coded
  onClick={onOpenSaveNewVersionModal}
/>
```

Clicking opens `AddVersionModal` (`apps/ai-dial-admin/src/components/Assets/Modals/AddVersionModal.tsx`), whose pre-fill is computed at mount:

```ts
const versions = existingVersions?.[entityName || ''] || [];
const maxVersion = versions?.length
  ? versions.reduce((max, v) => (semver.gt(v, max) ? v : max), versions[0])
  : '0.0.0';
return semver.inc(maxVersion, 'patch') || '0.0.1';
```

`existingVersions` is built at the call site as `getVersionsPerName(versions)`, where `versions` reflects the typed name's version list (refreshed by `verifyVersion` in `ImageBase` when the user types). `entityName` is `image.name` (the edited name). So when the user types a brand-new name, `existingVersions[newName]` is undefined → fallback to `'0.0.0'` → `semver.inc('0.0.0', 'patch') = '0.0.1'`.

The reference shape for a fresh image is `1.0.0` (per `getImageTemplate` in `apps/ai-dial-admin/src/utils/deployments/images.tsx`). So the rename flow is doubly off-message — wrong label and a default that disagrees with the create-from-scratch path.

The wrapper already computes `isNameChanged` inline inside `forceNewVersion`. We can lift it to a separate memo and reuse it as the single decision input.

## Goals / Non-Goals

**Goals:**
- Relabel the fork button and modal title to **Save as new image** / **Save new image** when `name` has changed, regardless of `buildStatus`.
- Default the modal's version field to `1.0.0` when the typed name has no existing versions; preserve patch-bump when the typed name already has versions.
- Keep the no-rename case visually identical to today.
- Avoid changing behavior for other callers of `AddVersionModal` (assets, prompts).

**Non-Goals:**
- Modifying the in-place `Save` (PUT `updateImage`) path.
- Touching the `+ Create new version` affordance on `VersionsSelect` (no rename context).
- Reworking `forceNewVersion`'s collision logic.
- Adding a description string inside the modal.

## Decisions

### Decision 1: Drive label and default purely off `isNameChanged`

**Chosen:** Compute `isNameChanged` once in `ImagesButtonsWrapper` (lifted out of `forceNewVersion`'s memo) and use it to pick both the button label and the modal's `header` / `defaultVersion`. No buildStatus branching.

**Alternatives considered:**
- *Limit relabel to BUILT images.* Rejected: a name change always produces a new top-level record (different `name`, different hierarchy), regardless of buildStatus. Honest labeling beats build-state-conditional labeling.
- *Detect "fork" via a deeper diff (e.g. any non-metadata change).* Rejected: only a name change forks the hierarchy. Other field changes, even on a BUILT image, are still version bumps within the same name.

### Decision 2: Opt-in `defaultVersion` prop on `AddVersionModal`

**Chosen:** Add an optional `defaultVersion?: string` prop to `AddVersionModal`. When provided, it overrides the existing patch-bump `useState` initializer; when absent, behavior is unchanged.

**Alternatives considered:**
- *Change the modal's fallback from `'0.0.0'` patch (= `'0.0.1'`) to `'1.0.0'` globally.* Rejected: would silently change behavior for asset and prompt fork flows that rely on the patch-bump default.
- *Compute the default outside the modal and pass it via the existing `existingVersions`/`entityName` shape.* Rejected: indirect; `defaultVersion` says exactly what it does.

**Rationale:** Smallest surface; opt-in keeps assets/prompts untouched.

### Decision 3: Caller computes the default, modal stays dumb

**Chosen:** Compute `defaultVersion` at the wrapper call site:

```
isNameChanged
   │
   └─ Yes:
        existingVersions[image.name]?.length ? <skip — let modal patch-bump>
                                              : '1.0.0'
   └─ No: <skip — let modal patch-bump>
```

Pass `defaultVersion='1.0.0'` only in the "fresh hierarchy" case. Otherwise omit the prop and let the modal's existing logic patch-bump. This keeps the modal's job simple ("use defaultVersion if provided, else compute the patch-bump default").

**Alternatives considered:**
- *Always pass an explicit `defaultVersion`, even in patch-bump cases.* Rejected: forces the wrapper to duplicate the modal's existing initializer.

### Decision 4: Two new i18n keys, mirroring existing pair

**Chosen:**
- `ButtonsI18nKey.SaveAsNewImage` → `'Save as new image'`
- `ImagesI18nKey.SaveNewImageModalTitle` → `'Save new image'`

Mirrors `ButtonsI18nKey.SaveAsNewVersion` / `ImagesI18nKey.SaveNewVersionModalTitle` — the only word that changes is "version" → "image".

**Rationale:** Per project rule "before adding feature-specific i18n keys, check if a shared key exists" — checked, no equivalents exist. Following the existing naming pattern.

### Decision 5: Drop form-level version-existence validation on the image view

**Chosen:** In `ImageFields.verifyVersion`, branch the settle behavior on the existing `isModal` prop.
- `isModal=true` (image creation popup, version field visible): keep today's behavior — compute `getSemanticVersionError`, set inline `versionError`, dispatch `field: 'version', isValid: !error`. The `Create` button in the popup gates on this aggregate.
- `isModal=false` (image view, version field hidden): dispatch `field: 'version', isValid: true` — purely clearing the pessimistic race guard from `onChangeName`. Skip inline error (no version field to attach it to).

**Why:** On the image view, the version is read-only. The user can only change the version through `AddVersionModal`, which has its own `validateVersion` (existence) and `VersionControl` (format) that gate its `Create` button. Form-level existence validation in this context only blocks the fork button — there's no version field for the user to fix, so the only escape hatch is the modal — but the modal is unreachable when its trigger button is disabled. Removing that dead-end aligns the form-level validation with the surface the user can actually edit.

**Alternatives considered:**
- *Drop the pessimistic dispatch in `onChangeName` for the view too, then drop the settle dispatch entirely.* Rejected — `onChangeName` doesn't have direct access to whether the surrounding context is a modal, and threading `isModal` through would expand the change. Branching only at `verifyVersion`'s settle keeps the surface small and preserves the pessimistic guard for the modal.
- *Move the existence dispatch from `verifyVersion` into a higher-level container.* Rejected — duplicates work and creates a second source of truth for the same state.

**Rationale:** The existing `AddVersionModal.validateVersion` already blocks `Create` when the user types a colliding version (uses `getAssetVersionBusinessError` against the typed name's versions, which the wrapper supplies via `existingVersions={getVersionsPerName(versions)}` after `setImageVersions` propagated the typed name's data). The default version we pass into the modal is non-colliding by construction (`1.0.0` for fresh hierarchy, patch-bump from typed name's max otherwise), so the modal's lazy "validate on first keystroke" is safe.

## Risks / Trade-offs

- **[Risk]** `isNameChanged` only compares trimmed strings. If the user types whitespace or capitalization differences, the label flips. → **Accepted.** This matches the existing `forceNewVersion` invariant. A whitespace-only name change is still semantically a different name from the backend's perspective.

- **[Risk]** When the user types an existing image's name, the label says "Save as new image" but the action joins that name's hierarchy with a patch-bump version. Slightly fuzzy semantics. → **Mitigation:** This is intentional per the explore phase — the label tracks "different name" cleanly, and the patch-bump default reflects the user's intent (they typed a name that already exists). Form-level validation (`getSemanticVersionError`) still catches version collisions.

- **[Risk]** `AddVersionModal`'s `useState` initializer runs once on mount. If `defaultVersion` changes after mount, the field doesn't auto-update. → **Accepted.** The modal opens fresh each time the user clicks the button, so the initializer always sees the current `defaultVersion`. The asset/prompt flows already rely on this single-mount behavior.

- **[Trade-off]** No reset of `isNameChanged` once `verifyVersion` debounces in. There's a small window where the user has typed but `versions` hasn't refreshed yet. → **Accepted.** `existingVersions` lookup just returns `undefined` in that window, which falls through to the `1.0.0` default — the right answer for a name with no known versions.
