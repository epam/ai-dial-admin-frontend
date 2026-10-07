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
and a remove action per row. The grids SHALL show the object's name and description.

The Tables modal SHALL offer only tables that are not system tables, whose status is `active`, and whose name
does not start with `otel_`: the service refuses a system, pending, failed or OTLP landing table as an explicit
selection, so offering one would only produce a refusal at preview. The list response carries no field marking
an OTLP landing table; the `otel_<sink>_<signal>` naming the service gives them is the only signal the page
has. The Pipelines modal SHALL offer every pipeline the user can list. Each tab's candidates
SHALL be read when the tab is first opened. A failed read SHALL be reported by an error notification under *An
Analytics read failure is reported by notification, in the service's own words*, and the modal SHALL offer no
candidates for that tab. A read the service never answered (the call itself is rejected) has no words of the
service to report; it SHALL be reported by a notification saying the list could not be loaded. Neither kind of
failure SHALL be cached: reopening the tab SHALL read again.

In Custom, the page's Export button SHALL be disabled while neither tab holds a selected object.

#### Scenario: Only exportable tables are offered

- **WHEN** the environment holds an active user table, a pending user table, a system table and an active `otel_claude_code_logs` table, and the user opens the Tables Add modal
- **THEN** the modal lists the active user table only

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
- **THEN** an error notification shows the service's header, message and request id
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
- **Required system tables** — the system tables the target environment must already have, by name.
- **Skipped** — objects the service left out, with their type, name and `reason`. The service fills it only for
  a Full config export; for a Custom one it refuses an unexportable selection instead (below), so the tab is
  empty there.

A section the service returns empty SHALL show the grid's empty state rather than being hidden. The modal SHALL
NOT show the "Include Secrets" or "Include Global Firewall" checkboxes, because an Analytics bundle carries
neither.

A failed preview — including the service refusing the selection (for example `422 catalog_export_invalid` when
the selection reaches an OTLP landing table, or `403 sensitive_column_not_entitled`) — SHALL be reported by an
error notification carrying the service's header, message and request id, and the modal's submit button SHALL
be disabled, so a selection the service refuses cannot be exported.

#### Scenario: Preview lists objects pulled in by dependency

- **WHEN** the user selected one enrichment table whose source table is another user table, and opens the preview
- **THEN** the Objects list contains both tables
- **AND** the source table's reason names the selected table it was pulled in by

#### Scenario: Required system tables shown

- **WHEN** the selected pipeline reads a system table
- **THEN** the Required system tables list shows that table's name

#### Scenario: No secrets checkboxes

- **WHEN** the Analytics export preview is open
- **THEN** no "Include Secrets" and no "Include Global Firewall" checkbox is shown

#### Scenario: Refused selection

- **WHEN** the preview request returns 422
- **THEN** an error notification shows the service's message
- **AND** the modal's submit button is disabled

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

