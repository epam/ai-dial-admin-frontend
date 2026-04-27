## Purpose
When the user renames an image on the edit view, the fork-into-a-new-record affordance is labeled **Save as new image** (because changing `name` produces a separate image hierarchy), and the version modal pre-fills `1.0.0` for a brand-new hierarchy or the next patch from the typed name's max when joining an existing hierarchy. Form-level version-existence validation is scoped to the image creation popup only — on the image view, where the version field is hidden, existence is enforced by `AddVersionModal.validateVersion` so the fork button stays reachable even when there's a name+version collision.

## Requirements

### Requirement: Rename detection in image header
`ImagesButtonsWrapper` SHALL compute `isNameChanged` as `(image.name ?? '').trim() !== (originalImage.name ?? '').trim()` once per render via `useMemo`, and SHALL use it to drive both the fork-button label and the version-modal header. The same boolean MUST continue to participate in the existing `forceNewVersion` derivation without behavior change.

#### Scenario: Name unchanged
- **WHEN** `image.name` equals `originalImage.name` (after trim)
- **THEN** `isNameChanged` is `false`

#### Scenario: Name typed to a new value
- **WHEN** `image.name` differs from `originalImage.name` after trim
- **THEN** `isNameChanged` is `true`

### Requirement: Conditional fork-button label
When `isNameChanged` is `true`, the primary fork button (rendered inside `ChangedEntityButtons` children) SHALL display the label `t(ButtonsI18nKey.SaveAsNewImage)`. When `isNameChanged` is `false`, it SHALL display `t(ButtonsI18nKey.SaveAsNewVersion)`. The `onClick` handler is unchanged in both cases — it opens the same modal type (`ModalType.saveNewVersion`).

#### Scenario: Rename in progress
- **WHEN** the user has changed `name` and the image is dirty
- **THEN** the primary fork button reads "Save as new image"

#### Scenario: No rename
- **WHEN** the image is dirty but `name` is unchanged
- **THEN** the primary fork button reads "Save as new version"

### Requirement: Conditional modal title
When the user opens the version modal from the rename context (`isNameChanged === true`), `AddVersionModal` SHALL receive `header={t(ImagesI18nKey.SaveNewImageModalTitle)}`. Otherwise it SHALL receive `header={t(ImagesI18nKey.SaveNewVersionModalTitle)}`. The `submitLabel` (`t(ButtonsI18nKey.Save)`) remains unchanged.

#### Scenario: Modal opened with rename
- **WHEN** the user opens the modal after changing `name`
- **THEN** the modal title reads "Save new image"

#### Scenario: Modal opened without rename
- **WHEN** the user opens the modal without changing `name`
- **THEN** the modal title reads "Save new version"

### Requirement: Default version pre-fill for fresh hierarchy
`AddVersionModal` SHALL accept an optional prop `defaultVersion?: string`. When provided, the internal `useState` initializer SHALL use it as-is. When absent, the existing patch-bump initializer SHALL run unchanged: `semver.inc(maxVersion, 'patch') || '0.0.1'` against `existingVersions[entityName]`.

`ImagesButtonsWrapper` SHALL pass `defaultVersion='1.0.0'` to `AddVersionModal` only when both:
1. `isNameChanged` is `true`, AND
2. `existingVersions[image.name]` is empty or undefined (the typed name has no known versions).

In all other rename cases (typed name already has versions), the prop is omitted and the modal patch-bumps from the typed name's max version. In the no-rename case, the prop is omitted (today's behavior preserved).

#### Scenario: Rename to a brand-new name
- **WHEN** `isNameChanged` is `true` and `existingVersions[image.name]` is empty
- **THEN** the modal opens with the version field pre-filled to `1.0.0`

#### Scenario: Rename to a name that already has versions
- **WHEN** `isNameChanged` is `true` and `existingVersions[image.name]` is `['1.2.0', '1.3.0']`
- **THEN** the modal opens with the version field pre-filled to `1.3.1` (patch-bump of `1.3.0`)

#### Scenario: No rename, name has versions
- **WHEN** `isNameChanged` is `false` and `existingVersions[originalImage.name]` is `['1.2.0']`
- **THEN** the modal opens with the version field pre-filled to `1.2.1`

#### Scenario: Asset/prompt caller (no `defaultVersion` passed)
- **WHEN** any caller other than the image header renders `AddVersionModal` without `defaultVersion`
- **THEN** the existing patch-bump initializer runs unchanged

### Requirement: i18n keys
The locale file `apps/ai-dial-admin/src/locales/en.ts` SHALL define two new entries, mirroring the existing pair, with the same parent grouping as their `Version` siblings:

- Under `Buttons`: `SaveAsNewImage: 'Save as new image'`
- Under `Images` (alongside `SaveNewVersionModalTitle`): `SaveNewImageModalTitle: 'Save new image'`

The constants file `apps/ai-dial-admin/src/constants/i18n.ts` SHALL define matching enum entries:

- `ButtonsI18nKey.SaveAsNewImage = 'Buttons.SaveAsNewImage'`
- `ImagesI18nKey.SaveNewImageModalTitle = 'Images.SaveNewImageModalTitle'`

#### Scenario: Locale lookup at runtime
- **WHEN** `t(ButtonsI18nKey.SaveAsNewImage)` is called in production
- **THEN** the returned string is `'Save as new image'`

#### Scenario: Locale lookup in tests
- **WHEN** `t(ButtonsI18nKey.SaveAsNewImage)` is called inside a test that uses the mocked `useI18n` from `test-setup.tsx`
- **THEN** the returned string is `'Buttons.SaveAsNewImage'` (the key itself)

### Requirement: View-context skip of form-level version-existence validation
`ImageFields.verifyVersion` SHALL branch its settle behavior on the existing `isModal` prop. When `isModal === true` (image creation popup, where the version `<DialInput>` is rendered), the settle MUST compute `getSemanticVersionError(versionMap, name, t, image.version)`, MUST set the local `versionError` state for inline UI, and MUST dispatch `{ field: 'version', isValid: !error }` to the SaveValidationContext. When `isModal === false` (image view, where the version field is hidden), the settle MUST dispatch `{ field: 'version', isValid: true }` to clear the pessimistic dispatch from `onChangeName`, MUST NOT compute the existence error, and MUST NOT set `versionError` to an error value. The pessimistic dispatch in `ImageBase.onChangeName` SHALL remain unchanged in both contexts.

#### Scenario: View context, rename to a name whose hierarchy contains a colliding version
- **WHEN** the user is on the image view (`isModal=false`) and renames the image to a name whose existing versions include the current `image.version`
- **THEN** after `verifyVersion` settles, `field: 'version'` is dispatched as `isValid: true`, the form remains valid, and the **Save as new image** fork button stays enabled so the user can open `AddVersionModal`

#### Scenario: View context, rename to a brand-new name
- **WHEN** the user is on the image view and renames to a name with no known versions
- **THEN** after `verifyVersion` settles, `field: 'version'` is dispatched as `isValid: true` (no existence error computed) and the fork button stays enabled

#### Scenario: Modal context, version exists for typed name
- **WHEN** the user is in the image creation popup (`isModal=true`) and types a name+version pair that already exists
- **THEN** `verifyVersion` settles by computing `getSemanticVersionError`, sets `versionError` for inline UI, and dispatches `field: 'version', isValid: false` so the popup's `Create` button is disabled

#### Scenario: Modal `AddVersionModal` blocks Create on user-typed collision
- **WHEN** the fork modal is open and the user edits the version field to a value that already exists for the entity name
- **THEN** the modal's own `validateVersion` dispatches `field: 'version', isValid: false`, the aggregate `isValid` is false, and the `Create` button is disabled

### Requirement: Accessibility unchanged
The fork button and modal title MUST continue to expose their visible labels through the existing `DialPrimaryButton` and `DialFormPopup` components from `@epam/ai-dial-ui-kit`, which already render semantic elements with accessible names from their `label` / `header` props. No new ARIA attributes SHALL be introduced.

#### Scenario: Screen reader on the rename button
- **WHEN** a screen reader reads the fork button after the user changes `name`
- **THEN** the announced name is "Save as new image"
