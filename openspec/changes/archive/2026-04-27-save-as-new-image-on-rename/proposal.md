## Why

When the user renames an existing image, the only "fork-into-a-new-record" affordance is labeled **Save as new version** and the version modal pre-fills `0.0.1`. But changing `name` actually creates a separate image hierarchy (different top-level grouping), not a new version of the same image — the wording is misleading. The pre-fill is also inconsistent with the **+ Create** flow, which defaults a brand-new image to `1.0.0` (`getImageTemplate` at `apps/ai-dial-admin/src/utils/deployments/images.tsx`). Issue [#2689](https://github.com/epam/ai-dial-admin-frontend/issues/2689) asks for the label to read **Save as new image** when name has changed, and for the version field to default to `1.0.0` for a fresh hierarchy.

## What Changes

- When the edited image's `name` differs from `originalImage.name`, the primary fork button on `ImagesButtonsWrapper` SHALL render the label **Save as new image** (instead of **Save as new version**), and opening the version modal SHALL show the title **Save new image** (instead of **Save new version**).
- The default version pre-fill SHALL be `1.0.0` when the typed name has no existing versions (a brand-new hierarchy). When the typed name already has versions (the user typed an existing image's name), the modal SHALL keep the current behavior: pre-fill the next patch from that name's max version.
- When `name` is unchanged, the existing behavior is fully preserved: button reads "Save as new version", modal reads "Save new version", default is patch-bump from the original name's max.
- Apply the relabel universally — all `buildStatus` values. The label decision is driven only by `isNameChanged`.
- `AddVersionModal` SHALL accept an optional `defaultVersion?: string` prop. When provided, it overrides the internal patch-bump initializer. Other callers (assets, prompts) are unaffected because they don't pass the new prop.
- Add two new i18n keys, mirroring the existing pair: `ButtonsI18nKey.SaveAsNewImage` (`'Save as new image'`) and `ImagesI18nKey.SaveNewImageModalTitle` (`'Save new image'`).
- Stop validating version-existence at the form level on the image **view** page (where the version field is hidden anyway). On a name change that lands on a colliding `(name, version)` pair, the form-level `'version'` field would previously dispatch `isValid: false`, which disabled the **Save as new image / Save as new version** fork button — preventing the user from reaching the modal that would let them pick a non-colliding version. After this change, `ImageFields.verifyVersion` only computes the existence error and dispatches form validity in **modal** contexts (image creation popup); in the **view** context it dispatches `isValid: true` to clear the pessimistic race guard. The `AddVersionModal`'s own `validateVersion` continues to block its `Create` button when the user types a colliding version.

## Capabilities

### New Capabilities

- `save-as-new-image-on-rename`: When the user edits an image's `name`, the fork-into-new-record action is labeled **Save as new image**, opens a **Save new image** modal, and pre-fills the version with `1.0.0` for a fresh hierarchy (or the next patch when the typed name already has versions).

### Modified Capabilities

_None._ Scope is limited to the rename branch in `ImagesButtonsWrapper` plus an optional opt-in prop on `AddVersionModal`.

## Impact

- **Code**: `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper.tsx` (lift `isNameChanged` to a memo, conditional label/header, pass `defaultVersion` to `AddVersionModal`); `apps/ai-dial-admin/src/components/Assets/Modals/AddVersionModal.tsx` (accept optional `defaultVersion` prop and use it as the `useState` initializer when provided); `apps/ai-dial-admin/src/components/Images/Fields/ImageFields.tsx` (branch `verifyVersion` settle on `isModal` — existence-error compute + dispatch + inline `versionError` only when `isModal=true`); `apps/ai-dial-admin/src/locales/en.ts` and `apps/ai-dial-admin/src/constants/i18n.ts` (two new keys).
- **APIs**: None. Uses the existing `createImage` server action via `onSaveAsNewVersion`.
- **i18n**: Two new keys. No existing strings change.
- **Shared components**: `AddVersionModal` is used by image and asset flows; the change is opt-in via a new optional prop, so asset/prompt callers retain their current behavior.
- **Interaction with `inline-save-installed-image-metadata`**: `name` is non-metadata, so a name change on a BUILT image already routes through the fork path — no conflict; this change just relabels and re-defaults that path.

## Non-goals

- Changing the in-place **Save** behavior (PUT `updateImage`) when name has changed on a non-BUILT image — that flow is untouched, and the user can still rename in place if they prefer.
- Changing the **+ Create new version** affordance from `VersionsSelect` (the non-dirty flow with no name-change context) — stays "Save as new version" with patch-bump default.
- Changing `forceNewVersion`'s collision-detection logic.
- Updating other callers of `AddVersionModal` (assets, prompts) — they don't pass `defaultVersion`, so they default to today's patch-bump initializer.
