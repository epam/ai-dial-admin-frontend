## MODIFIED Requirements

### Requirement: Configuring a model requires no admin-backend call
Every field this surface writes is owned by DIAL Core. The system SHALL NOT require any admin-backend request in order to view or set a model's fields, or to read the Interceptors tab's selectable option list. Where a field's set of suggested values exists only in the admin backend, the field SHALL remain directly editable rather than offering selection alone.

#### Scenario: The tokenizer model is typed, not selected
- **WHEN** a user sets a model's tokenizer
- **THEN** the value can be entered directly, without any list being fetched, since DIAL Core treats it as an opaque string it neither validates nor enumerates

#### Scenario: Clearing the tokenizer stores it as unset
- **WHEN** a user clears the tokenizer field and saves
- **THEN** the property is absent from the write payload rather than sent as an empty string

#### Scenario: Topics need no catalogue
- **WHEN** a user opens the topics control on a model asset
- **THEN** no topic catalogue is requested, and topics can still be added and saved

#### Scenario: Entity surfaces keep their catalogues
- **WHEN** a user opens the topics control on an admin-backend-backed entity surface
- **THEN** the topic catalogue is still requested, unchanged

#### Scenario: The Interceptors tab's option list comes from Core, both populations
- **WHEN** a user opens the Interceptors tab on a model asset
- **THEN** the selectable interceptors are read from DIAL Core as the union of its API-written and configuration-file populations, exactly as `Assets > App Runners` already does, and no admin-backend request contributes to the list

#### Scenario: A Core read failure still renders the tab
- **WHEN** DIAL Core's interceptor population cannot be read
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used on `Assets > App Runners` is shown

### Requirement: Interceptors tab
The system SHALL provide an Interceptors tab on the model asset detail view, editing the resource's `interceptors`, with a `Source` column distinguishing the two Core populations an option can come from, matching the same column on `Assets > App Runners`.

#### Scenario: Interceptor selection round-trips on the model resource
- **WHEN** a user selects interceptors on a model asset and saves
- **THEN** the selection persists to the resource's `interceptors` and is rendered as selected when the view is reopened

#### Scenario: An unresolvable interceptor reference is reported
- **WHEN** a save is rejected by Core because a selected interceptor does not resolve in the merged config
- **THEN** the validation warnings Core returns are surfaced to the user, identifying the offending reference rather than reporting a generic failure

#### Scenario: Each option's population is labelled
- **WHEN** the Interceptors tab renders its option list
- **THEN** each option's `Source` column reads which of Core's two populations it came from
