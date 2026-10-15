## ADDED Requirements

### Requirement: Backfill data is offered to a full admin from the Tables toolbar

The Tables page SHALL offer a **Backfill data** button in its toolbar, beside the controls that create a
table, to a full admin. It SHALL be withheld from a caller who is not a full admin, and while a backfill run
is in progress. The button SHALL open the backfill drawer and SHALL NOT start anything itself.

#### Scenario: A full admin sees the button

- **GIVEN** a full admin on the Tables page and no backfill run in progress
- **THEN** the toolbar offers Backfill data

#### Scenario: A caller who is not a full admin sees no button

- **GIVEN** a caller who is not a full admin
- **THEN** the toolbar offers no Backfill data control and the page shows no backfill banner

#### Scenario: A run in progress replaces the button

- **GIVEN** a backfill run in progress
- **THEN** the toolbar offers no Backfill data button and the banner above the listing opens the drawer

### Requirement: A backfill run in progress is stated above the Tables listing

While a backfill run is in progress the Tables page SHALL show a banner above the listing stating that data
is being backfilled, how far it has got as "day N of M", and when it started, with a control that opens the
backfill drawer. The banner SHALL be read from the service's list of runs filtered to running, so it is
present after a reload without the run id being known. It SHALL NOT be shown for a run that has finished.

"Day N of M" SHALL count the days the run has finished, completed or failed, against the range's total; it
SHALL NOT be presented as a percentage.

The console SHALL read the run again on an interval while it is running and SHALL stop when the run reaches
a terminal state or the drawer and banner are no longer shown.

#### Scenario: The banner follows a running run

- **GIVEN** a run covering thirty days that has finished eleven
- **THEN** the banner states day 12 of 30 together with the start time

#### Scenario: A finished run shows no banner

- **GIVEN** the service reports no running run
- **THEN** the Tables listing shows no backfill banner

#### Scenario: A reload finds the run

- **GIVEN** a run started earlier by this or another session
- **WHEN** the Tables page loads
- **THEN** the banner is shown without the console having held the run id

#### Scenario: Polling stops at a terminal state

- **GIVEN** the drawer is open on a running run
- **WHEN** the service reports the run done or failed
- **THEN** the console stops reading it again

### Requirement: The backfill drawer is three blocks: the run, the start form and the retained runs

The backfill drawer SHALL be a modal panel at the right edge of the page, 600px wide, and SHALL be divided into
up to three labelled blocks, each on a background a step lighter than the drawer panel's own rather than behind a border.

The **start form** block SHALL come first, and SHALL be present only while no run is in progress: starting a run
is what a reader opens the drawer for, and it SHALL NOT sit under the figures of the last one. The **run** block
SHALL follow it and present one run: the run the reader has chosen from the list, or else the run in progress, or
else the most recent run. The **retained runs** block SHALL come last and list the runs the service retains, newest first, each by status, range
and the days it finished against the total; choosing one SHALL present it in the run block. The run block is
absent when the service retains no run, and so is the retained runs block — an empty list SHALL NOT be drawn as a
heading over a sentence.

The run's facts SHALL come in one fixed order, the same on the pipeline drawer and named alike: the id (copyable),
the window, then how the run went in rows of figures — days total, days completed, days failed; then rows inserted,
rows skipped, rows dropped — then what else it measured (the date being processed while it runs, files processed),
then start and finish together in one row of their own, finish only once finished. Days completed SHALL be coloured
as a success when above zero and days failed as a failure when above zero; a zero stays the text colour. The failed
days SHALL NOT be listed. What skipped and dropped rows mean SHALL be explained behind an info icon beside each of
those two labels, not in a paragraph. The window SHALL be kept on one line.

The drawer SHALL NOT describe the service's retention under the list.

#### Scenario: A run in progress is the one presented

- **GIVEN** a running run and earlier finished runs
- **WHEN** the drawer opens
- **THEN** the run block presents the running run, there is no start form block, and the list shows all retained runs

#### Scenario: The latest run is presented when none is running

- **GIVEN** no running run and one finished run
- **WHEN** the drawer opens
- **THEN** the start form block comes first and the run block presenting that run follows it

#### Scenario: The blocks come in a fixed order

- **GIVEN** a retained run and none in progress
- **THEN** the blocks are, from the top, the start form, the run, the retained runs

#### Scenario: Choosing a run from the list

- **GIVEN** several retained runs
- **WHEN** the reader chooses an earlier one
- **THEN** the run block presents that run

#### Scenario: No runs are retained

- **GIVEN** the service retains no run
- **THEN** the drawer holds only the start form block, with no run block and no retained runs block

#### Scenario: The three blocks are told apart without borders

- **GIVEN** a retained run and none in progress
- **THEN** the run, the start form and the retained runs are three separate labelled blocks, each on a lighter background than the drawer's

#### Scenario: Skipped and dropped rows are explained beside their labels

- **GIVEN** a presented run
- **THEN** the labels of rows skipped and rows dropped each carry an info icon with their explanation, and the run block has no paragraph about them

#### Scenario: The facts come in one order

- **GIVEN** a presented run
- **THEN** its facts are, in order, the id, the window, days total, days completed, days failed, rows inserted, rows skipped, rows dropped, files processed, start and finish

#### Scenario: Days are coloured by outcome

- **GIVEN** a run that completed 28 days and failed 2
- **THEN** days total, days completed and days failed share one row, days completed reads as a success and days failed as a failure

#### Scenario: Rows share a row too

- **GIVEN** a presented run
- **THEN** rows inserted, rows skipped and rows dropped share one row

#### Scenario: Start and finish share a row

- **GIVEN** a finished run
- **THEN** start and finish are in one row of their own, below the other measures

#### Scenario: Nothing is said about retention

- **GIVEN** retained runs
- **THEN** the retained runs block lists them and carries no sentence about memory or restarts

#### Scenario: The run id can be copied

- **GIVEN** a presented run
- **THEN** its id is shown with a control that copies it

### Requirement: Run status is presented in one vocabulary and never inferred from counts

The console SHALL present the service's `completed` state as **Done**, and its `running` and `failed` states
as Running and Failed. A run that ended before working through its range SHALL be presented as Failed on the
service's state alone: the console SHALL NOT infer an early stop from the counts, because a run that stops
on its last day has counts that sum to the total and is still failed.

A Done run that has failed days SHALL show that: days failed above zero, coloured as a failure. Done SHALL NOT be
presented as clean, and nothing is added beside the status for it. The failed days themselves are not listed.

#### Scenario: An early stop is Failed whatever the counts

- **GIVEN** a failed run whose completed and failed days sum to the total
- **THEN** the console presents it as Failed

#### Scenario: Done with failed days is not clean

- **GIVEN** a run that is done and carries two failed days
- **THEN** the status is Done and days failed reads as a failure

#### Scenario: Failed days are not listed

- **GIVEN** a run whose failed days the service names
- **THEN** the run block does not list them

### Requirement: A backfill range is two inclusive UTC dates within the span limit

The start form SHALL take a first and a last date, both inclusive and both UTC, and SHALL state the number of
days they cover. It SHALL send them to the service as calendar dates, not as moments. It SHALL NOT allow a
last date after today's UTC date, a first date after the last, a missing date, or a span longer than the
span limit, and SHALL disable the start control while the range is not valid. "Today" SHALL be today in UTC,
not in the reader's time zone.

The span limit SHALL be held in one constant, changed together with the service's default. It SHALL be stated
in one place only: the message for a range that exceeds it, which SHALL give the number of days. When the service
refuses a range the console SHALL show the service's own message.

#### Scenario: A valid range enables the start control

- **GIVEN** a first date and a last date no later than today in UTC, within the span limit
- **THEN** the form states the number of days and the start control is enabled

#### Scenario: An invalid range disables the start control

- **GIVEN** a range that is longer than the span limit, ends in the future, or is inverted
- **THEN** the start control is disabled

#### Scenario: A range that is too long names the limit

- **GIVEN** a range longer than the span limit
- **THEN** the message says the range is longer than the limit and gives that number of days

#### Scenario: Today is UTC

- **GIVEN** a reader whose local date differs from the UTC date
- **THEN** the last selectable date is the UTC date

#### Scenario: A refused range reports the service's message

- **GIVEN** the service answers 400 to a range the form accepted
- **THEN** the console shows the service's message

### Requirement: A backfill skips what is already ingested unless asked to re-ingest

Every backfill the console starts SHALL ask the service to skip what it has already ingested, unless the
admin chooses **Re-ingest already ingested data**. The choice SHALL be offered on the start form and beside
**Rerun failed**, SHALL be off by default in both, and SHALL NOT be carried over from the run being re-run,
which does not report how it was started. Beside it the console SHALL state that re-ingesting writes every log
in the range again and that the re-written rows re-trigger the pipelines reading the source tables. A run that
skips ingested data over a range that is already ingested finishes with zero files and zero rows. The service reports the same zero for a range that holds no logs at all, so the
drawer SHALL say, for a Done run with zero files processed, that nothing new was written because the range was
already ingested or holds no logs — and SHALL NOT say which of the two it was, which the service does not report.

#### Scenario: The request skips ingested data

- **WHEN** the console starts a backfill or a re-run without choosing to re-ingest
- **THEN** it sends the range with re-ingest off

#### Scenario: Re-ingest is chosen on the start form

- **WHEN** an admin chooses re-ingest on the start form and starts a backfill
- **THEN** the console sends the range with re-ingest on

#### Scenario: A re-run re-ingests only when chosen

- **GIVEN** a finished run that offers **Rerun failed**
- **WHEN** an admin chooses re-ingest beside it and re-runs
- **THEN** the console sends the re-run range with re-ingest on
- **AND** the choice starts off for every run presented, whichever way that run was started

#### Scenario: The cost is stated beside the choice

- **WHEN** the re-ingest choice is offered
- **THEN** it says that every log in the range is written again and that the re-written rows re-trigger the
  pipelines reading the source tables
- **AND** beside **Rerun failed** it says that the days of the re-run range that succeeded are written again too

#### Scenario: A run that wrote nothing says why it may have

- **GIVEN** a Done run that processed no files
- **THEN** the drawer states that nothing new was written, because the range was already ingested or holds no logs

### Requirement: A finished run can be re-run from its first failed day

A run that is Done and carries failed days, or that is Failed, SHALL offer **Rerun failed**, and only when no run
is in progress. The control starts the re-run from the run's earliest failed day. The re-run SHALL cover the earliest failed day through the last day
of the original range, because a run that stopped early names only the days it attempted and leaves the rest
unattempted. A Failed run that named no failed day SHALL re-run its whole original range.

A Done run with no failed day SHALL offer no re-run.

#### Scenario: A Done run with failed days

- **GIVEN** a Done run over a range whose failed days are the fourth and the seventeenth
- **THEN** Rerun failed is offered, and starts a run from the fourth through the last day of the original range

#### Scenario: A Failed run covers its unattempted days

- **GIVEN** a Failed run that stopped on the seventeenth of a range ending on the thirtieth, and named the fourth and the seventeenth as failed
- **THEN** the re-run covers the fourth through the thirtieth

#### Scenario: A Failed run that named no failed day

- **GIVEN** a Failed run that stopped before attempting any failing day, over a range from the first through the thirtieth
- **THEN** Rerun failed is offered, and covers the first through the thirtieth

#### Scenario: No re-run while another run is in progress

- **GIVEN** a run in progress
- **THEN** no run offers a re-run

#### Scenario: A clean Done run offers no re-run

- **GIVEN** a Done run with no failed day
- **THEN** no re-run is offered

### Requirement: A refused start reports the service's message

When the service refuses to start a backfill the console SHALL show the service's own message and SHALL leave
the form as it was. This includes a refusal because a run is already in progress, because the backfill is
switched off in the service's configuration, and because the range is invalid. The console SHALL NOT hide the
Backfill data button on the basis of a probe: the service reports that backfill is switched off only when a
start is attempted.

#### Scenario: A run is already in progress

- **GIVEN** the service answers a start with a conflict
- **THEN** the console shows its message and the form remains

#### Scenario: Backfill is switched off

- **GIVEN** the service answers a start with its backfill-disabled refusal
- **THEN** the console shows its message

### Requirement: The backfill drawer closes when the reader moves away from it

The backfill drawer SHALL close through its close control, on Escape, and when the scrim around the panel is pressed.
A press on something that is outside the panel but opened from inside it — a calendar's popup — SHALL NOT close it,
and neither SHALL a press that began inside the panel and ended on the scrim, such as dragging a text selection out.
Closing SHALL discard nothing the reader would miss: the form holds two dates. While it is closed the drawer SHALL
not be mounted, so each opening reads the service afresh.

#### Scenario: A press on the scrim closes it

- **GIVEN** the drawer open
- **WHEN** the reader presses the page around the panel
- **THEN** the drawer closes

#### Scenario: Choosing a date does not close it

- **GIVEN** the drawer open with a calendar's popup showing
- **WHEN** the reader chooses a day
- **THEN** the popup closes, the drawer stays open, and the date is in the form

#### Scenario: The close control and Escape close it

- **GIVEN** the drawer open
- **WHEN** the reader presses its close control, or Escape
- **THEN** the drawer closes

#### Scenario: A drag out of the panel does not close it

- **GIVEN** a press that began inside the panel
- **WHEN** it ends on the scrim
- **THEN** the drawer stays open
