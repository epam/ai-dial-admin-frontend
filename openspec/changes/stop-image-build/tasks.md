## 1. Type System Support

- [x] 1.1 Add translation keys to `locales/en.ts` in the `Images` section:
  - `BuildStopped: 'Build stopped'`
  - `StopBuildModalTitle: 'Stop Build'`
  - `StopBuildModalDescription: 'Are you sure you want to stop building this image? The build process will be interrupted and you can restart it later.'`
  - `BuildStoppedSuccess: '{type} Image build stopped'`
  - `BuildStoppedSuccessDescription: 'Latest progress has been preserved'`
- [x] 1.2 Add `BUILD_STOPPED` to `STATUS_I18N_KEYS` in `constants/deployments/images.tsx`: `[IMAGE_STATUS.BUILD_STOPPED]: ImagesI18nKey.BuildStopped`
- [x] 1.3 Add `BUILD_STOPPED` to `STATUS_CLASSNAMES` in `constants/deployments/images.tsx`: `[IMAGE_STATUS.BUILD_STOPPED]: 'bg-orange-400'`
- [x] 1.4 Verify TypeScript compilation with no errors

## 2. API Layer

- [x] 2.1 Add `stopBuild(id: string, token: Token): Promise<ServerActionResponse>` method to `ImagesApi` class in `server/deployments/images.ts`
  - Implementation: `return this.deleteAction(\`\${INSTALL_IMAGES_URL}/\${id}\`, token);`
- [x] 2.2 Verify endpoint constant `INSTALL_IMAGES_URL` is correctly defined as `${BASE_IMAGES_URL}/builds`

## 3. Server Actions

- [x] 3.1 Add `stopBuild(id: string)` server action in `app/actions/deployments.ts` (or relevant actions file)
  - Mark as 'use server'
  - Get token via `getUserToken()`
  - Call `ImagesApi.stopBuild(id, token)`
  - Return `ServerActionResponse`

## 4. Stop Build Modal Component

- [x] 4.1 Create `components/Deployments/Modals/ImageStopBuild.tsx`
  - Props: `{ image: Image, title: string, isModalOpen: boolean, onClose: () => void, onApply: (image: Image) => void }`
  - Use `DialConfirmationPopup` component
  - Header: `title` prop
  - Confirm label: `t(ButtonsI18nKey.Stop)` (already exists)
  - Content: Description paragraph + version display + explanation paragraph
  - `onConfirm` calls `onApply(image)` then `onClose()`
- [x] 4.2 Add `ModalType.stopBuild` to `ModalType` enum in `components/EntityListView/Components/Modals.ts` (if not already present as a string literal)

## 5. Update ImagesButtonsWrapper

- [x] 5.1 Import `IconPlayerPause` from `@tabler/icons-react`
- [x] 5.2 Import `stopBuild` action from `app/actions/deployments`
- [x] 5.3 Import `ImageStopBuild` component
- [x] 5.4 Add `ModalType.stopBuild` to local modal type handling (if using enum)
- [x] 5.5 Add `onStopBuild` callback:
  ```typescript
  const onStopBuild = useCallback(
    (image: Image) => {
      stopBuild(image.id).then((res) => {
        if (res.success) {
          const type = getTranslatedType(getRouteByType(image.$type), t);
          showNotification(
            getSuccessNotification(
              t(ImagesI18nKey.BuildStoppedSuccess, { type }),
              t(ImagesI18nKey.BuildStoppedSuccessDescription),
            ),
          );
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, showNotification, t, image.$type],
  );
  ```
- [x] 5.6 Add `onOpenStopModal` callback: `const onOpenStopModal = useCallback(() => { onOpenModal(ModalType.stopBuild); }, [onOpenModal]);`
- [x] 5.7 Add Stop button in the button group (after Delete, before Create Container, when not in jsonEditor mode):
  ```typescript
  {image.buildStatus === IMAGE_STATUS.BUILDING && (
    <DialNeutralButton
      className={buttonsClassNames}
      label={t(ButtonsI18nKey.Stop)}
      iconBefore={<IconPlayerPause {...BASE_BUTTON_ICON_PROPS} />}
      onClick={onOpenStopModal}
    />
  )}
  ```
- [x] 5.8 Add modal portal for `ImageStopBuild` (after existing modals, before closing `</>`):
  ```typescript
  {isModalOpen &&
    modalType === ModalType.stopBuild &&
    createPortal(
      <ImageStopBuild
        image={image}
        title={t(ImagesI18nKey.StopBuildModalTitle)}
        isModalOpen={isModalOpen}
        onClose={onCloseModal}
        onApply={onStopBuild}
      />,
      document.body,
    )}
  ```

## 6. Verification

- [ ] 6.1 Verify BUILD_STOPPED status displays with orange dot and "Build stopped" text
- [ ] 6.2 Verify polling stops when status becomes BUILD_STOPPED
- [ ] 6.3 Verify Install button becomes enabled when status is BUILD_STOPPED
- [ ] 6.4 Verify edit/save functionality works with BUILD_STOPPED status
- [ ] 6.5 Test Stop button appears only when buildStatus === BUILDING
- [ ] 6.6 Test Stop button opens confirmation modal
- [ ] 6.7 Test successful stop shows toast and refreshes view
- [ ] 6.8 Test error handling (network error, backend validation error)

## 7. Quality Checks

- [x] 7.1 Run `npm run lint` and fix any issues
- [x] 7.2 Run `npm run format` and fix any issues
- [ ] 7.3 Run `npm run test` to ensure no regressions
- [ ] 7.4 Manual test: Start a build, stop it, verify all UI states
- [ ] 7.5 Manual test: Try to stop an already-completed build (verify error handling)
