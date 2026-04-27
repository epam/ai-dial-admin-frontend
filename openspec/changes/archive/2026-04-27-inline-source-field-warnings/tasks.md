## 1. Move and generalize WarningIcon

- [x] 1.1 Create `apps/ai-dial-admin/src/components/Common/WarningIcon/WarningIcon.tsx` with `Props { warningText?: string }`. Body identical to the existing component: `IconAlertTriangleFilled` from `@tabler/icons-react`, `BASE_BUTTON_ICON_PROPS` size, `className="text-warning-icon"`, wrapped in `DialTooltip` with `placement="bottom"` and `triggerClassName={warningText ? 'w-[20px]' : 'hidden'}`. Hide the icon (`className=...'hidden'`) when `warningText` is falsy.
- [x] 1.2 Move/recreate the existing test (`UpstreamEndpoints/Endpoint/tests/WarningIcon.spec.tsx` if present, otherwise create from scratch) at `apps/ai-dial-admin/src/components/Common/WarningIcon/tests/WarningIcon.spec.tsx`. Cover: renders icon when `warningText` is truthy; hides icon when falsy/empty/undefined; tooltip text matches `warningText`.
- [x] 1.3 Update `apps/ai-dial-admin/src/components/UpstreamEndpoints/Endpoint/Endpoint.tsx` — change the import to the new path and rename the prop being passed: `<WarningIcon warningText={endpointWarning} />`.
- [x] 1.4 Delete `apps/ai-dial-admin/src/components/UpstreamEndpoints/Endpoint/WarningIcon.tsx` and any colocated test file. Run `npx vitest run src/components/UpstreamEndpoints/` to verify Endpoint tests still pass.
- [x] 1.5 Run a workspace-wide grep for any other reference to the old path (`UpstreamEndpoints/Endpoint/WarningIcon`) and update if found.

## 2. i18n keys

- [x] 2.1 Add two keys under `ContainersI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`:
  - `ContainerNotRunningTooltip = 'Containers.ContainerNotRunningTooltip'`
  - `ImageNotInstalledTooltip = 'Containers.ImageNotInstalledTooltip'`
  - (Single image tooltip — "Image is not installed" applies to both `NOT_BUILT` and `BUILD_FAILED`, matching `isImageNotInstalled(image)` and the banner's trigger. No need to differentiate at the icon level.)
- [x] 2.2 Add the corresponding entries under `Containers` in `apps/ai-dial-admin/src/locales/en.ts`:
  - `ContainerNotRunningTooltip: 'Container is not running'`
  - `ImageNotInstalledTooltip: 'Image is not installed'`

## 3. Container source field — keep unfiltered reference

- [x] 3.1 In `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.tsx`, replace the `currentContainerDisplayName: string` state with `currentContainer: Container | null` initialised to `null`.
- [x] 3.2 Update the fetch effect so that after `await getReqRef.current(getContainers)`, the saved container is found from the unfiltered list and stored in `currentContainer`; `containers` state still receives the running-only filter (unchanged behavior for the dropdown).
- [x] 3.3 Update the `selectedValue` prop on `DialInputPopup` to `selectedContainer?.displayName || currentContainer?.displayName`, replacing the existing `currentContainerDisplayName` reference.
- [x] 3.4 Verify all other reads of `currentContainerDisplayName` are migrated (none expected outside the popup's `selectedValue`, but grep to confirm).

## 4. Container source field — render WarningIcon

- [x] 4.1 In the same file, derive `containerWarning: string | undefined` after the fetch:
  - `currentContainer && currentContainer.status !== CONTAINER_STATUS.RUNNING` → `t(ContainersI18nKey.ContainerNotRunningTooltip)`
  - else → `undefined`
- [x] 4.2 Pass `iconBefore={<WarningIcon warningText={containerWarning} />}` to `DialInputPopup` in the non-modal branch only (lines 136-152, the popup-style branch). Do not modify the `isModal` branch (which renders `DialSelectField`).
- [x] 4.3 Import `WarningIcon` from the new `Common/WarningIcon/` location, `CONTAINER_STATUS` from `types/deployments/containers`, and `ContainersI18nKey` from `constants/i18n`.

## 5. Container image field — render WarningIcon

- [x] 5.1 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/InternalImageField.tsx`, derive `imageWarning: string | undefined`:
  - `isImageNotInstalled(image)` → `t(ContainersI18nKey.ImageNotInstalledTooltip)`
  - else → `undefined`
- [x] 5.2 Pass `iconBefore={<WarningIcon warningText={imageWarning} />}` to `DialInputPopup`.
- [x] 5.3 Import `WarningIcon` from `Common/WarningIcon/`, `isImageNotInstalled` from `utils/deployments/images`, and `ContainersI18nKey`.

## 6. Tests for the field decorations

- [x] 6.1 Update `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.spec.tsx` (existing file): add cases asserting:
  - When the saved container's status is `RUNNING`, no `WarningIcon` is rendered (or `warningText` is undefined / icon is hidden).
  - When the saved container's status is `STOPPED` (or any non-running), the `WarningIcon` renders with the expected tooltip key.
  - When `containerId` is empty / not in the response, the icon does not render.
- [x] 6.2 Update `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/tests/InternalImageField.spec.tsx`: add cases asserting:
  - When `isImageNotInstalled(image)` is true (covers both `NOT_BUILT` and `BUILD_FAILED`), the icon renders with the `ImageNotInstalledTooltip` key.
  - When the image is healthy (`buildStatus !== NOT_BUILT && buildStatus !== BUILD_FAILED`), no icon renders.
  - Reuse existing mocks from the test-setup; no new module mocks expected.

## 7. Code quality checks

- [x] 7.1 Run `npm run lint` — 0 errors; 26 pre-existing warnings in unrelated files, none on touched files
- [x] 7.2 Run `npm run format:write` — formatted one file
- [x] 7.3 Run `npm run test` — 4358 passed (66 new across this change + carryovers), 16 pre-existing skips, 0 failures
