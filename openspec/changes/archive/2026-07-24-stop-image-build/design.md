## Context

The backend deployment manager now supports stopping in-progress image builds (PR #296). The endpoint `DELETE /images/builds/{id}` safely interrupts the build job, changes status to `BUILD_STOPPED`, preserves logs, and handles race conditions. The frontend enum `IMAGE_STATUS.BUILD_STOPPED = 'build_stopped'` already exists but is incomplete — missing from status maps, translations, and UI controls.

The existing polling mechanism (every 5s) in `ImageView.tsx` already stops when `buildStatus !== BUILDING`, so BUILD_STOPPED will automatically stop polling. The `allowEditing` logic already permits editing when status is not BUILT or BUILDING, so BUILD_STOPPED will automatically allow edit/save/install operations.

## Goals / Non-Goals

**Goals:**
- Enable users to stop builds in progress via a Stop button
- Show confirmation modal before stopping (consistent with Install flow)
- Display BUILD_STOPPED status with appropriate styling (orange, like CONTAINER_STATUS.STOPPED)
- Show success notification after stopping
- Reuse existing component patterns (modal similar to ImageInstall, button placement like container stop)

**Non-Goals:**
- No changes to polling logic (already handles BUILD_STOPPED correctly)
- No changes to allowEditing logic (BUILD_STOPPED inherits correct behavior)
- No special retry logic (Install button already works for stopped builds)
- No edge case UI for race conditions (backend handles these, frontend just refreshes)

## Decisions

### 1. Stop button placement and appearance

**Decision**: Add Stop button after Delete button, before Install button. Visible only when `buildStatus === BUILDING`.

**Component**: `DialNeutralButton` (gray styling, not destructive)
**Icon**: `IconPlayerPause` from `@tabler/icons-react` (same as container stop)
**Label**: `t(ButtonsI18nKey.Stop)` (key already exists)

**Why**: Neutral styling matches other action buttons. IconPlayerPause is familiar from container controls. Position places destructive actions (Delete) first, Stop in middle, constructive actions (Install) last.

### 2. Confirmation modal

**Decision**: Create new `ImageStopBuild.tsx` component following the `ImageInstall.tsx` pattern.

**Props**: `{ image, title, isModalOpen, onClose, onApply }`
**Component**: `DialConfirmationPopup` with custom content
**Content**:
- Description: "Are you sure you want to stop building this image?"
- Version display: "Version: {image.version}"
- Explanation: "The build process will be interrupted and you can restart it later."
**Buttons**: Cancel (default) / Stop Build (confirm)

**Why**: Stopping a build is a significant action that wastes resources and user time if accidental. Confirmation prevents misclicks. Pattern matches existing ImageInstall modal structure for consistency.

### 3. BUILD_STOPPED status styling

**Decision**: Use `bg-orange-400` (orange dot) for BUILD_STOPPED status indicator.

**Rationale**:
- Not red (not a failure — user intentionally stopped it)
- Not green (not successful)
- Orange signals "attention needed" / "incomplete action"
- Matches `CONTAINER_STATUS.STOPPED` which also uses `bg-orange-400`

**Translation**: `BuildStopped: 'Build stopped'` (user's preference over "Installation stopped" or "Build interrupted")

### 4. Success notification

**Decision**: Show toast notification after successful stop.

**Title**: `t(ImagesI18nKey.BuildStoppedSuccess, { type })` → "{type} Image build stopped"
**Description**: `t(ImagesI18nKey.BuildStoppedSuccessDescription)` → "Latest progress has been preserved"

**Why**: Provides immediate feedback that the action succeeded. "Latest progress preserved" reassures user that work wasn't lost.

### 5. API integration

**Decision**: Add `stopBuild(id: string, token: Token)` to `ImagesApi` class.

**Implementation**:
```typescript
stopBuild(id: string, token: Token): Promise<ServerActionResponse> {
  return this.deleteAction(`${INSTALL_IMAGES_URL}/${id}`, token);
}
```

**Endpoint**: `DELETE /images/builds/{id}` (already implemented in backend)
**Response handling**:
- Success: Show toast, `router.refresh()` to update status
- Error: Show error notification, keep polling (user can retry)

**Server action**: `stopBuild(id: string)` wraps API call, authenticates via `getUserToken()`, returns `ServerActionResponse`.

### 6. Modal type and state management

**Decision**: Add `ModalType.stopBuild` to the modal type enum in `ImagesButtonsWrapper`.

**Flow**:
1. User clicks Stop button → `onOpenModal(ModalType.stopBuild)`
2. `isModalOpen` becomes true, `modalType` set to `stopBuild`
3. Portal renders `ImageStopBuild` modal
4. User confirms → `onStopBuild` callback → API call
5. Success → toast + `router.refresh()` + `onCloseModal()`

**Why**: Follows existing pattern used for install/delete/create modals in the same component.

### 7. BUILD_STOPPED behavior inheritance

**Decision**: No explicit logic changes for BUILD_STOPPED. It inherits correct behavior from existing conditions.

**Verification**:
- `allowEditing = status !== BUILT && status !== BUILDING` → BUILD_STOPPED !== BUILT ✓, BUILD_STOPPED !== BUILDING ✓ → Can edit ✓
- `allowSave = status !== BUILDING && ...` → BUILD_STOPPED !== BUILDING ✓ → Can save ✓
- Install button shows when `allowEditing` ✓ → Install button enabled ✓
- Polling stops when `status !== BUILDING` ✓ → BUILD_STOPPED stops polling ✓

**Why**: The existing logic already treats BUILD_STOPPED correctly. No special casing needed.

## Component Structure

```
ImageView
└── ImagesHeader
    └── ImagesButtonsWrapper
        ├── [Version Select]
        ├── [Delete] ──────────────> ImageDelete modal
        ├── [Stop] ────────────────> ImageStopBuild modal (NEW)
        │   (shows when BUILDING)
        ├── [Create Container] ────> ImageCreateContainer
        └── [Install] ─────────────> ImageInstall modal
            (disabled when BUILDING)
```

## User Flow

```
1. User views image with buildStatus=BUILDING
   → UI shows: ⏳ Installing... status
   → Buttons: [Version] [Delete] [Stop] [Install (disabled)]

2. User clicks Stop
   → Modal opens: "Stop Build"
   → Content: Warning + version + explanation

3. User clicks "Stop Build"
   → Modal closes
   → API call: DELETE /images/builds/{id}
   → (Optional loading state)

4. API responds success
   → Toast: "MCP Image build stopped"
   → router.refresh() fetches new status

5. Backend changes status to BUILD_STOPPED
   → Poll detects status !== BUILDING
   → Polling stops

6. UI updates
   → Status: ● Build stopped (orange)
   → Buttons: [Version] [Delete] [Install]
   → Stop button disappears
   → Install button enabled
   → User can retry or edit
```

## Edge Cases

**Race condition (build completes during stop)**:
- Backend handles with row locks
- If build already finished, backend returns error
- Frontend: Just refresh, don't show error (outcome is acceptable)

**Network error**:
- Show error notification
- Keep polling
- User can retry Stop

**Backend validation (not BUILDING)**:
- Backend returns 400 if status isn't BUILDING
- Frontend shows error notification

## Risks / Trade-offs

- **Button placement** → Adds visual complexity to header. Trade-off: Better UX for stopping builds outweighs slight clutter. Button only appears during builds.
- **Confirmation modal** → Adds friction to stopping. Trade-off: Prevents accidental stops, which waste more time than the extra click.
- **Orange styling** → No existing BUILD_STOPPED usage to validate against. Risk: Could confuse with CONTAINER_STATUS.STOPPED if users don't read the status text. Mitigation: Consistent semantics (stopped = orange) across entity types.
