# stop-image-build Specification

## Purpose

Defines the ability for users to stop an in-progress image build from the Images UI: the Stop button's visibility and placement in the image header controls, the confirmation modal shown before stopping, the `DELETE /images/builds/{id}` API integration (API client method, server action), the success/error notification behavior, and the display and editability rules for the resulting `BUILD_STOPPED` status. Backed by deployment-manager backend PR #296.

## Requirements

### Requirement: Stop button visibility and placement
The Stop button SHALL appear in the image header controls (`ImagesButtonsWrapper`) only when `image.buildStatus === IMAGE_STATUS.BUILDING`, positioned after the Delete button and before the Install button. The Stop button SHALL NOT appear for `NOT_BUILT`, `BUILT`, `BUILD_FAILED`, or `BUILD_STOPPED` statuses, and SHALL NOT appear when the JSON editor is enabled.

#### Scenario: Stop button shown while building
- **WHEN** `image.buildStatus === IMAGE_STATUS.BUILDING` and the JSON editor is not enabled
- **THEN** the Stop button SHALL be rendered between the Delete and Install buttons

#### Scenario: Stop button hidden for non-building statuses
- **WHEN** `image.buildStatus` is `NOT_BUILT`, `BUILT`, `BUILD_FAILED`, or `BUILD_STOPPED`
- **THEN** the Stop button SHALL NOT be rendered

#### Scenario: Stop button hidden when JSON editor is enabled
- **WHEN** the JSON editor is enabled, regardless of `buildStatus`
- **THEN** the Stop button SHALL NOT be rendered

### Requirement: Stop button appearance
The Stop button SHALL be rendered as a `DialNeutralButton` with the `IconPlayerPause` icon (from `@tabler/icons-react`, matching the container stop button) sized via `BASE_BUTTON_ICON_PROPS`, and labelled with `t(ButtonsI18nKey.Stop)`.

#### Scenario: Stop button styling matches container stop button
- **WHEN** the Stop button is rendered
- **THEN** it SHALL use `DialNeutralButton`, display the `IconPlayerPause` icon sized via `BASE_BUTTON_ICON_PROPS`, and show the label `t(ButtonsI18nKey.Stop)`

### Requirement: Stop build confirmation modal
Clicking the Stop button SHALL open a confirmation modal (`ImageStopBuild.tsx`, following the `ImageInstall.tsx` pattern) built on `DialConfirmationPopup`. The modal header SHALL be `t(ImagesI18nKey.StopBuildModalTitle)` ("Stop Build"). The modal body SHALL show the description `t(ImagesI18nKey.StopBuildModalDescription)` and the version as "Version: {image.version}", both styled `text-secondary small-150`. The confirm button SHALL be labelled `t(ButtonsI18nKey.Stop)`. Clicking Cancel SHALL close the modal without taking any action; clicking the confirm button SHALL invoke the stop action and close the modal.

#### Scenario: Modal opens on Stop click
- **WHEN** the user clicks the Stop button
- **THEN** the `ImageStopBuild` confirmation modal SHALL open, showing the "Stop Build" header, the stop description, and "Version: {image.version}"

#### Scenario: Cancel closes without action
- **WHEN** the user clicks Cancel in the Stop Build modal
- **THEN** the modal SHALL close and no stop request SHALL be made

#### Scenario: Confirm triggers stop and closes modal
- **WHEN** the user clicks the confirm button (labelled `t(ButtonsI18nKey.Stop)`) in the Stop Build modal
- **THEN** the stop action SHALL be triggered
- **AND** the modal SHALL close

### Requirement: Stop build API integration
The system SHALL implement `stopBuild(id: string, token: Token): Promise<ServerActionResponse>` on the `ImagesApi` class, calling `DELETE ${INSTALL_IMAGES_URL}/${id}` (where `INSTALL_IMAGES_URL = ${BASE_IMAGES_URL}/builds`). A corresponding server action `stopBuild(id: string)` SHALL authenticate via `getUserToken()` and delegate to `ImagesApi.stopBuild`.

#### Scenario: Confirming the modal calls the stop API
- **WHEN** the user confirms the Stop Build modal
- **THEN** the `stopBuild` server action SHALL be invoked with the image id
- **AND** it SHALL call `DELETE /images/builds/{id}` via `ImagesApi.stopBuild`

### Requirement: Success feedback on stop
On a successful stop response, the system SHALL show a success notification titled `t(ImagesI18nKey.BuildStoppedSuccess, { type })` ("{type} Image build stopped") with description `t(ImagesI18nKey.BuildStoppedSuccessDescription)` ("Latest progress has been preserved"), and SHALL call `router.refresh()` afterward to reflect the updated status.

#### Scenario: Success notification and refresh after stop
- **WHEN** `stopBuild` resolves successfully
- **THEN** a success notification SHALL be shown with title `t(ImagesI18nKey.BuildStoppedSuccess, { type })` and description `t(ImagesI18nKey.BuildStoppedSuccessDescription)`
- **AND** `router.refresh()` SHALL be called

### Requirement: Error handling for stop action
On an API error response or a network error, the system SHALL show an error notification using the error header and message from the response (or a generic error notification for network failures). A failed stop SHALL NOT interrupt the existing build-status polling, and the user SHALL be able to retry the stop action after an error.

#### Scenario: API error shows error notification
- **WHEN** `stopBuild` returns an error response
- **THEN** an error notification SHALL be shown using the response's error header and message
- **AND** polling SHALL continue unaffected

#### Scenario: Network error shows error notification and allows retry
- **WHEN** `stopBuild` fails due to a network error
- **THEN** an error notification SHALL be shown
- **AND** the user SHALL be able to click Stop again to retry

### Requirement: BUILD_STOPPED status display
`STATUS_I18N_KEYS` SHALL map `BUILD_STOPPED` to `ImagesI18nKey.BuildStopped` ("Build stopped"), and `STATUS_CLASSNAMES` SHALL map `BUILD_STOPPED` to `'bg-orange-400'` (matching `CONTAINER_STATUS.STOPPED`). The status indicator SHALL show an orange dot with the "Build stopped" text and SHALL NOT show a spinner/loader (spinners are reserved for `BUILDING`, `PENDING`, and `STOPPING`).

#### Scenario: BUILD_STOPPED renders orange static indicator
- **WHEN** `image.buildStatus === IMAGE_STATUS.BUILD_STOPPED`
- **THEN** the status indicator SHALL show an orange dot (`bg-orange-400`) with the text "Build stopped"
- **AND** SHALL NOT show a spinner/loader

### Requirement: BUILD_STOPPED editability and polling
When `image.buildStatus === IMAGE_STATUS.BUILD_STOPPED`, the image SHALL be editable and the Save button SHALL be enabled when there are pending changes (same as `BUILD_FAILED` and `NOT_BUILT`). The Install button SHALL be enabled and visible, allowing the user to retry the build. The Stop button SHALL NOT be visible. Build-status polling SHALL stop once `buildStatus` becomes `BUILD_STOPPED` (polling continues only while `buildStatus === BUILDING`).

#### Scenario: BUILD_STOPPED allows edit, save, and reinstall
- **WHEN** `image.buildStatus === IMAGE_STATUS.BUILD_STOPPED`
- **THEN** the image SHALL be editable, the Save button SHALL be enabled given pending changes, and the Install button SHALL be enabled and visible
- **AND** the Stop button SHALL NOT be visible

#### Scenario: Polling stops once build is stopped
- **WHEN** `buildStatus` transitions to `BUILD_STOPPED`
- **THEN** the polling mechanism SHALL stop issuing further status requests
