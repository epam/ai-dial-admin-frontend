## Why

Backend PR #296 (https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/296) adds the ability to stop in-progress image builds via `DELETE /images/builds/{id}`, introducing a new `BUILD_STOPPED` status. Currently, the frontend has no UI to trigger this API, leaving users unable to interrupt long-running or problematic builds. The `BUILD_STOPPED` enum value already exists in `types/deployments/images.ts` but is not wired up — no button, no translation, no styling.

## What Changes

- **Stop button**: Add a Stop button to `ImagesButtonsWrapper` that appears when `buildStatus === BUILDING`. Uses `IconPlayerPause` (consistent with container stop) and `ButtonsI18nKey.Stop` (already exists).
- **Confirmation modal**: New `ImageStopBuild.tsx` component (similar to `ImageInstall.tsx`) prompts user before stopping: "Are you sure you want to stop building this image? The build process will be interrupted and you can restart it later."
- **API layer**: Add `stopBuild(id, token)` method to `ImagesApi` class, calling `DELETE /images/builds/{id}`.
- **Server action**: Add `stopBuild(id)` server action wrapping the API call.
- **Type system support**: Add `BUILD_STOPPED` to `STATUS_I18N_KEYS` (mapped to `ImagesI18nKey.BuildStopped`) and `STATUS_CLASSNAMES` (styled as `bg-orange-400` to match `CONTAINER_STATUS.STOPPED`).
- **Translations**: Add `BuildStopped`, `StopBuildModalTitle`, `StopBuildModalDescription`, `BuildStoppedSuccess`, and `BuildStoppedSuccessDescription` to `en.ts`.
- **Success notification**: Show toast notification after successful stop: "{type} Image build stopped / Latest progress has been preserved".

## Non-goals

- No changes to existing build logic or polling behavior (already stops when status !== BUILDING)
- No changes to `allowEditing` logic (BUILD_STOPPED will automatically allow editing/save/install like BUILD_FAILED)
- No retry/resume functionality beyond the existing Install button (BUILD_STOPPED behaves like BUILD_FAILED — user can Install again)

## Capabilities

### New Capabilities
- `stop-image-build`: Stop button UI, confirmation modal, API integration, status display, success notification

## Impact

- **Components**: `ImagesButtonsWrapper.tsx` (Stop button + modal), `ImageStopBuild.tsx` (new modal component)
- **Types/Constants**: `STATUS_I18N_KEYS`, `STATUS_CLASSNAMES` in `constants/deployments/images.tsx`
- **Translations**: New keys in `locales/en.ts` under `Images` section
- **API layer**: `stopBuild` method in `server/deployments/images.ts`
- **Server actions**: `stopBuild` in `app/actions/deployments.ts`
- **Behavior**: BUILD_STOPPED status will automatically get correct permissions (edit/save/install allowed) due to existing logic
