## ADDED Requirements

### Requirement: A pipeline's backfill is reached from a header button on every tab

The pipeline detail page SHALL offer a **Backfill** button in its header row, beside the controls that delete
and disable the pipeline, on every tab. It SHALL open the backfill drawer and SHALL NOT start anything
itself. It SHALL be withheld in full from a caller who is not a full admin and when no runner host is
configured, as every other runtime affordance is.

#### Scenario: A full admin sees the button on any tab

- **GIVEN** a full admin on any tab of a pipeline the runner is configured for
- **THEN** the header offers Backfill

#### Scenario: A caller who is not a full admin sees nothing

- **GIVEN** a caller who is not a full admin
- **THEN** the header offers no Backfill control and no backfill banner is shown

#### Scenario: No runner is configured

- **GIVEN** no runner host is configured
- **THEN** the header offers no Backfill control

### Requirement: A running or paused backfill is stated above the tab strip

While a backfill of the pipeline is running or paused, a banner SHALL render beside the pipeline's pause
banner, above the tab strip, stating the run's state and offering a control that opens the backfill drawer.
For a paused run the banner SHALL state the reason the run reports.

The banner SHALL NOT be shown for a run paused because its pipeline is paused, whether by an operator or by
the circuit breaker: the pipeline's own banner already states that pause. In every other state of the run the
banner SHALL be shown.

The banner SHALL be read from the runner's list of runs narrowed to the pipeline, so it is present after a
reload. It SHALL NOT be shown for a run that is done or cancelled.

#### Scenario: A running run

- **GIVEN** a running backfill of the pipeline
- **THEN** the banner states that it is running and opens the drawer

#### Scenario: A run paused for its own reason

- **GIVEN** a backfill paused because the pipeline's spend budget is used up
- **THEN** the banner states that it is paused and gives that reason

#### Scenario: A run paused with its pipeline

- **GIVEN** a backfill paused because its pipeline is paused by an operator or by the breaker
- **THEN** no backfill banner is shown and the pipeline's pause banner is

#### Scenario: A finished run

- **GIVEN** the latest backfill is done or cancelled
- **THEN** no backfill banner is shown

### Requirement: The pipeline backfill drawer is three blocks: the run, the start form and the latest runs

The drawer SHALL be divided into up to three labelled blocks, each on a background a step lighter than the
drawer panel's own rather than behind a border.

The **start form** block SHALL come first, and SHALL be present only when the pipeline has no run that is running
or paused. A paused run is ended by cancelling it, so cancelling is the way to a new start. The **run** block SHALL
follow it and present one run: the run the reader has chosen from the list, or else the run that is running or
paused, or else the most recent run. The **latest runs** block SHALL come last and list the pipeline's ten most recent runs, newest first, each by status,
window and rows done; choosing one SHALL present it in the run block. It is absent when the pipeline has no run,
and so is the run block. The list has no total and no further page: when the service returns as many runs as were
asked for, the block SHALL say that only the latest are shown and SHALL NOT claim the list is the pipeline's whole
history.

The run's facts SHALL come in one fixed order, the same on the ingest drawer and named alike: the id (copyable), the
window as dates, how the run went in one row — rows done and dead letters, the dead letters coloured as a failure
when above zero — then start and finish when finished. A run started without a window — by a caller other than the console — SHALL
read "Everything". It SHALL NOT state a percentage or a total, because the runner reports none. The window SHALL
be kept on one line. While the run's last batch has failed and no page has committed since, the run SHALL state
the classified error and when it occurred and that the run is retrying. A paused run SHALL state its reason and
the instant it paused. The run SHALL state the number of its dead letters, read from the dead-letter listing
narrowed to the run when the run is presented.

#### Scenario: A running run hides the form

- **GIVEN** a running backfill
- **THEN** the run block presents it and there is no start form block

#### Scenario: A paused run hides the form

- **GIVEN** a paused backfill
- **THEN** the run block presents it, there is no start form block, and the run offers Cancel

#### Scenario: The latest run when none is active

- **GIVEN** no running or paused run and one done run
- **THEN** the start form block comes first and the run block presenting the done run follows it

#### Scenario: The blocks come in a fixed order

- **GIVEN** a finished run
- **THEN** the blocks are, from the top, the start form, the run, the latest runs

#### Scenario: No runs

- **GIVEN** the pipeline has no run
- **THEN** the drawer holds only the start form block, with no run block and no latest runs block

#### Scenario: The three blocks are told apart without borders

- **GIVEN** a finished run
- **THEN** the run, the start form and the latest runs are three separate labelled blocks, each on a lighter background than the drawer's

#### Scenario: Choosing a run from the list

- **GIVEN** several runs of the pipeline
- **WHEN** the reader chooses an earlier one
- **THEN** the run block presents that run

#### Scenario: The list is the latest, not the whole history

- **GIVEN** the service returns as many runs as the drawer asked for
- **THEN** the latest runs block states that only the latest runs are shown

#### Scenario: A window set outside the console, with no bounds

- **GIVEN** a run the runner reports without a window
- **THEN** its window reads Everything

#### Scenario: A run that is retrying

- **GIVEN** a running run whose last batch failed
- **THEN** the run block states the classified error, its time, and that the run is retrying

#### Scenario: No percentage

- **GIVEN** a running run
- **THEN** the run block states rows done and no percentage or total

### Requirement: A pipeline backfill window is whole UTC days, sent as moments

The start form SHALL take a first and a last date, both inclusive and both UTC. The service's window excludes its
lower bound and includes its upper, so the console SHALL send the first day's start less one millisecond as the
lower bound and the last day's final millisecond as the upper bound. It SHALL disable the start control for a
missing date or a first date after the last, and SHALL NOT allow a last date after today in UTC.

The form SHALL offer no way to start a replay of the pipeline's whole history. Such a run costs a model call for
every row the pipeline has ever read, and cannot be repeated or abandoned cheaply; the console starts bounded
runs only.

When the last date is today in UTC the run's window caption SHALL read "up to now" rather than the end of the
day: the service stops short of the most recent data until it has settled, and a later run covers the rest.
The console SHALL present the window the run reports and SHALL NOT claim the run covered the whole of the last
day. A run whose window does not fall on whole days SHALL be shown as the exact moments.

#### Scenario: Whole days become moments

- **WHEN** a range from the fourteenth to the twenty-first is started
- **THEN** the lower bound is one millisecond before the fourteenth begins and the upper bound is the last millisecond of the twenty-first, both in UTC

#### Scenario: No way to replay everything

- **GIVEN** the start form
- **THEN** it offers only the two dates, and no control that starts a run without a window

#### Scenario: Today as the last day

- **GIVEN** a last date equal to today in UTC
- **THEN** the window's caption reads up to now

#### Scenario: A window set outside the console

- **GIVEN** a run whose window is not whole days
- **THEN** the run block shows its exact moments

### Requirement: A run's controls follow its state

The controls SHALL be the first thing in the run block, drawn large, above the run's figures. A running run SHALL
offer Pause and Cancel. A paused run SHALL offer Resume and Cancel, except that **Resume SHALL be withheld while
the pipeline is paused**: the runner repeats the start checks on a resume and refuses one while its pipeline is
paused, so the control could only fail. In its place the block SHALL say that the pipeline is paused and must be
resumed first, and Cancel SHALL remain, because the runner cancels a paused run whatever state its pipeline is in.
The pipeline's pause SHALL be read as it stands while the drawer is open, so resuming the pipeline offers Resume
without closing and reopening the drawer. A done or cancelled run SHALL offer no control.

Cancelling SHALL be confirmed, because it cannot be undone and abandons the run's cursor. Pausing and resuming
SHALL NOT be confirmed. The console SHALL NOT warn before resuming a run on account of its pause reason. When the
service refuses a verb the console SHALL show the service's own message and read the run again — including a
resume the console had no way to foresee being refused, such as one over a spent daily budget.

#### Scenario: Controls by state

- **GIVEN** a running run
- **THEN** it offers Pause and Cancel
- **AND GIVEN** a paused run on a pipeline that is not paused
- **THEN** it offers Resume and Cancel

#### Scenario: The controls come first

- **GIVEN** a running run
- **THEN** Pause and Cancel are the first controls in the run block

#### Scenario: A finished run has no controls

- **GIVEN** a done or cancelled run
- **THEN** it offers no control

#### Scenario: Resume is withheld while the pipeline is paused

- **GIVEN** a paused run and a paused pipeline, whatever the run's pause reason
- **THEN** the block offers no Resume, says the pipeline is paused and must be resumed first, and still offers Cancel

#### Scenario: Resume returns when the pipeline is resumed

- **GIVEN** the drawer open on a paused run while its pipeline is paused
- **WHEN** the pipeline is resumed
- **THEN** the run offers Resume without the drawer being reopened

#### Scenario: Cancel is confirmed

- **WHEN** the reader chooses Cancel
- **THEN** the console asks for confirmation before it cancels

#### Scenario: A refused resume the console could not foresee

- **GIVEN** a paused run on a pipeline that is not paused, whose resume the service refuses with a conflict
- **THEN** the console shows the service's message

#### Scenario: A run that has changed state

- **GIVEN** a run that finished while the drawer was open
- **WHEN** the reader pauses it and the service refuses
- **THEN** the console shows the service's message and reads the run again

### Requirement: A refused start reports the service's message

When the runner refuses to start a backfill the console SHALL show the runner's own message and leave the
form as it was. This covers a pipeline the runner does not hold, a pipeline that is paused or over its daily
spend budget, a run already running, an invalid window, and a runner whose pipeline list has not loaded yet.
The console SHALL NOT present a start on a paused pipeline as accepted.

#### Scenario: A paused pipeline

- **GIVEN** the runner refuses a start because the pipeline is paused
- **THEN** the console shows its message

#### Scenario: A pipeline the runner does not hold

- **GIVEN** the runner answers that the pipeline is not found or not enabled
- **THEN** the console shows its message

### Requirement: A group pipeline's finished run reads Queued

For a pipeline whose trigger is a group, a finished backfill SHALL be presented as **Queued** where it would be
presented as Done: its completion means the window has been marked, and the evaluation of the marked groups
follows on the pipeline's own schedule and gates. The drawer SHALL carry a one-line explanation. The kind of
pipeline SHALL be taken from its declaration, not from the run. For every other pipeline a finished run
reads Done.

#### Scenario: A group pipeline

- **GIVEN** a finished backfill of a pipeline with a group trigger
- **THEN** its status reads Queued with the explanation

#### Scenario: Any other pipeline

- **GIVEN** a finished backfill of a pipeline that is not group-triggered
- **THEN** its status reads Done

### Requirement: A backfill's failures can be requeued by run

A run that has dead letters SHALL offer **Requeue failed rows** with their count, which re-runs only that
run's dead letters through the existing requeue by run, and reports how many the service re-ran. The console
SHALL NOT offer to start a new run over the same window as a way to repeat a run, because a run does not skip
what an earlier one processed and repeating one repeats the whole window at full cost.

The drawer SHALL NOT link to the failed rows tab. The run's id SHALL be copyable so the reader can filter the
failed rows by it there.

#### Scenario: A run with failures

- **GIVEN** a run with dead letters
- **THEN** the drawer offers Requeue failed rows with their count

#### Scenario: The count the service re-ran

- **WHEN** the reader requeues and the service re-ran fewer rows than counted
- **THEN** the console reports the number the service re-ran

#### Scenario: A run with no failures

- **GIVEN** a run with no dead letters
- **THEN** the drawer offers no requeue

### Requirement: The pipeline backfill drawer closes when the reader moves away from it

The drawer SHALL be a modal panel at the right edge of the page, 600px wide. It SHALL close through its close control,
on Escape, and when the scrim around the panel is pressed; a press on something outside the panel that was opened
from inside it — a calendar's popup, the cancel confirmation — SHALL NOT close it, and neither SHALL a press that began
inside and ended on the scrim. While it is closed it SHALL not be mounted, so each opening reads the runner afresh.
The pipeline's pause SHALL be read live by its content, so a pause or a resume of the pipeline while the drawer is
open changes what its run offers without reopening it.

#### Scenario: A press on the scrim closes it

- **GIVEN** the drawer open
- **WHEN** the reader presses the page around the panel
- **THEN** the drawer closes

#### Scenario: The close control closes it

- **GIVEN** the drawer open
- **WHEN** the reader presses its close control
- **THEN** the drawer closes

#### Scenario: The cancel confirmation is not a click away

- **GIVEN** the drawer open and the cancel confirmation showing
- **WHEN** the reader presses a control in the confirmation
- **THEN** the drawer stays open unless the run was cancelled
