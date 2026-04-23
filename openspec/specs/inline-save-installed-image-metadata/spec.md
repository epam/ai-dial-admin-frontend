## Purpose
Allow inline `Save` on an installed (`BUILT`) image when the user's dirty diff is confined to safe metadata fields (`description`, `author`, `topics`). Any edit touching install/build-participating fields continues to route through **Save as new version**. This preserves the built artifact while letting users correct purely descriptive metadata without creating a new image record.

## Requirements

### Requirement: Metadata-only change detection
The system SHALL provide a pure utility `hasOnlyMetadataChanges(original: Image, edited: Image): boolean` in `apps/ai-dial-admin/src/utils/deployments/images.tsx` that returns `true` when every field differing between `original` and `edited` is a member of the whitelist `['description', 'author', 'topics']`, and `false` otherwise. The utility MUST compare field values with `lodash.isEqual` to handle array and object equality (notably `topics`). Fields present on only one side of the diff (e.g. a newly added `author`) MUST participate in the comparison.

#### Scenario: Only description changed on a BUILT image
- **WHEN** `original` and `edited` differ only in `description`
- **THEN** `hasOnlyMetadataChanges` returns `true`

#### Scenario: Description and topics both changed
- **WHEN** `original` and `edited` differ in `description` and `topics`
- **THEN** `hasOnlyMetadataChanges` returns `true`

#### Scenario: transportType changed
- **WHEN** `original.transportType` is `LOCAL` and `edited.transportType` is `REMOTE` (all other fields equal)
- **THEN** `hasOnlyMetadataChanges` returns `false`

#### Scenario: allowedDomains changed
- **WHEN** `edited.allowedDomains` has one element added relative to `original`
- **THEN** `hasOnlyMetadataChanges` returns `false`

#### Scenario: source changed
- **WHEN** any property of `edited.source` differs from `original.source`
- **THEN** `hasOnlyMetadataChanges` returns `false`

#### Scenario: Reordered topics with same elements
- **WHEN** `original.topics = ['a', 'b']` and `edited.topics = ['b', 'a']`
- **THEN** `hasOnlyMetadataChanges` returns `true` — `topics` is a whitelisted metadata field, so any change to it (including reorder) is a metadata-only change

#### Scenario: No changes
- **WHEN** `original` and `edited` are deeply equal
- **THEN** `hasOnlyMetadataChanges` returns `true`

### Requirement: Save button availability on BUILT images
The image header (`ImagesButtonsWrapper`) SHALL render the primary **Save** button (via `ChangedEntityButtons`) when the image is dirty and `buildStatus === BUILT` only if `hasOnlyMetadataChanges(originalImage, image)` returns `true`. When the diff includes any non-whitelisted field, Save MUST remain hidden and only **Save as new version** is offered. `forceNewVersion` (name changed to a value colliding with an existing version) MUST continue to override and hide Save, regardless of `isOnlyMetadataChange`. `buildStatus === BUILDING` MUST continue to hide Save. Clicking Save MUST invoke the existing `ImageView.onSave` handler, which calls `updateImage(selectedImage)` and shows the `ImagesI18nKey.ImagesUpdateSuccess` / `ImagesI18nKey.ImagesUpdateSuccessDescription` toast on success, or `getErrorNotification(res.errorHeader, res.errorMessage)` on failure.

#### Scenario: BUILT image, only description edited
- **WHEN** `buildStatus === BUILT` and the user edits description only
- **THEN** the header renders `[Discard] [Save as new version] [Save]`

#### Scenario: BUILT image, transportType edited
- **WHEN** `buildStatus === BUILT` and the user edits transportType
- **THEN** the header renders `[Discard] [Save as new version]` (no Save)

#### Scenario: BUILT image, allowedDomains edited
- **WHEN** `buildStatus === BUILT` and the user edits allowedDomains
- **THEN** the header renders `[Discard] [Save as new version]` (no Save)

#### Scenario: BUILT image, forceNewVersion active
- **WHEN** `buildStatus === BUILT`, the user changed `name` such that the current version collides with an existing one, and only metadata fields changed
- **THEN** the header renders `[Discard] [Save as new version]` (Save is hidden because `forceNewVersion` overrides)

#### Scenario: BUILDING image, only description edited
- **WHEN** `buildStatus === BUILDING` and the user edits description only
- **THEN** the header renders `[Discard] [Save as new version]` (Save hidden because building)

#### Scenario: Non-BUILT, non-BUILDING image
- **WHEN** `buildStatus !== BUILT` and `buildStatus !== BUILDING`
- **THEN** header behavior is unchanged from today (Save + Save as new version both available unless `forceNewVersion`)

#### Scenario: Successful inline save
- **WHEN** the user clicks Save on a BUILT image with only metadata changes
- **THEN** `updateImage(selectedImage)` is invoked, a success toast using `ImagesI18nKey.ImagesUpdateSuccess` is shown, and `router.refresh()` is called

#### Scenario: Failed inline save
- **WHEN** `updateImage` returns `success: false`
- **THEN** an error notification using `res.errorHeader` / `res.errorMessage` is shown and the user remains on the same image view with their edits intact

### Requirement: Original image threading for diff computation
`ImagesButtonsWrapper` SHALL accept the full original image via a required `originalImage: Image` prop, and SHALL compute `isOnlyMetadataChange = hasOnlyMetadataChanges(originalImage, image)` memoized with `useMemo` on `[originalImage, image]`. `ImageView` SHALL pass its `image` server prop as `originalImage` and its `selectedImage` state as `image`. The wrapper SHALL also derive `forceNewVersion` from `originalImage.name`.

#### Scenario: Only description differs between original and current
- **WHEN** `ImagesButtonsWrapper` receives `buildStatus === BUILT` and an `originalImage` / `image` pair that differs only in `description`
- **THEN** `isOnlyMetadataChange` evaluates to `true` and Save is rendered (subject to `forceNewVersion` and `!isValid` gating)

#### Scenario: Non-metadata field differs
- **WHEN** `ImagesButtonsWrapper` receives `buildStatus === BUILT` and an `originalImage` / `image` pair that differs in `transportType`
- **THEN** `isOnlyMetadataChange` evaluates to `false` and Save is hidden

### Requirement: Accessibility
The Save and Save-as-new-version buttons MUST expose their visible labels through `DialPrimaryButton` / `DialNeutralButton` from `@epam/ai-dial-ui-kit`, which render semantic `<button>` elements with accessible names. No new ARIA attributes are introduced.

#### Scenario: Keyboard navigation
- **WHEN** the user tabs through the header on a BUILT image with metadata-only changes
- **THEN** focus reaches Discard, Save as new version, and Save in DOM order, each with a visible label and focus ring
