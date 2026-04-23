## Why

On an installed image (buildStatus `BUILT`), the image header only offers **Save as new version** — even when the user's edits are confined to pure metadata (description, author, topics). Creating a new image record just to tweak a description is wasteful and confusing. Issue [#2690](https://github.com/epam/ai-dial-admin-frontend/issues/2690) asks for a **Save** button in this case.

The plumbing already exists: `updateImage` (server action + API class) is wired and `ImageView.onSave` already calls it with the correct `ImagesUpdateSuccess` toast copy. Only the button gate in `ImagesButtonsWrapper` hides Save on `BUILT` images, and the decision is based on `buildStatus` alone, not on what actually changed.

## What Changes

- Add a small pure util `hasOnlyMetadataChanges(original, edited)` that returns `true` when all dirty fields fall inside a whitelist of image metadata fields.
- The whitelist is: `description`, `author`, `topics`. Any edit outside that set (including `transportType`, `allowedDomains`, `source`, `name`, `version`, `imageBuilder`, build privileges) continues to force "Save as new version" because those fields participate in install/build.
- Replace the `originalImageName: string` prop on `ImagesButtonsWrapper` (and by inheritance `ImagesHeader`) with `originalImage: Image`. `ImageView` passes the full original image; the wrapper computes both `isOnlyMetadataChange` (new) and `forceNewVersion` (existing) internally.
- In `ImagesButtonsWrapper`, relax the Save gate so that a `BUILT` image allows Save **only** when `isOnlyMetadataChange` is `true`. `BUILDING` still hides Save. `forceNewVersion` (name-change colliding with an existing version) still forces "Save as new version".
- "Save as new version" remains available in all the same cases it is today; it is not removed.
- Add a unit test for the new util, and a component test for `ImagesButtonsWrapper` covering the button-state matrix (no spec file exists today).

## Capabilities

### New Capabilities

- `inline-save-installed-image-metadata`: On an installed (`BUILT`) image, show the Save button when the user's edits are confined to metadata fields (`description`, `author`, `topics`), and continue to force "Save as new version" for any other edit.

### Modified Capabilities

_None._ Scope is limited to the button-render gate and a new util; no existing spec's requirements change.

## Impact

- **Code**: `apps/ai-dial-admin/src/utils/deployments/images.ts` (new util), `apps/ai-dial-admin/src/components/Images/View/ImageView.tsx` (compute + pass prop), `apps/ai-dial-admin/src/components/EntityHeaderControls/ImagesHeader.tsx` (thread prop), `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper.tsx` (relax `allowEditing`).
- **APIs**: No new server action or API route. Uses existing `updateImage` (`PUT /images/definitions/{id}`) and existing `createImage`/`AddVersionModal` flow.
- **i18n**: No new keys. Reuses `ButtonsI18nKey.Save`, `ButtonsI18nKey.SaveAsNewVersion`, `ImagesI18nKey.ImagesUpdateSuccess`.
- **Shared components**: `ChangedEntityButtons` and `AddVersionModal` are unchanged. No risk to other entity views that consume them.
- **Non-BUILT images**: behavior unchanged. Scope is strictly the `BUILT` branch.

## Non-goals

- Redesigning the two-button header for non-`BUILT` image states.
- Adopting the container "Save / Save & redeploy" relabeling pattern for images — the image new-version flow creates a new record, so a relabel alone wouldn't capture the user intent.
- Expanding the whitelist beyond `description`/`author`/`topics`. Any fields touching install/build (`transportType`, `allowedDomains`, etc.) remain "Save as new version" per product confirmation.
- Backend changes. The backend PUT handler for BUILT images is out of scope; if it rejects a safe-field edit, the user sees the standard error notification.
