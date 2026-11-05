## MODIFIED Requirements

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
rows skipped, rows dropped — then what else it measured (the date being processed while it runs, files processed,
failed blobs), then start and finish together in one row of their own, finish only once finished. Days completed
SHALL be coloured as a success when above zero, and days failed and failed blobs as a failure when above zero; a
zero stays the text colour. The failed days SHALL NOT be listed, and neither SHALL the failed blobs. What skipped
and dropped rows mean SHALL be explained behind an info icon beside each of those two labels, not in a paragraph.
The window SHALL be kept on one line.

**Failed blobs** is the service's count of the blobs the run could not ingest, and it only grows while the run
works through its range. It SHALL carry an info icon explaining that the failed blobs are listed among the ingest
failures, and that a blob which has since ingested on another path no longer appears there. Above zero, and while the
service serves the failure listing, the figure SHALL be a link that opens the ingest failures drawer narrowed to
that run; otherwise it SHALL be plain text. Failed
blobs belongs to an ingest run only; the pipeline drawer has no such figure.

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
- **THEN** its facts are, in order, the id, the window, days total, days completed, days failed, rows inserted, rows skipped, rows dropped, files processed, failed blobs, start and finish

#### Scenario: Failed blobs are coloured and explained

- **GIVEN** a presented run that could not ingest three blobs
- **THEN** failed blobs reads 3 as a failure, with an info icon explaining that they are listed among the ingest failures and that blobs ingested since drop out of that list
- **AND** activating the figure opens the ingest failures drawer narrowed to that run

#### Scenario: A run with no failed blob

- **GIVEN** a presented run in which no blob failed
- **THEN** failed blobs reads 0 in the text colour and is not a link

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


## ADDED Requirements

### Requirement: Ingest failures are offered to a full admin from the Tables toolbar

The Tables page SHALL offer an **Ingest failures** button in its toolbar, before Backfill data, to a full admin,
and SHALL withhold it from a caller who is not a full admin. The button SHALL open the ingest failures drawer with
no run narrowing and SHALL NOT retry anything itself. It SHALL stay offered while a backfill run is in progress.

On load the page SHALL read how many failures need an operator — the service's `parked` state — and SHALL state
that number beside the button's label when it is above zero, in the warning colour. The number SHALL be the
service's count of matching failures, not the length of a returned page. At zero the button SHALL carry no number.
The number SHALL be part of the button's accessible name, so it is not conveyed by colour or position alone.

A failed read on load SHALL leave the button offered without a number and SHALL raise no notification of its
own: the drawer reports a failed read when it is opened. When the service does not serve the failure listing at
all — an Analytics service released before it — the button SHALL be withheld and nothing SHALL be reported as an
error.

The number SHALL be read again whenever the drawer closes, so a retry made in it is reflected on the toolbar.

#### Scenario: A full admin sees the button with the number that needs retry

- **GIVEN** a full admin on the Tables page and three failures in the parked state
- **THEN** the toolbar offers Ingest failures stating 3
- **AND** the button's accessible name includes the number

#### Scenario: A caller who is not a full admin sees no button

- **GIVEN** a caller who is not a full admin
- **THEN** the toolbar offers no Ingest failures control and no failure listing is read

#### Scenario: The number is exact beyond one page

- **GIVEN** 1500 parked failures
- **THEN** the button states 1500

#### Scenario: Nothing needs retry

- **GIVEN** no failure in the parked state
- **THEN** the button is offered and carries no number

#### Scenario: An older service hides the entry point

- **GIVEN** an Analytics service that does not serve the failure listing
- **THEN** the toolbar offers no Ingest failures control
- **AND** no error is reported

### Requirement: The ingest failures drawer summarizes what needs an operator and what retries itself

The ingest failures drawer SHALL be a modal panel at the right edge of the page, 600px wide, and SHALL close
through its close control, on Escape and when the scrim around the panel is pressed, under the same rules as the
backfill drawer. While closed it SHALL NOT be mounted, so each opening reads the service afresh.

The drawer SHALL open with a summary of the failures the service holds outstanding, in two tiles:

- **Needs retry** — the failures in the `parked` state. The service does not retry them on its own. The tile
  SHALL say so in a phrase, and SHALL say that the cause is to be fixed before they are retried.
- **Retrying automatically** — the failures in the `pending` state. The service retries them on its own with
  backoff. The tile SHALL say so in a phrase and SHALL offer no action.

Both figures SHALL be the service's counts of matching failures per state, exact however many rows were
returned. The summary SHALL also state the age of the newest failure. The drawer SHALL read the rows of each state
on its own, so a long list of one state cannot hide the other.

When the service reports that its automatic retry pass is switched off, the drawer SHALL state, above the
groups, that failures retrying automatically and failures queued for retry wait until the pass is switched on.
The Retrying automatically tile SHALL then not claim that they are being retried.

The drawer SHALL NOT break the failures down by kind and SHALL offer no kind, reason or date filter. The kind is
stated on each failure, and the grouping below is the one an operator acts on.

#### Scenario: Both states are summarized

- **GIVEN** three parked failures and five pending ones
- **WHEN** a full admin opens the drawer
- **THEN** Needs retry states 3 and Retrying automatically states 5
- **AND** the age of the newest failure is stated

#### Scenario: The summary is exact beyond one page

- **GIVEN** 2400 pending failures
- **THEN** Retrying automatically states 2400

#### Scenario: The automatic tile offers nothing to do

- **GIVEN** pending failures
- **THEN** the Retrying automatically tile offers no action

#### Scenario: A switched-off retry pass is stated

- **GIVEN** the service reports its automatic retry pass as switched off
- **WHEN** the drawer is opened
- **THEN** it states that automatic and queued retries wait until the pass is switched on

### Requirement: The ingest failures drawer can be narrowed to one backfill run

Opened from a backfill run's Failed blobs, the drawer SHALL be narrowed to the failures that run met since they
were last resolved. The narrowing SHALL apply to the summary, the rows of both states and every retry the drawer
sends. The drawer SHALL state the narrowing as a dismissible **Run {id}** indicator, the same shape as the
pipeline failures card's run filter; dismissing it SHALL read the failures again without the narrowing. Opened
from the toolbar, the drawer is not narrowed.

#### Scenario: Opening from a backfill run narrows the drawer

- **GIVEN** a backfill run with failed blobs
- **WHEN** the reader activates its Failed blobs figure
- **THEN** the ingest failures drawer opens with a Run indicator naming that run
- **AND** its summary and rows count only that run's failures

#### Scenario: Dismissing the narrowing shows every failure

- **GIVEN** the drawer narrowed to a run
- **WHEN** the reader dismisses the Run indicator
- **THEN** the drawer presents every outstanding failure

#### Scenario: A group retry under a narrowing stays within the run

- **GIVEN** the drawer narrowed to a run
- **WHEN** the reader confirms a group's Retry all
- **THEN** the request names that run along with the group's state, reason and kind

### Requirement: Failures that need retry are grouped by reason and kind

Under the summary the drawer SHALL list the failures that need retry, **grouped by reason and kind**: one group
per pair of the latest failure's reason and the failure's kind (blob, day or skipped records). A reason that occurs
on two kinds SHALL form two groups. Groups SHALL be ordered by their newest failure, newest first, and the
failures in a group SHALL be ordered the same way.

A group SHALL state its reason in plain words with a plain-language description of what it means, its kind, how
many of its failures are shown, and a **Retry all** control for the group. For a reason the service classes as
deterministic, the group SHALL state that retrying unchanged parks the failure again, so the cause is to be fixed
first.

Each failure SHALL be presented as a row stating its subject — the blob's file name, or the day — with the full
key reachable, its day, the age of its latest failure, a selection checkbox and a **Retry** control. When the
service holds more parked failures than the drawer received, the drawer SHALL state above the groups how many are
shown out of how many.

The failures that are retrying automatically SHALL be presented after the groups as one line stating their
number, with a control that expands them into rows below it. Their rows SHALL state the same facts as a row that
needs retry, plus when the service is next due to attempt it, and SHALL offer no selection and no retry control.
The expansion SHALL be stated programmatically.

#### Scenario: Failures are grouped by reason and kind

- **GIVEN** two parked blobs with a mapping error and one parked day whose listing failed
- **WHEN** the drawer is opened
- **THEN** it presents a mapping error group of two blobs and a listing failed group of one day

#### Scenario: One reason on two kinds forms two groups

- **GIVEN** a parked blob and a parked skipped-records failure, both refused by the server
- **THEN** they are presented in two groups, one per kind

#### Scenario: A deterministic group says to fix the cause first

- **GIVEN** a group whose reason the service classes as deterministic
- **THEN** the group states that retrying unchanged parks the failures again

#### Scenario: More failures than shown are stated

- **GIVEN** 1500 parked failures and a drawer that received 1000 of them
- **THEN** the drawer states that 1000 of 1500 are shown

#### Scenario: Automatic retries are one expandable line

- **GIVEN** four pending failures
- **THEN** one line states 4 retrying automatically
- **AND** expanding it presents their rows with their next attempt, no checkbox and no retry control

### Requirement: Failures that need retry can be selected and retried together

Each row that needs retry SHALL carry a checkbox, and each group SHALL carry a checkbox that selects or clears all
of its shown rows, stated as mixed while only some are selected. The selection MAY span groups and kinds. While at
least one row is selected, the drawer SHALL state how many are selected and SHALL offer **Clear selection** and
**Retry selected**. Retry selected SHALL send one request naming each selected failure by its kind and subject, so
a blob and its skipped records are told apart even when both are selected. It SHALL be confirmed in a dialog
stating how many failures are queued. The selection SHALL be cleared after any retry and whenever the failures
are read again.

#### Scenario: A selection spanning kinds is retried in one request

- **GIVEN** a selected parked blob and a selected skipped-records failure on another blob
- **WHEN** the reader confirms Retry selected
- **THEN** one request names both failures, each with its own kind and subject

#### Scenario: The count of selected failures is stated

- **GIVEN** three selected rows
- **THEN** the drawer states 3 selected and offers Clear selection and Retry selected

#### Scenario: A group checkbox selects its rows

- **GIVEN** a group of four shown failures, one of them selected
- **THEN** the group checkbox is stated as mixed
- **AND** activating it selects all four

#### Scenario: Clearing the selection

- **GIVEN** selected rows
- **WHEN** the reader activates Clear selection
- **THEN** no row is selected and Retry selected is no longer offered

### Requirement: An ingest failure's detail is opened in place

Activating a failure's row SHALL open its detail as a full-width region directly beneath it, and activating it
again SHALL close it. Activating its checkbox or its Retry control SHALL NOT toggle the detail. The expansion SHALL
be stated programmatically. The detail SHALL state, as labelled values: the full blob key or the day, with a
control that copies it; the kind; the reason and what it means; whether the service retries it automatically; the
ingest path of the latest failure (poller, reconciliation, backfill or retry pass); the attempts since it was last
retried; when it first and last failed; for a blob, its last-modified time; for a failure retrying automatically,
when the next attempt is due; and the backfill runs it failed on since it was last resolved, when there are any.

The detail SHALL state the service's message in full, wrapped rather than truncated, with a control that copies
it, as the service wrote it. A failure the service recorded no message for SHALL say so.

#### Scenario: A blob's detail states its key and message

- **GIVEN** a parked blob failure
- **WHEN** the reader opens its detail
- **THEN** the full blob key is stated with a control that copies it
- **AND** the message is presented in full with a control that copies it

#### Scenario: A pending failure states its next attempt

- **GIVEN** a pending failure
- **WHEN** the reader opens its detail
- **THEN** the detail states when the next attempt is due

#### Scenario: A failure met by a backfill names the run

- **GIVEN** a failure that failed on one backfill run since it was last resolved
- **WHEN** its detail is opened
- **THEN** the detail names that run

#### Scenario: A failure with no message says so

- **GIVEN** a failure the service recorded no message for
- **WHEN** its detail is opened
- **THEN** the detail states that no message was recorded

### Requirement: An ingest failure can be queued for retry

The drawer SHALL offer three retries, each sending exactly what the reader asked for:

- **one failure**, from its row: a request naming that failure's kind and subject. It SHALL be sent without
  confirmation. The request SHALL always name the kind, because a blob and its skipped records share one key.
- **the selected failures**, from Retry selected, as the selection requirement states.
- **every failure of a group**, from the group's Retry all: a request naming the parked state, the group's reason
  and its kind, and the run when the drawer is narrowed to one. It SHALL be confirmed in a dialog first.

The group dialog SHALL state exactly how many failures the retry reaches, read from the service with the group's
filters when the dialog opens, including failures the drawer did not receive. For a deterministic reason it SHALL
repeat that retrying unchanged parks them again. Cancelling a dialog SHALL send nothing.

A retry queues failures for the service's next retry pass; it does not ingest them. The console SHALL report the
outcome as a status message stating how many failures the service queued, which can be fewer than the dialog
stated, and SHALL NOT state or imply that they were fixed. The message SHALL also state:

- when the next pass is due, while the pass is switched on;
- that the queued failures take several passes, when the service queued more than one pass handles;
- that the queued failures wait until the pass is switched on, when it is switched off.

When the service queued none, the message SHALL say that nothing was left to queue. After any retry the console
SHALL read the failures again, whether or not it succeeded.

A retry the service refuses — including a refusal for lack of permission — SHALL be reported by notification with
the service's own message, and the drawer SHALL stay as it was.

#### Scenario: One failure is queued without confirmation

- **GIVEN** a parked blob failure
- **WHEN** the reader activates its Retry control
- **THEN** a request naming the kind blob and that blob's key is sent
- **AND** no confirmation is presented
- **AND** a status message states that one failure was queued and when the next pass is due
- **AND** the failures are read again

#### Scenario: Skipped records are retried apart from their blob

- **GIVEN** a parked skipped-records failure whose blob also has a parked blob failure
- **WHEN** the reader retries the skipped-records failure
- **THEN** the request names the kind records and the blob's key, and the blob failure is not queued

#### Scenario: A group retry is confirmed with its exact count

- **GIVEN** a mapping error group of blobs that the service counts as 1200
- **WHEN** the reader activates the group's Retry all
- **THEN** a dialog states that 1200 failures will be queued and that the cause is to be fixed first
- **AND** confirming it sends a request naming the parked state, the reason mapping error and the kind blob

#### Scenario: A retry larger than one pass says so

- **GIVEN** a retry the service queues more failures for than one pass handles
- **THEN** the status message states that they take several passes

#### Scenario: A retry while the pass is switched off says they wait

- **GIVEN** the service reports its automatic retry pass as switched off
- **WHEN** the reader retries a failure
- **THEN** the status message states that the failure was queued and waits until the pass is switched on

#### Scenario: Nothing left to queue

- **GIVEN** a failure that resolved after the drawer was read
- **WHEN** the reader retries it and the service queues none
- **THEN** the status message states that nothing was left to queue
- **AND** the failures are read again

#### Scenario: A refused retry reports the service's message

- **GIVEN** a caller whose role the service does not allow to retry
- **WHEN** they retry a failure
- **THEN** a notification states the service's message and the drawer is unchanged

### Requirement: The ingest failures drawer states why it has nothing to show

The drawer SHALL distinguish the reasons it is empty:

- **no outstanding failures** — the drawer SHALL state that there are no ingest failures, with no group and no
  retry control. Narrowed to a run, it SHALL state that the run has no outstanding failure.
- **nothing needs retry, but some retry automatically** — the drawer SHALL state that nothing needs retry, and
  SHALL still present the line of automatic retries.
- **the read failed** — the drawer SHALL report it by notification with the service's message and SHALL state in
  place that the failures could not be read, with a control that reads them again. It SHALL NOT present a failed
  read as "no failures".

#### Scenario: No outstanding failures

- **GIVEN** the service holds no outstanding failure
- **WHEN** the drawer is opened
- **THEN** it states that there are no ingest failures and offers no retry

#### Scenario: A narrowed run with nothing outstanding

- **GIVEN** a backfill run whose failed blobs have all ingested since
- **WHEN** the drawer is opened from its Failed blobs
- **THEN** it states that the run has no outstanding failure

#### Scenario: Only automatic retries are outstanding

- **GIVEN** no parked failure and two pending ones
- **THEN** the drawer states that nothing needs retry and presents the line of two retrying automatically

#### Scenario: A failed read is not an empty list

- **GIVEN** the service cannot be read
- **WHEN** the drawer is opened
- **THEN** a notification states the service's message
- **AND** the drawer states that the failures could not be read and offers to read them again
- **AND** it does not state that there are no failures
