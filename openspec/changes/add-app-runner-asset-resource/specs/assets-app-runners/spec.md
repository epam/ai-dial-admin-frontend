## ADDED Requirements

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

#### Scenario: The id column shows the decoded `$id`

- **WHEN** the app-runner list renders a row whose Core resource name is a percent-encoded `$id`
- **THEN** the column shows the decoded `$id`, not the encoded resource name

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

#### Scenario: Entity runner view keeps all of its tabs

- **WHEN** a user opens an entity-side application runner
- **THEN** its Properties, Features, Parameters, Interceptors, Applications, AppRoutes, and Audit tabs are all still present

#### Scenario: Entity runner reference data still resolves

- **WHEN** any page that lists application runners for reference (applications, asset applications, interceptors, application publications, export config) loads
- **THEN** it still reads the admin-BE runner list, unchanged
