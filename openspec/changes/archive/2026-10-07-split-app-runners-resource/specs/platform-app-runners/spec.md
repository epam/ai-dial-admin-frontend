## MODIFIED Requirements

### Requirement: Asset runners are selectable from asset applications

The system SHALL offer app runners created through `Assets > App Runners` as source options in the App Runner picker on `Assets > Applications`, alongside the admin-BE-backed runners already offered there. The two populations SHALL be presented in a single flat grid distinguished by a `Source` column reading `Configuration file` or `API`, and each option SHALL carry an explicit origin discriminator rather than one inferred from the shape of its value.

The asset half SHALL be read through the Core app-runner resource path, and its rows SHALL be identified by the runner's `$id`, matching the `Assets > App Runners` list.

The picker's columns SHALL be limited to `ID`, `Source`, `Author`, and `Updated time` — a set both populations can fill from data already loaded. Columns whose values live in the runner's content body (`Display Name`, `Description`, `Topics`) SHALL NOT appear, since populating them for asset rows would require one Core content read per runner on every render. This column set is specific to the picker; the standalone `Entities > Application Runners` list and the config import/export, audit-rollback, and import-preview grids keep their own unchanged column sets.

A runner SHALL be labelled by its `$id` consistently across the picker — the grid's `ID` column, the dropdown options, and the collapsed field showing the current selection — so the name a user selects by is the name they see afterwards. The runner's display name SHALL NOT be surfaced in the merged picker, because an asset runner has none without a content read and a label absent from the grid would not be recognizable.

The merged picker SHALL be a dedicated component (`AppRunnersResource`) used only where both populations are offered; the admin-BE picker (`AppRunners`) SHALL carry no merged-mode, origin, or `$id`-labelling behaviour. Every other consumer — `Entities > Applications` included — SHALL keep the display-name label and the standalone runner column set unchanged, since all of its runners are admin-BE-backed and carry a display name.

A failure to read the asset runner list SHALL degrade to the admin-BE-only list rather than failing the page.

#### Scenario: Both populations appear in the picker

- **WHEN** a user opens the App Runner picker on an asset application and runners exist in both `Entities > Application Runners` and `Assets > App Runners`
- **THEN** both are listed in one grid
- **AND** each row's `Source` column reads `Configuration file` or `API` accordingly

#### Scenario: Asset rows are identified by `$id`

- **WHEN** an asset runner with `$id` `http://asdqwe` appears in the picker
- **THEN** its `ID` cell reads `http://asdqwe`

#### Scenario: The picker shows no content-backed columns

- **WHEN** the picker grid renders
- **THEN** its columns are exactly `ID`, `Source`, `Author`, and `Updated time`
- **AND** no `Display Name`, `Description`, or `Topics` column is present

#### Scenario: The selected runner reads the same as the row that was picked

- **WHEN** a user selects any runner, of either origin
- **THEN** the collapsed field shows that runner's `$id`, the same value its grid row showed
- **AND** no display name is shown in its place

#### Scenario: Entities > Applications keeps its own presentation and source

- **WHEN** the runner picker renders on `Entities > Applications`
- **THEN** it labels runners by their display name and shows the standalone runner column set
- **AND** it offers admin-BE runners only

#### Scenario: Asset rows show their metadata

- **WHEN** an asset runner appears in the picker
- **THEN** its author and updated time cells are populated from the Core metadata node
- **AND** the updated time renders as a localized date, not raw epoch milliseconds

#### Scenario: Every runner in the bucket is offered

- **WHEN** the picker is opened and the `platform` bucket holds more runners than one metadata page
- **THEN** all of them appear in the grid

#### Scenario: Core read failure leaves the entity list usable

- **WHEN** the asset runner list cannot be read
- **THEN** the picker still lists the admin-BE runners
- **AND** the page renders rather than erroring

#### Scenario: The admin-BE picker never renders the merged presentation

- **WHEN** `AppRunners` renders for any view, including a view whose runner list contains Platform-origin options
- **THEN** it labels runners by display name and shows the standalone runner column set
- **AND** it opens the standalone `Entities > Application Runners` page in a new tab

## ADDED Requirements

### Requirement: A stored runner id that is not in the picker's list is still shown

A Platform runner's option `$id` is the runner's `$id` as of creation, while an application stores the runner's current content `$id`. When the two differ — the runner's `$id` was edited after creation — the stored id matches no option. The merged picker SHALL still show the stored id as the field's value rather than rendering it blank. It SHALL NOT match the id to a runner: the picker opens with no selected row, and the open-in-new-tab control SHALL NOT be offered. Choosing a runner in the picker replaces the stored id and restores normal behaviour.

#### Scenario: A runner whose `$id` was edited after creation is still shown

- **WHEN** the properties tab opens an asset application whose `application_type_schema_id` is `http://asdqwe/edited` and no listed option carries that `$id`
- **THEN** the field shows `http://asdqwe/edited` as its value
- **AND** no open-in-new-tab control is offered

#### Scenario: Choosing a runner replaces the unmatched id

- **WHEN** the user selects a listed runner while an unmatched stored id is shown
- **THEN** the field shows the selected runner and the open-in-new-tab control is offered for it

### Requirement: The merged picker opens the selected runner on its own detail page

The merged picker's open-in-new-tab control SHALL open the selected runner on the `Assets > App Runners` detail page, using the same URL the `Assets > App Runners` list builds for the matching row. A `Platform`-origin runner SHALL open at its storage path. A `Config`-origin runner SHALL open at its `$id` with the `configFile=true` query, so the page reads it from Core's configuration file; this works whether or not an admin backend is configured. The control SHALL NOT point at `Entities > Application Runners`.

#### Scenario: A Platform runner opens by storage path

- **WHEN** the selected runner is a Platform option with path `http%3A%2F%2Fasdqwe`
- **THEN** Open navigates to `/{locale}/platform-app-runners/http%253A%252F%252Fasdqwe` in a new tab

#### Scenario: A configuration-file runner opens in config-file mode

- **WHEN** the selected runner is a Config-origin option with `$id` `urn:runner:entity`
- **THEN** Open navigates to `/{locale}/platform-app-runners/urn%3Arunner%3Aentity?configFile=true` in a new tab

