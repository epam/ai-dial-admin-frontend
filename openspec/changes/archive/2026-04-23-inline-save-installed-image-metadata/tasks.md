## 1. Diff utility

- [x] 1.1 Add `METADATA_ONLY_IMAGE_FIELDS = ['description', 'author', 'topics'] as const` and `hasOnlyMetadataChanges(original: Image, edited: Image): boolean` to `apps/ai-dial-admin/src/utils/deployments/images.ts`. Use `lodash.isEqual` for per-field comparison and iterate the union of keys from both inputs.
- [x] 1.2 Add unit tests in `apps/ai-dial-admin/src/utils/deployments/tests/images.spec.tsx` covering all scenarios from `specs/inline-save-installed-image-metadata/spec.md` (description-only change, description+topics change, `transportType` change, `allowedDomains` change, `source` change, reordered `topics`, no changes).

## 2. Prop threading

- [x] 2.1 In `apps/ai-dial-admin/src/components/Images/View/ImageView.tsx`, pass `originalImage={image}` to `<ImagesHeader>` (replacing `originalImageName={image.name || ''}`). The diff is computed inside the wrapper, so no view-level memo is required.
- [x] 2.2 In `apps/ai-dial-admin/src/components/EntityHeaderControls/ImagesHeader.tsx`, no code edit required — `Props extends ImagesButtonsWrapperProps` with `...props` spread so the renamed prop threads automatically.

## 3. Button gate

- [x] 3.1 In `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper.tsx`, replace `originalImageName: string` with `originalImage: Image` on `ImagesButtonsWrapperProps`, destructure it in the component, and derive `forceNewVersion`'s name check from `originalImage.name`.
- [x] 3.2 Compute `isOnlyMetadataChange = hasOnlyMetadataChanges(originalImage, image)` via `useMemo` inside the wrapper. Introduce `allowSave` memo (`BUILDING→false`, `BUILT→isOnlyMetadataChange`, else `true`) and pass `allowSave && !forceNewVersion` as `isSaveAllowed` to `ChangedEntityButtons`. Kept the original `allowEditing` memo untouched so the Install button in the non-dirty branch continues to hide on BUILT/BUILDING images (caught during implementation — `allowEditing` had two roles; split them rather than overloading one flag).

## 4. Component tests

- [x] 4.1 Create `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/tests/ImagesButtonsWrapper.spec.tsx` reusing mocks from `apps/ai-dial-admin/test-setup.tsx` (no new mocks, no `data-testid`). Cover:
  - BUILT + `isOnlyMetadataChange=true` + `isChanged=true` → Save **and** Save-as-new-version rendered.
  - BUILT + `isOnlyMetadataChange=false` + `isChanged=true` → only Save-as-new-version rendered (no Save).
  - BUILT + `isOnlyMetadataChange=true` + `forceNewVersion=true` → only Save-as-new-version rendered (Save hidden).
  - BUILDING + `isOnlyMetadataChange=true` + `isChanged=true` → only Save-as-new-version rendered.
  - Non-BUILT, non-BUILDING + `isChanged=true` → Save + Save-as-new-version rendered (current behavior preserved).
  - Prop omitted defaults to `false` → BUILT + dirty renders only Save-as-new-version.
- [x] 4.2 Query buttons via accessible name (`screen.getByRole('button', { name: ... })`) matching the `ButtonsI18nKey` values returned by the mocked `useI18n`.

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root. Ensure the new unit tests and component tests pass and no existing suites regress. (Result: lint 0 errors / 26 pre-existing warnings; prettier clean; 454 test files, 4315 tests, 0 failures.)
