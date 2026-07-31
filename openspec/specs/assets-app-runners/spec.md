# assets-app-runners Specification

## Purpose
The `Assets > App Runners` surface: menu entry, flat list with create/delete/bulk-delete, and a five-tab detail view (Properties, Features, Parameters, AppRoutes, Interceptors) over DIAL Core's own app-runner config resources — created by archiving change `add-app-runner-asset-resource`. Covers the `$id`-as-resource-name identity and the URI-shaped-name exceptions the shared asset list needs, the client-side meta-schema validation that substitutes for Core's absent write-time checks, and the merged application-source runner picker that lets an asset application reference either population. Deliberately has no Audit tab, revisions, rollback, Core-sync banner, versioning, publications, sharing, move, or import/export — DIAL Core exposes none of those for config resources.

## Requirements

### Requirement: Assets > App Runners menu entry

The system SHALL add an `App Runners` menu item to the Assets section of the admin menu, directly after `Models`, linking to a new `/assets-app-runners` route.

#### Scenario: App Runners follows Models in the Assets section

- **WHEN** the Assets section of the menu renders
- **THEN** `App Runners` appears immediately after `Models` and before the remaining Assets entries

### Requirement: App-runner asset list is flat with create and delete actions

The system SHALL render the app-runner asset list as a single, non-nested list of entries under the `platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/assets-app-runners`
- **THEN** all app-runner resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present

- **WHEN** a user opens the app-runner list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: The folder tree offers no folder actions

- **WHEN** a user opens the context menu on the app-runner folder tree's root
- **THEN** no add-sibling, add-child, rename, move, or manage-permissions action is offered, since the namespace is flat and a folder create would submit a runner with no `$id`

#### Scenario: Create action opens the runner create modal

- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting the runner's `$id` and display name, and submitting it creates the runner and navigates to its detail view

#### Scenario: Bulk delete removes the selected runners

- **WHEN** a user selects several runners and confirms bulk delete
- **THEN** each selected runner is deleted and the list refreshes without them

### Requirement: App-runner asset list columns are metadata-only

The system SHALL show `$id`, author, created-at, and updated-at columns for app-runner assets, all sourced from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list. Display name, description, and topics are therefore not list columns — they live in the resource body, which a metadata listing does not return, and fetching them would cost one content request per row.

#### Scenario: Listing issues no per-row content request

- **WHEN** the app-runner list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps come from Core metadata

- **WHEN** the app-runner list renders
- **THEN** the created-at and updated-at columns are populated from the Core metadata node's `createdAt` and `updatedAt` fields

#### Scenario: Both timestamp columns render as localized dates

- **WHEN** the app-runner list renders its created-at and updated-at columns
- **THEN** each shows a locale-formatted date, not the raw epoch-milliseconds value Core returns

#### Scenario: The id column shows the decoded `$id`

- **WHEN** the app-runner list renders a row whose Core resource name is a percent-encoded `$id`
- **THEN** the column shows the decoded `$id`, not the encoded resource name

### Requirement: A URI-shaped `$id` is a valid, fully usable row name

Because the row name is the runner's `$id`, it contains characters the shared asset list treats as illegal in a filename — notably `:` and `/`. The system SHALL present such a row as ordinary and fully usable for this view: rendered in the normal text style with no invalid-name indication, opening on click, and offering its row actions. Views whose names are filenames SHALL keep the stricter default. The row's own encoded path, not its displayed name, is what addresses the resource, so the name's shape has no bearing on correctness.

#### Scenario: A URI-shaped name is not flagged as invalid

- **WHEN** the list renders a runner whose `$id` is a URI such as `http://example.com/schema`
- **THEN** the name is shown in the normal style with no forbidden-character indication or rename prompt

#### Scenario: A URI-shaped name opens on click

- **WHEN** a user clicks a row whose name contains `:` and `/`
- **THEN** the detail view opens, navigating by the row's encoded path

#### Scenario: Row and bulk actions stay enabled

- **WHEN** a user opens the row context menu or selects runners for bulk delete
- **THEN** the delete action is enabled rather than disabled on account of the name's characters

#### Scenario: Filename-shaped views keep the stricter rule

- **WHEN** any other asset view renders a name containing `/` or `%`
- **THEN** that view's existing invalid-name treatment is unchanged

### Requirement: App-runner asset detail view tab set

The system SHALL render an app-runner asset's detail view with exactly five tabs — `Properties`, `Features`, `Parameters`, `AppRoutes`, and `Interceptors` — and SHALL NOT include an `Applications` tab, an `Audit` tab, or a Core-sync status banner.

#### Scenario: Detail view renders exactly five tabs

- **WHEN** a user opens an app-runner asset's detail view
- **THEN** the tab list contains exactly `Properties`, `Features`, `Parameters`, `AppRoutes`, and `Interceptors`

#### Scenario: No Applications tab

- **WHEN** a user opens an app-runner asset's detail view
- **THEN** there is no `Applications` tab, unlike `Entities > Application Runners`

#### Scenario: No Audit tab or sync banner

- **WHEN** a user opens an app-runner asset's detail view
- **THEN** no `Audit` tab is present and no Core-sync status banner is rendered in the header

#### Scenario: No outbound create-application actions

- **WHEN** a user opens an app-runner asset's detail view header
- **THEN** no `Create Application` or `Create Asset Application` action is offered

### Requirement: `$id` is displayed as the runner identity and is immutable after creation

The system SHALL treat the runner's `$id` as its user-facing identity — used in the detail route, the list `$id` column, and open-in-new-tab links — and SHALL allow editing it only in the create modal, not on the detail view, matching how `Entities > Application Runners` behaves today.

#### Scenario: Id is editable on create

- **WHEN** the create modal is open
- **THEN** the `$id` field is editable and validated as a URL-shaped identifier

#### Scenario: The create form writes the typed id to `$id`

- **WHEN** a user types an id into the create modal's id field
- **THEN** the value is stored as the runner's `$id`, and not as the generic `name` field the shared create form uses for entities whose identity is a plain name

#### Scenario: Id is read-only on the detail view

- **WHEN** a user opens an existing runner's Properties tab
- **THEN** the `$id` is shown but cannot be edited

### Requirement: Properties tab content

The system SHALL render the app-runner Properties tab with display name, description, icon, title, viewer URL, editor URL, bucket-copy selection, topics, and the runner source field.

#### Scenario: Topics are editable and persisted

- **WHEN** a user edits topics on the Properties tab and saves
- **THEN** the topics are stored on the runner resource and appear in the list's topics column

### Requirement: Features tab content

The system SHALL render the app-runner Features tab with the same controls the entity-side runner Features tab provides: configuration, rate, tokenize, and truncate-prompt endpoint fields, plus switches for `dial:appendApplicationPropertiesHeader`, `dial:applicationTypePlaybackSupport`, and `dial:applicationTypeAssistantAttachmentsInRequestSupported`.

#### Scenario: Endpoint fields and switches are present

- **WHEN** a user opens an app-runner asset's Features tab
- **THEN** the four endpoint fields and the three switches listed above are shown

### Requirement: Interceptors tab uses the admin-BE interceptor list

The system SHALL render the app-runner Interceptors tab using the existing shared interceptors component, populating the list of selectable interceptors from the admin BE, and storing the selection in the runner's `dial:applicationTypeInterceptors` field.

#### Scenario: Selectable interceptors come from the admin BE

- **WHEN** the app-runner detail page loads
- **THEN** the available interceptors are fetched from the admin BE, as Core's blob-only interceptor listing would not include interceptors published through the aggregated config

#### Scenario: Selection round-trips on the runner resource

- **WHEN** a user selects interceptors and saves
- **THEN** their names are persisted in `dial:applicationTypeInterceptors` and reappear on reload

### Requirement: Client-side validation replaces Core's absent write-time checks

Because DIAL Core performs no validation when writing this resource kind, the system SHALL block a save that violates the app-runner meta-schema and SHALL surface the reason to the user. The enforced rules are: a non-empty `dial:applicationTypeDisplayName`; every route key matching `^[a-zA-Z0-9_]+$`; every route carrying non-empty `dial:paths`, non-empty `dial:methods`, and `dial:upstreams`; every method within `GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `PATCH`; every upstream carrying `dial:endpoint`; and a present `dial:response` carrying both `dial:status` and `dial:body`.

#### Scenario: Missing display name blocks save

- **WHEN** a user attempts to save a runner with an empty display name
- **THEN** the save action is disabled or rejected and no request reaches Core

#### Scenario: An invalid route key blocks save

- **WHEN** a route's name contains a character outside `^[a-zA-Z0-9_]+$`, such as a dot or a dash
- **THEN** the save is blocked with a message identifying the offending route

#### Scenario: A route missing required fields blocks save

- **WHEN** a route has no paths, no methods, or no upstreams and no response
- **THEN** the save is blocked with a message identifying the offending route

#### Scenario: An unsupported HTTP method blocks save

- **WHEN** a route declares a method outside the supported set
- **THEN** the save is blocked with a message identifying the offending method

### Requirement: `$id` constraint violations are reported by their actual cause

The system SHALL reject a write whose `$id` is absent, and separately reject one containing a character with no representable Core resource name (`!`, `~`, `*`, `'`, `(`, `)`). Each SHALL be reported by its own cause: an absent id SHALL NOT be attributed to forbidden characters. The character constraint SHALL additionally be enforced on the create form's id field as the user types, so a violation is visible at the point of entry rather than only on submit.

#### Scenario: An absent id is reported as missing

- **WHEN** a write is attempted with no `$id`
- **THEN** the error states the id is missing, and does not claim it contains forbidden characters

#### Scenario: An unrepresentable character is reported as such

- **WHEN** a write is attempted with an `$id` containing any of `!`, `~`, `*`, `'`, `(`, `)`
- **THEN** the error names those characters as the cause and no request reaches Core

#### Scenario: The character constraint surfaces while typing

- **WHEN** a user types an id containing one of those characters into the create form
- **THEN** the id field shows a forbidden-character error immediately, without waiting for submit

#### Scenario: The entity-side runner form is not newly constrained

- **WHEN** a user edits an `$id` on `Entities > Application Runners` or its duplicate modal
- **THEN** the character constraint is not applied there, since those ids never become a Core resource-name path segment

### Requirement: Parameters tab shows the Core-resolved schema

The system SHALL populate the app-runner Parameters tab from DIAL Core's resolved-schema read, which already performs the external-schema download declared by `dial:applicationTypeSchemaEndpoint`.

#### Scenario: Parameters reflect a resolved external schema

- **WHEN** a runner declares `dial:applicationTypeSchemaEndpoint` and its Parameters tab is opened
- **THEN** the properties contributed by the external schema are shown alongside the runner's own properties

#### Scenario: Resolution failure is reported

- **WHEN** Core cannot download the declared external schema
- **THEN** the Parameters tab surfaces an error rather than rendering an empty parameter set silently

### Requirement: Entities > Application Runners is unaffected

The system SHALL leave the admin-BE-backed `Entities > Application Runners` surface — its route, list, detail view, seven tabs, Audit tab, revision and rollback wiring, Core-sync banner, and server actions — unchanged by this capability.

Reference-data consumers of the admin-BE runner list SHALL continue to read it. `Assets > Applications` additionally reads the Core asset-runner list in order to offer both populations in its picker; every other consumer reads the admin-BE list alone.

#### Scenario: Entity runner view keeps all of its tabs

- **WHEN** a user opens an entity-side application runner
- **THEN** its Properties, Features, Parameters, Interceptors, Applications, AppRoutes, and Audit tabs are all still present

#### Scenario: Entity runner reference data still resolves

- **WHEN** any page that lists application runners for reference (applications, asset applications, interceptors, application publications, export config) loads
- **THEN** it still reads the admin-BE runner list, unchanged

#### Scenario: Only asset applications read the second list

- **WHEN** the runner picker is rendered on `Entities > Applications`
- **THEN** it offers admin-BE runners only, and no asset runner is selectable there

### Requirement: Asset runners are selectable from asset applications

The system SHALL offer app runners created through `Assets > App Runners` as source options in the App Runner picker on `Assets > Applications`, alongside the admin-BE-backed runners already offered there. The two populations SHALL be presented in a single flat grid distinguished by a `Source` column reading `Entity` or `Asset`, and each option SHALL carry an explicit origin discriminator rather than one inferred from the shape of its value.

The asset half SHALL be read through the Core app-runner resource path, and its rows SHALL be identified by the runner's `$id`, matching the `Assets > App Runners` list.

The picker's columns SHALL be limited to `ID`, `Source`, `Author`, and `Updated time` — a set both populations can fill from data already loaded. Columns whose values live in the runner's content body (`Display Name`, `Description`, `Topics`) SHALL NOT appear, since populating them for asset rows would require one Core content read per runner on every render. This column set is specific to the picker; the standalone `Entities > Application Runners` list and the config import/export, audit-rollback, and import-preview grids keep their own unchanged column sets.

A runner SHALL be labelled by its `$id` consistently across the picker — the grid's `ID` column, the dropdown options, and the collapsed field showing the current selection — so the name a user selects by is the name they see afterwards. The runner's display name SHALL NOT be surfaced in the merged picker, because an asset runner has none without a content read and a label absent from the grid would not be recognizable.

The picker component and its grid are shared with other surfaces, so this column set and labelling SHALL apply only where both populations are offered. Every other consumer — `Entities > Applications` included — SHALL keep the display-name label and the standalone runner column set unchanged, since all of its runners are admin-BE-backed and carry a display name.

A failure to read the asset runner list SHALL degrade to the admin-BE-only list rather than failing the page.

#### Scenario: Both populations appear in the picker

- **WHEN** a user opens the App Runner picker on an asset application and runners exist in both `Entities > Application Runners` and `Assets > App Runners`
- **THEN** both are listed in one grid
- **AND** each row's `Source` column reads `Entity` or `Asset` accordingly

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

### Requirement: An asset runner reference is stored as its Core resource name

The system SHALL write `schemas/platform/{encodeURIComponent($id)}` into an asset application's `application_type_schema_id` when the selected runner comes from `Assets > App Runners`, and SHALL continue to write the plain `$id` when it comes from `Entities > Application Runners`. Resolution of a stored reference back to a runner SHALL accept both forms, so an asset application reopens with its selection intact.

#### Scenario: Selecting an asset runner stores the canonical resource name

- **WHEN** a user selects an asset runner whose `$id` is `http://asdqwe`
- **THEN** the application's `application_type_schema_id` is set to `schemas/platform/http%3A%2F%2Fasdqwe`

#### Scenario: Selecting an entity runner is unchanged

- **WHEN** a user selects a runner from `Entities > Application Runners`
- **THEN** the application's `application_type_schema_id` is set to that runner's `$id`, with no prefix or encoding applied

#### Scenario: A saved asset-runner reference reopens as selected

- **WHEN** an asset application referencing `schemas/platform/http%3A%2F%2Fasdqwe` is reopened
- **THEN** the App Runner field shows that runner as selected rather than blank
- **AND** any behaviour keyed on resolving the referenced runner, such as the Responses defaults section, behaves as it does for an entity runner

### Requirement: Runner origin drives schema resolution and navigation

The system SHALL derive an asset runner's default `applicationProperties` from DIAL Core's resolved-schema read, and an entity runner's from the admin BE's, selecting between them by the option's origin. The picker's open-in-new-tab action SHALL likewise navigate to `/assets-app-runners/{path}` for an asset runner and `/application-runners/{$id}` for an entity runner.

#### Scenario: Selecting an asset runner resolves against Core

- **WHEN** a user selects an asset runner
- **THEN** the resolved schema is read from Core's `application_type_schemas/schema` route, not the admin BE's `resolvedSchema`
- **AND** the derived `applicationProperties` defaults are applied to the application

#### Scenario: Open navigates to the runner's own surface

- **WHEN** a user opens the selected runner in a new tab
- **THEN** an asset runner opens under `/assets-app-runners/`
- **AND** an entity runner opens under `/application-runners/`
