## RENAMED Requirements

- FROM: `### Requirement: Pipeline detail view is organized into Properties, Runtime, Groups and Audit tabs`
- TO: `### Requirement: Pipeline detail view is organized into Properties, Preview, Runtime, Groups and Audit tabs`

## MODIFIED Requirements

### Requirement: Pipeline detail view is organized into Properties, Preview, Runtime, Groups and Audit tabs

The pipeline detail view (`/pipelines/{name}`) SHALL present its content under a horizontal tab strip whose
tabs are **Properties**, **Preview**, **Runtime**, **Groups** and **Audit**, in that order. `Properties` SHALL be the selected
tab when the view is first opened.

The **Preview** tab SHALL be present only for a caller who is a full admin, as "The Preview tab runs the
pipeline's declared read on request" states. The dry-run it reports requires full-admin rights, so for anyone
else the tab is withheld in full rather than shown with nothing it may run.

The **Runtime** tab SHALL be present only for a caller who is a full admin. The runtime it reports is
controlled through a service that authorizes every one of its endpoints, reads included, on full-admin
rights and offers no consumer-facing read — so for anyone else there is nothing to present read-only and
the tab is withheld in full rather than shown empty.

The **Groups** tab SHALL be present only under the conditions "The Groups tab is offered only for a group
pipeline the runner holds groups for" states. Where it is absent the remaining tabs keep their order.

The **Runtime tab SHALL carry an error mark** once the dead-lettered failures have been read and there
is at least one, with their number stated in text beside the strip for a reader who cannot see it. A
reader who opens the view on `Properties` would otherwise have to open the tab to discover there is
anything to act on. No other tab carries one, the Preview tab included: the state the Runtime tab reports is a position rather
than a fault, the Groups tab's states are positions as well, and the Audit tab's activity list is unbounded
and grows with every edit.

The identity row — the enabled-state badge, the runtime status chip, the pipeline name, its copy control,
the `Discard` / `Save` change bar, the enable/disable control, the delete control and the JSON editor
toggle — SHALL render **above** the tab strip, presented whichever tab is
selected, under the permission and pending-edit conditions the "The pipeline detail header states the
pipeline's status before its name" and "Runtime status is stated beside configuration status"
requirements state.

The **runtime alerts** — the last failure, the clamp and the required rebuild, as "A pipeline's runtime
state is presented read-only" states them — SHALL render between the identity row and the tab strip, and
SHALL therefore be presented whichever tab is selected. They are true of the pipeline rather than of the
tab in view: filed under one tab they vanished the moment the reader opened another, which is exactly
where a reader goes to find out what a failing pipeline has been doing. The Runtime tab restates the same
three conditions as dated facts beside the values they qualify; the alert is the signal, the fact is the
record, and the tab is not a substitute for the alert.

The **pause banner** — the pipeline's own pause, as "A paused pipeline states its pause above the tab
strip" states it — SHALL render in the same place, between the identity row and the tab strip, above the
runtime alerts. A pipeline that is not consuming its input is the first thing a reader needs to know,
including a reader of the alerts: a failure reported by a run that no longer happens is read differently
from one reported by a pipeline still trying.

Everything else the frame presents below the identity row — the read-only facts, the scope, the trigger and
the kind's transform section — SHALL render inside the **Properties** tab where a tab strip is rendered,
and directly beneath the identity row where it is not.

Selecting another tab SHALL NOT discard a pending edit. The draft the fields and the document share SHALL
survive a tab switch, and the change bar SHALL stay offered from any tab, so a caller who reads the history,
the runtime or the groups mid-edit does not lose the edit by reading it.

The JSON editor and the tab strip SHALL NOT be presented together. Enabling the editor withdraws the tab
strip along with everything else below the identity row — the runtime alerts and the pause banner
included, since the document on screen is a draft the alerts may already contradict and which says nothing
about the runner — as "The pipeline JSON editor takes the whole view, and an unsaved change closes the way
out" already requires, and leaving the editor SHALL restore the strip with `Properties` selected. The
toggle itself is unchanged and stays offered to every caller.

The tab strip SHALL be rendered only when `featureFlags.analyticsEnabled` is true. With analytics disabled
the detail view SHALL render the Properties content directly, with no tab strip, no Runtime tab, no Groups
tab and no Audit tab, and SHALL issue no request to the analytics activity feed and none to the runtime
service. The route itself is not guarded on that flag — `/pipelines/{name}` guards only on
`isAnalyticsForbidden()`, which is an authorization check against the analytics service and not the client
feature flag, so a bookmarked or pasted link still opens this view on an analytics-disabled installation and
the tab condition is what keeps it from issuing either request.

There SHALL be **no** pipeline-status condition on the Audit tab, unlike the table detail view's, which
additionally requires an `ACTIVE` table. A pipeline has no registration lifecycle to mirror one: the service
creates it whole in a single `POST /v1/pipelines`, so every registered pipeline already carries at least a
`Create` activity. `enabled` is a pipeline's runtime toggle and not a registration state — a disabled
pipeline is fully registered, and disabling or enabling it is itself an audited `Update` — so the Audit tab
SHALL be offered on a disabled pipeline exactly as on an enabled one.

The Audit tab SHALL require no permission beyond the one that already allows reading the pipeline. It SHALL
NOT be gated on full-admin rights, which the save, the enable/disable control, the Runtime tab and the Groups
tab are.

#### Scenario: Properties is the selected tab when the pipeline detail view opens

- **WHEN** a full admin opens the detail view of a registered pipeline
- **THEN** a tab strip showing `Properties`, `Preview`, `Runtime` and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only facts, the trigger and the kind's transform section are shown beneath it

#### Scenario: The Groups tab sits between Runtime and Audit

- **GIVEN** a group pipeline the runner holds at least one group for
- **WHEN** a full admin opens its detail view
- **THEN** the tab strip shows `Properties`, `Preview`, `Runtime`, `Groups` and `Audit`, in that order

#### Scenario: The Runtime tab is withheld from a caller who is not a full admin

- **GIVEN** a caller who is not a full admin
- **WHEN** the user opens the pipeline detail view
- **THEN** the tab strip carries `Properties` and `Audit` only, with no `Preview` tab
- **AND** no runtime state is presented anywhere on the page

#### Scenario: A pending field edit survives a switch to the Preview tab

- **GIVEN** the detail view of a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** a full admin selects `Preview` and then `Properties` again
- **THEN** the edited value is still presented
- **AND** the `Discard` / `Save` bar is still offered

#### Scenario: The Runtime tab marks that something has failed

- **GIVEN** a model-calling enrichment the runtime service reports dead-lettered failures for
- **WHEN** a full admin opens the detail view on `Properties`
- **THEN** the `Runtime` tab carries an error mark and the count is stated beside the strip
- **AND** neither the `Properties`, the `Preview`, the `Groups` nor the `Audit` tab carries one

#### Scenario: The identity row and its actions stay above the tab strip

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the enabled-state badge, the pipeline name, its copy control and the enable/disable control
  remain rendered above the tab strip, unchanged

#### Scenario: A runtime alert is presented on either tab

- **GIVEN** the detail view of a pipeline whose read enrichment has been re-derived beneath it
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the alert stays presented, above the tab strip

#### Scenario: A pause banner is presented on every tab

- **GIVEN** the detail view of a paused pipeline
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the pause banner stays presented, above the tab strip
- **AND** it is presented above the runtime alerts

#### Scenario: The Audit tab is offered on a disabled pipeline

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** the user opens its detail view
- **THEN** the tab strip is rendered and the `Audit` tab is present and selectable

#### Scenario: The Audit tab needs no permission beyond reading the pipeline

- **GIVEN** a caller who is not a full admin, and who is therefore offered no save and no
  enable/disable control
- **WHEN** the user opens the pipeline detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: A pending field edit survives a switch to the Audit tab

- **GIVEN** the detail view of a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** the user selects `Audit` and then `Properties` again
- **THEN** the edited value is still presented
- **AND** the `Discard` / `Save` bar is still offered

#### Scenario: A pending field edit survives a switch to the Runtime tab

- **GIVEN** the detail view of a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** a full admin selects `Runtime` and then `Properties` again
- **THEN** the edited value is still presented
- **AND** the `Discard` / `Save` bar is still offered

#### Scenario: The JSON editor and the tab strip are not presented together

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the caller enables the JSON editor
- **THEN** the pipeline is presented as one JSON document
- **AND** no tab strip is rendered
- **AND** no runtime alert and no pause banner are presented
- **AND** turning the editor off again renders the tab strip with `Properties` selected

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **WHEN** the user reaches `/pipelines/{name}` by a direct link
- **THEN** no tab strip, no `Preview` tab, no `Runtime` tab, no `Groups` tab and no `Audit` tab are rendered
- **AND** the read-only facts, the trigger and the transform section are shown directly
- **AND** no request is issued to the analytics activity feed, to the runtime service or to the preview endpoint

## ADDED Requirements

### Requirement: The Preview tab runs the pipeline's declared read on request

The **Preview** tab SHALL be the console's dry-run of a pipeline: it asks the analytics service to run the
declared read over real rows and presents what the pipeline would write, without writing anything. It SHALL
be offered for every pipeline kind — aggregate, and SQL or LLM enrichment — and for an enabled pipeline as
well as a disabled one, because the service dry-runs both. It SHALL be present only for a full admin and only
while `featureFlags.analyticsEnabled` is true.

The tab SHALL NOT run on its own. Opening it SHALL issue no request. Until a run has been made it SHALL
present what a preview does and a `Run preview` control; once a result is held it SHALL present that result
with `Run again`. While a run is in flight the control SHALL be disabled and labelled as running, and the
previous result, if any, SHALL stay presented until the run returns.

The run SHALL send no body: the sample is always the newest rows of the whole input, and the console offers no
window, cursor or group-key control. The tab SHALL hold the last result for as long as the detail view is
open, across tab switches, and SHALL replace it only with a later success. A run that fails SHALL leave the
previous result in place, dimmed, under the failure's own message, so that a failed run never wipes a good
result.

#### Scenario: Opening the tab issues no request

- **GIVEN** a full admin on the detail view of a pipeline, analytics enabled
- **WHEN** the user selects `Preview` for the first time
- **THEN** a description of the preview and a `Run preview` control are presented
- **AND** no request is issued to the preview endpoint

#### Scenario: Running presents the sample

- **GIVEN** the Preview tab with nothing run yet
- **WHEN** the user activates `Run preview`
- **THEN** one request is issued with no body
- **AND** the control is disabled and labelled as running until it returns
- **AND** the sample is presented with `Run again` in place of `Run preview`

#### Scenario: A disabled pipeline can be previewed

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** a full admin runs the preview
- **THEN** the run is issued as for an enabled pipeline

#### Scenario: The result survives a tab switch

- **GIVEN** a Preview tab holding a result
- **WHEN** the user selects `Properties` and then `Preview` again
- **THEN** the same result is presented
- **AND** no request is issued

#### Scenario: A run in flight leaves the previous result in place

- **GIVEN** a Preview tab holding a result
- **WHEN** the user activates `Run again`
- **THEN** the previous result stays presented until the run returns

#### Scenario: A failed run keeps the earlier result

- **GIVEN** a Preview tab holding a result
- **WHEN** a later run fails
- **THEN** the failure is presented above the earlier result
- **AND** the earlier result stays presented, dimmed
- **AND** `Run again` stays offered

### Requirement: The preview sample is a typed grid under a run bar

A successful preview SHALL present a **run bar** above a **grid** of the sampled rows. The grid SHALL follow the
console's grid conventions, one column per entry the service returns in its column list, in the order given.

Each column header SHALL state the column's name, its role, and its type. The role SHALL be presented in words:
`Key` and `Measure` for an aggregate; `Grain key` and `Output` for an SQL enrichment; `Grain key` and `Input`
for a row-by-row LLM enrichment; and `Input` alone for a group-trigger LLM enrichment. Where the service names
a target type, the header SHALL state it after the sampled type, as `string → string`. Where the service
reports the largest size of a column's values, the header SHALL state it in bytes, as `max 18 B`. A column the
service reports no role for SHALL still be presented, without a role mark.

The run bar SHALL carry count chips, followed by a caption that states how the sample was taken. An aggregate
SHALL present its group count: `N groups` when the sample holds every group, and `N of M groups` when the
service reports a larger total. Every other kind SHALL present `N sample rows`. The notes count SHALL be
presented for every kind, as `N notes`, and counts the notes drawn as banners — not the two codes the empty
state presents instead — so that it is the number of banners the reader can find. A chip that counts exactly one
SHALL read in the singular. An SQL enrichment SHALL also present its output count.

The caption SHALL say that rows are the newest matching ones, up to the sample size, and that values are
capped at 2 KB. A value the service has cut SHALL end in the ellipsis it carries and SHALL NOT be
re-expanded. An empty cell for a value the service returned as null SHALL be presented as `NULL`, not blank.

A sample of up to the service's row limit SHALL be presented whole, with no paging control.

#### Scenario: An aggregate states its total

- **GIVEN** an aggregate preview of 5 rows with a total of 1,284
- **WHEN** the result is presented
- **THEN** the run bar shows `5 of 1,284 groups`
- **AND** the key columns are marked `Key` and the others `Measure`

#### Scenario: A sample that holds every group states no total

- **GIVEN** an aggregate preview of 3 rows with a total of 3
- **WHEN** the result is presented
- **THEN** the run bar shows `3 groups`

#### Scenario: An enrichment states its sample size

- **GIVEN** an SQL enrichment preview of 5 rows
- **WHEN** the result is presented
- **THEN** the run bar shows `5 sample rows` and the number of outputs
- **AND** the grain key is marked `Grain key` and the derived columns `Output`

#### Scenario: A header states the target type and the size

- **GIVEN** a column sampled as `string` that is written to a `string` column, with a largest value of 18 bytes
- **WHEN** the result is presented
- **THEN** its header shows the name, `Output`, `string → string` and `max 18 B`

#### Scenario: A group pipeline's columns are all inputs

- **GIVEN** a preview of a group-trigger LLM enrichment
- **WHEN** the result is presented
- **THEN** every column is marked `Input` and none is marked `Grain key`

#### Scenario: A null value is presented as NULL

- **GIVEN** a row whose value for a column is null
- **WHEN** the result is presented
- **THEN** the cell shows `NULL`

### Requirement: Notes from the service are presented by severity and code

The service's notes SHALL be presented between the run bar and the grid, one block per note, ordered with
warnings before informational notes and otherwise in the order received. A warning SHALL be presented as a
warning banner and an informational note as a neutral one. A note that names a column, output or enrichment
SHALL present that name as a subject mark beside its title. The console SHALL pick a note's title by its code
and SHALL present the note's own message as its body; a code the console does not know SHALL be presented
with a generic title and the message, and SHALL NOT be dropped.

The codes the console knows, and what each means to the reader, SHALL be:

- `target_type_narrowing` and `value_out_of_target_range` — a value would be coerced or would wrap when
  written; warnings.
- `held_by_enrichment` and `enrichment_behind` — an enrichment the pipeline reads has not caught up, so an
  enabled run would write less than the sample shows; the first a warning, the second informational. The
  rows are late, not absent.
- `group_cut_by_fetch_limit` — the group was cut by the service's fetch limit, so its member count is a lower
  bound; a warning.
- `output_without_description` and `unconstrained_response` — an LLM output carries no description, or the
  response schema constrains nothing; the first informational, the second a warning.
- `values_truncated` — at least one value was capped at 2 KB for the preview only, and the runner writes the
  full value; informational.
- `no_matching_rows` and `no_group_found` — the sample is empty, as "An empty sample states its cause" states.

When the service returns no notes, the tab SHALL present a success line in place of them. For a disabled
pipeline the line SHALL read `Validation passed. Ready to enable.`. For an enabled aggregate it SHALL read
`Validation passed.`. For an enabled enrichment it SHALL read `No issues found.`, because an enabled enrichment
is held to lighter checks than arming applies and the line claims no more than was checked. The success line
SHALL NOT be presented while any note is, and SHALL NOT be presented beside a result that is not current — one
held under a failure, beside an unsaved edit, or older than the declaration — because a line that says the declaration is
valid cannot sit under the failure that says it is not.

#### Scenario: A narrowing warning names the output

- **GIVEN** a preview whose notes include `target_type_narrowing` for the output `cost_tier`
- **WHEN** the result is presented
- **THEN** a warning banner is presented with `cost_tier` as its subject and the service's message as its body

#### Scenario: Warnings are presented before informational notes

- **GIVEN** a preview whose notes are `values_truncated` followed by `target_type_narrowing`
- **WHEN** the result is presented
- **THEN** the `target_type_narrowing` warning is presented above the `values_truncated` note

#### Scenario: A held pipeline still shows its rows

- **GIVEN** a preview whose notes include `held_by_enrichment` naming an enrichment, and whose rows are not empty
- **WHEN** the result is presented
- **THEN** the warning names the enrichment
- **AND** the grid is presented beneath it with its rows

#### Scenario: An unknown code is not dropped

- **GIVEN** a preview whose notes include a code the console does not know
- **WHEN** the result is presented
- **THEN** the note is presented with a generic title and the service's message

#### Scenario: The success line for a disabled pipeline

- **GIVEN** a disabled pipeline whose preview returns no notes
- **WHEN** the result is presented
- **THEN** the line `Validation passed. Ready to enable.` is presented

#### Scenario: The success line for an enabled aggregate

- **GIVEN** an enabled aggregate whose preview returns no notes
- **WHEN** the result is presented
- **THEN** the line `Validation passed.` is presented

#### Scenario: The success line for an enabled enrichment claims less

- **GIVEN** an enabled enrichment whose preview returns no notes
- **WHEN** the result is presented
- **THEN** the line `No issues found.` is presented

#### Scenario: No success line beside a result that is not current

- **GIVEN** a Preview tab holding a result whose last run was refused
- **WHEN** the failure is presented above the held result
- **THEN** no success line is presented

#### Scenario: No success line beside a note

- **GIVEN** a preview that returns one informational note
- **WHEN** the result is presented
- **THEN** the note is presented and no success line is

### Requirement: An empty sample states its cause

A preview that returns no rows SHALL present the column headers it was given and, in place of the rows, an
empty state that names the cause and offers the action that addresses it. The cause SHALL come from the
service's note, never from guessing.

For `no_matching_rows` the console SHALL tell an input that holds no rows from an input the filter excludes
by whether the saved declaration carries a filter. With no filter the title SHALL read `No data yet` and the
body SHALL say the input holds no rows yet; with a filter the title SHALL read `No matching rows` and the body
SHALL state the filter expression. The second SHALL offer `Open Properties`. For an aggregate the body SHALL
add that the pipeline produces no group.

For `no_group_found` on a group-trigger pipeline the title SHALL read `No group found` and the body SHALL say
no input row matching the filter carries a non-empty group key, naming the grouping column; it SHALL offer
`Open Properties`.

When every matching row is held back by an enrichment, the empty state SHALL name the enrichment, state that
the sample leaves out rows it has not reached, and offer to open that enrichment.

#### Scenario: An input with no rows

- **GIVEN** an aggregate with no filter whose preview returns no rows and `no_matching_rows`
- **WHEN** the result is presented
- **THEN** the empty state reads `No data yet` and names the input table
- **AND** the column headers are presented above it

#### Scenario: A filter that excludes everything

- **GIVEN** a pipeline with a filter whose preview returns no rows and `no_matching_rows`
- **WHEN** the result is presented
- **THEN** the empty state reads `No matching rows` and states the filter expression
- **AND** `Open Properties` is offered

#### Scenario: A group pipeline with no group

- **GIVEN** a group-trigger pipeline whose preview returns `no_group_found`
- **WHEN** the result is presented
- **THEN** the empty state reads `No group found` and names the grouping column
- **AND** `Open Properties` is offered

#### Scenario: Every row is held by an enrichment

- **GIVEN** an LLM enrichment whose preview returns no rows and `held_by_enrichment` naming an enrichment
- **WHEN** the result is presented
- **THEN** the empty state names that enrichment and offers to open it

### Requirement: The Preview tab shows the statement or the outputs

For an aggregate and for an SQL enrichment the tab SHALL present a collapsible **Statement** section beneath
the grid, expanded when first shown, carrying the statement the service returned. The statement SHALL be shown formatted for reading and SHALL be copied verbatim by a `Copy SQL`
control, so that a statement run by hand reads the same rows. The section SHALL be drawn as the collapsible
sections of the Properties tab are.

For an LLM enrichment the service returns no statement. In its place the tab SHALL present an **Outputs**
section, built from the saved declaration, that lists each output with its target column and flags every
output that carries no description. The section SHALL NOT claim anything about what a model would return: the
model is not called and no prompt is rendered.

#### Scenario: The statement is copied verbatim

- **GIVEN** a Preview tab for an aggregate holding a result with a statement
- **WHEN** the user activates `Copy SQL`
- **THEN** the statement exactly as the service returned it is copied
- **AND** the copy is announced

#### Scenario: The statement is formatted for reading

- **GIVEN** a returned statement on a single line
- **WHEN** the Statement section is expanded
- **THEN** it is presented broken across lines

#### Scenario: An LLM enrichment has outputs instead of a statement

- **GIVEN** a Preview tab for an LLM enrichment holding a result
- **WHEN** the result is presented
- **THEN** no Statement section is presented
- **AND** an Outputs section lists the declared outputs
- **AND** an output without a description is flagged

### Requirement: A group pipeline's preview names the group it sampled

For a group-trigger pipeline the run bar SHALL carry a read-only **group chip** with the key the service
returned. The service chooses the group with the newest matching row on every run, so new data can move a
rerun to another group; when the key differs from the previous run's, the chip SHALL also state the previous
key, so that the switch does not pass unnoticed. The console SHALL offer no control that chooses or enters a
group key.

The sample SHALL be presented as the group's members in the order the service returned them, which is the
order the model would receive them, and the run bar SHALL state `N members shown` rather than a row count.

#### Scenario: The chip names the sampled group

- **GIVEN** a group-trigger pipeline whose preview returns the group key `A`
- **WHEN** the result is presented
- **THEN** the group chip reads `A`
- **AND** no control for choosing a group is presented

#### Scenario: A rerun that moves to another group says so

- **GIVEN** a Preview tab holding a result for group `A`
- **WHEN** a rerun returns group `B`
- **THEN** the chip reads `B` and states that it was `A`

#### Scenario: A rerun on the same group states no previous key

- **GIVEN** a Preview tab holding a result for group `A`
- **WHEN** a rerun returns group `A`
- **THEN** the chip reads `A` and states no previous key

### Requirement: A failed preview states its cause and the fix within reach

Each failure the preview endpoint documents SHALL be presented in the tab with its own state. The service's
message SHALL be shown as the service sent it, in a monospace block; the console SHALL NOT rewrite it.

- A **validation failure** — the declaration would not arm — SHALL read `Fix the declaration before previewing`,
  carry the message, and offer `Open Properties`. The service reports one problem at a time, so the state
  SHALL say that the next one, if any, appears after the fix. Where the message names a part of the
  declaration the console can open — the request template of an LLM enrichment, for instance — the state SHALL
  offer to open that part in place of `Open Properties`.
- A **budget refusal** SHALL read `The preview read exceeded its budget`, carry the message, and offer the
  actions that reach the fix: `Open group keys` for an aggregate, `Open inputs` for a row-by-row LLM
  enrichment, `Open member selection` for a group-trigger one, and `Open Properties` for each. It SHALL state
  that running again gives the same result, and the console SHALL NOT retry on its own.
- **Any other failure** — an unknown pipeline, a conflict, an unrecognised code — SHALL read `Preview failed`,
  carry the message and the code, and keep `Run again`.
- **No access** — a column the caller may not read, a row-confined caller, or a missing grant — SHALL replace
  the tab's content with an explanation of why the pipeline cannot be previewed, naming the column where the
  service does, and SHALL offer no `Run` control, because nothing on the page can fix it. The tab SHALL stay
  in place rather than disappear.
- **Storage unavailable** SHALL read `ClickHouse is currently unavailable`, state that no data could be read,
  and offer `Try again`.

An action that opens a part of the declaration SHALL switch to `Properties` and bring that section into view
without discarding a pending edit.

#### Scenario: A validation failure points at the declaration

- **GIVEN** a preview refused with `pipeline_validation_failed`
- **WHEN** the failure is presented
- **THEN** it reads `Fix the declaration before previewing` and shows the service's message
- **AND** `Open Properties` is offered

#### Scenario: A budget refusal offers the remedy for its kind

- **GIVEN** an aggregate preview refused with `pipeline_preview_budget_exceeded`
- **WHEN** the failure is presented
- **THEN** it reads `The preview read exceeded its budget` and shows the service's message
- **AND** `Open group keys` and `Open Properties` are offered
- **AND** no automatic retry is made

#### Scenario: A budget refusal on a group pipeline offers member selection

- **GIVEN** a group-trigger LLM preview refused with `pipeline_preview_budget_exceeded`
- **WHEN** the failure is presented
- **THEN** `Open member selection` is offered

#### Scenario: An unrecognised failure shows its code

- **GIVEN** a preview refused with a code the console has no state for
- **WHEN** the failure is presented
- **THEN** it reads `Preview failed` and shows the message and the code
- **AND** `Run again` is offered

#### Scenario: No access offers no run control

- **GIVEN** a preview refused with `sensitive_column_not_entitled`
- **WHEN** the failure is presented
- **THEN** the tab explains that the pipeline reads a column the caller may not see, and names it
- **AND** no `Run` control is offered

#### Scenario: Storage down offers a retry

- **GIVEN** a preview refused with `clickhouse_unavailable`
- **WHEN** the failure is presented
- **THEN** it reads `ClickHouse is currently unavailable` and offers `Try again`

#### Scenario: Opening the declaration keeps a pending edit

- **GIVEN** a pending field edit and a budget refusal on the Preview tab
- **WHEN** the user activates `Open group keys`
- **THEN** `Properties` is selected and the group-keys section is brought into view
- **AND** the edited value is still presented

### Requirement: The preview states what it ran on

The preview runs the **saved** declaration. While the detail view holds an unsaved edit, the Preview tab SHALL
present a banner saying that the preview uses the saved version and that the edit is not included; the run control
SHALL be labelled `Run on saved version`, and a held result SHALL stay presented, dimmed, until a run returns. The
tab SHALL offer no control that saves or discards the edit: that belongs to the page's own `Save` and `Discard`,
which stay offered above the tab strip whichever tab is selected, and the tab SHALL NOT save anything itself.

The console SHALL record the pipeline's generation when a run is issued. When the pipeline's generation later
differs — it was saved after the run — the held result SHALL be presented dimmed under a banner that states
which generation the sample reflects and which the pipeline is at, with `Run again`.

#### Scenario: An unsaved edit is called out

- **GIVEN** a pending field edit
- **WHEN** the user opens the Preview tab
- **THEN** a banner states that the preview uses the saved version and that the edit is not included
- **AND** the run control reads `Run on saved version`

#### Scenario: The tab offers no way to save or discard

- **GIVEN** a pending field edit
- **WHEN** the user opens the Preview tab
- **THEN** the banner carries no `Save` or `Discard` control
- **AND** the page's own `Save` and `Discard` are still offered above the tab strip

#### Scenario: A result older than the declaration says so

- **GIVEN** a Preview tab holding a result sampled at generation 6
- **WHEN** the pipeline is saved and is now at generation 7
- **THEN** the result is presented dimmed under a banner naming generations 6 and 7
- **AND** `Run again` is offered in the banner

### Requirement: The Preview tab is accessible without sight of its colour

The Preview tab SHALL state every state it signals in text and through the matching ARIA attribute as well as
by colour. A banner for a failure SHALL be an alert and one for a note or an unsaved edit SHALL be a status.
The count chips SHALL be readable as text. A dimmed result SHALL be removed from the tab order and from the
reading order, so that its stale cells are not read as current. The completion of a run, with its outcome, SHALL be
announced through a live region separate from the run control's own label.

#### Scenario: A failure is announced

- **GIVEN** a run that fails
- **WHEN** the failure is presented
- **THEN** it is exposed as an alert

#### Scenario: A finished run is announced

- **GIVEN** a run in flight
- **WHEN** it returns with a result
- **THEN** a live region announces that the preview finished and states the row count
- **AND** the run control's own label is unchanged by the announcement
