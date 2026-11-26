## ADDED Requirements

### Requirement: The Preview tab of an LLM enrichment offers a run with the model

Beside `Run preview`, the Preview tab of an `enrich` pipeline whose transform is `llm` SHALL offer a second run
control, `Run with model`, for either preset, `chat_completion` or `dial_app_route`, and for an enabled pipeline
as well as a disabled one. A model run is served by the enrichment runner's dry run
(`POST /v1/pipelines/{name}/try`). It evaluates the sampled row, or the sampled group, through the model the way
the enabled pipeline would, and writes nothing. Unlike `Run preview`, it calls the model, and the calls are billed
to the pipeline.

The control SHALL follow the tab's own wording. It SHALL read `Run with model` until a model run has returned,
`Run again with model` once one has, and `Run saved version with model` while the detail view holds an unsaved
edit. While a model run is in flight it SHALL read `Running with model…` and SHALL be disabled.

The control SHALL NOT be rendered, and no request SHALL be issued for it:
- for an aggregate pipeline;
- for an SQL enrichment;
- for a caller who is not a full admin;
- while `featureFlags.analyticsEnabled` is false;
- in an installation that has no runner host configured.

The console SHALL NOT probe the runner to decide whether to render the control.

Like `Run preview`, a model run SHALL send no body, so the runner evaluates the newest sampled row of a row-grain
pipeline, or the newest group of a group-trigger one. The console SHALL offer no control for the number of rows,
the window or the group key.

#### Scenario: An LLM enrichment offers both run controls

- **GIVEN** a full admin on the Preview tab of a disabled `llm` enrichment, a runner host configured
- **WHEN** the tab is presented
- **THEN** `Run preview` and `Run with model` are both offered
- **AND** no request is issued to the runner's dry run

#### Scenario: An aggregate offers no model run

- **GIVEN** a full admin on the Preview tab of an aggregate pipeline
- **WHEN** the tab is presented
- **THEN** `Run preview` is offered and `Run with model` is not rendered

#### Scenario: An SQL enrichment offers no model run

- **GIVEN** a full admin on the Preview tab of an `enrich` pipeline whose transform is `sql`
- **WHEN** the tab is presented
- **THEN** `Run with model` is not rendered

#### Scenario: No runner host, no model run

- **GIVEN** an installation without a runner host
- **WHEN** a full admin opens the Preview tab of an `llm` enrichment
- **THEN** `Run with model` is not rendered and no request is issued for it

#### Scenario: A model run sends no body

- **GIVEN** a confirmed model run
- **WHEN** it is issued
- **THEN** one request is sent to the runner's dry run for the pipeline, with no body

### Requirement: A model run is confirmed before it is sent

Activating `Run with model`, in any of its labels, SHALL open a confirmation dialog before any request is issued.
The dialog SHALL:
- say that the newest row (for a group-trigger pipeline, the newest group) goes to the model exactly as the enabled
  pipeline would send it;
- say that nothing is written;
- say that the calls are billed to the pipeline's daily budget like its regular runs.

The dialog SHALL state as facts:
- the deployment, or for an application route the application and its route, from the saved declaration;
- the number of model calls the run may make. For `chat_completion` that is up to two: the request, and one
  corrective request when the reply does not fit the response schema. For `dial_app_route` it is exactly one.

The dialog SHALL offer `Cancel`, which closes it and issues nothing, and `Run with model`, which closes it and
issues the run. It SHALL be a modal dialog named by its title. It SHALL return focus to the control that opened
it when it closes.

#### Scenario: Confirming issues the run

- **GIVEN** the Preview tab of a `chat_completion` enrichment whose deployment is `D`
- **WHEN** the user activates `Run with model`
- **THEN** a dialog names `D`, states up to two model calls and the daily budget
- **AND** no request has been issued
- **WHEN** the user confirms
- **THEN** the model run is issued

#### Scenario: Cancelling issues nothing

- **GIVEN** the confirmation dialog is open
- **WHEN** the user activates `Cancel`
- **THEN** the dialog closes, focus returns to `Run with model`, and no request is issued

#### Scenario: An application route makes one call

- **GIVEN** a `dial_app_route` enrichment
- **WHEN** the confirmation dialog opens
- **THEN** it names the application and the route and states one model call

### Requirement: A model run in flight says what it waits on

While a model run is in flight, `Run preview` and the model-run control SHALL both be disabled. The tab SHALL
present a progress banner that:
- names the deployment (or application) being waited on, and whether it is the newest row or the newest group;
- says that leaving the tab does not cancel the call, which is still made and billed.

A held preview or model-run result SHALL stay presented, dimmed and removed from the tab order and the reading
order, until the run returns. With nothing held, the tab SHALL present the reading state that `Run preview`
presents.

A model run the user leaves SHALL NOT be cancelled by the console. Its answer SHALL NOT be presented after the
detail view has closed.

#### Scenario: The in-flight state names the model

- **GIVEN** a Preview tab holding a preview result
- **WHEN** a model run is confirmed for a pipeline whose deployment is `D`
- **THEN** both run controls are disabled
- **AND** a banner says the console is waiting for `D` to answer the newest row, and that leaving does not cancel it
- **AND** the held result stays presented, dimmed and inert

### Requirement: A model run's sample is presented with the evaluated row marked

The dry run answers with the preview it read and one evaluation per evaluated row, or one for the group. The
preview SHALL replace the held preview result and SHALL be presented by the Preview tab's existing presentation:
run bar chips, notes, grid, empty state and group chip, as for a preview run. For a row-grain pipeline the grid
SHALL be extended as follows:

- A leading `Model` column states each row's outcome in words. The row the evaluation names by its grain key
  reads `OK` or `Failed · <stage>`. Every other row reads `Preview only`.
- One column per key of the evaluation's mapped values, headed by that target column's name and marked
  `From model`. Only the evaluated row carries values in these columns. The other rows present a dash.
- The evaluated row's grain key is a control that expands the Model result panel, and it exposes the expanded
  state.

The run bar SHALL add a chip `1 row tried with model`, or `Group tried with model` for a group-trigger pipeline,
after the preview's own chips. The caption SHALL add that a model run sends only the newest row to the model, so
the other rows show the preview alone.

A successful model run SHALL be announced through the tab's live region with its outcome.

#### Scenario: The evaluated row is marked and the others are preview only

- **GIVEN** a row-grain pipeline whose model run returns five preview rows and one `ok` evaluation for the first
  row's grain key, mapping `title` and `sentiment`
- **WHEN** the result is presented
- **THEN** the first row's `Model` cell reads `OK` and its `title` and `sentiment` cells carry the mapped values
- **AND** the other four rows read `Preview only` with a dash in `title` and `sentiment`
- **AND** the run bar shows `5 sample rows` and `1 row tried with model`

#### Scenario: A failed evaluation names its stage in the grid

- **GIVEN** a model run whose evaluation failed at `validate`
- **WHEN** the result is presented
- **THEN** the evaluated row's `Model` cell reads `Failed · validate`

#### Scenario: A finished model run is announced

- **GIVEN** a model run in flight
- **WHEN** it returns with an `ok` evaluation
- **THEN** a live region announces that the model run finished and its outcome
- **AND** the run control's own label is unchanged by the announcement

### Requirement: The Model result panel states the evaluation

Beneath the grid, a held model-run result SHALL present a **Model result** panel for the evaluation. It is
expanded when first shown and is named by the evaluated grain key, or the group key.

**Outcome line.** Above the grid, in place of the success line of a preview, the tab SHALL state the outcome:
- `ok`: the reply validated and mapped to every output, and the pipeline would write these values once enabled,
  with nothing written now;
- `failed` at `validate`: the reply does not fit the response schema, with the number of attempts, and that the
  enabled pipeline would dead-letter this row;
- `failed` at `dial_call` with a DIAL status: DIAL refused the call, with that status and the service's message;
- any other failed stage: the stage and the service's message.

Every failed outcome SHALL be an alert.

**Stage track.** The panel SHALL present the stages in the order the runner runs them:
- row-grain: `input_map`, `dial_call`, `validate`, `output_map`;
- group: `group_map`, `dial_call`, `validate`, `output_map`.

An `ok` evaluation marks every stage passed. A `failed` evaluation marks the stages before the named stage as
passed, the named stage as failed, and the stages after it as not reached. Each stage's state SHALL be stated in
text, not by colour or symbol alone.

**Facts.**
- Attempts. For `chat_completion` with more than one attempt, the count of corrective retries is added.
- Usage, in the unit the runner reports: tokens or calls.
- Latency in milliseconds.
- The deployment, or application, from the saved declaration.

**Values the pipeline would write.** A table of target column and mapped value, presented when the evaluation
mapped any.

**Schema violations.** The violations of the last reply, presented when the runner reports any.

**Request sent and Reply received.** Two collapsible sections:
- Request sent: the rendered request of the first attempt. With a corrective retry, it states that the retry
  resent the request with a note about the errors, and that the note is not shown.
- Reply received: the raw reply of the last attempt, or DIAL's error body.

Each section SHALL be pretty-printed only when its text parses as JSON and otherwise shown verbatim. It SHALL
wrap rather than scroll sideways. It SHALL offer a `Copy` control that copies the text exactly as received and
announces the copy. When the runner reports a section as cut, its header SHALL carry a `Cut at 64 KB` mark and
state that the model received the whole request.

#### Scenario: An OK evaluation passes every stage

- **GIVEN** an `ok` evaluation with one attempt, 812 tokens and 1,830 ms
- **WHEN** the Model result panel is presented
- **THEN** every stage is stated as passed
- **AND** attempts `1`, usage `812 tokens` and latency `1,830 ms` are stated
- **AND** the values the pipeline would write are listed by target column

#### Scenario: A schema failure after a retry

- **GIVEN** a `chat_completion` evaluation failed at `validate` with two attempts and two schema violations
- **WHEN** the result is presented
- **THEN** an alert says the reply does not fit the response schema after the corrective retry
- **AND** `input_map` and `dial_call` are passed, `validate` failed and `output_map` not reached
- **AND** attempts read `2 (1 corrective retry)` and both violations are listed

#### Scenario: DIAL refuses the call

- **GIVEN** an evaluation failed at `dial_call` with DIAL status 404
- **WHEN** the result is presented
- **THEN** an alert says DIAL refused the call with HTTP 404 and shows the service's message
- **AND** `input_map` is passed, `dial_call` failed and the later stages not reached

#### Scenario: A cut request is marked

- **GIVEN** an evaluation whose request the runner reports as truncated
- **WHEN** Request sent is presented
- **THEN** its header carries `Cut at 64 KB` and states that the model received the whole request

#### Scenario: A reply that is not JSON is shown verbatim

- **GIVEN** an evaluation whose reply does not parse as JSON
- **WHEN** Reply received is presented
- **THEN** the text is shown exactly as received, wrapped

### Requirement: A group pipeline's model result states the members sent

For a group-trigger pipeline the grid SHALL present the preview's members without a `Model` column or model
columns, because the model receives the whole group as one request. The caption SHALL say so. The Model result
panel SHALL state that it is one evaluation for the whole group. It SHALL state the number of members sent and the
number the input token budget left out. When the runner reports the group as partial, the panel SHALL state that
the model got a partial group and that the enabled pipeline would send the same members. The members the preview
shows are ranked by the member selection and are not necessarily the ones sent, so the console SHALL NOT mark
any member as sent or left out.

#### Scenario: A partial group says so

- **GIVEN** a group model run whose evaluation reports 12 members sent and 3 left out, partial
- **WHEN** the result is presented
- **THEN** the panel states 12 members sent and 3 left out by the token budget
- **AND** it states that the model got a partial group and the enabled pipeline would send the same 12

### Requirement: A refused model run states its cause

A model run the runner refuses SHALL leave any held result in place, dimmed, under the refusal, as a refused
preview does. The runner's message SHALL be shown as sent, in a monospace block, where the state carries one. The
console SHALL NOT retry on its own. Each refusal SHALL be presented as follows:

- `409 dry_run_in_progress`: the pipeline is already being run with the model, possibly by another admin; only one
  runs at a time. Offers `Run again with model`. A warning.
- `429 spend_budget_exhausted`: today's spend budget for the pipeline is used up and the model was not called;
  model runs count toward the same budget. Carries the message and offers `Open Runtime`. A warning.
- `429 dial_rate_limited`: the running pipeline is using every call its rate limit allows; a model run never waits
  behind it. Offers `Run again with model`. A warning.
- `422 pipeline_not_runnable`: the pipeline cannot run as declared, arming would fail the same way, and no model
  was called. Carries the message and offers `Open Properties`.
- `503 adas_unavailable` and `503 adas_contract_mismatch`: the sample could not be read and no model was called.
  Offers `Run again with model`. The two codes SHALL read the same to the user.
- A refusal the registry raised while the sample was read, passed through with the registry's status and code
  (`pipeline_validation_failed`, `pipeline_preview_budget_exceeded`, `sensitive_column_not_entitled` and the
  other codes the preview documents): presented by the Preview tab's failure state for that code, as for a
  refused preview.
- `404 not_found` from the runner: the installation does not support model runs yet, and `Run preview` still
  works. The model-run control SHALL stay disabled for the rest of the detail view's life, and its description
  SHALL repeat the reason.
- Any other refusal: `Model run failed`, with the message and the code, keeping the control.

The console's text SHALL NOT name a backend service.

A failure inside the evaluation — including a rate limit reached after a paid call — is not a refusal. It arrives
as a `failed` evaluation and SHALL be presented by the Model result panel with the reply already paid for.

#### Scenario: A run already in flight elsewhere

- **GIVEN** a Preview tab holding a result
- **WHEN** a model run is refused with `409 dry_run_in_progress`
- **THEN** a warning says the pipeline is already being run with the model and offers `Run again with model`
- **AND** the held result stays presented, dimmed

#### Scenario: The daily budget is used up

- **WHEN** a model run is refused with `429 spend_budget_exhausted`
- **THEN** a warning says today's budget is used up and that the model was not called
- **AND** the service's message is shown and `Open Runtime` is offered

#### Scenario: A registry refusal reuses the preview's state

- **WHEN** a model run is refused with `pipeline_validation_failed` passed through from the registry
- **THEN** the tab presents `Fix the declaration before previewing` with the message and `Open Properties`

#### Scenario: An older runner disables the control

- **WHEN** a model run is refused with `404 not_found` by the runner
- **THEN** the tab states that model runs are not available on this installation yet and `Run preview` still works
- **AND** the model-run control stays disabled until the detail view is closed

#### Scenario: Both unavailability codes read the same

- **WHEN** a model run is refused with `503 adas_contract_mismatch`
- **THEN** the tab presents the same state as for `503 adas_unavailable`, offering `Run again with model`

### Requirement: A model run states what it ran on

Like a preview, a model run evaluates the **saved** declaration. The unsaved-edit banner SHALL say that both the
preview and the model use the saved version, and that the edit is not included. The console SHALL record the
pipeline's generation when a model run is issued. The panel SHALL state that the result was read through the saved
declaration at that generation. A later save SHALL dim the held model-run result under the stale banner the
preview uses, with `Run again with model`.

Whichever run returned last owns the tab: a preview run that returns after a model run SHALL replace the model-run
result, and the other way round. When a group-trigger rerun of either kind returns another group than the held
result, the group chip SHALL state the previous key.

#### Scenario: An unsaved edit relabels both controls

- **GIVEN** a pending field edit on an `llm` enrichment
- **WHEN** the user opens the Preview tab
- **THEN** the banner says the preview and the model use the saved version
- **AND** the controls read `Run on saved version` and `Run saved version with model`

#### Scenario: A preview run replaces a model-run result

- **GIVEN** a Preview tab holding a model-run result
- **WHEN** a preview run returns
- **THEN** the grid presents the preview without the `Model` and `From model` columns
- **AND** no Model result panel is presented

## MODIFIED Requirements

### Requirement: The Preview tab shows the statement or the outputs

For an aggregate and for an SQL enrichment the tab SHALL present a collapsible **Statement** section beneath
the grid, expanded when first shown, carrying the statement the service returned. The statement SHALL be shown formatted for reading and SHALL be copied verbatim by a `Copy SQL`
control, so that a statement run by hand reads the same rows. The section SHALL be drawn as the collapsible
sections of the Properties tab are.

For an LLM enrichment the service returns no statement. In its place, beside a preview result, the tab SHALL
present an **Outputs** section, built from the saved declaration, that lists each output with its target column
and flags every output that carries no description. The section SHALL NOT claim anything about what a model would
return: the model is not called and no prompt is rendered. Beside a model-run result the **Model result** panel
SHALL be presented in its place, because that run did call the model.

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

- **GIVEN** a Preview tab for an LLM enrichment holding a preview result
- **WHEN** the result is presented
- **THEN** no Statement section is presented
- **AND** an Outputs section lists the declared outputs
- **AND** an output without a description is flagged

#### Scenario: A model-run result shows the Model result panel instead of Outputs

- **GIVEN** a Preview tab for an LLM enrichment holding a model-run result
- **WHEN** the result is presented
- **THEN** the Model result panel is presented and the Outputs section is not
