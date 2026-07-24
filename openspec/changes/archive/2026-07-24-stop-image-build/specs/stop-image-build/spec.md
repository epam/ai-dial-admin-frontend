## Capability: stop-image-build

**Summary**: Enable users to stop in-progress image builds via UI button, with confirmation modal, API integration, and BUILD_STOPPED status display.

## Requirements

### Functional Requirements

**FR1: Stop Button Visibility**
- The Stop button MUST appear in the image header controls when `image.buildStatus === IMAGE_STATUS.BUILDING`
- The Stop button MUST NOT appear when the status is NOT_BUILT, BUILT, BUILD_FAILED, or BUILD_STOPPED
- The Stop button MUST appear after the Delete button and before the Install button in the button group
- The Stop button MUST NOT appear when the JSON editor is enabled

**FR2: Stop Button Appearance**
- The Stop button MUST use `DialNeutralButton` component (neutral/gray styling)
- The Stop button MUST display `IconPlayerPause` icon from `@tabler/icons-react`
- The Stop button MUST display the label from `ButtonsI18nKey.Stop` (already exists: "Stop")
- The icon MUST use `BASE_BUTTON_ICON_PROPS` for consistent sizing

**FR3: Confirmation Modal**
- Clicking the Stop button MUST open a confirmation modal
- The modal MUST use `DialConfirmationPopup` component
- The modal header MUST display the translated text from `ImagesI18nKey.StopBuildModalTitle` ("Stop Build")
- The modal MUST display:
  - Description: Translated text from `ImagesI18nKey.StopBuildModalDescription`
  - Version information: "Version: {image.version}"
  - Both text elements MUST use `text-secondary small-150` styling
- The confirm button MUST display the translated text from `ButtonsI18nKey.Stop` ("Stop")
- The modal MUST have Cancel and Stop Build buttons
- Clicking Cancel MUST close the modal without taking action
- Clicking Stop Build MUST trigger the stop action and close the modal

**FR4: API Integration**
- The system MUST call `DELETE /images/builds/{id}` when the user confirms stopping
- The API client MUST implement `stopBuild(id: string, token: Token): Promise<ServerActionResponse>` in `ImagesApi` class
- The server action MUST implement `stopBuild(id: string)` that authenticates via `getUserToken()` and calls the API
- The endpoint URL MUST be `${INSTALL_IMAGES_URL}/${id}` where `INSTALL_IMAGES_URL = ${BASE_IMAGES_URL}/builds`

**FR5: Success Feedback**
- On successful stop, the system MUST display a success toast notification
- The notification title MUST be translated from `ImagesI18nKey.BuildStoppedSuccess` with the image type parameter: "{type} Image build stopped"
- The notification description MUST be translated from `ImagesI18nKey.BuildStoppedSuccessDescription`: "Latest progress has been preserved"
- After showing the notification, the system MUST call `router.refresh()` to update the view with the new status

**FR6: Error Handling**
- On API error, the system MUST display an error notification with the error header and message from the response
- On network error, the system MUST display an error notification
- The polling mechanism MUST continue if the stop action fails
- The user MUST be able to retry the stop action after an error

**FR7: BUILD_STOPPED Status Display**
- The `BUILD_STOPPED` status MUST be added to `STATUS_I18N_KEYS` mapping to `ImagesI18nKey.BuildStopped` ("Build stopped")
- The `BUILD_STOPPED` status MUST be added to `STATUS_CLASSNAMES` mapping to `'bg-orange-400'` (orange dot)
- The status indicator MUST display an orange dot and "Build stopped" text when status is `BUILD_STOPPED`
- The status indicator MUST NOT show a spinner/loader for `BUILD_STOPPED` (only for BUILDING, PENDING, STOPPING)

**FR8: BUILD_STOPPED Behavior**
- When status is `BUILD_STOPPED`, the image MUST be editable (same as BUILD_FAILED, NOT_BUILT)
- When status is `BUILD_STOPPED`, the Save button MUST be enabled (if there are changes)
- When status is `BUILD_STOPPED`, the Install button MUST be enabled and visible (user can retry)
- When status is `BUILD_STOPPED`, the Stop button MUST NOT be visible
- The polling mechanism MUST stop when status becomes `BUILD_STOPPED` (status !== BUILDING)

### Non-Functional Requirements

**NFR1: Consistency**
- The Stop button icon MUST match the container stop button (`IconPlayerPause`)
- The modal structure MUST follow the pattern of `ImageInstall.tsx` modal
- The success notification pattern MUST follow existing notification patterns (`getSuccessNotification`)
- The BUILD_STOPPED color (`bg-orange-400`) MUST match `CONTAINER_STATUS.STOPPED` color

**NFR2: Accessibility**
- The Stop button MUST be keyboard accessible
- The modal MUST be screen-reader accessible (DialConfirmationPopup handles this)
- The status indicator MUST have appropriate ARIA labels (handled by StatusIcon component)

**NFR3: Performance**
- The Stop action MUST complete within 2 seconds under normal network conditions
- The UI MUST refresh automatically after the backend status changes (via existing polling)
- The polling interval MUST remain at 5 seconds (no change to existing logic)

**NFR4: Internationalization**
- All user-facing strings MUST be translated via `useI18n()` hook
- All translation keys MUST be added to `locales/en.ts`
- Translation keys MUST be added to `ImagesI18nKey` enum in `constants/i18n.ts`

## UI Specifications

### Stop Button Layout

```
Normal state (when not BUILDING):
[Version Select] [Delete] [Create Container] [Install]

Building state:
[Version Select] [Delete] [Stop] [Install (disabled)]
                          ^^^^^^
                          NEW
```

### Modal Layout

```
┌────────────────────────────────────────┐
│ Stop Build                         [×] │
├────────────────────────────────────────┤
│                                        │
│ Are you sure you want to stop         │
│ building this image? The build         │
│ process will be interrupted and        │
│ you can restart it later.              │
│                                        │
│ Version: 1.0.0                         │
│                                        │
│              [Cancel] [Stop Build]     │
└────────────────────────────────────────┘
```

### Status Indicator

```
BUILD_STOPPED:
● Build stopped
└─ Orange dot (bg-orange-400)
└─ Static (no spinner)
```

## API Specifications

### Endpoint

**Request**:
```
DELETE /images/builds/{id}
Authorization: Bearer {token}
```

**Success Response** (200 OK):
```json
{
  "success": true
}
```

**Error Responses**:
- 400 Bad Request: Build is not in BUILDING state
- 404 Not Found: Image definition doesn't exist
- 500 Internal Server Error: Build stop failed

### API Client Method

```typescript
// In ImagesApi class
stopBuild(id: string, token: Token): Promise<ServerActionResponse> {
  return this.deleteAction(`${INSTALL_IMAGES_URL}/${id}`, token);
}
```

### Server Action

```typescript
'use server'

export async function stopBuild(id: string): Promise<ServerActionResponse> {
  const token = await getUserToken();
  return new ImagesApi().stopBuild(id, token);
}
```

## Translation Keys

Add to `locales/en.ts` in the `Images` section:

```typescript
BuildStopped: 'Build stopped',
StopBuildModalTitle: 'Stop Build',
StopBuildModalDescription: 'Are you sure you want to stop building this image? The build process will be interrupted and you can restart it later.',
BuildStoppedSuccess: '{type} Image build stopped',
BuildStoppedSuccessDescription: 'Latest progress has been preserved',
```

## Component Specifications

### ImageStopBuild Component

**File**: `components/Deployments/Modals/ImageStopBuild.tsx`

**Props**:
```typescript
interface Props {
  isModalOpen: boolean;
  title: string;
  onClose: () => void;
  onApply: (image: Image) => void;
  image: Image;
}
```

**Structure**:
```tsx
<DialConfirmationPopup
  portalId="ImageStopBuildModal"
  onClose={onClose}
  header={title}
  open={isModalOpen}
  confirmLabel={t(ButtonsI18nKey.Stop)}
  onConfirm={() => {
    onApply(image);
    onClose();
  }}
>
  <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-2">
    <p className="text-secondary small-150">
      {t(ImagesI18nKey.StopBuildModalDescription)}
    </p>
    <p className="text-secondary small-150">
      {t(EntityFieldsI18nKey.version)}:
      <span className="text-primary ml-1">{image.version}</span>
    </p>
  </div>
</DialConfirmationPopup>
```

### ImagesButtonsWrapper Updates

**Stop Button**:
```tsx
{image.buildStatus === IMAGE_STATUS.BUILDING && (
  <DialNeutralButton
    className={buttonsClassNames}
    label={t(ButtonsI18nKey.Stop)}
    iconBefore={<IconPlayerPause {...BASE_BUTTON_ICON_PROPS} />}
    onClick={onOpenStopModal}
  />
)}
```

**Modal Portal**:
```tsx
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

## State Transitions

```
NOT_BUILT ────[Install]────▶ BUILDING ──[Success]──▶ BUILT
                                │
                                ├─[Failure]──▶ BUILD_FAILED
                                │
                                └─[Stop]─────▶ BUILD_STOPPED
                                              (NEW TRANSITION)

From BUILD_STOPPED:
  - [Install] → BUILDING (retry)
  - [Edit/Save] → Modify definition
  - [Delete] → Remove image
```

## Acceptance Criteria

1. ✓ Stop button appears only when status is BUILDING
2. ✓ Stop button uses IconPlayerPause and neutral styling
3. ✓ Clicking Stop opens confirmation modal
4. ✓ Modal shows description, version, and explanation
5. ✓ Confirming stop calls API and shows success notification
6. ✓ BUILD_STOPPED status displays with orange dot and "Build stopped" text
7. ✓ BUILD_STOPPED status allows editing, saving, and installing
8. ✓ Polling stops when status becomes BUILD_STOPPED
9. ✓ Error cases show appropriate error notifications
10. ✓ All strings are translated via i18n
11. ✓ Component follows existing modal patterns
12. ✓ No regressions in existing build/install flows
