# multi-step-modals Specification

## Purpose
TBD - created by archiving change steps-in-multistep-modals. Update Purpose after archive.
## Requirements
### Requirement: Multi-step modals present their steps with the ui-kit Steps component

Every modal or wizard that walks a user through two or more steps SHALL render the ui-kit `Steps` indicator above the
step content, inside a single `Popup` that stays mounted while the step changes. The footer SHALL be
`StepperModalButtons`. Step status SHALL be derived from the validity of that step's fields, and a step SHALL be
reachable through `Steps` only when the steps before it are valid.

#### Scenario: Steps are shown for the whole flow

- **WHEN** a user opens a multi-step modal
- **THEN** the modal shows an ordered list of all its steps with the current step marked as current
- **AND** moving between steps does not close and reopen the dialog

#### Scenario: A later step is not reachable while an earlier one is invalid

- **WHEN** the current step has invalid fields
- **THEN** the user cannot advance through the Next button or by selecting a later step in the indicator

### Requirement: StepperModalButtons supports an informative last step

`StepperModalButtons` SHALL accept an optional `isLastStepInformative` property, off by default. When it is not
provided the footer SHALL behave exactly as before. When it is provided:

- on the second-to-last step the footer SHALL show Back (except on the first step), Cancel, and **Finish** in place
  of Next, using `finishButtonLabel` and `onFinishClick`; Finish SHALL be enabled when every step before the
  informative step is valid and no load is in progress;
- on the last step the footer SHALL show only a **Close** button that calls `onClose`, with no Back, Cancel, Next, or
  Finish.

#### Scenario: Default footer is unchanged

- **WHEN** `isLastStepInformative` is not provided
- **THEN** the footer shows Back, Cancel, and Next on intermediate steps and Finish only on the last step, as before

#### Scenario: Finish replaces Next before the informative step

- **WHEN** `isLastStepInformative` is provided and the current step is the second to last
- **THEN** the footer shows Finish with the supplied label and no Next button
- **AND** Finish is enabled once the steps before the informative step are valid

#### Scenario: Informative step offers only Close

- **WHEN** `isLastStepInformative` is provided and the current step is the last
- **THEN** the footer shows only Close
- **AND** activating Close calls `onClose`

### Requirement: A completed action locks the steps before an informative step

When a multi-step modal reaches an informative last step after an irreversible action, every earlier step SHALL be
disabled in the `Steps` indicator while keeping its completed status, so the user cannot return to a step whose action
has already been performed.

#### Scenario: Earlier steps cannot be re-entered

- **WHEN** the modal is showing its informative last step
- **THEN** the earlier steps are shown as completed and cannot be selected

