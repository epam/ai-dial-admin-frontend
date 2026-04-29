## 1. i18n keys

- [x] 1.1 In `apps/ai-dial-admin/src/locales/en.ts`, add `SaveAsNewImage: 'Save as new image'` to the `Buttons` group (next to the existing `SaveAsNewVersion`) and `SaveNewImageModalTitle: 'Save new image'` to the `Images` group (next to the existing `SaveNewVersionModalTitle`).
- [x] 1.2 In `apps/ai-dial-admin/src/constants/i18n.ts`, add `SaveAsNewImage = 'Buttons.SaveAsNewImage'` to `ButtonsI18nKey` and `SaveNewImageModalTitle = 'Images.SaveNewImageModalTitle'` to `ImagesI18nKey`.

## 2. AddVersionModal — opt-in default version

- [x] 2.1 In `apps/ai-dial-admin/src/components/Assets/Modals/AddVersionModal.tsx`, add `defaultVersion?: string` to `Props` and destructure it. In the `useState` initializer, return `defaultVersion` as-is when provided; otherwise keep the existing patch-bump computation.
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/Assets/Modals/tests/AddVersionModal.spec.tsx` with two cases: (a) `defaultVersion='1.0.0'` is passed → version field shows `1.0.0`; (b) prop omitted → existing patch-bump default is preserved (covered by current tests if any; add an explicit assertion if missing).

## 3. ImagesButtonsWrapper — rename-aware label/header/default

- [x] 3.1 In `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper.tsx`, lift `isNameChanged` out of `forceNewVersion`'s memo into its own `useMemo` keyed on `[image.name, originalImage.name]`. Reuse it in `forceNewVersion`'s body so the existing collision check is unchanged.
- [x] 3.2 Replace the hard-coded `label={t(ButtonsI18nKey.SaveAsNewVersion)}` on the primary fork button with a conditional: `isNameChanged ? t(ButtonsI18nKey.SaveAsNewImage) : t(ButtonsI18nKey.SaveAsNewVersion)`. Extract to a named local for JSX cleanliness.
- [x] 3.3 In the `ModalType.saveNewVersion` `<AddVersionModal>` block, conditionally pick `header`: `isNameChanged ? t(ImagesI18nKey.SaveNewImageModalTitle) : t(ImagesI18nKey.SaveNewVersionModalTitle)`.
- [x] 3.4 Compute `defaultVersion` for the same `<AddVersionModal>` block: when `isNameChanged && !existingVersions[image.name]?.length`, pass `defaultVersion='1.0.0'`; otherwise omit the prop. Use `getVersionsPerName(versions)` (already passed as `existingVersions`) for the lookup.

## 4. Component tests

- [x] 4.1 Extend `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/tests/ImagesButtonsWrapper.spec.tsx` with: name-changed dirty render → primary fork button reads `ButtonsI18nKey.SaveAsNewImage`; no-rename dirty render → reads `ButtonsI18nKey.SaveAsNewVersion` (regression). Use `screen.getByRole('button', { name })`.
- [x] 4.2 Add a render-the-modal test: name-changed dirty + click the rename button → modal renders with header `ImagesI18nKey.SaveNewImageModalTitle` and the version input value is `1.0.0` (when typed name has no versions). Use `screen.getByRole('textbox')` or `getByDisplayValue('1.0.0')`. (Modal renders via `createPortal`, which is mocked inline in `test-setup.tsx`, so it appears in the document.)
- [x] 4.3 Add the inverse: no-rename dirty + click → modal renders with header `ImagesI18nKey.SaveNewVersionModalTitle` and the version is the patch-bump of the original's max (use a `versions` prop with one element to pin the assertion).

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run test` from the repo root. Confirm 0 lint errors, prettier-clean, all tests green. Run `openspec validate save-as-new-image-on-rename` and ensure it passes.

## 6. Follow-up — unblock fork button on view-context rename collisions

- [x] 6.1 In `apps/ai-dial-admin/src/components/Images/Fields/ImageFields.tsx`, branch the `verifyVersion` settle on `isModal`. When `isModal=true`: keep current behavior (compute `getSemanticVersionError`, set `versionError`, dispatch `field: 'version', isValid: !error`). When `isModal=false`: dispatch `field: 'version', isValid: true` (clear the pessimistic race guard from `onChangeName`), do not compute the existence error, do not set `versionError`. Apply the same branching to the empty-data and no-name branches.
- [x] 6.2 Re-run lint, format, and the affected test files. Manual verification: open an image view, rename to a name whose hierarchy has a colliding version, confirm the **Save as new image** button stays enabled and the modal opens with a non-colliding default version.
