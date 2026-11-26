# analytics/config-transfer Specification

## Purpose
Moving the Analytics catalog — user tables and pipelines — between environments through the admin console's
Export Config page: the Analytics scope, selecting what to export, previewing the bundle, and downloading it.
## Requirements

### Requirement: Analytics scope on the Export Config page

The Export Config page SHALL offer **Analytics** as an option of its Components selector when `ANALYTICS_ENABLED`
is truthy, and SHALL NOT offer it otherwise. The option SHALL follow the admin and Deployments options.

Selecting Analytics SHALL hide the Format radio, the Dependencies checkboxes and the Topics filter, and SHALL
show the Type radio (Full config / Custom) with Full config selected, so the Structure panel holds the
Components selector and the Type radio. Switching
the scope to or from Analytics SHALL clear the current selection, so no admin or deployment entity is carried
into an Analytics export and no Analytics object into another.

#### Scenario: Analytics offered when enabled

- **WHEN** `ANALYTICS_ENABLED` is truthy and the Export Config page loads
- **THEN** the Components selector shows an "Analytics" option

#### Scenario: Analytics not offered when disabled

- **WHEN** `ANALYTICS_ENABLED` is unset or falsy
- **THEN** no "Analytics" option is shown

#### Scenario: Structure panel in the Analytics scope

- **WHEN** the user selects "Analytics"
- **THEN** the Format radio, Dependencies checkboxes and Topics filter are not shown
- **AND** the Components selector and the Type radio are shown, with Full config selected

#### Scenario: Switching scope clears the selection

- **WHEN** the user has added tables in a Custom Analytics export and then selects "Deployments"
- **THEN** the Deployments content shows no selected entities
- **AND** returning to "Analytics" selects Full config, and choosing Custom shows no selected tables

### Requirement: Full and Custom Analytics export

**Full config** SHALL export every object the service considers exportable — every active user table and every
pipeline that reads no OTLP landing table. The page SHALL send an empty `components` list, which is how the
service expresses "everything"; it has no separate flag. In Full config the Content panel SHALL keep the Tables
and Pipelines tabs but list every candidate read-only — no Add button and no remove action, with the tab count
counting the candidates — as the Admin scope's Full config does, and the Export button SHALL be enabled. The
listing uses the same candidate filter as Custom; the service still decides the bundle, and the preview's Skipped
tab names anything it leaves out that the filter did not anticipate (for example a pipeline reading an OTLP
landing table).

**Custom** SHALL export only the objects the user selects, under *Selecting tables and pipelines to export*.

#### Scenario: Full export sends an empty selection

- **WHEN** the user keeps Full config and confirms the export preview
- **THEN** the preview and the export are requested with `{ "components": [] }`

#### Scenario: Full export needs no selection

- **WHEN** the Analytics scope is in Full config and the environment holds two exportable tables
- **THEN** the Tables tab lists both, its count reads 2, and no Add button is shown
- **AND** the Export button is enabled

### Requirement: Selecting tables and pipelines to export

In a Custom Analytics export the Content panel SHALL show two tabs, **Tables** and **Pipelines**, each with a count of
the selected objects, an Add button opening the existing Add-entities modal, a grid of the selected objects,
and a remove action per row. The grids SHALL show the object's name and description, plus the export options and
Edit action that *Per-row options of a Custom Analytics export* defines.

The Tables modal SHALL offer only tables that are not system tables, whose status is `active`, and whose name
does not start with `otel_`: the service refuses a system, pending, failed or OTLP landing table as an explicit
selection, so offering one would only produce a refusal at preview. The list response carries no field marking
an OTLP landing table; the `otel_<sink>_<signal>` naming the service gives them is the only signal the page
has. While **Include access** is checked, the Tables modal SHALL also offer active system tables of type `source`:
the service accepts one then and exports only its access. It SHALL NOT offer a system enrichment table, which never
carries access. Unchecking the box SHALL remove every system table and every access-only table from the selection,
because without the flag the service refuses one with `422 catalog_export_invalid`, and SHALL clear the chosen roles of
the remaining tables. It SHALL keep a pipeline's Dependencies option, which does not depend on access. The Pipelines modal SHALL offer every pipeline the user can
list. Each tab's candidates SHALL be read when the tab is first opened, and again after the box changes. A failed read
SHALL be reported by an error notification under *An Analytics read failure is reported by notification, in the
service's own words*, and the modal SHALL offer no candidates for that tab. A read the service never answered (the
call itself is rejected) has no words of the service to report; it SHALL be reported by a notification saying the
list could not be loaded. Neither kind of failure SHALL be cached: reopening the tab SHALL read again.

In Custom, the page's Export button SHALL be disabled while neither tab holds a selected object.

#### Scenario: Only exportable tables are offered

- **WHEN** the environment holds an active user table, a pending user table, a system table and an active `otel_claude_code_logs` table, and the user opens the Tables Add modal
- **THEN** the modal lists the active user table only

#### Scenario: System source tables offered with access

- **WHEN** Include access is checked and the environment holds an active user table, the system source table
  `dial_usage_log` and a system enrichment table
- **THEN** the Tables modal lists the user table and `dial_usage_log`, and not the system enrichment table

#### Scenario: Unchecking access drops system tables from the selection

- **WHEN** the user selected `dial_usage_log` and a user table with Include access checked, and then unchecks it
- **THEN** the Tables grid holds only the user table

#### Scenario: Unchecking access drops access-only rows and roles

- **WHEN** with Include access checked the user marked one user table Access only, chose one role on another, and set a
  pipeline to Pipeline only, and then unchecks the box
- **THEN** the Tables grid holds only the second table, with no chosen roles
- **AND** the pipeline still reads Pipeline only

#### Scenario: Adding and removing a pipeline

- **WHEN** the user adds a pipeline from the Pipelines modal
- **THEN** it appears in the Pipelines grid and the tab count reads 1
- **WHEN** the user removes it
- **THEN** the grid is empty and the Export button is disabled

#### Scenario: Export enabled by a selection on either tab

- **WHEN** the user has selected one table and no pipeline
- **THEN** the Export button is enabled

#### Scenario: Service unreachable

- **WHEN** the candidate read is rejected because the service cannot be reached
- **THEN** the loader stops and an error notification says the list could not be loaded
- **AND** reopening the tab reads the candidates again

#### Scenario: Candidate read fails

- **WHEN** listing tables fails
- **THEN** an error notification titled with this app's own string shows the service's message and request id
- **AND** the Tables modal offers no tables

### Requirement: Analytics export preview

Pressing Export in the Analytics scope SHALL open the export preview modal, which SHALL request
`POST {DIAL_ANALYTICS_API_URL}/v1/catalog/export/preview` with the body
`{ "components": [{ "type": "table" | "pipeline", "name": <name> }] }` built from the selection, and SHALL show
what the bundle will hold:

- **Objects** — every table and pipeline the bundle will carry, in the order the service returns them, with
  type, name, description, and the service's `reason` for including it (`selected`, or the dependency that
  pulled it in). The service adds every object the selection depends on and every pipeline that targets a
  selected table, so this list can be longer than the selection, and it SHALL be shown in full.
- **Required system tables** — the system tables the target environment must already have, with name and the
  service's `reason`, shown as returned (with access included it may read `access` or `column policy of <table>`).
- **Skipped** — objects the service left out, with their type, name and `reason`. The service fills it only for
  a Full config export; for a Custom one it refuses an unexportable selection instead (below), so the tab is
  empty there.

A section the service returns empty SHALL show the grid's empty state rather than being hidden. The modal SHALL
NOT show the "Include Secrets" or "Include Global Firewall" checkboxes, because an Analytics bundle carries
neither.

A failed preview — including the service refusing the selection (for example `422 catalog_export_invalid` when
the selection reaches an OTLP landing table, or `403 sensitive_column_not_entitled`) — SHALL be reported by an
error notification titled with this app's own string and carrying the service's message and request id, and the modal's submit button SHALL
be disabled, so a selection the service refuses cannot be exported.

#### Scenario: Preview lists objects pulled in by dependency

- **WHEN** the user selected one enrichment table whose source table is another user table, and opens the preview
- **THEN** the Objects list contains both tables
- **AND** the source table's reason names the selected table it was pulled in by

#### Scenario: Required system tables shown

- **WHEN** the selected pipeline reads a system table
- **THEN** the Required system tables list shows that table's name and the service's reason

#### Scenario: No secrets checkboxes

- **WHEN** the Analytics export preview is open
- **THEN** no "Include Secrets" and no "Include Global Firewall" checkbox is shown

#### Scenario: Refused selection

- **WHEN** the preview request returns 422
- **THEN** an error notification shows the service's message
- **AND** the modal's submit button is disabled

### Requirement: Access transfer is offered only to a caller who may grant

The **Include access** checkboxes of the Export Config and Import Config pages SHALL be enabled only for a caller
holding the service's global table-grant permission (`TABLE_GRANT`). The page SHALL read it from the `permissions.grant`
the service reports on the caller's table listing (`GET {DIAL_ANALYTICS_API_URL}/v1/tables`); the permission is global,
so any listed table answers for all. When the listing omits `permissions`, the checkbox SHALL be enabled only when
authentication is disabled. When the listing cannot be read, the checkbox SHALL be disabled. A disabled checkbox SHALL
be unchecked.

The page SHALL still report a `403 forbidden` from any access-carrying request through the error notification that
request already uses, because the permission may change after the page loaded.

#### Scenario: Caller without the grant permission

- **WHEN** the caller's table listing reports `permissions.grant: false` and the Analytics scope is selected
- **THEN** the Include access checkbox on the Export Config page is disabled and unchecked
- **AND** the Include access checkbox on the Import Config page is disabled and unchecked

#### Scenario: Caller with the grant permission

- **WHEN** the caller's table listing reports `permissions.grant: true`
- **THEN** both Include access checkboxes are enabled and unchecked by default

#### Scenario: Permission revoked after the page loaded

- **WHEN** the box is checked and the export preview returns `403 forbidden`
- **THEN** an error notification shows the service's message and request id, and the preview's submit button is disabled

### Requirement: Including access in an Analytics export

In the Analytics scope the Export Config page SHALL show an **Include access** checkbox in the Structure panel, under
the Type radio, for both Full config and Custom, unchecked by default, with a hint stating that it also
exports each role's privileges, row policies and column policies, system tables included, and that it requires the
grant permission.

When the box is checked, the export preview and the export download SHALL send `"include_access": true` in their body
beside `components`. When it is unchecked, the body SHALL NOT contain `include_access` at all, because an ADAS older
than 0.24 refuses the unknown field with 400. The preview and the download SHALL send the same body, so the file
cannot disagree with the preview the user confirmed.

Switching the scope SHALL uncheck the box.

#### Scenario: Full export with access

- **WHEN** the user keeps Full config, checks Include access and opens the preview
- **THEN** the preview and the export are requested with `{ "components": [], "include_access": true }`

#### Scenario: Unchecked box sends no access field

- **WHEN** the user opens the preview of a Custom export with Include access unchecked
- **THEN** the request body holds `components` only

#### Scenario: Switching scope unchecks the box

- **WHEN** the user checks Include access, selects "Deployments" and returns to "Analytics"
- **THEN** the Include access checkbox is unchecked

### Requirement: Access section of the Analytics export preview

When the export preview response carries `access`, the preview modal SHALL show an **Access** tab after the existing
tabs; when it does not, the tab SHALL NOT be shown. The tab SHALL list one row per table and role, with the columns
**Table**, **Role**, **Outcome** and **Detail**:

- every role of an item's `roles` SHALL be a row with outcome **Exported** and no detail;
- every element of an item's `left_behind` SHALL be a row with outcome **Left behind**, and its detail SHALL hold the
  element's `error` code followed by a summary of the removed `entry`: its privileges, "row policy" when `rows` is
  non-null, and "column policy" when `columns` is non-null.

Left-behind rows SHALL be styled as warnings, and the tab SHALL carry a warning status while any row is left behind.
A left-behind row SHALL NOT disable the preview's submit button: the bundle is still valid, and the row names what the
user has to grant by hand on the target. The tab's label SHALL carry the count of its rows, so the reach of a Full
export with access is visible before download.

#### Scenario: Exported and left-behind roles

- **WHEN** the preview returns access for `dial_usage_log` with one role in `roles` and one `left_behind` element with
  error `table_is_system` and privilege `write`
- **THEN** the Access tab shows two rows for `dial_usage_log`: one Exported, one Left behind whose detail names
  `table_is_system` and `write`
- **AND** the tab carries a warning status and the submit button stays enabled

#### Scenario: No access section without the box

- **WHEN** the box is unchecked and the user opens the preview
- **THEN** no Access tab is shown

### Requirement: Per-row options of a Custom Analytics export

In a Custom Analytics export each selected pipeline and, while **Include access** is checked, each selected table
SHALL carry export options, shown as grid columns and changed through an **Edit** row action beside Remove. Full
config SHALL offer no options, and the Add-entities modal SHALL show no option columns.

- **Pipelines**: a **Dependencies** column reading **Included** or **Pipeline only**. Edit SHALL open a popup with an
  **Include dependencies** checkbox, checked by default, whose caption states that unchecked it exports only the
  pipeline, that the target must already have every table the pipeline reads and writes, and that the import preview
  reports a missing one.
- **Tables**, only while Include access is checked: an **Export** column reading **Table and access** or **Access
  only**, and a **Roles** column reading **All** or the chosen roles joined. Edit SHALL open a popup with an **Access
  only** checkbox, whose caption states that it exports the table's access entries without the table and that the
  target must already have the table, and a **Roles** multi-select whose empty state reads **All roles**. The popup
  SHALL offer only the roles that hold an entry on the table, read from
  `GET {DIAL_ANALYTICS_API_URL}/v1/tables/{name}/access` when the popup opens. When the table has no entry, the popup
  SHALL say "No access entries on this table" and disable Access only and Roles. A failed read SHALL be reported by an
  error notification in the service's own words, and Access only and Roles SHALL then be disabled. Choosing no role
  SHALL mean every role, including roles added after the choice.

The export preview and the download SHALL send, per component, only the selectors that differ from the default and
apply to its type: `"dependencies": false` on a pipeline whose dependencies are excluded, `"access_only": true` on an
access-only table, and `"roles": [...]` on a table with chosen roles. A component without options SHALL be sent as
`{ "type", "name" }` alone. `access_only` and `roles` SHALL never be sent without `include_access`.

An access-only selection may yield an export preview with empty Objects and a non-empty Access tab; the preview SHALL
accept it and keep the submit button enabled. When another selected object pulls an access-only table in whole, the
preview SHALL show the result as returned, without a warning of its own.

#### Scenario: Pipeline exported alone

- **WHEN** the user selects a pipeline, opens Edit, unchecks Include dependencies and applies
- **THEN** the Dependencies column reads Pipeline only
- **AND** the preview is requested with `{ "type": "pipeline", "name": <name>, "dependencies": false }` for it

#### Scenario: Table options hidden without access

- **WHEN** Include access is unchecked and the Tables tab holds a selected table
- **THEN** the grid shows no Export and no Roles column, and the row offers no Edit action

#### Scenario: Access only with one role

- **WHEN** Include access is checked and the user marks a selected table Access only with one of its two roles
- **THEN** the Export column reads Access only and the Roles column names that role
- **AND** the request carries `"access_only": true, "roles": [<role>]` for the table

#### Scenario: All roles sends no roles

- **WHEN** the user marks a table Access only and leaves Roles empty
- **THEN** the Roles column reads All and the request carries `"access_only": true` and no `roles`

#### Scenario: Table without access entries

- **WHEN** the user opens Edit on a table that holds no access entry
- **THEN** the popup says "No access entries on this table" and Access only is disabled

#### Scenario: Access-only preview with no objects

- **WHEN** the preview of an access-only selection returns empty `objects` and one `access` item
- **THEN** the Objects tab shows its empty state, the Access tab lists the item's roles, and the submit button is enabled

### Requirement: Analytics bundle download

Confirming the preview SHALL request `POST {DIAL_ANALYTICS_API_URL}/v1/catalog/export` with the same body the
preview used, and SHALL download the response as a file named by the response's `Content-Disposition` header.
The file is the service's JSON bundle and SHALL be saved unchanged.

On success the page SHALL show the same success notification the other scopes show, with the exported type
reading "Analytics". On failure it SHALL show the same error title the other scopes show, with the service's
message and request id as its description when the service gave one (the generic description otherwise), and
SHALL NOT download anything.

#### Scenario: Successful download

- **WHEN** the user confirms the Analytics export preview
- **THEN** the browser downloads the file the service named
- **AND** a success notification is shown

#### Scenario: Export fails

- **WHEN** the export request fails with a message from the service
- **THEN** an error notification shows that message and the request id
- **AND** no file is downloaded

### Requirement: Analytics scope on the Import Config page

The Import Config page SHALL offer **Analytics** in its Config Scope selector when `ANALYTICS_ENABLED` is truthy, and
SHALL NOT offer it otherwise.

In the Analytics scope the Files step SHALL:

- accept exactly one file, restricted to `.json` (`application/json`) — the bundle the Analytics export downloads;
  a second file SHALL replace the first, and a file of another type SHALL be refused with the file-format error;
- hide the File Type radio group;
- offer the conflict policy as a radio group with **Fail if exists** (`FAIL_IF_EXISTS`, the default) and **Skip if
  exists** (`SKIP_IF_EXISTS`). There SHALL be no Override option: the service never changes an existing object and
  refuses `OVERWRITE`.

The Next button SHALL be disabled until a file is chosen.

#### Scenario: Bundle upload in the Analytics scope

- **WHEN** the user selects the Analytics scope
- **THEN** the File Type radio group is hidden
- **AND** the upload area accepts a single `.json` file
- **AND** the conflict policy offers "Fail if exists" (selected) and "Skip if exists", and no Override

#### Scenario: Wrong file type

- **WHEN** the user drops a `.zip` file in the Analytics scope
- **THEN** the file is refused with the file-format error and Next stays disabled

### Requirement: Analytics import preview

The Configuration step SHALL request `POST {DIAL_ANALYTICS_API_URL}/v1/catalog/import/preview` as multipart form
data with the bundle in the `file` part, `resolution_policy` set to the chosen policy, and
`acknowledge_reused_names=false` — the service reports re-used names either way, and the confirmation travels on
the import (*Re-used pipeline names*). The preview SHALL be requested again when the file, the policy or the
Include access box changes. It SHALL show the tabs **Tables**, **Pipelines** and **Required system tables** in that
order, followed by **Access** under *Access section of the Analytics import preview and result*, each listing the
service's entries:

- every tab: the action (`Create`, `Skip` or `Fail`, shown as returned and styled as the admin import's action
  column) and the name; the entry's `problems` SHALL be shown on the row, and a row with problems SHALL be
  marked invalid;
- **Pipelines** additionally: whether the pipeline can be enabled here (`armable`), with `arm_problems` reachable
  from the row;
- a row whose `prev` is present SHALL offer **Compare**, which opens the admin import's diff modal with `prev` as
  the current state and `next` as the incoming one; a row whose `differs` is true SHALL be marked as differing,
  and one whose `metadata_only` is true SHALL say that only metadata differs.

A tab with at least one invalid row SHALL be marked invalid. Above the tabs the step SHALL show:

- a validation banner listing the service's `validation_errors`, when there are any;
- the bundle's **environment-specific values** (`env_specific`: object, field, value) as a list headed by a note
  that these were copied from the source environment and should be reviewed, when there are any.

A failed preview request SHALL be reported by an error notification titled with this app's own string and carrying the service's message and
request id; a request the service cannot be reached for SHALL be reported by a notification saying the preview
could not be loaded. Either SHALL leave the Import button disabled.

#### Scenario: Preview lists the bundle's objects with actions

- **WHEN** the bundle holds one new table and one pipeline whose name already exists, under "Skip if exists"
- **THEN** the Tables tab shows the table with action Create
- **AND** the Pipelines tab shows the pipeline with action Skip and a Compare action

#### Scenario: Compare an object the import would keep

- **WHEN** the user opens Compare on a Skip row whose stored definition differs from the bundle
- **THEN** the diff modal opens with the stored definition as current and the bundle's as incoming

#### Scenario: Environment-specific values shown

- **WHEN** the preview returns `env_specific` entries
- **THEN** the step lists each entry's object, field and value under the review note

#### Scenario: Validation errors

- **WHEN** the preview returns `validation_errors`
- **THEN** the validation banner lists them and the Import button is disabled

#### Scenario: Bundle without access while the box is checked

- **WHEN** the box is checked and the bundle was exported without access
- **THEN** the validation banner lists the service's error about the missing access member and the Import button is disabled

### Requirement: Including access in an Analytics import

In the Analytics scope the Files step of the Import Config page SHALL show an **Include access** checkbox under the
conflict policy, unchecked by default, with a hint stating that each role in the file replaces that role's access on
the target table — existing and system tables included, under either conflict policy — that roles not in the file are
kept, that nothing is removed, and that role names are copied as-is and must exist on this environment.

When the box is checked, the import preview and the import SHALL send `include_access=true` as a query parameter
beside `resolution_policy`; when it is unchecked they SHALL NOT send the parameter. Changing the box SHALL request the
preview again, clear a shown result, and clear the re-used names confirmation, as changing the file or the policy
does. Switching the scope SHALL uncheck the box.

#### Scenario: Import preview with access

- **WHEN** the user checks Include access and moves to the Configuration step
- **THEN** the preview is requested with `include_access=true` in its query

#### Scenario: Toggling the box re-runs the preview

- **WHEN** an import result is shown and the user goes back and unchecks Include access
- **THEN** the preview is requested again without `include_access`, and the result and its Status column are gone

### Requirement: Access section of the Analytics import preview and result

When the import preview or result carries a non-empty `access` list, the Configuration step SHALL show an **Access**
tab after Required system tables; when the list is empty, the tab SHALL NOT be shown. It SHALL list one row per
entry, with the columns **Action**, **Table**, **Role**, **Problems** and **Ineffective grants** (the entries'
`message` values joined), and **Status** once a result is shown.

- The action SHALL read `Create`, `Update`, `Skip` or `Fail`. The service's `REPLACE` SHALL read `Update` and be
  styled as the admin import's Update action, which names the same outcome — an existing entry overwritten; the
  others as the table rows' actions are.
- A row whose action is `Fail` or that has problems SHALL be marked invalid, and the tab SHALL then be marked invalid.
  Ineffective grants alone SHALL NOT mark a row invalid.
- A row whose `prev` is non-null SHALL offer **Compare**, opening the import diff modal titled `<table> / <role>`, with
  `prev` as the current state and `next` as the incoming one.
- Rows SHALL be shown as the service returns them; under "Fail if exists" a table that is `Fail` may still list its
  access as Create, Update or Skip.
- The status SHALL read `created`, `replaced`, `skipped` or `rolled back`.

#### Scenario: Update and Skip entries

- **WHEN** the preview returns one entry with action `REPLACE` and one with action `SKIP`, both with a `prev`
- **THEN** the Access tab shows Update in the admin import's Update style and Skip, and both rows offer Compare

#### Scenario: Ineffective grant is a warning only

- **WHEN** an entry is `CREATE` with one ineffective grant
- **THEN** the row shows the grant's message and is not marked invalid, and Import stays enabled

#### Scenario: Empty access list

- **WHEN** the preview was requested without the box and returns an empty `access` list
- **THEN** no Access tab is shown

#### Scenario: Result statuses

- **WHEN** the import returns access entries with status `created` and `replaced`
- **THEN** the Access tab's Status column reads created and replaced

### Requirement: Import notice for a file that may carry access only

When **Include access** is unchecked and the Analytics import preview holds no tables and no pipelines, the
Configuration step SHALL show an info notice saying that the file carries no tables or pipelines, and that if it was
exported with access, the user should turn on Include access. The notice SHALL NOT be shown while the box is checked,
or when the preview holds a table or a pipeline.

#### Scenario: Access-only file imported without access

- **WHEN** Include access is unchecked and the preview returns empty `tables` and `pipelines`
- **THEN** the info notice is shown

#### Scenario: No notice with access included

- **WHEN** Include access is checked and the preview returns empty `tables` and `pipelines`
- **THEN** the info notice is not shown

### Requirement: Re-used pipeline names

When any preview entry has `reused_name` true, the Configuration step SHALL show a checkbox, unchecked by default,
stating that the listed pipeline names were used before on this environment and that importing reuses them. Until it
is checked the Import button SHALL be disabled. Checking it SHALL send `acknowledge_reused_names=true` on the import
request.

#### Scenario: Re-used name blocks import until confirmed

- **WHEN** the preview marks a pipeline `reused_name`
- **THEN** the confirmation checkbox is shown unchecked and Import is disabled
- **WHEN** the user checks it
- **THEN** Import is enabled and the import is sent with `acknowledge_reused_names=true`

### Requirement: Analytics import gate

The Import button SHALL be disabled, with the existing blocked-import tooltip, while the preview is loading or has
failed, while it reports any `validation_errors`, while any entry's action is `Fail` — table, pipeline, required
system table or access entry alike — or while a re-used name is unconfirmed. A `Fail` row SHALL say why on the row;
under "Fail if exists" an existing object is a `Fail`, so the step SHALL state that choosing "Skip if exists" keeps
existing objects and imports the rest.

#### Scenario: An existing object under Fail if exists

- **WHEN** the bundle holds a table that already exists and the policy is "Fail if exists"
- **THEN** that row shows action Fail, Import is disabled, and the step suggests "Skip if exists"

#### Scenario: A refused access entry blocks the import

- **WHEN** every table and pipeline entry is Create or Skip and one access entry is `FAIL` with a problem naming a
  column the target table lacks
- **THEN** the Access row shows Fail with that problem, the Access tab is marked invalid, and Import is disabled

### Requirement: Analytics import result

Importing SHALL request `POST {DIAL_ANALYTICS_API_URL}/v1/catalog/import` with the same file, policy, confirmation
and Include access choice the preview used. The page SHALL stay on the Configuration step and show the result in
place:

- every tab's grid SHALL gain a **Status** column with each entry's `status` (`created`, `skipped`, `rolled back`,
  `rollback failed`, `failed`, and on the Access tab `replaced`);
- a banner SHALL state the `outcome`: **completed** as success; **rolled back** as an error saying nothing the
  import created was kept; **rollback failed** as an error saying some created objects were left behind and that
  re-importing with "Skip if exists" converges on them;
- a completed import SHALL also state that imported pipelines are disabled, to be enabled on this environment; when
  the import was sent without access, it SHALL also state that imported tables have no access grants, to be set on
  this environment.

The Import button SHALL stay disabled after a result is shown; choosing another file or scope starts over. A request
the service refuses (for example `409 catalog_import_conflict`, `422 catalog_import_invalid`, `413` for an oversized
file) SHALL be reported by an error notification titled with this app's own string and carrying the service's message and request id, and SHALL
NOT show a result.

#### Scenario: Completed import

- **WHEN** the import, sent without access, returns `outcome: completed`
- **THEN** the Status column shows `created` or `skipped` per row
- **AND** a success banner states the import completed and that pipelines are disabled and table access is not imported

#### Scenario: Completed import with access

- **WHEN** the import, sent with access, returns `outcome: completed`
- **THEN** the success banner states that pipelines are disabled and does not say table access is not imported

#### Scenario: Rolled back import

- **WHEN** the import returns `outcome: rolled_back`
- **THEN** the Status column shows which rows were rolled back and which failed
- **AND** an error banner states nothing the import created was kept

#### Scenario: Refused import

- **WHEN** the import returns 409
- **THEN** an error notification shows the service's message and no Status column appears
