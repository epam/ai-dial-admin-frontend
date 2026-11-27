# aliases Specification

## Purpose
The Aliases entity of the admin console: an alias is an admin-managed deployment of DIAL Core with its own name, catalog entry and `userRoles` that forwards calls to a model, application, toolset or router. Covers the AI Gateway menu entry, the Platform, Public and config.json listing, the create wizard, duplicate and delete, name validation, the Properties, Target and Roles detail tabs, the target and present-as selection, broken-alias reporting and i18n. Created by archiving change `add-aliases`.
## Requirements
### Requirement: AI Gateway > Aliases menu entry
The system SHALL add an `Aliases` item to the AI Gateway group of the admin menu, directly after `Plugins`,
linking to the `/assets-aliases` route. The label SHALL come from i18n (`MenuI18nKey.PlatformAliases`). The item SHALL
NOT be offered to a caller in unit mode.

#### Scenario: Aliases follows Plugins in AI Gateway
- **WHEN** the AI Gateway group of the menu renders for a full admin
- **THEN** `Aliases` appears immediately after `Plugins` and before `Routes`

#### Scenario: Unit mode does not offer Aliases
- **WHEN** the menu renders for a caller in unit mode
- **THEN** no `Aliases` item is shown

#### Scenario: Breadcrumb and title use the menu label
- **WHEN** a user opens `/assets-aliases` or an alias detail view
- **THEN** the list title and the breadcrumb root show the `Aliases` label, and the detail breadcrumb ends in a non-link segment for the alias

### Requirement: Alias listing offers Platform, Public and config.json sources
The system SHALL render `/assets-aliases` with the shared tabbed listing over three sources, in this order: **Public**
(`aliases/public/`), **Platform** (`aliases/platform/`) and **config.json** (Core's config-file aliases). Platform and
Public SHALL be flat grids with no folder affordance. The config.json tab SHALL be read-only. The Platform and Public
grids SHALL show name, author, created-at and updated-at, all from Core's resource metadata, and SHALL NOT fetch each
row's content to populate the list (the target and present-as are visible on the detail view only); config.json rows
show the name only.

#### Scenario: Three tabs in order
- **WHEN** an admin opens `/assets-aliases`
- **THEN** the tabs are Public, Platform and config.json, in that order, with Public selected

#### Scenario: Platform and Public rows are direct rows
- **WHEN** an admin opens the Public tab
- **THEN** every alias is a direct row and no folder-create, move or folder-expand control is offered

#### Scenario: config.json tab is read-only
- **WHEN** an admin opens the config.json tab
- **THEN** config-file alias names are listed and only open-in-new-tab is offered on a row

#### Scenario: Empty state
- **WHEN** a source holds no aliases
- **THEN** the grid shows the aliases empty-state title, and its description names the Create button only on the Platform and Public tabs; the config.json tab shows no description

#### Scenario: A failed list read is reported, not shown as empty
- **WHEN** Core refuses or fails the list read of a source
- **THEN** the established request-error notification is shown and the tab shows no count badge

### Requirement: Aliases are created, duplicated and deleted on the stored sources
The system SHALL let a non-read-only admin create an alias on the active stored tab (Platform or Public) through the
Create button, duplicate it, and delete it singly or in bulk from that tab. Create SHALL write
`PUT /v1/aliases/<bucket>/<name>` with `If-None-Match: *`, so an existing alias is never silently replaced, and on
success navigate to the new alias's detail view. Delete SHALL call `DELETE /v1/aliases/<bucket>/<name>` and SHALL NOT
touch the alias's target. A read-only admin SHALL be offered none of these actions. No share, publish, copy, move,
rename-folder or version action SHALL be offered.

#### Scenario: Create is a two-step wizard
- **WHEN** an admin activates Create on the Platform tab
- **THEN** a modal opens with a step indicator; step 1 asks for the ID (with no caption beneath it, only a validation message), display name, display version and description, and step 2 asks for the target type, target and present-as; Next is enabled only when step 1 is valid, and submitting on step 2 writes `aliases/platform/<name>` and opens its detail view

#### Scenario: Create on the Public tab writes the public bucket
- **WHEN** an admin activates Create on the Public tab and submits
- **THEN** the alias is written at `aliases/public/<name>`

#### Scenario: An existing name is refused
- **WHEN** an admin creates an alias whose name already exists in that bucket
- **THEN** Core's refusal is shown in an error notification and nothing is replaced

#### Scenario: Duplicate copies the definition under a new name
- **WHEN** an admin duplicates an alias and enters a new name
- **THEN** a new alias with the same target, present-as, roles and display fields is created under that name in the same bucket

#### Scenario: Delete leaves the target alone
- **WHEN** an admin deletes an alias
- **THEN** only the alias is removed and a success notification is shown

#### Scenario: Read-only admin is offered no mutating action
- **WHEN** a read-only admin opens the Platform tab
- **THEN** no Create, Duplicate or Delete action is offered

#### Scenario: No unsupported action is offered
- **WHEN** an admin opens an alias row's actions or the header actions
- **THEN** no share, publication, copy, move, folder or version action is present

### Requirement: Alias name validation
The system SHALL accept an alias name only if it is non-empty and contains only letters, digits, `.`, `_` and `-` —
no `/`, no spaces — and SHALL show a validation message and block submission otherwise. Because Core does not refuse a
Platform alias whose name is already used by a model, application, toolset, interceptor, router or another alias (it is
skipped at the next config rebuild), creating or duplicating a **Platform** alias SHALL refuse such a name before the
write, with a validation message naming the taken name. A Public alias SHALL NOT be pre-checked, because its name is
the URL `aliases/public/<name>`. A violation of any other rule Core enforces (a target that does not fit `presentAs`, an
unsupported target form) SHALL be shown verbatim from Core's rejection.

#### Scenario: Slash in the name is blocked
- **WHEN** an admin types `team/assistant` as the alias name
- **THEN** the field shows a validation message and Create stays disabled

#### Scenario: A Platform name taken by a model is refused before the write
- **WHEN** an admin creates a Platform alias named `gpt-4-internal` and a model of that name exists (platform or config.json)
- **THEN** a validation message says the name is already used, and no `PUT` is sent

#### Scenario: A Public alias may share a name with a deployment
- **WHEN** an admin creates a Public alias named `gpt-4-internal` and a model of that name exists
- **THEN** the alias is created at `aliases/public/gpt-4-internal` without a name-clash check

#### Scenario: Core's validation text is shown verbatim
- **WHEN** Core answers 400 with a validation message on save
- **THEN** that message appears in the error notification and the form keeps the user's input

### Requirement: Alias detail view
The system SHALL render an alias detail view with Properties, Target and Roles tabs and a JSON tab. Properties SHALL
show the name (read-only), display name, display version, description, icon URL and intro, in that order (the create wizard likewise puts the display version straight after the display name); it SHALL NOT show a
callable name. Target SHALL show the target type, target and present-as, followed by the alias's
`defaultHeaders` as a key-value grid, the editor the Routers Properties tab uses. The default headers SHALL NOT be
offered on an alias whose present-as (stored, or the target type's default) is Toolset, because Core refuses them
there; a target or present-as change that makes the alias a toolset SHALL clear them. Roles SHALL edit `userRoles` the way the
Models Roles tab does (an "available to specific roles" switch, a grid of roles, add and remove); its tab carries a
warning when `userRoles` is an empty list. `descriptionKeywords` is edited in the JSON tab. Save SHALL write only the
fields Core's alias body accepts (`target`, `presentAs`, `userRoles`, `defaultHeaders`, `displayName`, `displayVersion`, `iconUrl`,
`description`, `intro`, `descriptionKeywords`) with the loaded etag as `If-Match`; a 412 SHALL follow the established
etag-conflict handling. A config.json alias SHALL open read-only.

#### Scenario: Properties, Target and Roles are separate tabs
- **WHEN** an admin opens an alias
- **THEN** the tabs are Properties, Target and Roles, and the target fields appear only on Target and the roles only on Roles

#### Scenario: Default headers are edited on Target
- **WHEN** an admin adds the header `X-Team: a` on the Target tab of a model alias and saves
- **THEN** the request body carries `defaultHeaders: {"X-Team": "a"}`

#### Scenario: A toolset alias has no default headers
- **WHEN** an admin opens the Target tab of an alias presented as a toolset
- **THEN** no default headers grid is shown

#### Scenario: Becoming a toolset clears the default headers
- **WHEN** an admin changes the present-as of an alias with default headers to Toolset
- **THEN** its `defaultHeaders` are cleared, so the save is not refused by Core

#### Scenario: Save sends only accepted fields
- **WHEN** an admin edits the description of an alias loaded with extra fields and saves
- **THEN** the request body contains only the accepted alias fields and no `_metadata`

#### Scenario: Unrestricted roles are shown read-only
- **WHEN** the alias has no `userRoles`
- **THEN** the Roles tab shows every role read-only with the "available to specific roles" switch off

#### Scenario: config.json alias is read-only
- **WHEN** an admin opens an alias from the config.json tab
- **THEN** every field is read-only and no Save or Delete action is offered

#### Scenario: Stale etag
- **WHEN** another admin changed the alias and the user saves
- **THEN** Core's 412 is handled as for the other entities and the user's edits are not lost silently

### Requirement: Target and present-as selection
The system SHALL let the user choose the **target type** (Model, Application, Toolset, Auto Router), then pick the **target** with
the shared entity picker in single-selection mode, opened from a read-only input with an open icon (the pattern of the
other popup-backed fields; no separate Select/Change button), then choose **present-as**. Present-as options SHALL be limited to:
Model → Model, Application; Application → Model, Application, Toolset; Toolset → Toolset; Auto Router → Auto Router, Model,
Application. Present-as Auto Router SHALL be offered for an Auto Router target only. Present-as SHALL default to
the target type and SHALL be written only when it differs from that default. The Auto Router target type SHALL be offered
only on a Platform alias, because Core refuses a router target on a Public alias; a Public alias already stored with a
router target SHALL still show that type. Changing the target type SHALL clear the
target. The picker SHALL offer every source the chosen type has: Application and Toolset the Public tree, Platform
and config.json; Model and Auto Router Platform and config.json. The picked target SHALL be stored as `target.path`: a Public pick as
`<type>/<picked public path>` with each path segment percent-encoded, the form Core parses (for example
`applications/public/team/assistant`, or `applications/public/QA/Code%20Apps%20ALS/assistant` for a folder named
`Code Apps ALS`), and a Platform or config.json pick as `<type>/<name>` (for example `routers/smart-router`). The stored path SHALL be decoded again where
it is shown or reused. A `target.path` the form cannot parse SHALL be shown as plain text and SHALL be left unchanged
until the user picks a target. The Auto Router label SHALL NOT change the Core router type or its stored values.

#### Scenario: Toolset target allows only toolset presentation
- **WHEN** the target type is Toolset
- **THEN** present-as offers only Toolset

#### Scenario: Application target offers all three presentations
- **WHEN** the target type is Application
- **THEN** present-as offers Model, Application and Toolset, with Application preselected

#### Scenario: Router target offers router, model and application presentations
- **WHEN** the target type is Auto Router
- **THEN** present-as offers Auto Router, Model and Application, with Auto Router preselected, and an Auto Router pick is stored as `routers/<name>`

#### Scenario: Public alias is not offered a router target
- **WHEN** an admin opens the target type on a Public alias
- **THEN** Auto Router is not among the options; on a Platform alias it is

#### Scenario: Target is an input with an open icon
- **WHEN** an admin views the Target step or tab
- **THEN** the target is a read-only input showing the readable path, with an open icon that opens the picker and no Select/Change target button

#### Scenario: Changing the type clears the target
- **WHEN** an admin changes the target type after picking a target
- **THEN** the target is cleared and present-as falls back to the new type's default

#### Scenario: Public pick is stored with its bucket
- **WHEN** an admin picks `public/team/assistant` on the Public tab of the Application picker
- **THEN** `target.path` is `applications/public/team/assistant`

#### Scenario: Public pick with spaces in its path is stored encoded
- **WHEN** an admin picks `public/QA/Code Apps ALS/app__1.0.0` on the Public tab of the Application picker
- **THEN** `target.path` is `applications/public/QA/Code%20Apps%20ALS/app__1.0.0` and Core accepts the create

#### Scenario: An encoded target is shown readably
- **WHEN** an alias with `target.path` `applications/public/QA/Code%20Apps%20ALS/app__1.0.0` is opened
- **THEN** the Target tab shows `QA/Code Apps ALS/app__1.0.0` as the reference

#### Scenario: Platform and config.json picks are stored by bare name
- **WHEN** an admin picks `gpt-4-internal` on the Platform or config.json tab of the Model picker
- **THEN** `target.path` is `models/gpt-4-internal`

#### Scenario: Single selection across tabs
- **WHEN** an admin selects an entity on the Public tab and then selects another on the Platform tab
- **THEN** only the second is selected, Apply is enabled, and applying reports exactly one entity

#### Scenario: Model and Router pickers have no Public tab
- **WHEN** an admin opens the target picker for a Model or Auto Router target
- **THEN** only the Platform and config.json tabs are offered

#### Scenario: Unparseable existing target is not rewritten
- **WHEN** an alias is loaded with a `target.path` the form cannot parse and the user saves another field
- **THEN** the original `target.path` is sent unchanged

#### Scenario: A missing target is accepted by the form
- **WHEN** an admin saves an alias whose target does not exist yet
- **THEN** the form does not block the save, because Core accepts it and reports the alias as broken until the target exists

#### Scenario: Stored router target retains its displayed type
- **WHEN** an admin opens an alias whose target path uses the `routers/` prefix
- **THEN** the target type is displayed as Auto Router and its existing path is retained

### Requirement: Broken-alias reporting
The system SHALL show a banner on the alias detail view when Core reports the alias invalid: a `GET` answer with
`status: invalid` SHALL list its `validationWarnings` (each a `field` and a `message`), and an entry of
`/v1/admin/health/config` `skipped` whose `id` is the alias (`aliases/<name>` for a Platform or config.json alias,
`aliases/public/<name>` for a Public one) SHALL show a message for its `reason`: `alias_target_missing` and
`alias_target_incompatible` their own text, any other reason Core's text. The banner SHALL NOT block editing.

#### Scenario: Invalid blob shows its warnings
- **WHEN** an admin opens an alias that Core returns with `status: invalid` and `validationWarnings`
- **THEN** a banner lists those warnings and the fields remain editable

#### Scenario: Missing target is named
- **WHEN** Core's health report lists the alias with `alias_target_missing`
- **THEN** the banner says the target does not exist

#### Scenario: An unknown health reason is shown as Core's text
- **WHEN** Core's health report lists the alias with a reason that is not one of the two alias reasons
- **THEN** the banner shows that reason text as returned

#### Scenario: Healthy alias shows no banner
- **WHEN** the alias is valid and not in the health report
- **THEN** no banner is shown

### Requirement: Alias strings are internationalised
The system SHALL render every user-facing string of the Aliases surface — menu item, list title, tab labels, column
headers, empty states, create/duplicate/delete/update modal text, bulk-delete text, field labels, hints, validation
messages, picker headers, banner messages and notifications — through `t()` from `locales/en.ts`, and SHALL NOT embed
display text in components. Keys SHALL be grouped in the same enums the sibling entities use (`MenuI18nKey`,
`DeleteI18nKey`, `DuplicateI18nKey`, `UpdateI18nKey`, `CreateI18nKey`, `FileManagerI18nKey`) plus a dedicated
`AliasI18nKey` section, and shared labels (Create, Delete, Cancel, Apply, tab labels, display name, description)
SHALL reuse the existing keys.

#### Scenario: Every enum key has a locale entry
- **WHEN** the i18n enums are checked against `locales/en.ts`
- **THEN** every new alias key resolves to a non-empty English string

#### Scenario: No duplicated shared labels
- **WHEN** the new `AliasI18nKey` section is reviewed
- **THEN** it contains no key whose text equals an existing `BasicI18nKey`, `ButtonsI18nKey` or `AssetTabsI18nKey` label

### Requirement: Alias bulk selection is isolated by source

The system SHALL offer bulk selection and deletion on both the Public and Platform Alias grids, independently for each source. Confirming deletion SHALL delete the selected aliases from the active source using DIAL Core's `DELETE /v1/aliases/<bucket>/<name>` contract and SHALL NOT delete aliases in another bucket or their targets.

#### Scenario: Delete Public aliases

- **WHEN** an admin selects and confirms deletion of multiple aliases on the Public tab
- **THEN** the system requests deletion of those `aliases/public/` resources, and their targets and any Platform aliases remain untouched

#### Scenario: Delete Platform aliases

- **WHEN** an admin selects and confirms deletion of multiple aliases on the Platform tab
- **THEN** the system requests deletion of those `aliases/platform/` resources, and their targets and any Public aliases remain untouched

#### Scenario: Same name in both buckets

- **WHEN** an alias with the same name exists in both buckets and an admin bulk-deletes the Public alias
- **THEN** only the Public alias is requested for deletion

