## MODIFIED Requirements

### Requirement: Stop build confirmation modal
Clicking the Stop button SHALL open a confirmation modal (`ImageStopBuild.tsx`, following the `ImageInstall.tsx` pattern) built on `ConfirmationPopup`. The modal header SHALL be `t(ImagesI18nKey.StopBuildModalTitle)` ("Stop Build"). The modal body SHALL show the description `t(ImagesI18nKey.StopBuildModalDescription)` and the version as "Version: {image.version}", both styled `text-secondary small-150`. The confirm button SHALL be labelled `t(ButtonsI18nKey.Stop)`. Clicking Cancel SHALL close the modal without taking any action; clicking the confirm button SHALL invoke the stop action and close the modal.

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
