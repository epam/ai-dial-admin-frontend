# platform-catalog-schemas Specification

## Purpose
The `Catalog ▸ Catalog Schemas` surface: menu entry, flat list with create/delete/bulk-delete, and a
two-tab detail view (Properties, Parameters) over DIAL Core's own `catalog_schemas` config resources
— the registered JSON-Schema documents that declare what display metadata a catalog entity type
exposes and how a catalog renders it. Covers the `$id`-as-resource-name identity, the client-side
meta-schema validation that substitutes for Core's absent write-time checks, and both halves of the
population — the API-written resources this surface owns and the file-declared ones behind the
`showConfigFiles` toggle. The consumer side (`catalog_schema_id` / `catalog_properties` on
deployments) belongs to `catalog-properties-editing`.

## Requirements

### Requirement: Catalog > Catalog Schemas menu entry

The system SHALL add a `Catalog Schemas` menu item to the Catalog section of the admin menu, directly
after `App Runners`, linking to a new `/platform-catalog-schemas` route.

#### Scenario: Catalog Schemas follows App Runners in the Catalog section

- **WHEN** the Catalog section of the menu renders
- **THEN** `Catalog Schemas` appears immediately after `App Runners` and before `Roles`

#### Scenario: The list page is reachable at its route

- **WHEN** a user navigates to `/<lang>/platform-catalog-schemas`
- **THEN** the system renders the Catalog Schemas list page

#### Scenario: A detail page is addressed by the id segment alone

- **WHEN** a user opens a catalog schema's detail view
- **THEN** the address bar shows `/<lang>/platform-catalog-schemas/<id>` with no `?path=` query
  parameter

### Requirement: Catalog-schema list is flat with create and delete actions

The system SHALL render the catalog-schema list as a single, non-nested list of entries under the
`platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and
no folder-create, rename-folder, move-into-folder, or duplicate control.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/platform-catalog-schemas`
- **THEN** all catalog-schema resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder, move, or duplicate action is present

- **WHEN** a user opens the list toolbar and row actions
- **THEN** no create-folder, move-to-folder, or duplicate action is offered

#### Scenario: The folder tree offers no folder actions

- **WHEN** a user opens the context menu on the catalog-schema folder tree's root
- **THEN** no add-sibling, add-child, rename, move, or manage-permissions action is offered, since
  the namespace is flat and a folder create would submit a schema with no `$id`

#### Scenario: Create action opens the create modal

- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting the schema's `$id`, entity type, and display name, and
  submitting it creates the resource and refreshes the list

#### Scenario: Bulk delete removes the selected schemas

- **WHEN** a user selects several catalog schemas and confirms bulk delete
- **THEN** each selected schema is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions

- **WHEN** a read-only admin opens the catalog-schema list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Catalog-schema list columns are metadata-only

The system SHALL show `$id`, author, created-at, and updated-at columns for catalog schemas, all
sourced from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.
Entity type and display name are therefore not list columns — they live in the resource body, which a
metadata listing does not return, and fetching them would cost one content request per row.

#### Scenario: Listing issues no per-row content request

- **WHEN** the catalog-schema list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Both timestamp columns render as localized dates

- **WHEN** the list renders its created-at and updated-at columns
- **THEN** each shows a locale-formatted date, not the raw epoch-milliseconds value Core returns

#### Scenario: The id column shows the decoded `$id`

- **WHEN** the list renders a row whose Core resource name is a percent-encoded `$id`
- **THEN** the column shows the decoded `$id`, not the encoded resource name

### Requirement: A URI-shaped `$id` is a valid, fully usable row name

Because the row name is the schema's `$id`, it contains characters the shared asset list treats as
illegal in a filename — notably `:` and `/`. The system SHALL present such a row as ordinary and
fully usable for this view: rendered in the normal text style with no invalid-name indication,
opening on click, and offering its row actions. Views whose names are filenames SHALL keep the
stricter default.

#### Scenario: A URI-shaped name is not flagged as invalid

- **WHEN** the list renders a schema whose `$id` is a URI such as `https://dial.example.com/catalog_schemas/agent`
- **THEN** the name is shown in the normal style with no forbidden-character indication or rename
  prompt

#### Scenario: A URI-shaped name opens on click

- **WHEN** a user clicks a row whose name contains `:` and `/`
- **THEN** the detail view opens, navigating by the row's encoded path

#### Scenario: Row and bulk actions stay enabled

- **WHEN** a user opens the row context menu or selects schemas for bulk delete
- **THEN** the delete action is enabled rather than disabled on account of the name's characters

#### Scenario: Filename-shaped views keep the stricter rule

- **WHEN** any other asset view renders a name containing `/` or `%`
- **THEN** that view's existing invalid-name treatment is unchanged

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

### Requirement: Detail view renders exactly two tabs

The system SHALL render a catalog schema's detail view with exactly two tabs — `Properties` and
`Parameters` — and SHALL NOT include a `Features`, `AppRoutes`, `Interceptors`, `Roles`, or `Audit`
tab, nor a Core-sync status banner, nor any outbound create action. A catalog schema is display
metadata, not a deployment: it has no endpoints, no routing, no interceptor chain, and no roles.

#### Scenario: Detail view renders exactly two tabs

- **WHEN** a user opens a catalog schema's detail view
- **THEN** the tab list contains exactly `Properties` and `Parameters`

#### Scenario: No deployment-shaped tabs are present

- **WHEN** a user opens a catalog schema's detail view
- **THEN** no `Features`, `AppRoutes`, `Interceptors`, or `Roles` tab is present

#### Scenario: No Audit tab, sync banner, or create action

- **WHEN** a user opens a catalog schema's detail view
- **THEN** no `Audit` tab is present, no Core-sync status banner is rendered in the header, and the
  header offers no create action for any other entity


### Requirement: Properties tab content

The system SHALL render the catalog-schema Properties tab with the resource info header, the
read-only `$id`, a required entity-type selection offering exactly `model`, `agent`, `toolset`,
`skill`, and `interceptor`, a required display name, and an optional default locale.

The entity type SHALL be presented as a declaration of which catalog entity kind the schema is
written for, not as a filter or a constraint: DIAL Core validates a deployment's
`catalog_properties` against the schema its `catalog_schema_id` names and never checks the
deployment's kind against the schema's entity type.

#### Scenario: The four fields are shown with the id fixed

- **WHEN** a user opens an existing schema's Properties tab
- **THEN** the read-only `$id`, the entity-type selection, the display name, and the default locale
  are shown

#### Scenario: Entity type offers exactly the five supported kinds

- **WHEN** a user opens the entity-type selection
- **THEN** the options are exactly `model`, `agent`, `toolset`, `skill`, and `interceptor`

#### Scenario: Edits round-trip on the resource

- **WHEN** a user edits the display name, entity type, or default locale and saves
- **THEN** a success notification naming the updated schema is shown and the values reappear on
  reload

#### Scenario: A failed save keeps the pending edits

- **WHEN** a save request fails
- **THEN** an error notification carrying the server's message is shown and the edited values are
  still present for a retry

### Requirement: Parameters tab edits the schema's own properties

The system SHALL populate the catalog-schema Parameters tab from the schema resource as loaded, and
SHALL make those properties editable. Unlike an app runner, a catalog schema declares no external
schema endpoint — DIAL Core resolves it from configuration alone — so there is no resolved read to
perform and no read-only mode to enter.

The tab SHALL expose the catalog presentation hints each property may carry — the tab and section it
renders in, its order, its widget, and whether its value is a locale map — as editable fields
alongside the property's name, type, title, description, and requiredness. The widget selection SHALL
offer exactly the values Core's catalog meta-schema allows: `text`, `richText`, `badge`, `chips`,
`url`, `boolean`, `image`, and `date`.

#### Scenario: Properties are editable with no resolved read

- **WHEN** a user opens a catalog schema's Parameters tab
- **THEN** the schema's own properties are shown and editable
- **AND** no resolved-schema request is issued

#### Scenario: Presentation hints are editable

- **WHEN** a user edits a property's tab, section, order, widget, or localized flag and saves
- **THEN** the values are stored under that property's catalog metadata and reappear on reload

#### Scenario: Widget offers exactly the supported values

- **WHEN** a user opens the widget selection on a property
- **THEN** the options are exactly `text`, `richText`, `badge`, `chips`, `url`, `boolean`, `image`,
  and `date`

#### Scenario: A schema with no properties says so

- **WHEN** a schema declares no properties
- **THEN** the tab shows an empty state rather than a blank area

#### Scenario: Editing preserves extensions the tab does not render

- **WHEN** a user edits one property of a schema whose other properties carry a file-valued
  declaration, a string format, or nested presentation metadata
- **THEN** those declarations survive the save unchanged
- **AND** the file-valued property still resolves as a DIAL file reference to Core on publish

### Requirement: Client-side validation replaces Core's absent write-time checks

DIAL Core stores this resource's body verbatim and validates only the `$id`, so a schema that
violates the catalog meta-schema is accepted on write and only surfaces later — as an `invalid`
status on read, and as a rejected deployment when something references it. The system SHALL block
such a save and SHALL surface the reason to the user.

The enforced rules are: a non-blank `$id`; an entity type within the five supported values; a
non-blank display name; a default locale matching `^[a-z]{2}(-[A-Z]{2})?$` when present; and, for any
property declared file-valued, the string type and encoded-file format the meta-schema requires
alongside it.

#### Scenario: A missing display name blocks save

- **WHEN** a user attempts to save a schema with a blank display name
- **THEN** the save action is disabled or rejected and no request reaches Core

#### Scenario: A missing or unsupported entity type blocks save

- **WHEN** a schema carries no entity type, or one outside the five supported values
- **THEN** the save is blocked with a message identifying the field

#### Scenario: A malformed default locale blocks save

- **WHEN** a user enters a default locale that is not a BCP-47 language or language-region tag
- **THEN** the save is blocked with a message identifying the expected form

#### Scenario: An inconsistent file-valued property blocks save

- **WHEN** a property is declared file-valued without the string type and encoded-file format the
  meta-schema requires
- **THEN** the save is blocked with a message identifying the offending property

#### Scenario: The raw JSON editor is gated by the same rules

- **WHEN** a user edits the schema through the raw JSON editor and introduces any of the violations
  above
- **THEN** the save is blocked with the same message, rather than the editor bypassing validation

### Requirement: `$id` constraint violations are reported at the create form

The system SHALL disable save when `$id` is absent. The create form SHALL additionally reject any
`$id` containing characters DIAL Core cannot store in a resource name, with an inline client-side
error as the user types, preventing a round-trip rejection for identifiers Core will refuse
regardless.

#### Scenario: An absent id is reported as missing

- **WHEN** a create is attempted with no `$id`
- **THEN** the save button is disabled with the id field shown as required, not as forbidden
  characters

#### Scenario: A forbidden character surfaces while typing

- **WHEN** a user types an `$id` containing a character Core cannot store in a resource name
- **THEN** an inline error is shown immediately, before any save attempt

### Requirement: Configuring a catalog schema requires no admin-backend call

Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any
admin-backend request in order to list, view, create, edit, or delete a catalog schema, so the
surface remains usable when that service is unavailable.

#### Scenario: The surface is usable without the admin backend

- **WHEN** a user lists, opens, edits, and saves a catalog schema while the admin backend is not
  configured
- **THEN** no admin-backend request is required for any of those operations

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
