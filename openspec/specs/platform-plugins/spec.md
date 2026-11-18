# platform-plugins Specification

## Purpose
The Plugins entity of the admin console: a plugin is an admin-managed DIAL Core resource with a name, a type and free-form settings. Covers the AI Gateway menu entry, the Platform and config.json listing, the create flow, the write payload, the detail view, the settings hints, deletion, the absence of entity connections and i18n. Created by archiving change `add-plugins`.

## Requirements

### Requirement: AI Gateway > Plugins menu entry
The system SHALL add a `Plugins` item to the AI Gateway group of the admin menu, directly after `Translators` and
before `Aliases`, linking to the `/platform-plugins` route. The label SHALL come from i18n
(`MenuI18nKey.PlatformPlugins`). The item SHALL NOT be offered to a caller in unit mode.

#### Scenario: Plugins sits between Translators and Aliases
- **WHEN** the AI Gateway group of the menu renders for a full admin
- **THEN** `Plugins` appears immediately after `Translators` and immediately before `Aliases`

#### Scenario: Unit mode does not offer Plugins
- **WHEN** the menu renders for a caller in unit mode
- **THEN** no `Plugins` item is shown

#### Scenario: Breadcrumb and title use the menu label
- **WHEN** a user opens `/platform-plugins` or a plugin detail view
- **THEN** the list title and the breadcrumb root show the `Plugins` label, and the detail breadcrumb ends in a non-link segment for the plugin

### Requirement: Plugin listing offers Platform and config.json sources
The system SHALL render `/platform-plugins` with the shared tabbed listing over two sources: **Platform**
(`plugins/platform/`) and **config.json** (Core's config-file plugins). Platform SHALL be a flat grid with no
folder affordance and SHALL retain the Create button and delete actions. The config.json tab SHALL be read-only.
The grid SHALL show name, author, created-at and updated-at from Core's resource metadata and SHALL NOT fetch each
row's content to populate the list. No duplicate, move, rename, share, publish or create-folder action SHALL be
offered.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-plugins`
- **THEN** all plugin resources are direct grid rows with no folder-expand affordance and no Public source

#### Scenario: Listing issues no per-row content request
- **WHEN** the plugin list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: config.json tab is read-only
- **WHEN** a user opens the config.json tab
- **THEN** config-file plugin names are listed and no create, delete or other mutating action is offered

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the plugin list
- **THEN** no create or delete action is offered

### Requirement: Creating a plugin requires a name and a type
The system SHALL open a create modal from the Create button with a name field, a required `type` text input and a
`settings` JSON input that defaults to `{}`. The name SHALL use the shared entity-name field and validation and
SHALL be rejected when it contains `/`. `type` SHALL be required and trimmed, and the form SHALL NOT offer a list of
types, because Core lists none. Submitting SHALL create the resource and navigate to its detail view.

#### Scenario: Submit is blocked without a type
- **WHEN** a user fills the name and leaves `type` empty or blank
- **THEN** the form reports `type` as required and nothing is sent to Core

#### Scenario: A name containing a slash is rejected
- **WHEN** a user enters a name containing `/`
- **THEN** the name field shows a validation error and nothing is sent to Core

#### Scenario: A taken name is refused
- **WHEN** a user submits a name that already exists on the Platform tab
- **THEN** the unique-name error is shown and no write is made

#### Scenario: Settings default to an empty object
- **WHEN** a user creates a plugin without touching `settings`
- **THEN** the write carries `settings: {}`

#### Scenario: Create navigates to the detail view
- **WHEN** Core accepts the create
- **THEN** the user lands on the new plugin's detail view

### Requirement: Plugin writes carry only type and settings
The system SHALL build every plugin write body from `type` and `settings` alone, with no `name`, timestamp or
`_metadata` field, because Core rejects any other field. Creates SHALL send `If-None-Match: *`; updates SHALL send
the entity's ETag.

#### Scenario: Body has no extra fields
- **WHEN** a plugin is created or saved
- **THEN** the request body contains exactly `type` and `settings`

#### Scenario: Update uses the fetched ETag
- **WHEN** a user saves an edited plugin
- **THEN** the write carries the ETag read with the entity

### Requirement: Plugin detail view edits type and settings
The system SHALL render `/platform-plugins/<name>` with a Properties tab holding the resource info header, a
`type` text input and a `settings` JSON input, plus the JSON toggle. It SHALL offer save, discard and delete with
the same change tracking as Translators, and SHALL NOT show a Roles tab, display name, description or catalog
fields. The name SHALL NOT be editable.

#### Scenario: Properties tab shows the two fields
- **WHEN** a user opens a plugin
- **THEN** the Properties tab shows the info header, `type` and `settings`, and no Roles tab

#### Scenario: Save and discard follow edits
- **WHEN** a user changes `type` or `settings`
- **THEN** save and discard become enabled, discard restores the loaded values, and save writes and refreshes the view

#### Scenario: Core rejection is shown
- **WHEN** Core answers a save with `422`, for example a warning on `type` or `settings.<path>`
- **THEN** an error notification shows Core's message and the form keeps the user's edits

#### Scenario: JSON toggle edits the whole entry
- **WHEN** a user turns the JSON editor on
- **THEN** the entry is shown and editable as JSON, with no format selector for a config-file entry

#### Scenario: A config-file plugin opens read-only
- **WHEN** a user opens a plugin from the config.json tab
- **THEN** every field is read-only and save and delete are not offered

### Requirement: Settings carry a no-secrets hint and a preview notice
The system SHALL show a hint on the `settings` field stating that settings hold no secrets, because Core stores and
returns them as written and plugin credentials come from the Core environment. The Properties tab SHALL show a
notice that plugins are a preview Core feature that may change incompatibly. Both SHALL be i18n text, and the hint
SHALL be reachable by keyboard.

#### Scenario: Hint is reachable by keyboard
- **WHEN** a keyboard user tabs to the hint beside `settings`
- **THEN** the control takes focus and exposes the hint as its accessible name

#### Scenario: Preview notice is visible
- **WHEN** a user opens the Properties tab
- **THEN** the preview notice is shown

### Requirement: Plugin deletion
The system SHALL delete one or many plugins from the Platform tab and from the detail view after confirmation, with
entity-specific confirmation text, and SHALL touch no other entity. Removing a plugin that another entity still
names with a `dial-plugin://` URL SHALL NOT be blocked by the console, because Core accepts that state.

#### Scenario: Single and bulk delete
- **WHEN** a user confirms deletion of one or several plugins
- **THEN** only those resources are deleted and the list refreshes

#### Scenario: Deletion is not blocked by references
- **WHEN** a plugin is named by a model's `dial-plugin://` base URL
- **THEN** deleting the plugin still proceeds, and nothing is changed on the model

### Requirement: Plugin entries are not connected to other entities in this version
The system SHALL leave the `base_url` and `baseUrl` fields of models, applications, routers and translators as they
are: no plugin picker, no `dial-plugin://` suggestion and no existence check. Linking them is a planned follow-up.

#### Scenario: URL fields are unchanged
- **WHEN** a user edits a model, router, translator or application base URL
- **THEN** no plugin-specific control, hint or validation is present

### Requirement: Plugin i18n
The system SHALL source every plugin label, title, empty state, confirmation, validation message, hint and notice
from i18n enums with matching entries in `locales/en.ts`, reusing existing generic keys where one already fits.

#### Scenario: Every plugin key resolves
- **WHEN** the locale spec runs
- **THEN** every new plugin i18n enum key has a non-empty entry in `locales/en.ts`
