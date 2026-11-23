## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Selecting tables and pipelines to export

In a Custom Analytics export the Content panel SHALL show two tabs, **Tables** and **Pipelines**, each with a count of
the selected objects, an Add button opening the existing Add-entities modal, a grid of the selected objects,
and a remove action per row. The grids SHALL show the object's name and description.

The Tables modal SHALL offer only tables that are not system tables, whose status is `active`, and whose name
does not start with `otel_`: the service refuses a system, pending, failed or OTLP landing table as an explicit
selection, so offering one would only produce a refusal at preview. The list response carries no field marking
an OTLP landing table; the `otel_<sink>_<signal>` naming the service gives them is the only signal the page
has. While **Include access** is checked, the Tables modal SHALL also offer active system tables of type `source`:
the service accepts one then and exports only its access. It SHALL NOT offer a system enrichment table, which never
carries access. Unchecking the box SHALL remove every system table from the selection, because without the flag the
service refuses one with `422 catalog_export_invalid`. The Pipelines modal SHALL offer every pipeline the user can
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
