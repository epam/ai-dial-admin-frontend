## RENAMED Requirements

- FROM: `### Requirement: The config-file population is out of scope for this capability`
- TO: `### Requirement: The config-file population is read on the same terms as every other covered view`

## MODIFIED Requirements

### Requirement: The config-file population is read on the same terms as every other covered view

The config-file-sourced half of the catalog-schema population is read here, on the same terms as on
the other views `config-file-entity-views` covers. The system SHALL render the `showConfigFiles`
toggle on this surface when the admin backend is not configured, and SHALL swap the list for the
read-only, config-file-sourced one while it is on.

#### Scenario: The config-file toggle is offered on this surface

- **WHEN** a user opens `/platform-catalog-schemas` and the admin backend is not configured
- **THEN** the `showConfigFiles` toggle is rendered next to the page title

#### Scenario: The views covered before this capability are unaffected

- **WHEN** a user opens any view the config-file entity surface covered before catalog schemas joined
- **THEN** its toggle behaves exactly as before

#### Scenario: A config-file-sourced schema opens read-only

- **WHEN** a user toggles the config-file list on and opens one of its entries
- **THEN** the schema's detail view renders with no save, delete, or create action

### Requirement: `$id` is the schema identity and is immutable after creation

The system SHALL treat the schema's `$id` as its user-facing identity — used in the detail route, the
list `$id` column, and open-in-new-tab links — and SHALL allow editing it only in the create modal,
not on the detail view. DIAL Core rejects a write that changes an existing resource's `$id`, and
rejects a create whose `$id` is already registered, so the field is presented as fixed rather than
offered and then refused.

The `$id` the detail view shows SHALL be the one the stored schema declares. A schema created outside
this console can live under a Core resource name that differs from its own `$id` — Core keys its
merged configuration by `$id` and accepts any legal blob name — and for such a schema the console
SHALL NOT replace the declared `$id` with the name decoded from the resource path, which would
otherwise turn the next save into a rejected `$id` change.

#### Scenario: Id is editable on create

- **WHEN** the create modal is open
- **THEN** the `$id` field is editable and validated as a URL-shaped identifier

#### Scenario: Id is read-only on the detail view

- **WHEN** a user opens an existing schema's Properties tab
- **THEN** the `$id` is shown but cannot be edited

#### Scenario: A duplicate id is reported as the server's conflict

- **WHEN** a user creates a schema whose `$id` is already registered in Core
- **THEN** an error notification carrying Core's conflict message is shown and the modal stays open

#### Scenario: A schema stored under a different name keeps its declared id

- **WHEN** a schema whose resource name differs from its own `$id` is opened
- **THEN** the detail view shows the `$id` the schema body declares
- **AND** saving it unchanged does not fail as an attempted `$id` change
