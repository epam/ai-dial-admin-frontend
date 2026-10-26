# free-text-suggestion-fields Specification

## Purpose

Names the form fields whose value is free text with suggestions, so a design-system migration cannot silently turn them into pick-only selects again.

## Requirements

### Requirement: Deployment display name accepts any text

The Display Name field of a deployment entity (model, application, toolset) — in its create popup, including the one opened from a running Model Serving, and on its Properties tab — SHALL accept any typed text as the display name. The display names of existing entities SHALL be offered as suggestions, sorted and without duplicates, and the list SHALL open on focus. Each edit SHALL update the display name and run the display-name validation, so Save reflects the typed text without leaving the field.

#### Scenario: Type a new display name from a Model Serving

- **WHEN** the user opens a running Model Serving, clicks Create → Model, and types `My test model` into Display Name
- **THEN** the field SHALL show `My test model`
- **AND** the created model SHALL carry the display name `My test model`

#### Scenario: Pick an existing display name

- **WHEN** the user focuses Display Name and clicks an existing name in the list
- **THEN** the display name SHALL become that name and the display-name validation SHALL run for it

#### Scenario: Validation runs while typing

- **WHEN** the user clears the Display Name field
- **THEN** the required-field error SHALL show and Save SHALL be blocked without leaving the field

#### Scenario: Read-only admin

- **WHEN** a read-only admin opens the Properties tab
- **THEN** the Display Name field SHALL be disabled

### Requirement: HuggingFace model name accepts any text

The HuggingFace model name field of a container source SHALL accept any typed model id. After more than two typed characters, the field SHALL search HuggingFace (debounced ~100 ms) and offer up to five returned model ids as suggestions, unfiltered on the client. The typed id SHALL become the container's model name when the user leaves the field; leaving it with the text unchanged SHALL change nothing; picking a suggestion SHALL set it at once. The model name SHALL then be validated by the existing HuggingFace model-name rule. While a search is in flight the field SHALL show a loading spinner. A search that returns nothing, or fails, SHALL clear the previous suggestions, and a response for an earlier query SHALL NOT replace the suggestions of a later one. The HuggingFace registry button beside the field SHALL keep working as before, SHALL stay aligned with the field whether or not an error shows below it, and the field SHALL stay disabled for a running container.

#### Scenario: Type a model id not in the suggestions

- **WHEN** the user types `org/my-private-model` and leaves the field
- **THEN** the container's model name SHALL be `org/my-private-model`

#### Scenario: Leaving an untouched field

- **WHEN** the user tabs through the empty model name field without typing
- **THEN** the container SHALL stay unchanged and no required-field error SHALL show

#### Scenario: Suggestions after three characters

- **WHEN** the user types `lla`
- **THEN** the field SHALL show up to five HuggingFace model ids returned for `lla`

#### Scenario: Pick a suggested model

- **WHEN** the user clicks a suggested model id
- **THEN** the container's model name SHALL be that id

#### Scenario: Spinner while searching

- **WHEN** the user has typed `lla` and the HuggingFace search has not answered yet
- **THEN** the field SHALL show a loading spinner, which SHALL disappear when the answer arrives

#### Scenario: An empty answer clears stale suggestions

- **WHEN** a search for `lla` returned models and the user extends the text to one that returns none
- **THEN** no suggestion list SHALL be shown

#### Scenario: Running container

- **WHEN** the container is running
- **THEN** the model name field and the HuggingFace registry button SHALL be disabled
