## MODIFIED Requirements

### Requirement: Six-field cron control for a scheduled trigger

The service checks only whether the trigger's cron is present or absent for the selected trigger kind — it
never parses the expression, at registration or at patch. A syntactically invalid expression is accepted and
fails later where the operator will not be looking. The console is the only guard, so the control SHALL
validate the expression it submits.

The accepted format is **six-field cron** — seconds, minutes, hours, day-of-month, month, day-of-week —
matching every expression the service configures. A five-field expression SHALL be rejected by the control:
it parses as a *different* schedule under a six-field reader, so accepting one silently shifts the schedule
rather than failing.

The control SHALL be **one field**: a text input that always holds the expression, with a **Presets** menu
beside it. Choosing a preset SHALL write its expression into the input, and any expression the author types
SHALL be accepted there directly — there is no separate Custom mode and no second input that appears on
demand, and no caption under the input. The menu SHALL be a button that carries the word **Presets** as its
label, not an icon alone. The expression SHALL be validated for its field count before submission, and an
invalid expression SHALL block submission with a message naming the six-field requirement. The field SHALL
be labelled **Schedule**.

For an **enrichment** pipeline the Presets menu SHALL also offer an **Every minute** preset, listed first.
An absent cron SHALL leave the input empty, with Every minute as its placeholder. A cron that fires once a
minute at a fixed second — `N * * * * *` with `N` from 0 to 59 — is the shape of the default the service
stores, at a second it derives from the pipeline name, and SHALL be shown as the expression it is. Choosing Every minute SHALL keep a cron that already has that shape and
SHALL otherwise clear the cron, so the request omits it and the service derives the second. The control
SHALL NOT mark the cron as required for an enrichment pipeline.

For an **aggregate** pipeline the Presets menu SHALL NOT offer Every minute and SHALL mark the cron as required:
the service never defaults an aggregate's cron, so a preset that sends none would leave the pipeline
unarmable, and an aggregate's refresh cost scales with its cadence.

This control SHALL be used for an aggregate pipeline's schedule as well, whose trigger kind is always
`schedule`.

#### Scenario: A preset yields a six-field expression

- **WHEN** the user chooses a preset other than Every minute from the Presets menu
- **THEN** the input holds that preset's six-field expression
- **AND** the value submitted as the trigger's cron has six fields

#### Scenario: Any expression is typed into the one input

- **GIVEN** a pipeline whose cron equals none of the presets
- **WHEN** its page is opened
- **THEN** the input holds the expression
- **AND** no second input, no mode selection and no caption is presented

#### Scenario: The presets menu is labelled

- **WHEN** a schedule is edited
- **THEN** the control beside the input is a button labelled Presets

#### Scenario: A service-defaulted cron reads as Every minute

- **GIVEN** an enrichment pipeline whose stored cron fires once a minute at a fixed second
- **WHEN** its page is opened
- **THEN** the input holds the stored expression, not a caption
- **AND** choosing Every minute from the Presets menu leaves that cron unchanged

#### Scenario: An enrichment schedule with no cron reads as Every minute

- **WHEN** an enrichment pipeline's trigger kind is switched to `schedule` and it has no cron
- **THEN** the input is empty and its placeholder reads Every minute
- **AND** the cron is not marked as required

#### Scenario: Choosing Every minute leaves the second to the service

- **GIVEN** an enrichment pipeline whose cron is an hourly preset
- **WHEN** the user selects Every minute and saves
- **THEN** the request carries a trigger of kind `schedule` and no `cron`

#### Scenario: Every minute is not offered for an aggregate

- **WHEN** an aggregate pipeline's schedule is edited
- **THEN** Every minute is not among the presets in the Presets menu
- **AND** the cron is marked as required

#### Scenario: A five-field custom expression is rejected

- **WHEN** the user types a five-field expression into the input
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: A valid custom expression is accepted

- **WHEN** the user types a well-formed six-field expression into the input
- **THEN** the control accepts it and submission proceeds

#### Scenario: An aggregate pipeline uses the same control

- **WHEN** an aggregate pipeline's schedule is edited
- **THEN** the six-field cron control is presented

### Requirement: A pipeline's runtime state is presented read-only

Every pipeline carries a server-owned `state` reporting how its execution is going **as the registry sees
it**: the scan position it has reached, when it last ran, when it will next run, how far behind its input it
is, the last failure, whether the last run left input behind, what held its window short of its input, how far
its output has been materialized, when it was last probed and found drained, and whether an enrichment it
reads has been re-derived beneath it. The console SHALL present this state on the detail page, read-only, and
SHALL present it in two places according to what the reader does with it.

For an `enrich` pipeline the registry records almost none of the execution position, because the runner owns
it. The **runtime view** is the authority there, and this requirement's sibling governs how it is presented.
The registry's own state SHALL still be presented for an `enrich` pipeline that calls a model in the members
the runner does not report — the materialized-through position, the drained-at probe and the cursor
position — so that no member the service does report is dropped on the way. A SQL enrichment and an
`aggregate` pipeline present their position as Data up to instead, and no state group.

The **three states an operator acts on** — the last failure, a window held short by an enrichment the
pipeline reads, and an output a re-derived input has left behind — SHALL be presented as **alerts**, above
the tab strip, each stating what happened and naming the enrichment involved. As a line of small print
below the facts they read as a footnote to them, which is what made them easy to miss.

Each alert SHALL be drawn to what it is: the failure as an error, the rebuild as a warning, the clamp as
information. None SHALL interrupt a screen reader, the page rendering all three as it loads rather than
raising them while it is read.

Everything the state reports SHALL be presented in the **Runtime** tab, grouped by the question each
group answers:

- **Schedule** — when it last ran and when it next runs. The last run SHALL be labelled **Last run**
  whichever service reports it. Where the runner and the registry both report one, the runner's SHALL be
  presented and the other SHALL NOT be drawn under the same label.
- **Progress** — where the pipeline stands against its input, and whether it is up to date or catching up.
  For an `aggregate` pipeline and for an `enrich` pipeline whose transform is SQL, the first is stated as
  **Data up to** — the moment up to which the output has been computed, converted from the epoch-millisecond
  version the registry records (the cursor version for an aggregate, the materialized-through version for
  a SQL enrichment) to the reader's local time. It SHALL NOT be derived from `lag_seconds`, which is a
  difference against the moment of the read and says nothing about which data the output covers. For any
  other pipeline the first is stated as **Behind its input**, from the lag. The second is stated as
  **Status**, reading **Up to date** or **Catching up**, for every kind of pipeline.
- **State** — for an `enrich` pipeline that calls a model only: the cursor position (version and
  identity), the materialized-through position (version and identity), and when it was last drained.
  Named for what it is: a pipeline is a standing process rather than a job with an end, so none of these
  counts towards a finish and "progress" would promise one. An `aggregate` pipeline and a SQL enrichment
  SHALL NOT present this group: the position that matters to their reader is the one Data up to states,
  and the identity beside it is an internal key that answers no question they ask.

Where the runtime view reports the same question for an `enrich` pipeline, the view SHALL be the one
presented and the registry's group SHALL NOT be drawn a second time beside it. Two cards stating the
pipeline's schedule from two services, which sample at different moments, invite a reader to treat the
difference as a fact about the pipeline rather than about the reads.

Each group SHALL be presented as a **card**, stacked, each taking the full width. Rules between groups
left the tab one undifferentiated column under its control bar, and the failures card below them is a
card: two presentation idioms on one tab read as two unrelated screens. Side by side the cards were
forced to a shared height, so the schedule — two values against the state's seven — stood above a
card's worth of empty space, while the failures card beneath them was full width either way.

A card SHALL carry no rim. It is a raised layer against the panel behind it, and that fill is already
its boundary; a border on top of it draws the same box twice.


- **Failures and notices** — when the last run failed. This is the registry's own verdict on a whole
  run, which is a different kind of fact from the per-row dead letters the failures card lists: the
  kinds that dead-letter are model-calling enrichments, and the kinds that report a run-level failure
  are the ones the registry drives itself, so the two are never the same pipeline's answer to the same
  question.

The service reports no timestamp of its own for that failure — `last_error` is the last run's failure —
so the run's time is what places it, and the console SHALL NOT invent one. Whether to present the group
SHALL be judged on the raw member rather than on the formatted time: the formatting lands after the
first render, so a gate read from it withholds the group on first paint and then pops it in, and drops
it entirely for a pipeline that failed before it ever recorded a run.

The console SHALL NOT restate the message of the failure, the clamp or the required rebuild anywhere in
the tab: all three are already raised as alerts above the tab strip, in the same words, and a reader who
has just read the alert would meet it twice on one screen. What the tab adds is the timing the alert has
no room for.

`drained_at` SHALL be presented under state rather than under schedule, and SHALL NOT be presented as a
sign that the pipeline is alive. It records when a probe last found nothing matching the filter left to
do, and it advances **only** on an empty probe — so a pipeline with steady input, working perfectly, holds
a `drained_at` frozen at its last quiet moment for months, while one with sparse input re-stamps it every
tick. Read as a heartbeat it inverts the truth: the healthy busy pipeline looks stalled and the idle one
looks lively. It is a horizon for the rollups that read this pipeline, which is why it is stated at all,
and the value that says the pipeline is advancing is the materialized-through position beside it.

The tab SHALL offer to read the values again without leaving the page. That control SHALL carry a label
rather than being icon-only, so it reads as a peer of the pause control beside it in the tab's own
control bar. The tab SHALL NOT state how old its answer is: an age beside every value competed with the
values themselves, and re-reading is one click away.

Reading again SHALL read **both** upstreams — the pipeline, which carries the state, and the runtime
service, which carries the runtime view, the pause and the failures — because the tab presents facts from
both and a control that refreshed one of them would leave the other stale behind a chip that says
otherwise. A lag figure is measured against the present, so a value that is minutes old is a different
statement from the same value read now, and a reader who cannot tell them apart cannot tell a stalled
pipeline from a stale page.

The **read-only facts row** above the tab strip SHALL carry no runtime value at all. It keeps what the
declaration derives — grain key, version column, generation, created, updated. Four values fitted that
row; the cursor pair and the materialized-through pair do not, and they are what distinguishes a stalled
pipeline from a slow one. `drained_at` in particular SHALL NOT stay there: beside `updated_at` it reads as
the pipeline's last sign of life, which is the one thing it does not report.

A group whose every member the service omitted SHALL render nothing at all — not a heading over an empty
card. A pipeline for which the service records no run schedule has none to show: a bare heading above
white space reads as a fault rather than as an absence that is ordinary for that pipeline.

The tab SHALL present exactly one of these content states:

- **Loaded** — at least one of the two services reports something, and its values are presented.
- **Never run** — a state from which no group has anything to draw, **a reported failure included**: a
  pipeline that failed has run, and telling its reader otherwise sends them looking for a pipeline that
  never started. The tab SHALL state that the pipeline has not run yet, in the console's own empty-state
  treatment, rather than presenting a row of placeholders. This SHALL NOT be judged on `last_run_at`: ADAS records that member only for the kinds it
  drives itself, so an enrichment pipeline the runner drives has none of it while working
  perfectly, and judging by it alone told a running pipeline it had never run. For an `enrich` pipeline a
  read runtime view SHALL rule this state out: the view always carries the pipeline's state, so the runner
  has it and is driving it whatever the registry recorded.
- **Unavailable** — neither service reported anything: the pipeline carries no state and no runtime view was
  read. The tab SHALL state that the runtime state could not be read and SHALL state that the pipeline's
  configuration is unaffected, so the reader does not act on the absence as if the pipeline were broken.

The failures card is governed by its own requirements and SHALL be presented independently of these three:
it reads a different service, and a pipeline that has never run can still hold dead letters from before
its state was reset.

`unclamped_reads` SHALL NOT be presented. It reports, per enrichment the pipeline reads, why the window was
**not** held — six closed-dictionary reasons, one of them simply "this pipeline does not read it" — and
every one of them is the ordinary case. The member stays readable in the JSON editor.

State SHALL be presented as reported and SHALL NOT be interpreted into a health verdict. A lag figure is
measured against the moment it is read, so two reads of an unchanged position differ by the time between
them and both are correct; a clamp is progress rather than an error. Presenting either as a fault would be
the console inventing a judgement the service does not make.

A value SHALL be presented in full rather than truncated, with the whole of it reachable where the
column it sits in is narrower than the value. A cursor identity cut short with no way to read the rest
is one nobody can use.

A member the service omits SHALL be **left out** rather than presented as a zero or as an em dash. These
values appear as the pipeline runs, so a row of placeholders would state absence where there is simply
nothing yet — unlike the declaration's own facts, whose blank means the declaration names none.

State SHALL NOT be sent when the pipeline is saved.

#### Scenario: Execution state is presented

- **WHEN** a full admin opens the `Runtime` tab of an `aggregate` pipeline that has run
- **THEN** its last run and next run are presented in the schedule card
- **AND** its Data up to and its status are presented in the progress card
- **AND** no state card is presented
- **AND** the cards are stacked, each the full width

#### Scenario: An aggregate states the time its output covers

- **GIVEN** an `aggregate` pipeline whose cursor version is an epoch-millisecond value
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** a row labelled Data up to states that moment in the reader's local time
- **AND** no row labelled Behind its input is presented

#### Scenario: A SQL enrichment states the time its output covers

- **GIVEN** an `enrich` pipeline whose transform is SQL and whose registry state carries a
  materialized-through version
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** a row labelled Data up to states that moment in the reader's local time
- **AND** it is not derived from the lag the runner reports
- **AND** no state card is presented

#### Scenario: A model-calling enrichment keeps its lag and its position

- **GIVEN** an `enrich` pipeline whose transform calls a model
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** a row labelled Behind its input states the lag
- **AND** the state card presents its cursor and materialized-through positions

#### Scenario: Catching up and up to date are stated for every kind

- **GIVEN** a pipeline of any kind that reports whether the last run left input behind
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** a row labelled Status reads Catching up where input was left behind and Up to date where none was
- **AND** no row labelled Backlog is presented

#### Scenario: One last run is presented

- **GIVEN** an `enrich` pipeline for which the runner and the registry both report a last run
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** one row labelled Last run is presented, carrying the runner's value

#### Scenario: The registry's schedule is not drawn beside the runner's

- **GIVEN** an `enrich` pipeline for which both the registry and the runtime service report a schedule
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** one schedule card is presented, carrying the runtime service's values
- **AND** no second schedule card is presented from the registry's state

#### Scenario: Registry members the runner does not report are still presented

- **GIVEN** an `enrich` pipeline that calls a model, whose registry state carries a materialized-through
  position and a drained-at probe
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** both are presented
- **AND** the runtime service's own groups are presented beside them

#### Scenario: The measured values are no longer among the read-only facts

- **WHEN** a pipeline that has run is opened on `Properties`
- **THEN** its last run, next run, lag, status and drained-at are not presented among the read-only facts
- **AND** its grain key, version column, generation, created and updated still are

#### Scenario: Drained-at is not presented as a sign of life

- **GIVEN** a pipeline with steady input whose `drained_at` is months old while its materialized-through
  position advances
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** `drained_at` is presented in the state card rather than the schedule card
- **AND** it is not presented as the pipeline's last activity or as evidence that it has stalled

#### Scenario: The tab offers to read the values again

- **WHEN** a full admin opens the `Runtime` tab
- **THEN** a labelled control is offered that reads them again
- **AND** no age of the previous read is stated

#### Scenario: Reading again refreshes both upstreams

- **GIVEN** a full admin on the `Runtime` tab
- **WHEN** the user activates the re-read control
- **THEN** the pipeline is read again
- **AND** the runtime service is read again
- **AND** an answer from an earlier read that lands later SHALL NOT replace it

#### Scenario: A pipeline that has never run says so

- **WHEN** an `aggregate` pipeline with no recorded run is opened on `Runtime`
- **THEN** the tab states that the pipeline has not run yet, in the console's own empty-state treatment
- **AND** no measured value is presented as a zero, an epoch date or an em dash

#### Scenario: An enrichment the runner holds is never called never-run

- **GIVEN** an `enrich` pipeline carrying no registry state, for which the runtime view was read
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab does not state that the pipeline has not run yet
- **AND** the runtime service's groups are presented

#### Scenario: A pipeline carrying no state at all says the read failed

- **GIVEN** an `enrich` pipeline whose response carries no `state` and whose runtime view could not be read
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab states that the runtime state could not be read
- **AND** it states that the pipeline's configuration is unaffected

#### Scenario: The last failure is presented

- **WHEN** a pipeline whose last run failed is opened
- **THEN** the failure reported by the service is presented as an alert, worded by the service
- **AND** the `Runtime` tab's failures group states when it happened without repeating the alert's message

#### Scenario: A running enrichment pipeline is not called never-run

- **GIVEN** an `enrich` pipeline that calls a model, which the service reports with a materialized-through
  position and no `last_run_at`
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab does not state that the pipeline has not run yet
- **AND** its state card is presented

#### Scenario: A pipeline whose state records only a position is not called never-run

- **GIVEN** an `aggregate` pipeline or a SQL enrichment whose state carries a position or a drained-at
  probe and nothing else
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab does not state that the pipeline has not run yet
- **AND** no state card is presented

#### Scenario: A group with nothing to report is not drawn

- **GIVEN** a pipeline for which the service records no run schedule
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** no schedule card is rendered
- **AND** no empty heading is presented in its place

#### Scenario: A clamp is presented as progress

- **WHEN** a pipeline whose window was held short by an enrichment it reads is opened
- **THEN** the clamp and the enrichment holding it are presented as an informational alert
- **AND** the `Runtime` tab does not repeat it
- **AND** the pipeline is not presented as failing on that account

#### Scenario: A required rebuild is presented as an instruction

- **WHEN** a pipeline whose read enrichment has been re-derived since its output was built is opened
- **THEN** the console states as a warning alert that a rebuild is required and names the enrichment

#### Scenario: A pipeline in none of those states raises no alert

- **WHEN** a pipeline reporting neither a failure, a clamp nor a required rebuild is opened
- **THEN** no alert is presented
- **AND** its `Runtime` tab draws no registry failures group at all

#### Scenario: A pipeline whose only recorded fact is a failure is not called never-run

- **GIVEN** a pipeline whose state carries a failure and no run timestamp
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab does not state that the pipeline has not run yet
- **AND** the failure is presented in the failures group

#### Scenario: Unclamped reads are not presented

- **WHEN** a pipeline whose state reports `unclamped_reads` is opened
- **THEN** none of them is presented among the facts, as an alert, or in any Runtime card
- **AND** the member remains readable in the JSON editor

#### Scenario: State is not sent on save

- **WHEN** a pipeline is saved
- **THEN** the request carries no `state` member

### Requirement: The Runtime tab presents the runner's own view of an enrichment pipeline

The runtime service serves one per-pipeline view of what it is doing with a pipeline right now, in a single
shape for every lane it runs. For an `enrich` pipeline that view — not the registry's `state` — is the
authority on execution, because the runner owns the execution position and the registry deliberately records
almost none of it for the kinds the runner drives. The console SHALL read it on the **Runtime** tab and
present it in the groups the service reports it in.

The view SHALL be read **only for an `enrich` pipeline**, and only where a runtime read is issued at all: a
full admin, a configured runner host, analytics enabled. An `aggregate` pipeline is driven by the registry
on its own scheduler and is absent from the runner by construction, so the console SHALL issue no runtime
view request for one and SHALL present the registry's state for it as this requirement's sibling describes.

Each group the service reports SHALL be presented as a card, in the tab's existing card treatment:

- **Schedule** — when a live fire last committed (labelled **Last run**), when the next fire is due or that one is running now, how
  many consecutive fires have failed, and the last failure with its time.
- **Progress** — how far behind its input the scan is (for a SQL enrichment, the moment its output has been
  computed up to instead, as the registry's state states it), whether the last fire left input behind
  (stated as Up to date or Catching up), when a fire last ended with nothing more to read, and when the
  pipeline last wrote rows.
- **Queue** — the work items computing and the computed items awaiting a write.
- **Groups** — the dirty groups, split into ready, waiting on their idle window, and blocked by the daily
  cost ceiling.
- **Spend today** — the successful calls, the tokens, and the failed calls, for the current UTC day.

Where both services describe one fact — the lag, the backlog, the next fire — the runner's answer SHALL be
presented and the registry's SHALL NOT be drawn beside it: two rows stating one pipeline's schedule from two
services sampled moments apart invite a reader to treat the difference as a fact about the pipeline. Where
only one of them has an answer, that answer SHALL be presented whichever service it came from. The choice
SHALL be made **per field**, not per service: the view is sparse exactly when the runner has restarted, and
a rule that dropped the registry's copy whenever a view was read deleted what the registry still knew at the
one moment an operator is looking.

A group the service **omits** SHALL NOT be drawn, and the console SHALL NOT substitute zeros for it. The
service omits a group that does not apply to the pipeline's lane — a SQL enrichment has no queue, no spend
and no failures; only a group-triggered pipeline has group readiness — and an omitted group is a statement
that the question does not arise, which a card of zeros would answer wrongly. A field omitted **inside** a
present group SHALL likewise be left out rather than stated as zero or as an em dash.

`running_now` SHALL be presented in place of the next fire rather than beside it: the service omits the next
fire while a fire is running, and the two never both apply.

Lag SHALL NOT be presented as a measure of whether the pipeline's rows are written. The scan advances when
work is enqueued, not when it is written, so a lag of zero with items still computing is an ordinary state.
Where the service reports a queue, the console SHALL present it in the tab so that the two are read together.

The console SHALL NOT present a health verdict derived from these values, and SHALL NOT present a stall
flag: the service computes one for its own log and deliberately does not serve it, calling it a heuristic.

The view SHALL NOT be polled. It SHALL be read when the tab is opened and again on the tab's existing
re-read control, which SHALL read the pipeline and the runtime view together.

A view that was read but carries nothing drawable SHALL state that the runner holds the pipeline and has
reported nothing about it yet. That is a synced-but-not-yet-fired pipeline, and it is neither a failed read
nor a pipeline that has never run — a tab that fell through every one of those branches rendered an empty
box with no explanation in it.

#### Scenario: A model-calling enrichment presents the runner's groups

- **GIVEN** an `enrich` pipeline whose transform calls a model, which the runner reports with schedule,
  progress, queue, spend and failures
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the schedule, progress, queue and spend-today cards are presented with the values the service
  reported
- **AND** no groups card is presented

#### Scenario: A SQL enrichment presents only the groups the service sent

- **GIVEN** an `enrich` pipeline whose transform is SQL, for which the service omits queue, spend and
  failures
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the schedule and progress cards are presented
- **AND** the progress card states Data up to rather than the lag
- **AND** no queue, spend-today, groups, state or failures card is presented
- **AND** none of them is presented as a zero

#### Scenario: A group pipeline presents its readiness counts

- **GIVEN** a group-triggered enrichment the service reports with group readiness
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the groups card states the pending groups and the ready, waiting-idle and ceiling-blocked split

#### Scenario: A running fire replaces the next fire

- **GIVEN** a pipeline the service reports as running now, with no next fire
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the schedule card states that a fire is running
- **AND** it states no next fire time

#### Scenario: A caught-up scan with queued work does not read as finished

- **GIVEN** a pipeline the service reports with a lag of zero and work still computing
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the progress card states the lag
- **AND** the queue card states the computing items
- **AND** neither is presented as evidence that the pipeline's rows are written

#### Scenario: Fields the runner does not know are left out

- **GIVEN** a runner restarted since the pipeline last fired, so it reports no backlog flag, no caught-up
  time and no last error
- **WHEN** a full admin opens that pipeline's `Runtime` tab
- **THEN** none of the three is presented
- **AND** neither a zero nor an em dash is presented in their place
- **AND** the lag and the consecutive-failure count the service did report are presented

#### Scenario: No stall verdict is presented

- **GIVEN** a pipeline the service's own heartbeat treats as stalled
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab states the values the service reported
- **AND** it states no stalled, unhealthy or degraded verdict

#### Scenario: No runtime view is read for an aggregate pipeline

- **GIVEN** an `aggregate` pipeline
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** no runtime view request is issued
- **AND** the registry's own state is presented instead

#### Scenario: The view is read again with the pipeline

- **GIVEN** a full admin on the `Runtime` tab of an enrichment pipeline
- **WHEN** the user activates the re-read control
- **THEN** the pipeline and the runtime view are both read again
- **AND** an answer from an earlier read that lands later SHALL NOT replace a newer one

#### Scenario: A fact only the registry still knows is presented

- **GIVEN** a runner restarted since the pipeline last fired, so its view carries no lag and no schedule,
  while the registry still records both
- **WHEN** a full admin opens that pipeline's `Runtime` tab
- **THEN** the lag and the schedule the registry recorded are presented
- **AND** neither is presented twice

#### Scenario: A fact both services report is presented once

- **GIVEN** a pipeline for which the runner and the registry both report a lag
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** one lag is presented, the runner's
- **AND** the registry's is not presented beside it

#### Scenario: A runner holding a pipeline it has not fired says so

- **GIVEN** a pipeline whose view carries a state and no other member, and whose registry state is empty
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab states that the runner holds the pipeline and has reported nothing about it yet
- **AND** it does not state that the pipeline has never run, and does not state that the runtime could not
  be read

#### Scenario: The view is not polled

- **GIVEN** a full admin on the `Runtime` tab
- **WHEN** the tab is left open without the re-read control being used
- **THEN** no further runtime view request is issued

### Requirement: Dead-lettered failures are listed in a grid inside the failures card

Activating the card's expand control SHALL open a grid of the failures **inside the same card**, under
the summary, and SHALL change the control to withdraw it again. The expansion SHALL be stated
programmatically, not by the label alone. No overlay SHALL be opened for it: the card is already on the
page the reader asked for, and a sheet over it would hide the pause and the state it has to be read
against.

The grid SHALL carry a filter row of two controls:

- a **path** control choosing live, backfill, or both. It SHALL narrow the request rather than the
  loaded rows, because the service applies it before it pages: filtering locally would narrow one page
  and call the result the path's failures. **Every path** SHALL be the initial choice. The control
  SHALL be named for assistive technology without repeating that name on screen beside its three
  self-describing values.
- a **search** over the failure message and the grain key, applied to the rows loaded so far. Its
  placeholder SHALL name those two fields rather than restating where the reader is: a term that
  matches nothing is usually one typed for a field the search does not read. The field SHALL be open
  rather than behind a toggle, so the term and the control that holds it cannot outlive each other.

When a **run filter** is in force the path control SHALL be replaced by a dismissible indicator naming
that run, and the request SHALL carry the run rather than a path: the service refuses a request that
names both the live path and a run, and a run's items are backfill items by definition.

The grid SHALL present, for each failure: when it failed, as an age with the exact time reachable; the
stage, marked by a colour and named, with an info icon beside the name that carries a plain-language
description of what that stage does, and the same description in full in the row's detail — the icon is a
mouse affordance and the detail is what a keyboard reader reaches; the failure message on one line; and, for a retryable item, a
re-run control. A not-retryable row SHALL offer no control in its place rather than a disabled one.

Rows SHALL be ordered newest first, as the service returns them.

The listing SHALL be **paged**. The grid SHALL ask for one page at a time and append the next when the
reader scrolls to the end of what is loaded, carrying the cursor the previous page answered with. A
page that does not arrive SHALL stop the walk rather than being asked for again on every further
scroll. Changing the path or the run SHALL start a new walk from the newest item, because a cursor
means "older than this item" in whatever set is being read and continuing one across filters would
place the reader in a set they never saw.

Activating a row anywhere but on its **two control cells** SHALL open or close that row's detail. The
chevron and the re-run control are excluded, each because the cell carries its own action: the service
that draws the grid listens for a click on the row itself, below the point where the console's own
handlers run, so a chevron left in both toggles twice and cancels itself out.

#### Scenario: A stage is described

- **GIVEN** a failure at any stage the service reports
- **WHEN** the reader hovers the info icon beside the stage, or opens the row's detail
- **THEN** a description of what that stage does and what a failure there means is presented
- **AND** the description is the same wherever the stage is named

#### Scenario: The failures grid opens inside the card

- **WHEN** a full admin activates the card's expand control
- **THEN** a grid of the failures is presented inside the same card
- **AND** the control states that the card is expanded
- **AND** no overlay or side sheet is opened

#### Scenario: The path filter narrows the request

- **GIVEN** the failures grid, showing every path
- **WHEN** the user chooses the backfill path
- **THEN** the failures are read again for that path
- **AND** the rows presented are the ones the service returned for it

#### Scenario: The card summarizes every path, not just the live one

- **GIVEN** a pipeline whose failures are split between the live path and a backfill run
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the card's total counts both
- **AND** the path control states that every path is selected

#### Scenario: The chevron opens the detail exactly once

- **GIVEN** the failures grid
- **WHEN** the user activates a row's chevron
- **THEN** that row's detail is presented
- **AND** activating the chevron again withdraws it

#### Scenario: A scroll to the end of the listing asks for the next page

- **GIVEN** the failures grid showing a page the service reports more after
- **WHEN** the reader scrolls to the end of what is loaded
- **THEN** the next page is read and appended beneath it
- **AND** a scroll that does not reach the end asks for nothing

#### Scenario: Changing the filter starts a new walk

- **GIVEN** the failures grid with several pages loaded
- **WHEN** the reader chooses a different path
- **THEN** the listing restarts from that path's newest item
- **AND** no cursor from the previous walk is sent

#### Scenario: Narrowing the grid does not move the summary

- **GIVEN** the failures card of a pipeline holding failures on both paths
- **WHEN** the user narrows the grid to one path
- **THEN** the rows listed are that path's
- **AND** the total, the age of the newest failure and the retryable split are unchanged

#### Scenario: The search narrows the loaded rows

- **GIVEN** the failures grid
- **WHEN** the user opens the search and enters a term
- **THEN** only the rows whose message or grain key contains it are presented

#### Scenario: A run filter replaces the path control

- **GIVEN** the failures grid filtered to one backfill run
- **THEN** the path control is replaced by a dismissible indicator naming the run
- **AND** the request carries the run and no path
- **AND** dismissing the indicator restores the path control

#### Scenario: A not-retryable row offers no re-run

- **GIVEN** a failure the console presents as not retryable
- **WHEN** its row is presented
- **THEN** no re-run control is offered on it

### Requirement: Runtime status is stated beside configuration status

The pipeline detail header states two facts that are commonly confused and are not the same axis: whether
the pipeline is **enabled**, which is its declaration, and what the runner is doing with it, which is its
runtime. The header SHALL state both, the runtime status as a chip beside the enabled badge.

Runtime status SHALL be stated **only for an `enrich` pipeline**, which is the kind the runner drives.
An `aggregate` pipeline is run by the registry service itself, on its own scheduler — it is absent from
the runner's listings by construction, and reading that absence as a fault flagged every healthy rollup
as one nothing was running. For an aggregate pipeline the console SHALL state no runtime status, raise
no warning about one, and offer no pause: the runner would accept a pause for it and answer success,
but only the runner's own executors consult that registry, so nothing would stop.

On the **detail page** the runtime status SHALL be taken from the pipeline's own runtime view, which states
it directly. The service resolves it by the same rules its own status log uses, so the console SHALL state
what it reports rather than deriving a second verdict that could disagree. Six states are stateable, and no
other:

| State | Condition |
| --- | --- |
| `running` | the view reports it active |
| `paused` | the view reports it paused |
| `held` | the view reports it held, waiting on the registry across a contract change |
| `over budget` | the view reports it over its daily spend budget |
| `backpressured` | the view reports it holding back because its queue is full |
| `not running` | the service answers that it does not hold the pipeline |

A state this console does not recognise SHALL be stated as `running` rather than withheld. The service's
vocabulary grew from two states to five in one release, and a console that blanked the chip on the next
addition would be withholding what it does know — that the runner holds the pipeline and answered for it —
on the strength of one word it has not learned yet.

The three gate states SHALL be stated as the service names them and SHALL NOT be collapsed into `running`
or into `paused`. Each is a pipeline that is enabled, taken on, and not consuming input, and each clears for
a different reason: a held pipeline waits on the registry, an over-budget one on the next UTC day, a
backpressured one on its own queue draining. A console that showed all three as running would be stating the
opposite of what the operator needs to act on.

A pause SHALL still be offered for a gated pipeline and SHALL NOT be offered for one the service does not
hold: a gate is temporary and the operator may still want the pipeline stopped, where a pipeline the runner
does not hold has no work to withhold.

On the **listing**, which asks about every pipeline at once, the runtime status SHALL continue to be derived
from the two listings the runner serves for exactly that purpose — the pipelines it has taken on and the
pipelines it has paused — and SHALL state the three states those two support: `running`, `paused` and
`not running`. The gate states are per-pipeline facts the listings do not carry, and one view request per
row is not a trade the listing makes.

`running` SHALL mean that the runner has the pipeline and schedules its fires — **not** that rows are
moving through it at this moment. Neither service reports that, and the console SHALL NOT imply it.

The state the registry cannot show is an enabled pipeline the runner has not taken on: it is presented by
the registry exactly like a healthy one, while nothing is driving it — the runner either refused the
declaration as one it cannot execute, or has not synced since it started. The console SHALL state it as a
**warning inside the `Runtime` tab**, in the warning treatment rather than the error one, and SHALL say
both possible causes, since it cannot tell them apart from outside. It SHALL NOT sit above the tab strip:
right after a pipeline is enabled or saved the runner has ordinarily not picked it up yet, so a page-level
alert raised a fault on every enable. The chip beside the name SHALL still state that the pipeline is not
running, and the copy SHALL say that a minute's delay after enabling is normal and that its persisting
means the service cannot execute the declaration. It SHALL NOT offer to pause such a pipeline: there is no work to withhold.

On the listing the two reads SHALL fail **independently**. The pauses are load-bearing: without them the
console states no runtime at all. The cache listing only adds `not running`, so where it is missing — an
older runner build, a route that answers 404 — the console SHALL keep stating `running` and SHALL keep
offering the pause, rather than withholding every runtime affordance because one of two reads failed.
It SHALL NOT state `not running` on an unread cache: that would withhold the pause on a guess.

The runtime chip SHALL be withheld — not rendered as unknown — when the pipeline is disabled, when the
runtime could not be read, or when the caller is not a full admin. A disabled pipeline has no runtime answer: the runner
is not driving it at all, and stating it as "not running" would read as a fault where there is a
configuration.

A paused pipeline SHALL still be stated as **enabled**. Pausing leaves the declaration untouched, and a
console that showed a paused pipeline as disabled would send an operator to re-enable something that was
never disabled.

#### Scenario: A running pipeline states both facts

- **GIVEN** an enabled pipeline whose runtime view reports it active
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is enabled and that it is running

#### Scenario: A paused pipeline is still enabled

- **GIVEN** an enabled pipeline whose runtime view reports it paused
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is enabled
- **AND** it states that it is paused

#### Scenario: A gated pipeline states the gate rather than running

- **GIVEN** an enabled pipeline whose runtime view reports it over its daily spend budget
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is over budget
- **AND** it does not state that it is running
- **AND** the pause control is still offered

#### Scenario: A state the console does not recognise is stated as running

- **GIVEN** an enabled pipeline whose runtime view reports a state this console does not know
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is running
- **AND** the pause control is offered

#### Scenario: A backpressured pipeline is distinguished from a paused one

- **GIVEN** an enabled pipeline whose runtime view reports it backpressured
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is backpressured
- **AND** no pause banner is presented

#### Scenario: The listing states the three it can derive

- **GIVEN** the runner reports one pipeline paused and holds a second but not a third
- **WHEN** a full admin opens the pipelines listing
- **THEN** the first is stated as paused, the second as running and the third as not running
- **AND** no runtime view request is issued for any row

#### Scenario: An aggregate pipeline states no runtime status

- **GIVEN** an enabled `aggregate` pipeline, which the registry service runs on its own scheduler
- **WHEN** a full admin opens its detail view
- **THEN** no runtime chip is presented
- **AND** no warning states that nothing is running it
- **AND** no pause control is offered

#### Scenario: An enabled enrichment pipeline the runner has not taken on is flagged

- **GIVEN** an enabled `enrich` pipeline the runtime service answers as one it does not hold
- **WHEN** a full admin opens its detail view
- **THEN** a warning on the `Runtime` tab states that nothing is running the pipeline
- **AND** nothing above the tab strip states it
- **AND** it states that the service either cannot execute the declaration or has not picked it up yet
- **AND** no pause control is offered

#### Scenario: A disabled pipeline states no runtime status

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is disabled
- **AND** no runtime chip is presented

#### Scenario: An unread runtime states no runtime status

- **GIVEN** the runtime service did not answer
- **WHEN** a full admin opens an enabled pipeline's detail view
- **THEN** the header states that it is enabled
- **AND** no runtime chip is presented

### Requirement: A runtime view the runner cannot yet answer is distinguished from a pipeline it does not hold

Before any answer has arrived the console SHALL state **nothing** about the runtime: no chip, no empty
state and no notice. A verdict published before the service has answered is wrong however it is worded, and
every statement below is a verdict.

The runtime service answers a view request in three ways the console SHALL tell apart, because each calls
for a different statement and the operator's next move differs:

- it **does not hold the pipeline** — a pipeline absent from a synced cache. This is the state the console
  already states as nothing running the pipeline: the runner either refused the declaration as one it cannot
  execute or has not picked it up since it started. The console SHALL state it as that same warning and
  SHALL NOT state it as a failed read.
- it **has not synced yet** — the runner started and has not loaded the pipeline list. It resolves by itself
  shortly, so the console SHALL state that the runtime is not read yet and that the read can be retried, and
  SHALL NOT raise it as an error or present the pipeline as one nothing is running.
- it **refused or did not answer** — any other failure. The console SHALL state that the runtime could not be
  read, by the service's own message where it carries one, and SHALL state that the pipeline's configuration
  is unaffected.

None of the three SHALL withhold the pipeline, its facts or its form: the registry read stands on its own.

Each of the three SHALL be stated **once**. A console that reported a cold runner, or a pipeline the runner
does not hold, as a failed read as well put two notices on one tab contradicting each other.

A refused read SHALL carry the service's message **and** the statement that the pipeline's configuration is
unaffected. The second is what the reader acts on, and the service's message is never empty, so presenting
one in place of the other made the second unreachable.

Only a pipeline the runner does not hold SHALL withhold the pause and resume controls, and only until the
first answer arrives SHALL they be withheld for not knowing. A read that was refused SHALL keep offering
them: the moment an operator most wants to stop a pipeline is the moment its runtime read is failing, and
there is no work to withhold only where the runner holds nothing.

#### Scenario: A pipeline the runner does not hold is stated as one nothing is running

- **GIVEN** an enabled `enrich` pipeline the runtime service answers as not found
- **WHEN** a full admin opens its detail view
- **THEN** a warning on the `Runtime` tab states that nothing is running the pipeline
- **AND** nothing above the tab strip states it
- **AND** it states that the service either cannot execute the declaration or has not picked it up yet
- **AND** no pause control is offered
- **AND** no error notification is raised

#### Scenario: A runner that has not synced is stated as not read yet

- **GIVEN** the runtime service answers that it has not loaded the pipeline list yet
- **WHEN** a full admin opens an enabled `enrich` pipeline's `Runtime` tab
- **THEN** the tab states that the runtime is not read yet and can be read again shortly
- **AND** it does not state that nothing is running the pipeline
- **AND** no runtime chip is presented

#### Scenario: A refused read states the service's own message

- **GIVEN** the runtime service refuses the view with a message
- **WHEN** a full admin opens an enabled `enrich` pipeline's `Runtime` tab
- **THEN** the tab states that the runtime could not be read, carrying that message
- **AND** it states that the pipeline's configuration is unaffected
- **AND** the pipeline, its facts and its form are presented
- **AND** the pause control is still offered

#### Scenario: Nothing is stated while the read is in flight

- **GIVEN** a full admin opening an enabled `enrich` pipeline whose runtime read has not yet answered
- **WHEN** the `Runtime` tab is presented
- **THEN** no runtime chip is presented
- **AND** the tab states neither that the pipeline has never run nor that its runtime could not be read
- **AND** no pause control is offered

#### Scenario: A cold runner is stated once

- **GIVEN** a runner that has not loaded its pipeline list, and a pipeline for which the registry records
  no state
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab states that the runtime is not read yet
- **AND** it does not also state that the runtime could not be read


## ADDED Requirements

### Requirement: A service message wraps instead of being cut off

A message the services return — an I/O error naming a host and a route, a run's last error, a refused read —
is a long unbroken string by nature. Wherever the Runtime tab or the alerts above the tab strip present
one, it SHALL wrap onto further lines so that the whole of it is readable, and SHALL NOT be cut off at the
edge of its container, ellipsised, or left to scroll sideways.

#### Scenario: A long error is read in full

- **GIVEN** a pipeline whose last error is a single long string with no spaces, such as a request URL
  followed by a connection failure
- **WHEN** a full admin opens the pipeline
- **THEN** the whole message is visible, wrapped across lines
- **AND** the page does not scroll sideways

#### Scenario: A refused runtime read wraps the service's message

- **GIVEN** a runtime read refused with a long message
- **WHEN** a full admin opens the `Runtime` tab
- **THEN** the whole message is visible, wrapped across lines
